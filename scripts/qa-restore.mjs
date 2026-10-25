import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash, randomBytes} from 'node:crypto';
import {execFileSync} from 'node:child_process';

// Restores into schemas created by this invocation ONLY. No migrate:fresh,
// learner-table writes, volume deletion, or credentials in command arguments.
const docker = (args, options={}) => execFileSync('docker', args, {encoding:'utf8', maxBuffer:64*1024*1024, ...options});
const env = fs.readFileSync('.env','utf8');
const value = key => env.match(new RegExp(`^${key}=(.*)$`,'m'))?.[1].trim().replace(/^['"]|['"]$/g,'');
const username = value('DB_USERNAME'), password=value('DB_PASSWORD');
assert(/^[a-zA-Z0-9_]+$/.test(username) && password, 'Local credentials required');
const root = (input, database) => docker(['compose','exec','-T','db','sh','-c','MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql -uroot --batch --raw "$1"','qa',database ?? ''],{input});
const source = value('DB_DATABASE');
assert(/^\w+$/.test(source));
const stamp=randomBytes(8).toString('hex');
fs.mkdirSync('.tools/v6',{recursive:true});
const dumpPath=`.tools/v6/restore-${stamp}.sql`;
fs.writeFileSync(dumpPath,docker(['compose','exec','-T','db','sh','-c','MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysqldump -uroot --single-transaction --no-tablespaces "$MYSQL_DATABASE"']));
const durable = database => root('SHOW TABLES;',database).trim().split(/\r?\n/).slice(1).filter(t=>!['cache','cache_locks','sessions','jobs','job_batches','failed_jobs','migrations'].includes(t));
function snapshots(database, template) {
    const result={};
    for(const table of template ? Object.keys(template) : durable(database)) {
        assert(/^\w+$/.test(table));
        const columns=template?.[table].columns ?? root(`SHOW COLUMNS FROM \`${table}\`;`,database).trim().split(/\r?\n/).slice(1).map(row=>row.split('\t')[0]);
        const order=template?.[table].order ?? root(`SHOW KEYS FROM \`${table}\` WHERE Key_name='PRIMARY';`,database).trim().split(/\r?\n/).slice(1).map(row=>row.split('\t')[4]);
        assert(columns.every(c=>/^\w+$/.test(c)) && order.every(c=>/^\w+$/.test(c)));
        const sql=`SELECT ${columns.map(c=>`\`${c}\``).join(',')} FROM \`${table}\`${order.length?' ORDER BY '+order.map(c=>`\`${c}\``).join(','):''};`;
        result[table]={columns,order,hash:createHash('sha256').update(root(sql,database)).digest('hex')};
    }
    return result;
}
const before=snapshots(source);
const report={checked_at:new Date().toISOString(),source_modified:false,private_dump:true,restores:[]};
for(const [label,path] of [['current',dumpPath],['pre_v5','.tools/core-before-v5.sql']]) {
    if(!fs.existsSync(path)) {report.restores.push({label,status:'BLOCKED',reason:'Private pre-V5 snapshot unavailable'});continue;}
    const database=`vulnlab_qa_${stamp}_${label}`;
    assert(/^vulnlab_qa_[a-f0-9]{16}_(current|pre_v5)$/.test(database));
    assert.notEqual(database,source);
    let created=false;
    try {
        root(`CREATE DATABASE \`${database}\`; GRANT ALL PRIVILEGES ON \`${database}\`.* TO '${username}'@'%';`);
        created=true;
        root(fs.readFileSync(path,'utf8'),database);
        const restored=snapshots(database);
        if(label==='current') assert.deepEqual(restored,before,'Restored durable data differs');
        const args=['run','--rm','-i','--network','vulnlab_core','-e','APP_ENV=testing','-e','APP_DEBUG=false','-e','APP_KEY=base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=','-e','DB_CONNECTION=mysql','-e','DB_HOST=db','-e','DB_USERNAME','-e','DB_PASSWORD','-e',`DB_DATABASE=${database}`,'-e','SESSION_DRIVER=array','-e','CACHE_STORE=array','--read-only','--tmpfs','/tmp:uid=10001,gid=10001,mode=1770','--tmpfs','/var/www/html/bootstrap/cache:uid=10001,gid=10001,mode=0770','--tmpfs','/var/www/html/storage:uid=10001,gid=10001,mode=0770','vulnlab-testing','sh','-c','mkdir -p storage/framework/cache/data storage/framework/views storage/framework/sessions storage/logs && php'];
        const input=fs.readFileSync('tests/restore-fixture.php','utf8');
        const output=docker(args,{input,env:{...process.env,DB_USERNAME:username,DB_PASSWORD:password}});
        if(!output.includes('note persistence passed')) fs.writeFileSync('.tools/v6/restore-error.txt',output);
        assert(output.includes('note persistence passed'));
        assert.deepEqual(snapshots(database,restored),restored,'Migration changed preexisting columns/records');
        report.restores.push({label,status:'PASS',durable_tables:Object.keys(restored).length,verified:['SQL restore','original-column hashes','additive migrations','readiness','authentication','90-day roadmap','catalog reads','note persistence with rollback']});
    } finally {
        if(created) root(`REVOKE ALL PRIVILEGES ON \`${database}\`.* FROM '${username}'@'%'; DROP DATABASE \`${database}\`;`);
    }
}
assert.deepEqual(snapshots(source,before),before,'Source durable tables changed');
fs.writeFileSync('docs/qa/restore-results.json',JSON.stringify(report,null,2)+'\n');
console.log(`Restore rehearsal complete; ${report.restores.map(r=>`${r.label}: ${r.status}`).join(', ')}. Source durable hashes unchanged. Dumps remain private.`);

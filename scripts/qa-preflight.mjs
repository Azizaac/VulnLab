import assert from 'node:assert/strict';
import fs from 'node:fs';
import {randomBytes} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const docker=(args,options={})=>execFileSync('docker',args,{encoding:'utf8',timeout:60000,...options});
const app=JSON.parse(docker(['inspect','vulnlab-app-1']))[0];
const env=Object.fromEntries(app.Config.Env.map(row=>{const i=row.indexOf('=');return [row.slice(0,i),row.slice(i+1)];}));
const checks={debug_disabled:env.APP_DEBUG==='false',app_key_present:!!env.APP_KEY,local_environment:env.APP_ENV==='local',session_encrypted:env.SESSION_ENCRYPT==='true',http_only:env.SESSION_HTTP_ONLY==='true',learner_db_not_published:Object.values(JSON.parse(docker(['inspect','vulnlab-db-1']))[0].NetworkSettings.Ports).every(p=>p===null)};
assert(Object.values(checks).every(Boolean));
const name=`vulnlab-qa-outage-${randomBytes(6).toString('hex')}`;
let response;
try {
    docker(['run','-d','--name',name,'--network','bridge','-p','127.0.0.1::8080','-e','APP_ENV=testing','-e','APP_DEBUG=false','-e','APP_KEY=base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=','-e','DB_CONNECTION=mysql','-e','DB_HOST=127.0.0.1','-e','DB_PORT=9','-e','DB_DATABASE=unavailable_fixture','-e','DB_USERNAME=fixture','-e','DB_PASSWORD=not-a-real-credential','-e','SESSION_DRIVER=database','-e','CACHE_STORE=database','--read-only','--cap-drop=ALL','--memory','256m','--cpus','0.5','--pids-limit','64','--tmpfs','/tmp:uid=10001,gid=10001,mode=1770','--tmpfs','/var/www/html/storage:uid=10001,gid=10001,mode=0770','--tmpfs','/var/www/html/bootstrap/cache:uid=10001,gid=10001,mode=0770','vulnlab-testing','sh','-c','mkdir -p storage/framework/cache/data storage/framework/views storage/framework/sessions storage/logs && php artisan serve --host=0.0.0.0 --port=8080 --no-reload']);
    const port=JSON.parse(docker(['inspect',name]))[0].NetworkSettings.Ports['8080/tcp'][0].HostPort;
    const base=`http://127.0.0.1:${port}`;
    for(let i=0;i<30;i++) {
        try{response=await fetch(base+'/up',{signal:AbortSignal.timeout(2000)});if(response.status===200)break;}catch{}
        await new Promise(resolve=>setTimeout(resolve,300));
    }
    assert.equal(response?.status,200);
    const ready=await fetch(base+'/ready',{signal:AbortSignal.timeout(5000)});
    assert.equal(ready.status,503);
    assert.deepEqual(await ready.json(),{ready:false,database:false,storage:true});
    const logs=docker(['logs',name]);
    assert(!/not-a-real-credential|SQLSTATE|Authorization:|APP_KEY=/.test(logs));
    fs.writeFileSync('docs/qa/preflight-results.json',JSON.stringify({checked_at:new Date().toISOString(),checks,real_http_outage:{liveness:200,readiness:503,session_driver:'database',cache_store:'database',sanitized:true},public_tls:false,production_approved:false,future_requirements:['TLS and secure cookies','production environment and secret rotation','off-host backups and monitored restore','separate training host review','scheduled export/session cleanup','independent security/content review']},null,2)+'\n');
    console.log('Local config preflight and real HTTP DB outage passed; /up=200, /ready=503, no exception detail. No production deployment performed.');
} finally {docker(['rm','-f',name],{stdio:'ignore'});}

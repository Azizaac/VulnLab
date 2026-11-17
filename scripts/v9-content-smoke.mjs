import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';

// Restore and mutate only a schema created by this invocation. No learner role grants.
const database = `vulnlab_v9_${randomBytes(8).toString('hex')}`;
const env = fs.readFileSync('.env', 'utf8');
const value = key => env.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1].trim().replace(/^['"]|['"]$/g, '');
const username = value('DB_USERNAME'), password = value('DB_PASSWORD');
assert(/^\w+$/.test(username) && password);
const docker = (args, options = {}) => execFileSync('docker', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...options });
const sql = (input, schema = '') => docker(['compose', 'exec', '-T', 'db', 'sh', '-c', 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql -uroot --batch --raw "$1"', 'v9', schema], { input });
const dump = (schema, dataOnly = false) => docker(['compose', 'exec', '-T', 'db', 'sh', '-c', 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysqldump -uroot --single-transaction --no-tablespaces --set-gtid-purged=OFF --skip-comments --order-by-primary "$1" "$2"', 'v9', schema, dataOnly ? '--no-create-info' : '--no-tablespaces']);
const hash = text => createHash('sha256').update(text).digest('hex');
const snapshot = schema => ({
    data: hash(dump(schema, true)),
    columns: hash(sql('SELECT TABLE_NAME, ORDINAL_POSITION, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, CHARACTER_SET_NAME, COLLATION_NAME, EXTRA FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME, ORDINAL_POSITION;', schema)),
    constraints: hash(sql('SELECT TABLE_NAME, CONSTRAINT_NAME, CONSTRAINT_TYPE FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME, CONSTRAINT_NAME;', schema)),
    keys: hash(sql('SELECT TABLE_NAME, CONSTRAINT_NAME, COLUMN_NAME, ORDINAL_POSITION, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME, CONSTRAINT_NAME, ORDINAL_POSITION;', schema)),
});
const source = value('DB_DATABASE');
assert(/^\w+$/.test(source) && source !== database);
const before = dump(source);
const sourceBefore = snapshot(source);
fs.mkdirSync('.tools/v9-resume', { recursive: true });
fs.writeFileSync('.tools/v9-resume/content-before.sql', before);
const run = args => docker([
    'run', '--rm', '--network', 'vulnlab_core', '--read-only',
    '-v', `${path.resolve('.')}:/var/www/html:ro`,
    '--tmpfs', '/tmp:uid=10001,gid=10001,mode=1770',
    '--tmpfs', '/var/www/html/bootstrap/cache:uid=10001,gid=10001,mode=0770',
    '--tmpfs', '/var/www/html/storage:uid=10001,gid=10001,mode=0770',
    '-e', 'APP_ENV=testing', '-e', 'APP_DEBUG=false', '-e', 'APP_KEY=base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    '-e', 'DB_CONNECTION=mysql', '-e', 'DB_HOST=db', '-e', 'DB_USERNAME', '-e', 'DB_PASSWORD', '-e', `DB_DATABASE=${database}`,
    '-e', 'CACHE_STORE=array', '-e', 'SESSION_DRIVER=array', 'vulnlab-app',
    'sh', '-c', 'mkdir -p storage/framework/cache/data storage/framework/views storage/framework/sessions storage/logs && exec "$@"', 'v9', ...args,
], { env: { ...process.env, DB_USERNAME: username, DB_PASSWORD: password } });
let created = false;
try {
    sql(`CREATE DATABASE \`${database}\`; GRANT ALL PRIVILEGES ON \`${database}\`.* TO '${username}'@'%';`);
    created = true;
    sql(before, database);
    // MySQL may spell implicit CHARACTER SET clauses differently after restore;
    // compare actual column/constraint metadata and every data row, not DDL text.
    assert.deepEqual(snapshot(database), sourceBefore, 'Restored data or schema metadata differs before migration');
    console.log(run(['php', 'artisan', 'migrate', '--force']));
    const proof = run(['php', '-r', `
        require 'vendor/autoload.php';
        $app = require 'bootstrap/app.php';
        $app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap();
        if (!preg_match('/^vulnlab_v9_[a-f0-9]{16}$/', config('database.connections.mysql.database'))) throw new RuntimeException('Disposable schema required');
        $editor = App\\Models\\User::factory()->create(['role' => 'editor']);
        $tables = ['users','lessons','lesson_sources','quiz_questions','quiz_choices','lesson_progress','quiz_attempts','xp_transactions','lab_progress','lab_sessions','notes','vulnerability_reports','roadmap_plans','roadmap_lesson_links'];
        $fingerprint = function () use ($tables) { $out=[]; foreach ($tables as $t) { $rows=Illuminate\\Support\\Facades\\DB::table($t)->get()->map(fn($r)=>(array)$r)->all(); usort($rows,fn($a,$b)=>strcmp(json_encode($a),json_encode($b))); $out[$t]=hash('sha256',json_encode($rows)); } return $out; };
        $before = $fingerprint();
        $importer = app(App\\Services\\V9ContentImporter::class);
        $first = $importer->import($editor);
        $second = $importer->import($editor);
        if ($first !== ['baseline'=>['created'=>25,'unchanged'=>0],'expansion'=>['created'=>20,'unchanged'=>0]]) throw new RuntimeException('Unexpected first import counts');
        if ($second !== ['baseline'=>['created'=>0,'unchanged'=>25],'expansion'=>['created'=>0,'unchanged'=>20]]) throw new RuntimeException('Import not idempotent');
        if ($before !== $fingerprint()) throw new RuntimeException('Original learner or curriculum rows changed');
        echo json_encode(['first'=>$first,'second'=>$second,'preserved_tables'=>array_keys($before),'independent_review_count'=>Illuminate\\Support\\Facades\\DB::table('editorial_reviews')->count(),'draft_count'=>App\\Models\\ContentRevision::where('status','draft')->count()],JSON_THROW_ON_ERROR);
    `]);
    const report = { checked_at: new Date().toISOString(), status: 'PASS', scope: 'disposable MySQL restored from local snapshot', restore_exact: true, ...JSON.parse(proof) };
    assert.deepEqual(snapshot(source), sourceBefore, 'Source database changed during disposable rehearsal');
    report.source_unchanged = true;
    report.source_snapshot_sha256 = createHash('sha256').update(before).digest('hex');
    fs.mkdirSync('docs/v9/implementation', { recursive: true });
    fs.writeFileSync('docs/v9/implementation/content-smoke-results.json', JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
} finally {
    if (created) sql(`REVOKE ALL PRIVILEGES ON \`${database}\`.* FROM '${username}'@'%'; DROP DATABASE \`${database}\`;`);
}

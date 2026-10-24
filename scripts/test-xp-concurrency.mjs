import assert from 'node:assert/strict';
import fs from 'node:fs';
import { randomBytes } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';

// Requires the local MySQL service and the testing image built by npm run test:mysql.
// Only the randomly named test schema below is migrated and removed.
const database = `vulnlab_concurrency_${randomBytes(8).toString('hex')}`;
const env = fs.readFileSync('.env', 'utf8');
const username = env.match(/^DB_USERNAME=(.*)$/m)?.[1].trim().replace(/^['"]|['"]$/g, '');
const password = env.match(/^DB_PASSWORD=(.*)$/m)?.[1].trim().replace(/^['"]|['"]$/g, '');
if (!username || !/^[a-zA-Z0-9_]+$/.test(username) || !password) throw new Error('Local database credentials are required.');
execFileSync('docker', ['image', 'inspect', 'vulnlab-testing'], { stdio: 'ignore' });
const sql = input => execFileSync('docker', ['compose', 'exec', '-T', 'db', 'sh', '-c', 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql -uroot'], { input, stdio: ['pipe', 'inherit', 'inherit'] });
const args = ['run', '--rm', '-i', '--network', 'vulnlab_core', '-e', 'APP_ENV=testing', '-e', 'APP_KEY=base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', '-e', 'DB_CONNECTION=mysql', '-e', 'DB_HOST=db', '-e', 'DB_USERNAME', '-e', 'DB_PASSWORD', '-e', `DB_DATABASE=${database}`, '-e', 'CACHE_STORE=array', '-e', 'SESSION_DRIVER=array', '--read-only', '--tmpfs', '/tmp:uid=10001,gid=10001,mode=1770', '--tmpfs', '/var/www/html/bootstrap/cache:uid=10001,gid=10001,mode=0770', '--tmpfs', '/var/www/html/storage:uid=10001,gid=10001,mode=0770', 'vulnlab-testing', 'php'];
const childEnv = { ...process.env, DB_USERNAME: username, DB_PASSWORD: password };
const bootstrap = `<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap();
`;
function php(code) {
    return new Promise((resolve, reject) => {
        const child = spawn('docker', args, { env: childEnv, stdio: ['pipe', 'pipe', 'pipe'] });
        let output = '', errors = '';
        child.stdout.on('data', chunk => { output += chunk; });
        child.stderr.on('data', chunk => { errors += chunk; });
        child.on('error', reject);
        child.on('close', code => code === 0 ? resolve(output.trim()) : reject(new Error(`Concurrency fixture failed (${code}): ${errors || output}`)));
        child.stdin.end(bootstrap + code);
    });
}
let created = false;
try {
    sql(`CREATE DATABASE \`${database}\`; GRANT ALL PRIVILEGES ON \`${database}\`.* TO '${username}'@'%';`);
    created = true;
    await php(`Illuminate\\Support\\Facades\\Artisan::call('migrate', ['--force' => true]);
Illuminate\\Support\\Facades\\Artisan::call('db:seed', ['--force' => true]);
$user = App\\Models\\User::factory()->create();
$lesson = App\\Models\\Lesson::firstOrFail();
App\\Models\\QuizAttempt::create(['user_id'=>$user->id,'lesson_id'=>$lesson->id,'submission_id'=>(string)Illuminate\\Support\\Str::uuid(),'score'=>100,'passed'=>true,'feedback'=>[],'created_at'=>now()]);
App\\Models\\LessonProgress::create(['user_id'=>$user->id,'lesson_id'=>$lesson->id,'read_at'=>now(),'quiz_passed_at'=>now(),'completed_at'=>now()]);
echo 'fixture ready';`);
    const deadline = (Date.now() + 5000) / 1000;
    const worker = `usleep((int) max(0, (${deadline} - microtime(true)) * 1000000));
$user=App\\Models\\User::firstOrFail(); $lesson=App\\Models\\Lesson::firstOrFail(); $delta=0;
foreach (range(1,3) as $iteration) {
foreach (['quiz_passed','lesson_completed'] as $type) $delta += app(App\\Services\\LearningEventService::class)->record($user,$type,'lesson',$lesson->id)['xp_delta'];
}
echo json_encode(['delta'=>$delta]);`;
    const results = await Promise.all([php(worker), php(worker)]);
    assert.equal(results.reduce((sum, output) => sum + JSON.parse(output).delta, 0), 30);
    const state = JSON.parse(await php(`echo json_encode([
'xp'=>(int)Illuminate\\Support\\Facades\\DB::table('xp_transactions')->sum('amount'),
'rewards'=>Illuminate\\Support\\Facades\\DB::table('xp_transactions')->count(),
'events'=>Illuminate\\Support\\Facades\\DB::table('learning_activity_events')->count(),
'badges'=>Illuminate\\Support\\Facades\\DB::table('user_achievements')->count(),
]);`));
    assert.deepEqual(state, { xp: 30, rewards: 2, events: 2, badges: 2 });
    console.log('Two simultaneous PHP processes, 12 completion deliveries: exactly 30 XP, 2 rewards, 2 events and 2 achievements. MySQL concurrency passed.');
} finally {
    if (created) sql(`REVOKE ALL PRIVILEGES ON \`${database}\`.* FROM '${username}'@'%'; DROP DATABASE \`${database}\`;`);
}

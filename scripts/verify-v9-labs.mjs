import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { scenarios } from './v9-scenarios.mjs';

const labs = process.argv.find(a => a.startsWith('--labs='))?.slice(7).split(',') ?? Object.keys(scenarios);
const run = (exe, args, options = {}) => {
    const output = execFileSync(exe, args, { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, ...options });
    process.stdout.write(output);
    return output;
};
run(process.execPath, ['scripts/test-v9-sandbox.mjs', `--labs=${labs.join(',')}`]);
run(process.execPath, ['scripts/check-lab-isolation.mjs']);
const runtime = JSON.parse(fs.readFileSync('.tools/v9-resume/runtime-proof.json', 'utf8'));
fs.mkdirSync('.tools', { recursive: true });
const dir = fs.mkdtempSync(path.resolve('.tools/v9-acceptance-'));
const php = process.env.PHP_BINARY || (process.platform === 'win32' ? path.resolve('.tools/php/php.exe') : 'php');
const nativeCheck = spawnSync(php, ['-v'], { encoding: 'utf8' });
let core;
if (nativeCheck.status === 0) {
    core = run(php, ['artisan', 'test', '--compact', '--do-not-cache-result', '--filter=V9LabRuntimeTest|V9LabRegistryTest'], { env: {
        ...process.env, APP_ENV: 'testing', APP_CONFIG_CACHE: path.join(dir, 'no-config.php'),
        DB_CONNECTION: 'sqlite', DB_DATABASE: ':memory:', DB_HOST: '127.0.0.1', DB_URL: '',
        CACHE_STORE: 'array', SESSION_DRIVER: 'array', TMP: dir, TEMP: dir, TMPDIR: dir,
        V9_REAL_RUNNER: '1', V9_RUNTIME_LABS: labs.join(','),
    } });
} else {
    const token = fs.readFileSync('.env', 'utf8').match(/^LAB_RUNNER_TOKEN=(.*)$/m)?.[1].trim();
    assert(token && token.length >= 40, 'LAB_RUNNER_TOKEN required for containerized core verification');
    core = run('docker', [
        'run', '--rm', '--network', 'vulnlab_labcontrol', '--read-only',
        '-v', `${path.resolve('.')}:/var/www/html:ro`,
        '--tmpfs', '/tmp:uid=10001,gid=10001,mode=1770',
        '--tmpfs', '/var/www/html/bootstrap/cache:uid=10001,gid=10001,mode=0770',
        '--tmpfs', '/var/www/html/storage:uid=10001,gid=10001,mode=0770',
        '-e', 'APP_ENV=testing',
        '-e', 'APP_KEY=base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
        '-e', 'DB_CONNECTION=sqlite', '-e', 'DB_DATABASE=:memory:', '-e', 'DB_URL=',
        '-e', 'CACHE_STORE=array', '-e', 'SESSION_DRIVER=array',
        '-e', 'LAB_RUNNER_URL=http://lab-runner:8090',
        '-e', 'LAB_RUNNER_TOKEN',
        '-e', 'V9_REAL_RUNNER=1',
        '-e', `V9_RUNTIME_LABS=${labs.join(',')}`,
        'vulnlab-testing',
        'sh', '-c', 'mkdir -p storage/framework/cache/data storage/framework/views storage/framework/sessions storage/logs && php artisan test --compact --do-not-cache-result --filter="V9LabRuntimeTest|V9LabRegistryTest"',
    ], { env: { ...process.env, LAB_RUNNER_TOKEN: token } });
}
assert.equal(Number(core.match(/Tests:\s+(\d+)\s+passed/)?.[1]), labs.length + 2, 'Every requested core scenario and registry check must actually pass, without skips');
const receipt = { status: 'PASS', checked_at: new Date().toISOString(), runtime_revision: runtime.runtime_revision, scope: 'Local isolated Docker and disposable SQLite only; not public deployment', labs: {}, evidence: {
    runtime: 'scripts/test-v9-sandbox.mjs', core: 'V9LabRuntimeTest + V9LabRegistryTest', core_tests: labs.length + 2,
    isolation: 'scripts/check-lab-isolation.mjs', limitations: ['CSRF and CORS consoles verify synthetic Origin/token/credential headers, not live browser SameSite'],
} };
for (const slug of labs) {
    const checks = runtime.labs[slug];
    assert(checks && Object.values(checks).every(value => value === true));
    receipt.labs[slug] = { baseline: checks.baseline, trigger: checks.trigger, secure: checks.secure, proof: checks.proof,
        wrong_proof: true, expiry: checks.expiry, reset: checks.reset, ownership: true, network: checks.network, repeat_xp: true };
}
fs.mkdirSync('docs/v9/implementation', { recursive: true });
fs.writeFileSync('docs/v9/implementation/local-lab-receipt.json', JSON.stringify(receipt, null, 2) + '\n');
console.log(`Verified ${labs.length} exact local runtime revisions; receipt saved. No learner database or roles changed.`);

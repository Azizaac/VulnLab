import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';

// Create and remove only this run's disposable schema; never migrate the learner DB.
const database = `vulnlab_test_${randomBytes(8).toString('hex')}`;
const env = fs.readFileSync('.env', 'utf8');
const username = env.match(/^DB_USERNAME=(.*)$/m)?.[1].trim().replace(/^['"]|['"]$/g, '');
const password = env.match(/^DB_PASSWORD=(.*)$/m)?.[1].trim().replace(/^['"]|['"]$/g, '');
if (!username || !/^[a-zA-Z0-9_]+$/.test(username)) throw new Error('Use an alphanumeric DB_USERNAME for the local test helper.');
const docker = (args, options = {}) => execFileSync('docker', args, { stdio: 'inherit', ...options });
const sql = input => docker(['compose', 'exec', '-T', 'db', 'sh', '-c', 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql -uroot'], { input, stdio: ['pipe', 'inherit', 'inherit'] });
docker(['build', '--target', 'testing', '-t', 'vulnlab-testing', '.']);
try {
    sql(`CREATE DATABASE \`${database}\`; GRANT ALL PRIVILEGES ON \`${database}\`.* TO '${username}'@'%';`);
    docker(['run', '--rm', '--network', 'vulnlab_core', '-e', 'APP_ENV=testing', '-e', 'APP_KEY=base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', '-e', 'DB_CONNECTION=mysql', '-e', 'DB_HOST=db', '-e', 'DB_USERNAME', '-e', 'DB_PASSWORD', '-e', `DB_DATABASE=${database}`, '--read-only', '--tmpfs', '/tmp:uid=10001,gid=10001,mode=1770', '--tmpfs', '/var/www/html/bootstrap/cache:uid=10001,gid=10001,mode=0770', '--tmpfs', '/var/www/html/storage:uid=10001,gid=10001,mode=0770', 'vulnlab-testing', 'sh', '-c', 'mkdir -p storage/framework/cache/data storage/framework/views storage/framework/sessions storage/logs && php artisan test --compact --do-not-cache-result --stop-on-failure'], { env: { ...process.env, DB_USERNAME: username, DB_PASSWORD: password } });
} finally {
    sql(`REVOKE ALL PRIVILEGES ON \`${database}\`.* FROM '${username}'@'%'; DROP DATABASE IF EXISTS \`${database}\`;`);
}

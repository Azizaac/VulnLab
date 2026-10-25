// Read-only structural checks for the inert Sprint 7 planning package.
// Does not connect to a server/Cloudflare, load .env, start a service or deploy.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root='docs/deploy';
const required=['README.md','INVENTORY_REDACTED.md','AAPANEL_RUNBOOK.md','ENVIRONMENT_MATRIX.md','CLOUDFLARE_ACCESS_TUNNEL.md','BACKUP_RESTORE_ROLLBACK.md','OPERATIONS_MONITORING.md','LAB_ISOLATION_PLAN.md','PREFLIGHT_RESULTS.md','RELEASE_DECISION.md'];
for(const file of required) {
    const filename=path.join(root,file);
    assert(fs.existsSync(filename),`Missing ${filename}`);
    const markdown=fs.readFileSync(filename,'utf8');
    for(const match of markdown.matchAll(/\]\(([^)]+)\)/g)) {
        const target=match[1].split('#')[0];
        if(!target || /^[a-z]+:/i.test(target))continue;
        assert(fs.existsSync(path.resolve(path.dirname(filename),target)),`Broken local link in ${file}: ${target}`);
    }
}
const config=JSON.parse(fs.readFileSync(`${root}/templates/cloudflare-remote-config.json.example`,'utf8'));
const rules=config.config.ingress;
assert.equal(rules.at(-1).service,'http_status:404');
assert.equal(rules.length,3);
for(const rule of rules.slice(0,-1)) {
    assert(rule.hostname.endsWith('.example.com'));
    assert(/^http:\/\/127\.0\.0\.1:1808[01]$/.test(rule.service));
    assert.equal(rule.originRequest.httpHostHeader,rule.hostname);
    assert.equal(rule.originRequest.access.required,true);
    assert(rule.originRequest.access.audTag[0].startsWith('REPLACE_'));
    assert(!rule.path && !rule.originRequest.noTLSVerify);
}
const env=Object.fromEntries(fs.readFileSync(`${root}/templates/environment.production.example`,'utf8').split(/\r?\n/).filter(line=>line && !line.startsWith('#')).map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1)];}));
for(const [key,value] of Object.entries({APP_ENV:'production',APP_DEBUG:'false',SESSION_SECURE_COOKIE:'true',SESSION_HTTP_ONLY:'true',SESSION_SAME_SITE:'lax',SESSION_DOMAIN:'null',SESSION_PATH:'/',LABS_ENABLED:'false',LAB_RUNNER_TOKEN:'',LAB_RUNNER_URL:''})) assert.equal(env[key],value,key);
assert(env.APP_KEY.startsWith('REPLACE_'));
assert(env.SESSION_COOKIE.startsWith('__Host-'));
assert(!('REGISTRATION_ENABLED' in env),'Do not invent an unsupported registration flag');
const nginx=fs.readFileSync(`${root}/templates/nginx-core.conf.example`,'utf8');
assert.equal((nginx.match(/listen 127\.0\.0\.1:__PORT__/g)||[]).length,2);
assert(nginx.includes('root __ROOT__/current/public;'));
assert(nginx.includes('location = /index.php'));
assert(nginx.includes('include __FASTCGI_PARAMS__;'));
assert(nginx.includes('alias __ROOT__/shared/public-build-assets/;'));
assert(!nginx.includes('unsafe-inline') && !nginx.includes('0.0.0.0'));
const unit=fs.readFileSync(`${root}/templates/cloudflared.service.example`,'utf8');
assert(unit.includes('LoadCredential=') && unit.includes('--token-file %d/tunnel-token'));
assert(!unit.includes('--token ') && !unit.includes('User=root'));
const decision=fs.readFileSync(`${root}/RELEASE_DECISION.md`,'utf8');
assert(decision.includes('Deployment NOT started; approval required.'));
assert(decision.includes('NO-GO'));
assert(decision.includes('PENDING — not authorized'));
const local=JSON.parse(fs.readFileSync(`${root}/LOCAL_CHECKS.json`,'utf8'));
assert.equal(local.server_inventory,'UNKNOWN / NOT CONTACTED');
assert.deepEqual(local.infrastructure_changes,[]);
console.log('Planning package PASS: 10 documents/links, JSON/env/Nginx/unit safety structure, explicit NO-GO and unknown server inventory. This is not target deployment validation.');

import assert from 'node:assert/strict';
import fs from 'node:fs';
const base='http://127.0.0.1:8088';
const statuses={};
for(const route of ['/up','/ready','/login','/.env']) {
    const response=await fetch(base+route,{signal:AbortSignal.timeout(5000)});
    statuses[route]=response.status;
    if(route==='/ready') assert.deepEqual(await response.json(),{ready:true,database:true,storage:true});
    if(route==='/login') {
        assert.equal(response.headers.get('x-frame-options'),'DENY');
        assert.equal(response.headers.get('x-content-type-options'),'nosniff');
        assert.equal(response.headers.get('x-powered-by'),null);
        const nonce=response.headers.get('content-security-policy')?.match(/nonce-([^']+)/)?.[1];
        assert(nonce);
        const html=await response.text();
        assert(html.includes(`nonce="${nonce}"`));
        assert(!html.includes('/@vite/client'));
    }
}
assert.deepEqual(statuses,{'/up':200,'/ready':200,'/login':200,'/.env':403});
fs.writeFileSync('docs/qa/local-smoke-results.json',JSON.stringify({checked_at:new Date().toISOString(),scope:'Updated loopback Docker app only; no login to learner accounts',statuses,headers_and_nonce:'PASS',dev_server_absent:true},null,2)+'\n');
console.log('Updated local Docker app: liveness/readiness/login passed, .env denied, CSP nonce and defense headers confirmed.');

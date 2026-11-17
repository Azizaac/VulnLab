import assert from 'node:assert/strict';
import fs from 'node:fs';
import { randomBytes, randomUUID } from 'node:crypto';
import { runtimeRevision, contracts } from '../sandbox/common.mjs';
import { scenarios } from './v9-scenarios.mjs';

const token = fs.readFileSync('.env', 'utf8').match(/^LAB_RUNNER_TOKEN=(.*)$/m)?.[1].trim();
assert(token && token.length >= 40, 'Local runner must be configured');
assert.deepEqual(contracts, JSON.parse(fs.readFileSync('database/data/lab-routes.json', 'utf8')));
const base = 'http://127.0.0.1:8090';
async function call(id, action, data, status = 200) {
    const response = await fetch(`${base}/sessions/${id}/${action}`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal: AbortSignal.timeout(15000) });
    assert.equal(response.status, status, `Runner ${action} status`);
    return response.json();
}
const chosen = process.argv.find(a => a.startsWith('--labs='))?.slice(7).split(',') ?? Object.keys(scenarios);
const labs = {};
for (const lab of chosen) {
    assert.equal(typeof scenarios[lab], 'function', `No acceptance scenario for ${lab}`);
    const id = randomUUID();
    let generation = 0, capability, flag;
    const payload = () => ({ lab, generation, capability });
    const reset = async (lease = 600000) => {
        generation++;
        capability = randomBytes(32).toString('hex');
        flag = `VULNLAB{${randomBytes(24).toString('hex')}}`;
        const provisioned = await call(id, 'provision', { ...payload(), flag, expires_at: Date.now() + lease });
        assert.equal(provisioned.runtime_revision, runtimeRevision, 'Running image differs from source');
        assert(!JSON.stringify(provisioned).includes(flag), 'Provisioning leaked completion flag');
        assert.equal((await call(id, 'evidence', payload())).eligible, false);
    };
    const request = async (endpoint, method = 'GET', body = {}, mode = 'vulnerable', headers = {}) => {
        const result = await call(id, 'request', { ...payload(), request: { endpoint, method, body, mode, headers: { 'X-Dummy-User': 'customer_b', 'Content-Type': 'application/json', ...headers } } });
        assert.equal(result.generation, generation);
        return { ...result, json: JSON.parse(result.body) };
    };
    try {
        await reset();
        const proof = await scenarios[lab](request, reset);
        assert.equal(proof, flag, 'Exploit did not return this generation completion proof');
        const evidence = await call(id, 'evidence', payload());
        assert.equal(evidence.eligible, true);
        assert.equal(evidence.lab, lab);
        assert.equal(evidence.runtime_revision, runtimeRevision);
        await call(id, 'evidence', { ...payload(), capability: randomBytes(32).toString('hex') }, 409);
        const old = payload();
        await reset();
        await call(id, 'evidence', old, 409);
        for (const endpoint of ['http://db:3306', 'http://169.254.169.254/latest/meta-data', 'http://host.docker.internal', 'http://127.0.0.1:8088', '../other-session']) {
            await call(id, 'request', { ...payload(), request: { endpoint, method: 'GET', headers: {}, body: {}, mode: 'vulnerable' } }, 422);
        }
        const endpoint = Object.keys(contracts[lab])[0];
        for (const header of ['Host', 'Cookie', 'X-Control-Token', 'X-Capability', 'Connection']) {
            await call(id, 'request', { ...payload(), request: { endpoint, method: 'GET', headers: { [header]: 'forbidden' }, body: {}, mode: 'vulnerable' } }, 422);
        }
        await reset(400);
        await new Promise(resolve => setTimeout(resolve, 450));
        await call(id, 'evidence', payload(), 410);
        labs[lab] = { baseline: true, trigger: true, secure: true, proof: true, expiry: true, reset: true, transport_ownership: true, network: true };
        console.log(`${lab}: real HTTP, secure contrast, proof, reset, expiry and scope denial PASS`);
    } finally {
        await call(id, 'stop', payload(), 410).catch(() => {});
    }
}
const report = { status: 'RUNTIME_PASS_CORE_PENDING', checked_at: new Date().toISOString(), runtime_revision: runtimeRevision, labs };
fs.mkdirSync('.tools/v9-resume', { recursive: true });
fs.writeFileSync('.tools/v9-resume/runtime-proof.json', JSON.stringify(report, null, 2) + '\n');

import assert from 'node:assert/strict';

export const scenarios = {
    async 'password-reset-token-lifecycle'(r, reset) {
        const account = await r('account');
        assert.equal(account.json.account.password_version, 1);
        const known = await r('request', 'POST', { email: 'customer_b@vulnshop.invalid' });
        const unknown = await r('request', 'POST', { email: 'unknown@example.test' });
        assert.deepEqual(known.json, unknown.json);
        const mailbox = await r('mailbox');
        const tokens = Object.fromEntries(mailbox.json.tokens.map(t => [t.fixture, t.token]));
        const change = token => ({ token, password: 'FixtureChanged123!' });
        assert.equal((await r('reset', 'POST', change('0'.repeat(64)), 'secure')).status, 400);
        assert.equal((await r('reset', 'POST', change(tokens.valid), 'secure')).status, 200);
        assert.equal((await r('reset', 'POST', change(tokens.valid), 'secure')).status, 400);
        assert.equal((await r('reset', 'POST', change(tokens.expired), 'secure')).status, 400);
        assert.equal((await r('reset', 'POST', change(tokens.used), 'secure')).status, 400);
        assert.equal((await r('account')).json.account.password_version, 2);
        await reset();
        assert.equal((await r('account')).json.account.password_version, 1);
        const fresh = (await r('mailbox')).json.tokens.find(t => t.fixture === 'valid').token;
        assert.notEqual(fresh, tokens.valid);
        const first = await r('reset', 'POST', change(fresh));
        assert.equal(first.status, 200);
        assert.equal(first.json.flag, undefined);
        const replay = await r('reset', 'POST', change(fresh));
        assert.equal(replay.status, 200);
        assert.equal(replay.json.account.password_version, 3);
        return replay.json.flag;
    },
    async 'csrf-preferences'(r, reset) {
        assert.equal((await r('preferences')).json.theme, 'light');
        const formB = (await r('form')).json;
        const formA = (await r('form', 'GET', {}, 'secure', { 'X-Dummy-User': 'customer_a' })).json;
        assert.notEqual(formA.csrf_token, formB.csrf_token);
        const trusted = { Origin: 'http://trusted.lab.test' };
        const attacker = { Origin: 'http://attacker.lab.test' };
        assert.equal((await r('preferences', 'POST', { theme: 'dark' }, 'secure', trusted)).status, 403);
        assert.equal((await r('preferences', 'POST', { theme: 'dark', csrf_token: formA.csrf_token }, 'secure', trusted)).status, 403);
        assert.equal((await r('preferences', 'POST', { theme: 'dark', csrf_token: formB.csrf_token }, 'secure', attacker)).status, 403);
        assert.equal((await r('preferences')).json.theme, 'light');
        assert.equal((await r('preferences', 'POST', { theme: 'dark', csrf_token: formB.csrf_token }, 'secure', trusted)).status, 200);
        await reset();
        assert.equal((await r('preferences')).json.theme, 'light');
        assert.notEqual((await r('form')).json.csrf_token, formB.csrf_token);
        const changed = await r('preferences', 'POST', { theme: 'dark' }, 'vulnerable', attacker);
        assert.equal(changed.status, 200);
        assert.equal(changed.json.changed, true);
        assert.equal((await r('preferences')).json.theme, 'dark');
        return changed.json.flag;
    },
    async 'path-traversal-receipts'(r, reset) {
        const list = await r('receipts');
        assert.equal(list.status, 200);
        assert.equal(list.json.receipts.length, 1);
        assert.equal(list.json.receipts[0].receipt_id, 102);
        assert.equal((await r('download', 'GET', { receipt_id: 102 }, 'secure')).status, 200);
        assert.equal((await r('download', 'GET', { receipt_id: 101 }, 'secure')).status, 403);
        assert.equal((await r('download', 'GET', { file: '../private/note.txt' }, 'secure')).status, 403);
        assert.equal((await r('download', 'GET', { file: '../../etc/passwd' }, 'vulnerable')).status, 403);
        await reset();
        const baseline = await r('download', 'GET', { file: 'b.txt' }, 'vulnerable');
        assert.equal(baseline.status, 200);
        assert.equal(baseline.json.flag, undefined);
        const traversed = await r('download', 'GET', { file: '../private/note.txt' }, 'vulnerable');
        assert.equal(traversed.status, 200);
        assert.ok(traversed.json.content.includes('Synthetic private note'));
        return traversed.json.flag;
    },
    async 'file-upload-validation'(r, reset) {
        assert.equal((await r('uploads')).json.uploads.length, 0);
        const fakePng = { filename: 'foto.png', content_type: 'image/png', content_base64: Buffer.from('INI TEKS DUMMY').toString('base64') };
        assert.equal((await r('uploads', 'POST', fakePng, 'secure')).status, 422);
        assert.equal((await r('uploads')).json.uploads.length, 0);
        await reset();
        const accepted = await r('uploads', 'POST', fakePng, 'vulnerable');
        assert.equal(accepted.status, 201);
        assert.equal(accepted.json.upload.content_mismatch, 1);
        const fetched = await r('file', 'GET', { id: accepted.json.upload.id }, 'vulnerable');
        assert.equal(fetched.status, 200);
        assert.equal((await r('file', 'GET', { id: accepted.json.upload.id }, 'secure', { 'X-Dummy-User': 'customer_a' })).status, 404);
        return accepted.json.flag;
    },
    async 'graphql-object-access'(r, reset) {
        assert.equal((await r('schema')).status, 200);
        const ownList = await r('graphql', 'POST', { operation: 'viewerOrders' }, 'secure');
        assert.equal(ownList.status, 200);
        assert.equal(ownList.json.data.viewer.orders.length, 1);
        assert.equal(ownList.json.data.viewer.orders[0].id, 202);
        assert.equal((await r('graphql', 'POST', { operation: 'workspaceOrder', variables: { orderId: 202 } }, 'secure')).status, 200);
        assert.equal((await r('graphql', 'POST', { operation: 'workspaceOrder', variables: { orderId: 201 } }, 'secure')).status, 403);
        await reset();
        const ownVuln = await r('graphql', 'POST', { operation: 'workspaceOrder', variables: { orderId: 202 } }, 'vulnerable');
        assert.equal(ownVuln.json.flag, undefined);
        const leaked = await r('graphql', 'POST', { operation: 'workspaceOrder', variables: { orderId: 201 } }, 'vulnerable');
        assert.equal(leaked.status, 200);
        assert.equal(leaked.json.data.workspaceOrder.owner, 'customer_a');
        return leaked.json.flag;
    },
    async 'cors-credential-boundary'(r, reset) {
        assert.equal((await r('policy')).status, 200);
        const trusted = { Origin: 'http://trusted.lab.test' };
        const attacker = { Origin: 'http://attacker.lab.test' };
        assert.equal((await r('account', 'GET', {}, 'secure', trusted)).status, 200);
        assert.equal((await r('account', 'GET', {}, 'secure', attacker)).status, 403);
        await reset();
        const baseline = await r('account', 'GET', {}, 'vulnerable', trusted);
        assert.equal(baseline.status, 200);
        assert.equal(baseline.json.flag, undefined);
        const reflected = await r('account', 'GET', {}, 'vulnerable', attacker);
        assert.equal(reflected.status, 200);
        assert.equal(reflected.json.cors.allow_origin, 'http://attacker.lab.test');
        assert.equal(reflected.json.cors.allow_credentials, true);
        return reflected.json.flag;
    },
    async 'webhook-ssrf-fixtures'(r, reset) {
        const partner = 'https://hooks.partner.lab.test/order-status';
        const canary = 'http://canary-internal.lab.test/admin-health';
        assert.equal((await r('destinations')).status, 200);
        assert.equal((await r('test', 'POST', { target_url: partner }, 'secure')).status, 200);
        assert.equal((await r('test', 'POST', { target_url: canary }, 'secure')).status, 403);
        assert.equal((await r('test', 'POST', { target_url: 'http://127.0.0.1:8080/admin' }, 'vulnerable')).status, 422);
        await reset();
        const ok = await r('test', 'POST', { target_url: partner }, 'vulnerable');
        assert.equal(ok.json.flag, undefined);
        const hit = await r('test', 'POST', { target_url: canary }, 'vulnerable');
        assert.equal(hit.status, 200);
        assert.equal(hit.json.sink, 'internal_canary');
        return hit.json.flag;
    },
    async 'oauth-callback-state'(r, reset) {
        const init1 = (await r('start', 'POST', {}, 'secure')).json;
        const validRedirect = init1.registered_redirect_uri;
        assert.equal((await r('callback', 'POST', { code: init1.fixture_codes.own_code, state: 'wrong', redirect_uri: validRedirect }, 'secure')).status, 403);
        assert.equal((await r('callback', 'POST', { code: init1.fixture_codes.own_code, state: init1.expected_state, redirect_uri: init1.unregistered_test_redirect_uri }, 'secure')).status, 403);
        assert.equal((await r('callback', 'POST', { code: init1.fixture_codes.own_code, state: init1.expected_state, redirect_uri: validRedirect }, 'secure')).status, 200);
        assert.equal((await r('callback', 'POST', { code: init1.fixture_codes.own_code, state: init1.expected_state, redirect_uri: validRedirect }, 'secure')).status, 403);
        await reset();
        const init2 = (await r('start', 'POST', {}, 'vulnerable')).json;
        assert.notEqual(init2.expected_state, init1.expected_state);
        const linked = await r('callback', 'POST', { code: init2.fixture_codes.foreign_code, state: 'forged-state', redirect_uri: validRedirect }, 'vulnerable');
        assert.equal(linked.status, 200);
        assert.equal(linked.json.linked_subject, 'idp_customer_a');
        return linked.json.flag;
    },
    async 'coupon-race'(r, reset) {
        assert.equal((await r('wallet')).json.redemption_count, 0);
        const secureBurst = await r('burst', 'POST', { code: 'ONCE50', parallel: 2 }, 'secure');
        assert.equal(secureBurst.status, 200);
        assert.equal(secureBurst.json.redemption_count, 1);
        await reset();
        assert.equal((await r('wallet')).json.redemption_count, 0);
        assert.equal((await r('burst', 'POST', { code: 'ONCE50', parallel: 5 }, 'vulnerable')).status, 422);
        const raced = await r('burst', 'POST', { code: 'ONCE50', parallel: 2 }, 'vulnerable');
        assert.equal(raced.status, 200);
        assert.equal(raced.json.redemption_count, 2);
        return raced.json.flag;
    },
    async 'api-property-auth'(r, reset) {
        const clean = await r('member', 'GET', {}, 'secure');
        assert.equal(clean.status, 200);
        assert.equal(clean.json.profile.internal_audit_note, undefined);
        assert.equal((await r('member', 'PATCH', { display_name: 'Raka Baru' }, 'secure')).status, 200);
        assert.equal((await r('member', 'PATCH', { tier: 'enterprise' }, 'secure')).status, 403);
        await reset();
        const base = await r('member', 'PATCH', { display_name: 'Raka' }, 'vulnerable');
        assert.equal(base.json.flag, undefined);
        const elevated = await r('member', 'PATCH', { tier: 'enterprise', credit_limit: 5000000 }, 'vulnerable');
        assert.equal(elevated.status, 200);
        assert.equal(elevated.json.profile.tier, 'enterprise');
        return elevated.json.flag;
    },
    async 'api-data-minimization'(r, reset) {
        const safe = await r('directory', 'GET', { limit: 3 }, 'secure');
        assert.equal(safe.status, 200);
        assert.equal(safe.json.items.length, 3);
        assert.equal(safe.json.items[0].private_email, undefined);
        assert.equal((await r('directory', 'GET', { limit: 6 }, 'secure')).status, 422);
        assert.equal((await r('directory', 'GET', { limit: 3, view: 'detail' }, 'secure')).status, 403);
        await reset();
        const summary = await r('directory', 'GET', { limit: 3 }, 'vulnerable');
        assert.equal(summary.json.flag, undefined);
        const leaked = await r('directory', 'GET', { limit: 6, view: 'detail' }, 'vulnerable');
        assert.equal(leaked.status, 200);
        assert.ok(leaked.json.items[0].private_email);
        return leaked.json.flag;
    },
    async 'multi-tenant-workspace'(r, reset) {
        const ws = await r('workspaces');
        assert.equal(ws.status, 200);
        assert.equal(ws.json.memberships.length, 1);
        assert.equal(ws.json.memberships[0].tenant_id, 'org-beta');
        assert.equal((await r('projects', 'GET', { tenant_id: 'org-beta', project_id: 'proj-beta-1' }, 'secure')).status, 200);
        assert.equal((await r('projects', 'GET', { tenant_id: 'org-alpha', project_id: 'proj-alpha-1' }, 'secure')).status, 403);
        assert.equal((await r('projects', 'GET', { tenant_id: 'org-beta', project_id: 'proj-alpha-1' }, 'secure')).status, 404);
        await reset();
        const own = await r('projects', 'GET', { tenant_id: 'org-beta', project_id: 'proj-beta-1' }, 'vulnerable');
        assert.equal(own.json.flag, undefined);
        const crossed = await r('projects', 'GET', { tenant_id: 'org-beta', project_id: 'proj-alpha-1' }, 'vulnerable');
        assert.equal(crossed.status, 200);
        assert.equal(crossed.json.project.tenant_id, 'org-alpha');
        return crossed.json.flag;
    },
};

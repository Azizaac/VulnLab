import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
const docker=(args,options={})=>execFileSync('docker',args,{encoding:'utf8',...options});
const containers=JSON.parse(docker(['inspect','vulnlab-sandbox-shop-1','vulnlab-sandbox-runner-1','vulnlab-sandbox-verifier-1','vulnlab-db-1','vulnlab-app-1']));
const [shop,runner,verifier,db,app]=containers;
for(const c of [shop,runner,verifier]){
 assert.equal(c.Config.User,'node');assert.equal(c.HostConfig.Privileged,false);assert.equal(c.HostConfig.ReadonlyRootfs,true);assert.deepEqual(c.HostConfig.CapDrop,['ALL']);assert(c.HostConfig.Memory>0);assert(c.HostConfig.NanoCpus>0);assert(c.HostConfig.PidsLimit>0);assert.equal(c.Mounts.length,0);assert(!c.Config.Env.some(e=>/^(APP_KEY|DB_PASSWORD|MYSQL_ROOT_PASSWORD|DB_USERNAME)=/.test(e)));assert(!Object.keys(c.NetworkSettings.Networks).some(n=>n.endsWith('_core')));
}
assert.deepEqual(Object.keys(shop.NetworkSettings.Networks),['vulnlab-sandbox_training']);
assert.deepEqual(Object.keys(verifier.NetworkSettings.Networks),['vulnlab-sandbox_training']);
assert(!verifier.Config.Env.some(e=>/TOKEN|SECRET|PASSWORD|APP_KEY/.test(e)));
assert(!Object.keys(db.NetworkSettings.Networks).includes('vulnlab_labcontrol'));
assert(!Object.keys(app.NetworkSettings.Networks).includes('vulnlab-sandbox_training'));
assert(Object.values(shop.NetworkSettings.Ports).every(v=>v===null));
assert(Object.values(verifier.NetworkSettings.Ports).every(v=>v===null));
assert.deepEqual(runner.HostConfig.PortBindings['8090/tcp'],[{HostIp:'127.0.0.1',HostPort:'8090'}]);
const network=JSON.parse(docker(['network','inspect','vulnlab-sandbox_training']))[0];assert.equal(network.Internal,true);
const coreIP=db.NetworkSettings.Networks.vulnlab_core.IPAddress;
const probe=`const net=require('node:net');const targets=[['db',3306],['${coreIP}',3306],['1.1.1.1',443]];(async()=>{for(const [host,port]of targets){const connected=await new Promise(resolve=>{const s=net.connect({host,port});s.setTimeout(1200);s.on('connect',()=>{s.destroy();resolve(true)});s.on('error',()=>resolve(false));s.on('timeout',()=>{s.destroy();resolve(false)})});if(connected)process.exit(3);console.log(host+':'+port+' blocked');}if(require('node:fs').existsSync('/var/www/html/.env'))process.exit(4);})()`;
const probes=docker(['exec','vulnlab-sandbox-shop-1','node','-e',probe]);
const verifierProbes=docker(['exec','vulnlab-sandbox-verifier-1','node','-e',probe]);
const report={checked_at:new Date().toISOString(),shop_networks:Object.keys(shop.NetworkSettings.Networks),runner_networks:Object.keys(runner.NetworkSettings.Networks),verifier_networks:Object.keys(verifier.NetworkSettings.Networks),core_db_networks:Object.keys(db.NetworkSettings.Networks),checks:['non-root','no privileged runtime','read-only roots','all capabilities dropped','memory/CPU/PID limits','no filesystem bind mounts or shared core volumes','no production credentials','no Docker socket','shop/verifier have no host port','runner loopback only','internal training network','no core DB access by name or address','external TCP egress blocked from shop and verifier','no core .env in sandbox'],probe_results:{shop:probes.trim().split('\n'),verifier:verifierProbes.trim().split('\n')},scope:'Local Docker checks. Trusted runner has an edge network for loopback publishing; its outbound HTTP destinations are fixed in code. No public deployment.'};
fs.writeFileSync('docs/lab-isolation-check.json',JSON.stringify(report,null,2));console.log('Isolation configuration passed');console.log(probes.trim());

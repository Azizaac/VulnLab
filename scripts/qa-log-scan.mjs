import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const env=fs.readFileSync('.env','utf8');
const secrets=['APP_KEY','DB_PASSWORD','MYSQL_ROOT_PASSWORD','LAB_RUNNER_TOKEN','SHOP_CONTROL_TOKEN'].map(key=>[key,env.match(new RegExp(`^${key}=(.*)$`,'m'))?.[1].trim().replace(/^['"]|['"]$/g,'')]).filter(([,value])=>value?.length>=12);
const inputs=[];
for(const directory of ['storage/logs','.tools/v6']) {
    if(fs.existsSync(directory)) for(const file of fs.readdirSync(directory).filter(f=>f.endsWith('.log'))) inputs.push([`${directory}/${file}`,fs.readFileSync(`${directory}/${file}`,'utf8')]);
}
for(const name of ['vulnlab-app-1','vulnlab-sandbox-runner-1','vulnlab-sandbox-verifier-1']) inputs.push([name,execFileSync('docker',['logs','--since','2026-10-25T00:24:00Z',name],{encoding:'utf8',stdio:['ignore','pipe','pipe']})]);
const findings=[];
for(const [file,body] of inputs) {
    for(const [key,value] of secrets) if(body.includes(value)) findings.push({file,type:key});
    if(/VULNLAB\{[a-f0-9]{48}\}/.test(body)) findings.push({file,type:'concrete_runtime_flag'});
}
fs.writeFileSync('docs/qa/log-scan-results.json',JSON.stringify({checked_at:new Date().toISOString(),inputs:inputs.length,secret_classes:secrets.map(([key])=>key),findings,scope:'Exact configured secrets and concrete runtime flags in local app/sandbox logs and this QA run logs. Not a guarantee for unrelated systems or preexisting remote log stores.'},null,2)+'\n');
assert.equal(findings.length,0,'Potential secret in private logs; inspect locally without printing values.');
console.log(`${inputs.length} local log inputs checked: no configured secret or concrete runtime flag found.`);

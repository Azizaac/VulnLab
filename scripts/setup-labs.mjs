import fs from 'node:fs';
import {randomBytes} from 'node:crypto';
const path='.env';
if(!fs.existsSync(path))throw new Error('Create the core .env first.');
let env=fs.readFileSync(path,'utf8');
let token=env.match(/^LAB_RUNNER_TOKEN=(.*)$/m)?.[1].trim();
if(!token){token=randomBytes(32).toString('hex');env+='\nLAB_RUNNER_TOKEN='+token+'\n';fs.writeFileSync(path,env);}
if(!fs.existsSync('sandbox/.env'))fs.writeFileSync('sandbox/.env',`LAB_RUNNER_TOKEN=${token}\nSHOP_CONTROL_TOKEN=${randomBytes(32).toString('hex')}\n`,{mode:0o600});
console.log('Local-only runner credentials prepared in ignored .env files. No secrets printed.');

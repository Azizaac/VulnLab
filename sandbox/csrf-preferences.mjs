import {randomBytes} from 'node:crypto';
import {body,send,fail,equal} from './common.mjs';

const trustedOrigin='http://trusted.lab.test';
const attackerOrigin='http://attacker.lab.test';
const caveat='The console models an automatically supplied session cookie via X-Dummy-User. This lab tests Origin and anti-CSRF token defenses, not browser SameSite behavior. The synthetic origins require no external connections.';

export function provision(s){
 s.csrfPreferences={
  customer_a:{theme:'light',csrf_token:randomBytes(32).toString('hex')},
  customer_b:{theme:'light',csrf_token:randomBytes(32).toString('hex')}
 };
}

export async function handle({s,req,res,url,path,actor,secure}){
 if(path!=='/api/preferences'&&path!=='/api/preferences/form')return false;
 if((path==='/api/preferences/form'&&req.method!=='GET')||!['GET','POST'].includes(req.method))fail(405,'Method not allowed');
 if(url.searchParams.size)fail(422,'Unknown query fields');
 if(actor!=='customer_a'&&actor!=='customer_b')fail(403,'Customer account required');
 const preferences=s.csrfPreferences[actor];
 if(path==='/api/preferences/form'){
  send(res,200,{actor,theme:preferences.theme,csrf_token:preferences.csrf_token,trusted_origin:trustedOrigin,attacker_origin:attackerOrigin,caveat});
  return true;
 }
 if(req.method==='GET'){
  send(res,200,{actor,theme:preferences.theme,...(s.evidence?{flag:s.flag}:{})});
  return true;
 }
 const input=await body(req);
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(key=>!['theme','csrf_token'].includes(key)))fail(422,'Unknown preference fields');
 if(input.theme!=='light'&&input.theme!=='dark')fail(422,'Theme must be light or dark');
 if(Object.hasOwn(input,'csrf_token')&&(typeof input.csrf_token!=='string'||input.csrf_token.length>8192))fail(422,'CSRF token must be a bounded string');
 const origin=req.headers.origin;
 if(origin!==undefined&&origin!==trustedOrigin&&origin!==attackerOrigin)fail(422,'Origin outside synthetic lab scope');
 const validToken=equal(input.csrf_token,preferences.csrf_token);
 if(secure&&((origin!==undefined&&origin!==trustedOrigin)||!validToken))fail(403,'Trusted Origin and a valid session CSRF token required');
 const changed=preferences.theme!==input.theme;
 preferences.theme=input.theme;
 if(!secure&&changed&&origin===attackerOrigin&&!validToken)s.evidence=true;
 send(res,200,{actor,theme:preferences.theme,changed,...(s.evidence?{flag:s.flag}:{})});
 return true;
}

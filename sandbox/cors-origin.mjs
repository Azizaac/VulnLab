// Synthetic credentialed CORS boundary lab — models browser ACAO + ACAC rules without external origins.
import {send,fail} from './common.mjs';

const trustedOrigin='http://trusted.lab.test';
const attackerOrigin='http://attacker.lab.test';

export function provision(s){
 s.corsAccounts={
  customer_a:{email:'customer_a@vulnshop.invalid',loyalty_tier:'gold',api_key_preview:'vk_dummy_a_991'},
  customer_b:{email:'customer_b@vulnshop.invalid',loyalty_tier:'silver',api_key_preview:'vk_dummy_b_442'}
 };
 s.evidence=false;
}

export async function handle({s,req,res,url,path,actor,secure}){
 if(path!=='/api/cors/policy'&&path!=='/api/cors/account-summary')return false;
 if(req.method!=='GET')fail(405,'CORS fixture endpoints accept GET only');
 if(url.searchParams.size)fail(422,'Query parameters are not used in this fixture');
 if(actor!=='customer_a'&&actor!=='customer_b')fail(403,'Customer dummy account required');
 if(path==='/api/cors/policy'){
  send(res,200,{
   trusted_origin:trustedOrigin,
   untrusted_test_origin:attackerOrigin,
   note:'Kirim header Origin untuk membandingkan refleksi Origin berkredensial (vulnerable) vs allowlist ketat (secure).'
  });
  return true;
 }
 const origin=req.headers.origin;
 if(origin!==undefined&&origin!==trustedOrigin&&origin!==attackerOrigin){
  fail(422,'Origin outside synthetic CORS fixture');
 }
 const profile=s.corsAccounts[actor];
 if(origin===undefined){
  send(res,200,{actor,cors:{same_origin:true,browser_js_can_read:true},account:profile});
  return true;
 }
 if(secure){
  if(origin!==trustedOrigin){
   fail(403,'CORSPolicy: Origin tidak ada dalam allowlist untuk pembacaan berkredensial');
  }
  send(res,200,{
   actor,
   cors:{request_origin:origin,allow_origin:trustedOrigin,allow_credentials:true,vary:'Origin',browser_js_can_read:true},
   account:profile
  });
  return true;
 }
 // Vulnerable: blindly reflects untrusted Origin while allowing credentials!
 const leaked=origin===attackerOrigin;
 if(leaked)s.evidence=true;
 send(res,200,{
  actor,
  cors:{request_origin:origin,allow_origin:origin,allow_credentials:true,browser_js_can_read:true},
  account:profile,
  ...(leaked?{exposed_cross_origin:true,flag:s.flag}:{})
 });
 return true;
}

// Purely in-memory synthetic webhook destination simulator. Never opens network sockets.
import {body,send,fail} from './common.mjs';

const PARTNER_URL='https://hooks.partner.lab.test/order-status';
const CANARY_URL='http://canary-internal.lab.test/admin-health';

export function provision(s){
 s.webhookDeliveries=[];
 s.evidence=false;
}

export async function handle({s,req,res,url,path,actor,secure}){
 if(path!=='/api/webhooks/destinations'&&path!=='/api/webhooks/test')return false;
 if(url.searchParams.size)fail(422,'Webhook endpoints do not accept query parameters');
 if(path==='/api/webhooks/destinations'){
  if(req.method!=='GET')fail(405,'Destinations endpoint accepts GET only');
  send(res,200,{
   actor,
   allowed_partner_sink:PARTNER_URL,
   internal_canary_sink:CANARY_URL,
   deliveries_recorded:s.webhookDeliveries.length,
   isolation_note:'Simulasi murni di memori sesi; tidak ada koneksi keluar atau akses jaringan host.'
  });
  return true;
 }
 if(req.method!=='POST')fail(405,'Webhook test endpoint accepts POST only');
 const input=await body(req);
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>k!=='target_url')){
  fail(422,'Send only {"target_url": "..."}');
 }
 if(typeof input.target_url!=='string'||input.target_url.length>200){
  fail(422,'target_url must be a bounded string');
 }
 let parsed;
 try{parsed=new URL(input.target_url);}catch{fail(422,'Invalid URL syntax');}
 if(![PARTNER_URL,CANARY_URL].includes(parsed.href)){
  fail(422,'URL outside synthetic webhook fixture; real hosts and IPs are never contacted');
 }
 if(secure){
  if(parsed.protocol!=='https:'||parsed.hostname!=='hooks.partner.lab.test'){
   fail(403,'WebhookEgressPolicy: hanya skema HTTPS dan host allowlist hooks.partner.lab.test yang diizinkan');
  }
 }
 if(parsed.href===PARTNER_URL){
  s.webhookDeliveries.push({sink:'partner_mock',at:Date.now(),actor});
  send(res,200,{delivered:true,sink:'partner_mock',target_url:PARTNER_URL,deliveries_recorded:s.webhookDeliveries.length});
  return true;
 }
 // Vulnerable mode allowed internal canary mock sink via naive suffix assumption (.lab.test)
 s.webhookDeliveries.push({sink:'internal_canary',at:Date.now(),actor});
 s.evidence=true;
 send(res,200,{
  delivered:true,
  sink:'internal_canary',
  target_url:CANARY_URL,
  canary_metadata:{service:'internal-billing-canary',environment:'isolated-fixture'},
  flag:s.flag
 });
 return true;
}

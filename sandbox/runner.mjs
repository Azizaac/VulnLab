import http from 'node:http';
import {body,send,fail,equal,uuid,validateRequest,fetchBounded,contracts} from './common.mjs';
const token=process.env.LAB_RUNNER_TOKEN;const control=process.env.SHOP_CONTROL_TOKEN;
if(!token||token.length<40||!control||control.length<40)throw new Error('Runner secrets missing');
http.createServer(async(req,res)=>{try{
 if(!equal(req.headers.authorization,`Bearer ${token}`))fail(401,'Unauthorized runner client');
 const match=/^\/sessions\/([0-9a-f-]+)\/(provision|request|evidence|stop)$/.exec(req.url||'');
 if(req.method!=='POST'||!match||!uuid.test(match[1]))fail(404,'Unknown runner operation');
 const [,id,action]=match;const input=await body(req);
 if(action==='provision'){
  if(!contracts[input.lab])fail(422,'Lab runtime not enabled');
  if(typeof input.capability!=='string'||!/^[a-f0-9]{64}$/.test(input.capability)||typeof input.flag!=='string'||!/^VULNLAB\{[a-f0-9]{48}\}$/.test(input.flag)||!Number.isInteger(input.generation)||input.generation<1||!Number.isFinite(input.expires_at)||input.expires_at<=Date.now()||input.expires_at>Date.now()+3700000)fail(422,'Invalid session provisioning');
 }
 if(action==='request'){
  if(!contracts[input.lab])fail(422,'Unknown lab');validateRequest(input.lab,input.request);
 }
 const result=await fetchBounded(`http://shop:8080/_control/${id}/${action}`,{method:'POST',headers:{'Content-Type':'application/json','X-Control-Token':control},body:JSON.stringify(input)});
 // The shop control plane executes a real second HTTP request to the bounded training route.
 const output=JSON.parse(result.body);
 if(action==='request'&&input.lab==='search-xss'&&result.status===200&&output.status===200){
  const verification=await fetchBounded('http://verifier:8091/render',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({html:output.body})});
  if(verification.status!==200){console.error(JSON.stringify({event:'verifier_unavailable',status:verification.status}));fail(503,'Browser verifier unavailable');}
  const executed=JSON.parse(verification.body).executed===true;
  output.headers['x-lab-script-executed']=String(executed);
  if(executed&&input.request.mode==='vulnerable'){
   const proof=await fetchBounded(`http://shop:8080/_control/${id}/xss-proof`,{method:'POST',headers:{'Content-Type':'application/json','X-Control-Token':control},body:JSON.stringify({capability:input.capability,generation:input.generation})});
   if(proof.status!==200)fail(503,'Could not record browser proof');
   output.headers['x-lab-flag']=JSON.parse(proof.body).flag;
  }
 }
 send(res,result.status,output);
}catch(error){send(res,error.status||503,{message:error.status?error.message:'Sandbox unavailable. Retry or reset the session.'});}}).listen(8090,'0.0.0.0');

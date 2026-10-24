import {createHash,timingSafeEqual} from 'node:crypto';
import fs from 'node:fs';
export const contracts=JSON.parse(fs.readFileSync(new URL('./contracts.json',import.meta.url),'utf8'));
export const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export function equal(a,b){return typeof a==='string'&&typeof b==='string'&&timingSafeEqual(createHash('sha256').update(a).digest(),createHash('sha256').update(b).digest());}
export function send(res,status,data,type='application/json'){res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'"});res.end(type==='application/json'?JSON.stringify(data):data);}
export function fail(status,message){throw Object.assign(new Error(message),{status});}
export async function body(req){let bytes=0;const chunks=[];for await(const chunk of req){bytes+=chunk.length;if(bytes>24576)fail(413,'Request too large');chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString()||'{}');}catch{fail(422,'Invalid JSON');}}
export function validateRequest(lab,input){
 const rule=contracts[lab]?.[input.endpoint];
 if(!rule||!rule.methods.includes(input.method))fail(422,'Endpoint or method outside lab scope');
 if(Object.keys(input).some(k=>!['endpoint','method','headers','body','mode'].includes(k)))fail(422,'Unknown request fields');
 const headers=input.headers??{};
 if(!headers||Array.isArray(headers)||typeof headers!=='object')fail(422,'Headers must be an object');
 for(const [key,value]of Object.entries(headers)){if(!['X-Dummy-User','Content-Type','Authorization'].includes(key)||typeof value!=='string'||value.length>2048||/[\r\n\0]/.test(value))fail(422,'Header not allowed');}
 if(headers['X-Dummy-User']&&!['customer_a','customer_b','admin'].includes(headers['X-Dummy-User']))fail(422,'Unknown dummy account');
 if(headers['Content-Type']&&headers['Content-Type']!=='application/json')fail(422,'Only JSON request bodies supported');
 if(!['vulnerable','secure'].includes(input.mode))fail(422,'Unknown mode');
 if(typeof input.body!=='object'||input.body===null||Array.isArray(input.body)||JSON.stringify(input.body).length>8192)fail(422,'Body must be a bounded JSON object');
 return rule;
}
export async function fetchBounded(url,options={}){
 const response=await fetch(url,{...options,redirect:'manual',signal:AbortSignal.timeout(8000)});
 if(response.status>=300&&response.status<400)fail(502,'Sandbox redirects are forbidden');
 let length=0;const chunks=[];for await(const chunk of response.body){length+=chunk.length;if(length>32768)fail(502,'Sandbox response too large');chunks.push(chunk);}
 return {status:response.status,headers:Object.fromEntries([...response.headers].filter(([k])=>['content-type','cache-control','x-content-type-options'].includes(k))),body:Buffer.concat(chunks).toString()};
}

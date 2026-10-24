import assert from 'node:assert/strict';
import fs from 'node:fs';
import {randomBytes,randomUUID} from 'node:crypto';
const token=fs.readFileSync('.env','utf8').match(/^LAB_RUNNER_TOKEN=(.*)$/m)?.[1].trim();
const base='http://127.0.0.1:8090';
async function call(id,action,data,expected=200){const r=await fetch(`${base}/sessions/${id}/${action}`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(data)});const result=await r.json();assert.equal(r.status,expected,`${action}: ${result.message||'unexpected status'}`);return result;}
const slugs=process.argv.includes('--xss-stress')?Array.from({length:12},()=> 'search-xss'):process.argv.includes('--foundation')?['order-idor','address-bola']:['order-idor','address-bola','search-xss','product-sqli','profile-mass-assignment','jwt-validation','admin-bfla','coupon-logic'];
for(const lab of slugs){
 const id=randomUUID();let generation=1;let capability=randomBytes(32).toString('hex');let flag=`VULNLAB{${randomBytes(24).toString('hex')}}`;
 const payload=()=>({lab,capability,generation});
 const provision=async()=>call(id,'provision',{...payload(),flag,expires_at:Date.now()+3600000});
 const request=async(endpoint,method='GET',body={},mode='vulnerable',headers={})=>call(id,'request',{...payload(),request:{endpoint,method,body,mode,headers:{'X-Dummy-User':'customer_b','Content-Type':'application/json',...headers}}});
 try{
  const provisioned=await provision();await provision();assert.equal((await call(id,'evidence',payload())).eligible,false);
  if(lab==='order-idor'){
   const baseline=await request('order-b');assert.equal(baseline.status,200);assert.equal(JSON.parse(baseline.body).order.owner,'customer_b');assert.equal(JSON.parse(baseline.body).order.flag,'');
   const result=await request('order-a');assert.equal(result.status,200);assert.equal(JSON.parse(result.body).order.flag,flag);assert.equal((await request('order-a','GET',{},'secure')).status,403);
  }else if(lab==='address-bola'){
   assert.equal((await request('profile-a')).status,403);const result=await request('profile-a','PATCH',{city:'Solo'});assert.equal(result.status,200);assert.equal(JSON.parse(result.body).flag,flag);assert.equal(JSON.parse((await request('profile-a','GET',{},'vulnerable',{'X-Dummy-User':'customer_a'})).body).profile.city,'Solo');assert.equal((await request('profile-a','PATCH',{city:'Bogor'},'secure')).status,403);
  }else if(lab==='search-xss'){
   const plain=await request('search','GET',{q:'halo-lab'});assert.equal(plain.headers['x-lab-script-executed'],'false');assert.equal(plain.headers['x-lab-flag'],undefined);
   const reflected=await request('search','GET',{q:'<script>labProof()</script>'});assert.equal(reflected.headers['x-lab-script-executed'],'true');assert.equal(reflected.headers['x-lab-flag'],flag);
   const safe=await request('search','GET',{q:'<script>labProof()</script>'},'secure');assert.equal(safe.headers['x-lab-script-executed'],'false');assert.equal(safe.headers['x-lab-flag'],undefined);assert(safe.body.includes('&lt;script&gt;'));
  }else if(lab==='product-sqli'){
   assert.equal(JSON.parse((await request('products','GET',{q:'Buku'})).body).products.length,1);
   const query={q:"' OR 1=1 -- "};const exposed=await request('products','GET',query);assert.equal(exposed.status,200);assert.equal(JSON.parse(exposed.body).products.find(p=>p.id===3).description,flag);
   assert.equal(JSON.parse((await request('products','GET',query,'secure')).body).products.length,0);
   assert.equal((await request('products','GET',{q:"' UNION SELECT 1,readfile('/etc/passwd'),1,1 -- "})).status,400);
  }else if(lab==='profile-mass-assignment'){
   assert.equal(JSON.parse((await request('profile')).body).profile.role,'customer');
   assert.equal((await request('profile','PATCH',{city:'Solo',role:'admin'},'secure')).status,422);
   const changed=await request('profile','PATCH',{city:'Solo',role:'admin'});assert.equal(JSON.parse(changed.body).profile.role,'admin');assert.equal(JSON.parse(changed.body).flag,flag);
  }else if(lab==='jwt-validation'){
   const original=provisioned.fixtures.jwt_token;assert.equal((await request('admin','GET',{},'secure',{Authorization:`Bearer ${original}`})).status,403);
   const [head,encoded,signature]=original.split('.');const claims=JSON.parse(Buffer.from(encoded,'base64url'));const forged=[head,Buffer.from(JSON.stringify({...claims,role:'admin'})).toString('base64url'),signature].join('.');
   const exposed=await request('admin','GET',{},'vulnerable',{Authorization:`Bearer ${forged}`});assert.equal(exposed.status,200);assert.equal(JSON.parse(exposed.body).flag,flag);assert.equal((await request('admin','GET',{},'secure',{Authorization:`Bearer ${forged}`})).status,401);
  }else if(lab==='admin-bfla'){
   assert.equal(JSON.parse((await request('product')).body).product.visible,0);assert.equal((await request('publish','POST',{},'secure')).status,403);
   const exposed=await request('publish','POST');assert.equal(JSON.parse(exposed.body).product.visible,1);assert.equal(JSON.parse(exposed.body).flag,flag);
   assert.equal((await request('publish','POST',{},'secure',{'X-Dummy-User':'admin'})).status,200);
  }else if(lab==='coupon-logic'){
   assert.equal(JSON.parse((await request('cart')).body).cart.total,100);assert.equal(JSON.parse((await request('coupon','POST',{coupon:'WELCOME10'})).body).cart.total,90);
   const exposed=await request('coupon','POST',{coupon:'WELCOME10'});assert.equal(JSON.parse(exposed.body).cart.total,80);assert.equal(JSON.parse(exposed.body).flag,flag);
  }
  assert.equal((await call(id,'evidence',payload())).eligible,true);
  const old={...payload()};generation++;capability=randomBytes(32).toString('hex');flag=`VULNLAB{${randomBytes(24).toString('hex')}}`;await provision();assert.equal((await call(id,'evidence',payload())).eligible,false);await call(id,'evidence',old,409);
  if(lab==='address-bola')assert.equal(JSON.parse((await request('profile-a','GET',{},'vulnerable',{'X-Dummy-User':'customer_a'})).body).profile.city,'Bandung');
  if(lab==='coupon-logic'){assert.equal(JSON.parse((await request('coupon','POST',{coupon:'WELCOME10'},'secure')).body).cart.total,90);assert.equal((await request('coupon','POST',{coupon:'WELCOME10'},'secure')).status,409);}
  await call(id,'request',{...payload(),request:{endpoint:'http://db:3306',method:'GET',headers:{},body:{},mode:'vulnerable'}},422);
  const endpoint=Object.keys(JSON.parse(fs.readFileSync('sandbox/contracts.json','utf8'))[lab])[0];
  for(const header of ['Host','Cookie','X-Control-Token','X-Capability','Connection'])await call(id,'request',{...payload(),request:{endpoint,method:'GET',headers:{[header]:'forbidden'},body:{},mode:'vulnerable'}},422);
  await call(id,'provision',{...payload(),flag,expires_at:Date.now()+100});
  // Provisioning of the same generation is idempotent; rotate before testing a shorter lease.
  generation++;capability=randomBytes(32).toString('hex');await call(id,'provision',{...payload(),flag,expires_at:Date.now()+100});await new Promise(resolve=>setTimeout(resolve,180));await call(id,'evidence',payload(),410);
  console.log(`${lab}: baseline, real HTTP exploit, secure comparison, evidence, reset, stale generation and target/header restrictions passed`);
 }finally{await call(id,'stop',payload()).catch(()=>{});}
}
const unauth=await fetch(`${base}/sessions/${randomUUID()}/provision`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal(unauth.status,401);console.log('Unauthenticated runner request: rejected');

// Deliberately vulnerable teaching code. This file exists only in the isolated sandbox image.
import http from 'node:http';
import fs from 'node:fs';
import {DatabaseSync,constants} from 'node:sqlite';
import {createHmac,randomBytes} from 'node:crypto';
import {body,send,fail,equal,uuid,contracts,validateRequest,fetchBounded} from './common.mjs';
const secret=process.env.SHOP_CONTROL_TOKEN;
if(!secret||secret.length<40)throw new Error('Shop management secret missing');
const sessions=new Map();
function dispose(id){const s=sessions.get(id);if(s){s.db.close();sessions.delete(id);fs.unlinkSync(`/data/${id}.sqlite`);}}
function current(id,input){const s=sessions.get(id);if(!s)fail(410,'Sandbox data expired or restarted; reset this session');if(s.expires_at<=Date.now()){dispose(id);fail(410,'Session expired');}if(!equal(s.capability,input.capability)||s.generation!==input.generation)fail(409,'Stale session generation');return s;}
function provision(id,input){
 const prior=sessions.get(id);if(prior&&prior.generation===input.generation){if(!equal(prior.capability,input.capability))fail(409,'Provisioning conflict');return {ready:true,fixtures:prior.fixtures??{}};}
 if(prior&&prior.generation>input.generation)fail(409,'Stale provisioning');
 if(!prior&&sessions.size>=64)fail(503,'Sandbox capacity reached');dispose(id);
 const db=new DatabaseSync(`/data/${id}.sqlite`);db.exec('CREATE TABLE orders(id INTEGER PRIMARY KEY,owner TEXT,item TEXT,flag TEXT); CREATE TABLE profiles(id INTEGER PRIMARY KEY,owner TEXT,city TEXT,role TEXT);');
 db.prepare('INSERT INTO orders VALUES(?,?,?,?)').run(101,'customer_a','Buku keamanan',input.flag);db.prepare('INSERT INTO orders VALUES(?,?,?,?)').run(102,'customer_b','Keyboard latihan','');
 db.prepare('INSERT INTO profiles VALUES(?,?,?,?)').run(1,'customer_a','Bandung','customer');db.prepare('INSERT INTO profiles VALUES(?,?,?,?)').run(2,'customer_b','Jakarta','customer');
 db.exec('CREATE TABLE products(id INTEGER PRIMARY KEY,name TEXT,description TEXT,visible INTEGER);CREATE TABLE cart(id INTEGER PRIMARY KEY,total INTEGER,redemptions INTEGER);');
 db.prepare('INSERT INTO products VALUES(?,?,?,?)').run(1,'Buku keamanan','Bacaan dummy',1);db.prepare('INSERT INTO products VALUES(?,?,?,?)').run(2,'Keyboard','Perangkat dummy',1);db.prepare('INSERT INTO products VALUES(?,?,?,?)').run(3,'Produk rahasia',input.flag,0);db.exec('INSERT INTO cart VALUES(1,100,0)');
 const jwtKey=randomBytes(32).toString('hex');const claims={sub:'customer_b',role:'customer',iss:'vulnshop',aud:'vulnshop-lab',exp:Math.floor(input.expires_at/1000)};
 const head=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');const payload=Buffer.from(JSON.stringify(claims)).toString('base64url');const signature=createHmac('sha256',jwtKey).update(head+'.'+payload).digest('base64url');
 const fixtures=input.lab==='jwt-validation'?{jwt_token:head+'.'+payload+'.'+signature}:{};
 sessions.set(id,{...input,db,evidence:false,jwtKey,fixtures});return {ready:true,fixtures};
}
http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://shop:8080');const management=/^\/_control\/([0-9a-f-]+)\/(provision|request|evidence|stop|xss-proof)$/.exec(url.pathname);
 if(management){if(req.method!=='POST'||!equal(req.headers['x-control-token'],secret))fail(403,'Forbidden');const [,id,action]=management;if(!uuid.test(id))fail(422,'Invalid session');const input=await body(req);
  if(action==='provision'){if(!contracts[input.lab]||!Number.isInteger(input.generation)||!/^VULNLAB\{[a-f0-9]{48}\}$/.test(input.flag)||!/^[a-f0-9]{64}$/.test(input.capability))fail(422,'Invalid provision');return send(res,200,provision(id,input));}
  const s=current(id,input);
  if(action==='evidence')return send(res,200,{eligible:s.evidence,lab:s.lab,generation:s.generation});
  if(action==='xss-proof'){if(s.lab!=='search-xss')fail(422,'Wrong proof type');s.evidence=true;return send(res,200,{flag:s.flag});}
  if(action==='stop'){dispose(id);return send(res,200,{stopped:true});}
  if(input.lab!==s.lab)fail(422,'Session lab mismatch');const rule=validateRequest(s.lab,input.request);const r=input.request;const started=performance.now();
  const target=new URL(`http://127.0.0.1:8080/_training/${id}${rule.path}`);
  if(r.method==='GET')for(const [k,v]of Object.entries(r.body)){if(typeof v!=='string'&&typeof v!=='number')fail(422,'Invalid query');target.searchParams.set(k,String(v));}
  const response=await fetchBounded(target,{method:r.method,headers:{...r.headers,'Content-Type':'application/json','X-Capability':s.capability,'X-Generation':String(s.generation),'X-Mode':r.mode},...(r.method==='GET'?{}:{body:JSON.stringify(r.body)})});
  return send(res,200,{...response,elapsed_ms:Math.round(performance.now()-started),request:{method:r.method,path:rule.path+target.search,headers:r.headers,body:r.body},generation:s.generation});
 }
 const training=/^\/_training\/([0-9a-f-]+)(\/.*)$/.exec(url.pathname);if(!training||!uuid.test(training[1]))fail(404,'Unknown training route');
 const [,id,path]=training;const s=current(id,{capability:req.headers['x-capability'],generation:Number(req.headers['x-generation'])});
 if(!Object.values(contracts[s.lab]).some(r=>r.path===path&&r.methods.includes(req.method)))fail(404,'Out of scope');
 const actor=req.headers['x-dummy-user']||'customer_b';if(!['customer_a','customer_b','admin'].includes(actor))fail(401,'Unknown dummy account');const secure=req.headers['x-mode']==='secure';
 if(s.lab==='order-idor'){
  const order=s.db.prepare('SELECT * FROM orders WHERE id=?').get(Number(path.split('/').pop()));if(!order)fail(404,'Order missing');
  if(secure&&order.owner!==actor)fail(403,'OrderPolicy: bukan pesanan akun ini');
  if(!secure&&order.owner!==actor&&actor==='customer_b')s.evidence=true;
  return send(res,200,{order});
 }
 if(s.lab==='address-bola'){
  const profile=s.db.prepare('SELECT * FROM profiles WHERE id=?').get(Number(path.split('/').pop()));if(!profile)fail(404,'Profile missing');
  if((secure||req.method==='GET')&&profile.owner!==actor)fail(403,'ProfilePolicy: bukan profil akun ini');
  if(req.method==='PATCH'){const patch=await body(req);if(typeof patch.city!=='string'||!patch.city.trim()||patch.city.length>80||Object.keys(patch).some(k=>k!=='city'))fail(422,'Kirim city berupa teks, maksimal 80 karakter');s.db.prepare('UPDATE profiles SET city=? WHERE id=?').run(patch.city,profile.id);if(!secure&&profile.owner!==actor&&actor==='customer_b')s.evidence=true;}
  return send(res,200,{profile:s.db.prepare('SELECT * FROM profiles WHERE id=?').get(profile.id),...(s.evidence?{flag:s.flag}:{})});
 }
 if(s.lab==='search-xss'){
  const q=url.searchParams.get('q')??'';if(q.length>2000)fail(422,'Search limited to 2000 characters');const text=secure?q.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;'):q;
  return send(res,200,`<!doctype html><html lang="id"><head><title>VulnShop Search</title></head><body><h1>Hasil pencarian</h1><p id="result">${text}</p><p>Data latihan lokal.</p></body></html>`,'text/html; charset=utf-8');
 }
 if(s.lab==='product-sqli'){
  const q=url.searchParams.get('q')??'';if(q.length>200)fail(422,'Search limited to 200 characters');let rows;
  // Defense around the intentionally unsafe query: only reads of this session's products, no filesystem, recursive queries or heavy functions.
  s.db.setAuthorizer((action,arg1,arg2)=>action===constants.SQLITE_SELECT||(action===constants.SQLITE_READ&&arg1==='products')||(action===constants.SQLITE_FUNCTION&&arg2==='like')?constants.SQLITE_OK:constants.SQLITE_DENY);
  try{rows=secure?s.db.prepare('SELECT id,name,description,visible FROM products WHERE name LIKE ? AND visible=1').all('%'+q+'%'):s.db.prepare(`SELECT id,name,description,visible FROM products WHERE name LIKE '%${q}%' AND visible=1`).all();}
  catch{return send(res,400,{message:'Query dummy ditolak atau sintaks tidak valid. Hanya SELECT produk sesi ini diizinkan.'});}finally{s.db.setAuthorizer(null);}
  if(!secure&&rows.some(row=>row.id===3&&row.description===s.flag))s.evidence=true;
  return send(res,200,{products:rows});
 }
 if(s.lab==='profile-mass-assignment'){
  const profile=s.db.prepare('SELECT * FROM profiles WHERE id=2').get();
  if(req.method==='PATCH'){const input=await body(req);if(secure&&Object.keys(input).some(k=>k!=='city'))fail(422,'Field role tidak boleh diubah oleh customer');if(input.city!==undefined&&(typeof input.city!=='string'||input.city.length>80))fail(422,'city invalid');if(input.role!==undefined&&!['customer','admin'].includes(input.role))fail(422,'role invalid');const updated=secure?{...profile,city:input.city??profile.city}:{...profile,...input};s.db.prepare('UPDATE profiles SET city=?,role=? WHERE id=2').run(updated.city,updated.role);if(!secure&&profile.role!=='admin'&&updated.role==='admin')s.evidence=true;}
  return send(res,200,{profile:s.db.prepare('SELECT * FROM profiles WHERE id=2').get(),...(s.evidence?{flag:s.flag}:{})});
 }
 if(s.lab==='jwt-validation'){
  const token=String(req.headers.authorization??'').replace(/^Bearer /,'');const parts=token.split('.');if(parts.length!==3)fail(401,'Bearer token dummy diperlukan');let head,claims;try{head=JSON.parse(Buffer.from(parts[0],'base64url'));claims=JSON.parse(Buffer.from(parts[1],'base64url'));}catch{fail(401,'Invalid token');}
  const valid=head.alg==='HS256'&&equal(parts[2],createHmac('sha256',s.jwtKey).update(parts[0]+'.'+parts[1]).digest('base64url'))&&claims.iss==='vulnshop'&&claims.aud==='vulnshop-lab'&&typeof claims.exp==='number'&&claims.exp>Math.floor(Date.now()/1000)&&claims.sub==='customer_b';
  if(secure&&!valid)fail(401,'Signature atau claims JWT tidak valid');if(claims.role!=='admin')fail(403,'Admin role required');
  if(!secure&&!valid)s.evidence=true;return send(res,200,{admin_data:'Inventaris dummy',...(s.evidence?{flag:s.flag}:{})});
 }
 if(s.lab==='admin-bfla'){
  if(req.method==='POST'){if(secure&&actor!=='admin')fail(403,'Gate publish: peran customer ditolak');s.db.prepare('UPDATE products SET visible=1 WHERE id=3').run();if(!secure&&actor==='customer_b')s.evidence=true;}
  const product=s.db.prepare('SELECT id,name,visible FROM products WHERE id=3').get();return send(res,200,{product,...(s.evidence?{flag:s.flag}:{})});
 }
 if(s.lab==='coupon-logic'){
  if(req.method==='POST'){const input=await body(req);if(input.coupon!=='WELCOME10'||Object.keys(input).some(k=>k!=='coupon'))fail(422,'Gunakan coupon WELCOME10 tanpa total kiriman klien');
   if(secure){const change=s.db.prepare('UPDATE cart SET total=90,redemptions=1 WHERE id=1 AND redemptions=0').run();if(change.changes!==1)fail(409,'Kupon sudah dipakai pada keranjang ini');}
   else{s.db.prepare('UPDATE cart SET total=total-10,redemptions=redemptions+1 WHERE id=1').run();if(s.db.prepare('SELECT redemptions FROM cart WHERE id=1').get().redemptions>1)s.evidence=true;}}
  return send(res,200,{cart:s.db.prepare('SELECT * FROM cart WHERE id=1').get(),...(s.evidence?{flag:s.flag}:{})});
 }
 fail(404,'Unknown exercise');
}catch(error){send(res,error.status||500,{message:error.status?error.message:'Sandbox error'});}}).listen(8080,'0.0.0.0');
setInterval(()=>{for(const [id,s]of sessions)if(s.expires_at<=Date.now())dispose(id);},30000).unref();

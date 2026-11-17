// Bounded TOCTOU coupon redemption race fixture — max 2 concurrent operations per burst.
import {body,send,fail} from './common.mjs';

const COUPON='ONCE50';
const DISCOUNT=50000;

export function provision(s){
 s.db.exec(`CREATE TABLE IF NOT EXISTS race_redemptions(
  id INTEGER PRIMARY KEY AUTOINCREMENT,owner TEXT NOT NULL,
  coupon_code TEXT NOT NULL,discount INTEGER NOT NULL,created_at INTEGER NOT NULL
 ); DELETE FROM race_redemptions;`);
 s.raceLock=false;
 s.evidence=false;
}

function countUses(s,actor){
 return s.db.prepare('SELECT count(*) AS c FROM race_redemptions WHERE owner=? AND coupon_code=?').get(actor,COUPON).c;
}

export async function handle({s,req,res,url,path,actor,secure}){
 if(!['/api/coupons/wallet','/api/coupons/redeem','/api/coupons/redeem-burst'].includes(path))return false;
 if(url.searchParams.size)fail(422,'Coupon endpoints use JSON bodies without query params');
 if(actor!=='customer_a'&&actor!=='customer_b')fail(403,'Customer dummy account required');
 if(path==='/api/coupons/wallet'){
  if(req.method!=='GET')fail(405,'Wallet endpoint accepts GET only');
  const uses=countUses(s,actor);
  send(res,200,{
   actor,
   coupon_code:COUPON,
   max_uses:1,
   redemption_count:uses,
   total_discount:uses*DISCOUNT,
   ...(!secure&&s.evidence?{flag:s.flag}:{})
  });
  return true;
 }
 if(req.method!=='POST')fail(405,'Redemption endpoints accept POST only');
 const input=await body(req);
 if(path==='/api/coupons/redeem'){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>k!=='code')||input.code!==COUPON){
   fail(422,'Send {"code": "ONCE50"}');
  }
  if(countUses(s,actor)>=1)fail(409,'Coupon ONCE50 already redeemed');
  s.db.prepare('INSERT INTO race_redemptions(owner,coupon_code,discount,created_at) VALUES(?,?,?,?)').run(actor,COUPON,DISCOUNT,Date.now());
  const uses=countUses(s,actor);
  send(res,200,{actor,coupon_code:COUPON,redemption_count:uses,total_discount:uses*DISCOUNT});
  return true;
 }
 // Bounded 2-request concurrent race harness (/api/coupons/redeem-burst)
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['code','parallel'].includes(k))||input.code!==COUPON||input.parallel!==2){
  fail(422,'Send {"code": "ONCE50", "parallel": 2} (strictly capped at 2)');
 }
 const worker=async()=>{
  if(secure){
   if(s.raceLock||countUses(s,actor)>=1)return {status:409,applied:false};
   s.raceLock=true;
   try{
    await new Promise(r=>setTimeout(r,8));
    if(countUses(s,actor)>=1)return {status:409,applied:false};
    s.db.prepare('INSERT INTO race_redemptions(owner,coupon_code,discount,created_at) VALUES(?,?,?,?)').run(actor,COUPON,DISCOUNT,Date.now());
    return {status:200,applied:true};
   }finally{
    s.raceLock=false;
   }
  }
  // Vulnerable TOCTOU: both workers read count === 0 before either writes!
  const current=countUses(s,actor);
  if(current>=1)return {status:409,applied:false};
  await new Promise(r=>setTimeout(r,12));
  s.db.prepare('INSERT INTO race_redemptions(owner,coupon_code,discount,created_at) VALUES(?,?,?,?)').run(actor,COUPON,DISCOUNT,Date.now());
  return {status:200,applied:true};
 };
 const results=await Promise.all([worker(),worker()]);
 const uses=countUses(s,actor);
 const raced=!secure&&uses>1;
 if(raced)s.evidence=true;
 send(res,200,{
  actor,
  coupon_code:COUPON,
  max_uses:1,
  results,
  redemption_count:uses,
  total_discount:uses*DISCOUNT,
  ...(raced?{invariant_broken:true,flag:s.flag}:{})
 });
 return true;
}

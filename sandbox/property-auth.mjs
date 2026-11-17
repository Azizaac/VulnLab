// Broken Object Property Level Authorization (BOPLA) fixture on synthetic member profile.
import {body,send,fail} from './common.mjs';

const EDITABLE=['display_name','bio'];
const PROTECTED=['tier','credit_limit'];

export function provision(s){
 s.db.exec(`CREATE TABLE IF NOT EXISTS member_profiles(
  owner TEXT PRIMARY KEY,display_name TEXT NOT NULL,bio TEXT NOT NULL,
  tier TEXT NOT NULL,credit_limit INTEGER NOT NULL,internal_audit_note TEXT NOT NULL
 ); DELETE FROM member_profiles;`);
 const ins=s.db.prepare('INSERT INTO member_profiles VALUES(?,?,?,?,?,?)');
 ins.run('customer_a','Sinta','Pembeli reguler','standard',0,'audit-note-a');
 ins.run('customer_b','Raka','Pembelajar keamanan API','standard',0,'internal-risk-flag-none');
 s.evidence=false;
}

function serialize(row,secure,flag,elevated){
 if(secure){
  return {owner:row.owner,display_name:row.display_name,bio:row.bio,tier:row.tier};
 }
 return {
  owner:row.owner,
  display_name:row.display_name,
  bio:row.bio,
  tier:row.tier,
  credit_limit:row.credit_limit,
  internal_audit_note:row.internal_audit_note,
  ...(elevated?{flag}:{})
 };
}

export async function handle({s,req,res,url,path,actor,secure}){
 if(path!=='/api/account/member-profile')return false;
 if(url.searchParams.size)fail(422,'Endpoint does not accept query parameters');
 if(!['customer_a','customer_b','admin'].includes(actor))fail(403,'Dummy account required');
 const targetOwner=actor==='admin'?'customer_b':actor;
 if(req.method==='GET'){
  const row=s.db.prepare('SELECT * FROM member_profiles WHERE owner=?').get(targetOwner);
  const elevated=!secure&&actor!=='admin'&&(row.tier!=='standard'||row.credit_limit>0);
  send(res,200,{profile:serialize(row,secure,s.flag,elevated)});
  return true;
 }
 if(req.method!=='PATCH')fail(405,'Member profile accepts GET and PATCH only');
 const input=await body(req);
 if(!input||typeof input!=='object'||Array.isArray(input)||!Object.keys(input).length){
  fail(422,'Provide at least one profile field to update');
 }
 for(const key of Object.keys(input)){
  if(![...EDITABLE,...PROTECTED].includes(key))fail(422,`Unknown profile field: ${key}`);
 }
 if(secure&&actor!=='admin'&&Object.keys(input).some(k=>PROTECTED.includes(k))){
  fail(403,'MemberProfilePolicy: properti tier dan credit_limit hanya boleh diubah oleh admin');
 }
 if(Object.hasOwn(input,'display_name')&&(typeof input.display_name!=='string'||!input.display_name.trim()||input.display_name.length>60)){
  fail(422,'display_name must be 1..60 characters');
 }
 if(Object.hasOwn(input,'bio')&&(typeof input.bio!=='string'||input.bio.length>160)){
  fail(422,'bio must be 0..160 characters');
 }
 if(Object.hasOwn(input,'tier')&&!['standard','vip','enterprise'].includes(input.tier)){
  fail(422,'tier must be standard, vip, or enterprise');
 }
 if(Object.hasOwn(input,'credit_limit')&&(!Number.isInteger(input.credit_limit)||input.credit_limit<0||input.credit_limit>10000000)){
  fail(422,'credit_limit must be an integer 0..10000000');
 }
 const current=s.db.prepare('SELECT * FROM member_profiles WHERE owner=?').get(targetOwner);
 const next={...current,...input};
 s.db.prepare('UPDATE member_profiles SET display_name=?,bio=?,tier=?,credit_limit=? WHERE owner=?')
  .run(next.display_name,next.bio,next.tier,next.credit_limit,targetOwner);
 const updated=s.db.prepare('SELECT * FROM member_profiles WHERE owner=?').get(targetOwner);
 const elevated=!secure&&actor!=='admin'&&(updated.tier!=='standard'||updated.credit_limit>0);
 if(elevated)s.evidence=true;
 send(res,200,{
  profile:serialize(updated,secure,s.flag,elevated),
  ...(elevated?{flag:s.flag}:{})
 });
 return true;
}

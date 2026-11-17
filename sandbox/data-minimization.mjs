// API list data minimization & pagination bound fixture (OWASP API3:2023 Excessive Data Exposure).
import {send,fail} from './common.mjs';

export function provision(s){
 s.db.exec(`CREATE TABLE IF NOT EXISTS contributors(
  id INTEGER PRIMARY KEY,handle TEXT NOT NULL,badges_count INTEGER NOT NULL,
  private_email TEXT NOT NULL,payout_iban_dummy TEXT NOT NULL,internal_triage_token TEXT NOT NULL
 ); DELETE FROM contributors;`);
 const ins=s.db.prepare('INSERT INTO contributors VALUES(?,?,?,?,?,?)');
 ins.run(1,'alya_sec',12,'alya@internal.vulnshop.invalid','ID00-DUMMY-0001','triage-tok-1');
 ins.run(2,'bima_api',8,'bima@internal.vulnshop.invalid','ID00-DUMMY-0002','triage-tok-2');
 ins.run(3,'citra_web',15,'citra@internal.vulnshop.invalid','ID00-DUMMY-0003','triage-tok-3');
 ins.run(4,'dion_auth',5,'dion@internal.vulnshop.invalid','ID00-DUMMY-0004','triage-tok-4');
 ins.run(5,'eka_logic',9,'eka@internal.vulnshop.invalid','ID00-DUMMY-0005','triage-tok-5');
 ins.run(6,'farhan_ops',19,'farhan@internal.vulnshop.invalid','ID00-DUMMY-0006','triage-tok-6');
 s.evidence=false;
}

export async function handle({s,req,res,url,path,secure}){
 if(path!=='/api/community/contributors')return false;
 if(req.method!=='GET')fail(405,'Contributors directory accepts GET only');
 for(const [key,val]of url.searchParams){
  if(!['limit','view'].includes(key)||url.searchParams.getAll(key).length!==1||val.length>20){
   fail(422,'Allowed query params: limit (integer), view (summary|detail)');
  }
 }
 const rawLimit=url.searchParams.get('limit')??'3';
 if(!/^\d+$/.test(rawLimit))fail(422,'limit must be a positive integer');
 const limit=Number(rawLimit);
 if(limit<1||limit>50)fail(422,'limit must be between 1 and 50');
 const view=url.searchParams.get('view')??'summary';
 if(!['summary','detail'].includes(view))fail(422,'view must be summary or detail');

 if(secure){
  if(limit>5)fail(422,'PaginationPolicy: limit maksimum pada endpoint publik adalah 5 item');
  if(view==='detail')fail(403,'ContributorResourcePolicy: field detail internal tidak diizinkan pada endpoint daftar');
  const items=s.db.prepare('SELECT id,handle,badges_count FROM contributors ORDER BY id LIMIT ?').all(limit);
  send(res,200,{count:items.length,max_limit:5,items});
  return true;
 }
 // Vulnerable: unbounded up to 50 and leaks raw DB columns when view=detail or limit > 5
 if(view==='summary'&&limit<=5){
  const items=s.db.prepare('SELECT id,handle,badges_count FROM contributors ORDER BY id LIMIT ?').all(limit);
  send(res,200,{count:items.length,hint:'Uji parameter view=detail atau limit di atas 5',items});
  return true;
 }
 const rows=s.db.prepare('SELECT * FROM contributors ORDER BY id LIMIT ?').all(limit);
 s.evidence=true;
 send(res,200,{
  count:rows.length,
  excessive_exposure:true,
  items:rows.map((r,idx)=>({...r,internal_triage_token:idx===0?s.flag:r.internal_triage_token})),
  flag:s.flag
 });
 return true;
}

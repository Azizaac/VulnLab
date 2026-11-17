// Deliberately vulnerable reset-token lifecycle, restricted to this session's dummy account.
import {randomBytes,scryptSync} from 'node:crypto';
import {body,send,fail,equal} from './common.mjs';

const EMAIL='customer_b@vulnshop.invalid';
const ACCOUNT='customer_b';
const NEUTRAL='If the dummy account exists, a reset message has been placed in its controlled mailbox.';
const ROUTES=new Map([
 ['/api/reset/mailbox','GET'],
 ['/api/reset/request','POST'],
 ['/api/reset/complete','POST'],
 ['/api/reset/account','GET'],
]);

function passwordState(password){
 const salt=randomBytes(16).toString('hex');
 return {salt,hash:scryptSync(password,salt,32).toString('hex')};
}

function accountView(db){
 return db.prepare('SELECT owner,email,password_version,last_reset_at FROM reset_account WHERE owner=?').get(ACCOUNT);
}

function fields(input,allowed){
 if(!input||typeof input!=='object'||Array.isArray(input)||JSON.stringify(input).length>8192||Object.keys(input).some(key=>!allowed.includes(key)))fail(422,'Send only the documented reset fields');
}

export function provision(s){
 const now=Date.now();
 const expires=Math.min(now+15*60*1000,s.expires_at);
 const password=passwordState(randomBytes(32).toString('hex'));
 s.db.exec(`CREATE TABLE IF NOT EXISTS reset_account(
  owner TEXT PRIMARY KEY,email TEXT NOT NULL,password_salt TEXT NOT NULL,password_hash TEXT NOT NULL,
  password_version INTEGER NOT NULL,last_reset_at INTEGER
 );
 CREATE TABLE IF NOT EXISTS reset_tokens(
  fixture TEXT PRIMARY KEY,owner TEXT NOT NULL,token TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,used_at INTEGER
 );
 DELETE FROM reset_tokens; DELETE FROM reset_account;`);
 s.db.prepare('INSERT INTO reset_account VALUES(?,?,?,?,?,?)').run(ACCOUNT,EMAIL,password.salt,password.hash,1,null);
 const insert=s.db.prepare('INSERT INTO reset_tokens VALUES(?,?,?,?,?,?)');
 insert.run('valid',ACCOUNT,randomBytes(32).toString('hex'),now,expires,null);
 insert.run('expired',ACCOUNT,randomBytes(32).toString('hex'),now-300000,now-60000,null);
 insert.run('used',ACCOUNT,randomBytes(32).toString('hex'),now-300000,expires,now-120000);
 s.evidence=false;
 return {reset_email:EMAIL};
}

export async function handle({s,req,res,url,path,secure}){
 const method=ROUTES.get(path);
 if(!method)return false;
 if(req.method!==method)fail(405,'Method outside reset exercise scope');
 if(url.searchParams.size)fail(422,'Reset endpoints do not accept query fields');

 if(path==='/api/reset/mailbox'){
  const tokens=s.db.prepare('SELECT fixture,token,created_at,expires_at,used_at FROM reset_tokens WHERE owner=? ORDER BY fixture').all(ACCOUNT);
  send(res,200,{channel:'controlled_dummy_mailbox',owner:ACCOUNT,email:EMAIL,tokens});
  return true;
 }
 if(path==='/api/reset/account'){
  send(res,200,{account:accountView(s.db)});
  return true;
 }

 const input=await body(req);
 if(path==='/api/reset/request'){
  fields(input,['email']);
  if(typeof input.email!=='string'||input.email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email))fail(422,'Send a bounded dummy email address');
  if(equal(input.email.toLowerCase(),EMAIL)){
   const now=Date.now();
   // Keep only the latest requested message, alongside the three lifecycle fixtures.
   s.db.prepare(`INSERT INTO reset_tokens VALUES(?,?,?,?,?,?)
    ON CONFLICT(fixture) DO UPDATE SET token=excluded.token,created_at=excluded.created_at,expires_at=excluded.expires_at,used_at=NULL`)
    .run('requested',ACCOUNT,randomBytes(32).toString('hex'),now,Math.min(now+15*60*1000,s.expires_at),null);
  }
  send(res,200,{message:NEUTRAL});
  return true;
 }

 fields(input,['token','password']);
 if(typeof input.token!=='string'||!/^[a-f0-9]{64}$/i.test(input.token)||typeof input.password!=='string'||input.password.length<8||input.password.length>128)fail(422,'Send a 64-hex token and a password of 8 to 128 characters');
 const token=input.token.toLowerCase();
 let broken=false;
 let account;
 s.db.exec('BEGIN IMMEDIATE');
 try{
  const now=Date.now();
  const entry=s.db.prepare('SELECT owner,expires_at,used_at FROM reset_tokens WHERE token=? AND owner=?').get(token,ACCOUNT);
  if(!entry)fail(400,'Reset token invalid or unavailable');
  const lifecycleBroken=entry.used_at!==null||entry.expires_at<=now;
  if(secure&&lifecycleBroken)fail(400,'Reset token invalid or unavailable');
  const password=passwordState(input.password);
  const consumed=secure
   ?s.db.prepare('UPDATE reset_tokens SET used_at=? WHERE token=? AND owner=? AND used_at IS NULL AND expires_at>?').run(now,token,ACCOUNT,now)
   :s.db.prepare('UPDATE reset_tokens SET used_at=? WHERE token=? AND owner=?').run(now,token,ACCOUNT);
  if(consumed.changes!==1)fail(400,'Reset token invalid or unavailable');
  const changed=s.db.prepare('UPDATE reset_account SET password_salt=?,password_hash=?,password_version=password_version+1,last_reset_at=? WHERE owner=?')
   .run(password.salt,password.hash,now,ACCOUNT);
  if(changed.changes!==1)fail(500,'Dummy reset account unavailable');
  account=accountView(s.db);
  broken=!secure&&lifecycleBroken&&changed.changes===1;
  s.db.exec('COMMIT');
 }catch(error){
  s.db.exec('ROLLBACK');
  throw error;
 }
 if(broken)s.evidence=true;
 send(res,200,{message:'Dummy password reset completed',account,...(!secure&&s.evidence?{flag:s.flag}:{})});
 return true;
}

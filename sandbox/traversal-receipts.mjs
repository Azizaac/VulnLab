// The traversal stays inside a session's synthetic filesystem, never the host filesystem.
import fs from 'node:fs';
import {posix,win32} from 'node:path';
import {body,send,fail,equal} from './common.mjs';

const MAX_CONTENT=8192;
const receipts=[
 {receipt_id:101,owner:'customer_a',file:'a.txt'},
 {receipt_id:102,owner:'customer_b',file:'b.txt'},
];

export function provision(s){
 const root=`/data/${s.id}`;
 const base=posix.join(root,'receipts');
 const privateDirectory=posix.join(root,'private');
 fs.mkdirSync(root,{mode:0o700});
 fs.mkdirSync(base,{mode:0o700});
 fs.mkdirSync(privateDirectory,{mode:0o700});
 fs.writeFileSync(posix.join(base,'a.txt'),'Synthetic receipt 101\nOwner: customer_a\nItem: Training book\n',{flag:'wx',mode:0o600});
 fs.writeFileSync(posix.join(base,'b.txt'),'Synthetic receipt 102\nOwner: customer_b\nItem: Practice keyboard\n',{flag:'wx',mode:0o600});
 const privatePath=posix.join(privateDirectory,'note.txt');
 fs.writeFileSync(privatePath,`Synthetic private note, not a downloadable receipt.\n${s.flag}\n`,{flag:'wx',mode:0o600});
 s.traversalReceipts={root,base,privatePath,knownFiles:new Set([
  posix.join(base,'a.txt'),posix.join(base,'b.txt'),privatePath,
 ])};
 s.evidence=false;
}

function queryFields(params,allowed){
 if(params.size>allowed.length)fail(422,'Send only documented scalar receipt fields');
 for(const [key,value]of params){
  if(!allowed.includes(key)||params.getAll(key).length!==1||value.length>160||value.includes('\0'))fail(422,'Send only documented bounded scalar receipt fields');
 }
}

function readFixture(state,target){
 if(!target.startsWith(state.root+'/'))fail(403,'Path outside this synthetic session');
 if(!state.knownFiles.has(target))fail(404,'Synthetic fixture not found');
 // Check every controlled directory and open without following a final symlink.
 for(const directory of [state.root,posix.dirname(target)]){
  const entry=fs.lstatSync(directory);
  if(!entry.isDirectory()||entry.isSymbolicLink()||fs.realpathSync(directory)!==directory)fail(403,'Only synthetic fixture directories are allowed');
 }
 const descriptor=fs.openSync(target,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);
 try{
  const entry=fs.fstatSync(descriptor);
  if(!entry.isFile()||entry.nlink!==1||entry.size>MAX_CONTENT)fail(403,'Only bounded synthetic fixture files are allowed');
  const buffer=Buffer.alloc(MAX_CONTENT+1);
  const length=fs.readSync(descriptor,buffer,0,buffer.length,0);
  if(length>MAX_CONTENT)fail(403,'Synthetic content exceeds download limit');
  return buffer.toString('utf8',0,length);
 }finally{
  fs.closeSync(descriptor);
 }
}

export async function handle({s,req,res,url,path,actor,secure}){
 if(path!=='/api/receipts'&&path!=='/api/receipts/download')return false;
 if(req.method!=='GET')fail(405,'Receipt endpoints accept GET only');
 const params=url.searchParams;
 if(path==='/api/receipts'){
  queryFields(params,[]);
  send(res,200,{receipts:receipts.filter(receipt=>receipt.owner===actor)});
  return true;
 }

 queryFields(params,secure?['receipt_id','file']:['file']);
 const state=s.traversalReceipts;
 let receipt;
 let target;
 if(secure){
  if(params.has('file'))fail(403,'Client file paths are forbidden; use a receipt_id');
  const id=params.get('receipt_id');
  if(id===null||!/^\d{1,6}$/.test(id))fail(422,'Send a numeric receipt_id');
  receipt=receipts.find(value=>String(value.receipt_id)===id);
  if(!receipt)fail(404,'Receipt not found');
  if(receipt.owner!==actor)fail(403,'Receipt belongs to another dummy account');
  target=posix.join(state.base,receipt.file);
 }else{
  const file=params.get('file');
  if(file===null||!file.length)fail(422,'Send a bounded file name');
  if(posix.isAbsolute(file)||win32.isAbsolute(file))fail(403,'Absolute paths are outside the exercise');
  if(!/^[A-Za-z0-9._/-]+$/.test(file))fail(422,'Unsupported synthetic file name');
  target=posix.resolve(state.base,file);
  if(!target.startsWith(state.root+'/'))fail(403,'Path outside this synthetic session');
  receipt=receipts.find(value=>posix.join(state.base,value.file)===target);
 }

 const content=readFixture(state,target);
 const traversed=!secure&&target===state.privatePath&&equal(content,`Synthetic private note, not a downloadable receipt.\n${s.flag}\n`);
 if(traversed)s.evidence=true;
 send(res,200,{...(receipt?{receipt_id:receipt.receipt_id}:{}),content,...(traversed?{flag:s.flag}:{})});
 return true;
}

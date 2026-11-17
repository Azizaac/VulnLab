// Deliberately vulnerable label validation, confined to inert per-session staging files.
import fs from 'node:fs';
import {randomBytes} from 'node:crypto';
import {crc32,deflateSync,inflateSync} from 'node:zlib';
import {body,send,fail,equal} from './common.mjs';

const MAX_BYTES=4096;
const MAX_FILES=32;
const PNG_SIGNATURE=Buffer.from('89504e470d0a1a0a','hex');
const METADATA='id,owner,original_name,content_type,byte_length,valid_png,content_mismatch,width,height,created_at';

function pngChunk(type,data){
 const chunk=Buffer.alloc(data.length+12);
 chunk.writeUInt32BE(data.length,0);
 chunk.write(type,4,4,'ascii');
 data.copy(chunk,8);
 chunk.writeUInt32BE(crc32(chunk.subarray(4,8+data.length)),8+data.length);
 return chunk;
}
const PNG_FIXTURE=Buffer.concat([
 PNG_SIGNATURE,
 pngChunk('IHDR',Buffer.from('00000001000000010806000000','hex')),
 pngChunk('IDAT',deflateSync(Buffer.from([0,0,0,0,0]))),
 pngChunk('IEND',Buffer.alloc(0))
]).toString('base64');

// Bounded PNG fixture validation, not a malware scanner or general safe image processing.
// Only non-interlaced PNGs up to 64x64 with IHDR/PLTE/tRNS/IDAT/IEND are supported.
function inspectPng(bytes){
 if(bytes.length<57||bytes.length>MAX_BYTES||!bytes.subarray(0,8).equals(PNG_SIGNATURE))return null;
 let offset=8,header,palette=0,transparency=false,ended=false,idatClosed=false,chunkCount=0;
 const compressed=[];
 while(offset<bytes.length){
  if(++chunkCount>64||offset+12>bytes.length)return null;
  const length=bytes.readUInt32BE(offset),end=offset+12+length;
  if(end>bytes.length)return null;
  const type=bytes.toString('latin1',offset+4,offset+8),data=bytes.subarray(offset+8,end-4);
  if(crc32(bytes.subarray(offset+4,end-4))!==bytes.readUInt32BE(end-4))return null;
  if(!header&&type!=='IHDR')return null;
  if(compressed.length&&type!=='IDAT')idatClosed=true;
  if(type==='IHDR'){
   if(header||length!==13)return null;
   const width=data.readUInt32BE(0),height=data.readUInt32BE(4),depth=data[8],color=data[9];
   const depths={0:[1,2,4,8,16],2:[8,16],3:[1,2,4,8],4:[8,16],6:[8,16]};
   if(!width||!height||width>64||height>64||!depths[color]?.includes(depth)||data[10]!==0||data[11]!==0||data[12]!==0)return null;
   const channels={0:1,2:3,3:1,4:2,6:4}[color];
   header={width,height,depth,color,rowBytes:Math.ceil(width*channels*depth/8)};
  }else if(type==='PLTE'){
   if(palette||transparency||compressed.length||!length||length%3||length>768||[0,4].includes(header.color))return null;
   palette=length/3;
   if(header.color===3&&palette>2**header.depth)return null;
  }else if(type==='tRNS'){
   if(transparency||compressed.length)return null;
   if(header.color===3){if(!palette||!length||length>palette)return null;}
   else if(header.color===0){if(length!==2||data.readUInt16BE(0)>=2**header.depth)return null;}
   else if(header.color===2){if(length!==6||[0,2,4].some(index=>data.readUInt16BE(index)>=2**header.depth))return null;}
   else return null;
   transparency=true;
  }else if(type==='IDAT'){
   if(idatClosed||(header.color===3&&!palette))return null;
   compressed.push(data);
  }else if(type==='IEND'){
   if(length||!compressed.length||end!==bytes.length)return null;
   ended=true;
  }else return null;
  offset=end;
 }
 if(!ended)return null;
 const packed=Buffer.concat(compressed),expected=(header.rowBytes+1)*header.height;
 let raw;
 try{
  const result=inflateSync(packed,{maxOutputLength:expected,info:true});
  if(result.buffer.length!==expected||result.engine.bytesWritten!==packed.length)return null;
  raw=result.buffer;
 }catch{return null;}
 // At most 32832 inflated bytes. Indexed images additionally require real palette indices.
 let previous=Buffer.alloc(header.color===3?header.rowBytes:0);
 for(let y=0;y<header.height;y++){
  const start=y*(header.rowBytes+1),filter=raw[start];
  if(filter>4)return null;
  if(header.color!==3)continue;
  const row=Buffer.alloc(header.rowBytes);
  for(let x=0;x<row.length;x++){
   const a=x?row[x-1]:0,b=previous[x],c=x?previous[x-1]:0;
   let predictor=0;
   if(filter===1)predictor=a;
   else if(filter===2)predictor=b;
   else if(filter===3)predictor=Math.floor((a+b)/2);
   else if(filter===4){
    const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);
    predictor=pa<=pb&&pa<=pc?a:pb<=pc?b:c;
   }
   row[x]=(raw[start+1+x]+predictor)&255;
  }
  for(let x=0;x<header.width;x++){
   const bit=x*header.depth,index=(row[bit>>3]>>(8-header.depth-(bit&7)))&((1<<header.depth)-1);
   if(index>=palette)return null;
  }
  previous=row;
 }
 return {width:header.width,height:header.height};
}

async function* boundedBody(req){
 let size=0;
 for await(const chunk of req){
  size+=chunk.length;
  if(size>8192)fail(413,'Upload JSON exceeds 8192 bytes');
  yield chunk;
 }
}

export function provision(s){
 s.db.exec(`CREATE TABLE IF NOT EXISTS upload_files(
  id TEXT PRIMARY KEY,owner TEXT NOT NULL,original_name TEXT NOT NULL,
  content_type TEXT NOT NULL,byte_length INTEGER NOT NULL,valid_png INTEGER NOT NULL,
  content_mismatch INTEGER NOT NULL,
  width INTEGER,height INTEGER,created_at INTEGER NOT NULL
 ); DELETE FROM upload_files;`);
 fs.mkdirSync(`/data/${s.id}/uploads`,{recursive:true,mode:0o700});
 s.evidence=false;
 s.fixtures={...s.fixtures,upload_png_base64:PNG_FIXTURE,upload_dummy_base64:Buffer.from('INI TEKS DUMMY').toString('base64')};
 return s.fixtures;
}

export async function handle({s,req,res,url,path,actor,secure}){
 if(path!=='/api/uploads'&&path!=='/api/uploads/file')return false;
 if((path==='/api/uploads/file'&&req.method!=='GET')||!['GET','POST'].includes(req.method))fail(405,'Method outside upload exercise scope');
 if(!['customer_a','customer_b','admin'].includes(actor))fail(403,'Dummy account required');
 const proof=()=>!secure&&s.evidence?{flag:s.flag}:{};
 if(path==='/api/uploads/file'){
  const id=url.searchParams.get('id');
  if(url.searchParams.size!==1||typeof id!=='string'||!/^[a-f0-9]{32}$/.test(id))fail(422,'Send only one server-generated upload id');
  const upload=s.db.prepare(`SELECT ${METADATA} FROM upload_files WHERE id=? AND owner=?`).get(id,actor);
  if(!upload)fail(404,'Owned upload not found');
  const bytes=fs.readFileSync(`/data/${s.id}/uploads/${upload.id}.bin`);
  if(bytes.length>MAX_BYTES||bytes.length!==upload.byte_length)fail(409,'Staged upload state mismatch');
  send(res,200,{upload,content_base64:bytes.toString('base64'),...proof()});
  return true;
 }
 if(url.searchParams.size)fail(422,'Upload collection does not accept query fields');
 if(req.method==='GET'){
  const uploads=s.db.prepare(`SELECT ${METADATA} FROM upload_files WHERE owner=? ORDER BY created_at,id`).all(actor);
  send(res,200,{uploads,...proof()});
  return true;
 }
 const input=await body(boundedBody(req));
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(key=>!['filename','content_type','content_base64'].includes(key)))fail(422,'Send only filename, content_type and content_base64');
 if(typeof input.filename!=='string'||!input.filename.trim()||input.filename.length>80||/[\\/\x00-\x1f\x7f]/.test(input.filename))fail(422,'Filename must be 1 to 80 characters without separators or control characters');
 if(typeof input.content_type!=='string'||input.content_type.length>80||input.content_type!=='image/png'||!input.filename.toLowerCase().endsWith('.png'))fail(422,'Only .png filenames declared as image/png are allowed');
 const encoded=input.content_base64;
 if(typeof encoded!=='string'||!encoded.length||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded))fail(422,'Content must be canonical padded base64');
 const decodedLength=encoded.length/4*3-(encoded.endsWith('==')?2:encoded.endsWith('=')?1:0);
 if(decodedLength>MAX_BYTES)fail(413,'Decoded upload exceeds 4096 bytes');
 const bytes=Buffer.from(encoded,'base64');
 if(!equal(encoded,bytes.toString('base64')))fail(422,'Content must be canonical padded base64');
 const png=inspectPng(bytes);
 if(secure&&!png)fail(422,'Content must be a valid bounded non-interlaced PNG, not just PNG labels');
 if(s.db.prepare('SELECT count(*) AS total FROM upload_files').get().total>=MAX_FILES)fail(409,'Session staging limit reached');
 const id=randomBytes(16).toString('hex'),file=`/data/${s.id}/uploads/${id}.bin`,now=Date.now();
 fs.writeFileSync(file,bytes,{flag:'wx',mode:0o600});
 let upload;
 try{
  const stored=fs.readFileSync(file);
  if(!stored.equals(bytes))fail(409,'Staged upload state mismatch');
  // An unsupported real PNG is not proof; a missing PNG signature is a definite label/content mismatch.
  const mismatch=!stored.subarray(0,8).equals(PNG_SIGNATURE);
  s.db.prepare('INSERT INTO upload_files(id,owner,original_name,content_type,byte_length,valid_png,content_mismatch,width,height,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)').run(id,actor,input.filename,input.content_type,stored.length,png?1:0,mismatch?1:0,png?.width??null,png?.height??null,now);
  upload=s.db.prepare(`SELECT ${METADATA} FROM upload_files WHERE id=? AND owner=?`).get(id,actor);
  if(!secure&&upload.content_mismatch===1)s.evidence=true;
 }catch(error){
  fs.unlinkSync(file);
  s.db.prepare('DELETE FROM upload_files WHERE id=?').run(id);
  throw error;
 }
 send(res,201,{upload,...proof()});
 return true;
}

import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import {fetchBounded} from '../sandbox/common.mjs';
assert.equal(fs.readFileSync('database/data/lab-routes.json','utf8'),fs.readFileSync('sandbox/contracts.json','utf8'));
let followed=0;
const server=http.createServer((req,res)=>{
 if(req.url==='/redirect'){res.writeHead(302,{Location:'/sink'});res.end();}
 else if(req.url==='/sink'){followed++;res.end('should not be fetched');}
 else if(req.url==='/large'){res.end('x'.repeat(32769));}
 else{res.writeHead(200,{'Content-Type':'application/json'});res.end('{"real_http":true}');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}`;
try{
 assert.equal((await fetchBounded(url+'/ok')).body,'{"real_http":true}');
 await assert.rejects(fetchBounded(url+'/redirect'),error=>error.status===502);
 assert.equal(followed,0);
 await assert.rejects(fetchBounded(url+'/large'),error=>error.status===502);
 console.log('4 transport checks passed: matching contracts, real HTTP, redirect not followed, response size bounded.');
}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}

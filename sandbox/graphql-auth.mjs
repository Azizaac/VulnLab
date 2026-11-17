// Bounded synthetic GraphQL fixture demonstrating nested object resolver authorization (BOLA).
import {body,send,fail} from './common.mjs';

export function provision(s){
 s.db.exec(`CREATE TABLE IF NOT EXISTS graphql_orders(
  id INTEGER PRIMARY KEY,owner TEXT NOT NULL,title TEXT NOT NULL,
  total INTEGER NOT NULL,shipping_note TEXT NOT NULL,internal_ref TEXT NOT NULL
 ); DELETE FROM graphql_orders;`);
 const ins=s.db.prepare('INSERT INTO graphql_orders VALUES(?,?,?,?,?,?)');
 ins.run(201,'customer_a','Enterprise API Gateway Seat',12500000,'Gudang khusus tenant A','INV-A-SECRET');
 ins.run(202,'customer_b','Security Testing Handbook',275000,'Pengiriman reguler akun B','INV-B-202');
 s.evidence=false;
}

function parseOperation(input){
 if(!input||typeof input!=='object'||Array.isArray(input))fail(422,'GraphQL payload must be a JSON object');
 if(Object.keys(input).some(k=>!['operation','variables','query'].includes(k)))fail(422,'Send only operation, variables, or bounded query');
 if(typeof input.operation==='string'){
  if(input.operation==='viewerOrders')return {kind:'viewerOrders'};
  if(input.operation==='workspaceOrder'){
   const id=input.variables?.orderId;
   if(!Number.isInteger(id)||id<1||id>999999)fail(422,'variables.orderId must be a positive integer');
   return {kind:'workspaceOrder',orderId:id};
  }
  fail(422,'Supported operations: viewerOrders, workspaceOrder');
 }
 if(typeof input.query==='string'&&input.query.length<=400){
  const m=/workspaceOrder\s*\(\s*orderId\s*:\s*(\d{1,6})\s*\)/.exec(input.query);
  if(m)return {kind:'workspaceOrder',orderId:Number(m[1])};
  if(/\bviewerOrders\b/.test(input.query))return {kind:'viewerOrders'};
 }
 fail(422,'Use operation viewerOrders or workspaceOrder with bounded variables.orderId');
}

export async function handle({s,req,res,url,path,actor,secure}){
 if(path!=='/api/graphql/schema'&&path!=='/api/graphql')return false;
 if(url.searchParams.size)fail(422,'GraphQL endpoints do not accept query parameters');
 if(path==='/api/graphql/schema'){
  if(req.method!=='GET')fail(405,'Schema endpoint accepts GET only');
  send(res,200,{
   actor,
   operations:{
    viewerOrders:{operation:'viewerOrders',description:'Daftar pesanan milik akun aktif'},
    workspaceOrder:{operation:'workspaceOrder',variables:{orderId:202},description:'Detail pesanan berdasarkan orderId (uji ID 202 milik B vs 201 milik A)'}
   }
  });
  return true;
 }
 if(req.method!=='POST')fail(405,'GraphQL execution accepts POST only');
 const op=parseOperation(await body(req));
 if(op.kind==='viewerOrders'){
  const rows=s.db.prepare('SELECT id,owner,title,total FROM graphql_orders WHERE owner=? ORDER BY id').all(actor);
  send(res,200,{data:{viewer:{actor,orders:rows}}});
  return true;
 }
 const order=s.db.prepare('SELECT * FROM graphql_orders WHERE id=?').get(op.orderId);
 if(!order)fail(404,'Order not found in GraphQL fixture');
 if(secure&&order.owner!==actor){
  fail(403,'GraphQLOrderPolicy: nested resolver menolak akses objek milik akun lain');
 }
 const unauthorized=!secure&&order.owner!==actor;
 if(unauthorized)s.evidence=true;
 send(res,200,{
  data:{
   workspaceOrder:{
    id:order.id,
    owner:order.owner,
    title:order.title,
    total:order.total,
    shippingNote:order.shipping_note,
    internalRef:unauthorized?s.flag:order.internal_ref
   }
  },
  ...(unauthorized?{flag:s.flag}:{})
 });
 return true;
}

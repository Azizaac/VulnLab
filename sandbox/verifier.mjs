import http from 'node:http';
import {chromium} from 'playwright-core';
let busy=false;
http.createServer(async(req,res)=>{
 const reply=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 if(req.method!=='POST'||req.url!=='/render')return reply(404,{message:'Unknown verifier route'});
 if(busy)return reply(503,{message:'Verifier busy. Retry.'});
 busy=true;
 let size=0;const parts=[];let browser;let status=200;let result;let stage='parse';
 try{
  for await(const chunk of req){size+=chunk.length;if(size>20000)throw new Error('too large');parts.push(chunk);}
  const {html}=JSON.parse(Buffer.concat(parts).toString());if(typeof html!=='string'||html.length>16000)throw new Error('bad HTML');
  stage='launch';browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--disable-component-update','--disable-extensions','--disable-sync','--no-first-run','--disable-default-apps','--disable-features=MediaRouter']});
  const context=await browser.newContext({serviceWorkers:'block',acceptDownloads:false});
  await context.route('**/*',route=>route.abort());
  const page=await context.newPage();let executed=false;
  await page.exposeFunction('labProof',()=>{executed=true;});
  const csp='<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; img-src \'none\'; connect-src \'none\'; frame-src \'none\'; form-action \'none\'; base-uri \'none\'">';
  stage='render';await page.setContent(csp+html,{waitUntil:'domcontentloaded',timeout:4000});
  await page.waitForTimeout(200);
  result={executed};
 }catch(error){console.error(JSON.stringify({service:'verifier',stage,error:error.name}));status=422;result={message:'HTML verification failed or timed out'};}
 finally{if(browser)await browser.close().catch(()=>{});busy=false;}
 reply(status,result);
}).listen(8091,'0.0.0.0');

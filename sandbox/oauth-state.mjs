// Owned synthetic OAuth 2.0 state & redirect callback fixture — zero external SSO calls.
import {randomBytes} from 'node:crypto';
import {body,send,fail,equal} from './common.mjs';

const VALID_REDIRECT='https://app.vulnshop.lab.test/oauth/callback';
const EVIL_REDIRECT='https://evil.lab.test/callback';

export function provision(s){
 s.oauth={
  expected_state:randomBytes(20).toString('hex'),
  own_code:'code_b_'+randomBytes(12).toString('hex'),
  foreign_code:'code_a_'+randomBytes(12).toString('hex'),
  consumed:false,
  linked_subject:null,
  state_verified:false
 };
 s.evidence=false;
}

export async function handle({s,req,res,url,path,actor,secure}){
 if(!['/api/oauth/start','/api/oauth/callback','/api/oauth/status'].includes(path))return false;
 if(url.searchParams.size)fail(422,'OAuth fixture endpoints use JSON bodies without query params');
 if(actor!=='customer_b')fail(403,'Run this OAuth session exercise as customer_b');
 const st=s.oauth;
 if(path==='/api/oauth/status'){
  if(req.method!=='GET')fail(405,'Status endpoint accepts GET only');
  send(res,200,{
   actor,
   linked_subject:st.linked_subject,
   state_verified:st.state_verified,
   ...(!secure&&s.evidence?{flag:s.flag}:{})
  });
  return true;
 }
 if(req.method!=='POST')fail(405,'Endpoint accepts POST only');
 const input=await body(req);
 if(path==='/api/oauth/start'){
  if(Object.keys(input).length)fail(422,'start accepts an empty JSON object {}');
  send(res,200,{
   actor,
   expected_state:st.expected_state,
   registered_redirect_uri:VALID_REDIRECT,
   unregistered_test_redirect_uri:EVIL_REDIRECT,
   fixture_codes:{
    own_code:st.own_code,
    foreign_code:st.foreign_code
   }
  });
  return true;
 }
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['code','state','redirect_uri'].includes(k))){
  fail(422,'Send code, state, and redirect_uri');
 }
 const {code,state,redirect_uri:redirectUri}=input;
 if(typeof code!=='string'||typeof state!=='string'||typeof redirectUri!=='string'||code.length>120||state.length>120||redirectUri.length>160){
  fail(422,'Invalid OAuth callback field types');
 }
 if(![VALID_REDIRECT,EVIL_REDIRECT].includes(redirectUri)){
  fail(422,'redirect_uri outside synthetic OAuth fixture');
 }
 if(redirectUri!==VALID_REDIRECT){
  fail(403,'OAuthRedirectPolicy: redirect_uri tidak terdaftar pada client');
 }
 const validOwn=equal(code,st.own_code);
 const validForeign=equal(code,st.foreign_code);
 if(!validOwn&&!validForeign)fail(400,'Invalid authorization code');
 const stateMatches=equal(state,st.expected_state);
 if(secure){
  if(st.consumed||!stateMatches||!validOwn){
   fail(403,'OAuthStatePolicy: state wajib cocok satu kali dan kode harus milik alur sesi ini');
  }
  st.consumed=true;
  st.linked_subject='idp_customer_b';
  st.state_verified=true;
  send(res,200,{actor,linked_subject:st.linked_subject,state_verified:true});
  return true;
 }
 // Vulnerable: callback accepts unverified/mismatched state and links foreign authorization code!
 if(validForeign||!stateMatches){
  st.linked_subject=validForeign?'idp_customer_a':'idp_customer_b_unverified';
  st.state_verified=false;
  s.evidence=true;
  send(res,200,{
   actor,
   linked_subject:st.linked_subject,
   state_verified:false,
   cross_state_linked:true,
   flag:s.flag
  });
  return true;
 }
 st.consumed=true;
 st.linked_subject='idp_customer_b';
 st.state_verified=true;
 send(res,200,{actor,linked_subject:st.linked_subject,state_verified:true});
 return true;
}

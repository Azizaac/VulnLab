// Multi-tenant workspace boundary fixture: two fake organizations (org-alpha and org-beta).
import {send,fail} from './common.mjs';

export function provision(s){
 s.db.exec(`CREATE TABLE IF NOT EXISTS tenant_memberships(
  actor TEXT NOT NULL,tenant_id TEXT NOT NULL,role TEXT NOT NULL,PRIMARY KEY(actor,tenant_id)
 ); DELETE FROM tenant_memberships;
 CREATE TABLE IF NOT EXISTS tenant_projects(
  id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,name TEXT NOT NULL,
  classification TEXT NOT NULL,runbook_note TEXT NOT NULL
 ); DELETE FROM tenant_projects;`);
 const mem=s.db.prepare('INSERT INTO tenant_memberships VALUES(?,?,?)');
 mem.run('customer_a','org-alpha','member');
 mem.run('customer_b','org-beta','member');
 mem.run('admin','org-alpha','owner');
 mem.run('admin','org-beta','owner');
 const proj=s.db.prepare('INSERT INTO tenant_projects VALUES(?,?,?,?,?)');
 proj.run('proj-alpha-1','org-alpha','Alpha Payment Gateway Audit','confidential','ALPHA-TENANT-SECRET');
 proj.run('proj-beta-1','org-beta','Beta Storefront Hardening','internal','Checklist standar tim Beta');
 s.evidence=false;
}

export async function handle({s,req,res,url,path,actor,secure}){
 if(path!=='/api/workspaces'&&path!=='/api/workspaces/projects')return false;
 if(req.method!=='GET')fail(405,'Workspace endpoints accept GET only');
 if(path==='/api/workspaces'){
  if(url.searchParams.size)fail(422,'Workspaces list takes no query parameters');
  const memberships=s.db.prepare('SELECT tenant_id,role FROM tenant_memberships WHERE actor=? ORDER BY tenant_id').all(actor);
  const ownedProjects=s.db.prepare('SELECT id,tenant_id,name FROM tenant_projects WHERE tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE actor=?) ORDER BY id').all(actor);
  send(res,200,{
   actor,
   memberships,
   projects:ownedProjects,
   other_tenant_reference_hint:{tenant_id:'org-alpha',project_id:'proj-alpha-1'}
  });
  return true;
 }
 for(const [key,val]of url.searchParams){
  if(!['tenant_id','project_id'].includes(key)||url.searchParams.getAll(key).length!==1||!/^[a-z0-9-]{3,40}$/.test(val)){
   fail(422,'Send bounded scalar tenant_id and project_id');
  }
 }
 const tenantId=url.searchParams.get('tenant_id');
 const projectId=url.searchParams.get('project_id');
 if(!tenantId||!projectId)fail(422,'Both tenant_id and project_id are required');
 const membership=s.db.prepare('SELECT * FROM tenant_memberships WHERE actor=? AND tenant_id=?').get(actor,tenantId);
 if(!membership)fail(403,'TenantMembershipPolicy: akun tidak terdaftar pada organisasi ini');

 if(secure){
  // Secure: scopes project query by BOTH project_id AND verified tenant_id!
  const project=s.db.prepare('SELECT * FROM tenant_projects WHERE id=? AND tenant_id=?').get(projectId,tenantId);
  if(!project)fail(404,'Project tidak ditemukan dalam workspace organisasi ini');
  send(res,200,{actor,workspace:tenantId,project});
  return true;
 }
 // Vulnerable: verifies membership on tenant_id, then looks up project by id WITHOUT tenant_id scope!
 const project=s.db.prepare('SELECT * FROM tenant_projects WHERE id=?').get(projectId);
 if(!project)fail(404,'Project not found');
 const crossed=project.tenant_id!==tenantId;
 if(crossed)s.evidence=true;
 send(res,200,{
  actor,
  requested_workspace:tenantId,
  project:{
   ...project,
   runbook_note:crossed?s.flag:project.runbook_note
  },
  ...(crossed?{cross_tenant_leak:true,flag:s.flag}:{})
 });
 return true;
}

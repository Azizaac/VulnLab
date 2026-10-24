"""Check only the stored lab reference URLs; never fetch learner-supplied URLs."""
import concurrent.futures
import datetime
import json
from pathlib import Path
import urllib.request
root=Path(__file__).resolve().parents[1]
labs=json.loads((root/'database/data/labs-sprint3.json').read_text(encoding='utf-8'))
def check(lab):
    source=lab['sources'][0]
    try:
        request=urllib.request.Request(source['url'],headers={'User-Agent':'VulnLab-local-reference-check/1.0'})
        with urllib.request.urlopen(request,timeout=20)as response:
            return {'lab':lab['code'],'url':source['url'],'status':response.status,'resolved_url':response.url}
    except Exception as error:
        return {'lab':lab['code'],'url':source['url'],'status':'unverified','error':str(error)}
with concurrent.futures.ThreadPoolExecutor(max_workers=4)as pool:
    results=list(pool.map(check,labs))
report={'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'meaning':'HTTP reachability of primary references; not independent expert review.','sources':results}
(root/'docs/lab-source-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(f"Lab sources reachable: {sum(r['status']==200 for r in results)}/{len(results)}")

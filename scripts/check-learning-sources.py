"""Check stored primary reference links, without fetching links submitted by users."""
import concurrent.futures
import datetime
import json
import pathlib
import urllib.request

root = pathlib.Path(__file__).resolve().parents[1]
lessons = json.loads((root / 'database/data/lessons-v4.json').read_text(encoding='utf-8'))
sources = {source['url']: source['title'] for lesson in lessons for source in lesson['source_urls']}

def check(item):
    url, title = item
    try:
        request = urllib.request.Request(url, headers={'User-Agent': 'VulnLab-local-reference-check/1.0'})
        with urllib.request.urlopen(request, timeout=25) as response:
            return {'title': title, 'url': url, 'status': response.status, 'resolved_url': response.url}
    except Exception as error:
        return {'title': title, 'url': url, 'status': 'unverified', 'error': str(error)}

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    results = list(pool.map(check, sources.items()))
report = {'checked_at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'meaning': 'HTTP reachability only; not independent editorial or technical review.', 'sources': results}
(root / 'docs/learning-source-check.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print(f"References reachable: {sum(s['status'] == 200 for s in results)}/{len(results)}")
for result in results:
    if result['status'] != 200:
        print(result['url'], result['status'])

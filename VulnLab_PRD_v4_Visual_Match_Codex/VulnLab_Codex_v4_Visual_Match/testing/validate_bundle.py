from pathlib import Path
from collections import Counter
import json, re
ROOT=Path(__file__).resolve().parents[1]
def get(rel):return json.loads((ROOT/rel).read_text(encoding='utf-8'))
lessons=get('content/lessons.json'); questions=get('content/quizzes/question_bank.json'); labs=get('content/labs/labs.json'); days=get('planning/roadmap_90_days.json'); copy=get('content/site_copy.json')
assert len(lessons)==25, 'Expected 25 seeded lessons'
assert len(questions)==50, 'Expected 50 quiz questions'
assert len(labs)==8, 'Expected 8 lab designs'
assert len(days)==90 and [x['day'] for x in days]==list(range(1,91)), '90 sequential study days'
ids=[x['id'] for x in lessons]; slugs=[x['slug'] for x in lessons]
assert len(ids)==len(set(ids)) and len(slugs)==len(set(slugs)), 'Unique lesson ids and slugs'
assert all(x['editorial_status']=='research_draft_unreviewed' and x['reviewed_at'] is None for x in lessons), 'Truthful editorial status'
assert all(x['source_urls'] and all(y['url'].startswith('https://') for y in x['source_urls']) for x in lessons), 'Sources from official HTTPS refs'
assert all(all(section in x['body_md'] for section in ['## Inti dalam 1 menit','## Analogi sederhana','## Praktik aman','## Cara mencegah','## Referensi primer']) for x in lessons),'Pedagogical sections'
assert all(x['published'] is False for x in lessons), 'Do not claim reviewed/publicly published'
for q in questions:
 assert q['lesson_id'] in ids and len(q['options'])==4
 assert len({o['text'] for o in q['options']})==4, f'Duplicate options: {q["id"]}'
 assert q['correct_option'] in [o['id'] for o in q['options']]
 assert q['explanation'].strip()
counts=Counter(q['lesson_id'] for q in questions)
assert all(counts[x]==2 for x in ids), '2 questions per lesson'
assert all(x['lesson_id'] in ids for x in labs)
assert all(x['requires_isolation'] and x['editorial_status']=='design_spec_not_implemented' and len(x['hints'])==3 for x in labs)
assert all(x['minutes']==120 and x['theory_minutes']+x['practice_minutes']+x['reflection_minutes']==120 for x in days)
assert len(copy['nav'])>=7
assert (ROOT/'design/visual-reference.png').exists()
print('PASS bundle structural QA: 25 lessons, 50 MCQs, 8 isolated lab design specs, 90 daily tasks, themes/navigation/content copy.')
print('NOTE: This does NOT verify factual accuracy, active URLs, live Laravel functionality, sandbox isolation or automated app tests.')

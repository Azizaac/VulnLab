from pathlib import Path
import json,csv,re
root=Path(__file__).resolve().parent.parent
lessons=json.loads((root/'content/LESSON_MANIFEST.json').read_text(encoding='utf-8'))
questions=json.loads((root/'content/quizzes/NEW_QUESTION_BANK.json').read_text(encoding='utf-8'))
labs=json.loads((root/'content/labs/LAB_EXPANSION.json').read_text(encoding='utf-8'))
enrich=json.loads((root/'content/LESSON_ENRICHMENT_MATRIX.json').read_text(encoding='utf-8'))
assert (len(lessons),len(questions),len(labs),len(enrich))==(10,30,12,25)
for coll in (lessons,questions,labs): assert len(set(x['id'] for x in coll))==len(coll)
assert {x['id'] for x in lessons}=={f'N{i:03d}' for i in range(26,36)}
assert {x['id'] for x in questions}=={f'Q{i:03d}' for i in range(51,81)}
assert {x['id'] for x in labs}=={f'L{i:03d}' for i in range(9,21)}
assert {x['existing_id'] for x in enrich}=={f'L{i:03d}' for i in range(1,26)}
for l in lessons:
 p=root/l['path'];s=p.read_text(encoding='utf-8'); assert p.is_file()
 for token in ('## Ringkasan','## Contoh HTTP','## Latihan terpandu','## Cara memperbaiki','## Kesalahan umum','## Sumber primer'):
  assert token in s,(l['id'],token)
 assert not l['published'] and 'unreviewed' in l['editorial_status']
 assert all(src['url'].startswith('https://') for src in l['sources'])
for q in questions:
 assert 0<=q['correct_index']<len(q['options'])==4
 assert q['lesson_id'] in {x['id'] for x in lessons}
 assert q['explanation'] and not q['published'] and q['answer_visibility']=='server_after_attempt'
for l in lessons: assert len([q for q in questions if q['lesson_id']==l['id']])==3
for lab in labs:
 assert not lab['runtime_verified'] and lab['status']=='draft_not_implemented'
 assert lab['linked_lesson'] in {x['id'] for x in lessons}
 assert len(lab['hints'])==3
 assert all(url.startswith('https://') for url in lab['source_urls'])
assert len(set(x['slug'] for x in lessons))==10
matrix=list(csv.DictReader((root/'testing/TEST_MATRIX.csv').open(encoding='utf-8')))
assert len(matrix)>=70 and all(x['actual_status']=='NOT RUN' for x in matrix)
print('PASS: 25 legacy enrichment entries, 10 new draft lessons, 30 quiz questions, 12 unimplemented lab manifests,',len(matrix),'QA cases.')

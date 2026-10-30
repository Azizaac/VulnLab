#!/usr/bin/env python3
"""Validate source-document packaging, NOT project implementation or technical accuracy."""
from pathlib import Path
import json, csv, sys
r=Path(__file__).resolve().parents[1]
def load(p):return json.loads((r/p).read_text(encoding='utf-8'))
ls=load('content/LESSON_MANIFEST.json')
qq=load('content/quizzes/NEW_QUESTION_BANK.json')
ll=load('content/labs/LAB_EXPANSION.json')
mm=load('content/LESSON_ENRICHMENT_MATRIX.json')
assert len(ls)==10 and len(qq)==30 and len(ll)==12 and len(mm)==25
assert len({x['id'] for x in ls})==10
assert len({x['id'] for x in qq})==30
assert len({x['id'] for x in ll})==12
assert {x['id'] for x in ls}=={'N'+str(i).zfill(3) for i in range(26,36)}
assert {x['id'] for x in ll}=={'L'+str(i).zfill(3) for i in range(9,21)}
assert all(x['lesson_id'] in {l['id'] for l in ls} for x in qq)
assert all(x.get('status','').startswith('draft') and x.get('runtime_verified') is False for x in ll)
assert all(x.get('editorial_status') for x in ls)
assert len(list((r/'content/lessons').glob('N[0-9][0-9][0-9]_*.md')))==10
with (r/'testing/V9_QA_MATRIX.csv').open(encoding='utf-8',newline='') as f:
 rows=list(csv.DictReader(f))
assert len(rows)>=150 and all(x['status']=='NOT_RUN' for x in rows)
for p in ['MASTER_PRD_V9.md','CODEX_ONE_SHOT_PROMPT.md','design/APPROVED_PRE_V8_ROADMAP.png','design/REJECTED_V8_ROADMAP.png']:
 assert (r/p).is_file(),p
print('PACKAGE STRUCTURE PASS (not application QA): 10 lesson drafts, 30 question drafts, 12 lab draft manifests, 25 enrichment targets, %s unexecuted QA cases' % len(rows))

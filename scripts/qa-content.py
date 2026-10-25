"""Structural QA of versioned curriculum; never connects to the learner DB."""
import hashlib
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path


def load(name):
    return json.loads((Path('database/data') / name).read_text(encoding='utf-8'))


lessons, questions, labs, days = [load(name) for name in (
    'lessons-v4.json', 'questions-v4.json', 'labs-sprint3.json', 'roadmap-v4.json')]
assert (len(lessons), len(questions), len(labs), len(days)) == (25, 50, 8, 90)
ids = {row['id'] for row in lessons}
slugs = {row['slug'] for row in lessons}
assert len(ids) == len(slugs) == 25
assert len({q['id'] for q in questions}) == 50
assert all(value == 2 for value in Counter(q['lesson_id'] for q in questions).values())
for question in questions:
    choices = question['options']
    assert question['lesson_id'] in ids
    assert 2 <= len(choices) <= 6 and len({c['id'] for c in choices}) == len(choices)
    assert sum(c['id'] == question['correct_option'] for c in choices) == 1
    assert question['explanation'].strip() and question['source_ids']
for lesson in lessons:
    assert lesson['body_md'].strip() and lesson['source_urls']
    assert all(source['url'].startswith('https://') for source in lesson['source_urls'])
    assert set(lesson['quiz_ids']) == {q['id'] for q in questions if q['lesson_id'] == lesson['id']}
    assert all(pre in ids for pre in lesson['prerequisites'])


def visit(lesson_id, stack):
    assert lesson_id not in stack, 'Prerequisite cycle'
    for pre in next(row for row in lessons if row['id'] == lesson_id)['prerequisites']:
        visit(pre, stack | {lesson_id})


for lesson_id in ids:
    visit(lesson_id, set())
assert all(lab['lesson_slug'] in slugs and lab['scenario_md'] and lab['objectives'] for lab in labs)
assert {day['day'] for day in days} == set(range(1, 91))
assert all(day['theory_minutes'] + day['practice_minutes'] + day['reflection_minutes'] == 120 for day in days)
report = {
    'checked_at': datetime.now(timezone.utc).isoformat(),
    'scope': 'Versioned starter curriculum structural review; source reachability and semantic review documented separately. Not independent human approval.',
    'counts': {'lessons': 25, 'questions': 50, 'labs': 8, 'roadmap_days': 90},
    'checks': ['unique IDs/slugs', 'two single-choice questions per lesson', 'one valid key and explanation', 'HTTPS references', 'complete lesson/question links', 'acyclic prerequisites', 'linked lab scenarios', '90 unique days at 120 minutes'],
    'independent_expert_approvals_added': 0,
    'lessons': [{'id': row['id'], 'slug': row['slug'], 'title': row['title'], 'body_sha256': hashlib.sha256(row['body_md'].encode()).hexdigest(), 'editorial_status': row['editorial_status'], 'reviewed_at': row['reviewed_at'], 'clarification': row['id'] in ('L006', 'L025')} for row in lessons],
}
Path('docs/qa/content-results.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('Structural content QA passed: 25 lessons, 50 questions, 8 labs, 90 days; no learner records changed.')

<?php

// Read-only summary of the V9 lesson manifest and question bank drafts.
$root = __DIR__.'/../docs/vulnlab-v9/content';
$lessons = json_decode(file_get_contents($root.'/LESSON_MANIFEST.json'), true, 512, JSON_THROW_ON_ERROR);
$questions = json_decode(file_get_contents($root.'/quizzes/NEW_QUESTION_BANK.json'), true, 512, JSON_THROW_ON_ERROR);

foreach ($lessons as $l) {
    printf("%s  %-38s %-46s lvl=%-6s min=%2d prereqs=%s\n", $l['id'], $l['slug'], $l['title'], $l['level'], $l['minutes'], implode(',', $l['prereqs']));
}
printf("\nlessons=%d questions=%d\n", count($lessons), count($questions));

$byLesson = [];
foreach ($questions as $q) {
    $byLesson[$q['lesson_id']] = ($byLesson[$q['lesson_id']] ?? 0) + 1;
}
ksort($byLesson);
echo 'questions per lesson: ';
foreach ($byLesson as $k => $v) {
    echo "$k=$v ";
}
echo PHP_EOL;

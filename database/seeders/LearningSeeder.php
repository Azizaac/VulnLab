<?php

namespace Database\Seeders;

use App\Models\ContentEntry;
use App\Models\LabSpec;
use App\Models\LearningPath;
use App\Models\Lesson;
use App\Models\LessonSource;
use App\Models\Module;
use App\Models\QuizChoice;
use App\Models\QuizQuestion;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LearningSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $managedLessons = ContentEntry::where('kind', 'lesson')->where('is_managed', true)->pluck('subject_id')->all();
            $managedQuizzes = ContentEntry::where('kind', 'quiz')->where('is_managed', true)->pluck('subject_id')->all();
            $courses = [
                ['Web Security Fundamentals', 'Bangun cara berpikir keamanan dari browser hingga perbaikan server.', [1, 5, 15, 16, 17, 25]],
                ['HTTP, Cookies & Sessions', 'Baca percakapan web dan pahami bagaimana sesi bekerja.', [2, 3, 4]],
                ['Authentication & Authorization', 'Pisahkan identitas, izin, dan siklus hidup sesi.', [7, 8, 12]],
                ['Access Control & IDOR', 'Periksa hak objek dan fungsi dengan akun dummy yang berbeda.', [9, 10, 11]],
                ['Cross-Site Scripting (XSS)', 'Jaga batas data dan kode di browser.', [13]],
                ['SQL Injection', 'Pahami query terparameter dan pengujian aman.', [14]],
                ['API Security Fundamentals', 'Validasi resource, field, dan resolver API.', [6, 21, 22]],
                ['JWT & API Authentication', 'Baca token tanpa menyamakan decode dengan verifikasi.', [20]],
                ['Business Logic Vulnerabilities', 'Uji invariant dan alur bisnis secara terkendali.', [18]],
                ['Reconnaissance & Bug Bounty Methodology', 'Mulai dari scope, petakan request, lalu laporkan bukti minimum.', [19, 23, 24]],
            ];
            $enrichment = $this->data('lesson-enrichment.json');
            $modules = [];
            foreach ($courses as $index => [$title,$description,$numbers]) {
                $outcomes = array_map(fn ($n) => $enrichment[sprintf('L%03d', $n)]['objectives'][0], $numbers);
                $path = LearningPath::firstOrCreate(['slug' => Str::slug($title)], ['title' => $title, 'description' => $description, 'is_course' => true, 'outcomes' => json_encode($outcomes), 'sort_order' => $index + 1]);
                $module = Module::firstOrCreate(['learning_path_id' => $path->id, 'sort_order' => 1], ['title' => 'Konsep & praktik terarah']);
                foreach ($numbers as $n) {
                    $modules[sprintf('L%03d', $n)] = $module->id;
                }
            }
            $original = $this->data('lessons-v4.json');
            $lessons = [];
            foreach ($original as $row) {
                $lesson = Lesson::withoutGlobalScopes()->firstOrCreate(['source_id' => $row['id']], ['module_id' => $modules[$row['id']], 'slug' => $row['slug'], 'title' => $row['title'], 'difficulty' => $row['level'], 'estimated_minutes' => $row['estimated_minutes'], 'sort_order' => (int) substr($row['id'], 1), 'body_md' => $row['body_md'], 'enrichment' => $enrichment[$row['id']], 'source_snapshot' => $row, 'editorial_status' => $row['editorial_status'], 'authored_at' => $row['authored_at'], 'reviewed_at' => null]);
                $lessons[$row['id']] = $lesson;
                if (in_array($lesson->id, $managedLessons)) {
                    continue;
                }
                $supplement = $lesson->enrichment + $enrichment[$row['id']];
                if ($supplement !== $lesson->enrichment) {
                    $lesson->update(['enrichment' => $supplement]);
                }
                foreach ($row['source_urls'] as $source) {
                    LessonSource::firstOrCreate(['lesson_id' => $lesson->id, 'title' => $source['title']], ['url' => $source['url']]);
                }
            }
            foreach ($original as $row) {
                if (in_array($lessons[$row['id']]->id, $managedLessons)) {
                    continue;
                }
                $lessons[$row['id']]->prerequisites()->syncWithoutDetaching(array_map(fn ($key) => $lessons[$key]->id, $row['prerequisites']));
            }
            foreach ($this->data('questions-v4.json') as $row) {
                if (in_array($lessons[$row['lesson_id']]->id, $managedQuizzes)) {
                    continue;
                }
                $q = QuizQuestion::firstOrCreate(['source_id' => $row['id']], ['lesson_id' => $lessons[$row['lesson_id']]->id, 'question' => $row['question'], 'explanation' => $row['explanation'], 'points' => $row['points']]);
                foreach (collect($row['options'])->shuffle() as $option) {
                    QuizChoice::firstOrCreate(['quiz_question_id' => $q->id, 'source_key' => $option['id']], ['text' => $option['text'], 'is_correct' => $row['correct_option'] === $option['id']]);
                }
            }
            foreach ($this->data('lab-specs-v4.json') as $row) {
                LabSpec::firstOrCreate(['slug' => $row['slug']], ['title' => $row['title'], 'lesson_id' => $lessons[$row['slug'] === 'profile-mass-assignment' ? 'L021' : $row['lesson_id']]->id, 'difficulty' => $row['difficulty'], 'goal' => $row['goal']]);
            }
            // Explicit curriculum crosswalk: separate from personal schedule snapshots and checklist evidence.
            $crosswalk = [1, 2, 3, 1, 4, 1, 1, 4, 8, 6, 6, 5, 6, 6, 7, 8, 7, 7, 12, 12, 7, 9, 9, 9, 10, 10, 10, 9, 11, 11, 11, 21, 21, 25, 21, 13, 13, 13, 15, 15, 13, 13, 14, 14, 14, 18, 18, 18, 18, 20, 20, 20, 22, 22, 22, 22, 23, 23, 6, 6, 19, 23, 23, 9, 10, 11, 21, 25, 25, 25, 13, 14, 18, 16, 16, 16, 16, 24, 24, 24, 24, 24, 24, 24, 6, 7, 13, 17, 25, 24];
            foreach ($crosswalk as $index => $n) {
                DB::table('roadmap_lesson_links')->insertOrIgnore(['day_number' => $index + 1, 'lesson_id' => $lessons[sprintf('L%03d', $n)]->id]);
            }
        });
    }

    private function data(string $name): array
    {
        return json_decode(file_get_contents(database_path('data/'.$name)), true, 512, JSON_THROW_ON_ERROR);
    }
}

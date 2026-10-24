<?php

namespace Database\Seeders;

use App\Models\Lab;
use App\Models\LabCategory;
use App\Models\LabHint;
use App\Models\LabInstruction;
use App\Models\LabSpec;
use App\Models\Lesson;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LabSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            foreach (json_decode(file_get_contents(database_path('data/labs-sprint3.json')), true, 512, JSON_THROW_ON_ERROR) as $row) {
                $lesson = Lesson::where('slug', $row['lesson_slug'])->firstOrFail();
                $category = LabCategory::firstOrCreate(['name' => $row['category']]);
                $spec = LabSpec::firstOrCreate(['slug' => $row['slug']], ['title' => $row['title'], 'lesson_id' => $lesson->id, 'difficulty' => $row['difficulty'], 'goal' => $row['objectives'][0]]);
                $data = collect($row)->except('instructions', 'hints', 'category', 'lesson_slug')->all();
                $data += ['lesson_id' => $lesson->id, 'lab_category_id' => $category->id, 'lab_spec_id' => $spec->id];
                $lab = Lab::firstOrCreate(['slug' => $row['slug']], $data);
                if ($row['enabled'] && ! $lab->enabled) {
                    $lab->update(['enabled' => true]);
                }
                foreach ($row['instructions'] as $i => $text) {
                    LabInstruction::firstOrCreate(['lab_id' => $lab->id, 'position' => $i + 1], ['body' => $text]);
                }
                foreach ($row['hints'] as $i => $text) {
                    LabHint::firstOrCreate(['lab_id' => $lab->id, 'level' => $i + 1], ['body' => $text]);
                }
            }
        });
    }
}

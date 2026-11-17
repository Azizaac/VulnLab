<?php

namespace App\Services;

use App\Models\Lab;
use App\Models\LabCategory;
use App\Models\LabHint;
use App\Models\LabInstruction;
use App\Models\LabSpec;
use App\Models\Lesson;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use RuntimeException;

class V9LabCatalog
{
    public function import(User $editor): int
    {
        Gate::forUser($editor)->authorize('content.edit');
        abort_unless(app()->environment(['local', 'testing']), 403, 'Katalog V9 hanya untuk pengembangan lokal.');
        $rows = json_decode(file_get_contents(database_path('data/labs-v9.json')), true, 512, JSON_THROW_ON_ERROR);

        return DB::transaction(function () use ($rows, $editor) {
            $created = 0;
            foreach ($rows as $row) {
                $lesson = Lesson::withoutGlobalScopes()->where('source_id', $row['lesson_source_id'])->firstOrFail();
                if (Lab::withoutGlobalScopes()->where('code', $row['code'])->where('slug', '!=', $row['slug'])->exists()) {
                    throw new RuntimeException('Lab code collision: '.$row['code']);
                }
                $category = LabCategory::firstOrCreate(['name' => $row['category']]);
                $spec = LabSpec::firstOrCreate(['slug' => $row['slug']], ['title' => $row['title'], 'lesson_id' => $lesson->id, 'difficulty' => $row['difficulty'], 'goal' => $row['objectives'][0]]);
                $data = collect($row)->except(['lesson_source_id', 'category', 'instructions', 'hints'])->all();
                $lab = Lab::withoutGlobalScopes()->firstOrCreate(['slug' => $row['slug']], [...$data, 'enabled' => false, 'lesson_id' => $lesson->id, 'lab_category_id' => $category->id, 'lab_spec_id' => $spec->id]);
                if (! $lab->wasRecentlyCreated) {
                    continue;
                }
                foreach ($row['instructions'] as $index => $text) {
                    LabInstruction::create(['lab_id' => $lab->id, 'position' => $index + 1, 'body' => $text]);
                }
                foreach ($row['hints'] as $index => $text) {
                    LabHint::create(['lab_id' => $lab->id, 'level' => $index + 1, 'body' => $text]);
                }
                StudioAccess::audit($editor, 'lab.v9_draft_imported', 'lab', $lab->id);
                $created++;
            }

            return $created;
        });
    }

    public function register(User $editor, array $receipt): int
    {
        Gate::forUser($editor)->authorize('content.edit');
        abort_unless(app()->environment(['local', 'testing']), 403);
        $registry = app(LabRuntimeRegistry::class);
        if (($receipt['status'] ?? null) !== 'PASS' || ! is_string($receipt['runtime_revision'] ?? null) || ! hash_equals($registry->revision(), $receipt['runtime_revision']) || empty($receipt['labs'])) {
            throw new RuntimeException('Receipt must pass for the installed runtime revision.');
        }
        $verifiedAt = Carbon::parse($receipt['checked_at']);
        if ($verifiedAt->isFuture()) {
            throw new RuntimeException('Verification timestamp cannot be in the future.');
        }

        return DB::transaction(function () use ($receipt, $verifiedAt, $registry, $editor) {
            $count = 0;
            foreach ($receipt['labs'] as $slug => $checks) {
                $lab = Lab::withoutGlobalScopes()->where('slug', $slug)->lockForUpdate()->firstOrFail();
                if (! $registry->expansion($lab)) {
                    throw new RuntimeException('Not a V9 expansion lab: '.$slug);
                }
                foreach (LabRuntimeRegistry::CHECKS as $check) {
                    if (($checks[$check] ?? null) !== true) {
                        throw new RuntimeException("Missing verification $check for $slug");
                    }
                }
                $count += DB::table('lab_runtime_verifications')->insertOrIgnore(['lab_id' => $lab->id, 'runtime_revision' => $receipt['runtime_revision'], 'checks_json' => json_encode($checks, JSON_THROW_ON_ERROR), 'verified_at' => $verifiedAt]);
                $lab->update(['enabled' => true]);
                StudioAccess::audit($editor, 'lab.validated_local', 'lab', $lab->id, ['runtime_revision' => $receipt['runtime_revision'], 'verified_at' => $verifiedAt->toIso8601String()]);
            }

            return $count;
        });
    }
}

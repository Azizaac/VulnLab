<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use RuntimeException;

class V9ContentImporter
{
    private const COURSES = [
        'N026' => 'authentication-authorization',
        'N027' => 'authentication-authorization',
        'N028' => 'web-security-fundamentals',
        'N029' => 'web-security-fundamentals',
        'N030' => 'api-security-fundamentals',
        'N031' => 'web-security-fundamentals',
        'N032' => 'web-security-fundamentals',
        'N033' => 'authentication-authorization',
        'N034' => 'business-logic-vulnerabilities',
        'N035' => 'api-security-fundamentals',
    ];

    public function __construct(private ExpansionV71Importer $expansion, private V9LessonEnrichmentImporter $enrichment) {}

    public function import(User $editor): array
    {
        Gate::forUser($editor)->authorize('content.edit');
        $review = json_decode(file_get_contents(database_path('data/v9-expansion-review.json')), true, 512, JSON_THROW_ON_ERROR);
        $this->keys(array_column($review['lessons'], 'source_id'), array_keys(self::COURSES));
        $questionKeys = array_map(fn ($n) => sprintf('Q%03d', $n), range(51, 80));
        $this->keys(array_keys($review['question_sources']), $questionKeys);
        $this->keys(array_column($review['question_review'], 'source_id'), $questionKeys);
        $review['lessons'] = collect($review['lessons'])->keyBy('source_id')->all();
        $review['question_review'] = collect($review['question_review'])->keyBy('source_id')->all();
        foreach ($review['lessons'] as &$lesson) {
            $lesson['full_sources'] = $lesson['sources'];
            foreach ($lesson['sources'] as &$source) {
                if (mb_strlen($source['license']) > 180) {
                    $source['license'] = 'Metadata lisensi dan pembatasan lengkap: provenance impor V9. Belum disetujui reviewer manusia.';
                }
            }
            unset($source);
        }
        unset($lesson);
        // State correlates a flow; OAuth mix-up also requires issuer/AS binding.
        // Correct the imported draft only, preserving the kit and stable answer key.
        $review['question_explanations'] = [
            'Q072' => 'State mengaitkan callback dengan alur yang dimulai sesi yang sama dan membantu mencegah CSRF. State saja tidak cukup untuk mencegah OAuth mix-up multi-provider; diperlukan pengikatan issuer/authorization server atau callback terpisah sesuai RFC 9700 bagian 4.4.2.',
        ];
        $modules = [];
        foreach (self::COURSES as $id => $slug) {
            $candidates = DB::table('modules as m')->join('learning_paths as p', 'p.id', '=', 'm.learning_path_id')
                ->where('p.slug', $slug)->where('p.is_course', true)->where('p.catalog_visible', true)->where('m.catalog_visible', true)->pluck('m.id');
            if ($candidates->count() !== 1) {
                throw new RuntimeException("Expected one visible course module for $id ($slug)");
            }
            $modules[$id] = (int) $candidates->first();
        }

        return DB::transaction(fn () => [
            'baseline' => $this->enrichment->import($editor),
            'expansion' => $this->expansion->import($editor, $modules, $review['question_sources'], $review),
        ]);
    }

    private function keys(array $actual, array $expected): void
    {
        sort($actual);
        sort($expected);
        if ($actual !== $expected) {
            throw new RuntimeException('V9 source IDs are missing or duplicated; import stopped.');
        }
    }
}

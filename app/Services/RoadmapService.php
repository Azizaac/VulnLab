<?php

namespace App\Services;

use App\Models\ActivityEvent;
use App\Models\LabProgress;
use App\Models\Phase;
use App\Models\RoadmapDay;
use App\Models\RoadmapItem;
use App\Models\RoadmapPlan;
use App\Models\User;
use App\Models\UserTaskProgress;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class RoadmapService
{
    public function create(User $user, string $startsOn, string $timezone): RoadmapPlan
    {
        return DB::transaction(function () use ($user, $startsOn, $timezone) {
            User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            if ($existing = RoadmapPlan::where('user_id', $user->id)->first()) {
                return $existing;
            }
            $templates = DB::table('roadmap_day_templates')->orderBy('day_number')->get();
            if ($templates->count() !== 90) {
                throw ValidationException::withMessages(['starts_on' => 'Kurikulum belum siap. Jalankan database seeder, lalu coba lagi.']);
            }
            $plan = RoadmapPlan::create(['user_id' => $user->id, 'starts_on' => $startsOn, 'timezone' => $timezone]);
            $user->update(['timezone' => $timezone]);
            $previous = null;
            foreach ($templates as $template) {
                $date = CarbonImmutable::parse($startsOn, $timezone)->addDays($template->day_number - 1);
                $day = $plan->days()->create([
                    'week_id' => $template->week_id, 'day_number' => $template->day_number, 'scheduled_on' => $date->toDateString(),
                    'title' => $template->title, 'objective' => $template->objective,
                    'source_actions' => $template->source_actions ? json_decode($template->source_actions, true, 512, JSON_THROW_ON_ERROR) : null,
                ]);
                $mode = match ($date->dayOfWeekIso) {
                    1 => 'Teori dan contoh', 2 => 'Latihan pertanyaan mandiri', 3 => 'Simulasi skenario dummy',
                    4 => 'Rancangan perbaikan', 5 => 'Analisis kasus lanjutan', 6 => 'Draf laporan dan catatan', 7 => 'Review ringan dan rekap',
                };
                $theory = $day->items()->create([
                    'sort_order' => 1, 'category' => 'theory', 'title' => $template->title, 'estimated_minutes' => 20,
                    'description' => $date->isSunday()
                        ? 'Review ringan: baca ulang catatan sendiri tentang '.$template->title.'. Jelaskan kembali tanpa melihat catatan, lalu tandai bagian yang masih membingungkan.'
                        : $template->objective.' Buka lesson dan kuis terkait. Buat analogi sederhana dan ringkasan tiga poin.',
                    'prerequisite_item_id' => $previous,
                ]);
                $practice = $day->items()->create([
                    'sort_order' => 2, 'category' => 'practice', 'title' => $mode.': '.$template->title, 'estimated_minutes' => 70,
                    'description' => $date->isSunday()
                        ? 'Tanpa materi baru: tinjau diagram dan contoh minggu ini selama 70 menit dengan jeda. Perbaiki satu penjelasan, tulis tiga pertanyaan refleksi, dan jawab memakai catatan sendiri.'
                        : $mode.'. Gambarkan request/response atau matriks izin dengan dua identitas dummy di catatan lokal. Tuliskan expected/actual dan mitigasi. Untuk hari 61–90, susun scope, bukti minimal, atau laporan simulasi dari contoh tersebut. Tidak ada target aktif; jangan mengirim request ke sistem pihak lain. Lab runtime tidak diperlukan untuk checklist ini.',
                    'prerequisite_item_id' => $theory->id,
                ]);
                $review = $day->items()->create([
                    'sort_order' => 3, 'category' => 'review', 'title' => 'Catatan & review: '.$template->title, 'estimated_minutes' => 30,
                    'description' => 'Simpan catatan di editor lokal pilihanmu: tujuan, tiga hal yang dipahami, satu hal yang belum jelas, dan rencana besok. Gunakan data dummy dan redaksi rahasia. Tandai direview setelah dikerjakan; waktu ini merupakan estimasi, bukan perhatian yang diverifikasi.',
                    'prerequisite_item_id' => $practice->id,
                ]);
                $this->applySourceActions($day, $date);
                $previous = $review->id;
            }

            return $plan;
        });
    }

    public function reschedule(User $user, string $startsOn, string $timezone): void
    {
        DB::transaction(function () use ($user, $startsOn, $timezone) {
            User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            $plan = RoadmapPlan::where('user_id', $user->id)->firstOrFail();
            $plan->update(['starts_on' => $startsOn, 'timezone' => $timezone]);
            // Clear dates first to avoid transient conflicts with the unique date constraint.
            $days = $plan->days()->get();
            foreach ($days as $day) {
                $day->update(['scheduled_on' => CarbonImmutable::parse('2200-01-01')->addDays($day->day_number)->toDateString()]);
            }
            foreach ($days as $day) {
                $date = CarbonImmutable::parse($startsOn, $timezone)->addDays($day->day_number - 1);
                $day->update(['scheduled_on' => $date->toDateString()]);
                $mode = match ($date->dayOfWeekIso) {
                    1 => 'Teori dan contoh', 2 => 'Latihan pertanyaan mandiri', 3 => 'Simulasi skenario dummy',
                    4 => 'Rancangan perbaikan', 5 => 'Analisis kasus lanjutan', 6 => 'Draf laporan dan catatan', 7 => 'Review ringan dan rekap',
                };
                foreach ($day->items()->where('status', '!=', 'completed')->get() as $item) {
                    if ($item->category === 'theory') {
                        $item->update(['description' => $date->isSunday() ? 'Review ringan: baca ulang catatan sendiri tentang '.$day->title.'. Jelaskan kembali tanpa melihat catatan dan tandai bagian yang belum jelas.' : $day->objective.' Buat analogi dan ringkasan tiga poin di catatan lokal.']);
                    } elseif ($item->category === 'practice') {
                        $item->update(['title' => $mode.': '.$day->title, 'description' => $date->isSunday() ? 'Tanpa materi baru: tinjau diagram dan contoh minggu ini selama 70 menit dengan jeda. Perbaiki satu penjelasan dan jawab tiga pertanyaan refleksi.' : $mode.'. Buat diagram request/response atau matriks izin dua identitas dummy. Catat expected/actual dan mitigasi. Untuk hari 61–90, buat scope dan laporan simulasi. Jangan menguji sistem pihak lain; checklist tidak memerlukan runtime lab.']);
                    }
                }
                $this->applySourceActions($day, $date);
            }
            $user->update(['timezone' => $timezone]);
        });
    }

    private function applySourceActions(RoadmapDay $day, CarbonImmutable $date): void
    {
        if (! $day->source_actions) {
            return;
        }
        foreach ($day->items()->where('status', '!=', 'completed')->get() as $item) {
            $sourceKey = match ($item->category) {
                'theory' => 'theory_action', 'practice' => 'practice_action', default => 'reflection_action',
            };
            if ($date->isSunday() && $item->category !== 'review') {
                continue; // Preserve the existing calendar-aware lighter Sunday review.
            }
            $adaptation = match ($item->category) {
                'theory' => ' Buka lesson dan kuis terkait, lalu buat analogi dan ringkasan tiga poin pada Catatan.',
                'practice' => ' Gunakan tautan lab terkait bila tersedia dan sandbox lokal aktif; bandingkan vulnerable dengan secure. Alternatif mandiri: gambar request/response atau matriks izin dua akun dummy, prediksi hasil, dan tulis mitigasi. Pengujian hanya di sandbox lokal. Checklist tetap terpisah dari validasi lab.',
                default => ' Simpan refleksi di Catatan VulnLab atau editor lokal pilihanmu. Checklist tidak memberi XP atau bukti kelulusan kuis/lab.',
            };
            $item->update(['description' => $day->source_actions[$sourceKey].$adaptation]);
        }
    }

    public function update(User $user, RoadmapItem $item, string $status): void
    {
        Gate::forUser($user)->authorize('update', $item);
        DB::transaction(function () use ($user, $item, $status) {
            User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            $item->refresh();
            if ($item->task_type !== 'checklist') {
                throw ValidationException::withMessages(['status' => 'Lesson dan lab hanya selesai melalui validasi server.']);
            }
            if ($item->status === 'completed' || $item->status === $status) {
                return;
            }
            if ($item->prerequisite_item_id && RoadmapItem::findOrFail($item->prerequisite_item_id)->status !== 'completed') {
                throw ValidationException::withMessages(['status' => 'Selesaikan prasyarat terlebih dahulu.']);
            }
            $item->update(['status' => $status, 'completed_at' => $status === 'completed' ? now() : null]);
            ActivityEvent::create([
                'user_id' => $user->id, 'event_type' => $status === 'completed' ? 'checklist_reviewed' : 'checklist_started',
                'metadata_json' => ['item_id' => $item->id, 'plan_id' => $item->day->plan_id, 'title' => $item->title], 'created_at' => now(),
            ]);
        });
    }

    public function overview(User $user): array
    {
        $lessonSummaries = app(LearningService::class)->summaries($user);
        $lessonMap = $lessonSummaries->keyBy('id');
        $lessonLinks = DB::table('roadmap_lesson_links')->pluck('lesson_id', 'day_number');
        $labCards = app(LabService::class)->catalog($user);
        $labsByLesson = $labCards->keyBy(fn ($l) => $l['lesson']['id']);
        $plan = RoadmapPlan::where('user_id', $user->id)->with('days.items')->first();
        $today = CarbonImmutable::now($plan?->timezone ?? $user->timezone)->toDateString();
        $items = $plan?->days->flatMap->items->keyBy('id') ?? collect();
        $days = $plan?->days->keyBy('day_number') ?? collect();
        $phases = Phase::with('weeks')->orderBy('sort_order')->get()->map(fn ($phase) => [
            'id' => $phase->id, 'title' => $phase->title, 'category' => $phase->category, 'milestone' => $phase->milestone,
            'weeks' => $phase->weeks->map(fn ($week) => [
                'id' => $week->id, 'number' => $week->week_number, 'title' => $week->title,
                'tasks' => $days->where('week_id', $week->id)->flatMap(fn ($day) => $day->items->map(fn ($item) => [
                    'id' => $item->id, 'title' => $item->title, 'description' => $item->description,
                    'type' => $item->category === 'practice' ? 'practice' : 'reading', 'task_type' => $item->task_type,
                    'minutes' => $item->estimated_minutes, 'day' => $day->day_number, 'week' => $week->week_number,
                    'phase_id' => $phase->id, 'date' => $day->scheduled_on->toDateString(), 'objective' => $day->objective,
                    'prerequisite' => $items->get($item->prerequisite_item_id)?->title, 'deferred' => false,
                    'status' => $item->status === 'available' && $item->prerequisite_item_id && $items->get($item->prerequisite_item_id)?->status !== 'completed' ? 'locked' : $item->status,
                    'completed_at' => $item->completed_at?->toIso8601String(),
                    'lesson' => $lessonMap->get($lessonLinks->get($day->day_number)),
                    'lab' => $item->category === 'practice' ? $labsByLesson->get($lessonLinks->get($day->day_number)) : null,
                ]))->values(),
            ])->values(),
        ])->filter(fn ($phase) => $phase['weeks']->contains(fn ($week) => $week['tasks']->isNotEmpty()))->values();
        $tasks = $phases->flatMap(fn ($phase) => $phase['weeks']->flatMap(fn ($week) => $week['tasks']));
        $done = $tasks->where('status', 'completed');
        $next = $tasks->firstWhere('status', 'in_progress') ?? $tasks->firstWhere('status', 'available');
        $todayDay = $days->first(fn ($day) => $day->scheduled_on->toDateString() === $today);
        $legacy = UserTaskProgress::where('user_id', $user->id)->where('status', 'done')->join('roadmap_tasks', 'roadmap_tasks.id', '=', 'user_task_progress.roadmap_task_id')->select('roadmap_tasks.title', 'user_task_progress.completed_at')->get();

        return [
            'nextLesson' => $lessonSummaries->first(fn ($l) => ! $l['completed'] && ! $l['locked']),
            'nextLab' => $labCards->first(fn ($lab) => $lab['status'] !== 'solved' && $lab['available']),
            'plan' => $plan ? ['starts_on' => $plan->starts_on->toDateString(), 'timezone' => $plan->timezone, 'ends_on' => $days->last()->scheduled_on->toDateString()] : null,
            'today' => ['date' => $today, 'day' => $todayDay?->day_number, 'tasks' => $tasks->where('date', $today)->values()],
            'phases' => $phases, 'nextTask' => $next, 'recommendations' => $tasks->where('status', 'available')->take(3)->values(),
            'stats' => [
                'total' => $tasks->count(), 'completed' => $done->count(), 'percent' => $tasks->isEmpty() ? 0 : round($done->count() / $tasks->count() * 100, 1),
                'remaining_hours' => round($tasks->where('status', '!=', 'completed')->sum('minutes') / 60, 1),
                'current_week' => $next['week'] ?? ($plan ? 13 : 0),
                'days_completed' => $days->filter(fn ($day) => $day->items->every(fn ($item) => $item->status === 'completed'))->count(),
                'days_studied' => $done->map(fn ($item) => CarbonImmutable::parse($item['completed_at'])->timezone($plan->timezone)->toDateString())->unique()->count(),
                'estimated_reviewed_minutes' => $done->sum('minutes'),
                // Quiz, verified sessions, lab solves and their awards start in later sprints.
                'verified_minutes' => 0, 'lessons_completed' => $lessonSummaries->where('completed', true)->count(), 'labs_solved' => LabProgress::where('user_id', $user->id)->count(), 'streak' => 0, 'xp' => (int) DB::table('xp_events')->where('user_id', $user->id)->sum('points'), 'learning_hours' => 0,
            ],
            'activities' => ActivityEvent::where('user_id', $user->id)->whereIn('event_type', ['checklist_reviewed', 'checklist_started', 'lesson_read', 'lesson_completed', 'lab_solved'])->latest('id')->limit(5)->get()->map(fn ($event) => [
                'id' => $event->id, 'type' => $event->event_type, 'title' => $event->metadata_json['title'], 'at' => $event->created_at->toIso8601String(),
            ]),
            'legacyProgress' => $legacy,
        ];
    }
}

<?php

namespace App\Services;

use App\Models\Lab;
use App\Models\LearningActivityEvent;
use App\Models\Lesson;
use App\Models\Module;
use App\Models\QuizAttempt;
use App\Models\RoadmapPlan;
use App\Models\User;
use Carbon\CarbonImmutable;

class ProgressService
{
    private const SKILLS = [
        'web_fundamentals' => ['Web Fundamentals', ['client-server', 'http-methods', 'status-headers', 'cookies-sessions', 'origin-cors', 'rest-api-json'], []],
        'authentication' => ['Authentication', ['authentication-authorization', 'session-lifecycle', 'cookies-sessions', 'jwt-fundamentals'], ['jwt-validation']],
        'access_control' => ['Access Control', ['idor', 'bola', 'bfla', 'csrf'], ['order-idor', 'address-bola', 'admin-bfla']],
        'api_security' => ['API Security', ['rest-api-json', 'bola', 'bfla', 'jwt-fundamentals', 'mass-assignment', 'graphql-intro'], ['address-bola', 'profile-mass-assignment', 'jwt-validation', 'admin-bfla']],
        'injection' => ['Injection', ['xss-basics', 'sql-injection', 'input-validation'], ['search-xss', 'product-sqli']],
        'business_logic' => ['Business Logic', ['business-logic'], ['coupon-logic']],
        'reconnaissance' => ['Reconnaissance', ['scoping-recon', 'burp-repeater'], []],
        'reporting' => ['Reporting', ['vuln-reporting'], []],
    ];

    public function __construct(private LearningEventService $events) {}

    public function overview(User $user, string $period = '7'): array
    {
        $timezone = $user->timezone ?: 'Asia/Jakarta';
        $today = CarbonImmutable::now($timezone)->startOfDay();
        $events = LearningActivityEvent::where('user_id', $user->id)->where('occurred_at', '<=', now())->orderBy('occurred_at')->get();
        $completedIds = $events->where('event_type', 'lesson_completed')->pluck('subject_id');
        $quizIds = $events->where('event_type', 'quiz_passed')->pluck('subject_id');
        $labsSolved = $events->where('event_type', 'lab_solved')->pluck('subject_id');
        $modules = Module::with('lessons:id,module_id')->get();
        $plan = RoadmapPlan::where('user_id', $user->id)->with('days.items')->first();
        $items = $plan?->days->flatMap->items ?? collect();
        $completedDays = $plan?->days->filter(fn ($day) => $day->items->isNotEmpty() && $day->items->every(fn ($item) => $item->status === 'completed'))->count() ?? 0;
        $totalDays = $plan?->days->count() ?? 0;
        $start = $period === 'all'
            ? ($events->first()?->occurred_at->timezone($timezone)->startOfDay() ?? $today->subDays(6))
            : $today->subDays((int) $period - 1);
        $buckets = $events->groupBy(fn ($event) => $event->occurred_at->timezone($timezone)->toDateString());
        $activity = [];
        for ($date = $start; $date->lessThanOrEqualTo($today); $date = $date->addDay()) {
            $bucket = $buckets->get($date->toDateString(), collect());
            $activity[] = ['date' => $date->toDateString(), 'lessons' => $bucket->where('event_type', 'lesson_completed')->count(), 'quizzes' => $bucket->where('event_type', 'quiz_passed')->count(), 'labs' => $bucket->where('event_type', 'lab_solved')->count(), 'reports' => $bucket->where('event_type', 'report_accepted_for_practice')->count(), 'study_minutes' => 0];
        }
        $nextLesson = app(LearningService::class)->summaries($user)->first(fn ($lesson) => ! $lesson['completed'] && ! $lesson['locked']);
        $nextAction = $nextLesson ? ['label' => 'Lanjutkan: '.$nextLesson['title'], 'href' => '/learning/'.$nextLesson['slug']] : ['label' => 'Latih kemampuan di lab', 'href' => '/labs'];
        if (! $plan) {
            $nextAction = ['label' => 'Buat rencana 90 hari', 'href' => '/dashboard'];
        }

        return [
            'period' => $period, 'timezone' => $timezone,
            'summary' => [
                'roadmap_completed' => $items->where('status', 'completed')->count(), 'roadmap_total' => $items->count(),
                'modules_completed' => $modules->filter(fn ($module) => $module->lessons->isNotEmpty() && $module->lessons->every(fn ($lesson) => $completedIds->contains($lesson->id)))->count(),
                'modules_total' => $modules->filter(fn ($module) => $module->lessons->isNotEmpty())->count(),
                'lessons_completed' => $completedIds->count(), 'lessons_total' => Lesson::count(),
                'quizzes_passed' => $quizIds->count(), 'quizzes_total' => Lesson::whereHas('questions')->count(),
                'labs_solved' => $labsSolved->count(), 'labs_total' => Lab::count(), 'verified_minutes' => null,
                ...$this->events->level($user),
            ],
            'activity' => $activity, 'skills' => $this->skills($user, $events),
            'journey' => [
                'percent' => $items->isEmpty() ? 0 : round(100 * $items->where('status', 'completed')->count() / $items->count(), 1),
                'completed_days' => $completedDays, 'total_days' => $totalDays,
                'current_day' => $plan ? max(0, min($totalDays, (int) CarbonImmutable::parse($plan->starts_on->toDateString(), $timezone)->diffInDays($today, false) + 1)) : 0,
                'starts_on' => $plan?->starts_on->toDateString(), 'ends_on' => $plan?->days->sortBy('day_number')->last()?->scheduled_on->toDateString(),
                'next_action' => $nextAction,
            ],
            'streak' => $this->events->streak($user), 'achievements' => $this->events->achievements($user),
            'has_activity' => $events->isNotEmpty(),
            'methodology' => [
                'Ringkasan mencakup seluruh riwayat akun; filter tanggal hanya mengubah grafik aktivitas dalam zona waktu akun.',
                'Satu bacaan dan kuis lulus menyelesaikan materi. Materi +10 XP, kuis pertama lulus +20 XP; lab pertama +50/+100/+150; laporan diterima Latihan Internal +50. Pengulangan memberi 0 XP baru.',
                'Waktu terverifikasi belum dilacak. Durasi rencana, membaca halaman, dan checklist tidak dihitung sebagai waktu terverifikasi.',
                'Streak menghitung hari lokal dengan kelulusan materi, kuis, lab, atau laporan internal pertama. Hari ini atau kemarin dapat menjadi akhir streak aktif; login dan checklist tidak memenuhi syarat.',
                'Level = floor(sqrt(total XP / 100)) + 1. Ambang level berikutnya adalah 100 × level².',
                'Peta skill = maksimal 40 poin dari rata-rata nilai kuis lulus terakhir, dengan kuis belum lulus bernilai 0, ditambah maksimal 60 poin dari proporsi lab tervalidasi. Denominator dan keterbatasan ditampilkan per skill.',
                'Reporting memakai nilai kelengkapan laporan yang diterima validator internal (0–24) sebagai bukti latihan, bukan penilaian pakar atau bukti penguasaan profesional. Materi tanpa lab tersedia belum dinilai secara praktik.',
            ],
        ];
    }

    private function skills(User $user, $events): array
    {
        $lessons = Lesson::all(['id', 'slug']);
        $labs = Lab::all(['id', 'slug']);
        $passed = QuizAttempt::where('user_id', $user->id)->where('passed', true)->latest('created_at')->latest('id')->get(['lesson_id', 'score'])->unique('lesson_id')->keyBy('lesson_id');
        $solved = $events->where('event_type', 'lab_solved')->pluck('subject_id');
        $reports = $events->where('event_type', 'report_accepted_for_practice');
        $skills = [];
        foreach (self::SKILLS as $key => [$label, $lessonSlugs, $labSlugs]) {
            $lessonIds = $lessons->whereIn('slug', $lessonSlugs)->pluck('id');
            $labIds = $labs->whereIn('slug', $labSlugs)->pluck('id');
            $quizCount = $lessonIds->filter(fn ($id) => $passed->has($id))->count();
            $knowledge = $lessonIds->isEmpty() ? 0 : $lessonIds->sum(fn ($id) => $passed->get($id)?->score ?? 0) / (100 * $lessonIds->count()) * 40;
            $labCount = $solved->intersect($labIds)->count();
            $practice = $labIds->isEmpty() ? 0 : $labCount / $labIds->count() * 60;
            $reportCount = $key === 'reporting' ? $reports->count() : 0;
            if ($reportCount) {
                $practice = $reports->avg(fn ($event) => max(0, min(24, (int) ($event->metadata_json['score'] ?? 0)))) / 24 * 60;
            }
            $hasPractice = $labCount > 0 || $reportCount > 0;
            $explanation = 'Pengetahuan: '.$quizCount.'/'.$lessonIds->count().' kuis lulus, maksimum 40 poin. Praktik: '.$labCount.'/'.$labIds->count().' lab tervalidasi, maksimum 60 poin.';
            if ($key === 'reporting') {
                $explanation = 'Pengetahuan: '.$quizCount.'/'.$lessonIds->count().' kuis lulus. Praktik: '.$reportCount.' laporan diterima validator kelengkapan internal; rata-rata rubrik 0–24 menyumbang maksimal 60 poin. Bukan review pakar.';
            } elseif ($labIds->isEmpty()) {
                $explanation .= ' Belum ada lab pemetaan untuk skill ini; belum dinilai secara praktik.';
            } elseif (! $hasPractice) {
                $explanation .= ' Belum dinilai secara praktik.';
            }
            $skills[] = ['key' => $key, 'label' => $label, 'score' => $quizCount || $hasPractice ? round($knowledge + $practice, 1) : null, 'knowledge_score' => round($knowledge, 1), 'practice_score' => round($practice, 1), 'quiz_passed' => $quizCount, 'quiz_total' => $lessonIds->count(), 'labs_solved' => $labCount, 'labs_total' => $labIds->count(), 'reports_accepted' => $reportCount, 'practice_assessed' => $hasPractice, 'explanation' => $explanation];
        }

        return $skills;
    }
}

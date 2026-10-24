<?php

namespace App\Http\Controllers;

use App\Models\Lab;
use App\Models\ReportEvaluation;
use App\Models\ReportEvidence;
use App\Models\User;
use App\Models\VulnerabilityReport;
use App\Services\LearningEventService;
use App\Services\ReportExport;
use App\Services\ReportRedactor;
use App\Services\ReportRubric;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $request->validate(['search' => 'nullable|string|max:100', 'status' => ['nullable', Rule::in(VulnerabilityReport::STATUSES)], 'severity' => ['nullable', Rule::in(VulnerabilityReport::SEVERITIES)]]);
        $query = VulnerabilityReport::where('user_id', $request->user()->id)->with(['lab', 'evidence', 'evaluations']);
        if ($search = $request->string('search')->toString()) {
            $query->where(fn ($q) => $q->where('title', 'like', '%'.$search.'%')->orWhere('cwe_id', 'like', '%'.$search.'%'));
        }
        $query->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')), fn ($q) => $q->where('status', '!=', 'archived'));
        $query->when($request->filled('severity'), fn ($q) => $q->where('severity', $request->input('severity')));
        $reports = $query->orderByDesc('updated_at')->orderByDesc('id')->paginate(12)->withQueryString();

        return Inertia::render('Reports', [...$this->options(), 'reports' => $reports->through(fn ($report) => $this->payload($report)), 'filters' => $request->only('search', 'status', 'severity')]);
    }

    public function create(Request $request, ReportRedactor $redactor)
    {
        $request->validate(['lab' => 'nullable|string|max:100']);
        $prefill = null;
        if ($request->filled('lab')) {
            $lab = Lab::where(ctype_digit((string) $request->input('lab')) ? 'id' : 'slug', $request->input('lab'))->where('enabled', true)->firstOrFail();
            $prefill = ['lab_id' => $lab->id, 'title' => 'Latihan — '.$lab->title, 'cwe_id' => preg_match('/^CWE-\d+$/', $lab->classification) ? $lab->classification : null, 'endpoint' => $this->labEndpoint($lab), 'summary' => $redactor->redact($lab->scenario_md)];
        }

        return Inertia::render('ReportEditor', [...$this->options(), 'report' => null, 'prefill' => $prefill, 'readOnly' => false]);
    }

    public function show(Request $request, VulnerabilityReport $report)
    {
        Gate::authorize('view', $report);
        $payload = $this->payload($report);

        return $request->expectsJson() ? response()->json($payload) : Inertia::render('ReportEditor', [...$this->options(), 'report' => $payload, 'readOnly' => true]);
    }

    public function edit(Request $request, VulnerabilityReport $report)
    {
        Gate::authorize('view', $report);

        return Inertia::render('ReportEditor', [...$this->options(), 'report' => $this->payload($report), 'readOnly' => ! $report->editable()]);
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $report = new VulnerabilityReport(['user_id' => $request->user()->id, 'status' => 'draft', 'body_json' => array_fill_keys(VulnerabilityReport::BODY_FIELDS, '')]);
        $this->applyData($report, $data);
        $report->save();

        return response()->json($this->payload($report->fresh()), 201);
    }

    public function update(Request $request, VulnerabilityReport $report)
    {
        Gate::authorize('update', $report);
        $data = $this->validated($request, true);

        return $this->mutate($request, $report, function ($current) use ($data) {
            $this->assertEditable($current);
            $this->applyData($current, $data);
            $current->version++;
            $current->save();

            return response()->json($this->payload($current));
        }, $data['version']);
    }

    public function submit(Request $request, VulnerabilityReport $report)
    {
        return $this->mutate($request, $report, function ($current) {
            $this->assertEditable($current);
            $minimums = ['summary' => 20, 'prerequisites' => 10, 'reproduction_md' => 40, 'expected_md' => 20, 'actual_md' => 20, 'evidence_md' => 20, 'impact_md' => 30, 'remediation_md' => 30, 'references_md' => 10];
            $errors = [];
            foreach ($minimums as $field => $minimum) {
                if (mb_strlen(trim($current->body_json[$field] ?? '')) < $minimum) {
                    $errors[$field] = 'Lengkapi bagian ini dengan minimal '.$minimum.' karakter untuk review Latihan Internal.';
                }
            }
            if (! $current->endpoint) {
                $errors['endpoint'] = 'Endpoint sandbox wajib diisi untuk review Latihan Internal.';
            }
            if ($errors) {
                throw ValidationException::withMessages($errors);
            }
            $current->update(['status' => 'ready_for_review', 'version' => $current->version + 1]);

            return response()->json([...$this->payload($current), 'xp_delta' => 0]);
        });
    }

    public function evaluate(Request $request, VulnerabilityReport $report, ReportRubric $rubric, LearningEventService $events)
    {
        Gate::authorize('evaluate', $report);

        return $this->mutate($request, $report, function ($current) use ($request, $rubric, $events) {
            abort_unless(in_array($current->status, ['ready_for_review', 'under_internal_review'], true), 422, 'Ajukan draft untuk review Latihan Internal terlebih dahulu.');
            $result = $rubric->evaluate($current);
            ReportEvaluation::create(['report_id' => $current->id, 'evaluator_type' => 'automated_completeness', 'scores_json' => $result['scores'], 'feedback_json' => $result['feedback'], 'rubric_version' => ReportRubric::VERSION, 'report_version' => $current->version, 'evaluated_at' => now()]);
            $current->update(['status' => $result['accepted'] ? 'accepted_for_practice' : 'needs_revision', 'reviewed_at' => now(), 'version' => $current->version + 1]);
            $reward = ['xp_delta' => 0, 'new_achievements' => []];
            if ($result['accepted']) {
                $reward = $events->record($request->user(), 'report_accepted_for_practice', 'report', $current->id, now(), ['rubric_version' => ReportRubric::VERSION, 'score' => $result['total']]);
            }

            return response()->json([...$this->payload($current), ...$reward]);
        });
    }

    public function archive(Request $request, VulnerabilityReport $report)
    {
        return $this->mutate($request, $report, function ($current) {
            $current->update(['status' => 'archived', 'version' => $current->version + 1]);

            return response()->json($this->payload($current));
        });
    }

    public function destroy(Request $request, VulnerabilityReport $report)
    {
        Gate::authorize('delete', $report);

        return $this->mutate($request, $report, function ($current) {
            $files = $current->evidence->map(fn ($item) => [$item->disk, $item->path]);
            $current->delete();
            DB::afterCommit(function () use ($files) {
                foreach ($files as [$disk, $path]) {
                    Storage::disk($disk)->delete($path);
                }
            });

            return response()->noContent();
        });
    }

    public function upload(Request $request, VulnerabilityReport $report, ReportRedactor $redactor)
    {
        Gate::authorize('update', $report);
        $request->validate(['file' => ['required', 'file', 'max:'.config('reports.evidence_max_kib'), 'mimetypes:image/png,image/jpeg,text/plain']]);
        $file = $request->file('file');
        $contents = file_get_contents($file->getRealPath());
        $mime = $file->getMimeType();
        $extension = strtolower($file->getClientOriginalExtension());
        $valid = match ($mime) {
            'image/png' => $extension === 'png' && str_starts_with($contents, "\x89PNG\r\n\x1a\n") && @getimagesizefromstring($contents) !== false,
            'image/jpeg' => in_array($extension, ['jpg', 'jpeg'], true) && str_starts_with($contents, "\xff\xd8\xff") && @getimagesizefromstring($contents) !== false,
            'text/plain' => in_array($extension, ['txt', 'log'], true) && mb_check_encoding($contents, 'UTF-8') && ! str_contains($contents, "\0") && ! preg_match('/<\?(?:php|=)|<(?:script|html|svg|iframe|object|embed)\b/i', $contents),
            default => false,
        };
        if (! $valid) {
            throw ValidationException::withMessages(['file' => 'Bukti harus PNG/JPEG asli atau teks UTF-8 (.txt/.log), tanpa HTML, SVG, atau kode executable.']);
        }
        if ($mime === 'text/plain') {
            $contents = $redactor->redact($contents);
        }

        return $this->mutate($request, $report, function ($current) use ($file, $contents, $mime, $extension) {
            $this->assertEditable($current);
            if ($current->evidence()->count() >= config('reports.evidence_max_count') || $current->evidence()->sum('size') + strlen($contents) > config('reports.evidence_total_bytes')) {
                throw ValidationException::withMessages(['file' => 'Batas bukti tercapai: maksimal 5 berkas dan total 20 MiB per laporan.']);
            }
            $path = 'report-evidence/'.$current->user_id.'/'.$current->id.'/'.Str::uuid().'.'.$extension;
            $filename = mb_substr(preg_replace('/[^\pL\pN._ -]/u', '_', basename(str_replace('\\', '/', $file->getClientOriginalName()))), 0, 180);
            abort_unless(Storage::disk('local')->put($path, $contents, ['visibility' => 'private']), 503, 'Bukti belum tersimpan. Coba lagi.');
            try {
                ReportEvidence::create(['report_id' => $current->id, 'uploaded_by' => $current->user_id, 'original_filename' => $filename ?: 'bukti.'.$extension, 'disk' => 'local', 'path' => $path, 'mime' => $mime, 'size' => strlen($contents), 'created_at' => now()]);
                $current->update(['version' => $current->version + 1]);
            } catch (\Throwable $error) {
                Storage::disk('local')->delete($path);
                throw $error;
            }

            return response()->json($this->payload($current));
        });
    }

    public function deleteEvidence(Request $request, VulnerabilityReport $report, ReportEvidence $evidence)
    {
        Gate::authorize('update', $report);
        abort_unless($evidence->report_id === $report->id, 404);

        return $this->mutate($request, $report, function ($current) use ($evidence) {
            $this->assertEditable($current);
            $evidence->delete();
            $current->update(['version' => $current->version + 1]);
            DB::afterCommit(fn () => Storage::disk($evidence->disk)->delete($evidence->path));

            return response()->json($this->payload($current));
        });
    }

    public function download(Request $request, VulnerabilityReport $report, ReportEvidence $evidence)
    {
        Gate::authorize('view', $report);
        abort_unless($evidence->report_id === $report->id && $evidence->uploaded_by === $request->user()->id, 404);
        abort_unless(Storage::disk($evidence->disk)->exists($evidence->path), 404);
        $filename = 'bukti-'.$evidence->id.'.'.match ($evidence->mime) {
            'image/png' => 'png', 'image/jpeg' => 'jpg', default => 'txt'
        };

        return Storage::disk($evidence->disk)->download($evidence->path, $filename, ['Content-Type' => $evidence->mime, 'X-Content-Type-Options' => 'nosniff', 'Content-Security-Policy' => "default-src 'none'; sandbox", 'Cache-Control' => 'private, no-store', 'Referrer-Policy' => 'no-referrer']);
    }

    public function export(Request $request, VulnerabilityReport $report, ReportExport $export)
    {
        Gate::authorize('view', $report);
        $request->validate(['format' => ['required', Rule::in(['md', 'html'])]]);
        $format = $request->input('format');
        $filename = 'vulnlab-latihan-'.$report->id.'.'.$format;

        return response($format === 'html' ? $export->html($report) : $export->markdown($report), 200, ['Content-Type' => $format === 'html' ? 'text/html; charset=UTF-8' : 'text/markdown; charset=UTF-8', 'Content-Disposition' => ($format === 'html' ? 'inline' : 'attachment').'; filename="'.$filename.'"', 'X-Content-Type-Options' => 'nosniff', 'Content-Security-Policy' => "default-src 'none'; style-src 'unsafe-inline'; sandbox", 'Cache-Control' => 'private, no-store', 'Referrer-Policy' => 'no-referrer']);
    }

    private function mutate(Request $request, VulnerabilityReport $report, callable $callback, ?int $version = null)
    {
        Gate::authorize('update', $report);
        $input = $request->validate(['version' => 'required|integer|min:1', ...$this->prohibited()]);

        return DB::transaction(function () use ($request, $report, $callback, $version, $input) {
            User::whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            $current = VulnerabilityReport::whereKey($report->id)->where('user_id', $request->user()->id)->lockForUpdate()->firstOrFail();
            if ($current->version !== (int) ($version ?? $input['version'])) {
                return response()->json(['message' => 'Laporan berubah di tab lain. Salinan lokalmu belum disimpan; muat ulang versi server sebelum mencoba lagi.', 'current' => $this->payload($current)], 409);
            }

            return $callback($current);
        });
    }

    private function assertEditable(VulnerabilityReport $report): void
    {
        abort_unless($report->editable(), 422, 'Laporan ini terkunci pada status Latihan Internal saat ini. Buat draft baru untuk latihan lain.');
    }

    private function prohibited(): array
    {
        return array_fill_keys(['user_id', 'status', 'xp', 'xp_delta', 'score', 'scores', 'scores_json', 'reviewed_at', 'body_json', 'evaluator_type', 'reward_key', 'accepted', 'uploaded_by', 'path', 'disk'], 'prohibited');
    }

    private function validated(Request $request, bool $update = false): array
    {
        $rules = ['title' => 'required|string|max:180', 'cwe_id' => ['nullable', 'string', 'regex:/^CWE-[1-9][0-9]{0,5}$/'], 'lab_id' => 'nullable|integer|exists:labs,id', 'endpoint' => ['nullable', 'string', 'max:500', 'regex:~^/(?!/)[^\x00-\x20]*$~'], 'severity' => ['sometimes', Rule::in(VulnerabilityReport::SEVERITIES)], 'version' => $update ? 'required|integer|min:1' : 'prohibited', ...$this->prohibited()];
        foreach (VulnerabilityReport::BODY_FIELDS as $field) {
            $rules[$field] = 'sometimes|nullable|string|max:20000';
        }
        $data = $request->validate($rules, ['title.required' => 'Judul laporan wajib diisi.', 'endpoint.regex' => 'Gunakan path sandbox, misalnya /api/orders/101. URL eksternal tidak dijalankan.', 'cwe_id.regex' => 'Gunakan format CWE, misalnya CWE-639.']);
        $length = array_sum(array_map(fn ($field) => mb_strlen($data[$field] ?? ''), VulnerabilityReport::BODY_FIELDS));
        if ($length > 100000) {
            throw ValidationException::withMessages(['summary' => 'Total isi laporan maksimal 100.000 karakter.']);
        }

        return $data;
    }

    private function applyData(VulnerabilityReport $report, array $data): void
    {
        foreach (['title', 'cwe_id', 'lab_id', 'endpoint', 'severity'] as $field) {
            if (array_key_exists($field, $data)) {
                $report->{$field} = $field === 'endpoint' ? ($data[$field] ?? '') : $data[$field];
            }
        }
        $body = $report->body_json ?? array_fill_keys(VulnerabilityReport::BODY_FIELDS, '');
        foreach (VulnerabilityReport::BODY_FIELDS as $field) {
            if (array_key_exists($field, $data)) {
                $body[$field] = $data[$field] ?? '';
            }
        }
        if (array_sum(array_map('mb_strlen', $body)) > 100000) {
            throw ValidationException::withMessages(['summary' => 'Total isi laporan maksimal 100.000 karakter.']);
        }
        $report->body_json = $body;
    }

    private function labEndpoint(Lab $lab): string
    {
        $contracts = json_decode(file_get_contents(database_path('data/lab-routes.json')), true);
        $routes = $contracts[$lab->slug] ?? [];

        return $routes ? (array_values($routes)[0]['path'] ?? '') : '';
    }

    private function options(): array
    {
        $labels = ['draft' => 'Draft · Latihan Internal', 'ready_for_review' => 'Siap direview · Latihan Internal', 'under_internal_review' => 'Sedang direview · Latihan Internal', 'needs_revision' => 'Perlu revisi · Latihan Internal', 'accepted_for_practice' => 'Diterima · Latihan Internal', 'archived' => 'Arsip · Latihan Internal'];

        return ['labs' => Lab::where('enabled', true)->with('category')->orderBy('id')->get()->map(fn ($lab) => ['id' => $lab->id, 'slug' => $lab->slug, 'title' => $lab->title, 'category' => $lab->category->name, 'cwe_id' => $lab->classification, 'endpoint' => $this->labEndpoint($lab)]), 'statuses' => collect($labels)->map(fn ($label, $value) => ['value' => $value, 'label' => $label])->values(), 'severities' => VulnerabilityReport::SEVERITIES, 'review_disclaimer' => ReportRubric::DISCLAIMER];
    }

    private function payload(VulnerabilityReport $report): array
    {
        $report->load(['lab', 'evidence', 'evaluations']);

        return [...$report->only(['id', 'title', 'cwe_id', 'lab_id', 'endpoint', 'severity', 'status', 'version', 'created_at', 'updated_at', 'reviewed_at']), ...$report->body_json, 'lab_title' => $report->lab?->title, 'editable' => $report->editable(), 'review_disclaimer' => ReportRubric::DISCLAIMER, 'evidence' => $report->evidence->map(fn ($item) => [...$item->only(['id', 'original_filename', 'mime', 'size', 'created_at']), 'download_url' => URL::temporarySignedRoute('reports.evidence.download', now()->addMinutes(10), ['report' => $report->id, 'evidence' => $item->id])]), 'evaluations' => $report->evaluations->map(fn ($evaluation) => [...$evaluation->only(['id', 'evaluator_type', 'rubric_version', 'report_version', 'evaluated_at']), 'scores' => $evaluation->scores_json, 'total' => array_sum($evaluation->scores_json), 'max_score' => 24, 'feedback' => $evaluation->feedback_json, 'disclaimer' => ReportRubric::DISCLAIMER])];
    }
}

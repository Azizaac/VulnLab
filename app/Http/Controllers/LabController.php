<?php

namespace App\Http\Controllers;

use App\Models\Lab;
use App\Models\LabAttempt;
use App\Models\LabProgress;
use App\Models\LabSession;
use App\Services\LabFlagValidation;
use App\Services\LabResetService;
use App\Services\LabService;
use App\Services\SafeMarkdown;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class LabController extends Controller
{
    public function index(Request $r, LabService $service)
    {
        return Inertia::render('Labs', ['labs' => $service->catalog($r->user())]);
    }

    public function show(Request $r, Lab $lab, LabService $service, SafeMarkdown $markdown)
    {
        $s = LabSession::where('user_id', $r->user()->id)->where('lab_id', $lab->id)->first();
        $p = LabProgress::where('user_id', $r->user()->id)->where('lab_id', $lab->id)->first();

        return Inertia::render('LabWorkspace', ['lab' => [...$service->catalog($r->user())->firstWhere('id', $lab->id), 'scenario_html' => $markdown->render($lab->scenario_md), 'instructions' => $lab->instructions()->get(['position', 'body']), 'sources' => $lab->sources, 'classification' => $lab->classification, 'default_body' => (object) $lab->default_body, 'default_headers' => $lab->default_headers, 'authored_at' => $lab->authored_at, 'reviewed_at' => $lab->reviewed_at, 'routes' => json_decode(file_get_contents(database_path('data/lab-routes.json')), true)[$lab->slug] ?? []], 'session' => $service->payload($s), 'hints' => $service->hints($r->user(), $lab), 'history' => $s ? $service->history($s) : [], 'attempts' => $s ? LabAttempt::where('lab_session_id', $s->id)->latest('id')->limit(20)->get(['id', 'generation', 'success', 'created_at']) : [], 'solution' => $p ? ['html' => $markdown->render($lab->solution_md), 'code' => $lab->secure_code] : null, 'recommendations' => $service->catalog($r->user())->where('status', '!=', 'solved')->where('id', '!=', $lab->id)->take(2)->values()]);
    }

    public function start(Request $r, Lab $lab, LabService $service)
    {
        $r->validate(['user_id' => 'prohibited', 'flag' => 'prohibited', 'points' => 'prohibited', 'status' => 'prohibited']);

        return response()->json(['session' => $service->payload($service->start($r->user(), $lab))]);
    }

    public function request(Request $r, LabSession $session, LabService $service)
    {
        Gate::authorize('access', $session);
        $data = $r->validate(['generation' => 'required|integer|min:1', 'endpoint' => 'required|string|max:40', 'method' => 'required|in:GET,POST,PATCH', 'headers_json' => 'required|string|max:4096', 'body_json' => 'required|string|max:8192', 'mode' => 'required|in:vulnerable,secure', 'url' => 'prohibited', 'host' => 'prohibited', 'target' => 'prohibited', 'user_id' => 'prohibited']);

        return response()->json($service->request($session, $data));
    }

    public function flag(Request $r, LabSession $session, LabFlagValidation $validator)
    {
        Gate::authorize('access', $session);
        $input = $r->validate(['generation' => 'required|integer|min:1', 'submission_id' => 'required|uuid', 'flag' => 'required|string|max:128', 'points' => 'prohibited', 'xp' => 'prohibited', 'success' => 'prohibited', 'completed' => 'prohibited', 'user_id' => 'prohibited']);

        return response()->json($validator->submit($session, $input));
    }

    public function reset(Request $r, LabSession $session, LabResetService $reset, LabService $service)
    {
        Gate::authorize('access', $session);
        $data = $r->validate(['generation' => 'required|integer|min:1']);

        return response()->json(['session' => $service->payload($reset->reset($session, $data['generation']))]);
    }

    public function stop(Request $r, LabSession $session, LabResetService $reset)
    {
        Gate::authorize('access', $session);
        $data = $r->validate(['generation' => 'required|integer|min:1']);
        $reset->stop($session, $data['generation']);

        return response()->noContent();
    }

    public function hint(Request $r, Lab $lab, LabService $service)
    {
        $s = LabSession::where('user_id', $r->user()->id)->where('lab_id', $lab->id)->firstOrFail();
        $service->active($s, $r->validate(['generation' => 'required|integer|min:1'])['generation']);

        return response()->json(['hints' => $service->hints($r->user(), $lab, true)]);
    }

    public function solution(Request $r, Lab $lab, SafeMarkdown $markdown)
    {
        $r->validate(['acknowledged' => 'accepted']);

        return response()->json(['html' => $markdown->render($lab->solution_md), 'code' => $lab->secure_code]);
    }
}

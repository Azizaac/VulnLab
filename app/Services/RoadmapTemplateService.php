<?php

namespace App\Services;

use App\Models\ContentEntry;
use App\Models\ContentRevision;
use App\Models\RoadmapItem;
use App\Models\RoadmapPlan;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class RoadmapTemplateService
{
    public function latest(): ?ContentRevision
    {
        return ContentEntry::where('kind', 'roadmap')->where('is_managed', true)->where('is_archived', false)->with('published')->orderByDesc('updated_at')->first()?->published;
    }

    public function enroll(User $user, string $startsOn, string $timezone, ContentRevision $revision): RoadmapPlan
    {
        $plan = RoadmapPlan::create(['user_id' => $user->id, 'starts_on' => $startsOn, 'timezone' => $timezone, 'template_revision_id' => $revision->id]);
        $user->update(['timezone' => $timezone]);
        $templates = DB::table('roadmap_day_templates')->get()->keyBy('day_number');
        $stages = collect($revision->data_json['stages'])->keyBy('key');
        $items = [];
        $prerequisites = [];
        foreach ($revision->data_json['days'] as $d) {
            $day = $plan->days()->create(['week_id' => $templates[$d['day_number']]->week_id, 'day_number' => $d['day_number'], 'scheduled_on' => CarbonImmutable::parse($startsOn, $timezone)->addDays($d['day_number'] - 1)->toDateString(), 'title' => $d['title'], 'objective' => $d['objective'], 'stage_label' => $stages[$d['stage_key']]['title']]);
            foreach ($d['tasks'] as $i => $task) {
                $verified = in_array($task['kind'], ['quiz', 'lab', 'report']);
                $item = $day->items()->create(['sort_order' => $i + 1, 'category' => match ($task['kind']) {
                    'theory' => 'theory', 'reflection' => 'review', default => 'practice'
                }, 'task_type' => $verified ? $task['kind'] : 'checklist', 'completion_kind' => $verified ? $task['kind'] : 'manual', 'linked_subject_id' => $task['subject_id'] ?? null, 'title' => $task['title'], 'description' => $task['description'], 'estimated_minutes' => $task['minutes']]);
                $items[$task['key']] = $item;
                $prerequisites[$task['key']] = $task['prerequisite_key'] ?? null;
            }
        }
        foreach ($prerequisites as $key => $dependency) {
            if ($dependency) {
                $items[$key]->update(['prerequisite_item_id' => $items[$dependency]->id]);
            }
        }

        return $plan;
    }

    public function syncVerified(User $user, RoadmapPlan $plan): void
    {
        if (! $plan->template_revision_id) {
            return;
        }
        $items = RoadmapItem::whereIn('roadmap_day_id', $plan->days()->pluck('id'))->get()->keyBy('id');
        // Iterate to a fixed point so prerequisite order can differ from display order.
        do {
            $changed = false;
            foreach ($items as $item) {
                if ($item->status === 'completed' || $item->completion_kind === 'manual' || $item->prerequisite_item_id && $items->get($item->prerequisite_item_id)?->status !== 'completed') {
                    continue;
                }
                $at = match ($item->completion_kind) {
                    'quiz' => DB::table('lesson_progress')->where('user_id', $user->id)->where('lesson_id', $item->linked_subject_id)->value('quiz_passed_at'),
                    'lab' => DB::table('lab_progress')->where('user_id', $user->id)->where('lab_id', $item->linked_subject_id)->value('solved_at'),
                    'report' => DB::table('vulnerability_reports')->where('user_id', $user->id)->where('status', 'accepted_for_practice')->whereNull('deleted_at')->value('reviewed_at'),
                    default => null,
                };
                if ($at) {
                    $item->update(['status' => 'completed', 'completed_at' => $at]);
                    $changed = true;
                }
            }
        } while ($changed);
    }
}

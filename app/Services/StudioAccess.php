<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class StudioAccess
{
    public const ROLES = ['learner', 'editor', 'reviewer', 'admin'];

    public const PERMISSIONS = ['studio.access', 'content.edit', 'content.review', 'content.publish', 'users.manage', 'audit.read'];

    public static function permissions(User $user): array
    {
        if ($user->suspended_at) {
            return [];
        }
        $base = match ($user->role) {
            'editor' => ['studio.access', 'content.edit'],
            'reviewer' => ['studio.access', 'content.review'],
            'admin' => self::PERMISSIONS,
            default => [],
        };

        // A reviewer may receive publishing permission; no other web-granted privilege exists.
        return array_values(array_unique([...$base, ...($user->role === 'reviewer' && in_array('content.publish', $user->permission_grants ?? []) ? ['content.publish'] : [])]));
    }

    public static function audit(?User $actor, string $action, string $type, ?int $id, array $metadata = []): void
    {
        DB::table('studio_audit_events')->insert(['actor_id' => $actor?->id, 'action' => $action, 'subject_type' => $type, 'subject_id' => $id, 'metadata_json' => json_encode($metadata, JSON_THROW_ON_ERROR), 'created_at' => now()]);
    }

    public static function notify(User $user, string $type, string $message, string $href): void
    {
        DB::table('account_notifications')->insert(['user_id' => $user->id, 'type' => $type, 'message' => $message, 'href' => $href, 'created_at' => now()]);
    }
}

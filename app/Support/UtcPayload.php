<?php

namespace App\Support;

use Carbon\CarbonImmutable;

class UtcPayload
{
    public static function row(object $row): object
    {
        foreach (['created_at', 'updated_at', 'occurred_at', 'read_at', 'expires_at', 'execute_after'] as $key) {
            if (isset($row->$key)) {
                $row->$key = CarbonImmutable::parse($row->$key, 'UTC')->toIso8601String();
            }
        }

        return $row;
    }
}

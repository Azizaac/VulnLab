<?php

return [
    'enabled' => (bool) env('LABS_ENABLED', false),
    'runner_url' => env('LAB_RUNNER_URL', 'http://127.0.0.1:8090'),
    'runner_token' => env('LAB_RUNNER_TOKEN'),
    'ttl_minutes' => 60,
];

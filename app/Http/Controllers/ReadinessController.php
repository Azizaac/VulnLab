<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;

class ReadinessController extends Controller
{
    public function __invoke()
    {
        try {
            DB::select('select 1');
            $database = true;
        } catch (\Throwable) {
            $database = false;
        }
        $storage = is_writable(storage_path('framework')) && is_writable(storage_path('logs'));
        $ready = $database && $storage;

        return response()->json(['ready' => $ready, 'database' => $database, 'storage' => $storage], $ready ? 200 : 503)
            ->header('Cache-Control', 'no-store');
    }
}

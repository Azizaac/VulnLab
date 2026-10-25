<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AccountPurgeExports extends Command
{
    protected $signature = 'account:purge-exports';

    protected $description = 'Remove expired private account exports';

    public function handle(): int
    {
        foreach (DB::table('account_data_requests')->where('kind', 'export')->where('status', 'ready')->where('expires_at', '<=', now())->get() as $row) {
            Storage::disk('local')->delete($row->path);
            DB::table('account_data_requests')->where('id', $row->id)->update(['status' => 'expired', 'path' => null, 'updated_at' => now()]);
        }

        return self::SUCCESS;
    }
}

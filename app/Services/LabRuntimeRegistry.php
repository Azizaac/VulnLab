<?php

namespace App\Services;

use App\Models\Lab;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

class LabRuntimeRegistry
{
    public const CHECKS = ['baseline', 'trigger', 'secure', 'proof', 'wrong_proof', 'expiry', 'reset', 'ownership', 'network', 'repeat_xp'];

    private ?string $revision = null;

    private ?array $receipts = null;

    public function expansion(Lab $lab): bool
    {
        return preg_match('/^LAB0(?:09|1[0-9]|20)$/', $lab->code) === 1;
    }

    public function revision(): string
    {
        if ($this->revision !== null) {
            return $this->revision;
        }
        $sandboxDir = base_path('sandbox');
        if (is_dir($sandboxDir)) {
            $names = array_filter(scandir($sandboxDir), fn ($name) => str_ends_with($name, '.mjs') || in_array($name, ['contracts.json', 'Dockerfile', 'compose.yaml', 'Dockerfile.verifier', 'package.json', 'package-lock.json'], true));
            sort($names, SORT_STRING);
            $hash = hash_init('sha256');
            foreach ($names as $name) {
                hash_update($hash, $name."\0".file_get_contents($sandboxDir.'/'.$name)."\0");
            }

            return $this->revision = hash_final($hash);
        }
        // Inside container images where sandbox/ is excluded by .dockerignore,
        // read the pinned SHA-256 digest from the committed local receipt;
        // LabService::provision() and LabFlagValidation::submit() still verify
        // hash_equals() against the live runner's runtime_revision response.
        $receiptPath = base_path('docs/v9/implementation/local-lab-receipt.json');
        if (is_file($receiptPath)) {
            $receipt = json_decode((string) file_get_contents($receiptPath), true);
            if (is_string($receipt['runtime_revision'] ?? null) && preg_match('/^[a-f0-9]{64}$/', $receipt['runtime_revision'])) {
                return $this->revision = $receipt['runtime_revision'];
            }
        }
        throw new RuntimeException('Sandbox runtime revision manifest unavailable.');
    }

    public function available(Lab $lab): bool
    {
        if (! $this->expansion($lab)) {
            return true;
        }
        if ($this->receipts === null) {
            $this->receipts = Schema::hasTable('lab_runtime_verifications')
                ? DB::table('lab_runtime_verifications')->where('runtime_revision', $this->revision())->get()->keyBy('lab_id')->all()
                : [];
        }
        $receipt = $this->receipts[$lab->id] ?? null;
        if (! $receipt) {
            return false;
        }
        $checks = json_decode($receipt->checks_json, true, 512, JSON_THROW_ON_ERROR);
        foreach (self::CHECKS as $check) {
            if (($checks[$check] ?? null) !== true) {
                return false;
            }
        }

        return true;
    }

    public function matches(Lab $lab, mixed $revision): bool
    {
        return ! $this->expansion($lab) || is_string($revision) && hash_equals($this->revision(), $revision);
    }
}

<?php

namespace App\Services;

use App\Contracts\LabRunnerAdapter;
use App\Models\LabSession;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpKernel\Exception\HttpException;

class LocalLabRunnerAdapter implements LabRunnerAdapter
{
    private function call(LabSession $session, string $action, array $extra = []): array
    {
        $url = config('labs.runner_url');
        if (! config('labs.enabled') || ! in_array($url, ['http://127.0.0.1:8090', 'http://lab-runner:8090'], true) || strlen((string) config('labs.runner_token')) < 40) {
            throw new HttpException(503, 'Sandbox lokal belum diaktifkan. Jalankan setup lab sesuai dokumentasi.');
        }
        try {
            $response = Http::withToken(config('labs.runner_token'))->acceptJson()->connectTimeout(2)->timeout(15)->withoutRedirecting()->withOptions(['proxy' => '', 'stream' => true, 'read_timeout' => 15])->post($url.'/sessions/'.$session->id.'/'.$action, [...$extra, 'capability' => $session->capability, 'generation' => $session->generation]);
            if ($response->redirect()) {
                throw new HttpException(502, 'Redirect runner ditolak.');
            }
            $stream = $response->toPsrResponse()->getBody();
            $raw = '';
            while (! $stream->eof()) {
                $chunk = $stream->read(min(8192, 50001 - strlen($raw)));
                if ($chunk === '' && ! $stream->eof()) {
                    throw new HttpException(502, 'Respons runner tidak lengkap.');
                }
                $raw .= $chunk;
                if (strlen($raw) > 50000) {
                    throw new HttpException(502, 'Respons runner terlalu besar.');
                }
            }
            $data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
            if (! $response->successful()) {
                throw new HttpException(in_array($response->status(), [409, 410, 422], true) ? $response->status() : 503, 'Sandbox tidak siap atau sesi berubah. Muat ulang atau reset lab.');
            }

            return $data;
        } catch (HttpException $e) {
            throw $e;
        } catch (\Throwable) {
            throw new HttpException(503, 'Tidak dapat menjangkau sandbox lokal. Periksa runner dan coba kembali.');
        }
    }

    public function provision(LabSession $s): array
    {
        return $this->call($s, 'provision', ['lab' => $s->lab->slug, 'flag' => $s->flag_secret, 'expires_at' => $s->expires_at->getTimestampMs()]);
    }

    public function request(LabSession $s, array $r): array
    {
        return $this->call($s, 'request', ['lab' => $s->lab->slug, 'request' => $r]);
    }

    public function evidence(LabSession $s): array
    {
        return $this->call($s, 'evidence');
    }

    public function stop(LabSession $s): array
    {
        return $this->call($s, 'stop');
    }
}

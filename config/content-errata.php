<?php

// Additive corrections apply only to the exact original starter text. Editorial
// revisions and learner records are never rewritten by this presentation layer.
return [
    'rest-api-json' => [
        'sha256' => '0a8d8572d3777bcf5dbdd4b1d6c64bda2adf288164074fd4c69cbf7047e3cbd2',
        'markdown' => <<<'MD'
## Penjelasan contoh HTTP

JSON pada contoh merupakan **body respons**, terpisah dari request GET. Request dan respons lengkap dapat dibaca sebagai berikut:

```http
GET /api/orders/101 HTTP/1.1
Host: shop.lab.test
Accept: application/json
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"id":101,"status":"paid"}
```

Contoh ini tidak mengirim body pada GET. Lihat [MDN — GET](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/GET). Catatan QA 25 Oktober 2026; belum merupakan persetujuan pakar independen.
MD,
    ],
    'laravel-fixes' => [
        'sha256' => 'adabe12ec31762463fb5562c7359dd4c4b0e981d38869089544b776eee43a3a0',
        'markdown' => <<<'MD'
## Penjelasan contoh otorisasi Laravel

Pemanggilan `$this->authorize()` memerlukan trait `AuthorizesRequests` pada controller. Base controller aplikasi ini tidak memakai trait tersebut. Gunakan facade Gate dengan policy yang terdaftar:

```php
use Illuminate\Support\Facades\Gate;

Gate::authorize('view', $order);
```

Policy tetap harus memeriksa izin pengguna terhadap objek; mengganti sintaks tidak otomatis membuat policy aman. Lihat [Laravel — authorization via Gate](https://laravel.com/docs/12.x/authorization#via-the-gate-facade). Catatan QA 25 Oktober 2026; belum merupakan persetujuan pakar independen.
MD,
    ],
];

<?php

use App\Models\Lesson;
use App\Models\User;
use App\Services\ContentCatalog;
use App\Services\RoadmapService;
use Illuminate\Contracts\Console\Kernel;

// CLI-only browser fixture. It cannot run against the learner database.
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
$database = config('database.connections.sqlite.database');
$actual = realpath($database);
$explicit = getenv('E2E_DB_DATABASE');
$temp = realpath(sys_get_temp_dir());
$isTemporaryFixture = $explicit && $actual && $temp && realpath($explicit) === $actual
    && str_starts_with(strtolower($actual), strtolower(rtrim($temp, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR));
$isLegacyFixture = $actual && $actual === realpath(base_path('database/e2e.sqlite'));
if (PHP_SAPI !== 'cli' || ! app()->environment('testing') || config('database.default') !== 'sqlite' || (! $isTemporaryFixture && ! $isLegacyFixture)) {
    throw new RuntimeException('Browser fixtures require the dedicated local E2E SQLite database.');
}
$email = getenv('VULNLAB_TEST_EMAIL');
$password = getenv('VULNLAB_TEST_PASSWORD');
if (! filter_var($email, FILTER_VALIDATE_EMAIL) || ! str_ends_with($email, '@example.test') || strlen($password) < 32) {
    throw new RuntimeException('Supply disposable test credentials through the environment.');
}
$user = User::create(['name' => 'Pelajar V5', 'email' => $email, 'password' => $password, 'timezone' => 'Asia/Jakarta']);
app(RoadmapService::class)->create($user, today()->toDateString(), 'Asia/Jakarta');
if ($slug = getenv('VULNLAB_TEST_LESSON_SLUG')) {
    if (! preg_match('/^e2e-quiz-[a-f0-9]{10}$/', $slug)) {
        throw new RuntimeException('Invalid disposable lesson key.');
    }
    // A legacy-style fixture with no quiz bank, never a claim of human review.
    $lesson = Lesson::firstOrFail()->replicate();
    $lesson->fill(['source_id' => $slug, 'slug' => $slug, 'title' => 'Kuis fixture: '.$slug, 'body_md' => '# Fixture kuis\nLatihan dengan data dummy lokal.', 'reviewed_at' => null, 'editorial_status' => 'original_unreviewed', 'sort_order' => Lesson::max('sort_order') + 1])->save();
    $lesson->sources()->create(['title' => 'OWASP', 'url' => 'https://owasp.org/']);
    app(ContentCatalog::class)->importLegacy();
}
echo "Disposable learner fixture created.\n";

<?php

namespace Tests\Feature;

use Symfony\Component\Yaml\Yaml;
use Tests\TestCase;

class ContainerConfigurationTest extends TestCase
{
    public function test_lab_overlay_connects_only_app_to_authenticated_control_network(): void
    {
        $overlay = Yaml::parseFile(base_path('compose.labs.yaml'));
        $this->assertSame(['app'], array_keys($overlay['services']));
        $this->assertSame(['core', 'labcontrol'], $overlay['services']['app']['networks']);
        $this->assertTrue($overlay['networks']['labcontrol']['external']);
        $this->assertSame('vulnlab_labcontrol', $overlay['networks']['labcontrol']['name']);
        $this->assertStringNotContainsString('docker.sock', file_get_contents(base_path('compose.labs.yaml')));
        $this->assertStringContainsString('sandbox', file_get_contents(base_path('.dockerignore')));
        $routes = json_decode(file_get_contents(database_path('data/lab-routes.json')), true);
        $this->assertCount(8, $routes);
        foreach ($routes as $endpoints) {
            foreach ($endpoints as $endpoint) {
                $this->assertStringStartsWith('/', $endpoint['path']);
                $this->assertStringNotContainsString('://', $endpoint['path']);
                $this->assertStringNotContainsString('..', $endpoint['path']);
            }
        }
    }

    public function test_compose_exposes_only_loopback_web_and_keeps_backend_and_labs_internal(): void
    {
        $compose = Yaml::parseFile(base_path('compose.yaml'));
        $this->assertSame(['app', 'web', 'db'], array_keys($compose['services']));
        $this->assertSame(['127.0.0.1:8088:8080'], $compose['services']['web']['ports']);
        $this->assertArrayNotHasKey('ports', $compose['services']['db']);
        $this->assertArrayNotHasKey('ports', $compose['services']['app']);
        $this->assertArrayNotHasKey('env_file', $compose['services']['app']);
        $this->assertArrayNotHasKey('MYSQL_ROOT_PASSWORD', $compose['services']['app']['environment']);
        $this->assertTrue($compose['networks']['core']['internal']);
        $this->assertTrue($compose['networks']['lab']['internal']);
        $this->assertSame('bridge', $compose['networks']['frontend']['driver']);
        foreach ($compose['services'] as $name => $service) {
            $this->assertSame($name === 'web' ? ['frontend', 'core'] : ['core'], $service['networks']);
            $this->assertNotContains('lab', $service['networks']);
            $this->assertSame(['ALL'], $service['cap_drop']);
            foreach ($service['volumes'] ?? [] as $volume) {
                $this->assertStringNotContainsString('docker.sock', $volume);
                $this->assertStringNotContainsString('./', $volume);
            }
        }
        $this->assertTrue($compose['services']['app']['read_only']);
        $this->assertTrue($compose['services']['web']['read_only']);
    }
}

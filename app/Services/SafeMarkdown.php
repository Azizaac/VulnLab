<?php

namespace App\Services;

use League\CommonMark\Environment\Environment;
use League\CommonMark\Extension\CommonMark\CommonMarkCoreExtension;
use League\CommonMark\Extension\CommonMark\Node\Inline\Image;
use League\CommonMark\MarkdownConverter;
use League\CommonMark\Node\Node;
use League\CommonMark\Renderer\ChildNodeRendererInterface;
use League\CommonMark\Renderer\NodeRendererInterface;

class SafeMarkdown
{
    public function render(string $markdown): string
    {
        $env = new Environment(['html_input' => 'strip', 'allow_unsafe_links' => false, 'max_nesting_level' => 20]);
        $env->addExtension(new CommonMarkCoreExtension);
        // Notes never make third-party image requests or embed active HTML.
        $env->addRenderer(Image::class, new class implements NodeRendererInterface
        {
            public function render(Node $node, ChildNodeRendererInterface $childRenderer)
            {
                return '';
            }
        });

        return (string) (new MarkdownConverter($env))->convert($markdown);
    }
}

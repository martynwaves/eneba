<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HomepageBlock;
use App\Services\Homepage\BlockProvider;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class HomepageController extends Controller
{
    /** The page layout: which blocks to show, in what order, and where each one loads from. */
    public function layout(): JsonResponse
    {
        $blocks = HomepageBlock::where('is_active', true)->orderBy('sort')->get()
            ->filter(fn (HomepageBlock $b) => isset(config('homepage.providers')[$b->source]))
            ->map(fn (HomepageBlock $b) => [...$this->heading($b), 'endpoint' => "/homepage/blocks/{$b->key}"])
            ->values();

        return response()->json(['data' => $blocks]);
    }

    /** One block's content, produced by the provider configured for it. */
    public function block(Request $request, HomepageBlock $block): JsonResponse
    {
        abort_unless($block->is_active, 404);

        $class = config('homepage.providers')[$block->source] ?? null;
        abort_unless($class, 404);

        /** @var BlockProvider $provider */
        $provider = app($class);
        $user = $request->user('sanctum');

        $data = $provider->cacheable($user)
            ? Cache::remember("homepage:block:{$block->key}:".$block->updated_at?->timestamp, config('homepage.cache_seconds'),
                fn () => $this->toPlainArray($provider->data($block, null)))
            : $provider->data($block, $user);

        return response()->json(['data' => [...$this->heading($block), 'content' => $data]]);
    }

    /**
     * What both the layout and the block itself say about a block.
     *
     * @return array{key: string, type: string, title: ?string, subtitle: ?string, link_url: ?string, link_label: string}
     */
    private function heading(HomepageBlock $block): array
    {
        return [
            'key' => $block->key,
            'type' => $block->type,
            'title' => $block->title,
            'subtitle' => $block->subtitle,
            'link_url' => $block->link_url,
            'link_label' => $block->config['link_label'] ?? 'Show all',
        ];
    }

    /**
     * Cache only plain arrays. The cache refuses to unserialize objects
     * (`cache.serializable_classes` is false), so a cached Collection would come back as
     * an incomplete object and reach the frontend as `{}` instead of a list.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function toPlainArray(array $data): array
    {
        return json_decode(json_encode($data, JSON_THROW_ON_ERROR), true, flags: JSON_THROW_ON_ERROR);
    }
}

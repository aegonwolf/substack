<script lang="ts">
  // Sample Posts Card Component
  //
  // Displays sample posts from viral posts analysis with links and metadata
  // Provides examples of high-performing content
  //
  // Usage:
  // <SamplePostsCard {data} />

  import { ExternalLink, TrendingUp, MessageSquare, Share2, Heart } from '@lucide/svelte';
  import { fade, slide } from 'svelte/transition';

  // Data interfaces
  interface SamplePost {
    title: string;
    engagement_score: number;
    reaction_count: number;
    comment_count: number;
    restacks: number;
    url?: string; // URL from sample_posts.json
    engagement_per_1k?: number;
    reactions_per_1k?: number;
    comments_per_1k?: number;
    restacks_per_1k?: number;
    subscriber_count?: number;
  }

  interface Props {
    data: {
      top_viral_posts: SamplePost[];
      viral_count: number;
      viral_percentage: number;
      threshold_score: number;
    };
    limit?: number;
    title?: string;
  }

  let { data, limit = 5, title = "Top Performing Posts" }: Props = $props();

  // Format numbers for display
  function formatNumber(num: number): string {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toFixed(0);
  }

  // Use actual URL from data or generate placeholder
  function getPostUrl(post: SamplePost): string {
    if (post.url) {
      return post.url;
    }

    // Fallback: Generate placeholder URL from title
    const slug = post.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    return `https://newsletter.substack.com/p/${slug}`;
  }

  // Calculate engagement rate for sorting/display
  function getEngagementRate(post: SamplePost): number {
    return post.engagement_score;
  }

  // Get top posts limited by the limit prop
  const topPosts = $derived.by(() => {
    if (!data?.top_viral_posts) return [];
    return data.top_viral_posts
      .slice(0, limit)
      .map(post => ({
        ...post,
        url: getPostUrl(post)
      }));
  });

  // Determine post category based on engagement metrics
  function getPostCategory(post: SamplePost): { label: string; color: string } {
    const commentRatio = post.comment_count / post.reaction_count;
    const restackRatio = post.restacks / post.reaction_count;

    if (commentRatio > 0.3) {
      return { label: 'Discussion Driver', color: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200' };
    } else if (restackRatio > 0.2) {
      return { label: 'Highly Shareable', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' };
    } else if (post.engagement_score > 1000) {
      return { label: 'Viral Hit', color: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200' };
    } else {
      return { label: 'High Performer', color: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200' };
    }
  }

  // Truncate title for display
  function truncateTitle(title: string, maxLength: number = 80): string {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  }
</script>

<div class="card preset-tonal-surface">
  <header class="card-header">
    <div class="flex items-center justify-between">
      <h3 class="h4">{title}</h3>
      <div class="text-xs text-surface-600-300-token">
        Top {data?.viral_percentage?.toFixed(1)}% of {data?.viral_count?.toLocaleString()} posts
      </div>
    </div>
    <p class="text-sm text-surface-600-300-token mt-1">
      High-performing posts with engagement scores above {data?.threshold_score?.toFixed(0)}
    </p>
  </header>

  <div class="p-4">
    {#if topPosts.length > 0}
      <div class="space-y-4">
        {#each topPosts as post, index (post.title + index)}
          {@const category = getPostCategory(post)}

          <div
            class="group border border-surface-300-600-token rounded-lg p-4 hover:border-primary-500-400-token transition-all duration-200 hover:shadow-md"
            in:slide={{ duration: 300, delay: index * 100 }}
          >
            <!-- Post Header -->
            <div class="flex items-start justify-between gap-3 mb-3">
              <div class="flex-1 min-w-0">
                <!-- Category Badge -->
                <div class="mb-2">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {category.color}">
                    {category.label}
                  </span>
                </div>

                <!-- Title with Link -->
                <h4 class="font-medium text-surface-900-50-token group-hover:text-primary-600-300-token leading-tight mb-2">
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-start gap-2 hover:underline"
                    aria-label="Read post: {post.title}"
                  >
                    <span class="flex-1">{truncateTitle(post.title)}</span>
                    <ExternalLink size="14" class="flex-shrink-0 mt-0.5 opacity-60 group-hover:opacity-100" />
                  </a>
                </h4>
              </div>

              <!-- Engagement Score -->
              <div class="text-right flex-shrink-0">
                <div class="text-lg font-bold text-primary-600-300-token">
                  {formatNumber(post.engagement_score)}
                </div>
                <div class="text-xs text-surface-500-400-token">
                  engagement
                </div>
              </div>
            </div>

            <!-- Engagement Metrics -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4 text-sm">
                <!-- Reactions -->
                <div class="flex items-center gap-1.5 text-surface-600-300-token">
                  <Heart size="14" class="text-slate-500" />
                  <span class="font-mono">{formatNumber(post.reaction_count)}</span>
                </div>

                <!-- Comments -->
                <div class="flex items-center gap-1.5 text-surface-600-300-token">
                  <MessageSquare size="14" class="text-sky-500" />
                  <span class="font-mono">{formatNumber(post.comment_count)}</span>
                </div>

                <!-- Restacks -->
                <div class="flex items-center gap-1.5 text-surface-600-300-token">
                  <Share2 size="14" class="text-amber-500" />
                  <span class="font-mono">{formatNumber(post.restacks)}</span>
                </div>
              </div>

              <!-- Performance Indicator -->
              <div class="flex items-center gap-1 text-xs text-surface-500-400-token">
                <TrendingUp size="12" />
                <span>Rank #{index + 1}</span>
              </div>
            </div>

            <!-- Engagement Breakdown Bar -->
            <div class="mt-3">
              {#each [post] as currentPost}
                {@const total = currentPost.reaction_count + (currentPost.comment_count * 5) + (currentPost.restacks * 3)}
                {@const reactionsWidth = (currentPost.reaction_count / total) * 100}
                {@const commentsWidth = ((currentPost.comment_count * 5) / total) * 100}
                {@const restacksWidth = ((currentPost.restacks * 3) / total) * 100}

                <div class="w-full bg-surface-200-700-token rounded-full h-2 overflow-hidden">
                  <div class="h-full flex">
                    <div
                      class="bg-slate-400 h-full"
                      style="width: {reactionsWidth}%"
                      title="Reactions: {currentPost.reaction_count}"
                    ></div>
                    <div
                      class="bg-sky-400 h-full"
                      style="width: {commentsWidth}%"
                      title="Comments: {currentPost.comment_count} (×5)"
                    ></div>
                    <div
                      class="bg-amber-400 h-full"
                      style="width: {restacksWidth}%"
                      title="Restacks: {currentPost.restacks} (×3)"
                    ></div>
                  </div>
                </div>
              {/each}
              <div class="flex justify-between text-xs text-surface-500-400-token mt-1">
                <span>Reactions</span>
                <span>Comments (×5)</span>
                <span>Restacks (×3)</span>
              </div>
            </div>
          </div>
        {/each}
      </div>

      <!-- View More Link -->
      {#if data?.viral_count && limit < data.viral_count}
        <div class="mt-6 text-center">
          <p class="text-sm text-surface-600-300-token">
            Showing top {limit} of {data.viral_count.toLocaleString()} high-performing posts
          </p>
        </div>
      {/if}
    {:else}
      <!-- Empty State -->
      <div class="text-center py-8 text-surface-500-400-token">
        <TrendingUp size="48" class="mx-auto mb-3 opacity-50" />
        <p>No sample posts available</p>
      </div>
    {/if}
  </div>
</div>

<style>
  /* Smooth hover animations */
  .group:hover .engagement-bar {
    transform: scaleX(1.02);
  }

  /* Custom scrollbar for long titles */
  .truncate-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Engagement bar animation */
  .engagement-bar > div {
    transition: all 0.3s ease;
  }
</style>

<!--
Usage Examples:

1. Basic usage:
<SamplePostsCard data={viralPostsData} />

2. Limit results:
<SamplePostsCard data={viralPostsData} limit={3} />

3. Custom title:
<SamplePostsCard data={viralPostsData} title="Viral Content Examples" limit={5} />
-->
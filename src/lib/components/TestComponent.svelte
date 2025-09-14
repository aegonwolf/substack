<script lang="ts">
  interface Props {
    message?: string;
  }

  let { message = 'Hello from lazy loaded component!' }: Props = $props();
</script>

<div class="p-4 bg-primary-100-800-token rounded-lg border border-primary-300-600-token">
  <h3 class="text-lg font-semibold text-primary-900-100-token mb-2">Test Component</h3>
  <p class="text-surface-700-200-token">{message}</p>
  <p class="text-xs text-surface-500-400-token mt-2">This component was loaded lazily!</p>
</div>
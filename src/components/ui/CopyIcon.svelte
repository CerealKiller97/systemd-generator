<script lang="ts">
  import { Copy, Check } from "@lucide/svelte";
  import { scale, fade } from "svelte/transition";
  import { backOut } from "svelte/easing";

  let {
    copied = false,
    size = "h-3.5 w-3.5",
  }: { copied?: boolean; size?: string } = $props();
</script>

<span class={`relative inline-flex ${size} items-center justify-center`}>
  {#if copied}
    <span
      class="check-draw absolute inset-0 flex items-center justify-center text-emerald-400"
      in:scale={{ duration: 240, start: 0.3, easing: backOut }}
    >
      <Check class={size} />
    </span>
  {:else}
    <span
      class="absolute inset-0 flex items-center justify-center"
      in:fade={{ duration: 120 }}
    >
      <Copy class={size} />
    </span>
  {/if}
</span>

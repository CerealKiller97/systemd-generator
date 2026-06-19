<script lang="ts">
  import { cn } from "@/lib/utils";
  import { fly } from "svelte/transition";
  import type { Snippet } from "svelte";

  let {
    trigger,
    children,
    class: className = "",
    label = "Open popover",
    onOpen,
  }: {
    trigger: Snippet;
    children: Snippet;
    class?: string;
    label?: string;
    onOpen?: () => void;
  } = $props();

  let open = $state(false);
  let wrapEl: HTMLDivElement | undefined = $state();

  function onWindowClick(e: MouseEvent) {
    if (open && wrapEl && !wrapEl.contains(e.target as Node)) open = false;
  }
</script>

<svelte:window
  onclick={onWindowClick}
  onkeydown={(e) => e.key === "Escape" && (open = false)}
/>

<div bind:this={wrapEl} class="relative inline-flex">
  <button
    type="button"
    aria-label={label}
    aria-expanded={open}
    onclick={() => {
      const next = !open;
      open = next;
      if (next) onOpen?.();
    }}
    class="inline-flex items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  >
    {@render trigger()}
  </button>

  {#if open}
    <div
      transition:fly={{ x: -6, duration: 130 }}
      class={cn(
        "absolute left-full top-0 z-50 ml-2 w-80 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
        className
      )}
    >
      {@render children()}
    </div>
  {/if}
</div>

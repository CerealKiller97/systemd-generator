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
  let triggerEl: HTMLButtonElement | undefined = $state();
  let popoverEl: HTMLDivElement | undefined = $state();
  let popoverStyle = $state("");
  let positioned = $state(false);

  const VIEWPORT_PADDING = 16;
  const GAP = 8;

  function updatePosition() {
    if (!triggerEl || !popoverEl) return;

    const trigger = triggerEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const maxWidth = Math.min(320, vw - VIEWPORT_PADDING * 2);

    popoverEl.style.width = `${maxWidth}px`;
    const width = popoverEl.getBoundingClientRect().width;
    const height = popoverEl.getBoundingClientRect().height;

    const spaceRight = vw - VIEWPORT_PADDING - (trigger.right + GAP);
    const spaceBelow = vh - VIEWPORT_PADDING - (trigger.bottom + GAP);
    const spaceAbove = trigger.top - GAP - VIEWPORT_PADDING;

    let top: number;
    let left: number;

    if (spaceRight >= width) {
      left = trigger.right + GAP;
      top = trigger.top + trigger.height / 2 - height / 2;
    } else if (spaceBelow >= height) {
      left = trigger.left + trigger.width / 2 - width / 2;
      top = trigger.bottom + GAP;
    } else if (spaceAbove >= height) {
      left = trigger.left + trigger.width / 2 - width / 2;
      top = trigger.top - height - GAP;
    } else {
      left = trigger.left + trigger.width / 2 - width / 2;
      top = Math.max(VIEWPORT_PADDING, trigger.bottom + GAP);
    }

    left = Math.max(
      VIEWPORT_PADDING,
      Math.min(left, vw - VIEWPORT_PADDING - width)
    );
    top = Math.max(
      VIEWPORT_PADDING,
      Math.min(top, vh - VIEWPORT_PADDING - height)
    );

    popoverStyle = `top:${top}px;left:${left}px;width:${maxWidth}px;`;
    positioned = true;
  }

  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return {
      destroy() {
        node.remove();
      },
    };
  }

  function onWindowClick(e: MouseEvent) {
    if (open && wrapEl && !wrapEl.contains(e.target as Node)) {
      if (popoverEl?.contains(e.target as Node)) return;
      open = false;
    }
  }

  $effect(() => {
    if (!open || !popoverEl) return;

    positioned = false;
    const frame = requestAnimationFrame(updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  });
</script>

<svelte:window
  onclick={onWindowClick}
  onkeydown={(e) => e.key === "Escape" && (open = false)}
/>

<div bind:this={wrapEl} class="relative inline-flex">
  <button
    bind:this={triggerEl}
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
</div>

{#if open}
  <div
    use:portal
    bind:this={popoverEl}
    transition:fly={{ y: 6, duration: 130 }}
    style={popoverStyle}
    class={cn(
      "fixed z-[100] max-h-[min(70vh,calc(100vh-2rem))] overflow-y-auto rounded-md border bg-popover p-4 text-popover-foreground shadow-lg outline-none transition-opacity duration-75",
      positioned ? "opacity-100" : "opacity-0",
      className
    )}
  >
    {@render children()}
  </div>
{/if}

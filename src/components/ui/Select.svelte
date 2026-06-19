<script lang="ts">
  import { cn } from "@/lib/utils";
  import { Check, ChevronDown } from "@lucide/svelte";

  type Choice = { value: string; label: string };

  let {
    value = "",
    choices,
    onValueChange,
    id,
    class: className = "",
  }: {
    value?: string;
    choices: Choice[];
    onValueChange?: (value: string) => void;
    id?: string;
    class?: string;
  } = $props();

  let open = $state(false);
  let rootEl: HTMLDivElement | undefined = $state();

  const current = $derived(choices.find((c) => c.value === value));

  function pick(v: string) {
    open = false;
    onValueChange?.(v);
  }

  function onWindowClick(e: MouseEvent) {
    if (open && rootEl && !rootEl.contains(e.target as Node)) open = false;
  }
</script>

<svelte:window
  onclick={onWindowClick}
  onkeydown={(e) => e.key === "Escape" && (open = false)}
/>

<div bind:this={rootEl} class="relative">
  <button
    {id}
    type="button"
    aria-haspopup="listbox"
    aria-expanded={open}
    onclick={() => (open = !open)}
    class={cn(
      "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-background/50 px-3 py-2 text-left text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background",
      className
    )}
  >
    <span class="line-clamp-1 truncate">{current?.label ?? "Select…"}</span>
    <ChevronDown class="h-4 w-4 shrink-0 opacity-50" />
  </button>

  {#if open}
    <div
      role="listbox"
      class="absolute z-50 mt-1 max-h-72 w-full min-w-[16rem] overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
    >
      {#each choices as c (c.value)}
        <button
          type="button"
          role="option"
          aria-selected={c.value === value}
          onclick={() => pick(c.value)}
          class="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground"
        >
          <span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            {#if c.value === value}
              <Check class="h-4 w-4" />
            {/if}
          </span>
          {c.label}
        </button>
      {/each}
    </div>
  {/if}
</div>

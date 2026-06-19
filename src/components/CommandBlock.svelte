<script lang="ts">
  import CopyIcon from "./ui/CopyIcon.svelte";
  import { copyText } from "@/lib/utils";

  let { command }: { command: string } = $props();
  let copied = $state(false);
  let flash = $state(false);

  async function copy() {
    await copyText(command);
    copied = true;
    flash = false;
    setTimeout(() => (flash = true), 0);
    setTimeout(() => (copied = false), 1400);
    setTimeout(() => (flash = false), 720);
  }
</script>

<div
  class={`group relative ml-7 rounded-md border border-border/60 bg-[#0c1320] ${flash ? "copy-flash" : ""}`}
>
  <pre
    class="scrollbar-thin overflow-x-auto px-3 py-2 font-mono text-[12px] leading-relaxed text-sky-200">{command}</pre>
  <button
    onclick={copy}
    aria-label="Copy command"
    class={`absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded transition hover:bg-muted hover:text-foreground ${copied ? "opacity-100 text-emerald-400" : "text-muted-foreground opacity-0 group-hover:opacity-100"}`}
  >
    <CopyIcon {copied} size="h-3 w-3" />
  </button>
</div>

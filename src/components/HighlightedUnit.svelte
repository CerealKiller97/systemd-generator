<script lang="ts">
  let { content }: { content: string } = $props();
  const lines = $derived(content.replace(/\n$/, "").split("\n"));
  const eqIndex = (line: string) => line.indexOf("=");
  const isSection = (line: string) => /^\s*\[.*\]\s*$/.test(line);
</script>

<code class="block">
  {#each lines as line, i (i)}
    <div class="table-row">
      <span
        class="table-cell select-none pr-4 text-right text-xs tabular-nums text-muted-foreground/40"
      >
        {i + 1}
      </span>
      <span class="table-cell whitespace-pre-wrap break-all">
        {#if line.trim().startsWith("#")}
          <span class="italic text-muted-foreground/70">{line}</span>
        {:else if isSection(line)}
          <span class="font-semibold text-primary">{line}</span>
        {:else if eqIndex(line) > 0}
          <span class="text-sky-300">{line.slice(0, eqIndex(line))}</span><span
            class="text-muted-foreground">=</span
          ><span class="text-emerald-300">{line.slice(eqIndex(line) + 1)}</span>
        {:else}
          <span>{line}</span>
        {/if}
      </span>
    </div>
  {/each}
</code>

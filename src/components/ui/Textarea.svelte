<script lang="ts">
  import { cn } from "@/lib/utils";
  import type { HTMLTextareaAttributes } from "svelte/elements";

  let {
    class: className = "",
    value = "",
    ...rest
  }: HTMLTextareaAttributes & { class?: string } = $props();
</script>

<textarea
  {value}
  class={cn(
    "flex min-h-[60px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
    className
  )}
  {...rest}
></textarea>

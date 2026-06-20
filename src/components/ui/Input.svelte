<script lang="ts">
    import { cn } from "@/lib/utils";
    import type { HTMLInputAttributes } from "svelte/elements";

    type Props = HTMLInputAttributes & { class?: string };

    let { class: className = "", value = "", ...rest }: Props = $props();
</script>

<input
    {value}
    class={cn(
        "flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        className,
    )}
    {...rest}
/>

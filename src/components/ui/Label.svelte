<script lang="ts">
    import { cn } from "@/lib/utils";
    import type { Snippet } from "svelte";
    import type { HTMLLabelAttributes } from "svelte/elements";

    type Props = HTMLLabelAttributes & { class?: string; children?: Snippet };

    let { class: className = "", children, ...rest }: Props = $props();
</script>

<label class={cn("text-sm font-medium leading-none", className)} {...rest}>
    {@render children?.()}
</label>

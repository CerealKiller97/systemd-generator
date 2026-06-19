<script lang="ts">
  import { cva } from "class-variance-authority";
  import { cn } from "@/lib/utils";
  import type { Snippet } from "svelte";

  const badgeVariants = cva(
    "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
    {
      variants: {
        variant: {
          default: "border-transparent bg-primary/15 text-primary",
          secondary: "border-transparent bg-secondary text-secondary-foreground",
          outline: "text-foreground",
          muted: "border-transparent bg-muted text-muted-foreground",
        },
      },
      defaultVariants: { variant: "default" },
    }
  );

  type Variant = "default" | "secondary" | "outline" | "muted";

  let {
    variant = "default" as Variant,
    class: className = "",
    children,
  }: { variant?: Variant; class?: string; children?: Snippet } = $props();
</script>

<div class={cn(badgeVariants({ variant }), className)}>
  {@render children?.()}
</div>

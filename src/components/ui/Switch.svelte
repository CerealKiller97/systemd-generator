<script lang="ts">
    import { cn } from "@/lib/utils";

    type Props = {
        checked?: boolean;
        onCheckedChange?: (checked: boolean) => void;
        id?: string;
        class?: string;
        ariaLabel?: string;
    };

    let { checked = false, onCheckedChange, id, class: className = "", ariaLabel = "Toggle option" }: Props = $props();

    function toggle() {
        onCheckedChange?.(!checked);
    }
</script>

<button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    {id}
    onclick={toggle}
    class={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        checked ? "bg-primary" : "bg-input",
        className,
    )}
>
    <span
        class={cn(
            "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
            checked ? "translate-x-4" : "translate-x-0",
        )}
    ></span>
</button>

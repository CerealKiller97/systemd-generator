<script lang="ts">
    import { Info, ExternalLink, Sparkles } from "@lucide/svelte";
    import { type SystemdOption, docUrl } from "@/lib/systemd-options";
    import Input from "@/components/ui/Input.svelte";
    import Textarea from "@/components/ui/Textarea.svelte";
    import Label from "@/components/ui/Label.svelte";
    import Switch from "@/components/ui/Switch.svelte";
    import Badge from "@/components/ui/Badge.svelte";
    import Select from "@/components/ui/Select.svelte";
    import Popover from "@/components/ui/Popover.svelte";
    import { trackEvent } from "@/lib/umami";

    type Props = {
        option: SystemdOption;
        id: string;
        value: string;
        onChange: (value: string) => void;
    };

    let { option, id, value, onChange }: Props = $props();

    const active = $derived(
        option.type === "boolean"
            ? value !== (option.default ?? "no") && value !== ""
            : option.type === "select"
              ? value !== "" && value !== option.default
              : value.trim() !== "",
    );
</script>

<div class="group rounded-lg px-2 py-2 transition-colors hover:bg-muted/40">
    <div class="mb-1.5 flex items-center gap-1.5">
        <Label for={id} class="flex items-center gap-1.5 font-mono text-[13px]">
            {option.key}
            {#if active}
                <span class="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px] shadow-primary"></span>
            {/if}
        </Label>

        {#if option.recommended}
            <Badge variant="default" class="gap-1 px-1.5 py-0 text-[10px]">
                <Sparkles class="h-2.5 w-2.5" />
                recommended
            </Badge>
        {/if}

        <Popover label={`Info about ${option.key}`} onOpen={() => trackEvent("info-popup", { directive: option.key })}>
            {#snippet trigger()}
                <span class="inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-primary/15">
                    <Info class="h-3.5 w-3.5" />
                </span>
            {/snippet}
            {#snippet children()}
                <div class="space-y-2.5">
                    <div class="flex items-center justify-between gap-2">
                        <span class="font-mono text-sm font-semibold text-primary">{option.key}</span>
                        <Badge variant="muted" class="text-[10px]">{option.manpage}</Badge>
                    </div>
                    <p class="text-[13px] leading-relaxed text-muted-foreground">
                        {option.info}
                    </p>
                    {#if option.example}
                        <div class="rounded-md border border-border/70 bg-muted/50 px-2.5 py-1.5">
                            <span class="text-[10px] uppercase tracking-wide text-muted-foreground/70">Example</span>
                            <pre
                                class="mt-0.5 overflow-x-auto font-mono text-[12px] text-emerald-300">{option.example}</pre>
                        </div>
                    {/if}
                    <a
                        href={docUrl(option.manpage, option.key)}
                        target="_blank"
                        rel="noreferrer"
                        class="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
                    >
                        Read the {option.manpage} docs
                        <ExternalLink class="h-3 w-3" />
                    </a>
                </div>
            {/snippet}
        </Popover>

        <div class="flex-1"></div>

        {#if option.type === "boolean"}
            <Switch
                {id}
                ariaLabel={`Toggle ${option.key}`}
                checked={value === "yes"}
                onCheckedChange={(c) => onChange(c ? "yes" : "no")}
            />
        {/if}
    </div>

    {#if option.type === "text" || option.type === "number" || option.type === "list"}
        <Input
            {id}
            inputmode={option.type === "number" ? "numeric" : undefined}
            placeholder={option.placeholder}
            {value}
            spellcheck={false}
            class="font-mono text-[13px]"
            oninput={(e) => onChange(e.currentTarget.value)}
        />
    {:else if option.type === "textarea"}
        <Textarea
            {id}
            placeholder={option.placeholder}
            {value}
            spellcheck={false}
            rows={2}
            class="font-mono text-[13px]"
            oninput={(e) => onChange(e.currentTarget.value)}
        />
    {:else if option.type === "select"}
        <Select
            {id}
            value={value || option.default || ""}
            choices={option.choices ?? []}
            onValueChange={onChange}
            class="font-mono text-[13px]"
        />
    {/if}
</div>

<script lang="ts">
    import { Terminal } from "@lucide/svelte";
    import CommandBlock from "./CommandBlock.svelte";

    import type { UnitMode } from "@/lib/systemd-generate";

    type Props = {
        unitName: string;
        mode?: UnitMode;
    };

    let { unitName, mode = "service" }: Props = $props();

    const suffix = $derived(`.${mode}`);
    const name = $derived(unitName.endsWith(suffix) ? unitName : `${unitName}${suffix}`);
    // A timer activates the .service of the same name unless Unit= says otherwise.
    const serviceName = $derived(name.replace(/\.timer$/, ".service"));

    const timerSteps = $derived([
        {
            cmd: `sudo tee /etc/systemd/system/${serviceName} > /dev/null <<'EOF'\n[Service]\nType=oneshot\nExecStart=/usr/local/bin/myapp --job\nEOF`,
            note: `A timer only schedules — it needs a service to run. Create ${serviceName} (Type=oneshot suits jobs that run and exit), or point Unit= at an existing one. Don't enable the service itself.`,
        },
        {
            cmd: `sudo tee /etc/systemd/system/${name} > /dev/null <<'EOF'\n# …paste the generated file here…\nEOF`,
            note: "Place the timer file next to it in /etc/systemd/system/.",
        },
        {
            cmd: `sudo systemd-analyze verify /etc/systemd/system/${name}`,
            note: "Sanity-check both files for syntax errors and unknown directives.",
        },
        {
            cmd: `sudo systemctl daemon-reload`,
            note: "Make systemd aware of the new or changed unit files.",
        },
        {
            cmd: `sudo systemctl enable --now ${name}`,
            note: "Enable and start the timer (not the service). It will now fire on schedule and after every boot.",
        },
        {
            cmd: `systemctl list-timers ${name}`,
            note: `See when it last ran and when it fires next. Use journalctl -u ${serviceName} to read the job's output, and systemctl start ${serviceName} to test it right now.`,
        },
    ]);

    const serviceSteps = $derived([
        {
            cmd: `sudo tee /etc/systemd/system/${name} > /dev/null <<'EOF'\n# …paste the generated file here…\nEOF`,
            note: "Place the unit file. System-wide units live in /etc/systemd/system/. (Or just drop your downloaded file there with sudo cp.)",
        },
        {
            cmd: `sudo systemd-analyze verify /etc/systemd/system/${name}`,
            note: "Sanity-check the file for syntax errors and unknown directives.",
        },
        {
            cmd: `sudo systemctl daemon-reload`,
            note: "Make systemd aware of the new or changed unit file.",
        },
        {
            cmd: `sudo systemctl enable --now ${name}`,
            note: "Start it immediately AND enable it to start on boot. Drop --now to only enable.",
        },
        {
            cmd: `systemctl status ${name}`,
            note: `Check it's running. Use journalctl -u ${name} -f to follow logs.`,
        },
    ]);

    const steps = $derived(mode === "timer" ? timerSteps : serviceSteps);
</script>

<div class="overflow-hidden rounded-xl border border-border/60 bg-card/40">
    <div class="flex items-center gap-2 border-b border-border/60 px-4 py-2.5">
        <Terminal class="h-4 w-4 text-primary" />
        <span class="text-sm font-semibold">Set it up</span>
        <span class="text-xs text-muted-foreground">run these on the target machine</span>
    </div>
    <ol class="divide-y divide-border/40">
        {#each steps as s, i (i)}
            <li class="px-4 py-3">
                <div class="mb-1.5 flex items-start gap-2">
                    <span
                        class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary"
                    >
                        {i + 1}
                    </span>
                    <p class="text-xs leading-relaxed text-muted-foreground">{s.note}</p>
                </div>
                <CommandBlock command={s.cmd} />
            </li>
        {/each}
    </ol>
</div>

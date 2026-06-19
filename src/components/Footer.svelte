<script lang="ts">
    import { Cog, ShieldCheck, ArrowUpRight, Terminal } from "@lucide/svelte";
    import { trackEvent } from "@/lib/umami";
    import { PORTFOLIO_URL } from "@/lib/site";
</script>

<footer class="relative mt-6">
    <div
        class="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
    ></div>

    <div class="mx-auto max-w-[1500px] px-5 pb-10 pt-8">
        <div
            class="overflow-hidden rounded-xl border border-border/60 bg-card/35 shadow-[0_1px_0_0_hsl(var(--primary)/0.06)_inset]"
        >
            <div
                class="flex flex-col gap-3 border-b border-border/50 bg-primary/[0.04] px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
            >
                <div
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/25"
                >
                    <ShieldCheck class="h-4 w-4 text-emerald-400" />
                </div>
                <p class="text-sm leading-relaxed text-muted-foreground">
                    Generated entirely in your browser — nothing is uploaded.
                    <span class="text-foreground/80">
                        Validate with
                        <code
                            class="mx-0.5 rounded-md bg-background/60 px-1.5 py-0.5 font-mono text-[12px] text-primary ring-1 ring-border/60"
                        >
                            systemd-analyze verify
                        </code>
                        before deploying.
                    </span>
                </p>
            </div>

            <div class="flex flex-col items-center justify-between gap-5 px-4 py-5 sm:flex-row sm:px-5">
                <div class="flex items-center gap-3">
                    <div
                        class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/25"
                    >
                        <Cog class="h-4 w-4 text-primary" />
                    </div>
                    <div class="text-left">
                        <p class="text-sm font-medium text-foreground">Made by Stefan Bogdanović</p>
                        <a
                            href={PORTFOLIO_URL}
                            target="_blank"
                            rel="noopener"
                            onclick={() => trackEvent("visit-portfolio")}
                            class="group inline-flex items-center gap-1 text-sm text-primary transition-colors hover:text-primary/80"
                        >
                            stefanbogdanovic.dev
                            <ArrowUpRight
                                class="h-3.5 w-3.5 opacity-70 transition-transform group-hover:-translate-y-px group-hover:translate-x-px"
                            />
                        </a>
                    </div>
                </div>

                <div class="flex flex-col items-center gap-3 sm:items-end sm:text-right">
                    <div
                        class="flex items-center gap-2.5 rounded-lg border border-border/50 bg-background/30 px-3.5 py-2.5"
                    >
                        <div
                            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sky-500/10 ring-1 ring-sky-500/20"
                        >
                            <Terminal class="h-4 w-4 text-sky-400" />
                        </div>
                        <div>
                            <p class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                Built for
                            </p>
                            <p class="text-sm font-semibold leading-tight text-foreground">Linux admins</p>
                        </div>
                    </div>

                    <p class="text-sm leading-snug text-muted-foreground">
                        from
                        <span class="font-medium text-foreground">dev</span>
                        to
                        <span class="font-semibold text-primary">devs</span>
                    </p>
                </div>
            </div>
        </div>
    </div>
</footer>

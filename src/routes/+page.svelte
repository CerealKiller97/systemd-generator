<script lang="ts">
  import { onMount } from "svelte";
  import { replaceState } from "$app/navigation";
  import { slide, fly, fade } from "svelte/transition";
  import {
    Cog,
    Download,
    RotateCcw,
    Search,
    ShieldCheck,
    ChevronDown,
    ChevronRight,
    Star,
    Share2,
    Link2,
    AlertTriangle,
    Info,
    CircleCheck,
    Circle,
  } from "@lucide/svelte";
  import { SECTIONS } from "@/lib/systemd-options";
  import {
    type FormState,
    fieldId,
    generateUnitFile,
    defaultState,
  } from "@/lib/systemd-generate";
  import { hardeningScore, validate, type LintLevel } from "@/lib/analyze";
  import { encodeShare, decodeShare } from "@/lib/share";
  import CopyIcon from "@/components/ui/CopyIcon.svelte";
  import { copyText } from "@/lib/utils";
  import OptionField from "@/components/OptionField.svelte";
  import HighlightedUnit from "@/components/HighlightedUnit.svelte";
  import SetupInstructions from "@/components/SetupInstructions.svelte";
  import Button from "@/components/ui/Button.svelte";
  import Input from "@/components/ui/Input.svelte";
  import Badge from "@/components/ui/Badge.svelte";
  import Footer from "@/components/Footer.svelte";
  import { trackEvent } from "@/lib/umami";
  import { GITHUB_REPO_URL } from "@/lib/site";

  let form: FormState = $state(defaultState());
  let query = $state("");
  let unitName = $state("myapp.service");
  let copied = $state(false);
  let shared = $state(false);
  let flash = $state(false);
  let showChecks = $state(false);
  let openMap: Record<number, boolean> = $state(
    Object.fromEntries(SECTIONS.map((s, i) => [i, !!s.defaultOpen]))
  );

  const result = $derived(generateUnitFile(form));
  const q = $derived(query.trim().toLowerCase());
  const hardening = $derived(hardeningScore(form));
  const lints = $derived(validate(form));

  // Restore a shared config from the URL hash on first load.
  onMount(() => {
    const token = location.hash.slice(1);
    if (!token) return;
    const decoded = decodeShare(token);
    if (decoded) {
      form = decoded.form;
      unitName = decoded.unitName;
      trackEvent("open-shared-link");
    }
  });

  const scoreColor = (s: number) =>
    s >= 7 ? "text-emerald-400" : s >= 4 ? "text-amber-400" : "text-rose-400";
  const scoreBar = (s: number) =>
    s >= 7 ? "bg-emerald-400" : s >= 4 ? "bg-amber-400" : "bg-rose-400";

  const lintColor: Record<LintLevel, string> = {
    error: "text-rose-400",
    warning: "text-amber-400",
    info: "text-sky-400",
  };
  const LintIcon: Record<LintLevel, typeof Info> = {
    error: AlertTriangle,
    warning: AlertTriangle,
    info: Info,
  };

  function set(id: string, value: string) {
    form[id] = value;
  }

  function reset() {
    form = defaultState();
    trackEvent("reset-form");
  }

  function matches(o: (typeof SECTIONS)[number]["options"][number]) {
    if (!q) return true;
    return (
      o.key.toLowerCase().includes(q) ||
      o.label.toLowerCase().includes(q) ||
      o.info.toLowerCase().includes(q)
    );
  }

  async function copy() {
    await copyText(result.content);
    trackEvent("copy-unit", { unit: unitName || "myapp.service" });
    copied = true;
    // toggle off→on in a fresh task so the CSS flash restarts on rapid re-clicks
    flash = false;
    setTimeout(() => (flash = true), 0);
    setTimeout(() => (copied = false), 1600);
    setTimeout(() => (flash = false), 720);
  }

  async function share() {
    const token = encodeShare(form, unitName || "myapp.service");
    const url = `${location.origin}${location.pathname}#${token}`;
    // SvelteKit owns the history stack; use its replaceState so the hash isn't
    // stripped by the router on the next tick.
    replaceState(`#${token}`, {});
    await copyText(url);
    trackEvent("share-link");
    shared = true;
    setTimeout(() => (shared = false), 1600);
  }

  function download() {
    trackEvent("download-unit", { unit: unitName || "myapp.service" });
    const blob = new Blob([result.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = unitName || "myapp.service";
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="min-h-screen bg-background">
  <!-- background glow -->
  <div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    <div
      class="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-[120px]"
    ></div>
    <div
      class="absolute -bottom-40 right-1/4 h-96 w-96 rounded-full bg-sky-500/10 blur-[120px]"
    ></div>
  </div>

  <!-- Header -->
  <header
    class="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl"
  >
    <div class="mx-auto flex max-w-[1500px] items-center gap-3 px-5 py-3">
      <div
        class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30"
      >
        <Cog class="h-5 w-5 text-primary" />
      </div>
      <div class="leading-tight">
        <h1 class="text-[15px] font-semibold tracking-tight">
          systemd Unit Generator
        </h1>
        <p class="text-xs text-muted-foreground">
          Build, understand &amp; export a
          <code class="text-primary">.service</code> file
        </p>
      </div>
      <Badge variant="muted" class="ml-1 hidden sm:flex">
        {result.count}
        {result.count === 1 ? "directive" : "directives"}
      </Badge>
      <div class="flex-1"></div>
      <a
        href={GITHUB_REPO_URL}
        target="_blank"
        rel="noreferrer"
        onclick={() => trackEvent("star-project")}
        class="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-transparent px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Star class="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        <span class="hidden sm:inline">Star this project</span>
      </a>
      <Button variant="outline" size="sm" onclick={reset}>
        <RotateCcw class="h-3.5 w-3.5" />
        Reset
      </Button>
    </div>
  </header>

  <!-- Body -->
  <main
    class="mx-auto grid max-w-[1500px] grid-cols-1 gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)]"
  >
    <!-- LEFT — form -->
    <section class="min-w-0">
      <div class="relative mb-4">
        <Search
          class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Filter options (e.g. Restart, User, Protect…)"
          value={query}
          oninput={(e) => (query = e.currentTarget.value)}
          class="pl-9"
        />
      </div>

      <div class="space-y-2">
        {#each SECTIONS as section, sectionIndex (sectionIndex)}
          {@const opts = section.options.filter(matches)}
          {#if opts.length > 0}
            {@const isOpen = q ? true : openMap[sectionIndex]}
            <div
              class="overflow-hidden rounded-xl border border-border/60 bg-card/40"
            >
              <button
                type="button"
                onclick={() => (openMap[sectionIndex] = !openMap[sectionIndex])}
                class="flex w-full items-center justify-between gap-2 px-4 py-4 text-left transition-colors hover:text-primary"
              >
                <div class="flex items-center gap-2">
                  {#if section.title === "Security hardening"}
                    <ShieldCheck class="h-4 w-4 text-emerald-400" />
                  {/if}
                  <div>
                    <div class="font-mono text-sm font-semibold text-foreground">
                      {section.title}
                    </div>
                    <div
                      class="mt-0.5 max-w-xl text-xs font-normal text-muted-foreground"
                    >
                      {section.description}
                    </div>
                  </div>
                  <Badge variant="muted" class="ml-1">{opts.length}</Badge>
                </div>
                <ChevronDown
                  class={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              {#if isOpen}
                <div transition:slide={{ duration: 180 }} class="px-2 pb-3">
                  <div class="divide-y divide-border/40">
                    {#each opts as opt (opt.key)}
                      {@const id = fieldId(sectionIndex, opt.key)}
                      <OptionField
                        {id}
                        option={opt}
                        value={form[id] ?? ""}
                        onChange={(v) => set(id, v)}
                      />
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          {/if}
        {/each}
      </div>
    </section>

    <!-- RIGHT — code + instructions -->
    <section class="min-w-0">
      <div class="space-y-4 lg:sticky lg:top-[72px]">
        <div
          class={`overflow-hidden rounded-xl border border-border/60 bg-[#0c1320] shadow-xl ${flash ? "copy-flash" : ""}`}
        >
          <!-- editor chrome -->
          <div
            class="flex items-center gap-2 border-b border-border/60 bg-card/60 px-3 py-2"
          >
            <div class="flex gap-1.5 pl-1">
              <span class="h-3 w-3 rounded-full bg-[#ff5f56]"></span>
              <span class="h-3 w-3 rounded-full bg-[#ffbd2e]"></span>
              <span class="h-3 w-3 rounded-full bg-[#27c93f]"></span>
            </div>
            <Input
              value={unitName}
              oninput={(e) => (unitName = e.currentTarget.value)}
              spellcheck={false}
              class="ml-2 h-7 w-48 border-transparent bg-transparent font-mono text-xs focus-visible:border-input"
            />
            <div class="flex-1"></div>
            <Button
              variant="ghost"
              size="sm"
              onclick={copy}
              class={copied ? "text-emerald-400" : ""}
            >
              <CopyIcon {copied} />
              {#if copied}
                <span in:fly={{ y: 6, duration: 200 }}>Copied</span>
              {:else}
                <span in:fade={{ duration: 120 }}>Copy</span>
              {/if}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onclick={share}
              class={shared ? "text-emerald-400" : ""}
            >
              {#if shared}
                <Link2 class="h-3.5 w-3.5" />
                <span in:fly={{ y: 6, duration: 200 }}>Link copied</span>
              {:else}
                <Share2 class="h-3.5 w-3.5" />
                <span in:fade={{ duration: 120 }}>Share</span>
              {/if}
            </Button>
            <Button variant="ghost" size="sm" onclick={download}>
              <Download class="h-3.5 w-3.5" />
              Download
            </Button>
          </div>
          <!-- code -->
          <div
            class="scrollbar-thin max-h-[52vh] overflow-auto p-4 font-mono text-[13px] leading-relaxed"
          >
            <HighlightedUnit content={result.content} />
          </div>
        </div>

        <!-- Analysis: hardening score + validation -->
        <div class="rounded-xl border border-border/60 bg-card/40">
          <!-- hardening score -->
          <div class="flex items-center gap-3 px-4 py-3">
            <ShieldCheck class={`h-5 w-5 shrink-0 ${scoreColor(hardening.score)}`} />
            <div class="min-w-0 flex-1">
              <div class="flex items-baseline justify-between gap-2">
                <span class="text-sm font-semibold text-foreground"
                  >Hardening score</span
                >
                <span class={`font-mono text-sm font-semibold ${scoreColor(hardening.score)}`}>
                  {hardening.score.toFixed(1)}<span class="text-muted-foreground"
                    >/10</span
                  >
                </span>
              </div>
              <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  class={`h-full rounded-full transition-all duration-300 ${scoreBar(hardening.score)}`}
                  style={`width:${hardening.score * 10}%`}
                ></div>
              </div>
            </div>
          </div>

          <!-- per-check breakdown (collapsible) -->
          <button
            type="button"
            onclick={() => (showChecks = !showChecks)}
            class="flex w-full items-center gap-1.5 border-t border-border/40 px-4 py-2 text-left text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronRight
              class={`h-3.5 w-3.5 transition-transform duration-200 ${showChecks ? "rotate-90" : ""}`}
            />
            {hardening.passed} of {hardening.total} measures applied
          </button>
          {#if showChecks}
            <div transition:slide={{ duration: 160 }} class="px-4 pb-3">
              <ul class="space-y-1.5">
                {#each hardening.checks as check (check.label)}
                  <li class="flex items-start gap-2 text-xs">
                    {#if check.satisfied}
                      <CircleCheck class="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    {:else}
                      <Circle class="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                    {/if}
                    <span class={check.satisfied ? "text-foreground" : "text-muted-foreground"}>
                      <span class="font-mono">{check.label}</span>
                      <span class="text-muted-foreground"> — {check.hint}</span>
                    </span>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}

          <!-- lints -->
          <div class="border-t border-border/40 px-4 py-3">
            {#if lints.length === 0}
              <div class="flex items-center gap-2 text-xs text-emerald-400">
                <CircleCheck class="h-3.5 w-3.5" />
                No issues found — looks good.
              </div>
            {:else}
              <ul class="space-y-2">
                {#each lints as lint (lint.message)}
                  {@const Icon = LintIcon[lint.level]}
                  <li class="flex items-start gap-2 text-xs leading-relaxed">
                    <Icon class={`mt-0.5 h-3.5 w-3.5 shrink-0 ${lintColor[lint.level]}`} />
                    <span class="text-muted-foreground">{lint.message}</span>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        </div>

        <SetupInstructions unitName={unitName || "myapp.service"} />
      </div>
    </section>
  </main>

  <Footer />
</div>

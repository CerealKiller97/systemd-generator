<script lang="ts">
    import "../index.css";
    import { PUBLIC_UMAMI_SITE_ID } from "$env/static/public";
    import { UMAMI_SCRIPT_URL } from "$lib/umami";
    import { SITE_ORIGIN } from "$lib/site";

    let { children } = $props();

    const siteUrl = SITE_ORIGIN;

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "systemd Unit Generator",
        url: `${siteUrl}/`,
        description:
            "A free, in-browser tool to build, understand and export systemd .service unit files with an info popup on every directive and a live, syntax-highlighted editor.",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Any (web browser)",
        browserRequirements: "Requires JavaScript",
        image: `${siteUrl}/og-image.png`,
        offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
        },
    };
</script>

<svelte:head>
    <title>systemd Unit Generator — Build & Export .service Files</title>
    <meta
        name="description"
        content="A free, in-browser systemd unit generator. Fill in the options, read what every directive does, and export a ready-to-use .service file with a live, syntax-highlighted editor. Includes security-hardening options and copy-paste setup commands."
    />
    <meta
        name="keywords"
        content="systemd, systemd generator, unit file, .service file, systemctl, ExecStart, service unit, Linux daemon, systemd hardening, unit file generator"
    />
    <meta name="author" content="systemd Unit Generator" />
    <meta name="robots" content="index, follow" />
    <meta name="theme-color" content="#0a1322" />
    <meta name="color-scheme" content="dark light" />
    <link rel="canonical" href="{siteUrl}/" />

    <link rel="icon" type="image/svg+xml" href="/cog.svg" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="systemd Unit Generator" />
    <meta property="og:title" content="systemd Unit Generator — Build & Export .service Files" />
    <meta
        property="og:description"
        content="Fill in the options, read what every directive does, and export a ready-to-use systemd .service file with a live editor — free and entirely in your browser."
    />
    <meta property="og:url" content="{siteUrl}/" />
    <meta property="og:image" content="{siteUrl}/og-image.png" />
    <meta property="og:image:secure_url" content="{siteUrl}/og-image.png" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta
        property="og:image:alt"
        content="systemd Unit Generator: a form of systemd directives on the left and a live .service file editor on the right."
    />
    <meta property="og:locale" content="en_US" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="systemd Unit Generator — Build & Export .service Files" />
    <meta
        name="twitter:description"
        content="Fill in the options, read what every directive does, and export a ready-to-use systemd .service file with a live editor — free, in your browser."
    />
    <meta name="twitter:image" content="{siteUrl}/og-image.png" />
    <meta
        name="twitter:image:alt"
        content="systemd Unit Generator interface: directives form and live .service editor."
    />

    <script type="application/ld+json">
    {JSON.stringify(structuredData)}
    </script>

    {#if PUBLIC_UMAMI_SITE_ID}
        <script defer src={UMAMI_SCRIPT_URL} data-website-id={PUBLIC_UMAMI_SITE_ID}></script>
    {/if}
</svelte:head>

{@render children()}

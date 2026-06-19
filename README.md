# systemd Unit Generator

A polished, single-page web app for building, understanding, and exporting
systemd `.service` unit files. Every directive has an inline **info popup**
explaining what it does, an example, and a link to the official man page. As you
fill in options on the left, a **live, syntax-highlighted editor** on the right
assembles the unit file in real time — then copy or download it and follow the
generated setup instructions.

Built with **SvelteKit 2 + Svelte 5 (runes) + TypeScript** and **Tailwind CSS**. The
UI components are shadcn-style primitives rebuilt natively in Svelte (no runtime
component library) — buttons, inputs, switch, a custom select, popovers, and an
accordion.

## Features

- **All the common directives**, grouped into `[Unit]`, `[Service]`, a dedicated
  **Security hardening** group, and `[Install]`.
- **Info popup on every option** — description, a concrete example, the man page
  it belongs to, and a deep link to the freedesktop.org docs.
- **Live code editor** — the `.service` file updates instantly with syntax
  highlighting. Defaults that match systemd's own are omitted automatically so
  the output stays clean.
- **Filter / search** options by name or description.
- **Copy** or **download** the file with your chosen unit name.
- **Step-by-step setup instructions** with copy-able shell commands, generated
  for your specific unit name.
- Everything runs **client-side** — nothing is uploaded.

## Prerequisites

- **Node.js 18+** (tested on Node 24)
- **pnpm** (or npm / yarn — adjust the commands accordingly)

```bash
# install pnpm if you don't have it
npm install -g pnpm
```

## Getting started

```bash
# 1. install dependencies
pnpm install

# 2. start the dev server (http://localhost:5173)
pnpm dev

# 3. type-check the Svelte + TS sources
pnpm check

# 4. build for production
pnpm build

# 5. preview the production build locally
pnpm preview
```

> **Note on pnpm 10+:** the first install may ask you to approve esbuild's
> build script. This repo already allows it via `pnpm-workspace.yaml`
> (`allowBuilds: { esbuild: true }`). If you use npm instead, no extra step is
> needed.

## How to use the app

1. Fill in the options you need on the left. Start with `Description`,
   `ExecStart`, `User`, and `Restart` — those cover most services.
2. Click the **ⓘ** next to any directive to read what it does and see an example.
3. Watch the unit file build up on the right.
4. Set the file name (e.g. `myapp.service`) in the editor header.
5. **Copy** or **Download** the file.
6. Follow the **"Set it up"** steps to install it on your server.

## Deploying the unit file (also shown in-app)

```bash
# put the file in place (system-wide units live here)
sudo cp myapp.service /etc/systemd/system/

# sanity-check it
sudo systemd-analyze verify /etc/systemd/system/myapp.service

# reload systemd, then start + enable on boot
sudo systemctl daemon-reload
sudo systemctl enable --now myapp.service

# check status and follow logs
systemctl status myapp.service
journalctl -u myapp.service -f
```

For a **user** service instead of system-wide, drop it in
`~/.config/systemd/user/` and use `systemctl --user …`.

## SEO & social sharing

`src/routes/+layout.svelte` ships with a full set of SEO tags: title/description/keywords,
canonical URL, `theme-color`, a web manifest, favicons + apple-touch-icon,
**Open Graph** and **Twitter Card** tags, and `WebApplication` JSON-LD
structured data. There's also a `static/robots.txt` and a `static/sitemap.xml`.

> **Before deploying:** confirm Open Graph and canonical tags use your live origin
> (`https://systemd-generateor.stefanbogdanovic.dev`) in `src/routes/+layout.svelte`,
> `static/robots.txt`, and `static/sitemap.xml`.

After deploying, validate the preview with the
[Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) and
[X Card Validator](https://cards-dev.twitter.com/validator).

### Regenerating the images

The social image and app icons are rasterized from SVG sources in `assets/`
using `rsvg-convert` (from `librsvg`; `brew install librsvg`):

```bash
# 1200×630 Open Graph / Twitter image
rsvg-convert -w 1200 -h 630 assets/og-image.svg -o static/og-image.png

# app icons
rsvg-convert -w 512 -h 512 assets/icon.svg -o static/icon-512.png
rsvg-convert -w 192 -h 192 assets/icon.svg -o static/icon-192.png
rsvg-convert -w 180 -h 180 assets/icon.svg -o static/apple-touch-icon.png
rsvg-convert -w 32  -h 32  assets/icon.svg -o static/favicon-32.png
```

Edit the `assets/*.svg` files to change wording or colors, then re-run the
commands above.

## Project structure

```
src/
  routes/
    +layout.svelte           # global styles, SEO meta tags
    +layout.ts                # prerender = true (static export)
    +page.svelte              # layout: header, form, live editor, setup steps
  components/
    ui/                      # shadcn-style primitives, native Svelte
      Button.svelte
      Input.svelte
      Textarea.svelte
      Label.svelte
      Badge.svelte
      Switch.svelte
      Select.svelte          # custom dropdown (click-outside, keyboard-escape)
      Popover.svelte         # info popup container
    OptionField.svelte       # one form row: label, value control, info popup
    HighlightedUnit.svelte   # syntax highlighter for the .service output
    SetupInstructions.svelte # the generated "Set it up" steps
    CommandBlock.svelte      # copy-able shell command
  lib/
    systemd-options.ts       # the data model: every directive + its help text
    systemd-generate.ts      # turns form state into a .service file
    utils.ts                 # cn() class helper
static/                      # robots.txt, sitemap, icons, manifest
```

The two `lib/*.ts` files are framework-agnostic — they were reused unchanged
when this project was ported from React to Svelte.

### Adding or editing directives

All directives live in [`src/lib/systemd-options.ts`](src/lib/systemd-options.ts)
as plain data. To add one, append a `SystemdOption` to the relevant section —
the form field, info popup, and generator pick it up automatically. No other
files need to change.

```ts
{
  key: "MemoryMax",
  label: "MemoryMax",
  type: "text",
  placeholder: "512M",
  info: "Hard memory limit. The service is killed if it exceeds this.",
  example: "MemoryMax=512M",
  manpage: "systemd.resource-control",
}
```

## License

MIT — do whatever you like.

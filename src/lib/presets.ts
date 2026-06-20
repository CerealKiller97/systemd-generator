import { fieldId } from "./systemd-generate";
import type { FormState } from "./systemd-generate";
import {
  Binary,
  CalendarClock,
  Cat,
  Gauge,
  Globe,
  Layers,
  ListChecks,
  ListTodo,
  Radio,
  Server,
  Wind,
  Zap,
  type Icon,
} from "@lucide/svelte";

/**
 * Section indices into SECTIONS (see systemd-options.ts). Two of these map to
 * the same [Service] block; the index is what makes a field id unique.
 */
const UNIT = 0;
const SERVICE = 1;
const HARDENING = 2;
const INSTALL = 3;

export type Preset = {
  /** Stable id, also used as the analytics label. */
  id: string;
  /** Short chip label. */
  label: string;
  /** Lucide icon component shown on the chip. */
  icon: typeof Icon;
  /** Ecosystem the preset belongs to, used to group the chips. */
  group: string;
  /** One-line tagline shown in the chip's tooltip. */
  description: string;
  /** Suggested file name for the generated unit. */
  unitName: string;
  /** Form values keyed by fieldId. Applied on top of an empty state. */
  fields: FormState;
  /** Optional caveats shown after the preset is loaded (Markdown-free text). */
  notes?: string;
};

// Conventions used across the Laravel presets. Tweakable per deploy, but these
// match the most common Forge / Ploi layout so the output is copy-paste ready.
const PHP = "/usr/bin/php";
const APP_DIR = "/var/www/example.com";
const DEPLOY_USER = "www-data";

/** Hardening that won't break a typical web-app deploy out of the box. */
const SAFE_HARDENING: FormState = {
  [fieldId(HARDENING, "NoNewPrivileges")]: "yes",
  [fieldId(HARDENING, "PrivateTmp")]: "yes",
  // `full` keeps /usr, /boot and /etc read-only while leaving the app dir
  // (under /var/www) writable. `strict` would also lock that down and break
  // Laravel's storage/ writes unless ReadWritePaths is set per project.
  [fieldId(HARDENING, "ProtectSystem")]: "full",
};

/**
 * Aggressive hardening that suits a self-contained binary which only writes to
 * its own StateDirectory. Pairs well with DynamicUser=yes.
 */
const STRICT_HARDENING: FormState = {
  [fieldId(HARDENING, "NoNewPrivileges")]: "yes",
  [fieldId(HARDENING, "PrivateTmp")]: "yes",
  [fieldId(HARDENING, "ProtectSystem")]: "strict",
  [fieldId(HARDENING, "ProtectHome")]: "yes",
};

export const PRESETS: Preset[] = [
  {
    id: "laravel-queue",
    label: "Queue Worker",
    icon: ListChecks,
    group: "Laravel",
    description: "php artisan queue:work — restarts on crash, drains jobs on stop",
    unitName: "laravel-queue.service",
    fields: {
      [fieldId(UNIT, "Description")]: "Laravel queue worker",
      [fieldId(UNIT, "After")]: "network-online.target",
      [fieldId(UNIT, "Wants")]: "network-online.target",
      [fieldId(SERVICE, "Type")]: "simple",
      [fieldId(SERVICE, "User")]: DEPLOY_USER,
      [fieldId(SERVICE, "Group")]: DEPLOY_USER,
      [fieldId(SERVICE, "WorkingDirectory")]: APP_DIR,
      [fieldId(SERVICE, "ExecStart")]:
        `${PHP} artisan queue:work --sleep=3 --tries=3 --max-time=3600`,
      [fieldId(SERVICE, "Restart")]: "always",
      [fieldId(SERVICE, "RestartSec")]: "5s",
      // queue:work catches SIGTERM and finishes the current job first; give it
      // room before systemd escalates to SIGKILL.
      [fieldId(SERVICE, "TimeoutStopSec")]: "90s",
      [fieldId(INSTALL, "WantedBy")]: "multi-user.target",
      ...SAFE_HARDENING,
    },
    notes:
      "Run several copies with `systemctl start laravel-queue@1` style templating by renaming the file to laravel-queue@.service. The --max-time flag recycles the worker hourly so it picks up freshly deployed code.",
  },
  {
    id: "laravel-horizon",
    label: "Horizon",
    icon: Gauge,
    group: "Laravel",
    description: "php artisan horizon — graceful terminate via horizon:terminate",
    unitName: "horizon.service",
    fields: {
      [fieldId(UNIT, "Description")]: "Laravel Horizon",
      [fieldId(UNIT, "After")]: "network-online.target",
      [fieldId(UNIT, "Wants")]: "network-online.target",
      [fieldId(SERVICE, "Type")]: "simple",
      [fieldId(SERVICE, "User")]: DEPLOY_USER,
      [fieldId(SERVICE, "Group")]: DEPLOY_USER,
      [fieldId(SERVICE, "WorkingDirectory")]: APP_DIR,
      [fieldId(SERVICE, "ExecStart")]: `${PHP} artisan horizon`,
      // horizon:terminate tells the master to finish in-flight jobs and exit.
      [fieldId(SERVICE, "ExecStop")]: `${PHP} artisan horizon:terminate`,
      [fieldId(SERVICE, "Restart")]: "always",
      [fieldId(SERVICE, "RestartSec")]: "5s",
      [fieldId(SERVICE, "TimeoutStopSec")]: "120s",
      [fieldId(INSTALL, "WantedBy")]: "multi-user.target",
      ...SAFE_HARDENING,
    },
    notes:
      "Only run ONE Horizon process per app — it manages its own worker pool from config/horizon.php. After deploying new code, `systemctl restart horizon` (or let horizon:terminate cycle it).",
  },
  {
    id: "laravel-reverb",
    label: "Reverb",
    icon: Radio,
    group: "Laravel",
    description: "php artisan reverb:start — WebSocket server, high FD limit",
    unitName: "reverb.service",
    fields: {
      [fieldId(UNIT, "Description")]: "Laravel Reverb WebSocket server",
      [fieldId(UNIT, "After")]: "network-online.target",
      [fieldId(UNIT, "Wants")]: "network-online.target",
      [fieldId(SERVICE, "Type")]: "simple",
      [fieldId(SERVICE, "User")]: DEPLOY_USER,
      [fieldId(SERVICE, "Group")]: DEPLOY_USER,
      [fieldId(SERVICE, "WorkingDirectory")]: APP_DIR,
      [fieldId(SERVICE, "ExecStart")]:
        `${PHP} artisan reverb:start --host=0.0.0.0 --port=8080`,
      [fieldId(SERVICE, "Restart")]: "always",
      [fieldId(SERVICE, "RestartSec")]: "5s",
      // Each WebSocket client is an open file descriptor; the default 1024 is
      // far too low for a connection server.
      [fieldId(SERVICE, "LimitNOFILE")]: "10000",
      [fieldId(INSTALL, "WantedBy")]: "multi-user.target",
      ...SAFE_HARDENING,
    },
    notes:
      "Put a TLS-terminating reverse proxy (nginx/Caddy) in front of port 8080 for wss://. Bump LimitNOFILE further if you expect more than ~10k concurrent connections.",
  },
  {
    id: "laravel-scheduler",
    label: "Scheduler",
    icon: CalendarClock,
    group: "Laravel",
    description: "php artisan schedule:run — oneshot, drive it from a .timer",
    unitName: "laravel-scheduler.service",
    fields: {
      [fieldId(UNIT, "Description")]: "Laravel scheduler",
      [fieldId(UNIT, "After")]: "network-online.target",
      [fieldId(UNIT, "Wants")]: "network-online.target",
      [fieldId(SERVICE, "Type")]: "oneshot",
      [fieldId(SERVICE, "User")]: DEPLOY_USER,
      [fieldId(SERVICE, "Group")]: DEPLOY_USER,
      [fieldId(SERVICE, "WorkingDirectory")]: APP_DIR,
      [fieldId(SERVICE, "ExecStart")]: `${PHP} artisan schedule:run`,
      ...SAFE_HARDENING,
    },
    notes:
      "This is the .service half only — it runs once and exits. Pair it with a companion laravel-scheduler.timer to fire it every minute:\n\n[Unit]\nDescription=Run the Laravel scheduler every minute\n\n[Timer]\nOnCalendar=*:0/1\nAccuracySec=1s\n\n[Install]\nWantedBy=timers.target\n\nThen: systemctl enable --now laravel-scheduler.timer",
  },

  // ── Node.js ───────────────────────────────────────────────────────────────
  {
    id: "nodejs-app",
    label: "App server",
    icon: Server,
    group: "Node.js",
    description: "node server.js — long-running app, restarts on crash",
    unitName: "node-app.service",
    fields: {
      [fieldId(UNIT, "Description")]: "Node.js application",
      [fieldId(UNIT, "After")]: "network-online.target",
      [fieldId(UNIT, "Wants")]: "network-online.target",
      [fieldId(SERVICE, "Type")]: "simple",
      [fieldId(SERVICE, "User")]: "deploy",
      [fieldId(SERVICE, "Group")]: "deploy",
      [fieldId(SERVICE, "WorkingDirectory")]: "/var/www/app",
      [fieldId(SERVICE, "ExecStart")]: "/usr/bin/node server.js",
      [fieldId(SERVICE, "Environment")]: "NODE_ENV=production",
      [fieldId(SERVICE, "Restart")]: "always",
      [fieldId(SERVICE, "RestartSec")]: "5s",
      [fieldId(INSTALL, "WantedBy")]: "multi-user.target",
      ...SAFE_HARDENING,
    },
    notes:
      "systemd already supervises and restarts the process, so you don't need pm2/forever on top. Point ExecStart at the built entrypoint (e.g. dist/main.js for TypeScript) and load secrets via an EnvironmentFile instead of inline Environment.",
  },
  {
    id: "nextjs",
    label: "Next.js",
    icon: Globe,
    group: "Node.js",
    description: "next start — production server on port 3000",
    unitName: "nextjs.service",
    fields: {
      [fieldId(UNIT, "Description")]: "Next.js production server",
      [fieldId(UNIT, "After")]: "network-online.target",
      [fieldId(UNIT, "Wants")]: "network-online.target",
      [fieldId(SERVICE, "Type")]: "simple",
      [fieldId(SERVICE, "User")]: "deploy",
      [fieldId(SERVICE, "Group")]: "deploy",
      [fieldId(SERVICE, "WorkingDirectory")]: "/var/www/app",
      [fieldId(SERVICE, "ExecStart")]: "/usr/bin/npm run start",
      [fieldId(SERVICE, "Environment")]: "NODE_ENV=production PORT=3000",
      [fieldId(SERVICE, "Restart")]: "always",
      [fieldId(SERVICE, "RestartSec")]: "5s",
      [fieldId(INSTALL, "WantedBy")]: "multi-user.target",
      ...SAFE_HARDENING,
    },
    notes:
      "Run `next build` during deploy (not here). Put nginx/Caddy in front of port 3000 for TLS. For the standalone output mode, swap ExecStart to `/usr/bin/node .next/standalone/server.js`.",
  },

  // ── Python ────────────────────────────────────────────────────────────────
  {
    id: "gunicorn",
    label: "Gunicorn (Django)",
    icon: Wind,
    group: "Python",
    description: "gunicorn wsgi — Type=notify WSGI server for Django/Flask",
    unitName: "gunicorn.service",
    fields: {
      [fieldId(UNIT, "Description")]: "Gunicorn WSGI server",
      [fieldId(UNIT, "After")]: "network-online.target",
      [fieldId(UNIT, "Wants")]: "network-online.target",
      // gunicorn signals readiness to systemd, so notify gives accurate startup.
      [fieldId(SERVICE, "Type")]: "notify",
      [fieldId(SERVICE, "User")]: "deploy",
      [fieldId(SERVICE, "Group")]: "deploy",
      [fieldId(SERVICE, "WorkingDirectory")]: "/var/www/app",
      [fieldId(SERVICE, "ExecStart")]:
        "/var/www/app/venv/bin/gunicorn myproject.wsgi:application --workers 3 --bind 127.0.0.1:8000",
      [fieldId(SERVICE, "Restart")]: "always",
      [fieldId(SERVICE, "RestartSec")]: "5s",
      [fieldId(INSTALL, "WantedBy")]: "multi-user.target",
      ...SAFE_HARDENING,
    },
    notes:
      "Replace myproject.wsgi with your project's WSGI module. To serve over a unix socket for nginx instead of a TCP port, bind to `unix:/run/gunicorn.sock` and add RuntimeDirectory=gunicorn so /run/gunicorn exists.",
  },
  {
    id: "uvicorn",
    label: "Uvicorn (FastAPI)",
    icon: Zap,
    group: "Python",
    description: "uvicorn main:app — ASGI server for FastAPI/Starlette",
    unitName: "uvicorn.service",
    fields: {
      [fieldId(UNIT, "Description")]: "Uvicorn ASGI server",
      [fieldId(UNIT, "After")]: "network-online.target",
      [fieldId(UNIT, "Wants")]: "network-online.target",
      [fieldId(SERVICE, "Type")]: "simple",
      [fieldId(SERVICE, "User")]: "deploy",
      [fieldId(SERVICE, "Group")]: "deploy",
      [fieldId(SERVICE, "WorkingDirectory")]: "/var/www/app",
      [fieldId(SERVICE, "ExecStart")]:
        "/var/www/app/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000",
      [fieldId(SERVICE, "Restart")]: "always",
      [fieldId(SERVICE, "RestartSec")]: "5s",
      [fieldId(INSTALL, "WantedBy")]: "multi-user.target",
      ...SAFE_HARDENING,
    },
    notes:
      "For multiple workers run uvicorn behind Gunicorn with the uvicorn worker class, or add `--workers 4`. Keep it bound to 127.0.0.1 and terminate TLS at a reverse proxy.",
  },
  {
    id: "celery-worker",
    label: "Celery worker",
    icon: ListTodo,
    group: "Python",
    description: "celery worker — drains tasks gracefully on stop",
    unitName: "celery.service",
    fields: {
      [fieldId(UNIT, "Description")]: "Celery worker",
      [fieldId(UNIT, "After")]: "network-online.target",
      [fieldId(UNIT, "Wants")]: "network-online.target",
      [fieldId(SERVICE, "Type")]: "simple",
      [fieldId(SERVICE, "User")]: "deploy",
      [fieldId(SERVICE, "Group")]: "deploy",
      [fieldId(SERVICE, "WorkingDirectory")]: "/var/www/app",
      [fieldId(SERVICE, "ExecStart")]:
        "/var/www/app/venv/bin/celery -A myproject worker --loglevel=info",
      [fieldId(SERVICE, "Restart")]: "always",
      [fieldId(SERVICE, "RestartSec")]: "5s",
      // Celery does a warm shutdown on SIGTERM, finishing in-flight tasks first.
      [fieldId(SERVICE, "TimeoutStopSec")]: "300s",
      [fieldId(INSTALL, "WantedBy")]: "multi-user.target",
      ...SAFE_HARDENING,
    },
    notes:
      "Run periodic tasks with a SEPARATE `celery -A myproject beat` service — don't fold the scheduler into the worker. Raise TimeoutStopSec above your longest task so systemd doesn't SIGKILL a job mid-flight.",
  },

  // ── Ruby ──────────────────────────────────────────────────────────────────
  {
    id: "sidekiq",
    label: "Sidekiq",
    icon: Layers,
    group: "Ruby",
    description: "bundle exec sidekiq — background jobs for Rails",
    unitName: "sidekiq.service",
    fields: {
      [fieldId(UNIT, "Description")]: "Sidekiq background jobs",
      [fieldId(UNIT, "After")]: "network-online.target",
      [fieldId(UNIT, "Wants")]: "network-online.target",
      [fieldId(SERVICE, "Type")]: "simple",
      [fieldId(SERVICE, "User")]: "deploy",
      [fieldId(SERVICE, "Group")]: "deploy",
      [fieldId(SERVICE, "WorkingDirectory")]: "/var/www/app",
      [fieldId(SERVICE, "Environment")]: "RAILS_ENV=production",
      [fieldId(SERVICE, "ExecStart")]: "/usr/local/bin/bundle exec sidekiq -e production",
      [fieldId(SERVICE, "Restart")]: "always",
      [fieldId(SERVICE, "RestartSec")]: "5s",
      // Give Sidekiq longer than its own -t shutdown timeout (default 25s).
      [fieldId(SERVICE, "TimeoutStopSec")]: "60s",
      [fieldId(INSTALL, "WantedBy")]: "multi-user.target",
      ...SAFE_HARDENING,
    },
    notes:
      "On SIGTERM Sidekiq stops fetching and finishes running jobs. Keep TimeoutStopSec above the `-t` shutdown timeout. Sidekiq 6+ can use Type=notify with WatchdogSec for liveness — switch once you've confirmed it boots cleanly.",
  },
  {
    id: "puma",
    label: "Puma (Rails)",
    icon: Cat,
    group: "Ruby",
    description: "bundle exec puma — Rails/Rack app server",
    unitName: "puma.service",
    fields: {
      [fieldId(UNIT, "Description")]: "Puma application server",
      [fieldId(UNIT, "After")]: "network-online.target",
      [fieldId(UNIT, "Wants")]: "network-online.target",
      [fieldId(SERVICE, "Type")]: "simple",
      [fieldId(SERVICE, "User")]: "deploy",
      [fieldId(SERVICE, "Group")]: "deploy",
      [fieldId(SERVICE, "WorkingDirectory")]: "/var/www/app",
      [fieldId(SERVICE, "Environment")]: "RAILS_ENV=production",
      [fieldId(SERVICE, "ExecStart")]: "/usr/local/bin/bundle exec puma -C config/puma.rb",
      [fieldId(SERVICE, "Restart")]: "always",
      [fieldId(SERVICE, "RestartSec")]: "5s",
      [fieldId(INSTALL, "WantedBy")]: "multi-user.target",
      ...SAFE_HARDENING,
    },
    notes:
      "Puma 5+ integrates with systemd: switch to Type=notify (and add WatchdogSec) once you load the systemd plugin in config/puma.rb. Bind Puma to a unix socket and reverse-proxy it for TLS.",
  },

  // ── Compiled binaries ─────────────────────────────────────────────────────
  {
    id: "static-binary",
    label: "Go / Rust binary",
    icon: Binary,
    group: "Compiled",
    description: "Single static binary — DynamicUser + strict sandbox",
    unitName: "myapp.service",
    fields: {
      [fieldId(UNIT, "Description")]: "Standalone service binary",
      [fieldId(UNIT, "After")]: "network-online.target",
      [fieldId(UNIT, "Wants")]: "network-online.target",
      [fieldId(SERVICE, "Type")]: "simple",
      [fieldId(SERVICE, "ExecStart")]: "/usr/local/bin/myapp --config /etc/myapp/config.toml",
      [fieldId(SERVICE, "Restart")]: "always",
      [fieldId(SERVICE, "RestartSec")]: "5s",
      // No User/Group: DynamicUser allocates a throwaway uid at runtime.
      [fieldId(SERVICE, "DynamicUser")]: "yes",
      [fieldId(INSTALL, "WantedBy")]: "multi-user.target",
      ...STRICT_HARDENING,
      // Writable, auto-created /var/lib/myapp owned by the dynamic user.
      [fieldId(HARDENING, "StateDirectory")]: "myapp",
    },
    notes:
      "DynamicUser=yes means no system account to create — systemd allocates a transient uid and StateDirectory gives it a private /var/lib/myapp. This is the gold-standard sandbox for a self-contained Go/Rust binary; if your app must write elsewhere, add those paths to ReadWritePaths.",
  },
];

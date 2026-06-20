export type FieldType =
  | "text"
  | "textarea"
  | "select"
  | "boolean"
  | "number"
  | "list";

export type SectionId = "Unit" | "Service" | "Install";

export type SelectChoice = {
  value: string;
  label: string;
};

export type SystemdOption = {
  /** The exact systemd directive name, e.g. "ExecStart". */
  key: string;
  /** Human-friendly label. */
  label: string;
  type: FieldType;
  /** Placeholder / example shown in the input. */
  placeholder?: string;
  /** Choices for `select` fields. */
  choices?: SelectChoice[];
  /** Default value. A boolean/select equal to its default is not emitted. */
  default?: string;
  /** Explanation shown in the info popover. */
  info: string;
  /** A concrete example value, shown in the info popover. */
  example?: string;
  /** The systemd man page this directive belongs to. */
  manpage: string;
  /** Mark visually as recommended / important. */
  recommended?: boolean;
};

export type SystemdSection = {
  id: SectionId;
  title: string;
  description: string;
  /** Default-open in the accordion. */
  defaultOpen?: boolean;
  options: SystemdOption[];
};

const DOC = "https://www.freedesktop.org/software/systemd";

export const docUrl = (manpage: string, key: string) =>
  `${DOC}/man/latest/${manpage}.html#${key}=`;

export const SECTIONS: SystemdSection[] = [
  {
    id: "Unit",
    title: "[Unit]",
    description:
      "Generic information about the unit: metadata and ordering/dependency relationships with other units.",
    defaultOpen: true,
    options: [
      {
        key: "Description",
        label: "Description",
        type: "text",
        placeholder: "My awesome web service",
        info: "A free-form, human-readable name for the unit. Shown by `systemctl status` and in logs. Keep it short and descriptive — don't just repeat the unit file name.",
        example: "Description=My awesome web service",
        manpage: "systemd.unit",
        recommended: true,
      },
      {
        key: "Documentation",
        label: "Documentation",
        type: "list",
        placeholder: "https://example.com/docs man:myapp(8)",
        info: "Space-separated list of URIs pointing to documentation for this unit. Accepts http(s)://, file:, info:, and man: URIs. Surfaced by `systemctl status`.",
        example: "Documentation=man:nginx(8) https://nginx.org/en/docs/",
        manpage: "systemd.unit",
      },
      {
        key: "After",
        label: "After",
        type: "list",
        placeholder: "network-online.target postgresql.service",
        info: "Ordering only: this unit starts AFTER the listed units. It does NOT pull them in — pair with Wants/Requires for that. The single most common directive for 'start my app once the network is up'.",
        example: "After=network-online.target",
        manpage: "systemd.unit",
        recommended: true,
      },
      {
        key: "Before",
        label: "Before",
        type: "list",
        placeholder: "shutdown.target",
        info: "Ordering only: this unit starts BEFORE the listed units. The inverse of After=. Does not create a dependency, only ordering.",
        example: "Before=nginx.service",
        manpage: "systemd.unit",
      },
      {
        key: "Wants",
        label: "Wants",
        type: "list",
        placeholder: "redis.service",
        info: "Weak dependency: tries to start the listed units together with this one, but this unit still starts even if they fail. Preferred over Requires= for most cases.",
        example: "Wants=network-online.target",
        manpage: "systemd.unit",
        recommended: true,
      },
      {
        key: "Requires",
        label: "Requires",
        type: "list",
        placeholder: "postgresql.service",
        info: "Strong dependency: the listed units are started together with this one, and if they fail or stop, this unit is stopped too. Usually combine with After= so ordering is also enforced.",
        example: "Requires=postgresql.service",
        manpage: "systemd.unit",
      },
      {
        key: "BindsTo",
        label: "BindsTo",
        type: "list",
        placeholder: "dev-ttyUSB0.device",
        info: "Like Requires=, but stronger: if the bound unit stops for ANY reason (including unexpectedly), this unit is also stopped. Useful for binding a service to a device.",
        example: "BindsTo=dev-ttyUSB0.device",
        manpage: "systemd.unit",
      },
      {
        key: "Conflicts",
        label: "Conflicts",
        type: "list",
        placeholder: "apache2.service",
        info: "Negative dependency: starting this unit stops the listed units, and vice versa. Use for two services that must never run at the same time.",
        example: "Conflicts=apache2.service",
        manpage: "systemd.unit",
      },
      {
        key: "ConditionPathExists",
        label: "ConditionPathExists",
        type: "text",
        placeholder: "/etc/myapp/enabled",
        info: "Only start the unit if the given path exists. Prefix with '!' to negate (only start if it does NOT exist). A failed condition silently skips the unit rather than failing it.",
        example: "ConditionPathExists=/etc/myapp/enabled",
        manpage: "systemd.unit",
      },
      {
        key: "StartLimitIntervalSec",
        label: "StartLimitIntervalSec",
        type: "text",
        placeholder: "10s",
        info: "Time window used for rate-limiting restarts, together with StartLimitBurst. If the service restarts more than 'burst' times within this interval, systemd stops trying. Set to 0 to disable rate limiting.",
        example: "StartLimitIntervalSec=60s",
        manpage: "systemd.unit",
      },
      {
        key: "StartLimitBurst",
        label: "StartLimitBurst",
        type: "number",
        placeholder: "5",
        info: "How many starts are allowed within StartLimitIntervalSec before systemd gives up and refuses to restart. Default is 5.",
        example: "StartLimitBurst=5",
        manpage: "systemd.unit",
      },
    ],
  },
  {
    id: "Service",
    title: "[Service]",
    description:
      "How the service is started, stopped, and supervised. This is the core of a .service unit.",
    defaultOpen: true,
    options: [
      {
        key: "Type",
        label: "Type",
        type: "select",
        default: "simple",
        choices: [
          { value: "simple", label: "simple — runs in foreground (default)" },
          { value: "exec", label: "exec — like simple, waits for exec()" },
          { value: "forking", label: "forking — daemonizes, parent exits" },
          { value: "oneshot", label: "oneshot — runs once and exits" },
          { value: "notify", label: "notify — signals readiness via sd_notify" },
          { value: "dbus", label: "dbus — ready when it takes a D-Bus name" },
          { value: "idle", label: "idle — delays exec until jobs settle" },
        ],
        info: "Determines how systemd considers the service 'started'. `simple` (default): the ExecStart process is the main process. `forking`: for classic daemons that fork and exit the parent (set PIDFile=). `oneshot`: for one-off scripts (pair with RemainAfterExit=yes). `notify`: the app calls sd_notify(READY=1) when truly ready.",
        example: "Type=simple",
        manpage: "systemd.service",
        recommended: true,
      },
      {
        key: "ExecStart",
        label: "ExecStart",
        type: "text",
        placeholder: "/usr/bin/myapp --config /etc/myapp.conf",
        info: "The command (absolute path + arguments) that starts the service. This is the one required directive for most service types. For Type=oneshot you may specify several; otherwise exactly one. Environment variables like $FOO are NOT expanded by a shell unless you invoke one explicitly.",
        example: "ExecStart=/usr/local/bin/myapp --port 8080",
        manpage: "systemd.service",
        recommended: true,
      },
      {
        key: "ExecStartPre",
        label: "ExecStartPre",
        type: "textarea",
        placeholder: "/usr/bin/myapp --check-config\n/usr/bin/mkdir -p /var/run/myapp",
        info: "Commands run BEFORE ExecStart, one per line (each becomes its own ExecStartPre= directive). If any exits non-zero, the service fails to start. Good for validation or preparing state. Prefix a command with '-' to ignore its failure.",
        example: "ExecStartPre=/usr/bin/mkdir -p /var/run/myapp",
        manpage: "systemd.service",
      },
      {
        key: "ExecStartPost",
        label: "ExecStartPost",
        type: "textarea",
        placeholder: "/usr/bin/curl -fsS http://localhost:8080/health",
        info: "Commands run AFTER ExecStart has been invoked, one per line (each becomes its own ExecStartPost= directive). Useful for post-start notifications or warm-up checks.",
        example: "ExecStartPost=/bin/systemctl reload nginx",
        manpage: "systemd.service",
      },
      {
        key: "ExecReload",
        label: "ExecReload",
        type: "text",
        placeholder: "/bin/kill -HUP $MAINPID",
        info: "Command invoked by `systemctl reload`. The special variable $MAINPID expands to the main process PID, so a HUP signal is the classic reload mechanism.",
        example: "ExecReload=/bin/kill -HUP $MAINPID",
        manpage: "systemd.service",
      },
      {
        key: "ExecStop",
        label: "ExecStop",
        type: "text",
        placeholder: "/usr/bin/myapp --graceful-shutdown",
        info: "Command to stop the service gracefully. If omitted, systemd sends SIGTERM (then SIGKILL) to the process. Only needed when your app requires a special shutdown command.",
        example: "ExecStop=/usr/bin/myapp stop",
        manpage: "systemd.service",
      },
      {
        key: "Restart",
        label: "Restart",
        type: "select",
        default: "no",
        choices: [
          { value: "no", label: "no — never restart (default)" },
          { value: "on-failure", label: "on-failure — restart on non-zero exit / signal" },
          { value: "always", label: "always — restart no matter what" },
          { value: "on-success", label: "on-success — only on clean exit" },
          { value: "on-abnormal", label: "on-abnormal — signal / timeout / watchdog" },
          { value: "on-abort", label: "on-abort — uncaught fatal signal" },
          { value: "on-watchdog", label: "on-watchdog — watchdog timeout only" },
        ],
        info: "When systemd should automatically restart the service. `on-failure` is the usual choice for long-running daemons. `always` will even restart after a clean exit or `systemctl stop` initiated by the service itself. Combine with RestartSec= to avoid hammering.",
        example: "Restart=on-failure",
        manpage: "systemd.service",
        recommended: true,
      },
      {
        key: "RestartSec",
        label: "RestartSec",
        type: "text",
        placeholder: "5s",
        info: "How long to wait before restarting the service after it exits. Default is 100ms, which can cause rapid restart loops — bumping this to a few seconds is usually wise.",
        example: "RestartSec=5s",
        manpage: "systemd.service",
      },
      {
        key: "User",
        label: "User",
        type: "text",
        placeholder: "www-data",
        info: "Run the service as this user instead of root. Strongly recommended for anything that doesn't need root. The user must already exist (or use DynamicUser=yes).",
        example: "User=myapp",
        manpage: "systemd.exec",
        recommended: true,
      },
      {
        key: "Group",
        label: "Group",
        type: "text",
        placeholder: "www-data",
        info: "Run the service under this group. Defaults to the primary group of User= if unset.",
        example: "Group=myapp",
        manpage: "systemd.exec",
      },
      {
        key: "WorkingDirectory",
        label: "WorkingDirectory",
        type: "text",
        placeholder: "/opt/myapp",
        info: "The working directory for executed processes. Use '~' for the user's home directory. The path must exist.",
        example: "WorkingDirectory=/opt/myapp",
        manpage: "systemd.exec",
      },
      {
        key: "Environment",
        label: "Environment",
        type: "textarea",
        placeholder: "NODE_ENV=production\nPORT=8080",
        info: "Set environment variables for the process, one KEY=VALUE per line (each becomes its own Environment= directive). Quote values containing spaces. Avoid putting secrets here — they're visible in `systemctl show`; use EnvironmentFile= for those.",
        example: "Environment=NODE_ENV=production",
        manpage: "systemd.exec",
      },
      {
        key: "EnvironmentFile",
        label: "EnvironmentFile",
        type: "text",
        placeholder: "/etc/myapp/env",
        info: "Read environment variables from a file (one KEY=VALUE per line). Prefix with '-' to ignore a missing file. The preferred place for secrets, since the file can be permission-restricted.",
        example: "EnvironmentFile=-/etc/myapp/env",
        manpage: "systemd.exec",
      },
      {
        key: "RemainAfterExit",
        label: "RemainAfterExit",
        type: "boolean",
        default: "no",
        info: "Consider the service 'active' even after its process exits. Essential for Type=oneshot units that set up state (mounts, firewall rules) and then exit — otherwise systemd would mark them inactive immediately.",
        example: "RemainAfterExit=yes",
        manpage: "systemd.service",
      },
      {
        key: "PIDFile",
        label: "PIDFile",
        type: "text",
        placeholder: "/run/myapp/myapp.pid",
        info: "Path to the PID file written by a forking daemon. Required for Type=forking so systemd can track the right process. Should live under /run.",
        example: "PIDFile=/run/myapp.pid",
        manpage: "systemd.service",
      },
      {
        key: "TimeoutStartSec",
        label: "TimeoutStartSec",
        type: "text",
        placeholder: "30s",
        info: "How long systemd waits for the service to start before considering it failed. Use 'infinity' to disable. Relevant for slow-starting services or Type=notify.",
        example: "TimeoutStartSec=30s",
        manpage: "systemd.service",
      },
      {
        key: "TimeoutStopSec",
        label: "TimeoutStopSec",
        type: "text",
        placeholder: "30s",
        info: "Grace period after SIGTERM before systemd sends SIGKILL on stop. Give your app enough time to drain connections; too short risks data loss, too long delays shutdown.",
        example: "TimeoutStopSec=30s",
        manpage: "systemd.service",
      },
      {
        key: "StandardOutput",
        label: "StandardOutput",
        type: "select",
        default: "journal",
        choices: [
          { value: "journal", label: "journal (default)" },
          { value: "inherit", label: "inherit" },
          { value: "null", label: "null — discard" },
          { value: "tty", label: "tty" },
          { value: "kmsg", label: "kmsg" },
          { value: "append:/var/log/myapp.log", label: "append:FILE" },
        ],
        info: "Where the service's stdout goes. `journal` (default) routes to the systemd journal, viewable with `journalctl -u`. Use `append:/path` to also write to a file. Most services should leave this on journal.",
        example: "StandardOutput=journal",
        manpage: "systemd.exec",
      },
      {
        key: "StandardError",
        label: "StandardError",
        type: "select",
        default: "inherit",
        choices: [
          { value: "inherit", label: "inherit (default — follows stdout)" },
          { value: "journal", label: "journal" },
          { value: "null", label: "null — discard" },
          { value: "tty", label: "tty" },
          { value: "kmsg", label: "kmsg" },
          { value: "append:/var/log/myapp.err", label: "append:FILE" },
        ],
        info: "Where the service's stderr goes. Defaults to `inherit` (same destination as stdout). Set explicitly to `journal` to be sure errors are captured.",
        example: "StandardError=journal",
        manpage: "systemd.exec",
      },
      {
        key: "SyslogIdentifier",
        label: "SyslogIdentifier",
        type: "text",
        placeholder: "myapp",
        info: "The identifier (tag) used for log lines in the journal. Defaults to the process name. Set this for cleaner, greppable logs.",
        example: "SyslogIdentifier=myapp",
        manpage: "systemd.exec",
      },
      {
        key: "Nice",
        label: "Nice",
        type: "number",
        placeholder: "0",
        info: "CPU scheduling nice value, from -20 (highest priority) to 19 (lowest). Positive values yield CPU to other processes — handy for background batch work.",
        example: "Nice=10",
        manpage: "systemd.exec",
      },
      {
        key: "LimitNOFILE",
        label: "LimitNOFILE",
        type: "text",
        placeholder: "65536",
        info: "Maximum number of open file descriptors (ulimit -n). Servers handling many connections often need this raised. Use 'infinity' for no limit.",
        example: "LimitNOFILE=65536",
        manpage: "systemd.exec",
      },
      {
        key: "KillMode",
        label: "KillMode",
        type: "select",
        default: "control-group",
        choices: [
          { value: "control-group", label: "control-group (default — kill all)" },
          { value: "mixed", label: "mixed — SIGTERM main, SIGKILL group" },
          { value: "process", label: "process — only the main process" },
          { value: "none", label: "none — kill nothing (dangerous)" },
        ],
        info: "Which processes to kill when stopping the service. `control-group` (default) kills every process in the cgroup. `mixed` sends SIGTERM to the main process but SIGKILL to the rest. Rarely needs changing.",
        example: "KillMode=mixed",
        manpage: "systemd.kill",
      },
      {
        key: "DynamicUser",
        label: "DynamicUser",
        type: "boolean",
        default: "no",
        info: "Allocate a transient, locked-down user/group for the lifetime of the service. Great for stateless services — no need to create a user manually. Implies several hardening options. Combine with StateDirectory= for persistent writable storage.",
        example: "DynamicUser=yes",
        manpage: "systemd.exec",
      },
    ],
  },
  {
    id: "Service",
    title: "Security hardening",
    description:
      "Sandboxing directives (also in the [Service] section) that restrict what the service can access. Check your service with `systemd-analyze security <unit>`.",
    options: [
      {
        key: "NoNewPrivileges",
        label: "NoNewPrivileges",
        type: "boolean",
        default: "no",
        info: "Prevents the service and its children from ever gaining new privileges (e.g. via setuid binaries or file capabilities). A cheap, high-value hardening switch with almost no downside for most services.",
        example: "NoNewPrivileges=yes",
        manpage: "systemd.exec",
        recommended: true,
      },
      {
        key: "PrivateTmp",
        label: "PrivateTmp",
        type: "boolean",
        default: "no",
        info: "Gives the service its own private /tmp and /var/tmp, isolated from the rest of the system and cleaned up on exit. Stops temp-file leakage and certain symlink attacks.",
        example: "PrivateTmp=yes",
        manpage: "systemd.exec",
        recommended: true,
      },
      {
        key: "ProtectSystem",
        label: "ProtectSystem",
        type: "select",
        default: "no",
        choices: [
          { value: "no", label: "no (default)" },
          { value: "yes", label: "yes — /usr & /boot read-only" },
          { value: "full", label: "full — also /etc read-only" },
          { value: "strict", label: "strict — entire FS read-only" },
        ],
        info: "Mounts system directories read-only for the service. `strict` makes the whole filesystem read-only except a few API paths — pair it with ReadWritePaths= / StateDirectory= for the dirs your app must write to.",
        example: "ProtectSystem=strict",
        manpage: "systemd.exec",
        recommended: true,
      },
      {
        key: "ProtectHome",
        label: "ProtectHome",
        type: "select",
        default: "no",
        choices: [
          { value: "no", label: "no (default)" },
          { value: "yes", label: "yes — /home, /root, /run/user inaccessible" },
          { value: "read-only", label: "read-only" },
          { value: "tmpfs", label: "tmpfs — empty tmpfs overlay" },
        ],
        info: "Hides or restricts access to user home directories. Most system services have no business reading /home, so `yes` is a safe default for daemons.",
        example: "ProtectHome=yes",
        manpage: "systemd.exec",
      },
      {
        key: "ReadWritePaths",
        label: "ReadWritePaths",
        type: "list",
        placeholder: "/var/lib/myapp /var/log/myapp",
        info: "Whitelist of paths the service may write to when ProtectSystem=strict (or ReadOnlyPaths=) is in effect. List exactly the directories your app needs.",
        example: "ReadWritePaths=/var/lib/myapp",
        manpage: "systemd.exec",
      },
      {
        key: "StateDirectory",
        label: "StateDirectory",
        type: "text",
        placeholder: "myapp",
        info: "Creates /var/lib/<name> owned by the service user, persisting across restarts. systemd manages permissions automatically — the cleanest way to give a (possibly DynamicUser) service writable storage.",
        example: "StateDirectory=myapp",
        manpage: "systemd.exec",
      },
      {
        key: "ProtectKernelTunables",
        label: "ProtectKernelTunables",
        type: "boolean",
        default: "no",
        info: "Makes /proc/sys, /sys, and similar kernel tunables read-only for the service. Prevents a compromised service from changing kernel parameters.",
        example: "ProtectKernelTunables=yes",
        manpage: "systemd.exec",
      },
      {
        key: "ProtectKernelModules",
        label: "ProtectKernelModules",
        type: "boolean",
        default: "no",
        info: "Denies the service the ability to load or unload kernel modules. Almost no userspace service legitimately needs this capability.",
        example: "ProtectKernelModules=yes",
        manpage: "systemd.exec",
      },
      {
        key: "ProtectControlGroups",
        label: "ProtectControlGroups",
        type: "boolean",
        default: "no",
        info: "Makes the /sys/fs/cgroup hierarchy read-only for the service, preventing tampering with cgroup settings.",
        example: "ProtectControlGroups=yes",
        manpage: "systemd.exec",
      },
      {
        key: "RestrictAddressFamilies",
        label: "RestrictAddressFamilies",
        type: "text",
        placeholder: "AF_INET AF_INET6 AF_UNIX",
        info: "Whitelist of socket address families the service may use. Limiting to AF_INET/AF_INET6/AF_UNIX blocks exotic families (AF_PACKET, etc.) often used in exploits. Use 'none' to forbid all sockets.",
        example: "RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX",
        manpage: "systemd.exec",
      },
      {
        key: "SystemCallFilter",
        label: "SystemCallFilter",
        type: "text",
        placeholder: "@system-service",
        info: "Seccomp syscall whitelist. `@system-service` is a curated set covering the needs of typical services while blocking dangerous calls. Prefix with '~' to make it a blacklist instead.",
        example: "SystemCallFilter=@system-service",
        manpage: "systemd.exec",
      },
      {
        key: "CapabilityBoundingSet",
        label: "CapabilityBoundingSet",
        type: "text",
        placeholder: "CAP_NET_BIND_SERVICE",
        info: "The set of Linux capabilities the service is allowed to keep. List only what's needed (e.g. CAP_NET_BIND_SERVICE to bind ports <1024); leave empty to drop all. Prefix with '~' to remove specific capabilities from the full set.",
        example: "CapabilityBoundingSet=CAP_NET_BIND_SERVICE",
        manpage: "systemd.exec",
      },
    ],
  },
  {
    id: "Install",
    title: "[Install]",
    description:
      "Used by `systemctl enable`/`disable`. Defines how the unit hooks into the boot process. Without this section, the unit can be started manually but not enabled at boot.",
    defaultOpen: true,
    options: [
      {
        key: "WantedBy",
        label: "WantedBy",
        type: "list",
        default: "multi-user.target",
        placeholder: "multi-user.target",
        info: "The target(s) that should pull in this unit when enabled. `multi-user.target` is the standard choice for normal system services (the non-graphical multi-user runlevel). `systemctl enable` creates a symlink in that target's .wants directory.",
        example: "WantedBy=multi-user.target",
        manpage: "systemd.unit",
        recommended: true,
      },
      {
        key: "RequiredBy",
        label: "RequiredBy",
        type: "list",
        placeholder: "graphical.target",
        info: "Like WantedBy=, but creates a Requires= dependency from the target instead of a Wants=. Rarely needed — most units should use WantedBy=.",
        example: "RequiredBy=graphical.target",
        manpage: "systemd.unit",
      },
      {
        key: "Alias",
        label: "Alias",
        type: "list",
        placeholder: "myapp-alt.service",
        info: "Additional names the unit can be referred to by, created as symlinks on `enable`. Must use the same unit suffix (e.g. .service).",
        example: "Alias=myapp-alt.service",
        manpage: "systemd.unit",
      },
      {
        key: "Also",
        label: "Also",
        type: "list",
        placeholder: "myapp.socket",
        info: "Other units to enable or disable together with this one. Commonly used so enabling a .service also enables its companion .socket or .timer.",
        example: "Also=myapp.socket",
        manpage: "systemd.unit",
      },
    ],
  },
];

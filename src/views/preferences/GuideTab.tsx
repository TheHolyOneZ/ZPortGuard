import { ReactNode, useState } from "react";
import {
  BookOpen,
  LayoutDashboard,
  Radio,
  Network,
  Layers,
  ShieldAlert,
  ScrollText,
  Settings2,
  Bug,
  ChevronDown,
  ChevronRight,
  Info,
  Zap,
  Eye,
  TriangleAlert,
  Sparkles,
} from "lucide-react";


function Code({ children }: { children: ReactNode }) {
  return (
    <code className="mono text-[11px] bg-secondary px-1.5 py-0.5 rounded text-primary-glow hairline leading-none">
      {children}
    </code>
  );
}

function Tip({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2 rounded-lg bg-primary/[0.07] border border-primary/20 px-3 py-2 text-[11.5px]">
      <Info className="size-3 text-primary-glow shrink-0 mt-[3px]" />
      <span className="text-foreground/80 leading-relaxed">{children}</span>
    </div>
  );
}

function Warn({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2 rounded-lg bg-warning/[0.07] border border-warning/20 px-3 py-2 text-[11.5px]">
      <TriangleAlert className="size-3 text-warning shrink-0 mt-[3px]" />
      <span className="text-foreground/80 leading-relaxed">{children}</span>
    </div>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </span>
      <div className="rounded-lg bg-surface-1 hairline p-3 flex flex-col gap-1.5">
        {children}
      </div>
    </div>
  );
}

function ExRow({ input, output }: { input: string; output: string }) {
  return (
    <div className="flex items-center gap-2 text-[11.5px]">
      <Code>{input}</Code>
      <span className="text-muted-foreground">→</span>
      <span className="text-foreground/75">{output}</span>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[148px_1fr] gap-3 text-[12px] py-1.5 border-b border-border/40 last:border-0">
      <span className="text-muted-foreground font-medium leading-relaxed">{label}</span>
      <span className="text-foreground/80 leading-relaxed">{children}</span>
    </div>
  );
}

function Sub({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="size-1 rounded-full bg-primary-glow/70 inline-block shrink-0" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function P({ children }: { children: ReactNode }) {
  return (
    <p className="text-[12px] text-foreground/80 leading-relaxed">{children}</p>
  );
}


function Section({
  id,
  icon,
  title,
  subtitle,
  defaultOpen = true,
  children,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div id={id} className="rounded-xl bg-card hairline shadow-card overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/25 transition-colors text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-muted-foreground shrink-0">
          {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </span>
        <div className="size-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <span className="text-primary-glow [&>svg]:size-3">{icon}</span>
        </div>
        <div className="flex-1 min-w-0 flex items-baseline gap-2">
          <span className="text-[13.5px] font-semibold text-foreground shrink-0">{title}</span>
          {!open && (
            <span className="text-[11.5px] text-muted-foreground truncate">{subtitle}</span>
          )}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-5 pt-0.5 border-t border-border/50 flex flex-col gap-4">
          <p className="text-[12px] text-muted-foreground leading-relaxed pt-2">{subtitle}</p>
          {children}
        </div>
      )}
    </div>
  );
}


const SECTIONS = [
  { id: "sec-dashboard", label: "Dashboard", icon: <LayoutDashboard className="size-3" /> },
  { id: "sec-monitor",   label: "Monitor",   icon: <Radio className="size-3" /> },
  { id: "sec-ports",     label: "Ports",     icon: <Network className="size-3" /> },
  { id: "sec-profiles",  label: "Profiles",  icon: <Layers className="size-3" /> },
  { id: "sec-rules",     label: "Rules",     icon: <ShieldAlert className="size-3" /> },
  { id: "sec-logs",      label: "Logs",      icon: <ScrollText className="size-3" /> },
  { id: "sec-general",   label: "General",   icon: <Settings2 className="size-3" /> },
  { id: "sec-debug",     label: "Debug",     icon: <Bug className="size-3" /> },
  { id: "sec-autofix",   label: "Auto-Fix",  icon: <Zap className="size-3" /> },
];

function TOC() {
  return (
    <nav className="sticky top-0 self-start w-32 shrink-0 pt-0.5">
      <p className="text-[9.5px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5 px-1">
        Contents
      </p>
      <div className="flex flex-col gap-px">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <span className="shrink-0">{s.icon}</span>
            <span>{s.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}


export function GuideTab() {
  return (
    <div className="flex gap-7 items-start">
      <TOC />

      <div className="flex-1 min-w-0 flex flex-col gap-3">


        <div className="flex items-center gap-2.5 mb-1">
          <BookOpen className="size-4 text-primary-glow shrink-0" />
          <div>
            <h1 className="text-[17px] font-semibold tracking-tight">ZPortGuard Guide</h1>
            <p className="text-[12px] text-muted-foreground">
              Every feature, tab, and option — explained.
            </p>
          </div>
        </div>


        <Section
          id="sec-dashboard"
          icon={<LayoutDashboard />}
          title="Dashboard"
          subtitle="Your command center — live port status, conflict count, frequency chart, and recent activity at a glance."
        >
          <Sub title="Hero status card">
            <FieldRow label="All clear">Green shield — every monitored port is free.</FieldRow>
            <FieldRow label="Conflict detected">Alert icon — one or more ports are held by an unexpected process.</FieldRow>
            <FieldRow label="Monitor paused">Pause icon — scans are frozen; the table shows stale data.</FieldRow>
            <FieldRow label="Stat boxes">
              Three numbers: <strong>In use</strong> (orange), <strong>Clear</strong> (green), <strong>Auto-killed</strong> (purple).
              All session-only — reset on app restart.
            </FieldRow>
          </Sub>

          <Sub title="Monitored ports table">
            <P>
              Shows every port in your active profile. Each row has a status dot, port number, project label,
              a state badge (<Code>conflict</Code> / <Code>clear</Code>), and a Kill button when a process is detected.
              Whitelisted processes show a "Whitelisted" badge instead. Blacklisted processes show "Blacklist — auto-kill"
              when Auto-Fix is on.
            </P>
          </Sub>

          <Sub title="Conflict frequency chart">
            <P>Bar chart of the top offending ports this session — helps you spot which port keeps getting grabbed.</P>
          </Sub>

          <Sub title="Recent activity feed">
            <P>
              Last 24 conflict events. Green dot = auto-killed, orange dot = detected only.
              This is session memory — for persistent history open the <strong>Logs</strong> tab.
            </P>
          </Sub>

          <Sub title="Guidance callouts">
            <FieldRow label="No ports yet">Prompts you to add your first port.</FieldRow>
            <FieldRow label="Profile is empty">Active profile has no ports assigned — go to Profiles tab.</FieldRow>
            <FieldRow label="Auto-Fix is off">Conflicts are visible but nothing is killed. Turn on Auto-Fix in the active profile (Profiles tab).</FieldRow>
          </Sub>
        </Section>


        <Section
          id="sec-monitor"
          icon={<Radio />}
          title="Monitor"
          subtitle="Real-time deep-dive — events stream, live stats, and pause control for the active profile."
        >
          <Sub title="Watched ports panel">
            <P>
              Shows only the ports in your active profile. Each row has the same Kill button as the Dashboard.
              When the monitor is paused a callout warns that the data is stale.
            </P>
          </Sub>

          <Sub title="Live events stream">
            <P>
              Every conflict and auto-kill emitted by the backend appears here instantly with a relative
              timestamp that refreshes every 5 seconds. Up to 100 events are shown; scroll for older ones.
            </P>
          </Sub>

          <Sub title="Stats bar">
            <FieldRow label="Events This Session">Total conflict detections since app start.</FieldRow>
            <FieldRow label="Auto-Killed">Processes killed automatically by Auto-Fix this session.</FieldRow>
            <FieldRow label="Active Now">Ports currently in conflict.</FieldRow>
          </Sub>

          <Sub title="Pause / Resume">
            <P>
              Pausing suspends all scans — no new events are emitted and the port table freezes.
              Useful while you intentionally bind a port yourself (e.g. starting a dev server).
              Resume to continue monitoring immediately.
            </P>
          </Sub>
        </Section>


        <Section
          id="sec-ports"
          icon={<Network />}
          title="Ports"
          subtitle="Add, label, and configure every port ZPortGuard tracks. Assign ports to profiles for fine-grained control."
        >
          <Sub title="Adding ports">
            <P>
              The port input accepts single ports, comma-separated lists, and ranges.
              Pick a <strong>Protocol</strong> (TCP / UDP / Both) and an optional <strong>Label</strong>.
            </P>
            <Block title="Input formats">
              <ExRow input="3000" output="Adds port 3000" />
              <ExRow input="3000-3010" output="Adds 11 ports: 3000 … 3010 (max 100 per range)" />
              <ExRow input="3000, 5173" output="Adds ports 3000 and 5173" />
              <ExRow input="3000, 8000-8005" output="Adds port 3000 plus 8000–8005" />
            </Block>
            <Tip>
              Labels are ignored when adding ranges or comma lists — they only apply to single-port additions.
              Edit labels afterwards in each port card.
            </Tip>
          </Sub>

          <Sub title="Protocol">
            <FieldRow label="TCP (default)">Watches TCP socket bindings. Covers virtually all dev servers, APIs, and databases.</FieldRow>
            <FieldRow label="UDP">Watches UDP bindings — DNS, game servers, VPN endpoints, etc.</FieldRow>
            <FieldRow label="Both">Triggers on either TCP or UDP binding on this port.</FieldRow>
            <Tip>
              Protocol can be changed after creation — use the dropdown on each port card in this tab.
              If a port is set to TCP-only and a UDP process binds it, ZPortGuard won't detect a conflict (and vice versa).
            </Tip>
          </Sub>

          <Sub title="Port card fields">
            <FieldRow label="Project name">Optional identifier shown in Dashboard / Monitor rows (e.g. "My React App").</FieldRow>
            <FieldRow label="Project path">Optional filesystem path — for your own reference, not used for matching.</FieldRow>
            <FieldRow label="Protocol">TCP / UDP / Both — editable inline after creation.</FieldRow>
          </Sub>

          <Sub title="Include / Exclude toggle">
            <P>
              When a non-default profile is active, each port card shows an <strong>Included</strong> (purple) /
              <strong> Excluded</strong> toggle. Clicking it instantly adds or removes the port from the active profile.
              You can also toggle from the Profiles tab.
            </P>
            <Tip>
              Ports added while a non-default profile is active are auto-included in that profile.
              Ports added while Default is active are not auto-included in any other profile.
            </Tip>
          </Sub>

          <Sub title="Removing a port">
            <P>
              Click the trash icon then confirm. The port is removed from the global list and all profiles.
              This is immediate and cannot be undone.
            </P>
          </Sub>
        </Section>

        {/* ── Profiles ───────────────────────────────────────────────────────── */}
        <Section
          id="sec-profiles"
          icon={<Layers />}
          title="Profiles"
          subtitle="Named contexts — each with its own port set, Auto-Fix toggle, and whitelist/blacklist rules."
        >
          <Tip>
            <strong>v1.2:</strong> Profiles are now full contexts. Switching profiles swaps the port set <em>and</em> the
            Auto-Fix settings and rules. The General tab only controls system-level settings (launch at login, polling interval).
          </Tip>

          <Sub title="What a profile contains">
            <FieldRow label="Port set">Which ports from the global list this profile actively monitors.</FieldRow>
            <FieldRow label="Auto-Fix">Enabled/disabled and require-confirmation — scoped to this profile only.</FieldRow>
            <FieldRow label="Whitelist">Processes that are never killed — scoped to this profile.</FieldRow>
            <FieldRow label="Blacklist">Processes that are always killed immediately — scoped to this profile.</FieldRow>
          </Sub>

          <Sub title="Creating a profile">
            <P>
              Enter a name and press Enter or click Create. The profile ID is auto-generated (lowercase with hyphens).
              You can't have two profiles with the same ID.
            </P>
          </Sub>

          <Sub title="Auto-Fix toggle per profile">
            <P>
              Each profile card expands to show its own Auto-Fix toggle and a "Require confirmation" sub-toggle
              (visible only when Auto-Fix is on). Changes take effect on the very next monitor tick — no restart needed.
            </P>
          </Sub>

          <Sub title="Assigning ports">
            <P>
              Each profile card shows a row of port buttons. Purple = included, grey = excluded.
              Click to toggle. You can also toggle from the Ports tab while the target profile is active.
            </P>
          </Sub>

          <Sub title="Edit rules for a profile">
            <P>
              The "Edit rules" link on each profile card activates that profile and navigates directly to the Rules tab,
              where you can manage its whitelist and blacklist independently.
            </P>
          </Sub>

          <Sub title="Activating a profile">
            <P>
              Click "Activate" — Dashboard, Monitor, and Tray update immediately. If the profile has no ports,
              a callout appears.
            </P>
          </Sub>

          <Sub title="Default profile">
            <P>
              Cannot be deleted. Safe fallback — activating it means "watch all globally configured ports."
              All new installs start with Default as the only profile.
            </P>
          </Sub>

          <Sub title="Deleting a profile">
            <P>
              Click the trash icon and confirm. Ports belonging <em>exclusively</em> to that profile are also removed
              from the global list. Shared ports are kept. If you delete the active profile, the next profile in the
              list becomes active automatically.
            </P>
            <Block title="Example">
              <P>
                "Backend" has ports 8000 and 8001. Default also has 8000 (not 8001).
                Deleting "Backend" removes 8001 (exclusive) but keeps 8000 (shared).
              </P>
            </Block>
          </Sub>
        </Section>


        <Section
          id="sec-rules"
          icon={<ShieldAlert />}
          title="Rules"
          subtitle="Per-profile whitelist and blacklist — control exactly how specific processes are treated on conflict."
        >
          <Tip>
            Rules are scoped to the <strong>active profile</strong>. A header at the top of this tab shows which
            profile you're editing. Switch profiles in the Profiles tab or use the "Edit rules" shortcut on each
            profile card.
          </Tip>

          <Sub title="Whitelist — never kill">
            <P>
              A whitelisted process is completely invisible to the conflict system.
              Even if it grabs a monitored port, ZPortGuard emits no conflict event and never kills it.
              Use for trusted long-running services you intentionally let hold ports (your own app, a system daemon, Docker).
            </P>
          </Sub>

          <Sub title="Blacklist — always kill">
            <P>
              A blacklisted process is killed immediately and automatically the moment it grabs a monitored port,
              bypassing the "Require Confirmation" setting entirely. Use for known-bad processes you always want
              evicted without any prompt (stale test runners, hung dev processes).
            </P>
          </Sub>

          <Sub title="Match types">
            <FieldRow label="Exact (default)">
              Name must match exactly (case-insensitive). <Code>node</Code> only matches a process literally named <Code>node</Code>.
            </FieldRow>
            <FieldRow label="Glob">
              Shell wildcards on the process name. <Code>*</Code> = any chars, <Code>?</Code> = one char.
              Pattern is anchored — <Code>node*</Code> will NOT match <Code>my-node</Code>.
            </FieldRow>
            <FieldRow label="Path">
              Substring match on the full executable path. <Code>/usr/bin/python</Code> matches
              <Code>/usr/bin/python3.11</Code>, <Code>/usr/bin/python3</Code>, etc.
            </FieldRow>
            <Block title="Glob examples">
              <ExRow input="node"     output="Matches only 'node'" />
              <ExRow input="node*"    output="node, nodejs, node-test, node_modules_runner" />
              <ExRow input="*node*"   output="my-node, frontend-node, nodeserver" />
              <ExRow input="python?"  output="python2, python3 — exactly one char after" />
              <ExRow input="*.sh"     output="Any process name ending in .sh" />
            </Block>
          </Sub>

          <Sub title="Port scoping">
            <FieldRow label="Port empty">Rule applies to the named process on ANY monitored port.</FieldRow>
            <FieldRow label="Port set">Rule applies only when that process holds that specific port. Same process on a different port is unaffected.</FieldRow>
            <Block title="Example">
              <P>
                Whitelist rule: <Code>process_name=node, port=3000</Code>.<br />
                Node on :3000 → ignored. Node on :5173 → conflict detected normally.
              </P>
            </Block>
          </Sub>

          <Sub title="Evaluation order">
            <P>
              1) Whitelist check — if matched, pipeline stops (no event emitted, nothing killed).
              2) Conflict event emitted.
              3) If Auto-Fix is off, done — manual kill only.
              4) Blacklist check — if matched, kill immediately (bypasses confirmation).
              5) If confirmation required, show modal. If not, kill automatically.
            </P>
          </Sub>
        </Section>

        {/* ── Logs ───────────────────────────────────────────────────────────── */}
        <Section
          id="sec-logs"
          icon={<ScrollText />}
          title="Logs"
          subtitle="Persistent activity history — every conflict, kill, and dismissal recorded in SQLite. Survives app restarts."
        >
          <Sub title="Log entry fields">
            <FieldRow label="Timestamp">When the event occurred — relative time ("5m ago").</FieldRow>
            <FieldRow label="Port">Which port was involved.</FieldRow>
            <FieldRow label="Process">Name of the offending process.</FieldRow>
            <FieldRow label="PID">Process ID at time of event.</FieldRow>
            <FieldRow label="Protocol">TCP or UDP socket.</FieldRow>
            <FieldRow label="Action">What happened — see below.</FieldRow>
          </Sub>

          <Sub title="Action types">
            <FieldRow label="conflict_detected">A process grabbed a monitored port. Not yet killed.</FieldRow>
            <FieldRow label="auto_killed">Auto-Fix killed the process automatically.</FieldRow>
            <FieldRow label="user_killed">You clicked Kill manually.</FieldRow>
            <FieldRow label="user_ignored">You clicked Ignore on a confirmation modal.</FieldRow>
            <FieldRow label="dismissed">You dismissed the confirmation card without acting.</FieldRow>
          </Sub>

          <Sub title="Filtering">
            <P>
              The search box filters by process name or port number in real time. Action filter buttons
              (All / Auto-killed / Manual / Detected) narrow the list further. Both work together.
            </P>
          </Sub>

          <Sub title="Clearing logs">
            <Warn>
              Clearing deletes all entries from SQLite permanently and cannot be undone.
              The Monitor stats bar will also reset since its counters are derived from the log.
            </Warn>
          </Sub>
        </Section>

        {/* ── General ────────────────────────────────────────────────────────── */}
        <Section
          id="sec-general"
          icon={<Settings2 />}
          title="General"
          subtitle="System-level settings that apply globally across all profiles — startup behaviour and polling speed."
        >
          <Tip>
            <strong>Auto-Fix and Rules are no longer here.</strong> They live inside each profile (Profiles tab).
            General only controls things that belong to the system, not a specific context.
          </Tip>

          <Sub title="Behaviour">
            <FieldRow label="Launch at Login">
              Uses the OS autostart mechanism. Respects the "Start Minimized" setting on that launch.
            </FieldRow>
            <FieldRow label="Start Minimized to Tray">
              When ON: the window stays hidden on launch; only the tray icon appears.
              When OFF (default): the dashboard opens automatically.
            </FieldRow>
            <FieldRow label="Polling Interval">
              How often the backend scans ports. Options: <Code>500ms</Code>, <Code>1s</Code>, <Code>2s</Code> (default), <Code>5s</Code>.
              Lower = faster detection + more CPU. Changes apply immediately — no restart required.
            </FieldRow>
          </Sub>

          <Block title="Recommended combinations">
            <FieldRow label="Active dev">1s polling · Auto-Fix ON per profile · Require Confirmation ON</FieldRow>
            <FieldRow label="Fully automated">500ms polling · Auto-Fix ON · Confirmation OFF</FieldRow>
            <FieldRow label="Monitoring only">2s polling · Auto-Fix OFF on all profiles</FieldRow>
            <FieldRow label="Low-power laptop">2s–5s polling · Auto-Fix ON with Confirmation OFF</FieldRow>
          </Block>
        </Section>

        {/* ── Debug ──────────────────────────────────────────────────────────── */}
        <Section
          id="sec-debug"
          icon={<Bug />}
          title="Debug & Test"
          subtitle="11 automated suites that run live API calls — for verifying nothing is broken after changes or migrations."
          defaultOpen={false}
        >
          <Warn>
            Tests create and delete real ports, profiles, and rules. Test data uses ports 19990–19999 and
            IDs/names prefixed with <Code>debug-</Code>. Don't run during normal use.
          </Warn>

          <Sub title="Test suites">
            <FieldRow label="1 — Settings round-trip">Validates the full Settings schema after v1.2 — per-profile whitelist, blacklist, auto_fix, active_profile is a non-empty string.</FieldRow>
            <FieldRow label="2 — Port management">Add / range-add / duplicate / remove ports; test invalid inputs are rejected.</FieldRow>
            <FieldRow label="3 — Profile lifecycle">Create / activate / assign ports / delete profile and verify correct cleanup and active_profile restoration.</FieldRow>
            <FieldRow label="4 — Rules (per-profile)">Add exact, glob, and path rules to the active profile; verify persistence; remove and verify clean state.</FieldRow>
            <FieldRow label="5 — Auto-fix permutations">Toggle enabled/require_confirmation in the active profile; real end-to-end kill test; whitelist protection test; blacklist bypasses confirmation test; restore original state.</FieldRow>
            <FieldRow label="6 — parsePortInput">12 synchronous cases: single port, range, comma list, invalid port, start&gt;end, &gt;100 range, empty, whitespace.</FieldRow>
            <FieldRow label="7 — Monitor control">Pause → resume; scanAllActivePorts shape; real spawn+detect+kill+verify cycle.</FieldRow>
            <FieldRow label="8 — Serialization contract">Verifies snake_case enum values from Rust: <Code>state</Code>, <Code>protocol</Code>, <Code>match_type</Code>, <Code>action</Code>. Regression guard for serde renames.</FieldRow>
            <FieldRow label="9 — Activity log round-trip">Emits a debug log event and validates the payload shape (ts, port, action, protocol).</FieldRow>
            <FieldRow label="10 — Live port scan">Scans all active ports and validates every entry's field types and value ranges.</FieldRow>
            <FieldRow label="11 — General settings validation">Validates polling_interval_ms range, per-profile auto_fix booleans, and all profile/port field shapes.</FieldRow>
          </Sub>

          <Sub title="How to run">
            <P>
              Click <strong>Run All</strong> to execute all suites in order, or click <strong>Run</strong> on a
              single suite. Each test shows ✓ (passed), ✗ (failed), or a spinner (running). Failed tests include
              a detail line explaining exactly what was wrong.
            </P>
            <Tip>
              Suite 8 (Serialization Contract) is the most important to run after any Rust-side change —
              it catches serde rename bugs before they silently corrupt data.
            </Tip>
          </Sub>
        </Section>

        {/* ── Auto-Fix Flow ──────────────────────────────────────────────────── */}
        <Section
          id="sec-autofix"
          icon={<Zap />}
          title="Auto-Fix Flow"
          subtitle="Step-by-step: what happens from the moment a process grabs a port to when it's killed or ignored."
        >
          <Sub title="Pipeline (active profile)">
            <div className="flex flex-col">
              {[
                {
                  n: "1",
                  title: "Process binds a monitored port",
                  desc: "The backend scan detects a PID on a port that belongs to the active profile and matches the configured protocol.",
                },
                {
                  n: "2",
                  title: "Whitelist check",
                  desc: "If any whitelist rule (from the active profile) matches the process + port, the pipeline stops entirely. No event emitted, nothing killed — the process is invisible.",
                },
                {
                  n: "3",
                  title: "Conflict detected",
                  desc: "Event emitted. Dashboard and Monitor turn orange. Logged in the Logs tab.",
                },
                {
                  n: "4",
                  title: "Auto-Fix enabled? (per-profile setting)",
                  desc: "If Auto-Fix is OFF for the active profile: pipeline ends here. The Kill button in Dashboard/Monitor lets you act manually.",
                },
                {
                  n: "5",
                  title: "Blacklist check",
                  desc: "If the process matches a blacklist rule (active profile), it's killed immediately — no confirmation, no delay. Blacklist always overrides Require Confirmation.",
                },
                {
                  n: "6",
                  title: "Require Confirmation?",
                  desc: "If OFF: process is killed automatically. If ON: a confirmation card slides up in the bottom-right corner.",
                },
                {
                  n: "7",
                  title: "User responds (Kill / Ignore)",
                  desc: "Kill → process killed, logged as user_killed. Ignore → logged as dismissed, process untouched.",
                },
                {
                  n: "8",
                  title: "Conflict resolved",
                  desc: "Next scan tick detects the port is free. Dashboard turns green. The confirmation card dismisses automatically if still open.",
                },
              ].map((step) => (
                <div key={step.n} className="flex gap-3 py-2.5 border-b border-border/40 last:border-0">
                  <span className="size-5 rounded-full bg-primary/12 border border-primary/25 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[9.5px] font-bold text-primary-glow">{step.n}</span>
                  </span>
                  <div>
                    <p className="text-[12px] font-semibold text-foreground">{step.title}</p>
                    <p className="text-[11.5px] text-muted-foreground leading-relaxed mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Sub>

          <Sub title="Decision cheat-sheet">
            <Block title="">
              <FieldRow label="Kill anything silently?">Auto-Fix ON · Confirmation OFF · no whitelist</FieldRow>
              <FieldRow label="Confirm before killing?">Auto-Fix ON · Confirmation ON (default)</FieldRow>
              <FieldRow label="Trust a specific process?">Whitelist — exact match or port-scoped</FieldRow>
              <FieldRow label="Always kill one specific process?">Blacklist — bypasses confirmation</FieldRow>
              <FieldRow label="Monitor only, no kills?">Auto-Fix OFF on the active profile</FieldRow>
              <FieldRow label="Different rules per project?">Create one profile per project, each with its own whitelist/blacklist/auto_fix</FieldRow>
            </Block>
          </Sub>
        </Section>

        {/* Footer tip */}
        <div className="flex items-center gap-2 rounded-xl bg-card hairline px-4 py-2.5 text-[11.5px] text-muted-foreground">
          <Eye className="size-3 shrink-0 text-primary-glow" />
          <span>
            Press <Code>Enter</Code> in any input (port, profile name, rule name) to submit without clicking.
            {" "}Use the tray icon <Sparkles className="size-3 inline text-primary-glow" /> button to toggle
            the active profile's Auto-Fix without opening the app.
          </span>
        </div>

      </div>
    </div>
  );
}

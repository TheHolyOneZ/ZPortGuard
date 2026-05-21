import { openUrl } from "@tauri-apps/plugin-opener";
import { Shield, Globe, ExternalLink, Cpu, Layers, Zap, Database, Code2, Box, Palette, Package } from "lucide-react";
import { cn } from "@/lib/utils";


function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className ?? "size-4"} aria-hidden>
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.168 6.839 9.489.5.09.683-.217.683-.482 0-.237-.009-.868-.013-1.703-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.091-.645.349-1.087.635-1.337-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.03-2.682-.103-.253-.447-1.27.097-2.646 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.376.202 2.393.1 2.646.64.698 1.028 1.591 1.028 2.682 0 3.841-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.165 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
}


function navigate(url: string) {
  const p = navigator.platform.toLowerCase();
  if (p.startsWith("win")) {
    void openUrl(url);
  } else if (p.startsWith("mac") || p.includes("darwin")) {
    void openUrl(url);
  } else {
    void openUrl(url);
  }
}


function StackPill({
  icon,
  name,
  version,
  accent = false,
}: {
  icon: React.ReactNode;
  name: string;
  version?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl hairline transition-all duration-200",
        accent
          ? "bg-primary/[0.08] border-primary/25 hover:bg-primary/[0.14] hover:border-primary/40"
          : "bg-surface-1 border-border hover:border-border-strong hover:bg-secondary/60"
      )}
    >
      <span className={cn("shrink-0", accent ? "text-primary-glow" : "text-muted-foreground")}>
        {icon}
      </span>
      <div className="flex flex-col leading-none gap-0.5">
        <span className={cn("text-[12.5px] font-semibold", accent ? "text-primary-glow" : "text-foreground")}>
          {name}
        </span>
        {version && (
          <span className="text-[10.5px] text-muted-foreground mono">{version}</span>
        )}
      </div>
    </div>
  );
}


function LinkCard({
  icon,
  label,
  sublabel,
  url,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  url: string;
  tone?: "default" | "brand" | "green";
}) {
  const styles = {
    default: "bg-card hairline hover:border-border-strong hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.4)]",
    brand:   "bg-primary/[0.07] border border-primary/25 hover:border-primary/45 hover:shadow-[0_4px_24px_-8px_rgba(124,58,237,0.45)]",
    green:   "bg-success/[0.06] border border-success/20 hover:border-success/40 hover:shadow-[0_4px_24px_-8px_rgba(16,185,129,0.35)]",
  };
  const iconStyles = {
    default: "text-muted-foreground",
    brand:   "text-primary-glow",
    green:   "text-success",
  };

  return (
    <button
      onClick={() => navigate(url)}
      className={cn(
        "press focus-ring group flex items-center gap-3.5 p-3.5 rounded-xl transition-all duration-200 text-left w-full",
        styles[tone]
      )}
    >
      <div
        className={cn(
          "size-9 rounded-lg flex items-center justify-center shrink-0",
          tone === "brand" && "bg-primary/12 border border-primary/25",
          tone === "green" && "bg-success/10 border border-success/20",
          tone === "default" && "bg-secondary border border-border-strong"
        )}
      >
        <span className={cn("[&>svg]:size-4", iconStyles[tone])}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-foreground leading-tight">{label}</p>
        <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate">{sublabel}</p>
      </div>
      <ExternalLink className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
    </button>
  );
}


export function AboutTab() {
  return (
    <div className="flex flex-col gap-6 max-w-[680px] mx-auto">


      <div className="relative rounded-2xl overflow-hidden border border-primary/20 bg-card shadow-[0_0_0_1px_rgba(124,58,237,0.12),0_20px_60px_-20px_rgba(124,58,237,0.35)]">

        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background: [
              "radial-gradient(600px 300px at 10% -20%, rgba(124,58,237,0.18), transparent 60%)",
              "radial-gradient(500px 280px at 90% 110%, rgba(59,130,246,0.12), transparent 60%)",
            ].join(", "),
          }}
        />

        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative flex flex-col items-center gap-4 px-8 py-10 text-center">

          <div className="relative">
            <div className="size-16 rounded-2xl bg-gradient-brand shadow-[0_0_40px_-8px_rgba(124,58,237,0.8),0_0_80px_-16px_rgba(59,130,246,0.4)] flex items-center justify-center">
              <Shield className="size-8 text-white" strokeWidth={2.5} />
            </div>
            <div
              aria-hidden
              className="absolute -inset-3 rounded-3xl opacity-30 blur-xl bg-gradient-brand pointer-events-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="text-[26px] font-bold tracking-tight text-foreground">
              ZPortGuard
            </h1>
            <p className="text-[13.5px] text-muted-foreground max-w-[38ch] leading-relaxed">
              A lightweight port conflict manager for developers — detects, rules, and
              resolves port collisions before they slow you down.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <span className="size-1.5 rounded-full bg-primary-glow shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
            <span className="text-[11.5px] font-semibold text-primary-glow tracking-wide">v1.2.0</span>
          </div>
        </div>
      </div>


      <div className="rounded-xl overflow-hidden border border-border bg-card shadow-card">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60 bg-secondary/30">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Created by
          </span>
        </div>
        <div className="flex items-center gap-4 px-4 py-4">
          <div className="size-12 rounded-xl bg-gradient-to-br from-primary/30 to-blue-500/20 border border-primary/25 flex items-center justify-center shrink-0 shadow-[0_0_20px_-6px_rgba(124,58,237,0.5)]">
            <span className="text-[18px] font-black text-primary-glow select-none">Z</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-foreground tracking-tight">TheHolyOneZ</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Designer &amp; Developer
            </p>
          </div>
          <button
            onClick={() => navigate("https://github.com/theholyonez")}
            className="press focus-ring flex items-center gap-1.5 h-8 px-3 rounded-lg bg-secondary border border-border-strong hover:border-border-bright hover:bg-secondary/80 transition-all duration-150 text-[12px] font-medium text-muted-foreground hover:text-foreground"
          >
            <GithubIcon className="size-3.5" />
            @theholyonez
          </button>
        </div>
      </div>


      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-0.5">
          Links
        </p>
        <div className="grid grid-cols-1 gap-2">
          <LinkCard
            icon={<Globe />}
            label="Official Website"
            sublabel="zsync.eu/zportguard"
            url="https://zsync.eu/zportguard"
            tone="brand"
          />
          <LinkCard
            icon={<GithubIcon />}
            label="GitHub — ZPortGuard"
            sublabel="github.com/TheHolyOneZ/ZPortGuard"
            url="https://github.com/TheHolyOneZ/ZPortGuard"
            tone="default"
          />
          <LinkCard
            icon={<GithubIcon />}
            label="GitHub — TheHolyOneZ"
            sublabel="github.com/theholyonez"
            url="https://github.com/theholyonez"
            tone="green"
          />
        </div>
      </div>


      <div className="flex flex-col gap-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-0.5">
          Tech Stack
        </p>
        <div className="rounded-xl border border-border bg-card shadow-card p-4 flex flex-col gap-4">

          <div className="flex flex-col gap-1.5">
            <span className="text-[10.5px] text-muted-foreground font-medium uppercase tracking-wider">Framework</span>
            <div className="grid grid-cols-2 gap-2">
              <StackPill icon={<Box className="size-4" />}    name="Tauri"   version="v2"     accent />
              <StackPill icon={<Zap className="size-4" />}    name="React"   version="19"     accent />
              <StackPill icon={<Code2 className="size-4" />}  name="TypeScript" version="5.x" />
              <StackPill icon={<Zap className="size-4" />}    name="Vite"    version="7"      />
            </div>
          </div>

          <div className="h-px bg-border/60" />

          <div className="flex flex-col gap-1.5">
            <span className="text-[10.5px] text-muted-foreground font-medium uppercase tracking-wider">Backend (Rust)</span>
            <div className="grid grid-cols-2 gap-2">
              <StackPill icon={<Cpu className="size-4" />}      name="Tokio"     version="async runtime" />
              <StackPill icon={<Layers className="size-4" />}   name="serde_json" version="config & IPC" />
              <StackPill icon={<Package className="size-4" />}  name="netstat2"  version="port scanning" />
              <StackPill icon={<Package className="size-4" />}  name="sysinfo"   version="process info"  />
            </div>
          </div>

          <div className="h-px bg-border/60" />

          <div className="flex flex-col gap-1.5">
            <span className="text-[10.5px] text-muted-foreground font-medium uppercase tracking-wider">Frontend</span>
            <div className="grid grid-cols-2 gap-2">
              <StackPill icon={<Palette className="size-4" />}  name="Tailwind CSS" version="v4"          />
              <StackPill icon={<Layers className="size-4" />}   name="Zustand"      version="state"       />
              <StackPill icon={<Database className="size-4" />} name="SQLite"       version="activity log" />
              <StackPill icon={<Package className="size-4" />}  name="Recharts"     version="d3 charts"   />
            </div>
          </div>

        </div>
      </div>


      <div className="flex items-center justify-center gap-1.5 pb-2">
        <span className="text-[11px] text-muted-foreground/60">
          Built with care by
        </span>
        <button
          onClick={() => navigate("https://github.com/theholyonez")}
          className="press focus-ring text-[11px] font-semibold text-primary-glow/70 hover:text-primary-glow transition-colors"
        >
          TheHolyOneZ
        </button>
        <span className="text-[11px] text-muted-foreground/60">· GPL-3.0 License</span>
      </div>

    </div>
  );
}

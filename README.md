<div align="center">

<img src="src-tauri/icons/128x128.png" width="96" alt="ZPortGuard icon" />

# ZPortGuard

**Port conflict detector and auto-fixer for developers**

[![Version](https://img.shields.io/badge/version-1.2.0-7c3aed?style=flat-square)](https://github.com/TheHolyOneZ/ZPortGuard/releases)
[![License](https://img.shields.io/badge/license-GPL--3.0-22c55e?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20macOS%20%7C%20Windows-0ea5e9?style=flat-square)](#download)
[![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%20v2-fbbf24?style=flat-square)](https://v2.tauri.app/)

[**Download**](https://zsync.eu/zportguard) · [Releases](https://github.com/TheHolyOneZ/ZPortGuard/releases) · [Issues](https://github.com/TheHolyOneZ/ZPortGuard/issues)

</div>

---

> [!IMPORTANT]
> ZPortGuard requires permission to read active network connections and send signals to processes. On Linux this means running as a user with sufficient privileges (or granting the binary `CAP_NET_ADMIN` if needed). On macOS you will be prompted on first launch. On Windows run as a standard user — no elevation required for scan, elevation only needed for killing system-owned processes.

---

## What it does

ZPortGuard sits in your system tray and watches every port your dev servers touch. The moment another process steals one, it either kills the offender automatically or surfaces a confirmation dialog — your call, per profile. No more `EADDRINUSE` at 2 AM.

```
Port 3000 → stolen by node (pid 18842) → auto-killed in <1 tick  ✓
Port 5173 → stolen by python3 (pid 9041) → confirmation dialog   ✓
Port 8080 → on whitelist → ignored                                ✓
```

---

## Features

| Feature | Detail |
|---|---|
| **Per-profile contexts** | Work · Testing · Side Project — each owns its port set, Auto-Fix rules, whitelist, and blacklist |
| **Auto-Fix** | Kill conflicting processes automatically; toggle per profile from the tray without opening the window |
| **Whitelist / Blacklist** | Exact name, glob, or full path — whitelist protects, blacklist bypasses confirmation entirely |
| **Live polling** | 500 ms – 5 s scan interval; changes apply without restart |
| **Activity log** | Every conflict, auto-kill, and dismissal persisted to SQLite with protocol + profile context |
| **TCP / UDP / Both** | Per-port protocol configuration |
| **Tray icon** | Glass popover shows live port status; toggle Auto-Fix without touching the main window |
| **Debug suite** | Built-in test harness for spawning mock port holders, validating rules, and benchmarking intervals |

---

## Tech stack

| Layer | Technology |
|---|---|
| Desktop framework | [Tauri v2](https://v2.tauri.app/) |
| Frontend | React 19 + TypeScript 5 + Vite 7 |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Backend | Rust — tokio, serde_json, netstat2, sysinfo |
| Storage | SQLite via tauri-plugin-sql |
| Charts | Recharts |

> [!NOTE]
> The Rust backend handles all port scanning and process management natively — no shell-out to `lsof`, `ss`, or `netstat`. netstat2 reads `/proc/net/tcp` directly for sub-millisecond scans.

---

## Download

Pre-built binaries are available on the [releases page](https://github.com/TheHolyOneZ/ZPortGuard/releases) and at [zsync.eu/zportguard](https://zsync.eu/zportguard).

| OS | Format | Notes |
|---|---|---|
| **Linux** | `.AppImage` | Portable, no install required |
| **Linux** | `.deb` | Debian · Ubuntu · Mint |
| **Linux** | `.rpm` | Fedora · RHEL · openSUSE |
| **macOS** | `.dmg (aarch64)` | Apple Silicon — M1 / M2 / M3 / M4 |
| **macOS** | `.dmg (x64)` | Intel — pre-2020 Macs |
| **Windows** | `.exe (NSIS)` | Recommended — standard installer |
| **Windows** | `.msi` | Enterprise / GPO deployment |

---

## Development

### Prerequisites

- [Rust](https://rustup.rs/) (stable toolchain)
- [Node.js](https://nodejs.org/) ≥ 18
- [pnpm](https://pnpm.io/)
- Linux (primary target; tested on Arch-based distros with LTS kernel)

> [!TIP]
> First-time Tauri setup? Run `cargo install tauri-cli` once, then proceed below.

### Run in dev mode

```bash
pnpm install
pnpm tauri dev
```

### Build a release bundle

```bash
pnpm tauri build
# outputs: src-tauri/target/release/bundle/{deb,rpm,appimage}/
```

Native build after a prior successful compile takes ~30–60 s.

---

## Creator

<table>
<tr>
<td width="80" align="center">
<img src="https://github.com/theholyonez.png" width="64" style="border-radius:50%" alt="TheHolyOneZ" />
</td>
<td>

**TheHolyOneZ**

[![GitHub](https://img.shields.io/badge/GitHub-theholyonez-181717?style=flat-square&logo=github)](https://github.com/theholyonez)
[![Project](https://img.shields.io/badge/ZPortGuard-TheHolyOneZ%2FZPortGuard-7c3aed?style=flat-square&logo=github)](https://github.com/TheHolyOneZ/ZPortGuard)
[![Website](https://img.shields.io/badge/Website-zsync.eu-0ea5e9?style=flat-square)](https://zsync.eu/zportguard)

</td>
</tr>
</table>

---

## License

Distributed under the **GPL-3.0** license. See [`LICENSE`](LICENSE) for the full text.

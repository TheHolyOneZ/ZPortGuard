import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Bug,
  Network,
  Layers,
  ShieldAlert,
  Settings2,
  Activity,
  RefreshCw,
  Shield,
  Loader2,
  CheckCircle2,
  XCircle,
  Circle,
  ChevronDown,
  ChevronRight,
  ClipboardCopy,
  Cpu,
  ScanLine,
  ListChecks,
  PlayCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { parsePortInput } from "@/lib/parsePortInput";
import { listen } from "@tauri-apps/api/event";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Callout } from "@/components/ui/Callout";


type SuiteStatus = "pending" | "running" | "passed" | "failed" | "partial";

interface TestResult {
  name: string;
  pass: boolean;
  detail?: string;
}

interface SuiteResult {
  status: SuiteStatus;
  tests: TestResult[];
  durationMs: number;
}


type AllResults = Record<number, SuiteResult | "skeleton">;


function withTimeout<T>(promise: Promise<T>, ms = 10000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
    ),
  ]);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}


async function runSuite1(): Promise<TestResult[]> {
  const settings = await api.getSettings();
  const results: TestResult[] = [];

  const activeProfile = settings.profiles.find((p) => p.id === settings.active_profile);
  const checks: Array<{ field: string; check: () => boolean; type: string }> = [
    { field: "ports", check: () => Array.isArray(settings.ports), type: "array" },
    { field: "profiles", check: () => Array.isArray(settings.profiles), type: "array" },
    {
      field: "active_profile",
      check: () => typeof settings.active_profile === "string" && settings.active_profile.length > 0,
      type: "string (non-empty)",
    },
    {
      field: "active_profile points to existing profile",
      check: () => !!activeProfile,
      type: "profile found",
    },
    {
      field: "profile.whitelist",
      check: () => Array.isArray(activeProfile?.whitelist),
      type: "array",
    },
    {
      field: "profile.blacklist",
      check: () => Array.isArray(activeProfile?.blacklist),
      type: "array",
    },
    {
      field: "profile.auto_fix",
      check: () =>
        typeof activeProfile?.auto_fix === "object" &&
        activeProfile.auto_fix !== null &&
        typeof activeProfile.auto_fix.enabled === "boolean" &&
        typeof activeProfile.auto_fix.require_confirmation === "boolean",
      type: "object{enabled:bool, require_confirmation:bool}",
    },
    {
      field: "polling_interval_ms",
      check: () => typeof settings.polling_interval_ms === "number",
      type: "number",
    },
  ];

  for (const c of checks) {
    const pass = c.check();
    results.push({
      name: `${c.field}: ${c.type}`,
      pass,
      detail: pass ? undefined : `Missing or wrong type for "${c.field}"`,
    });
  }

  return results;
}


async function runSuite2(): Promise<TestResult[]> {
  const results: TestResult[] = [];


  try {
    const s = await api.addPort(19990, "debug-test", "tcp");
    const found = s.ports.find((p) => p.port === 19990);
    results.push({
      name: "addPort(19990, 'debug-test', 'tcp') → appears in settings.ports",
      pass: !!found,
      detail: found ? `label="${found.label}"` : "port 19990 not in returned settings",
    });
  } catch (e) {
    results.push({
      name: "addPort(19990, 'debug-test', 'tcp') → appears in settings.ports",
      pass: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }


  try {
    const ports = parsePortInput("19991-19993");
    if (ports.length !== 3) {
      results.push({
        name: "parsePortInput('19991-19993') → add 3 ports",
        pass: false,
        detail: `parsePortInput returned ${ports.length} ports, expected 3`,
      });
    } else {
      for (const p of ports) await api.addPort(p, "debug-range", "tcp");
      const s = await api.getSettings();
      const allPresent = [19991, 19992, 19993].every((p) =>
        s.ports.some((sp) => sp.port === p)
      );
      results.push({
        name: "parsePortInput('19991-19993') → add 3 ports, all present",
        pass: allPresent,
        detail: allPresent ? "ports 19991–19993 all present" : "one or more range ports missing",
      });
    }
  } catch (e) {
    results.push({
      name: "parsePortInput('19991-19993') → add 3 ports",
      pass: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }


  try {
    parsePortInput("99999");
    results.push({
      name: "parsePortInput('99999') → throws RangeError",
      pass: false,
      detail: "Expected RangeError but no error was thrown",
    });
  } catch (e) {
    results.push({
      name: "parsePortInput('99999') → throws RangeError",
      pass: e instanceof RangeError,
      detail:
        e instanceof RangeError
          ? "RangeError thrown as expected"
          : `Wrong error type: ${String(e)}`,
    });
  }


  try {
    await api.addPort(19990, "dup", "tcp");
    const s = await api.getSettings();
    const count = s.ports.filter((p) => p.port === 19990).length;
    results.push({
      name: "addPort(19990) duplicate → no duplicate in settings.ports",
      pass: count === 1,
      detail: count === 1 ? "no duplicate" : `Found ${count} entries for port 19990`,
    });
  } catch {

    const s = await api.getSettings().catch(() => null);
    const count = s?.ports.filter((p) => p.port === 19990).length ?? 0;
    results.push({
      name: "addPort(19990) duplicate → no duplicate in settings.ports",
      pass: count <= 1,
      detail: count <= 1 ? "duplicate rejected at API level" : `Found ${count} entries`,
    });
  }


  const cleanupErrors: string[] = [];
  for (const p of [19990, 19991, 19992, 19993]) {
    try {
      await api.removePort(p);
    } catch (e) {
      cleanupErrors.push(`${p}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  const sAfterClean = await api.getSettings().catch(() => null);
  const remaining =
    sAfterClean?.ports.filter((p) => [19990, 19991, 19992, 19993].includes(p.port)) ?? [];
  results.push({
    name: "Cleanup: removePort 19990–19993 → all gone",
    pass: cleanupErrors.length === 0 && remaining.length === 0,
    detail:
      cleanupErrors.length > 0
        ? `Errors: ${cleanupErrors.join("; ")}`
        : remaining.length > 0
          ? `${remaining.length} test ports still present`
          : "all cleaned up",
  });

  return results;
}


async function runSuite3(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const original = await api.getSettings();
  const originalActiveProfile = original.active_profile;


  try {
    const before = await api.getSettings();
    const newProfile = { id: "debug-profile-test", name: "debug-profile-test", ports: [], auto_fix: { enabled: false, require_confirmation: true }, whitelist: [], blacklist: [] };
    await api.updateSettings({ ...before, profiles: [...before.profiles, newProfile] });
    const after = await api.getSettings();
    const found = after.profiles.find((p) => p.id === "debug-profile-test");
    results.push({
      name: "Create profile 'debug-profile-test' → appears in settings.profiles",
      pass: !!found,
      detail: found ? `id="${found.id}"` : "Profile not found after creation",
    });
  } catch (e) {
    results.push({
      name: "Create profile 'debug-profile-test' → appears in settings.profiles",
      pass: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }


  try {
    await api.addPort(19994, "debug-profile-port", "tcp");
    const s = await api.getSettings();
    const updatedProfiles = s.profiles.map((p) =>
      p.id === "debug-profile-test"
        ? { ...p, ports: [...new Set([...p.ports, 19994])] }
        : p
    );
    await api.updateSettings({ ...s, profiles: updatedProfiles });
    const after = await api.getSettings();
    const profile = after.profiles.find((p) => p.id === "debug-profile-test");
    const hasPort = profile?.ports.includes(19994) ?? false;
    results.push({
      name: "Add port 19994 → assign to debug-profile-test.ports",
      pass: hasPort,
      detail: hasPort ? "port 19994 in profile.ports" : "port 19994 not found in profile",
    });
  } catch (e) {
    results.push({
      name: "Add port 19994 → assign to debug-profile-test.ports",
      pass: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }


  try {
    const s = await api.setActiveProfile("debug-profile-test");
    const correct = s.active_profile === "debug-profile-test";
    results.push({
      name: "setActiveProfile('debug-profile-test') → active_profile matches",
      pass: correct,
      detail: correct
        ? `active_profile="debug-profile-test"`
        : `got "${s.active_profile}"`,
    });
  } catch (e) {
    results.push({
      name: "setActiveProfile('debug-profile-test') → active_profile matches",
      pass: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }


  try {
    const s = await api.getSettings();
    const filteredProfiles = s.profiles.filter((p) => p.id !== "debug-profile-test");

    const safeActiveProfile = filteredProfiles.some((p) => p.id === originalActiveProfile)
      ? originalActiveProfile
      : filteredProfiles[0]?.id ?? originalActiveProfile;

    await api.updateSettings({ ...s, profiles: filteredProfiles, active_profile: safeActiveProfile });
    await api.removePort(19994).catch(() => undefined);
    const after = await api.getSettings();
    const profileGone = !after.profiles.find((p) => p.id === "debug-profile-test");
    const portGone = !after.ports.find((p) => p.port === 19994);
    const profileRestored = after.profiles.some((p) => p.id === after.active_profile);
    results.push({
      name: "Delete debug-profile-test + restore active_profile + remove port 19994",
      pass: profileGone && portGone && profileRestored,
      detail:
        !profileGone
          ? "Profile still present"
          : !portGone
            ? "Port 19994 still present"
            : !profileRestored
              ? `active_profile="${after.active_profile}" doesn't point to a valid profile`
              : "all cleaned up",
    });
  } catch (e) {
    results.push({
      name: "Delete debug-profile-test + restore active_profile + remove port 19994",
      pass: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  return results;
}


async function runSuite4(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const profileId = (await api.getSettings()).active_profile;
  const patchProfile = (s: Awaited<ReturnType<typeof api.getSettings>>, patch: object) => ({
    ...s,
    profiles: s.profiles.map((p) => p.id === profileId ? { ...p, ...patch } : p),
  });
  const activeP = (s: Awaited<ReturnType<typeof api.getSettings>>) =>
    s.profiles.find((p) => p.id === profileId)!;


  try {
    const s = await api.getSettings();
    const rule = {
      process_name: "debug-exact-proc",
      port: 19995,
      note: null,
      match_type: "exact" as const,
    };
    await api.updateSettings(patchProfile(s, { whitelist: [...activeP(s).whitelist, rule] }));
    const after = await api.getSettings();
    const found = activeP(after).whitelist.find(
      (r) => r.process_name === "debug-exact-proc" && r.port === 19995 && r.match_type === "exact"
    );
    results.push({
      name: "Add whitelist rule: process_name='debug-exact-proc', port=19995, match_type='exact'",
      pass: !!found,
      detail: found ? `match_type="${found.match_type}"` : "Rule not found or match_type wrong",
    });
  } catch (e) {
    results.push({
      name: "Add whitelist rule: exact match",
      pass: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }


  try {
    const s = await api.getSettings();
    const rule = {
      process_name: "debug-*",
      port: null,
      note: null,
      match_type: "glob" as const,
    };
    await api.updateSettings(patchProfile(s, { whitelist: [...activeP(s).whitelist, rule] }));
    const after = await api.getSettings();
    const found = activeP(after).whitelist.find(
      (r) => r.process_name === "debug-*" && r.match_type === "glob"
    );
    results.push({
      name: "Add whitelist rule: process_name='debug-*', port=null, match_type='glob'",
      pass: !!found,
      detail: found ? `match_type="${found.match_type}"` : "Rule not found or match_type wrong",
    });
  } catch (e) {
    results.push({
      name: "Add whitelist rule: glob match",
      pass: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }


  try {
    const s = await api.getSettings();
    const rule = {
      process_name: "/tmp/debug",
      port: null,
      note: null,
      match_type: "path" as const,
    };
    await api.updateSettings(patchProfile(s, { blacklist: [...activeP(s).blacklist, rule] }));
    const after = await api.getSettings();
    const found = activeP(after).blacklist.find(
      (r) => r.process_name === "/tmp/debug" && r.match_type === "path"
    );
    results.push({
      name: "Add blacklist rule: process_name='/tmp/debug', port=null, match_type='path'",
      pass: !!found,
      detail: found ? `match_type="${found.match_type}"` : "Rule not found or match_type wrong",
    });
  } catch (e) {
    results.push({
      name: "Add blacklist rule: path match",
      pass: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }


  try {
    const s = await api.getSettings();
    const ap = activeP(s);
    const exactFound = ap.whitelist.some((r) => r.process_name === "debug-exact-proc");
    const globFound = ap.whitelist.some((r) => r.process_name === "debug-*");
    const pathFound = ap.blacklist.some((r) => r.process_name === "/tmp/debug");
    results.push({
      name: "Verify all 3 rules present with correct match_type values",
      pass: exactFound && globFound && pathFound,
      detail:
        [
          !exactFound && "exact rule missing",
          !globFound && "glob rule missing",
          !pathFound && "path rule missing",
        ]
          .filter(Boolean)
          .join("; ") || "all 3 rules confirmed",
    });
  } catch (e) {
    results.push({
      name: "Verify all 3 rules present",
      pass: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }


  try {
    const s = await api.getSettings();
    const ap2 = activeP(s);
    await api.updateSettings(patchProfile(s, {
      whitelist: ap2.whitelist.filter(
        (r) => r.process_name !== "debug-exact-proc" && r.process_name !== "debug-*"
      ),
      blacklist: ap2.blacklist.filter((r) => r.process_name !== "/tmp/debug"),
    }));
    const after = await api.getSettings();
    const afp = activeP(after);
    const allGone =
      !afp.whitelist.some((r) => r.process_name === "debug-exact-proc") &&
      !afp.whitelist.some((r) => r.process_name === "debug-*") &&
      !afp.blacklist.some((r) => r.process_name === "/tmp/debug");
    results.push({
      name: "Remove all 3 test rules → verified gone",
      pass: allGone,
      detail: allGone ? "all 3 rules removed" : "one or more rules still present after removal",
    });
  } catch (e) {
    results.push({
      name: "Remove all 3 test rules",
      pass: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  return results;
}


async function runSuite5(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const original = await api.getSettings();
  const activeProfileId = original.active_profile;
  const getActiveProfile = (s: typeof original) => s.profiles.find((p) => p.id === activeProfileId)!;
  const patchAutoFix = (s: typeof original, patch: object) => ({
    ...s,
    profiles: s.profiles.map((p) =>
      p.id === activeProfileId ? { ...p, auto_fix: { ...p.auto_fix, ...patch } } : p
    ),
  });
  const savedAutoFix = { ...getActiveProfile(original).auto_fix };


  try {
    const s = await api.getSettings();
    await api.updateSettings(patchAutoFix(s, { enabled: true, require_confirmation: false }));
    const after = await api.getSettings();
    const ap = getActiveProfile(after);
    const correct = ap.auto_fix.enabled === true && ap.auto_fix.require_confirmation === false;
    results.push({
      name: "Set auto_fix: enabled=true, require_confirmation=false → verified",
      pass: correct,
      detail: correct
        ? "enabled=true, require_confirmation=false"
        : `enabled=${ap.auto_fix.enabled}, require_confirmation=${ap.auto_fix.require_confirmation}`,
    });
  } catch (e) {
    results.push({
      name: "Set enabled=true + require_confirmation=false",
      pass: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }


  try {
    await api.addPort(19998, "debug-autofix-test", "tcp");

    const ps = await api.getSettings();
    const pollMs = ps.polling_interval_ms;
    await api.updateSettings({
      ...ps,
      profiles: ps.profiles.map((p) =>
        p.id === ps.active_profile ? { ...p, ports: [...new Set([...p.ports, 19998])] } : p
      ),
    });
    const pid = await api.debugSpawnPortHolder(19998);
    await sleep(pollMs * 2 + 500);
    const entries = await api.getPortStatus([19998]);
    const entry = entries[0];
    const isCleared = !entry || entry.state === "clear" || entry.pid === null;
    results.push({
      name: `Real end-to-end: PID ${pid} on port 19998 → auto-killed within ${pollMs * 2 + 500}ms`,
      pass: isCleared,
      detail: isCleared
        ? "Port 19998 clear — process auto-killed by monitor"
        : `Port 19998 still in use (state="${entry?.state}", pid=${entry?.pid})`,
    });
  } catch (e) {
    results.push({
      name: "Real end-to-end: spawn process on 19998 → auto-killed by monitor",
      pass: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  } finally {
    await api.removePort(19998).catch(() => undefined);
  }


  try {
    const s = await api.getSettings();
    await api.updateSettings(patchAutoFix(s, { enabled: true, require_confirmation: true }));
    const after = await api.getSettings();
    const ap = getActiveProfile(after);
    const correct = ap.auto_fix.enabled === true && ap.auto_fix.require_confirmation === true;
    results.push({
      name: "Set auto_fix: enabled=true, require_confirmation=true → verified",
      pass: correct,
      detail: correct
        ? "enabled=true, require_confirmation=true"
        : `enabled=${ap.auto_fix.enabled}, require_confirmation=${ap.auto_fix.require_confirmation}`,
    });
  } catch (e) {
    results.push({
      name: "Set enabled=true + require_confirmation=true",
      pass: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }


  try {
    const s = await api.getSettings();
    await api.updateSettings(patchAutoFix(s, { enabled: false }));
    const after = await api.getSettings();
    const ap = getActiveProfile(after);
    results.push({
      name: "Set auto_fix: enabled=false → verified",
      pass: ap.auto_fix.enabled === false,
      detail: ap.auto_fix.enabled === false ? "enabled=false" : `enabled=${ap.auto_fix.enabled}`,
    });
  } catch (e) {
    results.push({
      name: "Set enabled=false",
      pass: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }


  try {
    const s = await api.getSettings();
    const pollMs = s.polling_interval_ms;

    await api.updateSettings(patchAutoFix(s, { enabled: true, require_confirmation: false }));

    const ws = await api.getSettings();
    const apWs = getActiveProfile(ws);
    const whitelistRule = { process_name: "python3", port: null as number | null, note: null, match_type: "exact" as const };
    await api.updateSettings({ ...ws, profiles: ws.profiles.map((p) => p.id === activeProfileId ? { ...p, whitelist: [...apWs.whitelist, whitelistRule] } : p) });

    await api.addPort(19996, "debug-whitelist-test", "tcp");
    const ps96 = await api.getSettings();
    await api.updateSettings({
      ...ps96,
      profiles: ps96.profiles.map((p) =>
        p.id === ps96.active_profile ? { ...p, ports: [...new Set([...p.ports, 19996])] } : p
      ),
    });

    await api.debugSpawnPortHolder(19996);

    await sleep(pollMs * 2 + 500);
    const entries = await api.getPortStatus([19996]);
    const stillInUse = entries[0]?.state === "in_use";
    results.push({
      name: `Whitelist: python3 on port 19996 NOT killed (whitelisted exact match)`,
      pass: stillInUse,
      detail: stillInUse
        ? "Port 19996 still in_use — whitelist rule protected process correctly"
        : `Port was killed despite whitelist (state="${entries[0]?.state}") — whitelist not working!`,
    });

    const cs = await api.getSettings();
    const apCs = getActiveProfile(cs);
    await api.updateSettings({ ...cs, profiles: cs.profiles.map((p) => p.id === activeProfileId ? { ...p, whitelist: apCs.whitelist.filter((r) => r.process_name !== "python3" || r.port !== null) } : p) });
    await api.killPort(19996).catch(() => undefined);
    await api.removePort(19996).catch(() => undefined);
  } catch (e) {
    results.push({
      name: "Whitelist behavior: process stays alive while whitelisted",
      pass: false,
      detail: e instanceof Error ? e.message : String(e),
    });
    await api.killPort(19996).catch(() => undefined);
    await api.removePort(19996).catch(() => undefined);
  }


  try {
    const s = await api.getSettings();
    const pollMs = s.polling_interval_ms;

    await api.updateSettings(patchAutoFix(s, { enabled: true, require_confirmation: true }));

    const bs = await api.getSettings();
    const apBs = getActiveProfile(bs);
    const blacklistRule = { process_name: "python3", port: null as number | null, note: null, match_type: "exact" as const };
    await api.updateSettings({ ...bs, profiles: bs.profiles.map((p) => p.id === activeProfileId ? { ...p, blacklist: [...apBs.blacklist, blacklistRule] } : p) });

    await api.addPort(19995, "debug-blacklist-test", "tcp");
    const ps95 = await api.getSettings();
    await api.updateSettings({
      ...ps95,
      profiles: ps95.profiles.map((p) =>
        p.id === ps95.active_profile ? { ...p, ports: [...new Set([...p.ports, 19995])] } : p
      ),
    });

    const pid = await api.debugSpawnPortHolder(19995);

    await sleep(pollMs * 2 + 500);
    const entries = await api.getPortStatus([19995]);
    const wasKilled = !entries[0] || entries[0].state === "clear";
    results.push({
      name: `Blacklist: python3 (PID ${pid}) on 19995 killed despite require_confirmation=true`,
      pass: wasKilled,
      detail: wasKilled
        ? "Port 19995 clear — blacklist bypassed confirmation requirement correctly"
        : `Port 19995 still in use (state="${entries[0]?.state}") — blacklist not overriding confirmation!`,
    });

    const cs = await api.getSettings();
    const apCs2 = getActiveProfile(cs);
    await api.updateSettings({ ...cs, profiles: cs.profiles.map((p) => p.id === activeProfileId ? { ...p, blacklist: apCs2.blacklist.filter((r) => r.process_name !== "python3" || r.port !== null) } : p) });
    await api.killPort(19995).catch(() => undefined);
    await api.removePort(19995).catch(() => undefined);
  } catch (e) {
    results.push({
      name: "Blacklist behavior: process killed despite require_confirmation=true",
      pass: false,
      detail: e instanceof Error ? e.message : String(e),
    });
    await api.killPort(19995).catch(() => undefined);
    await api.removePort(19995).catch(() => undefined);
  }


  try {
    const s = await api.getSettings();
    await api.updateSettings(patchAutoFix(s, savedAutoFix));
    const after = await api.getSettings();
    const ap = getActiveProfile(after);
    const restored =
      ap.auto_fix.enabled === savedAutoFix.enabled &&
      ap.auto_fix.require_confirmation === savedAutoFix.require_confirmation;
    results.push({
      name: "Restore original auto_fix settings → verified",
      pass: restored,
      detail: restored
        ? `enabled=${savedAutoFix.enabled}, require_confirmation=${savedAutoFix.require_confirmation}`
        : `Mismatch: enabled=${ap.auto_fix.enabled}, require_confirmation=${ap.auto_fix.require_confirmation}`,
    });
  } catch (e) {
    results.push({
      name: "Restore original auto_fix settings",
      pass: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  return results;
}


function runSuite6Sync(): TestResult[] {
  function testParse(
    label: string,
    input: string,
    expected: number[] | "throws"
  ): TestResult {
    try {
      const got = parsePortInput(input);
      if (expected === "throws") {
        return {
          name: label,
          pass: false,
          detail: `Expected throw but got [${got.join(",")}]`,
        };
      }
      const matches =
        got.length === expected.length && expected.every((v, i) => got[i] === v);
      return {
        name: label,
        pass: matches,
        detail: matches
          ? `→ [${got.join(",")}]`
          : `expected [${expected.join(",")}], got [${got.join(",")}]`,
      };
    } catch (e) {
      if (expected === "throws") {
        return {
          name: label,
          pass: true,
          detail: `Threw: ${e instanceof Error ? e.message : String(e)}`,
        };
      }
      return {
        name: label,
        pass: false,
        detail: `Unexpected throw: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }

  return [
    testParse('"3000" → [3000]', "3000", [3000]),
    testParse('"3000-3002" → [3000,3001,3002]', "3000-3002", [3000, 3001, 3002]),
    testParse('"3000, 5173, 8000" → [3000,5173,8000]', "3000, 5173, 8000", [3000, 5173, 8000]),
    testParse(
      '"3000-3002, 5000" → [3000,3001,3002,5000]',
      "3000-3002, 5000",
      [3000, 3001, 3002, 5000]
    ),
    testParse('"0" → throws RangeError', "0", "throws"),
    testParse('"65536" → throws RangeError', "65536", "throws"),
    testParse('"abc" → throws', "abc", "throws"),
    testParse('"3000-2999" → throws (start > end)', "3000-2999", "throws"),
    testParse('"3000-3100" → throws (>100 ports)', "3000-3100", "throws"),
    testParse('" 3000 " (whitespace) → [3000]', " 3000 ", [3000]),
    testParse('"3000-3000" (single-port range) → [3000]', "3000-3000", [3000]),
    testParse('"" (empty) → throws', "", "throws"),
  ];
}


async function runSuite7(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  try {
    await api.pauseMonitor();
    results.push({ name: "pauseMonitor() → no throw", pass: true, detail: "paused" });
  } catch (e) {
    results.push({
      name: "pauseMonitor() → no throw",
      pass: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  await sleep(200);

  try {
    await api.resumeMonitor();
    results.push({ name: "resumeMonitor() → no throw", pass: true, detail: "resumed" });
  } catch (e) {
    results.push({
      name: "resumeMonitor() → no throw",
      pass: false,
      detail: e instanceof Error ? e.message : String(e),
    });
    try {
      await api.resumeMonitor();
    } catch {

    }
  }

  try {
    const entries = await api.scanAllActivePorts();
    const isArray = Array.isArray(entries);
    if (!isArray) {
      results.push({
        name: "scanAllActivePorts() → array response with port/state/protocol fields",
        pass: false,
        detail: "Response is not an array",
      });
    } else {
      const sample = entries[0];
      const validShape =
        !sample ||
        (typeof sample.port === "number" &&
          typeof sample.state === "string" &&
          typeof (sample as unknown as Record<string, unknown>).protocol === "string");
      results.push({
        name: "scanAllActivePorts() → array response with port/state/protocol fields",
        pass: validShape,
        detail: validShape
          ? `${entries.length} entries, shape valid`
          : `Entry shape invalid: ${JSON.stringify(sample)}`,
      });
    }
  } catch (e) {
    results.push({
      name: "scanAllActivePorts() → array response",
      pass: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }


  try {
    const pid = await api.debugSpawnPortHolder(19997);
    await sleep(500);
    const before = await api.getPortStatus([19997]);
    const isInUse = before[0]?.state === "in_use";
    results.push({
      name: `debugSpawnPortHolder(19997) → port detected as in_use (PID ${pid})`,
      pass: isInUse,
      detail: isInUse
        ? `state="in_use", pid=${before[0]?.pid}`
        : `state="${before[0]?.state}" (expected "in_use")`,
    });
    if (isInUse) {
      await api.killPort(19997);
      await sleep(400);
      const after = await api.getPortStatus([19997]);
      const cleared = !after[0] || after[0].state === "clear";
      results.push({
        name: "killPort(19997) → port 19997 cleared",
        pass: cleared,
        detail: cleared
          ? "Port 19997 is now clear"
          : `Port 19997 still in use (state="${after[0]?.state}", pid=${after[0]?.pid})`,
      });
    }
  } catch (e) {
    results.push({
      name: "Real kill_port: spawn + scan + kill + verify",
      pass: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  try {
    const entries = await api.scanAllActivePorts();
    if (entries.length === 0) {
      results.push({
        name: "At least one entry has valid shape {port, state, protocol}",
        pass: true,
        detail: "No entries returned (no active ports) — considered valid",
      });
    } else {
      const e0 = entries[0];
      const proto = (e0 as unknown as Record<string, unknown>).protocol as string | undefined;
      const valid =
        typeof e0.port === "number" &&
        (e0.state === "in_use" || e0.state === "clear" || e0.state === "unknown") &&
        (proto === "tcp" || proto === "udp");
      results.push({
        name: "At least one entry has valid shape {port, state, protocol}",
        pass: valid,
        detail: valid
          ? `port=${e0.port}, state="${e0.state}", protocol="${proto}"`
          : `Malformed entry: ${JSON.stringify(e0)}`,
      });
    }
  } catch (e) {
    results.push({
      name: "At least one entry has valid shape",
      pass: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  return results;
}


async function runSuite8(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const VALID_STATES = ["in_use", "clear", "unknown"];
  const VALID_MATCH_TYPES = ["exact", "glob", "path"];
  const VALID_PROTOCOLS_PORT = ["tcp", "udp", "both"];
  const VALID_ACTIONS = [
    "auto_killed",
    "user_killed",
    "user_ignored",
    "dismissed",
    "conflict_detected",
  ];


  try {
    const entries = await api.scanAllActivePorts();
    const invalid = entries.filter((e) => !VALID_STATES.includes(e.state));
    results.push({
      name: `scanAllActivePorts() → every state ∈ ["in_use","clear","unknown"] (snake_case)`,
      pass: invalid.length === 0,
      detail:
        invalid.length === 0
          ? `${entries.length} entries, all valid states`
          : `${invalid.length} invalid: ${[...new Set(invalid.map((e) => e.state))].join(", ")}`,
    });
  } catch (e) {
    results.push({
      name: `scanAllActivePorts() → state enum check`,
      pass: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }


  try {
    const s = await api.getSettings();
    const ap8 = s.profiles.find((p) => p.id === s.active_profile);
    const allRules = [...(ap8?.whitelist ?? []), ...(ap8?.blacklist ?? [])];
    const invalid = allRules.filter((r) => !VALID_MATCH_TYPES.includes(r.match_type));
    results.push({
      name: `getSettings() → every rule.match_type ∈ ["exact","glob","path"]`,
      pass: invalid.length === 0,
      detail:
        invalid.length === 0
          ? allRules.length === 0
            ? "no rules configured"
            : `${allRules.length} rules, all valid`
          : `${invalid.length} invalid: ${[...new Set(invalid.map((r) => r.match_type))].join(", ")}`,
    });
  } catch (e) {
    results.push({
      name: `getSettings() → rule match_type enum check`,
      pass: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }


  try {
    const s = await api.getSettings();
    const invalid = s.ports.filter((p) => !VALID_PROTOCOLS_PORT.includes(p.protocol));
    results.push({
      name: `getSettings() → every PortConfig.protocol ∈ ["tcp","udp","both"]`,
      pass: invalid.length === 0,
      detail:
        invalid.length === 0
          ? s.ports.length === 0
            ? "no ports configured"
            : `${s.ports.length} ports, all valid`
          : `${invalid.length} invalid: ${invalid.map((p) => `${p.port}="${p.protocol}"`).join(", ")}`,
    });
  } catch (e) {
    results.push({
      name: `getSettings() → PortConfig protocol enum check`,
      pass: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }


  try {
    const box: { value: Record<string, unknown> | null } = { value: null };
    const unlisten = await listen<Record<string, unknown>>("log-event", (ev) => {
      box.value = ev.payload;
    });
    try {
      await api.debugEmitLogEvent();
      await new Promise<void>((resolve) => {
        const start = Date.now();
        const check = setInterval(() => {
          if (box.value !== null || Date.now() - start >= 2000) {
            clearInterval(check);
            resolve();
          }
        }, 50);
      });
      const captured = box.value;
      if (captured === null) {
        results.push({
          name: `debugEmitLogEvent() → log-event.action ∈ valid set within 2s`,
          pass: false,
          detail: "No log-event received within 2s",
        });
      } else {
        const action = captured.action as string | undefined;
        const valid = !!action && VALID_ACTIONS.includes(action);
        results.push({
          name: `debugEmitLogEvent() → log-event.action ∈ valid set within 2s`,
          pass: valid,
          detail: valid
            ? `action="${action}"`
            : `action="${action}" not in [${VALID_ACTIONS.join(",")}]`,
        });
      }
    } finally {
      unlisten();
    }
  } catch (e) {
    results.push({
      name: `debugEmitLogEvent() → log-event action enum check`,
      pass: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  return results;
}


async function runSuite9(): Promise<TestResult[]> {
  const results: TestResult[] = [];


  let received: Record<string, unknown> | null = null;
  let receivedCount = 0;
  let unlisten: (() => void) | null = null;

  try {
    unlisten = await listen<Record<string, unknown>>("log-event", (ev) => {
      receivedCount++;
      if (received === null) received = ev.payload;
    });
  } catch (e) {
    results.push({
      name: "listen('log-event') → register listener",
      pass: false,
      detail: e instanceof Error ? e.message : String(e),
    });
    return results;
  }
  results.push({ name: "listen('log-event') → register listener", pass: true });


  try {
    await api.debugEmitLogEvent();
    results.push({ name: "debugEmitLogEvent() → no throw", pass: true });
  } catch (e) {
    results.push({
      name: "debugEmitLogEvent() → no throw",
      pass: false,
      detail: e instanceof Error ? e.message : String(e),
    });
    unlisten?.();
    return results;
  }


  await sleep(500);
  unlisten?.();

  const eventArrived = received !== null;
  results.push({
    name: "log-event received within 500ms",
    pass: eventArrived,
    detail: eventArrived
      ? `received ${receivedCount} event(s)`
      : "No log-event received within 500ms",
  });

  if (!eventArrived) return results;


  const payload = received!;
  const hasTs = typeof payload.ts === "string";
  const hasPort = typeof payload.port === "number";
  const hasAction = typeof payload.action === "string";
  const hasProtocol = typeof payload.protocol === "string";
  const allFieldsOk = hasTs && hasPort && hasAction && hasProtocol;

  results.push({
    name: "Payload has required fields: ts (string), port (number), action (string), protocol (string)",
    pass: allFieldsOk,
    detail:
      [
        !hasTs && `ts is ${typeof payload.ts}`,
        !hasPort && `port is ${typeof payload.port}`,
        !hasAction && `action is ${typeof payload.action}`,
        !hasProtocol && `protocol is ${typeof payload.protocol}`,
      ]
        .filter(Boolean)
        .join("; ") ||
      `ts="${payload.ts}", port=${payload.port}, action="${payload.action}", protocol="${payload.protocol}"`,
  });

  return results;
}


async function runSuite10(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  try {
    const entries = await api.scanAllActivePorts();
    let valid = 0;
    const invalids: string[] = [];

    for (const entry of entries) {
      const proto = (entry as unknown as Record<string, unknown>).protocol as string | undefined;
      const portOk = typeof entry.port === "number" && entry.port >= 1 && entry.port <= 65535;
      const stateOk =
        entry.state === "in_use" || entry.state === "clear" || entry.state === "unknown";
      const protoOk = proto === "tcp" || proto === "udp";
      const pidOk =
        entry.pid === null || entry.pid === undefined || typeof entry.pid === "number";
      const procOk =
        entry.process_name === null ||
        entry.process_name === undefined ||
        typeof entry.process_name === "string";

      if (portOk && stateOk && protoOk && pidOk && procOk) {
        valid++;
      } else {
        const problems = [
          !portOk && `port=${entry.port} (out of range or wrong type)`,
          !stateOk && `state="${entry.state}" (invalid)`,
          !protoOk && `protocol="${proto}" (invalid)`,
          !pidOk && `pid=${entry.pid} (wrong type)`,
          !procOk && `process_name=${entry.process_name} (wrong type)`,
        ]
          .filter(Boolean)
          .join(", ");
        invalids.push(`port ${entry.port}: ${problems}`);
      }
    }

    const total = entries.length;
    const invalidCount = total - valid;

    results.push({
      name: `Scanned ${total} ports — shape validation`,
      pass: invalidCount === 0,
      detail: `${total} total, ${valid} valid, ${invalidCount} invalid`,
    });

    for (const desc of invalids.slice(0, 5)) {
      results.push({ name: `Malformed entry: ${desc}`, pass: false });
    }
    if (invalids.length > 5) {
      results.push({
        name: `…and ${invalids.length - 5} more malformed entries`,
        pass: false,
        detail: "Truncated for brevity",
      });
    }

    if (total > 0) {
      results.push({
        name: `All ${total} entries validated for port/state/protocol/pid/process_name`,
        pass: true,
        detail: `${valid}/${total} valid`,
      });
    }
  } catch (e) {
    results.push({
      name: "scanAllActivePorts() → field validation",
      pass: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  return results;
}


async function runSuite11(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  try {
    const s = await api.getSettings();
    const ap11 = s.profiles.find((p) => p.id === s.active_profile);


    const pollingOk =
      typeof s.polling_interval_ms === "number" &&
      s.polling_interval_ms >= 100 &&
      s.polling_interval_ms <= 30000;
    results.push({
      name: "polling_interval_ms: number 100–30000",
      pass: pollingOk,
      detail: pollingOk
        ? `${s.polling_interval_ms}ms`
        : `got ${s.polling_interval_ms} (type: ${typeof s.polling_interval_ms})`,
    });

    results.push({
      name: "active_profile.auto_fix.enabled: boolean",
      pass: typeof ap11?.auto_fix?.enabled === "boolean",
      detail: `value: ${ap11?.auto_fix?.enabled} (${typeof ap11?.auto_fix?.enabled})`,
    });

    results.push({
      name: "active_profile.auto_fix.require_confirmation: boolean",
      pass: typeof ap11?.auto_fix?.require_confirmation === "boolean",
      detail: `value: ${ap11?.auto_fix?.require_confirmation} (${typeof ap11?.auto_fix?.require_confirmation})`,
    });

    const profilesOk = Array.isArray(s.profiles);
    results.push({
      name: "profiles: array",
      pass: profilesOk,
      detail: profilesOk ? `${s.profiles.length} profiles` : "not an array",
    });

    if (profilesOk) {
      let allProfilesValid = true;
      const profileErrors: string[] = [];
      for (const p of s.profiles) {
        const idOk = typeof p.id === "string";
        const nameOk = typeof p.name === "string";
        const portsOk =
          Array.isArray(p.ports) && p.ports.every((n) => typeof n === "number");
        const wlOk = Array.isArray(p.whitelist);
        const blOk = Array.isArray(p.blacklist);
        const afOk = typeof p.auto_fix?.enabled === "boolean";
        if (!idOk || !nameOk || !portsOk || !wlOk || !blOk || !afOk) {
          allProfilesValid = false;
          profileErrors.push(
            `"${p.id}": ${[
              !idOk && "id not string",
              !nameOk && "name not string",
              !portsOk && "ports not number[]",
              !wlOk && "whitelist not array",
              !blOk && "blacklist not array",
              !afOk && "auto_fix.enabled not boolean",
            ]
              .filter(Boolean)
              .join(", ")}`
          );
        }
      }
      results.push({
        name: "profiles[].id (string), .name (string), .ports (number[]), .whitelist, .blacklist, .auto_fix",
        pass: allProfilesValid,
        detail: allProfilesValid
          ? `all ${s.profiles.length} profiles valid`
          : profileErrors.slice(0, 3).join("; "),
      });
    }

    const portsOk = Array.isArray(s.ports);
    results.push({
      name: "ports: array",
      pass: portsOk,
      detail: portsOk ? `${s.ports.length} ports` : "not an array",
    });

    if (portsOk) {
      let allPortsValid = true;
      const portErrors: string[] = [];
      for (const p of s.ports) {
        const portNumOk = typeof p.port === "number" && p.port >= 1 && p.port <= 65535;
        const protoOk = ["tcp", "udp", "both"].includes(p.protocol);
        const labelOk =
          p.label === null || p.label === undefined || typeof p.label === "string";
        if (!portNumOk || !protoOk || !labelOk) {
          allPortsValid = false;
          portErrors.push(
            `port ${p.port}: ${[
              !portNumOk && "port out of range",
              !protoOk && `protocol="${p.protocol}" invalid`,
              !labelOk && "label wrong type",
            ]
              .filter(Boolean)
              .join(", ")}`
          );
        }
      }
      results.push({
        name: "ports[].port (1–65535), .protocol (valid), .label (string|null)",
        pass: allPortsValid,
        detail: allPortsValid
          ? `all ${s.ports.length} ports valid`
          : portErrors.slice(0, 3).join("; "),
      });
    }
  } catch (e) {
    results.push({
      name: "getSettings() → field validation",
      pass: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  return results;
}


interface SuiteDef {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  timeoutMs?: number;
  run: () => Promise<TestResult[]> | TestResult[];
}

function buildSuiteDefs(): SuiteDef[] {
  return [
    {
      id: "settings-roundtrip",
      name: "Settings round-trip",
      description: "Field presence and type validation",
      icon: <Settings2 className="size-3.5" />,
      run: runSuite1,
    },
    {
      id: "port-management",
      name: "Port management",
      description: "Add, range, duplicate, cleanup",
      icon: <Network className="size-3.5" />,
      run: runSuite2,
    },
    {
      id: "profile-lifecycle",
      name: "Profile lifecycle",
      description: "Create, assign, activate, delete",
      icon: <Layers className="size-3.5" />,
      run: runSuite3,
    },
    {
      id: "rules",
      name: "Rules (all 3 match types)",
      description: "exact / glob / path add+verify+remove",
      icon: <ShieldAlert className="size-3.5" />,
      run: runSuite4,
    },
    {
      id: "auto-fix",
      name: "Auto-fix permutations",
      description: "Settings combos + real kill, whitelist, blacklist",
      icon: <Shield className="size-3.5" />,
      timeoutMs: 45000,
      run: runSuite5,
    },
    {
      id: "parse-port-input",
      name: "parsePortInput (client-side)",
      description: "12 edge cases, no API calls",
      icon: <RefreshCw className="size-3.5" />,
      run: () => runSuite6Sync(),
    },
    {
      id: "monitor-control",
      name: "Monitor control",
      description: "Pause / resume / real spawn + kill_port",
      icon: <Activity className="size-3.5" />,
      timeoutMs: 15000,
      run: runSuite7,
    },
    {
      id: "serialization-contract",
      name: "Serialization contract",
      description: "Enum values arrive as snake_case",
      icon: <ListChecks className="size-3.5" />,
      run: runSuite8,
    },
    {
      id: "activity-log-roundtrip",
      name: "Activity log event round-trip",
      description: "Emit → store row count → field shape",
      icon: <Cpu className="size-3.5" />,
      run: runSuite9,
    },
    {
      id: "port-scan-validation",
      name: "Live port scan field validation",
      description: "Every scanAllActivePorts entry validated",
      icon: <ScanLine className="size-3.5" />,
      run: runSuite10,
    },
    {
      id: "settings-field-validation",
      name: "General settings field validation",
      description: "Deep shape check on all settings fields",
      icon: <Bug className="size-3.5" />,
      run: runSuite11,
    },
  ];
}


function suiteStatusIcon(status: SuiteStatus | "skeleton" | "pending-idle") {
  if (status === "skeleton")
    return <Loader2 className="size-3.5 text-muted-foreground/40 animate-spin" />;
  if (status === "pending" || status === "pending-idle")
    return <Circle className="size-3.5 text-muted-foreground/30" />;
  if (status === "running")
    return <Loader2 className="size-3.5 text-primary-glow animate-spin" />;
  if (status === "passed") return <CheckCircle2 className="size-3.5 text-success" />;
  if (status === "partial") return <AlertCircle className="size-3.5 text-warning" />;
  return <XCircle className="size-3.5 text-destructive" />;
}

function suiteBadgeTone(
  status: SuiteStatus
): "neutral" | "brand" | "success" | "destructive" | "warning" {
  if (status === "pending") return "neutral";
  if (status === "running") return "brand";
  if (status === "passed") return "success";
  if (status === "partial") return "warning";
  return "destructive";
}

function cardBorderClass(status: SuiteStatus | "skeleton" | null) {
  if (!status || status === "skeleton") return "border-border";
  if (status === "passed") return "border-success/40";
  if (status === "failed") return "border-destructive/40";
  if (status === "partial") return "border-warning/40";
  if (status === "running") return "border-primary/40";
  return "border-border";
}


interface SuiteCardProps {
  index: number;
  def: SuiteDef;
  result: SuiteResult | "skeleton" | null;
  isRunningAll: boolean;
  onRunSingle: () => void;
}

function SuiteCard({ index, def, result, isRunningAll, onRunSingle }: SuiteCardProps) {
  const [expanded, setExpanded] = useState(false);

  const isSkeleton = result === "skeleton";
  const suiteResult = !isSkeleton && result !== null ? (result as SuiteResult) : null;
  const status: SuiteStatus | "skeleton" | null = isSkeleton
    ? "skeleton"
    : suiteResult
      ? suiteResult.status
      : null;

  const passCount = suiteResult ? suiteResult.tests.filter((t) => t.pass).length : 0;
  const totalCount = suiteResult ? suiteResult.tests.length : 0;


  useEffect(() => {
    if (suiteResult && (suiteResult.status === "failed" || suiteResult.status === "partial")) {
      setExpanded(true);
    }
  }, [suiteResult?.status]);

  const canExpand = !isSkeleton && suiteResult !== null;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card shadow-card overflow-hidden transition-colors duration-300",
        cardBorderClass(status)
      )}
    >

      <button
        className={cn(
          "w-full flex items-center gap-2.5 px-4 py-3 text-left transition-colors",
          canExpand ? "hover:bg-secondary/40 cursor-pointer" : "cursor-default"
        )}
        onClick={() => {
          if (canExpand) setExpanded((v) => !v);
        }}
        disabled={!canExpand}
      >

        <span className="text-muted-foreground shrink-0">
          {canExpand ? (
            expanded ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )
          ) : (
            <ChevronRight className="size-3.5 opacity-20" />
          )}
        </span>


        <span className="text-[11px] font-mono text-muted-foreground/50 shrink-0 w-4 text-right select-none">
          {index + 1}
        </span>


        <span className="shrink-0">{suiteStatusIcon(status ?? "pending-idle")}</span>


        <span className="text-muted-foreground shrink-0">{def.icon}</span>


        <span className="flex-1 min-w-0">
          {isSkeleton ? (
            <span className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-2.5 w-28" />
            </span>
          ) : (
            <>
              <span className="text-[13px] font-medium text-foreground block leading-none mb-0.5">
                {def.name}
              </span>
              <span className="text-[11px] text-muted-foreground">{def.description}</span>
            </>
          )}
        </span>


        {suiteResult && (
          <span className="flex items-center gap-2 shrink-0 mr-1">
            <span className="text-[11px] text-muted-foreground font-mono tabular">
              {suiteResult.durationMs}ms
            </span>
            <span className="text-[11px] text-muted-foreground font-mono tabular">
              {passCount}/{totalCount}
            </span>
            {suiteResult.status !== "running" && (
              <Badge tone={suiteBadgeTone(suiteResult.status)}>
                {suiteResult.status}
              </Badge>
            )}
          </span>
        )}


        {!isSkeleton && (
          <Button
            variant="secondary"
            size="xs"
            disabled={isRunningAll || status === "running"}
            onClick={(e) => {
              e.stopPropagation();
              onRunSingle();
            }}
            className="shrink-0 ml-1"
          >
            {status === "running" ? (
              <>
                <span className="inline-block size-2.5 rounded-full border-[1.5px] border-current border-r-transparent animate-spin" />
                Running
              </>
            ) : (
              "Run"
            )}
          </Button>
        )}
      </button>


      {isSkeleton && (
        <div className="border-t border-border px-4 py-3 space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-4/6" />
        </div>
      )}


      {canExpand && expanded && suiteResult && (
        <div className="border-t border-border divide-y divide-border/60">
          {suiteResult.tests.map((test, i) => (
            <div
              key={i}
              className={cn(
                "pl-4 pr-4 py-1.5 flex items-start gap-3 border-l-2",
                test.pass ? "border-success/50" : "border-destructive/50"
              )}
            >
              <span className="shrink-0 mt-0.5">
                {test.pass ? (
                  <CheckCircle2 className="size-3 text-success" />
                ) : (
                  <XCircle className="size-3 text-destructive" />
                )}
              </span>
              <span className="flex-1 text-[12px] text-foreground/90 leading-snug">
                {test.name}
              </span>
              {test.detail && (
                <span
                  className={cn(
                    "text-[11px] italic truncate max-w-[260px] shrink-0",
                    test.pass ? "text-muted-foreground" : "text-destructive/70"
                  )}
                  title={test.detail}
                >
                  {test.detail}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-brand transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11.5px] font-mono text-muted-foreground shrink-0 tabular-nums">
        {completed} / {total} suites
      </span>
    </div>
  );
}


function buildTextReport(
  suiteDefs: SuiteDef[],
  results: AllResults,
  totalMs: number
): string {
  const lines: string[] = [
    "ZPortGuard Debug Suite Report",
    `Date: ${new Date().toISOString()}`,
    `Duration: ${(totalMs / 1000).toFixed(2)}s`,
    "",
  ];

  for (let i = 0; i < suiteDefs.length; i++) {
    const def = suiteDefs[i];
    const r = results[i];
    if (!r || r === "skeleton") {
      lines.push(`Suite ${i + 1}: ${def.name} — not run`);
      continue;
    }
    const passed = r.tests.filter((t) => t.pass).length;
    lines.push(
      `Suite ${i + 1}: ${def.name} — ${r.status.toUpperCase()} (${passed}/${r.tests.length}) ${r.durationMs}ms`
    );
    for (const t of r.tests) {
      lines.push(`  ${t.pass ? "✓" : "✗"} ${t.name}${t.detail ? ` — ${t.detail}` : ""}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

interface HealthReportProps {
  results: AllResults;
  totalSuites: number;
  totalMs: number;
  onCopy: () => void;
  copied: boolean;
}

function HealthReport({
  results,
  totalSuites,
  totalMs,
  onCopy,
  copied,
}: HealthReportProps) {
  let totalTests = 0;
  let passedTests = 0;
  let failedSuites = 0;
  let passedSuites = 0;

  for (let i = 0; i < totalSuites; i++) {
    const r = results[i];
    if (r && r !== "skeleton") {
      for (const t of r.tests) {
        totalTests++;
        if (t.pass) passedTests++;
      }
      if (r.status === "passed") passedSuites++;
      if (r.status === "failed" || r.status === "partial") failedSuites++;
    }
  }

  const allPassed = failedSuites === 0 && passedSuites === totalSuites;

  return (
    <Callout
      tone={allPassed ? "success" : "warning"}
      title={
        allPassed
          ? `All ${totalSuites} suites passed — ${passedTests}/${totalTests} tests`
          : `${failedSuites} suite${failedSuites !== 1 ? "s" : ""} had failures — ${passedTests}/${totalTests} tests passed`
      }
      description={`Completed ${totalSuites} suites in ${(totalMs / 1000).toFixed(2)}s`}
      action={
        <Button
          variant="secondary"
          size="xs"
          onClick={onCopy}
          leftIcon={<ClipboardCopy className="size-3" />}
        >
          {copied ? "Copied!" : "Copy Report"}
        </Button>
      }
    />
  );
}


export function DebugTab() {
  const [suiteDefs] = useState<SuiteDef[]>(() => buildSuiteDefs());
  const [results, setResults] = useState<AllResults>({});
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [totalMs, setTotalMs] = useState(0);
  const [copied, setCopied] = useState(false);
  const runAllStartRef = useRef<number>(0);

  const setSuiteResult = useCallback(
    (index: number, result: SuiteResult | "skeleton") => {
      setResults((prev) => ({ ...prev, [index]: result }));
    },
    []
  );


  function computeStatus(tests: TestResult[]): SuiteStatus {
    if (tests.length === 0) return "failed";
    const allPassed = tests.every((t) => t.pass);
    if (allPassed) return "passed";
    const somePassed = tests.some((t) => t.pass);
    return somePassed ? "partial" : "failed";
  }

  const runOneSuite = useCallback(
    async (index: number): Promise<void> => {
      const def = suiteDefs[index];
      const start = Date.now();
      setSuiteResult(index, { status: "running", tests: [], durationMs: 0 });
      let tests: TestResult[] = [];
      try {
        tests = await withTimeout(Promise.resolve(def.run()), def.timeoutMs ?? 10000);
      } catch (e) {
        tests = [
          {
            name: "Suite threw or timed out",
            pass: false,
            detail: e instanceof Error ? e.message : String(e),
          },
        ];
      }
      setSuiteResult(index, {
        status: computeStatus(tests),
        tests,
        durationMs: Date.now() - start,
      });
    },
    [suiteDefs, setSuiteResult]
  );

  const runAll = useCallback(async () => {
    setIsRunningAll(true);
    setFinished(false);
    setCompletedCount(0);
    runAllStartRef.current = Date.now();


    const skeletonState: AllResults = {};
    for (let i = 0; i < suiteDefs.length; i++) skeletonState[i] = "skeleton";
    setResults(skeletonState);


    for (let i = 0; i < suiteDefs.length; i++) {
      const def = suiteDefs[i];
      const start = Date.now();

      setSuiteResult(i, { status: "running", tests: [], durationMs: 0 });

      let tests: TestResult[] = [];
      try {
        tests = await withTimeout(Promise.resolve(def.run()), def.timeoutMs ?? 10000);
      } catch (e) {
        tests = [
          {
            name: "Suite threw or timed out",
            pass: false,
            detail: e instanceof Error ? e.message : String(e),
          },
        ];
      }

      setSuiteResult(i, {
        status: computeStatus(tests),
        tests,
        durationMs: Date.now() - start,
      });
      setCompletedCount(i + 1);
    }

    setTotalMs(Date.now() - runAllStartRef.current);
    setIsRunningAll(false);
    setFinished(true);
  }, [suiteDefs, setSuiteResult]);

  const clearAll = useCallback(() => {
    setResults({});
    setFinished(false);
    setCompletedCount(0);
    setTotalMs(0);
  }, []);

  const copyReport = useCallback(() => {
    const text = buildTextReport(suiteDefs, results, totalMs);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [suiteDefs, results, totalMs]);

  return (
    <div className="space-y-5">

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Bug className="size-4 text-primary-glow" />
            <h2 className="text-[17px] font-semibold tracking-tight">Debug Suite</h2>
          </div>
          <p className="text-[12.5px] text-muted-foreground">
            Live health check of every system component. Creates and cleans up real data.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            disabled={isRunningAll}
          >
            Clear
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={isRunningAll}
            loading={isRunningAll}
            leftIcon={!isRunningAll ? <PlayCircle className="size-3.5" /> : undefined}
            onClick={runAll}
          >
            {isRunningAll ? "Running…" : "Run All Suites"}
          </Button>
        </div>
      </div>


      <Callout
        tone="warning"
        title="Live data — test ports, profiles, and rules will be created and deleted"
        description="This runs real API calls against the running backend. Don't run while actively editing production settings."
        dense
      />


      {(isRunningAll || (finished && completedCount > 0)) && (
        <ProgressBar
          completed={isRunningAll ? completedCount : suiteDefs.length}
          total={suiteDefs.length}
        />
      )}


      {finished && (
        <HealthReport
          results={results}
          totalSuites={suiteDefs.length}
          totalMs={totalMs}
          onCopy={copyReport}
          copied={copied}
        />
      )}


      <div className="space-y-2.5">
        {suiteDefs.map((def, i) => (
          <SuiteCard
            key={def.id}
            index={i}
            def={def}
            result={results[i] ?? null}
            isRunningAll={isRunningAll}
            onRunSingle={() => runOneSuite(i)}
          />
        ))}
      </div>
    </div>
  );
}

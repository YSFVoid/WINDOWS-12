"use client";

import { useEffect, useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import {
  FolderOpen,
  NotebookPen,
  Settings2,
  TerminalSquare,
  Unlock,
  Volume2,
} from "lucide-react";

import { APP_REGISTRY, DESKTOP_SHORTCUTS, type AppId } from "@/lib/apps";
import { useOSStore } from "@/store/useOSStore";

import StartMenu from "./StartMenu";
import SystemPanel from "./SystemPanel";
import Taskbar from "./Taskbar";
import WindowManager from "../window/WindowManager";

const iconMap: Record<AppId, React.ComponentType<{ size?: number }>> = {
  settings: Settings2,
  soundboard: Volume2,
  explorer: FolderOpen,
  notepad: NotebookPen,
  terminal: TerminalSquare,
};

let bootSequencePlayed = false;

export default function Desktop() {
  const openApp = useOSStore((state) => state.openApp);
  const windows = useOSStore((state) => state.windows);
  const locked = useOSStore((state) => state.locked);
  const notifications = useOSStore((state) => state.notifications);
  const dismissNotification = useOSStore((state) => state.dismissNotification);
  const unlockSystem = useOSStore((state) => state.unlockSystem);
  const focusWindow = useOSStore((state) => state.focusWindow);
  const restoreWindow = useOSStore((state) => state.restoreWindow);
  const reduceMotion = useOSStore((state) => state.settings.reduceMotion);
  const playEvent = useOSStore((state) => state.playEvent);
  const playClickSoft = useOSStore((state) => state.playClickSoft);
  const preloadSounds = useOSStore((state) => state.preloadSounds);
  const sidePanelOpen = useOSStore((state) => state.sidePanelOpen);
  const closeSidePanel = useOSStore((state) => state.closeSidePanel);
  const setStartMenuOpen = useOSStore((state) => state.setStartMenuOpen);
  const startMenuOpen = useOSStore((state) => state.startMenuOpen);
  const [altTabOpen, setAltTabOpen] = useState(false);
  const [altTabIndex, setAltTabIndex] = useState(0);

  const altTabWindows = useMemo(
    () => [...windows].sort((left, right) => right.z - left.z),
    [windows]
  );
  const safeAltTabIndex =
    altTabWindows.length > 0 ? altTabIndex % altTabWindows.length : 0;

  useEffect(() => {
    if (bootSequencePlayed) {
      return;
    }

    preloadSounds();
    bootSequencePlayed = true;
    playEvent("boot", { volumeMultiplier: 0.65 });
    const loginTimer = window.setTimeout(
      () => playEvent("login", { volumeMultiplier: 0.6 }),
      520
    );
    return () => window.clearTimeout(loginTimer);
  }, [playEvent, preloadSounds]);

  useEffect(() => {
    if (!notifications.length) {
      return;
    }
    const timers = notifications.map((notification) =>
      window.setTimeout(() => dismissNotification(notification.id), 4500)
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [dismissNotification, notifications]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      if (startMenuOpen) {
        setStartMenuOpen(false);
      }

      if (sidePanelOpen) {
        closeSidePanel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeSidePanel, setStartMenuOpen, sidePanelOpen, startMenuOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab" && event.altKey) {
        if (!altTabWindows.length) {
          return;
        }
        event.preventDefault();
        setAltTabOpen(true);
        setAltTabIndex((current) => {
          if (!altTabOpen) {
            return altTabWindows.length > 1 ? 1 : 0;
          }
          if (event.shiftKey) {
            return (current - 1 + altTabWindows.length) % altTabWindows.length;
          }
          return (current + 1) % altTabWindows.length;
        });
        return;
      }

      if (event.key === "Escape" && altTabOpen) {
        event.preventDefault();
        setAltTabOpen(false);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key !== "Alt" || !altTabOpen) {
        return;
      }
      const target = altTabWindows[safeAltTabIndex];
      if (target) {
        if (target.minimized) {
          restoreWindow(target.id);
        } else {
          focusWindow(target.id);
        }
      }
      setAltTabOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    altTabOpen,
    altTabWindows,
    focusWindow,
    restoreWindow,
    safeAltTabIndex,
  ]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#07030f] text-violet-50">
      <div className="absolute inset-0 bg-[radial-gradient(85%_75%_at_16%_12%,rgba(154,67,255,0.34),transparent),radial-gradient(70%_70%_at_84%_4%,rgba(119,72,255,0.26),transparent),linear-gradient(180deg,#090414_0%,#130626_46%,#090314_100%)]" />
      <div className="noise-overlay pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,transparent,rgba(2,1,6,0.68)_72%)]" />

      {reduceMotion ? (
        <>
          <div className="pointer-events-none absolute -left-36 top-10 h-96 w-96 rounded-full bg-fuchsia-500/25 blur-[128px]" />
          <div className="pointer-events-none absolute right-0 top-20 h-[26rem] w-[26rem] rounded-full bg-indigo-500/22 blur-[130px]" />
        </>
      ) : (
        <>
          <motion.div
            className="pointer-events-none absolute -left-36 top-10 h-96 w-96 rounded-full bg-fuchsia-500/25 blur-[128px]"
            animate={{ x: [0, 28, 0], y: [0, -18, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="pointer-events-none absolute right-0 top-20 h-[26rem] w-[26rem] rounded-full bg-indigo-500/22 blur-[130px]"
            animate={{ x: [0, -24, 0], y: [0, 14, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}

      <section className="absolute inset-0 z-20 p-4 sm:p-6">
        <div className="grid w-[170px] gap-3">
          {DESKTOP_SHORTCUTS.map((appId, index) => {
            const app = APP_REGISTRY[appId];
            const Icon = iconMap[appId];
            return (
              <motion.button
                key={appId}
                type="button"
                initial={reduceMotion ? undefined : { opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.25, delay: index * 0.05 }}
                className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 p-3 text-left backdrop-blur-lg transition hover:border-violet-200/35 hover:bg-white/16"
                onDoubleClick={() => {
                  playClickSoft();
                  openApp(appId);
                }}
              >
                <span className="rounded-xl border border-white/15 bg-white/10 p-2 text-violet-50">
                  <Icon size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{app.title}</span>
                  <span className="block truncate text-xs text-violet-200/65">
                    Double click
                  </span>
                </span>
              </motion.button>
            );
          })}
        </div>
      </section>

      <WindowManager />
      <StartMenu />
      <SystemPanel />
      <Taskbar />

      <div className="pointer-events-none absolute right-4 top-4 z-[75] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={reduceMotion ? undefined : { opacity: 0, x: 18, y: 8 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, x: 12 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
              className={`pointer-events-auto rounded-2xl border p-3 backdrop-blur-xl ${
                notification.level === "error"
                  ? "border-rose-200/30 bg-rose-500/20"
                  : "border-white/15 bg-[#120a28]/72"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-violet-50">{notification.title}</p>
                  <p className="mt-1 text-xs text-violet-100/80">{notification.message}</p>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-violet-100/80 transition hover:bg-white/15"
                  onClick={() => dismissNotification(notification.id)}
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {altTabOpen && altTabWindows.length ? (
          <motion.div
            className="pointer-events-none absolute inset-0 z-[106] flex items-center justify-center bg-black/25 backdrop-blur-[2px]"
            initial={reduceMotion ? undefined : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.14 }}
          >
            <div className="glass-panel w-[min(92vw,640px)] rounded-[22px] border border-white/15 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-violet-200/70">
                Switch Windows
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {altTabWindows.map((windowData, index) => {
                  const Icon = iconMap[windowData.appId];
                  const active = index === safeAltTabIndex;
                  return (
                    <article
                      key={windowData.id}
                      className={`rounded-xl border p-3 ${
                        active
                          ? "border-violet-300/40 bg-violet-400/24"
                          : "border-white/10 bg-black/25"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg border border-white/12 bg-white/10 p-1.5 text-violet-100">
                          <Icon size={14} />
                        </span>
                        <span className="text-sm font-semibold text-violet-50">
                          {windowData.title}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {locked ? (
          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            className="absolute inset-0 z-[110] flex items-center justify-center bg-[#05010d]/80 backdrop-blur-xl"
          >
            <div className="glass-panel w-[min(92vw,430px)] rounded-[22px] border border-white/15 p-6 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-violet-300/75">Locked</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">PurpleOS Session</h2>
              <p className="mt-2 text-sm text-violet-100/75">
                Unlock to return to your desktop.
              </p>
              <button
                type="button"
                className="mx-auto mt-5 inline-flex items-center gap-2 rounded-xl border border-violet-200/35 bg-violet-500/30 px-4 py-2 text-sm font-semibold text-violet-50 transition hover:bg-violet-500/40"
                onClick={() => {
                  playClickSoft();
                  unlockSystem();
                }}
              >
                <Unlock size={16} />
                Unlock session
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

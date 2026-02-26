"use client";

import { useEffect, useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import {
  FolderOpen,
  NotebookPen,
  Settings2,
  TerminalSquare,
  Volume2,
} from "lucide-react";

import LoginScreen from "@/components/auth/LoginScreen";
import LockScreen from "@/components/auth/LockScreen";
import ShutdownModal from "@/components/auth/ShutdownModal";
import { getWallpaper } from "@/lib/wallpapers";
import { type AppId } from "@/lib/apps";
import { useOSStore } from "@/store/useOSStore";

import DesktopIcons from "./DesktopIcons";
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
  const windows = useOSStore((state) => state.windows);
  const authView = useOSStore((state) => state.authView);
  const notifications = useOSStore((state) => state.notifications);
  const dismissNotification = useOSStore((state) => state.dismissNotification);
  const focusWindow = useOSStore((state) => state.focusWindow);
  const restoreWindow = useOSStore((state) => state.restoreWindow);
  const reduceMotion = useOSStore((state) => state.settings.reduceMotion);
  const wallpaper = useOSStore((state) => state.settings.wallpaper);
  const playEvent = useOSStore((state) => state.playEvent);
  const playClickSoft = useOSStore((state) => state.playClickSoft);
  const preloadSounds = useOSStore((state) => state.preloadSounds);
  const sidePanelOpen = useOSStore((state) => state.sidePanelOpen);
  const closeSidePanel = useOSStore((state) => state.closeSidePanel);
  const setStartMenuOpen = useOSStore((state) => state.setStartMenuOpen);
  const startMenuOpen = useOSStore((state) => state.startMenuOpen);
  const unlockSystem = useOSStore((state) => state.unlockSystem);
  const loginSession = useOSStore((state) => state.loginSession);
  const restartSession = useOSStore((state) => state.restartSession);

  const [altTabOpen, setAltTabOpen] = useState(false);
  const [altTabIndex, setAltTabIndex] = useState(0);
  const [lockClock, setLockClock] = useState(() => new Date());
  const [shutdownModalOpen, setShutdownModalOpen] = useState(false);

  const activeAuthView = authView;
  const desktopReady = activeAuthView === null;
  const activeWallpaper = getWallpaper(wallpaper);

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
    if (activeAuthView !== "lock") {
      return;
    }

    const timer = window.setInterval(() => setLockClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, [activeAuthView]);

  useEffect(() => {
    if (!desktopReady) {
      setStartMenuOpen(false);
      closeSidePanel();
      return;
    }

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
  }, [closeSidePanel, desktopReady, setStartMenuOpen, sidePanelOpen, startMenuOpen]);

  useEffect(() => {
    if (!desktopReady) {
      return;
    }

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
    desktopReady,
    focusWindow,
    restoreWindow,
    safeAltTabIndex,
  ]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#07030f] text-violet-50">
      <img
        src={activeWallpaper.source}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-95"
      />
      <div className="absolute inset-0 bg-[radial-gradient(85%_75%_at_16%_12%,rgba(154,67,255,0.26),transparent),radial-gradient(70%_70%_at_84%_4%,rgba(119,72,255,0.24),transparent),linear-gradient(180deg,rgba(9,4,20,0.46)_0%,rgba(8,3,18,0.58)_100%)]" />
      <div className="noise-overlay pointer-events-none absolute inset-0 opacity-35" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_32%,transparent,rgba(4,2,8,0.74)_75%)]" />

      {reduceMotion ? (
        <>
          <div className="pointer-events-none absolute -left-36 top-10 h-96 w-96 rounded-full bg-fuchsia-500/24 blur-[122px]" />
          <div className="pointer-events-none absolute right-0 top-20 h-[26rem] w-[26rem] rounded-full bg-indigo-500/24 blur-[126px]" />
        </>
      ) : (
        <>
          <motion.div
            className="pointer-events-none absolute -left-36 top-10 h-96 w-96 rounded-full bg-fuchsia-500/24 blur-[122px]"
            animate={{ x: [0, 28, 0], y: [0, -18, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="pointer-events-none absolute right-0 top-20 h-[26rem] w-[26rem] rounded-full bg-indigo-500/24 blur-[126px]"
            animate={{ x: [0, -24, 0], y: [0, 14, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}

      <div className="pointer-events-none absolute left-1/2 top-[46%] z-10 -translate-x-1/2 -translate-y-1/2 text-center">
        <p className="text-[13px] font-medium uppercase tracking-[0.42em] text-violet-200/55">
          PurpleOS
        </p>
      </div>

      {desktopReady ? (
        <>
          <DesktopIcons />
          <WindowManager />
          <StartMenu />
          <SystemPanel />
          <Taskbar />

          <div className="pointer-events-none absolute right-4 top-4 z-[88] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
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
                      <p className="text-sm font-semibold text-violet-50">
                        {notification.title}
                      </p>
                      <p className="mt-1 text-xs text-violet-100/80">
                        {notification.message}
                      </p>
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
        </>
      ) : null}

      <AnimatePresence>
        {activeAuthView === "lock" ? (
          <LockScreen
            reduceMotion={reduceMotion}
            clock={lockClock}
            wallpaperSrc={activeWallpaper.source}
            onUnlock={() => {
              playClickSoft();
              unlockSystem();
            }}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeAuthView === "login" ? (
          <LoginScreen
            reduceMotion={reduceMotion}
            wallpaperSrc={activeWallpaper.source}
            onLogin={() => {
              playClickSoft();
              loginSession();
            }}
            onOpenPowerModal={() => {
              playClickSoft();
              setShutdownModalOpen(true);
            }}
            onRestart={() => {
              playClickSoft();
              setShutdownModalOpen(false);
              restartSession();
            }}
          />
        ) : null}
      </AnimatePresence>

      <ShutdownModal
        open={shutdownModalOpen && activeAuthView === "login"}
        reduceMotion={reduceMotion}
        onClose={() => {
          playClickSoft();
          setShutdownModalOpen(false);
        }}
      />
    </main>
  );
}

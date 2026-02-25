"use client";

import { useEffect, useMemo, useState } from "react";

import {
  BellRing,
  FolderOpen,
  NotebookPen,
  Power,
  Settings2,
  Sparkles,
  Volume2,
} from "lucide-react";

import { APP_REGISTRY, type AppId } from "@/lib/apps";
import { useOSStore } from "@/store/useOSStore";

const iconMap: Record<AppId, React.ComponentType<{ size?: number }>> = {
  settings: Settings2,
  soundboard: Volume2,
  explorer: FolderOpen,
  notepad: NotebookPen,
};

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
});

export default function Taskbar() {
  const [clock, setClock] = useState(() => new Date());

  const windows = useOSStore((state) => state.windows);
  const focusedWindowId = useOSStore((state) => state.focusedWindowId);
  const startMenuOpen = useOSStore((state) => state.startMenuOpen);
  const sound = useOSStore((state) => state.sound);
  const lockSystem = useOSStore((state) => state.lockSystem);
  const toggleStartMenu = useOSStore((state) => state.toggleStartMenu);
  const openApp = useOSStore((state) => state.openApp);
  const focusWindow = useOSStore((state) => state.focusWindow);
  const restoreWindow = useOSStore((state) => state.restoreWindow);
  const minimizeWindow = useOSStore((state) => state.minimizeWindow);
  const pushNotification = useOSStore((state) => state.pushNotification);
  const playClickSoft = useOSStore((state) => state.playClickSoft);

  const runningWindows = useMemo(
    () => [...windows].sort((left, right) => left.z - right.z),
    [windows]
  );

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000 * 30);
    return () => window.clearInterval(timer);
  }, []);

  const handleWindowButton = (windowId: string) => {
    const target = windows.find((windowData) => windowData.id === windowId);
    if (!target) {
      return;
    }

    playClickSoft();

    if (target.minimized) {
      restoreWindow(windowId);
      return;
    }

    if (focusedWindowId === windowId) {
      minimizeWindow(windowId);
      return;
    }

    focusWindow(windowId);
  };

  return (
    <footer className="absolute inset-x-0 bottom-0 z-[90] px-4 pb-3">
      <div className="glass-panel mx-auto flex h-[66px] max-w-[1580px] items-center justify-between rounded-[20px] border border-white/15 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            className={`inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition ${
              startMenuOpen
                ? "border-violet-200/35 bg-violet-400/30 text-white"
                : "border-white/10 bg-white/8 text-violet-50 hover:bg-white/16"
            }`}
            onClick={() => {
              playClickSoft();
              toggleStartMenu();
            }}
          >
            <Sparkles size={16} />
            Start
          </button>

          <div className="hidden items-center gap-1.5 md:flex">
            {(["explorer", "soundboard", "settings", "notepad"] as AppId[]).map(
              (appId) => {
                const Icon = iconMap[appId];
                return (
                  <button
                    key={appId}
                    type="button"
                    title={`Open ${APP_REGISTRY[appId].title}`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/8 text-violet-100 transition hover:border-white/25 hover:bg-white/16"
                    onClick={() => {
                      playClickSoft();
                      openApp(appId);
                    }}
                  >
                    <Icon size={16} />
                  </button>
                );
              }
            )}
          </div>

          <div className="ml-1 flex min-w-0 items-center gap-1.5 overflow-x-auto pb-1">
            {runningWindows.map((windowData) => {
              const Icon = iconMap[windowData.appId];
              const isFocused = windowData.id === focusedWindowId && !windowData.minimized;
              return (
                <button
                  key={windowData.id}
                  type="button"
                  className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-medium transition ${
                    isFocused
                      ? "border-violet-300/45 bg-violet-400/30 text-white"
                      : "border-white/10 bg-white/8 text-violet-100 hover:bg-white/16"
                  }`}
                  onClick={() => handleWindowButton(windowData.id)}
                >
                  <Icon size={14} />
                  <span className="max-w-[150px] truncate">{windowData.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/8 text-violet-100 transition hover:bg-white/16"
            title="Quick notification"
            onClick={() => {
              playClickSoft();
              pushNotification("PurpleOS", "Taskbar ping received.");
            }}
          >
            <BellRing size={15} />
          </button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/8 text-violet-100 transition hover:bg-white/16"
            title="Lock system"
            onClick={() => {
              playClickSoft();
              lockSystem();
            }}
          >
            <Power size={15} />
          </button>
          <div className="rounded-xl border border-white/10 bg-white/8 px-3 py-1.5 text-right text-xs text-violet-100">
            <div className="font-semibold text-violet-50">{timeFormatter.format(clock)}</div>
            <div className="mt-0.5 text-[11px] text-violet-200/75">
              Vol {Math.round(sound.volume * 100)}% {sound.muted ? "Muted" : ""}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

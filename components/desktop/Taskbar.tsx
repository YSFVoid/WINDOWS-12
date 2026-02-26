"use client";

import { useEffect, useMemo, useState } from "react";

import {
  BatteryMedium,
  BellRing,
  FolderOpen,
  Lock,
  NotebookPen,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  TerminalSquare,
  Volume2,
  VolumeX,
  Wifi,
} from "lucide-react";

import { APP_REGISTRY, TASKBAR_PINNED_APPS, type AppId } from "@/lib/apps";
import { TASKBAR_DOCK_BOTTOM, TASKBAR_DOCK_HEIGHT } from "@/lib/layout";
import { useOSStore } from "@/store/useOSStore";

const appIconMap: Record<AppId, React.ComponentType<{ size?: number }>> = {
  settings: Settings2,
  soundboard: Volume2,
  explorer: FolderOpen,
  notepad: NotebookPen,
  terminal: TerminalSquare,
};

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export default function Taskbar() {
  const [clock, setClock] = useState(() => new Date());

  const windows = useOSStore((state) => state.windows);
  const focusedWindowId = useOSStore((state) => state.focusedWindowId);
  const startMenuOpen = useOSStore((state) => state.startMenuOpen);
  const sound = useOSStore((state) => state.sound);
  const notificationHistoryCount = useOSStore(
    (state) => state.notificationHistory.length
  );

  const lockSystem = useOSStore((state) => state.lockSystem);
  const toggleStartMenu = useOSStore((state) => state.toggleStartMenu);
  const openApp = useOSStore((state) => state.openApp);
  const focusWindow = useOSStore((state) => state.focusWindow);
  const restoreWindow = useOSStore((state) => state.restoreWindow);
  const minimizeWindow = useOSStore((state) => state.minimizeWindow);
  const toggleSidePanel = useOSStore((state) => state.toggleSidePanel);
  const openSidePanel = useOSStore((state) => state.openSidePanel);
  const toggleMute = useOSStore((state) => state.toggleMute);
  const playClickSoft = useOSStore((state) => state.playClickSoft);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000 * 15);
    return () => window.clearInterval(timer);
  }, []);

  const focusedWindow = useMemo(
    () => windows.find((windowData) => windowData.id === focusedWindowId),
    [focusedWindowId, windows]
  );

  const latestWindowByApp = useMemo(() => {
    const map = new Map<AppId, (typeof windows)[number]>();
    const ordered = [...windows].sort((left, right) => right.z - left.z);
    for (const windowData of ordered) {
      if (!map.has(windowData.appId)) {
        map.set(windowData.appId, windowData);
      }
    }
    return map;
  }, [windows]);

  const dockApps = useMemo(() => {
    const merged: AppId[] = [...TASKBAR_PINNED_APPS];
    const running = [...latestWindowByApp.keys()].filter(
      (appId) => !merged.includes(appId)
    );
    return [...merged, ...running];
  }, [latestWindowByApp]);

  const handleAppClick = (appId: AppId) => {
    playClickSoft();
    const target = latestWindowByApp.get(appId);
    if (!target) {
      openApp(appId);
      return;
    }

    if (target.minimized) {
      restoreWindow(target.id);
      return;
    }

    if (focusedWindowId === target.id) {
      minimizeWindow(target.id);
      return;
    }

    focusWindow(target.id);
  };

  return (
    <footer
      className="absolute left-1/2 z-[95]"
      style={{
        bottom: `${TASKBAR_DOCK_BOTTOM}px`,
        transform: "translateX(-50%)",
      }}
    >
      <div
        className="dock-shell rounded-full border border-white/20 px-3"
        style={{ minHeight: `${TASKBAR_DOCK_HEIGHT}px` }}
      >
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className={`dock-icon-button h-10 w-10 ${
              startMenuOpen ? "dock-icon-button-active" : ""
            }`}
            title="Start"
            onClick={() => {
              playClickSoft();
              toggleStartMenu();
            }}
          >
            <Sparkles size={16} />
          </button>

          <span className="dock-divider" />

          <div className="flex items-center gap-1">
            {dockApps.map((appId) => {
              const Icon = appIconMap[appId];
              const app = APP_REGISTRY[appId];
              const runningWindow = latestWindowByApp.get(appId);
              const isRunning = Boolean(runningWindow);
              const isFocused =
                focusedWindow?.appId === appId && Boolean(focusedWindow) && !focusedWindow.minimized;

              return (
                <button
                  key={appId}
                  type="button"
                  className={`dock-icon-button group relative h-10 w-10 ${
                    isFocused ? "dock-icon-button-focused" : ""
                  }`}
                  onClick={() => handleAppClick(appId)}
                  title={app.title}
                >
                  <Icon size={17} />
                  {isRunning ? (
                    <span
                      className={`absolute -bottom-[5px] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${
                        isFocused ? "bg-violet-200" : "bg-violet-300/85"
                      }`}
                    />
                  ) : null}
                  <span className="dock-tooltip">{app.title}</span>
                </button>
              );
            })}
          </div>

          <span className="dock-divider" />

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="dock-icon-button h-9 w-9"
              title="Notifications"
              onClick={() => {
                playClickSoft();
                toggleSidePanel("notifications");
              }}
            >
              <BellRing size={14} />
              {notificationHistoryCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 rounded-full bg-violet-300 px-1 text-[9px] font-bold text-violet-950">
                  {Math.min(notificationHistoryCount, 99)}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              className="dock-icon-button h-9 w-9"
              title="Quick Settings"
              onClick={() => {
                playClickSoft();
                toggleSidePanel("quickSettings");
              }}
            >
              <SlidersHorizontal size={14} />
            </button>
            <button
              type="button"
              className="dock-icon-button h-9 w-9"
              title={sound.muted ? "Unmute" : "Mute"}
              onClick={() => {
                playClickSoft();
                toggleMute();
              }}
            >
              {sound.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <span className="dock-static-icon">
              <Wifi size={13} />
            </span>
            <span className="dock-static-icon">
              <BatteryMedium size={13} />
            </span>
            <button
              type="button"
              className="dock-icon-button h-9 w-9"
              title="Lock"
              onClick={() => {
                playClickSoft();
                lockSystem();
              }}
            >
              <Lock size={14} />
            </button>
          </div>

          <button
            type="button"
            className="dock-clock-pill"
            onClick={() => {
              playClickSoft();
              openSidePanel("quickSettings");
            }}
          >
            <span className="block text-sm font-semibold text-violet-50">
              {timeFormatter.format(clock)}
            </span>
            <span className="block text-[10px] text-violet-200/70">
              {dateFormatter.format(clock)}
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
}

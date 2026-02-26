"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import {
  BellRing,
  FolderOpen,
  Lock,
  NotebookPen,
  Search,
  Settings2,
  TerminalSquare,
  Volume2,
} from "lucide-react";

import { APP_REGISTRY, START_MENU_APPS, type AppId } from "@/lib/apps";
import { TASKBAR_DOCK_BOTTOM, TASKBAR_DOCK_HEIGHT } from "@/lib/layout";
import { useOSStore } from "@/store/useOSStore";

const iconMap: Record<AppId, React.ComponentType<{ size?: number }>> = {
  settings: Settings2,
  soundboard: Volume2,
  explorer: FolderOpen,
  notepad: NotebookPen,
  terminal: TerminalSquare,
};

export default function StartMenu() {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const startMenuOpen = useOSStore((state) => state.startMenuOpen);
  const reduceMotion = useOSStore((state) => state.settings.reduceMotion);
  const recentApps = useOSStore((state) => state.recentApps);
  const openApp = useOSStore((state) => state.openApp);
  const setStartMenuOpen = useOSStore((state) => state.setStartMenuOpen);
  const lockSystem = useOSStore((state) => state.lockSystem);
  const pushNotification = useOSStore((state) => state.pushNotification);
  const playClickSoft = useOSStore((state) => state.playClickSoft);

  const filteredApps = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return START_MENU_APPS;
    }

    return START_MENU_APPS.filter((appId) => {
      const app = APP_REGISTRY[appId];
      return (
        app.title.toLowerCase().includes(needle) ||
        app.description.toLowerCase().includes(needle)
      );
    });
  }, [query]);

  const recommendedApps = useMemo(
    () => recentApps.filter((appId) => appId in APP_REGISTRY).slice(0, 5),
    [recentApps]
  );

  const launchApp = (appId: AppId) => {
    playClickSoft();
    openApp(appId);
  };

  useEffect(() => {
    if (!startMenuOpen) {
      return;
    }

    const timer = window.setTimeout(() => searchRef.current?.focus(), 30);
    return () => window.clearTimeout(timer);
  }, [startMenuOpen]);

  useEffect(() => {
    if (!startMenuOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setStartMenuOpen(false);
      } else if (event.key === "Enter" && filteredApps.length) {
        event.preventDefault();
        playClickSoft();
        openApp(filteredApps[0]);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [filteredApps, openApp, playClickSoft, setStartMenuOpen, startMenuOpen]);

  return (
    <AnimatePresence>
      {startMenuOpen ? (
        <>
          <motion.button
            type="button"
            aria-label="Close start menu"
            className="absolute inset-0 z-[80] h-full w-full bg-black/26"
            onClick={() => setStartMenuOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.16 }}
          />

          <motion.aside
            className="start-menu-shell absolute left-1/2 z-[85] w-[min(96vw,640px)] -translate-x-1/2 rounded-[24px] border border-white/16 p-4"
            style={{ bottom: `${TASKBAR_DOCK_BOTTOM + TASKBAR_DOCK_HEIGHT + 14}px` }}
            initial={reduceMotion ? undefined : { opacity: 0, y: 14, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 10, filter: "blur(4px)" }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
          >
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-violet-200/70"
              />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search apps, settings, and files"
                className="w-full rounded-2xl border border-white/12 bg-black/30 py-2.5 pl-9 pr-3 text-sm text-violet-50 outline-none ring-violet-300/40 transition focus:ring-2"
              />
            </div>

            <section className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-violet-50">Pinned</h3>
                <span className="text-xs text-violet-200/65">{filteredApps.length} apps</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {filteredApps.map((appId) => {
                  const app = APP_REGISTRY[appId];
                  const Icon = iconMap[appId];
                  return (
                    <button
                      key={appId}
                      type="button"
                      className="group rounded-2xl border border-white/10 bg-white/7 px-3 py-3 text-left transition hover:border-violet-200/35 hover:bg-white/16"
                      onClick={() => launchApp(appId)}
                    >
                      <span className="inline-flex rounded-xl border border-white/12 bg-white/10 p-2 text-violet-100">
                        <Icon size={15} />
                      </span>
                      <span className="mt-2 block text-xs font-semibold text-violet-50">
                        {app.title}
                      </span>
                    </button>
                  );
                })}
              </div>
              {!filteredApps.length ? (
                <div className="mt-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-violet-200/70">
                  No app matched &quot;{query}&quot;.
                </div>
              ) : null}
            </section>

            <section className="mt-4 rounded-2xl border border-white/10 bg-black/24 p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-violet-50">Recommended</h3>
                <span className="text-xs text-violet-200/65">Recent</span>
              </div>
              <div className="space-y-1.5">
                {recommendedApps.length ? (
                  recommendedApps.map((appId) => {
                    const app = APP_REGISTRY[appId];
                    const Icon = iconMap[appId];
                    return (
                      <button
                        key={`recommended-${appId}`}
                        type="button"
                        className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm text-violet-100 transition hover:bg-white/10"
                        onClick={() => launchApp(appId)}
                      >
                        <span className="rounded-lg border border-white/12 bg-white/10 p-1.5">
                          <Icon size={13} />
                        </span>
                        <span>{app.title}</span>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-xs text-violet-200/70">
                    Open apps to populate recommendations.
                  </p>
                )}
              </div>
            </section>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/8 px-3 py-1.5 text-xs text-violet-100 transition hover:bg-white/14"
                onClick={() => {
                  playClickSoft();
                  pushNotification("PurpleOS", "Pinned layout is up to date.");
                }}
              >
                <BellRing size={13} />
                Notify
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/8 px-3 py-1.5 text-xs text-violet-100 transition hover:bg-white/14"
                onClick={() => {
                  playClickSoft();
                  lockSystem();
                }}
              >
                <Lock size={13} />
                Lock
              </button>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

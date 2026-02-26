"use client";

import { useEffect, useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import {
  BellRing,
  BatteryMedium,
  SlidersHorizontal,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import type { SidePanelTab } from "@/store/useOSStore";
import { useOSStore } from "@/store/useOSStore";

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
});

type TabButtonProps = {
  tab: SidePanelTab;
  activeTab: SidePanelTab;
  onClick: (tab: SidePanelTab) => void;
  children: React.ReactNode;
  icon: React.ReactNode;
};

function TabButton({ tab, activeTab, onClick, children, icon }: TabButtonProps) {
  const isActive = tab === activeTab;
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        isActive
          ? "border-violet-200/35 bg-violet-400/28 text-violet-50"
          : "border-white/10 bg-white/6 text-violet-200/85 hover:bg-white/14"
      }`}
      onClick={() => onClick(tab)}
    >
      {icon}
      {children}
    </button>
  );
}

export default function SystemPanel() {
  const sidePanelOpen = useOSStore((state) => state.sidePanelOpen);
  const sidePanelTab = useOSStore((state) => state.sidePanelTab);
  const reduceMotion = useOSStore((state) => state.settings.reduceMotion);
  const notificationHistory = useOSStore((state) => state.notificationHistory);
  const sound = useOSStore((state) => state.sound);
  const settings = useOSStore((state) => state.settings);

  const setVolume = useOSStore((state) => state.setVolume);
  const toggleMute = useOSStore((state) => state.toggleMute);
  const setClickSoftEnabled = useOSStore((state) => state.setClickSoftEnabled);
  const setReduceMotion = useOSStore((state) => state.setReduceMotion);
  const setSidePanelTab = useOSStore((state) => state.setSidePanelTab);
  const closeSidePanel = useOSStore((state) => state.closeSidePanel);
  const clearNotificationHistory = useOSStore(
    (state) => state.clearNotificationHistory
  );
  const dismissNotificationHistory = useOSStore(
    (state) => state.dismissNotificationHistory
  );
  const playClickSoft = useOSStore((state) => state.playClickSoft);
  const playEvent = useOSStore((state) => state.playEvent);

  const [batteryLevel, setBatteryLevel] = useState(86);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setBatteryLevel((value) => {
        const delta = Math.random() > 0.5 ? -1 : 1;
        return Math.max(28, Math.min(99, value + delta));
      });
    }, 12000);
    return () => window.clearInterval(timer);
  }, []);

  const orderedHistory = useMemo(
    () =>
      [...notificationHistory].sort(
        (left, right) => right.createdAt - left.createdAt
      ),
    [notificationHistory]
  );

  return (
    <AnimatePresence>
      {sidePanelOpen ? (
        <>
          <motion.button
            type="button"
            aria-label="Close system panel"
            className="absolute inset-0 z-[92] h-full w-full bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            onClick={() => closeSidePanel()}
          />

          <motion.aside
            className="system-panel-shell absolute right-4 top-4 z-[93] flex h-[calc(100vh-98px)] w-[min(95vw,392px)] flex-col rounded-[24px] border border-white/14 p-4"
            initial={reduceMotion ? undefined : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: 18 }}
            transition={{ duration: reduceMotion ? 0 : 0.24, ease: "easeOut" }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-violet-50">System Panel</h2>
              <button
                type="button"
                className="rounded-full border border-white/10 bg-white/6 p-1.5 text-violet-100 transition hover:bg-white/14"
                onClick={() => {
                  playClickSoft();
                  closeSidePanel();
                }}
              >
                <X size={15} />
              </button>
            </div>

            <div className="mt-3 flex items-center gap-1.5">
              <TabButton
                tab="notifications"
                activeTab={sidePanelTab}
                onClick={(tab) => {
                  playClickSoft();
                  setSidePanelTab(tab);
                }}
                icon={<BellRing size={15} />}
              >
                Notifications
              </TabButton>
              <TabButton
                tab="quickSettings"
                activeTab={sidePanelTab}
                onClick={(tab) => {
                  playClickSoft();
                  setSidePanelTab(tab);
                }}
                icon={<SlidersHorizontal size={15} />}
              >
                Quick Settings
              </TabButton>
            </div>

            {sidePanelTab === "notifications" ? (
              <section className="mt-4 flex min-h-0 flex-1 flex-col">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.18em] text-violet-200/70">
                    History ({orderedHistory.length})
                  </p>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg border border-white/12 bg-white/10 px-2.5 py-1 text-xs text-violet-100 transition hover:bg-white/20"
                    onClick={() => {
                      playClickSoft();
                      clearNotificationHistory();
                    }}
                  >
                    <Trash2 size={13} />
                    Clear all
                  </button>
                </div>

                <div className="mt-3 flex-1 space-y-2 overflow-auto pr-1">
                  {orderedHistory.length ? (
                    orderedHistory.map((notification) => (
                      <article
                        key={notification.id}
                        className={`rounded-2xl border p-3 ${
                          notification.level === "error"
                            ? "border-rose-300/30 bg-rose-400/18"
                            : "border-white/10 bg-black/24"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-violet-50">
                              {notification.title}
                            </p>
                            <p className="mt-1 text-xs text-violet-100/80">
                              {notification.message}
                            </p>
                            <p className="mt-2 text-[11px] text-violet-200/65">
                              {timeFormatter.format(notification.createdAt)}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="rounded-md border border-white/10 bg-white/8 px-2 py-1 text-[11px] text-violet-100/85 transition hover:bg-white/16"
                            onClick={() => dismissNotificationHistory(notification.id)}
                          >
                            Dismiss
                          </button>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-violet-200/70">
                      No notifications yet.
                    </div>
                  )}
                </div>
              </section>
            ) : (
              <section className="mt-4 flex min-h-0 flex-1 flex-col">
                <div className="rounded-2xl border border-white/10 bg-black/24 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-violet-50">Audio</p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-lg border border-white/12 bg-white/10 px-2.5 py-1 text-xs text-violet-100 transition hover:bg-white/20"
                      onClick={() => {
                        playClickSoft();
                        toggleMute();
                      }}
                    >
                      {sound.muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                      {sound.muted ? "Unmute" : "Mute"}
                    </button>
                  </div>
                  <label className="mt-3 block">
                    <span className="text-xs text-violet-200/70">
                      Master volume ({Math.round(sound.volume * 100)}%)
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={sound.volume}
                      className="mt-2 w-full accent-violet-400"
                      onChange={(event) => setVolume(Number(event.target.value))}
                    />
                  </label>
                  <button
                    type="button"
                    className="mt-3 rounded-lg border border-white/12 bg-white/10 px-3 py-1.5 text-xs text-violet-100 transition hover:bg-white/20"
                    onClick={() => {
                      playClickSoft();
                      playEvent("notify");
                    }}
                  >
                    Test notify sound
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black/22 px-3 py-2 text-sm text-violet-100">
                    <span>Click sounds</span>
                    <input
                      type="checkbox"
                      checked={sound.clickSoftEnabled}
                      onChange={(event) => {
                        playClickSoft();
                        setClickSoftEnabled(event.target.checked);
                      }}
                    />
                  </label>
                  <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black/22 px-3 py-2 text-sm text-violet-100">
                    <span>Reduce motion</span>
                    <input
                      type="checkbox"
                      checked={settings.reduceMotion}
                      onChange={(event) => {
                        playClickSoft();
                        setReduceMotion(event.target.checked);
                      }}
                    />
                  </label>
                </div>

                <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-violet-200/70">
                    Battery (simulated)
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-sm text-violet-50">
                    <BatteryMedium size={16} className="text-violet-200/80" />
                    <span>{batteryLevel}%</span>
                    <span className="text-xs text-violet-200/65">Balanced mode</span>
                  </div>
                </div>
              </section>
            )}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

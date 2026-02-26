"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  Download,
  Import,
  ListMusic,
  MonitorCog,
  RotateCcw,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";

import {
  CREDITS_OPTIONAL_LINE,
  CREDITS_PRIMARY_LINE,
  CREDITS_SECONDARY_LINE,
} from "@/lib/credits";
import { WALLPAPERS } from "@/lib/wallpapers";
import { soundManager } from "@/lib/sounds/SoundManager";
import {
  SOUND_EVENTS,
  SOUND_PACK_IDS,
  getSoundPack,
  type SoundEventName,
  type SoundPackId,
} from "@/lib/sounds/packs";
import { useOSStore } from "@/store/useOSStore";

const toLabel = (value: string) =>
  value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase());

type TabKey = "sounds" | "desktop" | "about";

export default function SettingsApp() {
  const [activeTab, setActiveTab] = useState<TabKey>("sounds");
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [isTestingAll, setIsTestingAll] = useState(false);
  const testTimeoutsRef = useRef<number[]>([]);

  const sound = useOSStore((state) => state.sound);
  const settings = useOSStore((state) => state.settings);
  const desktop = useOSStore((state) => state.desktop);
  const setPack = useOSStore((state) => state.setPack);
  const setVolume = useOSStore((state) => state.setVolume);
  const toggleMute = useOSStore((state) => state.toggleMute);
  const setMapping = useOSStore((state) => state.setMapping);
  const resetSounds = useOSStore((state) => state.resetSounds);
  const importSoundConfig = useOSStore((state) => state.importSoundConfig);
  const playEvent = useOSStore((state) => state.playEvent);
  const pushNotification = useOSStore((state) => state.pushNotification);
  const raiseError = useOSStore((state) => state.raiseError);
  const setClickSoftEnabled = useOSStore((state) => state.setClickSoftEnabled);
  const setReduceMotion = useOSStore((state) => state.setReduceMotion);
  const setShowNoAiLine = useOSStore((state) => state.setShowNoAiLine);
  const setDesktopSnapToGrid = useOSStore((state) => state.setDesktopSnapToGrid);
  const setDesktopIconSize = useOSStore((state) => state.setDesktopIconSize);
  const resetDesktopIconLayout = useOSStore((state) => state.resetDesktopIconLayout);
  const setWallpaper = useOSStore((state) => state.setWallpaper);
  const playClickSoft = useOSStore((state) => state.playClickSoft);

  const activePack = useMemo(() => getSoundPack(sound.packId), [sound.packId]);

  const stopTestAll = () => {
    testTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    testTimeoutsRef.current = [];
    setIsTestingAll(false);
  };

  const runTestAll = () => {
    playClickSoft();
    if (isTestingAll) {
      stopTestAll();
      return;
    }

    if (sound.muted) {
      setImportMessage("Skipped test-all sequence because audio is muted.");
      return;
    }

    setIsTestingAll(true);
    setImportMessage("Running full sound event test...");

    SOUND_EVENTS.forEach((eventName, index) => {
      const timeoutId = window.setTimeout(() => {
        playEvent(eventName, {
          volumeMultiplier: eventName === "clickSoft" ? 0.45 : 0.62,
        });
        if (index === SOUND_EVENTS.length - 1) {
          setIsTestingAll(false);
          setImportMessage("Completed sound event test.");
        }
      }, index * 300);
      testTimeoutsRef.current.push(timeoutId);
    });
  };

  useEffect(() => {
    return () => {
      stopTestAll();
    };
  }, []);

  const handleCustomUpload = async (
    eventName: SoundEventName,
    file: File | null
  ) => {
    if (!file) {
      return;
    }

    const result = await soundManager.setCustomSound(eventName, file);
    if (!result) {
      setImportMessage(`Failed to load ${file.name}.`);
      raiseError(`Failed to map sound for ${toLabel(eventName)}.`);
      return;
    }

    setMapping(eventName, result.src, result.meta);
    setImportMessage(`${toLabel(eventName)} mapped to ${result.meta.name}.`);
  };

  const handleExport = () => {
    playClickSoft();
    const payload = {
      packId: sound.packId,
      volume: sound.volume,
      muted: sound.muted,
      clickSoftEnabled: sound.clickSoftEnabled,
      mappings: sound.mappings,
      customFilesMeta: sound.customFilesMeta,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = "purpleos-sound-config.json";
    anchor.click();
    URL.revokeObjectURL(href);
  };

  const handleImport = async (file: File | null) => {
    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as {
        packId?: string;
        volume?: number;
        muted?: boolean;
        clickSoftEnabled?: boolean;
        mappings?: Record<string, string>;
      };
      if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid mapping shape");
      }

      importSoundConfig(parsed);
      setImportMessage(`Imported ${file.name}.`);
      pushNotification("Sounds", `Imported mapping from ${file.name}.`, {
        appId: "settings",
        playSound: false,
      });
    } catch {
      setImportMessage("Import failed. Invalid JSON mapping.");
      raiseError("Sound config import failed: invalid JSON mapping.");
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 text-violet-100">
      <div className="glass-panel flex items-center gap-2 rounded-2xl p-2">
        {(
          [
            { key: "sounds", label: "Sounds" },
            { key: "desktop", label: "Desktop" },
            { key: "about", label: "About / Credits" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.key
                ? "bg-violet-500/40 text-white"
                : "text-violet-200/80 hover:bg-white/10"
            }`}
            onClick={() => {
              playClickSoft();
              setActiveTab(tab.key);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "sounds" ? (
        <div className="grid h-full min-h-0 grid-cols-1 gap-4 lg:grid-cols-[1.05fr_1.35fr]">
          <section className="glass-panel rounded-2xl p-4">
            <h2 className="text-base font-semibold text-white">Global Sound</h2>
            <p className="mt-1 text-xs text-violet-100/70">
              Choose a pack, tune volume, and enable or disable click feedback.
            </p>

            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-violet-200/70">
                  Sound Pack
                </span>
                <select
                  value={sound.packId}
                  onChange={(event) => {
                    setPack(event.target.value as SoundPackId);
                    playClickSoft();
                  }}
                  className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-violet-50 outline-none ring-violet-300/40 transition focus:ring-2"
                >
                  {SOUND_PACK_IDS.map((packId) => (
                    <option key={packId} value={packId}>
                      {getSoundPack(packId).label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-violet-200/70">
                  Volume ({Math.round(sound.volume * 100)}%)
                </span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={sound.volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                  className="mt-2 w-full accent-violet-400"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium transition hover:bg-white/20"
                  onClick={() => {
                    playClickSoft();
                    toggleMute();
                  }}
                >
                  {sound.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  {sound.muted ? "Unmute" : "Mute"}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium transition hover:bg-white/20"
                  onClick={() => {
                    playClickSoft();
                    if (window.confirm("Reset all sound mappings to defaults?")) {
                      resetSounds();
                    }
                  }}
                >
                  <RotateCcw size={16} />
                  Reset to defaults
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium transition hover:bg-white/20"
                  onClick={handleExport}
                >
                  <Download size={16} />
                  Export JSON
                </button>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium transition hover:bg-white/20">
                  <Import size={16} />
                  Import JSON
                  <input
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={(event) => {
                      playClickSoft();
                      void handleImport(event.target.files?.[0] ?? null);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium transition hover:bg-white/20"
                  onClick={runTestAll}
                >
                  {isTestingAll ? <Square size={16} /> : <ListMusic size={16} />}
                  {isTestingAll ? "Stop test all" : "Test all sounds"}
                </button>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-violet-100/80">
                <p className="font-semibold text-violet-50">
                  Active pack: {activePack.label}
                </p>
                <p className="mt-1">{activePack.description}</p>
                {importMessage ? <p className="mt-2 text-violet-200">{importMessage}</p> : null}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={sound.clickSoftEnabled}
                  onChange={(event) => setClickSoftEnabled(event.target.checked)}
                />
                ClickSoft for major buttons
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.reduceMotion}
                  onChange={(event) => setReduceMotion(event.target.checked)}
                />
                Reduce motion
              </label>
            </div>
          </section>

          <section className="glass-panel flex min-h-0 flex-col rounded-2xl p-4">
            <h2 className="text-base font-semibold text-white">Per-event mapping</h2>
            <p className="mt-1 text-xs text-violet-100/70">
              Upload an audio file for each event, test instantly, and keep custom mappings in local storage.
            </p>
            <div className="mt-4 flex-1 space-y-2 overflow-auto pr-1">
              {SOUND_EVENTS.map((eventName) => {
                const meta = sound.customFilesMeta[eventName];
                const defaultFile = activePack.events[eventName];
                return (
                  <div
                    key={eventName}
                    className="grid grid-cols-1 gap-2 rounded-xl border border-white/10 bg-black/25 p-3 md:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-violet-50">
                        {toLabel(eventName)}
                      </p>
                      <p className="text-xs text-violet-100/65">
                        Source: {meta?.name ?? defaultFile}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium transition hover:bg-white/20"
                        onClick={() => playEvent(eventName)}
                      >
                        Test
                      </button>
                      <label className="cursor-pointer rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium transition hover:bg-white/20">
                        Upload
                        <input
                          type="file"
                          accept="audio/mp3,audio/mpeg,audio/wav,audio/ogg,audio/*"
                          className="hidden"
                          onChange={(event) => {
                            void handleCustomUpload(
                              eventName,
                              event.target.files?.[0] ?? null
                            );
                            event.currentTarget.value = "";
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium transition hover:bg-white/20"
                        onClick={() => {
                          setMapping(eventName, null);
                          playClickSoft();
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "desktop" ? (
        <section className="glass-panel h-full rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <MonitorCog size={16} className="text-violet-200/85" />
            <h2 className="text-base font-semibold text-white">Desktop</h2>
          </div>
          <p className="mt-1 text-xs text-violet-100/70">
            Manage icon behavior and visual background preferences.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black/24 px-3 py-2 text-sm text-violet-100">
              <span>Snap icons to grid</span>
              <input
                type="checkbox"
                checked={desktop.snapToGrid}
                onChange={(event) => {
                  setDesktopSnapToGrid(event.target.checked);
                  playClickSoft();
                }}
              />
            </label>
            <div className="rounded-xl border border-white/10 bg-black/24 px-3 py-2">
              <p className="text-sm text-violet-100">Icon size</p>
              <div className="mt-2 flex items-center gap-1">
                {(["small", "medium", "large"] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      desktop.iconSize === size
                        ? "bg-violet-500/38 text-white"
                        : "bg-white/7 text-violet-200 hover:bg-white/14"
                    }`}
                    onClick={() => {
                      setDesktopIconSize(size);
                      playClickSoft();
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium transition hover:bg-white/20"
            onClick={() => {
              playClickSoft();
              if (window.confirm("Reset desktop icon positions to default layout?")) {
                resetDesktopIconLayout();
              }
            }}
          >
            <RotateCcw size={15} />
            Reset icon layout
          </button>

          <div className="mt-5">
            <h3 className="text-sm font-semibold text-violet-50">Wallpaper</h3>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {WALLPAPERS.map((wallpaperEntry) => (
                <button
                  key={wallpaperEntry.id}
                  type="button"
                  className={`overflow-hidden rounded-2xl border transition ${
                    settings.wallpaper === wallpaperEntry.id
                      ? "border-violet-300/45 shadow-[0_10px_25px_rgba(66,31,148,0.4)]"
                      : "border-white/10 hover:border-white/20"
                  }`}
                  onClick={() => {
                    setWallpaper(wallpaperEntry.id);
                    playClickSoft();
                  }}
                >
                  <img
                    src={wallpaperEntry.source}
                    alt={wallpaperEntry.label}
                    className="h-24 w-full object-cover"
                  />
                  <span className="block bg-black/30 px-2 py-1 text-xs text-violet-100">
                    {wallpaperEntry.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "about" ? (
        <section className="glass-panel h-full rounded-2xl p-5">
          <h2 className="text-base font-semibold text-white">PurpleOS Credits</h2>
          <p className="mt-4 text-lg text-violet-50">{CREDITS_PRIMARY_LINE}</p>
          <p className="mt-2 text-base text-violet-100">{CREDITS_SECONDARY_LINE}</p>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
            <label className="flex items-center gap-2 text-sm text-violet-100/90">
              <input
                type="checkbox"
                checked={settings.showNoAiLine}
                onChange={(event) => {
                  setShowNoAiLine(event.target.checked);
                  playClickSoft();
                }}
              />
              Show optional handcrafted line
            </label>
            {settings.showNoAiLine ? (
              <p className="mt-3 text-sm text-violet-200/80">{CREDITS_OPTIONAL_LINE}</p>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

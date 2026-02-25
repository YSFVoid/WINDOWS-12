"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Play, Shuffle, Square } from "lucide-react";

import {
  SOUND_EVENTS,
  getSoundPack,
  type SoundEventName,
} from "@/lib/sounds/packs";
import { useOSStore } from "@/store/useOSStore";

const toLabel = (value: string) =>
  value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase());

export default function SoundboardApp() {
  const sound = useOSStore((state) => state.sound);
  const playEvent = useOSStore((state) => state.playEvent);
  const playClickSoft = useOSStore((state) => state.playClickSoft);

  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const demoTimeouts = useRef<number[]>([]);

  const activePack = useMemo(() => getSoundPack(sound.packId), [sound.packId]);

  const stopDemo = () => {
    demoTimeouts.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    demoTimeouts.current = [];
    setIsDemoRunning(false);
  };

  const runDemo = () => {
    if (isDemoRunning) {
      stopDemo();
      return;
    }

    const sequence: SoundEventName[] = [
      "boot",
      "login",
      "openWindow",
      "notify",
      "minimize",
      "maximize",
      "clickSoft",
      "recycle",
      "closeWindow",
    ];

    setIsDemoRunning(true);

    sequence.forEach((eventName, index) => {
      const timeoutId = window.setTimeout(() => {
        playEvent(eventName, { volumeMultiplier: 0.55 });
        if (index === sequence.length - 1) {
          setIsDemoRunning(false);
        }
      }, index * 360);
      demoTimeouts.current.push(timeoutId);
    });
  };

  useEffect(() => {
    return () => {
      stopDemo();
    };
  }, []);

  return (
    <div className="flex h-full flex-col gap-4 text-violet-100">
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 md:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-violet-200/70">
            Current Pack
          </p>
          <p className="mt-1 text-sm font-semibold text-violet-50">{activePack.label}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-violet-200/70">
            Volume
          </p>
          <p className="mt-1 text-sm font-semibold text-violet-50">
            {Math.round(sound.volume * 100)}%
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-violet-200/70">
            Mute
          </p>
          <p className="mt-1 text-sm font-semibold text-violet-50">
            {sound.muted ? "Muted" : "Live"}
          </p>
        </div>
        <div className="flex justify-start md:justify-end">
          <button
            type="button"
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
              isDemoRunning
                ? "border-rose-300/40 bg-rose-400/20 text-rose-100 hover:bg-rose-400/30"
                : "border-white/20 bg-white/10 text-violet-50 hover:bg-white/20"
            }`}
            onClick={() => {
              playClickSoft();
              runDemo();
            }}
          >
            {isDemoRunning ? <Square size={16} /> : <Shuffle size={16} />}
            {isDemoRunning ? "Stop Demo" : "Random demo mode"}
          </button>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-2 gap-3 overflow-auto pr-1 sm:grid-cols-3 xl:grid-cols-4">
        {SOUND_EVENTS.map((eventName) => (
          <button
            key={eventName}
            type="button"
            className="group min-h-24 rounded-2xl border border-white/10 bg-gradient-to-br from-white/12 to-white/5 p-4 text-left transition hover:border-violet-300/40 hover:from-violet-300/25 hover:to-fuchsia-300/10"
            onClick={() => playEvent(eventName)}
          >
            <div className="flex items-start justify-between">
              <span className="text-sm font-semibold text-violet-50">
                {toLabel(eventName)}
              </span>
              <Play
                size={16}
                className="text-violet-200/75 transition group-hover:translate-x-0.5 group-hover:text-violet-50"
              />
            </div>
            <p className="mt-2 text-xs text-violet-100/65">
              {sound.customFilesMeta[eventName]?.name ?? activePack.events[eventName]}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

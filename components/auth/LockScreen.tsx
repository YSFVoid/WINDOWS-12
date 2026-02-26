"use client";

import { motion } from "framer-motion";
import { ArrowRightCircle } from "lucide-react";

type LockScreenProps = {
  reduceMotion: boolean;
  clock: Date;
  wallpaperSrc: string;
  onUnlock: () => void;
};

const lockTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
});

const lockDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

export default function LockScreen({
  reduceMotion,
  clock,
  wallpaperSrc,
  onUnlock,
}: LockScreenProps) {
  return (
    <motion.div
      className="absolute inset-0 z-[115] flex items-center justify-center"
      initial={reduceMotion ? undefined : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.22 }}
      onClick={onUnlock}
    >
      <img
        src={wallpaperSrc}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-95"
      />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      <motion.div
        className="relative text-center"
        initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.2, delay: 0.06 }}
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-6xl font-semibold tracking-tight text-violet-50">
          {lockTimeFormatter.format(clock)}
        </p>
        <p className="mt-2 text-sm text-violet-200/80">
          {lockDateFormatter.format(clock)}
        </p>
        <button
          type="button"
          className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full border border-violet-200/35 bg-violet-500/26 px-5 py-2.5 text-sm font-semibold text-violet-50 transition hover:bg-violet-500/35"
          onClick={onUnlock}
        >
          <ArrowRightCircle size={16} />
          Click to unlock
        </button>
      </motion.div>
    </motion.div>
  );
}

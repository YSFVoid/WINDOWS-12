"use client";

import { motion } from "framer-motion";
import { Power, RotateCcw } from "lucide-react";

type LoginScreenProps = {
  reduceMotion: boolean;
  wallpaperSrc: string;
  onLogin: () => void;
  onOpenPowerModal: () => void;
  onRestart: () => void;
};

export default function LoginScreen({
  reduceMotion,
  wallpaperSrc,
  onLogin,
  onOpenPowerModal,
  onRestart,
}: LoginScreenProps) {
  return (
    <motion.div
      className="absolute inset-0 z-[116] flex items-center justify-center"
      initial={reduceMotion ? undefined : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.22 }}
    >
      <img
        src={wallpaperSrc}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-95"
      />
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[3px]" />

      <motion.div
        className="relative flex w-[min(92vw,380px)] flex-col items-center rounded-[30px] border border-white/16 bg-[#0d0721]/58 px-8 py-10 backdrop-blur-2xl"
        initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.22, delay: 0.08 }}
      >
        <span className="inline-flex h-24 w-24 items-center justify-center rounded-full border border-white/30 bg-gradient-to-b from-violet-400/45 to-indigo-500/30 text-3xl font-semibold text-violet-50 shadow-[0_10px_45px_rgba(112,58,201,0.5)]">
          P
        </span>
        <h2 className="mt-4 text-2xl font-semibold text-white">PurpleOS User</h2>
        <p className="mt-1 text-sm text-violet-200/70">Welcome back</p>
        <button
          type="button"
          className="mt-8 w-full rounded-2xl border border-violet-200/35 bg-violet-500/35 px-4 py-2.5 text-sm font-semibold text-violet-50 transition hover:bg-violet-500/45"
          onClick={onLogin}
        >
          Log in
        </button>
      </motion.div>

      <div className="absolute bottom-8 right-8 z-[117] flex items-center gap-2">
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/16 bg-white/10 text-violet-100 shadow-[0_10px_30px_rgba(21,8,45,0.45)] transition hover:bg-white/16"
          title="Power"
          onClick={onOpenPowerModal}
        >
          <Power size={16} />
        </button>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/16 bg-white/10 text-violet-100 shadow-[0_10px_30px_rgba(21,8,45,0.45)] transition hover:bg-white/16"
          title="Restart session"
          onClick={onRestart}
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </motion.div>
  );
}

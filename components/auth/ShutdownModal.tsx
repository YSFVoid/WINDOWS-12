"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

type ShutdownModalProps = {
  open: boolean;
  reduceMotion: boolean;
  onClose: () => void;
};

export default function ShutdownModal({
  open,
  reduceMotion,
  onClose,
}: ShutdownModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            className="absolute inset-0 z-[122] h-full w-full bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.16 }}
            onClick={onClose}
          />
          <motion.div
            className="absolute left-1/2 top-1/2 z-[123] w-[min(92vw,340px)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/18 bg-[#0d0720]/82 p-5 text-center backdrop-blur-2xl"
            initial={reduceMotion ? undefined : { opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
          >
            <span className="mx-auto inline-flex rounded-full border border-amber-200/25 bg-amber-300/12 p-2 text-amber-100">
              <AlertTriangle size={16} />
            </span>
            <h3 className="mt-3 text-lg font-semibold text-violet-50">Shut down?</h3>
            <p className="mt-1 text-sm text-violet-100/75">
              This is a demo shell. Real shutdown is not available.
            </p>
            <button
              type="button"
              className="mt-4 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-violet-50 transition hover:bg-white/16"
              onClick={onClose}
            >
              Close
            </button>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

"use client";

import { motion } from "framer-motion";
import {
  FolderOpen,
  Maximize2,
  Minus,
  NotebookPen,
  Settings2,
  TerminalSquare,
  Volume2,
  X,
} from "lucide-react";
import { Rnd } from "react-rnd";

import { APP_REGISTRY, type AppId } from "@/lib/apps";
import type { OSWindow } from "@/store/useOSStore";
import { useOSStore } from "@/store/useOSStore";

type WindowShellProps = {
  windowData: OSWindow;
  children: React.ReactNode;
};

const iconMap: Record<AppId, React.ComponentType<{ size?: number }>> = {
  settings: Settings2,
  soundboard: Volume2,
  explorer: FolderOpen,
  notepad: NotebookPen,
  terminal: TerminalSquare,
};

export default function WindowShell({ windowData, children }: WindowShellProps) {
  const focusedWindowId = useOSStore((state) => state.focusedWindowId);
  const focusWindow = useOSStore((state) => state.focusWindow);
  const closeWindow = useOSStore((state) => state.closeWindow);
  const minimizeWindow = useOSStore((state) => state.minimizeWindow);
  const toggleMaximize = useOSStore((state) => state.toggleMaximize);
  const updateWindowBounds = useOSStore((state) => state.updateWindowBounds);
  const setSnapPreviewZone = useOSStore((state) => state.setSnapPreviewZone);
  const applySnapWindow = useOSStore((state) => state.applySnapWindow);
  const playClickSoft = useOSStore((state) => state.playClickSoft);
  const reduceMotion = useOSStore((state) => state.settings.reduceMotion);

  const isFocused = focusedWindowId === windowData.id;
  const app = APP_REGISTRY[windowData.appId];
  const Icon = iconMap[windowData.appId];
  const EDGE_THRESHOLD = 36;

  const detectSnapZone = (x: number, y: number, width: number) => {
    if (typeof window === "undefined") {
      return null;
    }

    if (y <= EDGE_THRESHOLD) {
      return "top" as const;
    }
    if (x <= EDGE_THRESHOLD) {
      return "left" as const;
    }
    if (x + width >= window.innerWidth - EDGE_THRESHOLD) {
      return "right" as const;
    }
    return null;
  };

  return (
    <Rnd
      size={
        windowData.maximized
          ? { width: "100%", height: "100%" }
          : { width: windowData.w, height: windowData.h }
      }
      position={windowData.maximized ? { x: 0, y: 0 } : { x: windowData.x, y: windowData.y }}
      minWidth={app.minSize.w}
      minHeight={app.minSize.h}
      bounds="parent"
      disableDragging={windowData.maximized}
      enableResizing={!windowData.maximized}
      dragHandleClassName="window-drag-handle"
      style={{ zIndex: windowData.z }}
      onMouseDown={() => focusWindow(windowData.id)}
      onDragStart={() => {
        focusWindow(windowData.id);
        setSnapPreviewZone(null);
      }}
      onDrag={(_, data) => {
        if (windowData.maximized) {
          return;
        }
        const width = data.node?.offsetWidth ?? windowData.w;
        const zone = detectSnapZone(data.x, data.y, width);
        setSnapPreviewZone(zone);
      }}
      onDragStop={(_, data) => {
        if (windowData.maximized) {
          return;
        }

        const width = data.node?.offsetWidth ?? windowData.w;
        const zone = detectSnapZone(data.x, data.y, width);
        if (zone) {
          applySnapWindow(windowData.id, zone);
          return;
        }

        updateWindowBounds(windowData.id, { x: data.x, y: data.y });
      }}
      onResizeStop={(_, __, elementRef, ___, position) => {
        updateWindowBounds(windowData.id, {
          x: position.x,
          y: position.y,
          w: elementRef.offsetWidth,
          h: elementRef.offsetHeight,
        });
      }}
    >
      <motion.div
        layout={!reduceMotion}
        initial={reduceMotion ? undefined : { opacity: 0, y: 14, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: 8, scale: 0.985 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        className={`flex h-full flex-col overflow-hidden rounded-[18px] border backdrop-blur-xl ${
          isFocused
            ? "border-violet-200/35 bg-[#0e0822]/72 shadow-[0_26px_85px_rgba(16,5,37,0.68),0_0_0_1px_rgba(193,167,255,0.12)]"
            : "border-white/12 bg-[#0b0819]/64 shadow-[0_18px_62px_rgba(8,3,24,0.55)]"
        }`}
      >
        <div className="window-drag-handle flex h-10 items-center justify-between border-b border-white/10 bg-gradient-to-r from-white/11 to-white/4 px-3">
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-white/15 bg-white/10 p-1.5 text-violet-100">
              <Icon size={13} />
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-violet-100/95">
              {app.title}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Minimize window"
              className="rounded-md border border-transparent p-1 text-violet-100/80 transition hover:border-white/15 hover:bg-white/10 hover:text-violet-50"
              onClick={(event) => {
                event.stopPropagation();
                playClickSoft();
                minimizeWindow(windowData.id);
              }}
            >
              <Minus size={13} />
            </button>
            <button
              type="button"
              aria-label="Maximize window"
              className="rounded-md border border-transparent p-1 text-violet-100/80 transition hover:border-white/15 hover:bg-white/10 hover:text-violet-50"
              onClick={(event) => {
                event.stopPropagation();
                playClickSoft();
                toggleMaximize(windowData.id);
              }}
            >
              <Maximize2 size={13} />
            </button>
            <button
              type="button"
              aria-label="Close window"
              className="rounded-md border border-transparent p-1 text-violet-100/80 transition hover:border-rose-200/20 hover:bg-rose-400/20 hover:text-rose-100"
              onClick={(event) => {
                event.stopPropagation();
                playClickSoft();
                closeWindow(windowData.id);
              }}
            >
              <X size={13} />
            </button>
          </div>
        </div>

        <div className="h-full min-h-0 p-3">{children}</div>
      </motion.div>
    </Rnd>
  );
}

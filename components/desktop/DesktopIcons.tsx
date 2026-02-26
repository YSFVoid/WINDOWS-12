"use client";

import { useEffect, useMemo, useState } from "react";

import clsx from "clsx";
import {
  FolderOpen,
  NotebookPen,
  Settings2,
  TerminalSquare,
  Volume2,
} from "lucide-react";

import { APP_REGISTRY, DESKTOP_SHORTCUTS, type AppId } from "@/lib/apps";
import { DESKTOP_ICON_LAYOUT, DESKTOP_ICON_SIZE_MAP, TASKBAR_RESERVED_HEIGHT } from "@/lib/layout";
import type { DesktopIconPosition } from "@/store/useOSStore";
import { useOSStore } from "@/store/useOSStore";

type Viewport = { width: number; height: number };

type DragState = {
  appId: AppId;
  pointerId: number;
  offsetX: number;
  offsetY: number;
  original: DesktopIconPosition;
  current: DesktopIconPosition;
  moved: boolean;
};

const iconMap: Record<AppId, React.ComponentType<{ size?: number }>> = {
  settings: Settings2,
  soundboard: Volume2,
  explorer: FolderOpen,
  notepad: NotebookPen,
  terminal: TerminalSquare,
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const getDesktopBounds = (
  viewport: Viewport,
  iconWidth: number,
  iconHeight: number
) => {
  const width = Math.max(320, viewport.width);
  const height = Math.max(320, viewport.height - TASKBAR_RESERVED_HEIGHT - 20);
  return {
    width,
    height,
    minX: DESKTOP_ICON_LAYOUT.left,
    minY: DESKTOP_ICON_LAYOUT.top,
    maxX: Math.max(
      DESKTOP_ICON_LAYOUT.left,
      width - iconWidth - DESKTOP_ICON_LAYOUT.left
    ),
    maxY: Math.max(
      DESKTOP_ICON_LAYOUT.top,
      height - iconHeight - DESKTOP_ICON_LAYOUT.gapY
    ),
  };
};

const getCellIndex = (
  position: DesktopIconPosition,
  stepX: number,
  stepY: number
) => ({
  col: Math.max(
    0,
    Math.round((position.x - DESKTOP_ICON_LAYOUT.left) / stepX)
  ),
  row: Math.max(
    0,
    Math.round((position.y - DESKTOP_ICON_LAYOUT.top) / stepY)
  ),
});

const toPosition = (col: number, row: number, stepX: number, stepY: number) => ({
  x: DESKTOP_ICON_LAYOUT.left + col * stepX,
  y: DESKTOP_ICON_LAYOUT.top + row * stepY,
});

export default function DesktopIcons() {
  const openApp = useOSStore((state) => state.openApp);
  const desktop = useOSStore((state) => state.desktop);
  const setDesktopIconPosition = useOSStore((state) => state.setDesktopIconPosition);
  const playClickSoft = useOSStore((state) => state.playClickSoft);
  const playEvent = useOSStore((state) => state.playEvent);

  const [selectedAppId, setSelectedAppId] = useState<AppId | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [viewport, setViewport] = useState<Viewport>(() => ({
    width: typeof window === "undefined" ? 1280 : window.innerWidth,
    height: typeof window === "undefined" ? 720 : window.innerHeight,
  }));

  const sizePreset = DESKTOP_ICON_SIZE_MAP[desktop.iconSize];
  const stepX = sizePreset.cellWidth + DESKTOP_ICON_LAYOUT.gapX;
  const stepY = sizePreset.cellHeight + DESKTOP_ICON_LAYOUT.gapY;
  const bounds = getDesktopBounds(
    viewport,
    sizePreset.cellWidth,
    sizePreset.cellHeight
  );
  const rowsPerColumn = Math.max(
    1,
    Math.floor(
      (bounds.height - DESKTOP_ICON_LAYOUT.top + DESKTOP_ICON_LAYOUT.gapY) / stepY
    )
  );

  useEffect(() => {
    const onResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const defaultPositions = useMemo(() => {
    const map: Record<AppId, DesktopIconPosition> = {} as Record<
      AppId,
      DesktopIconPosition
    >;

    DESKTOP_SHORTCUTS.forEach((appId, index) => {
      const col = Math.floor(index / rowsPerColumn);
      const row = index % rowsPerColumn;
      map[appId] = {
        x: clamp(
          DESKTOP_ICON_LAYOUT.left + col * stepX,
          bounds.minX,
          bounds.maxX
        ),
        y: clamp(
          DESKTOP_ICON_LAYOUT.top + row * stepY,
          bounds.minY,
          bounds.maxY
        ),
      };
    });

    return map;
  }, [bounds.maxX, bounds.maxY, bounds.minX, bounds.minY, rowsPerColumn, stepX, stepY]);

  const resolvedPositions = useMemo(() => {
    const map: Record<AppId, DesktopIconPosition> = {} as Record<
      AppId,
      DesktopIconPosition
    >;

    DESKTOP_SHORTCUTS.forEach((appId) => {
      const persisted = desktop.iconPositions[appId];
      const activeDragPosition =
        dragState?.appId === appId ? dragState.current : undefined;
      const fallback = defaultPositions[appId];
      const source = activeDragPosition ?? persisted ?? fallback;

      map[appId] = {
        x: clamp(source.x, bounds.minX, bounds.maxX),
        y: clamp(source.y, bounds.minY, bounds.maxY),
      };
    });

    return map;
  }, [bounds.maxX, bounds.maxY, bounds.minX, bounds.minY, defaultPositions, desktop.iconPositions, dragState]);

  useEffect(() => {
    if (!dragState) {
      return;
    }

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerId !== dragState.pointerId) {
        return;
      }

      const nextX = clamp(event.clientX - dragState.offsetX, bounds.minX, bounds.maxX);
      const nextY = clamp(event.clientY - dragState.offsetY, bounds.minY, bounds.maxY);
      const moved =
        dragState.moved ||
        Math.abs(nextX - dragState.original.x) > 3 ||
        Math.abs(nextY - dragState.original.y) > 3;

      setDragState((current) =>
        current
          ? {
              ...current,
              current: { x: nextX, y: nextY },
              moved,
            }
          : current
      );
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerId !== dragState.pointerId) {
        return;
      }

      if (!dragState.moved) {
        setDragState(null);
        return;
      }

      const current = {
        x: clamp(dragState.current.x, bounds.minX, bounds.maxX),
        y: clamp(dragState.current.y, bounds.minY, bounds.maxY),
      };

      if (!desktop.snapToGrid) {
        setDesktopIconPosition(dragState.appId, current);
        setDragState(null);
        return;
      }

      const maxCol = Math.max(
        0,
        Math.floor(
          (bounds.width - DESKTOP_ICON_LAYOUT.left - sizePreset.cellWidth) / stepX
        )
      );
      const maxRow = Math.max(
        0,
        Math.floor(
          (bounds.height - DESKTOP_ICON_LAYOUT.top - sizePreset.cellHeight) / stepY
        )
      );
      const targetCell = getCellIndex(current, stepX, stepY);

      const occupied = new Set(
        DESKTOP_SHORTCUTS.filter((appId) => appId !== dragState.appId).map((appId) => {
          const existing = resolvedPositions[appId] ?? defaultPositions[appId];
          const cell = getCellIndex(existing, stepX, stepY);
          return `${cell.col}:${cell.row}`;
        })
      );

      let nextCell: { col: number; row: number } | null = null;

      for (let radius = 0; radius <= maxCol + maxRow + 2; radius += 1) {
        for (let deltaCol = -radius; deltaCol <= radius; deltaCol += 1) {
          const remaining = radius - Math.abs(deltaCol);
          const rows = remaining === 0 ? [0] : [remaining, -remaining];

          for (const deltaRow of rows) {
            const col = targetCell.col + deltaCol;
            const row = targetCell.row + deltaRow;
            if (col < 0 || row < 0 || col > maxCol || row > maxRow) {
              continue;
            }
            const key = `${col}:${row}`;
            if (!occupied.has(key)) {
              nextCell = { col, row };
              break;
            }
          }

          if (nextCell) {
            break;
          }
        }

        if (nextCell) {
          break;
        }
      }

      if (!nextCell) {
        setDesktopIconPosition(dragState.appId, dragState.original);
        playEvent("error", { volumeMultiplier: 0.55 });
        setDragState(null);
        return;
      }

      const snapped = toPosition(nextCell.col, nextCell.row, stepX, stepY);
      setDesktopIconPosition(dragState.appId, {
        x: clamp(snapped.x, bounds.minX, bounds.maxX),
        y: clamp(snapped.y, bounds.minY, bounds.maxY),
      });
      setDragState(null);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [
    bounds.height,
    bounds.maxX,
    bounds.maxY,
    bounds.minX,
    bounds.minY,
    bounds.width,
    defaultPositions,
    desktop.snapToGrid,
    dragState,
    playEvent,
    resolvedPositions,
    setDesktopIconPosition,
    sizePreset.cellHeight,
    sizePreset.cellWidth,
    stepX,
    stepY,
  ]);

  return (
    <section
      className="absolute inset-0 z-20"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          setSelectedAppId(null);
        }
      }}
    >
      {DESKTOP_SHORTCUTS.map((appId) => {
        const app = APP_REGISTRY[appId];
        const Icon = iconMap[appId];
        const position = resolvedPositions[appId] ?? defaultPositions[appId];

        return (
          <button
            key={appId}
            type="button"
            className={clsx(
              "desktop-icon-button absolute flex flex-col items-center rounded-2xl px-2 py-1.5 text-center transition",
              sizePreset.text,
              selectedAppId === appId
                ? "border-violet-200/45 bg-violet-400/24 shadow-[0_12px_28px_rgba(63,25,145,0.3)]"
                : "border-transparent hover:border-white/20 hover:bg-white/10"
            )}
            style={{
              width: `${sizePreset.cellWidth}px`,
              height: `${sizePreset.cellHeight}px`,
              transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
            }}
            onClick={() => {
              setSelectedAppId(appId);
            }}
            onDoubleClick={() => {
              playClickSoft();
              openApp(appId);
            }}
            onPointerDown={(event) => {
              if (event.button !== 0) {
                return;
              }

              const current = resolvedPositions[appId] ?? defaultPositions[appId];
              setSelectedAppId(appId);
              setDragState({
                appId,
                pointerId: event.pointerId,
                offsetX: event.clientX - current.x,
                offsetY: event.clientY - current.y,
                original: current,
                current,
                moved: false,
              });
            }}
          >
            <span className="desktop-icon-badge">
              <Icon size={sizePreset.icon} />
            </span>
            <span className="desktop-icon-label mt-2">{app.title}</span>
          </button>
        );
      })}
    </section>
  );
}

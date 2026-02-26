export const TASKBAR_DOCK_HEIGHT = 56;
export const TASKBAR_DOCK_BOTTOM = 18;
export const TASKBAR_RESERVED_HEIGHT = 56;

export const DESKTOP_ICON_LAYOUT = {
  top: 28,
  left: 24,
  gapX: 12,
  gapY: 12,
};

export const DESKTOP_ICON_SIZE_MAP = {
  small: {
    icon: 18,
    cellWidth: 82,
    cellHeight: 86,
    text: "text-[11px]",
  },
  medium: {
    icon: 22,
    cellWidth: 96,
    cellHeight: 96,
    text: "text-xs",
  },
  large: {
    icon: 26,
    cellWidth: 112,
    cellHeight: 108,
    text: "text-[13px]",
  },
} as const;

export type AppId =
  | "settings"
  | "soundboard"
  | "explorer"
  | "notepad"
  | "terminal";

export type AppDefinition = {
  id: AppId;
  title: string;
  description: string;
  icon: "settings" | "soundboard" | "explorer" | "notepad" | "terminal";
  defaultSize: {
    w: number;
    h: number;
  };
  minSize: {
    w: number;
    h: number;
  };
};

export const APP_REGISTRY: Record<AppId, AppDefinition> = {
  settings: {
    id: "settings",
    title: "Settings",
    description: "System controls and sound customization.",
    icon: "settings",
    defaultSize: { w: 920, h: 640 },
    minSize: { w: 720, h: 480 },
  },
  soundboard: {
    id: "soundboard",
    title: "Soundboard",
    description: "Trigger every PurpleOS system event sound.",
    icon: "soundboard",
    defaultSize: { w: 780, h: 560 },
    minSize: { w: 620, h: 420 },
  },
  explorer: {
    id: "explorer",
    title: "Explorer",
    description: "Simple fake filesystem explorer.",
    icon: "explorer",
    defaultSize: { w: 860, h: 560 },
    minSize: { w: 640, h: 420 },
  },
  notepad: {
    id: "notepad",
    title: "Notepad",
    description: "Quick local notes saved to browser storage.",
    icon: "notepad",
    defaultSize: { w: 700, h: 520 },
    minSize: { w: 500, h: 360 },
  },
  terminal: {
    id: "terminal",
    title: "Terminal",
    description: "Run simple shell-like commands inside PurpleOS.",
    icon: "terminal",
    defaultSize: { w: 760, h: 500 },
    minSize: { w: 560, h: 360 },
  },
};

export const START_MENU_APPS: AppId[] = [
  "settings",
  "soundboard",
  "explorer",
  "notepad",
  "terminal",
];

export const DESKTOP_SHORTCUTS: AppId[] = ["explorer", "soundboard", "settings"];

export const TASKBAR_PINNED_APPS: AppId[] = [
  "explorer",
  "soundboard",
  "settings",
  "terminal",
  "notepad",
];

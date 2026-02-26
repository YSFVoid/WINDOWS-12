"use client";

import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

import { APP_REGISTRY, type AppId } from "@/lib/apps";
import { TASKBAR_RESERVED_HEIGHT } from "@/lib/layout";
import {
  createInitialFilesystem,
  type ExplorerItem,
} from "@/lib/filesystem";
import {
  soundManager,
  type CustomSoundMeta,
} from "@/lib/sounds/SoundManager";
import {
  DEFAULT_SOUND_PACK,
  SOUND_EVENTS,
  SOUND_PACK_IDS,
  type SoundEventName,
  type SoundPackId,
} from "@/lib/sounds/packs";

export type OSWindow = {
  id: string;
  appId: AppId;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
};

export type OSNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: number;
  level: "info" | "error";
  appId?: AppId;
};

export type OSSettings = {
  accent: string;
  wallpaper: string;
  reduceMotion: boolean;
  showNoAiLine: boolean;
};

export type SidePanelTab = "notifications" | "quickSettings";
export type SnapZone = "left" | "right" | "top" | null;
export type DesktopIconSize = "small" | "medium" | "large";
export type DesktopIconPosition = { x: number; y: number };
export type OSDesktopState = {
  snapToGrid: boolean;
  iconSize: DesktopIconSize;
  iconPositions: Partial<Record<AppId, DesktopIconPosition>>;
};
export type AuthView = "lock" | "login" | null;

export type OSSoundState = {
  packId: SoundPackId;
  volume: number;
  muted: boolean;
  mappings: Partial<Record<SoundEventName, string>>;
  customFilesMeta: Partial<Record<SoundEventName, CustomSoundMeta>>;
  clickSoftEnabled: boolean;
};

type WindowBoundsPatch = Partial<Pick<OSWindow, "x" | "y" | "w" | "h">>;

type SoundImportPayload = {
  packId?: string;
  volume?: number;
  muted?: boolean;
  clickSoftEnabled?: boolean;
  mappings?: Record<string, string>;
  customFilesMeta?: Record<string, CustomSoundMeta>;
};

type PushNotificationOptions = {
  appId?: AppId;
  level?: "info" | "error";
  playSound?: boolean;
};

type OSStore = {
  windows: OSWindow[];
  focusedWindowId: string | null;
  recentApps: AppId[];
  startMenuOpen: boolean;
  sidePanelOpen: boolean;
  sidePanelTab: SidePanelTab;
  snapPreviewZone: SnapZone;
  locked: boolean;
  authView: AuthView;
  notifications: OSNotification[];
  notificationHistory: OSNotification[];
  files: ExplorerItem[];
  notes: string;
  settings: OSSettings;
  desktop: OSDesktopState;
  sound: OSSoundState;

  openApp: (appId: AppId) => void;
  closeWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  toggleMaximize: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
  updateWindowBounds: (windowId: string, patch: WindowBoundsPatch) => void;
  restoreWindow: (windowId: string) => void;
  setStartMenuOpen: (open: boolean) => void;
  toggleStartMenu: () => void;
  openSidePanel: (tab: SidePanelTab) => void;
  closeSidePanel: () => void;
  toggleSidePanel: (tab: SidePanelTab) => void;
  setSidePanelTab: (tab: SidePanelTab) => void;
  setSnapPreviewZone: (zone: SnapZone) => void;
  applySnapWindow: (windowId: string, zone: Exclude<SnapZone, null>) => void;
  lockSystem: () => void;
  unlockSystem: () => void;

  pushNotification: (
    title: string,
    message: string,
    options?: PushNotificationOptions
  ) => void;
  dismissNotification: (id: string) => void;
  dismissNotificationHistory: (id: string) => void;
  clearNotificationHistory: () => void;
  raiseError: (message: string) => void;
  deleteFile: (itemId: string) => void;
  resetFileSystem: () => void;
  setNotes: (value: string) => void;

  setAccent: (accent: string) => void;
  setWallpaper: (wallpaper: string) => void;
  setReduceMotion: (reduceMotion: boolean) => void;
  setShowNoAiLine: (enabled: boolean) => void;
  setDesktopSnapToGrid: (enabled: boolean) => void;
  setDesktopIconSize: (size: DesktopIconSize) => void;
  setDesktopIconPosition: (appId: AppId, position: DesktopIconPosition) => void;
  resetDesktopIconLayout: () => void;

  setVolume: (value: number) => void;
  toggleMute: () => void;
  setPack: (packId: SoundPackId) => void;
  setMapping: (
    eventName: SoundEventName,
    source: string | null,
    meta?: CustomSoundMeta
  ) => void;
  resetSounds: () => void;
  setClickSoftEnabled: (enabled: boolean) => void;
  importSoundConfig: (payload: SoundImportPayload) => void;
  playEvent: (
    eventName: SoundEventName,
    options?: { volumeMultiplier?: number }
  ) => void;
  playClickSoft: () => void;
  preloadSounds: () => void;
  showLoginView: () => void;
  loginSession: () => void;
  restartSession: () => void;
};

const DEFAULT_SETTINGS: OSSettings = {
  accent: "#a855f7",
  wallpaper: "purple-nebula",
  reduceMotion: false,
  showNoAiLine: false,
};

const DEFAULT_DESKTOP: OSDesktopState = {
  snapToGrid: true,
  iconSize: "medium",
  iconPositions: {},
};

const DEFAULT_SOUND: OSSoundState = {
  packId: DEFAULT_SOUND_PACK,
  volume: 0.72,
  muted: false,
  mappings: {},
  customFilesMeta: {},
  clickSoftEnabled: true,
};

const MAX_TOASTS = 6;
const MAX_HISTORY = 120;
const MAX_RECENT_APPS = 12;
const CLICK_SOFT_DEBOUNCE_MS = 80;

const makeId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const getTopZ = (windows: OSWindow[]) =>
  windows.reduce((max, win) => Math.max(max, win.z), 0);

const getFocusCandidate = (windows: OSWindow[]) => {
  const visible = windows.filter((win) => !win.minimized);
  if (!visible.length) {
    return null;
  }
  return visible.sort((a, b) => b.z - a.z)[0]?.id ?? null;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const isSoundPackId = (value: string): value is SoundPackId =>
  (SOUND_PACK_IDS as string[]).includes(value);

const sanitizeMappings = (
  input?: Record<string, string>
): Partial<Record<SoundEventName, string>> => {
  const safe: Partial<Record<SoundEventName, string>> = {};
  if (!input) {
    return safe;
  }

  for (const eventName of SOUND_EVENTS) {
    const value = input[eventName];
    if (typeof value === "string" && value.trim()) {
      safe[eventName] = value;
    }
  }

  return safe;
};

const sanitizeMeta = (
  input?: Record<string, CustomSoundMeta>
): Partial<Record<SoundEventName, CustomSoundMeta>> => {
  const safe: Partial<Record<SoundEventName, CustomSoundMeta>> = {};
  if (!input) {
    return safe;
  }

  for (const eventName of SOUND_EVENTS) {
    const value = input[eventName];
    if (!value) {
      continue;
    }
    safe[eventName] = {
      name: value.name ?? `${eventName}.wav`,
      type: value.type ?? "audio/wav",
      size: value.size ?? 0,
      updatedAt: value.updatedAt ?? Date.now(),
    };
  }

  return safe;
};

const safeLocalStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === "undefined") {
      return null;
    }

    const raw = window.localStorage.getItem(name);
    if (!raw) {
      return null;
    }

    try {
      JSON.parse(raw);
      return raw;
    } catch {
      window.localStorage.removeItem(name);
      return null;
    }
  },
  setItem: (name, value) => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(name, value);
  },
  removeItem: (name) => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.removeItem(name);
  },
};

const sanitizeSettings = (input: unknown): OSSettings => {
  if (!input || typeof input !== "object") {
    return { ...DEFAULT_SETTINGS };
  }

  const source = input as Partial<OSSettings>;
  return {
    accent:
      typeof source.accent === "string" && source.accent.trim()
        ? source.accent
        : DEFAULT_SETTINGS.accent,
    wallpaper:
      typeof source.wallpaper === "string" && source.wallpaper.trim()
        ? source.wallpaper
        : DEFAULT_SETTINGS.wallpaper,
    reduceMotion:
      typeof source.reduceMotion === "boolean"
        ? source.reduceMotion
        : DEFAULT_SETTINGS.reduceMotion,
    showNoAiLine:
      typeof source.showNoAiLine === "boolean"
        ? source.showNoAiLine
        : DEFAULT_SETTINGS.showNoAiLine,
  };
};

const sanitizeDesktopState = (input: unknown): OSDesktopState => {
  if (!input || typeof input !== "object") {
    return { ...DEFAULT_DESKTOP };
  }

  const source = input as Partial<OSDesktopState> & {
    iconPositions?: Record<string, DesktopIconPosition>;
  };
  const iconPositions: Partial<Record<AppId, DesktopIconPosition>> = {};

  if (source.iconPositions && typeof source.iconPositions === "object") {
    for (const appId of Object.keys(APP_REGISTRY) as AppId[]) {
      const position = source.iconPositions[appId];
      if (
        position &&
        typeof position === "object" &&
        Number.isFinite(position.x) &&
        Number.isFinite(position.y)
      ) {
        iconPositions[appId] = {
          x: position.x,
          y: position.y,
        };
      }
    }
  }

  return {
    snapToGrid:
      typeof source.snapToGrid === "boolean"
        ? source.snapToGrid
        : DEFAULT_DESKTOP.snapToGrid,
    iconSize:
      source.iconSize === "small" ||
      source.iconSize === "medium" ||
      source.iconSize === "large"
        ? source.iconSize
        : DEFAULT_DESKTOP.iconSize,
    iconPositions,
  };
};

const sanitizeSoundState = (input: unknown): OSSoundState => {
  if (!input || typeof input !== "object") {
    return { ...DEFAULT_SOUND };
  }

  const source = input as Partial<OSSoundState> & {
    packId?: string;
    mappings?: Record<string, string>;
    customFilesMeta?: Record<string, CustomSoundMeta>;
  };

  return {
    packId:
      typeof source.packId === "string" && isSoundPackId(source.packId)
        ? source.packId
        : DEFAULT_SOUND.packId,
    volume:
      typeof source.volume === "number"
        ? clamp(source.volume, 0, 1)
        : DEFAULT_SOUND.volume,
    muted: typeof source.muted === "boolean" ? source.muted : DEFAULT_SOUND.muted,
    clickSoftEnabled:
      typeof source.clickSoftEnabled === "boolean"
        ? source.clickSoftEnabled
        : DEFAULT_SOUND.clickSoftEnabled,
    mappings: sanitizeMappings(source.mappings),
    customFilesMeta: sanitizeMeta(source.customFilesMeta),
  };
};

const sanitizeRecentApps = (input: unknown): AppId[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  const recents = input.filter(
    (entry): entry is AppId =>
      typeof entry === "string" && entry in APP_REGISTRY
  );

  return Array.from(new Set(recents)).slice(0, MAX_RECENT_APPS);
};

const sanitizeNotificationHistory = (input: unknown): OSNotification[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => {
      const value = entry as Partial<OSNotification>;
      const level: OSNotification["level"] =
        value.level === "error" ? "error" : "info";
      return {
        id:
          typeof value.id === "string" && value.id.trim()
            ? value.id
            : makeId("ntf"),
        title: typeof value.title === "string" ? value.title : "Notification",
        message: typeof value.message === "string" ? value.message : "",
        createdAt:
          typeof value.createdAt === "number" ? value.createdAt : Date.now(),
        level,
        appId:
          typeof value.appId === "string" && value.appId in APP_REGISTRY
            ? (value.appId as AppId)
            : undefined,
      };
    })
    .slice(0, MAX_HISTORY);
};

const sanitizeFiles = (input: unknown): ExplorerItem[] => {
  if (!Array.isArray(input)) {
    return createInitialFilesystem();
  }

  const safeFiles = input
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => {
      const value = entry as Partial<ExplorerItem>;
      const type: ExplorerItem["type"] =
        value.type === "folder" ? "folder" : "file";
      const name =
        typeof value.name === "string" && value.name.trim()
          ? value.name
          : type === "folder"
            ? "Folder"
            : "File";
      return {
        id:
          typeof value.id === "string" && value.id.trim()
            ? value.id
            : makeId("fs"),
        type,
        name,
        size:
          typeof value.size === "string" && value.size.trim()
            ? value.size
            : type === "folder"
              ? "--"
              : "0 KB",
        modifiedAt:
          typeof value.modifiedAt === "string" && value.modifiedAt.trim()
            ? value.modifiedAt
            : "Unknown",
        locked: Boolean(value.locked),
      };
    });

  return safeFiles.length ? safeFiles : createInitialFilesystem();
};

const sanitizeWindows = (input: unknown): OSWindow[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => {
      const value = entry as Partial<OSWindow>;
      const appId =
        typeof value.appId === "string" && value.appId in APP_REGISTRY
          ? (value.appId as AppId)
          : "explorer";
      return {
        id:
          typeof value.id === "string" && value.id.trim()
            ? value.id
            : makeId("win"),
        appId,
        title:
          typeof value.title === "string" && value.title.trim()
            ? value.title
            : APP_REGISTRY[appId].title,
        x: typeof value.x === "number" ? value.x : 72,
        y: typeof value.y === "number" ? value.y : 58,
        w:
          typeof value.w === "number"
            ? Math.max(320, value.w)
            : APP_REGISTRY[appId].defaultSize.w,
        h:
          typeof value.h === "number"
            ? Math.max(220, value.h)
            : APP_REGISTRY[appId].defaultSize.h,
        z: typeof value.z === "number" ? value.z : 1,
        minimized: Boolean(value.minimized),
        maximized: Boolean(value.maximized),
      };
    });
};

const applySoundStateToManager = (sound: OSSoundState) => {
  soundManager.applyState({
    packId: sound.packId,
    volume: sound.volume,
    muted: sound.muted,
    mappings: sound.mappings,
  });
};

soundManager.applyState({
  packId: DEFAULT_SOUND.packId,
  volume: DEFAULT_SOUND.volume,
  muted: DEFAULT_SOUND.muted,
  mappings: DEFAULT_SOUND.mappings,
});

let lastClickSoftAt = 0;

const makeWindow = (appId: AppId, windows: OSWindow[]): OSWindow => {
  const app = APP_REGISTRY[appId];
  const topZ = getTopZ(windows);
  const offset = windows.length % 6;

  return {
    id: makeId("win"),
    appId,
    title: app.title,
    x: 72 + offset * 22,
    y: 58 + offset * 16,
    w: app.defaultSize.w,
    h: app.defaultSize.h,
    z: topZ + 1,
    minimized: false,
    maximized: false,
  };
};

export const useOSStore = create<OSStore>()(
  persist(
    (set, get) => ({
      windows: [],
      focusedWindowId: null,
      recentApps: [],
      startMenuOpen: false,
      sidePanelOpen: false,
      sidePanelTab: "notifications",
      snapPreviewZone: null,
      locked: true,
      authView: "lock",
      notifications: [],
      notificationHistory: [],
      files: createInitialFilesystem(),
      notes: "",
      settings: DEFAULT_SETTINGS,
      desktop: DEFAULT_DESKTOP,
      sound: DEFAULT_SOUND,

      openApp: (appId) => {
        set((state) => {
          if (!APP_REGISTRY[appId]) {
            soundManager.play("error");
            return state;
          }
          const nextWindow = makeWindow(appId, state.windows);
          const nextRecents = [
            appId,
            ...state.recentApps.filter((entry) => entry !== appId),
          ].slice(0, MAX_RECENT_APPS);
          soundManager.play("openWindow");
          return {
            windows: [...state.windows, nextWindow],
            focusedWindowId: nextWindow.id,
            recentApps: nextRecents,
            startMenuOpen: false,
            sidePanelOpen: false,
            snapPreviewZone: null,
            locked: false,
            authView: null,
          };
        });
      },

      closeWindow: (windowId) => {
        set((state) => {
          const nextWindows = state.windows.filter((win) => win.id !== windowId);
          soundManager.play("closeWindow");
          return {
            windows: nextWindows,
            focusedWindowId: getFocusCandidate(nextWindows),
            snapPreviewZone: null,
          };
        });
      },

      minimizeWindow: (windowId) => {
        set((state) => {
          const nextWindows = state.windows.map((win) =>
            win.id === windowId ? { ...win, minimized: true } : win
          );
          soundManager.play("minimize");
          return {
            windows: nextWindows,
            focusedWindowId: getFocusCandidate(nextWindows),
            snapPreviewZone: null,
          };
        });
      },

      toggleMaximize: (windowId) => {
        set((state) => {
          const target = state.windows.find((win) => win.id === windowId);
          if (!target) {
            soundManager.play("error");
            return state;
          }

          const nextIsMaximized = !target.maximized;
          const nextZ = getTopZ(state.windows) + 1;
          if (nextIsMaximized) {
            soundManager.play("maximize");
          }

          return {
            windows: state.windows.map((win) =>
              win.id === windowId
                ? {
                    ...win,
                    maximized: nextIsMaximized,
                    minimized: false,
                    z: nextZ,
                  }
                : win
            ),
            focusedWindowId: windowId,
            snapPreviewZone: null,
          };
        });
      },

      focusWindow: (windowId) => {
        set((state) => {
          const existing = state.windows.find((win) => win.id === windowId);
          if (!existing) {
            return state;
          }

          const nextZ = getTopZ(state.windows) + 1;
          return {
            windows: state.windows.map((win) =>
              win.id === windowId
                ? { ...win, z: nextZ, minimized: false }
                : win
            ),
            focusedWindowId: windowId,
            snapPreviewZone: null,
          };
        });
      },

      updateWindowBounds: (windowId, patch) => {
        set((state) => ({
          windows: state.windows.map((win) =>
            win.id === windowId ? { ...win, ...patch } : win
          ),
          snapPreviewZone: null,
        }));
      },

      restoreWindow: (windowId) => {
        set((state) => {
          const existing = state.windows.find((win) => win.id === windowId);
          if (!existing) {
            return state;
          }
          const nextZ = getTopZ(state.windows) + 1;
          return {
            windows: state.windows.map((win) =>
              win.id === windowId
                ? { ...win, minimized: false, z: nextZ }
                : win
            ),
            focusedWindowId: windowId,
            snapPreviewZone: null,
          };
        });
      },

      setStartMenuOpen: (open) =>
        set((state) => ({
          startMenuOpen: open,
          sidePanelOpen: open ? false : state.sidePanelOpen,
        })),
      toggleStartMenu: () =>
        set((state) => {
          const nextOpen = !state.startMenuOpen;
          return {
            startMenuOpen: nextOpen,
            sidePanelOpen: nextOpen ? false : state.sidePanelOpen,
          };
        }),

      openSidePanel: (tab) =>
        set({
          sidePanelOpen: true,
          sidePanelTab: tab,
          startMenuOpen: false,
        }),
      closeSidePanel: () => set({ sidePanelOpen: false }),
      toggleSidePanel: (tab) =>
        set((state) => {
          if (state.sidePanelOpen && state.sidePanelTab === tab) {
            return { sidePanelOpen: false };
          }
          return {
            sidePanelOpen: true,
            sidePanelTab: tab,
            startMenuOpen: false,
          };
        }),
      setSidePanelTab: (tab) =>
        set(() => ({
          sidePanelOpen: true,
          sidePanelTab: tab,
        })),

      setSnapPreviewZone: (zone) => set({ snapPreviewZone: zone }),

      applySnapWindow: (windowId, zone) => {
        if (typeof window === "undefined") {
          return;
        }

        const viewportWidth = window.innerWidth;
        const viewportHeight = Math.max(
          320,
          window.innerHeight - TASKBAR_RESERVED_HEIGHT
        );

        set((state) => {
          const target = state.windows.find((win) => win.id === windowId);
          if (!target) {
            return state;
          }

          const topZ = getTopZ(state.windows) + 1;
          const snappedBounds =
            zone === "left"
              ? {
                  x: 0,
                  y: 0,
                  w: Math.floor(viewportWidth / 2),
                  h: viewportHeight,
                  maximized: false,
                }
              : zone === "right"
                ? {
                    x: Math.floor(viewportWidth / 2),
                    y: 0,
                    w: Math.ceil(viewportWidth / 2),
                    h: viewportHeight,
                    maximized: false,
                  }
                : {
                    x: 0,
                    y: 0,
                    w: viewportWidth,
                    h: viewportHeight,
                    maximized: true,
                  };

          return {
            windows: state.windows.map((win) =>
              win.id === windowId
                ? {
                    ...win,
                    ...snappedBounds,
                    minimized: false,
                    z: topZ,
                  }
                : win
            ),
            focusedWindowId: windowId,
            snapPreviewZone: null,
          };
        });

        if (zone === "top") {
          soundManager.play("maximize");
        }
      },

      lockSystem: () => {
        if (get().locked) {
          return;
        }
        set({
          locked: true,
          authView: "lock",
          startMenuOpen: false,
          sidePanelOpen: false,
          snapPreviewZone: null,
        });
        soundManager.play("lock");
      },

      unlockSystem: () => {
        const { locked, authView } = get();
        if (!locked && authView !== "lock") {
          return;
        }
        set({ authView: "login" });
        soundManager.play("unlock");
      },

      pushNotification: (title, message, options) => {
        const notification: OSNotification = {
          id: makeId("ntf"),
          title,
          message,
          createdAt: Date.now(),
          level: options?.level ?? "info",
          appId: options?.appId,
        };

        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, MAX_TOASTS),
          notificationHistory: [notification, ...state.notificationHistory].slice(
            0,
            MAX_HISTORY
          ),
        }));

        if (options?.playSound !== false) {
          soundManager.play("notify");
        }
      },

      dismissNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((item) => item.id !== id),
        })),

      dismissNotificationHistory: (id) =>
        set((state) => ({
          notificationHistory: state.notificationHistory.filter(
            (item) => item.id !== id
          ),
          notifications: state.notifications.filter((item) => item.id !== id),
        })),

      clearNotificationHistory: () =>
        set({
          notificationHistory: [],
          notifications: [],
        }),

      raiseError: (message) => {
        const notification: OSNotification = {
          id: makeId("ntf"),
          title: "Error",
          message,
          createdAt: Date.now(),
          level: "error",
        };

        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, MAX_TOASTS),
          notificationHistory: [notification, ...state.notificationHistory].slice(
            0,
            MAX_HISTORY
          ),
        }));
        soundManager.play("error");
      },

      deleteFile: (itemId) => {
        set((state) => {
          const target = state.files.find((item) => item.id === itemId);
          if (!target) {
            soundManager.play("error");
            return state;
          }

          if (target.locked) {
            const errorNotification: OSNotification = {
              id: makeId("ntf"),
              title: "Delete failed",
              message: `${target.name} is protected by system policy.`,
              createdAt: Date.now(),
              level: "error",
            };
            soundManager.play("error");
            return {
              notifications: [errorNotification, ...state.notifications].slice(
                0,
                MAX_TOASTS
              ),
              notificationHistory: [
                errorNotification,
                ...state.notificationHistory,
              ].slice(
                0,
                MAX_HISTORY
              ),
            };
          }

          soundManager.play("recycle");
          return {
            files: state.files.filter((item) => item.id !== itemId),
          };
        });
      },

      resetFileSystem: () => set({ files: createInitialFilesystem() }),
      setNotes: (value) => set({ notes: value }),

      setAccent: (accent) =>
        set((state) => ({ settings: { ...state.settings, accent } })),
      setWallpaper: (wallpaper) =>
        set((state) => ({ settings: { ...state.settings, wallpaper } })),
      setReduceMotion: (reduceMotion) =>
        set((state) => ({ settings: { ...state.settings, reduceMotion } })),
      setShowNoAiLine: (enabled) =>
        set((state) => ({
          settings: { ...state.settings, showNoAiLine: enabled },
        })),
      setDesktopSnapToGrid: (enabled) =>
        set((state) => ({
          desktop: {
            ...state.desktop,
            snapToGrid: enabled,
          },
        })),
      setDesktopIconSize: (size) =>
        set((state) => ({
          desktop: {
            ...state.desktop,
            iconSize: size,
          },
        })),
      setDesktopIconPosition: (appId, position) =>
        set((state) => ({
          desktop: {
            ...state.desktop,
            iconPositions: {
              ...state.desktop.iconPositions,
              [appId]: {
                x: position.x,
                y: position.y,
              },
            },
          },
        })),
      resetDesktopIconLayout: () =>
        set((state) => ({
          desktop: {
            ...state.desktop,
            iconPositions: {},
          },
        })),

      setVolume: (value) => {
        const volume = clamp(value, 0, 1);
        set((state) => ({
          sound: { ...state.sound, volume },
        }));
        soundManager.setVolume(volume);
      },

      toggleMute: () =>
        set((state) => {
          const muted = !state.sound.muted;
          soundManager.setMuted(muted);
          return {
            sound: { ...state.sound, muted },
          };
        }),

      setPack: (packId) => {
        if (!isSoundPackId(packId)) {
          return;
        }
        set((state) => ({
          sound: { ...state.sound, packId },
        }));
        soundManager.setPack(packId);
      },

      setMapping: (eventName, source, meta) => {
        set((state) => {
          const nextMappings = { ...state.sound.mappings };
          const nextMeta = { ...state.sound.customFilesMeta };

          if (source && source.trim()) {
            nextMappings[eventName] = source;
            if (meta) {
              nextMeta[eventName] = meta;
            }
          } else {
            delete nextMappings[eventName];
            delete nextMeta[eventName];
          }

          soundManager.setMapping(eventName, source);

          return {
            sound: {
              ...state.sound,
              mappings: nextMappings,
              customFilesMeta: nextMeta,
            },
          };
        });
      },

      resetSounds: () => {
        set((state) => ({
          sound: {
            ...DEFAULT_SOUND,
            volume: state.sound.volume,
            muted: false,
          },
        }));
        const nextSound = get().sound;
        applySoundStateToManager(nextSound);
      },

      setClickSoftEnabled: (enabled) =>
        set((state) => ({
          sound: { ...state.sound, clickSoftEnabled: enabled },
        })),

      importSoundConfig: (payload) => {
        set((state) => {
          const packId =
            typeof payload.packId === "string" && isSoundPackId(payload.packId)
              ? payload.packId
              : state.sound.packId;
          const volume =
            typeof payload.volume === "number"
              ? clamp(payload.volume, 0, 1)
              : state.sound.volume;
          const muted =
            typeof payload.muted === "boolean"
              ? payload.muted
              : state.sound.muted;
          const clickSoftEnabled =
            typeof payload.clickSoftEnabled === "boolean"
              ? payload.clickSoftEnabled
              : state.sound.clickSoftEnabled;

          const nextSound: OSSoundState = {
            ...state.sound,
            packId,
            volume,
            muted,
            clickSoftEnabled,
            mappings: sanitizeMappings(payload.mappings),
            customFilesMeta: sanitizeMeta(payload.customFilesMeta),
          };

          applySoundStateToManager(nextSound);

          return {
            sound: nextSound,
          };
        });
      },

      playEvent: (eventName, options) => {
        soundManager.play(eventName, options);
      },

      playClickSoft: () => {
        const { sound } = get();
        if (!sound.clickSoftEnabled) {
          return;
        }

        const now = Date.now();
        if (now - lastClickSoftAt < CLICK_SOFT_DEBOUNCE_MS) {
          return;
        }
        lastClickSoftAt = now;
        soundManager.play("clickSoft", { volumeMultiplier: 0.8 });
      },

      preloadSounds: () => {
        soundManager.preloadCurrentPack();
      },

      showLoginView: () => {
        set({
          locked: true,
          authView: "login",
          startMenuOpen: false,
          sidePanelOpen: false,
          snapPreviewZone: null,
        });
      },

      loginSession: () => {
        set({
          locked: false,
          authView: null,
          startMenuOpen: false,
          sidePanelOpen: false,
          snapPreviewZone: null,
        });
        soundManager.play("login", { volumeMultiplier: 0.65 });
      },

      restartSession: () => {
        set((state) => ({
          windows: [],
          focusedWindowId: null,
          startMenuOpen: false,
          sidePanelOpen: false,
          sidePanelTab: "notifications",
          snapPreviewZone: null,
          locked: true,
          authView: "lock",
          notifications: [],
          notificationHistory: [],
          recentApps: state.recentApps,
        }));
        soundManager.play("boot", { volumeMultiplier: 0.65 });
      },
    }),
    {
      name: "purpleos-store-v2",
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({
        windows: state.windows,
        focusedWindowId: state.focusedWindowId,
        recentApps: state.recentApps,
        files: state.files,
        notes: state.notes,
        notificationHistory: state.notificationHistory,
        settings: state.settings,
        desktop: state.desktop,
        sound: state.sound,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }

        state.windows = sanitizeWindows(state.windows);
        state.focusedWindowId = state.windows.some(
          (windowData) => windowData.id === state.focusedWindowId
        )
          ? state.focusedWindowId
          : null;
        state.files = sanitizeFiles(state.files);
        state.notificationHistory = sanitizeNotificationHistory(
          state.notificationHistory
        );
        state.recentApps = sanitizeRecentApps(state.recentApps);
        state.settings = sanitizeSettings(state.settings);
        state.desktop = sanitizeDesktopState(state.desktop);
        state.sound = sanitizeSoundState(state.sound);
        state.authView = "lock";
        state.locked = true;
        state.startMenuOpen = false;
        state.sidePanelOpen = false;
        state.snapPreviewZone = null;
        state.notifications = [];

        applySoundStateToManager(state.sound);
      },
    }
  )
);

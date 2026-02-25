"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { APP_REGISTRY, type AppId } from "@/lib/apps";
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
};

export type OSSettings = {
  accent: string;
  wallpaper: string;
  reduceMotion: boolean;
  showNoAiLine: boolean;
};

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

type OSStore = {
  windows: OSWindow[];
  focusedWindowId: string | null;
  startMenuOpen: boolean;
  locked: boolean;
  notifications: OSNotification[];
  files: ExplorerItem[];
  notes: string;
  settings: OSSettings;
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
  lockSystem: () => void;
  unlockSystem: () => void;

  pushNotification: (
    title: string,
    message: string,
    options?: { level?: "info" | "error"; playSound?: boolean }
  ) => void;
  dismissNotification: (id: string) => void;
  raiseError: (message: string) => void;
  deleteFile: (itemId: string) => void;
  resetFileSystem: () => void;
  setNotes: (value: string) => void;

  setAccent: (accent: string) => void;
  setWallpaper: (wallpaper: string) => void;
  setReduceMotion: (reduceMotion: boolean) => void;
  setShowNoAiLine: (enabled: boolean) => void;

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
};

const DEFAULT_SETTINGS: OSSettings = {
  accent: "#a855f7",
  wallpaper: "purple-nebula",
  reduceMotion: false,
  showNoAiLine: false,
};

const DEFAULT_SOUND: OSSoundState = {
  packId: DEFAULT_SOUND_PACK,
  volume: 0.72,
  muted: false,
  mappings: {},
  customFilesMeta: {},
  clickSoftEnabled: true,
};

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
      startMenuOpen: false,
      locked: false,
      notifications: [],
      files: createInitialFilesystem(),
      notes: "",
      settings: DEFAULT_SETTINGS,
      sound: DEFAULT_SOUND,

      openApp: (appId) => {
        set((state) => {
          if (!APP_REGISTRY[appId]) {
            soundManager.play("error");
            return state;
          }
          const nextWindow = makeWindow(appId, state.windows);
          soundManager.play("openWindow");
          return {
            windows: [...state.windows, nextWindow],
            focusedWindowId: nextWindow.id,
            startMenuOpen: false,
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
          };
        });
      },

      updateWindowBounds: (windowId, patch) => {
        set((state) => ({
          windows: state.windows.map((win) =>
            win.id === windowId ? { ...win, ...patch } : win
          ),
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
          };
        });
      },

      setStartMenuOpen: (open) => set({ startMenuOpen: open }),
      toggleStartMenu: () =>
        set((state) => ({ startMenuOpen: !state.startMenuOpen })),

      lockSystem: () => {
        if (get().locked) {
          return;
        }
        set({ locked: true, startMenuOpen: false });
        soundManager.play("lock");
      },

      unlockSystem: () => {
        if (!get().locked) {
          return;
        }
        set({ locked: false });
        soundManager.play("unlock");
      },

      pushNotification: (title, message, options) => {
        const notification: OSNotification = {
          id: makeId("ntf"),
          title,
          message,
          createdAt: Date.now(),
          level: options?.level ?? "info",
        };

        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, 6),
        }));

        if (options?.playSound !== false) {
          soundManager.play("notify");
        }
      },

      dismissNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((item) => item.id !== id),
        })),

      raiseError: (message) => {
        const notification: OSNotification = {
          id: makeId("ntf"),
          title: "Error",
          message,
          createdAt: Date.now(),
          level: "error",
        };

        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, 6),
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
                6
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
        soundManager.play("clickSoft", { volumeMultiplier: 0.8 });
      },
    }),
    {
      name: "purpleos-store-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        files: state.files,
        notes: state.notes,
        settings: state.settings,
        sound: state.sound,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }
        applySoundStateToManager(state.sound);
      },
    }
  )
);

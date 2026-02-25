export const SOUND_EVENTS = [
  "boot",
  "login",
  "lock",
  "unlock",
  "openWindow",
  "closeWindow",
  "minimize",
  "maximize",
  "error",
  "notify",
  "recycle",
  "clickSoft",
] as const;

export type SoundEventName = (typeof SOUND_EVENTS)[number];

export type SoundPackId = "classic" | "aero" | "purple";

export type SoundPackEvents = Record<SoundEventName, string>;

export type SoundPack = {
  id: SoundPackId;
  label: string;
  description: string;
  events: SoundPackEvents;
};

const CLASSIC_EVENTS: SoundPackEvents = {
  boot: "boot-classic.wav",
  login: "login-classic.wav",
  lock: "lock-classic.wav",
  unlock: "unlock-classic.wav",
  openWindow: "open-window-classic.wav",
  closeWindow: "close-window-classic.wav",
  minimize: "minimize-classic.wav",
  maximize: "maximize-classic.wav",
  error: "error-classic.wav",
  notify: "notify-classic.wav",
  recycle: "recycle-classic.wav",
  clickSoft: "click-soft-classic.wav",
};

const AERO_EVENTS: SoundPackEvents = {
  boot: "boot-aero.wav",
  login: "login-aero.wav",
  lock: "lock-aero.wav",
  unlock: "unlock-aero.wav",
  openWindow: "open-window-aero.wav",
  closeWindow: "close-window-aero.wav",
  minimize: "minimize-aero.wav",
  maximize: "maximize-aero.wav",
  error: "error-aero.wav",
  notify: "notify-aero.wav",
  recycle: "recycle-aero.wav",
  clickSoft: "click-soft-aero.wav",
};

const PURPLE_EVENTS: SoundPackEvents = {
  boot: "boot-purple.wav",
  login: "login-purple.wav",
  lock: "lock-purple.wav",
  unlock: "unlock-purple.wav",
  openWindow: "open-window-purple.wav",
  closeWindow: "close-window-purple.wav",
  minimize: "minimize-purple.wav",
  maximize: "maximize-purple.wav",
  error: "error-purple.wav",
  notify: "notify-purple.wav",
  recycle: "recycle-purple.wav",
  clickSoft: "click-soft-purple.wav",
};

export const SOUND_PACKS: Record<SoundPackId, SoundPack> = {
  classic: {
    id: "classic",
    label: "Classic",
    description: "Rounded and mellow placeholder tones.",
    events: CLASSIC_EVENTS,
  },
  aero: {
    id: "aero",
    label: "Aero",
    description: "Bright and airy placeholder tones.",
    events: AERO_EVENTS,
  },
  purple: {
    id: "purple",
    label: "Purple",
    description: "Soft synthetic tones tuned for PurpleOS.",
    events: PURPLE_EVENTS,
  },
};

export const SOUND_PACK_IDS = Object.keys(SOUND_PACKS) as SoundPackId[];

export const DEFAULT_SOUND_PACK: SoundPackId = "purple";

export const getSoundPack = (packId: SoundPackId): SoundPack =>
  SOUND_PACKS[packId] ?? SOUND_PACKS[DEFAULT_SOUND_PACK];

const normalizeBasePath = (value: string): string => {
  if (!value || value === "/") {
    return "";
  }
  return value.replace(/\/+$/, "");
};

const getBasePathPrefix = () =>
  normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH ?? "");

export const getDefaultSoundSource = (
  packId: SoundPackId,
  eventName: SoundEventName
): string => {
  const fileName = getSoundPack(packId).events[eventName];
  const basePathPrefix = getBasePathPrefix();
  return `${basePathPrefix}/sounds/${packId}/${fileName}`;
};

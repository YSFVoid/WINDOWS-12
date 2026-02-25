"use client";

import {
  DEFAULT_SOUND_PACK,
  getDefaultSoundSource,
  getSoundPack,
  type SoundEventName,
  type SoundPackId,
} from "@/lib/sounds/packs";

export type CustomSoundMeta = {
  name: string;
  type: string;
  size: number;
  updatedAt: number;
};

export type SoundManagerState = {
  packId: SoundPackId;
  volume: number;
  muted: boolean;
  mappings: Partial<Record<SoundEventName, string>>;
};

type PlayOptions = {
  volumeMultiplier?: number;
};

export class SoundManager {
  private packId: SoundPackId = DEFAULT_SOUND_PACK;
  private volume = 0.72;
  private muted = false;
  private mappings: Partial<Record<SoundEventName, string>> = {};
  private context: AudioContext | null = null;
  private activeAudio = new Set<HTMLAudioElement>();

  play(eventName: SoundEventName, options: PlayOptions = {}): void {
    if (typeof window === "undefined") {
      return;
    }

    const source = this.resolveSource(eventName);
    if (!source) {
      return;
    }

    const audio = new Audio(source);
    this.activeAudio.add(audio);
    audio.preload = "auto";
    audio.volume = this.muted
      ? 0
      : this.clamp(this.volume * (options.volumeMultiplier ?? 1), 0, 1);

    const release = () => {
      audio.onended = null;
      audio.onerror = null;
      this.activeAudio.delete(audio);
    };

    audio.onended = release;
    audio.onerror = () => {
      release();
      this.playFallbackTone(eventName, options.volumeMultiplier ?? 1);
    };

    void audio.play().catch(() => {
      release();
      this.playFallbackTone(eventName, options.volumeMultiplier ?? 1);
    });
  }

  setVolume(next: number): number {
    this.volume = this.clamp(next, 0, 1);
    return this.volume;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  setMuted(value: boolean): boolean {
    this.muted = value;
    return this.muted;
  }

  setPack(packId: SoundPackId): SoundPackId {
    this.packId = getSoundPack(packId).id;
    return this.packId;
  }

  setMapping(eventName: SoundEventName, source: string | null): void {
    if (source && source.trim()) {
      this.mappings[eventName] = source;
      return;
    }

    delete this.mappings[eventName];
  }

  setMappings(next: Partial<Record<SoundEventName, string>>): void {
    this.mappings = { ...next };
  }

  async setCustomSound(
    eventName: SoundEventName,
    file: File
  ): Promise<{ src: string; meta: CustomSoundMeta } | null> {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const src = await this.fileToDataUrl(file);
      const meta: CustomSoundMeta = {
        name: file.name,
        type: file.type,
        size: file.size,
        updatedAt: Date.now(),
      };
      this.setMapping(eventName, src);
      return { src, meta };
    } catch {
      return null;
    }
  }

  applyState(next: SoundManagerState): void {
    this.setPack(next.packId);
    this.setVolume(next.volume);
    this.setMuted(next.muted);
    this.setMappings(next.mappings);
  }

  getState(): SoundManagerState {
    return {
      packId: this.packId,
      volume: this.volume,
      muted: this.muted,
      mappings: { ...this.mappings },
    };
  }

  private resolveSource(eventName: SoundEventName): string | null {
    const custom = this.mappings[eventName];
    if (custom) {
      return custom;
    }

    return getDefaultSoundSource(this.packId, eventName);
  }

  private async fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Could not read uploaded sound."));
      reader.readAsDataURL(file);
    });
  }

  private playFallbackTone(eventName: SoundEventName, volumeMultiplier: number) {
    if (this.muted || typeof window === "undefined") {
      return;
    }

    const Ctx =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!Ctx) {
      return;
    }

    try {
      if (!this.context) {
        this.context = new Ctx();
      }

      const osc = this.context.createOscillator();
      const gain = this.context.createGain();

      const baseFrequency =
        eventName === "error" ? 180 : eventName === "notify" ? 620 : 420;
      const targetVolume = this.clamp(this.volume * volumeMultiplier * 0.2, 0, 1);
      const startAt = this.context.currentTime;
      const endAt = startAt + 0.14;

      osc.type = "sine";
      osc.frequency.value = baseFrequency;
      gain.gain.value = 0.0001;

      osc.connect(gain);
      gain.connect(this.context.destination);

      gain.gain.exponentialRampToValueAtTime(
        Math.max(targetVolume, 0.0001),
        startAt + 0.01
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, endAt);

      osc.start(startAt);
      osc.stop(endAt);
    } catch {
      // Silent fallback on purpose.
    }
  }

  private clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
  }
}

export const soundManager = new SoundManager();

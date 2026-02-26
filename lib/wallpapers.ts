export type WallpaperId = "purple-nebula" | "purple-aurora" | "nebula-wave" | "iris-bloom";

export type WallpaperDefinition = {
  id: WallpaperId;
  label: string;
  source: string;
};

export const WALLPAPERS: WallpaperDefinition[] = [
  {
    id: "purple-nebula",
    label: "Purple Nebula",
    source: "/wallpapers/purple-aurora.svg",
  },
  {
    id: "purple-aurora",
    label: "Purple Aurora",
    source: "/wallpapers/purple-aurora.svg",
  },
  {
    id: "nebula-wave",
    label: "Nebula Wave",
    source: "/wallpapers/nebula-wave.svg",
  },
  {
    id: "iris-bloom",
    label: "Iris Bloom",
    source: "/wallpapers/iris-bloom.svg",
  },
];

export const getWallpaper = (wallpaperId: string): WallpaperDefinition =>
  WALLPAPERS.find((entry) => entry.id === wallpaperId) ?? WALLPAPERS[0];

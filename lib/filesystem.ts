export type ExplorerItemType = "file" | "folder";

export type ExplorerItem = {
  id: string;
  name: string;
  type: ExplorerItemType;
  size: string;
  modifiedAt: string;
  locked?: boolean;
};

export const createInitialFilesystem = (): ExplorerItem[] => [
  {
    id: "folder-projects",
    name: "Projects",
    type: "folder",
    size: "--",
    modifiedAt: "2026-02-19 18:10",
  },
  {
    id: "file-roadmap",
    name: "PurpleOS-Roadmap.md",
    type: "file",
    size: "38 KB",
    modifiedAt: "2026-02-24 09:33",
  },
  {
    id: "file-brand",
    name: "Brand-Guide.pdf",
    type: "file",
    size: "2.2 MB",
    modifiedAt: "2026-02-21 16:42",
  },
  {
    id: "file-preview",
    name: "Desktop-Preview.png",
    type: "file",
    size: "512 KB",
    modifiedAt: "2026-02-25 08:12",
  },
  {
    id: "file-kernel",
    name: "system-core.dll",
    type: "file",
    size: "12.6 MB",
    modifiedAt: "2026-02-01 11:00",
    locked: true,
  },
];

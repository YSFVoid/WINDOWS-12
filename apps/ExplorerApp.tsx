"use client";

import { File, Folder, Trash2, TriangleAlert, BellRing, RotateCcw } from "lucide-react";

import { useOSStore } from "@/store/useOSStore";

export default function ExplorerApp() {
  const files = useOSStore((state) => state.files);
  const deleteFile = useOSStore((state) => state.deleteFile);
  const pushNotification = useOSStore((state) => state.pushNotification);
  const raiseError = useOSStore((state) => state.raiseError);
  const resetFileSystem = useOSStore((state) => state.resetFileSystem);
  const playClickSoft = useOSStore((state) => state.playClickSoft);

  return (
    <div className="flex h-full flex-col gap-4 text-violet-100">
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 md:grid-cols-[1fr_auto]">
        <div>
          <h2 className="text-base font-semibold text-violet-50">
            Desktop / Home / PurpleOS
          </h2>
          <p className="mt-1 text-xs text-violet-100/70">
            Fake filesystem demo. Deleting an item triggers the system recycle event sound.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/20"
            onClick={() => {
              playClickSoft();
              pushNotification("PurpleOS", "Background sync completed.");
            }}
          >
            <BellRing size={14} />
            Notify
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/20"
            onClick={() => {
              playClickSoft();
              raiseError("Invalid operation: folder path is read-only.");
            }}
          >
            <TriangleAlert size={14} />
            Error test
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/20"
            onClick={() => {
              playClickSoft();
              resetFileSystem();
            }}
          >
            <RotateCcw size={14} />
            Reset files
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-2xl border border-white/10 bg-black/25">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 bg-black/45 backdrop-blur-md">
            <tr>
              <th className="px-4 py-3 font-semibold text-violet-200/80">Name</th>
              <th className="px-4 py-3 font-semibold text-violet-200/80">Size</th>
              <th className="px-4 py-3 font-semibold text-violet-200/80">Modified</th>
              <th className="px-4 py-3 text-right font-semibold text-violet-200/80">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {files.map((item) => (
              <tr
                key={item.id}
                className="border-t border-white/8 transition hover:bg-white/6"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {item.type === "folder" ? (
                      <Folder size={16} className="text-violet-300" />
                    ) : (
                      <File size={16} className="text-violet-200" />
                    )}
                    <span className="text-violet-50">{item.name}</span>
                    {item.locked ? (
                      <span className="rounded-md border border-amber-300/30 bg-amber-400/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-amber-100">
                        locked
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3 text-violet-200/80">{item.size}</td>
                <td className="px-4 py-3 text-violet-200/80">{item.modifiedAt}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-violet-50 transition hover:bg-white/20"
                      onClick={() => {
                        playClickSoft();
                        deleteFile(item.id);
                      }}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {files.length === 0 ? (
          <div className="p-6 text-sm text-violet-200/75">
            Recycle complete. No items left in this folder.
          </div>
        ) : null}
      </div>
    </div>
  );
}

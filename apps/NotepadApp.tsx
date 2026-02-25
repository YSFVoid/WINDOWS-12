"use client";

import { useOSStore } from "@/store/useOSStore";

export default function NotepadApp() {
  const notes = useOSStore((state) => state.notes);
  const setNotes = useOSStore((state) => state.setNotes);

  return (
    <div className="flex h-full flex-col gap-3 text-violet-100">
      <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
        <h2 className="text-sm font-semibold text-violet-50">Local Notepad</h2>
        <p className="mt-1 text-xs text-violet-100/70">
          Notes are stored in browser localStorage and restored automatically.
        </p>
      </div>
      <textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Write your notes..."
        className="h-full min-h-0 resize-none rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-violet-50 outline-none ring-violet-300/40 transition focus:ring-2"
      />
    </div>
  );
}

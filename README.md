# PurpleOS

PurpleOS is a from-scratch web desktop OS experience built with a premium dark-purple visual direction, glass/mica surfaces, and smooth motion-focused interactions.

The system includes a real window manager (draggable, resizable, focus/minimize/maximize/close), desktop shell (taskbar + start menu), right-side system panels, and app suite (Settings, Soundboard, Explorer, Notepad, Terminal).

## Run

```bash
npm install
npm run dev
```

## Core Highlights

- Modern desktop UI with deep purple gradients and acrylic-style panels
- Window system powered by `react-rnd` and global Zustand state
- Sound event engine inspired by classic OS workflows (without using Microsoft audio assets)
- Automatic sound triggers on real UI actions
- Custom per-event sound uploads with local persistence
- Sound pack import/export support via JSON
- Notification Center with history, clear-all, and per-item dismiss
- Quick Settings panel (volume, mute, click sounds, reduce motion, battery indicator)
- Start Menu search with keyboard launch flow (`Esc` + `Enter`)
- Snap layouts (drag to left/right/top edges with live snap overlay)
- Alt+Tab window switcher overlay
- Taskbar hover preview cards for running apps
- Terminal app with `about` command showing project credits

## Sound System

PurpleOS provides a full system soundboard with these event types:

- `boot`, `login`, `lock`, `unlock`
- `openWindow`, `closeWindow`, `minimize`, `maximize`
- `error`, `notify`, `recycle`, `clickSoft`

Included packs:

- `classic`
- `aero`
- `purple`

All included audio assets are original placeholder tones generated for this project. No Microsoft or Windows copyrighted sound files are included.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Framer Motion
- Zustand
- react-rnd
- lucide-react
- Web Audio / HTMLAudioElement

## Credits

Developed by Ysf (Lone wolf developer).
Without vibe coding.

## Screenshots

### Desktop Overview

_Add screenshot: `docs/screenshots/desktop-overview.png`_

### Notification Center + Quick Settings

_Add screenshot: `docs/screenshots/system-panels.png`_

### Soundboard + Settings

_Add screenshot: `docs/screenshots/sound-system.png`_

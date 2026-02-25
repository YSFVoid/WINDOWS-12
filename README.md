# PurpleOS

PurpleOS is a from-scratch web desktop OS experience built with a premium dark-purple visual direction, glass/mica surfaces, and smooth motion-focused interactions.

The system includes a real window manager (draggable, resizable, focus/minimize/maximize/close), desktop shell (taskbar + start menu), and app suite (Settings, Soundboard, Explorer, Notepad).

## Core Highlights

- Modern desktop UI with deep purple gradients and acrylic-style panels
- Window system powered by `react-rnd` and global Zustand state
- Sound event engine inspired by classic OS workflows
- Automatic sound triggers on real UI actions
- Custom per-event sound uploads with local persistence
- Sound pack import/export support via JSON

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

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start development with hot reload
pnpm build        # Build for production
pnpm build:mac    # Build macOS distributable
pnpm build:win    # Build Windows distributable
pnpm build:linux  # Build Linux distributable
pnpm lint         # Run ESLint
pnpm format       # Format code with Prettier
```

## Architecture

This is an Electron + React Pomodoro timer application with integrated task management, built using electron-vite.

### Process Structure

- **Main Process** (`src/main/index.js`): Manages window creation, system tray, IPC handlers, and persistent storage via electron-store. The window is frameless, transparent, and always-on-top by default.

- **Preload** (`src/preload/index.js`): Exposes a secure `window.api` bridge with methods for window control, notifications, and todo persistence.

- **Renderer** (`src/renderer/src/`): React 19 application with functional components and custom hooks.

### Key Patterns

- State management through custom hooks (`useTimer`, `useTodos`) rather than external libraries
- Todo items follow a status flow: `pending` → `in_progress` → `completed` (max 3 concurrent in-progress)
- Timer uses the standard Pomodoro technique: 25min focus → 5min short break → long break after 4 cycles
- Data persists via electron-store through IPC communication
- Path alias `@renderer` maps to `src/renderer/src`

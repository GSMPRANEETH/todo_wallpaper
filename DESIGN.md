<<<<<<< HEAD
FOR PR
=======
﻿# Command Center - Design & Architecture Reference (v1.6 Rambo Ultimate)

## Overview
This document serves as the architectural and design blueprint for the "Live Productivity Command Center" desktop wallpaper app. v1.6 focuses on deep customizability and refined Obsidian Glass aesthetics.

## 1. Core Architecture
- **Framework:** Tauri v2 + React 19 + TypeScript + Vite.
- **Deep Customization Engine:** 
  - **Reordering:** Native HTML5 Drag and Drop for module positioning.
  - **Visuals:** React-driven CSS variables for live transparency, blur, and color updates.
  - **Shortcuts:** User-managed grid with dynamic icon matching.
- **Stability:** Safe Rust initialization for Tray and Plugins.

## 2. Refined Design System: Obsidian Glass v2
- **Aesthetic:** Professional Glassmorphism.
- **Variable Blur/Opacity:** User-adjustable from 0-100px blur and 10%-90% opacity.
- **State Feedback:** Subtle progress bars and status text instead of intense glowing borders.
- **Typography:** Inter for system data; Dancing Script for Cozy Scratchpad.

## 3. Product Modules
- **ClockWidget:** Minimal high-contrast clock.
- **SystemMonitor:** Real-time CPU, RAM, Network, and Top Processes.
- **PomodoroTimer:** Focus management with state-aware accent colors.
- **DailyIntent:** Primary Objective with a progress bar tied to tasks.
- **AppLauncher:** Customizable workflow shortcut grid.
- **Cozy Scratchpad:** Handwritten notebook area.
- **TodoWidget:** Priority-based task manager with high-fidelity color coding.

## 4. Automation & Integration
- **Tray Support:** Instant show/hide via Left Click.
- **Startup:** Integrated Windows Autostart management.
- **Notifications:** OS-native push alerts for Focus/Break completion.
>>>>>>> x1

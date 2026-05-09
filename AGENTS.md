# AGENTS.md

## Project Overview

This repository is a real-time beauty AR and face warp algorithm lab.

The goal is to design and experiment with:
- beauty filters
- face warp algorithms
- stabilization methods
- warp falloff curves
- landmark smoothing
- JSON-based algorithm presets

This project is NOT tied to Butterflyve.
It should remain reusable as a standalone beauty AR platform.

---

## Tech Stack

- Vite
- React
- TypeScript
- WebGL2
- MediaPipe Tasks Vision

---

## Commands

- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`

---

## Coding Rules

- Use TypeScript strict mode
- Prefer small reusable modules
- Avoid giant files
- Keep shader code isolated
- Keep algorithm definitions JSON-serializable

---

## Architecture Goals

Separate:
- UI layer
- algorithm definitions
- shader implementations
- landmark processing
- stabilization logic

---

## Important

This repository is an algorithm experimentation platform.

Do NOT tightly couple:
- UI
- rendering
- algorithm configs
- MediaPipe adapters

All algorithm definitions should be exportable as JSON presets.

---

## Important Rules (for Codex contributors)

- Keep React components thin
- Do not put math logic inside React components
- Keep shader logic in `src/engine/webgl`
- Keep geometry logic in `src/engine/geometry`
- Keep binding logic in `src/engine/algorithms`
- Keep preset schema JSON-serializable
- Run `npm run build` after changes

---

## Current Rendering Backends

- `canvas2d`
- `cpu_warp_debug`
- `webgl`

---

## Current Operation Types

- `radial_warp`
- `directional_warp`
- `line_warp`
- `region_warp`

---

## Current Appearance Filters

- `skin_smoothing`
- `skin_tone`

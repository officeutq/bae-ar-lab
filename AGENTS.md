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

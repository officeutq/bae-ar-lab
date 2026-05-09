# BAE AR Lab

BAE AR Lab is a standalone real-time beauty AR and face-warp algorithm experimentation platform built with Vite + React + TypeScript.

The project focuses on modular experimentation across:

- face landmark processing
- geometry extraction and region handling
- warp operation design
- appearance filter tuning
- JSON-serializable preset workflows

## Project Overview

This repository is for rapid iteration on beauty AR pipelines while keeping architecture decoupled between UI, algorithm definitions, geometry/math logic, and rendering backends.

## Current Features

- Camera input
- Source preview
- Processed preview
- MediaPipe Face Landmarker
- Landmark overlay
- Face geometry extraction
- Contour / region geometry
- Geometry binding
- Radial warp
- Directional warp
- Line warp
- Region warp
- Weight map / gradient influence
- WebGL renderer
- CPU debug backend
- Skin smoothing
- Skin tone correction
- Preset save/load/import/export
- Sample presets

## Architecture Overview

Current top-level responsibilities:

- `src/app`: app bootstrap and composition
- `src/app/hooks`: React hooks for state/control orchestration
- `src/engine/camera`: camera stream handling
- `src/engine/mediapipe`: MediaPipe Face Landmarker integration
- `src/engine/geometry`: face geometry and region/contour extraction
- `src/engine/algorithms`: algorithm operation pipeline and bindings
- `src/engine/math`: reusable math and interpolation utilities
- `src/engine/render`: renderer orchestration / backend selection
- `src/engine/webgl`: WebGL shader-based rendering implementation
- `src/engine/overlay`: landmark/geometry overlay drawing
- `src/engine/presets`: preset schema and persistence/import-export helpers
- `src/ui/panels`: control and preview panel UI
- `src/algorithms/presets`: built-in sample preset definitions
- `src/types`: shared type definitions

## Rendering Backends

The renderer currently supports:

- `canvas2d`
- `cpu_warp_debug`
- `webgl`

## Preset System

Presets are designed to remain JSON-serializable and portable.

Supported workflow:

- Save current configuration
- Load stored configuration
- Import preset JSON
- Export preset JSON

## Sample Presets

Built-in sample presets are provided under `src/algorithms/presets` for quick comparison and tuning of warp/filter behavior.

## [QA] current runtime behavior checklist

- [ ] Camera start / stop
- [ ] Source preview
- [ ] Processed preview
- [ ] WebGL renderer
- [ ] CPU warp debug
- [ ] Landmark overlay
- [ ] Warp visualization
- [ ] Preset save/load/export/import
- [ ] Sample preset switching
- [ ] Skin smoothing
- [ ] Skin tone
- [ ] Beauty intensity
- [ ] Animation playback
- [ ] Timeline scrub
- [ ] Keyframe add/delete/drag
- [ ] Temporal smoothing
- [ ] Face stability fade
- [ ] Pose attenuation
- [ ] Adaptive quality
- [ ] Snapshot capture
- [ ] Compare panel

## Development Commands

- Install dependencies: `npm install`
- Start development server: `npm run dev`
- Build production bundle: `npm run build`
- Lint: `npm run lint`
- Format: `npm run format`

# Section 3.3 — Visualisation & UI Components

## Snapshot Flow
- `useSimulationController` (see `src/hooks/useSimulationController.ts`) owns the `PipelineEngine`, maintains the latest `PipelineSnapshot`, and records per-cycle history.  
- The hook exposes control handlers (`step`, `togglePlay`, `stepBack`, `reset`, `loadProgramFromSource`) and derived state (`isPlaying`, `isHalted`, `speed`, `canStepBack`).  
- `src/pages/Index.tsx` consumes the controller and passes plain props to presentational components, keeping visual components stateless.

## Pipeline & Hazard Visuals
- `PipelineStage` now accepts badge data and renders opcode categories (ALU/MEM/BRANCH), stall/flush notices, and forwarding sources (`A←EX/MEM`, `B←MEM/WB`).  
- Stage borders switch colour for stall (`hazard-stall`) and forwarding (`hazard-forward`) events supplied by the snapshot.
- `ControlPanel` displays current status (Running / Ready / Halted) and exposes Play/Pause, Step, Back, Reset, and speed controls with history awareness.
- Hazard metrics (`stalledThisCycle`, `flushedThisCycle`, `forwarding`, `hazardEvents`) feed into stage badges and the performance panel for quick diagnosis.

## Back-Step History
- Every call to `step()` pushes the current snapshot and a serialised engine state onto a history stack before advancing.  
- “Back” pops the stack, restores the engine via `restoreState`, and rehydrates the previous snapshot without recomputing or mutating the original program.  
- History is cleared on reset or program load; the controller exposes `canStepBack` to disable the button when empty.

## Dark Mode
- `useTheme` (`src/hooks/useTheme.ts`) manages a `light`/`dark` theme flag, persists it with `localStorage`, and syncs with system preference changes.  
- `Header` includes a toggle button that updates the `<html>` `className`, allowing Tailwind’s `dark:` utilities to style backgrounds, borders, and text automatically.
- Most surfaces now lean on semantic Tailwind tokens (`bg-background`, `bg-card`, `text-foreground`, `border-border`) so dark mode adapts without manual overrides.




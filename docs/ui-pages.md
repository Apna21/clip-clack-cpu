# UI Pages & Routing Overview

- **Landing Page (`/`)**  
  Introduces the CPU Pipeline Simulator with a hero section, feature highlights, and a three-step usage guide.  
  Provides direct navigation to the simulator and tutorials while respecting light/dark themes.

- **Simulator Page (`/simulator`)**  
  Hosts the full interactive pipeline experience (pipeline stages, hazard badges, control panel, register/memory panels, metrics, help/about dialogs).  
  Uses `useSimulationController` for snapshot history and the new Back/Reset controls.  

- **Educational Content Page (`/learn`)**  
  Presents structured tutorials: pipeline intro, per-stage explanations, hazard descriptions, and guided examples with questions.  
  Encourages learners to open the simulator with contextual links.

- **Routing Structure**  
  `App.tsx` wraps routes with `AppLayout`, which renders the shared `NavigationBar`.  
  Routes:  
  - `/` → `LandingPage`  
  - `/simulator` → `SimulatorPage`  
  - `/learn` → `EducationalContentPage`  
  - `*` → `NotFound`

- **Global Navigation & Theme**  
  `NavigationBar` (in `AppLayout`) provides Home/Simulator/Tutorial links, highlights the active route, and exposes the dark-mode toggle backed by `useTheme`.



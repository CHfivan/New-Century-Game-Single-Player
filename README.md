# Century: Spice Road - Online Game

An online implementation of the Century: Spice Road board game using React, TypeScript, and Three.js.

## Prerequisites

- Node.js (v18 or higher)
- npm (comes with Node.js)

## Setup Instructions

1. **Install Node.js** (if not already installed):
   - Download from: https://nodejs.org/
   - Choose the LTS (Long Term Support) version
   - Run the installer and follow the prompts

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`

4. **Run Tests**:
   ```bash
   npm test
   ```

5. **Run Tests in Watch Mode**:
   ```bash
   npm run test:watch
   ```

## Project Structure

```
src/
├── engine/       # Core game logic (pure TypeScript)
├── state/        # State management (React Context/Reducers)
├── components/   # React UI components
├── 3d/          # React Three Fiber 3D components
├── types/       # TypeScript type definitions
└── test/        # Test utilities and setup
```

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **React Three Fiber** - React renderer for Three.js
- **Three.js** - 3D graphics library
- **Vitest** - Unit testing framework
- **fast-check** - Property-based testing library

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint

## Requirements

This implementation follows the requirements and design specifications in:
- `.kiro/specs/century-spice-road-game/requirements.md`
- `.kiro/specs/century-spice-road-game/design.md`
- `.kiro/specs/century-spice-road-game/tasks.md`

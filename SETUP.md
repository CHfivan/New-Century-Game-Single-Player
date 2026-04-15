# Project Setup Verification

This document helps verify that the Century: Spice Road project is set up correctly.

## ✅ Setup Checklist

### 1. Node.js Installation
Check if Node.js is installed:
```bash
node --version
```
Expected: v18.0.0 or higher

Check if npm is installed:
```bash
npm --version
```
Expected: 9.0.0 or higher

### 2. Install Dependencies
Run the following command in the project root:
```bash
npm install
```

This will install:
- **React & React DOM** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Three Fiber** (@react-three/fiber) - React renderer for Three.js
- **Drei** (@react-three/drei) - Useful helpers for R3F
- **Three.js** - 3D graphics
- **Vitest** - Testing framework
- **fast-check** - Property-based testing
- **@testing-library/react** - React testing utilities

### 3. Verify Project Structure
Ensure the following directories exist:
```
src/
├── engine/       ✓ Core game logic
├── state/        ✓ State management
├── components/   ✓ React components
├── 3d/          ✓ 3D rendering components
├── types/       ✓ TypeScript types
└── test/        ✓ Test utilities
```

### 4. Verify TypeScript Configuration
Check that `tsconfig.json` has strict mode enabled:
- ✓ `"strict": true`
- ✓ `"noUnusedLocals": true`
- ✓ `"noUnusedParameters": true`
- ✓ `"noFallthroughCasesInSwitch": true`
- ✓ `"noImplicitReturns": true`
- ✓ `"noUncheckedIndexedAccess": true`

### 5. Run Tests
Verify the test setup works:
```bash
npm test
```

Expected output:
- All tests should pass
- Should see tests for App component
- Should see property-based tests for setup verification

### 6. Start Development Server
Start the dev server:
```bash
npm run dev
```

Expected:
- Server starts on http://localhost:5173
- Browser opens showing "Century: Spice Road" title
- No console errors

### 7. Verify Build
Test the production build:
```bash
npm run build
```

Expected:
- Build completes successfully
- No TypeScript errors
- `dist/` folder is created

## 🔧 Troubleshooting

### Node.js Not Found
**Problem**: `node` or `npm` command not recognized

**Solution**:
1. Download Node.js from https://nodejs.org/
2. Install the LTS version
3. Restart your terminal/command prompt
4. Verify with `node --version`

### Installation Errors
**Problem**: `npm install` fails

**Solution**:
1. Delete `node_modules` folder (if exists)
2. Delete `package-lock.json` (if exists)
3. Run `npm install` again
4. If still failing, try `npm install --legacy-peer-deps`

### TypeScript Errors
**Problem**: TypeScript compilation errors

**Solution**:
1. Ensure all dependencies are installed
2. Check `tsconfig.json` is present
3. Run `npm run build` to see detailed errors
4. Verify all `.ts` and `.tsx` files have proper imports

### Test Failures
**Problem**: Tests fail to run

**Solution**:
1. Ensure `vitest` and `@testing-library/react` are installed
2. Check `vite.config.ts` has test configuration
3. Verify `src/test/setup.ts` exists
4. Run tests with verbose output: `npm test -- --reporter=verbose`

## 📋 Requirements Satisfied

This setup satisfies the following requirements from the specification:

- **Requirement 3.1**: Game Engine maintains single source of truth (structure ready)
- **Requirement 10.1**: Separation of game logic from presentation (directory structure)
- **Requirement 10.2**: Clear interfaces for player actions (structure ready)
- **Requirement 10.4**: Serializable game state support (TypeScript strict mode)

## 🎯 Next Steps

After verifying the setup:
1. Proceed to Task 2: Define core data types and interfaces
2. Implement game engine in `src/engine/`
3. Create type definitions in `src/types/`
4. Build React components in `src/components/`
5. Add 3D rendering in `src/3d/`

## 📚 Documentation

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/)
- [Vitest Documentation](https://vitest.dev/)
- [fast-check Documentation](https://fast-check.dev/)

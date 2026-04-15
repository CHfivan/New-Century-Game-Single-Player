# Toggle Buttons Complete Fix

## Date
January 10, 2026

## Problem Statement
User reported that toggle buttons were not working correctly:
1. **PlayerHand toggle button**: Was staying in middle of screen instead of moving with the hand
2. **OpponentPanel toggle button**: Was not visible at all
3. **Both buttons needed to be part of their panels** and move with them during animations
4. **OpponentPanel button should be on top-left-outside** of the panel (not top-right)

## Solution Overview
Redesigned both components to make toggle buttons integral parts of their panels that move together during show/hide animations.

## Implementation Details

### PlayerHand Component

**Approach**: Make the toggle button part of the container that slides up/down

**PlayerHand.tsx Changes**:
- Removed `@react-spring/web` animation (using CSS transitions instead)
- Added `hidden` class to container when `!isVisible`
- Button is now a child of the container (not separate)
- Removed unused imports (`useSpring`, `animated`, `cardAnimationConfig`)

**PlayerHand.css Changes**:
- Container: Added `transition: transform 0.3s ease` for smooth animation
- Container when hidden: `transform: translateX(-50%) translateY(100%)` (slides down)
- Button: Changed to `position: absolute` with `bottom: 100%` (sits above hand)
- Button: Removed fixed positioning and conditional bottom values
- Button: Simplified transition to only `background 0.2s ease`

**Behavior**:
- When visible: Hand at bottom of screen, button sits just above it
- When hidden: Entire container (hand + button) slides down off-screen
- Button moves with the hand at the same speed (0.3s ease transition)

### OpponentPanel Component

**Approach**: Make the toggle button part of the panel that slides left/right

**OpponentPanel.tsx Changes**:
- Removed inline `right` style from button (now handled by CSS)
- Panel always has a width (doesn't collapse to 0)
- When collapsed: panel uses `transform: translateX(100%)` to slide off-screen
- Updated `getPanelWidth()` to not take `isExpanded` parameter (always returns actual width)
- Updated `onWidthChange` callback to report 0 when collapsed, actual width when expanded

**OpponentPanel.css Changes**:
- Panel collapsed: `transform: translateX(100%)` (slides right off-screen)
- Panel expanded: `transform: translateX(0)` (visible)
- Button: `position: absolute` with `left: 0` and `transform: translateX(-100%)`
- Button: Positioned on left edge of panel, extending outward
- Button: Simplified transition to only `background 0.2s ease`
- Panel: `transition: transform 0.3s ease-in-out` for smooth animation

**Behavior**:
- When expanded: Panel visible on right side, button on its left edge (outside)
- When collapsed: Entire panel (content + button) slides right off-screen
- Button moves with the panel at the same speed (0.3s ease-in-out transition)
- Button is always visible at top-right corner of screen

## Key Design Principles

1. **Buttons are part of their panels**: Both buttons are positioned absolutely within their parent containers
2. **Synchronized movement**: Buttons move with their panels using the same CSS transition
3. **CSS-based animations**: Replaced React Spring with CSS transitions for simplicity and consistency
4. **Transform-based hiding**: Both panels use `transform` to slide off-screen (not `width: 0` or `display: none`)
5. **Consistent timing**: Both use 0.3s transitions for smooth, synchronized animations

## Testing Updates

**PlayerHand.test.tsx**:
- Updated tests to check for `hidden` class on container instead of transform on hand element
- Tests now verify class-based visibility instead of inline transform styles

**Results**: All 289 tests passing

## Files Modified
- `src/components/PlayerHand.tsx` - Removed React Spring, simplified to CSS transitions
- `src/components/PlayerHand.css` - Container-based transform animation
- `src/components/PlayerHand.test.tsx` - Updated to test class-based visibility
- `src/components/OpponentPanel.tsx` - Simplified button positioning
- `src/components/OpponentPanel.css` - Transform-based panel sliding

## Visual Behavior

### PlayerHand
```
Visible:                    Hidden:
┌─────────────┐            
│ ▼ Hide Hand │            
├─────────────┤            
│   [Cards]   │            
│   [Cards]   │            
└─────────────┘            
                           ┌─────────────┐
                           │ ▲ Show Hand │
                           └─────────────┘
```

### OpponentPanel
```
Expanded:                  Collapsed:
┌──┬──────────┐                      ┌──┐
│◀ │Opponents │                      │◀ │
│  │          │                      └──┘
│  │ Player 1 │
│  │ Player 2 │
└──┴──────────┘
```

## Browser Compatibility
- Uses standard CSS transforms and transitions
- No vendor prefixes needed for modern browsers
- Fallback: Buttons still functional even if transitions not supported

## Performance
- CSS transitions are GPU-accelerated
- More performant than JavaScript-based animations
- Simpler code with fewer dependencies

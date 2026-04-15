# Toggle Buttons Final Working Fix

## Date
January 10, 2026

## Problem
After previous attempts to fix toggle button positioning, two issues remained:
1. **PlayerHand toggle button**: Stayed in middle of screen instead of dropping to bottom when hand was hidden
2. **OpponentPanel toggle button**: Was not visible at all

## Root Causes

### PlayerHand Issue
- Button was using `position: absolute` with `bottom: 100%` which kept it relative to the container
- When the hand slid down (hidden), the button moved with it but stayed above the container
- Needed to use `position: fixed` with conditional bottom positioning based on visibility state

### OpponentPanel Issue
- Button was trying to use CSS custom property `--panel-width` that was never set
- The `right` position couldn't be calculated without the actual panel width value
- Needed to pass the panel width as inline styles to both the panel and button

## Solution

### PlayerHand Changes

**PlayerHand.tsx**:
- Added `hidden` class to container when `!isVisible`
- This allows CSS to target the hidden state

**PlayerHand.css**:
- Changed button from `position: absolute` to `position: fixed`
- Set `bottom: 180px` by default (above visible hand)
- Added `.player-hand-container.hidden .hand-toggle` rule with `bottom: 0` (at screen bottom when hidden)
- Added mobile adjustment: `bottom: 130px` for smaller hand height

### OpponentPanel Changes

**OpponentPanel.tsx**:
- Calculate `panelWidth` using `getPanelWidth(isExpanded)` at render time
- Pass width as inline style to panel: `width: isExpanded ? ${panelWidth}px : 0`
- Pass right position as inline style to button: `right: isExpanded ? ${panelWidth}px : 0`

**OpponentPanel.css**:
- Removed CSS custom property `--panel-width` references
- Removed `.opponent-panel.collapsed .panel-toggle` rule (now handled inline)
- Added comment that width and right position are set via inline styles

## Behavior

### PlayerHand Toggle Button
- **When hand is visible**: Button appears at fixed position 180px from bottom (130px on mobile)
- **When hand is hidden**: Button drops to bottom of screen (0px from bottom)
- Button always stays horizontally centered

### OpponentPanel Toggle Button
- **When panel is expanded**: Button appears at top-right, positioned at the left edge of the panel
- **When panel is collapsed**: Button appears at top-right corner of screen (right: 0)
- Button always stays at top: 20px
- Panel width adjusts based on screen size (250px mobile, 280px tablet, 300px desktop)

## Testing
- All 289 tests passing
- Manual testing required to verify visual behavior on different screen sizes

## Files Modified
- `src/components/PlayerHand.tsx`
- `src/components/PlayerHand.css`
- `src/components/OpponentPanel.tsx`
- `src/components/OpponentPanel.css`

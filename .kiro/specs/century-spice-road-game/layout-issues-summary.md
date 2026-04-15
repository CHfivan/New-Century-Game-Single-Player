# Layout Issues Summary

## Date
January 10, 2026

## Issues Reported

1. ✅ **Show hand button works correctly now**
2. ⚠️ **Still cannot see opponent panel toggle button** - FIXED
3. ❌ **No merchant card and victory point cards are showing**
4. ❌ **You should not need to scroll up and down the screen**
5. ❌ **Everything should be show within the default screen size**
6. ❌ **Player's caravan should be on the bottom left corner of the screen and shall always be visible**

## Fixes Applied

### Issue #2: Opponent Panel Toggle Button
**Status**: FIXED

**Problem**: Button was part of the panel and sliding off-screen with it

**Solution**:
- Made button a separate fixed element (not part of panel)
- Button position transitions smoothly: `right: ${panelWidth}px` when expanded, `right: 0` when collapsed
- Button always visible at top-right corner
- Added transition: `right 0.3s ease-in-out`

**Files Modified**:
- `src/components/OpponentPanel.tsx` - Button now rendered outside panel div
- `src/components/OpponentPanel.css` - Button uses fixed positioning with inline right value

## Remaining Issues

### Issue #3: No Merchant/Point Cards Showing
**Problem**: The merchant card row and point card row are in the game state but not rendered in the UI

**Current State**: 
- `state.merchantCardRow` and `state.pointCardRow` exist
- Demo.tsx shows counts but not the actual cards
- Need to create visual card rows in the center of the screen

**Solution Needed**:
- Create MerchantCardRow component to display available merchant cards
- Create PointCardRow component to display available point cards
- Position them in the center area of the game board
- Make them clickable for acquiring cards

### Issue #4-5: Scrolling Required / Not Fitting Screen
**Problem**: The demo-container content is too tall, requiring vertical scrolling

**Current State**:
- Demo.tsx renders a lot of debug information in the center
- Player caravan, hand details, played cards, point cards all in center
- This pushes content beyond viewport height

**Solution Needed**:
- Remove or minimize debug information
- Move player caravan to bottom-left (fixed position)
- Keep only essential game board elements in center
- Use fixed positioning for UI panels to avoid affecting layout flow

### Issue #6: Player Caravan Not in Bottom-Left
**Problem**: Player caravan is currently in the center content area, not fixed in bottom-left

**Current State**:
- Caravan rendered inside demo-container
- Part of scrollable content
- Not always visible

**Solution Needed**:
- Create PlayerCaravan component with fixed positioning
- Position at bottom-left: `position: fixed; bottom: 200px; left: 20px;`
- Make it always visible (z-index above game board)
- Show only the caravan grid, not full player details

## Recommended Next Steps

1. **Create Card Row Components**:
   - `src/components/MerchantCardRow.tsx` - Display merchant cards
   - `src/components/PointCardRow.tsx` - Display point cards
   - Position in center of screen, horizontally

2. **Create Fixed Player Caravan Component**:
   - `src/components/PlayerCaravan.tsx` - Fixed bottom-left
   - Show only caravan grid and spice count
   - Always visible

3. **Simplify Demo.tsx**:
   - Remove debug sections (game-info, player-section details)
   - Keep only: card rows in center
   - All UI elements should be fixed positioned panels

4. **Layout Structure**:
   ```
   Fixed Elements:
   - Top-left: Score/Turn indicator
   - Top-center: Turn indicator
   - Top-right: Hamburger menu, Opponent panel toggle
   - Right: Opponent panel
   - Bottom-left: Player caravan (always visible)
   - Bottom-center: Player hand (collapsible)
   - Bottom-right: Action buttons
   
   Center (scrollable if needed):
   - Merchant card row
   - Point card row
   ```

## Testing
All 289 tests passing after opponent panel button fix.

# Implementation Plan: Century Spice Road Online Game

## Overview

This implementation plan breaks down the Century: Spice Road game into incremental development tasks. The approach follows a bottom-up strategy: building core game logic first, then state management, followed by UI components, 3D rendering, and finally integration. Each task builds on previous work, ensuring continuous validation through testing.

The plan prioritizes comprehensive testing throughout development to ensure correctness at every stage. All tasks including property-based tests are required for a robust implementation.

## Tasks

- [x] 1. Project setup and core infrastructure
  - Initialize React + TypeScript project with Vite
  - Install dependencies: React Three Fiber (@react-three/fiber, @react-three/drei), Three.js, fast-check, vitest
  - Set up project structure: src/engine, src/state, src/components, src/3d, src/types
  - Configure TypeScript with strict mode
  - Set up Vitest for testing
  - _Requirements: 3.1, 10.1_

- [x] 2. Define core data types and interfaces
  - Create TypeScript interfaces for GameState, Player, SpiceCollection, MerchantCard, PointCard, GameAction
  - Define card effect types: SpiceEffect, ConversionEffect, ExchangeEffect
  - Create GameConfig interface with default configuration
  - Define action types and payloads
  - _Requirements: 3.1, 3.4, 10.4_

- [x] 3. Create card data definitions
  - Create JSON file with all merchant card definitions (spice cards, conversion cards, exchange cards)
  - Create JSON file with all point card definitions
  - Implement card loader utility to parse JSON into typed objects
  - Add placeholder image URLs for all cards
  - Create formatCardEffect() utility function to convert cards to text representation
  - _Requirements: 1.3, 1.4, 11.1, 11.2, 7.13_

- [x] 4. Implement game initialization logic
  - [x] 4.1 Create GameEngine.createGame() method
    - Accept parameters: playerCount, aiCount, aiDifficulty
    - Shuffle and deal point cards (5 face-up, rest in deck)
    - Shuffle and deal merchant cards (6 face-up, rest in deck)
    - Initialize players with starting cards and spices based on turn order
    - Set AI difficulty level for each AI player
    - Set up coin pools (5 gold, 10 silver)
    - Randomly determine starting player
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 4.2 Write property test for game initialization
    - **Property 1: Game Initialization Creates Valid Setup**
    - **Validates: Requirements 1.1, 1.4, 1.5**

- [x] 5. Checkpoint - Verify game initialization
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement core game actions
  - [x] 6.1 Implement all action logic (play card, acquire, rest, claim point card)
    - Implemented executePlayCard() for spice, conversion, and exchange cards
    - Implemented executeAcquireCard() for acquiring merchant cards
    - Implemented executeRest() for returning played cards to hand
    - Implemented executeClaimPointCard() for claiming point cards with coin awards
    - Implemented validateAction() dispatcher and all validation methods
    - All existing tests passing (59/59)
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 3.2, 3.5, 4.3_

  - [x] 6.2 Write property test for spice card effects
    - **Property 3: Spice Card Effects Are Additive** ✓
    - **Validates: Requirements 2.2, 4.3**

  - [x] 6.3 Write property test for conversion
    - **Property 4: Conversion Follows Value Chain** ✓
    - **Validates: Requirements 2.3**

  - [x] 6.4 Write property test for exchange cards
    - **Property 5: Exchange Cards Are Repeatable** ✓
    - **Validates: Requirements 2.4**

  - [x] 6.5 Write property tests for card acquisition
    - **Property 6: Acquire Cost Equals Left Position** ✓
    - **Property 7: Card Rows Maintain Size** ✓
    - **Validates: Requirements 2.5, 2.6, 2.9**

  - [x] 6.6 Write property test for rest action
    - **Property 8: Rest Returns All Played Cards** ✓
    - **Validates: Requirements 2.7**

  - [x] 6.7 Write property tests for scoring
    - **Property 9: Scoring Requires Exact Spices** ✓
    - **Property 10: Coin Awards Follow Position Rules** ✓
    - **Validates: Requirements 2.8, 2.10, 2.11, 2.12**

- [x] 7. Implement action validation and state management
  - [x] 7.1 Create GameEngine.validateAction() method
    - Check if action is valid for current game state
    - Validate player turn, resource availability, caravan capacity
    - Return validation result with error messages
    - _Requirements: 3.2, 3.5_

  - [x] 7.2 Create GameEngine.executeAction() method
    - Validate action first
    - Apply state changes immutably
    - Track statistics for the action (cubes gained/spent, cards played, etc.)
    - Return new game state or throw error
    - _Requirements: 3.2, 3.5, 17.12_

  - [x] 7.3 Write property test for invalid actions
    - **Property 11: Invalid Actions Preserve State**
    - **Validates: Requirements 3.2, 3.5**

  - [x] 7.4 Implement GameEngine.getAvailableActions()
    - Return list of all valid actions for current player
    - _Requirements: 2.1_

  - [x] 7.5 Write property test for action exclusivity
    - **Property 2: Turn Actions Are Mutually Exclusive**
    - **Validates: Requirements 2.1**

  - [x] 7.6 Create StatisticsTracker utility
    - Implement recordCubeGain(), recordCubeSpend()
    - Implement recordCardPlay(), recordCardAcquisition(), recordRest()
    - Implement startTurn(), endTurn() for timing tracking
    - Implement calculation methods (efficiency, averages, most used card)
    - _Requirements: 17.12_

- [x] 8. Implement caravan management
  - [x] 8.1 Create caravan capacity enforcement
    - Check total spices ≤ 10 after each action
    - Trigger discard flow if over capacity
    - _Requirements: 4.1, 4.2_

  - [x] 8.2 Write property tests for caravan capacity
    - **Property 13: Caravan Capacity Enforced**
    - **Property 14: Excess Spices Trigger Discard**
    - **Validates: Requirements 4.1, 4.2**

  - [x] 8.3 Write property test for unlimited supply
    - **Property 15: Spice Supply Is Unlimited**
    - **Validates: Requirements 4.5**

- [x] 9. Checkpoint - Verify core game logic
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Write unit tests for statistics tracking
  - Test recordCubeGain() and recordCubeSpend()
  - Test recordCardPlay() and card usage counting
  - Test recordCardAcquisition() and recordRest()
  - Test turn timing tracking (startTurn/endTurn)
  - Test efficiency calculations
  - Test average calculations (value per turn, time per turn)
  - Test getMostUsedCard()
  - _Requirements: 17.12_

- [x] 11. Implement victory conditions and scoring
  - [x] 11.1 Create GameEngine.isGameOver() method
    - Check if any player has reached victory card threshold (5 for 2-3 players, 6 for 4-5 players)
    - Ensure current round completes before ending
    - _Requirements: 5.1_

  - [x] 11.2 Write property test for victory threshold
    - **Property 16: Victory Threshold Triggers End Game**
    - **Validates: Requirements 5.1**

  - [x] 11.3 Create GameEngine.calculateFinalScores() method
    - Sum point card values + (gold coins × 3) + (silver coins × 1) + non-yellow spice counts
    - Apply tiebreaker (later turn order wins)
    - Return sorted players by score
    - _Requirements: 5.2, 5.3_

  - [x] 11.4 Write property tests for scoring
    - **Property 17: Final Score Calculation Is Correct**
    - **Property 18: Tiebreaker Favors Later Players**
    - **Validates: Requirements 5.2, 5.3**

- [x] 12. Implement state serialization
  - [x] 12.1 Create GameEngine.serializeState() method
    - Convert GameState to JSON string
    - _Requirements: 3.4, 10.4, 13.1_

  - [x] 12.2 Create GameEngine.deserializeState() method
    - Parse JSON string back to GameState
    - Validate deserialized state
    - _Requirements: 3.4, 10.4, 13.2_

  - [x] 12.3 Write property test for serialization
    - **Property 12: State Serialization Round-Trip**
    - **Validates: Requirements 3.4, 13.1, 13.2, 13.3, 13.4**

- [x] 13. Implement React state management
  - Create GameContext with useReducer
  - Define state actions: INIT_GAME, EXECUTE_GAME_ACTION, END_TURN, LOAD_GAME, SAVE_GAME, BEGIN_ACTION, CANCEL_ACTION, COMMIT_ACTION
  - Implement gameReducer to handle all actions including state snapshot/restore
  - Create GameProvider component
  - Add local storage persistence hooks
  - _Requirements: 3.1, 3.3, 10.2, 13.1, 13.2, 13.3, 15.1, 15.3_

- [x] 14. Write unit tests for state management
  - Test reducer with each action type
  - Test state persistence to local storage
  - Test state loading from local storage
  - Test BEGIN_ACTION creates state snapshot
  - Test CANCEL_ACTION restores from snapshot
  - Test COMMIT_ACTION clears snapshot
  - _Requirements: 3.1, 13.1, 13.2, 15.1, 15.3_

- [x] 15. Checkpoint - Verify state management
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Create basic UI components (2D React)
  - [x] 16.1 Create HamburgerMenu component
    - Display hamburger icon at top right corner
    - Show overlay menu with "Game Rules" and "Restart Game" options
    - Add close button (X icon) to overlay
    - Handle menu open/close state
    - _Requirements: 16.1, 16.2, 16.3, 16.4_

  - [x] 16.2 Create PlayerHand component
    - Display cards in hand at bottom of screen
    - Stack cards showing 80% of left side
    - Add toggle button to hide/show hand
    - Handle card click events
    - _Requirements: 7.1, 7.2, 7.6, 11.1_

  - [x] 16.3 Create OpponentPanel component
    - Display opponent info in collapsible right panel
    - Show player name for each opponent
    - Show opponent caravan (spice cubes)
    - Show current score
    - Show coins collected (gold and silver with icons)
    - Display card count symbols: hand size (🃏), played cards (📋), point cards (⭐)
    - Make played cards symbol interactive (hover on desktop, click on mobile)
    - Notify parent component of panel width changes for layout adjustment
    - _Requirements: 7.7, 7.8, 7.9, 7.10, 7.11, 7.12, 7.13_

  - [x] 16.4 Create PlayedCardsOverlay component
    - Display overlay window when played cards symbol is hovered/clicked
    - Show played merchant cards as text-based effects (not full card images)
    - Format spice cards as letters: Y (yellow), R (red), G (green), B (brown)
    - Format conversion cards as upgrade arrows: ↑ (one per upgrade)
    - Format exchange cards as: "YYYY → GG" (input → output)
    - Display each effect in a rectangular box
    - Arrange effects in vertical list within columns
    - Use CSS Grid with auto-fill for responsive multi-column layout
    - Adjust column count based on screen size (more columns on larger screens)
    - Add close button for mobile
    - Auto-hide on mouse leave (desktop) or close button click (mobile)
    - _Requirements: 7.12, 7.13, 7.14, 7.15_

  - [x] 16.5 Implement game board layout adjustment
    - Create GameBoardContainer wrapper component
    - Calculate board offset based on opponent panel width
    - Shift game board left when opponent panel opens (translateX)
    - Return board to center when opponent panel closes
    - Add smooth transition animation (0.3s ease-in-out)
    - Ensure merchant cards, point cards, and caravans remain fully visible
    - _Requirements: 7.8, 7.9_

  - [x] 16.6 Create TurnIndicator component
    - Show current player name and turn number
    - Display "Your Turn" or "AI Thinking" message
    - _Requirements: 12.1, 12.3_

  - [x] 16.7 Create ActionButtons component
    - Display "End Turn" button
    - Disable during AI turns
    - _Requirements: 12.2, 12.5_

  - [x] 16.8 Create ScoreDisplay component
    - Show current scores for all players
    - Highlight current player
    - _Requirements: 5.4_

- [x] 16.9 Create CaravanGrid component for visual spice representation
  - [x] 16.9.1 Implement CaravanGrid component
    - Create grid layout with 2 rows of 5 boxes each (10 total)
    - Convert SpiceCollection to ordered array (yellow, red, green, brown)
    - Fill boxes left-to-right, top row first, then bottom row
    - Display filled boxes with appropriate spice colors
    - Display empty boxes as outlined transparent boxes
    - Add smooth transitions when spices change
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

  - [x] 16.9.2 Integrate CaravanGrid into Demo and OpponentPanel
    - Replace text-based caravan display with CaravanGrid in Demo
    - Replace text-based caravan display with CaravanGrid in OpponentPanel
    - Ensure grid updates immediately when caravan state changes
    - Test with different spice combinations
    - _Requirements: 19.6, 19.7, 19.8_

  - [x] 16.9.3 Write property test for caravan grid visualization
    - **Property 21: Caravan Grid Displays Correct Spice Order**
    - **Validates: Requirements 19.1, 19.2, 19.3, 19.4, 19.5**

  - [x] 16.9.4 Write unit tests for CaravanGrid component
    - Test grid renders 10 boxes (2 rows × 5 columns)
    - Test spices fill in correct order (Y, R, G, B)
    - Test spices fill left-to-right, top-to-bottom
    - Test correct number of filled vs empty boxes
    - Test correct colors for each spice type
    - Test empty boxes have transparent background
    - Test grid updates when caravan prop changes
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.8_

- [x] 17. Write unit tests for UI components
  - Test HamburgerMenu open/close functionality
  - Test menu overlay display
  - Test rules and restart options
  - Test PlayerHand rendering and interactions
  - Test OpponentPanel collapse/expand
  - Test OpponentCard display with all information (name, caravan, score, coins, card counts)
  - Test PlayedCardsOverlay show/hide on hover and click
  - Test formatCardEffect() utility for all card types (spice, conversion, exchange)
  - Test card effect text formatting (Y, R, G, B for spices, ↑ for upgrades, → for exchanges)
  - Test multi-column layout responsiveness
  - Test card count symbols display correctly
  - Test game board layout adjustment when opponent panel opens/closes
  - Test board shift animation and positioning
  - Test TurnIndicator display logic
  - Test ActionButtons enable/disable states
  - _Requirements: 7.1, 7.2, 7.7, 7.8, 7.9, 7.10, 7.11, 7.12, 7.13, 7.14, 7.15, 12.1, 16.1, 16.2_

- [x] 18. Create 3D rendering components (React Three Fiber)
  - [x] 18.1 Create Card3D component
    - Render card as 3D plane with texture
    - Add hover effects (scale up on hover)
    - Handle click events
    - Support position, rotation, scale props
    - _Requirements: 8.1, 11.6_

  - [x] 18.2 Create SpiceCube3D component
    - Render spice as 3D cube with appropriate color
    - Support position and animation props
    - _Requirements: 8.1, 8.4_

  - [x] 18.3 Create MerchantCardRow3D component
    - Arrange 6 merchant cards in horizontal row
    - Position cards in 3D space
    - Handle card selection
    - _Requirements: 7.3, 8.1_

  - [x] 18.4 Create PointCardRow3D component
    - Arrange 5 point cards in horizontal row
    - Display coin indicators above cards
    - Handle card selection
    - _Requirements: 7.4, 8.1_

  - [x] 18.5 Create PlayerCaravan3D component
    - Display spice cubes in player's caravan
    - Position at bottom left, always visible
    - Group cubes by type
    - _Requirements: 7.5, 8.1_

  - [x] 18.6 Create GameBoard3D component
    - Set up Three.js scene with camera and lighting
    - Compose all 3D components
    - Configure camera for optimal view
    - _Requirements: 8.1, 8.4_

- [x] 19. Write unit tests for 3D components
  - Test Card3D rendering and props
  - Test SpiceCube3D color mapping
  - Test card row layouts
  - _Requirements: 8.1_

- [x] 20. Implement animations
  - [x] 20.1 Create AnimationLayer component and animation infrastructure
    - Create a fixed-position overlay component that renders animated clones (cards, cubes) on top of the game
    - Implement useAnimationQueue hook to manage sequential and parallel animations
    - Define animation types: CardFly (move card from A to B with fade), CubeMove (move spice cube from A to B), SlideLeft (shift cards left in a row), FadeIn (new card appears from deck), Shake (error feedback)
    - All animations use CSS transforms/opacity for GPU acceleration and 60 FPS
    - All animations complete within 500ms
    - _Requirements: 8.2, 8.5, 14.5_

  - [x] 20.2 Implement play card animation
    - When human player plays a card, animate a clone of the card flying from its hand position toward the left side of the screen above the "Play Card" button
    - Card fades out (opacity 0) as it reaches the destination
    - State update (card removal from hand) happens after animation completes
    - _Requirements: 14.1_

  - [x] 20.3 Implement card acquisition and claim animations
    - When human player acquires a merchant card, animate the card moving from the merchant row toward the player's hand area and fading out
    - When human player claims a point card, animate the card moving toward the player's hand area and fading out
    - When AI opponent acquires a merchant card or claims a point card, animate the card moving toward the opponent's caravan area in the opponent panel and fading out
    - _Requirements: 14.3, 14.6_

  - [x] 20.4 Implement card row slide and deck draw animations
    - When a card is taken from the merchant or point row, animate remaining cards sliding left one by one to fill the gap
    - Animate a new card fading in from the deck position at the far right of the row
    - _Requirements: 14.7_

  - [x] 20.5 Implement spice cube movement animations
    - When spices are placed on merchant cards during acquisition payment, animate cubes moving from caravan to the target merchant cards
    - When bonus spices are collected from an acquired card, animate cubes moving from the merchant card to the player's caravan
    - When spices are spent to claim a point card, animate cubes moving from caravan toward the point card
    - _Requirements: 8.3, 14.2_

  - [x] 20.6 Implement error feedback animations
    - When an invalid action is attempted, apply a shake animation to the relevant element (e.g., the action button or the selected card)
    - Add a brief red highlight/flash on the element
    - _Requirements: 14.4_

  - [x] 20.7 Optimize animation performance
    - Ensure all animations use transform and opacity only (GPU-composited properties)
    - Test on mobile to verify 60 FPS
    - Add will-change hints where appropriate
    - Ensure animations don't block user interaction after completion
    - _Requirements: 8.5, 14.5_

- [x] 21. Checkpoint - Verify rendering and animations
  - Ensure all tests pass, ask the user if questions arise.

- [x] 22. Implement AI opponent system
  - [x] 22.1 Create AIPlayer class with difficulty levels
    - Implement evaluateActions() to score all available actions
    - Implement scoreAction() with strategy heuristics for Medium difficulty
    - Implement selectBestAction() to choose highest-scored action
    - Implement Easy difficulty: select random valid action
    - Implement Hard difficulty: advanced strategy with opponent blocking
    - _Requirements: 6.1, 6.4_

  - [x] 22.2 Integrate AI into game loop
    - Detect when it's AI turn
    - Execute AI action based on selected difficulty level
    - Add 1-2 second delay for AI actions
    - Animate AI actions clearly
    - _Requirements: 6.2, 6.5_

  - [x] 22.3 Write property test for AI validity
    - **Property 19: AI Actions Are Valid**
    - **Validates: Requirements 6.3**

- [x] 23. Write unit tests for AI system
  - Test action evaluation logic for each difficulty
  - Test Easy difficulty produces random valid actions
  - Test Medium difficulty uses strategic scoring
  - Test Hard difficulty considers opponent blocking
  - Test action selection
  - Test AI turn execution timing
  - _Requirements: 6.2, 6.4_

- [x] 24. Implement mobile orientation handling
  - [x] 24.1 Create MobileOrientationHandler component
    - Detect mobile devices via user agent
    - Check current orientation (portrait vs landscape)
    - Display orientation prompt in portrait mode
    - _Requirements: 9.2_

  - [x] 24.2 Implement fullscreen and orientation lock
    - Add "Start Game" button that triggers fullscreen API
    - Lock orientation to landscape using Screen Orientation API
    - Handle API failures gracefully
    - _Requirements: 9.2, 9.3_

  - [x] 24.3 Add responsive layout adjustments
    - Defineple breakpoints for mobile, tablet, desktop
    - Scale card sizes and UI elements appropriately
    - Adjust touch target sizes for mobile (minimum 44x44px)
    - _Requirements: 9.1, 9.4, 9.5, 9.6_

- [x] 25. Write unit tests for orientation handling
  - Test mobile detection
  - Test orientation detection
  - Test responsive layout adjustments
  - _Requirements: 9.1, 9.2_

- [x] 26. Implement card display enhancements
  - [x] 26.1 Design card layout structure
    - Create card template with image area (majority of card)
    - Add effect display area (left side, 2 columns max, light background)
    - Add cost display area (bottom row, thin light bar for point cards)
    - _Requirements: 11.3, 11.4, 11.5_

  - [x] 26.2 Create card image assets
    - Generate or source placeholder images for all cards
    - Optimize images for web (compress, appropriate resolution)
    - _Requirements: 11.5_

  - [x] 26.3 Implement card hover effects
    - Enlarge card on hover
    - Add highlight border
    - Show detailed tooltip if needed
    - _Requirements: 7.8, 11.6_

- [x] 27. Implement game flow and turn management
  - [x] 27.1 Create turn progression logic
    - Advance to next player after action + end turn
    - Handle clockwise turn order
    - Trigger AI turns automatically
    - _Requirements: 12.4_

  - [x] 27.2 Add action validation UI feedback
    - Disable invalid action buttons
    - Show error messages for invalid actions
    - Provide clear feedback on what's required
    - _Requirements: 7.9_

  - [x] 27.3 Implement multi-step action UI with cancellation
    - Create modal/dialog for conversion card decisions (which spices to upgrade, how many times)
    - Create modal/dialog for exchange card decisions (how many times to exchange)
    - Create modal/dialog for discard selection when caravan overflows
    - Add "Cancel" and "Confirm" buttons to all multi-step action dialogs
    - Dispatch BEGIN_ACTION when dialog opens
    - Dispatch CANCEL_ACTION when Cancel button clicked
    - Dispatch COMMIT_ACTION when Confirm button clicked
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [x] 27.4 Write property test for action cancellation
    - **Property 20: Action Cancellation Preserves State**
    - **Validates: Requirements 15.1, 15.3, 15.4**

  - [x] 27.5 Implement discard flow for caravan overflow
    - Detect when caravan exceeds 10 spices
    - Show discard UI allowing player to select spices to remove
    - Include Cancel button to abort the action that caused overflow
    - Prevent turn end until caravan is valid or action is cancelled
    - _Requirements: 4.2, 15.1, 15.2_

- [x] 28. Checkpoint - Verify complete game flow
  - Ensure all tests pass, ask the user if questions arise.

- [x] 29. Add accessibility features
  - Add ARIA labels to all interactive elements
  - Ensure sufficient color contrast (WCAG AA)
  - Implement keyboard navigation for desktop
  - Add tooltips and help text
  - Ensure Cancel buttons are keyboard accessible
  - Ensure hamburger menu is keyboard accessible
  - _Requirements: 18.1, 18.2, 18.3_

- [x] 30. Write accessibility tests
  - Test keyboard navigation
  - Test ARIA labels
  - Test color contrast
  - Test Cancel button accessibility
  - Test hamburger menu accessibility
  - _Requirements: 18.1, 18.2, 18.3_

- [x] 31. Create main menu and game setup
  - [x] 31.1 Create MainMenu component
    - Add "New Game" button
    - Add "Load Game" button (if saved game exists)
    - Add "Rules" button
    - _Requirements: 13.2_

  - [x] 31.2 Create NewGameDialog component
    - Allow selecting total number of players (2-5 players: 1 human + 1-4 AI opponents)
    - Allow selecting AI difficulty level (Easy, Medium, Hard)
    - Show game setup preview with player count and difficulty
    - Start game on confirmation
    - _Requirements: 6.1_

  - [x] 31.3 Create rules reference modal
    - Display game rules and card explanations
    - Make accessible from main menu and during game
    - _Requirements: 18.4_

- [ ] 32. Create end-game statistics screen
  - [ ] 32.1 Install charting library
    - Add Chart.js or Recharts to project dependencies
    - Configure for React integration
    - _Requirements: 17.1_

  - [ ] 32.2 Create EndGameScreen component
    - Display final scores panel
    - Add tabs for "Scores" and "Statistics"
    - _Requirements: 17.1_

  - [ ] 32.3 Create StatisticsPanel component with bar graphs
    - Create bar graph for total cube gain by color (item 1)
    - Create bar graph for total cube spent (item 2)
    - Create bar graph for conversion efficiency (item 3)
    - Create bar graph for merchant cards played (item 4)
    - Create bar graph for rest actions (item 5)
    - Create bar graph for merchant cards acquired (item 6)
    - Create bar graph for average value per turn (item 7)
    - Create bar graph for average time per turn (item 8)
    - _Requirements: 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8, 17.9_

  - [ ] 32.4 Create MostUsedCards display
    - Show most frequently used card for each player
    - Display card image with usage count
    - _Requirements: 17.10_

  - [ ] 32.5 Create PointProgressionGraph component
    - Create line graph with turns on x-axis and points on y-axis
    - Display one line per player showing point progression
    - Add legend with player names/colors
    - _Requirements: 17.11_

- [x] 33. Implement game persistence
  - Add auto-save on every state change
  - Add "Resume Game" option on app load
  - Clear saved state when game ends
  - Handle corrupted save data gracefully
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [x] 34. Write integration tests
  - Test complete game flow from setup to victory
  - Test AI turn execution
  - Test card acquisition sequence
  - Test scoring and victory conditions
  - Test hamburger menu functionality
  - Test end-game statistics display
  - _Requirements: 2.1, 5.1, 5.2, 6.2, 16.1, 17.1_

- [x] 35. Performance optimization
  - Implement object pooling for spice cubes
  - Add memoization to expensive computations
  - Optimize re-renders with React.memo
  - Profile and optimize Three.js rendering
  - Optimize statistics calculations
  - _Requirements: 8.5_

- [x] 36. Final integration and polish
  - Wire all components together in App.tsx
  - Add loading states and transitions
  - Test on multiple devices and browsers
  - Fix any remaining bugs
  - Add final visual polish
  - _Requirements: All_

- [x] 37. Final checkpoint - Complete testing
  - Run full test suite
  - Test on desktop (Chrome, Firefox, Safari)
  - Test on mobile (iOS Safari, Android Chrome)
  - Verify all requirements are met
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including property-based tests and unit tests are required for comprehensive quality assurance
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout development
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- The implementation follows a bottom-up approach: core logic → state → UI → 3D → integration
- Testing is integrated throughout to catch issues early

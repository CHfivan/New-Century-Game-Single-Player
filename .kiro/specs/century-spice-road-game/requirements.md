# Requirements Document

## Introduction

This document outlines requirements for an online implementation of Century: Spice Road, a card-based trading game. The initial version focuses on single-player gameplay against AI opponents, with architecture designed to support future multiplayer functionality. The game uses React for UI and Three.js for 3D rendering, with responsive design supporting both desktop and mobile devices in landscape orientation.

## Glossary

- **Game_System**: The complete Century: Spice Road online game application
- **Game_Engine**: Core game logic managing state, rules, and turn progression
- **UI_Layer**: React-based user interface components
- **Render_Engine**: Three.js-based 3D rendering system
- **Player**: Human user or AI opponent participating in the game
- **Caravan**: Player's storage area holding up to 10 spice cubes
- **Merchant_Card**: Playable card that performs spice, conversion, or exchange actions
- **Point_Card**: Victory point card that players claim by spending spices
- **Spice**: Game resource in four types (turmeric/yellow, saffron/red, cardamom/green, cinnamon/brown)
- **Hand**: Collection of merchant cards available to a player
- **Played_Card**: Merchant cards that have been played by a player and placed face-up in their play area, which can be retrieved when the player rests
- **Coins**: Bonus tokens awarded with early point cards; gold coins worth 3 points, silver coins worth 1 point at game end
- **AI_Opponent**: Computer-controlled player following game rules
- **Game_Room**: Future multiplayer session where players can join and play together
- **Orientation_Manager**: System component managing screen orientation and fullscreen mode

## Requirements

### Requirement 1: Game Setup and Initialization

**User Story:** As a player, I want the game to initialize with proper setup, so that I can start playing according to official rules.

#### Acceptance Criteria

1. WHEN the game initializes, THE Game_Engine SHALL create a deck of point cards, shuffle them, display 5 face-up in a row, and place the remaining deck next to the 5th card on the right
2. WHEN point cards are displayed, THE Game_Engine SHALL place a stack of 5 gold coins above the leftmost card and 2 stacks of 5 silver coins (total 10 coins) above the second card
3. WHEN the game starts, THE Game_Engine SHALL give each player 2 starting merchant cards (one "2 Turmeric" card and one "Upgrade 2" card)
4. WHEN merchant cards are initialized, THE Game_Engine SHALL shuffle the deck of merchant cards, display 6 face-up in a row, and place the remaining deck next to the 6th card on the right
5. WHEN the game begins, THE Game_Engine SHALL randomly determine the start player and establish clockwise turn order
6. WHEN players are initialized, THE Game_Engine SHALL give the first player 3 yellow turmeric cubes, the second and third players 4 yellow turmeric cubes each, and the fourth and fifth players 4 yellow turmeric cubes and 1 red saffron cube each

### Requirement 2: Core Gameplay Actions

**User Story:** As a player, I want to perform game actions on my turn, so that I can progress toward victory.

#### Acceptance Criteria

1. WHEN it is a player's turn, THE Game_Engine SHALL allow exactly one of four actions: play card, acquire card, rest, or score
2. WHEN a player plays a spice card, THE Game_Engine SHALL add the depicted spices to the player's caravan
3. WHEN a player plays a conversion card, THE Game_Engine SHALL allow upgrading spices to the next higher value (yellow→red→green→brown) the number of times shown (example: with 2 yellow cubes and an "Upgrade 2" card, the player can upgrade 1 yellow to 1 green, or upgrade 2 yellow to 2 red)
4. WHEN a player plays an exchange card, THE Game_Engine SHALL allow trading specified input spices for output spices multiple times if resources permit
5. WHEN a player acquires a merchant card, THE Game_Engine SHALL require placing one spice on each card to the left, then add the selected card and any spices on it to the player's hand
6. WHEN a merchant card is acquired, THE Game_Engine SHALL slide all cards to the right of the acquired card leftward to fill the gap, then draw and place a new card face-up in the rightmost position
7. WHEN a player rests, THE Game_Engine SHALL return all played cards to the player's hand
8. WHEN a player scores, THE Game_Engine SHALL verify the player has required spices, remove those spices, award the point card, and grant bonus coins if applicable
9. WHEN a point card is claimed, THE Game_Engine SHALL slide all remaining point cards leftward to fill the gap, then draw and place a new point card in the rightmost position
10. WHEN the first point card is claimed, THE Game_Engine SHALL award one gold coin to the player
11. WHEN the second point card is claimed, THE Game_Engine SHALL award one silver coin to the player
12. WHEN all 5 gold coins have been claimed, THE Game_Engine SHALL move remaining silver coins to the first position and award silver coins for first position claims thereafter
13. WHEN all silver coins are depleted, THE Game_Engine SHALL award no coins for subsequent point card claims

### Requirement 3: Game State Management

**User Story:** As a developer, I want centralized game state management, so that the system maintains consistency and supports future multiplayer.

#### Acceptance Criteria

1. THE Game_Engine SHALL maintain a single source of truth for all game state including player hands, caravans, available cards, and turn order
2. WHEN game state changes, THE Game_Engine SHALL validate all changes against game rules before applying them
3. WHEN an action is performed, THE Game_Engine SHALL emit state change events that the UI_Layer can subscribe to
4. THE Game_Engine SHALL store game state in a serializable format to support future network synchronization
5. WHEN invalid actions are attempted, THE Game_Engine SHALL reject them and maintain the previous valid state

### Requirement 4: Caravan and Resource Management

**User Story:** As a player, I want to manage my spice caravan, so that I can collect and trade resources strategically.

#### Acceptance Criteria

1. THE Game_Engine SHALL enforce a maximum caravan capacity of 10 spices per player
2. WHEN a player's turn ends with more than 10 spices, THE Game_Engine SHALL require the player to discard spices until the limit is reached
3. WHEN spices are added or removed, THE Game_Engine SHALL update the caravan state immediately
4. THE Game_Engine SHALL track four spice types with ascending values: turmeric (yellow), saffron (red), cardamom (green), cinnamon (brown)
5. WHEN the spice supply is depleted, THE Game_Engine SHALL treat it as unlimited and continue gameplay

### Requirement 5: Victory Conditions and Scoring

**User Story:** As a player, I want clear victory conditions and scoring, so that I know when the game ends and who wins.

#### Acceptance Criteria

1. WHEN a player claims their 5th point card in 2-3 player games (or 6th in 4-5 player games), THE Game_Engine SHALL trigger game end after the current round completes
2. WHEN the game ends, THE Game_Engine SHALL calculate each player's score from point cards, gold coins (3 points each), silver coins (1 point each), and valuable spices (1 point per non-yellow cube)
3. WHEN scores are tied, THE Game_Engine SHALL award victory to the player later in turn order
4. WHEN the game ends, THE Game_System SHALL display final scores and declare the winner

### Requirement 6: Single-Player AI Opponents

**User Story:** As a player, I want to play against AI opponents, so that I can enjoy the game in single-player mode.

#### Acceptance Criteria

1. THE Game_System SHALL support 1 human player and 1-4 AI_Opponents
2. WHEN it is an AI_Opponent's turn, THE Game_Engine SHALL execute a valid action within 1-2 seconds
3. THE AI_Opponent SHALL follow all game rules identically to human players
4. THE AI_Opponent SHALL make strategic decisions based on available cards, current resources, and point card requirements
5. WHEN an AI_Opponent performs an action, THE UI_Layer SHALL animate and display the action clearly to the human player

### Requirement 7: React-Based User Interface

**User Story:** As a player, I want an intuitive visual interface, so that I can easily understand game state and perform actions.

#### Acceptance Criteria

1. THE UI_Layer SHALL display the player's hand at the bottom of the screen
2. THE UI_Layer SHALL provide a toggle button to hide/show the player's hand for better table visibility
3. THE UI_Layer SHALL display merchant cards available for acquisition in a horizontal row
4. THE UI_Layer SHALL display point cards available for scoring in a horizontal row with coin indicators
5. THE UI_Layer SHALL display the player's caravan at the bottom left of the screen and keep it always visible
6. THE UI_Layer SHALL display cards in the player's hand stacked on top of each other with each card showing 80% of its left side
7. THE UI_Layer SHALL display other players' boards in a collapsible panel on the right side
8. WHEN the opponent panel is opened, THE UI_Layer SHALL shift the game board (merchant cards, point cards, and caravans) to the left to ensure all cards remain fully visible
9. WHEN the opponent panel is closed, THE UI_Layer SHALL return the game board to its centered position
10. WHEN displaying opponent information, THE UI_Layer SHALL show player name, caravan (spice cubes), current score, coins collected (gold and silver), and card counts with symbols
11. THE UI_Layer SHALL display symbols representing hand size (number of cards in hand), played merchant cards count, and point cards count for each opponent
12. WHEN a user hovers over (desktop) or clicks (mobile) the played merchant cards symbol, THE UI_Layer SHALL display an overlay window showing all played merchant cards as text-based effects
13. WHEN displaying played card effects, THE UI_Layer SHALL show each card's effect in a rectangular box (e.g., "YYYY → GG" for exchange, "↑↑" for upgrade 2)
14. THE UI_Layer SHALL arrange played card effects in a vertical list within columns
15. WHEN the list of played card effects exceeds the available vertical space, THE UI_Layer SHALL create additional columns based on screen size
16. THE UI_Layer SHALL NOT display the actual cards in opponents' hands, only the count
17. WHEN a card or action is clickable, THE UI_Layer SHALL provide visual feedback on hover
18. WHEN an action is invalid, THE UI_Layer SHALL display a clear error message or disable the action

### Requirement 8: Three.js 3D Rendering

**User Story:** As a player, I want visually appealing 3D card and spice representations, so that the game feels immersive and polished.

#### Acceptance Criteria

1. THE Render_Engine SHALL render merchant cards, point cards, and spice cubes as 3D objects
2. WHEN cards are played or acquired, THE UI_Layer SHALL animate card movements smoothly using CSS transitions/keyframes
3. WHEN spices are added or removed from the caravan, THE UI_Layer SHALL animate spice cube movements between source and destination
4. THE Render_Engine SHALL use appropriate lighting and materials to make cards and spices visually distinct
5. THE UI_Layer SHALL maintain 60 FPS performance during all animations on modern desktop and mobile devices

### Requirement 9: Responsive Design for Desktop and Mobile

**User Story:** As a player, I want the game to work on any device, so that I can play on desktop or mobile.

#### Acceptance Criteria

1. THE UI_Layer SHALL adapt layout to different screen sizes while maintaining usability
2. WHEN accessed on mobile, THE Game_System SHALL display a start button that triggers fullscreen landscape mode
3. WHEN the start button is clicked on mobile, THE Orientation_Manager SHALL request fullscreen API and lock orientation to landscape
4. THE UI_Layer SHALL provide touch-friendly controls on mobile devices with appropriate hit targets (minimum 44x44 pixels)
5. THE UI_Layer SHALL scale text and UI elements appropriately for different screen resolutions
6. WHEN orientation changes are detected, THE UI_Layer SHALL adjust layout to maintain optimal display

### Requirement 10: Architecture for Future Multiplayer

**User Story:** As a developer, I want the codebase structured for multiplayer, so that adding online multiplayer is straightforward in the future.

#### Acceptance Criteria

1. THE Game_Engine SHALL separate game logic from presentation logic completely
2. THE Game_Engine SHALL communicate with UI_Layer only through events and state updates, not direct function calls
3. THE Game_System SHALL define clear interfaces for player actions that can be triggered locally or remotely
4. THE Game_Engine SHALL support serializing and deserializing complete game state to/from JSON
5. THE Game_System SHALL structure code to allow future addition of network layer without refactoring core logic
6. WHERE multiplayer is implemented, THE Game_System SHALL support creating game rooms with shareable codes
7. WHERE multiplayer is implemented, THE Game_System SHALL support real-time synchronization of game state across connected players

### Requirement 11: Card Management and Display

**User Story:** As a player, I want to view and interact with cards clearly, so that I can make informed decisions.

#### Acceptance Criteria

1. WHEN displaying merchant cards in hand, THE UI_Layer SHALL show card details including spice costs and effects
2. WHEN displaying point cards, THE UI_Layer SHALL show required spices and victory point values
3. WHEN displaying card effects, THE UI_Layer SHALL show them in at most 2 columns on the left side of the card with a light colored background for better visibility
4. WHEN displaying point cards, THE UI_Layer SHALL show spice costs at the bottom row with a light colored thin bar for better visibility
5. THE UI_Layer SHALL display both merchant cards and point cards with an image in the majority of the card area for aesthetic purposes
6. WHEN a player hovers over a card, THE UI_Layer SHALL enlarge or highlight the card for better visibility
7. WHEN merchant cards are acquired, THE UI_Layer SHALL slide remaining cards left and draw a new card from the deck
8. WHEN point cards are claimed, THE UI_Layer SHALL slide remaining cards left and draw a new card from the deck

### Requirement 12: Turn Management and Flow

**User Story:** As a player, I want clear turn progression, so that I always know whose turn it is and what actions are available.

#### Acceptance Criteria

1. THE UI_Layer SHALL display a clear indicator showing whose turn it is currently
2. WHEN it is the human player's turn, THE UI_Layer SHALL enable interactive elements for available actions
3. WHEN it is an AI_Opponent's turn, THE UI_Layer SHALL disable human player interactions and show AI thinking indicator
4. WHEN a turn ends, THE Game_Engine SHALL automatically progress to the next player in clockwise order
5. THE UI_Layer SHALL display an "End Turn" button that becomes available after the player performs their action

### Requirement 13: Game Persistence and State Recovery

**User Story:** As a player, I want my game progress saved, so that I can resume if I close the browser.

#### Acceptance Criteria

1. WHEN game state changes, THE Game_System SHALL save state to browser local storage
2. WHEN the player returns to the game, THE Game_System SHALL offer to resume the saved game
3. WHEN a game completes, THE Game_System SHALL clear the saved state
4. THE Game_System SHALL serialize complete game state including all player data, card positions, and turn information

### Requirement 14: Visual Feedback and Animations

**User Story:** As a player, I want smooth animations and feedback, so that game actions feel responsive and clear.

#### Acceptance Criteria

1. WHEN a card is played from hand, THE UI_Layer SHALL animate the card moving from its position in the hand toward the left side of the screen above the "Play Card" button, slowly fading out as it reaches the destination
2. WHEN spices are placed on merchant cards during acquisition, THE UI_Layer SHALL animate spice cubes moving from the player's caravan to the target merchant cards; when bonus spices are collected from an acquired card, THE UI_Layer SHALL animate cubes moving from the merchant card to the player's caravan
3. WHEN a merchant card is acquired by the human player, THE UI_Layer SHALL animate the card moving from the merchant row toward the player's hand area and fading out; WHEN a point card is claimed by the human player, THE UI_Layer SHALL animate the card moving toward the player's hand area and fading out
4. WHEN an invalid action is attempted (e.g., selecting a hand card and clicking "Acquire Card"), THE UI_Layer SHALL provide immediate visual feedback such as a shake animation or red highlight on the relevant element
5. THE UI_Layer SHALL complete all animations within 500ms to maintain game flow
6. WHEN an AI opponent acquires a merchant card or claims a point card, THE UI_Layer SHALL animate the card moving toward the opponent's caravan area in the opponent panel and fading out
7. WHEN a merchant card or point card is taken from the row, THE UI_Layer SHALL animate the remaining cards sliding left one by one to fill the gap, and a new card fading in from the deck position at the far right of the row
8. WHEN cards are animated during row-slide, card-fly, or any other animation, THE UI_Layer SHALL ensure the animated clone is pixel-identical to the stationary card — same size, image zoom/crop, border/outline, shadow, effect overlay, and all visual features SHALL remain unchanged during motion

### Requirement 15: Action Cancellation and Rollback

**User Story:** As a player, I want to cancel an action before committing it, so that I can change my mind without penalty.

#### Acceptance Criteria

1. WHEN a player begins a multi-step action (conversion, exchange, or discard), THE Game_System SHALL create a snapshot of the current game state
2. WHEN a player is making action decisions, THE UI_Layer SHALL display a "Cancel" button
3. WHEN a player clicks the "Cancel" button, THE Game_System SHALL restore the game state to the snapshot taken before the action began
4. WHEN an action is cancelled, THE Game_System SHALL return the player to the action selection phase as if no action was attempted
5. WHEN an action is fully committed (player confirms their choices), THE Game_System SHALL discard the state snapshot and proceed with the turn

### Requirement 16: In-Game Menu System

**User Story:** As a player, I want to access game options during play, so that I can view rules or restart without losing access to game controls.

#### Acceptance Criteria

1. THE UI_Layer SHALL display a hamburger menu icon at the top right corner of the game screen
2. WHEN the hamburger menu is clicked, THE UI_Layer SHALL display an overlay menu with options for "Game Rules" and "Restart Game"
3. THE UI_Layer SHALL display a close button (X icon) on the menu overlay
4. WHEN the close button is clicked, THE UI_Layer SHALL close the menu overlay and return to the game
5. WHEN "Game Rules" is selected, THE UI_Layer SHALL display the rules reference
6. WHEN "Restart Game" is selected, THE Game_System SHALL prompt for confirmation before restarting

### Requirement 17: End-Game Statistics and Analytics

**User Story:** As a player, I want to see detailed statistics after the game ends, so that I can analyze my performance and strategy.

#### Acceptance Criteria

1. WHEN the game ends, THE Game_System SHALL display a statistics tab alongside the final scores
2. THE UI_Layer SHALL display total cube gain by color (yellow, red, green, brown) for each player as a bar graph
3. THE UI_Layer SHALL display total cube spent for each player as a bar graph
4. THE UI_Layer SHALL calculate and display net cube conversion efficiency (victory points earned per cube spent) for each player as a bar graph
5. THE UI_Layer SHALL display number of merchant cards played for each player as a bar graph
6. THE UI_Layer SHALL display number of rest actions taken for each player as a bar graph
7. THE UI_Layer SHALL display number of merchant cards acquired for each player as a bar graph
8. THE UI_Layer SHALL calculate and display average value per turn (points gained per turn) for each player as a bar graph
9. THE UI_Layer SHALL calculate and display average time per turn for each player as a bar graph
10. THE UI_Layer SHALL display the most frequently used card for each player with card image
11. THE UI_Layer SHALL display point progression throughout the game as a line graph with turns on x-axis and points on y-axis, with one line per player
12. THE Game_Engine SHALL track all necessary statistics during gameplay (cube transactions, card usage, turn timing, point progression)

### Requirement 18: Accessibility and Usability

**User Story:** As a player, I want the game to be accessible and easy to use, so that I can focus on strategy rather than interface struggles.

#### Acceptance Criteria

1. THE UI_Layer SHALL provide clear labels and tooltips for all interactive elements
2. THE UI_Layer SHALL use sufficient color contrast for text and important UI elements
3. THE UI_Layer SHALL support keyboard navigation for desktop users
4. THE UI_Layer SHALL provide a help or rules reference accessible from the main game screen

### Requirement 19: Caravan Visual Representation

**User Story:** As a player, I want to see a visual representation of all players' caravans with empty and filled boxes, so that I can quickly understand spice capacity and distribution at a glance.

#### Acceptance Criteria

1. THE UI_Layer SHALL display each player's caravan as a grid of 10 boxes arranged in 2 rows of 5 boxes each
2. WHEN displaying caravan boxes, THE UI_Layer SHALL fill boxes with spice colors in ascending value order: yellow (turmeric), red (saffron), green (cardamom), brown (cinnamon)
3. WHEN filling caravan boxes, THE UI_Layer SHALL fill from left to right in the top row first, then continue left to right in the bottom row
4. WHEN a box contains a spice, THE UI_Layer SHALL display it with the appropriate spice color (yellow, red, green, or brown)
5. WHEN a box is empty, THE UI_Layer SHALL display it as an empty outlined box
6. THE UI_Layer SHALL display the caravan visualization for all players including the human player and all AI opponents
7. WHEN displaying opponent caravans in the opponent panel, THE UI_Layer SHALL show the same 10-box grid visualization
8. WHEN spices are added or removed from a caravan, THE UI_Layer SHALL update the visual representation immediately to reflect the new state

/**
 * AI-powered game code generation
 * Generates Python Pygame code based on user descriptions
 */

export interface GameGenerationRequest {
  heroName: string;
  enemyName: string;
  goal: string;
  tone: "hopeful" | "gritty" | "heroic";
  difficulty: "rookie" | "veteran" | "nightmare";
  genre: "platformer" | "adventure" | "puzzle";
  description?: string; // Optional longer description
  playerSpriteUrl?: string; // Optional uploaded sprite for player
  enemySpriteUrl?: string; // Optional uploaded sprite for enemy
}

export interface GeneratedGame {
  mainPy: string; // Generated main.py content
  configJson: object; // Generated config
  assets: Array<{ filename: string; content: string }>; // Any generated assets
}

/**
 * Generate a complete Python game using AI
 */
export async function generateGameCode(
  request: GameGenerationRequest
): Promise<GeneratedGame> {
  // This will call OpenAI or similar to generate game code
  const response = await fetch("/api/generate-game-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error("Failed to generate game code");
  }

  return response.json();
}

/**
 * Build the prompt for AI code generation
 */
export function buildGameGenerationPrompt(
  request: GameGenerationRequest
): string {
  const difficultySettings = {
    rookie: { health: 5, enemySpeed: 80, enemyCount: "2-3", damage: 20 },
    veteran: { health: 3, enemySpeed: 120, enemyCount: "3-5", damage: 34 },
    nightmare: { health: 2, enemySpeed: 160, enemyCount: "5-7", damage: 50 },
  };

  const toneSettings = {
    hopeful: { 
      colors: "bright, saturated colors (blues: #3B82F6, greens: #10B981, yellows: #FBBF24)", 
      atmosphere: "uplifting and encouraging",
      playerColor: "#3B82F6",
      enemyColor: "#EF4444",
      bgColor: "#1E293B"
    },
    gritty: { 
      colors: "muted, desaturated colors (grays: #6B7280, browns: #78350F, dark reds: #991B1B)", 
      atmosphere: "harsh and grim",
      playerColor: "#6B7280",
      enemyColor: "#7C2D12",
      bgColor: "#0F172A"
    },
    heroic: { 
      colors: "bold, vibrant colors (golds: #F59E0B, oranges: #F97316, purples: #A855F7)", 
      atmosphere: "epic and adventurous",
      playerColor: "#F59E0B",
      enemyColor: "#DC2626",
      bgColor: "#1E1B4B"
    },
  };

  const genreTemplates = {
    platformer: {
      description: "a polished 2D side-scrolling platformer",
      mechanics: `
- Smooth gravity physics (gravity = 0.8, jump_power = -15)
- Multiple platforms at varying heights with gaps
- WASD or Arrow keys for movement (speed: 5 pixels/frame)
- Spacebar or W/Up for jumping
- ${difficultySettings[request.difficulty].enemyCount} enemies that patrol platforms
- Enemies change direction at platform edges
- Health bar displayed at top
- Score/timer display
- Particle effects on jumps and collisions
- Goal object/zone to reach`,
      gameplay: "Create exciting platforming with precise jumps. Make enemies patrol platforms naturally. Add visual juice (particles, screen shake on hits, smooth movement).",
      codeExample: `# Example structure:
class Player:
    def __init__(self):
        self.rect = pygame.Rect(50, 400, 30, 30)
        self.vel_y = 0
        self.on_ground = False
        self.health = ${difficultySettings[request.difficulty].health}
    
    def update(self, platforms):
        # Apply gravity
        self.vel_y += 0.8
        # Jump if on ground and space pressed
        # Check platform collisions
        # Update position`,
    },
    adventure: {
      description: "a polished top-down adventure game",
      mechanics: `
- Smooth 8-directional movement (WASD or arrows, speed: 4 pixels/frame)
- Large playable area with walls/boundaries
- ${difficultySettings[request.difficulty].enemyCount} enemies with simple AI (chase player when close)
- Health and score displayed
- Collision detection with walls
- Invincibility frames after taking damage (0.5 seconds)
- Collectible items or power-ups
- Goal area or boss enemy
- Particle effects on hits`,
      gameplay: "Make a Zelda-style top-down game. Enemies should chase the player when nearby. Add visual feedback for everything (hits, pickups, etc).",
      codeExample: `# Example structure:
class Player:
    def __init__(self):
        self.rect = pygame.Rect(400, 300, 32, 32)
        self.speed = 4
        self.health = ${difficultySettings[request.difficulty].health}
        self.invincible_timer = 0
    
    def update(self, keys):
        # 8-direction movement
        if keys[pygame.K_w]: self.rect.y -= self.speed
        # Check collisions with walls`,
    },
    puzzle: {
      description: "an engaging puzzle game",
      mechanics: `
- Grid-based gameplay (8x8 or similar)
- Mouse clicks to interact with tiles
- Match-3, tile-sliding, or pattern-matching mechanic
- Smooth animations for tile movements
- Score system with combo multipliers
- Move counter or time limit
- Visual feedback for matches/correct moves
- Particle effects on successful moves
- Win condition (reach target score, clear board, etc)`,
      gameplay: "Make an addictive puzzle game. Add juice: tiles should smoothly animate, successful matches should feel satisfying with particles and screen effects.",
      codeExample: `# Example structure:
class Tile:
    def __init__(self, x, y, color):
        self.rect = pygame.Rect(x*60, y*60, 55, 55)
        self.color = color
        self.target_pos = self.rect.copy()
    
    def animate(self):
        # Smooth movement to target position`,
    },
  };

  const diff = difficultySettings[request.difficulty];
  const mood = toneSettings[request.tone];
  const genreInfo = genreTemplates[request.genre];

  // Include user description if provided
  const descriptionSection = request.description 
    ? `\n\n**User's Vision:**\n"${request.description}"\n\nIMPORTANT: Incorporate the above description into your game design. Make the game match this vision while following all technical requirements.`
    : '';

  return `You are an expert game developer. Create a POLISHED, FUN ${genreInfo.description} in Python using Pygame.

**🚨 CRITICAL: CONTROLS MUST WORK! 🚨**
The #1 priority is that arrow keys and WASD work perfectly. Test your code mentally:
1. Does player.rect.x actually change when arrow left/A is pressed?
2. Is \`keys = pygame.key.get_pressed()\` called AFTER \`pygame.event.get()\`?
3. Are you checking keys inside the \`if game_state == "PLAYING":\` block?
4. Are you using \`keys[pygame.K_LEFT] or keys[pygame.K_a]\` for BOTH options?

If ANY of these are "no", fix it before generating code!

**Game Theme:**
- Player Character: ${request.heroName}
- Enemy/Obstacle: ${request.enemyName}
- Objective: ${request.goal}
- Difficulty: ${request.difficulty} (Player HP: ${diff.health}, Enemy Speed: ${diff.enemySpeed}px/s, Enemies: ${diff.enemyCount})
- Art Style: ${mood.colors}
- Mood: ${mood.atmosphere}${descriptionSection}

**Core Gameplay:**${genreInfo.mechanics}

**Design Philosophy:**
${genreInfo.gameplay}

**Code Quality Requirements:**

1. **Structure:** Use classes for Player, Enemy, Particle, etc. Keep code organized and readable.

2. **Game Feel (Make it juicy!):**
   - Screen shake on damage (2-3 pixels for 0.2 seconds)
   - Particle effects (5-10 particles on: jumps, hits, pickups, wins)
   - Smooth lerp/easing for movements
   - Flash effects on damage (player flickers white)
   - Collectibles and power-ups (health pickups, speed boosts, invincibility)
   - Score multipliers and combo systems
   - Progressive difficulty (enemies get slightly faster over time)

3. **Visual Design:**
   ${request.playerSpriteUrl || request.enemySpriteUrl ? `
   **CUSTOM SPRITES PROVIDED:**
   ${request.playerSpriteUrl ? `- Player sprite URL: ${request.playerSpriteUrl}
     * Load with urllib and pygame:
       \`\`\`python
       import urllib.request
       import io
       response = urllib.request.urlopen("${request.playerSpriteUrl}")
       player_img = pygame.image.load(io.BytesIO(response.read()))
       player_img = pygame.transform.scale(player_img, (32, 32))  # Scale to game size
       \`\`\`
     * Draw with: screen.blit(player_img, player.rect)` : ''}
   ${request.enemySpriteUrl ? `- Enemy sprite URL: ${request.enemySpriteUrl}
     * Load with urllib and pygame:
       \`\`\`python
       import urllib.request
       import io
       response = urllib.request.urlopen("${request.enemySpriteUrl}")
       enemy_img = pygame.image.load(io.BytesIO(response.read()))
       enemy_img = pygame.transform.scale(enemy_img, (32, 32))  # Scale to game size
       \`\`\`
     * Draw with: screen.blit(enemy_img, enemy.rect)` : ''}
   
   **For characters WITHOUT custom sprites, draw them using shapes:**` : `
   **DRAW CHARACTERS USING SHAPES (No uploaded sprites):**`}
   - **Player Character:** ${request.playerSpriteUrl ? 'Use uploaded sprite image' : 'Draw detailed character with shapes:'}
     ${!request.playerSpriteUrl ? `* Body: Main rectangle/circle in ${mood.playerColor}
     * Features: Add eyes, limbs, accessories that match "${request.heroName}"
     * Animation: Bob/rotate slightly when moving
     * Example: For "Knight" - draw body + helmet shape + sword` : ''}
   
   - **Enemies:** ${request.enemySpriteUrl ? 'Use uploaded sprite image' : 'Draw recognizable enemies:'}
     ${!request.enemySpriteUrl ? `* Use ${mood.enemyColor} as base color
     * Add distinctive features (spikes, eyes, tentacles, etc.) for "${request.enemyName}"
     * Animate them (float, pulse, rotate)
     * Make them look threatening but clear` : ''}
   
   - **Environment:**
     * Background gradient: ${mood.bgColor} with lighter/darker shades
     * Platform decorations (grass on top, cracks, etc.)
     * Environmental details (stars, clouds, particles)
   
   - **UI:**
     * Health bar (top-left) with icon/heart symbols
     * Score (top-right) with large, clear numbers
     * Collectible counter if applicable
     * Clean, readable fonts

4. **Storyline & Narrative:**
   - **Intro Screen:** Show a story introduction before gameplay
     * Display the goal: "${request.goal}"
     * Brief setup explaining why the player is here
     * "Press SPACE to Start" prompt
   
   - **In-Game Storytelling:**
     * Show story text at key moments (reaching checkpoints, collecting items)
     * Display victory/goal reminders in UI
     * Add context to gameplay (e.g., "Collect 3 crystals to unlock the exit")
   
   - **Win Screen:** Story conclusion
     * Celebrate the achievement of: "${request.goal}"
     * Show what happened after the victory
     * Display final score and stats
     * "Press R to Play Again"
   
   - **Lose Screen:** Encouraging retry
     * Brief story moment ("The ${request.enemyName} were too strong...")
     * Show what progress was made
     * "Press R to Try Again"

5. **Fun Gameplay Elements:**
   - Add collectibles (coins, gems, power-ups)
   - Include at least one power-up type (speed boost, invincibility, health)
   - Score system that rewards skilled play
   - Optional: Hidden secrets or bonus areas
   - Varied enemy behaviors (some patrol, some chase, some shoot)
   - Environmental hazards matching the theme

6. **Code Structure:**
${genreInfo.codeExample}

**CRITICAL Technical Requirements (MUST FOLLOW EXACTLY):**

1. **Imports:** MUST start with:
\`\`\`python
import asyncio
import pygame
\`\`\`

2. **Event Loop & Input Handling:**
\`\`\`python
async def main():
    pygame.init()
    screen = pygame.display.set_mode((800, 600))
    clock = pygame.time.Clock()
    running = True
    game_state = "INTRO"  # INTRO, PLAYING, WIN, LOSE
    
    while running:
        # CRITICAL: Process ALL events every frame
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            # For one-time key presses (restart, start game)
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_SPACE and game_state == "INTRO":
                    game_state = "PLAYING"
                if event.key == pygame.K_r and game_state in ["WIN", "LOSE"]:
                    game_state = "INTRO"  # Reset game
        
        # CRITICAL: Get keyboard state AFTER event loop for movement
        keys = pygame.key.get_pressed()
        
        if game_state == "PLAYING":
            # MOVEMENT - Check BOTH arrow keys AND WASD
            # Left movement
            if keys[pygame.K_LEFT] or keys[pygame.K_a]:
                player.rect.x -= player.speed
            # Right movement  
            if keys[pygame.K_RIGHT] or keys[pygame.K_d]:
                player.rect.x += player.speed
            
            # Top-down games: up/down movement
            if keys[pygame.K_UP] or keys[pygame.K_w]:
                player.rect.y -= player.speed  # Move up
            if keys[pygame.K_DOWN] or keys[pygame.K_s]:
                player.rect.y += player.speed  # Move down
            
            # Platformer games: jumping (use KEYDOWN event instead)
            # In event loop: if event.key == pygame.K_SPACE and player.on_ground: player.vel_y = -15
            
            # Keep player on screen
            player.rect.x = max(0, min(player.rect.x, 800 - player.rect.width))
            player.rect.y = max(0, min(player.rect.y, 600 - player.rect.height))
        
        # Update game logic
        # Draw everything
        pygame.display.flip()
        clock.tick(60)
        
        # CRITICAL: Must yield control to browser
        await asyncio.sleep(0)
    
    pygame.quit()

# CRITICAL: Must call main with asyncio
asyncio.run(main())
\`\`\`

3. **Collision Detection (CRITICAL - MUST IMPLEMENT):**
\`\`\`python
# Rectangle collision (use pygame.Rect)
def check_collision(rect1, rect2):
    return rect1.colliderect(rect2)

# Player vs Enemy collision
for enemy in enemies:
    if player.rect.colliderect(enemy.rect) and not player.invincible:
        player.health -= 1
        player.invincible = True
        player.invincible_timer = 30  # 0.5 seconds at 60 FPS

# Player vs Collectible collision
for collectible in collectibles[:]:  # Use slice to allow removal
    if player.rect.colliderect(collectible.rect):
        score += 10
        collectibles.remove(collectible)
        # Spawn particles

# Player vs Goal/Exit collision
if player.rect.colliderect(goal_rect):
    game_state = "WIN"

# Platformer: Player vs Platform collision
for platform in platforms:
    if player.rect.colliderect(platform.rect):
        # Check if player is falling onto platform
        if player.vel_y > 0 and player.rect.bottom <= platform.rect.top + 10:
            player.rect.bottom = platform.rect.top
            player.vel_y = 0
            player.on_ground = True

# Keep player in bounds
player.rect.x = max(0, min(player.rect.x, 800 - player.rect.width))
player.rect.y = max(0, min(player.rect.y, 600 - player.rect.height))
\`\`\`

4. **Movement Controls (TEST ALL KEYS):**
   - Arrow Keys: pygame.K_LEFT, pygame.K_RIGHT, pygame.K_UP, pygame.K_DOWN
   - WASD: pygame.K_a, pygame.K_d, pygame.K_w, pygame.K_s
   - Space: pygame.K_SPACE (for jumping)
   - ALWAYS support BOTH arrow keys AND WASD

5. Screen size: EXACTLY 800x600
6. Frame rate: 60 FPS with \`clock.tick(60)\`
7. ALL positions/sizes must be integers (use int() for calculations)
8. Include proper game states: INTRO, PLAYING, WIN, LOSE
9. Show appropriate screens for each state

**Required Game States:**
1. INTRO - Story introduction, press SPACE to start
2. PLAYING - Main gameplay
3. WIN - Victory screen with story conclusion
4. LOSE - Game over screen with encouragement

**Must Include:**
✓ Intro screen with story/goal
✓ **WORKING INPUT:** Arrow keys AND WASD both work for movement
✓ **COLLISION DETECTION:** Player vs enemies, collectibles, platforms, boundaries
✓ Detailed character art (drawn with shapes, not rectangles)
✓ Detailed enemy art matching "${request.enemyName}"
✓ At least 1 collectible type (coins, gems, etc.)
✓ At least 1 power-up type (health, speed, invincibility)
✓ Particle effects on all actions
✓ Screen shake on impacts
✓ Health bar with heart/icon visuals
✓ Score display
✓ **Enemy collision damage:** Player loses health when hitting enemies
✓ **Invincibility frames:** 0.5 seconds after taking damage
✓ **Boundary checking:** Player can't move off screen
✓ Smooth enemy AI with varied behaviors
✓ Story text at key moments
✓ Win screen with story conclusion
✓ Lose screen with retry encouragement
✓ Background gradient with details
✓ Platform/environment decorations
✓ Progressive difficulty or challenge curve

**Character Drawing Examples:**
- Knight: Rectangle body + triangle helmet + line sword + circle eyes
- Astronaut: White suit (circles) + glass helmet (circle outline) + antenna
- Robot: Multiple rectangles + circles for joints + glowing eyes (circles)
- Dragon: Triangle body + wings (triangles) + spikes (small triangles)

Make the game FEEL GOOD to play. Every action should have satisfying feedback. The player should want to keep playing!

**FINAL CONTROL CHECK - Your player update MUST look like this:**
\`\`\`python
if game_state == "PLAYING":
    # Get keys - this returns TRUE/FALSE for each key
    keys = pygame.key.get_pressed()
    
    # LEFT movement (check BOTH arrow AND A)
    if keys[pygame.K_LEFT] or keys[pygame.K_a]:
        player.rect.x -= player.speed  # THIS MUST change player position!
        
    # RIGHT movement (check BOTH arrow AND D)  
    if keys[pygame.K_RIGHT] or keys[pygame.K_d]:
        player.rect.x += player.speed  # THIS MUST change player position!
        
    # UP movement for top-down (check BOTH arrow AND W)
    if keys[pygame.K_UP] or keys[pygame.K_w]:
        player.rect.y -= player.speed  # THIS MUST change player position!
        
    # DOWN movement for top-down (check BOTH arrow AND S)
    if keys[pygame.K_DOWN] or keys[pygame.K_s]:
        player.rect.y += player.speed  # THIS MUST change player position!
    
    # Keep on screen
    player.rect.x = max(0, min(player.rect.x, 800 - player.rect.width))
    player.rect.y = max(0, min(player.rect.y, 600 - player.rect.height))
\`\`\`

Generate COMPLETE, WORKING Python code (400-600 lines with all features). Make it HIGHLY POLISHED and FUN!

REMEMBER: If the player can't move with arrow keys and WASD, the game is broken!

Return ONLY the Python code, no explanations.`;
}


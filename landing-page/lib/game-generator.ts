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
  language?: "python" | "javascript"; // Programming language (defaults to python)
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

**CONTROLS ARE MANDATORY - ALWAYS INCLUDE THEM:**
Even if the user doesn't mention controls, you MUST implement:
- Arrow Keys: LEFT, RIGHT, UP, DOWN
- WASD Keys: A, D, W, S  
- Space: For jumping (platformers) or special actions
- R: For restarting after win/lose

NEVER create a game without full keyboard controls!

**Game Theme:**
- Player Character: ${request.heroName}
- Enemy/Obstacle: ${request.enemyName}
- Objective: ${request.goal}
- Difficulty: ${request.difficulty} (Player HP: ${diff.health}, Enemy Speed: ${diff.enemySpeed}px/s, Enemies: ${diff.enemyCount})
- Art Style: ${mood.colors}
- Mood: ${mood.atmosphere}${descriptionSection}

**Core Gameplay:**${genreInfo.mechanics}

**MULTI-LEVEL PROGRESSION:**
Create 3 levels with progressive difficulty. Track current_level (1-3) and reset with harder enemies when complete.

**Design Philosophy:**
${genreInfo.gameplay}

**PROGRESSION & REPLAYABILITY:**
- **Save best score** between runs (in-memory)
- **Speed-run timer** displayed prominently
- **Combo system** for consecutive actions (kills, jumps, collectibles)
- **Unlockables**: "Beat Level 3 in under 2 minutes!"
- **Level skip**: After beating the game once, allow level selection

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
✓ WORKING Arrow keys AND WASD movement
✓ COLLISION DETECTION (enemies, collectibles, boundaries)
✓ 3 LEVELS with "Level X/3" counter and "Level Complete!" screens
✓ Detailed character/enemy art with ${mood.playerColor} and ${mood.enemyColor}
✓ Collectibles, power-ups, particles, screen shake
✓ Health bar, score, timer
✓ Invincibility frames after damage
✓ Enemy AI (slow→fast across levels)
✓ Intro, Win (with stats), Lose screens
✓ Combo system and high score

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

/**
 * Build the prompt for JavaScript/HTML5 Canvas game generation
 */
export function buildJavaScriptGamePrompt(
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
      mechanics: "Gravity physics, platforms, jumping, enemies that patrol",
    },
    adventure: {
      description: "a polished top-down adventure game",
      mechanics: "8-directional movement, enemy AI, collectibles",
    },
    puzzle: {
      description: "an engaging puzzle game",
      mechanics: "Grid-based gameplay, mouse/keyboard interaction, match-3 or tile-sliding",
    },
  };

  const diff = difficultySettings[request.difficulty];
  const mood = toneSettings[request.tone];
  const genreInfo = genreTemplates[request.genre];

  const descriptionSection = request.description 
    ? `\n\n**User's Vision:**\n"${request.description}"\n\nIMPORTANT: Incorporate the above description into your game design.`
    : '';

  return `You are an expert game developer. Create a COMPLETE, POLISHED ${genreInfo.description} using HTML5 Canvas and vanilla JavaScript.

**🚨 CRITICAL: CONTROLS MUST WORK! 🚨**
- Arrow Keys AND WASD for movement
- Space for actions (jump, fire, etc.)
- R to restart after win/lose

**Game Theme:**
- Player: ${request.heroName}
- Enemy: ${request.enemyName}
- Goal: ${request.goal}
- Difficulty: ${request.difficulty}
- Style: ${mood.colors}
- Mood: ${mood.atmosphere}${descriptionSection}

**FEATURES:**
- 3 levels with "Level X/3" display and "Complete!" screens
- ${genreInfo.mechanics}
- Particles, screen shake, health bar, score, timer
- Collectibles, power-ups, invincibility frames
- Combos and high score
- States: INTRO, PLAYING, LEVEL_COMPLETE, WIN, LOSE

**REQUIRED CODE STRUCTURE:**

\`\`\`html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${request.heroName} Adventure</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, ${mood.bgColor} 0%, #000 100%);
            font-family: 'Arial', sans-serif;
        }
        canvas {
            border: 2px solid #333;
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
        }
    </style>
</head>
<body>
    <canvas id="gameCanvas" width="800" height="600"></canvas>
    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        
        // Game state
        let gameState = 'INTRO'; // INTRO, PLAYING, LEVEL_COMPLETE, WIN, LOSE
        let currentLevel = 1;
        const maxLevels = 3;
        
        // Input handling
        const keys = {};
        document.addEventListener('keydown', (e) => {
            keys[e.key] = true;
            if (e.key === ' ') e.preventDefault();
        });
        document.addEventListener('keyup', (e) => {
            keys[e.key] = false;
        });
        
        // Player class
        class Player {
            constructor() {
                this.x = 50;
                this.y = 400;
                this.width = 32;
                this.height = 32;
                this.vx = 0;
                this.vy = 0;
                this.speed = 5;
                this.health = ${diff.health};
                this.maxHealth = ${diff.health};
                this.invincible = false;
                this.invincibleTimer = 0;
            }
            
            update() {
                // Left movement (A or ArrowLeft)
                if (keys['a'] || keys['A'] || keys['ArrowLeft']) {
                    this.x -= this.speed;
                }
                // Right movement (D or ArrowRight)
                if (keys['d'] || keys['D'] || keys['ArrowRight']) {
                    this.x += this.speed;
                }
                // Up movement for top-down (W or ArrowUp)
                if (keys['w'] || keys['W'] || keys['ArrowUp']) {
                    this.y -= this.speed;
                }
                // Down movement for top-down (S or ArrowDown)
                if (keys['s'] || keys['S'] || keys['ArrowDown']) {
                    this.y += this.speed;
                }
                
                // Keep on screen
                this.x = Math.max(0, Math.min(this.x, canvas.width - this.width));
                this.y = Math.max(0, Math.min(this.y, canvas.height - this.height));
                
                // Update invincibility
                if (this.invincible) {
                    this.invincibleTimer--;
                    if (this.invincibleTimer <= 0) {
                        this.invincible = false;
                    }
                }
            }
            
            draw() {
                // Draw player character with shapes (not just rectangle)
                // Add visual details for "${request.heroName}"
                ctx.save();
                if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
                    ctx.globalAlpha = 0.5; // Flash effect
                }
                ctx.fillStyle = '${mood.playerColor}';
                ctx.fillRect(this.x, this.y, this.width, this.height);
                // Add more details here (eyes, limbs, etc.)
                ctx.restore();
            }
            
            takeDamage(amount) {
                if (!this.invincible) {
                    this.health -= amount;
                    this.invincible = true;
                    this.invincibleTimer = 30; // 0.5 seconds at 60 FPS
                    screenShake = 5;
                    // Add particles
                }
            }
        }
        
        // Enemy, Particle, Collectible classes...
        // (Implement these similarly)
        
        // Game loop
        let lastTime = 0;
        let screenShake = 0;
        let score = 0;
        let gameTime = 0;
        
        function gameLoop(timestamp) {
            const deltaTime = timestamp - lastTime;
            lastTime = timestamp;
            
            // Clear screen
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Apply screen shake
            if (screenShake > 0) {
                ctx.save();
                ctx.translate(
                    Math.random() * screenShake - screenShake / 2,
                    Math.random() * screenShake - screenShake / 2
                );
                screenShake *= 0.9;
            }
            
            if (gameState === 'INTRO') {
                // Draw intro screen
                ctx.fillStyle = 'white';
                ctx.font = '48px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('${request.heroName}', canvas.width / 2, 200);
                ctx.font = '24px Arial';
                ctx.fillText('Goal: ${request.goal}', canvas.width / 2, 300);
                ctx.fillText('Press SPACE to Start', canvas.width / 2, 400);
                
                if (keys[' ']) {
                    gameState = 'PLAYING';
                    resetLevel();
                }
            } else if (gameState === 'PLAYING') {
                // Update game
                gameTime++;
                player.update();
                // Update enemies, check collisions, etc.
                
                // Draw everything
                player.draw();
                // Draw enemies, collectibles, etc.
                
                // Draw UI
                drawUI();
                
                // Check level complete
                if (levelComplete()) {
                    if (currentLevel < maxLevels) {
                        gameState = 'LEVEL_COMPLETE';
                    } else {
                        gameState = 'WIN';
                    }
                }
                
                // Check game over
                if (player.health <= 0) {
                    gameState = 'LOSE';
                }
            } else if (gameState === 'LEVEL_COMPLETE') {
                ctx.fillStyle = 'white';
                ctx.font = '48px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(\`Level \${currentLevel} Complete!\`, canvas.width / 2, 250);
                ctx.font = '24px Arial';
                ctx.fillText('Press SPACE for Next Level', canvas.width / 2, 350);
                
                if (keys[' ']) {
                    currentLevel++;
                    resetLevel();
                    gameState = 'PLAYING';
                }
            } else if (gameState === 'WIN') {
                // Draw win screen
                ctx.fillStyle = '#10B981';
                ctx.font = '48px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Victory!', canvas.width / 2, 200);
                ctx.font = '24px Arial';
                ctx.fillText(\`Final Score: \${score}\`, canvas.width / 2, 300);
                ctx.fillText(\`Time: \${Math.floor(gameTime / 60)}s\`, canvas.width / 2, 340);
                ctx.fillText('Press R to Play Again', canvas.width / 2, 400);
                
                if (keys['r'] || keys['R']) {
                    resetGame();
                }
            } else if (gameState === 'LOSE') {
                // Draw lose screen
                ctx.fillStyle = '#EF4444';
                ctx.font = '48px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Game Over', canvas.width / 2, 200);
                ctx.font = '24px Arial';
                ctx.fillText(\`Score: \${score}\`, canvas.width / 2, 300);
                ctx.fillText('Press R to Try Again', canvas.width / 2, 380);
                
                if (keys['r'] || keys['R']) {
                    resetGame();
                }
            }
            
            if (screenShake > 0) {
                ctx.restore();
            }
            
            requestAnimationFrame(gameLoop);
        }
        
        function drawUI() {
            // Draw health bar
            ctx.fillStyle = '#333';
            ctx.fillRect(10, 10, 200, 20);
            ctx.fillStyle = '#EF4444';
            ctx.fillRect(10, 10, (player.health / player.maxHealth) * 200, 20);
            
            // Draw score and level
            ctx.fillStyle = 'white';
            ctx.font = '20px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(\`Score: \${score}\`, 10, 50);
            ctx.fillText(\`Level: \${currentLevel}/\${maxLevels}\`, 10, 75);
            ctx.fillText(\`Time: \${Math.floor(gameTime / 60)}s\`, 10, 100);
        }
        
        function resetLevel() {
            player = new Player();
            // Reset enemies, collectibles for new level
            // Increase difficulty based on currentLevel
            gameTime = 0;
        }
        
        function resetGame() {
            currentLevel = 1;
            score = 0;
            resetLevel();
            gameState = 'INTRO';
        }
        
        function levelComplete() {
            // Check if level objectives are met
            return false; // Implement logic
        }
        
        // Initialize
        let player = new Player();
        resetLevel();
        
        // Start game loop
        requestAnimationFrame(gameLoop);
    </script>
</body>
</html>
\`\`\`

**IMPORTANT:**
- Return ONLY a SINGLE, COMPLETE HTML file (600-800 lines)
- All JavaScript must be in the <script> tag
- Include proper collision detection
- Add particle effects, screen shake, smooth animations
- Make characters visually distinct (not just colored rectangles)
- Add collectibles, power-ups, and enemies
- Implement ALL 3 levels with progressive difficulty
- Make it FUN and POLISHED!

REMEMBER: If controls don't work, the game is broken! Test arrow keys AND WASD.

Return ONLY the complete HTML file, no explanations.`;
}


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

  return `You are an expert game developer. Create a POLISHED, FUN ${genreInfo.description} in Python using Pygame.

**Game Theme:**
- Player Character: ${request.heroName}
- Enemy/Obstacle: ${request.enemyName}
- Objective: ${request.goal}
- Difficulty: ${request.difficulty} (Player HP: ${diff.health}, Enemy Speed: ${diff.enemySpeed}px/s, Enemies: ${diff.enemyCount})
- Art Style: ${mood.colors}
- Mood: ${mood.atmosphere}

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
   - Sound feedback using simple beeps (optional)

3. **Visual Polish:**
   - Clean UI: Health bar (top-left), Score (top-right), Title (center-top)
   - Smooth animations (not instant teleporting)
   - Color scheme: Player=${mood.playerColor}, Enemy=${mood.enemyColor}, BG=${mood.bgColor}
   - Rounded rectangles for characters (pygame.draw.rect with border_radius=5)
   - Shadows/outlines for depth

4. **Gameplay Balance:**
   - Fair but challenging at "${request.difficulty}" difficulty
   - Clear visual feedback for all actions
   - Invincibility frames after damage (0.5s)
   - Victory should feel earned but achievable

5. **Code Structure:**
${genreInfo.codeExample}

**CRITICAL Technical Requirements:**
1. MUST start with: \`import asyncio\` and \`import pygame\`
2. MUST have: \`async def main()\` as the main game loop
3. MUST include: \`await asyncio.sleep(0)\` at the end of each game loop iteration
4. Screen size: EXACTLY 800x600
5. Frame rate: 60 FPS (\`clock.tick(60)\`)
6. ALL positions/sizes must be integers (use int() for calculations)
7. Include proper game states: PLAYING, WIN, LOSE
8. Show appropriate screens for each state
9. "Press R to restart" on game over/win screens

**Polish Checklist:**
✓ Particle class with list management
✓ Screen shake function
✓ Health bar with outline
✓ Smooth enemy patrol/chase AI
✓ Clear win/lose conditions with visual feedback
✓ Invincibility flashing effect
✓ Centered text rendering function
✓ Clean, readable variable names

Generate COMPLETE, WORKING Python code (300-400 lines). Make it FUN and POLISHED. Focus on game feel and player feedback. Every action should have visual/audio feedback.

Return ONLY the Python code, no explanations.`;
}


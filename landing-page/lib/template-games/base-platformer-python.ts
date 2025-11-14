export const basePlatformerCodePython = `import asyncio
import pygame
import random

# Initialize Pygame
pygame.init()

# Constants
WIDTH, HEIGHT = 800, 600
FPS = 60
DIFFICULTY = {{DIFFICULTY_MULTIPLIER}}

# Colors
SKY_BLUE = (135, 206, 235)
BROWN = (139, 69, 19)
DARK_BROWN = (101, 67, 33)
GOLD = (255, 215, 0)
ORANGE = (255, 165, 0)
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)

# Parse player and enemy colors from hex
def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

PLAYER_COLOR = hex_to_rgb('{{PLAYER_COLOR}}')
ENEMY_COLOR = hex_to_rgb('{{ENEMY_COLOR}}')

# Game state
score = 0
lives = 3
game_over = False

# Player
class Player:
    def __init__(self):
        self.rect = pygame.Rect(100, 450, 40, 40)
        self.vel_y = 0
        self.vel_x = 0
        self.speed = 5 * DIFFICULTY
        self.jump_power = -12
        self.gravity = 0.5
        self.on_ground = False
    
    def update(self, platforms):
        # Movement
        keys = pygame.key.get_pressed()
        if keys[pygame.K_LEFT] or keys[pygame.K_a]:
            self.vel_x = -self.speed
        elif keys[pygame.K_RIGHT] or keys[pygame.K_d]:
            self.vel_x = self.speed
        else:
            self.vel_x = 0
        
        self.rect.x += self.vel_x
        self.rect.x = max(0, min(WIDTH - self.rect.width, self.rect.x))
        
        # Gravity
        self.vel_y += self.gravity
        self.rect.y += self.vel_y
        
        # Platform collision
        self.on_ground = False
        for platform in platforms:
            if (self.rect.x < platform.x + platform.width and
                self.rect.x + self.rect.width > platform.x and
                self.rect.y + self.rect.height > platform.y and
                self.rect.y + self.rect.height < platform.y + platform.height and
                self.vel_y > 0):
                self.rect.y = platform.y - self.rect.height
                self.vel_y = 0
                self.on_ground = True
        
        # Fall death
        if self.rect.y > HEIGHT:
            return True
        return False
    
    def jump(self):
        if self.on_ground:
            self.vel_y = self.jump_power
    
    def draw(self, screen):
        pygame.draw.rect(screen, PLAYER_COLOR, self.rect)
        font = pygame.font.Font(None, 24)
        text = font.render('{{PLAYER_NAME}}', True, BLACK)
        screen.blit(text, (self.rect.x, self.rect.y - 20))

# Enemy
class Enemy:
    def __init__(self, x, y):
        self.rect = pygame.Rect(x, y, 35, 35)
        self.speed = 2 * DIFFICULTY
    
    def update(self, platforms):
        self.rect.x -= self.speed
        if self.rect.x + self.rect.width < 0:
            return True
        return False
    
    def draw(self, screen):
        pygame.draw.rect(screen, ENEMY_COLOR, self.rect)
        font = pygame.font.Font(None, 20)
        text = font.render('{{ENEMY_NAME}}', True, WHITE)
        screen.blit(text, (self.rect.x, self.rect.y - 15))

# Coin
class Coin:
    def __init__(self, x, y):
        self.rect = pygame.Rect(x, y, 20, 20)
        self.collected = False
    
    def draw(self, screen):
        if not self.collected:
            pygame.draw.circle(screen, GOLD, (self.rect.x + 10, self.rect.y + 10), 10)
            pygame.draw.circle(screen, ORANGE, (self.rect.x + 10, self.rect.y + 10), 10, 2)

# Platforms
platforms = [
    pygame.Rect(0, 550, 800, 50),
    pygame.Rect(200, 450, 150, 20),
    pygame.Rect(400, 350, 150, 20),
    pygame.Rect(100, 250, 150, 20),
    pygame.Rect(500, 200, 150, 20),
]

player = Player()
enemies = []
coins = []

# Spawn timers
enemy_spawn_timer = 0
coin_spawn_timer = 0

async def main():
    global score, lives, game_over, enemy_spawn_timer, coin_spawn_timer
    
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption('{{GAME_TITLE}}')
    clock = pygame.time.Clock()
    running = True
    
    while running:
        dt = clock.tick(FPS) / 16.67  # Normalize to ~60fps
        
        # Event handling
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_SPACE and player.on_ground:
                    player.jump()
                if event.key == pygame.K_r and game_over:
                    # Restart
                    global player, enemies, coins
                    player = Player()
                    enemies = []
                    coins = []
                    score = 0
                    lives = 3
                    game_over = False
        
        if not game_over:
            # Update
            if player.update(platforms):
                lives -= 1
                if lives <= 0:
                    game_over = True
                else:
                    player.rect.x = 100
                    player.rect.y = 450
                    player.vel_y = 0
            
            # Spawn enemies
            enemy_spawn_timer += dt
            if enemy_spawn_timer > 3000 / DIFFICULTY and len(enemies) < 3:
                enemies.append(Enemy(WIDTH, 500))
                enemy_spawn_timer = 0
            
            # Spawn coins
            coin_spawn_timer += dt
            if coin_spawn_timer > 2000 and len(coins) < 5:
                platform = random.choice(platforms)
                coins.append(Coin(platform.x + random.randint(0, platform.width - 20), platform.y - 30))
                coin_spawn_timer = 0
            
            # Update enemies
            for enemy in enemies[:]:
                if enemy.update(platforms):
                    enemies.remove(enemy)
                # Collision with player
                if player.rect.colliderect(enemy.rect):
                    lives -= 1
                    enemies.remove(enemy)
                    if lives <= 0:
                        game_over = True
            
            # Update coins
            for coin in coins[:]:
                if not coin.collected and player.rect.colliderect(coin.rect):
                    coin.collected = True
                    score += 10
                    coins.remove(coin)
        
        # Draw
        screen.fill(SKY_BLUE)
        
        # Draw platforms
        for platform in platforms:
            pygame.draw.rect(screen, BROWN, platform)
            pygame.draw.rect(screen, DARK_BROWN, platform, 2)
        
        # Draw player
        player.draw(screen)
        
        # Draw enemies
        for enemy in enemies:
            enemy.draw(screen)
        
        # Draw coins
        for coin in coins:
            coin.draw(screen)
        
        # UI
        font = pygame.font.Font(None, 36)
        score_text = font.render(f'Score: {score}', True, WHITE)
        lives_text = font.render(f'Lives: {lives}', True, WHITE)
        screen.blit(score_text, (10, 10))
        screen.blit(lives_text, (10, 50))
        
        # Game over
        if game_over:
            overlay = pygame.Surface((WIDTH, HEIGHT))
            overlay.set_alpha(180)
            overlay.fill(BLACK)
            screen.blit(overlay, (0, 0))
            
            font_large = pygame.font.Font(None, 72)
            font_med = pygame.font.Font(None, 36)
            game_over_text = font_large.render('Game Over!', True, WHITE)
            score_final = font_med.render(f'Final Score: {score}', True, WHITE)
            goal_text = font_med.render('Goal: {{GOAL}}', True, WHITE)
            restart_text = font_med.render('Press R to Restart', True, WHITE)
            
            screen.blit(game_over_text, (WIDTH // 2 - 150, HEIGHT // 2 - 100))
            screen.blit(score_final, (WIDTH // 2 - 120, HEIGHT // 2 - 20))
            screen.blit(goal_text, (WIDTH // 2 - 100, HEIGHT // 2 + 20))
            screen.blit(restart_text, (WIDTH // 2 - 140, HEIGHT // 2 + 60))
        
        pygame.display.flip()
        await asyncio.sleep(0)
    
    pygame.quit()

if __name__ == '__main__':
    asyncio.run(main())
`;


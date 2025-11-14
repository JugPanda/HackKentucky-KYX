export const baseShooterCodePython = `import asyncio
import pygame
import random

pygame.init()

WIDTH, HEIGHT = 800, 600
FPS = 60
DIFFICULTY = {{DIFFICULTY_MULTIPLIER}}

BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
YELLOW = (255, 255, 0)
GREEN = (46, 204, 113)

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

PLAYER_COLOR = hex_to_rgb('{{PLAYER_COLOR}}')
ENEMY_COLOR = hex_to_rgb('{{ENEMY_COLOR}}')

score = 0
lives = 3
game_over = False

class Player:
    def __init__(self):
        self.rect = pygame.Rect(WIDTH // 2 - 25, HEIGHT - 80, 50, 50)
        self.speed = 6 * DIFFICULTY
    
    def update(self):
        keys = pygame.key.get_pressed()
        if keys[pygame.K_LEFT] or keys[pygame.K_a]:
            self.rect.x -= self.speed
        if keys[pygame.K_RIGHT] or keys[pygame.K_d]:
            self.rect.x += self.speed
        self.rect.x = max(0, min(WIDTH - self.rect.width, self.rect.x))
    
    def draw(self, screen):
        pygame.draw.rect(screen, PLAYER_COLOR, self.rect)
        font = pygame.font.Font(None, 20)
        text = font.render('{{PLAYER_NAME}}', True, WHITE)
        screen.blit(text, (self.rect.x, self.rect.y - 20))

class Bullet:
    def __init__(self, x, y):
        self.rect = pygame.Rect(x - 2, y, 4, 15)
        self.speed = 8
    
    def update(self):
        self.rect.y -= self.speed
        return self.rect.y < -self.rect.height
    
    def draw(self, screen):
        pygame.draw.rect(screen, YELLOW, self.rect)

class Enemy:
    def __init__(self):
        self.rect = pygame.Rect(random.randint(0, WIDTH - 40), -50, 40, 40)
        self.speed = (1 + random.random() * 2) * DIFFICULTY
        self.health = 1
    
    def update(self):
        self.rect.y += self.speed
        return self.rect.y > HEIGHT
    
    def draw(self, screen):
        pygame.draw.rect(screen, ENEMY_COLOR, self.rect)

class PowerUp:
    def __init__(self):
        self.rect = pygame.Rect(random.randint(0, WIDTH - 30), -30, 30, 30)
        self.speed = 2
    
    def update(self):
        self.rect.y += self.speed
        return self.rect.y > HEIGHT
    
    def draw(self, screen):
        pygame.draw.circle(screen, GREEN, (self.rect.x + 15, self.rect.y + 15), 15)
        font = pygame.font.Font(None, 24)
        text = font.render('+', True, WHITE)
        screen.blit(text, (self.rect.x + 10, self.rect.y + 5))

# Stars
stars = []
for i in range(100):
    stars.append({
        'x': random.randint(0, WIDTH),
        'y': random.randint(0, HEIGHT),
        'size': random.random() * 2,
        'speed': random.random() * 2 + 1
    })

player = Player()
bullets = []
enemies = []
power_ups = []

enemy_spawn_timer = 0
powerup_spawn_timer = 0

async def main():
    global score, lives, game_over, enemy_spawn_timer, powerup_spawn_timer
    
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption('{{GAME_TITLE}}')
    clock = pygame.time.Clock()
    running = True
    
    while running:
        dt = clock.tick(FPS) / 16.67
        
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_SPACE and not game_over:
                    bullets.append(Bullet(player.rect.x + player.rect.width // 2, player.rect.y))
                if event.key == pygame.K_r and game_over:
                    global player, bullets, enemies, power_ups
                    player = Player()
                    bullets = []
                    enemies = []
                    power_ups = []
                    score = 0
                    lives = 3
                    game_over = False
        
        if not game_over:
            # Update stars
            for star in stars:
                star['y'] += star['speed']
                if star['y'] > HEIGHT:
                    star['y'] = 0
                    star['x'] = random.randint(0, WIDTH)
            
            player.update()
            
            # Spawn enemies
            enemy_spawn_timer += dt
            if enemy_spawn_timer > 1000 / DIFFICULTY and len(enemies) < 8:
                enemies.append(Enemy())
                enemy_spawn_timer = 0
            
            # Spawn power-ups
            powerup_spawn_timer += dt
            if powerup_spawn_timer > 5000 and random.random() < 0.3:
                power_ups.append(PowerUp())
                powerup_spawn_timer = 0
            
            # Update bullets
            for bullet in bullets[:]:
                if bullet.update():
                    bullets.remove(bullet)
                else:
                    for enemy in enemies[:]:
                        if bullet.rect.colliderect(enemy.rect):
                            bullets.remove(bullet)
                            enemy.health -= 1
                            if enemy.health <= 0:
                                enemies.remove(enemy)
                                score += 10
                            break
            
            # Update enemies
            for enemy in enemies[:]:
                if enemy.update():
                    enemies.remove(enemy)
                elif player.rect.colliderect(enemy.rect):
                    enemies.remove(enemy)
                    lives -= 1
                    if lives <= 0:
                        game_over = True
            
            # Update power-ups
            for power_up in power_ups[:]:
                if power_up.update():
                    power_ups.remove(power_up)
                elif player.rect.colliderect(power_up.rect):
                    power_ups.remove(power_up)
                    lives = min(5, lives + 1)
        
        # Draw
        screen.fill(BLACK)
        
        # Stars
        for star in stars:
            pygame.draw.rect(screen, WHITE, (star['x'], star['y'], star['size'], star['size']))
        
        player.draw(screen)
        
        for bullet in bullets:
            bullet.draw(screen)
        
        for enemy in enemies:
            enemy.draw(screen)
        
        for power_up in power_ups:
            power_up.draw(screen)
        
        # UI
        font = pygame.font.Font(None, 36)
        score_text = font.render(f'Score: {score}', True, WHITE)
        lives_text = font.render(f'Lives: {lives}', True, WHITE)
        screen.blit(score_text, (10, 10))
        screen.blit(lives_text, (10, 50))
        
        if game_over:
            overlay = pygame.Surface((WIDTH, HEIGHT))
            overlay.set_alpha(200)
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


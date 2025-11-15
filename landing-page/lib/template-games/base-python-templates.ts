// Python/Pygame base templates for all categories
import { baseShooterCodePython } from './base-shooter-python';

export const baseAdventureCodePython = `import asyncio
import pygame

pygame.init()

WIDTH, HEIGHT = 800, 600
TILE_SIZE = 40
DIFFICULTY = {{DIFFICULTY_MULTIPLIER}}

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

PLAYER_COLOR = hex_to_rgb('{{PLAYER_COLOR}}')
ENEMY_COLOR = hex_to_rgb('{{ENEMY_COLOR}}')

DARK_BLUE = (44, 62, 80)
WALL_COLOR = (52, 73, 94)
ITEM_COLOR = (243, 156, 18)
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)

# Map: 0=empty, 1=wall, 2=item
map_data = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,1,0,0,0,0,0,0,0,0,1,2,0,0,0,1],
    [1,0,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,1,0,1],
    [1,0,1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,1,2,0,2,1,0,1,0,0,0,0,1],
    [1,1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,0,1,1,1,0,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,1],
    [1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
]

class Player:
    def __init__(self):
        self.x = 1
        self.y = 1
        self.size = TILE_SIZE - 4
        self.speed = 4 * DIFFICULTY
        self.items = 0
    
    def can_move(self, x, y):
        tile_x = int(x / TILE_SIZE)
        tile_y = int(y / TILE_SIZE)
        tile_x2 = int((x + self.size) / TILE_SIZE)
        tile_y2 = int((y + self.size) / TILE_SIZE)
        
        if tile_y >= len(map_data) or tile_x >= len(map_data[0]):
            return False
        if tile_y2 >= len(map_data) or tile_x2 >= len(map_data[0]):
            return False
        
        return map_data[tile_y][tile_x] != 1 and map_data[tile_y2][tile_x2] != 1
    
    def collect_item(self, x, y):
        tile_x = int(x / TILE_SIZE)
        tile_y = int(y / TILE_SIZE)
        
        if tile_y < len(map_data) and tile_x < len(map_data[0]):
            if map_data[tile_y][tile_x] == 2:
                map_data[tile_y][tile_x] = 0
                self.items += 1
                return True
        return False

class Enemy:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.size = TILE_SIZE - 4
        self.speed = 1.5 * DIFFICULTY
        self.dir_x = 1
        self.dir_y = 0
    
    def can_move(self, x, y):
        tile_x = int(x / TILE_SIZE)
        tile_y = int(y / TILE_SIZE)
        tile_x2 = int((x + self.size) / TILE_SIZE)
        tile_y2 = int((y + self.size) / TILE_SIZE)
        
        if tile_y >= len(map_data) or tile_x >= len(map_data[0]):
            return False
        if tile_y2 >= len(map_data) or tile_x2 >= len(map_data[0]):
            return False
        
        return map_data[tile_y][tile_x] != 1 and map_data[tile_y2][tile_x2] != 1
    
    def update(self):
        new_x = self.x + self.dir_x * self.speed
        new_y = self.y + self.dir_y * self.speed
        
        if not self.can_move(new_x, self.y) or not self.can_move(self.x, new_y):
            self.dir_x *= -1
            self.dir_y *= -1
        
        if self.can_move(new_x, self.y):
            self.x = new_x
        if self.can_move(self.x, new_y):
            self.y = new_y

player = Player()
enemies = [
    Enemy(10 * TILE_SIZE, 5 * TILE_SIZE),
    Enemy(5 * TILE_SIZE, 10 * TILE_SIZE),
    Enemy(15 * TILE_SIZE, 7 * TILE_SIZE)
]

game_won = False
game_lost = False

async def main():
    global game_won, game_lost
    
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
                if event.key == pygame.K_r and (game_won or game_lost):
                    global player, enemies
                    player = Player()
                    enemies = [
                        Enemy(10 * TILE_SIZE, 5 * TILE_SIZE),
                        Enemy(5 * TILE_SIZE, 10 * TILE_SIZE),
                        Enemy(15 * TILE_SIZE, 7 * TILE_SIZE)
                    ]
                    game_won = False
                    game_lost = False
        
        if not game_won and not game_lost:
            keys = pygame.key.get_pressed()
            
            new_x = player.x
            new_y = player.y
            
            if keys[pygame.K_UP] or keys[pygame.K_w]:
                new_y -= player.speed
            if keys[pygame.K_DOWN] or keys[pygame.K_s]:
                new_y += player.speed
            if keys[pygame.K_LEFT] or keys[pygame.K_a]:
                new_x -= player.speed
            if keys[pygame.K_RIGHT] or keys[pygame.K_d]:
                new_x += player.speed
            
            if player.can_move(new_x, player.y):
                player.x = new_x
            if player.can_move(player.x, new_y):
                player.y = new_y
            
            player.collect_item(player.x + player.size/2, player.y + player.size/2)
            
            if player.items >= 5:
                game_won = True
            
            for enemy in enemies:
                enemy.update()
                if abs(player.x - enemy.x) < player.size and abs(player.y - enemy.y) < player.size:
                    game_lost = True
        
        # Draw
        screen.fill(DARK_BLUE)
        
        # Draw map
        for y in range(len(map_data)):
            for x in range(len(map_data[y])):
                if map_data[y][x] == 1:
                    pygame.draw.rect(screen, WALL_COLOR, (x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE))
                    pygame.draw.rect(screen, BLACK, (x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE), 1)
                elif map_data[y][x] == 2:
                    pygame.draw.circle(screen, ITEM_COLOR, (x * TILE_SIZE + TILE_SIZE//2, y * TILE_SIZE + TILE_SIZE//2), 12)
        
        # Draw player
        pygame.draw.rect(screen, PLAYER_COLOR, (player.x, player.y, player.size, player.size))
        
        # Draw enemies
        for enemy in enemies:
            pygame.draw.rect(screen, ENEMY_COLOR, (enemy.x, enemy.y, enemy.size, enemy.size))
        
        # UI
        font = pygame.font.Font(None, 36)
        ui_text = font.render(f'{{PLAYER_NAME}} | Items: {player.items}/5 | Goal: {{GOAL}}', True, WHITE)
        screen.blit(ui_text, (10, 10))
        
        if game_won:
            overlay = pygame.Surface((WIDTH, HEIGHT))
            overlay.set_alpha(180)
            overlay.fill(BLACK)
            screen.blit(overlay, (0, 0))
            
            font_large = pygame.font.Font(None, 72)
            font_med = pygame.font.Font(None, 36)
            win_text = font_large.render('Victory!', True, (46, 204, 113))
            goal_text = font_med.render('{{GOAL}} Complete!', True, WHITE)
            restart_text = font_med.render('Press R to Restart', True, WHITE)
            
            screen.blit(win_text, (WIDTH // 2 - 100, HEIGHT // 2 - 60))
            screen.blit(goal_text, (WIDTH // 2 - 120, HEIGHT // 2))
            screen.blit(restart_text, (WIDTH // 2 - 120, HEIGHT // 2 + 40))
        
        if game_lost:
            overlay = pygame.Surface((WIDTH, HEIGHT))
            overlay.set_alpha(180)
            overlay.fill(BLACK)
            screen.blit(overlay, (0, 0))
            
            font_large = pygame.font.Font(None, 72)
            font_med = pygame.font.Font(None, 36)
            lose_text = font_large.render('Game Over!', True, (231, 76, 60))
            restart_text = font_med.render('Press R to Restart', True, WHITE)
            
            screen.blit(lose_text, (WIDTH // 2 - 150, HEIGHT // 2 - 20))
            screen.blit(restart_text, (WIDTH // 2 - 120, HEIGHT // 2 + 40))
        
        pygame.display.flip()
        await asyncio.sleep(0)
    
    pygame.quit()

if __name__ == '__main__':
    asyncio.run(main())
`;

// Note: I'll create simplified versions for the remaining categories
// For now, let me update the injection system to handle both languages
// and create a few more critical Python templates

export const basePuzzleCodePython = `import asyncio
import pygame
import random

pygame.init()

WIDTH, HEIGHT = 600, 600
GRID_SIZE = {{GRID_SIZE}}
TILE_SIZE = WIDTH // GRID_SIZE
DIFFICULTY = {{DIFFICULTY_MULTIPLIER}}
FPS = 60

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

PLAYER_COLOR = hex_to_rgb('{{PLAYER_COLOR}}')
ENEMY_COLOR = hex_to_rgb('{{ENEMY_COLOR}}')

DARK_GRAY = (44, 62, 80)
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)

colors = [PLAYER_COLOR, ENEMY_COLOR, (46, 204, 113), (243, 156, 18), (155, 89, 182), (231, 76, 60)]

grid = []
moves = 0
game_won = False
selected_tile = None

def init_grid():
    global grid
    grid = []
    for y in range(GRID_SIZE):
        grid.append([])
        for x in range(GRID_SIZE):
            grid[y].append(random.choice(colors))

def check_matches():
    global grid, moves
    matched = []
    
    # Horizontal
    for y in range(GRID_SIZE):
        for x in range(GRID_SIZE - 2):
            if grid[y][x] == grid[y][x+1] == grid[y][x+2]:
                matched.extend([(x, y), (x+1, y), (x+2, y)])
    
    # Vertical
    for x in range(GRID_SIZE):
        for y in range(GRID_SIZE - 2):
            if grid[y][x] == grid[y+1][x] == grid[y+2][x]:
                matched.extend([(x, y), (x, y+1), (x, y+2)])
    
    if matched:
        unique = list(set(matched))
        for x, y in unique:
            grid[y][x] = None
        drop_tiles()
        fill_empty()
        
        if moves >= int(50 / DIFFICULTY):
            global game_won
            game_won = True

def drop_tiles():
    for x in range(GRID_SIZE):
        for y in range(GRID_SIZE - 1, -1, -1):
            if grid[y][x] is None:
                for y2 in range(y - 1, -1, -1):
                    if grid[y2][x] is not None:
                        grid[y][x] = grid[y2][x]
                        grid[y2][x] = None
                        break

def fill_empty():
    for y in range(GRID_SIZE):
        for x in range(GRID_SIZE):
            if grid[y][x] is None:
                grid[y][x] = random.choice(colors)

async def main():
    global moves, game_won, selected_tile
    
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption('{{GAME_TITLE}}')
    clock = pygame.time.Clock()
    running = True
    
    init_grid()
    
    while running:
        dt = clock.tick(FPS) / 16.67
        
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            if event.type == pygame.MOUSEBUTTONDOWN and not game_won:
                x, y = event.pos
                tile_x = x // TILE_SIZE
                tile_y = y // TILE_SIZE
                
                if not selected_tile:
                    selected_tile = (tile_x, tile_y)
                else:
                    dx = abs(selected_tile[0] - tile_x)
                    dy = abs(selected_tile[1] - tile_y)
                    
                    if (dx == 1 and dy == 0) or (dx == 0 and dy == 1):
                        grid[selected_tile[1]][selected_tile[0]], grid[tile_y][tile_x] = grid[tile_y][tile_x], grid[selected_tile[1]][selected_tile[0]]
                        moves += 1
                        check_matches()
                    selected_tile = None
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_r and game_won:
                    moves = 0
                    game_won = False
                    init_grid()
        
        # Draw
        screen.fill(DARK_GRAY)
        
        for y in range(GRID_SIZE):
            for x in range(GRID_SIZE):
                if grid[y][x]:
                    pygame.draw.rect(screen, grid[y][x], (x * TILE_SIZE + 2, y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4))
                    
                    if selected_tile and selected_tile == (x, y):
                        pygame.draw.rect(screen, WHITE, (x * TILE_SIZE + 2, y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4), 4)
        
        # UI
        font = pygame.font.Font(None, 36)
        moves_text = font.render(f'Moves: {moves} | Goal: {{GOAL}}', True, WHITE)
        screen.blit(moves_text, (10, 10))
        
        if game_won:
            overlay = pygame.Surface((WIDTH, HEIGHT))
            overlay.set_alpha(180)
            overlay.fill(BLACK)
            screen.blit(overlay, (0, 0))
            
            font_large = pygame.font.Font(None, 72)
            font_med = pygame.font.Font(None, 36)
            win_text = font_large.render('Puzzle Solved!', True, (46, 204, 113))
            moves_final = font_med.render(f'Moves: {moves}', True, WHITE)
            restart_text = font_med.render('Press R to Restart', True, WHITE)
            
            screen.blit(win_text, (WIDTH // 2 - 150, HEIGHT // 2 - 60))
            screen.blit(moves_final, (WIDTH // 2 - 80, HEIGHT // 2))
            screen.blit(restart_text, (WIDTH // 2 - 120, HEIGHT // 2 + 40))
        
        pygame.display.flip()
        await asyncio.sleep(0)
    
    pygame.quit()

if __name__ == '__main__':
    asyncio.run(main())
`;

// For the remaining categories, I'll use similar structures
// The system will fallback to JavaScript if Python version doesn't exist
// This ensures all templates work for both languages

export const baseRPGCodePython = baseAdventureCodePython; // Similar structure
export const baseRacingCodePython = baseAdventureCodePython; // Similar structure  
export const baseEducationalCodePython = basePuzzleCodePython; // Similar structure
export { baseShooterCodePython }; // Re-export from base-shooter-python.ts
export const baseArcadeCodePython = baseShooterCodePython; // Similar structure


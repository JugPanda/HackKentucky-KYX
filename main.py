"""
Multi-Room Platformer Game
Web-compatible with pygbag
"""

import pygame
import asyncio
import random

# Initialize Pygame
pygame.init()

# Constants
WINDOW_WIDTH = 800
WINDOW_HEIGHT = 600
FPS = 60
PLAYER_MAX_HEALTH = 3

# Colors - Natural tones
BLACK = (26, 26, 26)
DARK_GRAY = (42, 42, 42)
GRAY = (85, 85, 85)
LIGHT_GRAY = (119, 119, 119)
GREEN = (34, 139, 34)  # Forest green for player
RED = (255, 107, 107)
WHITE = (255, 255, 255)
BLUE = (135, 206, 235)  # Sky blue background (more natural)
BROWN = (139, 90, 43)  # Brown for platforms (wood/earth)
EARTH = (101, 67, 33)  # Earth brown for ground
STONE = (105, 105, 105)  # Stone gray for platform borders

# Ground level
GROUND_LEVEL = WINDOW_HEIGHT - 50

# Room class
class Room:
    def __init__(self, platforms):
        self.platforms = platforms
    
    def draw(self, screen):
        for platform in self.platforms:
            platform.draw(screen)

# Platform class
class Platform:
    def __init__(self, x, y, width, height, color=BROWN):
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.color = color
    
    def get_rect(self):
        """Return pygame Rect for collision detection"""
        return pygame.Rect(self.x, self.y, self.width, self.height)
    
    def draw(self, screen):
        pygame.draw.rect(screen, self.color, (self.x, self.y, self.width, self.height))
        pygame.draw.rect(screen, STONE, (self.x, self.y, self.width, self.height), 2)

# Player class
class Player:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.width = 20
        self.height = 50
        self.speed = 4.5
        self.color = RED
        self.velocity_y = 0  # Vertical velocity
        self.velocity_x = 0  # Horizontal velocity
        self.on_ground = False
        self.jump_power = -15  # Negative because Y increases downward (max jump velocity)
        self.initial_jump_power = -10  # Initial jump velocity (lower than max)
        self.jump_hold_power = -0.4  # Additional upward force while holding jump
        self.gravity = 0.75    # Gravity strength
        self.friction = 0.9   # Ground friction
        self.is_jumping = False  # Track if currently jumping
        self.max_health = PLAYER_MAX_HEALTH
        self.health = self.max_health
        self.invuln_timer = 0
        self.invuln_duration = 60
        self.alive = True
    
    def get_rect(self):
        """Return pygame Rect for collision detection"""
        return pygame.Rect(
            self.x - self.width / 2,
            self.y - self.height / 2,
            self.width,
            self.height
        )
    
    def update(self, keys, platforms):
        if self.invuln_timer > 0:
            self.invuln_timer -= 1

        # Horizontal movement
        dx = 0
        if self.alive:
            if keys[pygame.K_a] or keys[pygame.K_LEFT]:
                dx -= self.speed
            if keys[pygame.K_d] or keys[pygame.K_RIGHT]:
                dx += self.speed
        else:
            self.velocity_x = 0
        
        # Apply horizontal velocity
        self.velocity_x = dx
        
        # Apply friction when on ground and not moving
        if self.on_ground and dx == 0:
            self.velocity_x *= self.friction
            if abs(self.velocity_x) < 0.1:
                self.velocity_x = 0
        
        # Check if jump key is pressed
        jump_key_pressed = keys[pygame.K_UP] or keys[pygame.K_SPACE]
        
        # Start jump (only when on ground)
        if self.alive and jump_key_pressed and self.on_ground:
            self.velocity_y = self.initial_jump_power  # Start with lower initial velocity
            self.on_ground = False
            self.is_jumping = True
        
        # Variable jump height: continue applying upward force while holding jump
        if self.is_jumping and jump_key_pressed and self.velocity_y < 0:
            # Apply additional upward force while holding jump
            # This increases upward velocity (makes it more negative)
            self.velocity_y += self.jump_hold_power
            # Limit to maximum jump power (most negative = highest jump)
            if self.velocity_y < self.jump_power:
                self.velocity_y = self.jump_power
        else:
            # Stop applying jump force when key is released or falling
            if self.velocity_y >= 0:
                self.is_jumping = False
        
        # Apply gravity
        self.velocity_y += self.gravity
        
        # Store previous position for collision detection
        prev_x = self.x
        prev_y = self.y
        
        # Update horizontal position first
        self.x += self.velocity_x
        
        # Check horizontal collisions
        player_rect = self.get_rect()
        for platform in platforms:
            platform_rect = platform.get_rect()
            if player_rect.colliderect(platform_rect):
                # Resolve horizontal collision based on movement direction
                if self.velocity_x > 0:  # Moving right, hit left side of platform
                    self.x = platform.x - self.width / 2
                    self.velocity_x = 0
                elif self.velocity_x < 0:  # Moving left, hit right side of platform
                    self.x = platform.x + platform.width + self.width / 2
                    self.velocity_x = 0
                # If no horizontal velocity, resolve based on position
                elif abs(self.velocity_x) < 0.01:
                    # Push out in direction of smallest overlap
                    overlap_left = (self.x + self.width / 2) - platform.x
                    overlap_right = (platform.x + platform.width) - (self.x - self.width / 2)
                    if overlap_left < overlap_right:
                        self.x = platform.x - self.width / 2
                    else:
                        self.x = platform.x + platform.width + self.width / 2
        
        # Update vertical position
        self.y += self.velocity_y
        
        # Check vertical collisions
        self.on_ground = False
        player_rect = self.get_rect()
        
        for platform in platforms:
            platform_rect = platform.get_rect()
            
            if player_rect.colliderect(platform_rect):
                # Use previous position to determine collision direction
                prev_player_bottom = prev_y + self.height / 2
                prev_player_top = prev_y - self.height / 2
                platform_top = platform.y
                platform_bottom = platform.y + platform.height
                
                # Check if player was above platform before moving (falling down)
                if prev_player_bottom <= platform_top and self.velocity_y >= 0:
                    # Landing on top of platform
                    self.y = platform_top - self.height / 2
                    self.velocity_y = 0
                    self.on_ground = True
                # Check if player was below platform before moving (jumping up)
                elif prev_player_top >= platform_bottom and self.velocity_y <= 0:
                    # Hitting platform from below
                    self.y = platform_bottom + self.height / 2
                    self.velocity_y = 0
                # Edge case: resolve based on overlap if direction unclear
                else:
                    overlap_top = (self.y + self.height / 2) - platform.y
                    overlap_bottom = (platform.y + platform.height) - (self.y - self.height / 2)
                    
                    if overlap_top < overlap_bottom:
                        self.y = platform.y - self.height / 2
                        self.velocity_y = 0
                        self.on_ground = True
                    else:
                        self.y = platform.y + platform.height + self.height / 2
                        self.velocity_y = 0
        
        # Ground collision (only if not on a platform)
        if not self.on_ground:
            player_bottom = self.y + self.height / 2
            if player_bottom >= GROUND_LEVEL:
                self.y = GROUND_LEVEL - self.height / 2
                self.velocity_y = 0
                self.on_ground = True
        
        # Check for room transitions (walking off edges)
        room_change = 0  # -1 for left (previous room), 1 for right (next room), 0 for no change
        
        # Check if player walked off left edge
        if self.x - self.width / 2 < 0:
            room_change = -1
            self.x = WINDOW_WIDTH - self.width / 2 - 10  # Position on right side of new room
        
        # Check if player walked off right edge
        elif self.x + self.width / 2 > WINDOW_WIDTH:
            room_change = 1
            self.x = self.width / 2 + 10  # Position on left side of new room
        
        # Keep player within canvas bounds (horizontal) - only if not transitioning
        if room_change == 0:
            self.x = max(self.width / 2, min(WINDOW_WIDTH - self.width / 2, self.x))
        
        # Prevent player from going above canvas
        if self.y - self.height / 2 < 0:
            self.y = self.height / 2
            self.velocity_y = 0
        
        return room_change

    def take_damage(self, amount=1, knockback=0):
        if self.invuln_timer > 0 or not self.alive:
            return

        self.health = max(0, self.health - amount)
        if self.health == 0:
            self.alive = False
            self.velocity_y = self.initial_jump_power
        else:
            self.invuln_timer = self.invuln_duration
            self.velocity_x = knockback
            # Small hop to telegraph impact
            self.velocity_y = self.initial_jump_power / 2
    
    def draw(self, screen):
        # Flash white while invulnerable to indicate recent damage
        draw_color = self.color
        if self.invuln_timer > 0 and (self.invuln_timer // 5) % 2 == 0:
            draw_color = WHITE

        pygame.draw.rect(
            screen,
            draw_color,
            (self.x - self.width / 2, self.y - self.height / 2, self.width, self.height)
        )
        
        # Draw velocity indicator (optional visual feedback)
        if not self.on_ground:
            pygame.draw.line(
                screen,
                RED,
                (self.x, self.y),
                (self.x + self.velocity_x * 2, self.y + self.velocity_y * 2),
                2
            )
        
        # Draw on-ground indicator
        if self.on_ground:
            pygame.draw.circle(
                screen,
                GREEN,
                (int(self.x), int(self.y + self.height / 2 + 5)),
                3
            )


# Simple enemy class
class Enemy:
    def __init__(self, x, y, width=28, height=36, color=(200, 60, 60), speed=1.2):
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.color = color
        self.speed = speed
        self.direction = 1
        self.velocity_x = 0
        self.velocity_y = 0
        self.gravity = 0.7
        self.acceleration = 0.25
        self.on_ground = False
        self.alive = True
        self.base_speed = speed
        self.chase_speed = speed * 1.8
        self.attack_speed = speed * 2.6
        self.attack_range = 120
        self.detection_range = 320
        self.vertical_tolerance = 160
        self.attack_cooldown = 90
        self.attack_cooldown_timer = 0
        self.attack_timer = 0
        self.attack_damage = 1
        self.state = "patrol"
        self.jump_power = -11
        self.jump_cooldown = 45
        self.jump_timer = 0
        self.current_platform = None
        self.patrol_timer = random.randint(90, 180)
        self.edge_padding = 12

    def get_rect(self):
        return pygame.Rect(self.x - self.width / 2, self.y - self.height / 2, self.width, self.height)

    def update(self, platforms, player):
        if not self.alive:
            return

        if self.jump_timer > 0:
            self.jump_timer -= 1

        self._update_state(player)
        self._handle_attack_logic()

        move_speed = self.base_speed
        if self.state == "chase":
            move_speed = self.chase_speed
        elif self.state == "attack":
            move_speed = self.attack_speed

        if self.state in ("chase", "attack") and player.alive:
            self._face_player(player)
        elif self.state == "patrol":
            self._handle_patrol_direction()

        prev_x = self.x
        prev_y = self.y

        # Horizontal movement with acceleration for smoother motion
        target_speed = move_speed * self.direction
        self.velocity_x += self.acceleration * (target_speed - self.velocity_x)
        self.x += self.velocity_x

        # Resolve horizontal collisions
        rect = self.get_rect()
        for p in platforms:
            pr = p.get_rect()
            if rect.colliderect(pr):
                if self.velocity_x > 0:
                    self.x = pr.x - self.width / 2
                elif self.velocity_x < 0:
                    self.x = pr.x + pr.width + self.width / 2
                self.velocity_x = 0
                rect = self.get_rect()

        # Apply gravity
        self.velocity_y += self.gravity
        self.y += self.velocity_y

        # Simple collision with platforms (land on top)
        self.on_ground = False
        self.current_platform = None
        rect = self.get_rect()
        for p in platforms:
            pr = p.get_rect()
            if rect.colliderect(pr):
                platform_top = p.y
                platform_bottom = p.y + p.height
                prev_bottom = prev_y + self.height / 2
                prev_top = prev_y - self.height / 2

                if prev_bottom <= platform_top and self.velocity_y >= 0:
                    # Land on platform
                    self.y = platform_top - self.height / 2
                    self.velocity_y = 0
                    self.on_ground = True
                    self.current_platform = p
                    rect = self.get_rect()
                elif prev_top >= platform_bottom and self.velocity_y <= 0:
                    # Hit from below
                    self.y = platform_bottom + self.height / 2
                    self.velocity_y = 0
                    rect = self.get_rect()
                else:
                    # Side overlap fallback: revert horizontal position
                    self.x = prev_x
                    self.velocity_x = 0
                    rect = self.get_rect()

        # Clamp to ground
        if not self.on_ground:
            enemy_bottom = self.y + self.height / 2
            if enemy_bottom >= GROUND_LEVEL:
                self.y = GROUND_LEVEL - self.height / 2
                self.velocity_y = 0
                self.on_ground = True
                self.current_platform = None
                self.velocity_x *= 0.8

        # Keep inside screen and reverse on edges
        left_edge = self.x - self.width / 2
        right_edge = self.x + self.width / 2
        if left_edge < 0:
            self.x = self.width / 2
            self.direction = 1
            self.velocity_x = 0
        elif right_edge > WINDOW_WIDTH:
            self.x = WINDOW_WIDTH - self.width / 2
            self.direction = -1
            self.velocity_x = 0

        self._maybe_jump(platforms, player)

    def draw(self, screen):
        pygame.draw.rect(screen, self.color, (self.x - self.width / 2, self.y - self.height / 2, self.width, self.height))
        pygame.draw.rect(screen, BLACK, (self.x - self.width / 2, self.y - self.height / 2, self.width, self.height), 2)

    def take_damage(self, amount=9999):
        # One-hit kill for now
        self.alive = False

    def _update_state(self, player):
        if self.attack_timer > 0:
            self.state = "attack"
            return

        if not player.alive:
            self.state = "patrol"
            return

        dx = abs(player.x - self.x)
        dy = abs(player.y - self.y)

        if dx <= self.attack_range and dy <= 60 and self.attack_cooldown_timer <= 0:
            self.state = "attack"
            self.attack_timer = 30
        elif dx <= self.detection_range and dy <= self.vertical_tolerance:
            self.state = "chase"
        else:
            self.state = "patrol"

    def _handle_attack_logic(self):
        if self.attack_timer > 0:
            self.attack_timer -= 1
            if self.attack_timer <= 0:
                self.attack_cooldown_timer = self.attack_cooldown
        elif self.attack_cooldown_timer > 0:
            self.attack_cooldown_timer -= 1

    def _handle_patrol_direction(self):
        if not self.on_ground:
            return

        self.patrol_timer -= 1
        if self.patrol_timer <= 0:
            if random.random() < 0.4:
                self.direction *= -1
            self.patrol_timer = random.randint(60, 180)

        if self.current_platform and self._near_platform_edge(padding=self.edge_padding):
            self.direction *= -1

    def _maybe_jump(self, platforms, player):
        if not self.on_ground or self.jump_timer > 0:
            return

        need_jump = False

        # Jump toward a higher player while chasing/attacking
        if self.state in ("chase", "attack"):
            if player.y + player.height / 2 < self.y - 10:
                need_jump = True

            if self.current_platform and self._near_platform_edge():
                need_jump = True

        else:
            # Occasional patrol hops to change elevation
            if self.current_platform and self._near_platform_edge() and random.random() < 0.15:
                need_jump = True

        if need_jump:
            self.velocity_y = self.jump_power
            self.on_ground = False
            self.current_platform = None
            self.jump_timer = self.jump_cooldown

    def _near_platform_edge(self, padding=8):
        if not self.current_platform:
            return False
        left_bound = self.current_platform.x + padding
        right_bound = self.current_platform.x + self.current_platform.width - padding
        return self.x - self.width / 2 <= left_bound or self.x + self.width / 2 >= right_bound

    def _face_player(self, player):
        dx = player.x - self.x
        if abs(dx) <= 5:
            return
        self.direction = 1 if dx > 0 else -1

# Main async function for pygbag compatibility
async def main():
    # Set up the display
    screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
    pygame.display.set_caption("WASD Movement with Gravity - Multi-Room")
    clock = pygame.time.Clock()
    
    # Create player
    player = Player(WINDOW_WIDTH / 2, GROUND_LEVEL - 30)
    game_over = False
    
    # Create rooms with different platform layouts
    # All platforms are nicely spread out with varied sizes and no stacking
    rooms = [
        # Room 0 - Progressive path with varied sizes (reduced)
        Room([
            Platform(80, 480, 240, 32),    # Starting platform (large, left)
            Platform(500, 450, 180, 25),   # Medium-large platform (middle-right)
            Platform(120, 400, 200, 28),   # Large platform (left-middle)
            Platform(600, 350, 160, 22),   # Medium platform (right side)
            Platform(200, 300, 140, 20),   # Medium platform (left-middle)
        ]),
        # Room 1 - Zigzag pattern with varied sizes (reduced)
        Room([
            Platform(100, 480, 220, 30),   # Starting platform (large, left-middle)
            Platform(580, 450, 250, 33),   # Very large platform (right side)
            Platform(50, 400, 120, 18),    # Small-medium platform (far left)
            Platform(500, 350, 190, 26),  # Large platform (middle-right)
            Platform(150, 300, 130, 19),   # Medium platform (left-middle)
        ]),
        # Room 2 - Staircase with varied sizes (reduced)
        Room([
            Platform(60, 500, 230, 31),    # Starting platform (large, far left)
            Platform(120, 400, 100, 15),    # Small platform (left-middle)
            Platform(200, 300, 280, 34),   # Very large platform (middle-left)
            Platform(580, 250, 150, 21),   # Medium platform (right side)
        ]),
        # Room 3 - Circular spread with varied sizes (reduced)
        Room([
            Platform(350, 480, 260, 32),   # Starting platform (very large, center)
            Platform(50, 450, 120, 18),    # Small-medium platform (far left)
            Platform(650, 450, 180, 24),   # Medium-large platform (right side)
            Platform(120, 400, 220, 29),   # Large platform (left side)
            Platform(250, 350, 190, 25),   # Large platform (middle-left)
            Platform(400, 300, 200, 26),   # Large platform (center)
        ]),
        # Room 4 - Mixed pattern with varied sizes (reduced)
        Room([
            Platform(80, 500, 230, 31),    # Starting platform (large, far left)
            Platform(560, 480, 250, 33),   # Very large platform (right side)
            Platform(150, 450, 110, 17),    # Small platform (left-middle)
            Platform(600, 420, 210, 29),   # Large platform (right side)
            Platform(220, 300, 280, 34),   # Very large platform (middle-left)
        ]),
    ]
    
    # Current room index
    current_room = 0
    # Create simple enemies per room (place on first platform if available, otherwise on ground)
    enemies_by_room = []
    for room in rooms:
        room_enemies = []
        if room.platforms:
            p = room.platforms[0]
            ex = p.x + p.width / 2
            ey = p.y - 18  # place on top of platform
        else:
            ex = WINDOW_WIDTH / 2
            ey = GROUND_LEVEL - 18
        room_enemies.append(Enemy(ex, ey))
        enemies_by_room.append(room_enemies)
    
    # Font for instructions
    font = pygame.font.Font(None, 24)
    font_large = pygame.font.Font(None, 64)
    
    # Game loop
    running = True
    while running:
        # Handle events
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
        
        # Get pressed keys
        keys = pygame.key.get_pressed()

        # Keep previous player y for stomp detection
        prev_player_y = player.y

        # Update player and check for room transitions
        room_change = player.update(keys, rooms[current_room].platforms)
        if not player.alive:
            game_over = True

        # Handle room transitions
        if room_change != 0 and not game_over:
            new_room = current_room + room_change
            # Wrap around rooms (loop from last to first and vice versa)
            if new_room < 0:
                current_room = len(rooms) - 1
            elif new_room >= len(rooms):
                current_room = 0
            else:
                current_room = new_room

        # Update enemies in the current room
        room_enemies = enemies_by_room[current_room]
        for enemy in list(room_enemies):
            enemy.update(rooms[current_room].platforms, player)

            # Collision detection between player and enemy
            if player.alive and player.get_rect().colliderect(enemy.get_rect()):
                # Consider it a stomp if player's previous bottom was above enemy top and player is falling
                player_prev_bottom = prev_player_y + player.height / 2
                enemy_top = enemy.y - enemy.height / 2
                if player_prev_bottom <= enemy_top and player.velocity_y > 0:
                    # Stomp: kill enemy and bounce player
                    enemy.take_damage()
                    player.velocity_y = player.initial_jump_power  # bounce up a bit
                else:
                    # Taking damage from an enemy attack
                    knockback = -8 if player.x < enemy.x else 8
                    player.take_damage(enemy.attack_damage, knockback)
                    if not player.alive:
                        game_over = True

            # Remove dead enemies
            if not enemy.alive:
                try:
                    room_enemies.remove(enemy)
                except ValueError:
                    pass
        
        # Draw everything
        screen.fill(BLUE)
        
        # Draw ground
        pygame.draw.rect(screen, EARTH, (0, GROUND_LEVEL, WINDOW_WIDTH, WINDOW_HEIGHT - GROUND_LEVEL))
        pygame.draw.line(screen, BROWN, (0, GROUND_LEVEL), (WINDOW_WIDTH, GROUND_LEVEL), 2)
        
        # Draw current room's platforms
        rooms[current_room].draw(screen)
        # Draw enemies for the current room
        for enemy in enemies_by_room[current_room]:
            enemy.draw(screen)
        
        # Draw player
        player.draw(screen)
        
        # Draw instructions and room info
        instructions = [
            "Use WASD or Arrow Keys to move",
            "Space to jump",
            "Enemies chase and jump toward you",
            f"Room: {current_room + 1}/{len(rooms)}",
            "Walk off edges to change rooms"
        ]
        for i, text in enumerate(instructions):
            text_surface = font.render(text, True, WHITE)
            screen.blit(text_surface, (10, 10 + i * 30))

        # Draw player health on the top-right
        health_text = font.render(f"Health: {player.health}/{player.max_health}", True, WHITE)
        screen.blit(health_text, (WINDOW_WIDTH - health_text.get_width() - 10, 10))

        if game_over:
            overlay = pygame.Surface((WINDOW_WIDTH, WINDOW_HEIGHT), pygame.SRCALPHA)
            overlay.fill((0, 0, 0, 160))
            screen.blit(overlay, (0, 0))
            game_over_text = font_large.render("Game Over", True, WHITE)
            screen.blit(
                game_over_text,
                (
                    (WINDOW_WIDTH - game_over_text.get_width()) / 2,
                    (WINDOW_HEIGHT - game_over_text.get_height()) / 2 - 20,
                ),
            )
            hint_text = font.render("The enemies overwhelmed you!", True, WHITE)
            screen.blit(
                hint_text,
                (
                    (WINDOW_WIDTH - hint_text.get_width()) / 2,
                    (WINDOW_HEIGHT - hint_text.get_height()) / 2 + 30,
                ),
            )
        
        # Update display
        pygame.display.flip()
        
        # Use async sleep for web compatibility
        await asyncio.sleep(0)
        clock.tick(FPS)

if __name__ == "__main__":
    # For local testing, use asyncio.run()
    # When running with pygbag, it will handle async execution automatically
    asyncio.run(main()) 

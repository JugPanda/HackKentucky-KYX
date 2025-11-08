
import pygame
import sys

# Initialize Pygame
pygame.init()

# Constants
WINDOW_WIDTH = 800
WINDOW_HEIGHT = 600
FPS = 60

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
    
    def get_rect(self):
        """Return pygame Rect for collision detection"""
        return pygame.Rect(
            self.x - self.width / 2,
            self.y - self.height / 2,
            self.width,
            self.height
        )
    
    def update(self, keys, platforms):
        # Horizontal movement
        dx = 0
        if keys[pygame.K_a] or keys[pygame.K_LEFT]:
            dx -= self.speed
        if keys[pygame.K_d] or keys[pygame.K_RIGHT]:
            dx += self.speed
        
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
        if jump_key_pressed and self.on_ground:
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
    
    def draw(self, screen):
        # Draw player
        pygame.draw.rect(
            screen,
            self.color,
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

# Main function
def main():
    # Set up the display
    screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
    pygame.display.set_caption("WASD Movement with Gravity - Multi-Room")
    clock = pygame.time.Clock()
    
    # Create player
    player = Player(WINDOW_WIDTH / 2, GROUND_LEVEL - 30)
    
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
    
    # Font for instructions
    font = pygame.font.Font(None, 24)
    
    # Game loop
    running = True
    while running:
        # Handle events
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
        
        # Get pressed keys
        keys = pygame.key.get_pressed()
        
        # Update player and check for room transitions
        room_change = player.update(keys, rooms[current_room].platforms)
        
        # Handle room transitions
        if room_change != 0:
            new_room = current_room + room_change
            # Wrap around rooms (loop from last to first and vice versa)
            if new_room < 0:
                current_room = len(rooms) - 1
            elif new_room >= len(rooms):
                current_room = 0
            else:
                current_room = new_room
        
        # Draw everything
        screen.fill(BLUE)
        
        # Draw ground
        pygame.draw.rect(screen, EARTH, (0, GROUND_LEVEL, WINDOW_WIDTH, WINDOW_HEIGHT - GROUND_LEVEL))
        pygame.draw.line(screen, BROWN, (0, GROUND_LEVEL), (WINDOW_WIDTH, GROUND_LEVEL), 2)
        
        # Draw current room's platforms
        rooms[current_room].draw(screen)
        
        # Draw player
        player.draw(screen)
        
        # Draw instructions and room info
        instructions = [
            "Use WASD or Arrow Keys to move",
            "Space to jump",
            f"Room: {current_room + 1}/{len(rooms)}",
            "Walk off edges to change rooms"
        ]
        for i, text in enumerate(instructions):
            text_surface = font.render(text, True, WHITE)
            screen.blit(text_surface, (10, 10 + i * 30))
        
        # Update display
        pygame.display.flip()
        clock.tick(FPS)
    
    # Quit
    pygame.quit()
    sys.exit()

if __name__ == "__main__":
    main() 
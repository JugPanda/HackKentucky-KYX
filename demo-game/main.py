"""
Multi-Room Platformer Game
Web-compatible with pygbag
"""

import asyncio
import json
import math
import random
from pathlib import Path

import pygame

# Initialize Pygame
pygame.init()

CONFIG_PATH = Path(__file__).with_name("game_config.json")

DEFAULT_CONFIG = {
    "story": {
        "title": "Riverside Relay",
        "leadName": "Dr. Rowan Hale",
        "codename": "Beacon",
        "rivalName": "The Mireborn",
        "hubName": "Riverside Relay",
        "hubDescription": "Stacked containers form a neon-lit lab above the floodline. Solar rigs, med bays, and a patched radio tower pierce the fog.",
        "goal": "Synthesize the Riverside serum before the river corrodes the hub.",
        "tone": "hopeful",
        "difficulty": "veteran",
        "gameOverTitle": "Shade Dispersed",
        "gameOverMessage": "The abyss reclaims your light...",
        "instructions": [
            "Type: narrative platformer",
            "Players explore neon labs above flooded streets",
        ],
    },
    "tuning": {
        "playerMaxHealth": 3,
        "runMultiplier": 1.45,
        "dashSpeed": 14,
        "enemyBaseSpeed": 1.2,
    },
    "colors": {
        "accent": "#82ceff",
        "hud": "#d3eaff",
        "backgroundTop": "#0e1521",
        "backgroundBottom": "#132035",
    },
}


def deep_merge(base, override):
    for key, value in override.items():
        if (
            isinstance(value, dict)
            and isinstance(base.get(key), dict)
        ):
            deep_merge(base[key], value)
        else:
            base[key] = value
    return base


def load_game_config():
    data = {}
    if CONFIG_PATH.exists():
        try:
            with CONFIG_PATH.open("r", encoding="utf-8") as config_file:
                data = json.load(config_file)
        except json.JSONDecodeError:
            data = {}
    merged = json.loads(json.dumps(DEFAULT_CONFIG))
    return deep_merge(merged, data)


GAME_CONFIG = load_game_config()
STORY_CONFIG = GAME_CONFIG["story"]
TUNING_CONFIG = GAME_CONFIG["tuning"]
COLOR_CONFIG = GAME_CONFIG.get("colors", {})


def parse_hex_color(value: str):
    value = value.lstrip("#")
    if len(value) == 6:
        return tuple(int(value[i : i + 2], 16) for i in range(0, 6, 2))
    if len(value) == 3:
        return tuple(int(value[i] * 2, 16) for i in range(3))
    raise ValueError("Unsupported color format")


def color_from_config(key: str, fallback):
    raw = COLOR_CONFIG.get(key)
    if isinstance(raw, (list, tuple)) and len(raw) >= 3:
        return tuple(int(c) for c in raw[:3])
    if isinstance(raw, str):
        try:
            return parse_hex_color(raw)
        except ValueError:
            return fallback
    return fallback

# Constants
WINDOW_WIDTH = 800
WINDOW_HEIGHT = 600
FPS = 60
PLAYER_MAX_HEALTH = max(1, int(TUNING_CONFIG.get("playerMaxHealth", 3)))
RUN_MULTIPLIER = float(TUNING_CONFIG.get("runMultiplier", 1.45))
DASH_SPEED = float(TUNING_CONFIG.get("dashSpeed", 14))
DASH_DURATION = 14
DASH_COOLDOWN = 48
DASH_GRAVITY_SCALE = 0.25
RUN_DUST_COOLDOWN = 5
ENEMY_BASE_SPEED = float(TUNING_CONFIG.get("enemyBaseSpeed", 1.2))

# Colors tuned toward a Hollow Knight inspired palette
WHITE = (245, 246, 255)
INK_BLACK = (8, 9, 16)
MIDNIGHT_BLUE = color_from_config("backgroundTop", (14, 21, 33))
DEEP_NAVY = color_from_config("backgroundBottom", (19, 32, 53))
ABYSS_TEAL = (36, 57, 78)
MIST_BLUE = (78, 101, 128)
PALE_GLOW = color_from_config("hud", (211, 234, 255))
ACCENT_CYAN = color_from_config("accent", (130, 206, 255))
SOFT_PURPLE = (137, 119, 173)
GROUND_SHADOW = (15, 18, 24)
GROUND_LIGHT = (38, 44, 55)
PLATFORM_BASE = (36, 44, 60)
PLATFORM_EDGE = (66, 80, 109)
PLAYER_BODY = (210, 214, 225)
PLAYER_OUTLINE = (40, 50, 64)
ENEMY_BODY = (72, 111, 140)
ENEMY_OUTLINE = (22, 27, 38)
GLOW_COLOR = (120, 205, 255, 90)

# Ground level
GROUND_LEVEL = WINDOW_HEIGHT - 50


def build_vertical_gradient(width, height, top_color, bottom_color):
    surface = pygame.Surface((width, height))
    for y in range(height):
        t = y / (height - 1)
        color = (
            int(top_color[0] * (1 - t) + bottom_color[0] * t),
            int(top_color[1] * (1 - t) + bottom_color[1] * t),
            int(top_color[2] * (1 - t) + bottom_color[2] * t),
        )
        pygame.draw.line(surface, color, (0, y), (width, y))
    return surface


BACKGROUND_LAYERS = [
    {"color": (18, 30, 47), "parallax": 0.1, "height": 110},
    {"color": (24, 38, 58), "parallax": 0.18, "height": 80},
    {"color": (30, 48, 68), "parallax": 0.26, "height": 60},
]


def draw_parallax_layers(screen, timer, room_index):
    for idx, layer in enumerate(BACKGROUND_LAYERS):
        offset = (timer * 30 * layer["parallax"] + room_index * 60) % 200
        base_y = GROUND_LEVEL - layer["height"]
        for x in range(-200, WINDOW_WIDTH + 200, 160):
            peak_offset = math.sin((timer * 0.3) + (x * 0.02)) * (12 + idx * 6)
            pts = [
                (x + offset, GROUND_LEVEL),
                (x + 80 + offset, base_y - peak_offset),
                (x + 160 + offset, GROUND_LEVEL),
            ]
            pygame.draw.polygon(screen, layer["color"], pts)


def draw_mist_overlay(screen, timer):
    mist = pygame.Surface((WINDOW_WIDTH, WINDOW_HEIGHT), pygame.SRCALPHA)
    alpha = 28 + int(12 * math.sin(timer * 0.5))
    mist.fill((MIST_BLUE[0], MIST_BLUE[1], MIST_BLUE[2], alpha))
    screen.blit(mist, (0, 0))


def build_ground_surface():
    ground_surface = pygame.Surface((WINDOW_WIDTH, WINDOW_HEIGHT - GROUND_LEVEL))
    for y in range(ground_surface.get_height()):
        t = y / max(1, ground_surface.get_height() - 1)
        color = (
            int(GROUND_SHADOW[0] * (1 - t) + GROUND_LIGHT[0] * t),
            int(GROUND_SHADOW[1] * (1 - t) + GROUND_LIGHT[1] * t),
            int(GROUND_SHADOW[2] * (1 - t) + GROUND_LIGHT[2] * t),
        )
        pygame.draw.line(ground_surface, color, (0, y), (WINDOW_WIDTH, y))
    return ground_surface


GROUND_SURFACE = build_ground_surface()


def draw_ground(screen):
    screen.blit(GROUND_SURFACE, (0, GROUND_LEVEL))
    pygame.draw.line(screen, PLATFORM_EDGE, (0, GROUND_LEVEL), (WINDOW_WIDTH, GROUND_LEVEL), 2)


def draw_ui(screen, font, player, current_room, total_rooms):
    hud_color = ACCENT_CYAN
    lead_name = STORY_CONFIG.get("leadName", "Lead")
    codename = STORY_CONFIG.get("codename", "Codename")
    rival = STORY_CONFIG.get("rivalName", "Rival")
    goal = STORY_CONFIG.get("goal", "Reach the exit.")
    instructions = [
        STORY_CONFIG.get("title", "KYX Demo"),
        "WASD / Arrows: move",
        "Space: jump | Shift: sprint | Ctrl / J: dash",
        f"Lead: {lead_name} (\"{codename}\")",
        f"Rival: {rival}",
        f"Goal: {goal}",
        f"Room {current_room + 1}/{total_rooms}",
    ]
    extra_lines = STORY_CONFIG.get("instructions") or []
    instructions.extend(extra_lines[:3])
    for i, text in enumerate(instructions):
        text_surface = font.render(text, True, hud_color)
        screen.blit(text_surface, (12, 12 + i * 26))

    for i in range(player.max_health):
        orb_color = PALE_GLOW if i < player.health else (80, 90, 110)
        center = (WINDOW_WIDTH - 30 - i * 26, 32)
        pygame.draw.circle(screen, orb_color, center, 10)
        pygame.draw.circle(screen, PLAYER_OUTLINE, center, 10, 2)


class Firefly:
    def __init__(self):
        self.reset()

    def reset(self):
        self.x = random.uniform(0, WINDOW_WIDTH)
        self.y = random.uniform(60, GROUND_LEVEL - 60)
        self.speed = random.uniform(10, 24)
        self.phase = random.uniform(0, 2 * math.pi)
        self.radius = random.uniform(2, 4)

    def update(self, dt):
        self.phase += dt * 1.5
        self.x += math.cos(self.phase) * self.speed * dt
        self.y += math.sin(self.phase * 0.8) * self.speed * 0.2 * dt
        if self.x < -20 or self.x > WINDOW_WIDTH + 20:
            self.reset()

    def draw(self, screen):
        glow = pygame.Surface((16, 16), pygame.SRCALPHA)
        pygame.draw.circle(glow, GLOW_COLOR, (8, 8), 6)
        screen.blit(glow, (self.x - 8, self.y - 8), special_flags=pygame.BLEND_ADD)
        pygame.draw.circle(screen, PALE_GLOW, (int(self.x), int(self.y)), int(self.radius))


class GroundDustParticle:
    def __init__(self, x, y, facing, intense=False):
        spread = 6 if intense else 4
        self.x = x + random.uniform(-spread, spread)
        self.y = y + random.uniform(-2, 2)
        speed = 2.5 if intense else 1.5
        self.vx = random.uniform(-0.6, 0.6) + facing * speed
        self.vy = random.uniform(-1.2, -0.3) if intense else random.uniform(-0.6, -0.2)
        self.life = random.randint(22, 32) if intense else random.randint(16, 24)
        self.age = 0
        self.intense = intense

    def update(self):
        self.x += self.vx
        self.y += self.vy
        self.vy += 0.12
        self.age += 1
        return self.age < self.life

    def draw(self, screen):
        remaining = 1 - (self.age / self.life)
        alpha = max(0, int(140 * remaining))
        radius = 5 if self.intense else 4
        surface = pygame.Surface((radius * 2, radius * 2), pygame.SRCALPHA)
        pygame.draw.circle(
            surface,
            (GROUND_LIGHT[0], GROUND_LIGHT[1], GROUND_LIGHT[2], alpha),
            (radius, radius),
            radius,
        )
        screen.blit(surface, (self.x - radius, self.y - radius), special_flags=pygame.BLEND_PREMULTIPLIED)


# Room class
class Room:
    def __init__(self, platforms):
        self.platforms = platforms
    
    def draw(self, screen):
        for platform in self.platforms:
            platform.draw(screen)

# Platform class
class Platform:
    def __init__(self, x, y, width, height, color=PLATFORM_BASE):
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.color = color
    
    def get_rect(self):
        """Return pygame Rect for collision detection"""
        return pygame.Rect(self.x, self.y, self.width, self.height)
    
    def draw(self, screen):
        surface = pygame.Surface((self.width, self.height + 6), pygame.SRCALPHA)
        pygame.draw.rect(surface, self.color, (0, 0, self.width, self.height))
        pygame.draw.rect(surface, PLATFORM_EDGE, (0, self.height - 6, self.width, 6))
        pygame.draw.line(surface, ACCENT_CYAN, (4, 4), (self.width - 4, 2), 1)
        screen.blit(surface, (self.x, self.y))

# Player class
class Player:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.width = 20
        self.height = 50
        self.speed = 4.5
        self.run_multiplier = RUN_MULTIPLIER
        self.is_running = False
        self.is_dashing = False
        self.dash_timer = 0
        self.dash_cooldown_timer = 0
        self.dash_direction = 1
        self.dash_speed = DASH_SPEED
        self.facing = 1
        self.dust_timer = 0
        self.base_color = PLAYER_BODY
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
    
    def update(self, keys, platforms, dust_particles=None):
        if self.invuln_timer > 0:
            self.invuln_timer -= 1
        if self.dash_cooldown_timer > 0:
            self.dash_cooldown_timer -= 1
        if self.is_dashing:
            self.dash_timer -= 1
            if self.dash_timer <= 0:
                self.is_dashing = False
        if self.dust_timer > 0:
            self.dust_timer -= 1

        # Horizontal movement
        dx = 0
        run_pressed = keys[pygame.K_LSHIFT] or keys[pygame.K_RSHIFT]
        move_speed = self.speed * (self.run_multiplier if run_pressed else 1)
        dash_pressed = keys[pygame.K_LCTRL] or keys[pygame.K_RCTRL] or keys[pygame.K_j]

        if self.alive:
            if keys[pygame.K_a] or keys[pygame.K_LEFT]:
                dx -= move_speed
            if keys[pygame.K_d] or keys[pygame.K_RIGHT]:
                dx += move_speed
        else:
            self.velocity_x = 0

        if dx != 0:
            self.facing = 1 if dx > 0 else -1
        self.is_running = run_pressed and dx != 0 and not self.is_dashing

        if (
            dash_pressed
            and not self.is_dashing
            and self.dash_cooldown_timer <= 0
            and self.alive
        ):
            direction = self.facing if dx == 0 else (1 if dx > 0 else -1)
            if direction == 0:
                direction = 1
            self.is_dashing = True
            self.dash_direction = direction
            self.dash_timer = DASH_DURATION
            self.dash_cooldown_timer = DASH_COOLDOWN
            self.velocity_y = 0

        # Apply horizontal velocity
        if self.is_dashing:
            self.velocity_x = self.dash_direction * self.dash_speed
        else:
            self.velocity_x = dx

        # Apply friction when on ground and not moving
        if self.on_ground and dx == 0 and not self.is_dashing:
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
        if self.is_dashing:
            self.velocity_y += self.gravity * DASH_GRAVITY_SCALE
        else:
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

        self._maybe_emit_dust(dust_particles)

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
        body_color = self.base_color if self.alive else SOFT_PURPLE
        if self.invuln_timer > 0 and (self.invuln_timer // 4) % 2 == 0:
            body_color = PALE_GLOW

        # Faint shadow
        shadow_surface = pygame.Surface((int(self.width * 1.8), 16), pygame.SRCALPHA)
        pygame.draw.ellipse(shadow_surface, (10, 10, 20, 90), (0, 0, shadow_surface.get_width(), 12))
        screen.blit(
            shadow_surface,
            (self.x - shadow_surface.get_width() / 2, self.y + self.height / 2 - 4),
        )

        # Cloak
        cloak_points = [
            (self.x - self.width / 2 - 6, self.y + 4),
            (self.x, self.y + self.height / 2 - 4),
            (self.x + self.width / 2 + 6, self.y + 4),
            (self.x, self.y + self.height / 2 + 2),
        ]
        pygame.draw.polygon(screen, SOFT_PURPLE, cloak_points)
        pygame.draw.lines(screen, PLAYER_OUTLINE, False, cloak_points[:3], 2)

        # Body
        body_rect = pygame.Rect(
            self.x - self.width / 2,
            self.y - self.height / 2 + 6,
            self.width,
            self.height - 6,
        )
        pygame.draw.ellipse(screen, body_color, body_rect)
        pygame.draw.ellipse(screen, PLAYER_OUTLINE, body_rect, 2)

        # Head
        head_rect = pygame.Rect(
            self.x - self.width / 2 + 2,
            self.y - self.height / 2 - 6,
            self.width - 4,
            self.height / 2,
        )
        pygame.draw.ellipse(screen, body_color, head_rect)
        pygame.draw.ellipse(screen, PLAYER_OUTLINE, head_rect, 2)

        horn_left = [
            (self.x - 6, self.y - self.height / 2 - 2),
            (self.x - 13, self.y - self.height / 2 - 16),
            (self.x - 4, self.y - self.height / 2 - 8),
        ]
        horn_right = [
            (self.x + 6, self.y - self.height / 2 - 2),
            (self.x + 13, self.y - self.height / 2 - 16),
            (self.x + 4, self.y - self.height / 2 - 8),
        ]
        pygame.draw.polygon(screen, PLAYER_BODY, horn_left)
        pygame.draw.polygon(screen, PLAYER_BODY, horn_right)
        pygame.draw.lines(screen, PLAYER_OUTLINE, False, horn_left, 2)
        pygame.draw.lines(screen, PLAYER_OUTLINE, False, horn_right, 2)

        # Wisp trail while moving through air or dashing
        if not self.on_ground or self.is_dashing:
            pygame.draw.line(
                screen,
                ACCENT_CYAN,
                (self.x, self.y),
                (self.x - self.velocity_x * 2, self.y - self.velocity_y * 2),
                2,
            )

    def _maybe_emit_dust(self, dust_particles):
        if dust_particles is None or not self.on_ground:
            return

        speed_mag = abs(self.velocity_x)
        if self.is_dashing and self.dust_timer <= 0:
            self._spawn_dust(dust_particles, intense=True, count=3)
            self.dust_timer = RUN_DUST_COOLDOWN
        elif self.is_running and speed_mag > self.speed * 1.05 and self.dust_timer <= 0:
            self._spawn_dust(dust_particles, intense=False, count=1)
            self.dust_timer = RUN_DUST_COOLDOWN + 3

    def _spawn_dust(self, dust_particles, intense=False, count=1):
        if dust_particles is None:
            return
        facing = self.facing if self.facing != 0 else 1
        foot_y = self.y + self.height / 2 + 3
        for _ in range(count):
            dust_particles.append(GroundDustParticle(self.x, foot_y, facing, intense=intense))


# Simple enemy class
class Enemy:
    def __init__(self, x, y, width=28, height=36, color=ENEMY_BODY, speed=ENEMY_BASE_SPEED):
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
        air_control = 0.55 if not self.on_ground else 1.0
        self.velocity_x += self.acceleration * air_control * (target_speed - self.velocity_x)
        max_speed = move_speed * (1.2 if self.on_ground else 0.9)
        self.velocity_x = max(-max_speed, min(max_speed, self.velocity_x))
        self._move_horizontal(platforms)
        safe_x = self.x

        # Apply gravity and vertical collisions
        self.velocity_y += self.gravity
        self.current_platform = None
        self._move_vertical(platforms, prev_y, safe_x)

        # Clamp to ground
        if not self.on_ground:
            enemy_bottom = self.y + self.height / 2
            if enemy_bottom >= GROUND_LEVEL:
                self.y = GROUND_LEVEL - self.height / 2
                self.velocity_y = 0
                self.on_ground = True
                self.current_platform = None
                self.velocity_x *= 0.8
        else:
            self.current_platform = self.current_platform or self._platform_underfoot(platforms)

        self._keep_in_bounds()
        self._maybe_jump(platforms, player)

    def draw(self, screen):
        if not self.alive:
            return

        glow_surface = pygame.Surface((self.width * 2, self.height * 2), pygame.SRCALPHA)
        pygame.draw.circle(
            glow_surface,
            (80, 160, 255, 70),
            (self.width, self.height),
            self.width,
        )
        screen.blit(glow_surface, (self.x - self.width, self.y - self.height), special_flags=pygame.BLEND_ADD)

        body_rect = pygame.Rect(
            self.x - self.width / 2,
            self.y - self.height / 2,
            self.width,
            self.height + 6,
        )
        pygame.draw.ellipse(screen, self.color, body_rect)
        pygame.draw.ellipse(screen, ENEMY_OUTLINE, body_rect, 2)

        eye_y = self.y - self.height / 4
        pygame.draw.circle(screen, PALE_GLOW, (int(self.x - 6), int(eye_y)), 3)
        pygame.draw.circle(screen, PALE_GLOW, (int(self.x + 6), int(eye_y)), 3)
        pygame.draw.circle(screen, ENEMY_OUTLINE, (int(self.x - 6), int(eye_y)), 3, 1)
        pygame.draw.circle(screen, ENEMY_OUTLINE, (int(self.x + 6), int(eye_y)), 3, 1)

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

    def _move_horizontal(self, platforms):
        self.x += self.velocity_x
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

    def _move_vertical(self, platforms, prev_y, safe_x):
        self.on_ground = False
        rect = self.get_rect()
        for p in platforms:
            pr = p.get_rect()
            if rect.colliderect(pr):
                platform_top = p.y
                platform_bottom = p.y + p.height
                prev_bottom = prev_y + self.height / 2
                prev_top = prev_y - self.height / 2

                if prev_bottom <= platform_top and self.velocity_y >= 0:
                    self.y = platform_top - self.height / 2
                    self.velocity_y = 0
                    self.on_ground = True
                    self.current_platform = p
                    rect = self.get_rect()
                elif prev_top >= platform_bottom and self.velocity_y <= 0:
                    self.y = platform_bottom + self.height / 2
                    self.velocity_y = 0
                    self.jump_timer = max(self.jump_timer, int(self.jump_cooldown * 0.6))
                    rect = self.get_rect()
                else:
                    # Diagonal collision: revert horizontal movement to avoid snagging
                    self.x = safe_x
                    self.velocity_x = 0
                    rect = self.get_rect()

    def _keep_in_bounds(self):
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

    def _platform_underfoot(self, platforms):
        rect = self.get_rect()
        foot_rect = rect.move(0, 2)
        for p in platforms:
            if foot_rect.colliderect(p.get_rect()):
                return p
        return None

# Main async function for pygbag compatibility
async def main():
    # Set up the display
    screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
    pygame.display.set_caption(f"KYX · {STORY_CONFIG.get('title', 'Demo Build')}")
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

    background_surface = build_vertical_gradient(WINDOW_WIDTH, WINDOW_HEIGHT, MIDNIGHT_BLUE, DEEP_NAVY)
    fireflies = [Firefly() for _ in range(26)]
    ground_dust = []
    
    # Game loop
    running = True
    while running:
        # Handle events
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
        
        # Get pressed keys
        keys = pygame.key.get_pressed()
        dt = clock.get_time() / 1000.0
        elapsed = pygame.time.get_ticks() / 1000.0

        # Keep previous player y for stomp detection
        prev_player_y = player.y

        # Update player and check for room transitions
        room_change = player.update(keys, rooms[current_room].platforms, ground_dust)
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
        
        for particle in ground_dust[:]:
            if not particle.update():
                ground_dust.remove(particle)

        for firefly in fireflies:
            firefly.update(dt)

        # Draw everything
        screen.blit(background_surface, (0, 0))
        draw_parallax_layers(screen, elapsed, current_room)
        for firefly in fireflies:
            firefly.draw(screen)
        draw_ground(screen)

        # Draw current room's platforms
        rooms[current_room].draw(screen)
        for particle in ground_dust:
            particle.draw(screen)
        # Draw enemies for the current room
        for enemy in enemies_by_room[current_room]:
            enemy.draw(screen)
        
        # Draw player
        player.draw(screen)
        
        draw_mist_overlay(screen, elapsed)
        draw_ui(screen, font, player, current_room, len(rooms))

        if game_over:
            overlay = pygame.Surface((WINDOW_WIDTH, WINDOW_HEIGHT), pygame.SRCALPHA)
            overlay.fill((0, 0, 0, 160))
            screen.blit(overlay, (0, 0))
            game_over_text = font_large.render(STORY_CONFIG.get("gameOverTitle", "Shade Dispersed"), True, PALE_GLOW)
            screen.blit(
                game_over_text,
                (
                    (WINDOW_WIDTH - game_over_text.get_width()) / 2,
                    (WINDOW_HEIGHT - game_over_text.get_height()) / 2 - 20,
                ),
            )
            hint_text = font.render(STORY_CONFIG.get("gameOverMessage", "The abyss reclaims your light..."), True, PALE_GLOW)
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

# Multi-Room Platformer Game

A 2D platformer game built with pygame-ce and pygbag, featuring multiple rooms, smooth physics, and web compatibility.

## Features

- Multi-room gameplay with seamless transitions
- Smooth player movement with advanced physics
- Variable jump height (hold jump to jump higher)
- Multiple platform layouts across 5 different rooms
- Precise collision detection
- Web-ready with pygbag support
- Room transitions when walking off screen edges

## Requirements

- Python 3.8 or higher
- pygame-ce
- pygbag (for web deployment)

## Installation

### Important: pygame-ce vs pygame

This project uses **pygame-ce** (Community Edition), not the original pygame. If you have the original pygame installed, it may conflict. Follow these steps:

1. **Uninstall original pygame (if installed):**
```bash
pip uninstall pygame
```

2. **Install pygame-ce and other dependencies:**
```bash
pip install -r requirements.txt
```

3. **Verify installation:**
```bash
python -c "import pygame; print(pygame.version.ver)"
```

If you see an import error, make sure:
- You're using the correct Python environment
- pygame-ce is installed (not the original pygame)
- Your IDE is using the correct Python interpreter

## Running the Game

### Local Development

Run the game locally:
```bash
python main.py
```

### Web Deployment with pygbag

To build and run the game in a web browser:

```bash
pygbag main.py
```

This will:
1. Compile the game to WebAssembly
2. Start a local server
3. Open the game in your browser at `http://localhost:8000`

**Note**: The game is now async-compatible for web deployment. The code uses `asyncio` to ensure smooth operation in the browser.

For production deployment, you can build the game and host the generated files on any web server.

## Controls

- **Arrow Keys** or **WASD**: Move left/right
- **Space** or **Up Arrow**: Jump (hold to jump higher)
- **Walk off screen edges**: Transition between rooms
- **Close window**: Quit game

## Game Mechanics

- **Gravity**: Player falls naturally when not on a platform
- **Variable Jump**: Hold jump button to jump higher (variable jump height)
- **Movement**: Smooth horizontal movement with friction
- **Collision**: Precise collision detection with platforms
- **Room System**: 5 different rooms with unique platform layouts
- **Room Transitions**: Walk off the left or right edge to move between rooms

## Project Structure

```
.
├── main.py              # Main game file
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

## Customization

You can easily customize the game by modifying constants in `main.py`:

- `WINDOW_WIDTH` / `WINDOW_HEIGHT`: Game window size
- `GRAVITY`: How fast the player falls
- `jump_power` / `initial_jump_power`: Jump height settings
- `PLAYER_SPEED`: Horizontal movement speed
- `FRICTION`: Ground friction coefficient
- Colors: Modify the color constants for different palettes
- Rooms: Add or modify room layouts in the `rooms` list

## Adding More Features

The game structure makes it easy to add:
- Enemies
- Collectibles
- Multiple levels
- Sound effects
- Sprite animations
- Power-ups

## License

This project is open source and available for modification and distribution.


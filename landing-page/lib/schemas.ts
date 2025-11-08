import { z } from "zod";

// Platform definition
const platformSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

// Room definition with platforms
const roomSchema = z.object({
  platforms: z.array(platformSchema),
  enemies: z
    .array(
      z.object({
        x: z.number(),
        y: z.number(),
        speed: z.number().optional(),
        health: z.number().optional(),
      })
    )
    .optional(),
});

// Full game config schema
export const gameConfigSchema = z.object({
  story: z.object({
    title: z.string().min(2).max(80),
    leadName: z.string().min(2).max(60),
    codename: z.string().min(2).max(30),
    rivalName: z.string().min(2).max(60),
    hubName: z.string().min(2).max(80),
    hubDescription: z.string().min(20).max(400),
    goal: z.string().min(10).max(160),
    tone: z.enum(["hopeful", "gritty", "heroic"]),
    difficulty: z.enum(["rookie", "veteran", "nightmare"]),
    gameOverTitle: z.string().max(60),
    gameOverMessage: z.string().max(200),
    instructions: z.array(z.string()).optional(),
  }),
  tuning: z.object({
    playerMaxHealth: z.number().min(1).max(10),
    runMultiplier: z.number().min(1).max(3),
    dashSpeed: z.number().min(8).max(25),
    enemyBaseSpeed: z.number().min(0.5).max(3),
    gravity: z.number().optional(),
    jumpPower: z.number().optional(),
    dashCooldown: z.number().optional(),
  }),
  colors: z
    .object({
      accent: z.string(),
      hud: z.string(),
      backgroundTop: z.string(),
      backgroundBottom: z.string(),
    })
    .optional(),
  rooms: z.array(roomSchema).optional(),
  mechanics: z
    .object({
      enableDash: z.boolean().optional(),
      enableSprint: z.boolean().optional(),
      enableDoubleJump: z.boolean().optional(),
      enableWallJump: z.boolean().optional(),
    })
    .optional(),
});

export type GameConfig = z.infer<typeof gameConfigSchema>;

// Legacy madlib schema for backward compatibility
export const madlibSchema = z.object({
  survivorName: z.string().min(2).max(60),
  codename: z.string().min(2).max(30),
  nemesisName: z.string().min(2).max(60),
  survivorBio: z.string().min(20).max(400),
  safehouseName: z.string().min(2).max(80),
  safehouseDescription: z.string().min(20).max(400),
  safehouseImage: z.string().optional().or(z.literal("")),
  victoryCondition: z.string().min(10).max(160),
  tone: z.enum(["hopeful", "gritty", "heroic"]),
  difficulty: z.enum(["rookie", "veteran", "nightmare"]),
});

export type MadlibPayload = z.infer<typeof madlibSchema>;

export const defaultMadlibPayload: MadlibPayload = {
  survivorName: "Dr. Rowan Hale",
  codename: "Beacon",
  nemesisName: "The Mireborn",
  survivorBio: "Former epidemiologist turned reluctant tactician, Rowan broadcasts cure recipes while guiding survivors between rooftops.",
  safehouseName: "Riverside Relay",
  safehouseDescription: "Stacked shipping containers form a neon-lit lab above the floodline. Solar rigs, med bays, and a single patched radio tower pierce the fog.",
  safehouseImage: "",
  victoryCondition: "Synthesize the Riverside serum before the Mireborn corrupt the water table.",
  tone: "hopeful",
  difficulty: "veteran",
};

export type MadlibSuccessResponse = {
  ok: true;
  config: {
    schemaVersion: string;
    characters: {
      survivor: {
        name: string;
        codename: string;
        bio: string;
      };
      nemesis: {
        name: string;
        threatLevel: string;
      };
    };
    world: {
      safehouse: {
        name: string;
        description: string;
        media: string | null;
      };
      victoryCondition: string;
      tone: MadlibPayload["tone"];
      difficulty: MadlibPayload["difficulty"];
    };
    modifiers: Array<{ label: string; value: number }>;
    lastUpdated: string;
  };
  summary: string;
};

export type MadlibErrorResponse = {
  ok: false;
  message: string;
  issues?: Record<string, string[]>;
};

export type MadlibApiResponse = MadlibSuccessResponse | MadlibErrorResponse;

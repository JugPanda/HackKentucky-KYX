import { z } from "zod";

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

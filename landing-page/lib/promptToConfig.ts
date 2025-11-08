const leadFallbacks = [
  "Dr. Rowan Hale",
  "Astra Quinn",
  "Nyx Calder",
  "Milo Wren",
];

const rivalFallbacks = [
  "The Mireborn",
  "Eclipse Order",
  "Rust Choir",
  "Verdant Swarm",
];

const hubFallbacks = [
  "Riverside Relay",
  "Gravity Bastion",
  "Zephyr Atrium",
  "Bloom Harbor",
];

const goalFallbacks = [
  "Synthesize a cure before the storm hits",
  "Restore power to the drifting city",
  "Seal the rift beneath the lab",
  "Smuggle survivors across the skyline",
];

const toneKeywords: Record<string, string[]> = {
  hopeful: ["hope", "bright", "cozy", "calm", "gentle", "wholesome"],
  gritty: ["gritty", "grim", "desperate", "bleak", "ruins", "waste"],
  heroic: ["heroic", "epic", "legend", "champion", "myth"],
};

const difficultyKeywords: Record<string, string[]> = {
  rookie: ["relaxed", "story", "casual", "peaceful"],
  veteran: ["balanced", "standard", "normal", "focus"],
  nightmare: ["hard", "nightmare", "brutal", "permadeath", "impossible"],
};

const paletteThemes = [
  {
    keyword: "neon",
    colors: {
      accent: "#7CF4FF",
      hud: "#E2F9FF",
      backgroundTop: "#0A0F24",
      backgroundBottom: "#172042",
    },
  },
  {
    keyword: "forest",
    colors: {
      accent: "#7FFFA5",
      hud: "#E5FFE8",
      backgroundTop: "#0C1B14",
      backgroundBottom: "#163424",
    },
  },
  {
    keyword: "desert",
    colors: {
      accent: "#FFC26A",
      hud: "#FFEED6",
      backgroundTop: "#2B1404",
      backgroundBottom: "#4B2E12",
    },
  },
];

function matchKeyword(prompt: string, mapping: Record<string, string[]>): string | undefined {
  const lower = prompt.toLowerCase();
  for (const [key, words] of Object.entries(mapping)) {
    if (words.some((w) => lower.includes(w))) {
      return key;
    }
  }
  return undefined;
}

function pickFallback(prompt: string, fallbackList: string[]): string {
  const words = prompt
    .split(/[^a-zA-Z]+/)
    .filter((w) => w.length > 3 && /^[A-Za-z]+$/.test(w));
  const candidate = words.find((w) => w[0] === w[0].toUpperCase());
  if (candidate) {
    return candidate;
  }
  return fallbackList[Math.floor(Math.random() * fallbackList.length)];
}

export function generateConfigFromPrompt(prompt: string) {
  const tone = matchKeyword(prompt, toneKeywords) ?? "hopeful";
  const difficulty = matchKeyword(prompt, difficultyKeywords) ?? "veteran";

  const leadName = pickFallback(prompt, leadFallbacks);
  const rivalName = pickFallback(prompt.split(leadName).join(""), rivalFallbacks);
  const hubName = hubFallbacks[Math.floor(Math.random() * hubFallbacks.length)];
  const goal = goalFallbacks[Math.floor(Math.random() * goalFallbacks.length)];

  const palette =
    paletteThemes.find((theme) => prompt.toLowerCase().includes(theme.keyword))?.colors ?? undefined;

  const trimmedPrompt = prompt.trim();
  const subtitle = trimmedPrompt.slice(0, 140) || "Player-authored KYX story";

  return {
    story: {
      title: `${leadName}'s ${hubName}`,
      leadName,
      codename: leadName.split(" ")[0] || "Beacon",
      rivalName,
      hubName,
      hubDescription: subtitle,
      goal,
      tone,
      difficulty,
      gameOverTitle: `${leadName} Falls`,
      gameOverMessage: `Recalibrate and outsmart ${rivalName} next time.`,
      instructions: [
        `Theme: ${tone} ${difficulty} run`,
        `Hub: ${hubName}`,
        `Nemesis: ${rivalName}`,
      ],
    },
    tuning: {
      playerMaxHealth: difficulty === "nightmare" ? 2 : 3,
      runMultiplier: tone === "gritty" ? 1.35 : 1.45,
      dashSpeed: tone === "heroic" ? 16 : 14,
      enemyBaseSpeed: difficulty === "rookie" ? 0.95 : difficulty === "nightmare" ? 1.35 : 1.2,
    },
    colors: palette,
  };
}

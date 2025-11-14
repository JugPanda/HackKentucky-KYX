"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  defaultMadlibPayload,
  MadlibPayload,
} from "@/lib/schemas";
import { createClient } from "@/lib/supabase/client";
import { DashboardNav } from "@/components/dashboard-nav";
import { getUserSubscription } from "@/lib/stripe/subscription-helpers";
import { canCreateGame, canUseCustomSprites } from "@/lib/subscription-limits";
import type { SubscriptionTier } from "@/lib/db-types";
import { getTemplateById, GAME_TEMPLATES } from "@/lib/game-templates";
import { injectTemplateCode } from "@/lib/template-games/inject-template";

type GeneratedConfig = {
  story?: {
    leadName?: string;
    codename?: string;
    hubDescription?: string;
    rivalName?: string;
    hubName?: string;
    goal?: string;
    tone?: MadlibPayload["tone"];
    difficulty?: MadlibPayload["difficulty"];
    genre?: MadlibPayload["genre"];
  };
};

const toneOptions: Array<{ label: string; value: MadlibPayload["tone"]; blurb: string }> = [
  { label: "Hopeful", value: "hopeful", blurb: "Bright synths, high morale" },
  { label: "Gritty", value: "gritty", blurb: "Grounded stakes, low resources" },
  { label: "Heroic", value: "heroic", blurb: "Bold VO, cinematic beats" },
];

const difficultyOptions: Array<{ label: string; value: MadlibPayload["difficulty"]; blurb: string }> = [
  { label: "Rookie", value: "rookie", blurb: "Story-first" },
  { label: "Veteran", value: "veteran", blurb: "Balanced tension" },
  { label: "Nightmare", value: "nightmare", blurb: "High pressure runs" },
];

const genreOptions: Array<{ label: string; value: MadlibPayload["genre"]; blurb: string; icon: string }> = [
  { label: "Platformer", value: "platformer", blurb: "Jump and run", icon: "🏃" },
  { label: "Adventure", value: "adventure", blurb: "Top-down exploration", icon: "🗡️" },
  { label: "Puzzle", value: "puzzle", blurb: "Solve challenges", icon: "🧩" },
];

const labOnboarding = [
  {
    title: "1. Describe Your Game",
    detail: "Tell us about your hero, enemies, and the goal",
  },
  {
    title: "2. Choose the Mood",
    detail: "Pick a tone and difficulty level that fits your vision",
  },
  {
    title: "3. Build & Share",
    detail: "Create a real playable game you can share with others",
  },
];

type StatusState = { loading: boolean; message?: string; error?: boolean };

const initialStatus: StatusState = { loading: false };

function MadlibLabPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editGameId = searchParams.get("edit");
  const templateId = searchParams.get("template");
  const remixGameId = searchParams.get("remix");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [formData, setFormData] = useState<MadlibPayload>(defaultMadlibPayload);
  const [promptText, setPromptText] = useState("");
  const [promptStatus, setPromptStatus] = useState<StatusState>(initialStatus);
  const [buildStatus, setBuildStatus] = useState<StatusState>(initialStatus);
  const [playerSprite, setPlayerSprite] = useState<File | null>(null);
  const [enemySprite, setEnemySprite] = useState<File | null>(null);
  const [playerSpritePreview, setPlayerSpritePreview] = useState<string | null>(null);
  const [enemySpritePreview, setEnemySpritePreview] = useState<string | null>(null);
  const [gameLanguage, setGameLanguage] = useState<"python" | "javascript">("python");
  const [loadedTemplate, setLoadedTemplate] = useState<string | null>(null);
  const [creationMode, setCreationMode] = useState<"choose" | "ai" | "template" | null>(
    templateId ? "template" : remixGameId ? "ai" : editGameId ? "ai" : "choose"
  );
  
  // Subscription state
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>("free");
  const [canCreate, setCanCreate] = useState(true);

  // Load subscription info
  useEffect(() => {
    const loadSubscriptionInfo = async () => {
      const subscription = await getUserSubscription();
      if (subscription) {
        setSubscriptionTier(subscription.tier);
        setCanCreate(canCreateGame(subscription.tier, subscription.gamesCreatedThisMonth));
      }
    };
    loadSubscriptionInfo();
  }, []);

  // Check authentication status and load game if editing, template if using template, or remix
  useEffect(() => {
    const checkAuthAndLoadGame = async () => {
      const supabase = createClient();
      if (!supabase) {
        setIsCheckingAuth(false);
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      setIsSignedIn(!!user);
      setIsCheckingAuth(false);

      // Load template if specified
      if (templateId) {
        const template = getTemplateById(templateId);
        if (template) {
          setFormData({
            survivorName: template.heroName,
            codename: template.heroName.split(" ")[0] || "Hero",
            survivorBio: template.description,
            nemesisName: template.enemyName,
            safehouseName: "The Sanctuary",
            safehouseDescription: template.description,
            safehouseImage: "",
            victoryCondition: template.goal,
            tone: template.tone,
            difficulty: template.gameDifficulty,
            genre: template.genre,
          });
          setPromptText(template.description);
          setLoadedTemplate(template.name);
        }
      }

      // Load game for remixing
      if (remixGameId) {
        try {
          const { data: game, error } = await supabase
            .from("games")
            .select("*")
            .eq("id", remixGameId)
            .eq("visibility", "public")
            .single();

          if (error || !game) {
            console.error("Error loading game to remix:", error);
            return;
          }

          // Populate form with game data
          if (game.config && typeof game.config === "object" && "story" in game.config) {
            const config = game.config as { story: {
              leadName?: string;
              codename?: string;
              hubDescription?: string;
              rivalName?: string;
              hubName?: string;
              goal?: string;
              tone?: MadlibPayload["tone"];
              difficulty?: MadlibPayload["difficulty"];
              genre?: MadlibPayload["genre"];
            }};
            const story = config.story;
            setFormData({
              survivorName: story.leadName || "",
              codename: story.codename || "",
              survivorBio: story.hubDescription || "",
              nemesisName: story.rivalName || "",
              safehouseName: story.hubName || "",
              safehouseDescription: story.hubDescription || "",
              safehouseImage: "",
              victoryCondition: story.goal || "",
              tone: story.tone || "hopeful",
              difficulty: story.difficulty || "rookie",
              genre: story.genre || "platformer",
            });
          }

          if (game.description) {
            setPromptText(`Remix of: ${game.title}. ${game.description}`);
          }
        } catch (error) {
          console.error("Error loading game to remix:", error);
        }
      }

      // Load game data if editing
      if (editGameId && user) {
        try {
          const { data: game, error } = await supabase
            .from("games")
            .select("*")
            .eq("id", editGameId)
            .eq("user_id", user.id)
            .single();

          if (error || !game) {
            console.error("Error loading game:", error);
            router.push("/dashboard");
            return;
          }

          // Populate form with game data
          if (game.config && typeof game.config === "object" && "story" in game.config) {
            const config = game.config as { story: {
              leadName?: string;
              codename?: string;
              hubDescription?: string;
              rivalName?: string;
              hubName?: string;
              goal?: string;
              tone?: MadlibPayload["tone"];
              difficulty?: MadlibPayload["difficulty"];
              genre?: MadlibPayload["genre"];
            }};
            const story = config.story;
            setFormData({
              survivorName: story.leadName || "",
              codename: story.codename || "",
              survivorBio: story.hubDescription || "",
              nemesisName: story.rivalName || "",
              safehouseName: story.hubName || "",
              safehouseDescription: story.hubDescription || "",
              safehouseImage: "",
              victoryCondition: story.goal || "",
              tone: story.tone || "hopeful",
              difficulty: story.difficulty || "rookie",
              genre: story.genre || "platformer",
            });
          }

          // Set description as prompt text
          if (game.description) {
            setPromptText(game.description);
          }
        } catch (error) {
          console.error("Error loading game:", error);
        }
      }
    };
    
    checkAuthAndLoadGame();
  }, [editGameId, templateId, remixGameId, router]);


  const updateField = (key: keyof MadlibPayload, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handlePlayerSpriteUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setPlayerSprite(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPlayerSpritePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEnemySpriteUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setEnemySprite(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEnemySpritePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const applyGeneratedConfig = (config: GeneratedConfig | undefined) => {
    if (!config || !config.story) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      survivorName: config.story?.leadName ?? prev.survivorName,
      codename: config.story?.codename ?? prev.codename,
      survivorBio: config.story?.hubDescription ?? prev.survivorBio,
      nemesisName: config.story?.rivalName ?? prev.nemesisName,
      safehouseName: config.story?.hubName ?? prev.safehouseName,
      safehouseDescription: config.story?.hubDescription ?? prev.safehouseDescription,
      victoryCondition: config.story?.goal ?? prev.victoryCondition,
      tone: config.story?.tone ?? prev.tone,
      difficulty: config.story?.difficulty ?? prev.difficulty,
      genre: config.story?.genre ?? prev.genre,
    }));
  };

  const handlePromptGenerate = async () => {
    if (!promptText.trim()) {
      setPromptStatus({ loading: false, error: true, message: "Enter a prompt first" });
      return;
    }
    setPromptStatus({ loading: true });
    try {
      const res = await fetch("/api/generate-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText }),
      });
      const data = await res.json();
      if (!data.ok) {
        setPromptStatus({ loading: false, error: true, message: data.message || "Failed to generate config" });
        return;
      }
      applyGeneratedConfig(data.config);
      setPromptStatus({ loading: false, message: "Draft applied to the form" });
    } catch (error) {
      console.error(error);
      setPromptStatus({ loading: false, error: true, message: "Unable to generate config" });
    }
  };

  // Poll for generation status
  const pollGenerationStatus = async (gameId: string) => {
    const maxPolls = 60; // 5 minutes (60 * 5 seconds)
    let pollCount = 0;

    const checkStatus = async (): Promise<boolean> => {
      try {
        const response = await fetch(`/api/games/generation-status?gameId=${gameId}`);
        const data = await response.json();

        if (data.status === "draft" && data.hasCode) {
          // Generation complete!
          return true;
        } else if (data.status === "error") {
          throw new Error("AI generation failed");
        }

        // Still generating
        pollCount++;
        if (pollCount >= maxPolls) {
          throw new Error("Generation timed out after 5 minutes");
        }

        // Update progress message
        const elapsed = pollCount * 5;
        setBuildStatus({ 
          loading: true, 
          message: `AI is generating your game... (${elapsed}s elapsed)` 
        });

        // Poll again in 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));
        return checkStatus();

      } catch (error) {
        throw error;
      }
    };

    return checkStatus();
  };

  const handleBuild = async () => {
    if (!isSignedIn) {
      router.push('/auth/sign-in');
      return;
    }

    // Check subscription limits
    if (!canCreate) {
      setBuildStatus({ 
        loading: false, 
        message: `You've reached your limit of games this month. Upgrade to create more!`, 
        error: true 
      });
      return;
    }

    // Check if custom sprites are allowed
    if ((playerSprite || enemySprite) && !canUseCustomSprites(subscriptionTier)) {
      setBuildStatus({ 
        loading: false, 
        message: "Custom sprites are only available for Pro and Premium subscribers. Upgrade to use this feature!", 
        error: true 
      });
      return;
    }

    setBuildStatus({ loading: true, message: "Starting AI generation..." });
    
    try {
      // Step 0: Upload sprites to Supabase if provided
      let playerSpriteUrl = null;
      let enemySpriteUrl = null;

      if (playerSprite || enemySprite) {
        setBuildStatus({ loading: true, message: "Uploading custom sprites..." });
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) throw new Error("Not authenticated");

        // Upload player sprite
        if (playerSprite) {
          const fileName = `${user.id}/player-${Date.now()}.${playerSprite.name.split('.').pop()}`;
          const { error: uploadError } = await supabase.storage
            .from('game-sprites')
            .upload(fileName, playerSprite, { upsert: true });
          
          if (!uploadError) {
            playerSpriteUrl = supabase.storage.from('game-sprites').getPublicUrl(fileName).data.publicUrl;
          } else {
            console.error("Player sprite upload failed:", uploadError);
          }
        }

        // Upload enemy sprite
        if (enemySprite) {
          const fileName = `${user.id}/enemy-${Date.now()}.${enemySprite.name.split('.').pop()}`;
          const { error: uploadError } = await supabase.storage
            .from('game-sprites')
            .upload(fileName, enemySprite, { upsert: true });
          
          if (!uploadError) {
            enemySpriteUrl = supabase.storage.from('game-sprites').getPublicUrl(fileName).data.publicUrl;
          } else {
            console.error("Enemy sprite upload failed:", uploadError);
          }
        }
      }

      // Step 1: Create game entry first (without code)
      setBuildStatus({ loading: true, message: "Creating game entry..." });

      // Convert madlib payload to full game config format
      const gameConfig = {
        story: {
          title: formData.survivorName || "My Awesome Platformer",
          leadName: formData.survivorName || "Hero",
          codename: formData.codename || "The Runner",
          rivalName: formData.nemesisName || "Dark Forces",
          hubName: formData.safehouseName || "The Safe Haven",
          hubDescription: (formData.safehouseDescription && formData.safehouseDescription.length >= 20) 
            ? formData.safehouseDescription 
            : "A safe place to rest and prepare for the journey ahead. This sanctuary provides shelter and hope for weary travelers.",
          goal: (formData.victoryCondition && formData.victoryCondition.length >= 10)
            ? formData.victoryCondition
            : "Complete the adventure and save the world from darkness",
          tone: formData.tone,
          difficulty: formData.difficulty,
          gameOverTitle: "Game Over",
          gameOverMessage: "Try again to complete your mission! You can do this!",
        },
        tuning: {
          playerMaxHealth: formData.difficulty === "rookie" ? 5 : formData.difficulty === "veteran" ? 3 : 2,
          runMultiplier: 1.5,
          dashSpeed: 15,
          enemyBaseSpeed: formData.difficulty === "rookie" ? 1 : formData.difficulty === "veteran" ? 1.5 : 2,
        },
        colors: {
          accent: formData.tone === "hopeful" ? "#10b981" : formData.tone === "gritty" ? "#6b7280" : "#f59e0b",
          hud: "#ffffff",
          backgroundTop: "#1e293b",
          backgroundBottom: "#0f172a",
        },
      };

      // Generate slug from hero name
      const slug = (formData.survivorName || "my-game")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // Step 2: Create or update the game entry
      let game;
      if (editGameId) {
        // Update existing game (config only, code will be generated async)
        setBuildStatus({ loading: true, message: "Updating game..." });
        const updateRes = await fetch("/api/games/update", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameId: editGameId,
            title: formData.survivorName || "My Platformer",
            description: formData.victoryCondition || "A platformer adventure",
            config: gameConfig,
            // Note: generatedCode will be regenerated by async generation
          }),
        });

        if (!updateRes.ok) {
          const errorData = await updateRes.json();
          console.error("Update game error:", errorData);
          
          // Show detailed validation errors if available
          if (errorData.issues) {
            const issueMessages = errorData.issues.map((issue: { path: string[]; message: string }) => 
              `${issue.path.join('.')}: ${issue.message}`
            ).join(', ');
            throw new Error(`Validation error: ${issueMessages}`);
          }
          
          throw new Error(errorData.error || "Failed to update game");
        }

        const updateData = await updateRes.json();
        game = updateData.game;
      } else {
        // Create new game
        setBuildStatus({ loading: true, message: "Creating game entry..." });
        const createRes = await fetch("/api/games/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: slug,
            title: formData.survivorName || "My Platformer",
            description: formData.victoryCondition || "A platformer adventure",
            config: gameConfig,
            language: gameLanguage, // Include selected language
            // Note: generatedCode will be added by async generation
          }),
        });

        if (!createRes.ok) {
          const errorData = await createRes.json();
          console.error("Create game error:", errorData);
          
          // Show detailed validation errors if available
          if (errorData.issues) {
            const issueMessages = errorData.issues.map((issue: { path: string[]; message: string }) => 
              `${issue.path.join('.')}: ${issue.message}`
            ).join(', ');
            throw new Error(`Validation error: ${issueMessages}`);
          }
          
          throw new Error(errorData.error || "Failed to create game");
        }

        const createData = await createRes.json();
        game = createData.game;
      }

      // Step 2: AI generation or template code injection
      const isUsingTemplate = loadedTemplate || templateId;
      
      if (!isUsingTemplate) {
        // Only generate with AI if NOT using a template
        setBuildStatus({ loading: true, message: "Starting AI game generation (this may take 1-2 minutes)..." });
        
        const asyncGenRes = await fetch("/api/games/generate-async", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameId: game.id,
            gameRequest: {
              heroName: formData.survivorName || "Hero",
              enemyName: formData.nemesisName || "Enemy",
              goal: formData.victoryCondition || "Complete the adventure",
              tone: formData.tone,
              difficulty: formData.difficulty,
              genre: formData.genre,
              description: promptText || undefined,
              playerSpriteUrl: playerSpriteUrl || undefined,
              enemySpriteUrl: enemySpriteUrl || undefined,
              language: gameLanguage,
            },
          }),
        });

        if (!asyncGenRes.ok) {
          const errorData = await asyncGenRes.json();
          throw new Error(errorData.error || "Failed to start generation");
        }

        // Step 3: Poll for completion
        setBuildStatus({ loading: true, message: "AI is generating your game code..." });
        await pollGenerationStatus(game.id);
      } else {
        // Templates: inject pre-made code with customization!
        setBuildStatus({ loading: true, message: "✨ Generating template code instantly..." });
        
        // Find the template
        const template = templateId 
          ? GAME_TEMPLATES.find(t => t.id === templateId)
          : GAME_TEMPLATES.find(t => t.name === loadedTemplate);
        
        if (!template) {
          throw new Error("Template not found");
        }
        
        // Inject template code with user's customizations
        const injectedCode = injectTemplateCode({
          template,
          playerName: formData.survivorName || template.heroName,
          enemyName: formData.nemesisName || template.enemyName,
          goal: formData.victoryCondition || template.goal,
          tone: formData.tone,
          language: gameLanguage, // Use selected language (python or javascript)
        });
        
        // Update game with the injected code
        setBuildStatus({ loading: true, message: "✨ Saving template game..." });
        const updateRes = await fetch("/api/games/update", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameId: game.id,
            generatedCode: injectedCode,
            language: gameLanguage, // Use selected language
          }),
        });
        
        if (!updateRes.ok) {
          const errorData = await updateRes.json();
          throw new Error(errorData.error || "Failed to save template code");
        }
        
        setBuildStatus({ loading: true, message: "✨ Template ready!" });
        await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause for UX
      }

      // Step 4: Trigger the build
      setBuildStatus({ loading: true, message: "Building your game..." });
      
      const buildRes = await fetch("/api/games/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: game.id }),
      });

      if (!buildRes.ok) {
        const errorData = await buildRes.json();
        throw new Error(errorData.error || "Failed to start build");
      }

      setBuildStatus({ 
        loading: false, 
        message: editGameId ? "Game updated! Redirecting to dashboard..." : "Game created! Redirecting to dashboard..." 
      });
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Failed to build game";
      
      // Check if it's a timeout error (504)
      const isTimeout = errorMessage.includes("504") || errorMessage.includes("timeout");
      
      setBuildStatus({ 
        loading: false, 
        error: true, 
        message: isTimeout 
          ? "⏱️ AI generation timed out. Try using a template instead - they're instant and professional!" 
          : errorMessage
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#010409] text-slate-100">
      {isSignedIn && <DashboardNav />}
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        
        {/* Creation Mode Chooser */}
        {creationMode === "choose" && (
          <div className="space-y-8">
            <div className="space-y-4 text-center">
              <Badge className="border-emerald-500/40 bg-emerald-500/10 text-emerald-100 mx-auto w-fit">
                Choose Your Path
              </Badge>
              <h1 className="text-4xl font-semibold text-white">
                How would you like to create your game?
              </h1>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                Start with a professional template or let AI generate a custom game for you
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
              {/* Templates Option */}
              <Card className="border-blue-500/40 bg-blue-950/20 hover:border-blue-500/60 transition-all cursor-pointer group"
                onClick={() => router.push('/templates')}>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-3">
                    <div className="text-5xl">⚡</div>
                    <h2 className="text-2xl font-semibold text-white group-hover:text-blue-300 transition-colors">
                      Start from Template
                    </h2>
                    <p className="text-slate-400">
                      Choose from 50+ professional game templates with instant preview
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-emerald-300">
                      <span className="text-lg">✓</span>
                      <span>Instant - No waiting</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-emerald-300">
                      <span className="text-lg">✓</span>
                      <span>Professional quality</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-emerald-300">
                      <span className="text-lg">✓</span>
                      <span>Beautiful 3D card effects</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-emerald-300">
                      <span className="text-lg">✓</span>
                      <span>Fully customizable</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-emerald-300">
                      <span className="text-lg">✓</span>
                      <span>8 categories to choose from</span>
                    </div>
                  </div>

                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="lg">
                    Browse 50+ Templates →
                  </Button>
                </CardContent>
              </Card>

              {/* AI Generation Option */}
              <Card className="border-purple-500/40 bg-purple-950/20 hover:border-purple-500/60 transition-all cursor-pointer group"
                onClick={() => setCreationMode("ai")}>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-3">
                    <div className="text-5xl">✨</div>
                    <h2 className="text-2xl font-semibold text-white group-hover:text-purple-300 transition-colors">
                      Generate with AI
                    </h2>
                    <p className="text-slate-400">
                      Describe your game idea and let AI create custom code for you
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-blue-300">
                      <span className="text-lg">✓</span>
                      <span>Fully custom games</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-300">
                      <span className="text-lg">✓</span>
                      <span>Unique to your vision</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-300">
                      <span className="text-lg">✓</span>
                      <span>AI sprite generation</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-yellow-300">
                      <span className="text-lg">⏱</span>
                      <span>Takes 1-2 minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-yellow-300">
                      <span className="text-lg">📊</span>
                      <span>Live progress updates</span>
                    </div>
                  </div>

                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white" size="lg">
                    Create with AI →
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <p className="text-sm text-slate-500">
                💡 <strong>Tip:</strong> Templates are instant and perfect for getting started quickly. 
                AI generation is great for unique, custom games.
              </p>
            </div>
          </div>
        )}

        {/* Show original creator when mode is selected */}
        {creationMode !== "choose" && (
          <>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            {!isSignedIn ? (
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-slate-100"
              >
                <ArrowLeft className="h-4 w-4" /> Back to landing page
              </Link>
            ) : (
              <button
                onClick={() => setCreationMode("choose")}
                className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-slate-100"
              >
                <ArrowLeft className="h-4 w-4" /> Change creation method
              </button>
            )}
          </div>
          <div className="space-y-3">
            <Badge className="border-emerald-500/40 bg-emerald-500/10 text-emerald-100">
              {loadedTemplate ? `Template: ${loadedTemplate}` : remixGameId ? "Remix Game" : creationMode === "ai" ? "AI Generation" : "Game Creator"}
            </Badge>
            <h1 className="text-4xl font-semibold text-white">
              {editGameId ? "Edit Your Game" : loadedTemplate ? `Customize "${loadedTemplate}"` : remixGameId ? "Remix Community Game" : creationMode === "ai" ? "Create with AI" : "Create Your Game"}
            </h1>
            <p className="text-lg text-slate-300">
              {editGameId 
                ? "Update your game details and rebuild to see the changes."
                : loadedTemplate 
                  ? `Starting with the "${loadedTemplate}" template. Customize it to make it your own!`
                  : remixGameId
                    ? "Take this community game and make your own version with your unique twist!"
                    : "Describe your game idea and we'll turn it into a playable platformer. Sign in to build and share your game with the community!"}
            </p>
            {(loadedTemplate || remixGameId) && (
              <Link 
                href="/templates"
                className="text-sm text-blue-400 hover:text-blue-300 transition"
              >
                ← Browse other templates
              </Link>
            )}
          </div>
        </div>

        <Card className="border-slate-800/70 bg-slate-950/40">
          <CardContent className="grid gap-6 p-6 md:grid-cols-3">
            {labOnboarding.map((step) => (
              <div key={step.title} className="space-y-2">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{step.title}</p>
                <p className="text-sm text-slate-300">{step.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-800/70 bg-slate-950/40">
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-col gap-2">
              <p className="text-lg font-semibold text-white">What&apos;s your game about? ✨</p>
              <p className="text-sm text-slate-400">
                Describe your game idea - include genre, characters, setting, and mood. The AI will extract details and fill the form!
              </p>
              <Textarea
                rows={4}
                placeholder="Examples:
• Top-down adventure where Link explores dungeons
• Puzzle game matching colorful gems
• Platformer with a ninja avoiding traps
Be specific about genre, characters, and goal!"
                value={promptText}
                onChange={(event) => setPromptText(event.target.value)}
                className="text-base"
              />
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Button onClick={handlePromptGenerate} disabled={promptStatus.loading} size="lg">
                {promptStatus.loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                  </>
                ) : (
                  "Generate My Game →"
                )}
              </Button>
              {promptStatus.message && (
                <p className={`text-sm ${promptStatus.error ? "text-rose-300" : "text-emerald-300"}`}>
                  {promptStatus.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="border-slate-800/70 bg-slate-950/40">
            <CardContent className="space-y-6 p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-white mb-2 block">
                    Hero Name <span className="text-xs text-slate-400 font-normal">(required)</span>
                  </label>
                  <Input
                    placeholder="e.g. Shadow Knight"
                    value={formData.survivorName}
                    onChange={(event) => updateField("survivorName", event.target.value)}
                    className="text-base"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-white mb-2 block">
                    Enemy Name <span className="text-xs text-slate-400 font-normal">(required)</span>
                  </label>
                  <Input
                    placeholder="e.g. Dark Forces"
                    value={formData.nemesisName}
                    onChange={(event) => updateField("nemesisName", event.target.value)}
                    className="text-base"
                    required
                  />
                </div>

                {/* Sprite Upload Section */}
                <div className="space-y-4 p-4 border border-blue-500/30 rounded-lg bg-blue-500/5">
                  <p className="text-sm font-semibold text-blue-300">🎨 Custom Sprites (Optional)</p>
                  <p className="text-xs text-slate-400">Upload PNG/JPG images for your characters. If not provided, AI will draw them.</p>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Player Sprite */}
                    <div>
                      <label className="text-xs font-medium text-white mb-2 block">
                        Player Sprite
                      </label>
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          onChange={handlePlayerSpriteUpload}
                          className="text-sm cursor-pointer"
                        />
                        {playerSpritePreview && (
                          <div className="relative w-24 h-24 border border-slate-600 rounded bg-slate-900">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={playerSpritePreview} alt="Player preview" className="w-full h-full object-contain" />
                            <button
                              type="button"
                              onClick={() => { setPlayerSprite(null); setPlayerSpritePreview(null); }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Enemy Sprite */}
                    <div>
                      <label className="text-xs font-medium text-white mb-2 block">
                        Enemy Sprite
                      </label>
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          onChange={handleEnemySpriteUpload}
                          className="text-sm cursor-pointer"
                        />
                        {enemySpritePreview && (
                          <div className="relative w-24 h-24 border border-slate-600 rounded bg-slate-900">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={enemySpritePreview} alt="Enemy preview" className="w-full h-full object-contain" />
                            <button
                              type="button"
                              onClick={() => { setEnemySprite(null); setEnemySpritePreview(null); }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-white mb-2 block">
                    Goal <span className="text-xs text-slate-400 font-normal">(required)</span>
                  </label>
                  <Input
                    placeholder="e.g. Collect all crystals"
                    value={formData.victoryCondition}
                    onChange={(event) => updateField("victoryCondition", event.target.value)}
                    className="text-base"
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-semibold text-white">Game Genre</p>
                <div className="grid gap-3 md:grid-cols-3">
                  {genreOptions.map((genre) => (
                    <button
                      key={genre.value}
                      type="button"
                      onClick={() => updateField("genre", genre.value)}
                      className={`rounded-2xl border px-3 py-3 text-left text-sm transition ${
                        formData.genre === genre.value
                          ? "border-blue-500/60 bg-blue-500/10"
                          : "border-slate-800/70 bg-slate-950/40 hover:border-slate-600/70"
                      }`}
                    >
                      <p className="font-semibold text-white">
                        {genre.icon} {genre.label}
                      </p>
                      <p className="text-xs text-slate-400">{genre.blurb}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-semibold text-white">Programming Language</p>
                <p className="text-xs text-slate-400">Choose which language to build your game in</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setGameLanguage("python")}
                    className={`rounded-2xl border px-4 py-4 text-left text-sm transition ${
                      gameLanguage === "python"
                        ? "border-blue-500/60 bg-blue-500/10"
                        : "border-slate-800/70 bg-slate-950/40 hover:border-slate-600/70"
                    }`}
                  >
                    <p className="font-semibold text-white">
                      🐍 Python (Pygame)
                    </p>
                    <p className="text-xs text-slate-400">Classic game development with Pygame</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGameLanguage("javascript")}
                    className={`rounded-2xl border px-4 py-4 text-left text-sm transition ${
                      gameLanguage === "javascript"
                        ? "border-blue-500/60 bg-blue-500/10"
                        : "border-slate-800/70 bg-slate-950/40 hover:border-slate-600/70"
                    }`}
                  >
                    <p className="font-semibold text-white">
                      ⚡ JavaScript (HTML5 Canvas)
                    </p>
                    <p className="text-xs text-slate-400">Fast web-native games with Canvas API</p>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-semibold text-white">Game Mood</p>
                <div className="grid gap-3 md:grid-cols-3">
                  {toneOptions.map((tone) => (
                    <button
                      key={tone.value}
                      type="button"
                      onClick={() => updateField("tone", tone.value)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                        formData.tone === tone.value
                          ? "border-emerald-500/60 bg-emerald-500/10"
                          : "border-slate-800/70 bg-slate-950/40 hover:border-slate-600/70"
                      }`}
                    >
                      <p className="font-semibold text-white">{tone.label}</p>
                      <p className="text-xs text-slate-400">{tone.blurb}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-semibold text-white">Difficulty</p>
                <div className="grid gap-3 md:grid-cols-3">
                  {difficultyOptions.map((difficulty) => (
                    <button
                      key={difficulty.value}
                      type="button"
                      onClick={() => updateField("difficulty", difficulty.value)}
                      className={`rounded-2xl border px-3 py-3 text-left text-sm transition ${
                        formData.difficulty === difficulty.value
                          ? "border-rose-500/60 bg-rose-500/10"
                          : "border-slate-800/70 bg-slate-950/40 hover:border-slate-600/70"
                      }`}
                    >
                      <p className="font-semibold text-white">{difficulty.label}</p>
                      <p className="text-xs text-slate-400">{difficulty.blurb}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {!isCheckingAuth && (
                  <>
                    {isSignedIn ? (
                      <>
                        <div className={`rounded-2xl border px-4 py-3 text-sm ${
                          loadedTemplate || templateId 
                            ? "border-blue-500/30 bg-blue-500/10 text-blue-100"
                            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                        }`}>
                          {loadedTemplate || templateId ? (
                            <>⚡ <strong>Template ready!</strong> Using &quot;{loadedTemplate}&quot; - no AI generation needed. Click below to build instantly!</>
                          ) : (
                            <>✨ <strong>Ready to build!</strong> Click below to create your playable game with AI (1-2 minutes).</>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleBuild}
                            disabled={buildStatus.loading}
                            className="flex-1"
                            size="lg"
                          >
                            {buildStatus.loading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {buildStatus.message || "Building..."}
                              </>
                            ) : loadedTemplate || templateId ? (
                              "⚡ Build Template Instantly →"
                            ) : (
                              "✨ Generate & Build with AI →"
                            )}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
                          💡 <strong>Ready to build your game?</strong> Create an account to turn this into a real playable game and share it with others!
                        </div>
                        <Button
                          onClick={() => router.push('/auth/sign-in')}
                          className="w-full"
                          size="lg"
                        >
                          Sign In to Build & Publish →
                        </Button>
                      </>
                    )}
                  </>
                )}
                {buildStatus.message && !buildStatus.loading && (
                  <div className="space-y-2">
                    <div className={`text-sm ${buildStatus.error ? "text-rose-300" : "text-emerald-300"}`}>
                      {buildStatus.message}
                    </div>
                    {buildStatus.error && buildStatus.message.includes("template") && (
                      <Link 
                        href="/templates"
                        className="inline-block text-sm text-blue-400 hover:text-blue-300 underline"
                      >
                        Browse 50+ Templates →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-slate-800/70 bg-slate-950/50">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold text-white">Your Game Preview</p>
                  <p className="text-xs text-slate-400">Updates as you type ✨</p>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-800/70">
                  <div className="h-52 w-full bg-slate-900/70">
                    <div 
                      className="flex h-full items-center justify-center text-sm transition-all duration-300"
                      style={{
                        background: formData.tone === "hopeful" 
                          ? "linear-gradient(135deg, #065f46 0%, #10b981 100%)"
                          : formData.tone === "gritty"
                          ? "linear-gradient(135deg, #1f2937 0%, #4b5563 100%)"
                          : "linear-gradient(135deg, #92400e 0%, #f59e0b 100%)",
                      }}
                    >
                      <div className="text-center text-white/80">
                        <p className="text-3xl mb-2">🎮</p>
                        <p className="text-sm font-semibold">{formData.survivorName || "Your Hero"}</p>
                        <p className="text-xs opacity-75">vs {formData.nemesisName || "The Enemy"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 border-t border-slate-800/70 bg-[#0b1018] px-5 py-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-semibold text-white">{formData.survivorName || "..."}</p>
                      <Badge className="text-xs capitalize">{formData.difficulty}</Badge>
                    </div>
                    <div className="space-y-2 text-sm text-slate-300">
                      <p><span className="font-semibold text-white">Enemy:</span> {formData.nemesisName || "..."}</p>
                      <p><span className="font-semibold text-white">Goal:</span> {formData.victoryCondition || "..."}</p>
                      <p><span className="font-semibold text-white">Mood:</span> <span className="capitalize">{formData.tone}</span></p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </section>
        </>
        )}

      </main>
    </div>
  );
}

export default function MadlibLabPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#010409] text-slate-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    }>
      <MadlibLabPageContent />
    </Suspense>
  );
}

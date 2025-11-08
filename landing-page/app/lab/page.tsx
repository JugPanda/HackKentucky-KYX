"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function MadlibLabPage() {
  const router = useRouter();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [formData, setFormData] = useState<MadlibPayload>(defaultMadlibPayload);
  const [promptText, setPromptText] = useState("");
  const [promptStatus, setPromptStatus] = useState<StatusState>(initialStatus);
  const [buildStatus, setBuildStatus] = useState<StatusState>(initialStatus);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      if (!supabase) {
        setIsCheckingAuth(false);
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      setIsSignedIn(!!user);
      setIsCheckingAuth(false);
    };
    
    checkAuth();
  }, []);


  const updateField = (key: keyof MadlibPayload, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
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

  const handleBuild = async () => {
    if (!isSignedIn) {
      router.push('/auth/sign-in');
      return;
    }

    setBuildStatus({ loading: true, message: "Generating game code with AI..." });
    
    try {
      // Step 1: Generate AI game code
      const codeGenRes = await fetch("/api/generate-game-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heroName: formData.survivorName || "Hero",
          enemyName: formData.nemesisName || "Enemy",
          goal: formData.victoryCondition || "Complete the adventure",
          tone: formData.tone,
          difficulty: formData.difficulty,
          description: promptText || undefined,
        }),
      });

      if (!codeGenRes.ok) {
        const errorData = await codeGenRes.json();
        throw new Error(errorData.error || "Failed to generate game code");
      }

      const { mainPy } = await codeGenRes.json();
      
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

      // Step 2: Create the game entry
      const createRes = await fetch("/api/games/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slug,
          title: formData.survivorName || "My Platformer",
          description: formData.victoryCondition || "A platformer adventure",
          config: gameConfig,
          generatedCode: mainPy, // Include AI-generated Python code
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

      const { game } = await createRes.json();

      // Step 2: Trigger the build
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
        message: "Game created! Redirecting to dashboard..." 
      });
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error) {
      console.error(error);
      setBuildStatus({ 
        loading: false, 
        error: true, 
        message: error instanceof Error ? error.message : "Failed to build game" 
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#010409] text-slate-100">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-slate-100"
          >
            <ArrowLeft className="h-4 w-4" /> Back to landing page
          </Link>
          <div className="space-y-3">
            <Badge className="border-emerald-500/40 bg-emerald-500/10 text-emerald-100">
              Game Creator
            </Badge>
            <h1 className="text-4xl font-semibold text-white">Create Your Game</h1>
            <p className="text-lg text-slate-300">
              Describe your game idea and we&apos;ll turn it into a playable platformer. 
              Sign in to build and share your game with the community!
            </p>
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
              <p className="text-lg font-semibold text-white">What&apos;s your game about?</p>
              <p className="text-sm text-slate-400">Describe your game idea in a few sentences</p>
              <Textarea
                rows={4}
                placeholder="Example: A hero exploring mysterious caves, fighting shadow creatures, and collecting ancient artifacts. The world feels dark but hopeful."
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
                    Hero Name
                  </label>
                  <Input
                    placeholder="e.g. Shadow Knight"
                    value={formData.survivorName}
                    onChange={(event) => updateField("survivorName", event.target.value)}
                    className="text-base"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-white mb-2 block">
                    Enemy Name
                  </label>
                  <Input
                    placeholder="e.g. Dark Forces"
                    value={formData.nemesisName}
                    onChange={(event) => updateField("nemesisName", event.target.value)}
                    className="text-base"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-white mb-2 block">
                    Goal
                  </label>
                  <Input
                    placeholder="e.g. Collect all crystals"
                    value={formData.victoryCondition}
                    onChange={(event) => updateField("victoryCondition", event.target.value)}
                    className="text-base"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-semibold text-white">Game Mood</p>
                <div className="grid gap-3 md:grid-cols-2">
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
                        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                          ✨ <strong>Ready to build!</strong> Click below to create your playable game and share it with the community.
                        </div>
                        <Button
                          onClick={handleBuild}
                          disabled={buildStatus.loading}
                          className="w-full"
                          size="lg"
                        >
                          {buildStatus.loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {buildStatus.message || "Building..."}
                            </>
                          ) : (
                            "Build & Publish Game →"
                          )}
                        </Button>
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
                  <div className={`text-sm ${buildStatus.error ? "text-rose-300" : "text-emerald-300"}`}>
                    {buildStatus.message}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-slate-800/70 bg-slate-950/50">
              <CardContent className="space-y-4 p-6">
                <p className="text-lg font-semibold text-white">Your Game Preview</p>
                <div className="overflow-hidden rounded-2xl border border-slate-800/70">
                  <div className="h-52 w-full bg-slate-900/70">
                    <div 
                      className="flex h-full items-center justify-center text-sm"
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
                      <p className="text-xl font-semibold text-white">{formData.survivorName}</p>
                      <Badge className="text-xs">{formData.difficulty}</Badge>
                    </div>
                    <div className="space-y-2 text-sm text-slate-300">
                      <p><span className="font-semibold text-white">Enemy:</span> {formData.nemesisName}</p>
                      <p><span className="font-semibold text-white">Goal:</span> {formData.victoryCondition}</p>
                      <p><span className="font-semibold text-white">Mood:</span> {formData.tone}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </section>

      </main>
    </div>
  );
}

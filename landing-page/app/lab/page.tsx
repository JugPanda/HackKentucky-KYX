"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, UploadCloud } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  defaultMadlibPayload,
  MadlibApiResponse,
  MadlibPayload,
} from "@/lib/schemas";

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
    title: "Step 1 · Story hooks",
    detail: "Name your lead, codename, and rival so dialogue, UI, and promo assets feel bespoke.",
  },
  {
    title: "Step 2 · Visual mood",
    detail: "Describe the hub space in plain language and drop an image. We prep it for the browser automatically.",
  },
  {
    title: "Step 3 · Share + remix",
    detail: "Tap Generate to see the JSON and summary you can hand off to teammates, players, or classrooms.",
  },
];

type StatusState = { loading: boolean; message?: string; error?: boolean };

const initialStatus: StatusState = { loading: false };

export default function MadlibLabPage() {
  const [formData, setFormData] = useState<MadlibPayload>(defaultMadlibPayload);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [serverResponse, setServerResponse] = useState<MadlibApiResponse | null>(null);
  const [status, setStatus] = useState<StatusState>(initialStatus);
  const [promptText, setPromptText] = useState("");
  const [promptStatus, setPromptStatus] = useState<StatusState>(initialStatus);
  const [buildStatus, setBuildStatus] = useState<StatusState>(initialStatus);
  const [buildResult, setBuildResult] = useState<{ slug: string; url: string } | null>(null);

  const requestJson = useMemo(() => JSON.stringify(formData, null, 2), [formData]);
  const responseJson = useMemo(() => {
    if (!serverResponse) return "// submit to preview the generated JSON";
    if (!serverResponse.ok) {
      return JSON.stringify(serverResponse, null, 2);
    }
    return JSON.stringify(serverResponse.config, null, 2);
  }, [serverResponse]);

  const updateField = (key: keyof MadlibPayload, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setImagePreview(result);
      updateField("safehouseImage", result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setStatus({ loading: true });
    setServerResponse(null);
    try {
      const res = await fetch("/api/madlib", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data: MadlibApiResponse = await res.json();
      if (!data.ok) {
        setStatus({ loading: false, error: true, message: data.message || "Validation failed" });
        setServerResponse(data);
        return;
      }
      setServerResponse(data);
      setStatus({ loading: false, message: "Template generated" });
    } catch (error) {
      console.error(error);
      setStatus({ loading: false, error: true, message: "Network error" });
    }
  };

  const applyGeneratedConfig = (config: any) => {
    setFormData((prev) => ({
      ...prev,
      survivorName: config?.story?.leadName ?? prev.survivorName,
      codename: config?.story?.codename ?? prev.codename,
      survivorBio: config?.story?.hubDescription ?? prev.survivorBio,
      nemesisName: config?.story?.rivalName ?? prev.nemesisName,
      safehouseName: config?.story?.hubName ?? prev.safehouseName,
      safehouseDescription: config?.story?.hubDescription ?? prev.safehouseDescription,
      victoryCondition: config?.story?.goal ?? prev.victoryCondition,
      tone: config?.story?.tone ?? prev.tone,
      difficulty: config?.story?.difficulty ?? prev.difficulty,
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
    setBuildStatus({ loading: true });
    setBuildResult(null);
    try {
      const res = await fetch("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!data.ok) {
        setBuildStatus({ loading: false, error: true, message: data.message || "Build failed" });
        return;
      }
      setBuildResult(data.build);
      setBuildStatus({ loading: false, message: "Playable build ready" });
    } catch (error) {
      console.error(error);
      setBuildStatus({ loading: false, error: true, message: "Network error while building" });
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
              Isolated prototype
            </Badge>
            <h1 className="text-4xl font-semibold text-white">Madlib config lab</h1>
            <p className="text-lg text-slate-300">
              Fill in character details, upload art, and press generate. We convert your prompts into a
              JSON payload that patches the KYX sample game without exposing non-technical players to raw config files.
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
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Describe your game</p>
              <Textarea
                rows={3}
                placeholder="Example: A hopeful neon courier dodging rival cultists above a flooded city."
                value={promptText}
                onChange={(event) => setPromptText(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handlePromptGenerate} disabled={promptStatus.loading}>
                {promptStatus.loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Drafting
                  </>
                ) : (
                  "Generate from prompt"
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
              <div className="flex flex-col gap-2">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Character brief</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      Lead name
                    </label>
                    <Input
                      value={formData.survivorName}
                      onChange={(event) => updateField("survivorName", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      Codename
                    </label>
                    <Input value={formData.codename} onChange={(event) => updateField("codename", event.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    Lead bio
                  </label>
                  <Textarea
                    rows={3}
                    value={formData.survivorBio}
                    onChange={(event) => updateField("survivorBio", event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Rival + tone</p>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    Rival name
                  </label>
                  <Input
                    value={formData.nemesisName}
                    onChange={(event) => updateField("nemesisName", event.target.value)}
                  />
                </div>
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
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Hub location</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      Hub name
                    </label>
                    <Input
                      value={formData.safehouseName}
                      onChange={(event) => updateField("safehouseName", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      Victory condition
                    </label>
                    <Input
                      value={formData.victoryCondition}
                      onChange={(event) => updateField("victoryCondition", event.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    Description
                  </label>
                  <Textarea
                    rows={3}
                    value={formData.safehouseDescription}
                    onChange={(event) => updateField("safehouseDescription", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    Upload hub photo
                  </label>
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700/70 bg-slate-950/40 px-4 py-8 text-center text-sm text-slate-400 hover:border-slate-500/80">
                    <UploadCloud className="h-6 w-6 text-slate-300" />
                    <span className="mt-2 font-medium text-white">Drop PNG/JPG</span>
                    <span className="text-xs text-slate-500">Max 2MB • stored as Base64 for demo</span>
                    <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Difficulty</p>
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

              <div className="flex flex-wrap gap-3">
                <Button onClick={handleSubmit} disabled={status.loading} className="flex-1 min-w-[180px]">
                  {status.loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating
                    </>
                  ) : (
                    "Generate JSON template"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleBuild}
                  disabled={buildStatus.loading}
                  className="flex-1 min-w-[180px]"
                >
                  {buildStatus.loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Building playable demo
                    </>
                  ) : (
                    "Build & upload demo"
                  )}
                </Button>
                {status.message && (
                  <div className={`text-sm ${status.error ? "text-rose-300" : "text-emerald-300"}`}>
                    {status.message}
                  </div>
                )}
                {buildStatus.message && (
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
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Live preview</p>
                <div className="overflow-hidden rounded-2xl border border-slate-800/70">
                  <div className="h-52 w-full bg-slate-900/70">
                    {imagePreview || formData.safehouseImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imagePreview || formData.safehouseImage}
                        alt="Hub preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-500">
                        Preview image appears here
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 border-t border-slate-800/70 bg-[#0b1018] px-5 py-4">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{formData.safehouseName}</span>
                      <span>{formData.difficulty.toUpperCase()}</span>
                    </div>
                    <p className="text-lg font-semibold text-white">{formData.survivorName}</p>
                    <p className="text-sm text-slate-400">{formData.survivorBio}</p>
                    <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 px-4 py-3 text-sm text-slate-200">
                      <span className="font-semibold text-white">Rival:</span> {formData.nemesisName}
                    </div>
                    <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 px-4 py-3 text-sm text-slate-200">
                      <span className="font-semibold text-white">Goal:</span> {formData.victoryCondition}
                    </div>
                  </div>
                </div>
                {serverResponse && serverResponse.ok && (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-sm text-emerald-100">
                    {serverResponse.summary}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-800/70 bg-slate-950/50">
              <CardContent className="space-y-4 p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-500">JSON transport</p>
                    <h2 className="text-xl font-semibold text-white">Request & response</h2>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleSubmit} disabled={status.loading}>
                    Re-run preview
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Request</p>
                    <pre className="h-64 overflow-y-auto rounded-2xl border border-slate-800/70 bg-black/40 p-4 text-xs leading-relaxed text-emerald-200">
{requestJson}
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Response</p>
                    <pre className="h-64 overflow-y-auto rounded-2xl border border-slate-800/70 bg-black/40 p-4 text-xs leading-relaxed text-cyan-200">
{responseJson}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            {buildResult && (
              <Card className="border-emerald-500/40 bg-emerald-500/10">
                <CardContent className="space-y-3 p-6 text-sm text-emerald-100">
                  <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">Playable build</p>
                  <p className="text-xl font-semibold text-white">/generated/{buildResult.slug}</p>
                  <p>
                    Share this link with your community. It serves the pygbag bundle produced from your current config.
                  </p>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={buildResult.url} target="_blank" rel="noreferrer">
                      Open playable demo
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <section className="grid gap-4 rounded-3xl border border-slate-800/70 bg-slate-950/40 p-8 md:grid-cols-3">
          {[
            {
              title: "Player friendly",
              body: "Every input is plain language. We keep the JSON hidden unless you want to inspect it.",
            },
            {
              title: "API ready",
              body: "The backend validates payloads with Zod and emits a schema-versioned config object.",
            },
            {
              title: "Mobile aware",
              body: "Responsive layout keeps form controls stacked with sticky preview on small screens.",
            },
          ].map((item) => (
            <div key={item.title} className="space-y-2">
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="text-sm text-slate-400">{item.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

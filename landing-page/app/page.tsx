import Link from "next/link";
import {
  ArrowRight,
  Braces,
  Layers,
  Map,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const navLinks = [
  { label: "Engine", href: "#engine" },
  { label: "Workflow", href: "#workflow" },
  { label: "For Creatives", href: "#creatives" },
  { label: "Mods", href: "#mods" },
  { label: "Roadmap", href: "#roadmap" },
  { label: "Madlib Lab", href: "/lab" },
];

const logos = ["Hack Kentucky", "Speedrun Labs", "IndieForge", "GDK", "CampusGG"];

const stats = [
  { label: "Playable prototypes launched", value: "240+" },
  { label: "Custom characters crafted", value: "6,500" },
  { label: "Average build time", value: "< 2 min" },
];

const workflow = [
  {
    title: "Branch experiments safely",
    description: "Spin up platformers, runners, or puzzle tests on feature branches. Share preview URLs that auto-refresh as you tweak rooms.",
    icon: <Layers className="h-5 w-5 text-emerald-300" />,
  },
  {
    title: "Review like pull requests",
    description: "Inline comments on story beats, diffs on config JSON, and approvals that gate deploys.",
    icon: <Users className="h-5 w-5 text-sky-300" />,
  },
  {
    title: "Automate publish steps",
    description: "GitHub Actions-ready scripts export pygbag builds and attach playable demos to releases.",
    icon: <Workflow className="h-5 w-5 text-purple-300" />,
  },
];

const engineHighlights = [
  {
    title: "Room-aware physics",
    body: "Seamless transitions across caves, labs, forests, and rooftops with persistent state and layered parallax.",
    icon: <Sparkles className="h-5 w-5 text-emerald-300" />,
  },
  {
    title: "Programmable actors",
    body: "Write logic in JSON or drop-in Python behaviors. Mods hot-reload while characters keep moving.",
    icon: <Braces className="h-5 w-5 text-sky-300" />,
  },
  {
    title: "Instant web export",
    body: "Bundle to web with pygbag compatibility and deploy scenarios directly to Pages, itch.io, or Vercel.",
    icon: <Zap className="h-5 w-5 text-fuchsia-300" />,
  },
  {
    title: "Deterministic sync",
    body: "Replay data + save slots keep QA, streamers, and collaborators in lockstep.",
    icon: <ShieldCheck className="h-5 w-5 text-rose-300" />,
  },
];

const roadmap = [
  {
    phase: "Now",
    title: "Multi-room sandbox",
    body: "Link handcrafted spaces with portals, parallax, and persistent pickups.",
  },
  {
    phase: "Next",
    title: "Madlib config editor",
    body: "Live-preview JSON with a guided UI that swaps names, lore, art, and difficulty without touching files.",
  },
  {
    phase: "Later",
    title: "Creator cloud saves",
    body: "Zero-config spaces for studios with per-branch builds, user generated data, and review apps.",
  },
];

const testimonials = [
  {
    quote: "We reskin the story for every hackathon without touching JSON. The Madlib UI keeps players creating.",
    author: "Malik Ortega",
    role: "Game Design Lead",
  },
  {
    quote: "KYX let our club ship a browser platformer in a weekend. The workflow matches how we already ship code.",
    author: "Nova Bennett",
    role: "President, Hack Kentucky",
  },
];

const creativeFeatures = [
  {
    title: "Madlib prompts",
    description: "Swap names, motives, and lore with guided prompts. No menus full of JSON or code.",
  },
  {
    title: "Visual builder",
    description: "Upload art, drag modules, and preview the story card exactly how players will see it.",
  },
  {
    title: "Shareable kits",
    description: "Export a polished scenario link you can drop into Discord, TikTok bios, or classroom sessions.",
  },
];

const onboardingSteps = [
  {
    title: "Tell the story",
    description: "Name your lead, rival, and hub space in plain language—no config files or syntax worries.",
  },
  {
    title: "Add vibes & art",
    description: "Choose tone, difficulty, and drop custom art so the card feels like your team’s inside joke.",
  },
  {
    title: "Share the build",
    description: "Generate JSON automatically and pass a playable link to friends, clubs, or stream chats.",
  },
];

const madlibFields = [
  {
    label: "Lead character",
    placeholder: "Dr. Rowan Hale",
    helper: "Name + short codename that shows up in dialogue.",
  },
  {
    label: "Rival faction",
    placeholder: "The Mireborn",
    helper: "Describe the force opposing the player.",
  },
  {
    label: "Hub photo",
    placeholder: "Drop PNG or JPG",
    helper: "Drag-and-drop art; KYX optimizes it for web builds.",
  },
  {
    label: "Victory condition",
    placeholder: "Synthesize a cure at Riverside Lab",
    helper: "Plain language, translated to JSON under the hood.",
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#010409] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.15),transparent_45%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(1,4,9,0.95),rgba(2,6,23,0.9))]" />
      </div>

      <div className="relative z-10 flex flex-col">
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            {navLinks.map((link) => (
              <Link key={link.label} href={link.href} className="transition hover:text-white">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="outline" className="hidden border-slate-700 text-slate-200 hover:bg-white hover:text-slate-900 md:flex" asChild>
              <Link href="https://github.com/HackKentucky" target="_blank">
                Sign in with GitHub
              </Link>
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-24">
          <section id="hero" className="grid gap-12 py-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-8">
              <Badge variant="success" className="w-fit border-emerald-500/50 bg-emerald-500/10 text-emerald-200">
                KYX · Python game builder meets GitHub workflow
              </Badge>
              <div className="space-y-6">
                <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-[3.5rem]">
                  Prototype games in Python, deploy them like web apps.
                </h1>
                <p className="max-w-2xl text-lg text-slate-300">
                  KYX is a Python + Pygame runtime tuned for instant web deploys. Non-technical teammates
                  branch scenarios, remix JSON-driven rooms through Madlib prompts, and share playable browser
                  builds without touching a console.
                </p>
                <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-5 text-sm text-slate-300">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">3-minute onboarding</p>
                  <ol className="mt-3 space-y-2">
                    <li>
                      <span className="font-semibold text-white">1. Define the cast.</span> Use Madlib prompts to
                      lock in leads, codenames, and rival lore.
                    </li>
                    <li>
                      <span className="font-semibold text-white">2. Describe the scene.</span> Drop reference art and
                      capture the vibe in everyday language.
                    </li>
                    <li>
                      <span className="font-semibold text-white">3. Ship a link.</span> The engine turns everything
                      into JSON and spins a browser-ready build for your friends.
                    </li>
                  </ol>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild>
                  <Link href="#builder">
                    Launch live builder <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="https://github.com/HackKentucky" target="_blank">
                    View the repo
                  </Link>
                </Button>
                <Button size="lg" variant="ghost" className="text-slate-200 hover:text-white" asChild>
                  <Link href="/lab">Try the Madlib Lab</Link>
                </Button>
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-slate-400">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl font-semibold text-white">{stat.value}</p>
                    <p>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <Card
              id="builder"
              className="relative overflow-hidden border border-slate-800/70 bg-gradient-to-br from-[#161b22] via-[#0d1117] to-[#020711]"
            >
              <div className="absolute inset-x-6 top-6 flex items-center justify-between text-xs text-slate-400">
                <span>Playable example · KYX demo</span>
                <span>Browser ready</span>
              </div>
              <CardContent className="mt-12 space-y-5">
                <div className="space-y-2">
                  <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Multi-room platformer</p>
                  <p className="text-slate-300">
                    This is the exact Python game the KYX runtime exports. It’s built with Pygame, bundled
                    with pygbag, and streamed straight into the site so visitors can play what your builders create.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800/80 bg-black/60 p-2">
                  <div className="aspect-[4/3] overflow-hidden rounded-xl border border-slate-900/80 bg-black">
                    <iframe
                      src="/demo-game/index.html"
                      title="KYX sample game"
                      loading="lazy"
                      className="h-full w-full"
                      allow="fullscreen *; autoplay *; gamepad *; xr-spatial-tracking"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                  <span>Python · Pygame · pygbag</span>
                  <span className="inline-flex items-center gap-2 text-emerald-200">
                    <PlayCircle className="h-4 w-4" />
                    Playable in browser
                  </span>
                </div>
                <Button variant="outline" className="w-full border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/10" asChild>
                  <Link href="/demo-game/index.html" target="_blank">
                    Open demo in a new tab
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-8 py-12">
            <div className="rounded-3xl border border-slate-800/70 bg-slate-950/40 px-8 py-10">
              <div className="space-y-3 text-center">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Crafting the engine</p>
                <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                  Python core, creative-friendly controls.
                </h2>
                <p className="text-slate-400">
                  KYX mixes a Python/Pygame engine with a visual layer so you can jot down story beats while we
                  handle data structures, JSON, and web deploys in the background.
                </p>
              </div>
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {onboardingSteps.map((step) => (
                  <Card key={step.title} className="border-slate-800/70 bg-slate-950/50">
                    <CardContent className="space-y-3 p-6">
                      <p className="text-sm uppercase tracking-[0.35em] text-slate-500">{step.title}</p>
                      <p className="text-slate-300">{step.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-10 grid gap-6 rounded-2xl border border-slate-800/70 bg-slate-950/50 p-6 text-sm text-slate-300 md:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Built in Python</p>
                  <p>
                    <span className="font-semibold text-white">Engineered with Python + Pygame:</span> reuse base-game
                    scripts or drop in new behaviors; the UI simply wraps them.
                  </p>
                  <p>
                    <span className="font-semibold text-white">Automatic JSON + web builds:</span> pygbag packages your
                    story so friends only need a link.
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Share it out</p>
                  <p>
                    <span className="font-semibold text-white">Preview URLs:</span> each tweak gets its own browser link
                    for clubs, classrooms, or stream chats.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button size="sm" asChild>
                      <Link href="#builder">See the builder</Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="https://github.com/HackKentucky" target="_blank">
                        Deploy guide
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            id="madlib"
            className="grid gap-10 rounded-3xl border border-slate-800/70 bg-slate-950/40 px-8 py-12 lg:grid-cols-[1.05fr_0.95fr]"
          >
            <div className="space-y-6">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                Madlib settings
              </p>
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                Customize stories without touching JSON.
              </h2>
              <p className="text-slate-400">
                Players type in names, upload reference art, and remix lore in plain language.
                KYX turns those prompts into JSON templates that patch the running game, so
                every club or classroom ships a personal story in minutes.
              </p>
              <ul className="space-y-3 text-sm text-slate-300">
                <li>• Auto-generated JSON with schema validation + version control.</li>
                <li>• Upload UI stores art in the repo so GitHub previews stay accurate.</li>
                <li>• Instant preview: builder refreshes as soon as a field changes.</li>
              </ul>
            </div>
            <Card className="border-slate-800/70 bg-[#0d1117] shadow-[0_25px_70px_rgba(4,6,11,0.8)]">
              <CardContent className="space-y-6 p-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Madlib draft</p>
                  <h3 className="text-lg font-semibold text-white">Playable brief</h3>
                </div>
                <div className="space-y-5">
                  {madlibFields.map((field) => (
                    <div key={field.label} className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                        {field.label}
                      </label>
                      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">
                        {field.placeholder}
                      </div>
                      <p className="text-xs text-slate-500">{field.helper}</p>
                    </div>
                  ))}
                </div>
                <Button className="w-full">Generate game JSON</Button>
              </CardContent>
            </Card>
          </section>

          <section className="py-10">
            <div className="flex flex-col gap-6 rounded-2xl border border-slate-800/70 bg-slate-950/40 px-6 py-8 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Trusted by teams</p>
                <p className="text-lg text-white">Creators who ship on GitHub love KYX.</p>
              </div>
              <div className="flex flex-wrap gap-4 text-base text-slate-300">
                {logos.map((logo) => (
                  <span key={logo} className="font-semibold text-white/80">
                    {logo}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section id="workflow" className="space-y-8 py-12">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Workflow</p>
                <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                  Familiar GitHub rituals for a game-first team.
                </h2>
              </div>
              <Button variant="subtle" asChild>
                <Link href="https://github.com/HackKentucky" target="_blank">
                  Explore the repo
                </Link>
              </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {workflow.map((item) => (
                <Card key={item.title} className="border-slate-800/70 bg-slate-950/40">
                  <CardContent className="space-y-3 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800/70 bg-slate-900/60">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                    <p className="text-sm text-slate-400">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section id="creatives" className="space-y-8 py-12">
            <div className="flex flex-col gap-4 text-center">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">For non-technical creatives</p>
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                Make the apocalypse feel personal—no coding required.
              </h2>
              <p className="text-slate-400">
                Whether you draw, write, or stream, KYX keeps the controls approachable so anyone can sculpt
                their own lore, props, and hero moments in a few clicks.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {creativeFeatures.map((feature) => (
                <Card key={feature.title} className="border-slate-800/70 bg-slate-950/40">
                  <CardContent className="space-y-3 p-6">
                    <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                    <p className="text-sm text-slate-400">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-center">
              <Button size="lg" variant="outline" asChild>
                <Link href="/lab">Open the Madlib Lab</Link>
              </Button>
            </div>
          </section>

          <section id="engine" className="grid gap-8 py-12 lg:grid-cols-2">
            <Card className="h-full border-slate-800/70 bg-slate-950/40">
              <CardContent className="space-y-5 p-8">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Playable snippet</p>
                <pre className="overflow-x-auto rounded-2xl bg-black/70 p-6 text-sm text-emerald-200">
{`room.add_platform({
  x: 360,
  y: 420,
  width: 160,
  material: "stone",
  on_enter=lambda player: player.boost(1.25)
})`}
                </pre>
                <p className="text-slate-400">
                  Edit JSON or Python, save, and watch the running build patch in place. No reload. No downtime.
                </p>
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <PlayCircle className="h-4 w-4" />
                  Preview URLs update every time your branch pushes.
                </div>
              </CardContent>
            </Card>
            <Card className="h-full border-slate-800/70 bg-gradient-to-br from-slate-900/70 via-slate-900/40 to-slate-800/40">
              <CardContent className="space-y-5 p-8">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Engine highlights</p>
                <div className="space-y-4">
                  {engineHighlights.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800/70 bg-slate-900/60">
                          {item.icon}
                        </div>
                        <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">{item.body}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          <section id="mods" className="space-y-10 py-16">
            <div className="flex flex-col gap-4 text-center">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Roadmap</p>
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                Transparent shipping schedule, just like GitHub.
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {roadmap.map((item) => (
                <Card key={item.title} className="border-slate-800/70 bg-slate-950/40" id="roadmap">
                  <CardContent className="space-y-3 p-6">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{item.phase}</p>
                    <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                    <p className="text-sm text-slate-400">{item.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-8 py-14">
            <div className="flex flex-col gap-4 text-center">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Stories</p>
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                Community-first shipping, inspired by GitHub.
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {testimonials.map((item) => (
                <Card key={item.author} className="h-full border-slate-800/70 bg-slate-950/40">
                  <CardContent className="space-y-4 p-8">
                    <p className="text-lg text-slate-200">“{item.quote}”</p>
                    <div>
                      <p className="font-semibold text-white">{item.author}</p>
                      <p className="text-sm text-slate-400">{item.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800/70 bg-gradient-to-br from-[#0d1117] via-[#05070c] to-black p-10 text-center">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Get started</p>
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                Spin up the KYX Engine on GitHub in minutes.
              </h2>
              <p className="text-slate-400">
                Fork the repo, push a branch, and receive a playable web build for every pull request.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="https://github.com/HackKentucky" target="_blank">
                  Fork the template
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#hero">Read the docs</Link>
              </Button>
            </div>
          </section>
        </main>

        <footer className="border-t border-slate-800/80 bg-slate-950/40">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-slate-300">
              <Map className="h-4 w-4" />
              Built in Kentucky. Deploys everywhere.
            </div>
            <div className="flex items-center gap-2">
              © {new Date().getFullYear()} KYX Engine · Crafted for Hack Kentucky.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

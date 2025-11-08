import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/auth/user-nav";

const navLinks = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Community", href: "/community" },
  { label: "Create Game", href: "/lab" },
];

const onboardingSteps = [
  {
    title: "Describe Your Game",
    description: "Tell us about your hero, enemies, and what the goal is. Just use plain English—no coding needed.",
  },
  {
    title: "Customize the Feel",
    description: "Pick a mood (hopeful, gritty, or heroic) and difficulty level that matches your vision.",
  },
  {
    title: "Build & Share",
    description: "We'll create a real playable game you can share with friends or publish to our community.",
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
            <UserNav />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-24">
          <section id="hero" className="grid gap-12 py-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-8">
              <Badge variant="success" className="w-fit border-emerald-500/50 bg-emerald-500/10 text-emerald-200">
                Create Platformer Games
              </Badge>
              <div className="space-y-6">
                <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-[3.5rem]">
                  Create Your Own Platformer Game
                </h1>
                <p className="max-w-2xl text-lg text-slate-300">
                  Describe your game idea in plain English, and we&apos;ll turn it into a playable platformer. 
                  Share it with friends or publish it for the community to play.
                </p>
                <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-5 text-sm text-slate-300">
                  <ol className="mt-3 space-y-2">
                    <li>
                      <span className="font-semibold text-white">1. Describe your game idea</span>
                    </li>
                    <li>
                      <span className="font-semibold text-white">2. Customize the characters and difficulty</span>
                    </li>
                    <li>
                      <span className="font-semibold text-white">3. Build and share your game</span>
                    </li>
                  </ol>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild>
                  <Link href="/lab">
                    Create Your Game <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/community">
                    Browse Community Games
                  </Link>
                </Button>
              </div>
            </div>

            <Card
              id="builder"
              className="relative overflow-hidden border border-slate-800/70 bg-gradient-to-br from-[#161b22] via-[#0d1117] to-[#020711]"
            >
              <CardContent className="mt-6 space-y-5">
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-white">Try the Demo</p>
                  <p className="text-slate-300">
                    Play this example to see what you can create. Your game will look and play just like this!
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
                <Button variant="outline" className="w-full border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/10" asChild>
                  <Link href="/demo-game/index.html" target="_blank">
                    Open demo in a new tab
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </section>

          <section id="how-it-works" className="space-y-8 py-12">
            <div className="rounded-3xl border border-slate-800/70 bg-slate-950/40 px-8 py-10">
              <div className="space-y-3 text-center">
                <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                  How It Works
                </h2>
                <p className="text-slate-400">
                  Creating your game is simple - just describe what you want and we&apos;ll handle the rest.
                </p>
              </div>
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {onboardingSteps.map((step) => (
                  <Card key={step.title} className="border-slate-800/70 bg-slate-950/50">
                    <CardContent className="space-y-3 p-6">
                      <p className="text-lg font-semibold text-white">{step.title}</p>
                      <p className="text-slate-300">{step.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>


        <section className="space-y-8 py-12">
          <div className="flex flex-col gap-4 text-center">
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">
              No Coding Required
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Anyone can create a platformer game. Just describe your idea, customize a few settings, and you&apos;re done!
            </p>
          </div>
        </section>

          <section className="rounded-3xl border border-slate-800/70 bg-gradient-to-br from-[#0d1117] via-[#05070c] to-black p-10 text-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                Ready to Create Your Game?
              </h2>
              <p className="text-slate-400">
                Sign up now and start building your own platformer in minutes.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/auth/sign-up">
                  Get Started Free
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/lab">Try It First</Link>
              </Button>
            </div>
          </section>
        </main>

        <footer className="border-t border-slate-800/80 bg-slate-950/40">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-slate-300">
              Built in Kentucky
            </div>
            <div className="flex items-center gap-2">
              © {new Date().getFullYear()} KYX Engine
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

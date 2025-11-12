import Link from "next/link";
import { ArrowRight, Check, Sparkles, Zap, Rocket } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/auth/user-nav";
import { SUBSCRIPTION_LIMITS } from "@/lib/subscription-limits";

const navLinks = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:bg-[#010409] text-slate-900 dark:text-slate-100">
      {/* Light mode gradients */}
      <div className="pointer-events-none absolute inset-0 dark:hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(167,139,250,0.15),transparent_50%)]" />
      </div>
      
      {/* Dark mode gradients */}
      <div className="pointer-events-none absolute inset-0 dark:block hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.15),transparent_45%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(1,4,9,0.95),rgba(2,6,23,0.9))]" />
      </div>

      <div className="relative z-10 flex flex-col">
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-slate-700 dark:text-slate-300 md:flex">
            {navLinks.map((link) => (
              <Link key={link.label} href={link.href} className="transition hover:text-slate-900 dark:hover:text-white">
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
              <Badge variant="success" className="w-fit border-emerald-500/50 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-200 shadow-sm">
                Create Your Own Game
              </Badge>
              <div className="space-y-6">
                <h1 className="text-4xl font-semibold leading-tight text-slate-900 dark:text-white sm:text-5xl lg:text-[3.5rem]">
                  Create Your Own Game with AI
                </h1>
                <p className="max-w-2xl text-lg text-slate-700 dark:text-slate-300">
                  Describe your game idea in plain English, and we&apos;ll turn it into a playable game. 
                  Share it with friends or publish it for the community to play.
                </p>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800/70 bg-white dark:bg-slate-950/40 p-5 text-sm text-slate-700 dark:text-slate-300 shadow-lg shadow-slate-200/50 dark:shadow-none">
                  <ol className="mt-3 space-y-2">
                    <li>
                      <span className="font-semibold text-slate-900 dark:text-white">1. Describe your game idea</span>
                    </li>
                    <li>
                      <span className="font-semibold text-slate-900 dark:text-white">2. Customize the characters and difficulty</span>
                    </li>
                    <li>
                      <span className="font-semibold text-slate-900 dark:text-white">3. Build and share your game</span>
                    </li>
                  </ol>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg" asChild>
                  <Link href="/lab">
                    Create Your Game <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold" asChild>
                  <Link href="/community">
                    Browse Community Games
                  </Link>
                </Button>
              </div>
            </div>

            <Card
              id="builder"
              className="relative overflow-hidden border border-slate-200 dark:border-slate-800/70 bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-[#161b22] dark:via-[#0d1117] dark:to-[#020711] shadow-2xl shadow-blue-200/30 dark:shadow-none"
            >
              <CardContent className="mt-6 space-y-5">
                <div className="space-y-2">
                  <p className="text-xl font-bold text-slate-900 dark:text-white">Try the Demo</p>
                  <p className="text-slate-800 dark:text-slate-300 font-medium">
                    Play this example to see what you can create. Your game will look and play just like this!
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-300 dark:border-slate-800/80 bg-white dark:bg-black/60 p-2">
                  <div className="aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-900/80 bg-slate-100 dark:bg-black">
                    <iframe
                      src="/demo-game/index.html"
                      title="KYX sample game"
                      loading="lazy"
                      className="h-full w-full"
                      allow="fullscreen *; autoplay *; gamepad *; xr-spatial-tracking"
                    />
                  </div>
                </div>
                <Button variant="outline" className="w-full border-2 border-emerald-500 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-500/10 font-semibold" asChild>
                  <Link href="/demo-game/index.html" target="_blank">
                    Open demo in a new tab
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </section>

          <section id="how-it-works" className="space-y-8 py-12">
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800/70 bg-white dark:bg-slate-950/40 px-8 py-10 shadow-xl shadow-slate-200/50 dark:shadow-none">
              <div className="space-y-3 text-center">
                <h2 className="text-3xl font-semibold text-slate-900 dark:text-white sm:text-4xl">
                  How It Works
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Creating your game is simple - just describe what you want and we&apos;ll handle the rest.
                </p>
              </div>
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {onboardingSteps.map((step) => (
                  <Card key={step.title} className="border-slate-200 dark:border-slate-800/70 bg-gradient-to-br from-white to-slate-50 dark:bg-slate-950/50 shadow-md shadow-slate-200/50 dark:shadow-none hover:shadow-lg hover:shadow-slate-300/50 dark:hover:shadow-none transition-shadow">
                    <CardContent className="space-y-3 p-6">
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{step.title}</p>
                      <p className="text-slate-800 dark:text-slate-300 font-medium">{step.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Pricing Section */}
          <section id="pricing" className="space-y-8 py-12">
            <div className="space-y-3 text-center">
              <h2 className="text-3xl font-semibold text-slate-900 dark:text-white sm:text-4xl">
                Choose Your Plan
              </h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Start for free, upgrade when you need more. All plans include access to our AI game builder.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {/* Free Tier */}
              <Card className="border-gray-300 dark:border-gray-500/50 bg-white dark:bg-slate-950/50 hover:border-gray-400 dark:hover:border-gray-500/70 transition-all shadow-lg shadow-slate-200/50 dark:shadow-none">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-3">
                    <Sparkles className="w-10 h-10" />
                  </div>
                  <CardTitle className="text-2xl">Free</CardTitle>
                  <div className="mt-3">
                    <span className="text-4xl font-bold text-slate-900 dark:text-white">$0</span>
                    <span className="text-slate-600 dark:text-slate-400">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3 text-sm text-slate-800 dark:text-slate-300 font-medium">
                    {SUBSCRIPTION_LIMITS.free.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-600 dark:text-green-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold" variant="outline" asChild>
                    <Link href="/auth/sign-up">Get Started Free</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Pro Tier */}
              <Card className="border-blue-400 dark:border-blue-500/50 bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-blue-950/30 dark:to-slate-950/50 hover:border-blue-500 dark:hover:border-blue-500/70 transition-all shadow-xl shadow-blue-200/50 dark:shadow-none">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-3">
                    <Zap className="w-10 h-10" />
                  </div>
                  <CardTitle className="text-2xl">Pro</CardTitle>
                  <div className="mt-3">
                    <span className="text-4xl font-bold text-slate-900 dark:text-white">$5</span>
                    <span className="text-slate-600 dark:text-slate-400">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3 text-sm text-slate-800 dark:text-slate-300 font-medium">
                    {SUBSCRIPTION_LIMITS.pro.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-600 dark:text-green-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md" asChild>
                    <Link href="/pricing">Upgrade to Pro</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Premium Tier */}
              <Card className="border-purple-400 dark:border-purple-500/50 bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-purple-950/30 dark:to-slate-950/50 hover:border-purple-500 dark:hover:border-purple-500/70 transition-all relative shadow-xl shadow-purple-200/50 dark:shadow-none">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
                <CardHeader className="text-center pb-4 pt-6">
                  <div className="flex justify-center mb-3">
                    <Rocket className="w-10 h-10" />
                  </div>
                  <CardTitle className="text-2xl">Premium</CardTitle>
                  <div className="mt-3">
                    <span className="text-4xl font-bold text-slate-900 dark:text-white">$15</span>
                    <span className="text-slate-600 dark:text-slate-400">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3 text-sm text-slate-800 dark:text-slate-300 font-medium">
                    {SUBSCRIPTION_LIMITS.premium.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-600 dark:text-green-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-md" asChild>
                    <Link href="/pricing">Upgrade to Premium</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
            <div className="text-center">
              <Link href="/pricing" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium">
                View detailed pricing comparison →
              </Link>
            </div>
          </section>

        <section className="space-y-8 py-12">
          <div className="flex flex-col gap-4 text-center">
            <h2 className="text-3xl font-semibold text-slate-900 dark:text-white sm:text-4xl">
              No Coding Required
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Anyone can create a game. Just describe your idea, customize a few settings, and you&apos;re done!
            </p>
          </div>
        </section>

          <section className="rounded-3xl border border-slate-200 dark:border-slate-800/70 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-[#0d1117] dark:via-[#05070c] dark:to-black p-10 text-center shadow-2xl shadow-blue-200/30 dark:shadow-none">
            <div className="space-y-4">
              <h2 className="text-3xl font-semibold text-slate-900 dark:text-white sm:text-4xl">
                Ready to Create Your Game?
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Sign up now and start building your own game in minutes.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg" asChild>
                <Link href="/auth/sign-up">
                  Get Started Free
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold" asChild>
                <Link href="/lab">Try It First</Link>
              </Button>
            </div>
          </section>
        </main>

        <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white/50 backdrop-blur-sm dark:bg-slate-950/40">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-slate-600 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-slate-700 dark:text-slate-300">
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

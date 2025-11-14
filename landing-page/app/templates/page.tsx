"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Filter, Star, TrendingUp, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";
import {
  GAME_TEMPLATES,
  getAllCategories,
  getCategoryInfo,
  getFeaturedTemplates,
  getPopularTemplates,
  getTemplatesByCategory,
  type TemplateCategory,
  type GameTemplate,
} from "@/lib/game-templates";
import { DashboardNav } from "@/components/dashboard-nav";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export default function TemplatesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | "all">("all");
  const [filteredTemplates, setFilteredTemplates] = useState<GameTemplate[]>(GAME_TEMPLATES);

  // Update filtered templates when search or category changes
  const updateFilters = (query: string, category: TemplateCategory | "all") => {
    let templates = GAME_TEMPLATES;

    // Apply category filter
    if (category !== "all") {
      templates = getTemplatesByCategory(category);
    }

    // Apply search filter
    if (query.trim()) {
      templates = templates.filter(
        (t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.description.toLowerCase().includes(query.toLowerCase()) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))
      );
    }

    setFilteredTemplates(templates);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    updateFilters(query, selectedCategory);
  };

  const handleCategoryChange = (category: TemplateCategory | "all") => {
    setSelectedCategory(category);
    updateFilters(searchQuery, category);
  };

  const handleUseTemplate = (template: GameTemplate) => {
    // Navigate to lab with template pre-filled
    const params = new URLSearchParams({
      template: template.id,
    });
    router.push(`/lab?${params.toString()}`);
  };

  const featuredTemplates = getFeaturedTemplates();
  const popularTemplates = getPopularTemplates(6);
  const categories = getAllCategories();

  return (
    <div className="min-h-screen bg-[#010409] text-slate-100">
      <DashboardNav />
      
      <main className="mx-auto w-full max-w-7xl px-6 py-12">
        {/* Header */}
        <motion.div 
          className="space-y-4 mb-12"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <Badge className="border-purple-500/40 bg-purple-500/10 text-purple-100">
            <Sparkles className="w-3 h-3 mr-1" />
            50+ Game Templates
          </Badge>
          <h1 className="text-4xl font-semibold text-white sm:text-5xl">
            Game Template Library
          </h1>
          <p className="text-lg text-slate-300 max-w-3xl">
            Start with a professional template and customize it to create your dream game. 
            No coding required - just pick, customize, and play!
          </p>
        </motion.div>

        {/* Search and Filter */}
        <motion.div 
          className="mb-8 space-y-4"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ delay: 0.1 }}
        >
          <div className="flex gap-4 flex-col md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search templates... (e.g., 'platformer', 'puzzle', 'zelda')"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 bg-slate-950/40 border-slate-800/70 text-base"
              />
            </div>
            <Button variant="outline" className="border-slate-800/70 bg-slate-950/40">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleCategoryChange("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedCategory === "all"
                  ? "bg-blue-500/20 text-blue-200 border border-blue-500/40"
                  : "bg-slate-950/40 text-slate-300 border border-slate-800/70 hover:border-slate-600/70"
              }`}
            >
              All Templates
            </button>
            {categories.map((category) => {
              const info = getCategoryInfo(category);
              return (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    selectedCategory === category
                      ? "bg-blue-500/20 text-blue-200 border border-blue-500/40"
                      : "bg-slate-950/40 text-slate-300 border border-slate-800/70 hover:border-slate-600/70"
                  }`}
                >
                  {info.icon} {info.name}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Featured Templates */}
        {selectedCategory === "all" && !searchQuery && (
          <motion.section 
            className="mb-12"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <div className="flex items-center gap-3 mb-6">
              <Star className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-semibold text-white">Featured Templates</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onUse={() => handleUseTemplate(template)}
                  featured
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* Popular Templates */}
        {selectedCategory === "all" && !searchQuery && (
          <motion.section 
            className="mb-12"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
              <h2 className="text-2xl font-semibold text-white">Most Popular</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {popularTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onUse={() => handleUseTemplate(template)}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* All Templates / Filtered Results */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          transition={{ delay: selectedCategory === "all" && !searchQuery ? 0.4 : 0 }}
        >
          <h2 className="text-2xl font-semibold text-white mb-6">
            {searchQuery 
              ? `Search Results (${filteredTemplates.length})` 
              : selectedCategory === "all" 
                ? "All Templates" 
                : `${getCategoryInfo(selectedCategory as TemplateCategory).name} Templates`}
          </h2>
          
          {filteredTemplates.length === 0 ? (
            <Card className="border-slate-800/70 bg-slate-950/40">
              <CardContent className="py-12 text-center">
                <p className="text-slate-400 mb-4">No templates found matching your criteria.</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setFilteredTemplates(GAME_TEMPLATES);
                  }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  variants={fadeInUp}
                  transition={{ delay: index * 0.05 }}
                >
                  <TemplateCard
                    template={template}
                    onUse={() => handleUseTemplate(template)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* CTA Section */}
        <motion.section 
          className="mt-16 rounded-3xl border border-slate-800/70 bg-gradient-to-br from-blue-950/30 to-purple-950/30 p-10 text-center"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-3xl font-semibold text-white mb-4">
            Can&apos;t Find What You&apos;re Looking For?
          </h2>
          <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
            Start from scratch and describe your unique game idea. Our AI will create a custom game just for you!
          </p>
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
            <Link href="/lab">
              Create Custom Game
            </Link>
          </Button>
        </motion.section>
      </main>
    </div>
  );
}

function TemplateCard({ 
  template, 
  onUse,
  featured = false 
}: { 
  template: GameTemplate; 
  onUse: () => void;
  featured?: boolean;
}) {
  const categoryInfo = getCategoryInfo(template.category);
  
  const difficultyColors = {
    beginner: "bg-green-500/10 text-green-300 border-green-500/40",
    intermediate: "bg-yellow-500/10 text-yellow-300 border-yellow-500/40",
    advanced: "bg-red-500/10 text-red-300 border-red-500/40",
  };

  return (
    <CardContainer className="w-full">
      <CardBody className="w-full">
        <Card 
          className={`border-slate-800/70 bg-slate-950/40 hover:border-slate-600/70 transition-all group ${
            featured ? "ring-2 ring-yellow-500/30" : ""
          }`}
        >
          <CardItem translateZ="50" className="w-full">
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <span className="text-3xl">{categoryInfo.icon}</span>
                {featured && (
                  <Badge className="border-yellow-500/40 bg-yellow-500/10 text-yellow-200">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl text-white group-hover:text-blue-300 transition-colors">
                {template.name}
              </CardTitle>
              <p className="text-sm text-slate-400">{template.description}</p>
            </CardHeader>
          </CardItem>
          <CardItem translateZ="30" className="w-full">
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Badge className="border-slate-700 bg-slate-800/50 text-slate-300 text-xs">
                  {categoryInfo.name}
                </Badge>
                <Badge className={`text-xs ${difficultyColors[template.difficulty]}`}>
                  {template.difficulty}
                </Badge>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase">Key Features:</p>
                <div className="flex flex-wrap gap-1">
                  {template.features.slice(0, 3).map((feature, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20"
                    >
                      {feature}
                    </span>
                  ))}
                  {template.features.length > 3 && (
                    <span className="text-xs px-2 py-1 rounded bg-slate-800/50 text-slate-400">
                      +{template.features.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {template.usageCount && (
                <p className="text-xs text-slate-500">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  Used {template.usageCount.toLocaleString()} times
                </p>
              )}

              <CardItem translateZ="80" className="w-full">
                <Button 
                  onClick={onUse}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Use This Template
                </Button>
              </CardItem>
            </CardContent>
          </CardItem>
      </Card>
    </CardBody>
  </CardContainer>
  );
}


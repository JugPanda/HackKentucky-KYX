"use client";

import { useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  generateSprite,
  getSpriteStylePresets,
  getCharacterExamples,
  downloadImageAsFile,
  type SpriteStyle,
  type SpriteType,
} from "@/lib/sprite-generator";

interface SpriteGeneratorDialogProps {
  type: SpriteType;
  onSpriteGenerated?: (file: File, preview: string) => void;
  children?: React.ReactNode;
}

export function SpriteGeneratorDialog({
  type,
  onSpriteGenerated,
  children,
}: SpriteGeneratorDialogProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<SpriteStyle>("pixel art");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stylePresets = getSpriteStylePresets();
  const examples = getCharacterExamples().find((e) => e.type === type)?.examples || [];

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError("Please enter a description");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const result = await generateSprite({
        description,
        type,
        style: selectedStyle,
      });

      if (!result.ok || !result.imageUrl) {
        throw new Error(result.error || "Failed to generate sprite");
      }

      setGeneratedImage(result.imageUrl);
    } catch (err) {
      console.error("Sprite generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate sprite");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseSprite = async () => {
    if (!generatedImage || !onSpriteGenerated) return;

    try {
      // Download the image and convert to File
      const file = await downloadImageAsFile(
        generatedImage,
        `${type}-sprite-${Date.now()}.png`
      );
      
      onSpriteGenerated(file, generatedImage);
      setOpen(false);
      
      // Reset state
      setDescription("");
      setGeneratedImage(null);
    } catch (err) {
      console.error("Error using sprite:", err);
      setError("Failed to use sprite. Please try downloading it manually.");
    }
  };

  const handleExampleClick = (example: string) => {
    setDescription(example);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Wand2 className="w-4 h-4 mr-2" />
            Generate with AI
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI Sprite Generator
          </DialogTitle>
          <DialogDescription>
            Generate a custom {type} sprite using AI. Describe what you want and choose a style.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Describe your {type} sprite
            </Label>
            <Input
              id="description"
              placeholder={`e.g., "heroic knight with shining armor"`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-base"
            />
            
            {/* Examples */}
            <div className="flex flex-wrap gap-2 mt-2">
              <p className="text-xs text-muted-foreground w-full">Quick examples:</p>
              {examples.slice(0, 4).map((example, i) => (
                <Badge
                  key={i}
                  variant="default"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => handleExampleClick(example)}
                >
                  {example}
                </Badge>
              ))}
            </div>
          </div>

          {/* Style Selection */}
          <div className="space-y-2">
            <Label>Art Style</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {stylePresets.map((style) => (
                <button
                  key={style.value}
                  type="button"
                  onClick={() => setSelectedStyle(style.value)}
                  className={`p-3 rounded-lg border text-left transition ${
                    selectedStyle === style.value
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <div className="text-2xl mb-1">{style.icon}</div>
                  <p className="text-sm font-medium">{style.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {style.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !description.trim()}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Sprite
              </>
            )}
          </Button>

          {/* Error Display */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Generated Image Preview */}
          {generatedImage && (
            <div className="space-y-4">
              <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={generatedImage}
                  alt="Generated sprite"
                  className="w-full h-auto"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleUseSprite}
                  className="flex-1"
                  size="lg"
                >
                  Use This Sprite
                </Button>
                <Button
                  onClick={handleGenerate}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  <Loader2 className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>
              </div>
            </div>
          )}

          {/* Pro Tip */}
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-sm text-blue-300">
            <strong>💡 Pro Tip:</strong> Be specific! Include details like colors, clothing, 
            weapons, or distinctive features for best results.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


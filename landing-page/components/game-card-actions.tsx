"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Game } from "@/lib/db-types";
import Link from "next/link";
import { Trash2, Loader2 } from "lucide-react";

interface GameCardActionsProps {
  game: Game;
  profileUsername?: string;
}

export function GameCardActions({ game, profileUsername }: GameCardActionsProps) {
  const router = useRouter();
  const [isBuilding, setIsBuilding] = useState(game.status === "building");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buildProgress, setBuildProgress] = useState("Starting build...");

  // Poll for build status when building
  useEffect(() => {
    if (game.status !== "building") {
      // If we just finished building, auto-navigate to game page
      if (isBuilding && game.status === "published" && profileUsername && game.slug) {
        setTimeout(() => {
          router.push(`/community/${profileUsername}/${game.slug}`);
        }, 500); // Small delay to show success state
      }
      setIsBuilding(false);
      return;
    }

    setIsBuilding(true);
    let pollCount = 0;
    const maxPolls = 120; // 2 minutes max (120 * 1 second)

    const pollInterval = setInterval(async () => {
      pollCount++;
      
      if (pollCount > maxPolls) {
        clearInterval(pollInterval);
        setError("Build is taking longer than expected. Please refresh the page.");
        setIsBuilding(false);
        return;
      }

      // Update progress message
      if (pollCount < 10) {
        setBuildProgress("Compiling Python game code...");
      } else if (pollCount < 30) {
        setBuildProgress("Building WebAssembly...");
      } else if (pollCount < 60) {
        setBuildProgress("Uploading game files...");
      } else {
        setBuildProgress("Finishing up...");
      }

      // Refresh to check status
      router.refresh();
    }, 1000); // Poll every 1 second

    return () => clearInterval(pollInterval);
  }, [game.status, game.slug, profileUsername, isBuilding, router]);

  const handleBuild = async () => {
    setIsBuilding(true);
    setBuildProgress("Starting build...");
    setError(null);

    try {
      const response = await fetch("/api/games/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: game.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start build");
      }

      // Status will be updated by polling effect
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to build game");
      console.error("Build error:", err);
      setIsBuilding(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setError(null);

    try {
      const response = await fetch("/api/games/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: game.id, visibility: "public" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to make game public");
      }

      // Refresh the page to show updated status
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to make game public");
      console.error("Publish error:", err);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleResetBuild = async () => {
    setIsResetting(true);
    setError(null);

    try {
      const response = await fetch("/api/games/reset-build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: game.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reset build");
      }

      // Refresh the page to show updated status
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset build");
      console.error("Reset build error:", err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/games/delete?gameId=${game.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete game");
      }

      // Refresh the page to remove the deleted game
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete game");
      console.error("Delete error:", err);
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Simplified button logic
  const showBuildButton = game.status === "draft";
  const showBuildingStatus = game.status === "building";
  const showViewButton = game.status === "published" && (game.visibility === "public" || game.bundle_url);
  const showMakePublicButton = game.status === "published" && game.visibility === "private";

  return (
    <>
      {showDeleteConfirm ? (
        <div className="space-y-2">
          <p className="text-sm text-slate-300">
            Are you sure you want to delete &quot;{game.title}&quot;? This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="default"
              className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            {showBuildButton && (
              <Button 
                size="sm" 
                className="flex-1" 
                onClick={handleBuild}
                disabled={isBuilding}
              >
                {isBuilding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Building...
                  </>
                ) : (
                  "Build & Publish"
                )}
              </Button>
            )}
            {showBuildingStatus && (
              <Button 
                size="sm" 
                variant="outline"
                className="flex-1" 
                disabled
              >
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Building...
              </Button>
            )}
            {showViewButton && (
              <Link
                href={`/community/${profileUsername}/${game.slug}`}
                className="flex-1"
              >
                <Button size="sm" className="w-full">
                  🎮 Play Game
                </Button>
              </Link>
            )}
            {showMakePublicButton && (
              <Button 
                size="sm" 
                variant="outline"
                className="flex-1" 
                onClick={handlePublish}
                disabled={isPublishing}
              >
                {isPublishing ? "Making Public..." : "Make Public"}
              </Button>
            )}
            <Link href={`/lab?edit=${game.id}`}>
              <Button size="sm" variant="ghost">
                Edit
              </Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-400 hover:text-red-300 hover:bg-red-950/20"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          {showBuildingStatus && (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              {buildProgress}
            </div>
          )}
          {error && (
            <div className="text-sm text-red-500">
              {error}
            </div>
          )}
        </div>
      )}
    </>
  );
}


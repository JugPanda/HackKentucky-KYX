"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Game } from "@/lib/db-types";
import Link from "next/link";
import { Trash2 } from "lucide-react";

interface GameCardActionsProps {
  game: Game;
  profileUsername?: string;
}

export function GameCardActions({ game, profileUsername }: GameCardActionsProps) {
  const router = useRouter();
  const [isBuilding, setIsBuilding] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBuild = async () => {
    setIsBuilding(true);
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

      // Refresh the page to show updated status
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to build game");
      console.error("Build error:", err);
    } finally {
      setIsBuilding(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setError(null);

    try {
      const response = await fetch("/api/games/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: game.id, visibility: "public" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to publish game");
      }

      // Refresh the page to show updated status
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish game");
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
        <div className="flex gap-2">
          {game.status === "draft" && (
            <Button 
              size="sm" 
              className="flex-1" 
              onClick={handleBuild}
              disabled={isBuilding}
            >
              {isBuilding ? "Building..." : "Build"}
            </Button>
          )}
          {game.status === "building" && (
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1" 
              onClick={handleResetBuild}
              disabled={isResetting}
            >
              {isResetting ? "Resetting..." : "Reset Build"}
            </Button>
          )}
          {game.status === "built" && game.visibility !== "public" && (
            <Button 
              size="sm" 
              className="flex-1" 
              onClick={handlePublish}
              disabled={isPublishing}
            >
              {isPublishing ? "Publishing..." : "Publish"}
            </Button>
          )}
          {game.visibility === "public" && (
            <Link
              href={`/community/${profileUsername}/${game.slug}`}
              className="flex-1"
            >
              <Button size="sm" variant="outline" className="w-full">
                View
              </Button>
            </Link>
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
      )}
      {error && (
        <div className="mt-2 text-sm text-red-500">
          {error}
        </div>
      )}
    </>
  );
}


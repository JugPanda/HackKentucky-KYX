"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Game } from "@/lib/db-types";
import Link from "next/link";

interface GameCardActionsProps {
  game: Game;
  profileUsername?: string;
}

export function GameCardActions({ game, profileUsername }: GameCardActionsProps) {
  const router = useRouter();
  const [isBuilding, setIsBuilding] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
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

  return (
    <>
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
      </div>
      {error && (
        <div className="mt-2 text-sm text-red-500">
          {error}
        </div>
      )}
    </>
  );
}


"use client";

import { Card } from "@/components/ui/card";

interface GamePlayerProps {
  gameId: string;
  gameTitle: string;
}

export function GamePlayer({ gameId, gameTitle }: GamePlayerProps) {
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const iframe = e.currentTarget.querySelector('iframe');
    if (iframe) {
      iframe.focus();
    }
  };

  return (
    <>
      <div className="mb-2 text-sm text-muted-foreground">
        💡 Click on the game to start playing! Use Arrow Keys or WASD to move, Spacebar to jump.
      </div>
      <Card 
        className="mb-6 overflow-hidden cursor-pointer" 
        onClick={handleCardClick}
      >
        <div className="w-full h-[600px] overflow-hidden relative">
          <iframe
            src={`/api/play/${gameId}/`}
            className="w-full h-full border-0 pointer-events-auto"
            title={gameTitle}
            sandbox="allow-scripts allow-same-origin allow-downloads allow-forms allow-modals allow-pointer-lock allow-top-navigation"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; gamepad; xr-spatial-tracking; cross-origin-isolated; fullscreen"
            tabIndex={0}
          />
        </div>
      </Card>
    </>
  );
}


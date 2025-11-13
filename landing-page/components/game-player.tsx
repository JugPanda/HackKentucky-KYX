"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GamePlayerProps {
  gameId: string;
  gameTitle: string;
  language?: string; // "python" or "javascript"
}

export function GamePlayer({ gameId, gameTitle, language = "python" }: GamePlayerProps) {
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const iframe = e.currentTarget.querySelector('iframe');
    if (iframe) {
      iframe.focus();
    }
  };

  const isPython = language === "python";

  return (
    <>
      <div className="mb-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-sm font-medium text-blue-300 mb-1">
          🎮 How to Play: {!isPython && <Badge className="ml-2 bg-green-500/20 text-green-300 border-green-500/30">HTML5 Game</Badge>}
        </p>
        <ol className="text-xs text-blue-200 space-y-1 ml-4 list-decimal">
          <li><strong>Click on the game window below</strong> to focus it</li>
          {isPython && <li>Wait for &quot;Python loading...&quot; to finish (~10 seconds)</li>}
          {!isPython && <li>Game loads instantly - no wait required! ⚡</li>}
          <li>Use <strong>Arrow Keys</strong> or <strong>WASD</strong> to move</li>
          <li>Press <strong>Spacebar</strong> for actions (jump, fire, etc.)</li>
          <li>Press <strong>R</strong> to restart if you win or lose</li>
        </ol>
      </div>
      <Card 
        className="mb-6 overflow-hidden cursor-pointer" 
        onClick={handleCardClick}
      >
        <div className="w-full h-[600px] overflow-hidden relative">
          <iframe
            src={`/api/play/${gameId}`}
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


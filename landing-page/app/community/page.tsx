import { createClient } from "@/lib/supabase/server";
import { Game } from "@/lib/db-types";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CommunityPage() {
  const supabase = await createClient();

  // Fetch published games with profiles
  const { data: games } = await supabase
    .from("games")
    .select(`
      *,
      profiles:user_id (
        username,
        avatar_url
      )
    `)
    .eq("visibility", "public")
    .order("published_at", { ascending: false })
    .limit(50);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Community Games</h1>
        <p className="text-muted-foreground">
          Explore games created by the KYX community
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games && games.length > 0 ? (
          games.map((game: Game) => (
            <Link key={game.id} href={`/community/${game.profiles?.username}/${game.slug}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-1">{game.title}</CardTitle>
                      <CardDescription className="mt-1">
                        by {game.profiles?.username || "Anonymous"}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {(game.config as { story?: { difficulty?: string } })?.story?.difficulty || "veteran"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {game.description ||
                      (game.config as { story?: { goal?: string } })?.story?.goal ||
                      "No description"}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>❤️ {game.like_count}</span>
                    <span>▶️ {game.play_count}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No published games yet. Be the first!</p>
          </div>
        )}
      </div>
    </div>
  );
}


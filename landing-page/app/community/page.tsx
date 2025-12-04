import { createClient } from "@/lib/supabase/server";
import { Game } from "@/lib/db-types";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardNav } from "@/components/dashboard-nav";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";

export default async function CommunityPage() {
  const supabase = await createClient();

  // Fetch published games
  const { data: games } = await supabase
    .from("games")
    .select("*")
    .eq("visibility", "public")
    .order("published_at", { ascending: false })
    .limit(50);

  // Enrich with profile data
  if (games && games.length > 0) {
    const userIds = [...new Set(games.map(g => g.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", userIds);
    
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    games.forEach(game => {
      const profile = profileMap.get(game.user_id);
      // Ensure we always have a profiles object with username
      game.profiles = profile ? { username: profile.username, avatar_url: profile.avatar_url } : { username: "Unknown", avatar_url: null };
    });
  }

  return (
    <>
      <DashboardNav />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Community Games</h1>
          <p className="text-muted-foreground">
            Explore games created by the JG Engine community
          </p>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games && games.length > 0 ? (
          games.map((game: Game) => (
            <CardContainer key={game.id} className="w-full">
              <CardBody className="w-full">
                <Card className="border-slate-800/70 bg-slate-950/40 hover:border-slate-600/70 transition-all h-full flex flex-col">
                  <Link href={`/community/${game.profiles?.username}/${game.slug}`} className="flex-1">
                    <CardItem translateZ="50" className="w-full">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="line-clamp-1 text-white">{game.title}</CardTitle>
                            <CardDescription className="mt-1 text-slate-400">
                              by {game.profiles?.username || "Anonymous"}
                            </CardDescription>
                          </div>
                          <Badge variant="default" className="bg-slate-700 text-slate-200">
                            {(game.config as { story?: { difficulty?: string } })?.story?.difficulty || "veteran"}
                          </Badge>
                        </div>
                      </CardHeader>
                    </CardItem>
                    <CardItem translateZ="30" className="w-full">
                      <CardContent>
                        <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                          {game.description ||
                            (game.config as { story?: { goal?: string } })?.story?.goal ||
                            "No description"}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span>❤️ {game.like_count}</span>
                          <span>▶️ {game.play_count}</span>
                        </div>
                      </CardContent>
                    </CardItem>
                  </Link>
                  <CardItem translateZ="80" className="w-full">
                    <CardContent className="pt-0">
                      <div className="flex gap-2">
                        <Link href={`/community/${game.profiles?.username}/${game.slug}`} className="flex-1">
                          <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                            🎮 Play
                          </Button>
                        </Link>
                        <Link href={`/lab?remix=${game.id}`} className="flex-1">
                          <Button size="sm" variant="outline" className="w-full border-slate-600 hover:bg-slate-800">
                            🔄 Remix
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </CardItem>
                </Card>
              </CardBody>
            </CardContainer>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No published games yet. Be the first!</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}


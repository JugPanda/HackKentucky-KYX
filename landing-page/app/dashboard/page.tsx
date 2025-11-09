import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Game } from "@/lib/db-types";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GameCardActions } from "@/components/game-card-actions";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  // Fetch user's games
  const { data: games } = await supabase
    .from("games")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {profile?.username}!</p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 flex gap-4">
        <Link href="/lab">
          <Button size="lg">Create New Game</Button>
        </Link>
        <Link href="/community">
          <Button variant="outline" size="lg">
            Browse Community
          </Button>
        </Link>
      </div>

      {/* Games Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Your Games</h2>

        {games && games.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game: Game) => (
              <Card key={game.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-1">{game.title}</CardTitle>
                      <CardDescription className="mt-1">{game.slug}</CardDescription>
                    </div>
                    <Badge
                      variant={
                        game.status === "published"
                          ? "success"
                          : "default"
                      }
                    >
                      {game.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {game.description || "No description"}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span>❤️ {game.like_count}</span>
                    <span>▶️ {game.play_count}</span>
                    <Badge variant="default">{game.visibility}</Badge>
                  </div>

                  <GameCardActions game={game} profileUsername={profile?.username} />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              You haven&apos;t created any games yet.
            </p>
            <Link href="/lab">
              <Button>Create Your First Game</Button>
            </Link>
          </Card>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Games</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{games?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Likes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">
              {games?.reduce((sum, game) => sum + (game.like_count || 0), 0) || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Plays</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">
              {games?.reduce((sum, game) => sum + (game.play_count || 0), 0) || 0}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


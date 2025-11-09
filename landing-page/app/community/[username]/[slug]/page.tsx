import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    username: string;
    slug: string;
  }>;
}

export default async function GamePage({ params }: PageProps) {
  const { username, slug } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch profile by username
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single();

  if (!profile) {
    notFound();
  }

  // Fetch game
  const { data: game } = await supabase
    .from("games")
    .select(`
      *,
      profiles:user_id (
        username,
        avatar_url,
        bio
      )
    `)
    .eq("user_id", profile.id)
    .eq("slug", slug)
    .single();

  if (!game) {
    notFound();
  }

  // Check if user can view this game
  const isOwner = user && game.user_id === user.id;
  const canView = game.visibility === "public" || isOwner;

  if (!canView) {
    notFound();
  }

  // Owner can always view, even if private
  if (!game.bundle_url && !isOwner) {
    notFound();
  }

  // Check if current user has liked this game
  let hasLiked = false;
  if (user) {
    const { data: likeData } = await supabase
      .from("likes")
      .select("id")
      .eq("user_id", user.id)
      .eq("game_id", game.id)
      .single();

    hasLiked = !!likeData;
  }

  // Fetch comments
  const { data: comments } = await supabase
    .from("comments")
    .select(`
      *,
      profiles:user_id (
        username,
        avatar_url
      )
    `)
    .eq("game_id", game.id)
    .order("created_at", { ascending: false});

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Game Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">{game.title}</h1>
            <p className="text-muted-foreground">
              by{" "}
              <Link
                href={`/community/${game.profiles?.username}`}
                className="hover:underline"
              >
                {game.profiles?.username}
              </Link>
            </p>
          </div>
          <div className="flex gap-2">
            <Badge>
              {(game.config as { story?: { difficulty?: string } })?.story?.difficulty || "veteran"}
            </Badge>
            <Badge variant="default">
              {(game.config as { story?: { tone?: string } })?.story?.tone || "hopeful"}
            </Badge>
          </div>
        </div>

        {game.description && (
          <p className="text-muted-foreground mb-4">{game.description}</p>
        )}

        <div className="flex items-center gap-4 text-sm">
          <span>❤️ {game.like_count} likes</span>
          <span>▶️ {game.play_count} plays</span>
          <span>
            Published {new Date(game.published_at || game.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Game Player */}
      {game.bundle_url ? (
        <Card className="mb-6 overflow-hidden">
          <iframe
            src={game.bundle_url}
            className="w-full h-[600px] border-0"
            title={game.title}
          />
        </Card>
      ) : (
        <Card className="mb-6 p-8 text-center">
          <p className="text-muted-foreground">
            Game is still building... Check back soon!
          </p>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-2 mb-8">
        {user && !isOwner && (
          <Button
            variant={hasLiked ? "default" : "outline"}
            onClick={() => {
              // Like/unlike functionality (client component needed)
            }}
          >
            {hasLiked ? "❤️ Liked" : "🤍 Like"}
          </Button>
        )}
        {isOwner && (
          <Link href="/dashboard">
            <Button variant="outline">Edit Game</Button>
          </Link>
        )}
      </div>

      {/* Comments Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Comments ({comments?.length || 0})</h2>
        
        {user && !isOwner && (
          <Card className="p-4">
            <textarea
              placeholder="Add a comment..."
              className="w-full p-2 border rounded resize-none"
              rows={3}
            />
            <Button className="mt-2">Post Comment</Button>
          </Card>
        )}

        {comments && comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <Card key={comment.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">
                        {comment.profiles?.username || "Anonymous"}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  );
}


"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface GameInteractionsProps {
  gameId: string;
  initialHasLiked: boolean;
  initialLikeCount: number;
  initialComments: Array<{
    id: string;
    content: string;
    created_at: string;
    profiles: {
      username: string;
      avatar_url: string | null;
    } | null;
  }>;
  isOwner: boolean;
  userId: string | null;
}

export function GameInteractions({
  gameId,
  initialHasLiked,
  initialLikeCount,
  initialComments,
  isOwner,
  userId,
}: GameInteractionsProps) {
  const router = useRouter();
  const [hasLiked, setHasLiked] = useState(initialHasLiked);
  const [comments] = useState(initialComments);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  
  // Suppress unused variable warnings
  void initialLikeCount;

  const handleLike = async () => {
    if (!userId || isOwner) return;

    setIsTogglingLike(true);
    try {
      const response = await fetch("/api/games/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to toggle like");
      }

      const { liked } = await response.json();
      setHasLiked(liked);
    } catch (error) {
      console.error("Error toggling like:", error);
      alert(error instanceof Error ? error.message : "Failed to toggle like");
    } finally {
      setIsTogglingLike(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!userId || isOwner || !commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const response = await fetch("/api/comments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId,
          content: commentText.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to post comment");
      }
      
      // Refresh comments by reloading the page
      router.refresh();
      setCommentText("");
    } catch (error) {
      console.error("Error posting comment:", error);
      alert(error instanceof Error ? error.message : "Failed to post comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <>
      {/* Like Button */}
      {userId && !isOwner && (
        <div className="flex gap-2 mb-8">
          <Button
            variant={hasLiked ? "default" : "outline"}
            onClick={handleLike}
            disabled={isTogglingLike}
          >
            {hasLiked ? "❤️ Liked" : "🤍 Like"}
          </Button>
        </div>
      )}

      {/* Comments Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Comments ({comments.length})</h2>
        
        {userId && !isOwner && (
          <Card className="p-4">
            <Textarea
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full p-2 border rounded resize-none"
              rows={3}
              maxLength={1000}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                {commentText.length}/1000
              </span>
              <Button 
                onClick={handleCommentSubmit}
                disabled={isSubmittingComment || !commentText.trim()}
              >
                {isSubmittingComment ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </Card>
        )}

        {comments.length > 0 ? (
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
                    <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
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
    </>
  );
}

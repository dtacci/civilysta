"use client";

import { useState } from "react";
import { trpc } from "~/lib/trpc/client";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";
import { cn } from "~/lib/utils";

interface CommentSectionProps {
  causeId: string;
}

export function CommentSection({ causeId }: CommentSectionProps) {
  const [sortBy, setSortBy] = useState<"top" | "newest" | "oldest">("top");
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.comment.getByCause.useQuery({
    causeId,
    sortBy,
  });
  const comments = data?.comments;

  const createComment = trpc.comment.create.useMutation({
    onSuccess: () => {
      setNewComment("");
      setReplyContent("");
      setReplyingTo(null);
      utils.comment.getByCause.invalidate({ causeId });
    },
  });

  const vote = trpc.comment.vote.useMutation({
    onSuccess: () => {
      utils.comment.getByCause.invalidate({ causeId });
    },
  });

  const handleSubmit = (parentId?: string) => {
    const content = parentId ? replyContent : newComment;
    if (!content.trim()) return;
    createComment.mutate({ causeId, content, parentId });
  };

  return (
    <div className="space-y-6">
      {/* Sort controls */}
      <div className="flex gap-2">
        {(["top", "newest", "oldest"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={cn(
              "rounded-full px-3 py-1 text-sm transition-colors",
              sortBy === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* New comment form */}
      <div className="space-y-2">
        <Textarea
          placeholder="Share your thoughts..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
        />
        <Button
          onClick={() => handleSubmit()}
          disabled={!newComment.trim() || createComment.isPending}
          size="sm"
        >
          {createComment.isPending ? "Posting..." : "Post Comment"}
        </Button>
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment: any) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              onVote={(commentId, voteType) =>
                vote.mutate({ commentId, voteType })
              }
              onReply={(commentId) => setReplyingTo(commentId)}
              replyingTo={replyingTo}
              replyContent={replyContent}
              onReplyChange={setReplyContent}
              onSubmitReply={() => handleSubmit(replyingTo ?? undefined)}
              isSubmitting={createComment.isPending}
            />
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-muted-foreground">
          No comments yet. Be the first to share your thoughts!
        </p>
      )}
    </div>
  );
}

interface CommentCardProps {
  comment: any;
  onVote: (commentId: string, voteType: "UP" | "DOWN") => void;
  onReply: (commentId: string) => void;
  replyingTo: string | null;
  replyContent: string;
  onReplyChange: (content: string) => void;
  onSubmitReply: () => void;
  isSubmitting: boolean;
  depth?: number;
}

function CommentCard({
  comment,
  onVote,
  onReply,
  replyingTo,
  replyContent,
  onReplyChange,
  onSubmitReply,
  isSubmitting,
  depth = 0,
}: CommentCardProps) {
  const userVote = comment.votes?.[0]?.voteType;

  return (
    <div className={cn("space-y-3", depth > 0 && "ml-8 border-l-2 border-muted pl-4")}>
      <div className="rounded-lg bg-muted/30 p-4">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
            {comment.author?.name?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
          <span className="text-sm font-medium">
            {comment.author?.name ?? "Anonymous"}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(comment.createdAt).toLocaleDateString()}
          </span>
        </div>

        <p className="mb-3 text-sm">{comment.content}</p>

        <div className="flex items-center gap-4">
          <button
            onClick={() => onVote(comment.id, "UP")}
            className={cn(
              "flex items-center gap-1 text-xs transition-colors",
              userVote === "UP"
                ? "text-primary"
                : "text-muted-foreground hover:text-primary"
            )}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            {comment.upvoteCount > 0 && comment.upvoteCount}
          </button>

          <button
            onClick={() => onVote(comment.id, "DOWN")}
            className={cn(
              "flex items-center gap-1 text-xs transition-colors",
              userVote === "DOWN"
                ? "text-destructive"
                : "text-muted-foreground hover:text-destructive"
            )}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
            {comment.downvoteCount > 0 && comment.downvoteCount}
          </button>

          {depth < 3 && (
            <button
              onClick={() => onReply(comment.id)}
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Reply
            </button>
          )}
        </div>
      </div>

      {/* Reply form */}
      {replyingTo === comment.id && (
        <div className="ml-8 space-y-2">
          <Textarea
            placeholder="Write a reply..."
            value={replyContent}
            onChange={(e) => onReplyChange(e.target.value)}
            rows={2}
          />
          <div className="flex gap-2">
            <Button
              onClick={onSubmitReply}
              disabled={!replyContent.trim() || isSubmitting}
              size="sm"
            >
              Reply
            </Button>
            <Button
              onClick={() => onReply("")}
              variant="ghost"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Nested replies */}
      {comment.replies?.map((reply: any) => (
        <CommentCard
          key={reply.id}
          comment={reply}
          onVote={onVote}
          onReply={onReply}
          replyingTo={replyingTo}
          replyContent={replyContent}
          onReplyChange={onReplyChange}
          onSubmitReply={onSubmitReply}
          isSubmitting={isSubmitting}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

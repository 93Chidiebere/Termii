import { useState, useEffect } from "react";
import { Heart, MessageCircle, Bookmark, Share2, MoreHorizontal, Send, Loader2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import type { Post } from "@/types";
import { useFollowStore } from "@/stores/followStore";
import { useBlockMuteStore } from "@/stores/blockMuteStore";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { toggleLike, toggleSave, getComments, addComment, type ApiComment } from "@/lib/api";
import { BlockMuteMenu } from "@/components/user/BlockMuteMenu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  post: Post;
  index: number;
}

export const PostCard = ({ post, index }: PostCardProps) => {
  const { user } = useAuthStore();
  const [liked, setLiked] = useState(post.liked ?? false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [saved, setSaved] = useState(post.saved ?? false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isFollowing, toggleFollow } = useFollowStore();
  const { isBlocked } = useBlockMuteStore();
  const { toast } = useToast();
  const following = isFollowing(post.userId);
  const isOwnPost = user?.id === post.userId;

  // ── Inline comments state ────────────────────────────────────────────────
  const [previewComment, setPreviewComment] = useState<ApiComment | null>(null);
  const [commentCount, setCommentCount] = useState(post.comments);
  const [expanded, setExpanded] = useState(false);
  const [allComments, setAllComments] = useState<ApiComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  // Fetch just one preview comment on mount (cheap, no full list)
  useEffect(() => {
    if (commentCount === 0) return;
    let cancelled = false;
    const loadPreview = async () => {
      try {
        const data = await getComments(post.id);
        if (!cancelled && data.length > 0) {
          setPreviewComment(data[data.length - 1]); // most recent
        }
      } catch {
        // silently fail — preview is non-critical
      }
    };
    loadPreview();
    return () => { cancelled = true; };
  }, [post.id, commentCount]);

  const handleToggleExpand = async () => {
    const willExpand = !expanded;
    setExpanded(willExpand);
    if (willExpand && allComments.length === 0) {
      setIsLoadingComments(true);
      try {
        const data = await getComments(post.id);
        setAllComments(data);
      } catch {
        setAllComments([]);
      } finally {
        setIsLoadingComments(false);
      }
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsPosting(true);
    try {
      const comment = await addComment(post.id, newComment.trim());
      setAllComments((prev) => [...prev, comment]);
      setPreviewComment(comment);
      setCommentCount((c) => c + 1);
      setNewComment("");
      if (!expanded) setExpanded(true);
    } catch {
      toast({ title: "Could not post comment. Please try again." });
    } finally {
      setIsPosting(false);
    }
  };

  if (isBlocked(post.userId)) return null;

  const isVideo =
    (post as any).mediaType === "video" ||
    (post.image?.includes("/video/") ?? false);

  const handleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((c) => (newLiked ? c + 1 : c - 1));
    try {
      const result = await toggleLike(post.id);
      setLiked(result.liked);
      setLikeCount(result.likes_count);
    } catch {
      setLiked(!newLiked);
      setLikeCount((c) => (newLiked ? c - 1 : c + 1));
    }
  };

  const handleSave = async () => {
    const newSaved = !saved;
    setSaved(newSaved);
    try {
      const result = await toggleSave(post.id);
      setSaved(result.saved);
      toast({
        title: result.saved ? "Saved" : "Removed from saved",
        description: result.saved
          ? "Find it in Profile → Saved."
          : "Post removed from your saved list.",
      });
    } catch {
      setSaved(!newSaved);
      toast({ title: "Failed to save post. Please try again." });
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    toast({ title: "Link copied", description: "Post link copied to clipboard." });
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="bg-card rounded-xl overflow-hidden border border-border"
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 p-4">
        {post.user.avatar ? (
          <img
            src={post.user.avatar}
            alt={post.user.displayName}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-gold/30"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-gold/30">
            <span className="text-sm font-bold text-primary">
              {post.user.displayName[0]?.toUpperCase()}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">
            {post.user.displayName}
          </p>
          <p className="text-xs text-muted-foreground">@{post.user.username}</p>
        </div>

        {!isOwnPost && (
          <button
            onClick={() => toggleFollow(post.userId)}
            className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${
              following
                ? "bg-muted text-muted-foreground"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {following ? "Following" : "Follow"}
          </button>
        )}

        {!isOwnPost && (
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger asChild>
              <button className="p-1 rounded-lg hover:bg-muted transition-colors">
                <MoreHorizontal size={18} className="text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-2 rounded-xl">
              <BlockMuteMenu
                userId={post.userId}
                displayName={post.user.displayName}
                onActionComplete={() => setMenuOpen(false)}
              />
            </PopoverContent>
          </Popover>
        )}

        {post.hairType && (
          <span className="text-xs font-medium bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">
            {post.hairType}
          </span>
        )}
      </div>

      {/* ── Media ──────────────────────────────────────────────────────────── */}
      {post.image ? (
        isVideo ? (
          <div className="relative bg-muted">
            <video
              src={post.image}
              controls
              className="w-full max-h-96"
              preload="metadata"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ) : (
          <Link to={`/post/${post.id}`} className="relative aspect-[4/5] bg-muted block">
            <img
              src={post.image}
              alt={post.caption}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </Link>
        )
      ) : (
        <Link to={`/post/${post.id}`} className="block px-4 py-6 bg-muted/30">
          <p className="text-foreground text-base leading-relaxed">{post.caption}</p>
        </Link>
      )}

      {/* ── Actions ────────────────────────────────────────────────────────── */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} className="transition-transform active:scale-125">
              <Heart
                size={24}
                className={liked ? "fill-terracotta text-terracotta" : "text-foreground"}
                strokeWidth={1.5}
              />
            </button>
            <button onClick={handleToggleExpand} aria-label="Toggle comments">
              <MessageCircle size={24} className="text-foreground" strokeWidth={1.5} />
            </button>
            <button onClick={handleShare} aria-label="Share post">
              <Share2 size={22} className="text-foreground" strokeWidth={1.5} />
            </button>
          </div>
          <button
            onClick={handleSave}
            aria-label={saved ? "Unsave post" : "Save post"}
            className="transition-transform active:scale-110"
          >
            <Bookmark
              size={24}
              className={saved ? "fill-primary text-primary" : "text-foreground"}
              strokeWidth={1.5}
            />
          </button>
        </div>

        <p className="font-semibold text-sm text-foreground mb-1">
          {likeCount.toLocaleString()} likes
        </p>
        <p className="text-sm text-foreground leading-relaxed">
          <span className="font-semibold">{post.user.username}</span>{" "}
          {post.caption}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {post.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs text-primary font-medium">
              #{tag}
            </span>
          ))}
        </div>

        {/* ── Comment preview (Instagram-style) ──────────────────────────── */}
        {commentCount > 0 && !expanded && (
          <div className="mt-2">
            <button
              onClick={handleToggleExpand}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View all {commentCount} comment{commentCount !== 1 ? "s" : ""}
            </button>
            {previewComment && (
              <p className="text-sm text-foreground mt-1">
                <span className="font-semibold">{previewComment.user_name}</span>{" "}
                {previewComment.text}
              </p>
            )}
          </div>
        )}

        {/* ── Expanded inline comment panel ──────────────────────────────── */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <button
                onClick={handleToggleExpand}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-3 mb-2"
              >
                <ChevronDown size={14} className="rotate-180" /> Hide comments
              </button>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {isLoadingComments ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 size={18} className="animate-spin text-primary" />
                  </div>
                ) : allComments.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No comments yet. Be the first!</p>
                ) : (
                  allComments.map((c) => (
                    <div key={c.id}>
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">{c.user_name}</span>{" "}
                        {c.text}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(c.created_at + "Z"), { addSuffix: true })}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handlePostComment} className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || isPosting}
                  className="text-primary disabled:opacity-40"
                >
                  {isPosting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {commentCount === 0 && !expanded && (
          <p className="text-xs text-muted-foreground mt-2">
            <button onClick={handleToggleExpand} className="hover:text-foreground transition-colors">
              No comments yet — be the first
            </button>
          </p>
        )}
      </div>
    </motion.article>
  );
};
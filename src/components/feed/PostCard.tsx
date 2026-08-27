import { useState, useEffect, useRef } from "react";
import {
  Heart, MessageCircle, Bookmark, Share2, MoreHorizontal,
  Send, Loader2, ChevronDown, Image as ImageIcon, Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import type { Post } from "@/types";
import { useFollowStore } from "@/stores/followStore";
import { useBlockMuteStore } from "@/stores/blockMuteStore";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { useRoleStore } from "@/stores/roleStore";
import {
  toggleLike, toggleSave, getComments, addComment,
  toggleCommentLike, getMentionSuggestions, deletePost,
  type ApiComment, type ApiUser,
} from "@/lib/api";
import { BlockMuteMenu } from "@/components/user/BlockMuteMenu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";
import { generateShareCard } from "@/lib/generateShareCard";

interface PostCardProps {
  post: Post;
  index: number;
}

// ── Mention-aware input ───────────────────────────────────────────────────────
const MentionInput = ({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled,
  isPosting,
  autoFocus,
}: {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder: string;
  disabled?: boolean;
  isPosting: boolean;
  autoFocus?: boolean;
}) => {
  const [suggestions, setSuggestions] = useState<ApiUser[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    // Detect @mention being typed
    const cursorPos = e.target.selectionStart || 0;
    const textUpToCursor = val.slice(0, cursorPos);
    const mentionMatch = textUpToCursor.match(/@([\w.]*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);
      if (query.length >= 1) {
        try {
          const results = await getMentionSuggestions(query);
          setSuggestions(results.slice(0, 5));
        } catch {
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    } else {
      setMentionQuery(null);
      setSuggestions([]);
    }
  };

  const handleSelectMention = (user: ApiUser) => {
    if (!inputRef.current) return;
    const cursorPos = inputRef.current.selectionStart || 0;
    const textUpToCursor = value.slice(0, cursorPos);
    const mentionStart = textUpToCursor.lastIndexOf("@");
    const newValue =
      value.slice(0, mentionStart) +
      `@${user.full_name.toLowerCase().replace(/\s+/g, "")} ` +
      value.slice(cursorPos);
    onChange(newValue);
    setSuggestions([]);
    setMentionQuery(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className="relative flex-1">
      <input
        ref={inputRef}
        autoFocus={autoFocus}
        value={value}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit(e as any);
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
      />

      {/* @mention suggestions dropdown */}
      {suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1 w-56 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          {suggestions.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => handleSelectMention(u)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                {u.avatar_url ? (
                  <img src={u.avatar_url} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-primary">
                    {u.full_name[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{u.full_name}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Comment / Reply row with like button ─────────────────────────────────────
const CommentRow = ({
  comment,
  currentUserId,
  onReply,
}: {
  comment: ApiComment;
  currentUserId: string;
  onReply?: () => void;
}) => {
  const [liked, setLiked] = useState(comment.is_liked ?? false);
  const [likeCount, setLikeCount] = useState(comment.likes_count ?? 0);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((c) => newLiked ? c + 1 : c - 1);
    try {
      const result = await toggleCommentLike(comment.id);
      // Only sync the server count — don't overwrite liked state
      setLikeCount(result.likes_count);
    } catch {
      // Revert on actual failure
      setLiked(!newLiked);
      setLikeCount((c) => newLiked ? c - 1 : c + 1);
    }
  };

  return (
    <div className="flex items-start gap-1.5 group">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">
          <span className="font-semibold">{comment.user_name}</span>{" "}
          {/* Render @mentions as highlighted */}
          {comment.text.split(/(@[\w.]+)/g).map((part, i) =>
            part.startsWith("@") ? (
              <span key={i} className="text-primary font-medium">{part}</span>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </p>
        <div className="flex items-center gap-3 mt-0.5">
          <p className="text-[11px] text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at + "Z"), { addSuffix: true })}
          </p>
          {likeCount > 0 && (
            <span className="text-[11px] text-muted-foreground">{likeCount} like{likeCount !== 1 ? "s" : ""}</span>
          )}
          {onReply && (
            <button
              onClick={onReply}
              className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Reply
            </button>
          )}
        </div>
      </div>
      {/* Like button on comment/reply */}
      <button
        onClick={handleLike}
        className="mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity active:scale-125 flex-shrink-0"
        aria-label="Like comment"
      >
        <Heart
          size={13}
          className={liked ? "fill-terracotta text-terracotta" : "text-muted-foreground"}
          strokeWidth={1.5}
        />
      </button>
    </div>
  );
};


// ── Main PostCard ─────────────────────────────────────────────────────────────
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
  const isAdmin = useRoleStore((s) => s.isAdmin);
  const canDelete = isOwnPost || isAdmin;
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    setIsDeleting(true);
    try {
      await deletePost(post.id);
      setIsDeleted(true);
      toast({ title: "Post deleted successfully" });
    } catch {
      toast({ title: "Failed to delete post", variant: "destructive" });
      setIsDeleting(false);
    }
  };

  // Comments state
  const [previewComment, setPreviewComment] = useState<ApiComment | null>(null);
  const [commentCount, setCommentCount] = useState(post.comments);
  const [expanded, setExpanded] = useState(false);
  const [allComments, setAllComments] = useState<ApiComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  // Preview fetch
  useEffect(() => {
    if (commentCount === 0) return;
    let cancelled = false;
    getComments(post.id).then((data) => {
      if (!cancelled && data.length > 0) setPreviewComment(data[data.length - 1]);
    }).catch(() => {});
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

  const handlePostReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setIsPosting(true);
    try {
      const comment = await addComment(post.id, replyText.trim(), parentId);
      setAllComments((prev) => [...prev, comment]);
      setExpandedReplies((prev) => new Set(prev).add(parentId));
      setCommentCount((c) => c + 1);
      setReplyText("");
      setReplyingTo(null);
      if (!expanded) setExpanded(true);
    } catch {
      toast({ title: "Could not post reply. Please try again." });
    } finally {
      setIsPosting(false);
    }
  };

  if (isBlocked(post.userId) || isDeleted) return null;

  const isVideo =
    (post as any).mediaType === "video" ||
    (post.image?.includes("/video/") ?? false);

  const handleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((c) => newLiked ? c + 1 : c - 1);
    try {
      const result = await toggleLike(post.id);
      // Only sync the server count — don't overwrite liked state
      // The optimistic toggle is already correct
      setLikeCount(result.likes_count);
    } catch {
      // Revert on actual failure
      setLiked(!newLiked);
      setLikeCount((c) => newLiked ? c - 1 : c + 1);
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
        description: result.saved ? "Find it in Profile → Saved." : "Post removed from your saved list.",
      });
    } catch {
      setSaved(!newSaved);
      toast({ title: "Failed to save post. Please try again." });
    }
  };

  const handleShare = () => {
    const url = `https://api.isingala.com/posts/${post.id}/share`;
    navigator.clipboard?.writeText(url).catch(() => {});
    toast({ title: "Link copied", description: "Post link copied to clipboard." });
  };

  const handleShareAsCard = async () => {
    if (!post.image || isVideo) {
      toast({ title: "Card sharing is only available for photo posts right now." });
      return;
    }
    setIsGeneratingCard(true);
    try {
      const blob = await generateShareCard({
        imageUrl: post.image,
        userName: post.user.displayName,
        userAvatarUrl: post.user.avatar,
        caption: post.caption,
      });
      const file = new File([blob], "isi-ngala-post.jpg", { type: "image/jpeg" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Isi Ngala",
          text: `Check out ${post.user.displayName}'s post on Isi Ngala! https://api.isingala.com/posts/${post.id}/share`,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "isi-ngala-post.jpg";
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: "Card downloaded!", description: "Share it on Instagram, Facebook, or X." });
      }
    } catch {
      toast({ title: "Could not generate share card. Please try again." });
    } finally {
      setIsGeneratingCard(false);
    }
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
          <img src={post.user.avatar} alt={post.user.displayName}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-gold/30" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-gold/30">
            <span className="text-sm font-bold text-primary">
              {post.user.displayName[0]?.toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{post.user.displayName}</p>
          <p className="text-xs text-muted-foreground">@{post.user.username}</p>
        </div>
        {!isOwnPost && (
          <button
            onClick={() => toggleFollow(post.userId)}
            className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${
              following ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
            }`}
          >
            {following ? "Following" : "Follow"}
          </button>
        )}
        
        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
            title="Delete post"
          >
            {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
          </button>
        )}

        {!isOwnPost && (
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger asChild>
              <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
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
            <video src={post.image} controls className="w-full max-h-96" preload="metadata"
              onClick={(e) => e.stopPropagation()} />
          </div>
        ) : (
          <Link to={`/post/${post.id}`} className="relative aspect-[4/5] bg-muted block">
            <img src={post.image} alt={post.caption} className="w-full h-full object-cover" loading="lazy" />
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
            <Popover>
              <PopoverTrigger asChild>
                <button aria-label="Share post">
                  <Share2 size={22} className="text-foreground" strokeWidth={1.5} />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-56 p-1.5 rounded-xl">
                <button onClick={handleShare}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm text-foreground text-left">
                  <Share2 size={16} className="text-muted-foreground" /> Copy link
                </button>
                {!isVideo && post.image && (
                  <button onClick={handleShareAsCard} disabled={isGeneratingCard}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm text-foreground text-left disabled:opacity-60">
                    {isGeneratingCard
                      ? <Loader2 size={16} className="animate-spin text-muted-foreground" />
                      : <ImageIcon size={16} className="text-muted-foreground" />}
                    Share as image card
                  </button>
                )}
              </PopoverContent>
            </Popover>
          </div>
          <button onClick={handleSave} aria-label={saved ? "Unsave post" : "Save post"}
            className="transition-transform active:scale-110">
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
          {/* Render @mentions in caption */}
          {post.caption.split(/(@[\w.]+)/g).map((part, i) =>
            part.startsWith("@") ? (
              <span key={i} className="text-primary font-medium">{part}</span>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {post.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs text-primary font-medium">#{tag}</span>
          ))}
        </div>

        {/* Comment preview */}
        {commentCount > 0 && !expanded && (
          <div className="mt-2">
            <button onClick={handleToggleExpand}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors">
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

        {/* Expanded comment panel */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <button onClick={handleToggleExpand}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-3 mb-2">
                <ChevronDown size={14} className="rotate-180" /> Hide comments
              </button>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {isLoadingComments ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 size={18} className="animate-spin text-primary" />
                  </div>
                ) : allComments.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No comments yet. Be the first!</p>
                ) : (
                  allComments
                    .filter((c) => !c.parent_comment_id)
                    .map((c) => {
                      const replies = allComments.filter((r) => r.parent_comment_id === c.id);
                      const showReplies = expandedReplies.has(c.id);
                      const isReplyingHere = replyingTo === c.id;

                      return (
                        <div key={c.id}>
                          <CommentRow
                            comment={c}
                            currentUserId={user?.id || ""}
                            onReply={() => {
                              setReplyingTo(isReplyingHere ? null : c.id);
                              setReplyText("");
                            }}
                          />

                          {/* Reply input */}
                          {isReplyingHere && (
                            <form
                              onSubmit={(e) => handlePostReply(e, c.id)}
                              className="flex items-center gap-2 mt-2 ml-4 border-b border-border pb-1"
                            >
                              <MentionInput
                                value={replyText}
                                onChange={setReplyText}
                                onSubmit={(e) => handlePostReply(e, c.id)}
                                placeholder={`Reply to ${c.user_name}...`}
                                isPosting={isPosting}
                                autoFocus
                              />
                              <button type="submit" disabled={!replyText.trim() || isPosting}
                                className="text-primary disabled:opacity-40 flex-shrink-0">
                                {isPosting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                              </button>
                            </form>
                          )}

                          {/* Replies */}
                          {replies.length > 0 && (
                            <div className="ml-4 mt-2">
                              {!showReplies ? (
                                <button
                                  onClick={() => setExpandedReplies((prev) => new Set(prev).add(c.id))}
                                  className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                                  — View {replies.length} {replies.length === 1 ? "reply" : "replies"}
                                </button>
                              ) : (
                                <div className="space-y-2">
                                  {replies.map((r) => (
                                    <CommentRow
                                      key={r.id}
                                      comment={r}
                                      currentUserId={user?.id || ""}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                )}
              </div>

              {/* New comment input with @mention */}
              <form onSubmit={handlePostComment} className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                <MentionInput
                  value={newComment}
                  onChange={setNewComment}
                  onSubmit={handlePostComment}
                  placeholder="Add a comment... (use @ to mention)"
                  isPosting={isPosting}
                />
                <button type="submit" disabled={!newComment.trim() || isPosting}
                  className="text-primary disabled:opacity-40 flex-shrink-0">
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
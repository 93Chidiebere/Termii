import { useState } from "react";
import { Heart, MessageCircle, Bookmark, Share2, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { Post } from "@/data/mockData";
import { useFollowStore } from "@/stores/followStore";
import { useBlockMuteStore } from "@/stores/blockMuteStore";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { toggleLike, toggleSave } from "@/lib/api";
import { BlockMuteMenu } from "@/components/user/BlockMuteMenu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  const { addNotification } = useNotificationStore();
  const following = isFollowing(post.userId);
  const isOwnPost = user?.id === post.userId;

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
      if (result.liked && user?.id !== post.userId) {
        addNotification({
          type: "like",
          title: user?.displayName || user?.name || "Someone",
          text: "liked your post",
          link: `/post/${post.id}`,
        });
      }
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

        {/* Follow button — hidden on own posts */}
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

        {/* Three-dot menu — hidden on own posts */}
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
            <Link to={`/post/${post.id}`} aria-label="View comments">
              <MessageCircle size={24} className="text-foreground" strokeWidth={1.5} />
            </Link>
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
        <p className="text-xs text-muted-foreground mt-2">{post.comments} comments</p>
      </div>
    </motion.article>
  );
};
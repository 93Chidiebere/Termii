import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, MessageCircle, Bookmark, Share2, Send, MoreHorizontal, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { posts as mockPosts } from "@/data/mockData";
import { useFollowStore } from "@/stores/followStore";
import { useBlockMuteStore } from "@/stores/blockMuteStore";
import { BlockMuteMenu } from "@/components/user/BlockMuteMenu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { getPostById, toggleLike, toggleSave } from "@/lib/api";
import type { Post } from "@/data/mockData";

const mockComments = [
  { id: "c1", username: "adabeauty", text: "Absolutely gorgeous! 😍", time: "2h ago" },
  { id: "c2", username: "naturalqueen", text: "What products did you use?", time: "1h ago" },
  { id: "c3", username: "hairlove", text: "Goals! 🔥👑", time: "45m ago" },
];

const FollowButton = ({ userId }: { userId: string }) => {
  const { isFollowing, toggleFollow } = useFollowStore();
  const following = isFollowing(userId);
  return (
    <button
      onClick={() => toggleFollow(userId)}
      className={`ml-auto text-xs font-semibold px-3 py-1 rounded-full transition-colors ${
        following ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
      }`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
};

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState(mockComments);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setIsLoading(true);
      try {
        // Try real API first
        const realPost = await getPostById(id);
        setPost(realPost);
        setLiked(realPost.liked ?? false);
        setSaved(realPost.saved ?? false);
        setLikeCount(realPost.likes ?? 0);
      } catch {
        // Fall back to mock data
        const mockPost = mockPosts.find((p) => p.id === id);
        if (mockPost) {
          setPost(mockPost);
          setLiked(mockPost.liked ?? false);
          setSaved(mockPost.saved ?? false);
          setLikeCount(mockPost.likes ?? 0);
        } else {
          setNotFound(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [id]);

  const handleLike = async () => {
    if (!post) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((c) => newLiked ? c + 1 : c - 1);
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
      setLikeCount((c) => newLiked ? c - 1 : c + 1);
    }
  };

  const handleSave = async () => {
    if (!post) return;
    const newSaved = !saved;
    setSaved(newSaved);
    try {
      const result = await toggleSave(post.id);
      setSaved(result.saved);
    } catch {
      setSaved(!newSaved);
    }
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setComments((prev) => [
      ...prev,
      { id: `c-${Date.now()}`, username: user?.username || "you", text: comment.trim(), time: "now" },
    ]);
    setComment("");
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (notFound || !post) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-muted-foreground">
          <p>Post not found</p>
          <button onClick={() => navigate("/feed")}
            className="text-sm text-primary font-semibold hover:underline">
            ← Back to Feed
          </button>
        </div>
      </AppLayout>
    );
  }

  const relatedPosts = mockPosts.filter((p) => p.id !== post.id && p.image).slice(0, 4);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-4">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft size={18} /> Back
        </button>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Image */}
          {post.image && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="rounded-2xl overflow-hidden bg-muted">
              <img src={post.image} alt={post.caption} className="w-full object-cover" />
            </motion.div>
          )}

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className={`flex flex-col ${!post.image ? "md:col-span-2" : ""}`}
          >
            {/* User header */}
            <div className="flex items-center gap-3 mb-4">
              {post.user.avatar ? (
                <img src={post.user.avatar} alt=""
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-gold/30" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-gold/30">
                  <span className="text-sm font-bold text-primary">
                    {post.user.displayName[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="font-semibold text-sm text-foreground">{post.user.displayName}</p>
                <p className="text-xs text-muted-foreground">@{post.user.username}</p>
              </div>
              <FollowButton userId={post.userId} />
              <Popover>
                <PopoverTrigger asChild>
                  <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                    <MoreHorizontal size={18} className="text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64 p-2 rounded-xl">
                  <BlockMuteMenu userId={post.userId} displayName={post.user.displayName} />
                </PopoverContent>
              </Popover>
              {post.hairType && (
                <span className="text-xs font-medium bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">
                  {post.hairType}
                </span>
              )}
            </div>

            {/* Caption */}
            <p className="text-sm text-foreground leading-relaxed mb-3">{post.caption}</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {post.tags.map((tag) => (
                <span key={tag} className="text-xs text-primary font-medium">#{tag}</span>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
              <div className="flex items-center gap-4">
                <button onClick={handleLike} className="transition-transform active:scale-125">
                  <Heart size={24}
                    className={liked ? "fill-terracotta text-terracotta" : "text-foreground"}
                    strokeWidth={1.5} />
                </button>
                <button onClick={() => document.getElementById(`comment-input-${post.id}`)?.focus()}>
                  <MessageCircle size={24} className="text-foreground" strokeWidth={1.5} />
                </button>
                <button onClick={() => {
                  const url = `${window.location.origin}/post/${post.id}`;
                  navigator.clipboard?.writeText(url).catch(() => {});
                }}>
                  <Share2 size={22} className="text-foreground" strokeWidth={1.5} />
                </button>
              </div>
              <button onClick={handleSave}>
                <Bookmark size={24}
                  className={saved ? "fill-primary text-primary" : "text-foreground"}
                  strokeWidth={1.5} />
              </button>
            </div>

            <p className="font-semibold text-sm text-foreground mb-4">
              {likeCount.toLocaleString()} likes
            </p>

            {/* Comments */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-60">
              {comments.map((c) => (
                <div key={c.id}>
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{c.username}</span> {c.text}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{c.time}</p>
                </div>
              ))}
            </div>

            {/* Add comment */}
            <form onSubmit={handleComment}
              className="flex items-center gap-2 pt-3 border-t border-border">
              <input
                id={`comment-input-${post.id}`}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button type="submit" disabled={!comment.trim()}
                className="text-primary font-semibold text-sm disabled:opacity-40">
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        </div>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-10">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">More to Explore</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {relatedPosts.map((rp) => (
                <Link key={rp.id} to={`/post/${rp.id}`}
                  className="aspect-square rounded-xl overflow-hidden">
                  <img src={rp.image} alt=""
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default PostDetail;
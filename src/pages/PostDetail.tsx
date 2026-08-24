import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Heart, MessageCircle, Bookmark,
  Share2, Send, MoreHorizontal, Loader2,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useFollowStore } from "@/stores/followStore";
import { BlockMuteMenu } from "@/components/user/BlockMuteMenu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useToast } from "@/hooks/use-toast";
import {
  getPostById, toggleLike, toggleSave,
  getComments, addComment, getPostLikes,
  type ApiComment, type ApiUser,
} from "@/lib/api";
import type { Post } from "@/types";
import { formatDistanceToNow } from "date-fns";

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
  const { toast } = useToast();

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [comment, setComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLikesModalOpen, setIsLikesModalOpen] = useState(false);
  const [likesUsers, setLikesUsers] = useState<ApiUser[]>([]);
  const [isLoadingLikes, setIsLoadingLikes] = useState(false);

  const fetchLikes = async () => {
    if (!post) return;
    setIsLoadingLikes(true);
    setIsLikesModalOpen(true);
    try {
      const users = await getPostLikes(post.id);
      setLikesUsers(users);
    } catch {
      // silently fail
    } finally {
      setIsLoadingLikes(false);
    }
  };

  // Load post
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const realPost = await getPostById(id);
        setPost(realPost);
        setLiked(realPost.liked ?? false);
        setSaved(realPost.saved ?? false);
        setLikeCount(realPost.likes ?? 0);
      } catch {
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

  // Load comments
  useEffect(() => {
    if (!id) return;
    const loadComments = async () => {
      setIsLoadingComments(true);
      try {
        const data = await getComments(id);
        setComments(data);
      } catch {
        setComments([]);
      } finally {
        setIsLoadingComments(false);
      }
    };
    loadComments();
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

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !post) return;
    setIsSubmittingComment(true);
    try {
      const newComment = await addComment(post.id, comment.trim());
      setComments((prev) => [...prev, newComment]);
      setComment("");

    } catch {
      // silently fail
    } finally {
      setIsSubmittingComment(false);
    }
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

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-4">

        <button
          onClick={() => {
            // If the user arrived from within the app, go back normally.
            // If they arrived from an external link (WhatsApp, Facebook, etc.),
            // there's no real in-app history to go back to, so send them to the feed.
            if (window.history.state && window.history.state.idx > 0) {
              navigate(-1);
            } else {
              navigate("/feed");
            }
          }}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
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
                <button onClick={async () => {
                  const url = `https://api.isingala.com/posts/${post.id}/share`;
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: "Isi Ngala",
                        text: `Check out ${post.user.displayName}'s post on Isi Ngala!`,
                        url: url,
                      });
                    } catch {
                      // user cancelled or sharing failed
                    }
                  } else {
                    navigator.clipboard?.writeText(url).catch(() => {});
                    toast({ title: "Link copied", description: "Post link copied to clipboard." });
                  }
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

            <button onClick={fetchLikes} className="font-semibold text-sm text-foreground mb-4 hover:underline">
              {likeCount.toLocaleString()} likes
            </button>

            {/* Comments */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-64">
              {isLoadingComments ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={18} className="animate-spin text-primary" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No comments yet. Be the first!
                </p>
              ) : (
                comments.map((c) => (
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
              <button
                type="submit"
                disabled={!comment.trim() || isSubmittingComment}
                className="text-primary font-semibold text-sm disabled:opacity-40"
              >
                {isSubmittingComment
                  ? <Loader2 size={16} className="animate-spin" />
                  : <Send size={18} />
                }
              </button>
            </form>
          </motion.div>
        </div>

        {/* Likes Modal */}
        <Dialog open={isLikesModalOpen} onOpenChange={setIsLikesModalOpen}>
          <DialogContent className="sm:max-w-md bg-background border-border">
            <DialogHeader>
              <DialogTitle className="text-center font-display text-lg">Likes</DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto space-y-4 py-4">
              {isLoadingLikes ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : likesUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No likes yet.
                </div>
              ) : (
                likesUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-gold/20" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-gold/20">
                          <span className="text-sm font-bold text-primary">{u.full_name[0]?.toUpperCase()}</span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-sm text-foreground">{u.full_name}</p>
                        <p className="text-xs text-muted-foreground">@{u.username || u.email.split("@")[0]}</p>
                      </div>
                    </div>
                    {user?.id !== u.id && <FollowButton userId={u.id} />}
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
};

export default PostDetail;
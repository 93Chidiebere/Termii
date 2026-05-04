import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, MessageCircle, Bookmark, Share2, Send, MoreHorizontal } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { posts } from "@/data/mockData";
import { useFollowStore } from "@/stores/followStore";
import { useBlockMuteStore } from "@/stores/blockMuteStore";
import { BlockMuteMenu } from "@/components/user/BlockMuteMenu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const mockComments = [
  { id: "c1", username: "adabeauty", text: "Absolutely gorgeous! 😍", time: "2h ago" },
  { id: "c2", username: "naturalqueen", text: "What products did you use?", time: "1h ago" },
  { id: "c3", username: "hairlove", text: "Goals! 🔥👑", time: "45m ago" },
];

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const post = posts.find((p) => p.id === id);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.likes ?? 0);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState(mockComments);

  if (!post) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh] text-muted-foreground">Post not found</div>
      </AppLayout>
    );
  }

  const relatedPosts = posts.filter((p) => p.id !== post.id).slice(0, 4);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setComments((prev) => [
      ...prev,
      { id: `c-${Date.now()}`, username: "you", text: comment.trim(), time: "now" },
    ]);
    setComment("");
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft size={18} /> Back
        </button>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Image (optional) */}
          {post.image ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl overflow-hidden bg-muted">
              <img src={post.image} alt={post.caption} className="w-full object-cover" />
            </motion.div>
          ) : null}

          {/* Details */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className={`flex flex-col ${!post.image ? 'md:col-span-2' : ''}`}>
            {/* User */}
            <div className="flex items-center gap-3 mb-4">
              <img src={post.user.avatar} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-gold/30" />
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
              <span className="text-xs font-medium bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">{post.hairType}</span>
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
                <button onClick={handleLike} className="transition-transform active:scale-125" aria-label={liked ? "Unlike" : "Like"}>
                  <Heart size={24} className={liked ? "fill-terracotta text-terracotta" : "text-foreground"} strokeWidth={1.5} />
                </button>
                <button aria-label="Focus comments" onClick={() => document.getElementById(`comment-input-${post.id}`)?.focus()}>
                  <MessageCircle size={24} className="text-foreground" strokeWidth={1.5} />
                </button>
                <button
                  aria-label="Share post"
                  onClick={() => {
                    const url = `${window.location.origin}/post/${post.id}`;
                    navigator.clipboard?.writeText(url).catch(() => {});
                  }}
                >
                  <Share2 size={22} className="text-foreground" strokeWidth={1.5} />
                </button>
              </div>
              <button onClick={() => setSaved(!saved)} aria-label={saved ? "Unsave" : "Save"}>
                <Bookmark size={24} className={saved ? "fill-primary text-primary" : "text-foreground"} strokeWidth={1.5} />
              </button>
            </div>
            <p className="font-semibold text-sm text-foreground mb-4">{likeCount.toLocaleString()} likes</p>

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
            <form onSubmit={handleComment} className="flex items-center gap-2 pt-3 border-t border-border">
              <input
                id={`comment-input-${post.id}`}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button type="submit" disabled={!comment.trim()} className="text-primary font-semibold text-sm disabled:opacity-40">
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        </div>

        {/* Related */}
        {relatedPosts.length > 0 && (
          <div className="mt-10">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">More to Explore</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {relatedPosts.filter(rp => rp.image).map((rp) => (
                <Link key={rp.id} to={`/post/${rp.id}`} className="aspect-square rounded-xl overflow-hidden">
                  <img src={rp.image} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

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

export default PostDetail;

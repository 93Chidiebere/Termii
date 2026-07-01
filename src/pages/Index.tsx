import { useEffect, useState, useCallback } from "react";
import type { Post } from "@/types";
import { PostCard } from "@/components/feed/PostCard";
import { AppLayout } from "@/components/layout/AppLayout";
import { useBlockMuteStore } from "@/stores/blockMuteStore";
import { getPosts } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { FloatingCreateButton } from "@/components/feed/FloatingCreateButton";

const Index = () => {
  const { isMuted, isBlocked } = useBlockMuteStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      const data = await getPosts();
      setPosts(data);
      setError(null);
    } catch {
      setError("Could not load posts from server.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchPosts();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchPosts]);

  const visiblePosts = posts.filter(
    (p) => !isMuted(p.userId) && !isBlocked(p.userId)
  );

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="md:hidden mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground">Ngala Africa</h1>
          <p className="text-xs text-muted-foreground tracking-wider uppercase">
            Your Hair is Your Pride
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        )}

        {!isLoading && error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm text-center">
            {error}
          </div>
        )}

        {!isLoading && (
          <div className="space-y-6">
            {visiblePosts.length === 0 ? (
              <div className="text-center py-16 text-sm text-muted-foreground">
                No posts yet. Be the first to share your hair journey!
              </div>
            ) : (
              visiblePosts.map((post, i) => (
                <PostCard key={post.id} post={post} index={i} />
              ))
            )}
          </div>
        )}
      </div>
      <FloatingCreateButton />
    </AppLayout>
  );
};

export default Index;
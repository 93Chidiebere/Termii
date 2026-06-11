import { useEffect, useState } from "react";
import { posts as mockPosts } from "@/data/mockData";
import type { Post } from "@/data/mockData";
import { PostCard } from "@/components/feed/PostCard";
import { AppLayout } from "@/components/layout/AppLayout";
import { useBlockMuteStore } from "@/stores/blockMuteStore";
import { getPosts } from "@/lib/api";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { isMuted, isBlocked } = useBlockMuteStore();
  const [realPosts, setRealPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const data = await getPosts();
        setRealPosts(data);
        setError(null);
      } catch (err) {
        // If API fails, fall back to mock posts silently
        setError("Could not load posts from server.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Merge: real posts first, then mock posts that don't clash by id
  const realPostIds = new Set(realPosts.map((p) => p.id));
  const filteredMockPosts = mockPosts.filter((p) => !realPostIds.has(p.id));
  const allPosts = [...realPosts, ...filteredMockPosts];

  const visiblePosts = allPosts.filter(
    (p) => !isMuted(p.userId) && !isBlocked(p.userId)
  );

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header - mobile only */}
        <div className="md:hidden mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground">Termii</h1>
          <p className="text-xs text-muted-foreground tracking-wider uppercase">
            Your Hair is Your Pride
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        )}

        {/* Error banner — non-blocking, mock posts still show */}
        {!isLoading && error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm text-center">
            {error} Showing cached posts.
          </div>
        )}

        {/* Feed */}
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
    </AppLayout>
  );
};

export default Index;
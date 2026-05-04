import { posts } from "@/data/mockData";
import { PostCard } from "@/components/feed/PostCard";
import { AppLayout } from "@/components/layout/AppLayout";
import { useBlockMuteStore } from "@/stores/blockMuteStore";

const Index = () => {
  const { isMuted, isBlocked } = useBlockMuteStore();
  const visiblePosts = posts.filter((p) => !isMuted(p.userId) && !isBlocked(p.userId));
  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header - mobile */}
        <div className="md:hidden mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground">Termii</h1>
          <p className="text-xs text-muted-foreground tracking-wider uppercase">
            Your Hair is Your Pride
          </p>
        </div>

        {/* Feed */}
        <div className="space-y-6">
          {visiblePosts.map((post, i) => (
            <PostCard key={post.id} post={post} index={i} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;

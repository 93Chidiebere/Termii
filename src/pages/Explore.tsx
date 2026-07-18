import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
const trendingTags = [
  "wash-day", "4C-curls", "protective-style", "twist-out",
  "cornrows", "afro", "natural-hair", "hair-growth",
  "shea-butter", "loc-journey", "braids", "silk-press",
];

const hairCategories = [
  { name: "Twist Outs" },
  { name: "Protective Styles" },
  { name: "Wash Day" },
  { name: "Cornrows & Braids" },
  { name: "Afros" },
  { name: "Locs" },
  { name: "Silk Press" },
  { name: "Bantu Knots" },
];
import { getPosts, getExplorePosts } from "@/lib/api";
import type { Post } from "@/types";
import { FloatingCreateButton } from "@/components/feed/FloatingCreateButton";
import { useAuthStore } from "@/stores/authStore";

const Explore = () => {
  const { isAuthenticated } = useAuthStore();
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = isAuthenticated ? await getPosts() : await getExplorePosts();
        setAllPosts(data);
      } catch {
        // silently fail — empty state shown
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [isAuthenticated]);

  const handleTagClick = (tag: string) => {
    setActiveTag(activeTag === tag ? null : tag);
  };

  const handleCategoryClick = (catName: string) => {
    const tagMap: Record<string, string> = {
      "Cornrows & Braids": "braids",
      "Twist Outs": "twist-out",
      "Protective Styles": "protective-style",
      "Wash Day": "wash-day",
      "Afros": "afro",
      "Locs": "loc-journey",
      "Silk Press": "silk-press",
      "Bantu Knots": "bantu-knots",
    };
    const tag = tagMap[catName] || catName.toLowerCase().replace(/\s+/g, "-");
    setActiveTag(activeTag === tag ? null : tag);
  };

  const filteredPosts = allPosts.filter((p) => {
    const matchTag = !activeTag || p.tags.some((t) =>
      t.toLowerCase().includes(activeTag.toLowerCase())
    ) || p.hairType.toLowerCase().includes(activeTag.toLowerCase());

    const matchSearch = !search.trim() || (() => {
      const q = search.toLowerCase();
      return (
        p.caption.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.hairType.toLowerCase().includes(q) ||
        p.user.displayName.toLowerCase().includes(q)
      );
    })();

    return matchTag && matchSearch;
  });

  const isVideo = (post: Post) =>
    (post as any).mediaType === "video" || (post.image?.includes("/video/") ?? false);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          {activeTag && (
            <button onClick={() => setActiveTag(null)}
              className="p-1 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft size={20} className="text-foreground" />
            </button>
          )}
          <h1 className="font-display text-2xl font-bold text-foreground">
            {activeTag ? `#${activeTag}` : "Explore"}
          </h1>
        </div>

        {/* Search */}
        {isAuthenticated && (
          <div className="relative mb-6">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search styles, hair types, techniques..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        )}

        {/* Trending tags + categories — only when no tag active */}
        {isAuthenticated && !activeTag && !search && (
          <>
            <div className="mb-8">
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">Trending</h2>
              <div className="flex flex-wrap gap-2">
                {trendingTags.map((tag) => (
                  <span key={tag} onClick={() => handleTagClick(tag)}
                    className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">Categories</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {hairCategories.map((cat, i) => (
                  <motion.div key={cat.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleCategoryClick(cat.name)}
                    className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/40 transition-colors">
                    <p className="font-semibold text-sm text-foreground">{cat.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">Browse posts</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Posts grid */}
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            {!isAuthenticated ? "Top Posts" : activeTag ? `Posts tagged #${activeTag}` : search ? "Search Results" : "Discover"}
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-primary" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-16 text-sm text-muted-foreground">
              {activeTag || search
                ? "No posts found. Try a different search or tag."
                : "No posts yet. Be the first to share your hair journey!"}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filteredPosts.map((post, i) => (
                <Link key={post.id} to={`/post/${post.id}`}>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="aspect-square rounded-lg overflow-hidden cursor-pointer relative group bg-muted"
                  >
                    {post.image ? (
                      isVideo(post) ? (
                        <>
                          <video src={post.image} className="w-full h-full object-cover"
                            preload="metadata" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-background/70 flex items-center justify-center">
                              <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-foreground ml-0.5" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <img src={post.image} alt={post.caption}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy" />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-4">
                        <p className="text-sm text-foreground text-center line-clamp-4">
                          {post.caption}
                        </p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors flex items-center justify-center">
                      <p className="text-primary-foreground opacity-0 group-hover:opacity-100 text-sm font-semibold transition-opacity">
                        ♥ {post.likes}
                      </p>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </div>
        {/* Unauthenticated CTA */}
        {!isAuthenticated && (
          <div className="mt-12 mb-8 text-center bg-card border border-border p-8 rounded-2xl">
            <h3 className="font-display text-2xl font-bold text-foreground mb-3">Discover the full experience</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Sign up to like, comment, search by tags, and connect with a community that celebrates your natural hair.
            </p>
            <Link
              to="/login?signup=true"
              className="inline-block px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
            >
              Create Account to Continue
            </Link>
          </div>
        )}
      </div>
      {isAuthenticated && <FloatingCreateButton />}
    </AppLayout>
  );
};

export default Explore;
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { posts, trendingTags, hairCategories, braidsPosts } from "@/data/mockData";

const Explore = () => {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const handleTagClick = (tag: string) => {
    setActiveTag(activeTag === tag ? null : tag);
  };

  const handleCategoryClick = (catName: string) => {
    const tagMap: Record<string, string> = {
      "Cornrows & Braids": "braids",
    };
    const tag = tagMap[catName] || catName.toLowerCase().replace(/\s+/g, "-");
    setActiveTag(activeTag === tag ? null : tag);
  };

  // Get filtered content
  const getFilteredPosts = () => {
    let list = posts;
    if (activeTag) {
      if (activeTag === "braids" || activeTag === "cornrows") return [];
      list = list.filter((p) => p.tags.some((t) => t.includes(activeTag)));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.caption.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.hairType.toLowerCase().includes(q) ||
          p.user.displayName.toLowerCase().includes(q)
      );
    }
    return list;
  };

  const showBraids = activeTag === "braids" || activeTag === "cornrows";
  const filteredPosts = getFilteredPosts();

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          {activeTag && (
            <button onClick={() => setActiveTag(null)} className="p-1 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft size={20} className="text-foreground" />
            </button>
          )}
          <h1 className="font-display text-2xl font-bold text-foreground">
            {activeTag ? `#${activeTag}` : "Explore"}
          </h1>
        </div>

        {/* Search */}
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

        {!activeTag && (
          <>
            {/* Trending Tags */}
            <div className="mb-8">
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">Trending</h2>
              <div className="flex flex-wrap gap-2">
                {trendingTags.map((tag) => (
                  <span
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="mb-8">
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">Categories</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {hairCategories.map((cat, i) => (
                  <motion.div
                    key={cat.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleCategoryClick(cat.name)}
                    className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/40 transition-colors"
                  >
                    <p className="font-semibold text-sm text-foreground">{cat.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{cat.count.toLocaleString()} posts</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Braids Grid */}
        {showBraids && (
          <>
            <h2 className="font-display text-lg font-semibold text-foreground mb-3">Braids & Cornrows</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-8">
              {braidsPosts.map((post, i) => (
                <Link key={post.id} to={`/post/${post.id}`}>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.08 }}
                    className="aspect-square rounded-lg overflow-hidden cursor-pointer relative group"
                  >
                    <img
                      src={post.image}
                      alt={post.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors flex items-center justify-center">
                      <p className="text-primary-foreground opacity-0 group-hover:opacity-100 text-sm font-semibold transition-opacity">
                        ♥ {post.likes}
                      </p>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* General Grid */}
        {!showBraids && (
          <>
            <h2 className="font-display text-lg font-semibold text-foreground mb-3">
              {activeTag ? "Posts" : "Discover"}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filteredPosts.map((post, i) => (
                <Link key={post.id} to={`/post/${post.id}`}>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.08 }}
                    className="aspect-square rounded-lg overflow-hidden cursor-pointer relative group"
                  >
                    {post.image ? (
                      <img
                        src={post.image}
                        alt={post.caption}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center p-4">
                        <p className="text-sm text-foreground text-center line-clamp-4">{post.caption}</p>
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
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Explore;

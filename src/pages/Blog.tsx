import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, ArrowLeft, Pin, Loader2 } from "lucide-react";
import { getPublishedBlogPosts, type BlogPost } from "@/lib/api";

const getThumbnail = (post: BlogPost): string | null => {
  const thumb = post.blocks.find((b) => b.type === "image" && b.is_thumbnail);
  if (thumb) return thumb.content;
  const firstImage = post.blocks.find((b) => b.type === "image");
  return firstImage?.content || null;
};

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getPublishedBlogPosts();
        setPosts(data);
      } catch {
        // empty state shown
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> Back to Ngala Africa
          </Link>
          <span className="font-display text-lg font-bold text-foreground">Ngala Africa Blog</span>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md mx-auto py-16"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <BookOpen size={28} className="text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-3">
              The Blog is Coming Soon
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We're putting together hair care guides, research insights, and stories from the community.
              Check back soon for our first posts.
            </p>
            <Link
              to="/login?signup=true"
              className="inline-block mt-6 px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Join Ngala Africa in the Meantime
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {posts.map((post, i) => {
              const thumbnail = getThumbnail(post);
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={`/blog/${post.slug}`}
                    className="flex flex-col sm:flex-row gap-4 group"
                  >
                    {thumbnail && (
                      <div className="sm:w-56 aspect-[4/3] rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                        <img
                          src={thumbnail}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      {post.is_pinned && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary mb-1.5">
                          <Pin size={12} /> Pinned
                        </span>
                      )}
                      <h2 className="font-display text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                        {post.summary}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {post.author_name} ·{" "}
                        {post.published_at ? new Date(post.published_at).toLocaleDateString() : ""}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-border py-6 px-4 sm:px-6 text-center">
        <p className="text-xs text-muted-foreground">© 2026 Ngala Africa. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Blog;
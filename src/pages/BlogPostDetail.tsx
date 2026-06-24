import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getBlogPostBySlug, type BlogPost } from "@/lib/api";
import { renderMarkdown } from "@/lib/renderMarkdown";

const BlogPostDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getBlogPostBySlug(slug);
        setPost(data);
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Blog post not found.</p>
        <Link to="/blog" className="text-sm text-primary font-semibold hover:underline">
          ← Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
          <button
            onClick={() => navigate("/blog")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} /> Back to Blog
          </button>
          <span className="font-display text-base font-bold text-foreground">Termii Africa</span>
        </div>
      </header>

      <motion.article
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto px-4 sm:px-6 py-10"
      >
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3 leading-tight">
          {post.title}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {post.author_name} ·{" "}
          {post.published_at ? new Date(post.published_at).toLocaleDateString() : ""}
        </p>

        <p className="text-lg text-foreground leading-relaxed mb-8 font-medium">
          {post.summary}
        </p>

        <div className="space-y-6">
          {post.blocks.map((block, i) => (
            <div key={i}>
              {block.type === "image" ? (
                <img
                  src={block.content}
                  alt={post.title}
                  className="w-full rounded-xl object-cover"
                />
              ) : (
                <div
                  className="prose prose-sm sm:prose-base max-w-none text-foreground leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_p]:mb-3"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(block.content) }}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Want to share your hair journey too?
          </p>
          <Link
            to="/login?signup=true"
            className="inline-block px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Join Termii Africa
          </Link>
        </div>
      </motion.article>
    </div>
  );
};

export default BlogPostDetail;
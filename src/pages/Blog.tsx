import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, ArrowLeft } from "lucide-react";

const Blog = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> Back to Termii Africa
          </Link>
          <span className="font-display text-lg font-bold text-foreground">Termii Africa Blog</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
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
            Join Termii Africa in the Meantime
          </Link>
        </motion.div>
      </main>
    </div>
  );
};

export default Blog;
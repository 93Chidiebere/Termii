import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Users, Heart, Compass } from "lucide-react";
import ujuorig from "@/assets/ujuorig.jpeg";
import adaorig from "@/assets/adaorig.jpeg";
import bunWithFringe from "@/assets/bun_with_fringe.jpeg";
import lowBun from "@/assets/low_bun.jpeg";

const features = [
  { icon: Sparkles, title: "Share Your Journey", desc: "Post your natural hair looks, routines, and transformations with a community that celebrates you." },
  { icon: Users, title: "Find Your Tribe", desc: "Connect with people who share your hair type, styling preferences, and beauty philosophy." },
  { icon: Heart, title: "Get Inspired", desc: "Discover trending styles, protective techniques, and product recommendations curated for African hair." },
  { icon: Compass, title: "Explore & Discover", desc: "Browse by hair type, style category, or trending tags to find your next signature look." },
];

const galleryImages = [ujuorig, adaorig, bunWithFringe, lowBun];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
          <div>
            <span className="font-display text-xl font-bold text-foreground">Isi Ngala</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Log In
            </Link>
            <Link
              to="/login?signup=true"
              className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Create Account
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-4">
              Your Hair is Your Pride
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              The Home for{" "}
              <span className="text-primary">African Natural Hair</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-md leading-relaxed">
              Discover styles, share your journey, and connect with a community that celebrates the beauty of natural African hair — for everyone who wears it.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/blog"
                className="px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
              >
                Read the Blog
              </Link>
              <Link
                to="/explore"
                className="px-8 py-3.5 rounded-full border border-border text-foreground font-semibold hover:bg-secondary transition-colors"
              >
                Explore Styles
              </Link>
            </div>
          </motion.div>

          {/* Image collage */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="grid grid-cols-2 gap-3"
          >
            {galleryImages.map((img, i) => (
              <div
                key={i}
                className={`rounded-2xl overflow-hidden ${i === 1 ? "mt-8" : i === 2 ? "-mt-8" : ""}`}
              >
                <img
                  src={img}
                  alt="Natural hair style"
                  className="w-full h-48 sm:h-56 object-cover object-top hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 bg-card">
        <div className="max-w-5xl mx-auto text-center mb-14">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Built for Our Hair
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Everything you need to embrace, style, and celebrate your natural hair. For natural curls, locs, beards, and everything in between.
          </p>
        </div>
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-background border border-border"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="text-primary" size={24} />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ready to Join?
          </h2>
          <p className="text-muted-foreground mb-8">
            People across the continent and diaspora are already sharing their natural hair journeys — locs, curls, braids, beards, and everything that makes our hair ours. Be part of the movement.
          </p>
          <Link
            to="/login?signup=true"
            className="inline-block px-10 py-4 rounded-full bg-primary text-primary-foreground font-semibold text-lg hover:opacity-90 transition-opacity"
          >
            Create Your Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-display text-lg font-bold text-foreground">Isi Ngala</span>
            <span className="text-xs text-muted-foreground ml-2">Your Hair is Your Pride</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/blog" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Blog
            </Link>
            <p className="text-xs text-muted-foreground">© 2026 Isi Ngala by UNICCO . All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
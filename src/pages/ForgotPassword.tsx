import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">Termii Africa</h1>
          <p className="text-sm text-muted-foreground tracking-wider uppercase">Your Hair is Your Pride</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Link to="/login" className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1 text-sm">
                  <ArrowLeft size={16} /> Back to login
                </Link>
                <h2 className="font-display text-xl font-semibold text-foreground mb-2 text-center">Forgot Password?</h2>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Enter your email and we'll send you a link to reset your password.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 pl-10"
                      />
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
                  >
                    Send Reset Link
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div key="confirmation" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <CheckCircle size={32} className="text-primary" />
                </div>
                <h2 className="font-display text-xl font-semibold text-foreground mb-2">Check Your Email</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  We've sent a password reset link to<br />
                  <span className="font-medium text-foreground">{email}</span>
                </p>
                <p className="text-xs text-muted-foreground mb-6">
                  Didn't receive it? Check your spam folder or{" "}
                  <button onClick={() => setSubmitted(false)} className="text-primary font-semibold hover:underline">
                    try again
                  </button>
                </p>
                <Link
                  to="/login"
                  className="inline-block w-full py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm hover:bg-secondary/80 transition-colors text-center"
                >
                  Back to Sign In
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link to="/" className="hover:underline">← Back to home</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;

import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

const hairTypes = ["3A", "3B", "3C", "4A", "4B", "4C"];
const interests = [
  "Twist Outs", "Protective Styles", "Wash Day Routines", "Cornrows & Braids",
  "Afros", "Locs", "Silk Press", "Bantu Knots", "Hair Growth Tips",
  "Product Reviews", "Heat-Free Styling", "Coloring Natural Hair",
];
const countries = [
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cameroon", "Central African Republic", "Chad", "Comoros",
  "Congo (Brazzaville)", "Congo (DRC)", "Côte d'Ivoire", "Djibouti", "Egypt",
  "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia",
  "Ghana", "Guinea", "Guinea-Bissau", "Kenya", "Lesotho", "Liberia", "Libya",
  "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco",
  "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda", "São Tomé and Príncipe",
  "Senegal", "Seychelles", "Sierra Leone", "Somalia", "South Africa", "South Sudan",
  "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe",
  "United Kingdom", "United States", "Europe", "Asia", "Other",
];

const Login = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/feed";

  const {
    login, signup, signupStep, setSignupStep, signupData,
    updateSignupData, resetSignup, isLoading, error, clearError,
  } = useAuthStore();

  const sessionExpired = searchParams.get("session") === "expired";

  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(searchParams.get("signup") === "true");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("");
  const [province, setProvince] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  useEffect(() => {
    if (searchParams.get("signup") === "true") setIsSignUp(true);
  }, [searchParams]);

  useEffect(() => {
    if (error) clearError();
  }, [email, password]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
    const state = useAuthStore.getState();
    if (state.isAuthenticated && !state.error) {
      navigate(from, { replace: true });
    }
  };

  const handleSignupNext = (e: React.FormEvent) => {
    e.preventDefault();
    updateSignupData({ email, password, displayName, username, country, province, dateOfBirth });
    setSignupStep(1);
  };

  const handleSelectHairType = (type: string) => {
    updateSignupData({ hairType: type });
    setSignupStep(2);
  };

  const handleToggleInterest = (interest: string) => {
    const current = signupData.interests || [];
    const updated = current.includes(interest)
      ? current.filter((i) => i !== interest)
      : [...current, interest];
    updateSignupData({ interests: updated });
  };

  const handleFinishSignup = async () => {
    await signup();
    const state = useAuthStore.getState();
    if (state.isAuthenticated && !state.error) {
      navigate("/feed", { replace: true });
    }
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    resetSignup();
    clearError();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">Isi Ngala</h1>
          <p className="text-sm text-muted-foreground tracking-wider uppercase">Your Hair is Your Pride</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          <AnimatePresence mode="wait">

            {/* ── LOGIN ─────────────────────────────────────── */}
            {!isSignUp && (
              <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h2 className="font-display text-xl font-semibold text-foreground mb-6 text-center">Welcome Back</h2>

                {sessionExpired && !error && (
                  <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm text-center">
                    Your session expired. Please log in again.
                  </div>
                )}

                {error && (
                  <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center">
                    {error}
                  </div>
                )}

                <form className="space-y-4" onSubmit={handleLogin}>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                    <input
                      type="email" placeholder="your@email.com" value={email} required
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} required
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 pr-10"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot Password?</Link>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoading
                      ? <><Loader2 size={16} className="animate-spin" /> Signing in...</>
                      : "Sign In"
                    }
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── SIGNUP STEP 0 ──────────────────────────────── */}
            {isSignUp && signupStep === 0 && (
              <motion.div key="signup-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h2 className="font-display text-xl font-semibold text-foreground mb-6 text-center">Join the Community</h2>

                {error && (
                  <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center">
                    {error}
                  </div>
                )}

                <form className="space-y-4" onSubmit={handleSignupNext}>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Display Name</label>
                    <input type="text" placeholder="Your name" value={displayName} required
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Username</label>
                    <input type="text" placeholder="@username" value={username} required
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                    <input type="email" placeholder="your@email.com" value={email} required
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} required
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 pr-10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Date of Birth</label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      required
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      You must be 16 or older to access Marketplace and Messages. Everyone can still join and use the rest of Isi Ngala.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Country</label>
                    <select value={country} onChange={(e) => setCountry(e.target.value)} required
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option value="">Select your country</option>
                      {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Province / State</label>
                    <input type="text" placeholder="e.g. Enugu, Nairobi, Kampala" value={province} required
                      onChange={(e) => setProvince(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <button type="submit" disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                    {isLoading ? <><Loader2 size={16} className="animate-spin" /> Please wait...</> : <>Continue <ArrowRight size={16} /></>}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── SIGNUP STEP 1: Hair Type ───────────────────── */}
            {isSignUp && signupStep === 1 && (
              <motion.div key="signup-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <button onClick={() => setSignupStep(0)} className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1 text-sm">
                  <ArrowLeft size={16} /> Back
                </button>
                <h2 className="font-display text-xl font-semibold text-foreground mb-2 text-center">What's Your Hair Type?</h2>
                <p className="text-sm text-muted-foreground text-center mb-6">This helps us personalize your feed</p>
                <div className="grid grid-cols-3 gap-3">
                  {hairTypes.map((type) => (
                    <button key={type} onClick={() => handleSelectHairType(type)}
                      className={`py-4 rounded-xl border text-center font-semibold text-sm transition-all ${
                        signupData.hairType === type
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-foreground hover:border-primary/40"
                      }`}>
                      {type}
                    </button>
                  ))}
                </div>
                <button onClick={() => setSignupStep(2)} className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground text-center">
                  Skip for now →
                </button>
              </motion.div>
            )}

            {/* ── SIGNUP STEP 2: Interests ───────────────────── */}
            {isSignUp && signupStep === 2 && (
              <motion.div key="signup-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <button onClick={() => setSignupStep(1)} className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1 text-sm">
                  <ArrowLeft size={16} /> Back
                </button>
                <h2 className="font-display text-xl font-semibold text-foreground mb-2 text-center">What Interests You?</h2>
                <p className="text-sm text-muted-foreground text-center mb-6">Pick at least 3 to curate your feed</p>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => {
                    const selected = signupData.interests?.includes(interest);
                    return (
                      <button key={interest} onClick={() => handleToggleInterest(interest)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                          selected ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}>
                        {selected && <Check size={14} />}
                        {interest}
                      </button>
                    );
                  })}
                </div>

                {error && (
                  <div className="mt-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center">
                    {error}
                  </div>
                )}

                <button onClick={handleFinishSignup} disabled={isLoading}
                  className="w-full mt-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                  {isLoading
                    ? <><Loader2 size={16} className="animate-spin" /> Creating account...</>
                    : "Start Exploring"
                  }
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {(signupStep === 0 || !isSignUp) && (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button onClick={switchMode} className="text-primary font-semibold hover:underline">
                  {isSignUp ? "Sign In" : "Join Now"}
                </button>
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground space-y-1 bg-card/50 py-3 rounded-xl border border-border">
          <p className="font-semibold text-foreground mb-1">Need Help or Have Enquiries?</p>
          <p>Email: <a href="mailto:vchidiebere.vc@gmail.com" className="hover:text-primary transition-colors">vchidiebere.vc@gmail.com</a></p>
          <p>WhatsApp: <a href="https://wa.me/2347068488419" className="hover:text-primary transition-colors">07068488419</a></p>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link to="/" className="hover:underline">← Back to home</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
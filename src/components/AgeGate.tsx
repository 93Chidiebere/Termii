import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { updateMyProfile } from "@/lib/api";

interface AgeGateProps {
  children: React.ReactNode;
  featureName?: string; // e.g. "Marketplace" or "Messages" — used in copy
}

const AgeGate = ({ children, featureName = "this feature" }: AgeGateProps) => {
  const { hasDateOfBirth, ageVerified, syncProfile } = useAuthStore();
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateOfBirth) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await updateMyProfile({ date_of_birth: dateOfBirth });
      await syncProfile();
    } catch (err: unknown) {
      let message = "Something went wrong. Please try again.";
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
      ) {
        message = String(
          (err as { response: { data: { detail: string } } }).response.data.detail
        );
      }
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Case 1: no date_of_birth on file yet (pre-existing account) — one-time prompt
  if (!hasDateOfBirth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-8">
          <h2 className="font-display text-xl font-semibold text-foreground mb-2 text-center">
            One Quick Thing
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            To access {featureName}, please confirm your date of birth. You must be 16 or older.
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="date"
              value={dateOfBirth}
              required
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="submit"
              disabled={isSubmitting || !dateOfBirth}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? <><Loader2 size={16} className="animate-spin" /> Confirming...</>
                : "Continue"
              }
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Case 2: date_of_birth on file, but confirmed under 16 — hard block, no bypass
  if (!ageVerified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 text-center">
          <ShieldAlert className="mx-auto mb-4 text-muted-foreground" size={32} />
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">
            Age Restricted
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            You must be 16 or older to access {featureName}. You can still enjoy the rest of Isi Ngala.
          </p>
          <Link
            to="/feed"
            className="inline-block px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            Back to Feed
          </Link>
        </div>
      </div>
    );
  }

  // Case 3: verified 16+ — render the actual feature
  return <>{children}</>;
};

export default AgeGate;
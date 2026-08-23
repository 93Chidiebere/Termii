import { useState, useEffect } from "react";
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

  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");

  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const getDaysInMonth = (monthStr: string, yearStr: string) => {
    const m = parseInt(monthStr, 10);
    const y = parseInt(yearStr, 10);
    if (!m) return 31;
    if (!y) {
      if ([4, 6, 9, 11].includes(m)) return 30;
      if (m === 2) return 29;
      return 31;
    }
    return new Date(y, m, 0).getDate();
  };

  const daysCount = dobMonth ? getDaysInMonth(dobMonth, dobYear) : 31;
  const days = Array.from({ length: daysCount }, (_, i) => String(i + 1).padStart(2, "0"));

  useEffect(() => {
    if (dobDay && dobMonth) {
      const maxDays = getDaysInMonth(dobMonth, dobYear);
      if (parseInt(dobDay, 10) > maxDays) {
        setDobDay(String(maxDays).padStart(2, "0"));
      }
    }
  }, [dobMonth, dobYear, dobDay]);

  useEffect(() => {
    if (dobDay && dobMonth && dobYear) {
      setDateOfBirth(`${dobYear}-${dobMonth}-${dobDay}`);
    } else {
      setDateOfBirth("");
    }
  }, [dobDay, dobMonth, dobYear]);

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
            <div className="grid grid-cols-3 gap-2">
              <select
                value={dobDay}
                onChange={(e) => setDobDay(e.target.value)}
                required
                className="px-3 py-3 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Day</option>
                {days.map((d) => (
                  <option key={d} value={d}>
                    {parseInt(d, 10)}
                  </option>
                ))}
              </select>
              
              <select
                value={dobMonth}
                onChange={(e) => setDobMonth(e.target.value)}
                required
                className="px-3 py-3 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Month</option>
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>

              <select
                value={dobYear}
                onChange={(e) => setDobYear(e.target.value)}
                required
                className="px-3 py-3 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Year</option>
                {years.map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
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
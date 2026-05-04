import { useMemo } from "react";
import { Check, X } from "lucide-react";

const rules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /\d/.test(p) },
  { label: "One special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export const getPasswordStrength = (password: string) => {
  const passed = rules.filter((r) => r.test(password)).length;
  if (passed <= 1) return { level: "weak", color: "bg-destructive", percent: 20 };
  if (passed <= 2) return { level: "weak", color: "bg-destructive", percent: 40 };
  if (passed <= 3) return { level: "fair", color: "bg-yellow-500", percent: 60 };
  if (passed <= 4) return { level: "good", color: "bg-primary", percent: 80 };
  return { level: "strong", color: "bg-green-500", percent: 100 };
};

export const PasswordStrength = ({ password }: { password: string }) => {
  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const results = useMemo(() => rules.map((r) => ({ ...r, passed: r.test(password) })), [password]);

  if (!password) return null;

  return (
    <div className="space-y-3 mt-2">
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span className="font-medium text-foreground capitalize">{strength.level}</span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
            style={{ width: `${strength.percent}%` }}
          />
        </div>
      </div>
      <ul className="space-y-1">
        {results.map((r) => (
          <li key={r.label} className="flex items-center gap-2 text-xs">
            {r.passed ? (
              <Check size={12} className="text-green-500 shrink-0" />
            ) : (
              <X size={12} className="text-muted-foreground shrink-0" />
            )}
            <span className={r.passed ? "text-foreground" : "text-muted-foreground"}>{r.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

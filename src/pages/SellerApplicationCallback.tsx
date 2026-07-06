import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { verifyApplicationPayment, type SellerApplicationResponse } from "@/lib/api";

const SellerApplicationCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reference = searchParams.get("reference") || searchParams.get("trxref");

  const [application, setApplication] = useState<SellerApplicationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) {
      setError("No payment reference found.");
      setIsLoading(false);
      return;
    }

    const verify = async () => {
      try {
        const result = await verifyApplicationPayment(reference);
        setApplication(result);
      } catch {
        setError("Could not verify this payment. Please check your Profile or contact support.");
      } finally {
        setIsLoading(false);
      }
    };
    verify();
  }, [reference]);

  return (
    <AppLayout>
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        {isLoading && (
          <>
            <Loader2 size={48} className="mx-auto mb-4 animate-spin text-primary" />
            <p className="text-foreground font-semibold">Confirming your payment...</p>
            <p className="text-sm text-muted-foreground mt-1">This usually takes a few seconds.</p>
          </>
        )}

        {!isLoading && application && application.payment_status === "paid" && (
          <>
            <CheckCircle2 size={56} className="mx-auto mb-4 text-green-500" />
            <h1 className="font-display text-xl font-bold text-foreground mb-2">Payment Received!</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Your seller application is now <span className="font-semibold text-foreground">under review</span>.
              We'll notify you once it's approved — usually within a few business days.
            </p>
            <button
              onClick={() => navigate("/profile")}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Back to Profile
            </button>
          </>
        )}

        {!isLoading && application && application.payment_status !== "paid" && (
          <>
            <Clock size={56} className="mx-auto mb-4 text-yellow-500" />
            <h1 className="font-display text-xl font-bold text-foreground mb-2">Payment Not Confirmed</h1>
            <p className="text-sm text-muted-foreground mb-6">
              We couldn't confirm your payment yet. If you completed payment, check your Profile in a moment — it may still be processing.
            </p>
            <Link to="/profile" className="text-sm text-primary font-semibold hover:underline">
              ← Back to Profile
            </Link>
          </>
        )}

        {!isLoading && error && (
          <>
            <XCircle size={56} className="mx-auto mb-4 text-destructive" />
            <h1 className="font-display text-xl font-bold text-foreground mb-2">Something Went Wrong</h1>
            <p className="text-sm text-muted-foreground mb-6">{error}</p>
            <Link to="/profile" className="text-sm text-primary font-semibold hover:underline">
              ← Back to Profile
            </Link>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default SellerApplicationCallback;
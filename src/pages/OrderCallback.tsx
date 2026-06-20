import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { verifyOrder, type ApiOrder } from "@/lib/api";

const OrderCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reference = searchParams.get("reference") || searchParams.get("trxref");

  const [order, setOrder] = useState<ApiOrder | null>(null);
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
        const result = await verifyOrder(reference);
        setOrder(result);
      } catch {
        setError("Could not verify this payment. Please check My Orders or contact support.");
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

        {!isLoading && order && order.status !== "pending" && (
          <>
            <CheckCircle2 size={56} className="mx-auto mb-4 text-green-500" />
            <h1 className="font-display text-xl font-bold text-foreground mb-2">Payment Successful!</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Your order for <span className="font-semibold text-foreground">{order.product_title}</span> has been confirmed.
              The seller will be notified to ship your item.
            </p>
            <button
              onClick={() => navigate("/orders")}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              View My Orders
            </button>
          </>
        )}

        {!isLoading && order && order.status === "pending" && (
          <>
            <XCircle size={56} className="mx-auto mb-4 text-yellow-500" />
            <h1 className="font-display text-xl font-bold text-foreground mb-2">Payment Not Confirmed</h1>
            <p className="text-sm text-muted-foreground mb-6">
              We couldn't confirm your payment yet. If you completed payment, check My Orders in a moment — it may still be processing.
            </p>
            <Link to="/marketplace" className="text-sm text-primary font-semibold hover:underline">
              ← Back to Marketplace
            </Link>
          </>
        )}

        {!isLoading && error && (
          <>
            <XCircle size={56} className="mx-auto mb-4 text-destructive" />
            <h1 className="font-display text-xl font-bold text-foreground mb-2">Something Went Wrong</h1>
            <p className="text-sm text-muted-foreground mb-6">{error}</p>
            <Link to="/marketplace" className="text-sm text-primary font-semibold hover:underline">
              ← Back to Marketplace
            </Link>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default OrderCallback;
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, Loader2, Truck, CheckCircle2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { getMyPurchases, getMySales, markShipped, confirmDelivery, type ApiOrder } from "@/lib/api";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-teal-100 text-teal-700",
  released: "bg-green-100 text-green-700",
  disputed: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-700",
};

const statusLabels: Record<string, string> = {
  pending: "Awaiting Payment",
  paid: "Paid — Awaiting Shipment",
  shipped: "Shipped",
  delivered: "Delivered",
  released: "Completed",
  disputed: "Disputed",
  refunded: "Refunded",
};

const OrderCard = ({
  order,
  isSeller,
  onAction,
}: {
  order: ApiOrder;
  isSeller: boolean;
  onAction: () => void;
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleMarkShipped = async () => {
    setIsUpdating(true);
    try {
      await markShipped(order.id);
      toast.success("Order marked as shipped");
      onAction();
    } catch {
      toast.error("Could not update order status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmDelivery = async () => {
    setIsUpdating(true);
    try {
      await confirmDelivery(order.id);
      toast.success("Delivery confirmed — payment released to seller 🎉");
      onAction();
    } catch {
      toast.error("Could not confirm delivery. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-4"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="font-semibold text-sm text-foreground">{order.product_title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {order.currency}{order.amount.toLocaleString()}
          </p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${statusColors[order.status] || "bg-muted text-muted-foreground"}`}>
          {statusLabels[order.status] || order.status}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        Order placed {new Date(order.created_at).toLocaleDateString()}
      </p>

      {/* Seller action: mark as shipped */}
      {isSeller && order.status === "paid" && (
        <button
          onClick={handleMarkShipped}
          disabled={isUpdating}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />}
          Mark as Shipped
        </button>
      )}

      {/* Buyer action: confirm delivery */}
      {!isSeller && order.status === "shipped" && (
        <button
          onClick={handleConfirmDelivery}
          disabled={isUpdating}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          Confirm Delivery
        </button>
      )}
    </motion.div>
  );
};

const Orders = () => {
  const [tab, setTab] = useState<"purchases" | "sales">("purchases");
  const [purchases, setPurchases] = useState<ApiOrder[]>([]);
  const [sales, setSales] = useState<ApiOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const [p, s] = await Promise.all([getMyPurchases(), getMySales()]);
      setPurchases(p);
      setSales(s);
    } catch {
      // silently fail — empty state shown
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const visibleOrders = tab === "purchases" ? purchases : sales;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Package size={24} className="text-primary" />
          <h1 className="text-xl font-display font-bold text-foreground">My Orders</h1>
        </div>

        <div className="flex border-b border-border mb-4">
          <button
            onClick={() => setTab("purchases")}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "purchases" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
            }`}
          >
            Purchases
          </button>
          <button
            onClick={() => setTab("sales")}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "sales" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
            }`}
          >
            Sales
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="text-center py-16 text-sm text-muted-foreground">
            {tab === "purchases"
              ? "No purchases yet. Browse the Marketplace to find something you love."
              : "No sales yet. List a product to start selling."}
          </div>
        ) : (
          <div className="space-y-3">
            {visibleOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                isSeller={tab === "sales"}
                onAction={loadOrders}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Orders;
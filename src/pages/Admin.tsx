import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, ShieldCheck, Flag, Ban, Search, ChevronRight,
  CheckCircle, XCircle, Clock, AlertTriangle, ExternalLink, ArrowLeft,
  Image as ImageIcon, Upload, RotateCcw, BadgeCheck, Loader2, Building2, User as UserIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useRoleStore } from "@/stores/roleStore";
import {
  mockAdminUsers, mockCreatorRequests, mockFlaggedPosts,
  type AdminUser, type CreatorRequest, type FlaggedPost, type UserStatus,
} from "@/data/mockAdminData";
import {
  getPendingSellers, verifySeller, type PendingSeller,
  getAllUsers, updateUserStatus, type AdminUserData,
} from "@/lib/api";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  generateFaviconFromFile, loadStoredFavicon, clearFavicon,
} from "@/lib/favicon";

type AdminTab = "users" | "creators" | "sellers" | "flagged" | "suspend" | "branding";

const tabs: { value: AdminTab; label: string; icon: React.ElementType }[] = [
  { value: "users", label: "Users", icon: Users },
  { value: "creators", label: "Creators", icon: ShieldCheck },
  { value: "sellers", label: "Sellers", icon: BadgeCheck },
  { value: "flagged", label: "Flagged", icon: Flag },
  { value: "suspend", label: "Suspend/Ban", icon: Ban },
  { value: "branding", label: "Branding", icon: ImageIcon },
];

const statusBadge: Record<UserStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-green-500/10 text-green-600" },
  suspended: { label: "Suspended", className: "bg-yellow-500/10 text-yellow-600" },
  banned: { label: "Banned", className: "bg-destructive/10 text-destructive" },
};

const Admin = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { hasRole } = useRoleStore();

  // Protect route
  if (!isAuthenticated || !user || !hasRole(user.id, "admin")) {
    return <Navigate to="/feed" replace />;
  }

  return <AdminPanel />;
};

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>("users");

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link to="/feed" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">Termii Management</p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tab nav */}
        <div className="flex gap-1.5 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {tabs.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setActiveTab(value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {activeTab === "users" && <UsersTab />}
          {activeTab === "creators" && <CreatorsTab />}
          {activeTab === "sellers" && <SellersTab />}
          {activeTab === "flagged" && <FlaggedTab />}
          {activeTab === "suspend" && <SuspendBanTab />}
          {activeTab === "branding" && <BrandingTab />}
        </motion.div>
      </div>
    </div>
  );
};

/* ====== USERS TAB ====== */

/* ====== USERS TAB ====== */
const UsersTab = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended" | "banned">("all");
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminUserData | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch {
      // silently fail — empty state shown
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = users.filter((u) => {
    const matchSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || u.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusStyle: Record<string, string> = {
    active: "bg-green-500/10 text-green-600",
    suspended: "bg-yellow-500/10 text-yellow-600",
    banned: "bg-destructive/10 text-destructive",
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "active", "suspended", "banned"] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${
                statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >{s}</button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_auto] gap-4 p-3 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
            <span>User</span><span>Email</span><span>Status</span><span></span>
          </div>
          {filtered.map((u) => (
            <button key={u.id} onClick={() => setSelectedUser(u)}
              className="w-full grid grid-cols-[1fr_auto] sm:grid-cols-[2fr_1fr_1fr_auto] gap-4 p-3 items-center hover:bg-muted/50 transition-colors text-left border-b border-border last:border-0"
            >
              <div className="flex items-center gap-3">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{u.full_name[0]?.toUpperCase()}</span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">{u.full_name}</p>
                  {u.is_admin && <p className="text-[10px] text-primary font-semibold">ADMIN</p>}
                </div>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">{u.email}</p>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full w-fit hidden sm:block ${statusStyle[u.status]}`}>
                {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
              </span>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          ))}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No users found</p>}
        </div>
      )}

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">User Profile</DialogTitle>
            <DialogDescription>Viewing user details</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {selectedUser.avatar_url ? (
                  <img src={selectedUser.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">{selectedUser.full_name[0]?.toUpperCase()}</span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-foreground">{selectedUser.full_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${statusStyle[selectedUser.status]}`}>
                    {selectedUser.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Joined</span>
                  <span className="text-foreground">{new Date(selectedUser.created_at).toLocaleDateString()}</span>
                </div>
                {selectedUser.suspension_reason && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reason</span>
                    <span className="text-foreground">{selectedUser.suspension_reason}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};


/* ====== CREATORS TAB ====== */
const CreatorsTab = () => {
  const [requests, setRequests] = useState(mockCreatorRequests);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: "approve" | "reject" } | null>(null);

  const pending = requests.filter((r) => r.status === "pending");
  const processed = requests.filter((r) => r.status !== "pending");

  const handleAction = () => {
    if (!confirmAction) return;
    setRequests((prev) =>
      prev.map((r) =>
        r.id === confirmAction.id
          ? { ...r, status: confirmAction.action === "approve" ? "approved" as const : "rejected" as const }
          : r
      )
    );
    setConfirmAction(null);
  };

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-foreground mb-4">
        Pending Requests ({pending.length})
      </h2>
      {pending.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground mb-6">
          No pending creator requests
        </div>
      )}
      <div className="space-y-3 mb-8">
        {pending.map((req) => (
          <CreatorCard key={req.id} request={req} onAction={(action) => setConfirmAction({ id: req.id, action })} />
        ))}
      </div>

      {processed.length > 0 && (
        <>
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">Processed</h2>
          <div className="space-y-3">
            {processed.map((req) => <CreatorCard key={req.id} request={req} />)}
          </div>
        </>
      )}

      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              {confirmAction?.action === "approve" ? "Approve Creator?" : "Reject Request?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === "approve"
                ? "This user will gain creator privileges and badges."
                : "This request will be rejected. The user can reapply later."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction}
              className={`rounded-xl ${confirmAction?.action === "reject" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}`}
            >
              {confirmAction?.action === "approve" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const CreatorCard = ({ request, onAction }: { request: CreatorRequest; onAction?: (action: "approve" | "reject") => void }) => (
  <div className="bg-card border border-border rounded-xl p-4">
    <div className="flex items-center gap-3 mb-3">
      <img src={request.user.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">{request.user.displayName}</p>
        <p className="text-xs text-muted-foreground">@{request.user.username} · {request.requestedAt}</p>
      </div>
      {request.status === "approved" && <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-500/10 text-green-600">Approved</span>}
      {request.status === "rejected" && <span className="text-xs font-semibold px-2 py-1 rounded-full bg-destructive/10 text-destructive">Rejected</span>}
      {request.status === "pending" && <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-600">Pending</span>}
    </div>
    <p className="text-sm text-foreground mb-2">{request.reason}</p>
    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
      <ExternalLink size={12} /> {request.portfolio}
    </p>
    {request.status === "pending" && onAction && (
      <div className="flex gap-2">
        <button onClick={() => onAction("approve")}
          className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
        >
          <CheckCircle size={14} /> Approve
        </button>
        <button onClick={() => onAction("reject")}
          className="flex-1 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
        >
          <XCircle size={14} /> Reject
        </button>
      </div>
    )}
  </div>
);

/* ====== FLAGGED TAB ====== */
const FlaggedTab = () => {
  const [reports, setReports] = useState(mockFlaggedPosts);

  const open = reports.filter((r) => r.status === "open");
  const resolved = reports.filter((r) => r.status !== "open");

  const dismiss = (id: string) => setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: "dismissed" as const } : r));
  const takeAction = (id: string) => setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: "actioned" as const } : r));

  const reasonLabel: Record<string, string> = {
    spam: "Spam", harassment: "Harassment", inappropriate: "Inappropriate", misinformation: "Misinformation", other: "Other",
  };

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-foreground mb-4">Open Reports ({open.length})</h2>
      {open.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground mb-6">
          No open reports 🎉
        </div>
      )}
      <div className="space-y-3 mb-8">
        {open.map((report) => (
          <div key={report.id} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <img src={report.author.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{report.author.displayName}</p>
                <p className="text-xs text-muted-foreground">@{report.author.username}</p>
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-destructive/10 text-destructive">
                {reasonLabel[report.reason]}
              </span>
            </div>
            <p className="text-sm text-foreground mb-2 line-clamp-2">"{report.caption}"</p>
            <p className="text-xs text-muted-foreground mb-3">{report.details}</p>
            <p className="text-xs text-muted-foreground mb-3">
              Reported by <span className="font-medium text-foreground">{report.reporter.displayName}</span> · {report.reportedAt}
            </p>
            <div className="flex gap-2">
              <button onClick={() => takeAction(report.id)}
                className="flex-1 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
              >
                <AlertTriangle size={14} /> Take Action
              </button>
              <button onClick={() => dismiss(report.id)}
                className="flex-1 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold hover:bg-secondary/80 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>

      {resolved.length > 0 && (
        <>
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">Resolved</h2>
          <div className="space-y-3">
            {resolved.map((r) => (
              <div key={r.id} className="bg-card border border-border rounded-xl p-4 opacity-60">
                <div className="flex items-center gap-3">
                  <img src={r.author.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{r.author.displayName}</p>
                    <p className="text-xs text-muted-foreground">{reasonLabel[r.reason]}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    r.status === "actioned" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                  }`}>
                    {r.status === "actioned" ? "Actioned" : "Dismissed"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ====== SELLERS TAB ====== */
const SellersTab = () => {
  const [pending, setPending] = useState<PendingSeller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{ seller: PendingSeller; approve: boolean } | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const loadPending = async () => {
    setIsLoading(true);
    try {
      const data = await getPendingSellers();
      setPending(data);
    } catch {
      toast({ title: "Could not load pending sellers", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleDecision = async () => {
    if (!confirmAction) return;
    setIsSubmitting(true);
    try {
      await verifySeller(confirmAction.seller.id, confirmAction.approve, notes || undefined);
      toast({
        title: confirmAction.approve ? "Seller verified" : "Seller rejected",
        description: `${confirmAction.seller.business_name || confirmAction.seller.full_name} has been ${confirmAction.approve ? "approved" : "rejected"}.`,
      });
      setPending((prev) => prev.filter((s) => s.id !== confirmAction.seller.id));
      setConfirmAction(null);
      setNotes("");
    } catch {
      toast({ title: "Could not process this decision", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-foreground mb-4">
        Pending Seller Verifications ({pending.length})
      </h2>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      ) : pending.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
          No pending seller verifications
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((seller) => (
            <div key={seller.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {seller.seller_type === "business" ? (
                    <Building2 size={18} className="text-primary" />
                  ) : (
                    <UserIcon size={18} className="text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {seller.business_name || seller.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{seller.email}</p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-600 capitalize">
                  {seller.seller_type}
                </span>
              </div>

              <div className="space-y-1 text-sm mb-3">
                {seller.cac_number && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CAC Number</span>
                    <span className="text-foreground font-medium">{seller.cac_number}</span>
                  </div>
                )}
                {seller.bank_account_name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bank Account Name</span>
                    <span className="text-foreground font-medium">{seller.bank_account_name}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmAction({ seller, approve: true })}
                  className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                >
                  <CheckCircle size={14} /> Verify
                </button>
                <button
                  onClick={() => setConfirmAction({ seller, approve: false })}
                  className="flex-1 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                >
                  <XCircle size={14} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!confirmAction} onOpenChange={() => { setConfirmAction(null); setNotes(""); }}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">
              {confirmAction?.approve ? "Verify Seller?" : "Reject Seller?"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.approve
                ? `${confirmAction?.seller.business_name || confirmAction?.seller.full_name} will get the Verified Seller badge on all their listings.`
                : `${confirmAction?.seller.business_name || confirmAction?.seller.full_name} will be marked as rejected and won't show the badge.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Internal notes <span className="text-muted-foreground">(optional, for your records)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. CAC certificate checked, matches business name..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
            <button
              onClick={handleDecision}
              disabled={isSubmitting}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 ${
                confirmAction?.approve
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "bg-destructive text-destructive-foreground hover:opacity-90"
              }`}
            >
              {isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" /> Processing...</>
              ) : confirmAction?.approve ? "Confirm Verification" : "Confirm Rejection"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ====== SUSPEND/BAN TAB ====== */
/* ====== SUSPEND/BAN TAB ====== */
const SuspendBanTab = () => {
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionModal, setActionModal] = useState<{ user: AdminUserData; action: "suspend" | "ban" } | null>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAction = async () => {
    if (!actionModal || !reason.trim()) return;
    setIsSubmitting(true);
    try {
      const status = actionModal.action === "suspend" ? "suspended" : "banned";
      await updateUserStatus(actionModal.user.id, status, reason.trim());
      setUsers((prev) =>
        prev.map((u) => (u.id === actionModal.user.id ? { ...u, status, suspension_reason: reason.trim() } : u))
      );
      toast({ title: `User ${status}`, description: `${actionModal.user.full_name} has been ${status}.` });
      setActionModal(null);
      setReason("");
    } catch {
      toast({ title: "Could not update user status", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async (u: AdminUserData) => {
    try {
      await updateUserStatus(u.id, "active");
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, status: "active", suspension_reason: undefined } : x)));
      toast({ title: "User restored", description: `${u.full_name}'s account is active again.` });
    } catch {
      toast({ title: "Could not restore user", variant: "destructive" });
    }
  };

  const statusStyle: Record<string, string> = {
    active: "bg-green-500/10 text-green-600",
    suspended: "bg-yellow-500/10 text-yellow-600",
    banned: "bg-destructive/10 text-destructive",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            {u.avatar_url ? (
              <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">{u.full_name[0]?.toUpperCase()}</span>
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{u.full_name}</p>
              <p className="text-xs text-muted-foreground">{u.email}</p>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusStyle[u.status]}`}>
              {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
            </span>
            {u.status === "active" ? (
              <div className="flex gap-1.5">
                <button onClick={() => setActionModal({ user: u, action: "suspend" })}
                  className="px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-600 text-xs font-semibold hover:bg-yellow-500/20 transition-colors flex items-center gap-1"
                >
                  <Clock size={12} /> Suspend
                </button>
                <button onClick={() => setActionModal({ user: u, action: "ban" })}
                  className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20 transition-colors flex items-center gap-1"
                >
                  <Ban size={12} /> Ban
                </button>
              </div>
            ) : (
              <button onClick={() => handleRestore(u)}
                className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 text-xs font-semibold hover:bg-green-500/20 transition-colors"
              >
                Restore
              </button>
            )}
          </div>
        ))}
      </div>

      <Dialog open={!!actionModal} onOpenChange={() => { setActionModal(null); setReason(""); }}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">
              {actionModal?.action === "suspend" ? "Suspend User" : "Ban User"}
            </DialogTitle>
            <DialogDescription>
              {actionModal?.action === "suspend"
                ? `Temporarily suspend ${actionModal?.user.full_name}'s account. They won't be able to log in.`
                : `Permanently ban ${actionModal?.user.full_name} from the platform. They won't be able to log in.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Reason (required)</label>
              <textarea
                value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this action is being taken..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
            <button onClick={handleAction} disabled={!reason.trim() || isSubmitting}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-40 flex items-center justify-center gap-2 ${
                actionModal?.action === "ban"
                  ? "bg-destructive text-destructive-foreground hover:opacity-90"
                  : "bg-yellow-500 text-white hover:opacity-90"
              }`}
            >
              {isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" /> Processing...</>
              ) : actionModal?.action === "suspend" ? "Suspend User" : "Ban User"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};


/* ====== BRANDING TAB ====== */
const BrandingTab = () => {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPreview(loadStoredFavicon());
  }, []);

  const onFile = async (file?: File | null) => {
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await generateFaviconFromFile(file);
      setPreview(dataUrl);
      toast({ title: "Favicon updated", description: "The site icon has been regenerated and applied." });
    } catch (e) {
      toast({
        title: "Couldn't update favicon",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onReset = () => {
    clearFavicon();
    setPreview(null);
    toast({ title: "Favicon reset", description: "Reverted to the default site icon." });
  };

  return (
    <div className="max-w-xl">
      <h2 className="font-display text-lg font-semibold text-foreground mb-1">Site Favicon</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Upload an image to regenerate the favicon. It's center-cropped to a square and resized to 256×256.
      </p>

      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-5 mb-5">
          <div className="w-20 h-20 rounded-xl bg-muted border border-border overflow-hidden flex items-center justify-center">
            <img
              src={preview ?? "/favicon.png"}
              alt="Current favicon"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Current icon</p>
            <p className="text-xs text-muted-foreground">
              {preview ? "Custom favicon (saved on this device)" : "Default favicon"}
            </p>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Upload size={16} />
            {busy ? "Processing..." : "Upload image"}
          </button>
          <button
            onClick={onReset}
            disabled={busy || !preview}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold hover:bg-secondary/80 transition-colors disabled:opacity-40"
          >
            <RotateCcw size={16} /> Reset to default
          </button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Note: changes apply to your browser. Persisting the favicon for all visitors requires backend storage.
        </p>
      </div>
    </div>
  );
};

export default Admin;

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Grid3X3, Bookmark, Camera, LogOut, Loader2, ChevronDown, ChevronUp, BadgeCheck, X, Building2, User as UserIcon, CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import {
  getMyPosts, getSavedPosts, updateMyProfile, apiClient,
  getMe, getMyApplication, applyForSeller, resumeApplicationPayment,
  getBankList, verifyBankAccount,
  type MeResponse, type SellerApplicationResponse, type Bank,
} from "@/lib/api";
import type { Post } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useFollowStore } from "@/stores/followStore";
import { toast } from "sonner";

const hairTypes = ["3A", "3B", "3C", "4A", "4B", "4C", "Locs", "Beard"];
const porosityOptions = ["Low", "Medium", "High"];
const densityOptions = ["Low", "Medium", "High"];
const patternOptions = ["Straight", "Wavy", "Curly", "Coily"];
const lengthOptions = ["TWA", "Ear Length", "Chin Length", "Shoulder Length", "Armpit Length", "Waist Length+"];
const goalOptions = [
  "Length Retention", "Moisture", "Protective Styling",
  "Hair Growth", "Scalp Health", "Frizz Control",
  "Curl Definition", "Volume", "Shrinkage Solutions",
];
const treatmentOptions = [
  "Heat Styling", "Color Treated", "Chemically Relaxed",
  "Transitioning", "Fully Natural", "Loc'd",
];

const INDIVIDUAL_FEE = 10000;
const CORPORATE_FEE = 50000;

const InitialsAvatar = ({ name, size = "lg" }: { name: string; size?: "sm" | "lg" }) => {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const cls = size === "lg"
    ? "w-20 h-20 sm:w-24 sm:h-24 text-2xl"
    : "w-9 h-9 text-sm";
  return (
    <div className={`${cls} rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-primary/30`}>
      <span className="font-bold text-primary">{initials}</span>
    </div>
  );
};

const MultiSelect = ({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
}) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => {
      const active = selected.includes(opt);
      return (
        <button
          key={opt}
          type="button"
          onClick={() =>
            onChange(active ? selected.filter((s) => s !== opt) : [...selected, opt])
          }
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            active
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-primary/40"
          }`}
        >
          {opt}
        </button>
      );
    })}
  </div>
);

// ── Seller Application Modal ──────────────────────────────────────────────────
const SellerApplicationModal = ({
  onClose,
}: {
  onClose: () => void;
}) => {
  const [sellerType, setSellerType] = useState<"individual" | "business" | null>(null);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [ninOrBvn, setNinOrBvn] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [cacNumber, setCacNumber] = useState("");
  const [tin, setTin] = useState("");
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [verifiedName, setVerifiedName] = useState("");
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (sellerType && banks.length === 0) {
      const loadBanks = async () => {
        setIsLoadingBanks(true);
        try {
          const data = await getBankList();
          setBanks(data);
        } catch {
          toast.error("Could not load bank list. Please try again.");
        } finally {
          setIsLoadingBanks(false);
        }
      };
      loadBanks();
    }
  }, [sellerType, banks.length]);

  const handleVerifyAccount = async () => {
    if (!bankCode || accountNumber.length < 10) {
      toast.error("Please select a bank and enter a valid account number.");
      return;
    }
    setIsVerifying(true);
    setVerifiedName("");
    try {
      const result = await verifyBankAccount(bankCode, accountNumber);
      setVerifiedName(result.account_name);
      toast.success(`Account verified: ${result.account_name}`);
    } catch {
      toast.error("Could not verify this account. Check the number and bank.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerType) {
      toast.error("Please choose an account type.");
      return;
    }
    if (!fullName.trim() || !phoneNumber.trim() || !address.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (sellerType === "individual" && !ninOrBvn.trim()) {
      toast.error("NIN or BVN is required for individual sellers.");
      return;
    }
    if (sellerType === "business" && (!businessName.trim() || !cacNumber.trim())) {
      toast.error("Business name and CAC number are required for corporate sellers.");
      return;
    }
    if (!verifiedName) {
      toast.error("Please verify your bank account first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await applyForSeller({
        seller_type: sellerType,
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim(),
        address: address.trim(),
        nin_or_bvn: sellerType === "individual" ? ninOrBvn.trim() : undefined,
        business_name: sellerType === "business" ? businessName.trim() : undefined,
        cac_number: sellerType === "business" ? cacNumber.trim() : undefined,
        tin: sellerType === "business" ? tin.trim() || undefined : undefined,
        bank_code: bankCode,
        bank_account_number: accountNumber,
        bank_account_name: verifiedName,
      });
      // Redirect to Paystack — same pattern as Orders checkout
      window.location.href = result.authorization_url;
    } catch (err: unknown) {
      let message = "Could not submit your application. Please try again.";
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
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-display text-lg font-bold text-foreground">Become a Seller</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {!sellerType ? (
          <div className="p-5 space-y-3">
            <p className="text-sm text-muted-foreground mb-2">
              Choose the account type that fits you. A one-time fee applies and your application will be reviewed by our team.
            </p>
            <button
              onClick={() => setSellerType("individual")}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/40 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <UserIcon size={20} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">Individual Seller</p>
                <p className="text-xs text-muted-foreground">Selling personal or homemade products</p>
              </div>
              <span className="text-sm font-bold text-foreground">₦{INDIVIDUAL_FEE.toLocaleString()}</span>
            </button>
            <button
              onClick={() => setSellerType("business")}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/40 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 size={20} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">Registered Business</p>
                <p className="text-xs text-muted-foreground">CAC-registered brand or company</p>
              </div>
              <span className="text-sm font-bold text-foreground">₦{CORPORATE_FEE.toLocaleString()}</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                {sellerType === "individual" ? "Individual Seller" : "Registered Business"} Application
              </p>
              <button type="button" onClick={() => setSellerType(null)} className="text-xs text-primary hover:underline">
                Change type
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Full Legal Name *</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Phone Number *</label>
              <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required
                placeholder="e.g. 08012345678"
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Address *</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} required
                placeholder="Street, City, State"
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            {sellerType === "individual" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">NIN or BVN *</label>
                <input value={ninOrBvn} onChange={(e) => setNinOrBvn(e.target.value)} required
                  placeholder="11-digit number"
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <p className="text-xs text-muted-foreground mt-1">Used only to verify your identity, then discarded after review.</p>
              </div>
            )}

            {sellerType === "business" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Business Name *</label>
                  <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} required
                    placeholder="e.g. Ada's Beauty Ltd"
                    className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">CAC Number *</label>
                  <input value={cacNumber} onChange={(e) => setCacNumber(e.target.value)} required
                    placeholder="e.g. RC1234567"
                    className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    TIN <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <input value={tin} onChange={(e) => setTin(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Bank *</label>
              {isLoadingBanks ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 size={14} className="animate-spin" /> Loading banks...
                </div>
              ) : (
                <select value={bankCode} onChange={(e) => { setBankCode(e.target.value); setVerifiedName(""); }}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">Select your bank</option>
                  {banks.map((b) => (
                    <option key={b.code} value={b.code}>{b.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Account Number *</label>
              <div className="flex gap-2">
                <input
                  value={accountNumber}
                  onChange={(e) => { setAccountNumber(e.target.value.replace(/\D/g, "")); setVerifiedName(""); }}
                  placeholder="0123456789"
                  maxLength={10}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={handleVerifyAccount}
                  disabled={isVerifying || !bankCode || accountNumber.length < 10}
                  className="px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold disabled:opacity-50 whitespace-nowrap"
                >
                  {isVerifying ? <Loader2 size={14} className="animate-spin" /> : "Verify"}
                </button>
              </div>
              {verifiedName && (
                <p className="flex items-center gap-1.5 text-sm text-green-600 mt-2">
                  <CheckCircle2 size={14} /> {verifiedName}
                </p>
              )}
            </div>

            <div className="rounded-xl bg-muted/50 p-3 text-sm text-foreground flex items-center justify-between">
              <span>Application Fee</span>
              <span className="font-bold">₦{(sellerType === "business" ? CORPORATE_FEE : INDIVIDUAL_FEE).toLocaleString()}</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !verifiedName}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Redirecting to payment...</> : "Continue to Payment"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

// ── Seller Status Card ────────────────────────────────────────────────────────
const SellerStatusCard = ({
  meData,
  application,
  onApplyClick,
  onResumePayment,
  isResuming,
}: {
  meData: MeResponse | null;
  application: SellerApplicationResponse | null;
  onApplyClick: () => void;
  onResumePayment: () => void;
  isResuming: boolean;
}) => {
  if (!meData) return null;

  // Case 1: Already a verified seller
  if (meData.is_seller) {
    return (
      <div className="mb-4 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <BadgeCheck size={18} className="text-blue-500 fill-blue-100" />
          <p className="text-sm font-semibold text-foreground">Verified Seller</p>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {meData.seller_type === "business" ? "Registered Business" : "Individual Seller"} ·{" "}
          {meData.listing_cap === -1 ? "Unlimited listings" : `${meData.active_listing_count}/${meData.listing_cap} listings used`}
        </p>
      </div>
    );
  }

  // Case 2: Has an application in pending_payment
  if (application?.status === "pending_payment") {
    return (
      <div className="mb-4 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Seller Application</p>
            <p className="text-xs text-muted-foreground mt-0.5">Payment not yet completed</p>
          </div>
          <button
            onClick={onResumePayment}
            disabled={isResuming}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-1.5"
          >
            {isResuming ? <Loader2 size={12} className="animate-spin" /> : null}
            Complete Payment
          </button>
        </div>
      </div>
    );
  }

  // Case 3: Application under review
  if (application?.status === "pending_review") {
    return (
      <div className="mb-4 rounded-xl border border-border bg-card p-4 flex items-center gap-2">
        <Clock size={18} className="text-amber-500" />
        <div>
          <p className="text-sm font-semibold text-foreground">Application Under Review</p>
          <p className="text-xs text-muted-foreground mt-0.5">We'll notify you once it's approved.</p>
        </div>
      </div>
    );
  }

  // Case 4: Rejected — allow reapplying
  if (application?.status === "rejected") {
    return (
      <div className="mb-4 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert size={18} className="text-destructive" />
          <p className="text-sm font-semibold text-foreground">Application Not Approved</p>
        </div>
        {application.rejection_reason && (
          <p className="text-xs text-muted-foreground mb-2">{application.rejection_reason}</p>
        )}
        <button
          onClick={onApplyClick}
          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          Apply Again
        </button>
      </div>
    );
  }

  // Case 5: No application yet
  return (
    <div className="mb-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Become a Seller</p>
          <p className="text-xs text-muted-foreground mt-0.5">Get a verified badge and start selling on Isi Ngala</p>
        </div>
        <button
          onClick={onApplyClick}
          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          Apply
        </button>
      </div>
    </div>
  );
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const realName = user?.displayName || user?.name || user?.email?.split("@")[0] || "User";
  const realUsername = user?.username || user?.email?.split("@")[0] || "user";
  const realBio = user?.bio || "";
  const realAvatar = user?.avatar || "";
  const realHairType = user?.hairType || "";

  const [tab, setTab] = useState<"posts" | "saved">("posts");
  const [editOpen, setEditOpen] = useState(false);
  const [hairFormOpen, setHairFormOpen] = useState(false);
  const [displayName, setDisplayName] = useState(realName);
  const [bio, setBio] = useState(realBio);
  const [username, setUsername] = useState(realUsername);
  const [hairType, setHairType] = useState(realHairType);
  const [avatar, setAvatar] = useState(realAvatar);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Hair profile structured fields
  const [porosity, setPorosity] = useState("");
  const [density, setDensity] = useState("");
  const [pattern, setPattern] = useState("");
  const [hairLength, setHairLength] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [treatments, setTreatments] = useState<string[]>([]);
  const [isSavingHairProfile, setIsSavingHairProfile] = useState(false);

  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // Seller application state
  const [meData, setMeData] = useState<MeResponse | null>(null);
  const [myApplication, setMyApplication] = useState<SellerApplicationResponse | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [isResumingPayment, setIsResumingPayment] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoadingPosts(true);
      try {
        const [myPosts, mySaved] = await Promise.all([getMyPosts(), getSavedPosts()]);
        setUserPosts(myPosts);
        setSavedPosts(mySaved);
      } catch {
        // silently fail
      } finally {
        setIsLoadingPosts(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const loadCounts = async () => {
      try {
        const response = await apiClient.get(`/follows/${user.id}/status`);
        setFollowerCount(response.data.followers_count);
        setFollowingCount(response.data.following_count);
      } catch {
        // keep 0
      }
    };
    loadCounts();
  }, [user?.id]);

  useEffect(() => {
    const loadSellerStatus = async () => {
      try {
        const [me, application] = await Promise.all([getMe(), getMyApplication()]);
        setMeData(me);
        setMyApplication(application);
      } catch {
        // silently fail — seller card just won't render
      }
    };
    loadSellerStatus();
  }, []);

  const visiblePosts = tab === "posts" ? userPosts : savedPosts;

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await updateMyProfile({
        full_name: displayName,
        hair_type: hairType || undefined,
        avatar_url: avatar || undefined,
      });
      useAuthStore.setState((state) => ({
        user: state.user
          ? { ...state.user, displayName, name: displayName, username, bio, hairType, avatar }
          : null,
      }));
      setEditOpen(false);
    } catch {
      // fall back to local update only
      useAuthStore.setState((state) => ({
        user: state.user
          ? { ...state.user, displayName, name: displayName, username, bio, hairType, avatar }
          : null,
      }));
      setEditOpen(false);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveHairProfile = async () => {
    setIsSavingHairProfile(true);
    try {
      await updateMyProfile({
        hair_porosity: porosity || undefined,
        hair_density: density || undefined,
        hair_pattern: pattern || undefined,
        hair_length: hairLength || undefined,
        hair_goals: goals.length > 0 ? goals : undefined,
        hair_treatments: treatments.length > 0 ? treatments : undefined,
      });
      setHairFormOpen(false);
    } catch {
      setHairFormOpen(false);
    } finally {
      setIsSavingHairProfile(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleResumePayment = async () => {
    setIsResumingPayment(true);
    try {
      const result = await resumeApplicationPayment();
      window.location.href = result.authorization_url;
    } catch {
      toast.error("Could not resume payment. Please try again.");
      setIsResumingPayment(false);
    }
  };

  // Check if hair profile is complete
  const hairProfileComplete = porosity || density || pattern || hairLength || goals.length > 0;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-start gap-6 mb-6">
          {avatar ? (
            <img src={avatar} alt={displayName}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-2 ring-primary/30" />
          ) : (
            <InitialsAvatar name={displayName} />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-display text-xl font-bold text-foreground flex items-center gap-1.5">
                {displayName}
                {meData?.is_seller && (
                  <BadgeCheck size={18} className="text-blue-500 fill-blue-100" />
                )}
              </h1>
              <button onClick={() => setEditOpen(true)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <Settings size={18} className="text-muted-foreground" />
              </button>
              <button onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors ml-auto" title="Log out">
                <LogOut size={18} className="text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-1">@{username}</p>
            {bio && <p className="text-sm text-foreground mb-3">{bio}</p>}
            {hairType && (
              <span className="inline-block mb-3 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                {hairType} hair
              </span>
            )}
            <div className="flex gap-6 text-sm">
              <div>
                <span className="font-bold text-foreground">{userPosts.length}</span>{" "}
                <span className="text-muted-foreground">posts</span>
              </div>
              <div>
                <span className="font-bold text-foreground">{followerCount.toLocaleString()}</span>{" "}
                <span className="text-muted-foreground">followers</span>
              </div>
              <div>
                <span className="font-bold text-foreground">{followingCount}</span>{" "}
                <span className="text-muted-foreground">following</span>
              </div>
            </div>
          </div>
        </div>

        {/* Seller Status / Become a Seller Card */}
        <SellerStatusCard
          meData={meData}
          application={myApplication}
          onApplyClick={() => setShowApplyModal(true)}
          onResumePayment={handleResumePayment}
          isResuming={isResumingPayment}
        />

        {/* Hair Profile Card */}
        <div className="mb-4 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-foreground">Hair Profile</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {hairProfileComplete
                  ? "Your detailed hair profile helps find better twins"
                  : "Complete your hair profile to improve twin matching"}
              </p>
            </div>
            <button
              onClick={() => setHairFormOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              {hairProfileComplete ? "Edit" : "Complete"}
            </button>
          </div>
          {hairProfileComplete && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {porosity && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">{porosity} Porosity</span>}
              {density && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">{density} Density</span>}
              {pattern && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">{pattern}</span>}
              {hairLength && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">{hairLength}</span>}
              {goals.slice(0, 2).map((g) => (
                <span key={g} className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">{g}</span>
              ))}
              {goals.length > 2 && (
                <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">+{goals.length - 2} more</span>
              )}
            </div>
          )}
        </div>

        {/* Edit Profile Button (mobile) */}
        <button onClick={() => setEditOpen(true)}
          className="w-full mb-4 py-2 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-card transition-colors sm:hidden">
          Edit Profile
        </button>

        <Link to="/orders"
          className="block w-full mb-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground text-center hover:bg-card transition-colors">
          📦 My Orders
        </Link>

        {/* Tabs */}
        <div className="flex border-b border-border mb-4">
          <button onClick={() => setTab("posts")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "posts" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
            }`}>
            <Grid3X3 size={16} /> Posts
          </button>
          <button onClick={() => setTab("saved")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "saved" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
            }`}>
            <Bookmark size={16} /> Saved
          </button>
        </div>

        {/* Post Grid */}
        {isLoadingPosts ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : visiblePosts.length === 0 ? (
          <div className="text-center py-16 text-sm text-muted-foreground">
            {tab === "saved"
              ? "No saved posts yet. Tap the bookmark on any post to save it."
              : "No posts yet. Share your first hair photo!"}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {visiblePosts.map((post, i) => (
              <Link to={`/post/${post.id}`} key={post.id}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="aspect-square rounded-md overflow-hidden cursor-pointer bg-muted relative"
                >
                  {(post as any).mediaType === "video" || post.image?.includes("/video/") ? (
                    <>
                      <video src={post.image} className="w-full h-full object-cover" preload="metadata" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-background/70 flex items-center justify-center">
                          <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-foreground ml-0.5" />
                        </div>
                      </div>
                    </>
                  ) : post.image ? (
                    <img src={post.image} alt={post.caption}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      loading="lazy" />
                  ) : (
                    <div className="w-full h-full p-2 flex items-center justify-center">
                      <p className="text-[10px] text-foreground line-clamp-6 leading-tight">{post.caption}</p>
                    </div>
                  )}
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Edit Profile Dialog ─────────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Profile</DialogTitle>
            <DialogDescription>Update your profile information</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            <div className="flex justify-center">
              <label className="relative cursor-pointer">
                {avatar ? (
                  <img src={avatar} alt="" className="w-20 h-20 rounded-full object-cover ring-2 ring-border" />
                ) : (
                  <InitialsAvatar name={displayName} />
                )}
                <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Camera size={14} />
                </span>
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onloadend = () => setAvatar(reader.result as string);
                    reader.readAsDataURL(file);
                  }} />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Display Name</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
                placeholder="Tell the community about your hair journey..."
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Hair Type</label>
              <div className="grid grid-cols-4 gap-2">
                {hairTypes.map((type) => (
                  <button key={type} type="button" onClick={() => setHairType(type)}
                    className={`py-2 rounded-lg border text-xs font-semibold transition-all ${
                      hairType === type
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground hover:border-primary/40"
                    }`}>
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleSaveProfile} disabled={isSavingProfile}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60">
              {isSavingProfile ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : "Save Changes"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Hair Profile Dialog ─────────────────────────────────────────────── */}
      <Dialog open={hairFormOpen} onOpenChange={setHairFormOpen}>
        <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Hair Profile</DialogTitle>
            <DialogDescription>
              The more you fill in, the better your hair twin matches will be
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 mt-2">

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Porosity
              </label>
              <p className="text-xs text-muted-foreground mb-2">How well your hair absorbs moisture</p>
              <div className="grid grid-cols-3 gap-2">
                {porosityOptions.map((opt) => (
                  <button key={opt} type="button" onClick={() => setPorosity(opt)}
                    className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      porosity === opt
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground hover:border-primary/40"
                    }`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Density</label>
              <p className="text-xs text-muted-foreground mb-2">How many strands per square inch</p>
              <div className="grid grid-cols-3 gap-2">
                {densityOptions.map((opt) => (
                  <button key={opt} type="button" onClick={() => setDensity(opt)}
                    className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      density === opt
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground hover:border-primary/40"
                    }`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Curl Pattern</label>
              <div className="grid grid-cols-2 gap-2">
                {patternOptions.map((opt) => (
                  <button key={opt} type="button" onClick={() => setPattern(opt)}
                    className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      pattern === opt
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground hover:border-primary/40"
                    }`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Hair Length</label>
              <div className="grid grid-cols-2 gap-2">
                {lengthOptions.map((opt) => (
                  <button key={opt} type="button" onClick={() => setHairLength(opt)}
                    className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      hairLength === opt
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground hover:border-primary/40"
                    }`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Hair Goals</label>
              <p className="text-xs text-muted-foreground mb-2">Select all that apply</p>
              <MultiSelect options={goalOptions} selected={goals} onChange={setGoals} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Hair Treatments</label>
              <p className="text-xs text-muted-foreground mb-2">Describe your hair's current state</p>
              <MultiSelect options={treatmentOptions} selected={treatments} onChange={setTreatments} />
            </div>

            <button onClick={handleSaveHairProfile} disabled={isSavingHairProfile}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60">
              {isSavingHairProfile ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : "Save Hair Profile"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {showApplyModal && (
        <SellerApplicationModal onClose={() => setShowApplyModal(false)} />
      )}
    </AppLayout>
  );
};

export default Profile;
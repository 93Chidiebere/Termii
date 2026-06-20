import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Grid3X3, Bookmark, Camera, LogOut, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { getMyPosts, getSavedPosts, updateMyProfile, apiClient } from "@/lib/api";
import type { Post } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useFollowStore } from "@/stores/followStore";

const hairTypes = ["3A", "3B", "3C", "4A", "4B", "4C"];
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
              <h1 className="font-display text-xl font-bold text-foreground">{displayName}</h1>
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
              <div className="grid grid-cols-6 gap-2">
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
    </AppLayout>
  );
};

export default Profile;
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Grid3X3, Bookmark, Camera, LogOut, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { getMyPosts, getSavedPosts } from "@/lib/api";
import type { Post } from "@/data/mockData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const hairTypes = ["3A", "3B", "3C", "4A", "4B", "4C"];

const InitialsAvatar = ({ name }: { name: string }) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-primary/30">
      <span className="text-2xl font-bold text-primary">{initials}</span>
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
  const [displayName, setDisplayName] = useState(realName);
  const [bio, setBio] = useState(realBio);
  const [username, setUsername] = useState(realUsername);
  const [hairType, setHairType] = useState(realHairType);
  const [avatar, setAvatar] = useState(realAvatar);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoadingPosts(true);
      try {
        const [myPosts, mySaved] = await Promise.all([
          getMyPosts(),
          getSavedPosts(),
        ]);
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

  const visiblePosts = tab === "posts" ? userPosts : savedPosts;

  const handleSave = () => {
    useAuthStore.setState((state) => ({
      user: state.user
        ? { ...state.user, displayName, name: displayName, username, bio, hairType, avatar }
        : null,
    }));
    setEditOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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
                <span className="font-bold text-foreground">{user?.followers?.toLocaleString() ?? 0}</span>{" "}
                <span className="text-muted-foreground">followers</span>
              </div>
              <div>
                <span className="font-bold text-foreground">{user?.following ?? 0}</span>{" "}
                <span className="text-muted-foreground">following</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Button (mobile) */}
        <button onClick={() => setEditOpen(true)}
          className="w-full mb-4 py-2 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-card transition-colors sm:hidden">
          Edit Profile
        </button>

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
                  className="aspect-square rounded-md overflow-hidden cursor-pointer bg-muted"
                >
                  {post.image ? (
                    <img src={post.image} alt={post.caption}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      loading="lazy" />
                  ) : (
                    <div className="w-full h-full p-2 flex items-center justify-center">
                      <p className="text-[10px] text-foreground line-clamp-6 leading-tight">
                        {post.caption}
                      </p>
                    </div>
                  )}
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Edit Profile Dialog */}
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
                  <img src={avatar} alt=""
                    className="w-20 h-20 rounded-full object-cover ring-2 ring-border" />
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
                  <button key={type} onClick={() => setHairType(type)}
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

            <button onClick={handleSave}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
              Save Changes
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Profile;
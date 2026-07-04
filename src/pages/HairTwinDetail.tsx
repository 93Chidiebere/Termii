import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MessageCircle, UserPlus, UserCheck, Share2, Loader2 } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useFollowStore } from "@/stores/followStore";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

interface TwinProfile {
  id: string;
  full_name: string;
  email: string;
  hair_type: string | null;
  avatar_url: string | null;
  followers_count: number;
  following_count: number;
  is_following: boolean;
}

const HairTwinDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isFollowing, toggleFollow } = useFollowStore();
  const { user: currentUser } = useAuthStore();
  const { toast } = useToast();
  const shareCardRef = useRef<HTMLDivElement>(null);

  const [twin, setTwin] = useState<TwinProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [matchScore, setMatchScore] = useState(0);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get(`/follows/${id}/profile`);
        setTwin(response.data);

        // Compute a simple match score based on hair type, matching the backend logic
        const myHairType = currentUser?.hairType?.toUpperCase();
        const theirHairType = response.data.hair_type?.toUpperCase();
        let score = 0;
        if (myHairType && theirHairType) {
          if (myHairType === theirHairType) score = 0.75;
          else if (myHairType[0] === theirHairType[0]) score = 0.45;
          else score = 0.15;
        }
        setMatchScore(score);
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id, currentUser]);

  const following = twin ? isFollowing(twin.id) : false;
  const percentage = Math.round(matchScore * 100);

  const handleFollowToggle = () => {
    if (twin) toggleFollow(twin.id);
  };

  const handleShare = useCallback(async () => {
    if (!twin) return;
    const shareData = {
      title: `My Hair Twin on Isi Ngala!`,
      text: `I'm a ${percentage}% match with ${twin.full_name} on Isi Ngala! Find your Hair Twin too 🌿`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        toast({ title: "Link copied!", description: "Share it with your friends." });
      }
    } catch {
      // user cancelled
    }
  }, [twin, percentage, toast]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (notFound || !twin) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-muted-foreground">Hair twin not found.</p>
          <Button variant="outline" onClick={() => navigate("/hair-twins")}>
            ← Back to Hair Twins
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate("/hair-twins")}>
          <ArrowLeft size={18} /> Back to Hair Twins
        </Button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-20 w-20 ring-2 ring-gold/40">
                  {twin.avatar_url ? (
                    <img src={twin.avatar_url} alt={twin.full_name} className="h-full w-full object-cover rounded-full" />
                  ) : (
                    <AvatarFallback className="bg-primary/20 text-primary font-bold text-xl">
                      {twin.full_name[0].toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <h1 className="text-2xl font-display font-bold text-foreground">{twin.full_name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {twin.hair_type ? `${twin.hair_type} hair` : "Natural hair"}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-2xl font-bold text-gold font-display">{percentage}%</span>
                    <span className="text-xs text-muted-foreground">match</span>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span><strong className="text-foreground">{twin.followers_count}</strong> followers</span>
                    <span><strong className="text-foreground">{twin.following_count}</strong> following</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" variant={following ? "secondary" : "default"} onClick={handleFollowToggle}>
                  {following ? <><UserCheck size={16} className="mr-1" /> Following</> : <><UserPlus size={16} className="mr-1" /> Follow</>}
                </Button>
                <Button className="flex-1" variant="outline" onClick={() => navigate("/messages")}>
                  <MessageCircle size={16} className="mr-1" /> Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Match Breakdown */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Match Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Hair Type Match</span>
                  <span className="font-semibold text-gold">{percentage}%</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Why You Match */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Why You Match</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentUser?.hairType && twin.hair_type ? (
                  currentUser.hairType.toUpperCase() === twin.hair_type.toUpperCase() ? (
                    <>You and <span className="font-semibold text-foreground">{twin.full_name}</span> both have <span className="font-semibold text-foreground">{twin.hair_type}</span> hair — an exact match! Tips and routines that work for you will likely work great for them too.</>
                  ) : (
                    <>You and <span className="font-semibold text-foreground">{twin.full_name}</span> have related hair types — yours is {currentUser.hairType} and theirs is {twin.hair_type}. You can still learn a lot from each other's routines.</>
                  )
                ) : (
                  <>Set your hair type in your profile to see a detailed match breakdown with {twin.full_name}.</>
                )}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Shareable Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="mb-6 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Share Your Match</CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={shareCardRef} className="bg-warm-brown rounded-xl p-5 text-warm-brown-foreground mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-display text-lg font-bold">Isi Ngala</span>
                  <span className="text-xs opacity-60">Hair Twin Match</span>
                </div>
                <Separator className="bg-warm-brown-foreground/20 mb-3" />
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-gold/50">
                    {twin.avatar_url ? (
                      <img src={twin.avatar_url} alt={twin.full_name} className="h-full w-full object-cover rounded-full" />
                    ) : (
                      <AvatarFallback className="bg-primary/30 text-primary-foreground font-bold">
                        {twin.full_name[0].toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-semibold">{twin.full_name}</p>
                    <p className="text-xs opacity-70">{twin.hair_type || "Natural"} hair</p>
                  </div>
                  <div className="ml-auto text-right">
                    <span className="text-3xl font-display font-bold text-gold">{percentage}%</span>
                    <p className="text-[10px] uppercase tracking-wider opacity-60">match</p>
                  </div>
                </div>
              </div>
              <Button className="w-full" variant="outline" onClick={handleShare}>
                <Share2 size={16} className="mr-1" /> Share
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default HairTwinDetail;
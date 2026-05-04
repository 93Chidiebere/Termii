import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MessageCircle, UserPlus, UserCheck, Share2, Download } from "lucide-react";
import { useRef, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { hairTwins, currentUserHairProfile } from "@/data/mockHairTwins";
import { useFollowStore } from "@/stores/followStore";
import { useToast } from "@/hooks/use-toast";

const traitLabels: Record<string, string> = {
  type: "Hair Type",
  porosity: "Porosity",
  density: "Density",
  pattern: "Curl Pattern",
  length: "Length",
};

const HairTwinDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isFollowing, toggleFollow } = useFollowStore();
  const { toast } = useToast();
  const shareCardRef = useRef<HTMLDivElement>(null);

  const twin = hairTwins.find((t) => t.userId === id);

  const following = isFollowing(twin?.userId ?? "");
  const percentage = Math.round((twin?.matchScore ?? 0) * 100);
  const goalPercentage = Math.round((twin?.goalSimilarity ?? 0) * 100);

  const traitKeys = Object.keys(traitLabels);

  const getTraitMatch = useCallback((key: string) => {
    if (!twin) return false;
    const userVal = currentUserHairProfile[key as keyof typeof currentUserHairProfile];
    const twinVal = twin.hairProfile[key as keyof typeof twin.hairProfile];
    return typeof userVal === "string" && typeof twinVal === "string" && userVal === twinVal;
  }, [twin]);

  const matchedTraits = traitKeys.filter(getTraitMatch);
  const traitMatchPercent = Math.round((matchedTraits.length / traitKeys.length) * 100);

  const handleShare = useCallback(async () => {
    if (!twin) return;
    const shareData = {
      title: `My Hair Twin on Termii!`,
      text: `I'm a ${percentage}% match with ${twin.displayName}! We share ${twin.sharedTraits.join(", ")}. Find your Hair Twin on Termii 🌿`,
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
      // User cancelled share
    }
  }, [twin, percentage, toast]);

  if (!twin) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Hair twin not found.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Back */}
        <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate("/hair-twins")}>
          <ArrowLeft size={18} /> Back to Hair Twins
        </Button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-20 w-20 ring-2 ring-gold/40">
                  <AvatarImage src={twin.avatar} alt={twin.displayName} />
                  <AvatarFallback>{twin.displayName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h1 className="text-2xl font-display font-bold text-foreground">{twin.displayName}</h1>
                  <p className="text-sm text-muted-foreground">@{twin.username} · {twin.location}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-2xl font-bold text-gold font-display">{percentage}%</span>
                    <span className="text-xs text-muted-foreground">match</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" variant={following ? "secondary" : "default"} onClick={() => toggleFollow(twin.userId)}>
                  {following ? <><UserCheck size={16} /> Following</> : <><UserPlus size={16} /> Follow</>}
                </Button>
                <Button className="flex-1" variant="outline" onClick={() => navigate("/messages")}>
                  <MessageCircle size={16} /> Start Conversation
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Side-by-side Comparison */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Hair Profile Comparison</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {traitKeys.map((key) => {
                const userVal = currentUserHairProfile[key as keyof typeof currentUserHairProfile];
                const twinVal = twin.hairProfile[key as keyof typeof twin.hairProfile];
                const match = typeof userVal === "string" && userVal === twinVal;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {traitLabels[key]}
                      </span>
                      {match && <Badge variant="secondary" className="text-[10px] bg-gold/15 text-gold border-0">Match ✓</Badge>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted rounded-md px-3 py-2 text-sm text-foreground">
                        <span className="text-[10px] text-muted-foreground block">You</span>
                        {typeof userVal === "string" ? userVal : "—"}
                      </div>
                      <div className="bg-muted rounded-md px-3 py-2 text-sm text-foreground">
                        <span className="text-[10px] text-muted-foreground block">{twin.displayName}</span>
                        {typeof twinVal === "string" ? twinVal : "—"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Trait Similarity Bars */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Match Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Trait Match</span>
                  <span className="font-semibold text-foreground">{traitMatchPercent}%</span>
                </div>
                <Progress value={traitMatchPercent} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Goal Alignment</span>
                  <span className="font-semibold text-foreground">{goalPercentage}%</span>
                </div>
                <Progress value={goalPercentage} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Overall Match</span>
                  <span className="font-semibold text-gold">{percentage}%</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Why You Match */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Why You Match</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You and <span className="font-semibold text-foreground">{twin.displayName}</span> share{" "}
                <span className="font-semibold text-foreground">{twin.sharedTraits.join(", ")}</span>.
                {twin.goalSimilarity >= 0.8
                  ? " Your hair goals are strongly aligned — you're both focused on similar outcomes, so tips and routines that work for one of you will likely work for the other!"
                  : twin.goalSimilarity >= 0.6
                  ? " You have overlapping hair goals, meaning you can exchange helpful product recommendations and techniques."
                  : " While your goals differ slightly, your shared hair properties mean you can still learn a lot from each other's care routines."}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {twin.goals.map((goal) => (
                  <Badge key={goal} variant="outline" className="text-xs">
                    {goal}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Shareable Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="mb-6 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Share Your Match</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Preview Card */}
              <div
                ref={shareCardRef}
                className="bg-warm-brown rounded-xl p-5 text-warm-brown-foreground mb-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-display text-lg font-bold">Termii</span>
                  <span className="text-xs opacity-60">Hair Twin Match</span>
                </div>
                <Separator className="bg-warm-brown-foreground/20 mb-3" />
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-gold/50">
                    <AvatarImage src={twin.avatar} alt={twin.displayName} />
                    <AvatarFallback>{twin.displayName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{twin.displayName}</p>
                    <p className="text-xs opacity-70">{twin.sharedTraits[0]} · {twin.hairProfile.type}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <span className="text-3xl font-display font-bold text-gold">{percentage}%</span>
                    <p className="text-[10px] uppercase tracking-wider opacity-60">match</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" variant="outline" onClick={handleShare}>
                  <Share2 size={16} /> Share
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default HairTwinDetail;

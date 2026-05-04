import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, ChevronDown, ChevronUp, MapPin, UserPlus, UserCheck } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { hairTwins } from "@/data/mockHairTwins";
import { useFollowStore } from "@/stores/followStore";

const MatchCircle = ({ score }: { score: number }) => {
  const percentage = Math.round(score * 100);
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (score * circumference);

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
        <circle
          cx="60" cy="60" r="54" fill="none"
          stroke="hsl(var(--gold))"
          strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground font-display">{percentage}%</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">avg match</span>
      </div>
    </div>
  );
};

const TwinCard = ({ twin, index }: { twin: typeof hairTwins[0]; index: number }) => {
  const navigate = useNavigate();
  const { isFollowing, toggleFollow } = useFollowStore();
  const following = isFollowing(twin.userId);
  const percentage = Math.round(twin.matchScore * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => navigate(`/hair-twins/${twin.userId}`)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-14 w-14 ring-2 ring-gold/30">
              <AvatarImage src={twin.avatar} alt={twin.displayName} />
              <AvatarFallback>{twin.displayName[0]}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{twin.displayName}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin size={12} />
                    <span>{twin.location}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-lg font-bold text-gold font-display">{percentage}%</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">match</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mt-2">
                {twin.sharedTraits.map((trait) => (
                  <Badge key={trait} variant="secondary" className="text-[10px] px-1.5 py-0">
                    {trait}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-3">
                <Button
                  size="sm"
                  variant={following ? "secondary" : "default"}
                  className="h-8 text-xs flex-1"
                  onClick={(e) => { e.stopPropagation(); toggleFollow(twin.userId); }}
                >
                  {following ? <><UserCheck size={14} /> Following</> : <><UserPlus size={14} /> Follow</>}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs flex-1"
                  onClick={(e) => { e.stopPropagation(); navigate(`/hair-twins/${twin.userId}`); }}
                >
                  View Profile
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const HairTwins = () => {
  const [showAll, setShowAll] = useState(false);
  const avgScore = hairTwins.reduce((sum, t) => sum + t.matchScore, 0) / hairTwins.length;
  const visibleTwins = showAll ? hairTwins : hairTwins.slice(0, 5);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users className="text-gold" size={28} />
            <h1 className="text-3xl font-display font-bold text-foreground">Your Hair Twins</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            We matched you with people who have similar hair to yours — same texture, porosity, and goals.
            Learn from each other's journeys! 💛
          </p>
        </motion.div>

        {/* Match Strength */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card>
            <CardContent className="py-6">
              <MatchCircle score={avgScore} />
              <p className="text-center text-xs text-muted-foreground mt-2">
                Average match strength across your top twins
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Twins List */}
        <div className="space-y-3">
          <h2 className="text-lg font-display font-semibold text-foreground">
            Top Matches
          </h2>
          {visibleTwins.map((twin, i) => (
            <TwinCard key={twin.userId} twin={twin} index={i} />
          ))}
        </div>

        {hairTwins.length > 5 && (
          <Button
            variant="ghost"
            className="w-full mt-4 text-muted-foreground"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? <><ChevronUp size={16} /> Show Less</> : <><ChevronDown size={16} /> Show {hairTwins.length - 5} More</>}
          </Button>
        )}
      </div>
    </AppLayout>
  );
};

export default HairTwins;

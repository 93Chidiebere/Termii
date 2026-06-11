import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, ChevronDown, ChevronUp, UserPlus, UserCheck, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFollowStore } from "@/stores/followStore";
import { getTwins, type ApiTwin } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

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

const TwinCard = ({ twin, index }: { twin: ApiTwin; index: number }) => {
  const navigate = useNavigate();
  const { isFollowing, toggleFollow } = useFollowStore();
  const following = isFollowing(twin.user_id);
  const percentage = Math.round(twin.match_score * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <Card
        className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => navigate(`/hair-twins/${twin.user_id}`)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-14 w-14 ring-2 ring-gold/30">
              {twin.avatar_url ? (
                <img src={twin.avatar_url} alt={twin.full_name} className="h-full w-full object-cover rounded-full" />
              ) : (
                <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
                  {twin.full_name[0].toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{twin.full_name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {twin.hair_type ? `${twin.hair_type} hair` : "Natural hair"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-lg font-bold text-gold font-display">{percentage}%</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">match</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mt-2">
                {twin.shared_traits.map((trait) => (
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
                  onClick={(e) => { e.stopPropagation(); toggleFollow(twin.user_id); }}
                >
                  {following
                    ? <><UserCheck size={14} className="mr-1" /> Following</>
                    : <><UserPlus size={14} className="mr-1" /> Follow</>
                  }
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs flex-1"
                  onClick={(e) => { e.stopPropagation(); navigate(`/hair-twins/${twin.user_id}`); }}
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
  const { user } = useAuthStore();
  const [showAll, setShowAll] = useState(false);
  const [twins, setTwins] = useState<ApiTwin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getTwins();
        setTwins(data);
        setError(null);
      } catch {
        setError("Could not load hair twins.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const visibleTwins = showAll ? twins : twins.slice(0, 5);
  const avgScore = twins.length > 0
    ? twins.reduce((sum, t) => sum + t.match_score, 0) / twins.length
    : 0;

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
            We matched you with people who have similar hair to yours.
            Learn from each other's journeys! 💛
          </p>
          {user?.hairType && (
            <p className="text-xs text-primary font-semibold mt-2">
              Matching based on your {user.hairType} hair type
            </p>
          )}
        </motion.div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        )}

        {/* No hair type set */}
        {!isLoading && !error && twins.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="font-semibold text-foreground mb-2">No twins found yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                {user?.hairType
                  ? "No other users with your hair type have joined yet. Check back soon!"
                  : "Set your hair type in your profile to find your hair twins."}
              </p>
              {!user?.hairType && (
                <Button onClick={() => window.location.href = "/profile"} size="sm">
                  Update Profile
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Match circle + twins list */}
        {!isLoading && twins.length > 0 && (
          <>
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

            <div className="space-y-3">
              <h2 className="text-lg font-display font-semibold text-foreground">
                Top Matches ({twins.length} found)
              </h2>
              {visibleTwins.map((twin, i) => (
                <TwinCard key={twin.user_id} twin={twin} index={i} />
              ))}
            </div>

            {twins.length > 5 && (
              <Button
                variant="ghost"
                className="w-full mt-4 text-muted-foreground"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll
                  ? <><ChevronUp size={16} className="mr-1" /> Show Less</>
                  : <><ChevronDown size={16} className="mr-1" /> Show {twins.length - 5} More</>
                }
              </Button>
            )}
          </>
        )}

        {error && (
          <div className="text-center py-8 text-sm text-muted-foreground">{error}</div>
        )}
      </div>
    </AppLayout>
  );
};

export default HairTwins;
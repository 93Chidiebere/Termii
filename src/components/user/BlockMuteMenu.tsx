import { useState } from "react";
import { ShieldOff, VolumeX, ShieldCheck, Volume2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useBlockMuteStore } from "@/stores/blockMuteStore";

interface BlockMuteMenuProps {
  userId: string;
  displayName: string;
  onActionComplete?: () => void;
}

export const BlockMuteMenu = ({ userId, displayName, onActionComplete }: BlockMuteMenuProps) => {
  const { isBlocked, isMuted, blockUser, unblockUser, muteUser, unmuteUser } = useBlockMuteStore();
  const [confirmAction, setConfirmAction] = useState<"block" | "mute" | null>(null);

  const blocked = isBlocked(userId);
  const muted = isMuted(userId);

  const handleConfirm = () => {
    if (confirmAction === "block") {
      blocked ? unblockUser(userId) : blockUser(userId);
    } else if (confirmAction === "mute") {
      muted ? unmuteUser(userId) : muteUser(userId);
    }
    setConfirmAction(null);
    onActionComplete?.();
  };

  const confirmTitle =
    confirmAction === "block"
      ? blocked ? `Unblock ${displayName}?` : `Block ${displayName}?`
      : muted ? `Unmute ${displayName}?` : `Mute ${displayName}?`;

  const confirmDesc =
    confirmAction === "block"
      ? blocked
        ? `${displayName} will be able to see your content and you'll see theirs again.`
        : `${displayName} won't be able to see your content and you won't see theirs. They won't be notified.`
      : muted
        ? `${displayName}'s posts will appear in your feed again.`
        : `${displayName}'s posts will be hidden from your feed. You can still visit their profile.`;

  return (
    <>
      <div className="space-y-1">
        <button
          onClick={() => blocked ? handleConfirmDirect("block") : setConfirmAction("block")}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted rounded-lg transition-colors text-left"
        >
          {blocked ? <ShieldCheck size={18} className="text-primary" /> : <ShieldOff size={18} className="text-destructive" />}
          <div>
            <p className="font-medium text-foreground">{blocked ? "Unblock" : "Block"} user</p>
            <p className="text-xs text-muted-foreground">
              {blocked ? "Allow them to see your content" : "They won't see your content"}
            </p>
          </div>
        </button>
        <button
          onClick={() => muted ? handleConfirmDirect("mute") : setConfirmAction("mute")}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted rounded-lg transition-colors text-left"
        >
          {muted ? <Volume2 size={18} className="text-primary" /> : <VolumeX size={18} className="text-muted-foreground" />}
          <div>
            <p className="font-medium text-foreground">{muted ? "Unmute" : "Mute"} user</p>
            <p className="text-xs text-muted-foreground">
              {muted ? "Show their posts in your feed" : "Hide their posts from your feed"}
            </p>
          </div>
        </button>
      </div>

      <AlertDialog open={confirmAction !== null} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={`rounded-xl ${confirmAction === "block" && !blocked ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}`}
            >
              {confirmAction === "block" ? (blocked ? "Unblock" : "Block") : (muted ? "Unmute" : "Mute")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  function handleConfirmDirect(action: "block" | "mute") {
    if (action === "block" && blocked) {
      unblockUser(userId);
      onActionComplete?.();
    } else if (action === "mute" && muted) {
      unmuteUser(userId);
      onActionComplete?.();
    } else {
      setConfirmAction(action);
    }
  }
};

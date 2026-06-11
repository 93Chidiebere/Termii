import { useState } from "react";
import { Camera, Video, X, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "sonner";
import { createPost } from "@/lib/api";

const MAX_FILE_SIZE_MB = 10; // Keep small for now — no S3 yet, we send base64
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const Create = () => {
  const navigate = useNavigate();
  const [caption, setCaption] = useState("");
  const [hairType, setHairType] = useState("");
  const [tags, setTags] = useState("");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`File too large! Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    const isVideo = file.type.startsWith("video/");
    setMediaType(isVideo ? "video" : "image");

    const reader = new FileReader();
    reader.onloadend = () => setMediaPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!caption.trim()) {
      toast.error("Please write something to share!");
      return;
    }

    setIsSubmitting(true);
    try {
      // Parse tags from comma-separated string into array
      const parsedTags = tags
        .split(",")
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean);

      const post = await createPost({
        caption: caption.trim(),
        hair_type: hairType || undefined,
        tags: parsedTags,
        // For now we store the base64 preview as media_url
        // In Priority 5 this will be replaced with an S3 URL
        media_url: mediaPreview || undefined,
        media_type: mediaType || undefined,
      });

      toast.success("Post shared! 🎉", {
        action: {
          label: "View Feed",
          onClick: () => navigate("/feed"),
        },
      });

      // Reset form
      setCaption("");
      setHairType("");
      setTags("");
      setMediaPreview(null);
      setMediaType(null);

      // Navigate to feed after short delay
      setTimeout(() => navigate("/feed"), 1500);

    } catch (err: unknown) {
      let message = "Failed to share post. Please try again.";
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4 py-6">
        <h1 className="font-display text-2xl font-bold text-foreground mb-6">Create Post</h1>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* Upload area */}
          {mediaPreview ? (
            <div className="relative rounded-2xl overflow-hidden">
              {mediaType === "video" ? (
                <video src={mediaPreview} controls className="w-full max-h-96 rounded-2xl" />
              ) : (
                <img src={mediaPreview} alt="Preview" className="w-full object-cover max-h-96 rounded-2xl" />
              )}
              <button
                onClick={() => { setMediaPreview(null); setMediaType(null); }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center"
              >
                <X size={16} className="text-foreground" />
              </button>
            </div>
          ) : (
            <label className="aspect-video rounded-2xl border-2 border-dashed border-border bg-card flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary/40 transition-colors">
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleMediaUpload}
              />
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                  <Camera size={26} className="text-muted-foreground" />
                </div>
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                  <Video size={26} className="text-muted-foreground" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Add a photo or video</p>
                <p className="text-xs text-muted-foreground mt-1">Max {MAX_FILE_SIZE_MB}MB · Any length</p>
              </div>
            </label>
          )}

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              What's on your mind?
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Talk about your hair journey, your day, or anything else..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Hair Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Hair Type <span className="text-muted-foreground">(optional)</span>
            </label>
            <select
              value={hairType}
              onChange={(e) => setHairType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Select hair type</option>
              <option>3A</option><option>3B</option><option>3C</option>
              <option>4A</option><option>4B</option><option>4C</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Tags <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="#twist-out, #wash-day, #4C-curls"
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? <><Loader2 size={16} className="animate-spin" /> Sharing...</>
              : "Share Post"
            }
          </button>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Create;
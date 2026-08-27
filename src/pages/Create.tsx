import { useState } from "react";
import { Camera, Video, X, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "sonner";
import { createPost, getPresignedUploadUrl } from "@/lib/api";
import imageCompression from "browser-image-compression";
import { VideoRecorder } from "@/components/VideoRecorder";
import axios from "axios";

const CLOUDINARY_CLOUD = "dwfojbv0m";
const CLOUDINARY_PRESET = "jxuvhapr";

const MIN_VIDEO_SIZE_MB = 0; // no real lower bound enforced, but kept for clarity
const MAX_VIDEO_SIZE_MB = 100;
const MAX_IMAGE_SIZE_MB = 15;

const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

const uploadToB2 = async (
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> => {
  const presignData = await getPresignedUploadUrl(file.name, file.type);
  
  await axios.put(presignData.url, file, {
    headers: { "Content-Type": file.type },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        onProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
      }
    },
  });

  return presignData.media_url;
};

const uploadToCloudinary = async (
  file: File,
  resourceType: "image" | "video",
  onProgress?: (pct: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_PRESET);
    formData.append("folder", "termii/posts");

    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/${resourceType}/upload`
    );

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        resolve(data.secure_url);
      } else {
        reject(new Error("Upload failed"));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(formData);
  });
};

const Create = () => {
  const navigate = useNavigate();
  const [caption, setCaption] = useState("");
  const [hairType, setHairType] = useState("");
  const [tags, setTags] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isVideoRecorderOpen, setIsVideoRecorderOpen] = useState(false);

  const handleVideoRecorded = (file: File) => {
    setMediaFile(file);
    setMediaType("video");
    const objectUrl = URL.createObjectURL(file);
    setMediaPreview(objectUrl);
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) {
      toast.error("Please select an image or video file.");
      return;
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE_BYTES) {
      toast.error(`Video too large! Maximum size is ${MAX_VIDEO_SIZE_MB}MB.`);
      return;
    }

    if (isImage && file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error(`Image too large! Maximum size is ${MAX_IMAGE_SIZE_MB}MB.`);
      return;
    }

    setMediaFile(file);
    setMediaType(isVideo ? "video" : "image");

    // Local preview only — actual upload happens on submit
    const objectUrl = URL.createObjectURL(file);
    setMediaPreview(objectUrl);
  };

  const handleRemoveMedia = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
  };

  const handleSubmit = async () => {
    if (!caption.trim()) {
      toast.error("Please write something to share!");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      let mediaUrl: string | undefined;

      // Step 1 — Upload media to Cloudinary if present
      if (mediaFile && mediaType) {
        let fileToUpload = mediaFile;

        if (mediaType === "image") {
          setUploadStatus("Compressing image...");
          try {
            fileToUpload = await imageCompression(mediaFile, {
              maxSizeMB: 0.5,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
            });
          } catch {
            // If compression fails, fall back to original file
            fileToUpload = mediaFile;
          }
        }

        if (mediaType === "video") {
          setUploadStatus("Uploading video to Backblaze...");
          mediaUrl = await uploadToB2(fileToUpload, (pct) => {
            setUploadProgress(pct);
          });
        } else {
          setUploadStatus("Uploading image...");
          mediaUrl = await uploadToCloudinary(fileToUpload, mediaType, (pct) => {
            setUploadProgress(pct);
          });
        }
        setUploadStatus("Saving post...");
      }

      // Step 2 — Parse tags
      const parsedTags = tags
        .split(",")
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean);

      // Step 3 — Create post in backend
      await createPost({
        caption: caption.trim(),
        hair_type: hairType || undefined,
        tags: parsedTags,
        media_url: mediaUrl,
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
      handleRemoveMedia();

      setTimeout(() => navigate("/feed"), 1500);

    } catch (err: unknown) {
      let message = "Failed to share post. Please try again.";
      if (err instanceof Error) {
        message = `Error: ${err.message}`;
      } else if (
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
      setUploadProgress(0);
      setUploadStatus("");
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
              {!isSubmitting && (
                <button
                  onClick={handleRemoveMedia}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center"
                >
                  <X size={16} className="text-foreground" />
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
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
                <div className="text-center px-4">
                  <p className="text-sm font-semibold text-foreground">Choose from library</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Images up to {MAX_IMAGE_SIZE_MB}MB · Videos up to {MAX_VIDEO_SIZE_MB}MB
                  </p>
                </div>
              </label>

              <button
                type="button"
                onClick={() => setIsVideoRecorderOpen(true)}
                className="w-full py-3.5 border border-primary/30 rounded-2xl bg-primary/5 text-primary hover:bg-primary/10 transition-colors text-sm font-bold flex items-center justify-center gap-2"
              >
                <Sparkles size={16} className="animate-pulse" />
                Record Short Video with Beauty Filter
              </button>
            </div>
          )}

          {/* Upload progress bar */}
          {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-1">
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {uploadStatus} {uploadProgress}%
              </p>
            </div>
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
              <option>Locs</option><option>Beard</option>
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
              ? <><Loader2 size={16} className="animate-spin" /> {uploadStatus || "Sharing..."}</>
              : "Share Post"
            }
          </button>
        </motion.div>
      </div>
      <VideoRecorder
        isOpen={isVideoRecorderOpen}
        onClose={() => setIsVideoRecorderOpen(false)}
        onSave={handleVideoRecorded}
      />
    </AppLayout>
  );
};

export default Create;
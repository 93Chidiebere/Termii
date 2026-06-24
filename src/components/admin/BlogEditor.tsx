import { useState, useEffect } from "react";
import {
  X, Image as ImageIcon, Type, Bold, Link as LinkIcon, List,
  Trash2, GripVertical, Loader2, Pin, PinOff, ArrowUp, ArrowDown,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  createBlogPost, updateBlogPost, getBlogPostForEdit,
  pinBlogPost, unpinBlogPost,
  type BlogBlock, type BlogPost,
} from "@/lib/api";
import { toast } from "sonner";

const CLOUDINARY_CLOUD = "dwfojbv0m";
const CLOUDINARY_PRESET = "jxuvhapr";

const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_PRESET);
  formData.append("folder", "termii/blog");
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
    { method: "POST", body: formData }
  );
  if (!response.ok) throw new Error("Image upload failed");
  const data = await response.json();
  return data.secure_url;
};

// Inserts markdown syntax around the current selection in a textarea
const applyFormat = (
  textarea: HTMLTextAreaElement,
  before: string,
  after: string = before
) => {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  const selected = value.slice(start, end);
  const newValue = value.slice(0, start) + before + selected + after + value.slice(end);
  return { newValue, cursorPos: start + before.length + selected.length + after.length };
};

interface BlogEditorProps {
  postId: string | null; // null = creating new post
  onClose: () => void;
  onSaved: () => void;
}

export const BlogEditor = ({ postId, onClose, onSaved }: BlogEditorProps) => {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [blocks, setBlocks] = useState<BlogBlock[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!postId) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const post = await getBlogPostForEdit(postId);
        setTitle(post.title);
        setSummary(post.summary);
        setBlocks(post.blocks);
        setIsPinned(post.is_pinned);
      } catch {
        toast.error("Could not load this post.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [postId]);

  const addTextBlock = () => {
    setBlocks((prev) => [...prev, { type: "text", content: "", is_thumbnail: false }]);
  };

  const addImageBlock = () => {
    setBlocks((prev) => [...prev, { type: "image", content: "", is_thumbnail: false }]);
  };

  const updateBlock = (index: number, content: string) => {
    setBlocks((prev) => prev.map((b, i) => (i === index ? { ...b, content } : b)));
  };

  const removeBlock = (index: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    setBlocks((prev) => {
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const updated = [...prev];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated;
    });
  };

  const handleImageUpload = async (index: number, file: File) => {
    setUploadingIndex(index);
    try {
      const url = await uploadToCloudinary(file);
      updateBlock(index, url);
    } catch {
      toast.error("Image upload failed. Please try again.");
    } finally {
      setUploadingIndex(null);
    }
  };

  const setThumbnail = (index: number) => {
    setBlocks((prev) =>
      prev.map((b, i) => ({ ...b, is_thumbnail: i === index && b.type === "image" }))
    );
  };

  const handleTextFormat = (index: number, format: "bold" | "link" | "bullet") => {
    const textarea = document.getElementById(`block-textarea-${index}`) as HTMLTextAreaElement | null;
    if (!textarea) return;

    let result;
    if (format === "bold") {
      result = applyFormat(textarea, "**");
    } else if (format === "link") {
      const url = window.prompt("Enter the link URL:");
      if (!url) return;
      result = applyFormat(textarea, "[", `](${url})`);
    } else {
      const start = textarea.selectionStart;
      const value = textarea.value;
      const newValue = value.slice(0, start) + "\n- " + value.slice(start);
      result = { newValue, cursorPos: start + 3 };
    }

    updateBlock(index, result.newValue);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(result.cursorPos, result.cursorPos);
    }, 0);
  };

  const validate = (): string | null => {
    if (!title.trim()) return "Please add a title.";
    if (!summary.trim()) return "Please add a summary.";
    if (summary.length > 500) return "Summary must be 500 characters or fewer.";
    if (blocks.length === 0) return "Add at least one content block.";
    const emptyBlock = blocks.find((b) => !b.content.trim());
    if (emptyBlock) return "Every block must have content — remove empty ones.";
    return null;
  };

  const handleSave = async (status: "draft" | "published") => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setIsSaving(true);
    try {
      if (postId) {
        await updateBlogPost(postId, { title, summary, blocks, status });
      } else {
        const created = await createBlogPost({ title, summary, blocks, status });
        // Apply pin state if toggled before first save
        if (isPinned) await pinBlogPost(created.id);
      }
      toast.success(status === "published" ? "Post published! 🎉" : "Draft saved.");
      onSaved();
      onClose();
    } catch (err: any) {
      const message = err?.response?.data?.detail || "Could not save this post.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const togglePin = async () => {
    if (!postId) {
      // New unsaved post — just toggle local state, applied on save
      setIsPinned((prev) => !prev);
      return;
    }
    try {
      if (isPinned) {
        await unpinBlogPost(postId);
        setIsPinned(false);
        toast.success("Post unpinned.");
      } else {
        await pinBlogPost(postId);
        setIsPinned(true);
        toast.success("Post pinned to top.");
      }
    } catch (err: any) {
      const message = err?.response?.data?.detail || "Could not update pin status.";
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="font-display text-lg font-bold text-foreground">
            {postId ? "Edit Post" : "New Blog Post"}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={togglePin}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isPinned ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {isPinned ? <Pin size={14} /> : <PinOff size={14} />}
              {isPinned ? "Pinned" : "Pin Post"}
            </button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Understanding Hair Porosity: A Complete Guide"
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-base font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Summary */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-foreground">Summary</label>
              <span className={`text-xs ${summary.length > 500 ? "text-destructive" : "text-muted-foreground"}`}>
                {summary.length}/500
              </span>
            </div>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value.slice(0, 500))}
              placeholder="A compelling summary — this is what shows on social media when shared, and at the top of the post."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Blocks */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Content</label>
            <div className="space-y-3">
              {blocks.map((block, index) => (
                <div key={index} className="border border-border rounded-xl p-3 bg-background/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                      <GripVertical size={14} />
                      {block.type === "image" ? "Image" : "Text"} block {index + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveBlock(index, -1)} disabled={index === 0}
                        className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors">
                        <ArrowUp size={14} className="text-muted-foreground" />
                      </button>
                      <button onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1}
                        className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors">
                        <ArrowDown size={14} className="text-muted-foreground" />
                      </button>
                      <button onClick={() => removeBlock(index)}
                        className="p-1 rounded hover:bg-destructive/10 transition-colors">
                        <Trash2 size={14} className="text-destructive" />
                      </button>
                    </div>
                  </div>

                  {block.type === "text" ? (
                    <>
                      <div className="flex items-center gap-1 mb-2">
                        <button onClick={() => handleTextFormat(index, "bold")}
                          className="p-1.5 rounded hover:bg-muted transition-colors" title="Bold">
                          <Bold size={14} className="text-foreground" />
                        </button>
                        <button onClick={() => handleTextFormat(index, "link")}
                          className="p-1.5 rounded hover:bg-muted transition-colors" title="Link">
                          <LinkIcon size={14} className="text-foreground" />
                        </button>
                        <button onClick={() => handleTextFormat(index, "bullet")}
                          className="p-1.5 rounded hover:bg-muted transition-colors" title="Bullet list">
                          <List size={14} className="text-foreground" />
                        </button>
                      </div>
                      <textarea
                        id={`block-textarea-${index}`}
                        value={block.content}
                        onChange={(e) => updateBlock(index, e.target.value)}
                        placeholder="Write this section... Use the toolbar above for bold, links, and bullet points."
                        rows={5}
                        className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none font-mono"
                      />
                    </>
                  ) : (
                    <div>
                      {block.content ? (
                        <div className="relative">
                          <img src={block.content} alt="" className="w-full max-h-64 object-cover rounded-lg" />
                          <button
                            onClick={() => updateBlock(index, "")}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center"
                          >
                            <X size={14} className="text-foreground" />
                          </button>
                          <label className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/90 text-xs font-medium cursor-pointer">
                            <input
                              type="checkbox"
                              checked={block.is_thumbnail}
                              onChange={() => setThumbnail(index)}
                              className="w-3.5 h-3.5"
                            />
                            Use as thumbnail
                          </label>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center gap-2 h-40 rounded-lg border-2 border-dashed border-border cursor-pointer hover:border-primary/40 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(index, file);
                            }}
                          />
                          {uploadingIndex === index ? (
                            <Loader2 size={24} className="animate-spin text-primary" />
                          ) : (
                            <>
                              <ImageIcon size={24} className="text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Click to upload image</span>
                            </>
                          )}
                        </label>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-3">
              <button onClick={addTextBlock}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors">
                <Type size={16} /> Add Text Block
              </button>
              <button onClick={addImageBlock}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors">
                <ImageIcon size={16} /> Add Image Block
              </button>
            </div>
          </div>

          {/* Save actions */}
          <div className="flex gap-2 pt-2 border-t border-border">
            <button
              onClick={() => handleSave("draft")}
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-60"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Save as Draft"}
            </button>
            <button
              onClick={() => handleSave("published")}
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : "Publish"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
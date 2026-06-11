import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Search, Star, TrendingUp, Sparkles, MapPin, Users,
  ShoppingBag, ShieldAlert, Plus, Loader2, X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { products as mockProducts, categories } from "@/data/mockMarketplace";
import { useAuthStore } from "@/stores/authStore";
import { getProducts, createProduct, type ApiProduct } from "@/lib/api";
import type { Product } from "@/data/mockMarketplace";
import { toast } from "sonner";

const sectionFilters = [
  { key: "trending", label: "Trending", icon: TrendingUp },
  { key: "new", label: "New Listings", icon: Sparkles },
  { key: "near", label: "Near You", icon: MapPin },
  { key: "twins", label: "From Your Hair Twins", icon: Users },
] as const;

// Transform API product into the shape ProductCard expects
const transformApiProduct = (p: ApiProduct): Product => ({
  id: p.id,
  name: p.title,
  price: p.price,
  currency: p.currency || "₦",
  images: p.media_urls.length > 0 ? p.media_urls : [""],
  category: p.category,
  description: p.description,
  seller: {
    id: p.seller.id,
    name: p.seller.name,
    avatar: p.seller.avatar || "",
    rating: p.seller.rating,
    completedOrders: p.seller.completed_orders,
    location: p.seller.location || "",
  },
  deliveryOptions: p.delivery_location ? [p.delivery_location] : ["Standard (3-5 days)"],
  tags: p.tags,
  isNew: p.is_new,
  isTrending: p.is_trending,
  fromHairTwin: false,
});

const ProductCard = ({ product, onClick }: { product: Product; onClick: () => void }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
    <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow group" onClick={onClick}>
      <div className="aspect-square overflow-hidden relative bg-muted">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag size={32} className="text-muted-foreground opacity-40" />
          </div>
        )}
        {product.isNew && (
          <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground text-[10px]">New</Badge>
        )}
        {product.isTrending && (
          <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px]">
            <TrendingUp size={10} className="mr-0.5" /> Trending
          </Badge>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs text-muted-foreground">{product.seller.name}</p>
        <h3 className="font-semibold text-sm line-clamp-2 mt-0.5 text-foreground">{product.name}</h3>
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-foreground">{product.currency}{product.price.toLocaleString()}</span>
          <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
            <Star size={12} className="fill-primary text-primary" />
            {product.seller.rating}
          </div>
        </div>
      </div>
    </Card>
  </motion.div>
);

// ── List Product Modal ────────────────────────────────────────────────────────
const CLOUDINARY_CLOUD = "dwfojbv0m";
const CLOUDINARY_PRESET = "jxuvhapr";

const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_PRESET);
  formData.append("folder", "termii/products");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) throw new Error("Image upload failed");
  const data = await response.json();
  return data.secure_url;
};

const ListProductModal = ({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (product: Product) => void;
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Other");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [tags, setTags] = useState("");
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Max 4 images
    const combined = [...imageFiles, ...files].slice(0, 4);
    setImageFiles(combined);

    // Generate previews
    combined.forEach((file, i) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => {
          const updated = [...prev];
          updated[i] = reader.result as string;
          return updated.slice(0, 4);
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !price || !description.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const parsedPrice = parseFloat(price.replace(/,/g, ""));
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error("Please enter a valid price.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1 — Upload all images to Cloudinary
      let mediaUrls: string[] = [];
      if (imageFiles.length > 0) {
        setUploadProgress(`Uploading ${imageFiles.length} image(s)...`);
        mediaUrls = await Promise.all(imageFiles.map(uploadToCloudinary));
        setUploadProgress("Saving product...");
      }

      // Step 2 — Create product in backend
      const result = await createProduct({
        title: title.trim(),
        description: description.trim(),
        price: parsedPrice,
        category,
        delivery_location: deliveryLocation.trim(),
        tags: tags.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean),
        media_urls: mediaUrls,
      });

      onSuccess(transformApiProduct(result));
      toast.success("Product listed successfully! 🎉");
      onClose();
    } catch {
      toast.error("Failed to list product. Please try again.");
    } finally {
      setIsSubmitting(false);
      setUploadProgress("");
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-display text-lg font-bold text-foreground">List a Product</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Product Images <span className="text-muted-foreground">(up to 4)</span>
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {imagePreviews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-background/80 flex items-center justify-center"
                  >
                    <X size={10} className="text-foreground" />
                  </button>
                </div>
              ))}
              {imagePreviews.length < 4 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/40 transition-colors bg-muted/30">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <Plus size={20} className="text-muted-foreground" />
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Product Name *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required
              placeholder="e.g. Shea Butter Cream 250ml"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Description *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required
              placeholder="Describe your product..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Price (₦) *</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required
                placeholder="e.g. 3500"
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                {categories.filter((c) => c !== "All").map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Delivery Location</label>
            <input value={deliveryLocation} onChange={(e) => setDeliveryLocation(e.target.value)}
              placeholder="e.g. Lagos Island, Nationwide"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Tags <span className="text-muted-foreground">(optional)</span>
            </label>
            <input value={tags} onChange={(e) => setTags(e.target.value)}
              placeholder="#shea-butter, #organic, #4C"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          {uploadProgress && (
            <p className="text-sm text-primary text-center animate-pulse">{uploadProgress}</p>
          )}

          <button type="submit" disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
            {isSubmitting
              ? <><Loader2 size={16} className="animate-spin" /> {uploadProgress || "Listing..."}</>
              : "List Product"
            }
          </button>
        </form>
      </motion.div>
    </div>
  );
};
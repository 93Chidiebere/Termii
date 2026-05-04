import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Heart, MessageCircle, ShoppingBag, Truck, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { products } from "@/data/mockMarketplace";
import { useToast } from "@/hooks/use-toast";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentImage, setCurrentImage] = useState(0);
  const [saved, setSaved] = useState(false);

  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <ShoppingBag size={48} className="mb-4 opacity-40" />
          <p className="font-medium text-lg">Product not found</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate("/marketplace")}>
            Back to Marketplace
          </Button>
        </div>
      </AppLayout>
    );
  }

  const nextImage = () => setCurrentImage((i) => (i + 1) % product.images.length);
  const prevImage = () => setCurrentImage((i) => (i - 1 + product.images.length) % product.images.length);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto pb-24 md:pb-8">
        {/* Back Button */}
        <div className="px-4 py-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft size={18} />
            Back
          </button>
        </div>

        {/* Image Carousel */}
        <div className="relative aspect-square bg-muted overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImage}
              src={product.images[currentImage]}
              alt={product.name}
              className="w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          </AnimatePresence>

          {product.images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-foreground hover:bg-background transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-foreground hover:bg-background transition-colors"
              >
                <ChevronRight size={18} />
              </button>

              {/* Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {product.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === currentImage ? "bg-primary" : "bg-background/60"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="px-4 pt-4">
          {/* Price & Title */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">{product.name}</h1>
              <p className="text-2xl font-bold text-primary mt-1">
                {product.currency}{product.price.toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => {
                setSaved(!saved);
                toast({ title: saved ? "Removed from saved" : "Saved!", duration: 1500 });
              }}
              className="mt-1"
            >
              <Heart
                size={24}
                className={saved ? "fill-destructive text-destructive" : "text-muted-foreground"}
              />
            </button>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {product.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px]">
                #{tag}
              </Badge>
            ))}
          </div>

          <Separator className="my-4" />

          {/* Seller */}
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-3 w-full text-left hover:bg-muted/50 rounded-lg p-2 -ml-2 transition-colors"
          >
            <Avatar className="h-11 w-11">
              <AvatarImage src={product.seller.avatar} />
              <AvatarFallback>{product.seller.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-sm text-foreground">{product.seller.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <Star size={11} className="fill-primary text-primary" />
                  {product.seller.rating}
                </span>
                <span>·</span>
                <span>{product.seller.completedOrders} orders</span>
                <span>·</span>
                <span>{product.seller.location}</span>
              </div>
            </div>
          </button>

          <Separator className="my-4" />

          {/* Description */}
          <div>
            <h2 className="font-semibold text-sm text-foreground mb-2">Description</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          </div>

          <Separator className="my-4" />

          {/* Delivery */}
          <div>
            <h2 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-1.5">
              <Truck size={15} /> Delivery Options
            </h2>
            <div className="space-y-1.5">
              {product.deliveryOptions.map((opt) => (
                <p key={opt} className="text-sm text-muted-foreground">• {opt}</p>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-2.5">
            <Button
              className="w-full"
              onClick={() => toast({ title: "Added to cart!", description: product.name, duration: 2000 })}
            >
              <ShoppingBag size={16} className="mr-1.5" />
              Buy Now
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/messages")}
            >
              <MessageCircle size={16} className="mr-1.5" />
              Message Seller
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProductDetail;

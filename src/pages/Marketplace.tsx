import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, Star, TrendingUp, Sparkles, MapPin, Users, ShoppingBag, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { products, categories, type Product } from "@/data/mockMarketplace";
import { useAuthStore } from "@/stores/authStore";

const sectionFilters = [
  { key: "trending", label: "Trending", icon: TrendingUp },
  { key: "new", label: "New Listings", icon: Sparkles },
  { key: "near", label: "Near You", icon: MapPin },
  { key: "twins", label: "From Your Hair Twins", icon: Users },
] as const;

const ProductCard = ({ product, onClick }: { product: Product; onClick: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
      onClick={onClick}
    >
      <div className="aspect-square overflow-hidden relative">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
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
          <span className="font-bold text-foreground">
            {product.currency}{product.price.toLocaleString()}
          </span>
          <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
            <Star size={12} className="fill-primary text-primary" />
            {product.seller.rating}
          </div>
        </div>
      </div>
    </Card>
  </motion.div>
);

const Marketplace = () => {
  const navigate = useNavigate();
  const { isMinor } = useAuthStore();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.seller.name.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

    const matchCategory = activeCategory === "All" || p.category === activeCategory;

    const matchSection =
      !activeSection ||
      (activeSection === "trending" && p.isTrending) ||
      (activeSection === "new" && p.isNew) ||
      (activeSection === "near" && true) ||
      (activeSection === "twins" && p.fromHairTwin);

    return matchSearch && matchCategory && matchSection;
  });

  if (isMinor) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={32} className="text-muted-foreground" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground mb-2">Access Restricted</h1>
          <p className="text-sm text-muted-foreground mb-6">
            The Marketplace is only available to members aged 16 and above.
          </p>
          <Link to="/feed" className="text-sm text-primary font-semibold hover:underline">
            ← Back to Feed
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-4 pb-24 md:pb-8">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag size={24} className="text-primary" />
          <h1 className="text-xl font-display font-bold text-foreground">Marketplace</h1>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products, sellers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Section Filters */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
          {sectionFilters.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(activeSection === key ? null : key)}
              className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                activeSection === key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => navigate(`/product/${product.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <ShoppingBag size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No products found</p>
            <p className="text-sm mt-1">Try a different search or category</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Marketplace;

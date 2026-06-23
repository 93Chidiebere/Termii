import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const FloatingCreateButton = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Always show near the top of the page
      if (currentScrollY < 50) {
        setVisible(true);
      } else if (currentScrollY > lastScrollY.current) {
        // Scrolling down — hide
        setVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        // Scrolling up — show
        setVisible(true);
      }

      lastScrollY.current = currentScrollY;

      // Reappear after scrolling stops, matching X's behavior
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => setVisible(true), 1200);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={() => navigate("/create")}
          aria-label="Create post"
          className="md:hidden fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        >
          <Plus size={26} strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>
  );
};
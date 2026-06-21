import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const SplashScreen = () => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShow(false), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex"
        >
          {/* Left panel */}
          <motion.div
            initial={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="w-1/2 bg-primary flex items-center justify-end pr-4 sm:pr-8"
          >
            <div className="text-right">
              <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground leading-tight">
                Termii Africa
              </h1>
              <p className="font-display text-sm sm:text-lg lg:text-xl text-primary-foreground/90 mt-1 sm:mt-2">
                Your Hair, Your Pride
              </p>
            </div>
          </motion.div>

          {/* Right panel */}
          <motion.div
            initial={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="w-1/2 bg-warm-brown flex items-center justify-start pl-4 sm:pl-8"
            style={{ backgroundColor: "hsl(var(--warm-brown))" }}
          >
            <p className="font-display italic text-sm sm:text-lg lg:text-xl text-cream" style={{ color: "hsl(var(--cream))" }}>
              formerly Isi Ngala
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

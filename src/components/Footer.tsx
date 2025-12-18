import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "@/assets/spaark-logo.png";

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border mt-20">
      <div className="container mx-auto px-4 py-6 sm:py-12">
        {/* Mobile: 2x2 grid, Desktop: 4 columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
          {/* Logo & Description - spans full width on mobile */}
          <motion.div 
            className="col-span-2 md:col-span-1"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.div 
              className="flex items-center gap-2 mb-3 sm:mb-4 group cursor-pointer"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div 
                className="bg-white/90 p-1 sm:p-1.5 rounded-lg shadow-md"
                whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                transition={{ duration: 0.5 }}
              >
                <img src={logo} alt="Spaark Logo" className="h-5 w-5 sm:h-6 sm:w-6 object-contain" />
              </motion.div>
              <span className="text-lg sm:text-2xl font-bold text-foreground">Spaark</span>
            </motion.div>
            <p className="text-xs sm:text-sm text-muted-foreground">Connecting hearts, creating meaningful relationships.</p>
          </motion.div>

          {/* Company */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="font-semibold text-sm sm:text-base mb-2 sm:mb-4 text-foreground">Company</h3>
            <ul className="space-y-1 sm:space-y-2">
              <li>
                <Link to="/about" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="font-semibold text-sm sm:text-base mb-2 sm:mb-4 text-foreground">Support</h3>
            <ul className="space-y-1 sm:space-y-2">
              <li>
                <Link to="/faq" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/safety" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
                  Safety Tips
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Legal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="font-semibold text-sm sm:text-base mb-2 sm:mb-4 text-foreground">Legal</h3>
            <ul className="space-y-1 sm:space-y-2">
              <li>
                <Link to="/privacy" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </motion.div>
        </div>

        <motion.div 
          className="border-t border-border mt-6 sm:mt-8 pt-4 sm:pt-8 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-[10px] sm:text-sm text-muted-foreground px-2">
            © 2025 Spaark. All rights reserved. Made with{" "}
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="inline-block"
            >
              <Heart className="h-3 w-3 inline text-primary fill-primary" />
            </motion.span>{" "}
            by Saurabh Sharma, Aakanksha Singh & Mandhata Singh
          </p>
        </motion.div>
      </div>
    </footer>
  );
};

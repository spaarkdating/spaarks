import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "@/assets/spaark-logo.png";

// Social media icons as simple SVG components
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

export const Footer = () => {
  const socialLinks = [
    { icon: InstagramIcon, href: "https://www.instagram.com/spaark_dating", label: "Instagram" },
    { icon: TwitterIcon, href: "https://x.com/spaark_dating", label: "X (Twitter)" },
    { icon: FacebookIcon, href: "https://www.facebook.com/profile.php?id=spaark_dating", label: "Facebook" },
    { icon: LinkedInIcon, href: "https://www.linkedin.com/company/spaark", label: "LinkedIn" },
  ];
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

        {/* Social Media Links */}
        <motion.div
          className="border-t border-border mt-6 sm:mt-8 pt-4 sm:pt-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex justify-center gap-4 mb-4">
            {socialLinks.map((social, idx) => (
              <motion.a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-muted hover:bg-primary/20 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + idx * 0.1 }}
                aria-label={social.label}
              >
                <social.icon />
              </motion.a>
            ))}
          </div>
          <p className="text-[10px] sm:text-sm text-muted-foreground px-2 text-center">
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

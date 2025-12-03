import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/spaark-logo.png";

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border mt-20">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4 group cursor-pointer">
              <div className="bg-white/90 p-1.5 rounded-lg shadow-md">
                <img src={logo} alt="Spaark Logo" className="h-6 w-6 object-contain" />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-white">Spaark</span>
            </div>
            <p className="text-sm text-muted-foreground">Connecting hearts, creating meaningful relationships.</p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/faq" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/safety" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Safety Tips
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-xs sm:text-sm text-muted-foreground px-2">
            © 2025 Spaark. All rights reserved. Made with{" "}
            <Heart className="h-3 w-3 inline text-primary fill-primary" /> by Saurabh Sharma, Aakanksha Singh & Mandhata
            Singh
          </p>
        </div>
      </div>
    </footer>
  );
};

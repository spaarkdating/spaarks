import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  error?: string;
  success?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField = ({ label, error, success, children, className }: FormFieldProps) => {
  return (
    <div className={cn("space-y-2", className)}>
      <motion.label
        className="text-sm font-medium text-foreground flex items-center gap-2"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {label}
        <AnimatePresence mode="wait">
          {success && (
            <motion.div
              key="success"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <CheckCircle className="h-4 w-4 text-green-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.label>
      
      {children}
      
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key="error"
            className="flex items-center gap-2 text-sm text-destructive"
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <AlertCircle className="h-4 w-4" />
            </motion.div>
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {error}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

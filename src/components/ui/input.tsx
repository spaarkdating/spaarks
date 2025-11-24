import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);

    return (
      <div className="relative">
        <input
          type={type}
          className={cn(
            "flex h-12 w-full rounded-lg border-2 border-input bg-background px-4 py-3 text-base ring-offset-background",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
            "placeholder:text-muted-foreground/60 placeholder:transition-opacity",
            "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-all duration-300 ease-out",
            "hover:border-primary/50 hover:shadow-sm",
            isFocused && "border-primary shadow-[0_0_0_4px_rgba(var(--primary),0.1)]",
            hasValue && "border-primary/70",
            className,
          )}
          ref={ref}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          onChange={(e) => {
            setHasValue(e.target.value.length > 0);
            props.onChange?.(e);
          }}
          {...props}
        />
        
        {/* Focus indicator line */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary via-accent to-primary-glow"
          initial={{ width: "0%", opacity: 0 }}
          animate={{
            width: isFocused ? "100%" : "0%",
            opacity: isFocused ? 1 : 0,
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />

        {/* Typing indicator dots */}
        {isFocused && hasValue && (
          <motion.div
            className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-primary"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };

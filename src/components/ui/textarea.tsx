import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [hasValue, setHasValue] = React.useState(false);

  return (
    <div className="relative">
      <textarea
        className={cn(
          "flex min-h-[120px] w-full rounded-lg border-2 border-input bg-background px-4 py-3 text-base ring-offset-background",
          "placeholder:text-muted-foreground/60 placeholder:transition-opacity",
          "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-all duration-300 ease-out resize-none",
          "hover:border-primary/50 hover:shadow-sm",
          isFocused && "border-primary shadow-[0_0_0_4px_rgba(var(--primary),0.1)]",
          hasValue && "border-primary/70",
          className,
        )}
        ref={ref}
        onFocus={(e) => {
          setIsFocused(true);
          if (props.onFocus) props.onFocus(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          if (props.onBlur) props.onBlur(e);
        }}
        onChange={(e) => {
          setHasValue(e.target.value.length > 0);
          if (props.onChange) props.onChange(e);
        }}
        {...props}
      />
      
      {/* Focus indicator line */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary via-accent to-primary-glow rounded-full"
        initial={{ width: "0%", opacity: 0 }}
        animate={{
          width: isFocused ? "100%" : "0%",
          opacity: isFocused ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />

      {/* Character count animation */}
      {isFocused && props.maxLength && (
        <motion.div
          className="absolute bottom-2 right-3 text-xs text-muted-foreground"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.span
            animate={{
              color:
                (props.value?.toString().length || 0) > props.maxLength * 0.9
                  ? "hsl(var(--destructive))"
                  : "hsl(var(--muted-foreground))",
            }}
          >
            {props.value?.toString().length || 0}/{props.maxLength}
          </motion.span>
        </motion.div>
      )}
    </div>
  );
});
Textarea.displayName = "Textarea";

export { Textarea };

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-body text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 rounded-full",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl",
        outline: "border-2 border-primary bg-transparent text-primary hover:bg-primary/10 hover:border-primary-light rounded-full",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-full shadow-sm hover:shadow-md",
        ghost: "hover:bg-accent/50 hover:text-accent-foreground rounded-xl",
        link: "text-primary underline-offset-4 hover:underline",
        glow: "bg-gradient-to-r from-primary to-primary-light text-primary-foreground shadow-lg hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-1 active:translate-y-0 rounded-full border-0",
        magnetic: "relative bg-card text-foreground border border-border/50 hover:border-primary/50 rounded-2xl overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/10 before:to-accent/10 before:translate-x-[-100%] hover:before:translate-x-0 before:transition-transform before:duration-500",
        pill: "bg-gradient-to-r from-primary via-primary-light to-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-100 bg-[length:200%_100%] hover:bg-right transition-all duration-500",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-full px-4 text-xs",
        lg: "h-14 px-10 text-base",
        xl: "h-16 px-12 text-lg font-semibold",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

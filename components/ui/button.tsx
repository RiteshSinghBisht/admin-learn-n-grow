import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium tracking-[-0.01em] ring-offset-background transition-[transform,box-shadow,background-color,color,border-color,opacity] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.985] disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        default:
          "bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(219_95%_66%)_100%)] text-primary-foreground shadow-[0_14px_28px_-16px_rgba(37,99,235,0.9)] hover:brightness-110 hover:shadow-[0_20px_38px_-18px_rgba(37,99,235,0.85)]",
        destructive:
          "bg-[linear-gradient(135deg,hsl(var(--destructive))_0%,hsl(0_83%_64%)_100%)] text-destructive-foreground shadow-[0_14px_28px_-16px_rgba(220,38,38,0.7)] hover:brightness-105",
        outline:
          "glass-card border-border/85 bg-white/55 text-foreground hover:bg-white/75 dark:border-white/15 dark:bg-white/[0.08] dark:hover:bg-white/[0.14]",
        secondary:
          "border border-border/80 bg-secondary/70 text-secondary-foreground shadow-[0_10px_22px_-18px_rgba(15,23,42,0.5)] hover:bg-secondary/90 dark:border-white/15",
        ghost: "text-foreground/80 hover:bg-accent/75 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
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
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

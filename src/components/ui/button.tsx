import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-navy-900 text-white hover:bg-navy-800 shadow-soft hover:shadow-navy-glow",
        orange:
          "bg-spotorange-500 text-white hover:bg-spotorange-600 shadow-orange-glow hover:scale-[1.02] active:scale-100",
        outline:
          "border-2 border-navy-900 bg-transparent text-navy-900 hover:bg-navy-900 hover:text-white",
        ghost:
          "bg-transparent text-navy-900 hover:bg-navy-50",
        soft:
          "bg-navy-50 text-navy-900 hover:bg-navy-100",
        link: "text-navy-900 underline-offset-4 hover:underline",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        // legacy aliases pra não quebrar telas internas que ainda usam:
        gradient:
          "bg-spotorange-500 text-white hover:bg-spotorange-600 shadow-orange-glow hover:scale-[1.02]",
        glass:
          "bg-white border border-ink-200 text-navy-900 hover:bg-navy-50 shadow-soft",
      },
      size: {
        sm: "h-9 rounded-md px-3 text-xs",
        default: "h-11 px-5 py-2.5",
        lg: "h-12 rounded-lg px-7 text-base",
        xl: "h-14 rounded-xl px-8 text-base font-bold",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
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

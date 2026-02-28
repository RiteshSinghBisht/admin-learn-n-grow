import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border border-border/85 bg-white/55 px-3.5 py-2 text-sm ring-offset-background backdrop-blur-xl file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/85 transition-[border-color,box-shadow,background-color] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/65 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:border-border focus-visible:bg-white/70 disabled:cursor-not-allowed disabled:opacity-55 dark:border-white/15 dark:bg-white/[0.05] dark:focus-visible:bg-white/[0.1] resize-none",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };

import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // text-base below md prevents iOS zoom-on-focus; 14px from md up
          "flex h-9 w-full rounded-lg border border-input bg-card px-3 py-1.5 text-base shadow-xs md:text-sm",
          "transition-[border-color,box-shadow,background-color] duration-150 ease-out-expo",
          "placeholder:text-muted-foreground/70 hover:border-foreground/20",
          "focus-visible:border-ring/60 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/15",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };

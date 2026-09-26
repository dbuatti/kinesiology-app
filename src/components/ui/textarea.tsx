import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border border-input bg-card px-3 py-2 text-base leading-relaxed shadow-xs md:text-sm",
          "transition-[border-color,box-shadow] duration-150 ease-out-expo",
          "placeholder:text-muted-foreground/70 hover:border-foreground/20",
          "focus-visible:border-ring/60 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/15",
          "disabled:cursor-not-allowed disabled:opacity-50",
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

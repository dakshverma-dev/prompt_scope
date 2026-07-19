import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn("inline-flex items-center justify-center rounded-lg transition focus:outline-none focus:ring-2 focus:ring-violet-400/70 disabled:opacity-50", className)} {...props} />;
}

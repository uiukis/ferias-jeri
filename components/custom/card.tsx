import * as React from "react";
import {
  Card as UiCard,
  CardHeader as UiCardHeader,
  CardTitle as UiCardTitle,
  CardDescription as UiCardDescription,
  CardContent as UiCardContent,
  CardFooter as UiCardFooter,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const Card = UiCard;
export const CardHeader = UiCardHeader;
export const CardTitle = UiCardTitle;
export const CardDescription = UiCardDescription;
export const CardContent = UiCardContent;
export const CardFooter = UiCardFooter;

export function FloatingCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl bg-primary shadow-lg ring-1 ring-black/5", className)}
      {...props}
    />
  );
}


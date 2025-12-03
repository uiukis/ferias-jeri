"use client";
import { Button as UiButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import Link from "next/link";
import * as React from "react";

export type ButtonProps = React.ComponentProps<typeof UiButton>;

export function Button(props: ButtonProps) {
  return <UiButton {...props} />;
}

export function PrimaryButton({ className, ...props }: ButtonProps) {
  return <UiButton variant="default" className={cn(className)} {...props} />;
}

export function OutlineButton({ className, ...props }: ButtonProps) {
  return <UiButton variant="outline" className={cn(className)} {...props} />;
}

export function GhostButton({ className, ...props }: ButtonProps) {
  return <UiButton variant="ghost" className={cn(className)} {...props} />;
}

export function CtaButton({
  children = "Criar Voucher",
  className,
  href,
  ...props
}: ButtonProps & { children?: React.ReactNode; href?: string }) {
  const content = (
    <UiButton
      {...props}
      className={cn(
        "rounded-full bg-accent p-6 gap-2 text-accent-foreground shadow-lg hover:bg-accent/90",
        "text-base font-semibold",
        className
      )}
    >
      <Plus className="h-5 w-5" />
      <span>{children}</span>
    </UiButton>
  );
  if (href)
    return (
      <Link href={href} className="inline-block">
        {content}
      </Link>
    );
  return content;
}

"use client";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import * as React from "react";

type Props = {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
};

export default function CtaButton({ children = "Criar Voucher", className, onClick, href }: Props) {
  const content = (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-accent-foreground shadow-lg transition-transform hover:scale-[1.02]",
        className
      )}
    >
      <Plus className="h-5 w-5" />
      <span className="text-base font-semibold">{children}</span>
    </button>
  );
  if (href) {
    return (
      <a href={href} className="inline-block">
        {content}
      </a>
    );
  }
  return content;
}


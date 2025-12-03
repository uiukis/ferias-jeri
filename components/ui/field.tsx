"use client";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import * as React from "react";

type Props = {
  label: string;
  className?: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
};

export default function Field({
  label,
  className,
  htmlFor,
  error,
  children,
}: Props) {
  return (
    <div className={`space-y-1 ${className}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: error ? 1 : 0, height: error ? "auto" : 0 }}
        transition={{ duration: 0.2 }}
        className="text-xs text-destructive"
      >
        {error}
      </motion.div>
    </div>
  );
}

"use client";
import { Input as UiInput } from "@/components/ui/input";
import * as React from "react";

export type InputProps = React.ComponentProps<typeof UiInput>;

export function Input(props: InputProps) {
  return <UiInput {...props} />;
}

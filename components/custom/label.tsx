"use client";
import { Label as UiLabel } from "@/components/ui/label";
import * as React from "react";

export type LabelProps = React.ComponentProps<typeof UiLabel>;

export function Label(props: LabelProps) {
  return <UiLabel {...props} />;
}

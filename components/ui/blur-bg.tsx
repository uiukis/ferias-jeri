"use client";
import Image from "next/image";

type Props = {
  src: string;
  alt?: string;
  overlay?: boolean;
};

export default function BlurBg({ src, alt = "", overlay = true }: Props) {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <Image
        src={src}
        alt={alt}
        fill
        priority
        sizes="100vw"
        className="object-cover blur-md md:blur-lg scale-105"
      />
      {overlay && <div className="absolute inset-0 bg-black/30" />}
    </div>
  );
}

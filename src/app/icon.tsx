import { ImageResponse } from "next/og";
import { AppIconContent } from "@/lib/brand/appIcon";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <AppIconContent borderRadius={112} iconSize={320} />,
    { ...size }
  );
}

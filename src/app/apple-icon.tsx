import { ImageResponse } from "next/og";
import { AppIconContent } from "@/lib/brand/appIcon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <AppIconContent borderRadius={40} iconSize={112} />,
    { ...size }
  );
}

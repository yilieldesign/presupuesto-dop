import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #007aff 0%, #0051d4 100%)",
          borderRadius: 112,
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: 148,
            fontWeight: 700,
            letterSpacing: -4,
          }}
        >
          RD$
        </div>
      </div>
    ),
    { ...size }
  );
}

import { ImageResponse } from "next/og";

export const alt = "Assessoria Alpha — Marketing Gastronômico para Restaurantes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0A0A0A",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 80px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "#F5A623",
            display: "flex",
          }}
        />

        <div
          style={{
            color: "#F5A623",
            fontSize: 22,
            fontWeight: "bold",
            letterSpacing: "0.25em",
            marginBottom: 36,
            display: "flex",
          }}
        >
          ASSESSORIA ALPHA
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            marginBottom: 52,
          }}
        >
          <span
            style={{
              color: "#FFFFFF",
              fontSize: 64,
              fontWeight: "bold",
              lineHeight: 1.1,
              display: "flex",
            }}
          >
            MARKETING GASTRONÔMICO
          </span>
          <span
            style={{
              color: "#F5A623",
              fontSize: 64,
              fontWeight: "bold",
              lineHeight: 1.1,
              display: "flex",
            }}
          >
            PARA RESTAURANTES
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: 28,
            alignItems: "center",
          }}
        >
          <span style={{ color: "#FFFFFF", fontSize: 20, display: "flex" }}>
            +600 CLIENTES ATIVOS
          </span>
          <span style={{ color: "#F5A623", fontSize: 20, display: "flex" }}>•</span>
          <span style={{ color: "#FFFFFF", fontSize: 20, display: "flex" }}>
            +500M EM VENDAS GERADAS
          </span>
          <span style={{ color: "#F5A623", fontSize: 20, display: "flex" }}>•</span>
          <span style={{ color: "#FFFFFF", fontSize: 20, display: "flex" }}>
            +5 ANOS DE EXPERIÊNCIA
          </span>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "#F5A623",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  );
}

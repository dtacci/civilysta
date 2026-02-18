"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";

interface QRCodeGeneratorProps {
  text: string;
  size?: number;
  foregroundColor?: string;
  backgroundColor?: string;
  onGenerated?: (dataUrl: string) => void;
}

export function QRCodeGenerator({
  text,
  size = 256,
  foregroundColor = "#000000",
  backgroundColor = "#ffffff",
  onGenerated,
}: QRCodeGeneratorProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!text.trim()) {
      setQrDataUrl("");
      return;
    }

    setIsGenerating(true);

    const generate = async () => {
      try {
        const opts = {
          width: size,
          margin: 4,
          color: { dark: foregroundColor, light: backgroundColor },
          errorCorrectionLevel: "M" as const,
        };

        const dataUrl = await QRCode.toDataURL(text, opts);
        setQrDataUrl(dataUrl);
        onGenerated?.(dataUrl);

        if (canvasRef.current) {
          await QRCode.toCanvas(canvasRef.current, text, opts);
        }
      } catch {
        setQrDataUrl("");
      } finally {
        setIsGenerating(false);
      }
    };

    generate();
  }, [text, size, foregroundColor, backgroundColor, onGenerated]);

  const downloadPNG = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `qr-code-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  const downloadSVG = async () => {
    if (!text.trim()) return;
    try {
      const svgString = await QRCode.toString(text, {
        type: "svg",
        width: size,
        margin: 4,
        color: { dark: foregroundColor, light: backgroundColor },
      });
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `qr-code-${Date.now()}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center space-y-4">
        {isGenerating ? (
          <div className="flex h-64 w-64 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted">
            <div className="text-center text-muted-foreground">
              <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-foreground" />
              <p className="text-sm">Generating QR Code...</p>
            </div>
          </div>
        ) : qrDataUrl ? (
          <div className="space-y-2">
            <img
              src={qrDataUrl}
              alt="QR Code"
              className="rounded-lg border shadow-sm"
              style={{ width: size, height: size }}
            />
          </div>
        ) : (
          <div className="flex h-64 w-64 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted">
            <p className="text-sm text-muted-foreground">
              Enter text to generate QR code
            </p>
          </div>
        )}
      </div>

      {qrDataUrl && (
        <div className="flex justify-center gap-2">
          <button
            onClick={downloadPNG}
            className="rounded bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Download PNG
          </button>
          <button
            onClick={downloadSVG}
            className="rounded bg-secondary px-3 py-1 text-xs text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Download SVG
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        style={{ display: "none" }}
        width={size}
        height={size}
      />
    </div>
  );
}

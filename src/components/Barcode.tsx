"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeProps {
  value: string;
  width?: number;
  height?: number;
  fontSize?: number;
  margin?: number;
  displayValue?: boolean;
  background?: string;
  lineColor?: string;
  className?: string;
  textMargin?: number;
}

// Форматирует строку EAN-13 в виде "X XXXXXX XXXXXX"
function formatEAN13(code: string): string {
  if (code.length !== 13) return code;
  return `${code.substring(0, 1)} ${code.substring(1, 7)} ${code.substring(7)}`;
}

export default function Barcode({
  value,
  width = 2,
  height = 80,
  fontSize = 15,
  margin = 10,
  displayValue = true,
  background = "#ffffff",
  lineColor = "#000000",
  className = "",
  textMargin = 8,
}: BarcodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      try {
        JsBarcode(canvasRef.current, value, {
          format: "EAN13",
          width,
          height,
          displayValue,
          fontSize,
          margin,
          background,
          lineColor,
        });

        if (displayValue && value.length === 13 && canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");

          if (ctx) {
            const textY = height + margin + textMargin;
            const canvasWidth = canvas.width;

            ctx.fillStyle = background;
            ctx.fillRect(
              0,
              height + margin - fontSize,
              canvasWidth,
              fontSize * 2
            );

            ctx.fillStyle = lineColor;
            ctx.textBaseline = "top";
            ctx.font = `${fontSize}px monospace`;
            ctx.textAlign = "center";

            const formattedText = formatEAN13(value);
            ctx.fillText(formattedText, canvasWidth / 2, textY);
          }
        }
      } catch (error) {
        console.error("Ошибка при создании штрих-кода:", error);
      }
    }
  }, [
    value,
    width,
    height,
    fontSize,
    margin,
    displayValue,
    background,
    lineColor,
    textMargin,
  ]);

  return <canvas ref={canvasRef} className={className} />;
}

import React from "react";
import { strokeStyleType, FontSizeType } from "@/config/type";
import { Button } from "./Button";

interface PropertiesPanelProps {
  strokeColor: string;
  setStrokeColor: (color: string) => void;
  bgColor: string;
  setBgColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  strokeStyle: strokeStyleType;
  setStrokeStyle: (style: strokeStyleType) => void;
  opacity: number;
  setOpacity: (opacity: number) => void;
  activeTool: string;
}

export function PropertiesPanel({
  strokeColor,
  setStrokeColor,
  bgColor,
  setBgColor,
  strokeWidth,
  setStrokeWidth,
  strokeStyle,
  setStrokeStyle,
  opacity,
  setOpacity,
  activeTool,
}: PropertiesPanelProps) {
  if (activeTool === "select" || activeTool === "pointer" || activeTool === "eraser") {
    return null;
  }

  const colors = [
    "#d3d3d3", // Light Gray
    "#ff7976", // Red
    "#308e40", // Green
    "#589be1", // Blue
    "#af5900", // Orange
  ];

  const bgColors = [
    "transparent",
    "#1a1b1e",
    "#121212",
    "#325252",
    "#54658a",
    "#8a5460",
  ];

  return (
    <div className="fixed top-20 left-4 z-40 w-64">
      <div className="glass-panel p-4 rounded-xl shadow-xl flex flex-col gap-4">
        {/* Stroke Color */}
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] mb-2 block">Stroke</label>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                className={`w-6 h-6 rounded-full border border-white/10 transition-transform hover:scale-110 ${
                  strokeColor === c ? "ring-2 ring-blue-500" : ""
                }`}
                style={{ backgroundColor: c }}
                onClick={() => setStrokeColor(c)}
              />
            ))}
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className="w-6 h-6 rounded-full overflow-hidden border-none p-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Background Color */}
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] mb-2 block">Background</label>
          <div className="flex flex-wrap gap-2">
            {bgColors.map((c) => (
              <button
                key={c}
                className={`w-6 h-6 rounded-full border border-white/10 transition-transform hover:scale-110 ${
                  bgColor === c ? "ring-2 ring-blue-500" : ""
                } ${c === "transparent" ? "bg-red-500/20 relative overflow-hidden" : ""}`}
                style={{ backgroundColor: c === "transparent" ? "transparent" : c }}
                onClick={() => setBgColor(c)}
              >
                {c === "transparent" && (
                   <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-full h-[1px] bg-red-500 rotate-45"></div>
                   </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Stroke Width */}
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] mb-2 block">Stroke Width</label>
          <div className="flex gap-2">
            {[1, 2, 3].map((w) => (
              <Button
                key={w}
                variant={strokeWidth === w ? "primary" : "secondary"}
                size="sm"
                onClick={() => setStrokeWidth(w)}
                className="flex-1"
              >
                {w === 1 ? "Thin" : w === 2 ? "Bold" : "Extra"}
              </Button>
            ))}
          </div>
        </div>

        {/* Stroke Style */}
        {activeTool !== "text" && (
          <div>
            <label className="text-xs font-medium text-[var(--color-muted)] mb-2 block">Style</label>
            <div className="flex gap-2">
              {(["simple", "rough", "dense"] as const).map((s) => (
                <Button
                  key={s}
                  variant={strokeStyle === s ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setStrokeStyle(s)}
                  className="flex-1 capitalize"
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

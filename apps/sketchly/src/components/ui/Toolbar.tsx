import React from "react";
import {
  MousePointer,
  Pointer,
  RectangleHorizontal,
  Diamond,
  Circle,
  Minus,
  Pencil,
  MoveRight,
  Type,
  Eraser,
} from "lucide-react";
import { Button } from "./Button";
import { Tooltip } from "./Tooltip";
import { Shapes } from "@/config/type";

interface ToolbarProps {
  activeTool: Shapes;
  onToolChange: (tool: Shapes) => void;
}

export function Toolbar({ activeTool, onToolChange }: ToolbarProps) {
  const tools: { id: Shapes; icon: React.ReactNode; label: string; shortcut: string }[] = [
    { id: "select", icon: <MousePointer size={20} />, label: "Selection", shortcut: "1" },
    { id: "pointer", icon: <Pointer size={20} />, label: "Pointer", shortcut: "2" },
    { id: "rect", icon: <RectangleHorizontal size={20} />, label: "Rectangle", shortcut: "3" },
    { id: "diamond", icon: <Diamond size={20} />, label: "Diamond", shortcut: "4" },
    { id: "ellipse", icon: <Circle size={20} />, label: "Ellipse", shortcut: "5" },
    { id: "line", icon: <Minus size={20} />, label: "Line", shortcut: "6" },
    { id: "pencil", icon: <Pencil size={20} />, label: "Draw", shortcut: "7" },
    { id: "arrow", icon: <MoveRight size={20} />, label: "Arrow", shortcut: "8" },
    { id: "text", icon: <Type size={20} />, label: "Text", shortcut: "9" },
    { id: "eraser", icon: <Eraser size={20} />, label: "Eraser", shortcut: "0" },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="glass-panel p-2 rounded-2xl flex items-center gap-1 shadow-2xl">
        {tools.map((tool) => (
          <Tooltip key={tool.id} content={`${tool.label} (${tool.shortcut})`}>
            <Button
              variant="icon"
              size="icon"
              isActive={activeTool === tool.id}
              onClick={() => onToolChange(tool.id)}
              className="rounded-xl"
            >
              {tool.icon}
            </Button>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}

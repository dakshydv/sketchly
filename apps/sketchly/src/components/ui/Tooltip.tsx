import React, { useState } from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ content, children, side = "top" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: "-top-10 left-1/2 -translate-x-1/2",
    bottom: "-bottom-10 left-1/2 -translate-x-1/2",
    left: "-left-2 top-1/2 -translate-y-1/2 -translate-x-full",
    right: "-right-2 top-1/2 -translate-y-1/2 translate-x-full",
  };

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 px-2 py-1 text-xs font-medium text-white bg-black/80 rounded shadow-sm whitespace-nowrap pointer-events-none ${positions[side]}`}
        >
          {content}
        </div>
      )}
    </div>
  );
}

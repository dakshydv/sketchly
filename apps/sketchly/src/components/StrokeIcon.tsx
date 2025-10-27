import { Minus } from "lucide-react";

export function StrokeIcon({
    strokeWidth,
    theme,
    onClick
}: {
    strokeWidth: number,
    theme: string,
    onClick: () => void
}) {
  return <div onClick={onClick} className={`w-8 h-7 flex items-center justify-center hover:cursor-pointer rounded-sm ${theme}`}>
    <Minus size={20} strokeWidth={strokeWidth} />
  </div>;
}

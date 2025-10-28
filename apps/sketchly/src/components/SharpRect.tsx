import { IconBorderCornerSquare } from "@tabler/icons-react";

export function SharpRect({
  theme,
  onClick,
}: {
  theme: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`w-8 h-7 flex items-center justify-center hover:cursor-pointer rounded-sm ${theme}`}
    >
      <IconBorderCornerSquare />
    </div>
  );
}

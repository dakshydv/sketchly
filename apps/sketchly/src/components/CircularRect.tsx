import { IconBorderCornerRounded } from "@tabler/icons-react";

export function CircularRect({
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
      <IconBorderCornerRounded />
    </div>
  );
}

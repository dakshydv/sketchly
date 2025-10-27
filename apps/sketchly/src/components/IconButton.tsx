import { ReactNode } from "react";

export function IconButton({
  onClick,
  icon,
  theme,
  number,
}: {
  onClick: () => void;
  icon: ReactNode;
  theme: string;
  number?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-2 my-1 rounded-md ${theme} hover:cursor-pointer font-medium flex items-center justify-center`}
    >
      {icon}
      {number && (
        <span className="absolute bottom-0 right-0 text-xs rounded-full w-4 h-4 flex items-center justify-center">
          {number}
        </span>
      )}
    </button>
  );
}

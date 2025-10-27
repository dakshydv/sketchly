import { ReactNode } from "react";

export function MenuOption({
  icon,
  heading,
  onClick,
  theme
}: {
  icon: ReactNode;
  heading: string;
  onClick?: () => void;
  theme?: string
}) {
  return (
    <button onClick={onClick} className={`${theme} flex  hover:cursor-pointer w-full py-3 pl-5 mt-0 px-3 rounded-lg gap-3`}>
      {icon}
      <span className="font-light text-[12px]">{heading}</span>
    </button>
  );
}

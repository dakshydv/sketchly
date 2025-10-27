import Link from "next/link";
import { ReactNode } from "react";

export function SocialLink({
  icon,
  heading,
  href,
  theme
}: {
  icon: ReactNode;
  heading: string;
  href: string;
  theme?: string
}) {
  return (
    <Link href={href} className={`${theme} flex  hover:cursor-pointer w-full py-3 pl-5 mt-0 px-3 rounded-lg gap-3`}>
      {icon}
      <span className="font-light text-[12px]">{heading}</span>
    </Link>
  );
}

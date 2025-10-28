export default function FontSize({
    theme,
    text,
    onClick
}: {
    theme: string,
    text: string,
    onClick: () => void
}) {
  return (
    <div
      className={`w-8 h-7 flex items-center justify-center hover:cursor-pointer rounded-sm text-xl ${theme}`}
      onClick={onClick}
    >
      {text}
    </div>
  );
}

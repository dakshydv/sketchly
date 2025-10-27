export function ColorPicker({
    background,
    border,
    onClick,
  }: {
    background: string;
    border: string;
    onClick: () => void;
  }) {
    return (
      <button onClick={onClick} className={`border ${border} p-px hover:cursor-pointer rounded-md`}>
        <div className={`w-7 h-7 rounded-sm ${background}`}></div>
      </button>
    );
  }
  
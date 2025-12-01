import {
  Command,
  Trash,
  Download,
  Upload,
  Share2,
  Github,
  Twitter,
  Globe,
  Linkedin,
  X,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "./Button";

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  onClearCanvas: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function Menu({
  isOpen,
  onClose,
  onClearCanvas,
  isDark,
  onToggleTheme,
}: MenuProps) {
  if (!isOpen) return null;

  const menuItems = [
    { icon: <Command size={18} />, label: "Command Palette", onClick: () => {} },
    { icon: <Trash size={18} />, label: "Clear Canvas", onClick: onClearCanvas },
    { icon: <Download size={18} />, label: "Import Drawing", onClick: () => {} },
    { icon: <Upload size={18} />, label: "Export Drawing", onClick: () => {} },
    { icon: <Share2 size={18} />, label: "Live Collaboration", onClick: () => {} },
  ];

  const socialLinks = [
    { icon: <Github size={18} />, label: "Github", href: "https://github.com/dakshydv/sketchly" },
    { icon: <Twitter size={18} />, label: "Twitter", href: "https://x.com/dakshydv_" },
    { icon: <Globe size={18} />, label: "Portfolio", href: "https://dakshyadav.com" },
    { icon: <Linkedin size={18} />, label: "LinkedIn", href: "https://www.linkedin.com/in/daksh-dev/" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-start">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div className="relative w-80 h-full glass-panel border-r border-[var(--color-border)] flex flex-col p-6 animate-in slide-in-from-left duration-200">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold">Menu</h2>
          <Button variant="icon" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        <div className="flex flex-col gap-2 mb-8">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors text-left text-sm font-medium"
              onClick={() => {
                item.onClick();
                if (item.label === "Clear Canvas") onClose();
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-auto">
          <div className="mb-6">
             <p className="text-xs font-medium text-[var(--color-muted)] mb-3 uppercase tracking-wider">Theme</p>
             <button
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors text-left text-sm font-medium w-full"
              onClick={onToggleTheme}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
              {isDark ? "Light Mode" : "Dark Mode"}
            </button>
          </div>

          <p className="text-xs font-medium text-[var(--color-muted)] mb-3 uppercase tracking-wider">Socials</p>
          <div className="flex gap-2">
            {socialLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors text-[var(--color-foreground)]"
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

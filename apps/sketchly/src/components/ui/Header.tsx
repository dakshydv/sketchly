import React from "react";
import { Menu, Share2, Moon, Sun, Github } from "lucide-react";
import { Button } from "./Button";

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onMenuOpen: () => void;
  onShare: () => void;
}

export function Header({ isDark, onToggleTheme, onMenuOpen, onShare }: HeaderProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-between items-center pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-2">
        <div className="glass-panel p-1 rounded-xl flex items-center shadow-lg">
          <Button variant="icon" size="icon" onClick={onMenuOpen}>
            <Menu size={20} />
          </Button>
        </div>
      </div>

      <div className="pointer-events-auto flex items-center gap-2">
        <div className="glass-panel p-1 rounded-xl flex items-center gap-1 shadow-lg">
          <Button variant="icon" size="icon" onClick={onToggleTheme}>
            {isDark ? <Moon size={20} /> : <Sun size={20} />}
          </Button>
          <Button variant="primary" size="sm" onClick={onShare} className="mx-1">
            <Share2 size={16} className="mr-2" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}

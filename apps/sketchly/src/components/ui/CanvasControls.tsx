import { Undo2, Redo2, Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "./Button";
import { Tooltip } from "./Tooltip";

interface CanvasControlsProps {
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  zoomLevel: number;
  canUndo: boolean;
  canRedo: boolean;
}

export function CanvasControls({
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  zoomLevel,
  canUndo,
  canRedo,
}: CanvasControlsProps) {
  return (
    <div className="fixed bottom-6 left-6 z-50 flex gap-4">
      {/* Undo/Redo Group */}
      <div className="glass-panel p-1 rounded-xl flex items-center shadow-lg">
        <Tooltip content="Undo (Ctrl+Z)">
          <Button 
            variant="icon" 
            size="icon" 
            onClick={onUndo} 
            disabled={!canUndo}
            className={!canUndo ? "opacity-30 cursor-not-allowed hover:bg-transparent" : ""}
          >
            <Undo2 size={20} />
          </Button>
        </Tooltip>
        <Tooltip content="Redo (Ctrl+Y)">
          <Button 
            variant="icon" 
            size="icon" 
            onClick={onRedo} 
            disabled={!canRedo}
            className={!canRedo ? "opacity-30 cursor-not-allowed hover:bg-transparent" : ""}
          >
            <Redo2 size={20} />
          </Button>
        </Tooltip>
      </div>

      {/* Zoom Group */}
      <div className="glass-panel p-1 rounded-xl flex items-center shadow-lg">
        <Tooltip content="Zoom Out">
          <Button variant="icon" size="icon" onClick={onZoomOut}>
            <Minus size={20} />
          </Button>
        </Tooltip>
        
        <Tooltip content="Reset Zoom">
          <button 
            onClick={onZoomReset}
            className="w-16 px-2 text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
        </Tooltip>

        <Tooltip content="Zoom In">
          <Button variant="icon" size="icon" onClick={onZoomIn}>
            <Plus size={20} />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import { Engine } from "@/canvas-engine/engine";
import {
  FontSizeType,
  Shapes,
  shapesMessage,
  strokeStyleType,
} from "@/config/type";
import { Toolbar } from "./ui/Toolbar";
import { Header } from "./ui/Header";
import { PropertiesPanel } from "./ui/PropertiesPanel";
import { Menu } from "./ui/Menu";
import { CanvasControls } from "./ui/CanvasControls";

export function RoomCanvas({ roomId }: { roomId: number }) {
  const [tool, setTool] = useState<Shapes>("pointer");
  const [isClient, setIsClient] = useState(false);
  const [selectedStrokeWidth, setStrokeWidth] = useState<number>(1);
  const [selectedStrokeColor, setStrokeColor] = useState<string>("#d3d3d3");
  const [selectedStrokeStyle, setStrokeStyle] =
    useState<strokeStyleType>("simple");
  const [selectedBgColor, setBgColor] = useState<string>("#121212");
  const [selectedRectRadius, setRectRadius] = useState<number>(30);
  const [selectedFontSize, setFontSize] = useState<FontSizeType>("M");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engine, setEngine] = useState<Engine>();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isThemeDark, setIsThemeDark] = useState<boolean>(true);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [showShareComingSoon, setShowShareComingSoon] =
    useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    const keyDownEvent = (e: KeyboardEvent) => {
      switch (e.key) {
        case "1":
          setTool("select");
          break;
        case "2":
          setTool("pointer");
          break;
        case "3":
          setTool("rect");
          break;
        case "4":
          setTool("diamond");
          break;
        case "5":
          setTool("ellipse");
          break;
        case "6":
          setTool("line");
          break;
        case "7":
          setTool("pencil");
          break;
        case "8":
          setTool("arrow");
          break;
        case "9":
          setTool("text");
          break;
        case "0":
          setTool("eraser");
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", keyDownEvent);
    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    return () => {
      window.removeEventListener("resize", updateDimensions);
      window.removeEventListener("keydown", keyDownEvent);
    };
  }, []);

  useEffect(() => {
    const handleShortcuts = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          engine?.handleRedo();
        } else {
          engine?.handleUndo();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        e.preventDefault();
        engine?.handleRedo();
      }
    };

    window.addEventListener("keydown", handleShortcuts);
    return () => {
      window.removeEventListener("keydown", handleShortcuts);
    };
  }, [engine]);

  useEffect(() => {
    if (canvasRef.current) {
      let existingShapes: shapesMessage[] = [];

      try {
        const shapesData = localStorage.getItem(`shapes_room_${roomId}`);
        if (shapesData) {
          existingShapes = JSON.parse(shapesData);
        } else {
          console.log(
            "No existing shapes found in localStorage for room:",
            roomId
          );
        }
      } catch (error) {
        console.error("Error parsing shapes from localStorage:", error);
        localStorage.removeItem(`shapes_room_${roomId}`);
      }

      const newEngine = new Engine(
        canvasRef.current,
        roomId,
        selectedBgColor ?? "#121212",
        selectedStrokeColor ?? "#FFFFFF",
        selectedStrokeWidth,
        existingShapes
      );
      setEngine(newEngine);

      return () => {
        newEngine.cleanup();
      };
    }
  }, [canvasRef.current, roomId]);

  useEffect(() => {
    if (engine) {
      engine.setTool(tool);
      engine.clearCanvas();

      const handleStackChange = () => {
        setCanUndo(engine.canUndo);
        setCanRedo(engine.canRedo);
      };

      engine.subscribe(handleStackChange);
      handleStackChange(); // Initial sync

      return () => {
        engine.unsubscribe(handleStackChange);
      };
    }
  }, [tool, engine]);

  useEffect(() => {
    engine?.setStrokeStyle(selectedStrokeStyle);
  }, [selectedStrokeStyle]);

  useEffect(() => {
    engine?.setBgColor(selectedBgColor);
  }, [selectedBgColor]);

  useEffect(() => {
    engine?.setStrokeColor(selectedStrokeColor);
  }, [selectedStrokeColor]);

  useEffect(() => {
    engine?.setStrokeWidth(selectedStrokeWidth);
  }, [selectedStrokeWidth]);

  useEffect(() => {
    engine?.setRectRadius(selectedRectRadius);
  }, [selectedRectRadius]);

  useEffect(() => {
    engine?.setFontSize(selectedFontSize);
  }, [selectedFontSize]);

  useEffect(() => {
    engine?.setBgColor(isThemeDark ? "#121212" : "#ffffff");
    engine?.setTheme(isThemeDark ? "dark" : "light");
  }, [isThemeDark]);

  function handleClear() {
    setShowClearConfirm(true);
  }

  function handleZoomIn() {
    const scale = Math.min(zoomLevel * 1.2, 5);
    setZoomLevel(scale);
    if (engine) {
      const centerClientX = window.innerWidth / 2;
      const centerClientY = window.innerHeight / 2;
      engine.setZoomAt(centerClientX, centerClientY, scale);
    }
  }

  function handleZoomOut() {
    const scale = Math.max(zoomLevel / 1.2, 0.1);
    setZoomLevel(scale);
    if (engine) {
      const centerClientX = window.innerWidth / 2;
      const centerClientY = window.innerHeight / 2;
      engine.setZoomAt(centerClientX, centerClientY, scale);
    }
  }

  function handleZoomReset() {
    setZoomLevel(1);
    if (engine) {
      const centerClientX = window.innerWidth / 2;
      const centerClientY = window.innerHeight / 2;
      engine.setZoomAt(centerClientX, centerClientY, 1);
    }
  }

  function handleUndo() {
    engine?.handleUndo();
  }

  function handleRedo() {
    engine?.handleRedo();
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[var(--color-background)]">
      {tool ? (
        <canvas
          ref={canvasRef}
          height={isClient ? dimensions.height : 0}
          width={isClient ? dimensions.width : 0}
          className={`${
            tool !== "pointer" && tool !== "eraser"
              ? "cursor-crosshair-plus"
              : ""
          }
      ${tool === "eraser" && "cursor-eraser"}
      ${tool === "pointer" && "cursor-pointer"}`}
        ></canvas>
      ) : (
        <div className="bg-[#121212] w-screen h-screen text-white text-3xl flex items-center justify-center">
          Welcome to Sketchly
        </div>
      )}

      <Header
        isDark={isThemeDark}
        onToggleTheme={() => setIsThemeDark(!isThemeDark)}
        onMenuOpen={() => setIsMenuOpen(true)}
        onShare={() => setShowShareComingSoon(true)}
      />

      <Menu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onClearCanvas={handleClear}
        isDark={isThemeDark}
        onToggleTheme={() => setIsThemeDark(!isThemeDark)}
      />

      {!isMenuOpen && (
        <CanvasControls
          onUndo={handleUndo}
          onRedo={handleRedo}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomReset={handleZoomReset}
          zoomLevel={zoomLevel}
          canUndo={canUndo}
          canRedo={canRedo}
        />
      )}

      <Toolbar activeTool={tool} onToolChange={setTool} />

      <PropertiesPanel
        strokeColor={selectedStrokeColor}
        setStrokeColor={setStrokeColor}
        bgColor={selectedBgColor}
        setBgColor={setBgColor}
        strokeWidth={selectedStrokeWidth}
        setStrokeWidth={setStrokeWidth}
        strokeStyle={selectedStrokeStyle}
        setStrokeStyle={setStrokeStyle}
        opacity={1}
        setOpacity={() => {}}
        activeTool={tool}
      />

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-panel text-white rounded-xl shadow-2xl p-8 flex flex-col items-center max-w-sm text-center">
            <span className="text-lg font-medium mb-4">
              Clear Canvas?
            </span>
            <p className="text-sm text-[var(--color-muted)] mb-6">
              This action cannot be undone. Are you sure you want to proceed?
            </p>
            <div className="flex gap-4 w-full">
              <button
                className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-2 rounded-lg transition-colors"
                onClick={() => {
                  if (engine) {
                    engine.clearLocalStorage();
                    engine.existingShapes = [];
                    engine.clearCanvas();
                  }
                  setShowClearConfirm(false);
                }}
              >
                Clear
              </button>
              <button
                className="flex-1 bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-white border border-[var(--color-border)] px-4 py-2 rounded-lg transition-colors"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showShareComingSoon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-panel text-white rounded-xl shadow-2xl p-8 flex flex-col items-center max-w-sm text-center">
            <span className="text-xl font-bold mb-2">Coming Soon!</span>
            <span className="mb-6 text-sm text-[var(--color-muted)]">
              Sharing and collaboration features are currently in development.
            </span>
            <button
              className="bg-[var(--color-primary)] hover:opacity-90 text-white px-6 py-2 rounded-lg transition-opacity"
              onClick={() => setShowShareComingSoon(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
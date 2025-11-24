import axios from "axios";
import {
  Cords,
  FontSizeType,
  Shapes,
  shapesMessage,
  strokeStyleType,
  translateCords,
} from "@/config/type";
import { getExistingShapes } from "./utils";
import getStroke from "perfect-freehand";
import { getSvgPathFromStroke } from "./utils";
import { CaveatFont } from "@/config/style";

export class Engine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private roomId: number;
  private clicked: boolean = false;
  private startX = 0;
  private startY = 0;
  private selectedStrokeWidth: number = 1;
  private selectedStrokeColor: string;
  private selectedStrokeStyle: strokeStyleType = "simple";
  private selectedBgColor: string;
  private selectedRectBorder: number = 30;
  private selectedTool: Shapes | null = "pointer";
  private selectedFontSize: number = 18;
  private canvasTheme: string = "dark";
  private freeDrawCords: Cords[] = [];
  private zoomLevel: number = 1;
  private translateCords: translateCords = { x: 0, y: 0 };
  private input!: HTMLTextAreaElement;
  private mouseDownHandler!: (e: MouseEvent) => void;
  private mouseUpHandler!: (e: MouseEvent) => void;
  private mouseMoveHandler!: (e: MouseEvent) => void;
  private mouseClickHandler!: (e: MouseEvent) => void;
  private touchStartHandler!: (e: TouchEvent) => void;
  private touchMoveHandler!: (e: TouchEvent) => void;
  private touchEndHandler!: (e: TouchEvent) => void;
  existingShapes: shapesMessage[];
  socket?: WebSocket;

  constructor(
    canvas: HTMLCanvasElement,
    roomId: number,
    bgColor: string,
    strokeColor: string,
    strokeWidth: number,
    existingShapes: shapesMessage[],
    socket?: WebSocket
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get 2D context from canvas.");
    }
    this.ctx = ctx;
    this.existingShapes = [];
    this.roomId = roomId;
    this.socket = socket;
    this.existingShapes = existingShapes || [];
    this.selectedBgColor = bgColor;
    this.selectedStrokeWidth = strokeWidth;
    this.selectedStrokeColor = strokeColor;
    this.initMouseHandlers();
    this.clearCanvas();
  }

  public setTool(tool: Shapes) {
    this.selectedTool = tool;
  }

  public setStrokeStyle(style: strokeStyleType) {
    this.selectedStrokeStyle = style;
  }

  public setRectRadius(radius: number) {
    this.selectedRectBorder = radius;
  }

  public setFontSize(fontSize: FontSizeType) {
    switch (fontSize) {
      case "S":
        this.selectedFontSize = 18;
        break;
      case "M":
        this.selectedFontSize = 24;
        break;
      case "L":
        this.selectedFontSize = 30;
        break;
      case "XL":
        this.selectedFontSize = 36;
        break;
      default:
        break;
    }
  }

  async init() {
    this.existingShapes = await getExistingShapes(this.roomId);
    this.clearCanvas();
  }

  broadcastShape(shape: shapesMessage) {
    this.existingShapes.push(shape);
    this.saveShapesToLocalStorage();
    this.clearCanvas();
  }

  private saveShapesToLocalStorage() {
    try {
      const shapesData = JSON.stringify(this.existingShapes);
      localStorage.setItem(`shapes_room_${this.roomId}`, shapesData);
    } catch (error) {
      console.error("Error saving shapes to localStorage:", error);
    }
  }

  public getShapes() {
    return this.existingShapes;
  }

  public clearLocalStorage() {
    try {
      localStorage.removeItem(`shapes_room_${this.roomId}`);
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }
  }

  clearCanvas(previewDraw?: () => void) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = this.selectedBgColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(this.translateCords.x, this.translateCords.y);
    this.ctx.scale(this.zoomLevel, this.zoomLevel);
    if (this.selectedTool === "pointer" && this.existingShapes.length <= 0) {
      this.drawWelcomeCanvas();
    }
    if (this.existingShapes === undefined) {
      this.existingShapes = [];
    }

    this.existingShapes?.map((shape) => {
      switch (shape.type) {
        case "rect":
          {
            this.drawRect(
              shape.x,
              shape.y,
              shape.width,
              shape.height,
              shape.strokeColor,
              shape.strokeStyle,
              shape.strokeWidth,
              shape.cornerRadius
            );
          }
          break;

        case "ellipse":
          {
            this.drawEllipse(
              shape.centerX,
              shape.centerY,
              shape.radiusX,
              shape.radiusY,
              shape.strokeColor,
              shape.strokeWidth,
              shape.strokeStyle
            );
          }
          break;

        case "line":
          {
            this.drawLine(
              shape.fromX,
              shape.fromY,
              shape.toX,
              shape.toY,
              shape.strokeColor,
              shape.strokeWidth,
              shape.strokeStyle
            );
          }
          break;

        case "text":
          {
            this.ctx.strokeStyle = shape.strokeColor;
            this.ctx.lineWidth = shape.strokeWidth;
            this.ctx.font = `${shape.fontSize}px 'Caveat', cursive`;
            this.ctx.fillStyle = shape.strokeColor;
            this.ctx.fillText(shape.text, shape.x, shape.y + shape.fontSize);
          }
          break;

        case "diamond":
          {
            this.drawDiamond(
              shape.xLeft,
              shape.xRight,
              shape.yHorizontal,
              shape.xVertical,
              shape.yTop,
              shape.yBottom,
              shape.strokeColor,
              shape.strokeWidth,
              shape.strokeStyle
            );
          }
          break;

        case "pencil":
          {
            this.initPencilDraw(
              shape.cords,
              shape.strokeWidth,
              shape.strokeColor,
              shape.strokeStyle
            );
          }
          break;
        case "arrow":
          {
            this.drawArrow(
              shape.startX,
              shape.startY,
              shape.endX,
              shape.endY,
              shape.strokeColor,
              shape.strokeWidth,
              shape.strokeStyle
            );
          }
          break;

        default:
          break;
      }
    });
    if (previewDraw) {
      previewDraw();
    }
    this.ctx.restore();
  }

  drawText(x: number, y: number, strokeColor: string, fontSize: number) {
    this.input = document.createElement("textarea");
    this.input.style.color = strokeColor;
    this.input.autofocus = true;
    const screen = this.worldToScreen(x, y);
    this.input.style.left = `${screen.x}px`;
    this.input.style.top = `${screen.y}px`;
    this.input.className = `${CaveatFont.className} `;
    this.input.style.fontSize = `${fontSize}px`;
    this.input.style.backgroundColor = this.selectedBgColor;
    Object.assign(this.input.style, {
      position: "absolute",
      display: "inline-block",
      color: this.selectedStrokeColor,
      fontWeight: this.selectedStrokeWidth,
      backfaceVisibility: "hidden",
      margin: "0",
      padding: "0",
      border: `1px dotted white`,
      outline: "0",
      resize: "none",
      background: "transparent",
      overflowX: "hidden",
      overflowY: "hidden",
      overflowWrap: "normal",
      wordBreak: "normal",
      whiteSpace: "pre",
      verticalAlign: "top",
      opacity: "1",
      wrap: "off",
      tabIndex: 0,
      dir: "auto",
      width: "200px",
      minWidth: "200px",
    });

    document.body.appendChild(this.input);

    const autoResize = () => {
      const tempSpan = document.createElement("span");
      tempSpan.style.font = this.input.style.font;
      tempSpan.style.fontSize = this.input.style.fontSize;
      tempSpan.style.fontFamily = this.input.style.fontFamily;
      tempSpan.style.visibility = "hidden";
      tempSpan.style.position = "absolute";
      tempSpan.style.whiteSpace = "pre";
      tempSpan.textContent = this.input.value || "a";

      document.body.appendChild(tempSpan);
      const textWidth = tempSpan.offsetWidth;
      document.body.removeChild(tempSpan);

      this.input.style.width = `${Math.max(textWidth + 10, 200)}px`;
    };

    this.input.addEventListener("input", autoResize);
    this.input.addEventListener("keydown", () => {
      setTimeout(autoResize, 0);
    });

    autoResize();

    this.input.addEventListener("blur", () => {
      this.clearCanvas();
      this.ctx.beginPath();
      this.ctx.strokeStyle = this.selectedStrokeColor;
      this.ctx.fillStyle = this.selectedStrokeColor;
      this.ctx.font = "24px 'Caveat', cursive";
      this.ctx.fillText(this.input.value, x, y + 24);
      this.ctx.closePath();
      const shape: shapesMessage = {
        type: "text",
        text: this.input.value,
        style: "#FFFFFF",
        x,
        y,
        width: this.input.offsetWidth,
        strokeColor: this.selectedStrokeColor,
        strokeWidth: this.selectedStrokeWidth,
        fontSize: this.selectedFontSize,
      };
      this.broadcastShape(shape);
      document.body.removeChild(this.input);
    });
    this.selectedTool = null;
  }

  initPencilDraw(
    cords: Cords[],
    strokeWidth: number,
    strokeColor: string,
    strokeStyle: string
  ) {
    const path = new Path2D(this.generatePencilPath(cords, strokeWidth));
    this.ctx.save();
    this.ctx.fillStyle = strokeColor;
    this.ctx.strokeStyle = strokeColor;
    this.ctx.fill(path);
    this.ctx.restore();
  }

  generatePencilPath(cords: Cords[], strokeWidth: number) {
    const cordinates = cords.map((cord) => [cord.x, cord.y]);

    if (!cordinates.length) {
      return "";
    }

    const options = {
      simulatePressure: true,
      size: strokeWidth * 4.25,
      thinning: 0.6,
      smoothing: 0.5,
      streamline: 0.5,
      last: true,
    };

    const strokeCords = getStroke(cordinates, options);
    const pencilPath = getSvgPathFromStroke(strokeCords);
    return pencilPath;
  }

  isPointInShape(x: number, y: number, shape: shapesMessage) {
    const tolerance = 10;
    switch (shape.type) {
      case "rect":
        {
          if (
            (x >= shape.x &&
              x <= shape.x + shape.width &&
              y >= shape.y - 3 &&
              y <= shape.y + 3) ||
            (x === shape.x && y >= shape.y && y <= shape.y + shape.height) ||
            (x >= shape.x &&
              x <= shape.x + shape.width &&
              y === shape.y + shape.height) ||
            (x === shape.x + shape.width &&
              y >= shape.y &&
              y <= shape.y + shape.height)
          ) {
            return true;
          }
        }
        break;
      case "ellipse":
        {
          const dx = x - shape.centerX;
          const dy = y - shape.centerY;
          const normalized =
            (dx * dx) /
              ((shape.radiusX + tolerance) * (shape.radiusX + tolerance)) +
            (dy * dy) /
              ((shape.radiusY + tolerance) * (shape.radiusY + tolerance));
          return normalized <= 1;
        }
        break;
      case "diamond": {
        const distanceToLine = (
          x1: number,
          y1: number,
          x2: number,
          y2: number,
          px: number,
          py: number
        ) => {
          const A = px - x1;
          const B = py - y1;
          const C = x2 - x1;
          const D = y2 - y1;

          const dot = A * C + B * D;
          const lenSq = C * C + D * D;

          if (lenSq === 0) return Math.sqrt(A * A + B * B);

          let param = dot / lenSq;
          param = Math.max(0, Math.min(1, param));

          const xx = x1 + param * C;
          const yy = y1 + param * D;

          const dx = px - xx;
          const dy = py - yy;
          return Math.sqrt(dx * dx + dy * dy);
        };

        const edge1 = distanceToLine(
          shape.xLeft,
          shape.yHorizontal,
          shape.xVertical,
          shape.yTop,
          x,
          y
        );
        const edge2 = distanceToLine(
          shape.xVertical,
          shape.yTop,
          shape.xRight,
          shape.yHorizontal,
          x,
          y
        );
        const edge3 = distanceToLine(
          shape.xRight,
          shape.yHorizontal,
          shape.xVertical,
          shape.yBottom,
          x,
          y
        );
        const edge4 = distanceToLine(
          shape.xVertical,
          shape.yBottom,
          shape.xLeft,
          shape.yHorizontal,
          x,
          y
        );

        const minDistance = Math.min(edge1, edge2, edge3, edge4);
        return minDistance <= tolerance;
      }
      case "line":
        {
          if (
            (x >= shape.fromX &&
              x <= shape.toX &&
              y <= shape.fromY &&
              y >= shape.toY) ||
            (x >= shape.fromX &&
              x <= shape.toX &&
              y >= shape.fromY &&
              y <= shape.toY) ||
            (x <= shape.fromX &&
              x >= shape.toX &&
              y <= shape.fromY &&
              y >= shape.toY) ||
            (x <= shape.fromX &&
              x >= shape.toX &&
              y >= shape.fromY &&
              y <= shape.toY)
          ) {
            return true;
          }
        }
        break;
      case "arrow":
        {
          const headLength = 20;
          const dx = shape.endX - shape.startX;
          const dy = shape.startY - shape.startY;
          const angle = Math.atan2(dy, dx);
          const arrowLeftX =
            shape.endX - headLength * Math.cos(angle - Math.PI / 6);
          const arrowLeftY =
            shape.endX - headLength * Math.sin(angle - Math.PI / 6);
          const arrowRightX =
            shape.endX - headLength * Math.cos(angle + Math.PI / 6);
          const arrowRightY =
            shape.endX - headLength * Math.sin(angle + Math.PI / 6);

          if (
            // main line
            (x >= shape.startX &&
              x <= shape.endX &&
              y <= shape.startY &&
              y >= shape.endY) ||
            (x >= shape.startX &&
              x <= shape.endX &&
              y >= shape.startY &&
              y <= shape.endY) ||
            (x <= shape.startX &&
              x >= shape.endX &&
              y <= shape.startY &&
              y >= shape.endY) ||
            (x <= shape.startX &&
              x >= shape.endX &&
              y >= shape.startY &&
              y <= shape.endY) ||
            // left side arrow
            (x >= arrowLeftX &&
              x <= shape.endX &&
              y <= arrowLeftY &&
              y >= shape.endY) ||
            (x >= arrowLeftX &&
              x <= shape.endX &&
              y >= arrowLeftY &&
              y <= shape.endY) ||
            (x <= arrowLeftX &&
              x >= shape.endX &&
              y <= arrowLeftY &&
              y >= shape.endY) ||
            (x <= arrowLeftX &&
              x >= shape.endX &&
              y >= arrowLeftY &&
              y <= shape.endY) ||
            // right side arrow
            (x >= arrowRightX &&
              x <= shape.endX &&
              y <= arrowRightY &&
              y >= shape.endY) ||
            (x >= arrowRightX &&
              x <= shape.endX &&
              y >= arrowRightY &&
              y <= shape.endY) ||
            (x <= arrowRightX &&
              x >= shape.endX &&
              y <= arrowRightY &&
              y >= shape.endY) ||
            (x <= arrowRightX &&
              x >= shape.endX &&
              y >= arrowRightY &&
              y <= shape.endY)
          ) {
            return true;
          }
        }
        break;
      case "pencil": {
        return shape.cords.some(
          (point) => Math.hypot(point.x - x, point.y - y) <= tolerance
        );
      }
      case "text":
        {
          if (
            x >= shape.x + tolerance &&
            x <= shape.x + shape.width + tolerance &&
            y >= shape.y &&
            y <= shape.y + 25 + tolerance
          ) {
            return true;
          }
        }
        break;
      default:
        break;
    }
  }

  async EraseCanvas() {
    this.init();
    await axios.patch(`http://localhost:3001/delete/${this.roomId}`, {
      headers: {
        authorization:
          "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjF9.RMfebNn3ViUE40wpF_u-tMK-5kmVYsB1uwuRYE9EJl8",
      },
    });
    this.existingShapes = [];
  }

  drawWelcomeCanvas() {
    this.ctx.beginPath();
    this.ctx.moveTo(80, 150);
    this.ctx.quadraticCurveTo(50, 150, 50, 95);
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = "#7c7c7c";
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(43, 91);
    this.ctx.lineTo(50, 78);
    this.ctx.lineTo(63, 90);
    this.ctx.closePath();
    this.ctx.fillStyle = "#7c7c7c";
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.font = "24px 'Caveat', cursive";
    this.ctx.fillStyle = "#7c7c7c";
    this.ctx.fillText("Export, preferences, languages, ...", 85, 152);

    this.ctx.beginPath();
    this.ctx.moveTo(window.innerWidth / 2 + 75, 170);
    this.ctx.quadraticCurveTo(
      window.innerWidth / 2 + 125,
      150,
      window.innerWidth / 2 + 85,
      95
    );
    this.ctx.strokeStyle = "#7c7c7c";
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(window.innerWidth / 2 + 75, 95);
    this.ctx.lineTo(window.innerWidth / 2 + 75, 80);
    this.ctx.lineTo(window.innerWidth / 2 + 95, 90);
    this.ctx.closePath();
    // this.ctx.fillStyle = "#7c7c7c";
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.font = "24px 'Caveat', cursive";
    this.ctx.fillText("Pick a tool &", window.innerWidth / 2 - 50, 165);
    this.ctx.fillText("Start drawing!", window.innerWidth / 2 - 55, 190);

    this.ctx.font = "900 55px 'Caveat', cursive";
    this.ctx.fillStyle = this.canvasTheme === "dark" ? "#190064" : "#a8a5ff";
    this.ctx.fillText(
      "SKETCHLY",
      window.innerWidth / 2 - 120,
      window.innerHeight / 2
    );

    this.ctx.font = "24px 'Caveat', cursive";
    this.ctx.fillStyle = "#7c7c7c";
    this.ctx.fillText(
      "All your data is saved locally in your browser",
      window.innerWidth / 2 - 180,
      window.innerHeight / 2 + 50
    );
  }

  drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    strokeColor: string,
    strokeStyle: string,
    strokeWidth: number,
    cornerRadius: number
  ) {
    this.ctx.beginPath();
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = strokeWidth;
    switch (strokeStyle) {
      case "simple":
        this.ctx.setLineDash([0]);
        break;
      case "rough":
        this.ctx.setLineDash([8, 6]);
        break;
      case "dense":
        this.ctx.setLineDash([4, 6]);
        break;
      default:
        this.ctx.setLineDash([]);
        break;
    }
    this.ctx.roundRect(x, y, width, height, [cornerRadius]);
    this.ctx.closePath();
    this.ctx.stroke();
  }

  drawEllipse(
    centerX: number,
    centerY: number,
    radiusX: number,
    radiusY: number,
    strokeColor: string,
    strokeWidth: number,
    strokeStyle: string
  ) {
    this.ctx.beginPath();
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = strokeWidth;
    switch (strokeStyle) {
      case "simple":
        this.ctx.setLineDash([0]);
        break;
      case "rough":
        this.ctx.setLineDash([8, 6]);
        break;
      case "dense":
        this.ctx.setLineDash([4, 6]);
        break;
      default:
        this.ctx.setLineDash([]);
        break;
    }
    this.ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    this.ctx.stroke();
    this.ctx.closePath();
  }

  drawLine(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    strokeColor: string,
    strokeWidth: number,
    strokeStyle: string
  ) {
    this.ctx.beginPath();
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = strokeWidth;
    switch (strokeStyle) {
      case "simple":
        this.ctx.setLineDash([0]);
        break;
      case "rough":
        this.ctx.setLineDash([8, 6]);
        break;
      case "dense":
        this.ctx.setLineDash([4, 6]);
        break;
      default:
        this.ctx.setLineDash([]);
        break;
    }
    this.ctx.moveTo(fromX, fromY);
    this.ctx.lineTo(toX, toY);
    this.ctx.stroke();
    this.ctx.closePath();
  }

  drawDiamond(
    xLeft: number,
    xRight: number,
    yHorizontal: number,
    xVertical: number,
    yTop: number,
    yBottom: number,
    strokeColor: string,
    strokeWidth: number,
    strokeStyle: string
  ) {
    this.ctx.beginPath();
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = strokeWidth;
    switch (strokeStyle) {
      case "simple":
        this.ctx.setLineDash([0]);
        break;
      case "rough":
        this.ctx.setLineDash([8, 6]);
        break;
      case "dense":
        this.ctx.setLineDash([4, 6]);
        break;
      default:
        this.ctx.setLineDash([]);
        break;
    }
    this.ctx.moveTo(xLeft, yHorizontal);
    this.ctx.lineTo(xVertical, yTop);
    this.ctx.lineTo(xRight, yHorizontal);
    this.ctx.lineTo(xVertical, yBottom);
    this.ctx.lineTo(xLeft, yHorizontal);
    this.ctx.stroke();
    this.ctx.closePath();
  }

  drawArrow(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    strokeColor: string,
    strokeWidth: number,
    strokeStyle: string
  ) {
    const headLength = 20;
    const dx = endX - startX;
    const dy = endY - startY;
    const angle = Math.atan2(dy, dx);
    this.ctx.beginPath();
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = strokeWidth;
    switch (strokeStyle) {
      case "simple":
        this.ctx.setLineDash([0]);
        break;
      case "rough":
        this.ctx.setLineDash([8, 6]);
        break;
      case "dense":
        this.ctx.setLineDash([4, 6]);
        break;
      default:
        this.ctx.setLineDash([]);
        break;
    }
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.lineTo(
      endX - headLength * Math.cos(angle - Math.PI / 6),
      endY - headLength * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.moveTo(endX, endY);
    this.ctx.lineTo(
      endX - headLength * Math.cos(angle + Math.PI / 6),
      endY - headLength * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.stroke();
    this.ctx.closePath();
  }

  deleteShape(shape: shapesMessage) {
    this.existingShapes = this.existingShapes.filter(
      (existingShape) => existingShape !== shape
    );
    this.clearCanvas();
    this.saveShapesToLocalStorage();
  }

  setBgColor(color: string) {
    this.selectedBgColor = color;
    this.clearCanvas();
  }

  setTheme(color: string) {
    this.canvasTheme = color;
  }

  setStrokeColor(color: string) {
    this.selectedStrokeColor = color;
  }

  setStrokeWidth(width: number) {
    this.selectedStrokeWidth = width;
  }

  private screenToWorld(clientX: number, clientY: number) {
    const rect = this.canvas.getBoundingClientRect();
    const xOnScreen = clientX - rect.left;
    const yOnScreen = clientY - rect.top;
    return {
      x: (xOnScreen - this.translateCords.x) / this.zoomLevel,
      y: (yOnScreen - this.translateCords.y) / this.zoomLevel,
    };
  }

  private worldToScreen(worldX: number, worldY: number) {
    return {
      x: worldX * this.zoomLevel + this.translateCords.x,
      y: worldY * this.zoomLevel + this.translateCords.y,
    };
  }

  public setZoomAt(clientX: number, clientY: number, newZoom: number) {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;

    const world = this.screenToWorld(clientX, clientY);
    const newTranslate = {
      x: screenX - world.x * newZoom,
      y: screenY - world.y * newZoom,
    };
    this.zoomLevel = newZoom;
    this.translateCords = newTranslate;
    this.clearCanvas();
  }

  private transformX(clientX: number): number {
    const rect = this.canvas.getBoundingClientRect();
    const xOnScreen = clientX - rect.left;
    return (xOnScreen - this.translateCords.x) / this.zoomLevel;
  }

  private transformY(clientY: number): number {
    const rect = this.canvas.getBoundingClientRect();
    const yOnScreen = clientY - rect.top;
    return (yOnScreen - this.translateCords.y) / this.zoomLevel;
  }

  private getPrimaryTouch(e: TouchEvent) {
    const touch = e.touches[0] ?? e.changedTouches[0];
    return touch ? { clientX: touch.clientX, clientY: touch.clientY } : null;
  }

  initMouseHandlers() {
    this.mouseClickHandler = (e) => {
      const x = this.transformX(e.clientX);
      const y = this.transformY(e.clientY);

      if (this.selectedTool === "text") {
        this.drawText(x, y, this.selectedStrokeColor, this.selectedFontSize);
      }
      if (this.selectedTool === "eraser") {
        this.clearCanvas();
        for (let i = 0; i < this.existingShapes.length; i++) {
          const shape = this.existingShapes[i];
          if (this.isPointInShape(x, y, shape)) {
            this.deleteShape(shape);
          }
        }
        return false;
      }
    };

    this.mouseDownHandler = (e) => {
      if (!this.selectedTool) {
        return;
      }
      this.clicked = true;
      this.startX = this.transformX(e.clientX);
      this.startY = this.transformY(e.clientY);
      if (this.selectedTool === "pencil") {
        this.freeDrawCords.push({
          x: this.startX,
          y: this.startY,
        });
      }
    };

    this.touchStartHandler = (e) => {
      e.preventDefault();
      if (!this.selectedTool) {
        return;
      }
      this.clicked = true;
      const cordinate = this.getPrimaryTouch(e);
      if (!cordinate) {
        return;
      }
      this.startX = this.transformX(cordinate.clientX);
      this.startY = this.transformX(cordinate.clientY);
      if (this.selectedTool === "pencil") {
        this.freeDrawCords.push({
          x: this.startX,
          y: this.startY,
        });
      }
    };

    this.touchEndHandler = (e) => {
      if (!this.selectedTool) return;
      this.clicked = false;
      const cord = this.getPrimaryTouch(e);
      if (!cord) return;
      const event = {clientX: cord.clientX, clientY: cord.clientY} as MouseEvent;
      if (this.selectedTool === "text" || this.selectedTool === "eraser") {
        this.mouseClickHandler(event);
      }
      this.mouseUpHandler(event);
    }

    this.mouseUpHandler = (e) => {
      if (!this.selectedTool) {
        return;
      }
      this.clicked = false;

      if (this.selectedTool === "pointer") {
        this.saveShapesToLocalStorage();
        return;
      }

      let shape: shapesMessage | null = null;
      const endX = this.transformX(e.clientX);
      const endY = this.transformY(e.clientY);
      const width = endX - this.startX;
      const height = endY - this.startY;

      switch (this.selectedTool) {
        case "rect":
          {
            shape = {
              type: "rect",
              x: this.startX,
              y: this.startY,
              width,
              height,
              strokeColor: this.selectedStrokeColor,
              strokeStyle: this.selectedStrokeStyle,
              strokeWidth: this.selectedStrokeWidth,
              cornerRadius: this.selectedRectBorder,
            };
            this.broadcastShape(shape);
          }
          break;

        case "ellipse":
          {
            shape = {
              type: "ellipse",
              centerX: this.startX + width / 2,
              centerY: this.startY + height / 2,
              radiusX: Math.abs((this.startX - endX) / 2),
              radiusY: Math.abs((this.startY - endY) / 2),
              strokeWidth: this.selectedStrokeWidth,
              strokeColor: this.selectedStrokeColor,
              strokeStyle: this.selectedStrokeStyle,
            };
            this.broadcastShape(shape);
          }
          break;

        case "line":
          {
            shape = {
              type: "line",
              fromX: this.startX,
              fromY: this.startY,
              toX: endX,
              toY: endY,
              strokeColor: this.selectedStrokeColor,
              strokeWidth: this.selectedStrokeWidth,
              strokeStyle: this.selectedStrokeStyle,
            };
            this.broadcastShape(shape);
          }
          break;
        case "diamond":
          {
            shape = {
              type: "diamond",
              xLeft: this.startX,
              xRight: endX,
              yHorizontal: (this.startY + endY) / 2,
              xVertical: (this.startX + endX) / 2,
              yTop: this.startY,
              yBottom: endY,
              strokeColor: this.selectedStrokeColor,
              strokeWidth: this.selectedStrokeWidth,
              strokeStyle: this.selectedStrokeStyle,
            };
            this.broadcastShape(shape);
          }
          break;
        case "pencil":
          {
            shape = {
              type: "pencil",
              cords: this.freeDrawCords,
              style: "#FFFFFF",
              strokeColor: this.selectedStrokeColor,
              strokeWidth: this.selectedStrokeWidth,
              strokeStyle: this.selectedStrokeStyle,
            };
            this.initPencilDraw(
              this.freeDrawCords,
              1,
              shape.strokeColor,
              shape.strokeStyle
            );
            this.freeDrawCords = [];
            this.broadcastShape(shape);
          }
          break;
        case "arrow":
          {
            shape = {
              type: "arrow",
              startX: this.startX,
              startY: this.startY,
              endX: endX,
              endY: endY,
              strokeColor: this.selectedStrokeColor,
              strokeWidth: this.selectedStrokeWidth,
              strokeStyle: this.selectedStrokeStyle,
            };
            this.broadcastShape(shape);
          }
          break;
        default:
          break;
      }
    };

    this.touchMoveHandler = (e) => {
      if (!this.selectedTool || !this.clicked) return;
      e.preventDefault();
      const cord = this.getPrimaryTouch(e);
      if (!cord) return;
      const event = {clientX: cord.clientX, clientY: cord.clientY} as MouseEvent;
      this.mouseMoveHandler(event);
    }

    this.mouseMoveHandler = (e) => {
      if (!this.selectedTool) {
        return;
      }

      if (this.clicked) {
        const currentX = this.transformX(e.clientX);
        const currentY = this.transformY(e.clientY);
        const width = currentX - this.startX;
        const height = currentY - this.startY;
        this.clearCanvas(() => {
          switch (this.selectedTool) {
            case "rect":
              this.drawRect(
                this.startX,
                this.startY,
                width,
                height,
                this.selectedStrokeColor,
                this.selectedStrokeStyle,
                this.selectedStrokeWidth,
                this.selectedRectBorder
              );
              break;
            case "ellipse":
              const centerX = this.startX + width / 2;
              const centerY = this.startY + height / 2;
              const radiusX = Math.abs(width / 2);
              const radiusY = Math.abs(height / 2);
              this.drawEllipse(
                centerX,
                centerY,
                radiusX,
                radiusY,
                this.selectedStrokeColor,
                this.selectedStrokeWidth,
                this.selectedStrokeStyle
              );
              break;
            case "line":
              this.drawLine(
                this.startX,
                this.startY,
                currentX,
                currentY,
                this.selectedStrokeColor,
                this.selectedStrokeWidth,
                this.selectedStrokeStyle
              );
              break;
            case "diamond":
              const xLeft = this.startX;
              const xRight = currentX;
              const yHorizontal = (this.startY + currentY) / 2; // y cordinate of left and right corner
              const xVertical = (this.startX + currentX) / 2; // x cordinate of top and bottom corner
              const yTop = this.startY;
              const yBottom = currentY;
              this.drawDiamond(
                xLeft,
                xRight,
                yHorizontal,
                xVertical,
                yTop,
                yBottom,
                this.selectedStrokeColor,
                this.selectedStrokeWidth,
                this.selectedStrokeStyle
              );
              break;
            case "pencil":
              this.freeDrawCords.push({
                x: this.transformX(e.clientX),
                y: this.transformY(e.clientY),
              });
              this.initPencilDraw(
                this.freeDrawCords,
                this.selectedStrokeWidth,
                this.selectedStrokeColor,
                this.selectedStrokeStyle
              );
              break;
            case "arrow":
              const endX = currentX;
              const endY = currentY;
              this.drawArrow(
                this.startX,
                this.startY,
                endX,
                endY,
                this.selectedStrokeColor,
                this.selectedStrokeWidth,
                this.selectedStrokeStyle
              );
              break;
            case "pointer":
              const offSetX = currentX - this.startX;
              const offSetY = currentY - this.startY;

              this.existingShapes.forEach((shape) => {
                switch (shape.type) {
                  case "rect":
                    shape.x += offSetX;
                    shape.y += offSetY;
                    break;
                  case "ellipse":
                    shape.centerX += offSetX;
                    shape.centerY += offSetY;
                    break;
                  case "line":
                    shape.fromX += offSetX;
                    shape.fromY += offSetY;
                    shape.toX += offSetX;
                    shape.toY += offSetY;
                    break;
                  case "text":
                    shape.x += offSetX;
                    shape.y += offSetY;
                    break;
                  case "diamond":
                    shape.xLeft += offSetX;
                    shape.xRight += offSetX;
                    shape.yHorizontal += offSetY;
                    shape.xVertical += offSetX;
                    shape.yTop += offSetY;
                    shape.yBottom += offSetY;
                    break;
                  case "pencil":
                    shape.cords.forEach((cord) => {
                      cord.x += offSetX;
                      cord.y += offSetY;
                    });
                    break;
                  case "arrow":
                    shape.startX += offSetX;
                    shape.endX += offSetX;
                    shape.startY += offSetY;
                    shape.endY += offSetY;
                    break;

                  default:
                    break;
                }

                this.startX = currentX;
                this.startY = currentY;
              });
              break;

            default:
              break;
          }
        });
      }
    };

    this.canvas.addEventListener("click", this.mouseClickHandler);
    this.canvas.addEventListener("mousedown", this.mouseDownHandler);
    this.canvas.addEventListener("mouseup", this.mouseUpHandler);
    this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
    this.canvas.addEventListener("touchstart", this.touchStartHandler);
    this.canvas.addEventListener("touchmove", this.touchMoveHandler);
    this.canvas.addEventListener("touchend", this.touchEndHandler);
  }

  cleanup() {
    this.canvas.removeEventListener("click", this.mouseClickHandler);
    this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
    this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
    this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
    this.canvas.removeEventListener("touchstart", this.touchStartHandler);
    this.canvas.removeEventListener("touchmove", this.touchMoveHandler);
    this.canvas.removeEventListener("touchend", this.touchEndHandler);
  }
}
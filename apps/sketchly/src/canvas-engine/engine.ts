import axios from "axios";
import { Cords, Shapes, shapesMessage } from "@/config/type";
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
  private selectedBgColor: string;
  private selectedTool: Shapes | null = "pointer";
  private canvasTheme: string = "dark";
  private freeDrawCords: Cords[] = [];
  private input!: HTMLTextAreaElement;
  private mouseDownHandler!: (e: MouseEvent) => void;
  private mouseUpHanlder!: (e: MouseEvent) => void;
  private mouseMoveHandler!: (e: MouseEvent) => void;
  private mouseClickHandler!: (e: MouseEvent) => void;
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
    this.initMouseHanlders();
    this.clearCanvas();
  }

  public setTool(tool: Shapes) {
    this.selectedTool = tool;
  }

  async init() {
    this.existingShapes = await getExistingShapes(this.roomId);
    this.clearCanvas();
  }

  informWsServer(shape: shapesMessage) {
    this.existingShapes.push(shape);
    this.saveShapesToLocalStorage();
    // will add ws logic later
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

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = this.selectedBgColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.selectedTool === "pointer" && this.existingShapes.length <= 0) {
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
      this.ctx.fillStyle = "#7c7c7c";
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.font = "24px 'Caveat', cursive";
      this.ctx.fillStyle = "#7c7c7c";
      this.ctx.fillText("Pick a tool &", window.innerWidth / 2 - 50, 165);
      this.ctx.fillText("Start drawing!", window.innerWidth / 2 - 55, 190);

      this.ctx.font = "900 55px 'Caveat', cursive";
      this.ctx.fillStyle = this.canvasTheme === "dark" ? "#190064" : "#e1dfff";
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
    if (this.existingShapes === undefined) {
      this.existingShapes = [];
    }

    this.existingShapes?.map((shape) => {
      switch (shape.type) {
        case "rect":
          {
            this.ctx.beginPath();
            this.ctx.strokeStyle = shape.strokeStyle;
            this.ctx.lineWidth = shape.strokeWidth;
            this.ctx.roundRect(shape.x, shape.y, shape.width, shape.height, [
              40,
            ]);
            this.ctx.closePath();
            this.ctx.stroke();
          }
          break;

        case "circle":
          {
            this.ctx.beginPath();
            this.ctx.strokeStyle = shape.strokeStyle;
            this.ctx.lineWidth = shape.strokeWidth;
            this.ctx.ellipse(
              shape.centerX,
              shape.centerY,
              shape.radiusx,
              shape.radiusY,
              0,
              0,
              Math.PI * 2
            );
            this.ctx.stroke();
          }
          break;

        case "line":
          {
            this.ctx.strokeStyle = shape.strokeStyle;
            this.ctx.lineWidth = shape.strokeWidth;
            this.ctx.moveTo(shape.startX, shape.startY);
            this.ctx.lineTo(shape.endX, shape.endY);
            this.ctx.stroke();
          }
          break;

        case "text":
          {
            this.ctx.strokeStyle = shape.strokeStyle;
            this.ctx.lineWidth = shape.strokeWidth;
            this.ctx.font = "24px 'Caveat', cursive";
            this.ctx.fillStyle = shape.strokeStyle;
            this.ctx.fillText(shape.text, shape.x, shape.y + 24);
          }
          break;

        case "diamond":
          {
            this.ctx.beginPath();
            this.ctx.strokeStyle = shape.strokeStyle;
            this.ctx.lineWidth = shape.strokeWidth;
            this.ctx.moveTo(shape.xLeft, shape.yHorizontal);
            this.ctx.lineTo(shape.xVertical, shape.yTop);
            this.ctx.lineTo(shape.xRight, shape.yHorizontal);
            this.ctx.lineTo(shape.xVertical, shape.yBottom);
            this.ctx.lineTo(shape.xLeft, shape.yHorizontal);
            this.ctx.stroke();
          }
          break;

        case "pencil":
          {
            const path = new Path2D(
              this.generatePencilPath(shape.cords, shape.strokeWidth)
            );
            this.ctx.save();
            this.ctx.fillStyle = shape.strokeStyle;
            this.ctx.fill(path);
            this.ctx.restore();
          }
          break;
        case "arrow":
          {
            const headLength = 20;
            const dx = shape.toX - shape.fromX;
            const dy = shape.toY - shape.fromY;
            const angle = Math.atan2(dy, dx);
            this.ctx.beginPath();
            this.ctx.strokeStyle = shape.strokeStyle;
            this.ctx.lineWidth = shape.strokeWidth;
            this.ctx.moveTo(shape.fromX, shape.fromY);
            this.ctx.lineTo(shape.toX, shape.toY);
            this.ctx.lineTo(
              shape.toX - headLength * Math.cos(angle - Math.PI / 6),
              shape.toY - headLength * Math.sin(angle - Math.PI / 6)
            );
            this.ctx.moveTo(shape.toX, shape.toY);
            this.ctx.lineTo(
              shape.toX - headLength * Math.cos(angle + Math.PI / 6),
              shape.toY - headLength * Math.sin(angle + Math.PI / 6)
            );
            this.ctx.stroke();
            this.ctx.closePath();
          }
          break;

        default:
          break;
      }
    });
  }

  initTextDraw(x: number, y: number) {
    this.input = document.createElement("textarea");
    this.input.style.color = "#FFFFFF";
    this.input.autofocus = true;
    this.input.style.left = `${x}px`;
    this.input.style.top = `${y}px`;
    this.input.className = `${CaveatFont.className} `;
    this.input.style.fontSize = "24px";
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
        strokeStyle: this.selectedStrokeColor,
        strokeWidth: this.selectedStrokeWidth,
      };
      this.informWsServer(shape);
      document.body.removeChild(this.input);
    });
    this.selectedTool = null;
  }

  initPencilDraw(cords: Cords[], strokeWidth: number) {
    const path = new Path2D(this.generatePencilPath(cords, strokeWidth));
    this.ctx.save();
    this.ctx.fillStyle = this.selectedStrokeColor;
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
      case "circle":
        {
          const dx = x - shape.centerX;
          const dy = y - shape.centerY;
          const normalized =
            (dx * dx) /
              ((shape.radiusx + tolerance) * (shape.radiusx + tolerance)) +
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
              y <= shape.endY)
          ) {
            return true;
          }
        }
        break;
      case "arrow":
        {
          const headLength = 20;
          const dx = shape.toX - shape.fromX;
          const dy = shape.toY - shape.fromY;
          const angle = Math.atan2(dy, dx);
          const arrowLeftX =
            shape.toX - headLength * Math.cos(angle - Math.PI / 6);
          const arrowLeftY =
            shape.toX - headLength * Math.sin(angle - Math.PI / 6);
          const arrowRightX =
            shape.toX - headLength * Math.cos(angle + Math.PI / 6);
          const arrowRightY =
            shape.toX - headLength * Math.sin(angle + Math.PI / 6);

          if (
            // main line
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
              y <= shape.toY) ||
            // left side arrow
            (x >= arrowLeftX &&
              x <= shape.toX &&
              y <= arrowLeftY &&
              y >= shape.toY) ||
            (x >= arrowLeftX &&
              x <= shape.toX &&
              y >= arrowLeftY &&
              y <= shape.toY) ||
            (x <= arrowLeftX &&
              x >= shape.toX &&
              y <= arrowLeftY &&
              y >= shape.toY) ||
            (x <= arrowLeftX &&
              x >= shape.toX &&
              y >= arrowLeftY &&
              y <= shape.toY) ||
            // right side arrow
            (x >= arrowRightX &&
              x <= shape.toX &&
              y <= arrowRightY &&
              y >= shape.toY) ||
            (x >= arrowRightX &&
              x <= shape.toX &&
              y >= arrowRightY &&
              y <= shape.toY) ||
            (x <= arrowRightX &&
              x >= shape.toX &&
              y <= arrowRightY &&
              y >= shape.toY) ||
            (x <= arrowRightX &&
              x >= shape.toX &&
              y >= arrowRightY &&
              y <= shape.toY)
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

  private transformX(clientX: number): number {
    const rect = this.canvas.getBoundingClientRect();
    return clientX - rect.left;
  }

  private transformY(clientY: number): number {
    const rect = this.canvas.getBoundingClientRect();
    return clientY - rect.top;
  }

  initMouseHanlders() {
    this.mouseClickHandler = (e) => {
      const x = this.transformX(e.clientX);
      const y = this.transformY(e.clientY);

      if (this.selectedTool === "text") {
        this.initTextDraw(x, y);
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

    this.mouseUpHanlder = (e) => {
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
              strokeStyle: this.selectedStrokeColor,
              strokeWidth: this.selectedStrokeWidth,
            };
            this.informWsServer(shape);
          }
          break;

        case "circle":
          {
            shape = {
              type: "circle",
              centerX: this.startX + width / 2,
              centerY: this.startY + height / 2,
              radiusx: Math.abs((this.startX - endX) / 2),
              radiusY: Math.abs((this.startY - endY) / 2),
              strokeWidth: this.selectedStrokeWidth,
              strokeStyle: this.selectedStrokeColor,
            };
            this.informWsServer(shape);
          }
          break;

        case "line":
          {
            shape = {
              type: "line",
              startX: this.startX,
              startY: this.startY,
              endX: endX,
              endY: endY,
              strokeStyle: this.selectedStrokeColor,
              strokeWidth: this.selectedStrokeWidth,
            };
            this.informWsServer(shape);
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
              strokeStyle: this.selectedStrokeColor,
              strokeWidth: this.selectedStrokeWidth,
            };
            this.informWsServer(shape);
          }
          break;
        case "pencil":
          {
            shape = {
              type: "pencil",
              cords: this.freeDrawCords,
              style: "#FFFFFF",
              strokeStyle: this.selectedStrokeColor,
              strokeWidth: this.selectedStrokeWidth,
            };
            this.informWsServer(shape);
            this.initPencilDraw(this.freeDrawCords, 1);
            this.freeDrawCords = [];
            this.existingShapes.push(shape);
            this.clearCanvas();
          }
          break;
        case "arrow":
          {
            shape = {
              type: "arrow",
              fromX: this.startX,
              fromY: this.startY,
              toX: endX,
              toY: endY,
              strokeStyle: this.selectedStrokeColor,
              strokeWidth: this.selectedStrokeWidth,
            };
            this.existingShapes.push(shape);
            this.clearCanvas();
          }
          break;

        default:
          break;
      }
    };

    this.mouseMoveHandler = (e) => {
      if (!this.selectedTool) {
        return;
      }

      if (this.clicked) {
        const currentX = this.transformX(e.clientX);
        const currentY = this.transformY(e.clientY);
        const width = currentX - this.startX;
        const height = currentY - this.startY;
        this.clearCanvas();

        switch (this.selectedTool) {
          case "rect":
            this.ctx.beginPath();
            this.ctx.strokeStyle = this.selectedStrokeColor;
            this.ctx.lineWidth = this.selectedStrokeWidth;
            this.ctx.roundRect(this.startX, this.startY, width, height, [40]);
            this.ctx.closePath();
            this.ctx.stroke();
            break;
          case "circle":
            const centerX = this.startX + width / 2;
            const centerY = this.startY + height / 2;
            const radiusX = Math.abs(width / 2);
            const radiusY = Math.abs(height / 2);
            this.ctx.beginPath();
            this.ctx.strokeStyle = this.selectedStrokeColor;
            this.ctx.lineWidth = this.selectedStrokeWidth;
            this.ctx.ellipse(
              centerX,
              centerY,
              radiusX,
              radiusY,
              0,
              0,
              2 * Math.PI
            );
            this.ctx.stroke();
            this.ctx.closePath();
            break;
          case "line":
            this.ctx.beginPath();
            this.ctx.strokeStyle = this.selectedStrokeColor;
            this.ctx.lineWidth = this.selectedStrokeWidth;
            this.ctx.moveTo(this.startX, this.startY);
            this.ctx.lineTo(currentX, currentY);
            this.ctx.stroke();
            this.ctx.closePath();
            break;
          case "diamond":
            const xLeft = this.startX;
            const xRight = currentX;
            const yHorizontal = (this.startY + currentY) / 2;
            const xVertical = (this.startX + currentX) / 2;
            const yTop = this.startY;
            const yBottom = currentY;

            this.ctx.beginPath();
            this.ctx.strokeStyle = this.selectedStrokeColor;
            this.ctx.lineWidth = this.selectedStrokeWidth;
            this.ctx.moveTo(xLeft, yHorizontal);
            this.ctx.lineTo(xVertical, yTop);
            this.ctx.lineTo(xRight, yHorizontal);
            this.ctx.lineTo(xVertical, yBottom);
            this.ctx.lineTo(xLeft, yHorizontal);
            this.ctx.stroke();
            this.ctx.closePath();
            break;
          case "pencil":
            this.freeDrawCords.push({
              x: this.transformX(e.clientX),
              y: this.transformY(e.clientY),
            });
            this.clearCanvas();
            this.initPencilDraw(this.freeDrawCords, this.selectedStrokeWidth);
            break;
          case "arrow":
            const headLength = 20;
            const endX = this.transformX(e.clientX);
            const endY = this.transformY(e.clientY);
            const dx = endX - this.startX;
            const dy = endY - this.startY;
            const angle = Math.atan2(dy, dx);
            this.ctx.beginPath();
            this.ctx.strokeStyle = this.selectedStrokeColor;
            this.ctx.lineWidth = this.selectedStrokeWidth;
            this.ctx.moveTo(this.startX, this.startY);
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
                case "circle":
                  shape.centerX += offSetX;
                  shape.centerY += offSetY;
                  break;
                case "line":
                  shape.startX += offSetX;
                  shape.startY += offSetY;
                  shape.endX += offSetX;
                  shape.endY += offSetY;
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
                  shape.fromX += offSetX;
                  shape.toX += offSetX;
                  shape.fromY += offSetY;
                  shape.toY += offSetY;
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
      }
    };

    this.canvas.addEventListener("click", this.mouseClickHandler);
    this.canvas.addEventListener("mousedown", this.mouseDownHandler);
    this.canvas.addEventListener("mouseup", this.mouseUpHanlder);
    this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
  }

  cleanup() {
    this.canvas.removeEventListener("click", this.mouseClickHandler);
    this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
    this.canvas.removeEventListener("mouseup", this.mouseUpHanlder);
    this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
  }
}

import { Request } from "express";

export interface UserShapes {
  id: number;
  message: string;
  userId: number;
  roomId: number;
  createdAt: string;
  updatedAt: string;
}

export interface request extends Request {
  userId?: number;
}

export type FontSizeType = "S" | "M" | "L" | "XL";

export type strokeStyleType = "simple" | "rough" | "dense";

export interface translateCords {
  x: number;
  y: number;
}

export type shapesMessage =
  | {
      id: string;
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      strokeColor: string;
      strokeStyle: string;
      strokeWidth: number;
      cornerRadius: number;
    }
  | {
      id: string;
      type: "ellipse";
      centerX: number;
      centerY: number;
      radiusX: number;
      radiusY: number;
      strokeColor: string;
      strokeWidth: number;
      strokeStyle: string;
    }
  | {
      id: string;
      type: "line";
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      strokeColor: string;
      strokeWidth: number;
      strokeStyle: string;
    }
  | {
      id: string;
      type: "text";
      text: string;
      style: string;
      x: number;
      y: number;
      width: number;
      strokeColor: string;
      strokeWidth: number;
      fontSize: number;
    }
  | {
      id: string;
      type: "diamond";
      xLeft: number;
      xRight: number;
      yHorizontal: number;
      xVertical: number;
      yTop: number;
      yBottom: number;
      strokeColor: string;
      strokeWidth: number;
      strokeStyle: string;
    }
  | {
      id: string;
      type: "pencil";
      style: string;
      cords: Cords[];
      strokeColor: string;
      strokeWidth: number;
      strokeStyle: string;
    }
  | {
      id: string;
      type: "arrow";
      startX: number;
      endX: number;
      startY: number;
      endY: number;
      strokeColor: string;
      strokeWidth: number;
      strokeStyle: string;
    };

export type Shapes =
  | "select"
  | "rect"
  | "diamond"
  | "ellipse"
  | "line"
  | "pointer"
  | "text"
  | "pencil"
  | "eraser"
  | "arrow";

export interface Cords {
  x: number;
  y: number;
}

export interface FormData {
  name: string;
  email: string;
  password: string;
}

export interface LinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export interface ShapesResponse {
  userId: number;
  roomId: number;
  id: number;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserActions {
  type: "newShape" | "deleteShape" | "dragShape";
  id: string;
  shape?: shapesMessage
}
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

export type shapesMessage =
  | {
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      strokeStyle: string;
      strokeWidth: number;
    }
  | {
      type: "circle";
      centerX: number;
      centerY: number;
      radiusx: number;
      radiusY: number;
      strokeStyle: string;
      strokeWidth: number;
    }
  | {
      type: "line";
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      strokeStyle: string;
      strokeWidth: number;
    }
  | {
      type: "text";
      text: string;
      style: string;
      x: number;
      y: number;
      width: number;
      strokeStyle: string;
      strokeWidth: number;
    }
  | {
      type: "diamond";
      xLeft: number;
      xRight: number;
      yHorizontal: number;
      xVertical: number;
      yTop: number;
      yBottom: number;
      strokeStyle: string;
      strokeWidth: number;
    }
  | {
      type: "pencil";
      style: string;
      cords: Cords[];
      strokeStyle: string;
      strokeWidth: number;
    }
  | {
      type: "arrow";
      fromX: number;
      toX: number;
      fromY: number;
      toY: number;
      strokeStyle: string;
      strokeWidth: number;
    };

export type Shapes =
  | "select"
  | "rect"
  | "diamond"
  | "circle"
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

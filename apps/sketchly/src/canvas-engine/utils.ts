import { shapesMessage, ShapesResponse } from "@/config/type";
import axios from "axios";

export async function getExistingShapes(roomId: number) {
  try {
    const existingShapes: shapesMessage[] = [];
    const res = await axios.get<{ shapes: ShapesResponse[] }>(
      `http://localhost:3001/api/room/shapes/${roomId}`,
      {
        headers: {
          authorization:
            "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjF9.RMfebNn3ViUE40wpF_u-tMK-5kmVYsB1uwuRYE9EJl8",
        },
      }
    );
    const messages = res.data.shapes;

    if (!messages) {
      return [];
    }

    messages.map((msg: { message: string }) => {
      const messageData = JSON.parse(msg.message);
      existingShapes.push(messageData);
    });
    return existingShapes;
  } catch (err) {
    console.log(err);
    return [];
  }
}

export function getMidpoint(pointA: number[], pointB: number[]): number[] {
  return [(pointA[0] + pointB[0]) / 2, (pointA[1] + pointB[1]) / 2];
}

// Regex to fix precision of numbers in SVG path
export const TO_FIXED_PRECISION =
  /(\s?[A-Z]?,?-?[0-9]*\.[0-9]{0,2})(([0-9]|e|-)*)/g;

export function getSvgPathFromStroke(points: number[][]): string {
  if (!points.length) {
    return "";
  }

  const max = points.length - 1;

  return points
    .reduce(
      (acc, point, i, arr) => {
        if (i === max) {
          // Close the path by connecting back to the first point
          acc.push(point, getMidpoint(point, arr[0]), "L", arr[0], "Z");
        } else {
          // Create smooth curves between points
          acc.push(point, getMidpoint(point, arr[i + 1]));
        }
        return acc;
      },
      ["M", points[0], "Q"]
    )
    .join(" ")
    .replace(TO_FIXED_PRECISION, "$1"); // Limit precision for performance
}

export const getDashRough = (stroke: number) => [stroke, stroke * 6];
export const getDashDense = (stroke: number) => [stroke, stroke * 3];

export function distanceFromLine(x: number, y: number, x1: number, y1: number, x2: number, y2: number, threshold = 4) {
  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const lenSq = C*C + D*D;

  // If segment is a point
  if (lenSq === 0) {
    return Math.hypot(x - x1, y - y1);
  }

  // Clamp t between 0 and 1 for finite segment
  let t = (A*C + B*D) / lenSq;
  t = Math.max(0, Math.min(1, t));

  // Closest point on the segment
  const closestX = x1 + t * C;
  const closestY = y1 + t * D;

  // Distance from point to the segment
  const dist = Math.hypot(x - closestX, y - closestY);

  return dist;
}
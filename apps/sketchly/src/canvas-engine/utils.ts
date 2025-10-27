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

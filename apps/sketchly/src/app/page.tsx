import { RoomCanvas } from "@/components/RoomCanvas";

export default async function CanvasPage({
  params,
}: {
  params: Promise<{
    userId: number;
    roomId: number;
  }>;
}) {
  const roomId = (await params).roomId;

  return <RoomCanvas roomId={roomId} />;
}
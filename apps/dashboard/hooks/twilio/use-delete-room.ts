import { useMutation } from "@tanstack/react-query";
import { deleteRoom } from "@/actions/twilio/delete_room";

export default function useDeleteRoom() {
  return useMutation({
    mutationFn: async (roomName: string) => await deleteRoom(roomName),
  });
}

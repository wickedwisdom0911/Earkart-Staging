import { useMutation } from "@tanstack/react-query";
import { createRoom } from "@/actions/twilio/create_room";

export default function useCreateRoom() {
  return useMutation({
    mutationFn: async (roomName: string) => await createRoom(roomName),
  });
}

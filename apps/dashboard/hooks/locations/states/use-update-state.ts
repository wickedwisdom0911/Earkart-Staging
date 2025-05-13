import updateState from "@/actions/locations/states/update-state";
import { StateModelData } from "@/models/state.model";
import { useMutation } from "@tanstack/react-query";

export default function useUpdateState() {
  return useMutation({
    mutationFn: async (state: StateModelData) => {
      return await updateState(state);
    },
  });
}

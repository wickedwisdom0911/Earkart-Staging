import createState from "@/actions/locations/states/create-state";
import { StateModelData } from "@/models/state.model";
import { useMutation } from "@tanstack/react-query";

export default function useCrateState() {
  return useMutation({
    mutationFn: async (state: StateModelData) => {
      return await createState(state);
    },
  });
}

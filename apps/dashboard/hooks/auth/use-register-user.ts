"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import registerUser from "@/actions/auth/register-user";
import { CreateUserDto } from "@/models/user.model";

export const useRegisterUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (user: CreateUserDto) => registerUser(user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getAllUsers"] });
      queryClient.invalidateQueries({ queryKey: ["getUsersByRole"] });
    },
  });
};

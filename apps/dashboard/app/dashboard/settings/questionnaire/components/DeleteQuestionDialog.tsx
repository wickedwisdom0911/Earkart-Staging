"use client";

import { ReactNode, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import useDeleteQuestion from "@/hooks/questionnaire/use-delete-question";

interface DeleteQuestionDialogProps {
  trigger: ReactNode;
  questionId: string;
}

export default function DeleteQuestionDialog({ trigger, questionId }: DeleteQuestionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const qc = useQueryClient();
  const { mutate: deleteQuestion, isLoading } = useDeleteQuestion();

  const onConfirm = () => {
    deleteQuestion(questionId, {
      onSuccess: (res) => {
        if (res.success) {
          toast.success(res.message);
          qc.invalidateQueries({ queryKey: ["questions"] });
          setIsOpen(false);
        } else {
          toast.error(res.message);
        }
      },
      onError: (err: any) => toast.error(err.message),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Question?</DialogTitle>
        </DialogHeader>
        <p className="py-2">
          Are you sure you want to permanently delete this question?
        </p>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button className="bg-destructive text-white" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

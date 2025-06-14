"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type DialogOptions = {
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel?: () => void;
};

type UseDialogReturn = {
  Dialog: React.FC;
  openDialog: (options: DialogOptions) => void;
};

export const useDialog = (): UseDialogReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<DialogOptions | null>(null);

  const openDialog = useCallback((dialogOptions: DialogOptions) => {
    setOptions(dialogOptions);
    setIsOpen(true);
  }, []);

  const handleConfirm = useCallback(() => {
    options?.onConfirm();
    setIsOpen(false);
  }, [options]);

  const handleCancel = useCallback(() => {
    options?.onCancel?.();
    setIsOpen(false);
  }, [options]);

  const DialogComponent = useCallback(() => {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{options?.title}</DialogTitle>
            <DialogDescription>{options?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }, [isOpen, options, handleConfirm, handleCancel]);

  return {
    Dialog: DialogComponent,
    openDialog,
  };
};

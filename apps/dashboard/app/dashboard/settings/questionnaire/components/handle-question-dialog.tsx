"use client";

import { z } from "zod";
import { ReactNode, useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import useCreateQuestion from "@/hooks/questionnaire/use-create-questions";
import { useUpdateQuestion } from "@/hooks/questionnaire/use-update-question";
import {
  QuestionModelData,
  QuestionModelDataSchema,
} from "@/models/questionnaire.model";

export enum AnswerType {
  SHORT_TEXT = "SHORT_TEXT",
  LONG_TEXT = "LONG_TEXT",
  NUMBER = "NUMBER",
  DATE = "DATE",
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  CHECKBOX = "CHECKBOX",
}

interface HandleQuestionDialogProps {
  trigger: ReactNode;
  question?: QuestionModelData;
}

export default function HandleQuestionDialog({
  trigger,
  question,
}: HandleQuestionDialogProps) {
  const isEdit = Boolean(question);
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<z.infer<typeof QuestionModelDataSchema>>({
    resolver: zodResolver(QuestionModelDataSchema),
    defaultValues: {
      id: question?.id ?? "",
      text: question?.text ?? "",
      // use enum values here:
      type: question?.type ?? AnswerType.SHORT_TEXT,
      order: question?.order ?? 1,
      options:
        question?.options ??
        [{ label: "", value: "" }], // only used if MULTIPLE_CHOICE or CHECKBOX
    },
  });

  useEffect(() => {
    if (isEdit && question && isOpen) {
      form.reset({
        id: question.id,
        text: question.text,
        type: question.type,
        order: question.order,
        options: question.options ?? [{ label: "", value: "" }],
      });
    }
  }, [isEdit, question, isOpen, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const { mutate: createQuestion, isPending: creating } = useCreateQuestion();
  const { mutate: updateQuestion, isPending: updating } = useUpdateQuestion();

  const toggle = () => setIsOpen(!isOpen);

  const onSubmit = (values: z.infer<typeof QuestionModelDataSchema>) => {
    // values.type is one of AnswerType.*
    if (isEdit) {
      updateQuestion(values, {
        onSuccess: (res) => {
          if (res.success) {
            toast.success(res.message);
            form.reset();
            toggle();
          } else {
            toast.error(res.message);
          }
        },
        onError: (err) => toast.error(err.message),
      });
    } else {
      createQuestion(values, {
        onSuccess: (res) => {
          if (res.success) {
            toast.success(res.message);
            form.reset();
            toggle();
          } else {
            toast.error(res.message);
          }
        },
        onError: (err) => toast.error(err.message),
      });
    }
  };

  // Helper to know if we need options
  const needsOptions =
    form.watch("type") === AnswerType.MULTIPLE_CHOICE ||
    form.watch("type") === AnswerType.CHECKBOX;

  return (
    <Dialog open={isOpen} onOpenChange={toggle}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="flex flex-col gap-6 max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Question" : "Add Question"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Text</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Answer Type</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(AnswerType).map((t) => (
                            <SelectItem key={t} value={t}>
                              {t.replace(/_/g, " ").toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

<FormField
  control={form.control}
  name="order"
  render={({ field }) => (
    <FormItem className="w-24">
      <FormLabel>Order</FormLabel>
      <FormControl>
        <Input
          type="number"
          value={field.value || ""}
          onChange={(e) => field.onChange(e.target.valueAsNumber)}
        />
      </FormControl>
    </FormItem>
  )}
/>

            </div>

            {needsOptions && (
              <div className="space-y-2">
                <FormLabel>
                  {form.watch("type") === AnswerType.CHECKBOX
                    ? "Checkbox Options"
                    : "Multiple Choice Options"}
                </FormLabel>
                {fields.map((opt, idx) => (
                  <div
                    key={opt.id}
                    className="flex items-center gap-2"
                  >
                    <FormField
                      control={form.control}
                      name={`options.${idx}.label` as const}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Label" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`options.${idx}.value` as const}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Value" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Trash2
                      className="cursor-pointer"
                      onClick={() => remove(idx)}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-1"
                  onClick={() =>
                    append({ label: "", value: "" })
                  }
                >
                  <Plus /> Add Option
                </Button>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={creating || updating}
              >
                {isEdit ? "Update Question" : "Add Question"}
                {(creating || updating) && (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={toggle}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

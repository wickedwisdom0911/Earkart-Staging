"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { Edit, PlusIcon, Trash2 } from "lucide-react";

import { useGetAllQuestions } from "@/hooks/questionnaire/use-get-questions";
import useReorderQuestion from "@/hooks/questionnaire/use-reorder-question";

import HandleQuestionDialog from "./components/handle-question-dialog";
import DeleteQuestionDialog from "./components/DeleteQuestionDialog";

import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

export default function QuestionnairePage() {
  const { data, isLoading, isError } = useGetAllQuestions();
  const [items, setItems] = useState(data?.data ?? []);
  const { mutate: reorder } = useReorderQuestion();

  useEffect(() => {
    if (data?.data) {
      const sorted = [...data.data].sort((a, b) => a.order - b.order);
      setItems(sorted);
    }
  }, [data]);

  const onDragEnd = (result: DropResult) => {
    const { destination, source } = result;
    if (!destination || destination.index === source.index) return;

    const updated = Array.from(items);
    const [moved] = updated.splice(source.index, 1);
    updated.splice(destination.index, 0, moved);

    const withNewOrder = updated.map((q, idx) => ({
      ...q,
      order: idx + 1,
    }));

    setItems(withNewOrder);


    reorder({ id: moved.id, order: +destination.index + 1 });
  };

  return (
    <DashboardBodyWrapper
      pageTitle="Questionnaire"
      button={
        <HandleQuestionDialog
          trigger={
            <Button className="bg-primary-500 text-white flex items-center gap-1">
              <PlusIcon /> Add Question
            </Button>
          }
        />
      }
    >
      {isLoading && <div>Loading…</div>}
      {isError && <div>Error loading questions</div>}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="questions-droppable">
          {(droppableProvided) => (
            <div
              ref={droppableProvided.innerRef}
              {...droppableProvided.droppableProps}
              className="flex flex-col gap-2"
            >
              {items.map((question, index) => (
                <Draggable
                  key={question.id}
                  draggableId={question?.id}
                  index={index}
                >
                  {(draggableProvided, snapshot) => (
                    <div
                      ref={draggableProvided.innerRef}
                      {...draggableProvided.draggableProps}
                      {...draggableProvided.dragHandleProps}
                      className={`p-4 bg-primary-100 rounded-md flex justify-between items-center ${
                        snapshot.isDragging ? "shadow-lg bg-primary-200" : ""
                      }`}
                    >
                      <div>
                        <h3 className="font-semibold">{question.text}</h3>
                        <p className="text-sm text-gray-500">
                          Type: {question.type}
                        </p>
                        <p className="text-sm text-gray-500">
                          Order: {question.order}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <HandleQuestionDialog
                          trigger={
                            <Edit className="w-4 h-4 cursor-pointer" />
                          }
                          question={question}
                        />
                        <DeleteQuestionDialog
                          trigger={
                            <Trash2 className="w-4 h-4 cursor-pointer text-red-500" />
                          }
                          questionId={question?.id}
                        />
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {droppableProvided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </DashboardBodyWrapper>
  );
}

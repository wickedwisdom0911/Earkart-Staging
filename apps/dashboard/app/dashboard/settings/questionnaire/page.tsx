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
import { useGetUser } from "@/hooks/auth/use-get-user";
import { Role } from "@/models/enums";

export default function QuestionnairePage() {
  const { data, isLoading, isError } = useGetAllQuestions();
  const [items, setItems] = useState(data?.data ?? []);
  const { mutate: reorder } = useReorderQuestion();
  const { data: user } = useGetUser();
  const isAdmin = user?.role === Role.ADMIN || user?.role === Role.SUPER_ADMIN;

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
    const withNewOrder = updated.map((q, idx) => ({ ...q, order: idx + 1 }));
    setItems(withNewOrder);
    reorder({ id: moved.id, order: +destination.index + 1 });
  };

  // Derived stats
  const totalQuestions = items.length;
  const multipleChoiceCount = items.filter(
    (q) => q.type === "multiple_choice" || q.type === "MULTIPLE_CHOICE"
  ).length;
  const shortTextCount = items.filter(
    (q) => q.type === "short_text" || q.type === "SHORT_TEXT"
  ).length;

  return (
    <DashboardBodyWrapper>
      {/* ── Page header ── */}
      <div className="py-6 px-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Questionnaire</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage patient intake questions and their display order.
          </p>
        </div>
        <HandleQuestionDialog
          trigger={
            <Button className="bg-[#40A3DB] hover:bg-[#2d8bbf] text-white flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium">
              <PlusIcon className="w-4 h-4" />
              Add Question
            </Button>
          }
        />
      </div>

      <div className="px-8 pb-8 flex flex-col gap-4">
        {/* ── Stat cards ── */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total Questions" value={totalQuestions} color="text-[#40A3DB]" />
          <StatCard label="Multiple Choice" value={multipleChoiceCount} color="text-green-500" />
          <StatCard label="Short Text" value={shortTextCount} color="text-orange-500" />
        </div>

        {/* ── Questions table ── */}
        <div className="bg-white rounded-2xl border border-[#E2E2E2] overflow-hidden">
          {/* Table header — bg #F8F8F9, border bottom 1px #D6D6D6, padding 8px 40px */}
          <div className="grid grid-cols-[1fr_220px_120px] items-stretch px-10 border-b border-[#D6D6D6] bg-[#F8F8F9] h-[50px]">
            <span className="flex items-center text-xs font-medium text-gray-400 leading-none">Booking Id</span>
            <span className="flex items-center justify-center text-xs font-medium text-gray-400 leading-none">Type</span>
            <span className="flex items-center justify-end text-xs font-medium text-gray-400 leading-none">Order</span>
          </div>

          {isLoading && (
            <div className="py-12 text-center text-sm text-gray-400">
              Loading…
            </div>
          )}
          {isError && (
            <div className="py-12 text-center text-sm text-red-400">
              Error loading questions
            </div>
          )}

          {!isLoading && !isError && items.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400">
              No questions yet. Click "+ Add Question" to get started.
            </div>
          )}

          {!isLoading && !isError && items.length > 0 && (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="questions-droppable">
                {(droppableProvided) => (
                  <div
                    ref={droppableProvided.innerRef}
                    {...droppableProvided.droppableProps}
                  >
                    {items.map((question, index) => (
                      <Draggable
                        key={question.id}
                        draggableId={question.id}
                        index={index}
                      >
                        {(draggableProvided, snapshot) => (
                          <div
                            ref={draggableProvided.innerRef}
                            {...draggableProvided.draggableProps}
                            {...draggableProvided.dragHandleProps}
                            className={`grid grid-cols-[1fr_220px_120px] items-center min-h-[52px] px-10 py-3 border-b border-[#D6D6D6] last:border-b-0 transition-colors cursor-grab active:cursor-grabbing group ${
                              snapshot.isDragging
                                ? "bg-[#40A3DB]/5 shadow-md"
                                : "bg-white hover:bg-gray-50/40"
                            }`}
                          >
                            {/* Question text */}
                            <span className="text-sm text-gray-800 pr-4 truncate">
                              {question.text}
                            </span>

                            {/* Type badge */}
                            <div className="flex justify-center">
                              <TypeBadge type={question.type} />
                            </div>

                            {/* Order + actions */}
                            <div className="flex items-center justify-end gap-3">
                              <span className="text-sm text-gray-500">
                                {question.order}
                              </span>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <HandleQuestionDialog
                                  trigger={
                                    <Edit className="w-3.5 h-3.5 cursor-pointer text-gray-400 hover:text-[#40A3DB] transition-colors" />
                                  }
                                  question={question}
                                />
                                {!isAdmin && (
                                  <DeleteQuestionDialog
                                    trigger={
                                      <Trash2 className="w-3.5 h-3.5 cursor-pointer text-gray-400 hover:text-red-500 transition-colors" />
                                    }
                                    questionId={question.id}
                                  />
                                )}
                              </div>
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
          )}
        </div>
      </div>
    </DashboardBodyWrapper>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E2E2] px-6 py-5">
      <p className="text-sm text-gray-500 mb-2">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

// ── Type badge ─────────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: string }) {
  const normalized = type?.toLowerCase();
  const isMultiple =
    normalized === "multiple_choice" || normalized === "multiplechoice";
  const isShort = normalized === "short_text" || normalized === "shorttext";
  const isCheckbox = normalized === "checkbox";

  if (isMultiple) {
    return (
      <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-200">
        Multiple Choice
      </span>
    );
  }
  if (isShort) {
    return (
      <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-500 border border-orange-200">
        Short Text
      </span>
    );
  }
  if (isCheckbox) {
    return (
      <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-300">
        Checkbox
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
      {type}
    </span>
  );
}
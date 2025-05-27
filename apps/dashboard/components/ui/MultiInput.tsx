"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dispatch, SetStateAction, forwardRef, useState } from "react";

// Simple Badge fallback
const Badge = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "0.25em 0.5em",
      background: "#eee",
      borderRadius: "0.5em",
      fontSize: "0.9em",
    }}
    {...props}
  >
    {children}
  </span>
);

type InputTagsProps = React.ComponentProps<"input"> & {
  value: string[];
  onChange: Dispatch<SetStateAction<string[]>>;
};

export const InputTags = forwardRef<HTMLInputElement, InputTagsProps>(
  ({ value, onChange, ...props }, ref) => {
    const [pendingDataPoint, setPendingDataPoint] = useState("");

    const addPendingDataPoint = () => {
      if (pendingDataPoint) {
        const newDataPoints = new Set([...value, pendingDataPoint]);
        onChange(Array.from(newDataPoints));
        setPendingDataPoint("");
      }
    };

    return (
      <>
        <div className="flex">
          <Input
            value={pendingDataPoint}
            onChange={(e) => setPendingDataPoint(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "," || e.key === " ") {
                e.preventDefault();
                addPendingDataPoint();
              }
            }}
            className="rounded-r-none"
            {...props}
            ref={ref}
          />
          <Button
            type="button"
            variant="secondary"
            className="rounded-l-none border border-l-0"
            onClick={addPendingDataPoint}
          >
            Add
          </Button>
        </div>
        {value.length > 0 && (
          <div className="rounded-md min-h-[2.5rem] overflow-y-auto py-2 flex gap-2 flex-wrap items-center">
            {value.map((item: string, idx: number) => (
              <Badge key={idx}>
                {item}
                <button
                  type="button"
                  className="w-3 ml-2"
                  onClick={() => {
                    onChange(value.filter((i: string) => i !== item));
                  }}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}
      </>
    );
  }
);

InputTags.displayName = "InputTags";

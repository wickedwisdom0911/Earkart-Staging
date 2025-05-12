import { StatusEnum } from "@/models/enums";
import { useState, useEffect } from "react";

type StatusToggleProps = {
  value: StatusEnum;
  onChange: (value: StatusEnum) => void;
};

export default function StatusToggle({ value, onChange }: StatusToggleProps) {
  const [status, setStatus] = useState<StatusEnum>(value);

  // Keep local state in sync with parent value
  useEffect(() => {
    setStatus(value);
  }, [value]);

  const handleToggle = () => {
    setStatus((prev) => {
      const newValue =
        prev === StatusEnum.ACTIVE ? StatusEnum.INACTIVE : StatusEnum.ACTIVE;
      onChange(newValue);
      return newValue;
    });
  };

  return (
    <div
      className={`flex items-center w-fit gap-2 px-4 py-2 rounded-md transition-colors cursor-pointer select-none ${
        status === StatusEnum.ACTIVE ? "bg-green-100" : "bg-red-100"
      }`}
      onClick={handleToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleToggle();
      }}
    >
      <span
        className={`${status === StatusEnum.ACTIVE ? "text-green-500" : "text-red-500"} font-medium`}
      >
        {status === StatusEnum.ACTIVE ? "Active" : "Inactive"}
      </span>
    </div>
  );
}

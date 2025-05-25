import { StatusEnum } from "@/models/enums";

type StatusToggleProps = {
  value: StatusEnum;
  onChange: (value: StatusEnum) => void;
};

export default function StatusToggle({ value, onChange }: StatusToggleProps) {
  const handleToggle = () => {
    const newValue =
      value === StatusEnum.ACTIVE ? StatusEnum.INACTIVE : StatusEnum.ACTIVE;
    onChange(newValue);
  };

  return (
    <div
      className={`flex items-center w-fit gap-2 px-4 py-2 rounded-md transition-colors cursor-pointer select-none ${
        value === StatusEnum.ACTIVE ? "bg-green-100" : "bg-red-100"
      }`}
      onClick={handleToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleToggle();
      }}
    >
      <span
        className={`${
          value === StatusEnum.ACTIVE ? "text-green-500" : "text-red-500"
        } font-medium`}
      >
        {value === StatusEnum.ACTIVE ? "Active" : "Inactive"}
      </span>
    </div>
  );
}

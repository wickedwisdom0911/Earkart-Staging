import * as React from "react";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { WeekDays } from "@/models/enums";

interface WorkingDaysSelectorProps {
  value?: WeekDays[];
  onChange: (days: WeekDays[]) => void;
  initialValue?: WeekDays[];
}

const weekDayOptions = [
  { value: WeekDays.MONDAY, label: "Monday" },
  { value: WeekDays.TUESDAY, label: "Tuesday" },
  { value: WeekDays.WEDNESDAY, label: "Wednesday" },
  { value: WeekDays.THURSDAY, label: "Thursday" },
  { value: WeekDays.FRIDAY, label: "Friday" },
  { value: WeekDays.SATURDAY, label: "Saturday" },
  { value: WeekDays.SUNDAY, label: "Sunday" },
];

export default function WorkingDaysSelector({
  value,
  onChange,
  initialValue,
}: WorkingDaysSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const isControlled = value !== undefined;
  const [internalDays, setInternalDays] = React.useState<WeekDays[]>(
    initialValue || []
  );

  React.useEffect(() => {
    if (!isControlled && initialValue) {
      setInternalDays(initialValue);
    }
  }, [initialValue, isControlled]);

  const selectedDays = isControlled ? value! : internalDays;

  const toggleDay = (day: WeekDays) => {
    let newDays;
    if (selectedDays.includes(day)) {
      newDays = selectedDays.filter((d) => d !== day);
    } else {
      newDays = [...selectedDays, day];
    }
    if (!isControlled) setInternalDays(newDays);
    onChange(newDays);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedDays.length > 0
            ? selectedDays
                .map(
                  (d) =>
                    weekDayOptions
                      .find((o) => o.value === d)
                      ?.label?.substring(0, 2) || ""
                )
                .join(", ")
            : "Select working days..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <div className="flex flex-col gap-1 p-2">
          {weekDayOptions.map((day) => (
            <label
              key={day.value}
              className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-accent"
            >
              <input
                type="checkbox"
                checked={selectedDays.includes(day.value)}
                onChange={() => toggleDay(day.value)}
                className="accent-primary"
              />
              <span>{day.label}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

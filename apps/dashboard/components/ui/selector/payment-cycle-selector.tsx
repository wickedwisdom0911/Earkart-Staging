import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { useEffect } from "react";
import { PaymentCycle } from "@/models/enums";

interface PaymentCycleSelectorProps {
  value?: PaymentCycle | null;
  onChange: (cycle: PaymentCycle | null) => void;
  initialValue?: PaymentCycle | null;
}

const paymentCycleOptions = [
  { value: PaymentCycle.WEEKLY, label: "Weekly" },
  { value: PaymentCycle.MONTHLY, label: "Monthly" },
  { value: PaymentCycle.QUARTERLY, label: "Quarterly" },
  { value: PaymentCycle.YEARLY, label: "Yearly" },
];

export default function PaymentCycleSelector({
  value,
  onChange,
  initialValue,
}: PaymentCycleSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedCycle, setSelectedCycle] = React.useState<{
    value: PaymentCycle;
    label: string;
  } | null>(null);

  useEffect(() => {
    if (initialValue) {
      setSelectedCycle(
        paymentCycleOptions.find((g) => g.value === initialValue) || null
      );
    } else {
      setSelectedCycle(null);
    }
  }, [initialValue]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedCycle ? selectedCycle.label : "Select payment cycle..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search payment cycle..." />
          <CommandList>
            <CommandEmpty>No payment cycle found.</CommandEmpty>
            <CommandGroup>
              {paymentCycleOptions.map((cycle) => (
                <CommandItem
                  key={cycle.value}
                  value={cycle.value}
                  className="cursor-pointer"
                  onSelect={() => {
                    onChange(cycle.value);
                    setSelectedCycle(cycle);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === cycle.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {cycle.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

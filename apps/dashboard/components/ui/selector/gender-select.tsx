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
import { Gender } from "@/models/enums";

interface GenderSelectProps {
  value?: Gender | null;
  onChange: (gender: Gender | null) => void;
}

const genderOptions = [
  { value: Gender.MALE, label: "Male" },
  { value: Gender.FEMALE, label: "Female" },
  { value: Gender.OTHER, label: "Other" },
];

export default function GenderSelect({ value, onChange }: GenderSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedGender = genderOptions.find((g) => g.value === value) || null;

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[250px] justify-between"
        >
          {selectedGender ? selectedGender.label : "Select gender..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandInput placeholder="Search gender..." />
          <CommandList>
            <CommandEmpty>No gender found.</CommandEmpty>
            <CommandGroup>
              {genderOptions.map((gender) => (
                <CommandItem
                  key={gender.value}
                  value={gender.value}
                  className="cursor-pointer"
                  onSelect={() => {
                    onChange(gender.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === gender.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {gender.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

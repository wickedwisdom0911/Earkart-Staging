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
import { useEffect, useMemo } from "react";
import { StateModelData } from "@/models/state.model";
import useGetStatesByCountryId from "@/hooks/locations/states/use-get-states-by-country-id";

interface StateSelectorProps {
  value?: string | null;
  onChange: (stateId: string | null) => void;
  initialValue?: string | null;
  countryId: string;
}

export default function StateSelector({
  value,
  onChange,
  initialValue,
  countryId,
}: StateSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const { data, isLoading } = useGetStatesByCountryId(countryId);

  const [selectedState, setSelectedState] =
    React.useState<StateModelData | null>(null);

  const states = useMemo(() => {
    return data?.data || [];
  }, [data]);

  useEffect(() => {
    if (initialValue && states.length > 0) {
      setSelectedState(states.find((s) => s.id === initialValue) || null);
    } else if (!initialValue) {
      setSelectedState(null);
    }
  }, [initialValue, states]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedState ? selectedState.name : "Select state..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Loading..." : "No country found."}
            </CommandEmpty>
            <CommandGroup>
              {states.map((state) => (
                <CommandItem
                  key={state.id}
                  value={state.id ?? ""}
                  className="cursor-pointer"
                  onSelect={() => {
                    onChange(state.id ?? null);
                    setSelectedState(state);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === state.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {state.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

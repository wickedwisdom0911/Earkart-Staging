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
import { DistrictModelData } from "@/models/district.model";
import useGetDistrictsByState from "@/hooks/locations/districts/use-get-districts-by-state";

interface DistrictSelectorProps {
  value?: string | null;
  onChange: (districtId: string | null) => void;
  initialValue?: string | null;
  stateId: string;
}

export default function DistrictSelector({
  value,
  onChange,
  initialValue,
  stateId,
}: DistrictSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const { data, isLoading } = useGetDistrictsByState(stateId);

  const [selectedDistrict, setSelectedDistrict] =
    React.useState<DistrictModelData | null>(null);

  const districts = useMemo(() => {
    return data?.data || [];
  }, [data]);

  useEffect(() => {
    if (initialValue && districts.length > 0) {
      setSelectedDistrict(districts.find((d) => d.id === initialValue) || null);
    } else if (!initialValue) {
      setSelectedDistrict(null);
    }
  }, [initialValue, districts]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedDistrict ? selectedDistrict.name : "Select district..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search district..." />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Loading..." : "No district found."}
            </CommandEmpty>
            <CommandGroup>
              {districts.map((district) => (
                <CommandItem
                  key={district.id}
                  value={district.id ?? ""}
                  className="cursor-pointer"
                  onSelect={() => {
                    onChange(district.id ?? null);
                    setSelectedDistrict(district);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === district.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {district.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

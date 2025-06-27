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
import { CityModelData } from "@/models/city.model";
import useGetCitiesByState from "@/hooks/locations/cities/use-get-cities-by-district";

interface CitySelectorProps {
  value?: string | null;
  onChange: (cityId: string | null) => void;
  initialValue?: string | null;
  stateId: string;
}

export default function CitySelector({
  value,
  onChange,
  initialValue,
  stateId,
}: CitySelectorProps) {
  const [open, setOpen] = React.useState(false);
  const { data, isLoading } = useGetCitiesByState(stateId);

  const [selectedCity, setSelectedCity] = React.useState<CityModelData | null>(
    null
  );

  const cities = useMemo(() => {
    return data?.data || [];
  }, [data]);

  useEffect(() => {
    if (initialValue) {
      setSelectedCity(cities.find((c) => c.id === initialValue) || null);
    } else {
      setSelectedCity(null);
    }
  }, [initialValue, cities]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedCity ? selectedCity.name : "Select city..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search city..." />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Loading..." : "No city found."}
            </CommandEmpty>
            <CommandGroup>
              {cities.map((city) => (
                <CommandItem
                  key={city.id}
                  value={city.id ?? ""}
                  className="cursor-pointer"
                  onSelect={() => {
                    onChange(city.id ?? null);
                    setSelectedCity(city);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === city.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {city.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

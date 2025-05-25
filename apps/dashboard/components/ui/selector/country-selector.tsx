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
import useGetAllCountries from "@/hooks/locations/use-get-all-countries";
import { CountryModelData } from "@/models/country.model";
import { useEffect, useMemo } from "react";

interface CountrySelectorProps {
  value?: string | null;
  onChange: (countryId: string | null) => void;
  initialValue?: string | null;
}

export default function CountrySelector({
  value,
  onChange,
  initialValue,
}: CountrySelectorProps) {
  const [open, setOpen] = React.useState(false);
  const { data, isLoading } = useGetAllCountries();

  const [selectedCountry, setSelectedCountry] =
    React.useState<CountryModelData | null>(null);

  const countries = useMemo(() => {
    return data?.data || [];
  }, [data]);

  useEffect(() => {
    if (initialValue) {
      setSelectedCountry(countries.find((c) => c.id === initialValue) || null);
    } else {
      setSelectedCountry(null);
    }
  }, [initialValue, countries]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedCountry ? selectedCountry.name : "Select country..."}
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
              {countries.map((country) => (
                <CommandItem
                  key={country.id}
                  value={country.id ?? ""}
                  className="cursor-pointer"
                  onSelect={() => {
                    onChange(country.id ?? null);
                    setSelectedCountry(country);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === country.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {country.name} ({country.code})
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

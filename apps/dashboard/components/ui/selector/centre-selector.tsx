import * as React from "react";
import { Check } from "lucide-react";
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
import useGetAllCentres from "@/hooks/centre/use-get-all-centres";
import { CentreModelData } from "@/models/centre.model";

interface CentreSelectorProps {
  value?: string | null;
  onChange: (centreId: string | null) => void;
  centres?: CentreModelData[];
  initialValue?: string | null;
}

export default function CentreSelector({
  value,
  onChange,
  initialValue,
}: CentreSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const { data, isLoading, isError } = useGetAllCentres();
  const centres: CentreModelData[] = React.useMemo(
    () => data?.data || [],
    [data]
  );

  const [selectedCentre, setSelectedCentre] =
    React.useState<CentreModelData | null>(null);

  React.useEffect(() => {
    if (initialValue) {
      setSelectedCentre(centres.find((c) => c.id === initialValue) || null);
    } else {
      setSelectedCentre(null);
    }
  }, [initialValue, centres]);

  React.useEffect(() => {
    if (value) {
      setSelectedCentre(centres.find((c) => c.id === value) || null);
    }
  }, [value, centres]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedCentre
            ? selectedCentre?.user?.name +
              (selectedCentre?.code ? ` (${selectedCentre?.code})` : "")
            : "Select centre..."}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search centre..." />
          <CommandList>
            <CommandEmpty>
              {isLoading
                ? "Loading..."
                : isError
                  ? "Failed to load centres."
                  : "No centre found."}
            </CommandEmpty>
            <CommandGroup>
              {centres.map((centre) => (
                <CommandItem
                  key={centre.id}
                  value={centre.id}
                  className="cursor-pointer"
                  onSelect={() => {
                    onChange(centre.id ?? null);
                    setSelectedCentre(centre);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === centre.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {centre?.user?.name +
                    (centre?.code ? ` (${centre?.code})` : "")}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

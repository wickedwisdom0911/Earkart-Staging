"use client";
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
import useGetAllLanguages from "@/hooks/languages/use-get-all-languages";

interface MultiLanguageSelectorProps {
  value?: string[];
  onChange: (languageIds: string[]) => void;
}

export default function MultiLanguageSelector({
  value = [],
  onChange,
}: MultiLanguageSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const { data, isLoading } = useGetAllLanguages();

  // Find the selected language objects for display
  const allLanguages = data?.data ?? [];
  const safeValue = (value ?? []).filter(
    (v): v is string => typeof v === "string"
  );
  const selectedLanguages = allLanguages.filter(
    (lang) => lang.id && safeValue.includes(lang.id)
  );

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[250px] justify-between"
        >
          {selectedLanguages.length > 0
            ? selectedLanguages.map((l) => l.name).join(", ")
            : "Select languages..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandInput placeholder="Search languages..." />
          <CommandList>
            <CommandEmpty>No languages found.</CommandEmpty>
            <CommandGroup>
              {isLoading
                ? "Loading..."
                : allLanguages.map((lang) => (
                    <CommandItem
                      key={lang.id}
                      value={lang.id}
                      className="cursor-pointer"
                      onSelect={() => {
                        if (lang.id && safeValue.includes(lang.id)) {
                          onChange(safeValue.filter((id) => id !== lang.id));
                        } else if (lang.id) {
                          onChange([...safeValue, lang.id]);
                        }
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          lang.id && safeValue.includes(lang.id)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {lang.name}
                    </CommandItem>
                  ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

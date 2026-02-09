"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Client {
  id: string;
  name: string;
}

interface SearchableClientSelectProps {
  clients: Client[];
  value: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const SearchableClientSelect = ({ 
  clients, 
  value, 
  onSelect, 
  disabled,
  placeholder = "Select client..." 
}: SearchableClientSelectProps) => {
  const [open, setOpen] = React.useState(false);

  const selectedClient = clients.find((client) => client.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-white border-slate-200 hover:bg-slate-50 h-10"
          disabled={disabled}
        >
          {selectedClient ? (
            <span className="truncate font-medium text-slate-900">{selectedClient.name}</span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command className="rounded-xl border-none shadow-2xl">
          <CommandInput placeholder="Search clients..." className="h-11" />
          <CommandList className="max-h-[300px]">
            <CommandEmpty className="py-6 text-center text-sm text-slate-500">
              <div className="flex flex-col items-center gap-2">
                <Search size={24} className="text-slate-300" />
                <p>No client found.</p>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.name}
                  onSelect={() => {
                    onSelect(client.id);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between py-3 px-4 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold uppercase">
                      {client.name.charAt(0)}
                    </div>
                    <span className="font-medium">{client.name}</span>
                  </div>
                  <Check
                    className={cn(
                      "h-4 w-4 text-indigo-600",
                      value === client.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SearchableClientSelect;
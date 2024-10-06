import { useEffect, useMemo, useState } from "react";
import { To, useNavigate } from "react-router-dom";
import {
  AppWindowIcon,
  CircleXIcon,
  CpuIcon,
  SearchIcon,
  UsersIcon,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Tooltipped } from "@/components/ui/tooltipped";

import { useData } from "@/lib/api";

export function SearchMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (
        e.key === "k" &&
        (e.metaKey || e.ctrlKey) &&
        !e.shiftKey &&
        !e.altKey
      ) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const { data: functions } = useData(`functions`);
  const mappedFunctions = useMemo(() => {
    return functions
      ?.map((func: any) => ({
        ...func,
        lastInvocation: func.lastInvocation || "0",
        tags: [
          `Region: ${func.region}`,
          ...Object.entries(func.tags || {})
            .filter(([tag]) => !tag.startsWith("aws:cloudformation:"))
            .filter(([tag]) => !tag.startsWith("lumigo:"))
            .map(([tag, value]) => {
              return `${tag.toLowerCase()}: ${value}`;
            }),
        ],
      }))
      .sort((a, b) => (a.lastInvocation > b.lastInvocation ? -1 : 1));
  }, [functions]);

  const go = (url: To) => {
    navigate(url);
    setOpen(false);
  };

  return (
    <>
      <Tooltipped
        title={
          <>
            Search <span className="text-muted-foreground">⌘K</span>
          </>
        }
      >
        <Button variant="outline" size="icon" onClick={() => setOpen(true)}>
          <SearchIcon className="size-4" />
        </Button>
      </Tooltipped>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search functions or commands..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem onSelect={() => go(`/functions`)}>
              <AppWindowIcon className="mr-2 h-4 w-4" />
              <span>View functions</span>
            </CommandItem>
            <CommandItem onSelect={() => go(`/errors`)}>
              <CircleXIcon className="mr-2 h-4 w-4" />
              <span>View errors</span>
            </CommandItem>
            <CommandItem onSelect={() => go(`/users`)}>
              <UsersIcon className="mr-2 h-4 w-4" />
              <span>View users</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          {mappedFunctions ? (
            <CommandGroup heading="Functions">
              {mappedFunctions.map(
                (func: { region: string; name: string; tags: string[] }) => (
                  <CommandItem
                    key={func.region + func.name}
                    onSelect={() =>
                      go(`/functions/${func.region}/${func.name}/invocations`)
                    }
                  >
                    <div className="flex">
                      <CpuIcon className="mr-2 h-4 w-4" />
                      <div className="flex-1">
                        <div className="truncate">{func.name}</div>
                        <div className="text-muted-foreground text-xs truncate">
                          {func.tags.join(", ")}
                        </div>
                      </div>
                    </div>
                  </CommandItem>
                ),
              )}
            </CommandGroup>
          ) : null}
        </CommandList>
      </CommandDialog>
    </>
  );
}

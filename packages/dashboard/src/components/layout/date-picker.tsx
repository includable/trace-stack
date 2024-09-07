import { createContext, useContext, useEffect, useState } from "react";
import { CalendarIcon } from "lucide-react";
import { subDays, format, subHours, parse } from "date-fns";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";

const store = createContext({});
export const useDateRange = () => useContext(store);
const { Provider } = store;

const ranges = [
  {
    label: "Last hour",
    startDate: subHours(new Date(), 1),
    endDate: new Date(),
  },
  {
    label: "Last 4 hours",
    startDate: subHours(new Date(), 4),
    endDate: new Date(),
  },
  {
    label: "Last 24 hours",
    startDate: subDays(new Date(), 1),
    endDate: new Date(),
  },
  {
    label: "Last 3 days",
    startDate: subDays(new Date(), 3),
    endDate: new Date(),
  },
  {
    label: "Last 7 days",
    startDate: subDays(new Date(), 7),
    endDate: new Date(),
  },
];

export const DateRangeProvider = ({ children }) => {
  const [startDate, setStartDate] = useState(ranges[2].startDate);
  const [endDate, setEndDate] = useState(ranges[2].endDate);
  const [label, setLabel] = useState("Last 24 hours");

  return (
    <Provider
      value={{
        startDate,
        endDate,
        label,
        setStartDate,
        setEndDate,
        setLabel,
      }}
    >
      {children}
    </Provider>
  );
};

const DatePicker = ({}) => {
  const { startDate, endDate, label, setStartDate, setEndDate, setLabel } =
    useDateRange();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const range = ranges.find(
      (range) =>
        range.startDate.valueOf() === startDate.valueOf() &&
        range.endDate.valueOf() === endDate.valueOf(),
    );
    setLabel(
      range?.label || `${format(startDate, "PP")} – ${format(endDate, "PP")}`,
    );
  }, [startDate, endDate]);

  const handleClose = ({ to, from, label = "" }) => {
    setOpen(false);

    setStartDate(to);
    setEndDate(from);
    setLabel(label || `${format(to, "PP")} – ${format(from, "PP")}`);
  };

  return (
    <Popover open={open} onOpenChange={(open) => setOpen(open)}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="px-3"
        >
          <CalendarIcon className="h-[1.1rem] w-[1.1rem] mr-2" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex divide-x">
          <div className="p-3 w-40">
            {ranges.map((option) => (
              <Button
                key={option.label}
                variant={option.label === label ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() =>
                  handleClose({
                    to: option.startDate,
                    from: option.endDate,
                    label: option.label,
                  })
                }
              >
                {option.label}
              </Button>
            ))}
          </div>
          <div>
            <Calendar
              className="p-4 flex-1"
              initialFocus
              mode="range"
              defaultMonth={startDate}
              selected={{ from: startDate, to: endDate }}
              onSelect={(range) => {
                if (range?.from) {
                  setStartDate(range.from);
                }
                if (range?.to) {
                  setEndDate(range.to);
                }
              }}
            />
            <div className="flex items-center justify-between gap-2 p-4 pt-0">
              <Input
                type="time"
                className="flex-1"
                value={format(startDate, "HH:mm")}
                onChange={(e) =>
                  setStartDate(parse(e.target.value, "HH:mm", startDate))
                }
              />
              <span className="text-muted">&ndash;</span>
              <Input
                type="time"
                className="flex-1"
                value={format(endDate, "HH:mm")}
                onChange={(e) =>
                  setEndDate(parse(e.target.value, "HH:mm", endDate))
                }
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DatePicker;

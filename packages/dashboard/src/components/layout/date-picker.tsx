import { createContext, useContext, useState } from "react";
import { Calendar } from "lucide-react";
import { DateRangePicker, createStaticRanges } from "react-date-range";
import { subDays, format, differenceInDays, subMonths } from "date-fns";
import { enGB } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

const store = createContext({});
export const useDateRange = () => useContext(store);
const { Provider } = store;

export const DateRangeProvider = ({ children }) => {
  const [startDate, setStartDate] = useState(subDays(new Date(), 1));
  const [endDate, setEndDate] = useState(new Date());
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
  const [dateRange, setDateRange] = useState([
    { startDate, endDate, key: "selection" },
  ]);

  const handleClose = (range) => {
    setOpen(false);
    const { startDate, endDate } = range[0];
    const selected = ranges.find(
      (option) => option.isSelected(range[0]) === true,
    );
    const label = selected
      ? selected.label
      : `${format(startDate, "PP")} – ${format(endDate, "PP")}`;

    setStartDate(startDate);
    setEndDate(endDate);
    setLabel(label);
  };

  const getDayIndex = (date) => Math.floor(date.valueOf() / 86400000);

  const handleSelect = (item) => {
    setDateRange([item.selection]);
    if (
      getDayIndex(item.selection.startDate) !==
      getDayIndex(item.selection.endDate)
    ) {
      // automatically close after a new range has been selected
      handleClose([item.selection]);
    }
  };

  const ranges = createStaticRanges([
    {
      label: "Last 24 hours",
      range: () => ({
        startDate: subDays(new Date(), 1),
        endDate: new Date(),
      }),
    },
    {
      label: "Last 4 days",
      range: () => ({
        startDate: subDays(new Date(), 4),
        endDate: new Date(),
      }),
    },
    {
      label: "Last 7 days",
      range: () => ({
        startDate: subDays(new Date(), 7),
        endDate: new Date(),
      }),
    },
  ]);

  return (
    <Popover open={open} onOpenChange={(open) => setOpen(open)}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="px-3"
        >
          <Calendar className="h-[1.1rem] w-[1.1rem] mr-2" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <DateRangePicker
          locale={enGB}
          onChange={handleSelect}
          minDate={new Date("2020-01-01")} // TODO: define based on data retention config
          maxDate={new Date()}
          ranges={dateRange}
          shownDate={dateRange[0].endDate}
          direction="horizontal"
          staticRanges={ranges}
        />
      </PopoverContent>
    </Popover>
  );
};

export default DatePicker;

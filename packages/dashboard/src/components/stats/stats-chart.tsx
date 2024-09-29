import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { differenceInDays, format } from "date-fns";
import { Loader } from "lucide-react";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useDateRange } from "@/components/layout/date-picker";
import { useData } from "@/lib/api";
import { useMemo } from "react";

export function StatsChart({
  title,
  region,
  name,
  metric = "sum",
  suffix = "",
  color = "var(--chart-1)",
}: {
  title: string;
  region?: string;
  name: string;
  metric?: "sum" | "average";
  suffix?: string;
  color?: string;
}) {
  const { startDate, endDate } = useDateRange();
  const { data } = useData(`stats/${region}/${name}`);

  const isLongRange = differenceInDays(endDate, startDate) > 4;

  const total = useMemo(() => {
    if (!data) return null;

    const nonZeroData = data.filter((d) => d[metric] > 0);
    if (!nonZeroData.length) return 0;

    const sum = nonZeroData.reduce((acc, curr) => acc + curr[metric], 0);
    return metric === "sum" ? sum : sum / nonZeroData.length;
  }, [data]);

  return (
    <div className="p-7 pt-6 px-6 pb-4">
      <h3 className="text-sm pl-1 pb-3">
        <span className="font-semibold">{title}</span>{" "}
        <span className="text-muted-foreground">
          {total?.toLocaleString("en", { maximumFractionDigits: 1 })} {suffix}
        </span>
      </h3>
      <ChartContainer
        config={{
          [metric]: {
            label: title,
            color: color,
          },
        }}
        className="h-[180px] w-full"
      >
        {data ? (
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              padding={{ left: 14, right: 0 }}
              tickLine={false}
              tickMargin={8}
              axisLine={false}
              minTickGap={30}
              interval="preserveStart"
              tickFormatter={(value) =>
                isLongRange
                  ? format(new Date(value), "P")
                  : format(new Date(value), "p")
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => format(new Date(label), "Pp")}
                  valueFormatter={(value) => {
                    return (
                      value.toLocaleString("en", { maximumFractionDigits: 1 }) +
                      suffix
                    );
                  }}
                />
              }
            />
            <Bar dataKey={metric} fill={color} radius={4} />
          </BarChart>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Loader className="size-5 text-gray-500 animate-spin" />
          </div>
        )}
      </ChartContainer>
    </div>
  );
}

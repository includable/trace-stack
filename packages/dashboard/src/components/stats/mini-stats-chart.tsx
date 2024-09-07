import { useMemo } from "react";
import { Bar, BarChart, XAxis } from "recharts";
import { format } from "date-fns";
import { Loader } from "lucide-react";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useData } from "@/lib/api";

export function MiniStatsChart({
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
  const { data } = useData(`stats/${region}/${name}`);

  const total = useMemo(() => {
    if (!data) return null;

    const nonZeroData = data.filter((d) => d[metric] > 0);
    if (!nonZeroData.length) return 0;

    const sum = nonZeroData.reduce((acc, curr) => acc + curr[metric], 0);
    return metric === "sum" ? sum : sum / nonZeroData.length;
  }, [data]);

  return (
    <div className="relative">
      <div className="right-2 top-1 text-muted absolute text-xs">
        {total?.toLocaleString("en", { maximumFractionDigits: 1 })} {suffix}
      </div>

      <ChartContainer
        config={{
          [metric]: {
            label: title,
            color: color,
          },
        }}
        className="h-11 w-full border px-2 pt-5 rounded-md"
      >
        {data ? (
          <BarChart accessibilityLayer data={data} margin={0}>
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={8}
              axisLine={false}
              hide
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
          <div className="flex h-3 w-full items-center justify-center">
            <Loader className="size-3 text-muted animate-spin" />
          </div>
        )}
      </ChartContainer>
    </div>
  );
}

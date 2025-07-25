"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { BarPlot } from "@mui/x-charts/BarChart";
import { ChartContainer } from "@mui/x-charts/ChartContainer";
import { ChartsAxisHighlight } from "@mui/x-charts/ChartsAxisHighlight";
import { ChartsTooltip } from "@mui/x-charts/ChartsTooltip";
import { ChartsXAxis } from "@mui/x-charts/ChartsXAxis";
import { ChartsYAxis } from "@mui/x-charts/ChartsYAxis";
import { LineHighlightPlot, LinePlot } from "@mui/x-charts/LineChart";
import {
  type AllSeriesType,
  type BarSeriesType,
  type LineSeriesType,
  type XAxis,
  type YAxis,
} from "@mui/x-charts/models";
import { useId } from "react";

const BAR_SERIE: BarSeriesType = {
  type: "bar",
  color: fr.colors.options.blueFrance.sun113_625.default,
  highlightScope: { fade: "series", highlight: "item" },
};
const LINE_SERIE: LineSeriesType = {
  type: "line",
  color: fr.colors.options.redMarianne._425_625.default,
  highlightScope: { fade: "series", highlight: "item" },
};

export interface MuiBarLineChartProps {
  barAxisWidth?: number;
  barData: number[];
  barId: string;
  barValueFormatter?: YAxis<"linear">["valueFormatter"];
  /**
   * Height of the chart container (px)
   * @default 400
   */
  height?: number;
  lineAxisWidth?: number;
  lineData: number[];
  lineId: string;
  lineValueFormatter?: YAxis<"linear">["valueFormatter"];
  nameBar: string;
  nameLine: string;
  x: string[];
  xHeight?: number;
  xName?: string;
  xTickInterval?: number;
  xValueFormatter?: XAxis<"band">["valueFormatter"];
}

export const MuiBarLineChart = ({
  height = 400,
  nameBar,
  nameLine,
  barData,
  lineData,
  x,
  xName = "Date",
  barId,
  lineId,
  barValueFormatter = value => {
    const intValue = parseInt(value as string);
    return isNaN(intValue)
      ? (value as string)
      : new Intl.NumberFormat("fr-FR", {
          notation: "compact",
          compactDisplay: "short",
        }).format(intValue);
  },
  lineValueFormatter,
  xValueFormatter,
  xHeight = 40,
  barAxisWidth = 60,
  lineAxisWidth = 50,
  xTickInterval = 1,
}: MuiBarLineChartProps) => {
  const autoId = useId();
  const barSerie: BarSeriesType = {
    ...BAR_SERIE,
    label: nameBar,
    data: barData,
    yAxisId: `${barId}-${autoId}`,
  };
  const lineSerie: LineSeriesType = {
    ...LINE_SERIE,
    label: nameLine,
    data: lineData,
    yAxisId: `${lineId}-${autoId}`,
  };

  const series: AllSeriesType[] = [barSerie, lineSerie];
  const xId = `x-${autoId}`;

  return (
    <ChartContainer
      skipAnimation
      series={series}
      height={height}
      xAxis={[
        {
          id: xId,
          data: x,
          scaleType: "band",
          height: xHeight,
          valueFormatter: xValueFormatter,
        },
      ]}
      yAxis={[
        {
          id: barSerie.yAxisId,
          scaleType: "linear",
          position: "left",
          width: barAxisWidth,
          valueFormatter: barValueFormatter,
        },
        {
          id: lineSerie.yAxisId,
          scaleType: "linear",
          position: "right",
          // valueFormatter: value => `${value}%`,
          valueFormatter: lineValueFormatter,
          width: lineAxisWidth,
        },
      ]}
    >
      <ChartsAxisHighlight x="line" />
      <BarPlot />
      <LinePlot />

      <LineHighlightPlot />
      <ChartsXAxis
        label={xName}
        axisId={xId}
        tickInterval={(_, index) => {
          return index % xTickInterval === 0;
        }}
        tickLabelStyle={{
          fontSize: 10,
        }}
      />
      <ChartsYAxis label={barSerie.label as string} axisId={barSerie.yAxisId} tickLabelStyle={{ fontSize: 10 }} />
      <ChartsYAxis label={lineSerie.label as string} axisId={lineSerie.yAxisId} tickLabelStyle={{ fontSize: 10 }} />
      <ChartsTooltip />
    </ChartContainer>
  );
};

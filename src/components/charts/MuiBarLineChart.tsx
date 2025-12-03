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
  color: fr.colors.options.blueFrance.sun113_625.default,
  highlightScope: { fade: "series", highlight: "item" },
  type: "bar",
};
const LINE_SERIE: LineSeriesType = {
  color: fr.colors.options.redMarianne._425_625.default,
  highlightScope: { fade: "series", highlight: "item" },
  type: "line",
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
  barAxisWidth = 60,
  barData,
  barId,
  barValueFormatter = value => {
    const intValue = parseInt(value as string);
    return isNaN(intValue)
      ? (value as string)
      : new Intl.NumberFormat("fr-FR", {
          compactDisplay: "short",
          notation: "compact",
        }).format(intValue);
  },
  height = 400,
  lineAxisWidth = 50,
  lineData,
  lineId,
  lineValueFormatter,
  nameBar,
  nameLine,
  x,
  xHeight = 40,
  xName = "Date",
  xTickInterval = 1,
  xValueFormatter,
}: MuiBarLineChartProps) => {
  const autoId = useId();
  const barSerie: BarSeriesType = {
    ...BAR_SERIE,
    data: barData,
    label: nameBar,
    yAxisId: `${barId}-${autoId}`,
  };
  const lineSerie: LineSeriesType = {
    ...LINE_SERIE,
    data: lineData,
    label: nameLine,
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
          data: x,
          height: xHeight,
          id: xId,
          scaleType: "band",
          valueFormatter: xValueFormatter,
        },
      ]}
      yAxis={[
        {
          id: barSerie.yAxisId,
          position: "left",
          scaleType: "linear",
          valueFormatter: barValueFormatter,
          width: barAxisWidth,
        },
        {
          id: lineSerie.yAxisId,
          position: "right",
          scaleType: "linear",
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

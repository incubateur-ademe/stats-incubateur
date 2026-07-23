"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { BarPlot } from "@mui/x-charts/BarChart";
import { ChartsAxisHighlight } from "@mui/x-charts/ChartsAxisHighlight";
import { ChartsContainer } from "@mui/x-charts/ChartsContainer";
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

/** CSS-variable-based fill so axis text responds to dark mode instantly (not delayed by MUI theme re-render). */
const axisTextFill = { fill: fr.colors.decisions.text.default.grey.default } as const;

/** Hoisted to avoid re-creating on every formatter call (Intl constructors are expensive). */
const compactNumberFormat = new Intl.NumberFormat("fr-FR", {
  compactDisplay: "short",
  notation: "compact",
});

const defaultBarValueFormatter: YAxis<"linear">["valueFormatter"] = value => {
  const intValue = parseInt(value as string);
  return isNaN(intValue) ? (value as string) : compactNumberFormat.format(intValue);
};

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
  /**
   * Afficher la serie ligne (variation), son axe Y droit et ses plots.
   * @default true
   */
  showLine?: boolean;
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
  barValueFormatter = defaultBarValueFormatter,
  height = 400,
  lineAxisWidth = 50,
  lineData,
  lineId,
  lineValueFormatter,
  nameBar,
  nameLine,
  showLine = true,
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

  const series: AllSeriesType[] = showLine ? [barSerie, lineSerie] : [barSerie];
  const xId = `x-${autoId}`;

  const yAxis: YAxis[] = [
    {
      id: barSerie.yAxisId,
      position: "left",
      scaleType: "linear",
      valueFormatter: barValueFormatter,
      width: barAxisWidth,
    },
  ];
  if (showLine) {
    yAxis.push({
      id: lineSerie.yAxisId,
      position: "right",
      scaleType: "linear",
      valueFormatter: lineValueFormatter,
      width: lineAxisWidth,
    });
  }

  return (
    <ChartsContainer
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
      yAxis={yAxis}
    >
      <ChartsAxisHighlight x="line" />
      <BarPlot />
      {showLine && <LinePlot />}

      {showLine && <LineHighlightPlot />}
      <ChartsXAxis
        label={xName}
        axisId={xId}
        tickInterval={(_, index) => {
          return index % xTickInterval === 0;
        }}
        tickLabelStyle={{
          fontSize: 10,
          ...axisTextFill,
        }}
        labelStyle={axisTextFill}
      />
      <ChartsYAxis
        label={barSerie.label as string}
        axisId={barSerie.yAxisId}
        tickLabelStyle={{ fontSize: 10, ...axisTextFill }}
        labelStyle={axisTextFill}
      />
      {showLine && (
        <ChartsYAxis
          label={lineSerie.label as string}
          axisId={lineSerie.yAxisId}
          tickLabelStyle={{ fontSize: 10, ...axisTextFill }}
          labelStyle={axisTextFill}
        />
      )}
      {/* Porte le tooltip dans body: sinon le transform (identite) pose par auto-animate sur les
          wrappers de card fait resoudre son position:fixed contre la card, d'ou decalage au scroll
          et passage derriere les autres cards. */}
      <ChartsTooltip container={typeof document === "undefined" ? undefined : () => document.body} />
    </ChartsContainer>
  );
};

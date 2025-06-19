import React, { useCallback, useMemo } from "react";

interface ResultMarking {
  ear: string;
  x: number;
  y: number;
  mode: string;
  masking: number;
  noResponse: number;
}

interface PureToneGraphProps {
  selectedLabelIndexes: { x: number; y: number };
  resultMarkings: ResultMarking[];
  onIndexChange: (x: number, y: number) => void;
  width?: number;
  height?: number;
}

const FREQUENCIES = [
  "125",
  "250",
  "500",
  "750",
  "1000",
  "1500",
  "2000",
  "3000",
  "4000",
  "6000",
  "8000",
];
const HEARING_LEVELS = Array.from({ length: 27 }, (_, i) => (i - 2) * 5); // -10 to 120 in steps of 5

const COLORS = {
  leftEar: "#0000FF", // blue
  rightEar: "#FF0000", // red
  crosshair: "#800080", // purple
  grid: "#CCCCCC",
  background: "#F5F5F5",
  text: "#333333",
};

const SYMBOL_SIZE = 15;
const LINE_THICKNESS = 2;

const PureToneGraph: React.FC<PureToneGraphProps> = ({
  selectedLabelIndexes,
  resultMarkings,
  onIndexChange,
  width = 800,
  height = 600,
}) => {
  const margin = { top: 40, right: 40, bottom: 40, left: 60 };
  const graphWidth = width - margin.left - margin.right;
  const graphHeight = height - margin.top - margin.bottom;

  // Calculate x-scale (logarithmic)
  const xScale = useCallback(
    (freq: number) => {
      const minFreq = Math.log10(125);
      const maxFreq = Math.log10(8000);
      const scale = (Math.log10(freq) - minFreq) / (maxFreq - minFreq);
      return margin.left + scale * graphWidth;
    },
    [graphWidth, margin.left]
  );

  // Calculate y-scale (linear)
  const yScale = useCallback(
    (db: number) => {
      const minDb = -10;
      const maxDb = 120;
      const scale = (db - minDb) / (maxDb - minDb);
      return margin.top + (1 - scale) * graphHeight;
    },
    [graphHeight, margin.top]
  );

  // Draw symbols based on ear and mode
  const renderSymbol = useCallback(
    (x: number, y: number, ear: string, mode: string) => {
      const color = ear === "L" ? COLORS.leftEar : COLORS.rightEar;
      const halfSize = SYMBOL_SIZE / 2;

      switch (mode) {
        case "AC":
          return ear === "L" ? (
            <text
              x={x}
              y={y}
              fill={color}
              fontSize={SYMBOL_SIZE}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              ×
            </text>
          ) : (
            <circle
              cx={x}
              cy={y}
              r={halfSize}
              fill="none"
              stroke={color}
              strokeWidth={LINE_THICKNESS}
            />
          );
        case "BC":
          return (
            <text
              x={x}
              y={y}
              fill={color}
              fontSize={SYMBOL_SIZE}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {ear === "L" ? ">" : "<"}
            </text>
          );
        case "FF":
          return ear === "L" ? (
            <g>
              <line
                x1={x - halfSize}
                y1={y - halfSize}
                x2={x + halfSize}
                y2={y + halfSize}
                stroke={color}
                strokeWidth={LINE_THICKNESS}
              />
              <line
                x1={x + halfSize}
                y1={y - halfSize}
                x2={x - halfSize}
                y2={y + halfSize}
                stroke={color}
                strokeWidth={LINE_THICKNESS}
              />
            </g>
          ) : (
            <g>
              <circle
                cx={x}
                cy={y}
                r={halfSize}
                fill="none"
                stroke={color}
                strokeWidth={LINE_THICKNESS}
              />
              <line
                x1={x - halfSize}
                y1={y}
                x2={x + halfSize}
                y2={y}
                stroke={color}
                strokeWidth={LINE_THICKNESS}
              />
            </g>
          );
        default:
          return null;
      }
    },
    []
  );

  // Render grid lines
  const gridLines = useMemo(() => {
    const lines: React.ReactElement[] = [];

    // Vertical grid lines (frequency)
    FREQUENCIES.forEach((freq) => {
      const x = xScale(Number(freq));
      lines.push(
        <line
          key={`v-${freq}`}
          x1={x}
          y1={margin.top}
          x2={x}
          y2={height - margin.bottom}
          stroke={COLORS.grid}
          strokeWidth={1}
        />
      );
    });

    // Horizontal grid lines (hearing level)
    HEARING_LEVELS.forEach((db) => {
      const y = yScale(db);
      lines.push(
        <line
          key={`h-${db}`}
          x1={margin.left}
          y1={y}
          x2={width - margin.right}
          y2={y}
          stroke={COLORS.grid}
          strokeWidth={1}
        />
      );
    });

    return lines;
  }, [xScale, yScale, width, height, margin]);

  // Render axis labels
  const axisLabels = useMemo(() => {
    const labels: React.ReactElement[] = [];

    // X-axis labels (frequency)
    FREQUENCIES.forEach((freq) => {
      const x = xScale(Number(freq));
      labels.push(
        <text
          key={`x-${freq}`}
          x={x}
          y={height - margin.bottom + 20}
          textAnchor="middle"
          fill={COLORS.text}
          fontSize={12}
        >
          {freq}
        </text>
      );
    });

    // Y-axis labels (hearing level)
    HEARING_LEVELS.forEach((db) => {
      const y = yScale(db);
      labels.push(
        <text
          key={`y-${db}`}
          x={margin.left - 10}
          y={y}
          textAnchor="end"
          dominantBaseline="middle"
          fill={COLORS.text}
          fontSize={12}
        >
          {db}
        </text>
      );
    });

    return labels;
  }, [xScale, yScale, width, height, margin]);

  // Render crosshair lines
  const crosshairLines = useMemo(() => {
    const x = xScale(Number(FREQUENCIES[selectedLabelIndexes.x]));
    const y = yScale(HEARING_LEVELS[selectedLabelIndexes.y]);

    return (
      <>
        <line
          x1={margin.left}
          y1={y}
          x2={width - margin.right}
          y2={y}
          stroke={COLORS.crosshair}
          strokeWidth={1}
          strokeDasharray="4,4"
        />
        <line
          x1={x}
          y1={margin.top}
          x2={x}
          y2={height - margin.bottom}
          stroke={COLORS.crosshair}
          strokeWidth={1}
          strokeDasharray="4,4"
        />
      </>
    );
  }, [selectedLabelIndexes, xScale, yScale, width, height, margin]);

  // Group result markings by ear and mode for optimized rendering
  const groupedMarkings = useMemo(() => {
    const groups: { [key: string]: ResultMarking[] } = {
      "L-AC": [],
      "R-AC": [],
      "L-BC": [],
      "R-BC": [],
      "L-FF": [],
      "R-FF": [],
    };

    resultMarkings.forEach((marking) => {
      const key = `${marking.ear}-${marking.mode}`;
      if (groups[key]) {
        groups[key].push(marking);
      }
    });

    return groups;
  }, [resultMarkings]);

  // Render result markings with optimized grouping
  const renderMarkings = useMemo(() => {
    return Object.entries(groupedMarkings).map(([key, markings]) => {
      if (markings.length === 0) return null;

      const [ear, mode] = key.split("-");
      const color = ear === "L" ? COLORS.leftEar : COLORS.rightEar;
      const isDashed = mode === "BC";

      return (
        <g key={key}>
          {markings.map((marking, index) => {
            const x = xScale(marking.x);
            const y = yScale(marking.y);
            return (
              <g key={index}>
                {renderSymbol(x, y, marking.ear, marking.mode)}
                {(mode === "AC" || mode === "BC") && (
                  <line
                    x1={x}
                    y1={y}
                    x2={x}
                    y2={y + 20}
                    stroke={color}
                    strokeWidth={LINE_THICKNESS}
                    strokeDasharray={isDashed ? "4,6" : undefined}
                  />
                )}
              </g>
            );
          })}
        </g>
      );
    });
  }, [groupedMarkings, xScale, yScale, renderSymbol]);

  // Handle click events
  const handleClick = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Find closest frequency
      let closestFreqIndex = 0;
      let minFreqDist = Infinity;
      FREQUENCIES.forEach((freq, i) => {
        const freqX = xScale(Number(freq));
        const dist = Math.abs(x - freqX);
        if (dist < minFreqDist) {
          minFreqDist = dist;
          closestFreqIndex = i;
        }
      });

      // Find closest hearing level
      let closestLevelIndex = 0;
      let minLevelDist = Infinity;
      HEARING_LEVELS.forEach((level, i) => {
        const levelY = yScale(level);
        const dist = Math.abs(y - levelY);
        if (dist < minLevelDist) {
          minLevelDist = dist;
          closestLevelIndex = i;
        }
      });

      onIndexChange(closestFreqIndex, closestLevelIndex);
    },
    [xScale, yScale, onIndexChange]
  );

  return (
    <svg
      width={width}
      height={height}
      onClick={handleClick}
      style={{ backgroundColor: COLORS.background }}
    >
      {/* Grid lines */}
      {gridLines}

      {/* Axis labels */}
      {axisLabels}

      {/* Result markings */}
      {renderMarkings}

      {/* Crosshair lines */}
      {crosshairLines}

      {/* Legend */}
      <g transform={`translate(${width - margin.right - 150}, ${margin.top})`}>
        <text x={0} y={0} fill={COLORS.text} fontSize={12} fontWeight="bold">
          Legend
        </text>
        <g transform="translate(0, 20)">
          <text x={20} y={0} fill={COLORS.leftEar} fontSize={12}>
            × Left Ear
          </text>
          <text x={20} y={20} fill={COLORS.rightEar} fontSize={12}>
            ○ Right Ear
          </text>
          <text x={20} y={40} fill={COLORS.text} fontSize={12}>
            — Air Conduction
          </text>
          <text x={20} y={60} fill={COLORS.text} fontSize={12}>
            - - Bone Conduction
          </text>
        </g>
      </g>
    </svg>
  );
};

export default PureToneGraph;

import React, { useCallback, useMemo } from "react";
import { ArrowDownLeft, ArrowDownRight } from "lucide-react";

interface ResultMarking {
  ear: string;       // "L" or "R"
  x: number;         // frequency (Hz)
  y: number;         // level (dB HL)
  mode: string;      // "AC" or "BC"
  masking: number;   // 0 = none, >0 = masked
  noResponse: number;// 0 = heard, 1 = no response
}

interface PureToneGraphProps {
  selectedLabelIndexes: { x: number; y: number };
  resultMarkings: ResultMarking[];
  onIndexChange: (x: number, y: number) => void;
  width?: number;
  height?: number;
  axisFontSize ? : number
}

export const FREQUENCIES = [125, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000];
export const HEARING_LEVELS = Array.from({ length: 27 }, (_, i) => (i - 2) * 5); // -10 to 120

const COLORS = {
  leftEar: "#0000FF",
  rightEar: "#FF0000",
  grid: "#D0D0D0",
  midOctave: "#A0A0A0",
  background: "#FFFFFF",
  text: "#333333",
  crosshair: "#800080",
};
const SYMBOL_SIZE = 14;
const LINE_THICKNESS = 2;

const PureToneGraph: React.FC<PureToneGraphProps> = ({
  selectedLabelIndexes,
  resultMarkings,
  onIndexChange,
  width = 800,
  height = 600,
   axisFontSize = 12
}) => {
  const margin = { top: 40, right: 40, bottom: 40, left: 60 };
  const graphH = height - margin.top - margin.bottom;
  // Make cells square: vertical 10 dB step height defines the horizontal step
  const numYCells10dB = 14; // -10 to 120 inclusive (10 dB grid)
  const xExtended = [125, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000];
  const xIntervals = xExtended.length - 1; // 10 intervals
  const cellSize = graphH / numYCells10dB; // pixels per 10 dB
  const graphW = cellSize * xIntervals;
  const svgW = graphW + margin.left + margin.right;

  const xScale = useCallback((f: number) => {
    // Create extended frequency array including mid-octaves for positioning
    const extendedFrequencies = xExtended;
    const freqIndex = extendedFrequencies.indexOf(f);
    
    if (freqIndex !== -1) {
      // Uniform spacing equal to vertical 10 dB step height
      return margin.left + freqIndex * cellSize;
    }
    
    // Fallback for unknown frequencies (shouldn't happen in normal use)
    return margin.left;
  }, [cellSize]);

  const yScale = useCallback((db: number) => {
    // flip so high dB plot lower
    const minDb = -10, maxDb = 120;
    const t = (db - minDb) / (maxDb - minDb);
    return margin.top + t * graphH;
  }, [graphH]);

  const renderSymbol = useCallback((
    x: number,
    y: number,
    ear: string,
    mode: string,
    masking: number,
    noResponse: number
  ) => {
    const color = ear === "L" ? COLORS.leftEar : COLORS.rightEar;
    const half = SYMBOL_SIZE / 2;
    let base: React.ReactNode = null;

    // Air conduction symbols (ASHA 1990)
    if (mode === "AC") {
      if (!masking) {
        // AC unmasked: X for Left ear, Circle for Right ear
        base = ear === "L"
          ? (
              <g>
                <line x1={x - half} y1={y - half} x2={x + half} y2={y + half} stroke={color} strokeWidth={LINE_THICKNESS} strokeLinecap="round" />
                <line x1={x - half} y1={y + half} x2={x + half} y2={y - half} stroke={color} strokeWidth={LINE_THICKNESS} strokeLinecap="round" />
              </g>
            )
          : <circle cx={x} cy={y} r={half} fill="none" stroke={color}
              strokeWidth={LINE_THICKNESS} />;
      } else {
        // AC masked: upward triangle for Left ear, square for Right ear (ASHA standard)
        base = ear === "L"
          ? <polygon points={`
              ${x-half},${y+half}
              ${x},${y-half}
              ${x+half},${y+half}
            `} fill="none" stroke={color} strokeWidth={LINE_THICKNESS} />
          : <rect x={x-half} y={y-half} width={SYMBOL_SIZE} height={SYMBOL_SIZE} 
              fill="none" stroke={color} strokeWidth={LINE_THICKNESS} />;
      }
    }

    // Bone conduction symbols (ASHA 1990)
    if (mode === "BC") {
      const sym = (!masking ? (ear==="L" ? ">" : "<") : (ear==="L" ? "]" : "["));
      base = <text x={x} y={y} fontSize={SYMBOL_SIZE} fill={color}
        textAnchor="middle" dominantBaseline="middle">{sym}</text>;
    }

    // No-response overlay with diagonal arrows based on ear (ASHA 1990)
    if (noResponse === 1) {
  const Icon = ear === "L" ? ArrowDownRight : ArrowDownLeft;
      return (
        <g key={`symbol-${x}-${y}`}>
          {base}
          <g transform={`translate(${x - 10}, ${y + 10})`}>
            <Icon stroke={color} strokeWidth={2} size={20} fill="none" />          
</g>
        </g>
      );
    }

    // Normal response - just the base symbol
    return <g key={`symbol-${x}-${y}`}>{base}</g>;
  }, []);

  const grid = useMemo(() => {
    const gridElements: React.ReactNode[] = [];
    
    // Use 10 dB intervals for more square-like cells
    const hearingLevels10dB = HEARING_LEVELS.filter(level => level % 10 === 0);
    const mainFrequencies = [125, 250, 500, 1000, 2000, 4000, 8000];
    const midFrequencies = [750, 1500, 3000, 6000];
    
    // Create vertical lines for main frequencies (solid, dark)
    mainFrequencies.forEach(freq => {
      const x = xScale(freq);
      
      gridElements.push(
        <line
          key={`main-freq-line-${freq}`}
          x1={x}
          y1={margin.top}
          x2={x}
          y2={height - margin.bottom}
          stroke={COLORS.grid}
          strokeWidth={1}
        />
      );
    });
        
    // Create vertical lines for mid frequencies (dashed, lighter)
    midFrequencies.forEach(freq => {
      const x = xScale(freq);
        
      gridElements.push(
          <line 
          key={`mid-freq-line-${freq}`}
            x1={x} 
            y1={margin.top}
            x2={x} 
            y2={height - margin.bottom}
            stroke={COLORS.midOctave} 
          strokeWidth={1.5}
          strokeDasharray="4,2"
        />
      );
    });
    
    // Create horizontal lines for 10 dB intervals (solid, dark)
    hearingLevels10dB.forEach(level => {
      const y = yScale(level);
      
      gridElements.push(
        <line
          key={`main-level-line-${level}`}
          x1={margin.left}
          y1={y}
          x2={svgW - margin.right}
          y2={y}
          stroke={COLORS.grid}
          strokeWidth={1}
          />
        );
    });
    
    return gridElements;
  }, [xScale, yScale, height, svgW]);

  // Mid-intensity lines (5 dB intervals)
  const midIntensityLines = useMemo(() => {
    // Get 5 dB intervals that are not already in the 10 dB grid
    const midLevels = HEARING_LEVELS.filter(level => level % 10 !== 0 && level % 5 === 0);
    return midLevels.map(level => {
      const y = yScale(level);
      return (
        <line
          key={`mid-intensity-${level}`}
          x1={margin.left}
          y1={y}
          x2={svgW - margin.right}
          y2={y}
          stroke={COLORS.midOctave}
          strokeWidth={1.2}
          strokeDasharray="4,2"
        />
      );
    });
  }, [yScale, svgW]);
  
  const axes = useMemo(() => {
    const axisElements: React.ReactNode[] = [];
    const extendedFrequencies = xExtended;
    const midFrequencies = [750, 1500, 3000, 6000];
    
    // Frequency labels (x-axis)
    extendedFrequencies.forEach(f => {
      const x = xScale(f);
      const isMidFreq = midFrequencies.includes(f);
      const label = f >= 1000 ? `${f/1000}K` : `${f}`;
      
      axisElements.push(
        <text 
          key={`xf${f}`} 
          x={x} 
          y={height - margin.bottom + 20}
          textAnchor="middle" 
          fill={isMidFreq ? "#666666" : COLORS.text}
          fontSize={isMidFreq ? axisFontSize - 1 : axisFontSize}
          fontWeight={isMidFreq ? "normal" : "500"}
        >
          {label}
        </text>
      );
    });
    
    // Hearing level labels (y-axis) - show both 10dB and 5dB levels
    HEARING_LEVELS.forEach(h => {
      const y = yScale(h);
      const is10dB = h % 10 === 0;
      const is5dB = h % 5 === 0 && !is10dB;
      
      if (is10dB || is5dB) {
        axisElements.push(
          <text 
            key={`yh${h}`} 
            x={margin.left - 10} 
            y={y}
            textAnchor="end" 
            dominantBaseline="middle"
            fill={is5dB ? "#666666" : COLORS.text}
            fontSize={is5dB ? axisFontSize - 1 : axisFontSize}
            fontWeight={is5dB ? "normal" : "500"}
          >
            {h}
          </text>
        );
      }
    });
    
    return axisElements;
  }, [xScale, yScale, height, axisFontSize]);

  const crosshair = useMemo(() => {
    const fx = xScale(FREQUENCIES[selectedLabelIndexes.x]);
    const fy = yScale(HEARING_LEVELS[selectedLabelIndexes.y]);
    return [
      <line key="chH" x1={margin.left} y1={fy}
        x2={svgW - margin.right} y2={fy}
        stroke={COLORS.crosshair} strokeDasharray="4,4" />,
      <line key="chV" x1={fx} y1={margin.top}
        x2={fx} y2={height - margin.bottom}
        stroke={COLORS.crosshair} strokeDasharray="4,4" />,
    ];
  }, [selectedLabelIndexes, xScale, yScale, svgW]);

  // Connecting lines for audiogram symbols
  const connectingLines = useMemo(() => {
    const lines: React.ReactNode[] = [];
    
    // Group markings by ear and mode
    const groups: { [key: string]: ResultMarking[] } = {};
    
    resultMarkings
      .filter(m => m.noResponse === 0) // Only connect symbols with responses
      .forEach(marking => {
        const key = `${marking.ear}-${marking.mode}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(marking);
      });
    
    // Create lines for each group
    Object.entries(groups).forEach(([key, markings]) => {
      if (markings.length < 2) return; // Need at least 2 points to draw a line
      
      // Sort by frequency for proper line connection
      const sortedMarkings = markings.sort((a, b) => a.x - b.x);
      
      for (let i = 0; i < sortedMarkings.length - 1; i++) {
        const current = sortedMarkings[i];
        const next = sortedMarkings[i + 1];
        
        const x1 = xScale(current.x);
        const y1 = yScale(current.y);
        const x2 = xScale(next.x);
        const y2 = yScale(next.y);
        
        const color = current.ear === "L" ? COLORS.leftEar : COLORS.rightEar;
        const strokeDasharray = current.mode === "BC" ? "5,5" : "none";
        
        lines.push(
          <line
            key={`line-${key}-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={LINE_THICKNESS}
            strokeDasharray={strokeDasharray}
            fill="none"
          />
        );
      }
    });
    
    return lines;
  }, [resultMarkings, xScale, yScale]);

  const symbols = useMemo(() => resultMarkings.map((m,i) => {
    const px = xScale(m.x), py = yScale(m.y);
    return <g key={i}>{renderSymbol(px,py,m.ear,m.mode,m.masking,m.noResponse)}</g>;
  }), [resultMarkings, renderSymbol, xScale, yScale]);

  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
    let bi = 0, bd = Infinity;
    FREQUENCIES.forEach((f,i) => {
      const d = Math.abs(cx - xScale(f));
      if (d < bd) { bd = d; bi = i; }
    });
    let bj = 0; bd = Infinity;
    HEARING_LEVELS.forEach((h,i) => {
      const d = Math.abs(cy - yScale(h));
      if (d < bd) { bd = d; bj = i; }
    });
    onIndexChange(bi, bj);
  }, [onIndexChange, xScale, yScale]);

  return (
    <svg width={svgW} height={height}
      style={{ backgroundColor: COLORS.background }}
      onClick={handleClick}
    >
      {grid}
      {midIntensityLines}
      {axes}
      {connectingLines}
      {symbols}
      {crosshair}
    </svg>
  );
};

export default PureToneGraph;
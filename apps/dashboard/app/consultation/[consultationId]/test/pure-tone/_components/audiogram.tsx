import React, { useCallback, useMemo } from "react";
import { ArrowDown } from "lucide-react";

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
  grid: "#CCCCCC",
  midOctave: "#DDDDDD",
  background: "#F5F5F5",
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
  const graphW = width - margin.left - margin.right;
  const graphH = height - margin.top - margin.bottom;

  const xScale = useCallback((f: number) => {
    const minF = Math.log10(125), maxF = Math.log10(8000);
    const t = (Math.log10(f) - minF) / (maxF - minF);
    return margin.left + t * graphW;
  }, [graphW]);

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
        // AC unmasked: Circle for Right ear, X for Left ear
        base = ear === "R" 
          ? <circle cx={x} cy={y} r={half} fill="none" stroke={color} strokeWidth={LINE_THICKNESS} />
          : <text x={x} y={y} fontSize={SYMBOL_SIZE + 2} fill={color} fontWeight="bold"
              textAnchor="middle" dominantBaseline="middle">×</text>;
      } else {
        // AC masked: Triangle for Right ear, Square for Left ear
        base = ear === "R"
          ? <polygon points={`${x},${y-half} ${x-half},${y+half} ${x+half},${y+half}`} 
              fill="none" stroke={color} strokeWidth={LINE_THICKNESS} />
          : <rect x={x-half} y={y-half} width={SYMBOL_SIZE} height={SYMBOL_SIZE}
              fill="none" stroke={color} strokeWidth={LINE_THICKNESS} />;
      }
    }

    // Bone conduction symbols (ASHA 1990)
    if (mode === "BC") {
      if (!masking) {
        // BC unmasked: < for Right ear, > for Left ear
        const symbol = ear === "R" ? "<" : ">";
        base = <text x={x} y={y} fontSize={SYMBOL_SIZE + 2} fill={color} fontWeight="bold"
          textAnchor="middle" dominantBaseline="middle">{symbol}</text>;
      } else {
        // BC masked: [ for Right ear, ] for Left ear
        const symbol = ear === "R" ? "[" : "]";
        base = <text x={x} y={y} fontSize={SYMBOL_SIZE + 2} fill={color} fontWeight="bold"
          textAnchor="middle" dominantBaseline="middle">{symbol}</text>;
      }
    }

    // No-response overlay (arrows pointing straight down - ASHA 1990)
    if (noResponse === 1) {
      return (
        <g key={`symbol-${x}-${y}`}>
          {base}
          <g transform={`translate(${x - 8}, ${y + 8}) scale(0.6)`}>
            <ArrowDown stroke={color} strokeWidth={2} size={16} />          
          </g>
        </g>
      );
    }

    // Normal response - just the base symbol
    return <g key={`symbol-${x}-${y}`}>{base}</g>;
  }, []);

  const grid = useMemo(() => [
    ...FREQUENCIES.map(f => {
      const x = xScale(f);
      return <line key={`v${f}`} x1={x} y1={margin.top}
        x2={x} y2={height - margin.bottom}
        stroke={COLORS.grid} />;
    }),
    ...HEARING_LEVELS.map(h => {
      const y = yScale(h);
      return <line key={`h${h}`} x1={margin.left} y1={y}
        x2={width - margin.right} y2={y}
        stroke={COLORS.grid} />;
    }),
  ], [xScale, yScale]);

  const midOctaveLines = useMemo(() => {
    const lines = [];
    
    // Find the index where frequencies start doubling (750 Hz and above)
    const doublingStartIndex = FREQUENCIES.findIndex(f => f >= 750);
    
    if (doublingStartIndex >= 0) {
      // Add mid-octave lines for frequencies from 750 Hz onwards
      for (let i = doublingStartIndex; i < FREQUENCIES.length - 1; i++) {
        const freq1 = FREQUENCIES[i];
        const freq2 = FREQUENCIES[i + 1];
        
        // Calculate geometric mean (mid-octave frequency)
        const midFreq = Math.sqrt(freq1 * freq2);
        const x = xScale(midFreq);
        
        lines.push(
          <line 
            key={`mid${i}`} 
            x1={x} 
            y1={margin.top}
            x2={x} 
            y2={height - margin.bottom}
            stroke={COLORS.midOctave} 
            strokeDasharray="3,3"
            strokeWidth={2.5}
          />
        );
      }
    }
    
    return lines;
  }, [xScale]);


  
  const axes = useMemo(() => [
    ...FREQUENCIES.map(f => {
      const x = xScale(f);
      return <text key={`xf${f}`} x={x} y={height - margin.bottom + 20}
        textAnchor="middle" fill={COLORS.text}    fontSize={axisFontSize}>{f}</text>;
    }),
    ...HEARING_LEVELS.map(h => {
      const y = yScale(h);
      return <text key={`yh${h}`} x={margin.left - 10} y={y}
        textAnchor="end" dominantBaseline="middle"
        fill={COLORS.text}    fontSize={axisFontSize}>{h}</text>;
    }),
  ], [xScale, yScale]);

  const crosshair = useMemo(() => {
    const fx = xScale(FREQUENCIES[selectedLabelIndexes.x]);
    const fy = yScale(HEARING_LEVELS[selectedLabelIndexes.y]);
    return [
      <line key="chH" x1={margin.left} y1={fy}
        x2={width - margin.right} y2={fy}
        stroke={COLORS.crosshair} strokeDasharray="4,4" />,
      <line key="chV" x1={fx} y1={margin.top}
        x2={fx} y2={height - margin.bottom}
        stroke={COLORS.crosshair} strokeDasharray="4,4" />,
    ];
  }, [selectedLabelIndexes, xScale, yScale]);

  const symbols = useMemo(() => resultMarkings.map((m,i) => {
    const px = xScale(m.x), py = yScale(m.y);
    return <g key={i}>{renderSymbol(px,py,m.ear,m.mode,m.masking,m.noResponse)}</g>;
  }), [resultMarkings, renderSymbol]);

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
    <svg width={width} height={height}
      style={{ backgroundColor: COLORS.background }}
      onClick={handleClick}
    >
      {grid}
      {midOctaveLines}
      {axes}
      {symbols}
      {crosshair}
    </svg>
  );
};

export default PureToneGraph;
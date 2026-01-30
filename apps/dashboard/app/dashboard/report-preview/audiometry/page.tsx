"use client";
import React, { useEffect, useRef, useState } from "react";
import { ConsultationModelData } from "@/models/consultation.model";
import { Ear, SessionStatus } from "@/models/enums";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import ReportTopActions from "@/components/ui/ReportTopActions";
import { exportElementToPdfBlob } from "@/lib/pdf";
import Image from "next/image";
import { ArrowDownLeft, ArrowDownRight } from "lucide-react";

interface TestResult {
  ear: string;
  x: number;
  y: number;
  mode: string;
  masking: number;
  noResponse: number;
  signalType: string;
  pulsed: boolean;
}

interface PTAAverage {
  leftEar: number | null;
  rightEar: number | null;
}

// Professional Audiogram Chart Component
const AudiogramChart: React.FC<{
  title: string;
  results: TestResult[];
  ear: "L" | "R";
}> = ({ title, results, ear }) => {
  const frequencies = [125, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000];
  const mainFrequencies = [125, 250, 500, 1000, 2000, 4000, 8000];
  const midFrequencies = [750, 1500, 3000, 6000];
  const dbLevels = Array.from({ length: 27 }, (_, i) => (i - 2) * 5);
  
  const gridSize = 32;
  const stepsPerOctave = 2;
  const minFreq = mainFrequencies[0];
  const maxFreq = mainFrequencies[mainFrequencies.length - 1];
  const totalSteps = (mainFrequencies.length - 1) * stepsPerOctave;
  const chartWidth = gridSize * totalSteps;
  const height = 14 * gridSize;
  const margin = { top: 40, right: 20, bottom: 50, left: 50 };
  
  const getFrequencyPosition = (freq: number) => {
    const clamped = Math.max(minFreq, Math.min(maxFreq, freq));
    const stepIndex = Math.round(Math.log2(clamped / minFreq) * stepsPerOctave);
    return stepIndex * gridSize;
  };
  
  const COLORS = {
    leftEar: "#0000FF",
    rightEar: "#FF0000",
    grid: "#666666",
    midOctave: "#E0E0E0",
    background: "#FFFFFF",
    text: "#333333",
  };
  
  const getSymbolColor = (ear: string) => ear === "L" ? COLORS.leftEar : COLORS.rightEar;

  const dbToYPosition = (db: number) => {
    const clampedDb = Math.max(-10, Math.min(120, db));
    const dbIndex = (clampedDb + 10) / 5;
    return margin.top + dbIndex * (gridSize / 2);
  };

  const generateConnectingLines = () => {
    const lines: React.ReactNode[] = [];
    const groups: { [key: string]: TestResult[] } = {};
    
    results
      .filter(r => r.noResponse === 0)
      .forEach(result => {
        const key = `${result.ear}-${result.mode}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(result);
      });
    
    Object.entries(groups).forEach(([key, groupResults]) => {
      if (groupResults.length < 2) return;
      const sortedResults = groupResults.sort((a, b) => a.x - b.x);
      
      for (let i = 0; i < sortedResults.length - 1; i++) {
        const current = sortedResults[i];
        const next = sortedResults[i + 1];
        
        const x1 = margin.left + getFrequencyPosition(current.x);
        const y1 = dbToYPosition(current.y);
        const x2 = margin.left + getFrequencyPosition(next.x);
        const y2 = dbToYPosition(next.y);
        
        const color = getSymbolColor(current.ear);
        const strokeDasharray = current.mode === "BC" ? "3,3" : "none";
        
        lines.push(
          <line
            key={`line-${key}-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={2}
            strokeDasharray={strokeDasharray}
            fill="none"
          />
        );
      }
    });
    
    return lines;
  };
  
  const renderSymbol = (result: TestResult, x: number, y: number) => {
    const color = getSymbolColor(result.ear);
    const size = 12;
    
    let base: React.ReactNode = null;
      
    if (result.mode === "AC") {
      if (result.masking === 0) {
        base = result.ear === "R" ? (
          <circle 
            cx={x} 
            cy={y}
            r={size}
            fill="none" 
            stroke={color}
            strokeWidth={2}
            key={`${result.x}-${result.y}-${result.ear}`}
          />
        ) : (
          <text 
            x={x} 
            y={y} 
            textAnchor="middle" 
            dominantBaseline="middle"
            fontSize={size * 2}
            fill={color}
            key={`${result.x}-${result.y}-${result.ear}`}
            fontWeight="bold"
          >
            ×
          </text>
        );
      } else {
        base = result.ear === "L" ? (
          <polygon
            points={`${x},${y-size} ${x-size},${y+size} ${x+size},${y+size}`}
            fill="none"
            stroke={color}
            strokeWidth={2}
            key={`${result.x}-${result.y}-${result.ear}`}
          />
        ) : (
          <rect
            x={x - size}
            y={y - size}
            width={size * 2}
            height={size * 2}
            fill="none"
            stroke={color}
            strokeWidth={2}
            key={`${result.x}-${result.y}-${result.ear}`}
          />
        );
      }
    } else if (result.mode === "BC") {
      const symbol = result.masking === 0 ? 
        (result.ear === "L" ? ">" : "<") : 
        (result.ear === "L" ? "]" : "[");
      
      base = (
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 2}
          fill={color}
          key={`${result.x}-${result.y}-${result.ear}`}
          fontWeight="bold"
        >
          {symbol}
        </text>
      );
    }
    
    if (result.noResponse === 1) {
      const Icon = result.ear === "L" ? ArrowDownRight : ArrowDownLeft;
      return (
        <g key={`${result.x}-${result.y}-${result.ear}-noresponse`}>
          {base}
          <g transform={`translate(${x - 10}, ${y + 10})`}>
            <Icon stroke={color} strokeWidth={2} size={20} fill="none" />
          </g>
        </g>
      );
    }
    
    return <g key={`${result.x}-${result.y}-${result.ear}`}>{base}</g>;
  };

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-base font-bold mb-3 text-gray-800">{title}</h3>
      <div className="border-2 border-gray-400 bg-white">
        <svg width={chartWidth + margin.left + margin.right} height={height + margin.top + margin.bottom}>
          {/* Grid lines */}
          {Array.from({ length: 15 }, (_, i) => (
            <line
              key={`major-h-${i}`}
              x1={margin.left}
              y1={margin.top + i * gridSize}
              x2={chartWidth + margin.left}
              y2={margin.top + i * gridSize}
              stroke={i % 2 === 0 ? COLORS.grid : "#E5E5E5"}
              strokeWidth={i % 2 === 0 ? 1.5 : 0.5}
            />
          ))}
          
          {mainFrequencies.map((freq) => {
            const xPos = margin.left + getFrequencyPosition(freq);
            return (
              <line
                key={`main-freq-${freq}`}
                x1={xPos}
                y1={margin.top}
                x2={xPos}
                y2={height + margin.top}
                stroke={COLORS.grid}
                strokeWidth={1}
              />
            );
          })}
          
          {midFrequencies.map((freq) => {
            const xPos = margin.left + getFrequencyPosition(freq);
            return (
              <line
                key={`mid-freq-${freq}`}
                x1={xPos}
                y1={margin.top}
                x2={xPos}
                y2={height + margin.top}
                stroke={COLORS.midOctave}
                strokeWidth={1.5}
                strokeDasharray="4,2"
              />
            );
          })}
          
          {dbLevels
            .filter(level => level % 10 !== 0 && level % 5 === 0)
            .map(level => {
              const y = dbToYPosition(level);
              return (
                <line
                  key={`mid-intensity-${level}`}
                  x1={margin.left}
                  y1={y}
                  x2={chartWidth + margin.left}
                  y2={y}
                  stroke={COLORS.midOctave}
                  strokeWidth={1.2}
                  strokeDasharray="4,2"
                />
              );
            })}
          
          {/* Frequency labels */}
          {mainFrequencies.map((freq) => {
            const label = freq >= 1000 ? `${freq/1000}K` : freq;
            const xPos = margin.left + getFrequencyPosition(freq);
            return (
              <text
                key={`freq-top-${freq}`}
                x={xPos}
                y={margin.top - 10}
                textAnchor="middle"
                fontSize="14"
                fill={COLORS.text}
                fontWeight="bold"
              >
                {label}
              </text>
            );
          })}

          {/* dB level labels */}
          {dbLevels
            .filter(level => level % 5 === 0)
            .map(level => {
              const y = dbToYPosition(level);
              const is10dB = level % 10 === 0;
              const is5dB = level % 5 === 0 && !is10dB;
              return (
                <text
                  key={`db-${level}`}
                  x={margin.left - 10}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize={is5dB ? "11" : "13"}
                  fill={is5dB ? "#666666" : COLORS.text}
                  fontWeight={is5dB ? "normal" : "bold"}
                >
                  {level}
                </text>
              );
            })}
          
          {/* Axis labels */}
          <text
            x={margin.left - 35}
            y={height / 2 + margin.top}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="14"
            fill={COLORS.text}
            fontWeight="bold"
            transform={`rotate(-90, ${margin.left - 35}, ${height / 2 + margin.top})`}
          >
            Hearing Level (dB HL)
          </text>
          
          <text
            x={chartWidth / 2 + margin.left}
            y={height + margin.top + 35}
            textAnchor="middle"
            fontSize="14"
            fill={COLORS.text}
            fontWeight="bold"
          >
            Frequency (Hz)
          </text>
          
          {generateConnectingLines()}
          
          {results.map((result) => {
            const x = margin.left + getFrequencyPosition(result.x);
            const y = dbToYPosition(result.y);
            return renderSymbol(result, x, y);
          })}
        </svg>
      </div>
    </div>
  );
};

export default function ReportPreviewPage() {
  const reportRef = useRef<HTMLDivElement>(null);
  
  // Create demo consultation data with sample audiometry results
  const getDemoConsultationData = (): ConsultationModelData => {
    const now = new Date().toISOString();
    return {
      id: 'demo-consultation-id',
      patientId: 'demo-patient-id',
      centreId: 'demo-centre-id',
      status: SessionStatus.COMPLETED,
      patientStatus: 'completed',
      audiologistStatus: 'completed',
      createdAt: now,
      updatedAt: now,
      patient: {
        id: 'demo-patient-id',
        code: 'ERKRT-PNT-DEMO001',
        name: 'Demo Patient',
        age: 45,
        gender: 'MALE',
        contactNumber: '+919876543210',
        address: 'Demo Address, City',
      },
      centre: {
        id: 'demo-centre-id',
        user: { name: 'Demo Clinic' },
        entName: 'Dr. Demo ENT',
        contactNumber: '+919876543210',
        address: 'Demo Clinic Address',
      },
      audiologist: {
        id: 'demo-audiologist-id',
        user: { name: 'Akshay Kumar' },
        rciNumber: 'B128848',
      },
      audiometry: {
        status: 'COMPLETED',
        acTests: [
          { ear: Ear.RIGHT, frequencyHz: 500, thresholdDb: 20, response: true, maskingUsed: false },
          { ear: Ear.RIGHT, frequencyHz: 1000, thresholdDb: 25, response: true, maskingUsed: false },
          { ear: Ear.RIGHT, frequencyHz: 2000, thresholdDb: 30, response: true, maskingUsed: false },
          { ear: Ear.RIGHT, frequencyHz: 4000, thresholdDb: 35, response: true, maskingUsed: false },
          { ear: Ear.LEFT, frequencyHz: 500, thresholdDb: 40, response: true, maskingUsed: false },
          { ear: Ear.LEFT, frequencyHz: 1000, thresholdDb: 45, response: true, maskingUsed: false },
          { ear: Ear.LEFT, frequencyHz: 2000, thresholdDb: 50, response: true, maskingUsed: false },
          { ear: Ear.LEFT, frequencyHz: 4000, thresholdDb: 55, response: true, maskingUsed: false },
        ],
        bcTests: [
          { ear: Ear.RIGHT, frequencyHz: 500, thresholdDb: 15, response: true, maskingUsed: false },
          { ear: Ear.RIGHT, frequencyHz: 1000, thresholdDb: 20, response: true, maskingUsed: false },
          { ear: Ear.RIGHT, frequencyHz: 2000, thresholdDb: 25, response: true, maskingUsed: false },
          { ear: Ear.LEFT, frequencyHz: 500, thresholdDb: 35, response: true, maskingUsed: false },
          { ear: Ear.LEFT, frequencyHz: 1000, thresholdDb: 40, response: true, maskingUsed: false },
          { ear: Ear.LEFT, frequencyHz: 2000, thresholdDb: 45, response: true, maskingUsed: false },
        ],
      },
    } as ConsultationModelData;
  };
  
  const consultationData = getDemoConsultationData();
  
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    
    try {
      // Temporarily remove height restrictions for PDF capture
      const container = reportRef.current;
      const parent = container.parentElement;
      const originalContainerStyle = container.style.cssText;
      const originalParentStyle = parent?.style.cssText || '';
      
      container.style.maxHeight = 'none';
      container.style.height = 'auto';
      container.style.overflow = 'visible';
      if (parent) {
        parent.style.maxHeight = 'none';
        parent.style.height = 'auto';
        parent.style.overflow = 'visible';
      }
      
      const blob = await exportElementToPdfBlob(reportRef.current, {
        // filename not used by blob function
      });
      // Restore original styles
      container.style.cssText = originalContainerStyle;
      if (parent) {
        parent.style.cssText = originalParentStyle;
      }
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audiometry-report-preview.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  // Calculate PTA
  const calculatePTA = (results: TestResult[], mode: "AC" | "BC") => {
    const standardFrequencies = [500, 1000, 2000, 4000];
    const modeResults = results.filter(r => r.mode === mode);
    
    const thresholds = standardFrequencies
      .map(freq => {
        const result = modeResults.find(r => r.x === freq);
        return result ? result.y : undefined;
      })
      .filter(threshold => threshold !== undefined) as number[];
    
    if (thresholds.length === 0) return null;
    if (thresholds.length >= 4) {
      return thresholds.slice(0, 4).reduce((sum, threshold) => sum + threshold, 0) / 4;
    }
    if (thresholds.length === 3) {
      return thresholds.reduce((sum, threshold) => sum + threshold, 0) / 3;
    }
    if (thresholds.length === 2) {
      return thresholds.reduce((sum, threshold) => sum + threshold, 0) / 2;
    }
    return thresholds[0];
  };

  const allResults: TestResult[] = [
    ...(consultationData.audiometry?.acTests?.map(t => ({
      ear: t.ear === Ear.LEFT ? "L" : "R",
      x: t.frequencyHz,
      y: t.thresholdDb,
      mode: "AC",
      masking: t.maskingUsed ? (t.maskingEar === Ear.LEFT ? 1 : 2) : 0,
      noResponse: t.response ? 0 : 1,
      signalType: "Steady",
      pulsed: false,
    })) || []),
    ...(consultationData.audiometry?.bcTests?.map(t => ({
      ear: t.ear === Ear.LEFT ? "L" : "R",
      x: t.frequencyHz,
      y: t.thresholdDb,
      mode: "BC",
      masking: t.maskingUsed ? (t.maskingEar === Ear.LEFT ? 1 : 2) : 0,
      noResponse: t.response ? 0 : 1,
      signalType: "Steady",
      pulsed: false,
    })) || []),
  ];

  const rightResults = allResults.filter(r => r.ear === "R");
  const leftResults = allResults.filter(r => r.ear === "L");

  const acAverage = {
    rightEar: calculatePTA(rightResults, "AC"),
    leftEar: calculatePTA(leftResults, "AC"),
  };

  const bcAverage = {
    rightEar: calculatePTA(rightResults, "BC"),
    leftEar: calculatePTA(leftResults, "BC"),
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <>
      <style jsx global>{`
          @page {
            size: A4;
            margin: 10mm 3mm 2mm 3mm;
          }
        
        @media print {
          * {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .print-report-container {
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: white !important;
            overflow: visible !important;
            display: block !important;
            flex-direction: unset !important;
          }
          
          .print-report-container > div {
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            display: block !important;
          }
          
          .print-report-container > div:last-child {
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            padding-bottom: 0 !important;
            padding-top: 0 !important;
            display: block !important;
          }
          
          /* Allow page breaks for multi-page layout */
          .print-report-container > div:last-child {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
          }
          
          .print-report-container > div:last-child > div {
            page-break-inside: auto !important;
            overflow: visible !important;
            display: block !important;
          }
          
          /* Ensure all content after page break is visible */
          .pta-symbols-container,
          .pta-symbols-container ~ * {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          
          /* Force page break */
          .print-page-break {
            page-break-after: always !important;
            break-after: page !important;
            display: block !important;
            height: 1px !important;
            clear: both !important;
          }
          
          /* Ensure diagnosis section can break to new page */
          .print-report-container > div > div:nth-child(2) > div:nth-child(5) {
            page-break-before: auto !important;
            page-break-inside: auto !important;
          }
          
          /* Header - ensure not cut off at top */
          .print-report-container [data-section="header"] {
            padding-top: 4mm !important;
            padding-bottom: 0.5mm !important;
            margin-top: 0 !important;
            page-break-inside: avoid !important;
            overflow: visible !important;
          }
          
          .print-report-container [data-section="header"] > div {
            padding: 4px 12px !important;
            min-height: auto !important;
          }
          
          /* Ensure logo is visible and properly sized */
          .print-report-container [data-section="header"] img {
            max-height: 38px !important;
            width: auto !important;
            height: auto !important;
            object-fit: contain !important;
            margin-top: 3px !important;
          }
          
          .print-report-container [data-section="header"] .bg-white {
            padding: 2px !important;
            display: flex !important;
            align-items: center !important;
          }
          
          /* Ensure address box is visible */
          .print-report-container [data-section="header"] .text-blue-900 {
            padding: 2px 4px !important;
            font-size: 7px !important;
            line-height: 1.0 !important;
            margin-top: 3px !important;
          }
          
          .print-report-container [data-section="header"] .text-blue-900 p {
            font-size: 8px !important;
            margin-bottom: 0.5px !important;
            line-height: 1.0 !important;
          }
          
          .print-report-container [data-section="header"] .text-blue-900 div {
            font-size: 6px !important;
            margin-bottom: 0px !important;
            line-height: 0.9 !important;
          }
          
          .print-report-container [data-section="header"] .text-blue-900 span {
            font-size: 6px !important;
            line-height: 0.9 !important;
          }
          
          /* Title section padding */
          .print-report-container > div > div:nth-child(2) > div:nth-child(2) {
            padding-top: 0.5mm !important;
            padding-bottom: 0.5mm !important;
          }
          
          .print-report-container > div > div:nth-child(2) > div:nth-child(2) h2 {
            font-size: 14px !important;
            margin-bottom: 0 !important;
            line-height: 1.2 !important;
          }
          
          .print-report-container > div > div:nth-child(2) > div:nth-child(2) span {
            font-size: 9px !important;
            padding: 1px 3px !important;
          }
          
          /* Patient info padding */
          .print-report-container > div > div:nth-child(2) > div:nth-child(3) {
            padding-top: 0.5mm !important;
            padding-bottom: 0.5mm !important;
            padding-left: 3mm !important;
            padding-right: 3mm !important;
          }
          
          .print-report-container > div > div:nth-child(2) > div:nth-child(3) .grid {
            gap: 2mm !important;
            row-gap: 1mm !important;
          }
          
          .print-report-container > div > div:nth-child(2) > div:nth-child(3) span {
            font-size: 9px !important;
            padding-bottom: 0 !important;
            margin-right: 1mm !important;
            line-height: 1.2 !important;
          }
          
          .print-report-container > div > div:nth-child(2) > div:nth-child(3) .border-b {
            padding-bottom: 1px !important;
            line-height: 1.2 !important;
          }
          
          .audiogram-charts-container {
            page-break-inside: avoid !important;
            padding: 10mm 3mm !important;
            display: block !important;
            min-height: 1050px !important;
            height: auto !important;
          }
          
          .audiogram-chart-wrapper {
            page-break-inside: avoid !important;
          }
          
          /* Make audiogram charts larger to fill page */
          .audiogram-chart-wrapper svg {
            margin-top: 10mm !important;
            margin-bottom: 10mm !important;
            transform: scale(1.5);
            transform-origin: center;
          }
          
          /* Chart title styling */
          .audiogram-chart-wrapper h3 {
            margin-bottom: 10mm !important;
            margin-top: 8mm !important;
            font-size: 16px !important;
            font-weight: bold !important;
          }
          
          /* PTA section spacing - starts page 2 */
          .pta-symbols-container {
            margin-top: 15mm !important;
            margin-bottom: 3mm !important;
            padding-top: 10mm !important;
            padding-bottom: 0px !important;
            display: block !important;
            visibility: visible !important;
          }
          
          /* PTA table styling for readability */
          .print-report-container .bg-blue-900 {
            padding: 2mm !important;
          }
          
          .print-report-container .bg-blue-900 h3 {
            font-size: 11px !important;
            margin-bottom: 1mm !important;
          }
          
          .print-report-container .bg-blue-900 div {
            font-size: 9px !important;
            margin-bottom: 0.5mm !important;
          }
          
          .print-report-container .bg-white.border {
            padding: 2mm !important;
          }
          
          .print-report-container .bg-white.border .p-2 {
            padding: 1.5mm !important;
            font-size: 9px !important;
          }
          
          /* Diagnosis section styling for readability */
          .print-report-container > div > div:nth-child(2) > div:nth-child(5) {
            padding-top: 2mm !important;
            padding-bottom: 2mm !important;
            margin-bottom: 2mm !important;
          }
          
          .print-report-container > div > div:nth-child(2) > div:nth-child(5) > div {
            gap: 2mm !important;
          }
          
          .print-report-container > div > div:nth-child(2) > div:nth-child(5) .border {
            padding: 2mm !important;
            min-height: 15mm !important;
            font-size: 10px !important;
            line-height: 1.4 !important;
          }
          
          .print-report-container > div > div:nth-child(2) > div:nth-child(5) div[class*="font-bold"] {
            font-size: 10px !important;
            margin-bottom: 1mm !important;
          }
          
          /* Ensure footer is visible and not cut off */
          .print-report-container > div > div:nth-child(2) > div:last-child {
            padding-top: 0.5mm !important;
            padding-bottom: 0.5mm !important;
            margin-bottom: 0 !important;
            margin-top: 0 !important;
            page-break-inside: avoid !important;
          }
          
          .print-report-container > div > div:nth-child(2) > div:last-child > div {
            margin-bottom: 0px !important;
            font-size: 7px !important;
            line-height: 1.0 !important;
          }
          
          .print-report-container > div > div:nth-child(2) > div:last-child .text-xs {
            font-size: 7px !important;
            line-height: 0.9 !important;
            margin-top: 0 !important;
            padding-bottom: 0 !important;
          }
          
          .print-report-container > div > div:nth-child(2) > div:last-child .flex {
            margin-bottom: 0 !important;
            gap: 2px !important;
          }
          
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      
      <div className="h-screen w-full overflow-hidden flex justify-center items-center bg-gray-100">
        <div className="w-[1100px] h-[calc(100vh-2rem)] print:h-auto bg-white shadow-lg overflow-hidden print:overflow-visible print-report-container flex flex-col print:block">
          <div className="no-print flex-shrink-0">
            <ReportTopActions onDownload={handleDownloadPDF} onShare={() => {}} />
          </div>
          
          <div ref={reportRef} data-report-capture="true" className="bg-white overflow-y-auto flex-1 print:max-h-none print:overflow-visible print:flex-none print:h-auto pb-8" style={{ fontFamily: 'Arial, sans-serif' }}>
            {/* Header */}
            <div className="relative text-white overflow-hidden" data-section="header">
              <div className="relative flex items-center justify-between p-6 print:p-3 z-10">
                <div className="flex items-center bg-white p-2 print:p-1 rounded">
                  <Image
                    src="/EARKART LOGO BLUE.webp" 
                    alt="earKART Logo" 
                    width={200} 
                    height={250}
                    className="bg-white print:w-32 print:h-auto"
                  />
                </div>
                
                <div className="relative">
                  <div 
                    className="text-blue-900 px-6 py-4 rounded-lg shadow-md"
                    style={{ backgroundColor: '#8bdaef' }}
                  >
                    <div className="text-center">
                      <p className="font-bold text-base mb-2">{consultationData.centre?.user?.name || "Demo Clinic"}</p>
                      <div className="flex items-center justify-center mb-1">
                        <span className="text-sm mr-1">👨‍⚕️</span>
                        <span className="text-sm">Dr. {consultationData.centre?.entName || "Demo ENT"}</span>
                      </div>
                      <div className="flex items-center justify-center mb-1">
                        <span className="text-sm mr-1">📞</span>
                        <span className="text-sm">{consultationData.centre?.contactNumber || "+91 XXXXXXXXXX"}</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <span className="text-sm mr-1">📍</span>
                        <span className="text-sm">{consultationData.centre?.address || "Address"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pure Tone Audiogram Title */}
            <div className="py-4 print:py-0.5 bg-gray-50 text-center">
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <h2 className="text-2xl print:text-base font-bold text-gray-800">Pure Tone Audiogram</h2>
                  <span className="bg-amber-100 text-amber-900 border border-amber-200 text-xs print:text-[8px] font-semibold uppercase tracking-wide px-3 print:px-2 py-1 print:py-0.5 rounded-full">
                    Preview Report
                  </span>
                </div>
              </div>
            </div>

            {/* Patient Information */}
            <div className="px-10 print:px-3 py-3 print:py-1 bg-white border-b relative z-10">
              <div className="grid grid-cols-12 gap-3 print:gap-2 text-sm print:text-[9px]">
                <div className="col-span-3 flex items-center">
                  <span className="font-medium mr-1 print:mr-0.5">ID :</span>
                  <span className="border-b border-dotted border-gray-400 flex-1 pb-0.5 print:pb-0">
                    {consultationData.patient?.code || ""}
                  </span>
                </div>
                <div className="col-span-3 flex items-center">
                  <span className="font-medium mr-1 print:mr-0.5">Name :</span>
                  <span className="border-b border-dotted border-gray-400 flex-1 pb-0.5 print:pb-0">
                    {consultationData.patient?.name || ""}
                  </span>
                </div>
                <div className="col-span-3 flex items-center">
                  <span className="font-medium mr-1 print:mr-0.5">Date :</span>
                  <span className="border-b border-dotted border-gray-400 flex-1 pb-0.5 print:pb-0">
                    {format(new Date(), "dd/MM/yyyy")}
                  </span>
                </div>
                <div className="col-span-3 flex items-center">
                  <span className="font-medium mr-1 print:mr-0.5">Age :</span>
                  <span className="border-b border-dotted border-gray-400 flex-1 pb-0.5 print:pb-0">
                    {consultationData.patient?.age || ""}
                  </span>
                </div>
                <div className="col-span-3 flex items-center">
                  <span className="font-medium mr-1 print:mr-0.5">Sex :</span>
                  <span className="border-b border-dotted border-gray-400 flex-1 pb-0.5 print:pb-0">
                    {consultationData.patient?.gender || ""}
                  </span>
                </div>
                <div className="col-span-3 flex items-center">
                  <span className="font-medium mr-1 print:mr-0.5">Contact No. :</span>
                  <span className="border-b border-dotted border-gray-400 flex-1 pb-0.5 print:pb-0">
                    {consultationData.patient?.contactNumber || ""}
                  </span>
                </div>
                <div className="col-span-6 flex items-center">
                  <span className="font-medium mr-1 print:mr-0.5">Referred by :</span>
                  <span className="border-b border-dotted border-gray-400 flex-1 pb-0.5 print:pb-0">
                    {consultationData.centre?.entName || ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Audiogram Charts */}
            <div className="px-6 print:px-2 py-5 print:py-3 bg-gray-50 relative z-0 overflow-visible audiogram-charts-container" data-section="audiogram-charts">
              <div className="flex justify-center items-start gap-3 pointer-events-none print:gap-2">
                <div className="flex-1 overflow-hidden audiogram-chart-wrapper">
                  <AudiogramChart
                    title="Right Ear"
                    results={rightResults}
                    ear="R"
                  />
                </div>
                <div className="flex-1 overflow-hidden audiogram-chart-wrapper">
                  <AudiogramChart
                    title="Left Ear"
                    results={leftResults}
                    ear="L"
                  />
                </div>
              </div>
            </div>

            {/* PTA and Symbols Section */}
            <div className="mx-6 print:mx-2 mb-2 print:mb-1 relative z-10 pta-symbols-container">
              <div className="flex gap-2 print:gap-1 bg-white">
                {/* PTA Section */}
                <div className="flex-1">
                  <div className="bg-blue-900 text-white p-2.5 print:p-1 text-center">
                    <h3 className="text-xl print:text-xs font-bold">PTA (dB HL)</h3>
                    <div className="text-[10px] print:text-[7px] opacity-80">4-Frequency Average (500, 1K, 2K, 4K Hz)</div>
                    <div className="text-[10px] print:text-[7px] opacity-70">*Includes no-response values</div>
                  </div>
                  <div className="bg-white border border-gray-300 p-2.5 print:p-1">
                    <div className="grid grid-cols-3 gap-0 text-[9px] print:text-[7px]">
                      <div className="text-center font-bold border border-gray-400 p-1.5 print:p-1 bg-gray-100 text-gray-800">Test</div>
                      <div className="text-center font-bold border border-gray-400 p-1.5 print:p-1 bg-gray-100 text-gray-800">Right</div>
                      <div className="text-center font-bold border border-gray-400 p-1.5 print:p-1 bg-gray-100 text-gray-800">Left</div>
                      <div className="font-bold border border-gray-400 p-1.5 print:p-1 text-center bg-gray-100 text-gray-800">AC</div>
                      <div className="border border-gray-400 p-1.5 print:p-1 text-center font-semibold text-gray-800">
                        {acAverage.rightEar !== null ? `${acAverage.rightEar}` : "—"}
                      </div>
                      <div className="border border-gray-400 p-1.5 print:p-1 text-center font-semibold text-gray-800">
                        {acAverage.leftEar !== null ? `${acAverage.leftEar}` : "—"}
                      </div>
                      <div className="font-bold border border-gray-400 p-1.5 print:p-1 text-center bg-gray-100 text-gray-800">BC</div>
                      <div className="border border-gray-400 p-1.5 print:p-1 text-center font-semibold text-gray-800">
                        {bcAverage.rightEar !== null ? `${bcAverage.rightEar}` : "—"}
                      </div>
                      <div className="border border-gray-400 p-1.5 print:p-1 text-center font-semibold text-gray-800">
                        {bcAverage.leftEar !== null ? `${bcAverage.leftEar}` : "—"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Symbols Section */}
                <div className="flex-1">
                  <div className="bg-blue-900 text-white p-2.5 print:p-1 text-center">
                    <h3 className="text-xl print:text-xs font-bold">Symbols (ASHA Standards)</h3>
                  </div>
                  <div className="bg-white border border-gray-300 p-2.5 print:p-1">
                    <div className="grid grid-cols-4 gap-2 print:gap-1 text-xs print:text-[8px]">
                      {/* Air Conduction Unmasked */}
                      <div className="text-center">
                        <div className="font-bold mb-1 text-gray-800 text-[10px] print:text-[7px]">AC Unmasked</div>
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center justify-center">
                            <span className="text-red-500 text-base print:text-sm">○</span>
                            <span className="text-[9px] print:text-[7px] text-gray-700 ml-0.5">R</span>
                          </div>
                          <div className="flex items-center justify-center">
                            <span className="text-blue-500 text-base print:text-sm font-bold">×</span>
                            <span className="text-[9px] print:text-[7px] text-gray-700 ml-0.5">L</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Air Conduction Masked */}
                      <div className="text-center">
                        <div className="font-bold mb-1 text-gray-800 text-[10px] print:text-[7px]">AC Masked</div>
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center justify-center">
                            <span className="text-red-500 text-base print:text-sm">□</span>
                            <span className="text-[9px] print:text-[7px] text-gray-700 ml-0.5">R</span>
                          </div>
                          <div className="flex items-center justify-center">
                            <span className="text-blue-500 text-base print:text-sm">△</span>
                            <span className="text-[9px] print:text-[7px] text-gray-700 ml-0.5">L</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Bone Conduction */}
                      <div className="text-center">
                        <div className="font-bold mb-1 text-gray-800 text-[10px] print:text-[7px]">Bone Cond.</div>
                        <div className="flex flex-col space-y-0.5">
                          <div className="text-[8px] print:text-[6px] font-semibold text-gray-600">Unmasked:</div>
                          <div className="flex items-center justify-center space-x-1">
                            <span className="text-red-500 text-sm print:text-xs font-bold">&lt;</span>
                            <span className="text-[8px] print:text-[6px] text-gray-700">R</span>
                            <span className="text-blue-500 text-sm print:text-xs font-bold">&gt;</span>
                            <span className="text-[8px] print:text-[6px] text-gray-700">L</span>
                          </div>
                          <div className="text-[8px] print:text-[6px] font-semibold text-gray-600">Masked:</div>
                          <div className="flex items-center justify-center space-x-1">
                            <span className="text-red-500 text-sm print:text-xs font-bold">[</span>
                            <span className="text-[8px] print:text-[6px] text-gray-700">R</span>
                            <span className="text-blue-500 text-sm print:text-xs font-bold">]</span>
                            <span className="text-[8px] print:text-[6px] text-gray-700">L</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* No Response */}
                      <div className="text-center">
                        <div className="font-bold mb-1 text-gray-800 text-[10px] print:text-[7px]">No Response</div>
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center justify-center">
                            <span className="text-red-500 text-base print:text-sm">↙</span>
                            <span className="text-[9px] print:text-[7px] text-gray-700 ml-0.5">R</span>
                          </div>
                          <div className="flex items-center justify-center">
                            <span className="text-blue-500 text-base print:text-sm">↘</span>
                            <span className="text-[9px] print:text-[7px] text-gray-700 ml-0.5">L</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Provisional Diagnosis Display */}
            <div className="px-6 print:px-2 mb-2 print:mb-1">
              <div className="space-y-2 print:space-y-1">
                <div>
                  <div className="text-xs print:text-[9px] font-bold mb-1 print:mb-0">Provisional Diagnosis :</div>
                  <div className="border border-gray-400 bg-gray-50 p-2 print:p-1 whitespace-pre-wrap text-xs print:text-[8px] leading-tight break-words overflow-visible">
                    Demo diagnosis text
                  </div>
                </div>
                
                <div>
                  <div className="text-xs print:text-[9px] font-bold mb-1 print:mb-0">Suggestive of Diagnosis :</div>
                  <div className="border border-gray-400 bg-gray-50 p-2 print:p-1 whitespace-pre-wrap text-xs print:text-[8px] leading-tight break-words overflow-visible">
                    Demo suggestive diagnosis
                  </div>
                </div>
                
                <div>
                  <div className="text-xs print:text-[9px] font-bold mb-1 print:mb-0">Recommendation :</div>
                  <div className="border border-gray-400 bg-gray-50 p-2 print:p-1 whitespace-pre-wrap text-xs print:text-[8px] leading-tight break-words overflow-visible">
                    Demo recommendation
                  </div>
                </div>
              </div>
            </div>

            {/* Audiologist Box */}
            <div className="px-6 print:px-2 mb-2 print:mb-1 flex justify-end">
              <div className="border-2 border-blue-600 bg-blue-50 p-3 print:p-2 text-center">
                <div className="text-xs print:text-[9px] font-bold text-blue-900">Audiologist Name</div>
                <div className="text-xs print:text-[8px] text-blue-800 mt-0.5">{consultationData.audiologist?.user?.name || ""}</div>
                <div className="text-xs print:text-[9px] text-blue-900 font-bold mt-1">RCI No.</div>
                <div className="text-xs print:text-[8px] text-blue-800">{consultationData.audiologist?.rciNumber || ""}</div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 print:px-2 py-2 print:py-1 bg-gray-50 border-t text-center">
              <div className="flex items-center justify-center gap-2 mb-0.5">
                <div className="flex items-center text-xs print:text-[8px]">
                  <span className="mr-1">📧</span>
                  <span>info@earkart.in</span>
                </div>
              </div>
              <div className="text-center text-[10px] print:text-[7px] opacity-80">
                (Not for Medico-legal Purpose)
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

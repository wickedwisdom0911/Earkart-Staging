"use client";
import { useGetConsultation } from "@/hooks/consultation/use-get-consultation";
import { ConsultationModelData } from "@/models/consultation.model";
import { useParams } from "next/navigation";
import { Ear, TympType } from "@/models/enums";
import { TympanometryReadingModelData } from "@/models/tympanometry.model";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateConsultation } from "@/hooks/consultation/use-update-consultation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";

interface TympanogramPoint {
  pressure: number;
  compliance: number;
  compensatedCompliance?: number;
  ear: "L" | "R";
}

interface TympanogramGraphProps {
  realTimeData: TympanogramPoint[];
  finalData: TympanogramPoint[];
  isTestCompleted: boolean;
  selectedEar: "L" | "R";
  pressureMax: number;
  pressureMin: number;
  complianceMax: number;
  complianceMin: number;
}

const TympanogramGraph: React.FC<TympanogramGraphProps> = ({
  realTimeData,
  finalData,
  isTestCompleted,
  selectedEar,
  pressureMax,
  pressureMin,
  complianceMax,
  complianceMin,
}) => {
  const data = isTestCompleted ? finalData : realTimeData;
  const color = selectedEar === "L" ? "#3B82F6" : "#EF4444";

  // If no data, show placeholder
  if (!data || data.length === 0) {
    return (
      <div className="border rounded p-4">
        <div className="h-[400px] relative">
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-lg font-medium">No Tympanogram Data</p>
              <p className="text-sm">Tympanogram data not available</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded p-4">
      <div className="h-[400px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 20, bottom: 20, left: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="pressure"
              domain={[200, -400]}
              ticks={[200, 100, 0, -100, -200, -300, -400]}
              tickFormatter={(value: number) => `${value}`}
              label={{ value: "Pressure (daPa)", position: "bottom" }}
              type="number"
              scale="linear"
            />
            <YAxis
              domain={[0, 2]}
              tickCount={5}
              tickFormatter={(value: number) => value.toFixed(1)}
              label={{ value: "Compliance (ml)", angle: -90, position: "left" }}
            />
            <Tooltip
              formatter={(value: number) => [
                `${value.toFixed(2)} ml`,
                "Compensated Compliance",
              ]}
              labelFormatter={(label: number) => `Pressure: ${label} daPa`}
            />
            <ReferenceArea
              x1={pressureMax}
              x2={pressureMin}
              y1={complianceMin}
              y2={complianceMax}
              fill={selectedEar === "L" ? "#e6f3ff" : "#ffebee"}
              stroke={selectedEar === "L" ? "#3B82F6" : "#EF4444"}
              strokeWidth={1.5}
              fillOpacity={0.3}
              isFront={false}
            />
            <Line
              type="monotone"
              dataKey="compensatedCompliance"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: color }}
              name="Compensated Compliance"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default function TympanometryReportPage() {
  const { consultationId } = useParams();
  const {
    data: consultation,
    isLoading,
    error,
  } = useGetConsultation(consultationId as string);
  const consultationData = consultation?.data as ConsultationModelData;
  const reportRef = useRef<HTMLDivElement>(null);
  const updateConsultationMutation = useUpdateConsultation();
  const [comments, setComments] = useState<string>("");
  useEffect(() => {
    setComments(consultationData?.tympanometry?.notes || "");
  }, [consultationData?.tympanometry?.notes]);

  const handleSaveComments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultationData) return;
    try {
      await updateConsultationMutation.mutateAsync({
        ...consultationData,
        tympanometry: {
          ...consultationData.tympanometry!,
          notes: comments,
        },
      });
      toast.success("Comments saved");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save comments");
    }
  };

  // Helper: convert inline SVGs to images in the cloned DOM before rasterizing
  const rasterizeSVGsSync = (container: HTMLElement, ownerDocument: Document) => {
    const svgs = Array.from(container.querySelectorAll("svg")) as SVGSVGElement[];
    for (const svg of svgs) {
      try {
        const clone = svg.cloneNode(true) as SVGSVGElement;
        if (!clone.getAttribute("xmlns")) clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        const rect = svg.getBoundingClientRect();
        const width = rect.width || Number(clone.getAttribute("width")) || svg.clientWidth;
        const height = rect.height || Number(clone.getAttribute("height")) || svg.clientHeight;
        if (width && height) {
          clone.setAttribute("width", String(width));
          clone.setAttribute("height", String(height));
        }
        const xml = new XMLSerializer().serializeToString(clone);
        const dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
        const img = ownerDocument.createElement("img");
        (img as any).decoding = "sync";
        if ("loading" in img) (img as any).loading = "eager";
        img.setAttribute("width", String(width));
        img.setAttribute("height", String(height));
        img.style.width = `${width}px`;
        img.style.height = `${height}px`;
        img.style.display = getComputedStyle(svg).display === "inline" ? "inline-block" : "block";
        img.src = dataUrl;
        svg.style.display = "none";
        svg.parentNode?.insertBefore(img, svg);
      } catch {
        // ignore
      }
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    try {
      toast.success("Generating PDF...");
      const canvas = await html2canvas(reportRef.current, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        foreignObjectRendering: true,
        onclone: (clonedDoc) => {
          const element = clonedDoc.querySelector('[data-report-capture="true"]') as HTMLElement | null;
          if (!element) return;
          // Show print sections and rasterize SVGs in the clone only
          const formHidden = element.querySelectorAll('.print\\:hidden');
          const printBlocks = element.querySelectorAll('.hidden.print\\:block');
          formHidden.forEach((el) => ((el as HTMLElement).style.display = 'none'));
          printBlocks.forEach((el) => ((el as HTMLElement).style.display = 'block'));
          rasterizeSVGsSync(element, clonedDoc);
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const ratio = pdfWidth / imgWidth;
      const scaledWidth = pdfWidth;
      const scaledHeight = imgHeight * ratio;
      const pageCount = Math.ceil(scaledHeight / pdfHeight);

      for (let i = 0; i < pageCount; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          imgData,
          "PNG",
          0,
          -i * pdfHeight,
          scaledWidth,
          scaledHeight
        );
      }

      pdf.save(
        `tympanometry-report-${consultationData?.patient?.code || "unknown"}.pdf`
      );
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const getTympTypeDescription = (type: TympType): string => {
    switch (type) {
      case TympType.A:
        return "Normal - Normal middle ear function";
      case TympType.As:
        return "Shallow - Reduced compliance, possible ossicular fixation";
      case TympType.Ad:
        return "Deep - High compliance, possible ossicular discontinuity";
      case TympType.B:
        return "Flat - No compliance peak, possible middle ear effusion or perforation";
      case TympType.C:
        return "Negative Pressure - Eustachian tube dysfunction";
      default:
        return "Unknown";
    }
  };

  const getEarLabel = (ear: Ear): string => {
    return ear === Ear.LEFT ? "Left Ear" : "Right Ear";
  };

  if (isLoading) return <div className="p-6">Loading report...</div>;
  if (error)
    return (
      <div className="p-6 text-red-500">
        Error loading report: {error.message}
      </div>
    );
  if (!consultation?.data)
    return <div className="p-6">No consultation data found</div>;

  const tympanometryData = consultationData.tympanometry;

  if (!tympanometryData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-600 mb-4">
            No Tympanometry Data
          </h2>
          <p className="text-gray-500">
            No tympanometry test has been performed for this consultation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 flex justify-center bg-gray-100">
      <div className="w-[794px] bg-white shadow-lg">
        <div className="flex justify-center p-4 border-b">
          <Button onClick={handleDownloadPDF} className="bg-blue-600 hover:bg-blue-700 text-white">
            Download PDF
          </Button>
        </div>

        <div ref={reportRef} data-report-capture="true" className="bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
          {/* Header */}
          <div className="relative text-white overflow-hidden">
            <div className="relative flex items-center justify-between p-6 z-10">
              <div className="flex items-center bg-white p-2 rounded">
                <Image src="/EARKART LOGO BLUE.webp" alt="earKART Logo" width={200} height={250} className="bg-white" />
              </div>
              <div className="relative">
                <div className="text-blue-900 px-6 py-4 rounded-lg shadow-md" style={{ backgroundColor: '#8bdaef' }}>
                  <div className="text-center">
                    <p className="font-bold text-sm mb-2">{consultationData.centre?.user?.name || "Clinic Name"}</p>
                    <div className="flex items-center justify-center mb-1">
                      <span className="text-xs mr-1">📞</span>
                      <span className="text-xs">{consultationData.centre?.contactNumber || "+91 XXXXXXXXXX"}</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="text-xs mr-1">📍</span>
                      <span className="text-xs">{consultationData.centre?.address || "Address"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center py-6 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-800">Impedance Audiometry</h2>
          </div>

          {/* Patient Information */}
          <div className="px-8 py-4 bg-white border-b">
            <div className="grid grid-cols-12 gap-4 text-sm">
              <div className="col-span-3 flex items-center">
                <span className="font-medium mr-2">ID :</span>
                <span className="border-b border-dotted border-gray-400 flex-1 pb-1">{consultationData.patient?.code || ""}</span>
              </div>
              <div className="col-span-6 flex items-center">
                <span className="font-medium mr-2">Name :</span>
                <span className="border-b border-dotted border-gray-400 flex-1 pb-1">{consultationData.patient?.name || ""}</span>
              </div>
              <div className="col-span-3 flex items-center">
                <span className="font-medium mr-2">Date :</span>
                <span className="border-b border-dotted border-gray-400 flex-1 pb-1">{format(new Date(consultationData.createdAt), "dd/MM/yyyy")}</span>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 text-sm mt-3">
              <div className="col-span-7 flex items-center">
                <span className="font-medium mr-2">Address :</span>
                <span className="border-b border-dotted border-gray-400 flex-1 pb-1">{consultationData.patient?.address || ""}</span>
              </div>
              <div className="col-span-2 flex items-center">
                <span className="font-medium mr-2">Age :</span>
                <span className="border-b border-dotted border-gray-400 flex-1 pb-1">
                  {consultationData.patient?.dob ? Math.floor((Date.now() - new Date(consultationData.patient.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : ""}
                </span>
              </div>
              <div className="col-span-2 flex items-center">
                <span className="font-medium mr-2">Sex :</span>
                <span className="border-b border-dotted border-gray-400 flex-1 pb-1">{consultationData.patient?.gender || ""}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mt-3">
              <div className="flex items-center">
                <span className="font-medium mr-2">Contact No. :</span>
                <span className="border-b border-dotted border-gray-400 flex-1 pb-1">{consultationData.patient?.contactNumber || ""}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium mr-2">Referred by :</span>
                <span className="border-b border-dotted border-gray-400 flex-1 pb-1"></span>
              </div>
            </div>
          </div>

          {/* Tympanogram Charts */}
          <div className="px-8 py-6 bg-gray-50">
            <div className="flex justify-between items-start gap-8">
              {(() => {
                const leftReading = consultationData.tympanometry?.readings?.find(r => r.ear === Ear.LEFT);
                const rightReading = consultationData.tympanometry?.readings?.find(r => r.ear === Ear.RIGHT);

                const buildData = (r: TympanometryReadingModelData | undefined, ear: 'L' | 'R'): TympanogramPoint[] => {
                  if (!r) return [];
                  const data: TympanogramPoint[] = [];
                  for (let pressure = 200; pressure >= -400; pressure -= 25) {
                    const distance = Math.abs(pressure - r.peakPressure);
                    const sigma = 100;
                    const normalized = distance / sigma;
                    const compliance = Math.max(r.staticCompliance * Math.exp(-(normalized * normalized) / 2), 0.05);
                    data.push({ pressure, compliance: compliance * 1.1, compensatedCompliance: compliance, ear });
                  }
                  return data;
                };

                return (
                  <>
                    <div className="flex-1">
                      <TympanogramGraph
                        realTimeData={[]}
                        finalData={buildData(rightReading, 'R')}
                        isTestCompleted={true}
                        selectedEar={'R'}
                        pressureMax={200}
                        pressureMin={-400}
                        complianceMax={2.0}
                        complianceMin={0}
                      />
                    </div>
                    <div className="flex-1">
                      <TympanogramGraph
                        realTimeData={[]}
                        finalData={buildData(leftReading, 'L')}
                        isTestCompleted={true}
                        selectedEar={'L'}
                        pressureMax={200}
                        pressureMin={-400}
                        complianceMax={2.0}
                        complianceMin={0}
                      />
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Investigation: Impedance */}
          <div className="mx-8 mb-6">
            <div className="bg-white border border-gray-300">
              <div className="bg-blue-900 text-white p-3 text-center">
                <h3 className="text-sm font-bold">Investigation : Impedance</h3>
              </div>
              <div className="grid grid-cols-3 text-sm">
                <div className="text-center font-bold border border-gray-400 p-2 bg-gray-100 text-gray-800">Test</div>
                <div className="text-center font-bold border border-gray-400 p-2 bg-gray-100 text-gray-800">Rt</div>
                <div className="text-center font-bold border border-gray-400 p-2 bg-gray-100 text-gray-800">Lt</div>

                {(() => {
                  const left = consultationData.tympanometry?.readings?.find(r => r.ear === Ear.LEFT);
                  const right = consultationData.tympanometry?.readings?.find(r => r.ear === Ear.RIGHT);
                  const row = (label: string, r?: (typeof right), l?: (typeof left), formatter?: (v: number) => string) => (
                    <>
                      <div className="font-semibold border border-gray-400 p-2 text-gray-800">{label}</div>
                      <div className="border border-gray-400 p-2 text-center text-gray-800">{r ? (label === 'Tympanogram' ? r.tympType : formatter ? formatter((label === 'Compliance' ? r.staticCompliance : label === 'Ear canal volume' ? r.earCanalVolume : label === 'Peak Pressure (daPa)' ? r.peakPressure : 0)) : '—') : '—'}</div>
                      <div className="border border-gray-400 p-2 text-center text-gray-800">{l ? (label === 'Tympanogram' ? l.tympType : formatter ? formatter((label === 'Compliance' ? l.staticCompliance : label === 'Ear canal volume' ? l.earCanalVolume : label === 'Peak Pressure (daPa)' ? l.peakPressure : 0)) : '—') : '—'}</div>
                    </>
                  );
                  return (
                    <>
                      {row('Tympanogram', right, left)}
                      {row('Compliance', right, left, (v) => `${v.toFixed(2)} ml`)}
                      {row('Ear canal volume', right, left, (v) => `${v.toFixed(2)} ml`)}
                      {row('Peak Pressure (daPa)', right, left, (v) => `${v} daPa`)}
                      {/* Gradient not in model; show em dash */}
                      <div className="font-semibold border border-gray-400 p-2 text-gray-800">Gradient (daPa)</div>
                      <div className="border border-gray-400 p-2 text-center text-gray-800">—</div>
                      <div className="border border-gray-400 p-2 text-center text-gray-800">—</div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="px-8 mb-6">
            <form onSubmit={handleSaveComments} className="space-y-3 print:hidden">
              <div className="text-sm font-bold">Comments :</div>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Enter comments..."
                className="h-28 resize-none border border-gray-300 bg-gray-50"
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={updateConsultationMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {updateConsultationMutation.isPending ? "Saving..." : "Save Comments"}
                </Button>
              </div>
            </form>
            <div className="hidden print:block border border-gray-300 p-4 min-h-[120px] mt-0">
              <div className="text-sm font-bold mb-2">Comments :</div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed break-words overflow-visible">{comments || "No comments entered"}</div>
            </div>
          </div>

          {/* Audiologist Box */}
          <div className="px-8 mb-6 flex justify-end">
            <div className="border-2 border-blue-600 bg-blue-50 p-4 text-center">
              <div className="text-sm font-bold text-blue-900">Audiologist Name</div>
              <div className="text-xs text-blue-800 mt-1">{consultationData.audiologist?.user?.name || ""}</div>
              <div className="text-xs text-blue-900 font-bold mt-2">RCI No.</div>
              <div className="text-xs text-blue-800">{consultationData.audiologist?.rciNumber || ""}</div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-blue-900 text-white p-4">
            <div className="flex justify-center items-center space-x-8 text-sm">
              <div className="flex items-center"><span className="mr-2">📞</span><span>{consultationData.centre?.contactNumber || "+91 9289097578"}</span></div>
              <div className="flex items-center"><span className="mr-2">🌐</span><span>www.earkart.in</span></div>
              <div className="flex items-center"><span className="mr-2">📧</span><span>info@earkart.in</span></div>
            </div>
            <div className="text-center text-xs mt-2 opacity-80">(Not for Medico-legal Purpose)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

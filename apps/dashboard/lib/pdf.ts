"use client";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

function rasterizeSVGsInClone(container: HTMLElement, ownerDocument: Document) {
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
      // ignore; continue rendering
    }
  }
}

export async function exportElementToPdf(element: HTMLElement, filename: string, options?: { singlePage?: boolean; fullPage?: boolean }) {
  const MARK_ATTR = `data-export-mark`;
  const singlePage = !!options?.singlePage;
  const fullPage = !!options?.fullPage;
  element.setAttribute(MARK_ATTR, "1");

  const width = Math.max(element.scrollWidth, element.clientWidth, element.offsetWidth);
  const height = Math.max(element.scrollHeight, element.clientHeight, element.offsetHeight);

  const tryCapture = async (opts: { scale: number; foreignObjectRendering: boolean }) => {
    // Wait for fonts to be ready to prevent text reflow/overlap
    try {
      // @ts-ignore
      if (document.fonts?.ready) await (document as any).fonts.ready;
    } catch {}

    const cfg = {
      scale: opts.scale,
      useCORS: true,
      backgroundColor: "#ffffff",
      foreignObjectRendering: opts.foreignObjectRendering,
      allowTaint: true,
      scrollX: 0,
      scrollY: 0,
      width,
      height,
      windowWidth: width,
      windowHeight: height,
      imageTimeout: 0,
      logging: false,
      onclone: (clonedDoc: Document) => {
        const cloned = clonedDoc.querySelector(`[${MARK_ATTR}="1"]`) as HTMLElement | null;
        if (!cloned) return;
        // Normalize layout in the clone to reduce artifacts
        const html = clonedDoc.documentElement;
        const body = clonedDoc.body;
        if (html) {
          (html as HTMLElement).style.padding = "0";
          (html as HTMLElement).style.margin = "0";
          (html as HTMLElement).style.background = "#ffffff";
        }
        if (body) {
          (body as HTMLElement).style.padding = "0";
          (body as HTMLElement).style.margin = "0";
          (body as HTMLElement).style.background = "#ffffff";
        }
        cloned.style.transform = "none";
        cloned.style.boxSizing = "border-box";
        cloned.style.width = `${width}px`;
        cloned.style.minWidth = `${width}px`;
        cloned.style.height = `${height}px`;

        const hidden = cloned.querySelectorAll('.print\\:hidden');
        const shown = cloned.querySelectorAll('.hidden.print\\:block');
        hidden.forEach((el) => ((el as HTMLElement).style.display = 'none'));
        shown.forEach((el) => ((el as HTMLElement).style.display = 'block'));
        rasterizeSVGsInClone(cloned, clonedDoc);
      },
    } as Parameters<typeof html2canvas>[1];

    try {
      const canvas = await html2canvas(element, cfg);
      return canvas;
    } catch (err) {
      throw new Error(
        `html2canvas failed (foreignObjectRendering=${opts.foreignObjectRendering}, scale=${opts.scale}): ${String(
          (err as any)?.message || err
        )}`
      );
    }
  };

  try {
    // Prefer non-foreignObject first (most stable), then fall back to foreignObject
    let canvas: HTMLCanvasElement;
    try {
      canvas = await tryCapture({ scale: 2, foreignObjectRendering: false });
    } catch (e1) {
      try {
        canvas = await tryCapture({ scale: 1.5, foreignObjectRendering: false });
      } catch (e2) {
        try {
          canvas = await tryCapture({ scale: 1.5, foreignObjectRendering: true });
        } catch (e3) {
          canvas = await tryCapture({ scale: 1.2, foreignObjectRendering: true });
        }
      }
    }

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();

    if (singlePage) {
      if (fullPage) {
        // Maximize size while maintaining proportions (no distortion)
        const fitRatio = Math.min(pdfW / canvas.width, pdfH / canvas.height);
        const drawW = canvas.width * fitRatio;
        const drawH = canvas.height * fitRatio;
        // Center with minimal margins (use 99.5% of available space)
        const scaleFactor = 0.995;
        const finalW = drawW * scaleFactor;
        const finalH = drawH * scaleFactor;
        const x = (pdfW - finalW) / 2;
        const y = (pdfH - finalH) / 2;
        pdf.addImage(imgData, "PNG", x, y, finalW, finalH);
      } else {
        // Center with proportional scaling (original behavior)
        const fitRatio = Math.min(pdfW / canvas.width, pdfH / canvas.height);
        const drawW = canvas.width * fitRatio;
        const drawH = canvas.height * fitRatio;
        const x = (pdfW - drawW) / 2;
        const y = (pdfH - drawH) / 2;
        pdf.addImage(imgData, "PNG", x, y, drawW, drawH);
      }
      pdf.save(filename);
      return;
    }

    const widthRatio = pdfW / canvas.width;
    const scaledHeightWidthFit = canvas.height * widthRatio;

    // If the content can fit on one page when filling width, use full width (avoid shrink)
    if (scaledHeightWidthFit <= pdfH) {
      const yOffset = (pdfH - scaledHeightWidthFit) / 2;
      pdf.addImage(imgData, "PNG", 0, yOffset, pdfW, scaledHeightWidthFit);
    } else {
      // Multi-page slice, always fill width
      const pageHeight = pdfH / widthRatio;
      let position = 0;
      while (position < canvas.height) {
        const pageCanvas = document.createElement('canvas');
        const pageCtx = pageCanvas.getContext('2d');
        pageCanvas.width = canvas.width;
        pageCanvas.height = Math.min(pageHeight, canvas.height - position);
        if (pageCtx) {
          pageCtx.drawImage(canvas, 0, -position);
          const pageImg = pageCanvas.toDataURL('image/png');
          if (position > 0) pdf.addPage();
          pdf.addImage(pageImg, 'PNG', 0, 0, pdfW, (pageCanvas.height * pdfW) / canvas.width);
        }
        position += pageHeight;
      }
    }

    pdf.save(filename);
  } finally {
    element.removeAttribute(MARK_ATTR);
  }
}

// NEW: Generate a PDF Blob from an element without saving, for sharing purposes
export async function exportElementToPdfBlob(element: HTMLElement, options?: { singlePage?: boolean; fullPage?: boolean }): Promise<Blob> {
  const MARK_ATTR = `data-export-mark`;
  const singlePage = !!options?.singlePage;
  const fullPage = !!options?.fullPage;
  element.setAttribute(MARK_ATTR, "1");

  const width = Math.max(element.scrollWidth, element.clientWidth, element.offsetWidth);
  const height = Math.max(element.scrollHeight, element.clientHeight, element.offsetHeight);

  const tryCapture = async (opts: { scale: number; foreignObjectRendering: boolean }) => {
    try {
      // @ts-ignore
      if (document.fonts?.ready) await (document as any).fonts.ready;
    } catch {}

    const cfg = {
      scale: opts.scale,
      useCORS: true,
      backgroundColor: "#ffffff",
      foreignObjectRendering: opts.foreignObjectRendering,
      allowTaint: true,
      scrollX: 0,
      scrollY: 0,
      width,
      height,
      windowWidth: width,
      windowHeight: height,
      imageTimeout: 0,
      logging: false,
      onclone: (clonedDoc: Document) => {
        const cloned = clonedDoc.querySelector(`[${MARK_ATTR}="1"]`) as HTMLElement | null;
        if (!cloned) return;
        const html = clonedDoc.documentElement;
        const body = clonedDoc.body;
        if (html) {
          (html as HTMLElement).style.padding = "0";
          (html as HTMLElement).style.margin = "0";
          (html as HTMLElement).style.background = "#ffffff";
        }
        if (body) {
          (body as HTMLElement).style.padding = "0";
          (body as HTMLElement).style.margin = "0";
          (body as HTMLElement).style.background = "#ffffff";
        }
        cloned.style.transform = "none";
        cloned.style.boxSizing = "border-box";
        cloned.style.width = `${width}px`;
        cloned.style.minWidth = `${width}px`;
        cloned.style.height = `${height}px`;

        const hidden = cloned.querySelectorAll('.print\\:hidden');
        const shown = cloned.querySelectorAll('.hidden.print\\:block');
        hidden.forEach((el) => ((el as HTMLElement).style.display = 'none'));
        shown.forEach((el) => ((el as HTMLElement).style.display = 'block'));
        rasterizeSVGsInClone(cloned, clonedDoc);
      },
    } as Parameters<typeof html2canvas>[1];

    const canvas = await html2canvas(element, cfg);
    return canvas;
  };

  try {
    let canvas: HTMLCanvasElement;
    try {
      canvas = await tryCapture({ scale: 2, foreignObjectRendering: false });
    } catch {
      try {
        canvas = await tryCapture({ scale: 1.5, foreignObjectRendering: false });
      } catch {
        try {
          canvas = await tryCapture({ scale: 1.5, foreignObjectRendering: true });
        } catch {
          canvas = await tryCapture({ scale: 1.2, foreignObjectRendering: true });
        }
      }
    }

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();

    if (singlePage) {
      if (fullPage) {
        // Maximize size while maintaining proportions (no distortion)
        const fitRatio = Math.min(pdfW / canvas.width, pdfH / canvas.height);
        const drawW = canvas.width * fitRatio;
        const drawH = canvas.height * fitRatio;
        // Center with minimal margins (use 99.5% of available space)
        const scaleFactor = 0.995;
        const finalW = drawW * scaleFactor;
        const finalH = drawH * scaleFactor;
        const x = (pdfW - finalW) / 2;
        const y = (pdfH - finalH) / 2;
        pdf.addImage(imgData, "PNG", x, y, finalW, finalH);
      } else {
        // Center with proportional scaling (original behavior)
        const fitRatio = Math.min(pdfW / canvas.width, pdfH / canvas.height);
        const drawW = canvas.width * fitRatio;
        const drawH = canvas.height * fitRatio;
        const x = (pdfW - drawW) / 2;
        const y = (pdfH - drawH) / 2;
        pdf.addImage(imgData, "PNG", x, y, drawW, drawH);
      }
      return pdf.output("blob");
    }

    const widthRatio = pdfW / canvas.width;
    const scaledHeightWidthFit = canvas.height * widthRatio;

    if (scaledHeightWidthFit <= pdfH) {
      const yOffset = (pdfH - scaledHeightWidthFit) / 2;
      pdf.addImage(imgData, "PNG", 0, yOffset, pdfW, scaledHeightWidthFit);
    } else {
      const pageHeight = pdfH / widthRatio;
      let position = 0;
      while (position < canvas.height) {
        const pageCanvas = document.createElement('canvas');
        const pageCtx = pageCanvas.getContext('2d');
        pageCanvas.width = canvas.width;
        pageCanvas.height = Math.min(pageHeight, canvas.height - position);
        if (pageCtx) {
          pageCtx.drawImage(canvas, 0, -position);
          const pageImg = pageCanvas.toDataURL('image/png');
          if (position > 0) pdf.addPage();
          pdf.addImage(pageImg, 'PNG', 0, 0, pdfW, (pageCanvas.height * pdfW) / canvas.width);
        }
        position += pageHeight;
      }
    }

    return pdf.output("blob");
  } finally {
    element.removeAttribute(MARK_ATTR);
  }
} 
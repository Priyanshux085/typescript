import type { ReportStrategy } from "./report-strategy";

export class PDFReport implements ReportStrategy<Buffer> {
  async generate(): Promise<Buffer<ArrayBufferLike>> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const pdfData = new Uint8Array([37, 80, 68, 70]); // Simulated PDF data
    return Buffer.from(pdfData);
  }
}
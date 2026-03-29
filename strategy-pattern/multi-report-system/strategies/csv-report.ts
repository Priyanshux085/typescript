import type { ReportStrategy } from "./report-strategy";

export class CSVReport implements ReportStrategy<string> {
  async generate(): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return "CSV Report Data";
  }
}
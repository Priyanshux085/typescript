import { ReportStrategy } from "./report-strategy";

export class XMLReport implements ReportStrategy<string> {
  async generate(): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate async operation
    return "<report><title>XML Report</title><content>This is an XML report.</content></report>";
  }
}
import type { ReportStrategy } from "../strategies/report-strategy";

export class JSONReport implements ReportStrategy<typeof Object> {
  async generate(): Promise<typeof Object> {
    const data = JSON.stringify({ report: "This is a JSON report" });
    return JSON.parse(data);
  }
}
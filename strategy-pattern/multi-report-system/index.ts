// USER SIDE VIEW || END USER SIDE VIEW
import { ReportContext } from "./context/report-context";
import { CSVReport, JSONReport, PDFReport, type ReportStrategy } from "./strategies";

const reportContext = new ReportContext<any>()

enum FileType {
  csv = "csv",
  json = "json",
  pdf = "pdf",
}

const reportContextMap = new Map<keyof typeof FileType, ReportStrategy<any>>();

reportContextMap.set("csv", new CSVReport());
reportContextMap.set("json", new JSONReport());
reportContextMap.set("pdf", new PDFReport());

console.log("reportContextMap: \n", reportContextMap);

reportContext.setStrategy(reportContextMap.get("csv")!);
reportContext.setStrategy(reportContextMap.get("pdf")!);
reportContext.setStrategy(reportContextMap.get("json")!);

async function generateReport(fileType: keyof typeof FileType): Promise<any> {
  const strategy = reportContextMap.get(fileType);
  if (!strategy) {
    throw new Error(`Report strategy for file type ${fileType} not found`);
  }
  reportContext.setStrategy(strategy);
  return await reportContext.generateReport();
}

// Example usage
(async () => {
  try {
    const csvReport = await generateReport("csv");
    console.log("CSV Report:", csvReport);

    const jsonReport = await generateReport("json");
    console.log("JSON Report:", jsonReport);

    const pdfReport = await generateReport("pdf");
    console.log("PDF Report:", pdfReport);

  } catch (error) {
    console.error(error);
  }
})();

export async function UserService() {
  const report = await generateReport("csv");
  return report;
}
// USER SIDE VIEW || END USER SIDE VIEW
import { ReportContext } from "./context/report-context";
import { ReportContainer } from "./di/container";
import {
  type FileType,
} from "./di/report-context-map";

const container = new ReportContainer();
const context = new ReportContext();

async function generateReport(
	fileType: keyof typeof FileType
): Promise<unknown> {
	const strategy = container.getStrategy(fileType);

	context.setStrategy(strategy);
	return await context.generateReport();
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

		const xmlReport = await generateReport("xml");
		console.log("XML Report:", xmlReport);
	} catch (error) {
		console.error(error);
	}
})();

export async function UserService() {
	const report = await generateReport("csv");
	return report;
}

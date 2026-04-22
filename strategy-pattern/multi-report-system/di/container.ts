import { CSVReport, JSONReport, PDFReport, XMLReport, type ReportStrategy } from "../strategies";
import { FileType, reportContextMap } from "./report-context-map";

export class ReportContainer {
	private strategies: Map<string, ReportStrategy<unknown>> = reportContextMap;

	private ready(): void {
		reportContextMap.set("csv", new CSVReport());
		reportContextMap.set("json", new JSONReport());
		reportContextMap.set("pdf", new PDFReport());
		reportContextMap.set("xml", new XMLReport());
	}

	getStrategy(fileType: keyof typeof FileType): ReportStrategy<unknown> {
		const strategy = this.strategies.get(fileType);

		this.ready();

		if (!strategy) {
			throw new Error(`Report strategy for file type ${fileType} not found`);
		}
		return strategy;
	}

	getAllStrategies(): Map<string, ReportStrategy<unknown>> {
		return this.strategies;
	}
} 

import { type ReportStrategy } from "../strategies";

export enum FileType {
	csv = "csv",
	json = "json",
	pdf = "pdf",
	xml = "xml",
}

export const reportContextMap = new Map<
	keyof typeof FileType,
	ReportStrategy<unknown>
>();
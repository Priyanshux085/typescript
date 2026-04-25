import { envConfig } from "@collaro/env";
import type { IVapiConfig } from "./interface";

export function loadVapiConfig(): IVapiConfig {
	const apiKey = process.env.VAPI_API_KEY || envConfig.VAPI_API_KEY;
	const publicKey = process.env.VAPI_PUBLIC_KEY || envConfig.VAPI_PUBLIC_KEY;
	const assistantId = process.env.VAPI_ASSISTANT_ID;
	const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;

	if (!apiKey) {
		throw new Error("VAPI_API_KEY environment variable is required");
	}

	if (!publicKey) {
		throw new Error("VAPI_PUBLIC_KEY environment variable is required");
	}

	return {
		apiKey,
		publicKey,
		assistantId,
		phoneNumberId,
	};
}

/**
 * Create a VAPI config for a specific workspace
 * Can override default config with workspace-specific settings
 */
export function createWorkspaceVapiConfig(
	overrides?: Partial<IVapiConfig>
): IVapiConfig {
	const defaults = loadVapiConfig();
	return {
		...defaults,
		...overrides,
	};
}

/**
 * Validate VAPI configuration
 */
export function validateVapiConfig(config: IVapiConfig): boolean {
	if (!config.apiKey || typeof config.apiKey !== "string") {
		return false;
	}

	if (!config.publicKey || typeof config.publicKey !== "string") {
		return false;
	}

	return true;
}

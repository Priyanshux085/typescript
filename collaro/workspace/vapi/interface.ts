/**
 * VAPI Configuration for a workspace
 */
export interface IVapiConfig {
	apiKey: string;
	publicKey: string;
	assistantId?: string;
	phoneNumberId?: string;
}

/**
 * Represents a single message/turn in a transcript
 */
export interface ITranscriptMessage {
	role: "user" | "assistant";
	message: string;
	timestamp?: number;
}

/**
 * Complete transcript from a VAPI call
 */
export interface ITranscript {
	callId: string;
	phoneNumber?: string; // deprecated
	duration: number; // in seconds
	startTime: number; // timestamp
	endTime: number; // timestamp
	messages: ITranscriptMessage[];
	status: "completed" | "failed" | "in_progress";
}

/**
 * VAPI Call metadata
 */
export interface IVapiCall {
	callId: string;
	phoneNumber?: string; // deprecated
	startedAt: number;
	endedAt?: number;
	duration?: number;
	status: "queued" | "ringing" | "active" | "ended" | "failed";
	transcript?: ITranscript;
}

/**
 * Analysis result from VAPI LLM
 */
export interface IVapiAnalysisResult {
	summary: string;
	actionItems: string[];
	keyPoints: string[];
	sentiment: "positive" | "neutral" | "negative";
	participants: string[];
}

/**
 * Meeting token for VAPI
 * Used to authenticate VAPI for a specific meeting
 */
export interface IMeetingToken {
	token: string;
	meetingId: string;
	expiresAt: number;
	createdAt: number;
}

/**
 * Assistant configuration for VAPI
 * Combines model, voice, and transcriber settings
 */
export interface IVapiAssistantConfig {
	name: string;
	firstMessage: string;
	model: {
		provider: "openai" | "anthropic" | "google" | "groq";
		model: string;
		messages: Array<{
			role: "system" | "user" | "assistant";
			content: string;
		}>;
		temperature?: number;
		maxTokens?: number;
	};
	voice: {
		provider: "vapi" | "11labs" | "playht" | "openai";
		voiceId: string;
	};
	transcriber: {
		provider: "deepgram" | "google" | "assembly-ai";
		model: string;
		language?: string;
	};
	backchannelingEnabled?: boolean;
	backgroundSound?: "off" | "office" | "static";
	hipaaEnabled?: boolean;
	firstMessageMode?: "assistant-speaks-first" | "assistant-waits-for-user";
}

/**
 * Created VAPI Assistant response
 */
export interface IVapiAssistant {
	id: string;
	name: string;
	createdAt?: string;
	updatedAt?: string;
}

/**k
 * VAPI Client interface for abstracting VAPI API calls
 */
export interface IVapiClient {
	/**
	 * Create a new AI assistant for a workspace
	 */
	createAssistant(config: IVapiAssistantConfig): Promise<IVapiAssistant | null>;

	/**
	 * Get an assistant by ID
	 */
	getAssistant(assistantId: string): Promise<IVapiAssistant | null>;

	/**
	 * Update an assistant
	 */
	updateAssistant(
		assistantId: string,
		updates: Partial<IVapiAssistantConfig>
	): Promise<IVapiAssistant | null>;

	/**
	 * Delete an assistant
	 */
	deleteAssistant(assistantId: string): Promise<boolean>;

	/**
	 * List all assistants
	 */
	listAssistants(): Promise<IVapiAssistant[]>;

	/**
	 * Generate a meeting token for VAPI
	 */
	generateMeetingToken(
		meetingId: string,
		workspaceId: string
	): Promise<IMeetingToken>;

	/**
	 * Retrieve transcript for a completed call
	 */
	getTranscript(callId: string): Promise<ITranscript | null>;

	/**
	 * Get call details
	 */
	getCall(callId: string): Promise<IVapiCall | null>;

	/**
	 * Analyze transcript using VAPI LLM
	 */
	analyzeTranscript(transcript: ITranscript): Promise<IVapiAnalysisResult>;

	/**
	 * Health check for VAPI connection
	 */
	healthCheck(): Promise<boolean>;
}

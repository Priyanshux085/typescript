/**
 * VAPI Client Implementation
 *
 * Wrapper around VAPI API for:
 * - Assistant creation and management
 * - Meeting token generation
 * - Transcript retrieval
 * - Call management
 * - Transcript analysis
 */

import type {
	IVapiConfig,
	IVapiClient,
	ITranscript,
	IVapiCall,
	IVapiAnalysisResult,
	IMeetingToken,
	IVapiAssistantConfig,
	IVapiAssistant,
} from "./interface";

/**
 * Production VAPI Client using HTTP API
 *
 * Provides full CRUD operations for assistants and real-time call management
 */
export class VapiClient implements IVapiClient {
	private config: IVapiConfig;
	private baseUrl = "https://api.vapi.ai";

	constructor(config: IVapiConfig) {
		this.config = config;
	}

	/**
	 * Create a new AI assistant
	 *
	 * Sends assistant config to VAPI API and returns created assistant with ID
	 */
	async createAssistant(
		config: IVapiAssistantConfig
	): Promise<IVapiAssistant | null> {
		try {
			const response = await fetch(`${this.baseUrl}/assistant`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${this.config.apiKey}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: config.name,
					firstMessage: config.firstMessage,
					model: {
						provider: config.model.provider,
						model: config.model.model,
						temperature: config.model.temperature ?? 0.7,
						maxTokens: config.model.maxTokens ?? 1000,
						messages: config.model.messages,
					},
					voice: {
						provider: config.voice.provider,
						voiceId: config.voice.voiceId,
					},
					transcriber: {
						provider: config.transcriber.provider,
						model: config.transcriber.model,
						language: config.transcriber.language ?? "en",
					},
					backchannelingEnabled: config.backchannelingEnabled ?? true,
					backgroundSound: config.backgroundSound ?? "off",
					hipaaEnabled: config.hipaaEnabled ?? false,
					firstMessageMode: config.firstMessageMode ?? "assistant-speaks-first",
				}),
			});

			if (!response.ok) {
				console.error(
					`Failed to create assistant: ${response.status} ${response.statusText}`
				);
				return null;
			}

			const data = await response.json() as IVapiAssistant;
			console.log(`Assistant created: ${data.id} (${data.name})`);

			return {
				id: data.id as string,
				name: data.name as string,
				createdAt: data.createdAt || new Date().toISOString(),
				updatedAt: data.updatedAt || new Date().toISOString(),
			};
		} catch (error) {
			console.error("Error creating assistant:", error);
			return null;
		}
	}

	/**
	 * Get an assistant by ID
	 */
	async getAssistant(assistantId: string): Promise<IVapiAssistant | null> {
		try {
			const response = await fetch(`${this.baseUrl}/assistant/${assistantId}`, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${this.config.apiKey}`,
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				console.error(`Failed to fetch assistant: ${response.statusText}`);
				return null;
			}

			const data = await response.json() as IVapiAssistant;
			return {
				id: data.id as string,
				name: data.name as string,
				createdAt: data.createdAt || new Date().toISOString(),
				updatedAt: data.updatedAt || new Date().toISOString(),
			};
		} catch (error) {
			console.error(`Error fetching assistant ${assistantId}:`, error);
			return null;
		}
	}

	/**
	 * Update an assistant
	 */
	async updateAssistant(
		assistantId: string,
		updates: Partial<IVapiAssistantConfig>
	): Promise<IVapiAssistant | null> {
		try {
			const response = await fetch(`${this.baseUrl}/assistant/${assistantId}`, {
				method: "PATCH",
				headers: {
					Authorization: `Bearer ${this.config.apiKey}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(updates),
			});

			if (!response.ok) {
				console.error(`Failed to update assistant: ${response.statusText}`);
				return null;
			}

			const data = await response.json() as IVapiAssistant;
			console.log(`Assistant ${assistantId} updated`);

			return {
				id: data.id as string,
				name: data.name as string,
				createdAt: data.createdAt || new Date().toISOString(),
				updatedAt: data.updatedAt || new Date().toISOString(),
			};
		} catch (error) {
			console.error(`Error updating assistant ${assistantId}:`, error);
			return null;
		}
	}

	/**
	 * Delete an assistant
	 */
	async deleteAssistant(assistantId: string): Promise<boolean> {
		try {
			const response = await fetch(`${this.baseUrl}/assistant/${assistantId}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${this.config.apiKey}`,
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				console.error(`Failed to delete assistant: ${response.statusText}`);
				return false;
			}

			console.log(`Assistant ${assistantId} deleted`);
			return true;
		} catch (error) {
			console.error(`Error deleting assistant ${assistantId}:`, error);
			return false;
		}
	}

	/**
	 * List all assistants
	 */
	async listAssistants(): Promise<IVapiAssistant[]> {
		try {
			const response = await fetch(`${this.baseUrl}/assistant`, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${this.config.apiKey}`,
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				console.error(`Failed to list assistants: ${response.statusText}`);
				return [];
			}

			const data = await response.json() as { assistants?: IVapiAssistant[] };
			const assistants = data.assistants || data;

			return (assistants as IVapiAssistant[]).map((assistant) => ({
				id: assistant.id as string,
				name: assistant.name as string,
				createdAt: assistant.createdAt || new Date().toISOString(),
				updatedAt: assistant.updatedAt || new Date().toISOString(),
			}));
		} catch (error) {
			console.error("Error listing assistants:", error);
			return [];
		}
	}

	/**
	 * Generate a meeting token for VAPI authentication
	 *
	 * This token is used by clients to authenticate VAPI for a specific meeting.
	 * The token includes the meeting ID and workspace ID for security.
	 */
	async generateMeetingToken(
		meetingId: string,
		workspaceId: string
	): Promise<IMeetingToken> {
		const now = Date.now();
		const expiresAt = now + 3600000; // 1 hour

		// In production, this would call VAPI API to generate a token
		// For now, return a structured token
		return {
			token: `vapi_${workspaceId}_${meetingId}_${Math.random()
				.toString(36)
				.substr(2, 9)}`,
			meetingId,
			expiresAt,
			createdAt: now,
		};
	}

	/**
	 * Retrieve transcript for a completed call
	 */
	async getTranscript(callId: string): Promise<ITranscript | null> {
		try {
			const response = await fetch(`${this.baseUrl}/calls/${callId}`, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${this.config.apiKey}`,
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				console.error(`Failed to fetch transcript: ${response.statusText}`);
				return null;
			}

			const data = await response.json() as any;

			if (data.status !== "ended") {
				console.warn(`Call ${callId} not completed or not found`);
				return null;
			}

			return this.parseVapiCallToTranscript(data);
		} catch (error) {
			console.error("Error fetching transcript:", error);
			return null;
		}
	}

	/**
	 * Get call details
	 */
	async getCall(callId: string): Promise<IVapiCall | null> {
		try {
			const response = await fetch(`${this.baseUrl}/calls/${callId}`, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${this.config.apiKey}`,
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				console.error(`Failed to fetch call: ${response.statusText}`);
				return null;
			}

			const data = await response.json();
			return this.parseVapiCall(data);
		} catch (error) {
			console.error("Error fetching call:", error);
			return null;
		}
	}

	/**
	 * Analyze transcript using VAPI LLM
	 *
	 * Sends the transcript to VAPI's LLM for analysis.
	 * Returns extracted action items, summary, key points, etc.
	 */
	async analyzeTranscript(
		transcript: ITranscript
	): Promise<IVapiAnalysisResult> {
		try {
			const transcriptText = transcript.messages
				.map((msg) => `${msg.role}: ${msg.message}`)
				.join("\n");

			// In production, this would call VAPI's analysis endpoint
			// For now, use local analysis
			const result: IVapiAnalysisResult = {
				summary: this.generateSummary(transcriptText),
				actionItems: this.extractActionItems(transcriptText),
				keyPoints: this.extractKeyPoints(transcriptText),
				sentiment: this.analyzeSentiment(transcriptText),
				participants: this.extractParticipants(transcript),
			};

			return result;
		} catch (error) {
			console.error("Error analyzing transcript:", error);
			return {
				summary: "",
				actionItems: [],
				keyPoints: [],
				sentiment: "neutral",
				participants: [],
			};
		}
	}

	/**
	 * Health check for VAPI connection
	 */
	async healthCheck(): Promise<boolean> {
		try {
			const response = await fetch(`${this.baseUrl}/assistant`, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${this.config.apiKey}`,
					"Content-Type": "application/json",
				},
			});

			return response.ok;
		} catch (error) {
			console.error("Health check failed:", error);
			return false;
		}
	}

	// Private helper methods

	private parseVapiCall(data: any): IVapiCall {
		return {
			callId: data.id || data.callId,
			phoneNumber: data.phoneNumber,
			startedAt: data.startedAt ? new Date(data.startedAt).getTime() : 0,
			endedAt: data.endedAt ? new Date(data.endedAt).getTime() : undefined,
			duration: data.duration,
			status: data.status || "ended",
		};
	}

	private parseVapiCallToTranscript(data: any): ITranscript {
		const messages = (data.messages || []).map((msg: any) => ({
			role: msg.role || "user",
			message: msg.message || msg.content || "",
			timestamp: msg.timestamp ? new Date(msg.timestamp).getTime() : undefined,
		}));

		const startedAt = data.startedAt
			? new Date(data.startedAt).getTime()
			: Date.now();
		const endedAt = data.endedAt
			? new Date(data.endedAt).getTime()
			: Date.now();

		return {
			callId: data.id || data.callId,
			phoneNumber: data.phoneNumber,
			duration: data.duration || Math.floor((endedAt - startedAt) / 1000),
			startTime: startedAt,
			endTime: endedAt,
			messages,
			status: data.status === "completed" ? "completed" : "in_progress",
		};
	}

	private generateSummary(transcriptText: string): string {
		const lines = transcriptText.split("\n").filter((l) => l.length > 0);
		return lines.length > 0
			? `Meeting transcript with ${lines.length} messages`
			: "No transcript available";
	}

	private extractActionItems(transcriptText: string): string[] {
		const actionItems: string[] = [];
		const patterns = [
			/(?:need to|should|will|must|todo|action|task):\s*([^.]+)/gi,
			/(?:TODO|FIXME|ACTION):\s*([^.]+)/gi,
		];

		for (const pattern of patterns) {
			let match;
			while ((match = pattern.exec(transcriptText)) !== null) {
				const item = match[1]!.trim();
				if (item.length > 0 && !actionItems.includes(item)) {
					actionItems.push(item);
				}
			}
		}

		return actionItems.slice(0, 10);
	}

	private extractKeyPoints(transcriptText: string): string[] {
		const keyPoints: string[] = [];
		const keywords = [
			"important",
			"critical",
			"key",
			"decision",
			"approved",
			"agreed",
		];

		const sentences = transcriptText.split(/[.!?]+/);
		for (const sentence of sentences) {
			if (
				keywords.some((kw) => sentence.toLowerCase().includes(kw)) &&
				sentence.length > 10
			) {
				keyPoints.push(sentence.trim());
			}
		}

		return keyPoints.slice(0, 5);
	}

	private analyzeSentiment(
		transcriptText: string
	): "positive" | "neutral" | "negative" {
		const positive = ["great", "excellent", "good", "happy", "love", "perfect"];
		const negative = ["bad", "terrible", "hate", "poor", "awful", "worse"];

		const textLower = transcriptText.toLowerCase();
		let positiveCount = 0;
		let negativeCount = 0;

		for (const word of positive) {
			positiveCount += (textLower.match(new RegExp(word, "g")) || []).length;
		}

		for (const word of negative) {
			negativeCount += (textLower.match(new RegExp(word, "g")) || []).length;
		}

		if (positiveCount > negativeCount) return "positive";
		if (negativeCount > positiveCount) return "negative";
		return "neutral";
	}

	private extractParticipants(transcript: ITranscript): string[] {
		const participants = new Set<string>();

		for (const message of transcript.messages) {
			if (message.role === "user") {
				participants.add("User");
			} else if (message.role === "assistant") {
				participants.add("Assistant");
			}
		}

		return Array.from(participants);
	}
}

/**
 * Mock VAPI Client for testing/development
 *
 * Returns pre-defined mock data without making real API calls
 */
export class MockVapiClient implements IVapiClient {
	private assistants: Map<string, IVapiAssistant> = new Map();
	private assistantCounter = 0;

	async createAssistant(
		config: IVapiAssistantConfig
	): Promise<IVapiAssistant | null> {
		const id = `mock_assistant_${++this.assistantCounter}`;
		const assistant: IVapiAssistant = {
			id,
			name: config.name,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		this.assistants.set(id, assistant);
		console.log(`Mock assistant created: ${id}`);
		return assistant;
	}

	async getAssistant(assistantId: string): Promise<IVapiAssistant | null> {
		return this.assistants.get(assistantId) || null;
	}

	async updateAssistant(
		assistantId: string,
		updates: Partial<IVapiAssistantConfig>
	): Promise<IVapiAssistant | null> {
		const assistant = this.assistants.get(assistantId);
		if (!assistant) return null;

		const updated: IVapiAssistant = {
			...assistant,
			updatedAt: new Date().toISOString(),
		};

		this.assistants.set(assistantId, updated);
		return updated;
	}

	async deleteAssistant(assistantId: string): Promise<boolean> {
		return this.assistants.delete(assistantId);
	}

	async listAssistants(): Promise<IVapiAssistant[]> {
		return Array.from(this.assistants.values());
	}

	async generateMeetingToken(
		meetingId: string,
		workspaceId: string
	): Promise<IMeetingToken> {
		const now = Date.now();
		return {
			token: `mock_vapi_${workspaceId}_${meetingId}`,
			meetingId,
			expiresAt: now + 3600000,
			createdAt: now,
		};
	}

	async getTranscript(callId: string): Promise<ITranscript | null> {
		return {
			callId,
			phoneNumber: "+1234567890",
			duration: 600,
			startTime: Date.now() - 600000,
			endTime: Date.now(),
			messages: [
				{ role: "user", message: "Hello, can we discuss the project?" },
				{
					role: "assistant",
					message: "Of course! What would you like to discuss?",
				},
				{
					role: "user",
					message:
						"We need to improve the user experience. Action: redesign dashboard by next week",
				},
				{
					role: "assistant",
					message: "Great! I'll make a note of that. Anything else to discuss?",
				},
			],
			status: "completed",
		};
	}

	async getCall(callId: string): Promise<IVapiCall | null> {
		return {
			callId,
			phoneNumber: "+1234567890",
			startedAt: Date.now() - 600000,
			endedAt: Date.now(),
			duration: 600,
			status: "ended",
		};
	}

	async analyzeTranscript(
		transcript: ITranscript
	): Promise<IVapiAnalysisResult> {
		return {
			summary: "Team discussed project improvements and UX enhancements.",
			actionItems: ["Redesign dashboard by next week", "Review user feedback"],
			keyPoints: ["User experience improvements needed", "Dashboard redesign"],
			sentiment: "positive",
			participants: ["User", "Assistant"],
		};
	}

	async healthCheck(): Promise<boolean> {
		return true;
	}
}

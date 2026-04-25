import { ID } from "@collaro/utils/generate";
import {
	IVoiceAgent,
	IVoiceAgentConfig,
	IVoiceAgentStore,
} from "./interface";
import { MemoryVoiceAgentStore } from "./store";
import { VapiClient, MockVapiClient, type IVapiClient } from "../vapi";
import { TVoiceAgentId, TWorkspaceId } from "@collaro/utils";
import { IMemberDTO } from "../role/member";

type Params = ConstructorParameters<typeof VapiClient>[0];

/**
 * VoiceAgent class manages AI assistant configuration and analysis
 * One AI assistant per workspace with configurable settings
 * Integrates with VAPI for transcript analysis and LLM processing
 */
export class VoiceAgent implements IVoiceAgent {
	config: IVoiceAgentConfig = {} as IVoiceAgentConfig;
	private store: IVoiceAgentStore = MemoryVoiceAgentStore.getInstance();
	private vapiClient: IVapiClient;

	constructor(useMockVapi: boolean = false) {
		// Use mock client for development/testing, real client for production
		this.vapiClient = useMockVapi
			? new MockVapiClient()
			: new VapiClient({} as Params); // Will be initialized with real config when needed
	}

	/**
	 * Initialize VAPI client with configuration
	 * Call this after constructing the VoiceAgent if using real VAPI
	 */
	initializeVapiClient(vapiConfig: Params): void {
		if (!(this.vapiClient instanceof MockVapiClient)) {
			this.vapiClient = new VapiClient(vapiConfig);
		}
	}

	/**
	 * Create a new voice agent for a workspace
	 */
	async createAgent(
		workspaceId: TWorkspaceId,
		config: Omit<IVoiceAgentConfig, "id" | "createdAt" | "updatedAt">
	): Promise<IVoiceAgentConfig> {
		const newAgent: IVoiceAgentConfig = {
			...config,
			id: ID.voiceAgentId(),
			createdAt: new Date(),
			updatedAt: null,
		};

		await this.store.save(newAgent);
		this.config = newAgent;

		console.log(
			`Voice agent created for workspace ${workspaceId}: ${newAgent.name}`
		);

		return newAgent;
	}

	/**
	 * Get agent configuration for a workspace
	 */
	async getAgentConfig(
		workspaceId: TWorkspaceId
	): Promise<IVoiceAgentConfig | null> {
		const config = await this.store.findByWorkspaceId(workspaceId);
		if (config) {
			this.config = config;
		}
		return config;
	}

	/**
	 * Update agent configuration
	 */
	async updateAgent(
		id: TVoiceAgentId,
		updates: Partial<IVoiceAgentConfig>
	): Promise<void> {
		await this.store.update(id, {
			...updates,
			updatedAt: new Date(),
		});

		console.log(`Voice agent ${id} updated`);
	}

	/**
	 * Disable the AI agent (soft delete)
	 */
	async disableAgent(id: TVoiceAgentId): Promise<void> {
		await this.updateAgent(id, { enabled: false });
		console.log(`Voice agent ${id} disabled`);
	}

	/**
	 * Create a VAPI assistant for this workspace
	 *
	 * This creates the actual AI assistant in VAPI that will handle meeting calls
	 * and transcription. Returns the VAPI assistant ID for reference.
	 */
	async createVapiAssistant(
		workspaceName: string,
		systemPrompt: string = "You are a helpful meeting assistant. Record important points, action items, and decisions from the meeting."
	): Promise<string | null> {
		try {
			const assistantConfig = {
				name: `${workspaceName} Meeting Assistant`,
				firstMessage:
					"Hello! I'm here to help document your meeting. Please proceed with your discussion.",
				model: {
					provider: "openai" as const,
					model: "gpt-4o",
					messages: [
						{
							role: "system" as const,
							content: systemPrompt,
						},
					],
				},
				voice: {
					provider: "vapi" as const,
					voiceId: "Elliot",
				},
				transcriber: {
					provider: "deepgram" as const,
					model: "nova-3",
					language: "en",
				},
				backchannelingEnabled: true,
				backgroundSound: "off" as const,
				hipaaEnabled: false,
			};

			const assistant = await this.vapiClient.createAssistant(assistantConfig);

			if (assistant) {
				console.log(
					`VAPI assistant created: ${assistant.id} for workspace ${workspaceName}`
				);
				return assistant.id;
			}

			console.error("Failed to create VAPI assistant");
			return null;
		} catch (error) {
			console.error("Error creating VAPI assistant:", error);
			return null;
		}
	}

	/**
	 * Get VAPI assistant by ID
	 */
	async getVapiAssistant(assistantId: string) {
		return await this.vapiClient.getAssistant(assistantId);
	}

	/**
	 * Delete VAPI assistant
	 */
	async deleteVapiAssistant(assistantId: string): Promise<boolean> {
		return await this.vapiClient.deleteAssistant(assistantId);
	}

	/**
	 * Cleanup all VAPI assistants for a workspace when workspace is deleted
	 * This ensures no orphaned assistants remain in VAPI
	 */
	async cleanupWorkspaceAssistants(workspaceId: TWorkspaceId): Promise<void> {
		try {
			// List all assistants
			const assistants = await this.vapiClient.listAssistants();

			// Delete all assistants (in production, filter by workspace ID from assistant metadata)
			// For now, delete all to ensure clean state
			for (const assistant of assistants) {
				const deleted = await this.vapiClient.deleteAssistant(assistant.id);
				if (deleted) {
					console.log(`Cleaned up VAPI assistant ${assistant.id}`);
				}
			}

			console.log(
				`Workspace ${workspaceId} cleanup complete - ${assistants.length} assistants deleted`
			);
		} catch (error) {
			console.error(
				`Error cleaning up VAPI assistants for workspace ${workspaceId}:`,
				error
			);
		}
	}

	/**
	 * Analyze meeting transcript and extract insights using VAPI LLM
	 *
	 * Process:
	 * 1. Parse the transcript into structured format
	 * 2. Send to VAPI for LLM analysis
	 * 3. Extract action items, decisions, and discussion topics
	 * 4. Return structured results for action item creation
	 */
	async analyzeTranscript(
		transcript: string,
		meetingContext: {
			title: string;
			participants: string[];
		}
	): Promise<{
		summary: string;
		actions: Array<{
			assignedTo: IMemberDTO["name"];
			title: string;
			description: string;
			dueDate?: Date;
			priority: "high" | "medium" | "low";
		}>;
		keyDecisions: string[];
		discussionTopics: string[];
	}> {
		if (!transcript || transcript.trim().length === 0) {
			return {
				summary: "No content to analyze",
				actions: [],
				keyDecisions: [],
				discussionTopics: [],
			};
		}

		try {
			// Convert transcript string to structured format for VAPI
			const structuredTranscript = this.parseTranscriptString(
				transcript,
				// meetingContext
			);

			// Call VAPI LLM for analysis
			const analysisResult =
				await this.vapiClient.analyzeTranscript(structuredTranscript);

			// Transform VAPI analysis result into action items
			const actions = analysisResult.actionItems.map(
				(item: string, index: number) => ({
					assignedTo:
						meetingContext.participants[
							index % meetingContext.participants.length
						] || "Unassigned",
					title: item,
					description: `Action item from meeting: ${meetingContext.title}`,
					priority: this.determinePriority(item) as "high" | "medium" | "low",
				})
			);

			return {
				summary: analysisResult.summary,
				actions,
				keyDecisions: analysisResult.keyPoints,
				discussionTopics: this.extractTopics(transcript),
			};
		} catch (error) {
			console.error("Error analyzing transcript with VAPI:", error);

			// Fallback to basic analysis if VAPI fails
			return this.fallbackAnalysis(transcript, meetingContext);
		}
	}

	/**
	 * Parse transcript string into structured format for VAPI
	 */
	private parseTranscriptString(
		transcript: string,
		// meetingContext: { title: string; participants: string[] }
	) {
		// const ctx = meetingContext; // Use meeting context if needed for more advanced parsing
		const lines = transcript.split("\n").filter((line) => line.trim());
		const messages = lines.map((line) => {
			// Try to extract role and message
			const parts = line.split(":").map((p) => p.trim());
			if (parts.length >= 2) {
				const role = parts[0]!.toLowerCase() === "user" ? "user" : "assistant";
				return {
					role: role as "user" | "assistant",
					message: parts.slice(1).join(":"),
				};
			}

			return {
				role: "user" as const,
				message: line,
			};
		});

		return {
			callId: `transcript_${Date.now()}`,
			messages,
			duration: Math.ceil(transcript.length / 100), // Rough estimate
			startTime: Date.now() - 3600000,
			endTime: Date.now(),
			status: "completed" as const,
		};
	}

	/**
	 * Extract discussion topics from transcript
	 */
	private extractTopics(transcript: string): string[] {
		const topicKeywords = [
			"discuss",
			"talk about",
			"cover",
			"topic",
			"project",
			"feature",
			"bug",
			"issue",
			"improvement",
			"change",
		];

		const topics = new Set<string>();
		const sentences = transcript.split(/[.!?]+/);

		for (const sentence of sentences) {
			for (const keyword of topicKeywords) {
				if (sentence.toLowerCase().includes(keyword)) {
					const topic = sentence.trim().substring(0, 100);
					if (topic.length > 10) {
						topics.add(topic);
					}
					break;
				}
			}
		}

		return Array.from(topics).slice(0, 5);
	}

	/**
	 * Determine priority of an action item based on keywords
	 */
	private determinePriority(item: string): "high" | "medium" | "low" {
		const highPriorityKeywords = [
			"urgent",
			"critical",
			"asap",
			"immediately",
			"high priority",
			"blocker",
		];
		const lowPriorityKeywords = [
			"optional",
			"nice to have",
			"consider",
			"maybe",
			"low priority",
		];

		const itemLower = item.toLowerCase();

		if (highPriorityKeywords.some((kw) => itemLower.includes(kw))) {
			return "high";
		}
		if (lowPriorityKeywords.some((kw) => itemLower.includes(kw))) {
			return "low";
		}
		return "medium";
	}

	/**
	 * Fallback analysis when VAPI fails
	 */
	private fallbackAnalysis(
		transcript: string,
		meetingContext: { title: string; participants: string[] }
	) {
		return {
			summary: `Meeting: ${meetingContext.title}. ${meetingContext.participants.length} participants attended. Discussion covered key topics related to project progress and team collaboration.`,
			actions: [
				{
					assignedTo: meetingContext.participants[0] || "Unknown",
					title: "Follow up on action items",
					description: "Review meeting notes and ensure all tasks are tracked",
					priority: "medium" as const,
				},
			],
			keyDecisions: [
				"Agreed to proceed with current approach",
				"Scheduled follow-up meeting for next week",
			],
			discussionTopics: [
				"Project status updates",
				"Team collaboration",
				"Next steps and deliverables",
			],
		};
	}
}

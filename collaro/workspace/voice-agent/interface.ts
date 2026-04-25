import { TVoiceAgentId, TWorkspaceId } from "@collaro/utils";
import { IMemberDTO } from "../role/member";

export type VoiceAgentRole = "note-taker" | "facilitator";

export type VoiceModel = "gpt-4.1" | "gpt-5" | "claude-4.5" | "claude-opus-4.6";

export type VoiceProvider = "elevenlabs" | "cartesia" | "playht" | "deepgram";

/**
 * Configuration for AI voice agent at workspace level
 * Single workspace can have one AI assistant with configurable behavior
 */
export interface IVoiceAgentConfig {
	id: TVoiceAgentId;
	workspaceId: TWorkspaceId;
	name: string; // e.g., "Collaro Assistant"
	role: VoiceAgentRole; // "note-taker" or "facilitator"
	enabled: boolean;
	voiceProvider: VoiceProvider;
	voiceModel: VoiceModel;
	language: string; // e.g., "en-US"
	systemPrompt: string; // Custom instructions for the assistant
	createdAt: Date;
	updatedAt: Date | null;
}

/**
 * Meeting action generated from AI analysis
 * Stores action items extracted from meeting transcript
 */
export interface IMeetingAction {
	id: string; // UUID
	meetingId: string;
	workspaceId: TWorkspaceId;
	assignedTo: string; // Member ID
	title: string; // e.g., "Follow up with client"
	description: string;
	dueDate?: Date;
	priority: "high" | "medium" | "low";
	status: "pending" | "in-progress" | "completed";
	createdAt: Date;
	updatedAt: Date | null;
}

/**
 * Meeting transcript and analysis results
 * Stores output from AI processing after meeting ends
 */
export interface IMeetingAnalysis {
	meetingId: string;
	transcript: string;
	summary: string;
	keyDecisions: string[];
	discussionTopics: string[];
	aiGeneratedAt: Date;
}

/**
 * Store interface for voice agent configuration
 */
export interface IVoiceAgentStore {
	save(config: IVoiceAgentConfig): Promise<void>;
	findByWorkspaceId(workspaceId: TWorkspaceId): Promise<IVoiceAgentConfig | null>;
	update(id: TVoiceAgentId, config: Partial<IVoiceAgentConfig>): Promise<void>;
	delete(id: TVoiceAgentId): Promise<void>;
}

/**
 * Voice agent service interface defining core functionalities for managing AI assistants and analyzing meeting transcripts.
 * This abstracts away the underlying implementation details of how the voice agent interacts with AI providers and processes data.
 * Allows for different implementations (e.g., mock vs real VAPI client) while keeping the interface consistent for the rest of the application.
 */
export interface IVoiceAgent {
	config: IVoiceAgentConfig;

	// Configuration methods
	createAgent(
		workspaceId: TWorkspaceId,
		config: Omit<IVoiceAgentConfig, "id" | "createdAt" | "updatedAt">
	): Promise<IVoiceAgentConfig>;

	getAgentConfig(workspaceId: TWorkspaceId): Promise<IVoiceAgentConfig | null>;

	updateAgent(
		id: TVoiceAgentId,
		updates: Partial<IVoiceAgentConfig>
	): Promise<void>;

	disableAgent(id: TVoiceAgentId): Promise<void>;

	// Analysis methods
	analyzeTranscript(
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
	}>;
}

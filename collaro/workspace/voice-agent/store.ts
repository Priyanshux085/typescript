import {
	IVoiceAgentConfig,
	IVoiceAgentStore,
} from "./interface";
import { TVoiceAgentId, TWorkspaceId } from "@collaro/utils";

/**
 * In-memory store for voice agent configurations
 * Stores per-workspace AI assistant settings
 */
export class MemoryVoiceAgentStore implements IVoiceAgentStore {
	private static instance: MemoryVoiceAgentStore;
	private store: Map<TVoiceAgentId, IVoiceAgentConfig> = new Map();
	private workspaceIndex: Map<TWorkspaceId, TVoiceAgentId> = new Map(); // One agent per workspace

	private constructor() {}

	static getInstance(): MemoryVoiceAgentStore {
		if (!MemoryVoiceAgentStore.instance) {
			MemoryVoiceAgentStore.instance = new MemoryVoiceAgentStore();
		}
		return MemoryVoiceAgentStore.instance;
	}

	async save(config: IVoiceAgentConfig): Promise<void> {
		this.store.set(config.id, config);
		this.workspaceIndex.set(config.workspaceId, config.id);
	}

	async findByWorkspaceId(
		workspaceId: TWorkspaceId
	): Promise<IVoiceAgentConfig | null> {
		const agentId = this.workspaceIndex.get(workspaceId);
		if (!agentId) {
			return null;
		}
		return this.store.get(agentId) || null;
	}

	async update(
		id: TVoiceAgentId,
		config: Partial<IVoiceAgentConfig>
	): Promise<void> {
		const existing = this.store.get(id);
		if (!existing) {
			throw new Error(`Voice agent with ID ${id} not found`);
		}

		const updated: IVoiceAgentConfig = {
			...existing,
			...config,
			id: existing.id, // Preserve ID
			createdAt: existing.createdAt, // Preserve creation date
		};

		this.store.set(id, updated);
	}

	async delete(id: TVoiceAgentId): Promise<void> {
		const config = this.store.get(id);
		if (config) {
			this.workspaceIndex.delete(config.workspaceId);
			this.store.delete(id);
		}
	}
}

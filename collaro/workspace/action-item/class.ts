import {
	IActionItem,
	IActionItemDTO,
	IActionItemStore,
} from "./interface";
import { MemoryActionItemStore } from "./store";
import { ID, TActionItemId, TMeetingId, TMemberId, TWorkspaceId } from "@collaro/utils";

/**
 * ActionItem class manages action items created from meeting analysis
 */
export class ActionItem implements IActionItem {
	private store: IActionItemStore = MemoryActionItemStore.getInstance();

	/**
	 * Create a new action item from meeting
	 */
	async createActionItem(
		item: Omit<IActionItemDTO, "id" | "createdAt" | "updatedAt">
	): Promise<IActionItemDTO> {
		const newItem: IActionItemDTO = {
			...item,
			id: ID.actionID(),
			createdAt: new Date(),
			updatedAt: null,
		};

		await this.store.save(newItem);

		console.log(
			`Action item created: "${newItem.title}" for meeting ${newItem.meetingId}`
		);

		return newItem;
	}

	/**
	 * Get single action item
	 */
	async getActionItem(id: TActionItemId): Promise<IActionItemDTO | null> {
		return await this.store.findById(id);
	}

	/**
	 * List action items for a meeting
	 */
	async listActionItemsByMeeting(
		meetingId: TMeetingId
	): Promise<IActionItemDTO[]> {
		return await this.store.findByMeetingId(meetingId);
	}

	/**
	 * List action items assigned to a member
	 */
	async listActionItemsByAssignee(
		assignedTo: TMemberId
	): Promise<IActionItemDTO[]> {
		return await this.store.findByAssignee(assignedTo);
	}

	/**
	 * List all action items in workspace
	 */
	async listActionItemsByWorkspace(
		workspaceId: TWorkspaceId
	): Promise<IActionItemDTO[]> {
		return await this.store.findByWorkspace(workspaceId);
	}

	/**
	 * Update action item
	 */
	async updateActionItem(
		id: TActionItemId,
		updates: Partial<IActionItemDTO>
	): Promise<void> {
		await this.store.update(id, updates);
		console.log(`Action item ${id} updated`);
	}

	/**
	 * Mark action item as completed
	 */
	async markComplete(id: TActionItemId): Promise<void> {
		await this.store.update(id, {
			status: "completed",
			completedAt: new Date(),
		});
		console.log(`Action item ${id} marked as completed`);
	}

	/**
	 * Mark action item as in-progress
	 */
	async markInProgress(id: TActionItemId): Promise<void> {
		await this.store.update(id, {
			status: "in-progress",
		});
		console.log(`Action item ${id} marked as in-progress`);
	}

	/**
	 * Cancel action item
	 */
	async cancel(id: TActionItemId): Promise<void> {
		await this.store.update(id, {
			status: "cancelled",
		});
		console.log(`Action item ${id} cancelled`);
	}

	/**
	 * Get completion statistics for workspace
	 */
	async getCompletionStats(workspaceId: TWorkspaceId): Promise<{
		total: number;
		completed: number;
		pending: number;
		inProgress: number;
		completionRate: number;
	}> {
		const items = await this.store.findByWorkspace(workspaceId);

		const total = items.length;
		const completed = items.filter(
			(item) => item.status === "completed"
		).length;
		const pending = items.filter((item) => item.status === "pending").length;
		const inProgress = items.filter(
			(item) => item.status === "in-progress"
		).length;

		const completionRate =
			total > 0 ? Math.round((completed / total) * 100) : 0;

		return {
			total,
			completed,
			pending,
			inProgress,
			completionRate,
		};
	}
}

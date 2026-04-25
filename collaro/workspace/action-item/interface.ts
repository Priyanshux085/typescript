import { TActionItemId, TMeetingId, TMemberId, TWorkspaceId } from "@collaro/utils";
import { IMemberDTO } from "../role/member";

/**
 * Action item extracted from meeting analysis
 * Represents a task assigned to a team member
 */
export interface IActionItemDTO {
	id: TActionItemId;
	meetingId: TMeetingId;
	workspaceId: TWorkspaceId;
	assignedTo: IMemberDTO["name"];
	title: string;
	description: string;
	dueDate?: Date;
	priority: "high" | "medium" | "low";
	status: "pending" | "in-progress" | "completed" | "cancelled";
	createdAt: Date;
	updatedAt: Date | null;
	completedAt?: Date;
}

/**
 * Store interface for action items
 */
export interface IActionItemStore {
	save(item: IActionItemDTO): Promise<void>;
	findById(id: TActionItemId): Promise<IActionItemDTO | null>;
	findByMeetingId(meetingId: TMeetingId): Promise<IActionItemDTO[]>;
	findByAssignee(assignedTo: TMemberId): Promise<IActionItemDTO[]>;
	findByWorkspace(workspaceId: TWorkspaceId): Promise<IActionItemDTO[]>;
	update(id: TActionItemId, item: Partial<IActionItemDTO>): Promise<void>;
	delete(id: TActionItemId): Promise<void>;
	listByStatus(status: IActionItemDTO["status"]): Promise<IActionItemDTO[]>;
}

/**
 * Action item service interface
 */
export interface IActionItem {
	// Creation methods
	createActionItem(
		item: Omit<IActionItemDTO, "id" | "createdAt" | "updatedAt">
	): Promise<IActionItemDTO>;

	// Query methods
	getActionItem(id: TActionItemId): Promise<IActionItemDTO | null>;
	listActionItemsByMeeting(meetingId: TMeetingId): Promise<IActionItemDTO[]>;
	listActionItemsByAssignee(assignedTo: TMemberId): Promise<IActionItemDTO[]>;
	listActionItemsByWorkspace(
		workspaceId: TWorkspaceId
	): Promise<IActionItemDTO[]>;

	// Update methods
	updateActionItem(
		id: TActionItemId,
		updates: Partial<IActionItemDTO>
	): Promise<void>;
	markComplete(id: TActionItemId): Promise<void>;
	markInProgress(id: TActionItemId): Promise<void>;
	cancel(id: TActionItemId): Promise<void>;

	// Analysis methods
	getCompletionStats(workspaceId: TWorkspaceId): Promise<{
		total: number;
		completed: number;
		pending: number;
		inProgress: number;
		completionRate: number;
	}>;
}

import { IUserDTO } from "@collaro/user";
import { TSubscriptionPlan } from "@collaro/subscription";
import { TWorkspaceId } from "@collaro/utils";

/**
 * IWorkspaceDTO represents the data transfer object for a workspace,
 * containing properties such as id, name, description, createdAt, updatedAt, and subscription plan.
 *
 * The subscription property is readonly and controls member capacity limits.
 * Only workspace owner can upgrade the subscription plan (no downgrades allowed).
 */
export interface IWorkspaceDTO {
	id: TWorkspaceId;
	name: string;
	slug: string;
	logoUrl?: string;
	ownerId: IUserDTO["id"];
	description: string;
	readonly subscription: TSubscriptionPlan;
	createdAt: Date;
	updatedAt: Date | null;
}

export interface IWorkspace {
	workspace: IWorkspaceDTO;

	// methods
	createWorkspace(
		workspace: Omit<IWorkspaceDTO, "id" | "subscription">,
		subscription?: TSubscriptionPlan
	): Promise<IWorkspaceDTO>;
	getWorkspace(id: TWorkspaceId): Promise<IWorkspaceDTO | null>;
	updateWorkspace(
		id: TWorkspaceId,
		workspace: Partial<IWorkspaceDTO>
	): Promise<void>;
	deleteWorkspace(id: TWorkspaceId): Promise<void>;
	uploadLogo(id: TWorkspaceId, logo: string): Promise<void>;
	upgradePlan(id: TWorkspaceId, newPlan: TSubscriptionPlan): Promise<void>;
}

export interface IWorkspaceStore {
	save(workspace: IWorkspaceDTO): Promise<void>;
	findById(id: TWorkspaceId): Promise<IWorkspaceDTO | null>;
	update(id: TWorkspaceId, workspace: Partial<IWorkspaceDTO>): Promise<void>;
	delete(id: TWorkspaceId): Promise<void>;
	list(): Promise<IWorkspaceDTO[]>;
}

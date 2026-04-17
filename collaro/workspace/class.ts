import { ID } from "@collaro/utils/generate";
import { IWorkspace, IWorkspaceDTO, IWorkspaceStore, TWorkspaceId } from "./interface";
import { MemoryWorkspaceStore } from "./stores/memory-workspace-store";
import {
	TSubscriptionPlan,
	SubscriptionValidator,
} from "@collaro/subscription";

export class Workspace implements IWorkspace {
	workspace: IWorkspaceDTO = {} as IWorkspaceDTO;
	store: IWorkspaceStore = new MemoryWorkspaceStore();

	async createWorkspace(
		workspace: Omit<IWorkspaceDTO, "id" | "subscription">,
		subscription: TSubscriptionPlan = "free"
	): Promise<IWorkspaceDTO> {
		const newWorkspace: IWorkspaceDTO = {
			...workspace,
			id: ID.workspaceId(),
			subscription,
			createdAt: new Date(),
			updatedAt: null,
		};

		await this.store.save(newWorkspace);
		return newWorkspace;
	}

	async getWorkspace(id: TWorkspaceId): Promise<IWorkspaceDTO | null> {
		const workspace = await this.store.findById(id);
		return Promise.resolve(workspace ?? null);
	}

	async updateWorkspace(
		id: TWorkspaceId,
		workspace: Partial<IWorkspaceDTO>
	): Promise<void> {
		console.log(
			`Updating workspace with ID: ${id} with data: ${JSON.stringify(workspace)}`
		);
		await this.store.update(id, workspace);
	}

	async deleteWorkspace(id: TWorkspaceId): Promise<void> {
		console.log(`Deleting workspace with ID: ${id}`);
		await this.store.delete(id);
	}

	async uploadLogo(id: TWorkspaceId, logo: string): Promise<void> {
		console.log(`Uploading logo for workspace with ID: ${id}`);
		const workspace = await this.store.findById(id);
		if (workspace) {
			workspace.logoUrl = logo;
			await this.store.update(id, workspace);
		} else {
			console.log(`Workspace with ID: ${id} not found for logo upload.`);
		}
	}

	/**
	 * Upgrades workspace subscription plan to a higher tier.
	 * Only upgrades are allowed (no downgrades) to prevent data loss.
	 *
	 * @param id - Workspace ID to upgrade
	 * @param newPlan - Target subscription plan (must be higher than current)
	 * @throws Error if validation fails
	 */
	async upgradePlan(
		id: TWorkspaceId,
		newPlan: TSubscriptionPlan
	): Promise<void> {
		const workspace = await this.store.findById(id);

		if (!workspace) {
			throw new Error(`Workspace with ID: ${id} not found for plan upgrade.`);
		}

		// Validate that upgrade is allowed
		const validation = SubscriptionValidator.canUpgradePlan({
			fromPlan: workspace.subscription,
			toPlan: newPlan,
		});

		if (!validation.code) {
			throw new Error(
				validation.message ||
					"Plan upgrade validation failed without specific error code."
			);
		}

		await this.store.update(id, workspace);

		const newworkspace = new Workspace();
		const updatedWorkspace = await newworkspace.getWorkspace(id);
		console.log(
			`Upgraded workspace with ID: ${id} to plan: ${newPlan}. Updated workspace data: ${JSON.stringify(updatedWorkspace)}`
		);
	}
}
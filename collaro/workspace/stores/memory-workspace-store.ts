import { TWorkspaceId } from "@collaro/utils";
import { IWorkspaceDTO, IWorkspaceStore } from "./../interface";

export class MemoryWorkspaceStore implements IWorkspaceStore {
	private static instance: MemoryWorkspaceStore;

	public static getInstance(): MemoryWorkspaceStore {
		if (!MemoryWorkspaceStore.instance) {
			MemoryWorkspaceStore.instance = new MemoryWorkspaceStore();
		}
		return MemoryWorkspaceStore.instance;
	}

	private constructor() {
		if (MemoryWorkspaceStore.instance) {
			throw new Error(
				"Use MemoryWorkspaceStore.getInstance() to get the singleton instance."
			);
		}
	}
	private workspaces: IWorkspaceDTO[] = [];

	async save(workspace: IWorkspaceDTO): Promise<void> {
		this.workspaces.push(workspace);
	}

	async findById(id: TWorkspaceId): Promise<IWorkspaceDTO | null> {
		return this.workspaces.find((workspace) => workspace.id === id) || null;
	}

	async update(
		id: TWorkspaceId,
		workspace: Partial<IWorkspaceDTO>
	): Promise<void> {
		const index = this.workspaces.findIndex((w) => w.id === id);
		if (index !== -1) {
			this.workspaces[index] = {
				...this.workspaces[index],
				...workspace,
			} as IWorkspaceDTO;
		}
	}

	async delete(id: TWorkspaceId): Promise<void> {
		this.workspaces = this.workspaces.filter(
			(workspace) => workspace.id !== id
		);
	}

	async list(): Promise<IWorkspaceDTO[]> {
		return Promise.resolve([...this.workspaces]);
	}
}

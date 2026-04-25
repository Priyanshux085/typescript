import { IActionItemDTO, IActionItemStore } from "./interface";
import { TActionItemId, TMeetingId, TMemberId, TWorkspaceId } from "@collaro/utils";

const dummyStore: IActionItemDTO[] = [];

export class MemoryActionItemStore implements IActionItemStore {
	private static instance: MemoryActionItemStore;

	private constructor() {}

	static getInstance(): MemoryActionItemStore {
		if (!MemoryActionItemStore.instance) {
			MemoryActionItemStore.instance = new MemoryActionItemStore();
		}
		return MemoryActionItemStore.instance;
	}

	async save(item: IActionItemDTO): Promise<void> {
		dummyStore.push(item);
	}

	async findById(id: TActionItemId): Promise<IActionItemDTO | null> {
		return dummyStore.find((item) => item.id === id) || null;
	}

	async findByMeetingId(meetingId: TMeetingId): Promise<IActionItemDTO[]> {
		return dummyStore.filter((item) => item.meetingId === meetingId);
	}
	
	async findByAssignee(assignedTo: TMemberId): Promise<IActionItemDTO[]> {
		return dummyStore.filter((item) => item.assignedTo === String(assignedTo));
	}

	async findByWorkspace(workspaceId: TWorkspaceId): Promise<IActionItemDTO[]> {
		return dummyStore.filter((item) => item.workspaceId === workspaceId);
	}

	async update(
		id: TActionItemId,
		item: Partial<IActionItemDTO>
	): Promise<void> {
		const existingIndex = dummyStore.findIndex((i) => i.id === id);
		if (existingIndex === -1 || !dummyStore[existingIndex]) {
			throw new Error("Action item not found");
		}

		const existing = dummyStore[existingIndex];

		const updated: IActionItemDTO = {
			...existing,
			...item,
			id: existing.id,
			createdAt: existing.createdAt,
			updatedAt: new Date(),
		};

		dummyStore[existingIndex] = updated;
	}

	async delete(id: TActionItemId): Promise<void> {
		const itemIndex = dummyStore.findIndex((item) => item.id === id);
		if (itemIndex > -1) {
			dummyStore.splice(itemIndex, 1);
		}
	}

	async listByStatus(
		status: IActionItemDTO["status"]
	): Promise<IActionItemDTO[]> {
		return dummyStore.filter((item) => item.status === status);
	}

	private addToIndex<K>(
		map: Map<K, TActionItemId[]>,
		key: K,
		id: TActionItemId
	): void {
		if (!map.has(key)) {
			map.set(key, []);
		}
		map.get(key)!.push(id);
	}

	private removeFromIndex<K>(
		map: Map<K, TActionItemId[]>,
		key: K,
		id: TActionItemId
	): void {
		const ids = map.get(key);
		if (ids) {
			const index = ids.indexOf(id);
			if (index > -1) {
				ids.splice(index, 1);
			}
		}
	}
}

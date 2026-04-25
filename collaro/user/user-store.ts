import { IUserDTO, IUserStore } from "./interface";
import { TUserId } from "@collaro/utils";

const dummyStore: IUserDTO[] = [];

export class UserStore implements IUserStore {
	private static instance: UserStore;

	public static getInstance(): UserStore {
		if (!UserStore.instance) {
			UserStore.instance = new UserStore();
		}
		return UserStore.instance;
	}

	save(user: IUserDTO): void {
		dummyStore.push(user);
	}
	findById(id: TUserId): IUserDTO | null {
		return dummyStore.find((user) => user.id === id) || null;
	}
	update(id: TUserId, user: Partial<IUserDTO>): IUserDTO | null {
		const index = dummyStore.findIndex((u) => u.id === id);
		if (index !== -1 && dummyStore[index]) {
			dummyStore[index] = { ...dummyStore[index], ...user };
		}

		return dummyStore[index] || null;
	}
	delete(id: TUserId): void {
		const index = dummyStore.findIndex((u) => u.id === id);
		if (index !== -1) {
			dummyStore.splice(index, 1);
		}
	}
	list(): IUserDTO[] {
		return dummyStore;
	}
}

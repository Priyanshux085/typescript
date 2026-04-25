import { INotificationStore } from "@collaro/notification";
import {
	IMemberRequestStore,
	IRequestMemberDTO,
	MemberRequestParams,
} from "./interface";
import { TRequestId } from "@collaro/utils";

const globalRequestMember: IRequestMemberDTO[] = [];

export class MemberRequestStore implements IMemberRequestStore {
  notification: INotificationStore = {} as INotificationStore;
  private static instance: MemberRequestStore;

  private constructor() {
    if (MemberRequestStore.instance) {
      throw new Error("Use MemberRequestStore.getInstance() to get the singleton instance.");
    }
  }

  public static getInstance(): MemberRequestStore {
    if (!MemberRequestStore.instance) {
      MemberRequestStore.instance = new MemberRequestStore();
    }

    return MemberRequestStore.instance;
  }

  async save(request: IRequestMemberDTO): Promise<void> {
    globalRequestMember.push(request);
  }

  delete(id: TRequestId): Promise<void> {
    globalRequestMember.splice(globalRequestMember.findIndex(request => request.id === id), 1);
    return Promise.resolve();
  }

  async findById(id: TRequestId): Promise<IRequestMemberDTO | null> {
    const request = globalRequestMember.find(request => request.id === id);
    return request ?? null;
  }

  async list(): Promise<IRequestMemberDTO[]> {
    return globalRequestMember;
  }

  async update(id: TRequestId, request: Partial<IRequestMemberDTO>): Promise<void> {
    const index = globalRequestMember.findIndex(req => req.id === id);
    if (index !== -1 && globalRequestMember[index]) {
      globalRequestMember[index] = { ...globalRequestMember[index], ...request };
    }
  }

  async query(params: MemberRequestParams): Promise<IRequestMemberDTO[]> {
    const { workspaceId, userId } = params.query;

    const whereClause = (request: IRequestMemberDTO) => {
      if (workspaceId && request.workspaceId !== workspaceId) return false;
      if (userId && request.userId !== userId) return false;
      return true;
    };

    return globalRequestMember.filter(whereClause);
  }
}

export const memberRequestStore = MemberRequestStore.getInstance();
import { IUserDTO } from "@collaro/user";
import { BRAND } from "@collaro/utils/brand";
import { IWorkspaceDTO } from "..";
import { INotificationStore } from "@collaro/notification";

export type TRequestId = BRAND<"RequestId">;

export interface IRequestMemberDTO {
  id: TRequestId;
  name: string;
  userId: IUserDTO["id"];
  workspaceId: IWorkspaceDTO["id"];
  role: 'admin' | 'member';
  createdAt: Date;
  updatedAt: Date | null;
}

export type Input<T> = Omit<T, "id" | "createdAt" | "updatedAt">;

export type returnDTO = {
  success: boolean;
  message: string;
}

export interface IRequestMember {
  request: IRequestMemberDTO;
  store: IMemberRequestStore; 

  // methods
  createRequest(request: Input<IRequestMemberDTO>): Promise<IRequestMemberDTO>;
  getRequest(id: TRequestId ): Promise<IRequestMemberDTO | null>;
  approveRequest(id: TRequestId ): Promise<returnDTO>;
  rejectRequest(id: TRequestId ): Promise<returnDTO>;
  listRequests(workspaceId: IWorkspaceDTO["id"]): Promise<IRequestMemberDTO[]>;
}

export type MemberRequestParams = {
  query: {
    workspaceId?: IWorkspaceDTO["id"];
    userId?: IUserDTO["id"];
  }
}

// Store interface for managing member join requests.
export interface IMemberRequestStore {
  notification: INotificationStore;
  
  save(request: IRequestMemberDTO): Promise<void>;
  findById(id: TRequestId): Promise<IRequestMemberDTO | null>;
  update(id: TRequestId, request: Partial<IRequestMemberDTO>): Promise<void>;
  list(): Promise<IRequestMemberDTO[]>;
  query(params: MemberRequestParams): Promise<IRequestMemberDTO[]>;
}
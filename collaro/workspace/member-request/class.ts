import { ID } from "@collaro/utils/generate";
import {
	IMemberRequestStore,
	InputRequestMemberDTO,
	IRequestMember,
	IRequestMemberDTO,
	returnDTO,
	TRequestId,
} from "./interface";
import { memberRequestStore } from "./store";
import { IWorkspaceDTO } from "../interface";

/**
 * The RequestMember class is responsible for handling member join requests for a workspace. 
 * It provides methods to create a new join request, retrieve an existing request by its ID, approve a request, and reject a request.
 * The class interacts with the IMemberRequestStore to persist and manage the join requests.
 */
export class RequestMember implements IRequestMember {
	store: IMemberRequestStore = memberRequestStore;
	request: IRequestMemberDTO = {} as IRequestMemberDTO;

	async createRequest(
		request: InputRequestMemberDTO
	): Promise<IRequestMemberDTO> {
		const dto: IRequestMemberDTO = {
			...request,
			status: "pending",
			id: ID.requestId(),
			createdAt: new Date(),
			updatedAt: null,
		};

		await this.store.save(dto);
		return dto;
	}

	async getRequest(id: TRequestId): Promise<IRequestMemberDTO | null> {
		return await this.store.findById(id).catch((error) => {
			console.error(`Error fetching request with ID ${id}:`, error);
			return null;
		});
	}

	async approveRequest(id: TRequestId): Promise<returnDTO> {
		// find the request by ID
		const request = await this.store.findById(id);

		if (!request) {
			return Promise.resolve({
				success: false,
				message: `Request with ID ${id} not found.`,
			});
		}

		// update the request status to approved
		return this.store
			.update(id, { role: "member", status: "approved" })
			.then(() => {
				return {
					success: true,
					message: `Request with ID ${id} has been approved.`,
				};
			})
			.catch((error) => {
				console.error(`Error approving request with ID ${id}:`, error);
				return {
					success: false,
					message: `Failed to approve request with ID ${id}.`,
				};
			});
	}

	async rejectRequest(id: TRequestId): Promise<returnDTO> {
		const request = await this.store.findById(id);
		if (!request) {
			return {
				success: false,
				message: `Request with ID ${id} not found.`,
			};
		}

		await this.store
			.update(id, { role: "member", status: "rejected" })
			.catch((error) => {
				console.error(`Error rejecting request with ID ${id}:`, error);
				return {
					success: false,
					message: `Failed to reject request with ID ${id}.`,
				};
			});

		return {
			success: true,
			message: `Request with ID ${id} has been rejected.`,
		};
	}

	async listRequests(
		workspaceId: IWorkspaceDTO["id"]
	): Promise<IRequestMemberDTO[]> {
		try {
			const requests = await this.store.query({
				query: { workspaceId },
			});

			return requests.filter((r) => r.status === "pending");
		} catch (error: unknown) {
			console.error(
				`Error listing requests for workspace ${workspaceId}:`,
				error
			);
			throw new Error(
				`Failed to list requests for workspace with ID ${workspaceId}.`,
				{
					cause: error,
				}
			);
		}
	}
}
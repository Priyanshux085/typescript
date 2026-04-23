import { WorkspaceMemberManager } from "@collaro/manager";
import { batman, superman, wonderWoman } from "../user/playground";
import { generateWorkspaceSlug } from "@collaro/utils";

export const workspaceService = new WorkspaceMemberManager();

export const justiceLeagueWorkspace = await workspaceService.createWorkspace({
	name: "Justice League",
	description: "A team of superheroes",
	ownerId: batman.id,
	slug: generateWorkspaceSlug("Justice League"),
	subscription: "enterprise",
});

await workspaceService.requestWorkspace(justiceLeagueWorkspace.id, superman.id);

await workspaceService.requestWorkspace(
	justiceLeagueWorkspace.id,
	wonderWoman.id
);

const justiceLeagueRequests = await workspaceService.listRequests(
	justiceLeagueWorkspace.id
);

for (const request of justiceLeagueRequests) {
	await workspaceService.approveJoinRequest(
		request.id,
		justiceLeagueWorkspace.ownerDetail.id
	);
}

export const justiceLeagueMembers = await workspaceService.listMembers(
	justiceLeagueWorkspace.id
);

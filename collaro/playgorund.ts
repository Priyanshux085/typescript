import { WorkspaceMemberManager } from "@collaro/manager";
import { User } from "@collaro/user";
import { generateUserName, generateWorkspaceSlug } from "./utils/generate";

const userService = new User();
const workspaceManager = new WorkspaceMemberManager();

async function main() {
	try {
		const user01 = userService.createUser({
			name: "Tony Stark",
			email: "tony.stark@avengers.com",
			password: "password123",
			userName: generateUserName("Tony Stark"),
		});

		const avengers = await workspaceManager.createWorkspace({
			name: "Team Avengers",
			description: "Workspace for the Avengers team",
			ownerId: user01.id,
			slug: generateWorkspaceSlug("Team Avengers"),
			subscription: "free",
		});

		const user01Owner = await workspaceManager.listMemberDetails({
			userID: user01.id,
			workspaceId: avengers.id,
		});

		for (let i = 0; i < 4; i++) {
			const user = userService.createUser({
				name: `User ${i + 1}`,
				email: `user${i + 1}@avengers.com`,
				password: "password123",
				userName: generateUserName(`User ${i + 1}`),
			});

			await workspaceManager.requestWorkspace(avengers.id, user.id);

			const requests = await workspaceManager.listRequests(avengers.id);
			// console.log(`Join requests for workspace ${avengers.name}:`, requests);

			const request = requests.find((req) => req.userId === user.id);

			await workspaceManager.approveJoinRequest(request!.id, user01Owner!.id);
		}

		await workspaceManager.listMembers(avengers.id).then((members) => {
			console.log(`Members of workspace ${avengers.name}:`, members);
		});
	} catch (error) {
		console.error("Error creating workspace:", error);
	}
}

await main();

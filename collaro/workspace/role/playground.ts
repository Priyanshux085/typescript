import { User } from "@collaro/user";
import { RoleManager } from "./manager";
import { generateUserName, generateWorkspaceSlug } from "@collaro/utils";
import { WorkspaceMemberManager } from "@collaro/manager";
import { IRoleDTO } from "./interface";

const workspaceManager = new WorkspaceMemberManager();
const userService = new User();

async function AvengersWorkspacePlayground() {
	const tony = userService.createUser({
		name: "Tony Stark",
		email: "tony.stark@gmail.com",
		password: "password123",
		userName: generateUserName("Tony Stark"),
	});

	const steve = userService.createUser({
		name: "Steve Rogers",
		email: "steve.rogers@gmail.com",
		password: "password123",
		userName: generateUserName("Steve Rogers"),
	});

	const workspace = await workspaceManager.createWorkspace({
		name: "Avengers",
		description: "Workspace for the Avengers team",
		ownerId: tony.id,
		slug: generateWorkspaceSlug("Avengers"),
		subscription: "enterprise",
	});

	const roleService = new RoleManager(workspace.id, workspace.subscription);

	const tonyMember = await workspaceManager.listMemberDetails({
		userID: tony.id,
		workspaceId: workspace.id,
	});

	await workspaceManager.requestWorkspace(workspace.id, steve.id);

	const pendingRequests = await workspaceManager.listRequests(workspace.id);

	await workspaceManager.approveJoinRequest(
		pendingRequests[0]!.id,
		tonyMember!.id
	);

	await workspaceManager.listMemberDetails({
		userID: steve.id,
		workspaceId: workspace.id,
	});

	// Seed default roles first
	const defaultRoles = await roleService.seedDefaultWorkspaceRoles(workspace.id);
	console.log(`✅ Seeded ${defaultRoles.length} default roles`);

	// Role 1: Meeting Moderator - Can manage meetings and export data
	const moderatorResult = await roleService.createCustomRole(
		"Meeting Moderator",
		[
			"read:meeting",
			"create:meeting",
			"update:meeting",
			"delete:meeting",
			"export_data:meeting_data",
		],
		{
			description: "Can create, moderate meetings, and export meeting data",
		}
	);
	if (moderatorResult.success) {
		console.log(`✅ Created role: ${moderatorResult.role?.name}`);
	} else {
		console.error(`❌ Failed to create Meeting Moderator role: ${moderatorResult.message}`);
	}

	// Role 2: Member Manager - Can manage workspace members and assign roles
	const memberManagerResult = await roleService.createCustomRole(
		"Member Manager",
		[
			"read:member",
			"update:member",
			"invite:member",
			"remove:member",
			"assign_role:member",
		],
		{
			description: "Can manage workspace members and assign roles",
		}
	);
	if (memberManagerResult.success) {
		console.log(`✅ Created role: ${memberManagerResult.role?.name}`);
	} else {
		console.error(`❌ Failed to create Member Manager role: ${memberManagerResult.message}`);
	}

	// Role 3: Analytics Viewer - Read-only access to analytics and data export
	const analyticsViewerResult = await roleService.createCustomRole(
		"Analytics Viewer",
		[
			"read:meeting",
			"view_analytics:workspace_analytics",
			"export_data:member_data",
			"export_data:meeting_data",
		],
		{
			description: "Can view analytics and export data reports",
		}
	);
	if (analyticsViewerResult.success) {
		console.log(`✅ Created role: ${analyticsViewerResult.role?.name}`);
	} else {
		console.error(`❌ Failed to create Analytics Viewer role: ${analyticsViewerResult.message}`);
	}

	// Role 4: Guest Contributor - Minimal permissions for new team members
	const guestContributorResult = await roleService.createCustomRole(
		"Guest Contributor",
		["read:member", "read:workspace", "read:meeting", "create:meeting"],
		{
			description: "Can read workspace data and create meetings",
		}
	);
	if (guestContributorResult.success) {
		console.log(`✅ Created role: ${guestContributorResult.role?.name}`);
	} else {
		console.error(`❌ Failed to create Guest Contributor role: ${guestContributorResult.message}`);
	}

	// List all roles in the workspace
	const allRoles = await roleService.getRolesForWorkspace();
	console.log(`\n📋 Total roles in workspace: ${allRoles.length}`);
	allRoles.forEach((role: IRoleDTO) => {
		console.log(`   - ${role.name} (${role.isCustom ? "custom" : "predefined"}) with ${role.permissions.length} permissions`);
	});
}

async function playground() {
	try {
		await AvengersWorkspacePlayground();
		console.log("\n✨ Avengers workspace setup completed successfully!");
	} catch (error) {
		console.error("❌ Playground error:", error);
	}
}

playground();
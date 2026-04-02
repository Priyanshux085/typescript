import { User } from "@collaro/user";
import { Workspace } from "@collaro/workspace";
import { UserId, WorkspaceId } from "./utils/brand";

const hashPassword = String(Bun.hash("password"));
const testUserId = Bun.randomUUIDv7() as UserId;
const testWorkspaceId = Bun.randomUUIDv7() as WorkspaceId;

const testUser = new User({
  id: testUserId,
  name: "Test User",
  userName: "testuser",
  email: "test@example.com",
  password: hashPassword,
  createdAt: new Date(),
  updatedAt: new Date(),
});
console.log(testUser.createUser);

const testWorkspace = new Workspace({
  id: testWorkspaceId,
  name: "Test Workspace",
  ownerId: testUser.user.id,
  description: "This is a test workspace.",
  createdAt: new Date(),
  updatedAt: new Date(),
});

console.log(testWorkspace.members);

// const fetchedUser = testUser.getUser(testUserId);
// console.log("Fetched User:", fetchedUser);
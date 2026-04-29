import { WorkspaceMemberManager } from "@collaro/manager";
import { polar, defaultProductId } from "./polar-config";

import { User } from "@collaro/user";
import { polarEnv } from "./env";

const userService = new User();

const newUser = userService.createUser({
  name: "John Doe",
  email: "work.priyanshu085@gmail.com",
  password: "securepassword123",
  userName: "johndoe",
});

const wService = new WorkspaceMemberManager();

const newWorkspace = await wService.createWorkspace({
  name: "New Workspace",
  description: "A workspace for testing",
  ownerId: newUser.id,
  slug: "new-workspace",
  subscription: "enterprise",
  logoUrl: "https://example.com/logo.png",
})

// const polarCustomer = await polar.customers.create({
//   name: newUser.name,
//   email: newUser.email,
//   externalId: String(newUser.id),
//   metadata: {
//     userId: String(newUser.id),
//     workspaceName: newWorkspace.name,
//     workspaceId: String(newWorkspace.id),
//   }
// });

// console.log("Created Polar Customer:", polarCustomer);

const checkOut = await polar.checkouts.create({
  products: [polarEnv.products.enterprisePlan],
  customerBillingName: newUser.name,
  customerEmail: newUser.email,
  metadata: {
    userId: String(newUser.id),
    workspaceName: newWorkspace.name,
    workspaceId: String(newWorkspace.id),
  },
  customerName: newUser.name,
  currency: "inr",
  amount: 100,
})

const customer = await polar.customers.list({
  email: newUser.email,
})

const subscription = await polar.subscriptions.create({
  productId: defaultProductId,
  customerId: checkOut.customerId!,
  externalCustomerId: customer.result.items[0]?.externalId || String(newUser.id),
  metadata: {
    userId: String(newUser.id),
    workspaceName: newWorkspace.name,
    workspaceId: String(newWorkspace.id),
  },
})

console.log("Checkout URL:", checkOut.url);
console.log("Subscription:", subscription);
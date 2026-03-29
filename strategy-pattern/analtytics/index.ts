// Clien Side or End User View.

import {  AnalyticsStrategy, type TUser, UserBehaviorStrategy } from "./analytics";

const userBehaviorStrategy = new AnalyticsStrategy<TUser[]>(new UserBehaviorStrategy());
userBehaviorStrategy.execute().then((result) => {
  console.log("User Behavior Analytics Result:", result);
}).catch((error) => {
  console.error("Error executing user behavior strategy:", error);
});

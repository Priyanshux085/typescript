/**
 * DI Bootstrap - Register all dependencies
 * Call this at application startup
 */

import { DIContainer } from "./container";
import { MemoryMeetingStore } from "@collaro/meeting/stores/memory-meeting-store";
import { ParticipantStore } from "@collaro/meeting/stores/participant-store";
import { MemoryWorkspaceMeetingStore } from "@collaro/meeting/stores/memory-meeting-store";

export function bootstrapDI(): void {
  const container = DIContainer.getInstance();

  // Register stores as singletons
  container.registerInstance("MemoryMeetingStore", MemoryMeetingStore.getInstance());
  container.registerInstance("ParticipantStore", new ParticipantStore());
  container.registerInstance("MemoryWorkspaceMeetingStore", MemoryWorkspaceMeetingStore.getInstance());
  
  // Register other dependencies as needed
  // container.registerInstance("UserStore", UserStore.getInstance());
  // container.registerInstance("WorkspaceStore", MemoryWorkspaceStore.getInstance());
}

// Auto-bootstrap when this module is imported
bootstrapDI();

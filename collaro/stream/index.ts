/**
 * Stream.io Integration Module
 * Exports for both server-side and client-side video call management
 */

// ============================================
// SERVER-SIDE EXPORTS (Node.js)
// ============================================
export { streamClient } from "./stream";
export { config } from './env'

// ============================================
// CLIENT-SIDE EXPORTS (React/Browser)
// ============================================
export { createClientVideoConfig, type TClientStreamParams } from "./stream";

/**
 * COMPLETE WORKFLOW
 * ====================
 * 
 * PHASE 1: Server-side (Node.js)
 * ──────────────────────────────
 * import { streamClient } from '@collaro/stream'
 * 
 * // Create call
 * const call = streamClient.video.call('Instant', meetingId)
 * await call.getOrCreate({ ... })
 * 
 * // Add members
 * await call.updateCallMembers({ update_members: [...] })
 * 
 * // Generate token for client
 * const token = streamClient.generateCallToken({
 *   user_id: userId,
 *   call_cids: [`Instant:${meetingId}`],
 *   validity_in_seconds: 3600,
 * })
 * 
 * // Send to client via API
 * res.json({ callToken: token, callId: meetingId, ... })
 * 
 * 
 * PHASE 2: Client-side (React)
 * ─────────────────────────────
 * import { joinCall, StreamProvider, DefaultCallLayout } from '@collaro/stream'
 * 
 * // Join the call
 * const { client, call } = await joinCall({
 *   callToken,
 *   callId,
 *   callType: 'Instant',
 *   userId,
 *   apiKey: 'dd6fmfafadxs'
 * })
 * 
 * // Render
 * <StreamProvider {...config}>
 *   <DefaultCallLayout />
 * </StreamProvider>
 */

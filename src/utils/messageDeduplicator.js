import {
  extractGroupId,
  extractMessageText,
  extractSenderInfo,
} from "./extractors.js";

/**
 * Message deduplication utility
 * Prevents processing the same message multiple times
 */

// Store processed message IDs with timestamp
const processedMessages = new Map();

// Clean up old entries after 1 hour
const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes
const MAX_AGE = 10 * 60 * 1000; // 10 minutes

/**
 * Generate a unique key for a message
 * @param {Object} event - Webhook event
 * @returns {string} Unique key
 */
function getMessageKey(event) {
  // Use message_id if available (most reliable)
  if (event.message?.msg_id) {
    return `msg_${event.message.msg_id}`;
  }
  if (event.message?.message_id) {
    return `msg_${event.message.message_id}`;
  }
  if (event.message?.id) {
    return `msg_${event.message.id}`;
  }
  
  // Fallback: use combination of sender, group, message text, and time bucket
  const sender = extractSenderInfo(event);
  const senderId = sender.id || event.user_id_by_app || event.sender?.id || "unknown";
  const groupId = extractGroupId(event) || event.recipient?.id || event.group_id || "unknown";
  const messageTextRaw = extractMessageText(event);
  const normalizedMessage = (messageTextRaw || "").trim().toLowerCase();
  
  // If message content is empty, fall back to timestamp
  if (!normalizedMessage) {
    const eventTimestamp = Number(event.timestamp) || Date.now();
    return `fallback_empty_${senderId}_${groupId}_${eventTimestamp}`;
  }
  
  // Create hash-like key from message content (remove whitespace to avoid duplicates due to spacing)
  const messageHash = normalizedMessage.replace(/\s+/g, "");
  
  return `fallback_${senderId}_${groupId}_${messageHash}`;
}

/**
 * Check if message has been processed
 * @param {Object} event - Webhook event
 * @returns {boolean} True if already processed
 */
export function isMessageProcessed(event) {
  const key = getMessageKey(event);
  const processed = processedMessages.has(key);
  
  if (processed) {
    console.log(`⚠️  Message already processed (deduplication): ${key}`);
  }
  
  return processed;
}

/**
 * Mark message as processed
 * @param {Object} event - Webhook event
 */
export function markMessageAsProcessed(event) {
  const key = getMessageKey(event);
  const timestamp = Date.now();
  
  processedMessages.set(key, timestamp);
  console.log(`✅ Message marked as processed: ${key}`);
  
  // Clean up old entries periodically
  cleanupOldEntries();
}

/**
 * Clean up old processed messages
 */
function cleanupOldEntries() {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, timestamp] of processedMessages.entries()) {
    if (now - timestamp > MAX_AGE) {
      processedMessages.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} old processed message entries`);
  }
}

// Periodic cleanup (every hour)
setInterval(cleanupOldEntries, CLEANUP_INTERVAL);

/**
 * Clear all processed messages (for testing/debugging)
 */
export function clearProcessedMessages() {
  processedMessages.clear();
  console.log("🧹 All processed messages cleared");
}


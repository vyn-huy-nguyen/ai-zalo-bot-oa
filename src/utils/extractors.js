/**
 * Extract group ID from event (handle multiple formats)
 * Format from Zalo: recipient.id is the group_id
 * @param {Object} event - Webhook event from Zalo
 * @returns {string|null} Group ID
 */
export function extractGroupId(event) {
  // Zalo GMF format: recipient.id is the group_id
  if (event.recipient?.id) {
    return event.recipient.id;
  }
  // Fallback to other possible formats
  return (
    event.group_id ||
    event.recipient?.group_id ||
    event.group?.id ||
    event.conversation?.id ||
    null
  );
}

/**
 * Extract sender info from event (handle multiple formats)
 * Format from Zalo: sender.id is the user_id
 * @param {Object} event - Webhook event from Zalo
 * @returns {Object} Sender info with id, name, user_id_by_app
 */
export function extractSenderInfo(event) {
  return {
    id:
      event.sender?.id ||
      event.user_id_by_app ||
      event.sender?.user_id ||
      event.user_id ||
      "Unknown",
    name:
      event.sender?.name ||
      event.sender?.display_name ||
      event.user_name ||
      "Unknown",
    user_id_by_app: event.user_id_by_app || null,
  };
}

/**
 * Extract message text from event (handle multiple formats)
 * Format from Zalo: message.text is the message content
 * @param {Object} event - Webhook event from Zalo
 * @returns {string} Message text
 */
export function extractMessageText(event) {
  // Zalo GMF format: message.text contains the message content
  if (event.message?.text) {
    return event.message.text;
  }
  // Fallback to other possible formats
  if (event.message?.content) {
    return event.message.content;
  }
  if (typeof event.message === "string") {
    return event.message;
  }
  if (event.text) {
    return event.text;
  }
  return "";
}


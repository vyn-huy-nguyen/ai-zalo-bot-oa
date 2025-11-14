import axios from "axios";
import { getAccessToken } from "./token.js";

/**
 * Get GMF quota (asset_id) for creating groups
 * Reference: https://developers.zalo.me/docs/official-account/nhom-chat-gmf/quan-ly/quota
 * @param {string} refreshToken - Refresh token
 * @param {string} fallbackToken - Fallback access token
 * @param {string} productType - Optional: gmf10, gmf50, gmf100
 * @param {string} quotaType - Optional: sub_quota, purchase_quota, reward_quota
 * @returns {Promise<Array>} Array of quota items with asset_id
 */
export async function getGMFQuota(refreshToken, fallbackToken, productType = null, quotaType = "sub_quota") {
  try {
    const token = await getAccessToken(refreshToken, fallbackToken);

    const endpoint = "https://openapi.zalo.me/v3.0/oa/quota/group";

    const requestBody = {
      quota_owner: "OA",
      ...(productType && { product_type: productType }),
      ...(quotaType && { quota_type: quotaType }),
    };

    const response = await axios.post(endpoint, requestBody, {
      headers: {
        "Content-Type": "application/json",
        access_token: token,
      },
      timeout: 10000,
    });

    if (response.data && response.data.error === 0) {
      return response.data.data;
    } else {
      throw new Error(response.data?.message || "Failed to get quota");
    }
  } catch (error) {
    console.error("❌ Error getting GMF quota:", error.message);
    throw error;
  }
}

/**
 * Create GMF group
 * Reference: https://developers.zalo.me/docs/official-account/nhom-chat-gmf/quan-ly/create_group
 */
export async function createGroup(
  groupName,
  memberUserIds = [],
  assetId = null,
  groupDescription = "",
  refreshToken,
  fallbackToken
) {
  try {
    if (!groupName || !groupName.trim()) {
      throw new Error("Group name is required");
    }

    if (!memberUserIds || memberUserIds.length === 0) {
      throw new Error(
        "member_user_ids is required and cannot be empty (must have at least 1 admin of OA)"
      );
    }

    if (memberUserIds.length > 99) {
      throw new Error("member_user_ids cannot exceed 99 members");
    }

    const token = await getAccessToken(refreshToken, fallbackToken);

    // Get asset_id if not provided
    let finalAssetId = assetId;
    if (!finalAssetId) {
      console.log("📋 Getting GMF quota to find asset_id...");
      const quota = await getGMFQuota(refreshToken, fallbackToken);

      const availableQuota = quota.find((q) => q.status === "available");
      if (availableQuota) {
        finalAssetId = availableQuota.asset_id;
        console.log(`✅ Using asset_id: ${finalAssetId} (${availableQuota.product_type || "Default"})`);
      } else {
        throw new Error("No available GMF quota found. All asset_ids are already in use.");
      }
    }

    const endpoint = "https://openapi.zalo.me/v3.0/oa/group/creategroupwithoa";

    const requestBody = {
      group_name: groupName.trim(),
      member_user_ids: memberUserIds,
      asset_id: finalAssetId,
      ...(groupDescription && { group_description: groupDescription.trim() }),
    };

    console.log(`📤 Creating GMF group: ${groupName}`);
    console.log(`   Asset ID: ${finalAssetId}`);
    console.log(`   Members: ${memberUserIds.length}`);

    const response = await axios.post(endpoint, requestBody, {
      headers: {
        "Content-Type": "application/json",
        access_token: token,
      },
      timeout: 10000,
    });

    if (response.data && response.data.error === 0) {
      const groupData = response.data.data;
      console.log("✅ Group created successfully:");
      console.log(`   Group ID: ${groupData.group_id}`);
      return groupData;
    } else {
      const errorMsg = response.data?.message || "Unknown error";
      throw new Error(`Failed to create group: ${errorMsg}`);
    }
  } catch (error) {
    console.error("❌ Error creating group:", error.message);
    throw error;
  }
}

/**
 * Send text message to GMF group
 * Reference: https://developers.zalo.me/docs/official-account/nhom-chat-gmf/tin-nhan/text_message
 */
export async function sendGroupMessage(groupId, message, refreshToken, fallbackToken) {
  try {
    if (!groupId) {
      throw new Error("Group ID is required");
    }

    if (!message || !message.trim()) {
      throw new Error("Message content is required");
    }

    const token = await getAccessToken(refreshToken, fallbackToken);

    const endpoint = "https://openapi.zalo.me/v3.0/oa/group/message";

    const requestBody = {
      recipient: {
        group_id: groupId,
      },
      message: {
        text: message.trim(),
      },
    };

    console.log(`📤 Sending message to group ${groupId}`);

    const response = await axios.post(endpoint, requestBody, {
      headers: {
        "Content-Type": "application/json",
        access_token: token,
      },
      timeout: 10000,
    });

    if (response.data && response.data.error === 0) {
      console.log("✅ Message sent successfully");
      return response.data;
    } else {
      const errorMsg = response.data?.message || "Unknown error";
      console.warn(`⚠️ Error response from Zalo API: ${errorMsg}`);
      return response.data;
    }
  } catch (error) {
    console.error("❌ Error sending group message:", error.message);
    throw error;
  }
}


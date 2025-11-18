import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
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

/**
 * Upload file to Zalo and get token
 * Reference: https://developers.zalo.me/docs/official-account/tin-nhan/upload_file
 * Note: Official docs say only PDF/DOC/DOCX supported, max 5MB
 * @param {string} filePath - Path to file to upload
 * @param {string} refreshToken - Refresh token
 * @param {string} fallbackToken - Fallback access token
 * @returns {Promise<string>} File token from Zalo
 */
export async function uploadFile(filePath, refreshToken, fallbackToken) {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error("File path is required and file must exist");
    }

    // Check file size (max 5MB as per Zalo docs)
    const stats = fs.statSync(filePath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    const maxSizeMB = 5;

    if (fileSizeInMB > maxSizeMB) {
      throw new Error(
        `File size (${fileSizeInMB.toFixed(2)}MB) exceeds maximum allowed size (${maxSizeMB}MB)`
      );
    }

    // Check file extension (official docs say PDF/DOC/DOCX, but we'll try CSV too)
    const fileExt = path.extname(filePath).toLowerCase();
    const supportedExts = [".pdf", ".doc", ".docx", ".csv"]; // CSV added for our use case
    if (!supportedExts.includes(fileExt)) {
      console.warn(
        `⚠️  File extension ${fileExt} may not be supported. Official docs only mention PDF/DOC/DOCX`
      );
    }

    const token = await getAccessToken(refreshToken, fallbackToken);

    const endpoint = "https://openapi.zalo.me/v2.0/oa/upload/file";

    // Create form data
    const formData = new FormData();
    // Ensure filename has correct extension (lowercase) - Zalo may be case-sensitive
    const originalFileName = path.basename(filePath);
    const fileNameWithoutExt = path.basename(filePath, fileExt);
    const fileName = `${fileNameWithoutExt}${fileExt.toLowerCase()}`;
    
    // Read file into buffer (Zalo API may require file to be fully loaded)
    const fileBuffer = fs.readFileSync(filePath);
    
    // Append file to form data
    // According to Zalo docs: curl -F "file=@/home/test.docx"
    // Try using buffer instead of stream for better compatibility
    formData.append("file", fileBuffer, {
      filename: fileName, // Use lowercase extension
      contentType: fileExt === ".csv" ? "text/csv" : undefined, // Explicitly set for CSV
    });

    console.log(`📤 Uploading file to Zalo: ${filePath}`);
    console.log(`   File size: ${fileSizeInMB.toFixed(2)}MB`);
    console.log(`   File type: ${fileExt}`);

    // Make request with proper headers
    // access_token should be a separate header, not in form-data
    const response = await axios.post(endpoint, formData, {
      headers: {
        ...formData.getHeaders(), // Sets Content-Type: multipart/form-data with boundary
        access_token: token, // Separate header as per Zalo API docs
      },
      timeout: 30000, // 30 seconds for file upload
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    if (response.data && response.data.error === 0 && response.data.data?.token) {
      console.log("✅ File uploaded successfully, token:", response.data.data.token);
      return response.data.data.token;
    } else {
      // Handle error response from Zalo
      const errorCode = response.data?.error;
      const errorMsg = response.data?.message || "Unknown error";
      
      console.error(`❌ Zalo API error ${errorCode}: ${errorMsg}`);
      console.error("   File path:", filePath);
      console.error("   File extension:", fileExt);
      console.error("   File size:", fileSizeInMB.toFixed(2), "MB");
      
      throw new Error(`Failed to upload file (Error ${errorCode}): ${errorMsg}`);
    }
  } catch (error) {
    console.error("❌ Error uploading file:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    throw error;
  }
}

/**
 * Send file message to GMF group
 * Reference: https://developers.zalo.me/docs/official-account/nhom-chat-gmf/tin-nhan/file_message
 * @param {string} groupId - Group ID
 * @param {string} fileToken - Token from uploadFile function
 * @param {string} refreshToken - Refresh token
 * @param {string} fallbackToken - Fallback access token
 * @returns {Promise<Object>} Response from Zalo API
 */
export async function sendGroupFile(groupId, fileToken, refreshToken, fallbackToken) {
  try {
    if (!groupId) {
      throw new Error("Group ID is required");
    }

    if (!fileToken) {
      throw new Error("File token is required");
    }

    const token = await getAccessToken(refreshToken, fallbackToken);

    const endpoint = "https://openapi.zalo.me/v3.0/oa/group/message";

    const requestBody = {
      recipient: {
        group_id: groupId,
      },
      message: {
        attachment: {
          type: "file",
          payload: {
            token: fileToken,
          },
        },
      },
    };

    console.log(`📤 Sending file to group ${groupId}`);

    const response = await axios.post(endpoint, requestBody, {
      headers: {
        "Content-Type": "application/json",
        access_token: token,
      },
      timeout: 10000,
    });

    if (response.data && response.data.error === 0) {
      console.log("✅ File sent successfully");
      return response.data;
    } else {
      const errorMsg = response.data?.message || "Unknown error";
      console.warn(`⚠️ Error response from Zalo API: ${errorMsg}`);
      return response.data;
    }
  } catch (error) {
    console.error("❌ Error sending group file:", error.message);
    throw error;
  }
}


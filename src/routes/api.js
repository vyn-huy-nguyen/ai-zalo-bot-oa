import express from "express";
import { createGroup, sendGroupMessage, getGMFQuota } from "../services/zalo.js";
import { processMessageAnalysis } from "../handlers/messageHandler.js";
import { processQueryRequest } from "../handlers/queryHandler.js";
import { getAllGroups, getMessagesByGroup, getGroupStats } from "../database.js";

const router = express.Router();

/**
 * @swagger
 * /api/groups/quota:
 *   get:
 *     summary: Get GMF quota (asset_id list)
 *     description: Returns available GMF packages with asset_id for creating groups
 *     tags: [Groups]
 *     responses:
 *       200:
 *         description: Quota information retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/groups/quota", async (req, res) => {
  try {
    const quota = await getGMFQuota(req.refreshToken, req.fallbackToken);
    res.json({
      success: true,
      data: quota,
      message: "Quota retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Error in get quota endpoint:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/groups/create:
 *   post:
 *     summary: Create a new GMF group
 *     description: Creates a new Group Messaging Feature (GMF) group on Zalo
 *     tags: [Groups]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - group_name
 *               - member_user_ids
 *             properties:
 *               group_name:
 *                 type: string
 *               member_user_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *               asset_id:
 *                 type: string
 *               group_description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Group created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post("/groups/create", async (req, res) => {
  try {
    const {
      group_name,
      member_user_ids = [],
      asset_id = null,
      group_description = "",
    } = req.body;

    if (!group_name || !group_name.trim()) {
      return res.status(400).json({
        success: false,
        error: "group_name is required",
      });
    }

    if (!member_user_ids || member_user_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error:
          "member_user_ids is required and cannot be empty (must have at least 1 admin of OA)",
      });
    }

    const groupData = await createGroup(
      group_name.trim(),
      member_user_ids,
      asset_id,
      group_description?.trim() || "",
      req.refreshToken,
      req.fallbackToken
    );

    res.json({
      success: true,
      data: groupData,
      message: "Group created successfully",
    });
  } catch (error) {
    console.error("❌ Error in create group endpoint:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/groups/message:
 *   post:
 *     summary: Send a text message to a GMF group
 *     description: Sends a text message to a specific GMF group
 *     tags: [Groups]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - group_id
 *               - message
 *             properties:
 *               group_id:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post("/groups/message", async (req, res) => {
  try {
    const { group_id, message } = req.body;

    if (!group_id || !message) {
      return res.status(400).json({
        success: false,
        error: "group_id and message are required",
      });
    }

    const result = await sendGroupMessage(
      group_id,
      message,
      req.refreshToken,
      req.fallbackToken
    );

    res.json({
      success: true,
      data: result,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("❌ Error in send message endpoint:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/analyze:
 *   post:
 *     summary: Analyze message using AI
 *     description: Analyzes a message using Gemini AI and converts it to structured data
 *     tags: [Groups]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *               - group_id
 *             properties:
 *               message:
 *                 type: string
 *               group_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message analyzed successfully
 *       500:
 *         description: Server error
 */
router.post("/analyze", async (req, res) => {
  try {
    const result = await processMessageAnalysis(
      req.body,
      req.refreshToken,
      req.fallbackToken
    );
    res.json(result);
  } catch (error) {
    console.error("❌ Error in analyze endpoint:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/query:
 *   post:
 *     summary: Query and analyze stored data
 *     description: Queries stored data and uses AI to answer questions
 *     tags: [Groups]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *               - group_id
 *             properties:
 *               question:
 *                 type: string
 *               group_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Query processed successfully
 *       500:
 *         description: Server error
 */
router.post("/query", async (req, res) => {
  try {
    const result = await processQueryRequest(req.body);
    res.json(result);
  } catch (error) {
    console.error("❌ Error in query endpoint:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/groups:
 *   get:
 *     summary: Get all groups
 *     description: Returns all groups stored in the database
 *     tags: [Groups]
 *     responses:
 *       200:
 *         description: List of groups retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/groups", (req, res) => {
  try {
    const groups = getAllGroups();
    res.json({
      success: true,
      groups: groups,
      count: groups.length,
    });
  } catch (error) {
    console.error("❌ Error getting groups:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/messages/{group_id}:
 *   get:
 *     summary: Get messages by group ID
 *     description: Returns messages for a specific group with pagination support
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: group_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of messages retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/messages/:group_id", (req, res) => {
  try {
    const { group_id } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const messages = getMessagesByGroup(group_id, limit, offset);
    res.json({
      success: true,
      group_id: group_id,
      messages: messages,
      count: messages.length,
      limit: limit,
      offset: offset,
    });
  } catch (error) {
    console.error("❌ Error getting messages:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/stats/{group_id}:
 *   get:
 *     summary: Get group statistics
 *     description: Returns statistics for a specific group
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: group_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group statistics retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/stats/:group_id", (req, res) => {
  try {
    const { group_id } = req.params;
    const stats = getGroupStats(group_id);
    res.json({
      success: true,
      group_id: group_id,
      stats: stats,
    });
  } catch (error) {
    console.error("❌ Error getting stats:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/info:
 *   get:
 *     summary: Get API information
 *     description: Returns API version, available endpoints, and configuration
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API information
 */
router.get("/info", (req, res) => {
  res.json({
    name: "Zalo OA Bot Webhook Server",
    version: "1.0.0",
    endpoints: {
      webhook: "GET/POST /webhook",
      health: "GET /health",
      info: "GET /api/info",
      createGroup: "POST /api/groups/create",
      sendMessage: "POST /api/groups/message",
      analyze: "POST /api/analyze",
      query: "POST /api/query",
      groups: "GET /api/groups",
      messages: "GET /api/messages/:group_id",
      stats: "GET /api/stats/:group_id",
      swagger: "GET /api-docs",
    },
    oa_id: process.env.ZALO_OA_ID,
  });
});

export default router;


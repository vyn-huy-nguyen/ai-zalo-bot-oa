import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path
const dbDir = path.join(__dirname, "../data");
const dbPath = path.join(dbDir, "zalo_bot.db");

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database
let db = null;

/**
 * Initialize database connection and create tables
 */
export function initDatabase() {
  try {
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL"); // Enable WAL mode for better concurrency

    // Create tables
    createTables();

    console.log("✅ Database initialized:", dbPath);
    return db;
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    throw error;
  }
}

/**
 * Create database tables
 */
function createTables() {
  // Groups table - store Zalo group information
  db.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id TEXT UNIQUE NOT NULL,
      group_name TEXT,
      oa_id TEXT,
      app_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Messages table - store parsed messages
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id TEXT NOT NULL,
      author_id TEXT,
      author_name TEXT,
      message_text TEXT NOT NULL,
      original_message TEXT,
      parsed_data TEXT NOT NULL,
      message_id TEXT,
      user_id_by_app TEXT,
      app_id TEXT,
      oa_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups(group_id)
    )
  `);

  // Items table - store items from messages (if applicable)
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL,
      group_id TEXT NOT NULL,
      item_data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
      FOREIGN KEY (group_id) REFERENCES groups(group_id)
    )
  `);

  // Ensure legacy databases have group_id in items before creating indexes
  ensureItemsGroupIdColumn();

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_messages_group_id ON messages(group_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
    CREATE INDEX IF NOT EXISTS idx_items_message_id ON items(message_id);
    CREATE INDEX IF NOT EXISTS idx_items_group_id ON items(group_id);
    CREATE INDEX IF NOT EXISTS idx_groups_group_id ON groups(group_id);
  `);

  console.log("✅ Database tables created/verified");
}

/**
 * Ensure items table has group_id column and item_data column (migration for legacy DBs)
 */
function ensureItemsGroupIdColumn() {
  try {
    const columns = db.prepare(`PRAGMA table_info(items)`).all();
    const columnNames = columns.map((col) => col.name);
    
    // Add group_id if missing
    if (!columnNames.includes("group_id")) {
      console.log("🔄 Migrating items table to add group_id column...");
      db.exec(`ALTER TABLE items ADD COLUMN group_id TEXT`);
      db.exec(`
        UPDATE items 
        SET group_id = (
          SELECT m.group_id 
          FROM messages m 
          WHERE m.id = items.message_id
        )
      `);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_items_group_id ON items(group_id)`);
      console.log("✅ Migration completed: group_id added to items table");
    }
    
    // Migrate to item_data column if it doesn't exist
    if (!columnNames.includes("item_data")) {
      console.log("🔄 Migrating items table to add item_data column...");
      db.exec(`ALTER TABLE items ADD COLUMN item_data TEXT`);
      
      // Migrate existing data: combine item_name, quantity, unit, additional_data into item_data JSON
      const oldItems = db.prepare(`SELECT id, item_name, quantity, unit, additional_data FROM items WHERE item_data IS NULL`).all();
      
      oldItems.forEach((oldItem) => {
        const itemData = {};
        if (oldItem.item_name) itemData.name = oldItem.item_name;
        if (oldItem.quantity !== null) itemData.quantity = oldItem.quantity;
        if (oldItem.unit) itemData.unit = oldItem.unit;
        
        // Merge additional_data if it exists
        if (oldItem.additional_data) {
          try {
            const additional = JSON.parse(oldItem.additional_data);
            Object.assign(itemData, additional);
          } catch (e) {
            // If additional_data is not valid JSON, ignore it
          }
        }
        
        db.prepare(`UPDATE items SET item_data = ? WHERE id = ?`).run(
          JSON.stringify(itemData),
          oldItem.id
        );
      });
      
      console.log("✅ Migration completed: item_data added to items table");
    }
  } catch (error) {
    console.error("❌ Error ensuring items table columns:", error);
    throw error;
  }
}

/**
 * Get or create group
 */
export function getOrCreateGroup(groupId, groupName = null, oaId = null, appId = null) {
  try {
    // Try to get existing group
    let group = db
      .prepare("SELECT * FROM groups WHERE group_id = ?")
      .get(groupId);

    if (group) {
      // Update if new information provided
      if (groupName || oaId || appId) {
        db.prepare(
          `UPDATE groups 
           SET group_name = COALESCE(?, group_name),
               oa_id = COALESCE(?, oa_id),
               app_id = COALESCE(?, app_id),
               updated_at = CURRENT_TIMESTAMP
           WHERE group_id = ?`
        ).run(groupName, oaId, appId, groupId);
        group = db.prepare("SELECT * FROM groups WHERE group_id = ?").get(groupId);
      }
      return group;
    }

    // Create new group
    const result = db
      .prepare(
        `INSERT INTO groups (group_id, group_name, oa_id, app_id) 
         VALUES (?, ?, ?, ?)`
      )
      .run(groupId, groupName, oaId, appId);

    return db.prepare("SELECT * FROM groups WHERE id = ?").get(result.lastInsertRowid);
  } catch (error) {
    console.error("❌ Error getting/creating group:", error);
    throw error;
  }
}

/**
 * Save message to database
 */
export function saveMessage(messageData) {
  try {
    const {
      group_id,
      author_id,
      author_name,
      message,
      original_message,
      parsed_data,
      message_id,
      user_id_by_app,
      app_id,
      oa_id,
    } = messageData;

    // Ensure group exists
    getOrCreateGroup(group_id, null, oa_id, app_id);

    // Insert message
    const messageResult = db
      .prepare(
        `INSERT INTO messages (
          group_id, author_id, author_name, message_text, 
          original_message, parsed_data, message_id, 
          user_id_by_app, app_id, oa_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        group_id,
        author_id,
        author_name,
        message,
        original_message,
        JSON.stringify(parsed_data),
        message_id,
        user_id_by_app,
        app_id,
        oa_id
      );

    const savedMessageId = messageResult.lastInsertRowid;

    // If parsed_data has items array, save them separately
    // Store entire item object as JSON in item_data column (flexible schema)
    if (parsed_data.items && Array.isArray(parsed_data.items) && parsed_data.items.length > 0) {
      const insertItem = db.prepare(
        `INSERT INTO items (message_id, group_id, item_data)
         VALUES (?, ?, ?)`
      );

      parsed_data.items.forEach((item) => {
        // Store entire item object as JSON - no mapping needed
        // This allows for dynamic fields from Gemini AI
        insertItem.run(
          savedMessageId,
          group_id,
          JSON.stringify(item)
        );
      });
    }

    return {
      id: savedMessageId,
      group_id,
      message_id,
    };
  } catch (error) {
    console.error("❌ Error saving message:", error);
    throw error;
  }
}

/**
 * Get messages by group ID
 */
export function getMessagesByGroup(groupId, limit = 100, offset = 0) {
  try {
    const messages = db
      .prepare(
        `SELECT m.*, 
                json_extract(m.parsed_data, '$') as parsed_data_json
         FROM messages m
         WHERE m.group_id = ?
         ORDER BY m.created_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(groupId, limit, offset);

    // Parse JSON data
    return messages.map((msg) => ({
      ...msg,
      parsed_data: JSON.parse(msg.parsed_data_json),
    }));
  } catch (error) {
    console.error("❌ Error getting messages:", error);
    throw error;
  }
}

/**
 * Get items by message ID
 * Returns items with parsed item_data JSON
 */
export function getItemsByMessage(messageId) {
  try {
    const items = db
      .prepare(
        `SELECT id, message_id, group_id, item_data, created_at 
         FROM items 
         WHERE message_id = ?
         ORDER BY id`
      )
      .all(messageId);
    
    // Parse item_data JSON for each item
    return items.map((item) => {
      try {
        return {
          ...item,
          item_data: JSON.parse(item.item_data)
        };
      } catch (e) {
        return {
          ...item,
          item_data: {}
        };
      }
    });
  } catch (error) {
    console.error("❌ Error getting items:", error);
    throw error;
  }
}

/**
 * Get all groups
 */
export function getAllGroups() {
  try {
    return db.prepare("SELECT * FROM groups ORDER BY created_at DESC").all();
  } catch (error) {
    console.error("❌ Error getting groups:", error);
    throw error;
  }
}

/**
 * Get group statistics
 */
export function getGroupStats(groupId) {
  try {
    const stats = db
      .prepare(
        `SELECT 
          COUNT(*) as total_messages,
          MIN(created_at) as first_message,
          MAX(created_at) as last_message,
          COUNT(DISTINCT author_id) as unique_authors
         FROM messages
         WHERE group_id = ?`
      )
      .get(groupId);

    // Get item stats from JSON data
    const items = db
      .prepare(
        `SELECT item_data FROM items WHERE group_id = ?`
      )
      .all(groupId);
    
    let totalItems = items.length;
    let totalQuantity = 0;
    
    items.forEach((row) => {
      try {
        const itemData = JSON.parse(row.item_data);
        // Try to extract quantity from various possible keys (Vietnamese or English)
        const quantity = itemData["Số lượng"] !== undefined 
          ? itemData["Số lượng"] 
          : (itemData.quantity !== undefined ? itemData.quantity : 0);
        if (typeof quantity === 'number') {
          totalQuantity += quantity;
        }
      } catch (e) {
        // Skip invalid JSON
      }
    });
    
    const itemStats = {
      total_items: totalItems,
      total_quantity: totalQuantity
    };

    return {
      ...stats,
      ...itemStats,
    };
  } catch (error) {
    console.error("❌ Error getting group stats:", error);
    throw error;
  }
}

/**
 * Query data from database based on search criteria
 * Returns messages and items that match the query
 */
export function queryData(groupId, searchCriteria = {}) {
  try {
    let query = `
      SELECT 
        m.id,
        m.group_id,
        m.author_id,
        m.author_name,
        m.message_text,
        m.parsed_data,
        m.created_at,
        json_extract(m.parsed_data, '$') as parsed_data_json
      FROM messages m
      WHERE m.group_id = ?
    `;
    
    const params = [groupId];
    
    // Add date filter if provided
    if (searchCriteria.startDate) {
      query += ` AND m.created_at >= ?`;
      params.push(searchCriteria.startDate);
    }
    
    if (searchCriteria.endDate) {
      query += ` AND m.created_at <= ?`;
      params.push(searchCriteria.endDate);
    }
    
    // Add keyword search in message text
    if (searchCriteria.keyword) {
      query += ` AND (m.message_text LIKE ? OR m.parsed_data LIKE ?)`;
      const keywordPattern = `%${searchCriteria.keyword}%`;
      params.push(keywordPattern, keywordPattern);
    }
    
    query += ` ORDER BY m.created_at DESC LIMIT ?`;
    params.push(searchCriteria.limit || 1000);
    
    const messages = db.prepare(query).all(...params);
    
    // Parse JSON data
    const parsedMessages = messages.map((msg) => ({
      ...msg,
      parsed_data: JSON.parse(msg.parsed_data_json),
    }));
    
    // Get items for these messages
    const messageIds = parsedMessages.map((m) => m.id);
    let items = [];
    
    if (messageIds.length > 0) {
      const placeholders = messageIds.map(() => "?").join(",");
      const rawItems = db
        .prepare(
          `SELECT id, message_id, group_id, item_data, created_at 
           FROM items 
           WHERE message_id IN (${placeholders})
           ORDER BY message_id, id`
        )
        .all(...messageIds);
      
      // Parse item_data JSON for each item
      items = rawItems.map((item) => {
        try {
          return {
            ...item,
            item_data: JSON.parse(item.item_data)
          };
        } catch (e) {
          return {
            ...item,
            item_data: {}
          };
        }
      });
    }
    
    return {
      messages: parsedMessages,
      items: items,
      count: parsedMessages.length,
    };
  } catch (error) {
    console.error("❌ Error querying data:", error);
    throw error;
  }
}

/**
 * Get all data for a group (for AI analysis)
 */
export function getAllGroupData(groupId, limit = 1000) {
  try {
    return queryData(groupId, { limit });
  } catch (error) {
    console.error("❌ Error getting all group data:", error);
    throw error;
  }
}

/**
 * Close database connection
 */
export function closeDatabase() {
  if (db) {
    db.close();
    console.log("✅ Database connection closed");
  }
}

// Initialize on import
if (!db) {
  initDatabase();
}

export { db };


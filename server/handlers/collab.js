/**
 * Socket.IO Handlers for Real-Time Collaboration
 * Manages collaborative editing sessions with OT
 */

import { logger } from "../handlers/logger.js";
import { ok, err } from "../handlers/response.js";
import { insert, deleteOp, retain } from "../ot/operation.js";
import { transformAgainst, apply } from "../ot/transform.js";
import { documentManager } from "../ot/document.js";
import { presenceManager } from "./presence.js";

const COLLAB_RATE_LIMIT = 100;
const OPERATION_BATCH_SIZE = 1000;

function registerCollabHandlers(socket, io) {
  const clientId = socket.id;
  let currentDocId = null;
  let currentUserId = null;
  let pendingOperations = [];
  let lastOpTime = 0;

  socket.on("collab:join", async (data, ack) => {
    console.log("[DEBUG] collab:join", { clientId, data });

    try {
      const { docId, username } = data;

      if (!docId || !username) {
        if (typeof ack === "function") {
          ack({
            success: false,
            error: { message: "Missing docId or username" },
          });
        }
        return;
      }

      currentDocId = docId;
      currentUserId = clientId;

      const document = documentManager.getDocument(docId);

      const user = presenceManager.addUser(currentUserId, docId, username, clientId);

      socket.join(`doc:${docId}`);

      const users = presenceManager.getDocumentUsers(docId);

      ok(socket, "collab:joined", {
        docId,
        revision: document.revision,
        content: document.content,
        users,
        currentUser: user,
      }, data.requestId);

      io.to(`doc:${docId}`).emit("collab:user-joined", {
        type: "broadcast",
        data: {
          user,
          docId,
        },
        timestamp: Date.now(),
      });

      logger.info(`User ${username} joined document ${docId}`);
    } catch (error) {
      console.error("[DEBUG] Error in collab:join:", error.message);
      err(socket, "collab:joined", error.message, data.requestId);
    }
  });

  socket.on("collab:leave", async (data, ack) => {
    console.log("[DEBUG] collab:leave", { clientId, data });

    try {
      const { docId } = data;

      if (docId && currentDocId === docId && currentUserId) {
        const user = presenceManager.getUser(currentUserId);

        presenceManager.removeUser(currentUserId, docId);

        socket.leave(`doc:${docId}`);

        io.to(`doc:${docId}`).emit("collab:user-left", {
          type: "broadcast",
          data: {
            userId: currentUserId,
            docId,
            username: user?.username || "Unknown",
          },
          timestamp: Date.now(),
        });

        if (typeof ack === "function") {
          ack({
            success: true,
          });
        }

        logger.info(`User ${currentUserId} left document ${docId}`);

        currentDocId = null;
        currentUserId = null;
        pendingOperations = [];
      }
    } catch (error) {
      console.error("[DEBUG] Error in collab:leave:", error.message);
      if (typeof ack === "function") {
        ack({
          success: false,
          error: { message: error.message },
        });
      }
    }
  });

  socket.on("collab:operation", async (data, ack) => {
    console.log("[DEBUG] collab:operation", { clientId, data });

    try {
      const { docId, operation } = data;

      if (!docId || !operation) {
        if (typeof ack === "function") {
          ack({
            success: false,
            error: { message: "Missing docId or operation" },
          });
        }
        return;
      }

      const now = Date.now();
      if (now - lastOpTime < COLLAB_RATE_LIMIT) {
        if (typeof ack === "function") {
          ack({
            success: false,
            error: { message: "Rate limit exceeded" },
          });
        }
        return;
      }
      lastOpTime = now;

      const document = documentManager.getDocument(docId);

      if (!document) {
        if (typeof ack === "function") {
          ack({
            success: false,
            error: { message: "Document not found" },
          });
        }
        return;
      }

      operation.userId = currentUserId;
      operation.timestamp = now;

      const result = document.applyOperation(operation);

      if (!result.success) {
        if (typeof ack === "function") {
          ack({
            success: false,
            error: { message: result.error },
          });
        }
        return;
      }

      const pending = document.getPending(currentUserId);

      if (pending) {
        const transformed = transformAgainst(operation, [pending], document.content);
        pendingOperations.push(transformed);
      }

      document.addPending(currentUserId, operation);

      io.to(`doc:${docId}`).emit("collab:operation", {
        type: "broadcast",
        data: {
          operation: result.operation,
          docId,
          revision: document.revision,
        },
        timestamp: Date.now(),
      });

      if (typeof ack === "function") {
        ack({
          success: true,
          data: {
            revision: document.revision,
            appliedAt: result.appliedAt,
          },
        });
      }
    } catch (error) {
      console.error("[DEBUG] Error in collab:operation:", error.message);
      if (typeof ack === "function") {
        ack({
          success: false,
          error: { message: error.message },
        });
      }
    }
  });

  socket.on("collab:cursor", async (data, ack) => {
    console.log("[DEBUG] collab:cursor", { clientId, data });

    try {
      const { docId, cursor } = data;

      if (!docId || !cursor) {
        return;
      }

      presenceManager.updateCursor(currentUserId, docId, cursor);

      socket.to(`doc:${docId}`).emit("collab:cursor-update", {
        type: "broadcast",
        data: {
          userId: currentUserId,
          docId,
          cursor,
        },
        timestamp: Date.now(),
      });

      if (typeof ack === "function") {
        ack({
          success: true,
        });
      }
    } catch (error) {
      console.error("[DEBUG] Error in collab:cursor:", error.message);
    }
  });

  socket.on("collab:selection", async (data, ack) => {
    console.log("[DEBUG] collab:selection", { clientId, data });

    try {
      const { docId, selection } = data;

      if (!docId || !selection) {
        return;
      }

      presenceManager.updateSelection(currentUserId, docId, selection);

      socket.to(`doc:${docId}`).emit("collab:selection-update", {
        type: "broadcast",
        data: {
          userId: currentUserId,
          docId,
          selection,
        },
        timestamp: Date.now(),
      });

      if (typeof ack === "function") {
        ack({
          success: true,
        });
      }
    } catch (error) {
      console.error("[DEBUG] Error in collab:selection:", error.message);
    }
  });

  socket.on("collab:sync", async (data, ack) => {
    console.log("[DEBUG] collab:sync", { clientId, data });

    try {
      const { docId, fromRevision } = data;

      if (!docId) {
        if (typeof ack === "function") {
          ack({
            success: false,
            error: { message: "Missing docId" },
          });
        }
        return;
      }

      const document = documentManager.getDocument(docId);

      const history = document.getHistory();

      let operations = [];

      if (fromRevision !== undefined) {
        operations = history.filter((op) => op.revision > fromRevision);
      } else {
        operations = history;
      }

      if (typeof ack === "function") {
        ack({
          success: true,
          data: {
            revision: document.revision,
            content: document.content,
            operations,
          },
        });
      }
    } catch (error) {
      console.error("[DEBUG] Error in collab:sync:", error.message);
      if (typeof ack === "function") {
        ack({
          success: false,
          error: { message: error.message },
        });
      }
    }
  });

  socket.on("collab:undo", async (data, ack) => {
    console.log("[DEBUG] collab:undo", { clientId, data });

    try {
      const { docId } = data;

      if (!docId) {
        if (typeof ack === "function") {
          ack({
            success: false,
            error: { message: "Missing docId" },
          });
        }
        return;
      }

      const document = documentManager.getDocument(docId);

      const result = document.undo(currentUserId);

      if (result.success) {
        io.to(`doc:${docId}`).emit("collab:operation", {
          type: "broadcast",
          data: {
            operation: result.undoOperation,
            docId,
            revision: document.revision,
          },
          timestamp: Date.now(),
        });
      }

      if (typeof ack === "function") {
        ack(result);
      }
    } catch (error) {
      console.error("[DEBUG] Error in collab:undo:", error.message);
      if (typeof ack === "function") {
        ack({
          success: false,
          error: { message: error.message },
        });
      }
    }
  });

  socket.on("collab:redo", async (data, ack) => {
    console.log("[DEBUG] collab:redo", { clientId, data });

    try {
      const { docId } = data;

      if (!docId) {
        if (typeof ack === "function") {
          ack({
            success: false,
            error: { message: "Missing docId" },
          });
        }
        return;
      }

      const document = documentManager.getDocument(docId);

      const result = document.redo(currentUserId);

      if (result.success) {
        io.to(`doc:${docId}`).emit("collab:operation", {
          type: "broadcast",
          data: {
            operation: result.redoOperation,
            docId,
            revision: document.revision,
          },
          timestamp: Date.now(),
        });
      }

      if (typeof ack === "function") {
        ack(result);
      }
    } catch (error) {
      console.error("[DEBUG] Error in collab:redo:", error.message);
      if (typeof ack === "function") {
        ack({
          success: false,
          error: { message: error.message },
        });
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("[DEBUG] Client disconnected, cleaning up collab state", { clientId });

    if (currentDocId && currentUserId) {
      const user = presenceManager.getUser(currentUserId);

      presenceManager.removeUser(currentUserId, currentDocId);

      io.to(`doc:${currentDocId}`).emit("collab:user-left", {
        type: "broadcast",
        data: {
          userId: currentUserId,
          docId: currentDocId,
          username: user?.username || "Unknown",
        },
        timestamp: Date.now(),
      });

      socket.leave(`doc:${currentDocId}`);

      logger.info(`User ${currentUserId} disconnected from document ${currentDocId}`);
    }
  });
}

export { registerCollabHandlers };

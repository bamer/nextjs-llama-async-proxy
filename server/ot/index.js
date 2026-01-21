/**
 * Operational Transform Module
 * Main exports for OT functionality
 */

export { insert, deleteOp, retain, isValid, invert, compose } from "./operation.js";
export { transform, transformAgainst, apply } from "./transform.js";
export { Document, DocumentManager, documentManager } from "./document.js";

/**
 * Create an insert operation at a specific position
 * @param {number} position - Position to insert at
 * @param {string} text - Text to insert
 * @param {string} userId - User ID making the operation
 * @param {number} revision - Document revision
 * @returns {Object} Insert operation object
 */

/**
 * Create a delete operation to remove text
 * @param {number} position - Position to delete from
 * @param {number} length - Length of text to delete
 * @param {string} userId - User ID making the operation
 * @param {number} revision - Document revision
 * @returns {Object} Delete operation object
 */

/**
 * Create a retain operation (no-op placeholder)
 * @param {number} position - Position to retain
 * @param {string} userId - User ID
 * @param {number} revision - Document revision
 * @returns {Object} Retain operation object
 */

/**
 * Validate an operation against current content
 * @param {Object} op - Operation to validate
 * @param {string} content - Current document content
 * @returns {boolean} True if operation is valid
 */

/**
 * Create inverse operation for undo functionality
 * @param {Object} op - Operation to invert
 * @param {string} content - Content before operation
 * @returns {Object} Inverted operation
 */

/**
 * Compose multiple operations into a single operation
 * @param {Array<Object>} ops - Array of operations to compose
 * @returns {Object|null} Composed operation or null if empty
 */

/**
 * Transform two concurrent operations against each other
 * @param {Object} opA - First operation
 * @param {Object} opB - Second operation
 * @param {string} content - Document content before operations
 * @returns {Array} Tuple of [transformedA, transformedB]
 */

/**
 * Transform operation against multiple operations
 * @param {Object} op - Operation to transform
 * @param {Array<Object>} ops - Operations to transform against
 * @param {string} content - Document content
 * @returns {Object} Transformed operation
 */

/**
 * Apply operation to document content
 * @param {Object} op - Operation to apply
 * @param {string} content - Content to apply to
 * @returns {string} New content after operation
 */

/**
 * Document class for managing collaborative editing state
 * @class
 * @param {string} docId - Document identifier
 * @param {string} initialContent - Initial document content
 * @returns {Document} Document instance
 */

/**
 * DocumentManager class for managing multiple documents
 * @class
 * @returns {DocumentManager} DocumentManager instance
 */

/**
 * Global document manager singleton instance
 * @type {DocumentManager}
 */

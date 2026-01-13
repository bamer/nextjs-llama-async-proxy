/**
 * Operational Transform - Transform operations to handle concurrent edits
 * Implements OT algorithm for conflict-free collaborative editing
 */

/**
 * Transform two concurrent operations against each other
 * @param {Object} opA - First operation
 * @param {Object} opB - Second operation
 * @param {string} content - Document content before operations
 * @returns {Array} [transformedA, transformedB]
 */
export function transform(opA, opB, content) {
  if (opA.type === "retain" && opB.type === "retain") {
    return [opA, opB];
  }

  if (opA.type === "insert" && opB.type === "retain") {
    return [opA, opB];
  }

  if (opA.type === "retain" && opB.type === "insert") {
    return [opA, opB];
  }

  if (opA.type === "delete" && opB.type === "retain") {
    return [opA, opB];
  }

  if (opA.type === "retain" && opB.type === "delete") {
    return [opA, opB];
  }

  if (opA.type === "insert" && opB.type === "insert") {
    return transformInsertInsert(opA, opB);
  }

  if (opA.type === "insert" && opB.type === "delete") {
    return transformInsertDelete(opA, opB, content);
  }

  if (opA.type === "delete" && opB.type === "insert") {
    const [transformedB, transformedA] = transformInsertDelete(opB, opA, content);
    return [transformedA, transformedB];
  }

  if (opA.type === "delete" && opB.type === "delete") {
    return transformDeleteDelete(opA, opB);
  }

  throw new Error(`Cannot transform operations: ${opA.type} vs ${opB.type}`);
}

/**
 * Transform two insert operations
 * Uses tie-breaking by userId (lexicographic order)
 */
function transformInsertInsert(opA, opB) {
  if (opA.position < opB.position) {
    return [opA, { ...opB, position: opB.position + opA.text.length }];
  }

  if (opA.position > opB.position) {
    return [{ ...opA, position: opA.position + opB.text.length }, opB];
  }

  if (opA.position === opB.position) {
    if (opA.userId < opB.userId) {
      return [opA, { ...opB, position: opB.position + opA.text.length }];
    } else {
      return [{ ...opA, position: opA.position + opB.text.length }, opB];
    }
  }
}

/**
 * Transform insert vs delete operation
 */
function transformInsertDelete(insertOp, deleteOp, content) {
  const insPos = insertOp.position;
  const delPos = deleteOp.position;
  const delEnd = delPos + deleteOp.length;

  if (insPos < delPos) {
    return [
      insertOp,
      deleteOp,
    ];
  }

  if (insPos >= delEnd) {
    return [
      { ...insertOp, position: insPos - deleteOp.length },
      deleteOp,
    ];
  }

  if (insPos >= delPos && insPos < delEnd) {
    return [
      { ...insertOp, position: delPos },
      { ...deleteOp, length: deleteOp.length - (insPos - delPos) },
    ];
  }
}

/**
 * Transform two delete operations
 */
function transformDeleteDelete(opA, opB) {
  const aStart = opA.position;
  const aEnd = aStart + opA.length;
  const bStart = opB.position;
  const bEnd = bStart + opB.length;

  if (aEnd <= bStart) {
    return [opA, { ...opB, position: bStart - opA.length }];
  }

  if (bEnd <= aStart) {
    return [{ ...opA, position: aStart - opB.length }, opB];
  }

  if (aStart <= bStart && aEnd >= bEnd) {
    return [opA, { ...opB, position: aStart, length: 0 }];
  }

  if (bStart <= aStart && bEnd >= aEnd) {
    return [{ ...opA, position: bStart, length: 0 }, opB];
  }

  if (aStart < bStart && aEnd < bEnd) {
    const overlap = aEnd - bStart;
    return [
      opA,
      { ...opB, position: bStart - opA.length, length: bEnd - aEnd },
    ];
  }

  if (bStart < aStart && bEnd < aEnd) {
    const overlap = bEnd - aStart;
    return [
      { ...opA, position: bStart, length: aEnd - bEnd },
      opB,
    ];
  }
}

/**
 * Transform operation against multiple operations
 * @param {Object} op - Operation to transform
 * @param {Array<Object>} ops - Operations to transform against
 * @param {string} content - Document content
 * @returns {Object} Transformed operation
 */
export function transformAgainst(op, ops, content) {
  let result = op;
  for (const otherOp of ops) {
    [result] = transform(result, otherOp, content);
  }
  return result;
}

/**
 * Apply operation to content
 * @param {Object} op - Operation to apply
 * @param {string} content - Content to apply to
 * @returns {string} New content
 */
export function apply(op, content) {
  if (op.type === "insert") {
    return content.slice(0, op.position) + op.text + content.slice(op.position);
  }

  if (op.type === "delete") {
    return content.slice(0, op.position) + content.slice(op.position + op.length);
  }

  if (op.type === "retain") {
    return content;
  }

  throw new Error(`Cannot apply operation of type: ${op.type}`);
}

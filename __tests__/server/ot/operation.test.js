/**
 * Unit tests for OT operations
 */

import { insert, deleteOp, retain, isValid, invert, compose } from "../../../server/ot/operation.js";

describe("OT Operations", () => {
  describe("insert", () => {
    test("creates valid insert operation", () => {
      const op = insert(5, "hello", "user1", 1);
      expect(op.type).toBe("insert");
      expect(op.position).toBe(5);
      expect(op.text).toBe("hello");
      expect(op.userId).toBe("user1");
      expect(op.revision).toBe(1);
      expect(op.timestamp).toBeGreaterThan(0);
    });

    test("creates insert with empty text", () => {
      const op = insert(0, "", "user1", 1);
      expect(op.text).toBe("");
    });
  });

  describe("deleteOp", () => {
    test("creates valid delete operation", () => {
      const op = deleteOp(5, 3, "user1", 1);
      expect(op.type).toBe("delete");
      expect(op.position).toBe(5);
      expect(op.length).toBe(3);
      expect(op.userId).toBe("user1");
      expect(op.revision).toBe(1);
    });

    test("creates delete with zero length", () => {
      const op = deleteOp(0, 0, "user1", 1);
      expect(op.length).toBe(0);
    });
  });

  describe("retain", () => {
    test("creates valid retain operation", () => {
      const op = retain(5, "user1", 1);
      expect(op.type).toBe("retain");
      expect(op.position).toBe(5);
      expect(op.userId).toBe("user1");
      expect(op.revision).toBe(1);
    });
  });

  describe("isValid", () => {
    const content = "Hello, World!";

    test("valid insert operation", () => {
      const op = insert(5, "X", "user1", 1);
      expect(isValid(op, content)).toBe(true);
    });

    test("valid delete operation", () => {
      const op = deleteOp(5, 3, "user1", 1);
      expect(isValid(op, content)).toBe(true);
    });

    test("valid retain operation", () => {
      const op = retain(5, "user1", 1);
      expect(isValid(op, content)).toBe(true);
    });

    test("invalid - position negative", () => {
      const op = insert(-1, "X", "user1", 1);
      expect(isValid(op, content)).toBe(false);
    });

    test("invalid - position beyond content", () => {
      const op = insert(100, "X", "user1", 1);
      expect(isValid(op, content)).toBe(false);
    });

    test("invalid - insert empty text", () => {
      const op = insert(5, "", "user1", 1);
      expect(isValid(op, content)).toBe(false);
    });

    test("invalid - delete zero length", () => {
      const op = deleteOp(5, 0, "user1", 1);
      expect(isValid(op, content)).toBe(false);
    });

    test("invalid - delete beyond content", () => {
      const op = deleteOp(10, 5, "user1", 1);
      expect(isValid(op, content)).toBe(false);
    });

    test("invalid - missing operation", () => {
      expect(isValid(null, content)).toBe(false);
    });

    test("invalid - wrong type", () => {
      expect(isValid("string", content)).toBe(false);
    });

    test("invalid - unknown type", () => {
      const op = { type: "unknown", position: 5 };
      expect(isValid(op, content)).toBe(false);
    });
  });

  describe("invert", () => {
    const content = "Hello, World!";

    test("invert insert to delete", () => {
      const insertOp = insert(5, "XXX", "user1", 1);
      const inverted = invert(insertOp, content);

      expect(inverted.type).toBe("delete");
      expect(inverted.position).toBe(5);
      expect(inverted.length).toBe(3);
    });

    test("invert delete to insert", () => {
      const delOperation = deleteOp(5, 3, "user1", 1);
      const inverted = invert(delOperation, content);

      expect(inverted.type).toBe("insert");
      expect(inverted.position).toBe(5);
      expect(inverted.text).toBe(", W");
    });

    test("retain stays retain", () => {
      const retainOp = retain(5, "user1", 1);
      const inverted = invert(retainOp, content);

      expect(inverted.type).toBe("retain");
      expect(inverted.position).toBe(5);
    });

    test("throw on unknown type", () => {
      const op = { type: "unknown", position: 5 };
      expect(() => invert(op, content)).toThrow();
    });
  });

  describe("compose", () => {
    test("compose adjacent inserts", () => {
      const op1 = insert(5, "He", "user1", 1);
      const op2 = insert(7, "llo", "user1", 2);
      const composed = compose([op1, op2]);

      expect(composed).not.toBeNull();
      expect(composed.text).toBe("Hello");
      expect(composed.position).toBe(5);
    });

    test("compose adjacent deletes", () => {
      const op1 = deleteOp(5, 2, "user1", 1);
      const op2 = deleteOp(7, 2, "user1", 2);
      const composed = compose([op1, op2]);

      expect(composed).not.toBeNull();
      expect(composed.length).toBe(4);
      expect(composed.position).toBe(5);
    });

    test("compose overlapping deletes", () => {
      const op1 = deleteOp(5, 3, "user1", 1);
      const op2 = deleteOp(6, 2, "user1", 2);
      const composed = compose([op1, op2]);

      expect(composed).not.toBeNull();
      expect(composed.length).toBeGreaterThanOrEqual(3);
    });

    test("non-adjacent inserts return null", () => {
      const op1 = insert(5, "He", "user1", 1);
      const op2 = insert(10, "llo", "user1", 2);
      const composed = compose([op1, op2]);

      expect(composed).toBeNull();
    });

    test("compose different types returns null", () => {
      const op1 = insert(5, "X", "user1", 1);
      const op2 = deleteOp(5, 2, "user1", 2);
      const composed = compose([op1, op2]);

      expect(composed).toBeNull();
    });

    test("empty array returns null", () => {
      expect(compose([])).toBeNull();
    });

    test("single operation returns same", () => {
      const op = insert(5, "X", "user1", 1);
      const composed = compose([op]);

      expect(composed).toBe(op);
    });

    test("compose multiple operations", () => {
      const ops = [
        insert(5, "A", "user1", 1),
        insert(6, "B", "user1", 2),
        insert(7, "C", "user1", 3),
      ];
      const composed = compose(ops);

      expect(composed).not.toBeNull();
      expect(composed.text).toBe("ABC");
    });
  });
});

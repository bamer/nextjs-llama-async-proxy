/**
 * Unit tests for OT transformations
 */

import { insert, deleteOp, retain } from "../../../server/ot/operation.js";
import { transform, transformAgainst, apply } from "../../../server/ot/transform.js";

describe("OT Transform", () => {
  const content = "Hello, World!";

  describe("retain operations", () => {
    test("retain + retain unchanged", () => {
      const opA = retain(5, "user1", 1);
      const opB = retain(10, "user2", 1);
      const [tA, tB] = transform(opA, opB, content);

      expect(tA).toEqual(opA);
      expect(tB).toEqual(opB);
    });

    test("retain + insert unchanged", () => {
      const opA = retain(5, "user1", 1);
      const opB = insert(10, "X", "user2", 1);
      const [tA, tB] = transform(opA, opB, content);

      expect(tA).toEqual(opA);
      expect(tB).toEqual(opB);
    });

    test("retain + delete unchanged", () => {
      const opA = retain(5, "user1", 1);
      const opB = deleteOp(10, 3, "user2", 1);
      const [tA, tB] = transform(opA, opB, content);

      expect(tA).toEqual(opA);
      expect(tB).toEqual(opB);
    });
  });

  describe("insert + insert", () => {
    test("insert before other insert", () => {
      const opA = insert(5, "XXX", "user1", 1);
      const opB = insert(10, "YYY", "user2", 1);
      const [tA, tB] = transform(opA, opB, content);

      expect(tA.position).toBe(5);
      expect(tB.position).toBe(13);
    });

    test("insert after other insert", () => {
      const opA = insert(10, "XXX", "user1", 1);
      const opB = insert(5, "YYY", "user2", 1);
      const [tA, tB] = transform(opA, opB, content);

      expect(tA.position).toBe(13);
      expect(tB.position).toBe(5);
    });

    test("insert at same position - user1 first", () => {
      const opA = insert(5, "A", "user1", 1);
      const opB = insert(5, "B", "user2", 1);
      const [tA, tB] = transform(opA, opB, content);

      expect(tA.position).toBe(5);
      expect(tB.position).toBe(6);
    });

    test("insert at same position - user2 first", () => {
      const opA = insert(5, "B", "user2", 1);
      const opB = insert(5, "A", "user1", 1);
      const [tA, tB] = transform(opA, opB, content);

      expect(tA.position).toBe(6);
      expect(tB.position).toBe(5);
    });
  });

  describe("insert + delete", () => {
    test("insert before delete", () => {
      const opA = insert(5, "XXX", "user1", 1);
      const opB = deleteOp(10, 3, "user2", 1);
      const [tA, tB] = transform(opA, opB, content);

      expect(tA.position).toBe(5);
      expect(tB.position).toBe(10);
    });

    test("insert after delete", () => {
      const opA = insert(15, "XXX", "user1", 1);
      const opB = deleteOp(5, 3, "user2", 1);
      const [tA, tB] = transform(opA, opB, content);

      expect(tA.position).toBe(12);
      expect(tB.position).toBe(5);
    });

    test("insert inside deleted range", () => {
      const opA = insert(8, "XXX", "user1", 1);
      const opB = deleteOp(5, 5, "user2", 1);
      const [tA, tB] = transform(opA, opB, content);

      expect(tA.position).toBe(5);
      expect(tB.length).toBe(2);
    });

    test("insert at delete start", () => {
      const opA = insert(5, "XXX", "user1", 1);
      const opB = deleteOp(5, 3, "user2", 1);
      const [tA, tB] = transform(opA, opB, content);

      expect(tA.position).toBe(5);
      expect(tB).toEqual(opB);
    });
  });

  describe("delete + delete", () => {
    test("delete before other delete", () => {
      const opA = deleteOp(5, 2, "user1", 1);
      const opB = deleteOp(10, 2, "user2", 1);
      const [tA, tB] = transform(opA, opB, content);

      expect(tA.position).toBe(5);
      expect(tB.position).toBe(8);
    });

    test("delete after other delete", () => {
      const opA = deleteOp(10, 2, "user1", 1);
      const opB = deleteOp(5, 2, "user2", 1);
      const [tA, tB] = transform(opA, opB, content);

      expect(tA.position).toBe(8);
      expect(tB.position).toBe(5);
    });

    test("delete overlapping - A contains B", () => {
      const opA = deleteOp(5, 6, "user1", 1);
      const opB = deleteOp(7, 2, "user2", 1);
      const [tA, tB] = transform(opA, opB, content);

      expect(tA).toEqual(opA);
      expect(tB.position).toBe(5);
      expect(tB.length).toBe(0);
    });

    test("delete overlapping - B contains A", () => {
      const opA = deleteOp(7, 2, "user1", 1);
      const opB = deleteOp(5, 6, "user2", 1);
      const [tA, tB] = transform(opA, opB, content);

      expect(tA.position).toBe(5);
      expect(tA.length).toBe(0);
      expect(tB).toEqual(opB);
    });

    test("delete partial overlap", () => {
      const opA = deleteOp(5, 5, "user1", 1);
      const opB = deleteOp(7, 5, "user2", 1);
      const [tA, tB] = transform(opA, opB, content);

      expect(tA).toEqual(opA);
      expect(tB.position).toBe(2);
      expect(tB.length).toBe(2);
    });
  });

  describe("transformAgainst", () => {
    test("transform against multiple operations", () => {
      const op = insert(5, "X", "user1", 1);
      const ops = [
        insert(3, "A", "user2", 1),
        insert(5, "B", "user3", 1),
      ];
      const result = transformAgainst(op, ops, content);

      expect(result.position).toBeGreaterThan(5);
    });

    test("transform delete against inserts", () => {
      const op = deleteOp(10, 2, "user1", 1);
      const ops = [
        insert(5, "AAA", "user2", 1),
        insert(8, "BBB", "user3", 1),
      ];
      const result = transformAgainst(op, ops, content);

      expect(result.position).toBeGreaterThanOrEqual(10);
    });
  });

  describe("apply", () => {
    test("apply insert operation", () => {
      const op = insert(5, "XXX", "user1", 1);
      const result = apply(op, content);

      expect(result).toBe("HelloXXX, World!");
    });

    test("apply delete operation", () => {
      const op = deleteOp(5, 3, "user1", 1);
      const result = apply(op, content);

      expect(result).toBe("Helloorld!");
    });

    test("apply retain operation", () => {
      const op = retain(5, "user1", 1);
      const result = apply(op, content);

      expect(result).toBe(content);
    });

    test("insert at beginning", () => {
      const op = insert(0, "START", "user1", 1);
      const result = apply(op, content);

      expect(result).toBe("STARTHello, World!");
    });

    test("insert at end", () => {
      const op = insert(content.length, "END", "user1", 1);
      const result = apply(op, content);

      expect(result).toBe("Hello, World!END");
    });

    test("delete from beginning", () => {
      const op = deleteOp(0, 5, "user1", 1);
      const result = apply(op, content);

      expect(result).toBe(", World!");
    });

    test("delete from end", () => {
      const op = deleteOp(content.length - 6, 6, "user1", 1);
      const result = apply(op, content);

      expect(result).toBe("Hello, ");
    });

    test("throw on unknown type", () => {
      const op = { type: "unknown", position: 5 };
      expect(() => apply(op, content)).toThrow();
    });
  });

  describe("complex scenarios", () => {
    test("three concurrent inserts", () => {
      const op1 = insert(5, "A", "user1", 1);
      const op2 = insert(5, "B", "user2", 1);
      const op3 = insert(5, "C", "user3", 1);

      const [t1, t2] = transform(op1, op2, content);
      const [t3, t4] = transform(op3, t1, content);

      expect(t1.text).toBe("A");
      expect(t2.text).toBe("B");
      expect(t3.text).toBe("C");
      expect(t4.text).toBe("A");
    });

    test("insert and delete chain", () => {
      const insOp = insert(5, "XXX", "user1", 1);
      const delOp = deleteOp(5, 2, "user2", 1);

      const [tIns, tDel] = transform(insOp, delOp, content);
      let result = apply(tIns, content);
      result = apply(tDel, result);

      expect(result).toContain("X");
      expect(result.startsWith("HelloX"));
    });
  });
});

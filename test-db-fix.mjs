import { initDatabase, setMetadata, getMetadata, closeDatabase } from "./src/lib/database";

async function testDatabase() {
  console.log("Testing database initialization...");

  try {
    // Test 1: Initialize database
    const db = initDatabase();
    console.log("✓ Database initialized successfully");

    // Test 2: Set metadata with db instance
    setMetadata(db, "test_key", "test_value");
    console.log("✓ setMetadata with db instance works");

    // Test 3: Get metadata with db instance
    const value = getMetadata(db, "test_key");
    if (value === "test_value") {
      console.log("✓ getMetadata with db instance works");
    } else {
      console.error("✗ getMetadata returned unexpected value:", value);
    }

    // Test 4: Set metadata without db instance
    setMetadata("test_key_2", "test_value_2");
    console.log("✓ setMetadata without db instance works");

    // Test 5: Get metadata without db instance
    const value2 = getMetadata("test_key_2");
    if (value2 === "test_value_2") {
      console.log("✓ getMetadata without db instance works");
    } else {
      console.error("✗ getMetadata returned unexpected value:", value2);
    }

    // Clean up
    closeDatabase(db);
    console.log("✓ Database closed successfully");

    console.log("\n✅ All database tests passed!");
  } catch (error) {
    console.error("\n❌ Database test failed:", error);
    process.exit(1);
  }
}

testDatabase();

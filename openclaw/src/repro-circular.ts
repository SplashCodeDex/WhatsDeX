import { validateConfigObject } from "./config/validation.js";
import { createSubsystemLogger } from "./logging/subsystem.js";

console.log("Testing imports...");
try {
  console.log("Attempting to import validation...");
  // In a real ESM environment with tsx, we import the .js which refers to the .ts
  const logger = createSubsystemLogger("test");
  logger.info("Logging subsystem imported successfully.");
  
  const dummyConfig = { agents: { list: [] } };
  const result = validateConfigObject(dummyConfig);
  console.log("Validation result:", result.ok ? "OK" : "FAILED");
  
  console.log("SUCCESS: No circular dependency issues detected during import.");
} catch (err) {
  console.error("FAILURE: Import failed with error:");
  console.error(err);
  process.exit(1);
}

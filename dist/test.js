try {
  console.info(`[1]: Importing indexed...`);
  const indexed = require("@creuserr/indexed");
  const version = Indexed.version;
  console.info(`[/]: Imported indexed(v${version})`);
  console.info("[=]: Test passed");
} catch(e) {
  console.error(e);
  console.error("[=]: Test failed");
}
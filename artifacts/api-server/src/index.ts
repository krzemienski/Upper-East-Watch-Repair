import app from "./app";
import { bootstrapGuideContent } from "./lib/guide-content-bootstrap";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function startServer() {
  const bootstrapResult = await bootstrapGuideContent();
  logger.info(bootstrapResult, "Guide content bootstrap complete");

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
}

void startServer().catch((err: unknown) => {
  logger.error({ err }, "Server startup failed");
  process.exit(1);
});

// ==============================================================================
// CODE GRAND PRIX 2026 — SERVER ENTRY POINT
// ==============================================================================

import http from "http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";

async function bootstrap() {
  console.log("🏎️ Starting Code Grand Prix 2026 Backend Engine...");

  const app = createApp();
  const server = http.createServer(app);

  // Attempt database connection (non-fatal if DB is offline during initial local setup)
  await connectDatabase();

  server.listen(env.PORT, () => {
    console.log(`====================================================`);
    console.log(`🏁 Code Grand Prix Backend is LIVE`);
    console.log(`🌐 Port: ${env.PORT}`);
    console.log(`📡 URL: http://localhost:${env.PORT}/api`);
    console.log(`🩺 Health: http://localhost:${env.PORT}/api/health`);
    console.log(`🌍 Environment: ${env.NODE_ENV}`);
    console.log(`⚙️  Judge Provider: ${env.JUDGE_PROVIDER}`);
    console.log(`====================================================`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Gracefully stopping server...`);
    server.close(async () => {
      await disconnectDatabase();
      console.log("🏁 Backend stopped cleanly.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch((err) => {
  console.error("❌ Fatal error during backend bootstrap:", err);
  process.exit(1);
});

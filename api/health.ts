import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.json({
    status: "healthy",
    version: "1.2.2",
    responseTime: "Fast",
    timestamp: new Date().toISOString(),
    environment: "production",
  });
}

function readEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`${name} is required`);
  }

  const trimmedValue = value.trim();
  if (trimmedValue.includes("<username>") || trimmedValue.includes("<password>")) {
    throw new Error(`${name} must not contain placeholder values`);
  }

  return trimmedValue;
}

function readAllowedOrigins() {
  const rawValue = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "";
  const origins = rawValue
    .split(",")
    .map((value) => value.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  // Fallback to allow the live Vercel app if no custom origins are configured
  if (origins.length === 0) {
    origins.push("https://ignite-ai-xi.vercel.app");
  }
  return origins;
}

function loadEnv() {
  const port = Number(process.env.PORT) || 5000;

  return {
    port,
    jwtSecret: readEnv("JWT_SECRET"),
    mongoUri: readEnv("MONGO_URI"),
    geminiApiKey: readEnv("GEMINI_API_KEY"),
    allowedOrigins: readAllowedOrigins(),
  };
}

module.exports = {
  loadEnv,
};

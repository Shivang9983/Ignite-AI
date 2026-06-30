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
  return rawValue
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
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

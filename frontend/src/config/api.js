const PROD_API_BASE_URL = "https://ignite-ai-backend.onrender.com";
const LOCAL_API_BASE_URL = "http://localhost:5000";

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

export function getApiBaseUrl() {
  const envValue = import.meta.env.VITE_API_BASE_URL?.trim();
  if (envValue) {
    return trimTrailingSlash(envValue);
  }

  const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  return isLocalHost ? LOCAL_API_BASE_URL : PROD_API_BASE_URL;
}

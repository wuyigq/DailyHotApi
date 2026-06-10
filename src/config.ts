import dotenv from "dotenv";

// 环境变量
dotenv.config();

export type Config = {
  PORT: number;
  DISALLOW_ROBOT: boolean;
  CACHE_TTL: number;
  REQUEST_TIMEOUT: number;
  ALLOWED_DOMAIN: string;
  ALLOWED_HOST: string;
  USE_LOG_FILE: boolean;
  RSS_MODE: boolean;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string;
  ZHIHU_COOKIE: string;
  AI_PROVIDER: string;
  AI_API_KEY: string;
  AI_BASE_URL: string;
  AI_MODEL: string;
  AI_TIMEOUT: number;
  AI_TEMPERATURE: number;
};

// 验证并提取环境变量
const getEnvVariable = (key: string): string | undefined => {
  const value = process.env[key];
  if (value === undefined) return undefined;
  return value;
};

// 将环境变量转换为数值
const getNumericEnvVariable = (key: string, defaultValue: number): number => {
  const value = getEnvVariable(key) ?? String(defaultValue);
  const parsedValue = parseInt(value, 10);
  if (isNaN(parsedValue)) return defaultValue;
  return parsedValue;
};

// 将环境变量转换为布尔值
const getBooleanEnvVariable = (key: string, defaultValue: boolean): boolean => {
  const value = getEnvVariable(key) ?? String(defaultValue);
  return value.toLowerCase() === "true";
};

// 创建配置对象
export const config: Config = {
  PORT: getNumericEnvVariable("PORT", 6688),
  DISALLOW_ROBOT: getBooleanEnvVariable("DISALLOW_ROBOT", true),
  CACHE_TTL: getNumericEnvVariable("CACHE_TTL", 3600),
  REQUEST_TIMEOUT: getNumericEnvVariable("REQUEST_TIMEOUT", 6000),
  ALLOWED_DOMAIN: getEnvVariable("ALLOWED_DOMAIN") || "*",
  ALLOWED_HOST: getEnvVariable("ALLOWED_HOST") || "trynew5.github.io",
  USE_LOG_FILE: getBooleanEnvVariable("USE_LOG_FILE", true),
  RSS_MODE: getBooleanEnvVariable("RSS_MODE", false),
  REDIS_HOST: getEnvVariable("REDIS_HOST") || "127.0.0.1",
  REDIS_PORT: getNumericEnvVariable("REDIS_PORT", 6379),
  REDIS_PASSWORD: getEnvVariable("REDIS_PASSWORD") || "",
  ZHIHU_COOKIE: getEnvVariable("ZHIHU_COOKIE") || "",
  AI_PROVIDER: getEnvVariable("AI_PROVIDER") || "template",
  AI_API_KEY: getEnvVariable("AI_API_KEY") || "",
  AI_BASE_URL: getEnvVariable("AI_BASE_URL") || "https://api.openai.com/v1",
  AI_MODEL: getEnvVariable("AI_MODEL") || "gpt-4o-mini",
  AI_TIMEOUT: getNumericEnvVariable("AI_TIMEOUT", 15000),
  AI_TEMPERATURE: Number(getEnvVariable("AI_TEMPERATURE") || 0.7),
};

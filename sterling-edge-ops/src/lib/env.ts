import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXTAUTH_SECRET: z
    .string()
    .min(32, "NEXTAUTH_SECRET must be at least 32 characters — run: openssl rand -base64 32"),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

function validateEnv() {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.flatten().fieldErrors;
    console.error("\n[ENV] Missing or invalid environment variables:");
    Object.entries(missing).forEach(([key, errors]) => {
      console.error(`  ${key}: ${errors?.join(", ")}`);
    });
    console.error("\nSee .env.production.example for required variables.\n");
    throw new Error("Invalid environment configuration — cannot start.");
  }
  return result.data;
}

export const env = validateEnv();

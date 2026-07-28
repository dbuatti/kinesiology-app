/**
 * Safely parses a JSON string. Returns a default value if parsing fails.
 */
export function safeParse<T>(jsonString: string | null | undefined, defaultValue: T): T {
  if (!jsonString) return defaultValue;
  if (typeof jsonString !== "string") return jsonString as T;
  if (jsonString.trim() === "") return defaultValue;

  try {
    return JSON.parse(jsonString) as T;
  } catch (e) {
    console.error("JSON Parsing Error:", e, "Raw String:", jsonString);
    return defaultValue;
  }
}

/**
 * Safely stringifies an object.
 */
export function safeStringify(value: any): string {
  try {
    return JSON.stringify(value);
  } catch (e) {
    console.error("JSON Stringify Error:", e);
    return "{}";
  }
}
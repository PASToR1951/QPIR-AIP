import { sanitizeObject } from "./server/lib/sanitize.ts";
console.log(sanitizeObject({ name: "Sample School", abbreviation: "", level: "Secondary", cluster_id: 11 }));
console.log(sanitizeObject(null));
console.log(sanitizeObject(undefined));

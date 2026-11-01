import { z } from "zod";
const s = z.object({ title: z.string(), confidence: z.number().min(0).max(1), tags: z.array(z.string()).default([]), type: z.enum(["a","b"]), page: z.number().int().optional() });
const raw = z.toJSONSchema(s, { io: "output", unrepresentable: "any" });
console.log(JSON.stringify(raw, null, 2));

import { PrismaClient } from "@prisma/client";
import { ensureDemoWorkspace } from "../src/lib/demo/seed";

const prisma = new PrismaClient();

async function main() {
  console.log("Loading the curated STUDYMATE AI demo workspace…");
  const result = await ensureDemoWorkspace(prisma);
  console.log("Demo documents ready:", result.documentIds.join(", "));
  console.log("Demo plan:", result.planId ?? "none");
  console.log("All demo content is stored with mode=DEMO and is labelled in the UI.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

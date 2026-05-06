import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

describe("client analytics module", () => {
  it("does not import server-only Prisma code", () => {
    const source = readFileSync(join(process.cwd(), "lib/analytics.ts"), "utf8");

    expect(source).not.toContain("@prisma/client");
    expect(source).not.toContain("./prisma");
  });
});

import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

describe("Redis rate limiting", () => {
  it("uses atomic Redis eval instead of a non-atomic pipeline", () => {
    const source = readFileSync(join(process.cwd(), "lib/rate-limit.ts"), "utf8");

    expect(source).toContain(".eval(");
    expect(source).not.toContain("redis.pipeline()");
  });
});

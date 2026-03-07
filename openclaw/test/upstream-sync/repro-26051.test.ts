import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { openFileWithinRoot } from "../../src/infra/fs-safe.js";

describe("Hardlink Path Alias Escape Reproduction (#26051)", () => {
    const tmpDir = path.join(os.tmpdir(), "openclaw-test-" + Math.random().toString(36).slice(2));
    const rootDir = path.join(tmpDir, "sandbox");
    const secretFile = path.join(tmpDir, "secret.txt");
    const linkFile = path.join(rootDir, "link.txt");

    beforeEach(async () => {
        await fsp.mkdir(tmpDir, { recursive: true });
        await fsp.mkdir(rootDir, { recursive: true });
        await fsp.writeFile(secretFile, "top secret content");
    });

    afterEach(async () => {
        await fsp.rm(tmpDir, { recursive: true, force: true });
    });

    it("should fail to open a hardlink that points outside the root", async () => {
        // Skip if platform doesn't support hardlinks easily in test env
        try {
            fs.linkSync(secretFile, linkFile);
        } catch {
            console.warn("Hardlinks not supported in this environment, skipping test.");
            return;
        }

        const stat = fs.statSync(linkFile);
        console.log(`nlink: ${stat.nlink}, path: ${linkFile}`);

        // This should throw because of nlink > 1 check in assertNoHardlinkedFinalPath
        try {
            await openFileWithinRoot({ relativePath: linkFile, rootDir });
            throw new Error("VULNERABLE: Successfully opened hardlink outside root");
        } catch (err: any) {
            expect(err.message).toMatch(/path alias escape blocked/);
            console.log(`Verified: Blocked hardlink with message: ${err.message}`);
        }
    });

    it("should detect if a hardlink is created AFTER initial resolution (race condition)", async () => {
        // This is harder to test but let's see if we can trick the logic
        // if we had a multi-step resolution that isn't atomic.
    });
});

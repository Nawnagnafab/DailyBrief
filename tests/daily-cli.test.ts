import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

for (const fail of [false, true]) {
  test(`daily CLI exits ${fail ? "with failure" : "successfully"} after its work, even with open handles`, () => {
    const result = spawnSync(process.execPath, [
      "node_modules/tsx/dist/cli.mjs",
      "--eval",
      `
        import { createServer } from 'node:http';
        import { runCli } from './scripts/_cli';
        runCli(async () => {
          // Simulate a connection left alive by a fetcher or an SDK.
          await new Promise(resolve => createServer().listen(0, '127.0.0.1', resolve));
          process.stdout.write('x'.repeat(256 * 1024));
          process.stderr.write('y'.repeat(256 * 1024));
          if (${fail}) throw new Error('fixture failure');
          console.log('[daily] done.');
        });
      `,
    ], { encoding: "utf8", timeout: 3_000, maxBuffer: 2 * 1024 * 1024 });
    assert.ifError(result.error);
    assert.equal(result.status, fail ? 1 : 0);
    assert.ok(result.stdout.startsWith("x".repeat(256 * 1024)), "stdout must be flushed before exit");
    assert.ok(result.stderr.startsWith("y".repeat(256 * 1024)), "stderr must be flushed before exit");
    if (fail) assert.match(result.stderr, /\[daily\] FAILED:.*fixture failure/);
    else assert.ok(result.stdout.endsWith("[daily] done.\n"));
  });
}

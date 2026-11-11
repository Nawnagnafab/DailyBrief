/** Exit a one-shot task after its awaited work and console output finish. */
export async function runCli(main: () => Promise<void>): Promise<never> {
  let exitCode = 0;
  try {
    await main();
  } catch (error) {
    console.error("[daily] FAILED:", error);
    exitCode = 1;
  }

  // Fetchers and SDKs can leave connections alive after the report is written.
  // Flush both pipes before exiting so Actions keeps the final diagnostics.
  await Promise.all([
    new Promise<void>((resolve) => process.stdout.write("", () => resolve())),
    new Promise<void>((resolve) => process.stderr.write("", () => resolve())),
  ]);
  process.exit(exitCode);
}

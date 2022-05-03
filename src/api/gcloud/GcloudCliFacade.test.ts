import { assertEquals } from "../../dev-deps.ts";
import { StubProcessRunner } from "../../process/StubProcessRunner.ts";
import { InstallationStatus } from "../CliFacade.ts";
import { GcpCliFacade } from "./gcp-cli-facade.ts";

Deno.test("detects gcloud cli version correct", async () => {
  const runner = new StubProcessRunner();
  const sut = new GcpCliFacade(runner);

  runner.setupResult({
    stdout: `Google Cloud SDK 315.0.0
bq 2.0.62
core 2020.10.16
gsutil 4.53`,
    stderr: `To take a quick anonymous survey, run:
    $ gcloud survey
`,
  });

  const result = await sut.verifyCliInstalled();

  assertEquals(result.status, InstallationStatus.Installed);
});
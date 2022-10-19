import { Logger } from "../../cli/Logger.ts";
import { CollieRepository } from "../../model/CollieRepository.ts";
import { GlobalCommandOptions } from "../GlobalCommandOptions.ts";
import { TopLevelCommand } from "../TopLevelCommand.ts";
import { Select } from "../../deps.ts";
import { emptyKitDirectoryCreation } from "./kit-creation.ts";
import { KitBundle } from "./bundles/kitbundle.ts";
import { AzureKitBundle } from "./bundles/azure-caf-es.ts";
import { SelectValueOptions } from "https://deno.land/x/cliffy@v0.25.1/prompt/select.ts";

const availableKitBundles: KitBundle[] = [
  new AzureKitBundle("azure-caf-es", "Azure Enterprise Scale")
]; 

export function registerBundledKitCmd(program: TopLevelCommand) {
  program
    .command("bundle <prefix>")
    .description("Generate predefined bundled kits for your cloud foundation")
    .action(async (opts: GlobalCommandOptions, prefix: string) => {
      const collie = new CollieRepository("./");
      const logger = new Logger(collie, opts);

      logger.progress("Choosing a predefined bundled kit.");
      const bundleToSetup = await promptKitBundleOption();      
      logger.progress(`Bundle '${bundleToSetup.displayName}' ('${bundleToSetup.identifier}') chosen.`);

      const kits = bundleToSetup.kitsAndSources();
      
      await kits.forEach((name: string, source: string) => {
        const modulePath = collie.resolvePath("kit", `${prefix}-${name}`);
        emptyKitDirectoryCreation(modulePath, logger);
        //TODO download from source here instead of logging it.
        logger.progress(`  Downloading Kit from ${source}.`);
      });


      // TODO now we can get going here.
      // rough plan:
      // download TF modules from selected predefined foundation (currently only Azure CAF ES related)
      // create one bootstrap kit named: "<prefix>-bootstrap"
      // create another kit "<prefix>-base" with the actual LZ resources (maybe even split it into multiple kits, probly not for first version)
            
      // request config variables from user that are required
      // apply all new kits to foundation
      // done, deployment works as usual with '$ collie foundation deploy <foundation>' 
    });
}

async function promptKitBundleOption(): Promise<KitBundle> {

  const bundleOptions: SelectValueOptions = availableKitBundles.map((x) => ({ name: x.displayName, value: x.identifier }));
  bundleOptions.push({ name: "Quit", value: "quit" });

  const selectedOption = await Select.prompt({
    message: "Select the predefined Foundation you want to use:",
    options: bundleOptions,
  });
  if (selectedOption === 'quit') {
    Deno.exit(1);
  } else {
    return availableKitBundles.find(x => x.identifiedBy(selectedOption))!;
  }
}

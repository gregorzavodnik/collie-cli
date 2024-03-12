import * as fs from "std/fs";
import { GitCliFacade } from "/api/git/GitCliFacade.ts";
import { CollieRepository } from "/model/CollieRepository.ts";
import { CollieConfig } from "./CollieConfig.ts";
import { Logger } from "../cli/Logger.ts";

export class CollieHub {
  constructor(
    private readonly git: GitCliFacade,
    private readonly repo: CollieRepository,
    private readonly logger: Logger,
    private readonly config: CollieConfig,
  ) {}
  private readonly hubCacheDirPath = [".collie", "hub"];

  // hardcoding this is ok for now
  readonly url = "https://github.com/meshcloud/collie-hub.git/";

  public async importKitModule(
    id: string,
    moduleDestDir: string,
    overwrite?: boolean,
  ) {
    const srcDir = this.repo.resolvePath(
      ...this.hubCacheDirPath,
      "kit",
      id,
    );

    await fs.copy(srcDir, moduleDestDir, { overwrite: overwrite });
  }

  public async importComplianceFramework(
    id: string,
    frameworkDestDir: string,
    overwrite?: boolean,
  ) {
    const srcDir = this.repo.resolvePath(
      ...this.hubCacheDirPath,
      "compliance",
      id,
    );

    await fs.copy(srcDir, frameworkDestDir, { overwrite: overwrite });
  }

  async cloneLatestHub() {
    const hubCacheDir = this.repo.resolvePath(...this.hubCacheDirPath);

    // we do keep a git clone of the repo locally because copying on the local FS is much faster than downloading and
    // extracting a huge tarball
    await fs.ensureDir(hubCacheDir);

    const hubCacheGitDir = this.repo.resolvePath(
      ...this.hubCacheDirPath,
      ".git",
    );
    const hasAlreadyCloned = await this.git.isRepo(hubCacheGitDir);
    const collieHubVersion = this.config.getProperty("colliehubVersion");

    if (!hasAlreadyCloned && !collieHubVersion) {
      await this.git.clone(hubCacheDir, this.url);
      const latestTag = await this.git.getLatestTag(hubCacheDir);
      await this.git.checkout(hubCacheDir, latestTag);
      this.config.setProperty("colliehubVersion", latestTag);
    } else if (collieHubVersion !== undefined) {
      try {
        await this.git.clone(hubCacheDir, this.url);
        const latestTag = await this.git.getLatestTag(hubCacheDir);
        if (latestTag !== collieHubVersion) {
          throw new Error(`version tag ${collieHubVersion} not exist`);
        }
      } catch (error) {
        this.logger.error(`${error}`);
        Deno.exit(1);
      }
      await this.git.checkout(hubCacheDir, collieHubVersion);
    }

    return hubCacheDir;
  }

  public async cleanHubClone() {
    const hubCacheDir = this.repo.resolvePath(...this.hubCacheDirPath);
    await Deno.remove(hubCacheDir, { recursive: true });
  }
}

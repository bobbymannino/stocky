import { version as buildId } from "$app/env";
import { version } from "../../package.json";

export const REPO_URL = "https://github.com/bobbymannino/stocky";

/** The app's version, from package.json. */
export const APP_VERSION = version;

/**
 * When this build was made. SvelteKit's default `version.name` is `Date.now()`
 * at build time (in dev, when the dev server started).
 */
export const BUILT_AT = Number.isFinite(Number(buildId))
  ? new Date(Number(buildId))
  : undefined;

import type { LayoutServerLoad } from "./$types";

/** Read at runtime on the server, so it reflects how the app was started. */
const NODE_ENV = process.env.NODE_ENV;

export const load: LayoutServerLoad = () => ({
  // the footer tags anything that isn't production, so it's obvious where you are
  nodeEnv: NODE_ENV === "production" ? undefined : (NODE_ENV ?? "unset"),
});

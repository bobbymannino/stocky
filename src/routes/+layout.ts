import { defineBaseMetaTags } from "svelte-meta-tags";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = () => ({
  ...defineBaseMetaTags({
    title: "Stocky",
    titleTemplate: "%s | Stocky",
    description: "Track the shares you've bought.",
    openGraph: {
      type: "website",
      siteName: "Stocky",
    },
  }),
});

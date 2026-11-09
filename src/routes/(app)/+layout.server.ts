import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

// layout and page loads run in parallel, so each page load still guards itself
export const load: LayoutServerLoad = ({ locals }) => {
  if (!locals.auth) redirect(303, "/login");

  return { user: locals.auth.user };
};

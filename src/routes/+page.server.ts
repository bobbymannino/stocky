import { redirect } from "@sveltejs/kit";
import { auth } from "#lib/server/auth.js";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ locals }) => ({ user: locals.auth?.user });

export const actions: Actions = {
  signOut: async ({ request }) => {
    await auth.api.signOut({ headers: request.headers });
    redirect(303, "/login");
  },
};

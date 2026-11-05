import { fail, redirect } from "@sveltejs/kit";
import { APIError } from "better-auth/api";
import { auth } from "#lib/server/auth.js";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ locals }) => {
  if (locals.auth) redirect(303, "/");
};

export const actions: Actions = {
  signIn: async ({ request }) => {
    const data = await request.formData();
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");

    try {
      await auth.api.signInEmail({ body: { email, password } });
    } catch (e) {
      if (e instanceof APIError) return fail(400, { email, message: e.message });
      throw e;
    }
    redirect(303, "/");
  },
  signUp: async ({ request }) => {
    const data = await request.formData();
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    const name = String(data.get("name") ?? "") || email.split("@")[0];

    try {
      await auth.api.signUpEmail({ body: { email, password, name } });
    } catch (e) {
      if (e instanceof APIError) return fail(400, { email, message: e.message });
      throw e;
    }
    redirect(303, "/");
  },
};

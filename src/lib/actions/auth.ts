"use server";

import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession, safeNextPath } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { firstIssue, type FormState } from "@/lib/form-state";

const signupSchema = z.object({
  name: z.string().trim().min(2, "Ange ditt namn.").max(80),
  email: z.string().trim().toLowerCase().pipe(z.email("Ange en giltig e-postadress.")),
  password: z.string().min(8, "Lösenordet måste vara minst 8 tecken.").max(200),
  role: z.enum(["booker", "artist"]),
});

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { name, email, password, role } = parsed.data;

  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
  if (existing) return { error: "Det finns redan ett konto med den e-postadressen." };

  const [user] = await db
    .insert(schema.users)
    .values({ name, email, role, passwordHash: await hash(password, 10) })
    .returning({ id: schema.users.id });

  await createSession(user!.id);
  redirect(role === "artist" ? "/dashboard/profile" : safeNextPath(formData.get("next"), "/search"));
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase(),
  password: z.string(),
});

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Fyll i e-post och lösenord." };

  const user = await db.query.users.findFirst({ where: eq(schema.users.email, parsed.data.email) });
  if (!user || !(await compare(parsed.data.password, user.passwordHash))) {
    return { error: "Fel e-post eller lösenord." };
  }

  await createSession(user.id);
  redirect(safeNextPath(formData.get("next")));
}

export async function logout() {
  await destroySession();
  redirect("/");
}

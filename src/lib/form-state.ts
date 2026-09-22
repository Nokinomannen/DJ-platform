export type FormState = { error?: string; ok?: string } | undefined;

export function firstIssue(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Något gick fel, kontrollera fälten.";
}

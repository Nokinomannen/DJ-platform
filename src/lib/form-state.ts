export type FormState = { error?: string; ok?: string } | undefined;

export function firstIssue(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Something went wrong, please check the fields.";
}

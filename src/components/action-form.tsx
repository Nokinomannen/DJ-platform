"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef, type ReactNode } from "react";
import type { FormState } from "@/lib/form-state";

const PendingContext = createContext(false);
const StateContext = createContext<FormState>(undefined);

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  /** Set when the form renders <FormMessage /> itself, e.g. next to its submit button. */
  customMessage?: boolean;
};

/**
 * Wraps a Server Action with inline error/success messages. Submits manually so the
 * browser keeps the user's input when the action returns a validation error.
 */
export function ActionForm({ action, children, className, resetOnSuccess = false, customMessage = false }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (resetOnSuccess && state?.ok) formRef.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={formRef}
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
    >
      <PendingContext.Provider value={pending}>
        <StateContext.Provider value={state}>
          {children}
          {!customMessage && <FormMessage />}
        </StateContext.Provider>
      </PendingContext.Provider>
    </form>
  );
}

export function FormMessage() {
  const state = useContext(StateContext);
  if (!state?.error && !state?.ok) return null;
  return (
    <p role="status" className={`mt-3 text-sm ${state.error ? "text-danger" : "text-accent"}`}>
      {state.error ?? state.ok}
    </p>
  );
}

export function SubmitButton({
  children,
  pendingText = "Saving…",
  className = "btn-primary",
  disabled,
}: {
  children: ReactNode;
  pendingText?: string;
  className?: string;
  disabled?: boolean;
}) {
  const pending = useContext(PendingContext);
  return (
    <button type="submit" className={className} disabled={pending || disabled}>
      {pending ? pendingText : children}
    </button>
  );
}

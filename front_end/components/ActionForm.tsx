"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { initialActionState, type ActionState } from "@/types/action-state";

type ActionFormProps = Omit<React.FormHTMLAttributes<HTMLFormElement>, "action"> & {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  successLabel?: string;
};

export function ActionForm({ action, successLabel, children, ...props }: ActionFormProps) {
  const [state, formAction] = useActionState(action, initialActionState);
  const router = useRouter();

  useEffect(() => {
    if (!state.message) {
      return;
    }
    if (state.ok) {
      router.refresh();
      toast.success(successLabel ?? state.message, {
        description: state.message,
        action: state.href
          ? {
              label: state.hrefLabel ?? "Open",
              onClick: () => {
                window.location.href = state.href ?? "/";
              },
            }
          : undefined,
      });
    } else {
      toast.error(state.message);
    }
  }, [router, state, successLabel]);

  return (
    <form action={formAction} {...props}>
      {children}
    </form>
  );
}

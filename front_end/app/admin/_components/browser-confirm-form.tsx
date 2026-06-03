"use client";

type BrowserConfirmFormProps = Omit<React.FormHTMLAttributes<HTMLFormElement>, "action" | "onSubmit"> & {
  action: (formData: FormData) => void | Promise<void>;
  message: string;
};

export function BrowserConfirmForm({ action, message, children, ...props }: BrowserConfirmFormProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
      {...props}
    >
      {children}
    </form>
  );
}

"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "border-blue-100",
          content: "min-w-0 flex-1",
          actionButton: "ml-auto bg-blue-600 text-white",
        },
        actionButtonStyle: {
          marginLeft: "auto",
        },
      }}
    />
  );
}

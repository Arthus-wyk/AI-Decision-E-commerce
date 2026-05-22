import Link from "next/link";

import { signupAction } from "@/actions/user";
import { AuthForm } from "@/components/forms/AuthForm";

export default function SignUpPage() {
  return (
    <main className="grid min-h-[calc(100vh-4rem)] place-items-center px-4 py-10">
      <div className="w-full">
        <AuthForm mode="signup" action={signupAction} />
        <p className="mt-6 text-center text-sm text-slate-500">
          Continue browsing first?{" "}
          <Link className="font-semibold text-blue-700 hover:underline" href="/products">
            View products
          </Link>
        </p>
      </div>
    </main>
  );
}

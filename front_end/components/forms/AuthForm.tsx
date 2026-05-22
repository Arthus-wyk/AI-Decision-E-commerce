"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState, type ActionState } from "@/types/action-state";

const signinSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const signupSchema = signinSchema.extend({
  name: z.string().min(1, "Enter your name."),
});

type AuthMode = "signin" | "signup";
type SigninValues = z.infer<typeof signinSchema>;
type SignupValues = z.infer<typeof signupSchema>;

type AuthFormProps = {
  mode: AuthMode;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
};

export function AuthForm({ mode, action }: AuthFormProps) {
  const schema = mode === "signin" ? signinSchema : signupSchema;
  const [state, formAction] = useActionState(action, initialActionState);
  const {
    register,
    formState: { errors, isSubmitting },
  } = useForm<SigninValues | SignupValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });

  useEffect(() => {
    if (state.message && !state.ok) {
      toast.error(state.message);
    }
  }, [state]);

  const isSignin = mode === "signin";

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{isSignin ? "Sign in" : "Create account"}</CardTitle>
        <CardDescription>
          {isSignin ? "Access your favorites, account, and checkout." : "Save products and keep your cart across sessions."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4">
          {!isSignin ? (
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" autoComplete="name" {...register("name" as keyof SignupValues)} />
              {"name" in errors && errors.name ? <p className="text-sm font-medium text-red-600">{errors.name.message}</p> : null}
            </div>
          ) : null}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email ? <p className="text-sm font-medium text-red-600">{errors.email.message}</p> : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={isSignin ? "current-password" : "new-password"}
              {...register("password")}
            />
            {errors.password ? <p className="text-sm font-medium text-red-600">{errors.password.message}</p> : null}
          </div>
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSignin ? "Sign in" : "Sign up"}
            <ArrowRight />
          </Button>
          <p className="text-center text-sm text-slate-500">
            {isSignin ? "Need an account?" : "Already have an account?"}{" "}
            <Link className="font-semibold text-blue-700 hover:underline" href={isSignin ? "/signup" : "/signin"}>
              {isSignin ? "Sign up" : "Sign in"}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

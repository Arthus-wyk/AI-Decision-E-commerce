"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard } from "lucide-react";
import { useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState, type ActionState } from "@/types/action-state";

const checkoutSchema = z.object({
  email: z.string().email("Enter a valid email."),
  full_name: z.string().min(2, "Enter your full name."),
  address: z.string().min(6, "Enter a complete address."),
  city: z.string().min(2, "Enter a city."),
  country: z.string().min(2, "Enter a country."),
  phone: z.string().optional(),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

type CheckoutFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaults: Partial<CheckoutValues>;
};

export function CheckoutForm({ action, defaults }: CheckoutFormProps) {
  const [state, formAction] = useActionState(action, initialActionState);
  const {
    register,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      country: "Malaysia",
      ...defaults,
    },
    mode: "onBlur",
  });

  useEffect(() => {
    if (state.message && !state.ok) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form className="grid gap-4 rounded-lg border border-blue-100 bg-white p-5 shadow-sm" action={formAction}>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email ? <p className="text-sm font-medium text-red-600">{errors.email.message}</p> : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" autoComplete="name" {...register("full_name")} />
        {errors.full_name ? <p className="text-sm font-medium text-red-600">{errors.full_name.message}</p> : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" rows={4} autoComplete="street-address" {...register("address")} />
        {errors.address ? <p className="text-sm font-medium text-red-600">{errors.address.message}</p> : null}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" autoComplete="address-level2" {...register("city")} />
          {errors.city ? <p className="text-sm font-medium text-red-600">{errors.city.message}</p> : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="country">Country</Label>
          <Input id="country" autoComplete="country-name" {...register("country")} />
          {errors.country ? <p className="text-sm font-medium text-red-600">{errors.country.message}</p> : null}
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" autoComplete="tel" {...register("phone")} />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        <CreditCard />
        Create Demo Order
      </Button>
    </form>
  );
}

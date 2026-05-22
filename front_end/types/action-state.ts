export type ActionState = {
  ok: boolean;
  message: string;
  href?: string;
  hrefLabel?: string;
};

export const initialActionState: ActionState = {
  ok: false,
  message: "",
};

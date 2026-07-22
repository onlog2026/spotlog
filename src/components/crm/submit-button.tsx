"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

/**
 * Botão de submit que se desabilita sozinho durante o envio — precisa
 * estar dentro de um <form action={...}> pra useFormStatus funcionar.
 * Sem isso, um duplo clique real dispara a server action duas vezes antes
 * do redirect (ex: converter o mesmo lead em deal duas vezes).
 */
export function SubmitButton({
  children,
  pendingLabel,
  ...props
}: ButtonProps & { pendingLabel?: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? (pendingLabel ?? "Enviando…") : children}
    </Button>
  );
}

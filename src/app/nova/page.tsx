import { redirect } from "next/navigation";

// A home v3 agora vive em "/". /nova redireciona para a raiz (canônica).
export default function NovaRedirect() {
  redirect("/");
}

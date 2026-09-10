import { redirect } from "next/navigation";
import AuthForm from "../auth-form";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export default async function RegisterPage() {
  const user = await getSessionUser().catch(() => null);
  if (user) redirect("/dashboard");
  return <AuthForm mode="register" />;
}

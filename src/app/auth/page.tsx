import { redirect } from "next/navigation";

export default function AuthPage() {
  redirect("/api/auth/signin/google?callbackUrl=%2Ffeed&prompt=select_account");
}

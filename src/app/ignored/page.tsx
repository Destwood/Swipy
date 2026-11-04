import { redirect } from "next/navigation";

export default function IgnoredGamesRedirect() {
  redirect("/account/ignored");
}

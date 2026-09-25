import { redirect } from "next/navigation";
import { getSession } from "../lib/auth";
import Dashboard from "./dashboard";

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <Dashboard session={session} />;
}

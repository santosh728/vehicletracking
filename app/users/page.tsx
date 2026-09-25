import { redirect } from "next/navigation";
import { getSession } from "../../lib/auth";
import UsersPanel from "./users-panel";

export default async function UsersPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "super_admin") redirect("/");
  return <UsersPanel session={session} />;
}

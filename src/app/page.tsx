import { auth } from "@/auth";
import { Dashboard } from "@/components/dashboard";
import { Login } from "@/components/login";

export default async function Home() {
  const session = await auth();
  return session?.user?.email ? <Dashboard user={{ name: session.user.name || "Giáo viên", email: session.user.email, image: session.user.image || undefined }} /> : <Login />;
}

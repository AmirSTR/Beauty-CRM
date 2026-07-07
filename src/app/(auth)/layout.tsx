import { redirectAuthenticatedUser } from "@/lib/auth";

export default async function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  await redirectAuthenticatedUser();

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <section className="panel w-full max-w-md p-6">{children}</section>
    </main>
  );
}
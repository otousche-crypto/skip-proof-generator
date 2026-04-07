import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { NavAuth } from "@/components/NavAuth";

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <nav className="relative flex items-center justify-center px-6 py-4">
        <Link
          href="/"
          className="text-xl font-bold bg-clip-text text-transparent"
          style={{
            backgroundImage: "linear-gradient(135deg, #FF6B00, #7C3AED)",
          }}
        >
          Sklip
        </Link>
        <div className="absolute right-6">
          <NavAuth />
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6">
        <AuthForm />
      </main>
    </div>
  );
}

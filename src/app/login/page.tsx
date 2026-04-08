import { AuthForm } from "@/components/AuthForm";
import { Navbar } from "@/components/Navbar";

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-6">
        <AuthForm />
      </main>
    </div>
  );
}

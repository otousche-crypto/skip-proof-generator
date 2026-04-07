"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();

      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        });
        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/profile");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-surface rounded-[var(--radius)] border border-border p-8">
        <h2 className="text-xl font-bold text-text text-center mb-6">
          {mode === "login" ? "Connexion" : "Créer un compte"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Nom d'affichage"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-surface-alt border border-border rounded-[var(--radius-sm)] px-4 py-2.5 text-text text-sm placeholder:text-text-muted focus:outline-none focus:border-[#FF6B00] transition-colors"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-surface-alt border border-border rounded-[var(--radius-sm)] px-4 py-2.5 text-text text-sm placeholder:text-text-muted focus:outline-none focus:border-[#FF6B00] transition-colors"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="bg-surface-alt border border-border rounded-[var(--radius-sm)] px-4 py-2.5 text-text text-sm placeholder:text-text-muted focus:outline-none focus:border-[#FF6B00] transition-colors"
          />

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="py-2.5 rounded-[var(--radius-sm)] font-bold text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{
              backgroundImage: "linear-gradient(135deg, #FF6B00, #7C3AED)",
            }}
          >
            {loading
              ? "..."
              : mode === "login"
                ? "Se connecter"
                : "Créer le compte"}
          </button>
        </form>

        <p className="text-text-muted text-sm text-center mt-6">
          {mode === "login" ? (
            <>
              Pas encore de compte ?{" "}
              <button
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
                className="text-[#FF6B00] hover:underline"
              >
                S&apos;inscrire
              </button>
            </>
          ) : (
            <>
              Déjà un compte ?{" "}
              <button
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className="text-[#FF6B00] hover:underline"
              >
                Se connecter
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

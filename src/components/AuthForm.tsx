"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/i18n/LanguageContext";

export function AuthForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

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
      setError(err instanceof Error ? err.message : t.auth.error_default);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-surface rounded-[var(--radius)] border border-border p-8">
        <h2 className="text-xl font-bold text-text text-center mb-6">
          {mode === "login" ? t.auth.login_title : t.auth.signup_title}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "signup" && (
            <input
              type="text"
              placeholder={t.auth.display_name}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-surface-alt border border-border rounded-[var(--radius-sm)] px-4 py-2.5 text-text text-sm placeholder:text-text-muted focus:outline-none focus:border-[#FF6B00] transition-colors"
            />
          )}
          <input
            type="email"
            placeholder={t.auth.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-surface-alt border border-border rounded-[var(--radius-sm)] px-4 py-2.5 text-text text-sm placeholder:text-text-muted focus:outline-none focus:border-[#FF6B00] transition-colors"
          />
          <input
            type="password"
            placeholder={t.auth.password}
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
            className="py-2.5 rounded-[var(--radius-sm)] font-bold text-black bg-white text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading
              ? "..."
              : mode === "login"
                ? t.auth.sign_in_btn
                : t.auth.create_account_btn}
          </button>
        </form>

        <p className="text-text-muted text-sm text-center mt-6">
          {mode === "login" ? (
            <>
              {t.auth.no_account}{" "}
              <button
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
                className="text-[#FF6B00] hover:underline"
              >
                {t.auth.sign_up}
              </button>
            </>
          ) : (
            <>
              {t.auth.already_account}{" "}
              <button
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className="text-[#FF6B00] hover:underline"
              >
                {t.auth.sign_in_link}
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

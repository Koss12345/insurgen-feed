"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminBootstrapForm() {
  const router = useRouter();
  const [bootstrapKey, setBootstrapKey] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, bootstrapKey }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Не удалось создать аккаунт");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-sm px-5 py-16">
      <h1 className="font-serif text-2xl font-bold text-ink">Создать первого администратора</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Админ-аккаунтов пока нет. Ключ первоначальной настройки — значение переменной окружения
        ADMIN_BOOTSTRAP_KEY.
      </p>
      <input
        type="password"
        value={bootstrapKey}
        onChange={(e) => setBootstrapKey(e.target.value)}
        placeholder="Ключ первоначальной настройки"
        className="mt-4 w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="mt-3 w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Пароль (от 8 символов)"
        className="mt-3 w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink"
      />
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-4 w-full rounded-full bg-accent px-6 py-2 font-medium text-white hover:bg-accent-ink disabled:opacity-60"
      >
        {loading ? "Создаём..." : "Создать аккаунт"}
      </button>
    </form>
  );
}

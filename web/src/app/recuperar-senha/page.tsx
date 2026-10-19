"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { supabase } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/brand";

export default function RecoverPassword() {
  const [recovery, setRecovery] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    return () => subscription.unsubscribe();
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    try {
      if (recovery) {
        if (form.get("password") !== form.get("confirmation"))
          throw new Error("As senhas precisam ser iguais.");
        const { error } = await supabase.auth.updateUser({
          password: String(form.get("password")),
        });
        if (error) throw error;
        await supabase.auth.signOut();
        setRecovery(false);
        setMessage("Senha alterada. Volte para entrar com a nova senha.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(
          String(form.get("email")),
          {
            redirectTo: `${window.location.origin}/recuperar-senha`,
          },
        );
        if (error) throw error;
        setMessage(
          "Se houver uma conta com esse e-mail, você receberá as instruções. Verifique também o spam.",
        );
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível concluir. Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="onboarding card auth-recovery">
      <div className="auth-recovery-brand"><Brand /></div>
      <span className="eyebrow">ACESSO À SUA CONTA</span>
      <h1>{recovery ? "Escolha sua nova senha" : "Recuperar senha"}</h1>
      <p className="muted">
        {recovery
          ? "Defina uma nova senha para voltar ao seu controle pessoal."
          : "Enviaremos um link para o e-mail da sua conta HonorMed."}
      </p>
      {message && <p className="auth-recovery-message" role="status">{message}</p>}
      {!supabase ? (
        <p>Recuperação disponível no ambiente com autenticação configurada.</p>
      ) : (
        <form onSubmit={submit}>
          {recovery ? (
            <>
              <label>
                Nova senha
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
              <label>
                Confirme a senha
                <input
                  name="confirmation"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
            </>
          ) : (
            <label>
              E-mail
              <input name="email" type="email" autoComplete="email" required />
            </label>
          )}
          <Button type="submit" disabled={busy}>
            {busy ? "Aguarde…" : recovery ? "Salvar nova senha" : "Enviar link"}
          </Button>
        </form>
      )}
      <p>
        <Link className="auth-recovery-back" href="/">← Voltar para entrar</Link>
      </p>
    </main>
  );
}

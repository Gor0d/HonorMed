"use client";
import { useState } from "react";
import { feedbackHref, feedbackKinds } from "@/lib/feedback";
export default function Feedback() {
  const [kind, setKind] = useState<string>(feedbackKinds[0]);
  return (
    <section className="account-controls" aria-label="Feedback">
      <h2>Como foi usar o HonorMed?</h2>
      <label>
        Tipo de feedback
        <select value={kind} onChange={(event) => setKind(event.target.value)}>
          {feedbackKinds.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <p>
        Nenhum registro ou dado da sua conta é anexado. Não envie dados
        financeiros, de pacientes, senhas ou capturas com informações pessoais.
      </p>
      <a className="text-button" href={feedbackHref(kind)}>
        Preparar e-mail de feedback
      </a>
      <small>
        Abre seu aplicativo de e-mail. Você revisa a mensagem antes de enviar.
      </small>
    </section>
  );
}

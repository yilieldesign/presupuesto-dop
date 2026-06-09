"use client";

import { Wallet, TrendingDown, PiggyBank, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface WelcomeScreenProps {
  onStart: () => void;
}

const steps = [
  {
    icon: Wallet,
    color: "text-[var(--ios-tint)]",
    bg: "bg-[var(--ios-tint)]/15",
    title: "1. Fondo vital semanal",
    text: "Configura comida, combustible y transporte en Presupuesto.",
  },
  {
    icon: TrendingDown,
    color: "text-[var(--ios-red)]",
    bg: "bg-[var(--ios-red)]/15",
    title: "2. Registra tus deudas",
    text: "Tarjetas en US$ o préstamos en RD$. Optimiza cada cobro.",
  },
  {
    icon: PiggyBank,
    color: "text-[var(--ios-green)]",
    bg: "bg-[var(--ios-green)]/15",
    title: "3. Ahorra cuando mejore",
    text: "Define metas para el día que los eventos ganen a las deudas.",
  },
];

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-t-3xl bg-[var(--ios-card)] px-5 pb-8 pt-6"
        style={{ paddingBottom: "max(32px, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--ios-tint)]">
          <span className="text-lg font-bold text-white">RD$</span>
        </div>

        <h2 className="text-center text-xl font-bold">Presupuesto DOP</h2>
        <p className="mt-2 text-center text-sm text-[var(--ios-muted)]">
          Tu app personal para sobrevivir la semana, atacar deudas y ahorrar
          cuando las cosas mejoren. Todo se guarda en tu teléfono.
        </p>

        <div className="mt-6 space-y-3">
          {steps.map(({ icon: Icon, color, bg, title, text }) => (
            <div key={title} className="flex gap-3 rounded-2xl bg-[var(--ios-bg)] p-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${bg}`}
              >
                <Icon size={18} className={color} />
              </div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs leading-snug text-[var(--ios-muted)]">
                  {text}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-[var(--ios-muted)]">
          <Sparkles size={14} className="text-[var(--ios-green)]" />
          Sin cuentas, sin nube — privado en tu dispositivo
        </div>

        <Button fullWidth size="lg" className="mt-6" onClick={onStart}>
          Comenzar
        </Button>
      </div>
    </div>
  );
}

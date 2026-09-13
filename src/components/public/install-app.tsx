"use client";
import { useEffect, useState } from "react";
import { Smartphone, Download, Share2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream);
    setIsInstalled(window.matchMedia("(display-mode: standalone)").matches);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  if (isInstalled) return null;

  return (
    <section className="py-16 lg:py-24 bg-navy-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-spotorange-500/15 rounded-full -translate-y-32 translate-x-32 blur-3xl" />

      <div className="container relative">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-4 py-1.5 mb-5 border border-white/20">
              <Smartphone className="h-3.5 w-3.5 text-spotorange-400" />
              <span className="text-xs font-semibold text-white">
                App Spotlog — instale no seu celular
              </span>
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold tracking-tight text-balance leading-tight">
              Acompanhe sua operação{" "}
              <span className="text-spotorange-400">de qualquer lugar.</span>
            </h2>
            <p className="mt-5 text-lg text-ink-300 max-w-xl leading-relaxed">
              Instale o Spotlog no seu celular pra acessar entregas, abrir
              chamados e rastrear pedidos com um toque — sem precisar do navegador.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              {deferredPrompt ? (
                <Button variant="orange" size="xl" onClick={install}>
                  <Download className="h-5 w-5" />
                  Instalar app agora
                </Button>
              ) : isIOS ? (
                <div className="bg-white rounded-xl p-4 max-w-md shadow-card text-navy-900">
                  <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                    <Share2 className="h-4 w-4 text-spotorange-500" />
                    Como instalar no iPhone
                  </div>
                  <ol className="text-xs space-y-1 text-ink-600">
                    <li>1. Toca no botão <strong>Compartilhar</strong> (caixinha com seta)</li>
                    <li>2. Rola até <strong>"Adicionar à Tela de Início"</strong></li>
                    <li>3. Toca em <strong>Adicionar</strong></li>
                  </ol>
                </div>
              ) : (
                <Button variant="orange" size="xl" disabled>
                  <Plus className="h-5 w-5" />
                  Use o menu do navegador → "Instalar app"
                </Button>
              )}
            </div>
          </div>

          {/* Mockup celular branco — CONTRASTE com fundo azul */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative">
              <div className="w-64 h-[500px] bg-white rounded-[40px] shadow-card-hover p-3 border-8 border-navy-950">
                <div className="w-full h-full bg-gradient-to-br from-navy-50 to-white rounded-[28px] overflow-hidden relative p-4">
                  {/* Status bar */}
                  <div className="flex items-center justify-between mb-4 text-xs font-bold text-navy-900">
                    <span>09:41</span>
                    <span>●●●●●</span>
                  </div>

                  {/* App header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="font-black text-lg">
                      <span className="text-navy-900">SPOT</span>
                      <span className="text-spotorange-500">LOG</span>
                    </div>
                    <div className="grid h-7 w-7 place-items-center rounded-full bg-navy-100 text-xs font-bold text-navy-900">A</div>
                  </div>

                  {/* Card métrica */}
                  <div className="bg-navy-900 text-white rounded-2xl p-4 mb-3">
                    <div className="text-xs uppercase tracking-wider opacity-80">Hoje</div>
                    <div className="text-2xl font-bold mt-1">12 entregas</div>
                    <div className="text-xs mt-2 opacity-80">SLA cumprido 98%</div>
                  </div>

                  {/* Lista de entregas */}
                  <div className="space-y-2">
                    {[
                      { code: "#SP-2046", status: "Entregue", color: "bg-success-500" },
                      { code: "#SP-2047", status: "Em rota", color: "bg-spotorange-500" },
                      { code: "#SP-2048", status: "Coletado", color: "bg-navy-700" },
                    ].map((d) => (
                      <div key={d.code} className="bg-white border border-ink-200 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-navy-900">{d.code}</div>
                          <div className="text-xs text-ink-500">Pedido</div>
                        </div>
                        <div className={`text-xs font-bold text-white ${d.color} px-2 py-0.5 rounded-full`}>
                          {d.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Bolinha laranja decorativa */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-navy-950 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import Image from "next/image";
import {
  Pill,
  ShieldCheck,
  Thermometer,
  GraduationCap,
  UserCheck,
  ArrowRight,
  Heart,
  CheckCircle2,
  Snowflake,
  Package,
  FlaskConical,
  ClipboardCheck,
  Sparkles,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CtaBanner } from "@/components/public/cta-banner";

export const metadata = {
  title: "Transporte Farmacêutico com AFE Anvisa",
  description:
    "A Spotlog possui AFE — Autorização de Funcionamento para Transporte da Anvisa, com farmacêutico responsável e controle contínuo para medicamentos, termolábeis e correlatos.",
};

const garantias = [
  {
    icon: UserCheck,
    title: "Farmacêutico responsável",
    desc: "Acompanha desde o início do processo, garantindo conformidade técnica e treinamento da equipe.",
  },
  {
    icon: Thermometer,
    title: "Controle de temperatura",
    desc: "Temperatura adequada para o transporte de termolábeis, com monitoramento contínuo.",
  },
  {
    icon: GraduationCap,
    title: "Treinamento contínuo",
    desc: "Equipe capacitada permanentemente nos critérios sanitários, de limpeza e manuseio.",
  },
];

const cuidados = [
  "Veículos e locais de armazenagem rigidamente controlados em temperatura e pressão",
  "Licenças Sanitárias sempre atualizadas, sem risco de multas ou suspensões",
  "Critérios de limpeza exigidos pela legislação farmacêutica",
  "Temperatura adequada para o transporte de termolábeis",
  "Controle efetivo e contínuo da operação ponta a ponta",
  "Equipe treinada continuamente sob supervisão farmacêutica",
];

const transportamos = [
  {
    icon: Pill,
    title: "Medicamentos",
    desc: "Transporte com cuidados específicos de manuseio, temperatura e rastreabilidade.",
  },
  {
    icon: Snowflake,
    title: "Termolábeis",
    desc: "Produtos sensíveis à temperatura — operação com controle térmico contínuo.",
  },
  {
    icon: FlaskConical,
    title: "Correlatos",
    desc: "Materiais hospitalares, descartáveis e insumos da cadeia da saúde.",
  },
];

export default function FarmaPage() {
  return (
    <div>
      {/* HERO */}
      <section className="relative pt-32 lg:pt-44 pb-16 lg:pb-24 bg-gradient-soft hero-pattern overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="container relative">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-spotorange-50 px-4 py-1.5 mb-6 border border-spotorange-200">
                <ShieldCheck className="h-3.5 w-3.5 text-spotorange-600" />
                <span className="text-xs font-semibold text-spotorange-700">
                  AFE Anvisa — Autorização de Funcionamento para Transporte
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-navy-950 leading-[1.1] text-balance">
                Transporte Farmacêutico com{" "}
                <span className="text-gradient-spotlog">AFE Anvisa.</span>
              </h1>
              <p className="mt-6 text-lg lg:text-xl text-ink-700 max-w-2xl leading-relaxed font-medium">
                Acreditamos que, transportando medicamentos, estamos também
                transportando a vida.
              </p>
              <p className="mt-4 text-base text-ink-600 max-w-2xl leading-relaxed">
                Sendo um dos serviços oferecidos pela Spotlog, o Transporte
                Farmacêutico merece maior atenção e cuidado da empresa. Garantimos
                a excelência das nossas operações nesse setor, cumprindo e mantendo
                serviços sempre adequados às indicações e legislações vigentes.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button variant="orange" size="xl" asChild>
                  <Link href="/contato?segment=farma">
                    Falar com especialista farma
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="xl" asChild>
                  <Link href="#anvisa">Ver autorização Anvisa</Link>
                </Button>
              </div>
            </div>

            <div className="lg:col-span-6 relative">
              <div className="aspect-[5/4] rounded-3xl overflow-hidden shadow-card bg-navy-100 relative">
                <Image
                  src="https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=900&q=85"
                  alt="Transporte farmacêutico Spotlog"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 to-transparent" />
              </div>

              {/* Card flutuante AFE */}
              <div className="absolute -bottom-8 -left-6 lg:-left-12 bg-white rounded-2xl shadow-card border-2 border-spotorange-500 p-5 hidden md:flex items-center gap-4 max-w-sm">
                <div className="relative h-16 w-16 shrink-0">
                  <Image
                    src="/images/anvisa-logo.png"
                    alt="Logo Anvisa"
                    fill
                    sizes="64px"
                    className="object-contain"
                  />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-bold text-spotorange-600">
                    Autorização oficial
                  </div>
                  <div className="text-sm font-bold text-navy-900 leading-snug">
                    AFE da Anvisa para Transporte de Medicamentos
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 bg-gradient-to-br from-spotorange-500 to-spotorange-600 rounded-2xl shadow-orange-glow p-4 text-white hidden md:block">
                <Heart className="h-6 w-6 mb-2" />
                <div className="text-[10px] uppercase tracking-wider font-semibold opacity-80">
                  Cuidado farma
                </div>
                <div className="text-sm font-bold leading-tight">
                  Transportando<br />vidas
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BLOCO GIGANTE ANVISA — DESTAQUE PRINCIPAL */}
      <section
        id="anvisa"
        className="py-20 lg:py-28 bg-navy-900 relative overflow-hidden"
      >
        <div className="absolute inset-0 dot-grid opacity-10" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-spotorange-500/10 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl" />

        <div className="container relative">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Coluna esquerda: logo + título */}
            <div className="lg:col-span-5 lg:sticky lg:top-32">
              <div className="bg-white rounded-3xl p-8 shadow-card border-4 border-spotorange-500 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-spotorange-500 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1 rounded-full shadow-orange-glow">
                  Autorização oficial
                </div>
                <div className="relative h-32 lg:h-40 mb-5 mt-2">
                  <Image
                    src="/images/anvisa-logo.png"
                    alt="Logo oficial Anvisa — Agência Nacional de Vigilância Sanitária"
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-contain"
                  />
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 rounded-full bg-spotorange-50 px-3 py-1 mb-3 border border-spotorange-200">
                    <ShieldCheck className="h-3.5 w-3.5 text-spotorange-600" />
                    <span className="text-[11px] font-bold text-spotorange-700 uppercase tracking-wider">
                      AFE Anvisa
                    </span>
                  </div>
                  <div className="text-lg font-bold text-navy-950 leading-tight">
                    Autorização de Funcionamento para Transporte
                  </div>
                  <p className="text-sm text-ink-600 mt-2 leading-relaxed">
                    A Spotlog cumpre todos os requisitos da Anvisa para o
                    transporte de medicamentos, termolábeis e correlatos.
                  </p>
                </div>
              </div>
            </div>

            {/* Coluna direita: explicação */}
            <div className="lg:col-span-7 text-white">
              <h2 className="text-3xl lg:text-5xl font-bold tracking-tight leading-tight mb-6 text-balance">
                Autorização Anvisa para o transporte de medicamentos.
              </h2>

              <p className="text-base lg:text-lg text-ink-200 leading-relaxed mb-5">
                A Anvisa — Agência Nacional de Vigilância Sanitária, é o órgão
                que faz todo controle, regulamenta e fiscaliza todas as áreas de
                interesse da saúde: farmácias, açougues, supermercados,
                distribuidores, fornecedores, hospitais, clínicas e claro, as
                transportadoras que, por sua vez, fazem a ligação de todos os
                demais setores.
              </p>

              <p className="text-base lg:text-lg text-ink-200 leading-relaxed mb-5">
                Buscando sempre oferecer maior gama de serviços, qualidade e
                segurança, a{" "}
                <strong className="text-white">
                  Spotlog possui AFE (Autorização de Funcionamento para
                  Transporte) da Anvisa.
                </strong>
              </p>

              <p className="text-base lg:text-lg text-ink-200 leading-relaxed mb-5">
                A AFE da Agência Nacional de Vigilância Sanitária é um documento
                que valida todas as informações em que a empresa está autorizada
                a exercer e suas atividades estão descritas no documento. A AFE
                garante que a Spotlog cumpre todos os requisitos para efetuar o
                transporte de{" "}
                <span className="text-spotorange-400 font-semibold">
                  medicamentos, termolábeis e correlatos.
                </span>
              </p>

              <p className="text-base lg:text-lg text-ink-200 leading-relaxed mb-8">
                Para isso, contamos com um{" "}
                <strong className="text-white">
                  farmacêutico responsável acompanhando desde o início do
                  processo
                </strong>
                , garantindo treinamento constante à equipe responsável,
                critérios de limpeza exigidos, temperatura adequada para o
                transporte de termolábeis, mantendo controle efetivo e contínuo,
                a fim de garantir a integridade dos itens.
              </p>

              {/* 3 cards de garantias */}
              <div className="grid sm:grid-cols-3 gap-4">
                {garantias.map((g) => (
                  <div
                    key={g.title}
                    className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5 hover:border-spotorange-500 transition-colors"
                  >
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-spotorange-500 mb-3">
                      <g.icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1.5 leading-snug">
                      {g.title}
                    </h3>
                    <p className="text-xs text-ink-200 leading-relaxed">
                      {g.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CUIDADOS NO TRANSPORTE */}
      <section className="py-20 lg:py-28">
        <div className="container">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5">
              <div className="text-sm font-semibold text-spotorange-600 uppercase tracking-wider mb-3">
                Cuidados no transporte
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-navy-950 tracking-tight text-balance mb-5">
                Rigidez técnica que protege{" "}
                <span className="text-gradient-spotlog">cada item transportado.</span>
              </h2>
              <p className="text-lg text-ink-600 leading-relaxed">
                É importante considerar que os veículos e locais de armazenagem
                devem ser rigidamente controlados em questões de temperatura e
                pressão, evitando a possibilidade de danos nos produtos. É
                necessário que as empresas transportadoras de materiais
                farmacêuticos tenham sempre suas Licenças Sanitárias atualizadas,
                impedindo aplicações de multas ou suspensões nos serviços.
              </p>
            </div>

            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-3">
              {cuidados.map((c) => (
                <div
                  key={c}
                  className="flex items-start gap-3 bg-white border-2 border-ink-100 hover:border-spotorange-500 rounded-2xl p-4 transition-colors"
                >
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-success-500 shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-sm text-navy-900 font-medium leading-relaxed">
                    {c}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* O QUE TRANSPORTAMOS */}
      <section className="py-20 lg:py-28 bg-navy-50/40">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="text-sm font-semibold text-spotorange-600 uppercase tracking-wider mb-3">
              O que transportamos
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-navy-950 tracking-tight text-balance">
              Operação preparada para{" "}
              <span className="text-gradient-spotlog">a cadeia da saúde.</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {transportamos.map((t) => (
              <div key={t.title} className="card-glow p-7 group text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-spotorange-50 group-hover:bg-spotorange-500 transition-colors mb-5">
                  <t.icon className="h-8 w-8 text-spotorange-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-navy-900 mb-2">{t.title}</h3>
                <p className="text-sm text-ink-600 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 lg:py-28 bg-navy-950 relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-10" />
        <div className="container relative max-w-4xl text-center text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-spotorange-500/20 px-4 py-1.5 mb-6 border border-spotorange-500/40">
            <Activity className="h-3.5 w-3.5 text-spotorange-400" />
            <span className="text-xs font-semibold text-spotorange-300 uppercase tracking-wider">
              Logística farma de confiança
            </span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold tracking-tight mb-5 text-balance">
            Sua operação farmacêutica em{" "}
            <span className="text-spotorange-400">boas mãos.</span>
          </h2>
          <p className="text-lg text-ink-200 leading-relaxed mb-8 max-w-2xl mx-auto">
            Fale com nosso time comercial e conheça como a Spotlog pode estruturar
            o transporte de medicamentos, termolábeis e correlatos da sua empresa.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="orange" size="xl" asChild>
              <Link href="/contato?segment=farma">
                Solicitar proposta farma
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild className="bg-white/5 text-white border-white/30 hover:bg-white/10">
              <Link href="https://wa.me/5511963545529" target="_blank">
                Falar pelo WhatsApp
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <CtaBanner />
    </div>
  );
}

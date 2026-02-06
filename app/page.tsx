import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, ArrowRight, LayoutDashboard, ShieldCheck, Calendar, Quote } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">MentePsi</span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
            <a href="#recursos" className="hover:text-teal-600 transition-colors">Recursos</a>
            <a href="#precos" className="hover:text-teal-600 transition-colors">Planos</a>
            <a href="#sobre" className="hover:text-teal-600 transition-colors">Sobre</a>
          </nav>
          <div className="flex gap-4">
            <Button variant="ghost" asChild className="text-slate-600 hover:text-teal-600">
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-200/50">
              <Link href="/planos">Começar Grátis</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-12 lg:pt-32 lg:pb-16 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl lg:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 max-w-4xl mx-auto">
            Gestão Clínica Inteligente para <span className="text-teal-600">Psicólogos Modernos</span>
          </h1>
          <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Simplifique seus atendimentos, organize prontuários e automatize o financeiro. 
            Tudo o que você precisa para focar no que realmente importa: seus pacientes.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" asChild className="h-14 px-8 text-lg bg-teal-600 hover:bg-teal-700 text-white shadow-xl shadow-teal-200">
              <Link href="/planos">Criar Conta Gratuita <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-slate-300 text-slate-700 hover:bg-slate-50">
              Ver Demonstração
            </Button>
          </div>
          
          {/* Dashboard Preview Mockup */}
          <div className="mt-16 relative mx-auto max-w-5xl rounded-2xl border-4 border-slate-900/5 bg-slate-900/5 shadow-2xl lg:rotate-1 hover:rotate-0 transition-transform duration-700 ease-out">
             <div className="rounded-xl overflow-hidden bg-white border border-slate-200 aspect-video relative shadow-inner">
                <Image 
                  src="/dashboard-preview.png" 
                  alt="Preview do Dashboard MentePsi" 
                  fill 
                  className="object-cover object-top"
                  priority
                />
             </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="recursos" className="pt-12 pb-24 lg:pt-16 lg:pb-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Tudo em um só lugar</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Substitua planilhas e papéis por uma plataforma segura e intuitiva.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Calendar className="h-8 w-8 text-teal-600" />}
              title="Agenda Inteligente"
              description="Controle sessões, envie lembretes automáticos via WhatsApp e evite faltas."
            />
            <FeatureCard 
              icon={<ShieldCheck className="h-8 w-8 text-teal-600" />}
              title="Prontuário Seguro"
              description="Evoluções, anamneses e documentos com criptografia de ponta a ponta."
            />
            <FeatureCard 
              icon={<LayoutDashboard className="h-8 w-8 text-teal-600" />}
              title="Gestão Financeira"
              description="Controle pagamentos, emita recibos e visualize seu fluxo de caixa facilmente."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precos" className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Planos Transparentes</h2>
            <p className="text-slate-500">Comece grátis e evolua conforme sua clínica cresce.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard 
              title="Iniciante" 
              price="R$ 0" 
              features={['Até 3 Pacientes', 'Agenda Básica', 'Finaceiro Básico']} 
            />
            <PricingCard 
              title="Básico" 
              price="R$ 29,90" 
              highlight 
              features={[' Até 10 Pacientes', 'Agendamento Avançado', 'Financeiro Completo', 'Gestão de Documentos']} 
            />
            <PricingCard 
              title="Profissional" 
              price="R$ 59,90" 
              features={['Tudo do Básico','Pacientes Ilimitados', 'Relatórios Avançados IA', 'Lembretes Whatsapp', 'Portal do Paciente']} 
            />
          </div>
        </div>
      </section>

      {/* Sobre (Depoimento Dra. Aline) */}
      <section id="sobre" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12 max-w-5xl mx-auto">
            {/* Foto com moldura elegante */}
            <div className="w-full lg:w-1/3 flex justify-center">
              <div className="relative w-64 h-64 lg:w-80 lg:h-80 rounded-2xl overflow-hidden shadow-xl border-4 border-white ring-1 ring-slate-200 bg-slate-200 aspect-square">
                 <Image 
                   src="/aline-correa.png" 
                   alt="Dra. Aline Correa" 
                   fill 
                   className="object-cover"
                 />
              </div>
            </div>

            {/* Texto do Relato */}
            <div className="w-full lg:w-2/3 bg-teal-50/40 p-8 rounded-2xl border border-teal-100/50 space-y-6">
              <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                A tecnologia que humaniza meu consultório
              </h2>
              
              <div className="flex gap-4">
                <Quote className="h-8 w-8 text-teal-400 shrink-0 opacity-50" />
                <p className="text-lg text-slate-600 font-serif leading-relaxed italic">
                  "Olá, eu sou a Aline Correa. Como psicóloga, sempre busquei uma forma de organizar meus prontuários e agenda sem perder a essência do acolhimento. O MentePsi nasceu dessa busca. Desenvolvi esta ferramenta para resolver as dores reais do meu dia a dia clínico e, hoje, convido você a transformar sua gestão comigo."
                </p>
              </div>

              {/* Assinatura */}
              <div className="pl-12">
                <p className="font-bold text-slate-900 text-lg">
                  Dra. Aline Correa 
                  <span className="text-slate-400 font-normal mx-2">|</span> 
                  <span className="text-sm text-slate-500 font-medium">CRP: 06/12345</span>
                </p>
              </div>

              <div className="pt-2 pl-12">
                <Button size="lg" asChild className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-200/50 h-12 px-8 text-base">
                  <Link href="/planos">Comece sua jornada com o MentePsi</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-teal-600 rounded flex items-center justify-center text-white font-bold text-xs">M</div>
            <span className="font-semibold text-white">MentePsi</span>
          </div>
          <div className="text-sm">
            &copy; 2025 MentePsi. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-8 text-center flex flex-col items-center">
        <div className="mb-6 p-4 bg-teal-50 rounded-full">{icon}</div>
        <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
        <p className="text-slate-600 leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  )
}

function PricingCard({ title, price, features, highlight }: { title: string, price: string, features: string[], highlight?: boolean }) {
  return (
    <Card className={`border-2 ${highlight ? 'border-teal-500 shadow-2xl scale-105 relative z-10' : 'border-slate-100 shadow-md'} flex flex-col`}>
      {highlight && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-teal-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Mais Popular</div>}
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-lg font-medium text-slate-500">{title}</CardTitle>
        <div className="text-4xl font-bold text-slate-900 mt-2">{price}<span className="text-base font-normal text-slate-400">/mês</span></div>
      </CardHeader>
      <CardContent className="p-6 flex-1 flex flex-col">
        <ul className="space-y-4 mb-8 flex-1">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-3 text-slate-600 text-sm">
              <CheckCircle className="h-4 w-4 text-teal-500 shrink-0" /> {f}
            </li>
          ))}
        </ul>
        <Button className={`w-full ${highlight ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}>
          Escolher Plano
        </Button>
      </CardContent>
    </Card>
  )
}
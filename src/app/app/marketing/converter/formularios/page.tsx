import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default function FormulariosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-lg font-semibold">Formulários</h2>
        <div className="flex gap-2">
          <Button asChild variant="orange">
            <Link href="/app/marketing/converter/formularios/templates">Galeria de templates</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app/admin/forms">Ver formulários</Link>
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-white/10 bg-card/50 hover:border-[#BA0102]/40 transition">
          <CardContent className="p-6">
            <Sparkles className="h-8 w-8 text-[#BA0102] mb-3" />
            <h3 className="font-semibold mb-1">Começar com template</h3>
            <p className="text-sm text-muted-foreground mb-4">
              6 formulários prontos: cotação, demo, ebook, newsletter, abertura de conta, NPS.
            </p>
            <Button asChild variant="orange">
              <Link href="/app/marketing/converter/formularios/templates">Ver galeria</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-6">
            <FileText className="h-8 w-8 text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-1">Gerenciar formulários</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Edite, visualize submissões e configure os formulários da sua organização.
            </p>
            <Button asChild variant="outline">
              <Link href="/app/admin/forms">Ir pra área admin</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

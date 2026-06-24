import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings2, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default function CamposPersonalizadosPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Campos personalizados</h2>
      <Card className="border-white/10 bg-card/50">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Settings2 className="h-8 w-8 text-[#011960] shrink-0" />
            <div>
              <h3 className="font-semibold">Campos do CRM e formulários</h3>
              <p className="text-sm text-muted-foreground">
                Os campos personalizados de leads são geridos no construtor de formulários e nos
                <em> custom_fields</em> de contatos / negociações. Use os links abaixo:
              </p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button asChild variant="outline">
              <Link href="/app/admin/forms">
                <ExternalLink className="h-4 w-4" /> Construtor de formulários
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/app/contatos">
                <ExternalLink className="h-4 w-4" /> Campos em contatos
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

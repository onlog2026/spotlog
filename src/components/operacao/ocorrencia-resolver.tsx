"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2 } from "lucide-react";
import { resolverOcorrencia } from "@/app/app/operacao/ocorrencias/actions";

type Props = {
  id: string;
  shipmentCode?: string | null;
  category: string;
  description: string | null;
  status: string;
};

export function OcorrenciaResolver(props: Props) {
  const [open, setOpen] = useState(false);
  const closed = props.status === "resolvida" || props.status === "cancelada";

  async function action(formData: FormData) {
    await resolverOcorrencia(formData);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          {closed ? "Ver" : "Resolver"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-spotorange-500" aria-hidden />
            Ocorrência {props.shipmentCode ? `· ${props.shipmentCode}` : ""}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Categoria
            </div>
            <div className="font-medium capitalize">{props.category}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Descrição
            </div>
            <p>{props.description ?? "(sem descrição)"}</p>
          </div>
        </div>
        {!closed ? (
          <form action={action} className="space-y-3 pt-2">
            <input type="hidden" name="occurrence_id" value={props.id} />
            <div>
              <Label htmlFor="resolution_notes">Notas de resolução</Label>
              <Textarea
                id="resolution_notes"
                name="resolution_notes"
                rows={4}
                placeholder="Como o caso foi resolvido?"
              />
            </div>
            <DialogFooter>
              <Button type="submit" variant="orange">
                <CheckCircle2 className="h-4 w-4" />
                Marcar como resolvida
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <p className="text-xs text-muted-foreground pt-2">
            Esta ocorrência já está {props.status}.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

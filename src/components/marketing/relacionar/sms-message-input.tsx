"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function SmsMessageInput({ name = "message", maxLen = 160 }: { name?: string; maxLen?: number }) {
  const [value, setValue] = useState("");
  const remaining = maxLen - value.length;
  const over = remaining < 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label htmlFor={name}>Mensagem *</Label>
        <span className={`text-xs ${over ? "text-red-400" : "text-muted-foreground"}`}>
          {value.length}/{maxLen}
        </span>
      </div>
      <Textarea
        id={name}
        name={name}
        rows={4}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Sua mensagem SMS"
        required
      />
      {over && (
        <p className="text-[11px] text-red-400">
          Mais de {maxLen} caracteres — será cobrado como múltiplos SMS pelo provedor
        </p>
      )}
    </div>
  );
}

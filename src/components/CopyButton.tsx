"use client";

import { Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="btn-secondary inline-flex items-center gap-2"
      title="Скопировать сообщение"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }}
    >
      <Copy className="h-4 w-4" />
      {copied ? "Скопировано" : "Скопировать"}
    </button>
  );
}

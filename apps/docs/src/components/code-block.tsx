"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
}

interface Token {
  type: "keyword" | "string" | "comment" | "number" | "punctuation" | "type" | "function" | "plain";
  value: string;
}

const keywords = new Set([
  "import", "export", "from", "const", "let", "var", "function", "return",
  "if", "else", "async", "await", "default", "type", "interface", "extends",
  "implements", "class", "new", "this", "try", "catch", "throw", "typeof",
  "satisfies", "for", "while", "do", "switch", "case", "break", "continue",
  "in", "of", "as", "is", "keyof", "readonly", "static", "public", "private",
  "protected", "abstract", "declare", "namespace", "module", "enum", "true", "false"
]);

const types = new Set([
  "string", "number", "boolean", "void", "null", "undefined", "any", "never",
  "Response", "Request", "Promise", "React", "User", "Metadata", "MiddlewareConfig",
  "Array", "Object", "Map", "Set", "Error", "Date", "RegExp", "JSON", "FormData",
  "Headers", "URL", "URLSearchParams", "Blob", "File", "ReadableStream", "WritableStream"
]);

function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < code.length) {
    // Comments
    if (code.slice(i, i + 2) === "//") {
      let end = code.indexOf("\n", i);
      if (end === -1) end = code.length;
      tokens.push({ type: "comment", value: code.slice(i, end) });
      i = end;
      continue;
    }

    if (code.slice(i, i + 2) === "/*") {
      let end = code.indexOf("*/", i + 2);
      if (end === -1) end = code.length;
      else end += 2;
      tokens.push({ type: "comment", value: code.slice(i, end) });
      i = end;
      continue;
    }

    // Strings
    if (code[i] === '"' || code[i] === "'" || code[i] === "`") {
      const quote = code[i];
      let j = i + 1;
      while (j < code.length) {
        if (code[j] === "\\") {
          j += 2;
          continue;
        }
        if (code[j] === quote) {
          j++;
          break;
        }
        j++;
      }
      tokens.push({ type: "string", value: code.slice(i, j) });
      i = j;
      continue;
    }

    // Numbers
    if (/\d/.test(code[i])) {
      let j = i;
      while (j < code.length && /[\d.xXa-fA-F]/.test(code[j])) j++;
      tokens.push({ type: "number", value: code.slice(i, j) });
      i = j;
      continue;
    }

    // Identifiers and keywords
    if (/[a-zA-Z_$]/.test(code[i])) {
      let j = i;
      while (j < code.length && /[a-zA-Z0-9_$]/.test(code[j])) j++;
      const word = code.slice(i, j);
      
      // Check if followed by ( for function detection
      let nextNonSpace = j;
      while (nextNonSpace < code.length && code[nextNonSpace] === " ") nextNonSpace++;
      const isFunction = code[nextNonSpace] === "(";

      if (keywords.has(word)) {
        tokens.push({ type: "keyword", value: word });
      } else if (types.has(word)) {
        tokens.push({ type: "type", value: word });
      } else if (isFunction) {
        tokens.push({ type: "function", value: word });
      } else {
        tokens.push({ type: "plain", value: word });
      }
      i = j;
      continue;
    }

    // Punctuation
    if (/[{}[\]();:,.<>+\-*/%=!&|?@#~^]/.test(code[i])) {
      tokens.push({ type: "punctuation", value: code[i] });
      i++;
      continue;
    }

    // Everything else (whitespace, etc)
    tokens.push({ type: "plain", value: code[i] });
    i++;
  }

  return tokens;
}

function getTokenClass(type: Token["type"]): string {
  switch (type) {
    case "keyword":
      return "text-pink-400";
    case "string":
      return "text-emerald-400";
    case "comment":
      return "text-muted-foreground/60 italic";
    case "number":
      return "text-amber-400";
    case "type":
      return "text-cyan-400";
    case "function":
      return "text-sky-400";
    case "punctuation":
      return "text-muted-foreground";
    default:
      return "text-foreground";
  }
}

function HighlightedLine({ line }: { line: string }) {
  const tokens = useMemo(() => tokenize(line), [line]);

  return (
    <>
      {tokens.map((token, i) => (
        <span key={i} className={getTokenClass(token.type)}>
          {token.value}
        </span>
      ))}
    </>
  );
}

export function CodeBlock({
  code,
  language = "typescript",
  filename,
  showLineNumbers = true,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split("\n");

  return (
    <div className="group relative rounded-lg border border-border/50 bg-code-bg overflow-hidden">
      {filename && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-secondary/30">
          <span className="text-sm text-muted-foreground font-mono">
            {filename}
          </span>
          <span className="text-xs text-muted-foreground/60 uppercase tracking-wider">
            {language}
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={copyToClipboard}
        className={cn(
          "absolute top-2 right-2 p-2 rounded-md transition-all duration-200",
          "bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground",
          "opacity-0 group-hover:opacity-100",
          filename && "top-12"
        )}
        aria-label="Copy code"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
      </button>

      <div className="overflow-x-auto">
        <pre className="p-4 text-sm leading-relaxed">
          <code className="font-mono">
            {lines.map((line, i) => (
              <div key={i} className="flex min-h-[1.5em]">
                {showLineNumbers && (
                  <span className="select-none text-muted-foreground/40 w-8 text-right pr-4 shrink-0">
                    {i + 1}
                  </span>
                )}
                <span className="flex-1 whitespace-pre">
                  {line ? <HighlightedLine line={line} /> : "\u00A0"}
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}

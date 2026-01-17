import React from "react";
import { Highlight, themes, type Language } from "prism-react-renderer";
import { Copy, Check, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

export function CodeBlock({ code, language = "typescript", filename }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 relative overflow-hidden rounded-xl border border-white/10 bg-[#0e0e0e] shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-4 py-3">
        <div className="flex items-center gap-3">
           {!filename && (
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                <div className="h-3 w-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                <div className="h-3 w-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
              </div>
           )}
           {filename && (
             <span className="text-xs font-medium text-muted-foreground flex items-center gap-2">
               <Terminal className="h-3 w-3" /> {filename}
             </span>
           )}
        </div>
        <div className="flex gap-2">
           <Button 
             variant="ghost" 
             size="icon" 
             className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-white/10" 
             onClick={copy}
           >
              {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
           </Button>
        </div>
      </div>

      {/* Code Editor */}
      <div className="p-4 overflow-x-auto text-sm font-mono leading-relaxed">
        <Highlight
          theme={themes.vsDark}
          code={code.trim()}
          language={language as Language}
        >
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre style={{ ...style, background: "transparent" }}>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  <span className="inline-block w-8 select-none text-white/20 text-xs text-right mr-4">{i + 1}</span>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  );
}

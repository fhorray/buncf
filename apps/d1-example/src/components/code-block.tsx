import { useState } from 'react';
import { Highlight, themes, type Language } from 'prism-react-renderer';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeBlock({
  code,
  language = 'typescript',
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`relative group rounded-md overflow-hidden border border-white/5 bg-[#0d1117] ${className}`}
    >
      <button
        onClick={onCopy}
        className="absolute right-3 top-3 p-1.5 rounded-md text-muted-foreground hover:bg-white/10 hover:text-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Copy code"
      >
        {copied ? (
          <Check size={14} className="text-green-400" />
        ) : (
          <Copy size={14} />
        )}
      </button>

      <div className="overflow-x-auto p-4 font-mono text-sm leading-relaxed">
        <Highlight
          theme={themes.palenight}
          code={code.trim()}
          language={language as Language}
        >
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre
              className={className}
              style={{ ...style, backgroundColor: 'transparent' }}
            >
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  <span className="inline-block w-8 select-none text-muted-foreground/30 text-right mr-4 text-xs">
                    {i + 1}
                  </span>
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

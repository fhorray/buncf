import React from 'react';
import { Link } from 'buncf/router';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function SectionHeading({
  id,
  children,
  icon: Icon,
}: {
  id: string;
  children: React.ReactNode;
  icon?: React.ElementType;
}) {
  return (
    <h2
      id={id}
      className="scroll-mt-24 text-2xl font-bold mb-4 flex items-center gap-3 group"
    >
      {Icon && (
        <div className="w-8 h-8 rounded-lg bg-neon/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-neon" />
        </div>
      )}
      {children}
      <a
        href={`#${id}`}
        className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
      >
        #
      </a>
    </h2>
  );
}

export function SubHeading({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h3 id={id} className="scroll-mt-24 text-xl font-semibold mb-3 mt-8 group">
      {children}
      <a
        href={`#${id}`}
        className="ml-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
      >
        #
      </a>
    </h3>
  );
}

export function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground leading-relaxed mb-4">{children}</p>
  );
}

export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 bg-secondary rounded text-neon font-mono text-sm">
      {children}
    </code>
  );
}

export function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto mb-6">
      <table className="w-full text-sm border border-border/50 rounded-lg overflow-hidden">
        {children}
      </table>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="mb-10 pb-6 border-b border-border/50">
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-neon/10 flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-neon" />
        </div>
      )}
      <h1 className="text-3xl md:text-4xl font-bold mb-3">{title}</h1>
      <p className="text-lg text-muted-foreground max-w-2xl">{description}</p>
    </div>
  );
}

export function DocNavigation({
  prev,
  next,
}: {
  prev?: { href: string; label: string };
  next?: { href: string; label: string };
}) {
  return (
    <div className="mt-16 pt-8 border-t border-border/50 flex justify-between gap-4">
      {prev ? (
        <Link
          href={prev.href}
          className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border/50 hover:bg-secondary/50 hover:border-neon/30 transition-all group flex-1 max-w-xs"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-neon transition-colors" />
          <div className="text-left">
            <div className="text-xs text-muted-foreground">Previous</div>
            <div className="font-medium group-hover:text-neon transition-colors">
              {prev.label}
            </div>
          </div>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={next.href}
          className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border/50 hover:bg-secondary/50 hover:border-neon/30 transition-all group flex-1 max-w-xs ml-auto text-right"
        >
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">Next</div>
            <div className="font-medium group-hover:text-neon transition-colors">
              {next.label}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-neon transition-colors" />
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}

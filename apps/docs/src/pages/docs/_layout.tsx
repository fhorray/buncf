import React from "react";
import { Link, usePathname } from "buncf/router";
import { ScrollArea } from "@/components/ui/scroll-area";

import { docsConfig } from "@/config/docs";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
      <div className="container mx-auto flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 max-w-screen-2xl px-4 md:px-8">
        
        {/* Sidebar */}
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
          <ScrollArea className="h-full py-6 pr-6 lg:py-8">
            <div className="w-full">
              {docsConfig.sidebarNav.map((section, index) => (
                <div key={index} className="pb-4">
                  <h4 className="mb-1 rounded-md px-2 py-1 text-sm font-semibold">{section.title}</h4>
                  <div className="grid grid-flow-row auto-rows-max text-sm">
                    {section.items.map((item, i) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={i}
                                href={item.href}
                                className={`group flex w-full items-center rounded-md border border-transparent px-2 py-1.5 hover:underline ${isActive ? "font-medium text-pink-500 bg-pink-500/10" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                {isActive && <span className="mr-2 h-1.5 w-1.5 rounded-full bg-pink-500"></span>}
                                {item.title}
                            </Link>
                        )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Content */}
        <main className="relative py-6 lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_200px]">
          <div className="mx-auto w-full min-w-0">
             {children}
          </div>
          
          {/* Right Sidebar (Table of Contents) - Hidden on smaller screens */}
          <div className="hidden text-sm xl:block">
            <div className="sticky top-16 -mt-10 h-[calc(100vh-3.5rem)] overflow-hidden pt-6">
                <ScrollArea className="pb-10 pl-4 border-l border-border/50">
                    <div className="space-y-2">
                        <p className="font-medium text-foreground">On this page</p>
                        <ul className="m-0 list-none text-muted-foreground">
                            {/* TODO: Auto-generate TOC */}
                            <li className="mt-0 pt-2"><a href="#" className="inline-block no-underline hover:text-foreground">Overview</a></li>
                        </ul>
                    </div>
                </ScrollArea>
            </div>
          </div>
        </main>
      </div>
  );
}

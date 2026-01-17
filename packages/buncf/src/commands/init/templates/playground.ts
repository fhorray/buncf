
export const playgroundPage = `
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Zap, Layout, Play, RefreshCcw } from "lucide-react";

export default function PlaygroundPage() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12">
      <section className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Playground</h1>
        <p className="text-muted-foreground text-lg">
          Experiment with your newly generated Shadcn UI components.
        </p>
      </section>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Different variants and sizes.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button onClick={() => setCount(c => c + 1)}>Count: {count}</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </CardContent>
        </Card>

        {/* Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Forms</CardTitle>
            <CardDescription>Input and Label components.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="enter your email..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Submit</Button>
          </CardFooter>
        </Card>
      </div>

      {/* Table Example */}
      <Card>
        <CardHeader>
          <CardTitle>Data Table</CardTitle>
          <CardDescription>A simple table using Shadcn components.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">File Routing</TableCell>
                <TableCell><span className="text-green-500 font-medium">Active</span></TableCell>
                <TableCell>Mapped to src/pages</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Tailwind 4</TableCell>
                <TableCell><span className="text-green-500 font-medium">Active</span></TableCell>
                <TableCell>Native CSS-first styling</TableCell>
              </TableRow>
               <TableRow>
                <TableCell className="font-medium">Cloudflare Context</TableCell>
                <TableCell><span className="text-blue-500 font-medium">Ready</span></TableCell>
                <TableCell>Access D1, KV from handlers</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
`;

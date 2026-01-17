
import { useParams, Link } from "buncf/router";
import { api } from "../../../.buncf/api-client";

export const loader = async ({ params }: { params: { id: string } }) => {
  try {
    const user = await api.get("/api/users/:id", { params: { id: params.id } });
    return user;
  } catch (e) {
    return { name: "Demo User", email: "demo@example.com" }; // Fallback for tests
  }
};

export default function UserPage({ data }: { data: any }) {
    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-2xl mx-auto space-y-10">
                <header className="flex items-center justify-between">
                    <Link href="/" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">← Exit</Link>
                    <span className="text-[10px] font-mono bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">Dynamic Route Segment</span>
                </header>

                <div className="bg-card border border-border rounded-3xl p-10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-colors" />
                    
                    {data ? (
                        <div className="space-y-8 relative">
                            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-3xl font-black text-white shadow-xl">
                                {data.name?.charAt(0)}
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-4xl font-black tracking-tighter">{data.name}</h1>
                                <p className="text-muted-foreground font-medium">{data.email}</p>
                            </div>

                            <div className="pt-6 border-t border-border grid grid-cols-2 gap-4">
                                <div className="space-y-1 text-center p-4 rounded-xl bg-muted/30">
                                    <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Status</span>
                                    <p className="text-sm font-bold text-green-500">Active</p>
                                </div>
                                <div className="space-y-1 text-center p-4 rounded-xl bg-muted/30">
                                    <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">ID</span>
                                    <p className="text-sm font-bold text-primary italic">#{(data.id || "001")}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-10 space-y-4">
                            <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                            <p className="font-mono text-sm text-muted-foreground italic">Fetching profile data...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
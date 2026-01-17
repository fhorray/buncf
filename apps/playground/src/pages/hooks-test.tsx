
import { useFetcher } from "buncf/router";

// This is a pretend API endpoint
const API_URL = "https://jsonplaceholder.typicode.com/posts";

export default function HooksTest() {
    const loader = useFetcher<any[]>();
    const creator = useFetcher();

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-4xl mx-auto space-y-12">
                <header className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tight">Advanced Hooks</h1>
                    <p className="text-muted-foreground text-lg">Test the new <code>useFetcher</code> hook for data loading and mutations.</p>
                </header>
                
                <section className="bg-card border border-border rounded-3xl p-8 shadow-xl space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold tracking-tight">Sequential Loading</h2>
                        <button 
                            onClick={() => loader.load(API_URL)}
                            disabled={loader.state === "loading"}
                            className="h-10 px-6 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {loader.state === "loading" ? "Fetching..." : "Load Posts"}
                        </button>
                    </div>

                    <div className="rounded-2xl bg-black/40 border border-white/5 p-6 font-mono text-sm">
                        {loader.data ? (
                            <div className="space-y-4">
                                <p className="text-primary text-xs font-bold uppercase tracking-widest">Showing top 3 results:</p>
                                <pre className="text-foreground/80 overflow-x-auto whitespace-pre-wrap">
                                    {JSON.stringify(loader.data.slice(0, 3), null, 2)}
                                </pre>
                            </div>
                        ) : (
                            <p className="text-muted-foreground italic">No data loaded yet. Click to fetch JSONPlaceholder.</p>
                        )}
                    </div>
                </section>
                
                <hr className="border-border/50" />

                <section className="bg-card border border-border rounded-3xl p-8 shadow-xl space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold tracking-tight">Data Mutation (Submit)</h2>
                        <button 
                            onClick={() => creator.submit({ title: "Buncf Rocks", body: "File-system routing at its best", userId: 1 }, { method: "POST", action: API_URL })}
                            disabled={creator.state === "submitting"}
                            className="h-10 px-6 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {creator.state === "submitting" ? "Creating..." : "Create New Post"}
                        </button>
                    </div>

                    <div className="rounded-2xl bg-black/40 border border-white/5 p-6 font-mono text-sm">
                        <p className="text-xs font-bold uppercase tracking-widest text-green-500 mb-4">Response Status: {creator.state === "idle" && creator.data ? "201 Created" : creator.state}</p>
                        {creator.data ? (
                            <pre className="text-foreground/80 overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(creator.data, null, 2)}
                            </pre>
                        ) : (
                            <p className="text-muted-foreground italic">No response received. Submit a form to see API feedback.</p>
                        )}
                    </div>
                </section>

                <div className="flex justify-center pt-8">
                    <a href="/" className="text-sm font-bold text-primary hover:underline">← Back to Dashboard</a>
                </div>
            </div>
        </div>
    );
}

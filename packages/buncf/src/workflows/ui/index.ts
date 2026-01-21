export function renderDashboard() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Buncf Workflows</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <link href="https://rsms.me/inter/inter.css" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #ffffff; }
        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        
        .code-block { font-family: 'Menlo', 'Monaco', 'Courier New', monospace; font-size: 0.8rem; }
    </style>
</head>
<body class="text-gray-900 antialiased">
    <div id="root"></div>
    <script type="text/babel">
        const { useState, useEffect } = React;

        // --- Icons ---
        const RefreshIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
        const PlayIcon = () => <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        const CopyIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
        const ChevronDown = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>;
        const ChevronUp = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>;

        // --- Components ---

        function StatusBadge({ status }) {
            const safeStatus = status ? status.toLowerCase() : 'queued';
            
            const styles = {
                queued: "bg-gray-100 text-gray-600",
                running: "bg-blue-50 text-blue-700",
                paused: "bg-yellow-50 text-yellow-700",
                errored: "bg-red-50 text-red-700",
                terminated: "bg-red-50 text-red-700",
                complete: "bg-green-50 text-green-700", // Mais fiel ao "Completed" verde claro
                completed: "bg-green-50 text-green-700",
                sleeping: "bg-indigo-50 text-indigo-700",
                waiting: "bg-purple-50 text-purple-700"
            };

            const style = styles[safeStatus] || styles.queued;

            // Capitalize first letter
            const label = safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1);

            return (
                <span className={\`px-3 py-1 inline-flex text-xs font-medium rounded-full \${style}\`}>
                    {label}
                </span>
            );
        }

        function CodeViewer({ label, content, error }) {
            const [copied, setCopied] = useState(false);
            
            const handleCopy = (e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(content);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            };

            // Se content for objeto, stringify. Se for string, mantém.
            const displayContent = typeof content === 'object' ? JSON.stringify(content, null, 2) : content;
            const isEmpty = !displayContent || displayContent === '{}' || displayContent === 'null';

            return (
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-2">
                         <span className="text-sm font-medium text-gray-700">{label}</span>
                    </div>
                    <div className="relative group flex-1">
                        <pre className={\`code-block rounded-lg p-4 h-full overflow-auto min-h-[120px] max-h-[300px] border \${error ? 'bg-red-50 border-red-200 text-red-800' : 'bg-gray-100 border-transparent text-gray-800'}\`}>
                            {error ? error : (isEmpty ? 'N/A' : displayContent)}
                        </pre>
                        {!isEmpty && !error && (
                            <button 
                                onClick={handleCopy}
                                className="absolute top-2 right-2 p-1.5 rounded-md bg-white shadow-sm border border-gray-200 text-gray-500 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Copy to clipboard"
                            >
                                {copied ? <span className="text-xs font-bold text-green-600">Copied</span> : <CopyIcon />}
                            </button>
                        )}
                    </div>
                </div>
            );
        }

        function App() {
            const [instances, setInstances] = useState([]);
            const [selectedId, setSelectedId] = useState(null);
            const [steps, setSteps] = useState([]);
            const [loading, setLoading] = useState(false);
            const [stepsLoading, setStepsLoading] = useState(false);

            // Fetch Instances
            const refresh = async () => {
                setLoading(true);
                try {
                    const res = await fetch('/_buncf/workflows/api/instances');
                    const data = await res.json();
                    setInstances(Array.isArray(data) ? data : []);
                } catch(e) {
                    console.error("Fetch instances error", e);
                } finally {
                    setLoading(false);
                }
            };

            // Poll instances
            useEffect(() => {
                refresh();
                const interval = setInterval(refresh, 5000);
                return () => clearInterval(interval);
            }, []);

            // Fetch Steps when Instance Selected
            useEffect(() => {
                if (selectedId) {
                    setStepsLoading(true);
                    fetch(\`/_buncf/workflows/api/instances/\${selectedId}/steps\`)
                        .then(r => r.json())
                        .then(data => setSteps(Array.isArray(data) ? data : []))
                        .catch(err => {
                            console.error("Fetch steps error", err);
                            setSteps([]); 
                        })
                        .finally(() => setStepsLoading(false));
                } else {
                    setSteps([]);
                }
            }, [selectedId]);

            // --- Event Logic ---
            const [eventName, setEventName] = useState("");
            const [eventPayload, setEventPayload] = useState("{}");
            
            const sendEvent = async () => {
                if (!selectedId || !eventName) return;
                try {
                    await fetch(\`/_buncf/workflows/api/events/\${selectedId}/\${eventName}\`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: eventPayload
                    });
                    setEventName("");
                    setEventPayload("{}");
                    refresh();
                    alert("Event sent successfully");
                } catch (e) {
                    alert("Failed to send event: " + e.message);
                }
            };

            // Metrics
            const counts = {
                queued: instances.filter(i => i.status === 'queued').length,
                running: instances.filter(i => i.status === 'running').length,
                paused: instances.filter(i => i.status === 'paused').length,
                failed: instances.filter(i => ['errored', 'terminated'].includes(i.status)).length,
                complete: instances.filter(i => ['complete', 'completed'].includes(i.status)).length,
            };

            return (
                <div className="min-h-screen bg-white">
                    {/* Top Navigation / Breadcrumbs */}
                    <div className="border-b border-gray-200 bg-white">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="pt-5 pb-1">
                                <div className="flex items-center text-sm font-medium mb-4">
                                    <span className="text-gray-500 hover:text-gray-900 cursor-pointer underline decoration-transparent hover:decoration-gray-500 underline-offset-2 transition-all">Workflows</span>
                                    <span className="mx-2 text-gray-400">/</span>
                                    <span className="text-gray-900">report-workflow-staging</span>
                                </div>
                                
                                <div className="flex justify-between items-center mt-4">
                                    <div className="flex space-x-6">
                                        <button className="border-b-2 border-blue-600 pb-3 px-1 text-sm font-semibold text-gray-900">
                                            Instances
                                        </button>
                                        <button className="border-b-2 border-transparent pb-3 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors">
                                            Metrics
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        
                        {/* Controls Bar */}
                        <div className="flex flex-col sm:flex-row justify-end items-center gap-3 mb-6">
                            <select className="block w-full sm:w-auto pl-3 pr-8 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md border shadow-sm text-gray-700">
                                <option>Past 7 days</option>
                                <option>Past 24 hours</option>
                            </select>
                            <select className="block w-full sm:w-auto pl-3 pr-8 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md border shadow-sm text-gray-700">
                                <option>All</option>
                                <option>Running</option>
                                <option>Failed</option>
                            </select>
                             <button className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-1.5 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none transition-colors">
                                <span className="mr-2"><PlayIcon /></span> Trigger
                            </button>
                            <button onClick={refresh} className="p-2 text-gray-400 hover:text-gray-600 transition-colors" title="Refresh">
                                <RefreshIcon />
                            </button>
                        </div>

                        {/* Metrics Cards */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            {/* Stats Card */}
                            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                                <h3 className="text-sm font-medium text-gray-900 mb-4">Instances</h3>
                                <div className="grid grid-cols-5 gap-4">
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900">{counts.queued}</div>
                                        <div className="text-xs font-medium text-gray-500 mt-1">Queued</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900">{counts.running}</div>
                                        <div className="text-xs font-medium text-gray-500 mt-1">Running</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900">{counts.paused}</div>
                                        <div className="text-xs font-medium text-gray-500 mt-1">Paused</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900">{counts.failed}</div>
                                        <div className="text-xs font-medium text-gray-500 mt-1">Failed</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900">{counts.complete}</div>
                                        <div className="text-xs font-medium text-gray-500 mt-1">Complete</div>
                                    </div>
                                </div>
                            </div>

                            {/* Worker Card */}
                            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Bound Worker</h3>
                                <a href="#" className="text-base font-semibold text-blue-600 hover:underline">
                                    ncmec-reports-staging
                                </a>
                            </div>
                        </div>

                        {/* Instances List */}
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                            {/* Table Header */}
                            <div className="bg-gray-100 border-b border-gray-200 grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                                <div className="col-span-2">Status</div>
                                <div className="col-span-4">Instance Id</div>
                                <div className="col-span-2">Start time</div>
                                <div className="col-span-2">End time</div>
                                <div className="col-span-2 text-right">Wall Time</div>
                            </div>

                            {/* Table Body */}
                            <ul className="divide-y divide-gray-200">
                                {instances.length === 0 && !loading && (
                                    <li className="px-6 py-12 text-center text-gray-500 text-sm">
                                        No instances found.
                                    </li>
                                )}
                                {instances.map((instance) => {
                                    const isSelected = selectedId === instance.id;
                                    const start = new Date(instance.startTime);
                                    const end = instance.endTime ? new Date(instance.endTime) : null;
                                    const duration = end ? ((end - start) / 1000).toFixed(2) + 's' : '-';

                                    return (
                                        <li key={instance.id} className="group">
                                            <div 
                                                onClick={() => setSelectedId(isSelected ? null : instance.id)}
                                                className={\`grid grid-cols-12 gap-4 px-6 py-4 items-center cursor-pointer transition-colors \${isSelected ? 'bg-blue-50/40' : 'hover:bg-gray-50'}\`}
                                            >
                                                <div className="col-span-2"><StatusBadge status={instance.status} /></div>
                                                <div className="col-span-4 font-mono text-sm text-blue-600 hover:text-blue-800 truncate transition-colors">
                                                    {instance.id}
                                                </div>
                                                <div className="col-span-2 text-sm text-gray-600">{start.toLocaleString()}</div>
                                                <div className="col-span-2 text-sm text-gray-600">{end ? end.toLocaleString() : '-'}</div>
                                                <div className="col-span-2 text-sm text-gray-600 text-right font-mono">{duration}</div>
                                            </div>

                                            {/* Expanded Details */}
                                            {isSelected && (
                                                <div className="border-t border-gray-200 bg-white">
                                                    <div className="flex">
                                                        {/* Blue Left Border */}
                                                        <div className="w-1 bg-blue-600 shrink-0"></div>
                                                        
                                                        <div className="flex-1 p-6">
                                                            
                                                            {/* Step History Header */}
                                                            <div className="flex items-center justify-between mb-4">
                                                                <h3 className="text-lg font-bold text-gray-900">Step History</h3>
                                                                <span className="text-xs text-gray-500">
                                                                    Background Time: <span className="font-mono">{steps.reduce((acc, s) => acc + (s.endTime && s.startTime ? s.endTime - s.startTime : 0), 0)}ms</span>
                                                                </span>
                                                            </div>

                                                            {/* Step Table */}
                                                            <div className="border border-gray-200 rounded-md overflow-hidden mb-8">
                                                                <table className="min-w-full divide-y divide-gray-200">
                                                                    <thead className="bg-gray-100">
                                                                        <tr>
                                                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                                                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Start Time</th>
                                                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">End Time</th>
                                                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Step</th>
                                                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Retries</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                                        {stepsLoading && (
                                                                             <tr><td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-400">Loading steps...</td></tr>
                                                                        )}
                                                                        {!stepsLoading && steps.length === 0 && (
                                                                             <tr><td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-400">No steps recorded yet.</td></tr>
                                                                        )}
                                                                        {steps.map((step, idx) => (
                                                                            <tr key={idx} className="hover:bg-gray-50">
                                                                                <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={step.status} /></td>
                                                                                <td className="px-6 py-4 text-sm text-gray-500 font-mono">{new Date(step.startTime).toLocaleTimeString()}</td>
                                                                                <td className="px-6 py-4 text-sm text-gray-500 font-mono">{step.endTime ? new Date(step.endTime).toLocaleTimeString() : '-'}</td>
                                                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{step.name}</td>
                                                                                <td className="px-6 py-4 text-sm text-gray-500 font-mono">0</td> 
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>

                                                            {/* Output & Config Grid */}
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8" onClick={e => e.stopPropagation()}>
                                                                <CodeViewer 
                                                                    label="Output" 
                                                                    content={instance.output} 
                                                                    error={instance.error} 
                                                                />
                                                                <CodeViewer 
                                                                    label="Config / Params" 
                                                                    content={instance.params} 
                                                                />
                                                            </div>

                                                            {/* Send Event Action */}
                                                            {['waiting', 'sleeping'].includes(instance.status) && (
                                                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-6" onClick={e => e.stopPropagation()}>
                                                                    <h4 className="text-sm font-bold text-blue-900 mb-4 uppercase tracking-wider">Send Event to Instance</h4>
                                                                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                                                                        <div className="w-full sm:flex-1">
                                                                            <label className="block text-xs font-semibold text-blue-700 mb-1">Event Name</label>
                                                                            <input
                                                                                type="text"
                                                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                                                                placeholder="e.g. user_approval"
                                                                                value={eventName}
                                                                                onChange={e => setEventName(e.target.value)}
                                                                            />
                                                                        </div>
                                                                        <div className="w-full sm:flex-[2]">
                                                                            <label className="block text-xs font-semibold text-blue-700 mb-1">Payload (JSON)</label>
                                                                            <input
                                                                                type="text"
                                                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border font-mono"
                                                                                placeholder='{"approved": true}'
                                                                                value={eventPayload}
                                                                                onChange={e => setEventPayload(e.target.value)}
                                                                            />
                                                                        </div>
                                                                        <button
                                                                            onClick={sendEvent}
                                                                            className="w-full sm:w-auto inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                                        >
                                                                            Send Event
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                </div>
            );
        }

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
    </script>
</body>
</html>`;
}
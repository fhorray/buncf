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
    <script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>
    <style>
       body { background-color: #f9fafb; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        const { useState, useEffect } = React;

        function StatusBadge({ status }) {
            const colors = {
                queued: "bg-gray-100 text-gray-800",
                running: "bg-blue-100 text-blue-800",
                paused: "bg-yellow-100 text-yellow-800",
                errored: "bg-red-100 text-red-800",
                terminated: "bg-red-100 text-red-800",
                complete: "bg-green-100 text-green-800",
                sleeping: "bg-indigo-100 text-indigo-800",
                waiting: "bg-purple-100 text-purple-800"
            };
            return (
                <span className={\`px-2 inline-flex text-xs leading-5 font-semibold rounded-full \${colors[status] || "bg-gray-100 text-gray-800"}\`}>
                    {status}
                </span>
            );
        }

        function App() {
            const [instances, setInstances] = useState([]);
            const [selectedId, setSelectedId] = useState(null);
            const [steps, setSteps] = useState([]);

            const refresh = async () => {
                const res = await fetch('/_buncf/workflows/api/instances');
                const data = await res.json();
                setInstances(data);
            };

            useEffect(() => {
                refresh();
                const interval = setInterval(refresh, 2000);
                return () => clearInterval(interval);
            }, []);

            const [eventName, setEventName] = useState("");
            const [eventPayload, setEventPayload] = useState("{}");

            useEffect(() => {
                if (selectedId) {
                    fetch(\`/_buncf/workflows/api/instances/\${selectedId}/steps\`)
                        .then(r => r.json())
                        .then(setSteps);
                } else {
                    setSteps([]);
                }
            }, [selectedId, instances]);

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
                } catch (e) {
                    alert("Failed to send event: " + e.message);
                }
            };

            return (
                <div className="min-h-screen bg-gray-50">
                    <nav className="bg-white border-b border-gray-200">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex justify-between h-16">
                                <div className="flex">
                                    <div className="flex-shrink-0 flex items-center">
                                        <h1 className="text-xl font-bold text-gray-900">Buncf Workflows</h1>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                     <button onClick={refresh} className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                        Refresh
                                     </button>
                                </div>
                            </div>
                        </div>
                    </nav>

                    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                        {/* Summary Metrics (Mocked for now based on instances list) */}
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-5 mb-8">
                            {['queued', 'running', 'paused', 'errored', 'complete'].map(s => (
                                <div key={s} className="bg-white overflow-hidden shadow rounded-lg">
                                    <div className="px-4 py-5 sm:p-6">
                                        <dt className="text-sm font-medium text-gray-500 truncate capitalize">{s}</dt>
                                        <dd className="mt-1 text-3xl font-semibold text-gray-900">
                                            {instances.filter(i => i.status === s).length}
                                        </dd>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white shadow overflow-hidden sm:rounded-md">
                            <ul className="divide-y divide-gray-200">
                                <li className="px-4 py-4 sm:px-6 bg-gray-50 font-medium text-xs text-gray-500 uppercase tracking-wider grid grid-cols-6 gap-4">
                                    <div>Status</div>
                                    <div className="col-span-2">Instance ID / Workflow</div>
                                    <div>Start Time</div>
                                    <div>End Time</div>
                                    <div>Duration</div>
                                </li>
                                {instances.map((instance) => (
                                    <li key={instance.id} onClick={() => setSelectedId(instance.id === selectedId ? null : instance.id)} className="block hover:bg-gray-50 cursor-pointer transition duration-150 ease-in-out">
                                        <div className="px-4 py-4 sm:px-6 grid grid-cols-6 gap-4 items-center">
                                            <div><StatusBadge status={instance.status} /></div>
                                            <div className="col-span-2">
                                                <div className="text-sm font-medium text-indigo-600 truncate">{instance.id}</div>
                                                <div className="text-sm text-gray-500">{instance.workflowName}</div>
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {new Date(instance.startTime).toLocaleString()}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {instance.endTime ? new Date(instance.endTime).toLocaleString() : '-'}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {instance.endTime ? ((instance.endTime - instance.startTime) / 1000).toFixed(2) + 's' : '-'}
                                            </div>
                                        </div>
                                        {selectedId === instance.id && (
                                            <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t border-gray-200">
                                                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Steps</h3>
                                                 <div className="flex flex-col">
                                                    <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                                                        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                                                            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                                                                <table className="min-w-full divide-y divide-gray-200">
                                                                    <thead className="bg-gray-50">
                                                                        <tr>
                                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Output</th>
                                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                                        {steps.map((step) => (
                                                                            <tr key={step.id}>
                                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{step.name}</td>
                                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                                    <StatusBadge status={step.status} />
                                                                                    {step.error && <div className="text-xs text-red-500 mt-1">{step.error}</div>}
                                                                                </td>
                                                                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                                                    {step.output || '-'}
                                                                                </td>
                                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                                    {step.endTime ? ((step.endTime - step.startTime) / 1000).toFixed(2) + 's' : '-'}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-4">
                                                    <h4 className="text-md font-medium text-gray-900">Instance Params</h4>
                                                    <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-auto max-h-40">
                                                        {JSON.stringify(instance.params, null, 2)}
                                                    </pre>
                                                </div>
                                                 {instance.output && (
                                                    <div className="mt-4">
                                                        <h4 className="text-md font-medium text-gray-900">Instance Output</h4>
                                                        <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-auto max-h-40">
                                                            {JSON.stringify(instance.output, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                                {instance.error && (
                                                    <div className="mt-4">
                                                        <h4 className="text-md font-medium text-red-900">Instance Error</h4>
                                                        <pre className="bg-red-50 p-2 rounded text-xs mt-1 overflow-auto max-h-40 text-red-700">
                                                            {instance.error}
                                                        </pre>
                                                    </div>
                                                )}

                                                {instance.status === 'waiting' && (
                                                    <div className="mt-6 border-t border-gray-200 pt-4">
                                                        <h4 className="text-md font-medium text-gray-900 mb-2">Send Event</h4>
                                                        <div className="flex space-x-2">
                                                            <input
                                                                type="text"
                                                                placeholder="Event Name"
                                                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block sm:text-sm border-gray-300 rounded-md p-2 border"
                                                                value={eventName}
                                                                onChange={e => setEventName(e.target.value)}
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder='Payload (JSON)'
                                                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block flex-1 sm:text-sm border-gray-300 rounded-md p-2 border"
                                                                value={eventPayload}
                                                                onChange={e => setEventPayload(e.target.value)}
                                                            />
                                                            <button
                                                                onClick={sendEvent}
                                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                            >
                                                                Send
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            );
        }

        ReactDOM.render(<App />, document.getElementById('root'));
    </script>
</body>
</html>`;
}

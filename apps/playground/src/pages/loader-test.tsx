
import { useState, useEffect } from "react";

// Simulate API call
export const loader = async () => {
    console.log("Loader started...");
    await new Promise(resolve => setTimeout(resolve, 3000)); // 3s delay
    console.log("Loader finished!");
    return {
        message: "Hello from Loader!",
        timestamp: new Date().toISOString()
    };
};

export default function LoaderTest({ data }: { data: any }) {
    return (
        <div style={{ padding: 40, border: "2px solid blue" }}>
            <h1>Loader Test Page</h1>
            <p>If you saw the loading screen for 3 seconds, it works!</p>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
}

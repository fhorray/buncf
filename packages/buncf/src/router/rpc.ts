import { useState } from "react";
import type { defineAction } from "../action";

// Helpers types
type InferInput<T> = T extends { input: { _output: infer I } } ? I : never;
type InferOutput<T> = T extends { handler: (input: any, ctx: any) => Promise<infer O> } ? O : never;

/**
 * Execute a defined action against a specific endpoint.
 * 
 * Usage:
 * const { run, loading } = useAction("/api/user/create", createUserAction);
 */
export function useAction<T extends ReturnType<typeof defineAction<any, any>>>(
  endpoint: string,
  _actionDef?: T, // Ghost argument for type inference specific to the action definition
  options?: {
    onSuccess?: (data: InferOutput<T>) => void;
    onError?: (error: any) => void;
  }
) {
  const [data, setData] = useState<InferOutput<T> | undefined>(undefined);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);

  const run = async (input: InferInput<T>) => {
    setLoading(true);
    setError(null);
    setValidationErrors([]);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.issues) {
          setValidationErrors(json.issues);
          throw new Error("Validation Failed");
        }
        throw new Error(json.error || "Action failed");
      }

      setData(json);
      options?.onSuccess?.(json);
      return json;
    } catch (e: any) {
      setError(e);
      options?.onError?.(e);
    } finally {
      setLoading(false);
    }
  };

  return { run, data, error, loading, validationErrors };
}

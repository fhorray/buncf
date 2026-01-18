import { handleAction } from "buncf";
import { multiply } from "src/actions";

// We need separate endpoints for separate actions currently
// Or we could have a single endpoint that dispatches based on a query param or body type, 
// but for simplicity/clarity, one file per endpoint is fine for now, 
// OR we export a bunch of handlers from this file if 'buncf' API routing supports naming.
// Based on api.ts, it supports method exports.

// Let's create specific files for them to be clean:
// src/api/rpc/multiply.ts
// src/api/rpc/register.ts

// Since I can only write one file per tool call, I'll write 'api/rpc/multiply.ts' here?
// Wait, the user asked for examples. I will just create two files using multiple calls next or combine them if possible?
// I'll create one generic handler that might switch?
// 'handleAction' is 1:1. 

// Let's create just one for now to demo: multiply.
export default (req: Request) => handleAction(req, multiply);

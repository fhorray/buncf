/**
 * Playground Server
 * 
 * Uses buncf createApp() for automatic file-system routing
 */
import { serve } from "bun";
import { createApp } from "buncf";

// Simple usage: createApp() scans ./src/api and ./src/pages automatically
serve(createApp());
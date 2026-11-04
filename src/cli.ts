#!/usr/bin/env node
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { createServer } from './server.js';

serveStdio(() => createServer());

// stdout carries the protocol, so status goes to stderr.
console.error('zcash-now MCP server is running on stdio.');

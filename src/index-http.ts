#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import https from 'https';
import express from 'express';
import cors from 'cors';
import { ALL_TOOLS } from './entities/index.js';
import { RequestHandler, TOOL_HANDLERS } from './request-handler.js';

// Environment configuration
const OPENCTI_URL = process.env.OPENCTI_URL || 'http://localhost:8080';
const OPENCTI_TOKEN = process.env.OPENCTI_TOKEN;
const PORT = parseInt(process.env.PORT || '3000');
const MCP_AUTH_TOKEN = process.env.MCP_AUTH_TOKEN; // Optional: for authenticating MCP clients

if (!OPENCTI_TOKEN) {
  throw new Error('OPENCTI_TOKEN environment variable is required');
}

/**
 * OpenCTI MCP Server (HTTP/SSE version)
 */
class OpenCTIHTTPServer {
  private server: Server;
  private requestHandler: RequestHandler;
  private app: express.Application;

  constructor() {
    this.server = new Server(
      {
        name: 'opencti-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Create axios instance with HTTPS agent for self-signed certificates
    const axiosInstance = this.createAxiosInstance();
    this.requestHandler = new RequestHandler(axiosInstance);

    this.app = express();
    this.setupMiddleware();
    this.setupHandlers();
    this.setupErrorHandling();
  }

  /**
   * Create configured axios instance
   */
  private createAxiosInstance() {
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    return axios.create({
      baseURL: OPENCTI_URL,
      headers: {
        'Authorization': `Bearer ${OPENCTI_TOKEN}`,
        'Content-Type': 'application/json',
      },
      httpsAgent,
    });
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware() {
    // Enable CORS for all origins (adjust in production)
    this.app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    this.app.use(express.json());

    // Optional: Authentication middleware
    if (MCP_AUTH_TOKEN) {
      this.app.use((req, res, next) => {
        // Skip auth for health check
        if (req.path === '/health') {
          return next();
        }

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'Missing or invalid authorization header' });
        }

        const token = authHeader.substring(7);
        if (token !== MCP_AUTH_TOKEN) {
          return res.status(403).json({ error: 'Invalid token' });
        }

        next();
      });
    }
  }

  /**
   * Setup MCP request handlers
   */
  private setupHandlers() {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: ALL_TOOLS,
    }));

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        console.error(`[MCP] Tool called: ${request.params.name}`);
        console.error(`[MCP] Arguments:`, JSON.stringify(request.params.arguments, null, 2));

        const handlerMethod = TOOL_HANDLERS[request.params.name];
        
        if (!handlerMethod) {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
        }

        console.error(`[MCP] Sending GraphQL query to OpenCTI at ${OPENCTI_URL}`);
        
        // Call the appropriate handler method
        const result = await this.requestHandler[handlerMethod](
          request.params.arguments || {}
        );

        console.error(`[MCP] Successfully processed ${request.params.name}`);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error) {
        return this.handleError(error, request.params.name);
      }
    });
  }

  /**
   * Handle errors consistently
   */
  private handleError(error: unknown, toolName: string) {
    if (axios.isAxiosError(error)) {
      console.error(`[MCP] Axios Error for ${toolName}:`, error.response?.data || error.message);
      return {
        content: [{
          type: 'text',
          text: `OpenCTI API error: ${JSON.stringify(error.response?.data) || error.message}`
        }],
        isError: true,
      };
    }
    
    console.error(`[MCP] Unexpected error in ${toolName}:`, error);
    throw error;
  }

  /**
   * Setup error handling and cleanup
   */
  private setupErrorHandling() {
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    
    process.on('SIGINT', async () => {
      console.error('\nShutting down server...');
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Setup HTTP routes
   */
  private setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok',
        server: 'opencti-mcp-server',
        version: '0.1.0',
        openctiUrl: OPENCTI_URL,
        authenticated: !!MCP_AUTH_TOKEN
      });
    });

    // SSE endpoint for MCP communication
    this.app.get('/sse', async (req, res) => {
      console.error('[HTTP] New SSE connection established');
      
      const transport = new SSEServerTransport('/message', res);
      await this.server.connect(transport);
      
      // Handle client disconnect
      req.on('close', () => {
        console.error('[HTTP] SSE connection closed');
      });
    });

    // Message endpoint for client requests
    this.app.post('/message', async (req, res) => {
      // The SSE transport handles this internally
      res.status(200).end();
    });
  }

  /**
   * Start the HTTP server
   */
  async run() {
    this.setupRoutes();
    
    const httpServer = this.app.listen(PORT, () => {
      console.error('='.repeat(60));
      console.error('OpenCTI MCP Server (HTTP) running');
      console.error('='.repeat(60));
      console.error(`Port: ${PORT}`);
      console.error(`OpenCTI URL: ${OPENCTI_URL}`);
      console.error(`Authentication: ${MCP_AUTH_TOKEN ? 'Enabled' : 'Disabled'}`);
      console.error(`Health check: http://localhost:${PORT}/health`);
      console.error(`SSE endpoint: http://localhost:${PORT}/sse`);
      console.error('='.repeat(60));
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.error('SIGTERM received, closing server...');
      httpServer.close(() => {
        console.error('Server closed');
        process.exit(0);
      });
    });
  }
}

// Start server
const server = new OpenCTIHTTPServer();
server.run().catch(console.error);
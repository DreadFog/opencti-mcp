#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
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
const PORT = parseInt(process.env.PORT || '3000', 10);
const MCP_AUTH_TOKEN = process.env.MCP_AUTH_TOKEN;

if (!OPENCTI_TOKEN) {
  throw new Error('OPENCTI_TOKEN environment variable is required');
}

/**
 * Improved HTTP transport for MCP Server
 * Properly handles JSON-RPC request/response lifecycle
 */
class HttpOnceTransport {
  public onmessage?: (message: any) => void;
  public onclose?: () => void;
  public onerror?: (err: unknown) => void;

  private responded = false;
  private responseResolve!: () => void;
  private responsePromise: Promise<void>;

  constructor(private inbound: any, private res: express.Response) {
    this.responsePromise = new Promise<void>((resolve) => {
      this.responseResolve = resolve;
    });
  }

  /**
   * Start the transport and process the inbound message
   */
  async start(): Promise<void> {
    try {
      // Validate inbound message structure
      if (!this.inbound || typeof this.inbound !== 'object') {
        throw new Error('Invalid JSON-RPC message structure');
      }

      // Check if this is a notification (no id field)
      const isNotification = !('id' in this.inbound);
      const method = this.inbound.method;
      
      if (isNotification) {
        console.error('[Transport] Processing notification (no response expected):', method);
      }

      // Handle initialize method directly (before SDK)
      if (method === 'initialize') {
        console.error('[MCP] Initialize request received');
        console.error('[MCP] Client info:', JSON.stringify(this.inbound.params?.clientInfo, null, 2));
        
        const response = {
          jsonrpc: '2.0',
          id: this.inbound.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {
                listChanged: false, // Tools list is static
              },
              logging: {},
            },
            serverInfo: {
              name: 'opencti-server',
              version: '0.1.0',
            },
          },
        };
        
        console.error('[MCP] Initialize response:', JSON.stringify(response.result, null, 2));
        console.error('[MCP] NOTE: Client should now call tools/list to get the actual tools');
        await this.send(response);
        return;
      }

      // Handle notifications/initialized directly
      if (method === 'notifications/initialized') {
        console.error('[MCP] Received notifications/initialized');
        // Notifications don't get responses, just close cleanly
        this.responded = true;
        this.res.status(204).end();
        this.responseResolve();
        return;
      }

      // Handle ping directly
      if (method === 'ping') {
        console.error('[MCP] Ping received');
        const response = {
          jsonrpc: '2.0',
          id: this.inbound.id,
          result: {},
        };
        await this.send(response);
        return;
      }

      // Ensure proper JSON-RPC format for SDK-handled requests
      if (!isNotification && (!this.inbound.jsonrpc || !this.inbound.method)) {
        console.error('[Transport] Invalid JSON-RPC request:', this.inbound);
        this.sendError(-32600, 'Invalid Request', null);
        return;
      }

      // For notifications, just validate they have a method
      if (isNotification && !this.inbound.method) {
        console.error('[Transport] Invalid notification:', this.inbound);
        this.sendError(-32600, 'Invalid Request', null);
        return;
      }

      // Deliver message to SDK handler for tools/list and tools/call
      if (this.onmessage) {
        if (Array.isArray(this.inbound)) {
          for (const msg of this.inbound) {
            this.onmessage(msg);
          }
        } else {
          this.onmessage(this.inbound);
        }
      }

      // Wait for response
      await this.responsePromise;
    } catch (err) {
      console.error('[Transport] Error during start:', err);
      if (this.onerror) {
        this.onerror(err);
      }
      if (!this.responded) {
        this.sendError(-32603, 'Internal error', this.inbound.id || null);
      }
    }
  }

  /**
   * Send a JSON-RPC response
   */
  async send(message: any): Promise<void> {
    if (this.responded) {
      console.warn('[Transport] Attempted to send multiple responses, ignoring');
      return;
    }

    this.responded = true;
    
    try {
      // If message is already a complete JSON-RPC response (from direct handling)
      if (message && message.jsonrpc && message.id !== undefined) {
        console.error('[Transport] Sending direct response:', JSON.stringify(message, null, 2).substring(0, 500));
        this.res.status(200).json(message);
      } else {
        // This is from the SDK, wrap it properly
        const response = {
          jsonrpc: '2.0',
          id: this.inbound?.id || null,
          result: message,
        };
        
        console.error('[Transport] Sending SDK response:', JSON.stringify(response, null, 2).substring(0, 500));
        this.res.status(200).json(response);
      }
    } catch (err) {
      console.error('[Transport] Error sending response:', err);
      if (!this.res.headersSent) {
        this.res.status(500).json({
          jsonrpc: '2.0',
          id: this.inbound?.id || null,
          error: {
            code: -32603,
            message: 'Internal error',
          },
        });
      }
    } finally {
      this.responseResolve();
    }
  }

  /**
   * Send a JSON-RPC error response
   */
  private sendError(code: number, message: string, id: any): void {
    if (this.responded) return;

    this.responded = true;
    this.res.status(200).json({
      jsonrpc: '2.0',
      id: id,
      error: {
        code: code,
        message: message,
      },
    });
    this.responseResolve();
  }

  /**
   * Close the transport
   */
  async close(): Promise<void> {
    if (!this.responded && !this.res.headersSent) {
      this.res.status(204).end();
      this.responseResolve();
    }
    if (this.onclose) {
      this.onclose();
    }
  }
}

/**
 * OpenCTI MCP Server (HTTP API version)
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
        Authorization: `Bearer ${OPENCTI_TOKEN}`,
        'Content-Type': 'application/json',
      },
      httpsAgent,
      timeout: 30000, // 30 second timeout
    });
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware() {
    // Trust proxy headers (important for ngrok/Azure)
    this.app.set('trust proxy', true);

    // CORS configuration
    this.app.use(
      cors({
        origin: '*',
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
      })
    );

    // Parse JSON with size limit
    this.app.use(express.json({ limit: '2mb' }));

    // Request logging middleware
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.error(`[HTTP] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
      });
      next();
    });

    // Optional: Authentication middleware
    if (MCP_AUTH_TOKEN) {
      this.app.use((req, res, next) => {
        // Skip auth for health check
        if (req.path === '/health') {
          return next();
        }

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            jsonrpc: '2.0',
            error: {
              code: -32001,
              message: 'Missing or invalid authorization header',
            },
            id: null,
          });
        }

        const token = authHeader.substring(7);
        if (token !== MCP_AUTH_TOKEN) {
          return res.status(403).json({
            jsonrpc: '2.0',
            error: {
              code: -32002,
              message: 'Invalid token',
            },
            id: null,
          });
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
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.error('[MCP] ========================================');
      console.error('[MCP] tools/list called');
      console.error('[MCP] Returning tools:', ALL_TOOLS.map(t => t.name).join(', '));
      console.error('[MCP] Total tools:', ALL_TOOLS.length);
      console.error('[MCP] ========================================');
      
      const result = {
        tools: ALL_TOOLS,
      };
      
      console.error('[MCP] tools/list result:', JSON.stringify(result, null, 2).substring(0, 500));
      return result;
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      
      try {
        console.error(`[MCP] Tool called: ${toolName}`);
        console.error(`[MCP] Arguments:`, JSON.stringify(request.params.arguments, null, 2));

        const handlerMethod = TOOL_HANDLERS[toolName];

        if (!handlerMethod) {
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`);
        }

        console.error(`[MCP] Executing handler: ${handlerMethod}`);

        // Call the appropriate handler method
        const result = await (this.requestHandler as any)[handlerMethod](
          request.params.arguments || {}
        );

        console.error(`[MCP] Successfully processed ${toolName}`);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error(`[MCP] Error processing ${toolName}:`, error);
        return this.handleError(error, toolName);
      }
    });

    // Custom handler for initialize and other protocol methods
    // We'll handle these in the transport layer since the SDK doesn't expose them
  }

  /**
   * Handle errors consistently
   */
  private handleError(error: unknown, toolName: string) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data
        ? JSON.stringify(error.response.data)
        : error.message;

      console.error(`[MCP] OpenCTI API Error for ${toolName}:`, errorMessage);
      console.error(`[MCP] Status: ${error.response?.status}`);
      console.error(`[MCP] URL: ${error.config?.url}`);

      return {
        content: [
          {
            type: 'text',
            text: `OpenCTI API error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }

    if (error instanceof McpError) {
      return {
        content: [
          {
            type: 'text',
            text: `MCP Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }

    console.error(`[MCP] Unexpected error in ${toolName}:`, error);
    
    return {
      content: [
        {
          type: 'text',
          text: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }

  /**
   * Setup error handling and cleanup
   */
  private setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Server Error]', error);
    };

    // Uncaught exception handler
    process.on('uncaughtException', (error) => {
      console.error('[Uncaught Exception]', error);
    });

    // Unhandled rejection handler
    process.on('unhandledRejection', (reason, promise) => {
      console.error('[Unhandled Rejection]', reason);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.error('\n[Shutdown] SIGINT received, shutting down gracefully...');
      await this.shutdown();
    });

    process.on('SIGTERM', async () => {
      console.error('[Shutdown] SIGTERM received, shutting down gracefully...');
      await this.shutdown();
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
        authenticated: !!MCP_AUTH_TOKEN,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    // Root endpoint with server info
    this.app.get('/', (req, res) => {
      res.json({
        name: 'OpenCTI MCP Server',
        version: '0.1.0',
        endpoints: {
          health: '/health',
          mcp: '/mcp',
        },
        documentation: 'POST JSON-RPC 2.0 messages to /mcp',
      });
    });

    /**
     * MCP API endpoint (JSON-RPC over HTTP)
     */
    this.app.post('/mcp', async (req, res) => {
      try {
        const inbound = req.body;
        
        // Validate request body
        if (!inbound) {
          console.error('[HTTP] Empty request body');
          return res.status(400).json({
            jsonrpc: '2.0',
            error: {
              code: -32700,
              message: 'Parse error: Empty request body',
            },
            id: null,
          });
        }

        // Log incoming request (for debugging)
        console.error('[HTTP] Incoming MCP request:', JSON.stringify(inbound).substring(0, 300));
        console.error(`[HTTP] Method: ${inbound.method}, ID: ${inbound.id}`);

        // Validate JSON-RPC structure
        if (!inbound.jsonrpc || inbound.jsonrpc !== '2.0') {
          console.error('[HTTP] Invalid JSON-RPC version');
          return res.status(400).json({
            jsonrpc: '2.0',
            error: {
              code: -32600,
              message: 'Invalid Request: jsonrpc must be "2.0"',
            },
            id: inbound.id || null,
          });
        }

        if (!inbound.method) {
          console.error('[HTTP] Missing method in JSON-RPC request');
          return res.status(400).json({
            jsonrpc: '2.0',
            error: {
              code: -32600,
              message: 'Invalid Request: method is required',
            },
            id: inbound.id || null,
          });
        }

        // Create transport and connect
        const transport = new HttpOnceTransport(inbound, res);
        await this.server.connect(transport as any);
        
      } catch (e) {
        console.error('[HTTP] MCP request processing error:', e);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Internal error',
              data: e instanceof Error ? e.message : String(e),
            },
            id: null,
          });
        }
      }
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        path: req.path,
        method: req.method,
      });
    });

    // Error handler
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('[Express Error]', err);
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal Server Error',
          message: err.message,
        });
      }
    });
  }

  /**
   * Graceful shutdown
   */
  private async shutdown() {
    console.error('[Shutdown] Closing MCP server...');
    await this.server.close();
    console.error('[Shutdown] Server closed');
    process.exit(0);
  }

  /**
   * Start the HTTP server
   */
  async run() {
    this.setupRoutes();

    const httpServer = this.app.listen(PORT, '0.0.0.0', () => {
      console.error('='.repeat(60));
      console.error('OpenCTI MCP Server (HTTP) running');
      console.error('='.repeat(60));
      console.error(`Port: ${PORT}`);
      console.error(`Host: 0.0.0.0 (listening on all interfaces)`);
      console.error(`OpenCTI URL: ${OPENCTI_URL}`);
      console.error(`Authentication: ${MCP_AUTH_TOKEN ? 'Enabled (Bearer)' : 'Disabled'}`);
      console.error(`Health check: http://localhost:${PORT}/health`);
      console.error(`MCP API endpoint: http://localhost:${PORT}/mcp`);
      console.error('='.repeat(60));
      console.error('Available tools:', ALL_TOOLS.length);
      console.error('='.repeat(60));
    });

    // Set keep-alive timeout
    httpServer.keepAliveTimeout = 65000;
    httpServer.headersTimeout = 66000;

    return httpServer;
  }
}

// Start server
const server = new OpenCTIHTTPServer();
server.run().catch((error) => {
  console.error('[Fatal Error]', error);
  process.exit(1);
});
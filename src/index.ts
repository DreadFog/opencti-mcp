#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import https from 'https';
import { ALL_TOOLS } from './entities/index.js';
import { RequestHandler, TOOL_HANDLERS } from './request-handler.js';

// Environment configuration
const OPENCTI_URL = process.env.OPENCTI_URL || 'http://localhost:8080';
const OPENCTI_TOKEN = process.env.OPENCTI_TOKEN;

if (!OPENCTI_TOKEN) {
  throw new Error('OPENCTI_TOKEN environment variable is required');
}

/**
 * OpenCTI MCP Server
 */
class OpenCTIServer {
  private server: Server;
  private requestHandler: RequestHandler;

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
   * Setup request handlers
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
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Start the server
   */
  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('OpenCTI MCP server running on stdio');
  }
}

// Start server
const server = new OpenCTIServer();
server.run().catch(console.error);

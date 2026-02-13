import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { AxiosInstance } from 'axios';
import { ToolArguments } from '../types.js';

// ============================================================================
// GraphQL Queries
// ============================================================================

export const GET_LIST_AVAILABLE_COUNTRIES_QUERY = `
query ListAvailableCountries($search: String) {
  countries(
    search: $search
    orderBy: name
    orderMode: asc
  ) {
    edges {
      node {
        id
        name
        description
        x_opencti_aliases
      }
    }
  }
}
`;

export const GET_LIST_AVAILABLE_REGIONS_QUERY = `
query ListAvailableRegions($search: String) {
  regions(
    search: $search
    orderBy: name
    orderMode: asc
  ) {
    edges {
      node {
        id
        name
        description
        x_opencti_aliases
      }
    }
  }
}
`;

// ============================================================================
// Request Handlers
// ============================================================================

export class GeographyHandlers {
  constructor(private axiosInstance: AxiosInstance) {}

  private async executeQuery(query: string, variables: any): Promise<any> {
    const response = await this.axiosInstance.post('/graphql', {
      query,
      variables,
    });

    if (!response.data?.data) {
      throw new McpError(
        ErrorCode.InternalError,
        `Invalid response format from OpenCTI: ${JSON.stringify(response.data)}`
      );
    }

    return response.data.data;
  }

  /**
   * List all available countries
   */
  async listCountries(args: ToolArguments) {
    console.error('[MCP] Fetching available countries' + (args.search ? ` with search: ${args.search}` : ''));
    return this.executeQuery(GET_LIST_AVAILABLE_COUNTRIES_QUERY, { search: args.search || null });
  }

  /**
   * List all available regions
   */
  async listRegions(args: ToolArguments) {
    console.error('[MCP] Fetching available regions' + (args.search ? ` with search: ${args.search}` : ''));
    return this.executeQuery(GET_LIST_AVAILABLE_REGIONS_QUERY, { search: args.search || null });
  }
}

// ============================================================================
// Tool Definitions
// ============================================================================

export const GEOGRAPHY_TOOLS = [
  {
    name: 'list_countries',
    description: 'List all available countries, optionally filtered by search term (e.g., "France", "Germany")',
    inputSchema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Optional search term to filter countries (e.g., "France", "United States")',
        },
      },
    },
  },
  {
    name: 'list_regions',
    description: 'List all available regions, optionally filtered by search term (e.g., "Europe", "Asia")',
    inputSchema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Optional search term to filter regions (e.g., "Europe", "Middle East")',
        },
      },
    },
  },
] as const;

// ============================================================================
// Handler Mapping
// ============================================================================

export const GEOGRAPHY_HANDLER_MAP: Record<string, keyof GeographyHandlers> = {
  'list_countries': 'listCountries',
  'list_regions': 'listRegions',
};

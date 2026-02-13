import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { AxiosInstance } from 'axios';
import { ToolArguments } from '../types.js';

// ============================================================================
// GraphQL Queries
// ============================================================================

export const GET_SECTORS_QUERY = `
query FindSectorsByNameAndCreator($search: String!) {
  sectors(
    search: $search
    orderBy: name
    orderMode: asc
    filters: {
      mode: and
      filters: [
        {
          key: "creator_id"
          values: ["6b85141f-d822-48a9-99f7-20f404a51a45"] # Opencti user is hardcoded to only retrieve main sectors
          operator: eq
        }
      ]
      filterGroups: []
    }
  ) {
    edges {
      node {
        id
        name
        description
      }
    }
  }
}
`;

export const GET_LIST_AVAILABLE_SECTORS_QUERY = `
query ListAvailableSectors {
  sectors(
    orderBy: name
    orderMode: asc
    filters: {
      mode: and
      filters: [
        {
          key: "creator_id"
          values: ["6b85141f-d822-48a9-99f7-20f404a51a45"]
          operator: eq
        }
      ]
      filterGroups: []
    }
  ) {
    edges {
      node {
        id
        name
        description
      }
    }
  }
}
`;

// ============================================================================
// Request Handlers
// ============================================================================

export class SectorHandlers {
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
   * Find Sector ID from its name
   */
  async getSectorByName(args: ToolArguments) {
    if (!args.name) {
      throw new McpError(ErrorCode.InvalidParams, 'Sector name is required');
    }
    console.error('[MCP] Searching sectors with name ' + args.name);
    return this.executeQuery(GET_SECTORS_QUERY, { search: args.name });
  }

  /**
   * List all available sectors
   */
  async listSectors(args: ToolArguments) {
    console.error('[MCP] Fetching all available sectors');
    return this.executeQuery(GET_LIST_AVAILABLE_SECTORS_QUERY, {});
  }
}

// ============================================================================
// Tool Definitions
// ============================================================================

export const SECTOR_TOOLS = [
  {
    name: 'get_sector_by_name',
    description: 'Retrieves the sectors corresponding to a given name. Returns their ID',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'The name of the sector that is being searched',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'list_sectors',
    description: 'List all available sectors',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
] as const;

// ============================================================================
// Handler Mapping
// ============================================================================

export const SECTOR_HANDLER_MAP: Record<string, keyof SectorHandlers> = {
  'get_sector_by_name': 'getSectorByName',
  'list_sectors': 'listSectors',
};

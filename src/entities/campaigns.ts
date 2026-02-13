import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { AxiosInstance } from 'axios';
import { ToolArguments } from '../types.js';

// ============================================================================
// GraphQL Queries
// ============================================================================

export const GET_CAMPAIGNS_BY_FILTERS_QUERY = `
query GetCampaignsByFilters($count: Int!, $cursor: ID, $filters: FilterGroup, $orderBy: CampaignsOrdering, $orderMode: OrderingMode) {
  campaigns(
    first: $count
    after: $cursor
    filters: $filters
    orderBy: $orderBy
    orderMode: $orderMode
  ) {
    edges {
      node {
        id
        name
        description
        first_seen
        last_seen
        createdBy {
          id
          name
        }
        objectMarking {
          id
          definition_type
          definition
        }
        objectLabel {
          id
          value
          color
        }
      }
      cursor
    }
    pageInfo {
      endCursor
      hasNextPage
      globalCount
    }
  }
}
`;

// ============================================================================
// Request Handlers
// ============================================================================

export class CampaignHandlers {
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
   * Get campaigns by dynamic filters (sectors, countries, regions with AND/OR logic)
   * Supports queries like:
   * - campaigns targeting Germany AND Health sector
   * - campaigns targeting Germany OR Health sector
   */
  async getCampaignsByFilters(args: ToolArguments) {
    if (!args.filters) {
      throw new McpError(ErrorCode.InvalidParams, 'Filters are required');
    }
    console.error(`[MCP] Fetching campaigns with custom filters`);
    
    return this.executeQuery(GET_CAMPAIGNS_BY_FILTERS_QUERY, {
      count: args.count ?? 25,
      cursor: args.cursor,
      orderBy: args.orderBy ?? 'created_at',
      orderMode: args.orderMode ?? 'desc',
      filters: args.filters,
    });
  }
}

// ============================================================================
// Tool Definitions
// ============================================================================

export const CAMPAIGN_TOOLS = [
  {
    name: 'get_campaigns_by_filters',
    description: 'Get campaigns by dynamic filters (sectors, countries, regions) with AND/OR logic. Supports complex queries like "campaigns targeting Germany AND Health sector" or "campaigns targeting Germany OR Health sector"',
    inputSchema: {
      type: 'object',
      properties: {
        filters: {
          type: 'object',
          description: 'FilterGroup object with mode (and/or) and filters array. Example: {mode: "and", filters: [{key: "regardingOf", operator: "eq", values: [{key: "relationship_type", values: ["targets"]}, {key: "id", values: ["id1", "id2"]}]}], filterGroups: []}',
        },
        count: {
          type: 'number',
          description: 'Maximum number of campaigns to retrieve',
          default: 25,
        },
        cursor: {
          type: 'string',
          description: 'Pagination cursor for retrieving next set of results',
        },
        orderBy: {
          type: 'string',
          description: 'Field to order results by (e.g., created_at, name)',
          default: 'created_at',
        },
        orderMode: {
          type: 'string',
          description: 'Order mode: asc or desc',
          enum: ['asc', 'desc'],
          default: 'desc',
        },
      },
      required: ['filters'],
    },
  },
] as const;

// ============================================================================
// Handler Mapping
// ============================================================================

export const CAMPAIGN_HANDLER_MAP: Record<string, keyof CampaignHandlers> = {
  'get_campaigns_by_filters': 'getCampaignsByFilters',
};

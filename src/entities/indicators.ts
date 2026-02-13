import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { AxiosInstance } from 'axios';
import { ToolArguments } from '../types.js';

// ============================================================================
// GraphQL Queries
// ============================================================================

export const GET_INDICATORS_BY_OBJECT_WITH_TYPE_QUERY = `
query GetIndicatorsByObjectAndType($count: Int!, $cursor: ID, $filters: FilterGroup, $orderBy: IndicatorsOrdering, $orderMode: OrderingMode) {
  indicators(
    first: $count
    after: $cursor
    filters: $filters
    orderBy: $orderBy
    orderMode: $orderMode
  ) {
    edges {
      node {
        id
        entity_type
        name
        pattern
        pattern_type
        valid_from
        valid_until
        x_opencti_score
        x_opencti_main_observable_type
        created
        confidence
        revoked
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

export class IndicatorHandlers {
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
   * Get valid indicators for a specific object (malware, campaign, or intrusion set) and indicator type
   */
  async getIndicatorsByObjectAndType(args: ToolArguments) {
    if (!args.objectId) {
      throw new McpError(ErrorCode.InvalidParams, 'Object ID is required');
    }
    if (!args.indicatorType) {
      throw new McpError(ErrorCode.InvalidParams, 'Indicator type is required');
    }
    console.error(`[MCP] Fetching ${args.indicatorType} indicators for object: ${args.objectId}`);
    
    // Build the filters object dynamically
    const filters = {
      mode: 'and',
      filters: [
        {
          key: 'entity_type',
          values: ['Indicator'],
          operator: 'eq',
          mode: 'or',
        },
      ],
      filterGroups: [
        {
          mode: 'and',
          filters: [
            {
              key: 'regardingOf',
              operator: 'eq',
              values: [
                {
                  key: 'relationship_type',
                  values: ['indicates'],
                },
                {
                  key: 'id',
                  values: [args.objectId],
                },
              ],
              mode: 'or',
            },
            {
              key: 'x_opencti_main_observable_type',
              operator: 'eq',
              values: [args.indicatorType],
              mode: 'or',
            },
            {
              key: 'revoked',
              operator: 'eq',
              values: ['false'],
              mode: 'or',
            },
          ],
          filterGroups: [],
        },
      ],
    };

    return this.executeQuery(GET_INDICATORS_BY_OBJECT_WITH_TYPE_QUERY, {
      count: args.count ?? 25,
      cursor: args.cursor,
      orderBy: args.orderBy ?? 'created',
      orderMode: args.orderMode ?? 'desc',
      filters,
    });
  }
}

// ============================================================================
// Tool Definitions
// ============================================================================

export const INDICATOR_TOOLS = [
  {
    name: 'get_indicators_by_object_and_type',
    description: 'Retrieve the latest valid indicators for a given object (malware, campaign, or intrusion set) and indicator type',
    inputSchema: {
      type: 'object',
      properties: {
        objectId: {
          type: 'string',
          description: 'The ID of the object (malware, campaign, or intrusion set)',
        },
        indicatorType: {
          type: 'string',
          description: 'The type of indicators (e.g., IPv4-Addr, IPv6-Addr, Domain-Name, URL, File-MD5, File-SHA-256)',
        },
        count: {
          type: 'number',
          description: 'Maximum number of indicators to retrieve',
          default: 25,
        },
        cursor: {
          type: 'string',
          description: 'Pagination cursor for retrieving next set of results',
        },
        orderBy: {
          type: 'string',
          description: 'Field to order results by (e.g., created, valid_from)',
          default: 'created',
        },
        orderMode: {
          type: 'string',
          description: 'Order mode: asc or desc',
          enum: ['asc', 'desc'],
          default: 'desc',
        },
      },
      required: ['objectId', 'indicatorType'],
    },
  },
  {
    name: 'get_indicators_by_campaign',
    description: 'Get all valid indicators that indicate a specific campaign',
    inputSchema: {
      type: 'object',
      properties: {
        campaignId: {
          type: 'string',
          description: 'The ID of the campaign',
        },
        count: {
          type: 'number',
          description: 'Maximum number of indicators to retrieve',
          default: 25,
        },
        cursor: {
          type: 'string',
          description: 'Pagination cursor for retrieving next set of results',
        },
        orderBy: {
          type: 'string',
          description: 'Field to order results by (e.g., created, valid_from)',
          default: 'created',
        },
        orderMode: {
          type: 'string',
          description: 'Order mode: asc or desc',
          enum: ['asc', 'desc'],
          default: 'desc',
        },
      },
      required: ['campaignId'],
    },
  },
] as const;

// ============================================================================
// Handler Mapping
// ============================================================================

export const INDICATOR_HANDLER_MAP: Record<string, keyof IndicatorHandlers> = {
  'get_indicators_by_object_and_type': 'getIndicatorsByObjectAndType',
};

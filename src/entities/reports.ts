import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { AxiosInstance } from 'axios';
import { ToolArguments } from '../types.js';

// ============================================================================
// GraphQL Queries
// ============================================================================

export const GET_REPORTS_TYPES_QUERY = `
query GetReportTypes {
  vocabularies(
    category: report_types_ov
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

export const GET_REPORTS_BY_FILTERS_QUERY = `
query GetReportsByFilters($count: Int!, $cursor: ID, $filters: FilterGroup, $orderBy: ReportsOrdering, $orderMode: OrderingMode) {
  reports(
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
        published
        report_types
        confidence
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

export class ReportHandlers {
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
   * Get available report types
   */
  async getReportTypes(args: ToolArguments) {
    console.error('[MCP] Fetching report types');
    return this.executeQuery(GET_REPORTS_TYPES_QUERY, {});
  }

  /**
   * Get reports by dynamic filters (sectors, countries, regions with AND/OR logic)
   * Supports queries like:
   * - reports containing Germany AND Health sector
   * - reports containing Germany OR Health sector
   */
  async getReportsByFilters(args: ToolArguments) {
    if (!args.filters) {
      throw new McpError(ErrorCode.InvalidParams, 'Filters are required');
    }
    console.error(`[MCP] Fetching reports with custom filters`);
    
    return this.executeQuery(GET_REPORTS_BY_FILTERS_QUERY, {
      count: args.count ?? 25,
      cursor: args.cursor,
      orderBy: args.orderBy ?? 'published',
      orderMode: args.orderMode ?? 'desc',
      filters: args.filters,
    });
  }
}

// ============================================================================
// Tool Definitions
// ============================================================================

export const REPORT_TOOLS = [
  {
    name: 'get_report_types',
    description: 'Get all available report types from OpenCTI',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_reports_by_filters',
    description: 'Get reports by dynamic filters (sectors, countries, regions) with AND/OR logic. Supports complex queries like "reports containing Germany AND Health sector" or "reports containing Germany OR Health sector"',
    inputSchema: {
      type: 'object',
      properties: {
        filters: {
          type: 'object',
          description: 'FilterGroup object with mode (and/or) and filters array. Example: {mode: "and", filters: [{key: "objects", values: ["id1", "id2"], operator: "eq"}], filterGroups: []}',
        },
        count: {
          type: 'number',
          description: 'Maximum number of reports to retrieve',
          default: 25,
        },
        cursor: {
          type: 'string',
          description: 'Pagination cursor for retrieving next set of results',
        },
        orderBy: {
          type: 'string',
          description: 'Field to order results by (e.g., published, created)',
          default: 'published',
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

export const REPORT_HANDLER_MAP: Record<string, keyof ReportHandlers> = {
  'get_report_types': 'getReportTypes',
  'get_reports_by_filters': 'getReportsByFilters',
};

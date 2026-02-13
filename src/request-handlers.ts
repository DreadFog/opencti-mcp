import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { AxiosInstance } from 'axios';
import { ToolArguments } from './types.js';
import {
  GET_SECTORS_QUERY,
  GET_LIST_AVAILABLE_SECTORS_QUERY,
  GET_LIST_AVAILABLE_COUNTRIES_QUERY,
  GET_LIST_AVAILABLE_REGIONS_QUERY,
  GET_REPORTS_TYPES_QUERY,
  GET_REPORTS_BY_FILTERS_QUERY,
  GET_CAMPAIGNS_BY_FILTERS_QUERY,
  GET_INDICATORS_BY_OBJECT_WITH_TYPE_QUERY,
  GET_MALARE_BY_NAME_QUERY,
  STIX_RELATIONSHIPS_DISTRIBUTION_QUERY,
} from "./queries/index.js"

interface QueryConfig {
  query: string;
  variables: any;
  formatter: (data: any) => any;
}

/**
 * Base handler class for OpenCTI requests
 */
export class RequestHandler {
  constructor(private axiosInstance: AxiosInstance) {}

  /**
   * Execute a GraphQL query and format the response
   */
  private async executeQuery(config: QueryConfig): Promise<any> {
    const response = await this.axiosInstance.post('/graphql', {
      query: config.query,
      variables: config.variables,
    });

    if (!response.data?.data) {
      throw new McpError(
        ErrorCode.InternalError,
        `Invalid response format from OpenCTI: ${JSON.stringify(response.data)}`
      );
    }

    return config.formatter(response.data.data);
  }

  /**
   * Find Sector ID from its name
   */
  async getSectorByName(args: ToolArguments) {
    if (!args.name) {
      throw new McpError(ErrorCode.InvalidParams, 'Sector name is required');
    }
    console.error('[MCP] Searching sectors with name ' + args.name);
    return this.executeQuery({
      query: GET_SECTORS_QUERY,
      variables: {search: args.name},
      formatter: (data) => data,
    });
  }

  /**
   * List all available sectors
   */
  async listSectors(args: ToolArguments) {
    console.error('[MCP] Fetching all available sectors');
    return this.executeQuery({
      query: GET_LIST_AVAILABLE_SECTORS_QUERY,
      variables: {},
      formatter: (data) => data,
    });
  }

  /**
   * List all available countries
   */
  async listCountries(args: ToolArguments) {
    console.error('[MCP] Fetching available countries' + (args.search ? ` with search: ${args.search}` : ''));
    return this.executeQuery({
      query: GET_LIST_AVAILABLE_COUNTRIES_QUERY,
      variables: { search: args.search || null },
      formatter: (data) => data,
    });
  }

  /**
   * List all available regions
   */
  async listRegions(args: ToolArguments) {
    console.error('[MCP] Fetching available regions' + (args.search ? ` with search: ${args.search}` : ''));
    return this.executeQuery({
      query: GET_LIST_AVAILABLE_REGIONS_QUERY,
      variables: { search: args.search || null },
      formatter: (data) => data,
    });
  }


  /**
   * Get available report types
   */
  async getReportTypes(args: ToolArguments) {
    console.error('[MCP] Fetching report types');
    return this.executeQuery({
      query: GET_REPORTS_TYPES_QUERY,
      variables: {},
      formatter: (data) => data,
    });
  }


  /**
   * Get malware by name
   */
  async getMalwareByName(args: ToolArguments) {
    if (!args.search) {
      throw new McpError(ErrorCode.InvalidParams, 'Search term is required');
    }
    console.error(`[MCP] Searching malware with query: ${args.search}`);
    return this.executeQuery({
      query: GET_MALARE_BY_NAME_QUERY,
      variables: { search: args.search },
      formatter: (data) => data,
    });
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

    return this.executeQuery({
      query: GET_INDICATORS_BY_OBJECT_WITH_TYPE_QUERY,
      variables: {
        count: args.count ?? 25,
        cursor: args.cursor,
        orderBy: args.orderBy ?? 'created',
        orderMode: args.orderMode ?? 'desc',
        filters,
      },
      formatter: (data) => data,
    });
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
    
    return this.executeQuery({
      query: GET_REPORTS_BY_FILTERS_QUERY,
      variables: {
        count: args.count ?? 25,
        cursor: args.cursor,
        orderBy: args.orderBy ?? 'published',
        orderMode: args.orderMode ?? 'desc',
        filters: args.filters,
      },
      formatter: (data) => data,
    });
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
    
    return this.executeQuery({
      query: GET_CAMPAIGNS_BY_FILTERS_QUERY,
      variables: {
        count: args.count ?? 25,
        cursor: args.cursor,
        orderBy: args.orderBy ?? 'created_at',
        orderMode: args.orderMode ?? 'desc',
        filters: args.filters,
      },
      formatter: (data) => data,
    });
  }

  /**
   * Get STIX relationships distribution with basic filters
   */
  async getStixRelationshipsDistribution(args: ToolArguments) {
    if (!args.field) {
      throw new McpError(ErrorCode.InvalidParams, 'Field is required');
    }
    if (!args.operation) {
      throw new McpError(ErrorCode.InvalidParams, 'Operation is required');
    }
    console.error(`[MCP] Fetching STIX relationships distribution for field: ${args.field}, operation: ${args.operation}`);
    
    return this.executeQuery({
      query: STIX_RELATIONSHIPS_DISTRIBUTION_QUERY,
      variables: {
        field: args.field,
        operation: args.operation,
        startDate: args.startDate,
        endDate: args.endDate,
        dateAttribute: args.dateAttribute,
        isTo: args.isTo,
        limit: args.limit ?? 10,
        fromOrToId: args.fromOrToId,
        elementWithTargetTypes: args.elementWithTargetTypes,
        fromId: args.fromId,
        fromRole: args.fromRole,
        fromTypes: args.fromTypes,
        toId: args.toId,
        toRole: args.toRole,
        toTypes: args.toTypes,
        relationship_type: args.relationship_type,
        confidences: args.confidences,
        search: args.search,
        filters: args.filters,
        dynamicFrom: null,
        dynamicTo: null,
      },
      formatter: (data) => data,
    });
  }

  /**
   * Get STIX relationships distribution with dynamic filters on source and destination
   * WARNING: dynamicFrom and dynamicTo are pre-queries that can match up to 5,000 entities each
   */
  async getStixRelationshipsDistributionWithDynamicFilters(args: ToolArguments) {
    if (!args.field) {
      throw new McpError(ErrorCode.InvalidParams, 'Field is required');
    }
    if (!args.operation) {
      throw new McpError(ErrorCode.InvalidParams, 'Operation is required');
    }
    console.error(`[MCP] Fetching STIX relationships distribution with dynamic filters for field: ${args.field}, operation: ${args.operation}`);
    
    return this.executeQuery({
      query: STIX_RELATIONSHIPS_DISTRIBUTION_QUERY,
      variables: {
        field: args.field,
        operation: args.operation,
        startDate: args.startDate,
        endDate: args.endDate,
        dateAttribute: args.dateAttribute,
        isTo: args.isTo,
        limit: args.limit ?? 10,
        fromOrToId: args.fromOrToId,
        elementWithTargetTypes: args.elementWithTargetTypes,
        fromId: args.fromId,
        fromRole: args.fromRole,
        fromTypes: args.fromTypes,
        toId: args.toId,
        toRole: args.toRole,
        toTypes: args.toTypes,
        relationship_type: args.relationship_type,
        confidences: args.confidences,
        search: args.search,
        filters: args.filters,
        dynamicFrom: args.dynamicFrom,
        dynamicTo: args.dynamicTo,
      },
      formatter: (data) => data,
    });
  }
}

/**
 * Map tool names to handler methods
 */
export const TOOL_HANDLERS: Record<string, keyof RequestHandler> = {
  'get_sector_by_name': 'getSectorByName',
  'list_sectors': 'listSectors',
  'list_countries': 'listCountries',
  'list_regions': 'listRegions',
  'get_report_types': 'getReportTypes',
  'get_reports_by_filters': 'getReportsByFilters',
  'get_malware_by_name': 'getMalwareByName',
  'get_campaigns_by_filters': 'getCampaignsByFilters',
  'get_indicators_by_object_and_type': 'getIndicatorsByObjectAndType',
  'get_stix_relationships_distribution': 'getStixRelationshipsDistribution',
  'get_stix_relationships_distribution_with_dynamic_filters': 'getStixRelationshipsDistributionWithDynamicFilters',
};

import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { AxiosInstance } from 'axios';
import { ToolArguments } from './types.js';
import {
  GET_SECTORS_QUERY,
  GET_LIST_AVAILABLE_SECTORS_QUERY,
  GET_REPORTS_BY_SECTOR_QUERY,
  GET_REPORTS_BY_TYPE_QUERY,
  GET_REPORTS_TYPES_QUERY,
  GET_CAMPAIGNS_BY_SECTOR_QUERY,
  GET_INDICATORS_BY_MALWARE_WITH_TYPE_QUERY,
  GET_INDICATORS_BY_CAMPAIGN_QUERY,
  GET_MALARE_BY_NAME_QUERY,
} from "./queries/hunting_queries.js"

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
   * Get reports by sector ID
   */
  async getReportsBySector(args: ToolArguments) {
    if (!args.sectorId) {
      throw new McpError(ErrorCode.InvalidParams, 'Sector ID is required');
    }
    console.error(`[MCP] Fetching reports for sector: ${args.sectorId}`);
    return this.executeQuery({
      query: GET_REPORTS_BY_SECTOR_QUERY,
      variables: { sectorId: args.sectorId, first: args.first ?? 10 },
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
   * Get reports by type
   */
  async getReportsByType(args: ToolArguments) {
    if (!args.reportType) {
      throw new McpError(ErrorCode.InvalidParams, 'Report type is required');
    }
    console.error(`[MCP] Fetching reports of type: ${args.reportType}`);
    return this.executeQuery({
      query: GET_REPORTS_BY_TYPE_QUERY,
      variables: { reportType: args.reportType, first: args.first ?? 10 },
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
   * Get campaigns targeting a specific sector
   */
  async getCampaignsBySector(args: ToolArguments) {
    if (!args.sectorId) {
      throw new McpError(ErrorCode.InvalidParams, 'Sector ID is required');
    }
    console.error(`[MCP] Fetching campaigns targeting sector: ${args.sectorId}`);
    
    // Build the filters object dynamically
    const filters = {
      filterGroups: [
        {
          filterGroups: [],
          filters: [
            {
              key: 'regardingOf',
              mode: 'or',
              operator: 'eq',
              values: [
                {
                  key: 'relationship_type',
                  values: ['targets'],
                },
                {
                  key: 'id',
                  values: [args.sectorId],
                },
              ],
            },
          ],
          mode: 'and',
        },
      ],
      filters: [],
      mode: 'and',
    };

    return this.executeQuery({
      query: GET_CAMPAIGNS_BY_SECTOR_QUERY,
      variables: {
        count: args.count ?? 10,
        cursor: args.cursor,
        orderBy: args.orderBy ?? 'created_at',
        orderMode: args.orderMode ?? 'desc',
        filters,
      },
      formatter: (data) => data,
    });
  }

  /**
   * Get valid indicators for a specific malware and indicator type
   */
  async getIndicatorsByMalwareAndType(args: ToolArguments) {
    if (!args.malwareId) {
      throw new McpError(ErrorCode.InvalidParams, 'Malware ID is required');
    }
    if (!args.indicatorType) {
      throw new McpError(ErrorCode.InvalidParams, 'Indicator type is required');
    }
    console.error(`[MCP] Fetching ${args.indicatorType} indicators for malware: ${args.malwareId}`);
    
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
                  values: [args.malwareId],
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
      query: GET_INDICATORS_BY_MALWARE_WITH_TYPE_QUERY,
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
   * Get valid indicators for a specific campaign
   */
  async getIndicatorsByCampaign(args: ToolArguments) {
    if (!args.campaignId) {
      throw new McpError(ErrorCode.InvalidParams, 'Campaign ID is required');
    }
    console.error(`[MCP] Fetching indicators for campaign: ${args.campaignId}`);
    
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
                  values: [args.campaignId],
                },
              ],
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
      query: GET_INDICATORS_BY_CAMPAIGN_QUERY,
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
}

/**
 * Map tool names to handler methods
 */
export const TOOL_HANDLERS: Record<string, keyof RequestHandler> = {
  'get_sector_by_name': 'getSectorByName',
  'list_sectors': 'listSectors',
  'get_reports_by_sector': 'getReportsBySector',
  'get_report_types': 'getReportTypes',
  'get_reports_by_type': 'getReportsByType',
  'get_malware_by_name': 'getMalwareByName',
  'get_campaigns_by_sector': 'getCampaignsBySector',
  'get_indicators_by_malware_and_type': 'getIndicatorsByMalwareAndType',
  'get_indicators_by_campaign': 'getIndicatorsByCampaign',
};

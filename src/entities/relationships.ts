import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { AxiosInstance } from 'axios';
import { ToolArguments } from '../types.js';

// ============================================================================
// GraphQL Queries
// ============================================================================

export const STIX_RELATIONSHIPS_DISTRIBUTION_QUERY = `
query StixRelationshipsDistributionQuery(
  $field: String!
  $operation: StatsOperation!
  $startDate: DateTime
  $endDate: DateTime
  $dateAttribute: String
  $isTo: Boolean
  $limit: Int
  $fromOrToId: [String]
  $elementWithTargetTypes: [String]
  $fromId: [String]
  $fromRole: String
  $fromTypes: [String]
  $toId: [String]
  $toRole: String
  $toTypes: [String]
  $relationship_type: [String]
  $confidences: [Int]
  $search: String
  $filters: FilterGroup
  $dynamicFrom: FilterGroup
  $dynamicTo: FilterGroup
) {
  stixRelationshipsDistribution(
    field: $field
    operation: $operation
    startDate: $startDate
    endDate: $endDate
    dateAttribute: $dateAttribute
    isTo: $isTo
    limit: $limit
    fromOrToId: $fromOrToId
    elementWithTargetTypes: $elementWithTargetTypes
    fromId: $fromId
    fromRole: $fromRole
    fromTypes: $fromTypes
    toId: $toId
    toRole: $toRole
    toTypes: $toTypes
    relationship_type: $relationship_type
    confidences: $confidences
    search: $search
    filters: $filters
    dynamicFrom: $dynamicFrom
    dynamicTo: $dynamicTo
  ) {
    label
    value
    entity {
      __typename
      ... on BasicObject {
        __isBasicObject: __typename
        id
        entity_type
      }
      ... on BasicRelationship {
        __isBasicRelationship: __typename
        id
        entity_type
      }
      ... on StixObject {
        __isStixObject: __typename
        representative {
          main
        }
      }
      ... on StixRelationship {
        __isStixRelationship: __typename
        representative {
          main
        }
      }
      ... on Creator {
        name
        id
      }
      ... on Group {
        name
        id
      }
    }
  }
}
`;

// ============================================================================
// Request Handlers
// ============================================================================

export class RelationshipHandlers {
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
    
    return this.executeQuery(STIX_RELATIONSHIPS_DISTRIBUTION_QUERY, {
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
    
    return this.executeQuery(STIX_RELATIONSHIPS_DISTRIBUTION_QUERY, {
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
    });
  }
}

// ============================================================================
// Tool Definitions
// ============================================================================

export const RELATIONSHIP_TOOLS = [
  {
    name: 'get_stix_relationships_distribution',
    description: 'Get STIX relationships distribution with basic filters. Use this tool for simple relationship searches without complex filters on the source or destination of relationships. Example use-case: get the malwares most used by a specific intrusion set, or get the intrusion sets that target the most a sector. For complex source/destination filters, use get_stix_relationships_distribution_with_dynamic_filters instead.',
    inputSchema: {
      type: 'object',
      properties: {
        field: {
          type: 'string',
          description: 'Field to group relationships by (e.g., "internal_id", "entity_type")',
        },
        operation: {
          type: 'string',
          description: 'Statistical operation to perform (e.g., "count")',
          enum: ['count', 'sum', 'avg', 'min', 'max'],
        },
        startDate: {
          type: 'string',
          description: 'Start date for filtering relationships (ISO 8601 format)',
        },
        endDate: {
          type: 'string',
          description: 'End date for filtering relationships (ISO 8601 format)',
        },
        dateAttribute: {
          type: 'string',
          description: 'Date attribute to filter on (e.g., "created_at", "updated_at")',
        },
        isTo: {
          type: 'boolean',
          description: 'Filter relationships by direction (true for "to", false for "from")',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to retrieve',
          default: 10,
        },
        fromOrToId: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by entity IDs (either source or destination)',
        },
        elementWithTargetTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by target entity types',
        },
        fromId: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by source entity IDs',
        },
        fromRole: {
          type: 'string',
          description: 'Filter by source entity role',
        },
        fromTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by source entity types',
        },
        toId: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by destination entity IDs',
        },
        toRole: {
          type: 'string',
          description: 'Filter by destination entity role',
        },
        toTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by destination entity types',
        },
        relationship_type: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by relationship types (e.g., "targets", "uses")',
        },
        confidences: {
          type: 'array',
          items: { type: 'number' },
          description: 'Filter by confidence levels',
        },
        search: {
          type: 'string',
          description: 'Free text search on relationships',
        },
        filters: {
          type: 'object',
          description: 'FilterGroup object for complex filtering on the relationships themselves',
        },
      },
      required: ['field', 'operation'],
    },
  },
  {
    name: 'get_stix_relationships_distribution_with_dynamic_filters',
    description: 'Get STIX relationships distribution with dynamic filters on source and destination entities. WARNING: dynamicFrom and dynamicTo are pre-queries that can match up to 5,000 entities each, so they must be precise queries to avoid performance issues. Use this tool only when you need complex filters on the source (dynamicFrom) or destination (dynamicTo) of relationships. Example use-case: "What are the chinese intrusion sets that target the most the Health sector?". as we need to filter for specific intrusion sets, a dynamicfrom filter is required to specify that we need intrusion sets, and that they originate from china.',
    inputSchema: {
      type: 'object',
      properties: {
        field: {
          type: 'string',
          description: 'Field to group relationships by (e.g., "internal_id", "entity_type")',
        },
        operation: {
          type: 'string',
          description: 'Statistical operation to perform (e.g., "count")',
          enum: ['count', 'sum', 'avg', 'min', 'max'],
        },
        startDate: {
          type: 'string',
          description: 'Start date for filtering relationships (ISO 8601 format)',
        },
        endDate: {
          type: 'string',
          description: 'End date for filtering relationships (ISO 8601 format)',
        },
        dateAttribute: {
          type: 'string',
          description: 'Date attribute to filter on (e.g., "created_at", "updated_at")',
        },
        isTo: {
          type: 'boolean',
          description: 'Filter relationships by direction (true for "to", false for "from")',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to retrieve',
          default: 10,
        },
        fromOrToId: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by entity IDs (either source or destination)',
        },
        elementWithTargetTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by target entity types',
        },
        fromId: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by source entity IDs',
        },
        fromRole: {
          type: 'string',
          description: 'Filter by source entity role',
        },
        fromTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by source entity types',
        },
        toId: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by destination entity IDs',
        },
        toRole: {
          type: 'string',
          description: 'Filter by destination entity role',
        },
        toTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by destination entity types',
        },
        relationship_type: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by relationship types (e.g., "targets", "uses")',
        },
        confidences: {
          type: 'array',
          items: { type: 'number' },
          description: 'Filter by confidence levels',
        },
        search: {
          type: 'string',
          description: 'Free text search on relationships',
        },
        filters: {
          type: 'object',
          description: 'FilterGroup object for complex filtering on the relationships themselves',
        },
        dynamicFrom: {
          type: 'object',
          description: 'FilterGroup for dynamic filtering on source entities. WARNING: This can match up to 5,000 entities - ensure it is a precise query.',
        },
        dynamicTo: {
          type: 'object',
          description: 'FilterGroup for dynamic filtering on destination entities. WARNING: This can match up to 5,000 entities - ensure it is a precise query.',
        },
      },
      required: ['field', 'operation'],
    },
  },
] as const;

// ============================================================================
// Handler Mapping
// ============================================================================

export const RELATIONSHIP_HANDLER_MAP: Record<string, keyof RelationshipHandlers> = {
  'get_stix_relationships_distribution': 'getStixRelationshipsDistribution',
  'get_stix_relationships_distribution_with_dynamic_filters': 'getStixRelationshipsDistributionWithDynamicFilters',
};

export const TOOL_DEFINITIONS = [
  // Hunting Queries - Sectors
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
  // Hunting Queries - Countries & Regions
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
  {
    name: 'get_report_types',
    description: 'Get all available report types from OpenCTI',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  // Hunting Queries - Malware
  {
    name: 'get_malware_by_name',
    description: 'Search for malware by name in OpenCTI',
    inputSchema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Malware name or search term',
        },
      },
      required: ['search'],
    },
  },
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
  // Hunting Queries - Indicators
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
  // Hunting Queries - Generalized Filters
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
  // Hunting Queries - Relationships
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

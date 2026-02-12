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
  // Hunting Queries - Reports
  {
    name: 'get_reports_by_sector',
    description: 'Get all reports related to a specific sector',
    inputSchema: {
      type: 'object',
      properties: {
        sectorId: {
          type: 'string',
          description: 'The ID of the sector',
        },
        first: {
          type: 'number',
          description: 'Maximum number of reports to retrieve',
          default: 10,
        },
      },
      required: ['sectorId'],
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
  {
    name: 'get_reports_by_type',
    description: 'Get all reports of a specific type',
    inputSchema: {
      type: 'object',
      properties: {
        reportType: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Array of report types to filter by',
        },
        first: {
          type: 'number',
          description: 'Maximum number of reports to retrieve',
          default: 10,
        },
      },
      required: ['reportType'],
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
    name: 'get_indicators_by_malware_and_type',
    description: 'Retrieve the latest valid indicators for a given malware and indicator type',
    inputSchema: {
      type: 'object',
      properties: {
        malwareId: {
          type: 'string',
          description: 'The ID of the malware',
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
      required: ['malwareId', 'indicatorType'],
    },
  },
  // Hunting Queries - Campaigns
  {
    name: 'get_campaigns_by_sector',
    description: 'Get all campaigns targeting a specific sector',
    inputSchema: {
      type: 'object',
      properties: {
        sectorId: {
          type: 'string',
          description: 'The ID of the sector',
        },
        count: {
          type: 'number',
          description: 'Maximum number of campaigns to retrieve',
          default: 10,
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
      required: ['sectorId'],
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
] as const;

# Step-by-Step Guide: Implementing New Queries

## Overview
This guide walks you through adding a new query file and exposing its queries as MCP tools.

---

## Example Scenario
Let's say you created `queries/vulnerabilities.ts` with these queries:
- `VULNERABILITY_BY_ID_QUERY`
- `ALL_VULNERABILITIES_QUERY`
- `SEARCH_VULNERABILITIES_QUERY`

---

## Step 1: Import the Queries

**File:** `request-handlers.ts`

Add the import at the top of the file:

```typescript
// Existing imports...
import {
  ALL_MARKING_DEFINITIONS_QUERY,
  ALL_LABELS_QUERY,
} from './queries/references.js';

// 👇 ADD YOUR NEW IMPORT
import {
  VULNERABILITY_BY_ID_QUERY,
  ALL_VULNERABILITIES_QUERY,
  SEARCH_VULNERABILITIES_QUERY,
} from './queries/vulnerabilities.js';
```

---

## Step 2: Add Handler Methods

**File:** `request-handlers.ts`

Add handler methods in the `RequestHandler` class:

```typescript
export class RequestHandler {
  // ... existing methods ...

  /**
   * Get vulnerability by ID
   */
  async getVulnerabilityById(args: ToolArguments) {
    if (!args.id) {
      throw new McpError(ErrorCode.InvalidParams, 'Vulnerability ID is required');
    }
    console.error(`[MCP] Fetching vulnerability with ID: ${args.id}`);
    return this.executeQuery({
      query: VULNERABILITY_BY_ID_QUERY,
      variables: { id: args.id },
      formatter: formatters.formatVulnerabilityResponse,
    });
  }

  /**
   * List all vulnerabilities
   */
  async listVulnerabilities(args: ToolArguments) {
    console.error('[MCP] Fetching all vulnerabilities');
    return this.executeQuery({
      query: ALL_VULNERABILITIES_QUERY,
      variables: { first: args.first ?? 10 },
      formatter: formatters.formatVulnerabilitiesResponse,
    });
  }

  /**
   * Search vulnerabilities
   */
  async searchVulnerabilities(args: ToolArguments) {
    if (!args.query) {
      throw new McpError(ErrorCode.InvalidParams, 'Query parameter is required');
    }
    console.error(`[MCP] Searching vulnerabilities with query: ${args.query}`);
    return this.executeQuery({
      query: SEARCH_VULNERABILITIES_QUERY,
      variables: { search: args.query, first: args.first ?? 10 },
      formatter: formatters.formatVulnerabilitiesResponse,
    });
  }
}
```

---

## Step 3: Add Tool-to-Handler Mappings

**File:** `request-handlers.ts`

Update the `TOOL_HANDLERS` object at the bottom of the file:

```typescript
export const TOOL_HANDLERS: Record<string, keyof RequestHandler> = {
  'get_latest_reports': 'getLatestReports',
  'get_report_by_id': 'getReportById',
  // ... existing mappings ...
  'list_labels': 'listLabels',
  
  // 👇 ADD YOUR NEW MAPPINGS
  'get_vulnerability_by_id': 'getVulnerabilityById',
  'list_vulnerabilities': 'listVulnerabilities',
  'search_vulnerabilities': 'searchVulnerabilities',
};
```

---

## Step 4: Add Response Formatters (Optional)

**File:** `formatters.ts`

If your data needs custom formatting, add formatter functions:

```typescript
/**
 * Format vulnerability response
 */
export function formatVulnerabilityResponse(data: any) {
  return {
    id: data.vulnerability.id,
    name: data.vulnerability.name || 'Unnamed',
    description: data.vulnerability.description || '',
    severity: data.vulnerability.x_opencti_severity,
    cvssScore: data.vulnerability.x_opencti_cvss_score,
    published: data.vulnerability.published,
    created: data.vulnerability.created_at,
    modified: data.vulnerability.updated_at,
  };
}

/**
 * Format vulnerabilities list response
 */
export function formatVulnerabilitiesResponse(data: any) {
  return data.vulnerabilities.edges.map((edge: any) => ({
    id: edge.node.id,
    name: edge.node.name || 'Unnamed',
    description: edge.node.description || '',
    severity: edge.node.x_opencti_severity,
    cvssScore: edge.node.x_opencti_cvss_score,
    published: edge.node.published,
  }));
}
```

**Note:** If you don't need custom formatting, you can use `(data) => data` as the formatter.

---

## Step 5: Add Tool Definitions

**File:** `tool-definitions.ts`

Add the tool schemas to the `TOOL_DEFINITIONS` array:

```typescript
export const TOOL_DEFINITIONS = [
  // ... existing tool definitions ...
  
  // 👇 ADD YOUR NEW TOOL DEFINITIONS
  {
    name: 'get_vulnerability_by_id',
    description: 'Get vulnerability information by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Vulnerability ID',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_vulnerabilities',
    description: 'List all vulnerabilities',
    inputSchema: {
      type: 'object',
      properties: {
        first: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 10,
        },
      },
    },
  },
  {
    name: 'search_vulnerabilities',
    description: 'Search for vulnerabilities',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
        first: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 10,
        },
      },
      required: ['query'],
    },
  },
] as const;
```

---

## Step 6: Add TypeScript Types (Optional)

**File:** `types.ts`

Add type definitions for better type safety:

```typescript
export interface Vulnerability {
  id: string;
  name?: string;
  description?: string;
  x_opencti_severity?: string;
  x_opencti_cvss_score?: number;
  published?: string;
  created_at?: string;
  updated_at?: string;
}
```

---

## Complete Checklist

When adding new queries, verify you've completed all these steps:

- [ ] **Step 1:** Import queries in `request-handlers.ts`
- [ ] **Step 2:** Add handler methods in `RequestHandler` class
- [ ] **Step 3:** Add mappings to `TOOL_HANDLERS` object
- [ ] **Step 4:** Add formatters in `formatters.ts` (if needed)
- [ ] **Step 5:** Add tool definitions to `tool-definitions.ts`
- [ ] **Step 6:** Add TypeScript types to `types.ts` (optional)

---

## Quick Reference: Files to Modify

| File | What to Add | Required? |
|------|-------------|-----------|
| `request-handlers.ts` | Import queries, add handler methods, add mappings | ✅ Yes |
| `tool-definitions.ts` | Add tool schema definitions | ✅ Yes |
| `formatters.ts` | Add response formatting functions | ⚠️ If custom formatting needed |
| `types.ts` | Add TypeScript interfaces | ℹ️ Optional (recommended) |

---

## Common Patterns

### Pattern 1: Get Single Item by ID

```typescript
// Handler
async getItemById(args: ToolArguments) {
  if (!args.id) {
    throw new McpError(ErrorCode.InvalidParams, 'Item ID is required');
  }
  console.error(`[MCP] Fetching item with ID: ${args.id}`);
  return this.executeQuery({
    query: ITEM_BY_ID_QUERY,
    variables: { id: args.id },
    formatter: formatters.formatItemResponse,
  });
}

// Tool Definition
{
  name: 'get_item_by_id',
  description: 'Get item by ID',
  inputSchema: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Item ID' }
    },
    required: ['id'],
  },
}
```

### Pattern 2: List Items with Pagination

```typescript
// Handler
async listItems(args: ToolArguments) {
  console.error('[MCP] Fetching all items');
  return this.executeQuery({
    query: ALL_ITEMS_QUERY,
    variables: { first: args.first ?? 10 },
    formatter: formatters.formatItemsResponse,
  });
}

// Tool Definition
{
  name: 'list_items',
  description: 'List all items',
  inputSchema: {
    type: 'object',
    properties: {
      first: {
        type: 'number',
        description: 'Maximum number of results to return',
        default: 10,
      },
    },
  },
}
```

### Pattern 3: Search with Query

```typescript
// Handler
async searchItems(args: ToolArguments) {
  if (!args.query) {
    throw new McpError(ErrorCode.InvalidParams, 'Query parameter is required');
  }
  console.error(`[MCP] Searching items with query: ${args.query}`);
  return this.executeQuery({
    query: SEARCH_ITEMS_QUERY,
    variables: { search: args.query, first: args.first ?? 10 },
    formatter: formatters.formatItemsResponse,
  });
}

// Tool Definition
{
  name: 'search_items',
  description: 'Search for items',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      first: {
        type: 'number',
        description: 'Maximum number of results to return',
        default: 10,
      },
    },
    required: ['query'],
  },
}
```

---

## Testing Your Implementation

After implementing, test with these steps:

1. **Restart the MCP server**
2. **List tools to verify they appear:**
   ```bash
   # Your tools should appear in the list
   ```
3. **Call each tool:**
   ```bash
   # Test with valid parameters
   # Test with missing required parameters
   # Test with invalid parameters
   ```

---

## Troubleshooting

### Tool doesn't appear in list
- ✅ Check `tool-definitions.ts` has the definition
- ✅ Check syntax is correct (missing commas, brackets)

### Tool call fails with "Unknown tool"
- ✅ Check mapping exists in `TOOL_HANDLERS`
- ✅ Check tool name matches exactly between definition and mapping

### "Method not found" error
- ✅ Check handler method exists in `RequestHandler` class
- ✅ Check method name in `TOOL_HANDLERS` matches actual method

### Invalid params error
- ✅ Check required parameters are validated in handler
- ✅ Check tool definition `required` array matches validation

### Response formatting error
- ✅ Check formatter function exists (if specified)
- ✅ Check formatter handles the data structure correctly
- ✅ Use `(data) => data` if no formatting needed

---

## Example: Complete Implementation

Here's a complete example adding vulnerability queries:

**queries/vulnerabilities.ts** (your new file)
```typescript
export const VULNERABILITY_BY_ID_QUERY = `
  query VulnerabilityById($id: String!) {
    vulnerability(id: $id) {
      id
      name
      description
      x_opencti_severity
      x_opencti_cvss_score
    }
  }
`;
```

**request-handlers.ts**
```typescript
// 1. Import
import { VULNERABILITY_BY_ID_QUERY } from './queries/vulnerabilities.js';

// 2. Add handler method
async getVulnerabilityById(args: ToolArguments) {
  if (!args.id) {
    throw new McpError(ErrorCode.InvalidParams, 'Vulnerability ID is required');
  }
  return this.executeQuery({
    query: VULNERABILITY_BY_ID_QUERY,
    variables: { id: args.id },
    formatter: (data) => data.vulnerability,
  });
}

// 3. Add mapping
export const TOOL_HANDLERS = {
  // ... existing
  'get_vulnerability_by_id': 'getVulnerabilityById',
};
```

**tool-definitions.ts**
```typescript
// 5. Add definition
{
  name: 'get_vulnerability_by_id',
  description: 'Get vulnerability information by ID',
  inputSchema: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Vulnerability ID' }
    },
    required: ['id'],
  },
}
```

Done! Your new tool is ready to use.
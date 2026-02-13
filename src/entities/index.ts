// Import all entity components
import { SectorHandlers, SECTOR_TOOLS, SECTOR_HANDLER_MAP } from './sectors.js';
import { GeographyHandlers, GEOGRAPHY_TOOLS, GEOGRAPHY_HANDLER_MAP } from './geography.js';
import { ReportHandlers, REPORT_TOOLS, REPORT_HANDLER_MAP } from './reports.js';
import { CampaignHandlers, CAMPAIGN_TOOLS, CAMPAIGN_HANDLER_MAP } from './campaigns.js';
import { MalwareHandlers, MALWARE_TOOLS, MALWARE_HANDLER_MAP } from './malware.js';
import { IndicatorHandlers, INDICATOR_TOOLS, INDICATOR_HANDLER_MAP } from './indicators.js';
import { RelationshipHandlers, RELATIONSHIP_TOOLS, RELATIONSHIP_HANDLER_MAP } from './relationships.js';

// Re-export all entity handlers
export { SectorHandlers, SECTOR_TOOLS, SECTOR_HANDLER_MAP };
export { GeographyHandlers, GEOGRAPHY_TOOLS, GEOGRAPHY_HANDLER_MAP };
export { ReportHandlers, REPORT_TOOLS, REPORT_HANDLER_MAP };
export { CampaignHandlers, CAMPAIGN_TOOLS, CAMPAIGN_HANDLER_MAP };
export { MalwareHandlers, MALWARE_TOOLS, MALWARE_HANDLER_MAP };
export { IndicatorHandlers, INDICATOR_TOOLS, INDICATOR_HANDLER_MAP };
export { RelationshipHandlers, RELATIONSHIP_TOOLS, RELATIONSHIP_HANDLER_MAP };

// Combine all tools
export const ALL_TOOLS = [
  ...SECTOR_TOOLS,
  ...GEOGRAPHY_TOOLS,
  ...REPORT_TOOLS,
  ...CAMPAIGN_TOOLS,
  ...MALWARE_TOOLS,
  ...INDICATOR_TOOLS,
  ...RELATIONSHIP_TOOLS,
] as const;

// Combine all handler mappings
export const ALL_HANDLER_MAPS = {
  ...SECTOR_HANDLER_MAP,
  ...GEOGRAPHY_HANDLER_MAP,
  ...REPORT_HANDLER_MAP,
  ...CAMPAIGN_HANDLER_MAP,
  ...MALWARE_HANDLER_MAP,
  ...INDICATOR_HANDLER_MAP,
  ...RELATIONSHIP_HANDLER_MAP,
};
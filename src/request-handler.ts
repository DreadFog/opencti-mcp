import { AxiosInstance } from 'axios';
import {
  SectorHandlers,
  GeographyHandlers,
  ReportHandlers,
  CampaignHandlers,
  MalwareHandlers,
  IndicatorHandlers,
  RelationshipHandlers,
} from './entities/index.js';

/**
 * Unified RequestHandler that delegates to entity-specific handlers
 */
export class RequestHandler {
  private sectorHandlers: SectorHandlers;
  private geographyHandlers: GeographyHandlers;
  private reportHandlers: ReportHandlers;
  private campaignHandlers: CampaignHandlers;
  private malwareHandlers: MalwareHandlers;
  private indicatorHandlers: IndicatorHandlers;
  private relationshipHandlers: RelationshipHandlers;

  constructor(axiosInstance: AxiosInstance) {
    this.sectorHandlers = new SectorHandlers(axiosInstance);
    this.geographyHandlers = new GeographyHandlers(axiosInstance);
    this.reportHandlers = new ReportHandlers(axiosInstance);
    this.campaignHandlers = new CampaignHandlers(axiosInstance);
    this.malwareHandlers = new MalwareHandlers(axiosInstance);
    this.indicatorHandlers = new IndicatorHandlers(axiosInstance);
    this.relationshipHandlers = new RelationshipHandlers(axiosInstance);
  }

  // Sector methods
  async getSectorByName(args: any) {
    return this.sectorHandlers.getSectorByName(args);
  }

  async listSectors(args: any) {
    return this.sectorHandlers.listSectors(args);
  }

  // Geography methods
  async listCountries(args: any) {
    return this.geographyHandlers.listCountries(args);
  }

  async listRegions(args: any) {
    return this.geographyHandlers.listRegions(args);
  }

  // Report methods
  async getReportTypes(args: any) {
    return this.reportHandlers.getReportTypes(args);
  }

  async getReportsByFilters(args: any) {
    return this.reportHandlers.getReportsByFilters(args);
  }

  // Campaign methods
  async getCampaignsByFilters(args: any) {
    return this.campaignHandlers.getCampaignsByFilters(args);
  }

  // Malware methods
  async getMalwareByName(args: any) {
    return this.malwareHandlers.getMalwareByName(args);
  }

  // Indicator methods
  async getIndicatorsByObjectAndType(args: any) {
    return this.indicatorHandlers.getIndicatorsByObjectAndType(args);
  }

  // Relationship methods
  async getStixRelationshipsDistribution(args: any) {
    return this.relationshipHandlers.getStixRelationshipsDistribution(args);
  }

  async getStixRelationshipsDistributionWithDynamicFilters(args: any) {
    return this.relationshipHandlers.getStixRelationshipsDistributionWithDynamicFilters(args);
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
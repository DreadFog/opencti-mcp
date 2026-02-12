export const GET_SECTORS_QUERY = `
query FindSectorsByNameAndCreator($search: String!) {
  sectors(
    search: $search
    orderBy: name
    orderMode: asc
    filters: {
      mode: and
      filters: [
        {
          key: "creator_id"
          values: ["6b85141f-d822-48a9-99f7-20f404a51a45"] # Opencti user is hardcoded to only retrieve main sectors
          operator: eq
        }
      ]
      filterGroups: []
    }
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

export const GET_REPORTS_BY_SECTOR_QUERY = `
query GetReportsBySector($sectorId: Any!, $first: Int!) {
  reports(
    first: $first
    orderBy: published
    orderMode: desc
    filters: {
      mode: and
      filters: [
        {
          key: "objects"
          values: [$sectorId]
          operator: eq
        }
      ]
      filterGroups: []
    }
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
      }
    }
  }
}
`;

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

export const GET_REPORTS_BY_TYPE_QUERY = `
query GetReportsByType($reportType: [Any!]!, $first: Int!) {
  reports(
    first: $first
    orderBy: published
    orderMode: desc
    filters: {
      mode: and
      filters: [
        {
          key: "report_types"
          values: $reportType
          operator: eq
        }
      ]
      filterGroups: []
    }
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
      }
    }
  }
}
`;

export const GET_MALARE_BY_NAME_QUERY = `
query GetMalwareByName($search: String!) {
  malwares(
    search: $search
    orderBy: name
    orderMode: asc
  ) {
    edges {
      node {
        id
        name
        description
        malware_types
        is_family
        first_seen
        last_seen
        aliases
      }
    }
  }
}
`;

export const GET_LIST_AVAILABLE_SECTORS_QUERY = `
query ListAvailableSectors {
  sectors(
    orderBy: name
    orderMode: asc
    filters: {
      mode: and
      filters: [
        {
          key: "creator_id"
          values: ["6b85141f-d822-48a9-99f7-20f404a51a45"]
          operator: eq
        }
      ]
      filterGroups: []
    }
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

export const GET_CAMPAIGNS_BY_SECTOR_QUERY = `
query GetCampaignsBySector($count: Int!, $cursor: ID, $orderBy: CampaignsOrdering, $orderMode: OrderingMode, $filters: FilterGroup) {
  campaigns(
    first: $count
    after: $cursor
    orderBy: $orderBy
    orderMode: $orderMode
    filters: $filters
  ) {
    edges {
      node {
        id
        name
        description
        first_seen
        last_seen
      }
    }
  }
}
`;

export const GET_INDICATORS_BY_MALWARE_WITH_TYPE_QUERY = `
query GetIndicatorsByMalwareAndType($count: Int!, $cursor: ID, $filters: FilterGroup, $orderBy: IndicatorsOrdering, $orderMode: OrderingMode) {
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

export const GET_INDICATORS_BY_CAMPAIGN_QUERY = `
query GetIndicatorsByCampaign($count: Int!, $cursor: ID, $filters: FilterGroup, $orderBy: IndicatorsOrdering, $orderMode: OrderingMode) {
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
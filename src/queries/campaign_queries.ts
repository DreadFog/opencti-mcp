
export const GET_CAMPAIGNS_BY_FILTERS_QUERY = `
query GetCampaignsByFilters($count: Int!, $cursor: ID, $filters: FilterGroup, $orderBy: CampaignsOrdering, $orderMode: OrderingMode) {
  campaigns(
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
        first_seen
        last_seen
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

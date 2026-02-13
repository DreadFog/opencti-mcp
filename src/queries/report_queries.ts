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

export const GET_REPORTS_BY_FILTERS_QUERY = `
query GetReportsByFilters($count: Int!, $cursor: ID, $filters: FilterGroup, $orderBy: ReportsOrdering, $orderMode: OrderingMode) {
  reports(
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
        published
        report_types
        confidence
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

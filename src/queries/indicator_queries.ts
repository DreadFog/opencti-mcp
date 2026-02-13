export const GET_INDICATORS_BY_OBJECT_WITH_TYPE_QUERY = `
query GetIndicatorsByObjectAndType($count: Int!, $cursor: ID, $filters: FilterGroup, $orderBy: IndicatorsOrdering, $orderMode: OrderingMode) {
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

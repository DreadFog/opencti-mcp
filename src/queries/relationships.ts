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

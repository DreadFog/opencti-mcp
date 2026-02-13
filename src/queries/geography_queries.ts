export const GET_LIST_AVAILABLE_COUNTRIES_QUERY = `
query ListAvailableCountries($search: String) {
  countries(
    search: $search
    orderBy: name
    orderMode: asc
  ) {
    edges {
      node {
        id
        name
        description
        x_opencti_aliases
      }
    }
  }
}
`;

export const GET_LIST_AVAILABLE_REGIONS_QUERY = `
query ListAvailableRegions($search: String) {
  regions(
    search: $search
    orderBy: name
    orderMode: asc
  ) {
    edges {
      node {
        id
        name
        description
        x_opencti_aliases
      }
    }
  }
}
`;

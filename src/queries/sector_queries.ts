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

targetScope = 'subscription'

@minLength(1)
@maxLength(64)
@description('Name of the environment')
param environmentName string

@minLength(1)
@description('Primary location for all resources')
param location string

@description('OpenCTI URL endpoint')
param openctiUrl string

@secure()
@description('OpenCTI API token')
param openctiToken string

@secure()
@description('Optional: MCP authentication token')
param mcpAuthToken string = ''

@description('Id of the user or app to assign application roles')
param principalId string = ''

var tags = {
  'azd-env-name': environmentName
}

var abbrs = loadJsonContent('./abbreviations.json')
var resourceToken = toLower(uniqueString(subscription().id, environmentName, location))

resource rg 'Microsoft.Resources/resourceGroups@2022-09-01' = {
  name: 'rg-${environmentName}'
  location: location
  tags: tags
}

module monitoring './monitoring.bicep' = {
  name: 'monitoring'
  scope: rg
  params: {
    location: location
    tags: tags
    logAnalyticsName: '${abbrs.operationalInsightsWorkspaces}${resourceToken}'
    applicationInsightsName: '${abbrs.insightsComponents}${resourceToken}'
  }
}

module containerAppsEnvironment './container-apps-environment.bicep' = {
  name: 'container-apps-environment'
  scope: rg
  params: {
    name: '${abbrs.appManagedEnvironments}${resourceToken}'
    location: location
    tags: tags
    logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsWorkspaceId
  }
}

module containerRegistry './container-registry.bicep' = {
  name: 'container-registry'
  scope: rg
  params: {
    name: '${abbrs.containerRegistryRegistries}${resourceToken}'
    location: location
    tags: tags
  }
}

module app './container-app.bicep' = {
  name: 'app'
  scope: rg
  params: {
    name: '${abbrs.appContainerApps}web-${resourceToken}'
    location: location
    tags: union(tags, { 'azd-service-name': 'web' })
    containerAppsEnvironmentName: containerAppsEnvironment.outputs.name
    containerRegistryName: containerRegistry.outputs.name
    containerName: 'opencti-mcp-server'
    targetPort: 3000
    env: [
      {
        name: 'OPENCTI_URL'
        value: openctiUrl
      }
      {
        name: 'OPENCTI_TOKEN'
        secretRef: 'opencti-token'
      }
      {
        name: 'MCP_AUTH_TOKEN'
        secretRef: 'mcp-auth-token'
      }
      {
        name: 'PORT'
        value: '3000'
      }
    ]
    secrets: [
      {
        name: 'opencti-token'
        value: openctiToken
      }
      {
        name: 'mcp-auth-token'
        value: mcpAuthToken
      }
    ]
  }
}

output AZURE_CONTAINER_REGISTRY_ENDPOINT string = containerRegistry.outputs.loginServer
output AZURE_CONTAINER_REGISTRY_NAME string = containerRegistry.outputs.name
output SERVICE_WEB_ENDPOINT string = app.outputs.uri
output SERVICE_WEB_NAME string = app.outputs.name
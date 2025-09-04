// Integration service for external systems
import { supabase } from '../supabaseClient';

class IntegrationService {
  constructor() {
    this.integrations = {
      slack: {
        name: 'Slack',
        description: 'Send notifications to Slack channels',
        enabled: false,
        config: {
          webhookUrl: '',
          channel: '#it-requests',
          username: 'IT Service Bot',
          iconEmoji: ':computer:'
        }
      },
      teams: {
        name: 'Microsoft Teams',
        description: 'Send notifications to Teams channels',
        enabled: false,
        config: {
          webhookUrl: '',
          channel: 'IT Requests'
        }
      },
      jira: {
        name: 'Jira',
        description: 'Sync requests with Jira tickets',
        enabled: false,
        config: {
          baseUrl: '',
          username: '',
          apiToken: '',
          projectKey: 'IT'
        }
      },
      servicenow: {
        name: 'ServiceNow',
        description: 'Sync with ServiceNow incidents',
        enabled: false,
        config: {
          instanceUrl: '',
          username: '',
          password: '',
          tableName: 'incident'
        }
      },
      webhook: {
        name: 'Generic Webhook',
        description: 'Send data to custom webhook endpoints',
        enabled: false,
        config: {
          url: '',
          method: 'POST',
          headers: {},
          auth: {
            type: 'none', // none, basic, bearer, api_key
            credentials: {}
          }
        }
      }
    };
  }

  // Initialize integrations from database
  async initializeIntegrations() {
    try {
      const { data, error } = await supabase
        .from('integration_configs')
        .select('*');

      if (error) throw error;

      data.forEach(config => {
        if (this.integrations[config.name]) {
          this.integrations[config.name] = {
            ...this.integrations[config.name],
            enabled: config.enabled,
            config: { ...this.integrations[config.name].config, ...config.config }
          };
        }
      });
    } catch (error) {
      console.error('Error initializing integrations:', error);
    }
  }

  // Save integration configuration
  async saveIntegrationConfig(integrationName, config) {
    try {
      const { data, error } = await supabase
        .from('integration_configs')
        .upsert([{
          name: integrationName,
          enabled: config.enabled,
          config: config.config,
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Update local config
      this.integrations[integrationName] = {
        ...this.integrations[integrationName],
        enabled: config.enabled,
        config: config.config
      };

      return data;
    } catch (error) {
      console.error('Error saving integration config:', error);
      throw error;
    }
  }

  // Test integration connection
  async testIntegration(integrationName) {
    try {
      const integration = this.integrations[integrationName];
      if (!integration) {
        throw new Error(`Integration ${integrationName} not found`);
      }

      switch (integrationName) {
        case 'slack':
          return await this.testSlackIntegration(integration.config);
        case 'teams':
          return await this.testTeamsIntegration(integration.config);
        case 'jira':
          return await this.testJiraIntegration(integration.config);
        case 'servicenow':
          return await this.testServiceNowIntegration(integration.config);
        case 'webhook':
          return await this.testWebhookIntegration(integration.config);
        default:
          throw new Error(`Test not implemented for ${integrationName}`);
      }
    } catch (error) {
      console.error(`Error testing ${integrationName} integration:`, error);
      throw error;
    }
  }

  // Test Slack integration
  async testSlackIntegration(config) {
    const testMessage = {
      text: 'IT Service Management System - Test Message',
      channel: config.channel,
      username: config.username,
      icon_emoji: config.iconEmoji,
      attachments: [{
        color: 'good',
        fields: [{
          title: 'Test Status',
          value: 'Integration is working correctly',
          short: false
        }]
      }]
    };

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testMessage)
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.statusText}`);
    }

    return { success: true, message: 'Slack integration test successful' };
  }

  // Test Teams integration
  async testTeamsIntegration(config) {
    const testMessage = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor: '0076D7',
      summary: 'IT Service Management System - Test Message',
      sections: [{
        activityTitle: 'Integration Test',
        activitySubtitle: 'IT Service Management System',
        activityImage: 'https://via.placeholder.com/64x64/0076D7/FFFFFF?text=IT',
        facts: [{
          name: 'Status',
          value: 'Integration is working correctly'
        }],
        markdown: true
      }]
    };

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testMessage)
    });

    if (!response.ok) {
      throw new Error(`Teams webhook failed: ${response.statusText}`);
    }

    return { success: true, message: 'Teams integration test successful' };
  }

  // Test Jira integration
  async testJiraIntegration(config) {
    const auth = btoa(`${config.username}:${config.apiToken}`);
    
    const response = await fetch(`${config.baseUrl}/rest/api/3/myself`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Jira API failed: ${response.statusText}`);
    }

    const user = await response.json();
    return { success: true, message: `Jira integration test successful. Connected as: ${user.displayName}` };
  }

  // Test ServiceNow integration
  async testServiceNowIntegration(config) {
    const auth = btoa(`${config.username}:${config.password}`);
    
    const response = await fetch(`${config.instanceUrl}/api/now/table/sys_user?sysparm_limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`ServiceNow API failed: ${response.statusText}`);
    }

    return { success: true, message: 'ServiceNow integration test successful' };
  }

  // Test webhook integration
  async testWebhookIntegration(config) {
    const testPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      message: 'IT Service Management System - Test Message'
    };

    const headers = {
      'Content-Type': 'application/json',
      ...config.headers
    };

    // Add authentication headers
    if (config.auth.type !== 'none') {
      this.addAuthHeaders(headers, config.auth);
    }

    const response = await fetch(config.url, {
      method: config.method,
      headers: headers,
      body: JSON.stringify(testPayload)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.statusText}`);
    }

    return { success: true, message: 'Webhook integration test successful' };
  }

  // Add authentication headers
  addAuthHeaders(headers, auth) {
    switch (auth.type) {
      case 'basic':
        headers['Authorization'] = `Basic ${btoa(`${auth.credentials.username}:${auth.credentials.password}`)}`;
        break;
      case 'bearer':
        headers['Authorization'] = `Bearer ${auth.credentials.token}`;
        break;
      case 'api_key':
        headers[auth.credentials.headerName || 'X-API-Key'] = auth.credentials.apiKey;
        break;
    }
  }

  // Send notification to all enabled integrations
  async sendNotification(eventType, data) {
    const enabledIntegrations = Object.entries(this.integrations)
      .filter(([name, integration]) => integration.enabled);

    const promises = enabledIntegrations.map(([name, integration]) => {
      return this.sendToIntegration(name, eventType, data);
    });

    try {
      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Error sending notifications to integrations:', error);
    }
  }

  // Send data to specific integration
  async sendToIntegration(integrationName, eventType, data) {
    try {
      const integration = this.integrations[integrationName];
      if (!integration || !integration.enabled) {
        return;
      }

      switch (integrationName) {
        case 'slack':
          return await this.sendToSlack(eventType, data, integration.config);
        case 'teams':
          return await this.sendToTeams(eventType, data, integration.config);
        case 'jira':
          return await this.sendToJira(eventType, data, integration.config);
        case 'servicenow':
          return await this.sendToServiceNow(eventType, data, integration.config);
        case 'webhook':
          return await this.sendToWebhook(eventType, data, integration.config);
        default:
          console.warn(`Integration ${integrationName} not implemented`);
      }
    } catch (error) {
      console.error(`Error sending to ${integrationName}:`, error);
    }
  }

  // Send to Slack
  async sendToSlack(eventType, data, config) {
    const message = this.formatSlackMessage(eventType, data);
    
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...message,
        channel: config.channel,
        username: config.username,
        icon_emoji: config.iconEmoji
      })
    });

    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.statusText}`);
    }
  }

  // Format Slack message
  formatSlackMessage(eventType, data) {
    const baseMessage = {
      text: `IT Request ${eventType.replace('_', ' ').toUpperCase()}`,
      attachments: [{
        color: this.getSlackColor(eventType),
        fields: [
          {
            title: 'Request Number',
            value: data.requestNumber || `#${data.id}`,
            short: true
          },
          {
            title: 'Title',
            value: data.title,
            short: true
          },
          {
            title: 'Priority',
            value: data.priority || 'Unknown',
            short: true
          },
          {
            title: 'Status',
            value: data.status || 'Unknown',
            short: true
          }
        ]
      }]
    };

    if (data.description) {
      baseMessage.attachments[0].fields.push({
        title: 'Description',
        value: data.description.substring(0, 200) + (data.description.length > 200 ? '...' : ''),
        short: false
      });
    }

    return baseMessage;
  }

  // Get Slack color for event type
  getSlackColor(eventType) {
    const colors = {
      created: 'good',
      updated: 'warning',
      resolved: 'good',
      closed: '#36a64f',
      assigned: '#36a64f',
      escalated: 'danger'
    };
    return colors[eventType] || '#36a64f';
  }

  // Send to Teams
  async sendToTeams(eventType, data, config) {
    const message = this.formatTeamsMessage(eventType, data);
    
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      throw new Error(`Teams notification failed: ${response.statusText}`);
    }
  }

  // Format Teams message
  formatTeamsMessage(eventType, data) {
    return {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor: this.getTeamsColor(eventType),
      summary: `IT Request ${eventType.replace('_', ' ').toUpperCase()}`,
      sections: [{
        activityTitle: data.title,
        activitySubtitle: `Request ${eventType.replace('_', ' ').toUpperCase()}`,
        activityImage: 'https://via.placeholder.com/64x64/0076D7/FFFFFF?text=IT',
        facts: [
          {
            name: 'Request Number',
            value: data.requestNumber || `#${data.id}`
          },
          {
            name: 'Priority',
            value: data.priority || 'Unknown'
          },
          {
            name: 'Status',
            value: data.status || 'Unknown'
          }
        ],
        markdown: true
      }]
    };
  }

  // Get Teams color for event type
  getTeamsColor(eventType) {
    const colors = {
      created: '0076D7',
      updated: 'FF8C00',
      resolved: '00B294',
      closed: '00B294',
      assigned: '0076D7',
      escalated: 'D13438'
    };
    return colors[eventType] || '0076D7';
  }

  // Send to Jira
  async sendToJira(eventType, data, config) {
    const issue = this.formatJiraIssue(eventType, data);
    
    const auth = btoa(`${config.username}:${config.apiToken}`);
    
    const response = await fetch(`${config.baseUrl}/rest/api/3/issue`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(issue)
    });

    if (!response.ok) {
      throw new Error(`Jira integration failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  }

  // Format Jira issue
  formatJiraIssue(eventType, data) {
    return {
      fields: {
        project: {
          key: 'IT'
        },
        summary: data.title,
        description: {
          type: 'doc',
          version: 1,
          content: [{
            type: 'paragraph',
            content: [{
              type: 'text',
              text: data.description || 'No description provided'
            }]
          }]
        },
        issuetype: {
          name: 'Task'
        },
        priority: {
          name: this.mapPriorityToJira(data.priority)
        },
        labels: ['it-service', 'imported']
      }
    };
  }

  // Map priority to Jira priority
  mapPriorityToJira(priority) {
    const mapping = {
      'Critical': 'Highest',
      'High': 'High',
      'Medium': 'Medium',
      'Low': 'Low'
    };
    return mapping[priority] || 'Medium';
  }

  // Send to ServiceNow
  async sendToServiceNow(eventType, data, config) {
    const incident = this.formatServiceNowIncident(eventType, data);
    
    const auth = btoa(`${config.username}:${config.password}`);
    
    const response = await fetch(`${config.instanceUrl}/api/now/table/${config.tableName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(incident)
    });

    if (!response.ok) {
      throw new Error(`ServiceNow integration failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  }

  // Format ServiceNow incident
  formatServiceNowIncident(eventType, data) {
    return {
      short_description: data.title,
      description: data.description || 'No description provided',
      priority: this.mapPriorityToServiceNow(data.priority),
      category: 'IT Service Request',
      subcategory: 'General',
      caller_id: data.requester?.email || 'system@company.com',
      assigned_to: data.assignee?.email || '',
      state: this.mapStatusToServiceNow(data.status)
    };
  }

  // Map priority to ServiceNow priority
  mapPriorityToServiceNow(priority) {
    const mapping = {
      'Critical': '1',
      'High': '2',
      'Medium': '3',
      'Low': '4'
    };
    return mapping[priority] || '3';
  }

  // Map status to ServiceNow state
  mapStatusToServiceNow(status) {
    const mapping = {
      'open': 'New',
      'assigned': 'Assigned',
      'in_progress': 'In Progress',
      'resolved': 'Resolved',
      'closed': 'Closed'
    };
    return mapping[status] || 'New';
  }

  // Send to webhook
  async sendToWebhook(eventType, data, config) {
    const payload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data: data
    };

    const headers = {
      'Content-Type': 'application/json',
      ...config.headers
    };

    // Add authentication headers
    if (config.auth.type !== 'none') {
      this.addAuthHeaders(headers, config.auth);
    }

    const response = await fetch(config.url, {
      method: config.method,
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // Get integration status
  getIntegrationStatus() {
    return Object.entries(this.integrations).map(([name, integration]) => ({
      name,
      displayName: integration.name,
      description: integration.description,
      enabled: integration.enabled,
      config: integration.config
    }));
  }

  // Enable/disable integration
  async toggleIntegration(integrationName, enabled) {
    try {
      const integration = this.integrations[integrationName];
      if (!integration) {
        throw new Error(`Integration ${integrationName} not found`);
      }

      await this.saveIntegrationConfig(integrationName, {
        enabled,
        config: integration.config
      });

      return { success: true };
    } catch (error) {
      console.error('Error toggling integration:', error);
      throw error;
    }
  }
}

export const integrationService = new IntegrationService();

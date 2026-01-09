import { z } from 'zod';
import { JiraClient } from '../jira-client.js';
import { JiraCreateIssueRequest } from '../types/jira.js';

export const createIssueSchema = z.object({
  projectKey: z.string().describe('Project key (e.g., PROJ)'),
  issueType: z.string().describe('Issue type name (e.g., Bug, Task, Story)'),
  summary: z.string().describe('Issue summary/title'),
  description: z.string().optional().describe('Issue description'),
  priority: z.string().optional().describe('Priority name (e.g., High, Medium, Low)'),
  assignee: z.string().optional().describe('Assignee username or account ID'),
  labels: z.array(z.string()).optional().describe('Array of labels'),
  components: z.array(z.string()).optional().describe('Array of component names'),
  customFields: z.record(z.any()).optional().describe('Custom fields as key-value pairs'),
});

export type CreateIssueArgs = z.infer<typeof createIssueSchema>;

export const createIssueTool = {
  name: 'jira_create_issue',
  description: 'Create a new Jira issue in a specified project',
  inputSchema: {
    type: 'object',
    properties: {
      projectKey: {
        type: 'string',
        description: 'Project key (e.g., PROJ)',
      },
      issueType: {
        type: 'string',
        description: 'Issue type name (e.g., Bug, Task, Story)',
      },
      summary: {
        type: 'string',
        description: 'Issue summary/title',
      },
      description: {
        type: 'string',
        description: 'Issue description',
      },
      priority: {
        type: 'string',
        description: 'Priority name (e.g., High, Medium, Low)',
      },
      assignee: {
        type: 'string',
        description: 'Assignee username or account ID',
      },
      labels: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of labels',
      },
      components: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of component names',
      },
      customFields: {
        type: 'object',
        description: 'Custom fields as key-value pairs',
      },
    },
    required: ['projectKey', 'issueType', 'summary'],
  },
};

export const handleCreateIssue = async (args: CreateIssueArgs, client: JiraClient) => {
  const request: JiraCreateIssueRequest = {
    fields: {
      project: {
        key: args.projectKey,
      },
      summary: args.summary,
      issuetype: {
        name: args.issueType,
      },
    },
  };

  if (args.description) {
    request.fields.description = args.description;
  }

  if (args.priority) {
    request.fields.priority = { name: args.priority };
  }

  if (args.assignee) {
    // Try both name and accountId for compatibility
    request.fields.assignee = args.assignee.includes('@') || args.assignee.length > 20
      ? { accountId: args.assignee }
      : { name: args.assignee };
  }

  if (args.labels && args.labels.length > 0) {
    request.fields.labels = args.labels;
  }

  if (args.components && args.components.length > 0) {
    request.fields.components = args.components.map(name => ({ name }));
  }

  if (args.customFields) {
    Object.assign(request.fields, args.customFields);
  }

  const issue = await client.createIssue(request);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          success: true,
          issue: {
            key: issue.key,
            id: issue.id,
            self: issue.self,
            summary: issue.fields.summary,
            status: issue.fields.status.name,
            issueType: issue.fields.issuetype.name,
          },
        }, null, 2),
      },
    ],
  };
};



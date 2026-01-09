import { z } from 'zod';
import { JiraClient } from '../jira-client.js';

export const getIssueSchema = z.object({
  issueKey: z.string().describe('Issue key (e.g., PROJ-123) or ID'),
  fields: z.array(z.string()).optional().describe('List of fields to include in response (default: all fields)'),
});

export type GetIssueArgs = z.infer<typeof getIssueSchema>;

export const getIssueTool = {
  name: 'jira_get_issue',
  description: 'Get detailed information about a specific Jira issue by its key (e.g., PROJ-123) or ID',
  inputSchema: {
    type: 'object',
    properties: {
      issueKey: {
        type: 'string',
        description: 'Issue key (e.g., PROJ-123) or ID',
      },
      fields: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of fields to include in response (default: all fields)',
      },
    },
    required: ['issueKey'],
  },
};

export const handleGetIssue = async (args: GetIssueArgs, client: JiraClient) => {
  const issue = await client.getIssue(args.issueKey, args.fields);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          key: issue.key,
          id: issue.id,
          self: issue.self,
          fields: {
            summary: issue.fields.summary,
            description: issue.fields.description,
            status: {
              name: issue.fields.status.name,
              category: issue.fields.status.statusCategory.name,
            },
            issueType: {
              name: issue.fields.issuetype.name,
              subtask: issue.fields.issuetype.subtask,
            },
            project: {
              key: issue.fields.project.key,
              name: issue.fields.project.name,
            },
            priority: issue.fields.priority ? {
              name: issue.fields.priority.name,
            } : null,
            assignee: issue.fields.assignee ? {
              displayName: issue.fields.assignee.displayName,
              emailAddress: issue.fields.assignee.emailAddress,
            } : null,
            reporter: issue.fields.reporter ? {
              displayName: issue.fields.reporter.displayName,
              emailAddress: issue.fields.reporter.emailAddress,
            } : null,
            created: issue.fields.created,
            updated: issue.fields.updated,
            resolutiondate: issue.fields.resolutiondate,
            labels: issue.fields.labels,
            components: issue.fields.components?.map(c => c.name),
            fixVersions: issue.fields.fixVersions?.map(v => v.name),
          },
        }, null, 2),
      },
    ],
  };
};



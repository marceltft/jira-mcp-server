import { z } from 'zod';
import { JiraClient } from '../jira-client.js';
import { JiraUpdateIssueRequest } from '../types/jira.js';

export const updateIssueSchema = z.object({
  issueKey: z.string().describe('Issue key (e.g., PROJ-123) or ID'),
  fields: z.record(z.any()).describe('Fields to update as key-value pairs'),
});

export type UpdateIssueArgs = z.infer<typeof updateIssueSchema>;

export const updateIssueTool = {
  name: 'jira_update_issue',
  description: 'Update fields of an existing Jira issue. Common fields: summary, description, priority, assignee, labels, components',
  inputSchema: {
    type: 'object',
    properties: {
      issueKey: {
        type: 'string',
        description: 'Issue key (e.g., PROJ-123) or ID',
      },
      fields: {
        type: 'object',
        description: 'Fields to update as key-value pairs. Examples: {"summary": "New title", "description": "New description", "priority": {"name": "High"}}',
      },
    },
    required: ['issueKey', 'fields'],
  },
};

export const handleUpdateIssue = async (args: UpdateIssueArgs, client: JiraClient) => {
  const request: JiraUpdateIssueRequest = {
    fields: args.fields,
  };

  await client.updateIssue(args.issueKey, request);

  // Fetch updated issue to confirm changes
  const updatedIssue = await client.getIssue(args.issueKey);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: `Issue ${args.issueKey} updated successfully`,
          issue: {
            key: updatedIssue.key,
            summary: updatedIssue.fields.summary,
            status: updatedIssue.fields.status.name,
            updated: updatedIssue.fields.updated,
          },
        }, null, 2),
      },
    ],
  };
};



import { z } from 'zod';
import { JiraClient } from '../jira-client.js';

export const searchIssuesSchema = z.object({
  jql: z.string().describe('JQL (Jira Query Language) query string'),
  maxResults: z.number().optional().default(50).describe('Maximum number of results to return (default: 50)'),
  nextPageToken: z.string().optional().describe('Token for fetching next page of results (from previous search)'),
  fields: z.array(z.string()).optional().describe('List of fields to include in response (default: all fields)'),
});

export type SearchIssuesArgs = z.infer<typeof searchIssuesSchema>;

export const searchIssuesTool = {
  name: 'jira_search',
  description: 'Search for Jira issues using JQL (Jira Query Language). Examples: "project = PROJ AND status = Open", "assignee = currentUser() ORDER BY created DESC". Use nextPageToken from response to paginate.',
  inputSchema: {
    type: 'object',
    properties: {
      jql: {
        type: 'string',
        description: 'JQL (Jira Query Language) query string',
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of results to return (default: 50)',
        default: 50,
      },
      nextPageToken: {
        type: 'string',
        description: 'Token for fetching next page of results (from previous search response)',
      },
      fields: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of fields to include in response (default: all fields)',
      },
    },
    required: ['jql'],
  },
};

export const handleSearchIssues = async (args: SearchIssuesArgs, client: JiraClient) => {
  const result = await client.searchIssues(
    args.jql,
    args.maxResults,
    args.nextPageToken,
    args.fields
  );

  const response: Record<string, any> = {
    issueCount: result.issues.length,
    issues: result.issues.map(issue => ({
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status.name,
      issueType: issue.fields.issuetype.name,
      priority: issue.fields.priority?.name,
      assignee: issue.fields.assignee?.displayName,
      created: issue.fields.created,
      updated: issue.fields.updated,
    })),
  };

  // Add total if available (Jira Server/DC)
  if (result.total !== undefined) {
    response.total = result.total;
  }

  // Add pagination info
  if (result.nextPageToken) {
    response.nextPageToken = result.nextPageToken;
    response.hasMoreResults = true;
  } else if (result.isLast !== undefined) {
    response.isLast = result.isLast;
    response.hasMoreResults = !result.isLast;
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(response, null, 2),
      },
    ],
  };
};

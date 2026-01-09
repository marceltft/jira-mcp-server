import { z } from 'zod';
import { JiraClient } from '../jira-client.js';
import { JiraTransitionRequest } from '../types/jira.js';

export const getTransitionsSchema = z.object({
  issueKey: z.string().describe('Issue key (e.g., PROJ-123) or ID'),
});

export type GetTransitionsArgs = z.infer<typeof getTransitionsSchema>;

export const getTransitionsTool = {
  name: 'jira_get_transitions',
  description: 'Get available status transitions for a Jira issue',
  inputSchema: {
    type: 'object',
    properties: {
      issueKey: {
        type: 'string',
        description: 'Issue key (e.g., PROJ-123) or ID',
      },
    },
    required: ['issueKey'],
  },
};

export const handleGetTransitions = async (args: GetTransitionsArgs, client: JiraClient) => {
  const transitions = await client.getTransitions(args.issueKey);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          issueKey: args.issueKey,
          transitions: transitions.map(t => ({
            id: t.id,
            name: t.name,
            to: {
              name: t.to.name,
              id: t.to.id,
              category: t.to.statusCategory.name,
            },
          })),
        }, null, 2),
      },
    ],
  };
};

export const transitionIssueSchema = z.object({
  issueKey: z.string().describe('Issue key (e.g., PROJ-123) or ID'),
  transitionId: z.string().describe('Transition ID to execute'),
  fields: z.record(z.any()).optional().describe('Optional fields to set during transition'),
});

export type TransitionIssueArgs = z.infer<typeof transitionIssueSchema>;

export const transitionIssueTool = {
  name: 'jira_transition_issue',
  description: 'Transition a Jira issue to a new status. Use jira_get_transitions first to get available transition IDs',
  inputSchema: {
    type: 'object',
    properties: {
      issueKey: {
        type: 'string',
        description: 'Issue key (e.g., PROJ-123) or ID',
      },
      transitionId: {
        type: 'string',
        description: 'Transition ID to execute (get from jira_get_transitions)',
      },
      fields: {
        type: 'object',
        description: 'Optional fields to set during transition',
      },
    },
    required: ['issueKey', 'transitionId'],
  },
};

export const handleTransitionIssue = async (args: TransitionIssueArgs, client: JiraClient) => {
  const request: JiraTransitionRequest = {
    transition: {
      id: args.transitionId,
    },
  };

  if (args.fields) {
    request.fields = args.fields;
  }

  await client.transitionIssue(args.issueKey, request);

  // Fetch updated issue to confirm transition
  const updatedIssue = await client.getIssue(args.issueKey);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: `Issue ${args.issueKey} transitioned successfully`,
          issue: {
            key: updatedIssue.key,
            summary: updatedIssue.fields.summary,
            status: {
              name: updatedIssue.fields.status.name,
              category: updatedIssue.fields.status.statusCategory.name,
            },
          },
        }, null, 2),
      },
    ],
  };
};



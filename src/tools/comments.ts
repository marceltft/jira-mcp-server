import { z } from 'zod';
import { JiraClient } from '../jira-client.js';
import { JiraAddCommentRequest } from '../types/jira.js';

export const getCommentsSchema = z.object({
  issueKey: z.string().describe('Issue key (e.g., PROJ-123) or ID'),
});

export type GetCommentsArgs = z.infer<typeof getCommentsSchema>;

export const getCommentsTool = {
  name: 'jira_get_comments',
  description: 'Get all comments for a Jira issue',
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

export const handleGetComments = async (args: GetCommentsArgs, client: JiraClient) => {
  const comments = await client.getComments(args.issueKey);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          issueKey: args.issueKey,
          total: comments.length,
          comments: comments.map(c => ({
            id: c.id,
            author: {
              displayName: c.author.displayName,
              emailAddress: c.author.emailAddress,
            },
            body: c.body,
            created: c.created,
            updated: c.updated,
            visibility: c.visibility,
          })),
        }, null, 2),
      },
    ],
  };
};

export const addCommentSchema = z.object({
  issueKey: z.string().describe('Issue key (e.g., PROJ-123) or ID'),
  body: z.string().describe('Comment text'),
  visibilityType: z.enum(['group', 'role']).optional().describe('Visibility restriction type'),
  visibilityValue: z.string().optional().describe('Group or role name for visibility restriction'),
});

export type AddCommentArgs = z.infer<typeof addCommentSchema>;

export const addCommentTool = {
  name: 'jira_add_comment',
  description: 'Add a comment to a Jira issue',
  inputSchema: {
    type: 'object',
    properties: {
      issueKey: {
        type: 'string',
        description: 'Issue key (e.g., PROJ-123) or ID',
      },
      body: {
        type: 'string',
        description: 'Comment text',
      },
      visibilityType: {
        type: 'string',
        enum: ['group', 'role'],
        description: 'Visibility restriction type (optional)',
      },
      visibilityValue: {
        type: 'string',
        description: 'Group or role name for visibility restriction (optional)',
      },
    },
    required: ['issueKey', 'body'],
  },
};

export const handleAddComment = async (args: AddCommentArgs, client: JiraClient) => {
  const request: JiraAddCommentRequest = {
    body: args.body,
  };

  if (args.visibilityType && args.visibilityValue) {
    request.visibility = {
      type: args.visibilityType,
      value: args.visibilityValue,
    };
  }

  const comment = await client.addComment(args.issueKey, request);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: `Comment added to ${args.issueKey}`,
          comment: {
            id: comment.id,
            author: {
              displayName: comment.author.displayName,
            },
            body: comment.body,
            created: comment.created,
          },
        }, null, 2),
      },
    ],
  };
};



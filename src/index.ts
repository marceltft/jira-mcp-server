#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { JiraClient } from './jira-client.js';
import {
  searchIssuesTool,
  handleSearchIssues,
  SearchIssuesArgs,
  getIssueTool,
  handleGetIssue,
  GetIssueArgs,
  createIssueTool,
  handleCreateIssue,
  CreateIssueArgs,
  updateIssueTool,
  handleUpdateIssue,
  UpdateIssueArgs,
  getTransitionsTool,
  handleGetTransitions,
  GetTransitionsArgs,
  transitionIssueTool,
  handleTransitionIssue,
  TransitionIssueArgs,
  getCommentsTool,
  handleGetComments,
  GetCommentsArgs,
  addCommentTool,
  handleAddComment,
  AddCommentArgs,
} from './tools/index.js';

// Get configuration from environment variables
const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_USERNAME = process.env.JIRA_USERNAME;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

if (!JIRA_BASE_URL || !JIRA_USERNAME || !JIRA_API_TOKEN) {
  console.error('Error: Missing required environment variables');
  console.error('Required: JIRA_BASE_URL, JIRA_USERNAME, JIRA_API_TOKEN');
  process.exit(1);
}

// Initialize Jira client
const jiraClient = new JiraClient(JIRA_BASE_URL, JIRA_USERNAME, JIRA_API_TOKEN);

// Create MCP server
const server = new Server(
  {
    name: 'jira-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    searchIssuesTool,
    getIssueTool,
    createIssueTool,
    updateIssueTool,
    getTransitionsTool,
    transitionIssueTool,
    getCommentsTool,
    addCommentTool,
  ],
}));

// Register tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'jira_search':
        return await handleSearchIssues(args as SearchIssuesArgs, jiraClient);
      
      case 'jira_get_issue':
        return await handleGetIssue(args as GetIssueArgs, jiraClient);
      
      case 'jira_create_issue':
        return await handleCreateIssue(args as CreateIssueArgs, jiraClient);
      
      case 'jira_update_issue':
        return await handleUpdateIssue(args as UpdateIssueArgs, jiraClient);
      
      case 'jira_get_transitions':
        return await handleGetTransitions(args as GetTransitionsArgs, jiraClient);
      
      case 'jira_transition_issue':
        return await handleTransitionIssue(args as TransitionIssueArgs, jiraClient);
      
      case 'jira_get_comments':
        return await handleGetComments(args as GetCommentsArgs, jiraClient);
      
      case 'jira_add_comment':
        return await handleAddComment(args as AddCommentArgs, jiraClient);
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: true,
            message: errorMessage,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('Jira MCP Server running on stdio');
  console.error(`Connected to: ${JIRA_BASE_URL}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});



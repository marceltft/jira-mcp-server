# Jira MCP Server

MCP (Model Context Protocol) server for Jira Cloud and Jira Server/Data Center integration. Enables Claude in Cursor IDE to interact with your Jira instance.

## Features

- ✅ Support for **Jira Cloud** and **Jira Server/Data Center**
- ✅ **API v3** (compatible with recent Jira versions)
- ✅ Basic Auth authentication (username + API token)
- ✅ Search issues with JQL
- ✅ Create and update issues
- ✅ Status transitions
- ✅ Comment management
- ✅ TypeScript with complete types

## Prerequisites

- Node.js 18 or higher
- Access to a Jira instance (Cloud or Server/Data Center)
- API Token with appropriate permissions

## Installation

1. Clone this repository:

```bash
git clone https://github.com/your-username/jira-mcp-server.git
cd jira-mcp-server
```

2. Install dependencies:

```bash
npm install
```

3. Build the project:

```bash
npm run build
```

## API Token Permissions

### Required Permissions

Your API token must have the following Jira permissions to use all features:

| Feature | Required Permission | Project Level |
|---------|-------------------|---------------|
| **Search Issues** | Browse Projects | ✅ Required |
| **Get Issue Details** | Browse Projects | ✅ Required |
| **Get Transitions** | Browse Projects | ✅ Required |
| **Get Comments** | Browse Projects | ✅ Required |
| **Add Comments** | Add Comments | ✅ Required |
| **Update Issues** | Edit Issues | ✅ Required |
| **Transition Issues** | Transition Issues | ✅ Required |
| **Create Issues** | Create Issues | ✅ Required |

### Minimum Permissions

For **read-only** operations (search, get issue, get comments):
- ✅ **Browse Projects** - View projects and issues

For **full functionality**:
- ✅ **Browse Projects** - View projects and issues
- ✅ **Create Issues** - Create new issues
- ✅ **Edit Issues** - Update existing issues
- ✅ **Add Comments** - Add comments to issues
- ✅ **Transition Issues** - Change issue status

### How to Check Your Permissions

1. **Via Jira Web UI:**
   - Go to **Project Settings** → **Permissions**
   - Find your user or group
   - Verify you have the permissions listed above

2. **Via API:**
   - Run `npm test` to automatically check your permissions
   - The test will show which operations you can perform

### Creating an API Token

#### For Jira Cloud (*.atlassian.net):

1. Go to: https://id.atlassian.com/manage-profile/security/api-tokens
2. Click **"Create API token"**
3. Name it: `Jira MCP Server`
4. **Copy the token immediately** (it's only shown once)
5. The token starts with `ATATT...` or `ATCTT...`

**Important:**
- Use your **email address** (not username) in the configuration
- The token inherits all permissions of your user account
- Make sure you're logged in to the correct Atlassian account

#### For Jira Server/Data Center:

1. Go to: **Profile** → **Personal Access Tokens**
2. Click **"Create token"**
3. Name it: `Jira MCP Server`
4. **Copy the token immediately**

**Important:**
- Use your **username** (not email) in the configuration
- The token inherits all permissions of your user account

## Configuration

### 1. Configure in Cursor (Production)

**Note:** The `.env` file is **only used for local testing**. In production (when running in Cursor), credentials are provided via `mcp.json`.

Edit `~/.cursor/mcp.json` and add:

```json
{
  "mcpServers": {
    "jira": {
      "command": "node",
      "args": ["/absolute/path/to/jira-mcp-server/dist/index.js"],
      "env": {
        "JIRA_BASE_URL": "https://your-company.atlassian.net",
        "JIRA_USERNAME": "your.email@company.com",
        "JIRA_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

**Important:** 
- Use absolute paths in the `args` field
- Credentials in `mcp.json` are used in production (not `.env`)

### 2. Restart Cursor

After saving the configuration, restart Cursor IDE to load the MCP server.

## Testing

**The `.env` file is only used for local testing.** Before configuring in Cursor, you can test your connection locally:

### Setup for Testing

1. Create `.env` file (only for testing):

```bash
cp .env.example .env
```

2. Edit `.env` with your credentials:

```bash
# For Jira Cloud
JIRA_BASE_URL=https://your-company.atlassian.net
JIRA_USERNAME=your.email@company.com
JIRA_API_TOKEN=ATATT3xFfGF0...

# For Jira Server/Data Center
JIRA_BASE_URL=https://jira.company.com
JIRA_USERNAME=your.username
JIRA_API_TOKEN=your-token-or-password

# Optional: For testing specific operations
TEST_PROJECT_KEY=PROJ
TEST_ISSUE_KEY=PROJ-123
```

3. Run tests:

```bash
npm test
```

This will:
- ✅ Validate connectivity with Jira
- ✅ Test authentication (valid credentials)
- ✅ Test search functionality
- ✅ Test reading specific issues
- ✅ Test transitions and comments
- ✅ Show which permissions you have

## Available Tools

### jira_search
Search for issues using JQL (Jira Query Language).

**Parameters:**
- `jql` (required): JQL query string
- `maxResults` (optional): Maximum number of results (default: 50)
- `nextPageToken` (optional): Token for next page (from previous response)
- `fields` (optional): List of fields to include

**Example:**
```
Search for all open issues in project PROJ
```

### jira_get_issue
Get detailed information about a specific issue.

**Parameters:**
- `issueKey` (required): Issue key (e.g., PROJ-123)
- `fields` (optional): List of fields to include

**Example:**
```
Show details of issue PROJ-123
```

### jira_create_issue
Create a new issue.

**Parameters:**
- `projectKey` (required): Project key
- `issueType` (required): Issue type (Bug, Task, Story, etc)
- `summary` (required): Issue title
- `description` (optional): Description
- `priority` (optional): Priority (High, Medium, Low)
- `assignee` (optional): Username or account ID
- `labels` (optional): Array of labels
- `components` (optional): Array of components

**Example:**
```
Create a Bug issue in project PROJ with title "Login error"
```

### jira_update_issue
Update fields of an existing issue.

**Parameters:**
- `issueKey` (required): Issue key
- `fields` (required): Object with fields to update

**Example:**
```
Update issue PROJ-123 changing priority to High
```

### jira_get_transitions
List available status transitions for an issue.

**Parameters:**
- `issueKey` (required): Issue key

**Example:**
```
What transitions are available for PROJ-123?
```

### jira_transition_issue
Transition an issue to a new status.

**Parameters:**
- `issueKey` (required): Issue key
- `transitionId` (required): Transition ID (get from jira_get_transitions)
- `fields` (optional): Fields to set during transition

**Example:**
```
Move issue PROJ-123 to Done
```

### jira_get_comments
List all comments for an issue.

**Parameters:**
- `issueKey` (required): Issue key

**Example:**
```
Show comments for issue PROJ-123
```

### jira_add_comment
Add a comment to an issue.

**Parameters:**
- `issueKey` (required): Issue key
- `body` (required): Comment text
- `visibilityType` (optional): Restriction type (group or role)
- `visibilityValue` (optional): Group or role name

**Example:**
```
Add a comment to issue PROJ-123 saying "Problem resolved"
```

## Development

Run in development mode:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Project Structure

```
jira-mcp-server/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── jira-client.ts        # HTTP client for Jira API
│   ├── tools/                # MCP tools
│   │   ├── search-issues.ts
│   │   ├── get-issue.ts
│   │   ├── create-issue.ts
│   │   ├── update-issue.ts
│   │   ├── transitions.ts
│   │   └── comments.ts
│   └── types/
│       └── jira.ts           # TypeScript types
├── tests/
│   ├── integration.test.ts   # Integration tests
│   ├── test-search.mjs       # Search testing utility
│   └── test-token.mjs        # Token validation utility
├── dist/                     # Compiled code
├── .env.example              # Environment variables example
├── package.json
├── tsconfig.json
└── README.md
```

## Troubleshooting

### Connection Errors

- Verify you're connected to VPN (if required)
- Check if the Jira URL is correct
- Test accessing Jira in your browser

### Authentication Errors (401)

- Verify username/email is correct
- Verify API token is correct
- For Jira Cloud, ensure you're using your email (not username)
- Try creating a new API token

### Permission Errors (403)

- Check your Jira permissions (see "API Token Permissions" above)
- Verify you have required permissions in the project
- Run `npm test` to see which operations you can perform

### No Issues Found

- Verify you have "Browse Projects" permission
- Check if the project key is correct
- Try searching with a different JQL query

## Security

⚠️ **Important:**
- Never commit `.env` file or `mcp.json` with credentials
- Use API tokens instead of passwords when possible
- Keep your credentials secure
- Rotate tokens periodically

## License

MIT

## Contributing

Feel free to open issues or pull requests with improvements!

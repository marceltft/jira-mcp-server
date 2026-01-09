#!/usr/bin/env node

import { config } from 'dotenv';
import { JiraClient } from '../src/jira-client.js';

// Load environment variables from .env file
config();

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_USERNAME = process.env.JIRA_USERNAME;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const TEST_PROJECT_KEY = process.env.TEST_PROJECT_KEY || '';
const TEST_ISSUE_KEY = process.env.TEST_ISSUE_KEY || '';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration?: number;
}

const results: TestResult[] = [];

function logTest(result: TestResult) {
  const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
  const duration = result.duration ? ` (${result.duration}ms)` : '';
  console.log(`${icon} ${result.name}${duration}`);
  if (result.message) {
    console.log(`   ${result.message}`);
  }
  results.push(result);
}

async function runTest(
  name: string,
  testFn: () => Promise<void>,
  skipCondition?: boolean
): Promise<void> {
  if (skipCondition) {
    logTest({ name, status: 'SKIP', message: 'Skipped - missing required config' });
    return;
  }

  const start = Date.now();
  try {
    await testFn();
    const duration = Date.now() - start;
    logTest({ name, status: 'PASS', message: 'Success', duration });
  } catch (error) {
    const duration = Date.now() - start;
    const message = error instanceof Error ? error.message : String(error);
    logTest({ name, status: 'FAIL', message, duration });
  }
}

async function main() {
  console.log('\n🧪 Jira MCP Server - Test Suite\n');
  console.log('='.repeat(60));

  // Validate environment variables
  console.log('\n📋 Configuration Check:\n');
  
  if (!JIRA_BASE_URL || !JIRA_USERNAME || !JIRA_API_TOKEN) {
    console.error('❌ Missing required environment variables!');
    console.error('\nPlease create a .env file with:');
    console.error('  JIRA_BASE_URL=https://jira.your-company.com');
    console.error('  JIRA_USERNAME=your.username');
    console.error('  JIRA_API_TOKEN=your-token');
    console.error('  TEST_PROJECT_KEY=PROJ (optional - for create/update tests)');
    console.error('  TEST_ISSUE_KEY=PROJ-123 (optional - for read/update tests)');
    process.exit(1);
  }

  console.log(`✅ JIRA_BASE_URL: ${JIRA_BASE_URL}`);
  console.log(`✅ JIRA_USERNAME: ${JIRA_USERNAME}`);
  console.log(`✅ JIRA_API_TOKEN: ${'*'.repeat(Math.min(JIRA_API_TOKEN.length, 20))}`);
  console.log(`${TEST_PROJECT_KEY ? '✅' : '⚠️'} TEST_PROJECT_KEY: ${TEST_PROJECT_KEY || 'Not set'}`);
  console.log(`${TEST_ISSUE_KEY ? '✅' : '⚠️'} TEST_ISSUE_KEY: ${TEST_ISSUE_KEY || 'Not set'}`);

  // Initialize client
  const client = new JiraClient(JIRA_BASE_URL, JIRA_USERNAME, JIRA_API_TOKEN);

  console.log('\n' + '='.repeat(60));
  console.log('\n🔍 Running Tests:\n');

  // Test 1: Basic connectivity (search with simple JQL)
  await runTest('1. Basic Connectivity (Search)', async () => {
    // Use a bounded query for Jira Cloud compatibility
    const jql = TEST_PROJECT_KEY 
      ? `project = ${TEST_PROJECT_KEY} order by created DESC`
      : 'assignee = currentUser() order by created DESC';
    
    const result = await client.searchIssues(jql, 1);
    if (!result || !Array.isArray(result.issues)) {
      throw new Error('Invalid response from search API');
    }
    console.log(`   Found ${result.issues.length} issues in response`);
    if (result.total !== undefined) {
      console.log(`   Total issues: ${result.total}`);
    }
    if (result.issues.length > 0) {
      console.log(`   Example: ${result.issues[0].key}`);
    }
  });

  // Test 2: Search for an accessible issue first
  let accessibleIssueKey = '';
  await runTest('2. Find Accessible Issue', async () => {
    const result = await client.searchIssues('assignee = currentUser() OR reporter = currentUser()', 1);
    if (!result || !Array.isArray(result.issues)) {
      throw new Error('Invalid search response');
    }
    if (result.issues.length > 0) {
      accessibleIssueKey = result.issues[0].key;
      console.log(`   Found accessible issue: ${accessibleIssueKey}`);
      console.log(`   Summary: ${result.issues[0].fields.summary}`);
    } else {
      console.log(`   No accessible issues found - will skip issue-specific tests`);
    }
  });

  // Test 3: Get specific issue (only if we found an accessible one)
  await runTest(
    '3. Get Issue Details',
    async () => {
      const issue = await client.getIssue(accessibleIssueKey);
      if (!issue || !issue.key) {
        throw new Error('Invalid issue response');
      }
      console.log(`   Issue: ${issue.key} - ${issue.fields.summary}`);
      console.log(`   Status: ${issue.fields.status.name}`);
    },
    !accessibleIssueKey // Skip if no accessible issue found
  );

  // Test 4: Get transitions
  await runTest(
    '4. Get Available Transitions',
    async () => {
      const transitions = await client.getTransitions(accessibleIssueKey);
      if (!Array.isArray(transitions)) {
        throw new Error('Invalid transitions response');
      }
      console.log(`   Found ${transitions.length} available transitions`);
      if (transitions.length > 0) {
        console.log(`   Example: ${transitions[0].name} (ID: ${transitions[0].id})`);
      }
    },
    !accessibleIssueKey // Skip if no accessible issue found
  );

  // Test 5: Get comments
  await runTest(
    '5. Get Issue Comments',
    async () => {
      const comments = await client.getComments(accessibleIssueKey);
      if (!Array.isArray(comments)) {
        throw new Error('Invalid comments response');
      }
      console.log(`   Found ${comments.length} comments`);
    },
    !accessibleIssueKey // Skip if no accessible issue found
  );

  // Test 6: Search by project
  await runTest(
    '6. Search Issues by Project',
    async () => {
      const result = await client.searchIssues(
        `project = ${TEST_PROJECT_KEY} ORDER BY created DESC`,
        5
      );
      if (!result || !Array.isArray(result.issues)) {
        throw new Error('Invalid search response');
      }
      console.log(`   Found ${result.issues.length} issues in response`);
      if (result.total !== undefined) {
        console.log(`   Total in project ${TEST_PROJECT_KEY}: ${result.total}`);
      }
      if (result.issues.length > 0) {
        console.log(`   Latest: ${result.issues[0].key} - ${result.issues[0].fields.summary}`);
      }
      if (result.nextPageToken) {
        console.log(`   Has more pages (nextPageToken available)`);
      } else if (result.isLast === false) {
        console.log(`   Has more pages (isLast = false)`);
      }
    },
    !TEST_PROJECT_KEY
  );

  // Test 7: Create issue (skipped - user requested not to test)
  let createdIssueKey = '';
  await runTest(
    '7. Create Test Issue',
    async () => {
      const issue = await client.createIssue({
        fields: {
          project: { key: TEST_PROJECT_KEY },
          summary: `[MCP Test] Automated test issue - ${new Date().toISOString()}`,
          description: 'This is a test issue created by the Jira MCP Server test suite. You can safely delete this.',
          issuetype: { name: 'Task' },
        },
      });
      if (!issue || !issue.key) {
        throw new Error('Failed to create issue');
      }
      createdIssueKey = issue.key;
      console.log(`   Created issue: ${issue.key}`);
    },
    true // Always skip - user requested not to test create
  );

  // Test 8: Update the created issue
  await runTest(
    '8. Update Test Issue',
    async () => {
      if (!createdIssueKey) {
        throw new Error('No issue to update (creation was skipped or failed)');
      }
      await client.updateIssue(createdIssueKey, {
        fields: {
          description: 'Updated by test suite - ' + new Date().toISOString(),
        },
      });
      console.log(`   Updated issue: ${createdIssueKey}`);
    },
    !createdIssueKey
  );

  // Test 9: Add comment to the created issue
  await runTest(
    '9. Add Comment to Test Issue',
    async () => {
      if (!createdIssueKey) {
        throw new Error('No issue to comment on (creation was skipped or failed)');
      }
      const comment = await client.addComment(createdIssueKey, {
        body: `Test comment added by MCP Server test suite at ${new Date().toISOString()}`,
      });
      if (!comment || !comment.id) {
        throw new Error('Failed to add comment');
      }
      console.log(`   Added comment to: ${createdIssueKey}`);
    },
    !createdIssueKey
  );

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary:\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;

  console.log(`✅ Passed:  ${passed}`);
  console.log(`❌ Failed:  ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`📝 Total:   ${results.length}`);

  if (createdIssueKey) {
    console.log(`\n💡 Test issue created: ${JIRA_BASE_URL}/browse/${createdIssueKey}`);
    console.log('   You can delete it manually or leave it for reference.');
  }

  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Check the errors above for details.');
    process.exit(1);
  } else if (passed === 0) {
    console.log('\n⚠️  No tests were run. Check your configuration.');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed! Your Jira MCP Server is ready to use.');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});


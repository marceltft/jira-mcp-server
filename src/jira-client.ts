import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  JiraIssue,
  JiraSearchResult,
  JiraCreateIssueRequest,
  JiraUpdateIssueRequest,
  JiraTransition,
  JiraTransitionRequest,
  JiraComment,
  JiraAddCommentRequest,
  JiraCommentList,
  JiraErrorResponse,
} from './types/jira.js';

export class JiraClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl: string, username: string, apiToken: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    
    // Create Basic Auth token
    const auth = Buffer.from(`${username}:${apiToken}`).toString('base64');
    
    // Use API v3 (required for newer Jira versions)
    this.client = axios.create({
      baseURL: `${this.baseUrl}/rest/api/3`,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Handle Jira API errors
   */
  private handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<JiraErrorResponse>;
      const response = axiosError.response;
      
      if (response?.data) {
        const errorData = response.data;
        const messages = [
          ...(errorData.errorMessages || []),
          ...Object.entries(errorData.errors || {}).map(([key, value]) => `${key}: ${value}`),
        ];
        
        throw new Error(`Jira API Error (${response.status}): ${messages.join(', ')}`);
      }
      
      throw new Error(`Jira API Error: ${axiosError.message}`);
    }
    
    throw error;
  }

  /**
   * Search for issues using JQL (API v3)
   * Uses GET /search/jql with cursor-based pagination
   */
  async searchIssues(
    jql: string,
    maxResults: number = 50,
    nextPageToken?: string,
    fields?: string[]
  ): Promise<JiraSearchResult> {
    try {
      const params: Record<string, string | number> = {
        jql,
        maxResults,
      };

      if (nextPageToken) {
        params.nextPageToken = nextPageToken;
      }

      // Always request key and basic fields if not specified
      if (fields && fields.length > 0) {
        params.fields = fields.join(',');
      } else {
        // Default fields for API v3 - key, summary, status, issuetype are essential
        params.fields = 'key,summary,status,issuetype,assignee,reporter,created,updated,priority,project';
      }

      const response = await this.client.get<JiraSearchResult>('/search/jql', { params });
      
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get a single issue by key or ID
   */
  async getIssue(issueKey: string, fields?: string[]): Promise<JiraIssue> {
    try {
      const params = fields ? { fields: fields.join(',') } : {};
      const response = await this.client.get<JiraIssue>(`/issue/${issueKey}`, { params });
      
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Create a new issue
   */
  async createIssue(request: JiraCreateIssueRequest): Promise<JiraIssue> {
    try {
      const response = await this.client.post<{ id: string; key: string; self: string }>('/issue', request);
      
      // Fetch the full issue details
      return await this.getIssue(response.data.key);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update an existing issue
   */
  async updateIssue(issueKey: string, request: JiraUpdateIssueRequest): Promise<void> {
    try {
      await this.client.put(`/issue/${issueKey}`, request);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get available transitions for an issue
   */
  async getTransitions(issueKey: string): Promise<JiraTransition[]> {
    try {
      const response = await this.client.get<{ transitions: JiraTransition[] }>(
        `/issue/${issueKey}/transitions`
      );
      
      return response.data.transitions;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Transition an issue to a new status
   */
  async transitionIssue(issueKey: string, request: JiraTransitionRequest): Promise<void> {
    try {
      await this.client.post(`/issue/${issueKey}/transitions`, request);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get comments for an issue
   */
  async getComments(issueKey: string): Promise<JiraComment[]> {
    try {
      const response = await this.client.get<JiraCommentList>(`/issue/${issueKey}/comment`);
      
      return response.data.comments;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Add a comment to an issue
   */
  async addComment(issueKey: string, request: JiraAddCommentRequest): Promise<JiraComment> {
    try {
      const response = await this.client.post<JiraComment>(`/issue/${issueKey}/comment`, request);
      
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
}


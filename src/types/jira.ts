/**
 * Jira API Types
 */

export interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: JiraIssueFields;
  transitions?: JiraTransition[];
}

export interface JiraIssueFields {
  summary: string;
  description?: string | null;
  issuetype: JiraIssueType;
  project: JiraProject;
  status: JiraStatus;
  priority?: JiraPriority;
  assignee?: JiraUser | null;
  reporter?: JiraUser;
  created: string;
  updated: string;
  resolutiondate?: string | null;
  labels?: string[];
  components?: JiraComponent[];
  fixVersions?: JiraVersion[];
  comment?: JiraCommentList;
  [key: string]: any; // Allow custom fields
}

export interface JiraIssueType {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  subtask: boolean;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  self: string;
}

export interface JiraStatus {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  statusCategory: {
    id: number;
    key: string;
    name: string;
    colorName: string;
  };
}

export interface JiraPriority {
  id: string;
  name: string;
  iconUrl?: string;
}

export interface JiraUser {
  accountId?: string;
  name?: string;
  key?: string;
  displayName: string;
  emailAddress?: string;
  active: boolean;
  avatarUrls?: Record<string, string>;
}

export interface JiraComponent {
  id: string;
  name: string;
  description?: string;
}

export interface JiraVersion {
  id: string;
  name: string;
  description?: string;
  released: boolean;
  releaseDate?: string;
}

export interface JiraTransition {
  id: string;
  name: string;
  to: JiraStatus;
  hasScreen?: boolean;
  isGlobal?: boolean;
  isInitial?: boolean;
  isConditional?: boolean;
  fields?: Record<string, any>;
}

export interface JiraComment {
  id: string;
  self: string;
  author: JiraUser;
  body: string;
  created: string;
  updated: string;
  visibility?: {
    type: string;
    value: string;
  };
}

export interface JiraCommentList {
  comments: JiraComment[];
  maxResults: number;
  total: number;
  startAt: number;
}

/**
 * API v2 Search Result (deprecated)
 */
export interface JiraSearchResultV2 {
  expand: string;
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraIssue[];
}

/**
 * API v3 Search Result (current)
 * Jira Cloud uses isLast flag, Jira Server/DC may use nextPageToken
 */
export interface JiraSearchResult {
  issues: JiraIssue[];
  total?: number; // Not always present in v3
  nextPageToken?: string; // Jira Server/DC
  isLast?: boolean; // Jira Cloud
}

export interface JiraCreateIssueRequest {
  fields: {
    project: {
      key: string;
    };
    summary: string;
    description?: string;
    issuetype: {
      name: string;
    };
    priority?: {
      name: string;
    };
    assignee?: {
      name?: string;
      accountId?: string;
    };
    labels?: string[];
    components?: Array<{ name: string }>;
    [key: string]: any;
  };
}

export interface JiraUpdateIssueRequest {
  fields?: Record<string, any>;
  update?: Record<string, any[]>;
}

export interface JiraTransitionRequest {
  transition: {
    id: string;
  };
  fields?: Record<string, any>;
}

export interface JiraAddCommentRequest {
  body: string;
  visibility?: {
    type: 'group' | 'role';
    value: string;
  };
}

export interface JiraErrorResponse {
  errorMessages?: string[];
  errors?: Record<string, string>;
}


import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import {
  qalandQaContextInputSchema,
  qalandQaEmptyInputSchema,
  qalandQaProjectInputSchema,
  type QalandQaContextArgs,
  type QalandQaProjectArgs,
} from "./schemas.js";
import { QalandQaKnowledgeClient } from "./client.js";
import {
  readOnlyAnnotations,
  registerStructuredTool,
} from "../shared/registerTool.js";

export function registerQalandQaTools(server: McpServer): void {
  const qaKnowledgeClient = new QalandQaKnowledgeClient();

  registerStructuredTool(server, {
    name: "qaland_collect_manual_test_context",
    title: "QALand Collect Manual Test Context",
    description:
      "Collect QA retrieval context for manual test case generation. Returns a single JSON field named context with project knowledge and example test case segments merged in document order.",
    inputSchema: qalandQaContextInputSchema,
    annotations: readOnlyAnnotations,
    handler: (args) =>
      qaKnowledgeClient.collectManualTestContext(
        (args as QalandQaContextArgs).project_name,
        (args as QalandQaContextArgs).screen_function_name
      ),
  });

  registerStructuredTool(server, {
    name: "qaland_get_test_case_examples",
    title: "QALand Get Test Case Examples",
    description:
      "Retrieve example test case records from the dedicated QA examples dataset.",
    inputSchema: qalandQaEmptyInputSchema,
    annotations: readOnlyAnnotations,
    handler: async () => qaKnowledgeClient.getTestCaseExamples(),
  });

  registerStructuredTool(server, {
    name: "qaland_get_project_messages",
    title: "QALand Get Project Messages",
    description: "Retrieve message knowledge records for a QA project.",
    inputSchema: qalandQaProjectInputSchema,
    annotations: readOnlyAnnotations,
    handler: (args) =>
      qaKnowledgeClient.getMessages((args as QalandQaProjectArgs).project_name),
  });

  registerStructuredTool(server, {
    name: "qaland_get_project_sms",
    title: "QALand Get Project SMS",
    description: "Retrieve SMS knowledge records for a QA project.",
    inputSchema: qalandQaProjectInputSchema,
    annotations: readOnlyAnnotations,
    handler: (args) =>
      qaKnowledgeClient.getSms((args as QalandQaProjectArgs).project_name),
  });

  registerStructuredTool(server, {
    name: "qaland_get_project_emails",
    title: "QALand Get Project Emails",
    description: "Retrieve email knowledge records for a QA project.",
    inputSchema: qalandQaProjectInputSchema,
    annotations: readOnlyAnnotations,
    handler: (args) =>
      qaKnowledgeClient.getEmails((args as QalandQaProjectArgs).project_name),
  });

  registerStructuredTool(server, {
    name: "qaland_get_project_srs",
    title: "QALand Get Project SRS",
    description:
      "Retrieve SRS knowledge records for a project and screen or function name.",
    inputSchema: qalandQaContextInputSchema,
    annotations: readOnlyAnnotations,
    handler: (args) =>
      qaKnowledgeClient.getSrs(
        (args as QalandQaContextArgs).project_name,
        (args as QalandQaContextArgs).screen_function_name
      ),
  });
}

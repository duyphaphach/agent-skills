import { DifyKnowledgeClient } from "../dify/client.js";
import { createLogger } from "../../utils/logger.js";
import { writeFile } from 'node:fs/promises';

import {
  getQalandQaKnowledgeConfig,
  qalandQaExampleMetadataFilters,
  qalandQaExampleRetrievalModel,
  qalandQaProjectRetrievalModel,
} from "./config.js";
import {
  aggregateContext,
  createMetadataFilters,
  extractKnowledgeRecords,
  type KnowledgeRecord,
  type ProjectKnowledgeCategory,
} from "./utils.js";

const logger = createLogger("qaland-qa");

export class QalandQaKnowledgeClient {
  private readonly difyKnowledgeClient = new DifyKnowledgeClient();

  private async retrieveProjectCategory(
    category: ProjectKnowledgeCategory,
    projectName: string,
    query: string
  ): Promise<KnowledgeRecord[]> {
    const config = getQalandQaKnowledgeConfig();

    logger.debug("Retrieving project knowledge records", {
      category,
      projectName,
      query,
      datasetId: config.projectKnowledgeDatasetId,
    }, { pretty: true });

    const response = await this.difyKnowledgeClient.retrieveChunks({
      dataset_id: config.projectKnowledgeDatasetId,
      query,
      retrieval_model: {
        ...qalandQaProjectRetrievalModel,
        metadata_filtering_conditions: createMetadataFilters(
          category,
          projectName
        ),
      },
    });

    const records = extractKnowledgeRecords(response);

    logger.debug("Retrieved project knowledge records", {
      category,
      projectName,
      query,
      count: records.length,
    }, { pretty: true });

    return records;
  }

  async getTestCaseExamples(): Promise<KnowledgeRecord[]> {
    const config = getQalandQaKnowledgeConfig();

    logger.debug("Retrieving QA example knowledge records", {
      query: config.testCaseExampleRetrievalQuery,
      datasetId: config.testCaseExampleDatasetId,
    }, { pretty: true });

    const response = await this.difyKnowledgeClient.retrieveChunks({
      dataset_id: config.testCaseExampleDatasetId,
      query: config.testCaseExampleRetrievalQuery,
      retrieval_model: {
        ...qalandQaExampleRetrievalModel,
        metadata_filtering_conditions: qalandQaExampleMetadataFilters,
      },
    });

    const records = extractKnowledgeRecords(response);

    logger.debug("Retrieved QA example knowledge records", {
      query: config.testCaseExampleRetrievalQuery,
      count: records.length,
    }, { pretty: true });

    return records;
  }

  async getMessages(projectName: string): Promise<KnowledgeRecord[]> {
    const config = getQalandQaKnowledgeConfig();

    return this.retrieveProjectCategory(
      "MESSAGE",
      projectName,
      config.messageRetrievalQuery
    );
  }

  async getSms(projectName: string): Promise<KnowledgeRecord[]> {
    const config = getQalandQaKnowledgeConfig();

    return this.retrieveProjectCategory("SMS", projectName, config.smsRetrievalQuery);
  }

  async getEmails(projectName: string): Promise<KnowledgeRecord[]> {
    const config = getQalandQaKnowledgeConfig();

    return this.retrieveProjectCategory(
      "EMAIL",
      projectName,
      config.emailRetrievalQuery
    );
  }

  async getSrs(
    projectName: string,
    screenFunctionName: string
  ): Promise<KnowledgeRecord[]> {
    return this.retrieveProjectCategory("SRS", projectName, screenFunctionName);
  }

  async collectManualTestContext(
    projectName: string,
    screenFunctionName: string
  ): Promise<{ context: string }> {
    logger.info("Collecting manual test generation context", {
      projectName,
      screenFunctionName,
    });

    const [messages, sms, emails, srs, examples] = await Promise.all([
      this.getMessages(projectName),
      this.getSms(projectName),
      this.getEmails(projectName),
      this.getSrs(projectName, screenFunctionName),
      this.getTestCaseExamples(),
    ]);

    logger.debug("Collected manual test context source counts", {
      messages: messages.length,
      sms: sms.length,
      emails: emails.length,
      srs: srs.length,
      examples: examples.length,
    }, { pretty: true });

    const aggregatedContext = aggregateContext({
      messages,
      sms,
      emails,
      srs,
      examples,
    });

    logger.info("Manual test generation context collected", {
      projectName,
      screenFunctionName,
      contextLength: aggregatedContext.context.length,
    });

    return aggregatedContext;
  }
}

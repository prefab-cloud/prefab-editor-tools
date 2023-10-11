import * as fs from "fs";
import * as path from "path";
import { AnnotatedDocument, Logger } from "./types";
import { TextDocument } from "vscode-languageserver-textdocument";
import { mock } from "bun:test";
import { Response as FetchResponse } from "node-fetch";

export const readFileSync = (relativePath: string) => {
  return fs.readFileSync(path.join(__dirname, relativePath), "utf-8");
};

const defaultUriForTests = "file:///some/path/defaultUriForTests";

type NewDoc = {
  uri: string;
  text: string;
  languageId: string;
  version?: number;
};

export const mkAnnotatedDocument = (
  args: Partial<AnnotatedDocument>
): AnnotatedDocument => {
  return {
    uri: args.uri ?? defaultUriForTests,
    methodLocations: args.methodLocations ?? [],
    completionType: args.completionType ?? (() => null),
  };
};

export const mkDocument = (doc: Partial<NewDoc>): TextDocument => {
  return TextDocument.create(
    doc.uri ?? defaultUriForTests,
    doc.languageId ?? "some-language",
    doc.version ?? 1,
    doc.text ?? "some text"
  );
};

let loggedItems: Record<string, unknown>[] = [];
export const log: Logger = (scope, message) => {
  loggedItems.push({ scope, message });
};
export const clearLog = () => {
  loggedItems = [];
};

export const getLoggedItems = () => {
  return loggedItems;
};

type Response = {
  status: number;
  json: Record<string, unknown>;
};

export const mockRequest = (requestOrRequests: Response | Response[]) => {
  const requests = Array.isArray(requestOrRequests)
    ? requestOrRequests
    : [requestOrRequests];

  return mock(async (): Promise<FetchResponse> => {
    const request = requests.shift();

    if (!request) {
      throw new Error("No more requests");
    }

    return {
      status: request.status ?? 200,
      json: async () => request.json,
    } as unknown as FetchResponse;
  });
};

export const lastItem = (array: unknown[]) => {
  return array[array.length - 1];
};

export const cannedEvaluationResponse = {
  status: 200,
  json: {
    key: "redis.connection-string",
    start: 1696354310632,
    end: 1696440710632,
    total: 69156,
    environments: {
      "136": {
        name: "Staging",
        total: 34494,
        counts: [
          {
            configValue: {
              string: "redis://internal-redis.example.com:6379",
            },
            count: 22429,
          },
          {
            configValue: {
              string:
                "redis://redis-11111.c1.us-central1-2.gce.cloud.redislabs.com:11111",
            },
            count: 12065,
          },
        ],
      },
      "137": {
        name: "Production",
        total: 34662,
        counts: [
          {
            configValue: {
              string: "redis://internal-redis.example.com:6379",
            },
            count: 17434,
          },
          {
            configValue: {
              string:
                "redis://redis-11111.c1.us-central1-2.gce.cloud.redislabs.com:11111",
            },
            count: 17228,
          },
        ],
      },
    },
  },
};

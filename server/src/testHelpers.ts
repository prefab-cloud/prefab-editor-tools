import * as fs from "fs";
import * as path from "path";
import { AnnotatedDocument, Logger } from "./types";
import { TextDocument } from "vscode-languageserver-textdocument";
import { get } from "./apiClient";

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

export const mockedGet = ({
  json,
  status,
}: {
  json: unknown;
  status?: number;
}): typeof get => {
  return async (): ReturnType<typeof get> => {
    return {
      status: status ?? 200,
      json: async () => json,
    } as unknown as ReturnType<typeof get>;
  };
};

export const lastItem = (array: unknown[]) => {
  return array[array.length - 1];
};

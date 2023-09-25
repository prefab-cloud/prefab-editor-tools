import { Documents } from "./types";
import { TextDocument } from "vscode-languageserver-textdocument";

type NewDoc = {
  uri: string;
  text: string;
  languageId: string;
  version?: number;
};

export const mkDocument = (doc: NewDoc): TextDocument => {
  return TextDocument.create(
    doc.uri,
    doc.languageId,
    doc.version ?? 1,
    doc.text
  );
};

export const mkDocumentStore = (newDocs: NewDoc[]): Documents => {
  const innerStore = new Map<string, TextDocument>();

  newDocs.forEach((doc) => {
    const document = mkDocument(doc);

    innerStore.set(doc.uri, document);
  });

  return {
    get: (uri) => {
      return innerStore.get(uri);
    },
  } as Documents;
};

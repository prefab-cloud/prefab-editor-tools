import { Documents } from "./types";
import { TextDocument } from "vscode-languageserver-textdocument";

type NewDoc = {
  uri: string;
  text: string;
  languageId: string;
  version?: number;
};

export const mkDocument = (doc: Partial<NewDoc>): TextDocument => {
  return TextDocument.create(
    doc.uri ?? "file:///some/path",
    doc.languageId ?? "some-language",
    doc.version ?? 1,
    doc.text ?? "some text"
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

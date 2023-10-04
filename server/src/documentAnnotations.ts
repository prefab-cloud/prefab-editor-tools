import { Position, TextDocument } from "vscode-languageserver-textdocument";
import type { AnnotatedDocument, DocumentAnnotations } from "./types";
import { detectSDK } from "./sdks/detection";

export const documentAnnotations: Record<string, DocumentAnnotations> = {};

export const annotateDocument = (document: TextDocument) => {
  const sdk = detectSDK(document);

  const methodLocations = sdk.detectMethods(document);

  documentAnnotations[document.uri] = {
    methodLocations,
  };
};

export const getAnnotatedDocument = (
  document: TextDocument
): AnnotatedDocument => {
  const sdk = detectSDK(document);

  const completionType = (position: Position) => {
    return sdk.completionType(document, position);
  };

  return {
    uri: document.uri,
    completionType,
    methodLocations: documentAnnotations[document.uri]?.methodLocations || [],
  };
};

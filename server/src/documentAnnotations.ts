import { Position, TextDocument } from "vscode-languageserver-textdocument";

import { detectSDK } from "./sdks/detection";
import type {
  AnnotatedDocument,
  DocumentAnnotations,
  MethodLocation,
} from "./types";

export const documentAnnotations: Record<string, DocumentAnnotations> = {};

export const annotateDocument = (document: TextDocument) => {
  if (documentAnnotations[document.uri]?.version === document.version) {
    return;
  }

  const sdk = detectSDK(document);

  const methodLocations = sdk.detectMethods(document);

  documentAnnotations[document.uri] = {
    methodLocations,
    version: document.version,
  };
};

export const getAnnotatedDocument = (
  document: TextDocument,
): AnnotatedDocument => {
  const sdk = detectSDK(document);

  const completionType = (position: Position) => {
    return sdk.completionType(document, position);
  };

  return {
    uri: document.uri,
    textDocument: document,
    sdk,
    completionTypeWithPrefix: completionType,
    methodLocations: documentAnnotations[document.uri]?.methodLocations ?? [],
  };
};

export const methodAtPosition = (
  document: AnnotatedDocument,
  position: Position,
): MethodLocation | undefined => {
  const location = document.methodLocations.find((method) => {
    return (
      method.keyRange.start.line <= position.line &&
      method.keyRange.end.line >= position.line &&
      method.keyRange.start.character <= position.character &&
      method.keyRange.end.character >= position.character
    );
  });

  return location;
};

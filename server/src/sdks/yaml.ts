import { Position, TextDocument } from "vscode-languageserver-textdocument";

import { detectProvidable } from "./common";
import type { SDK } from "./detection";

const DETECT_PROVIDABLE_REGEX = /ENV\[(["'].+["'])\]/g;

const YamlSDK: SDK = {
  name: "yaml",

  isApplicable: (document: TextDocument): boolean => {
    return document.languageId === "yaml";
  },

  detectMethod: () => {
    return null;
  },

  detectMethods: () => {
    return [];
  },

  completionType: () => {
    return null;
  },

  configGet: (key: string): string => {
    return `$prefab.get("${key}")`;
  },

  detectProvidable: (document: TextDocument, position: Position) => {
    return detectProvidable(document, position, DETECT_PROVIDABLE_REGEX);
  },
};

export default YamlSDK;

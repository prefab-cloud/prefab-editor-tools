import { expect, it, describe } from "bun:test";
import { ConfigType, type ConfigTypeValue } from "./prefabClient";
import { getMethodFromContext } from "./prefabMethodDetector";
import { Position } from "vscode-languageserver/node";
import { mkDocument } from "./testHelpers";

const uri = "file:///some/path/test.txt";

type ExampleAndMaybePosition = string | [string, Position];

type ExampleSet = Record<ConfigTypeValue, ExampleAndMaybePosition[]>;

const JS_EXAMPLES: ExampleSet = {
  [ConfigType.FEATURE_FLAG]: [
    'prefab.isEnabled("',
    "prefab.isEnabled('",
    'prefab.isFeatureEnabled("',
    "prefab.isFeatureEnabled('",
  ],
  [ConfigType.CONFIG]: ['prefab.get("', "prefab.get('"],
};

const REACT_EXAMPLES: ExampleSet = {
  [ConfigType.FEATURE_FLAG]: [
    [
      `
    const Logo = () => {
      const { isEnabled } = usePrefab();

      if (isEnabled("
        return <img src={newLogo} className="App-logo" alt="logo" />;
      }

      return <img src={logo} className="App-logo" alt="logo" />;
    };
    `,
      { line: 4, character: 21 },
    ],
  ],

  [ConfigType.CONFIG]: [
    [
      `
    const { get } = usePrefab();

    const value = get("
    `,
      { line: 3, character: 23 },
    ],
  ],
};

const EXAMPLES: Record<string, ExampleSet> = {
  ruby: {
    [ConfigType.FEATURE_FLAG]: ['prefab.enabled?("', "prefab.enabled?('"],
    [ConfigType.CONFIG]: ['prefab.get("', "prefab.get('"],
  },
  javascript: JS_EXAMPLES,
  typescript: JS_EXAMPLES,
  javascriptreact: REACT_EXAMPLES,
  typescriptreact: REACT_EXAMPLES,
};

const destructureExampleAndPosition = (
  exampleAndPosition: ExampleAndMaybePosition
): [string, Position] => {
  if (typeof exampleAndPosition === "string") {
    return [
      exampleAndPosition,
      {
        line: 0,
        character: exampleAndPosition.length,
      },
    ];
  }

  return exampleAndPosition;
};

describe("getMethodFromContext", () => {
  Object.entries(EXAMPLES).forEach(([languageId, examples]) => {
    examples[ConfigType.FEATURE_FLAG].forEach((exampleAndPosition) => {
      const [example, position] =
        destructureExampleAndPosition(exampleAndPosition);

      it(`returns ConfigType.FEATURE_FLAG for a ${languageId} FF w/ example \`${example}\``, () => {
        const document = mkDocument({
          text: example,
          uri,
          languageId,
        });

        expect(getMethodFromContext(document, position)).toEqual(
          ConfigType.FEATURE_FLAG
        );
      });
    });

    examples[ConfigType.CONFIG].forEach((exampleAndPosition) => {
      const [example, position] =
        destructureExampleAndPosition(exampleAndPosition);

      it(`returns ConfigType.CONFIG for a ${languageId} config w/ example \`${example}\``, () => {
        const document = mkDocument({
          text: example,
          uri,
          languageId,
        });

        expect(getMethodFromContext(document, position)).toEqual(
          ConfigType.CONFIG
        );
      });
    });
  });
});

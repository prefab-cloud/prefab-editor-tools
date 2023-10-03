const extractKey = (args: string[] | undefined): string => {
  // Position 0 is the document URI
  // Position 1 is the key

  if (!args || args.length < 2) {
    throw new Error("Prefab: Please provide a key.");
  }

  return args[1];
};

export default extractKey;

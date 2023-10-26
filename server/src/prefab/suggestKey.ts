// TODO: don't suggest a key if it's already in use

export const suggestKey = (content: string) => {
  return content.replace(/[._-\s]+/g, ".").toLowerCase();
};

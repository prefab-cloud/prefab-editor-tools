type ProjectEnvId = {
  projectId: string;
  id: string;
};

export const getProjectEnvFromApiKey = (
  apiKey: string | undefined
): ProjectEnvId => {
  if (!apiKey) {
    throw new Error("No API key set. Please update your configuration.");
  }

  const parts = /-P(\d+)-E(\d+)-SDK-/.exec(apiKey);

  if (!parts) {
    throw new Error("Invalid API key");
  }

  const projectId = parts[1];
  const projectEnvId = parts[2];

  if (!projectEnvId || !projectId) {
    throw new Error("Invalid API key (missing project or environment ID)");
  }

  return {
    projectId,
    id: projectEnvId,
  };
};

const pluralize = (number: number, singular: string, plural: string) => {
  return `${number.toLocaleString()} ${number === 1 ? singular : plural}`;
};

export default pluralize;

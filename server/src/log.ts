import * as fs from "fs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function log(data: any) {
  fs.appendFileSync("/tmp/out.log", data + "\n");
  return data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function logj(data: any) {
  log(JSON.stringify(data));
  return data;
}

import Conf from "conf";
import { join } from "node:path";
import { tmpdir } from "node:os";

let _conf: Conf | undefined;

export function getConf(): Conf {
  if (!_conf) {
    const isTest = process.env.NODE_ENV === "test";
    const testWorkerId = process.env.VITEST_WORKER_ID ?? "default";
    _conf = new Conf({
      projectName: isTest ? "polter-test" : "polter",
      cwd: isTest ? join(tmpdir(), "polter-test-config", testWorkerId) : undefined,
    });
  }
  return _conf;
}

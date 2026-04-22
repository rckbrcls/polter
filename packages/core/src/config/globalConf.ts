import Conf from "conf";

let _conf: Conf | undefined;

export function getConf(): Conf {
  if (!_conf) {
    _conf = new Conf({
      projectName:
        process.env.NODE_ENV === "test" ? "polter-test" : "polter",
    });
  }
  return _conf;
}

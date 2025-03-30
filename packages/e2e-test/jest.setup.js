import crypto from "crypto";

import { deploy } from "aws-testing-library/lib/utils/serverless.js";
import deployTraceStack from "../deploy-script/src/deploy.js";

const setup = async () => {
  await deploy("testing");
  await deployTraceStack({
    tracerToken: `t_test1234567890`,
  });
};

export default setup;

import crypto from "crypto";

import { deploy } from "aws-testing-library/lib/utils/serverless.js";
import deployTraceStack from "../deploy-script/src/deploy.js";

const setup = async () => {
  await deploy("testing");
  await deployTraceStack({
    tracerToken: `t_aedeaeb5ce5f55f43c9c032eff16f778`,
  });
};

export default setup;

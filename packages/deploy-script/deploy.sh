#!/bin/bash

# TODO: ask for info about defaults
# - retention days
# - region
# - lambdas to auto trace
# Then save this to a .env and deploy

yarn workspace @trace-stack/api deploy

# TODO: output the URL of the UI
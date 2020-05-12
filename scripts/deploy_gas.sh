#!/usr/bin/env bash
# Usage:
# ./deploy_gas.sh deployment_id
deploy_id=$1
npx @google/clasp push -f
npx @google/clasp deploy -i ${deploy_id}

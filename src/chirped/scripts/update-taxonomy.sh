#!/bin/bash

echo "Updating taxonomy data..."

# get count of taxonomy in current taxonomy file
CURRENT_TAXONOMY_FILE_PATH="src/chirped/taxonomy/taxonomy.csv"
CURRENT_TAXONOMY_COUNT=$(wc -l < $CURRENT_TAXONOMY_FILE_PATH)
echo "Current taxonomy count: $CURRENT_TAXONOMY_COUNT"

# check and make sure we have EBIRD_API_KEY set
if [ -z "$EBIRD_API_KEY" ]; then
  echo "Error: EBIRD_API_KEY environment variable is not set."
  exit 1
fi

LATEST_TAXONOMY_FILE_PATH="src/chirped/taxonomy/taxonomy-latest.csv"

# fetch latest taxonomy data
curl --location 'https://api.ebird.org/v2/ref/taxonomy/ebird?fmt=csv' \
    --header "X-eBirdApiToken: $EBIRD_API_KEY" \
    --output $LATEST_TAXONOMY_FILE_PATH

# get count of taxonomy in latest taxonomy file
LATEST_TAXONOMY_COUNT=$(wc -l < $LATEST_TAXONOMY_FILE_PATH)
echo "Latest taxonomy count: $LATEST_TAXONOMY_COUNT"
echo "New taxonomy entries: $((LATEST_TAXONOMY_COUNT - CURRENT_TAXONOMY_COUNT))"

# replace current taxonomy file with latest
mv $LATEST_TAXONOMY_FILE_PATH $CURRENT_TAXONOMY_FILE_PATH

# run parseTaxonomyToJson script to output json
yarn run update-taxonomy-json-from-csv
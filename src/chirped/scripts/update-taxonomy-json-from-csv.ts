import { parseTaxonomyToJson } from '../taxonomy/parse';
async function main() {
  await parseTaxonomyToJson()
    .catch((err) => {
      console.error('Error updating taxonomy JSON from CSV:', err);
      process.exit(1);
    })
    .then(() => {
      console.log('Successfully updated taxonomy JSON from CSV.');
    });
}

main();

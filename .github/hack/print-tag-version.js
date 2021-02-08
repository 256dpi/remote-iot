// check tag
const result = (process.env.GITHUB_REF || '').match(/.*v(\d+\.\d+\.\d+)/);
if (result) {
  console.log(result[1]);
}

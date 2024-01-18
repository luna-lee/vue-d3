function markLoader(src) {
    return ` export default ${JSON.stringify(src)}`;
}
module.exports = markLoader;

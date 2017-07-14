const asciify = require('asciify-pixel-matrix');
const samsaccone = asciify(require('../assets/sam.json').pixels, { bg: true });

module.exports = () => {
    console.log("\n"); // eslint-disable-line
    console.log(samsaccone); // eslint-disable-line
};

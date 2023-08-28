const fs = require('fs/promises');
const file = "data.json";

const getProductfromFile = async (productId) => {
    try {
        const fileData = await fs.readFile(file, 'utf8');
        const fileResponse = JSON.parse(fileData);
        const foundProduct = fileResponse.products.find((x) => x.id === productId);

        if (!foundProduct) {
            return 'No product with that ID';
        } else {
            return [foundProduct];
        }
    } catch (err) {
        throw err;
    }
};

module.exports = getProductfromFile;

if (require.main === module) {
    (async () => {
        try {
            const result = await getProductfromFile(3);
            console.log(result);
        } catch (err) {
            console.error(err);
        }
    })();
}












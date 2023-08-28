const fs = require('fs');
const file = "data.json";

const getProductfromFileSync = (productId) => {
    const fileData = fs.readFileSync(file, 'utf8');

    const fileResponse = JSON.parse(fileData);
    const responseData = [];
    const foundProduct = fileResponse.products.find((x) => x.id === productId);
    
    if(!foundProduct){
        console.log('No product with that ID')
    }
    else  {
        responseData.push(foundProduct);
    }

    return responseData;
};

module.exports = getProductfromFileSync;

if (require.main === module) {
const result = getProductfromFileSync(2);
console.log(result);
//console.log("later");
};





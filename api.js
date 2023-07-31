const db = require("./db");
const axios = require("axios");
const {
    GetItemCommand,
    PutItemCommand,
    DeleteItemCommand,
    ScanCommand,
    UpdateItemCommand,
} = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");

const getProduct = async (event) => {
    const response = { statusCode: 200 };

    try {
        const { productId: productIdParam } = event.pathParameters;
        const { currency } = event.queryStringParameters || {};

        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({ productId: productIdParam }),
        };

        const { Item } = await db.send(new GetItemCommand(params));

        console.log({ Item });
        const { productId, title, description, price } = unmarshall(Item);

        // Perform currency conversion if the "currency" query parameter is present
        if (currency) {
            try {
                // Replace "YOUR_FOREX_API_KEY" with your actual API key from the Forex API provider
                const forexApiUrl = `https://api.fastforex.io/convert?api_key=54518be503-59af10a10f-ryii2r&from=EUR&to=${currency}&amount=${price}`;
                const forexResponse = await axios.get(forexApiUrl);
                const convertedPrice = parseFloat(forexResponse.data.result);

                if (!isNaN(convertedPrice)) {
                    response.body = JSON.stringify({
                        message: "Successfully retrieved product.",
                        data: {
                            productId,
                            title,
                            description,
                            price: {
                                [currency]: convertedPrice,
                                rate: forexResponse.data.rate,
                            },
                        },
                        rawData: Item,
                    });
                } else {
                    response.statusCode = 500;
                    response.body = JSON.stringify({
                        message: "Failed to convert currency.",
                        errorMsg: "Invalid conversion result.",
                    });
                }
            } catch (error) {
                console.error(error);
                response.statusCode = 500;
                response.body = JSON.stringify({
                    message: "Failed to convert currency.",
                    errorMsg: error.message,
                    errorStack: error.stack,
                });
            }
        } else {
            // If no currency parameter provided, return the product in EUR
            response.body = JSON.stringify({
                message: "Successfully retrieved product.",
                data: {
                    productId,
                    title,
                    description,
                    price,
                },
                rawData: Item,
            });
        }
    } catch (e) {
        console.error(e);
        response.statusCode = 500;
        response.body = JSON.stringify({
            message: "Failed to get product.",
            errorMsg: e.message,
            errorStack: e.stack,
        });
    }

    return response;
};


const createProduct = async (event) => {
    const response = { statusCode: 200 };

    try {
        const body = JSON.parse(event.body);
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Item: marshall(body || {}),
        };
        const createResult = await db.send(new PutItemCommand(params));

        response.body = JSON.stringify({
            message: "Successfully created product.",
            createResult,
        });
    } catch (e) {
        console.error(e);
        response.statusCode = 500;
        response.body = JSON.stringify({
            message: "Failed to create product.",
            errorMsg: e.message,
            errorStack: e.stack,
        });
    }

    return response;
};

const updateProduct = async (event) => {
    const response = { statusCode: 200 };

    try {
        const body = JSON.parse(event.body);
        const objKeys = Object.keys(body);
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({ productId: event.pathParameters.productId }),
            UpdateExpression: `SET ${objKeys.map((_, index) => `#key${index} = :value${index}`).join(", ")}`,
            ExpressionAttributeNames: objKeys.reduce((acc, key, index) => ({
                ...acc,
                [`#key${index}`]: key,
            }), {}),
            ExpressionAttributeValues: marshall(objKeys.reduce((acc, key, index) => ({
                ...acc,
                [`:value${index}`]: body[key],
            }), {})),
        };
        const updateResult = await db.send(new UpdateItemCommand(params));

        response.body = JSON.stringify({
            message: "Successfully updated product.",
            updateResult,
        });
    } catch (e) {
        console.error(e);
        response.statusCode = 500;
        response.body = JSON.stringify({
            message: "Failed to update product.",
            errorMsg: e.message,
            errorStack: e.stack,
        });
    }

    return response;
};

const deleteProduct = async (event) => {
    const response = { statusCode: 200 };

    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({ productId: event.pathParameters.productId }),
        };
        const deleteResult = await db.send(new DeleteItemCommand(params));

        response.body = JSON.stringify({
            message: "Successfully deleted product.",
            deleteResult,
        });
    } catch (e) {
        console.error(e);
        response.statusCode = 500;
        response.body = JSON.stringify({
            message: "Failed to delete product.",
            errorMsg: e.message,
            errorStack: e.stack,
        });
    }

    return response;
};

const getAllProducts = async () => {
    const response = { statusCode: 200 };

    try {
        const { Items } = await db.send(new ScanCommand({ TableName: process.env.DYNAMODB_TABLE_NAME }));

        const orderedProducts = Items.map((item) => {
            const { productId, title, description, price } = unmarshall(item);
            return {
                productId,
                title,
                description,
                price,
            };
        });
        response.body = JSON.stringify({
            message: "Successfully retrieved all products.",
            data: orderedProducts,
            Items,
        });
    } catch (e) {
        console.error(e);
        response.statusCode = 500;
        response.body = JSON.stringify({
            message: "Failed to retrieve products.",
            errorMsg: e.message,
            errorStack: e.stack,
        });
    }

    return response;
};

module.exports = {
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getAllProducts,
}; 
const db = require("./db");
const axios = require('axios'); 
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
        const { productId, currency } = event.pathParameters;
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({ productId }),
        };
        const { Item } = await db.send(new GetItemCommand(params));

        console.log({ Item });
        const { title, description, price } = unmarshall(Item);

        // Fetch currency exchange rate using the FastForex API
        const apiKey = '54518be503-59af10a10f-ryii2r'; // Replace with your actual FastForex API key
        const exchangeRateResponse = await axios.get(`https://api.fastforex.io/convert?from=USD&to=${currency}&amount=${price}&apikey=${apiKey}`);
        const convertedPrice = exchangeRateResponse.data.result;

        const orderedProduct = {
            productId,
            title,
            description,
            price: convertedPrice,
            currency, // Add the user-specified currency information to the response
        };
        response.body = JSON.stringify({
            message: "Successfully retrieved product.",
            data: orderedProduct,
            rawData: Item,
        });
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
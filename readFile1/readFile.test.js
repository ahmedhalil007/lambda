const fs = require('fs');
const getProductfromFile = require('./readFile');

describe('getProductfromFile', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should retrieve product by ID', async () => {
        jest.spyOn(fs, 'readFile').mockImplementationOnce(async (path, encoding) => {
            const data = JSON.stringify({
                products: [
                    {
                        id: 1,
                        name: 'Macbook',
                        price: 2000.00,
                        description: 'Apple Macbook with M1 chip',
                    },
                    {
                        id: 2,
                        name: 'Iphone 14',
                        price: 1500.00,
                        description: 'This is the second product.',
                    },
                    {
                        id: 3,
                        name: 'AirPods',
                        price: 399.99,
                        description: 'This is the third product.',
                    },
                ],
            });

            return data;
        });

        const result = await getProductfromFile(3);

        expect(result).toMatchInlineSnapshot(`
[
  {
    "description": "This is the third product.",
    "id": 3,
    "name": "AirPods",
    "price": 399.99,
  },
]
`);
    });
});


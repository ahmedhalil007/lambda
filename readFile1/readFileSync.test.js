const fs = require('fs');
const getProductfromFileSync = require('./readFileSync');
const { before } = require('lodash');
const { beforeEach } = require('node:test');


describe('getProductfromFileSync', () => {
    beforeEach(()=>{
        jest.clearAllMocks();
    });
    afterEach(()=>{
        jest.clearAllMocks();
    });

    it('should retrieve product by ID', () => {
        jest.spyOn(fs, "readFileSync").mockReturnValueOnce(`{
            "products": [
                {
                    "id": 1,
                    "name": "Macbook",
                    "price": 2000.00,
                    "description": "Apple Macbook with M1 chip"
                },
                {
                    "id": 2,
                    "name": "Iphone 14",
                    "price": 1500.00,
                    "description": "This is the second product."
                },
                {
                    "id": 3,
                    "name": "AirPods",
                    "price": 399.99,
                    "description": "This is the third product."
                }
            ]
        }`, 'utf8');
        

        const result = getProductfromFileSync(2);
        expect(result).toEqual([
            {
                id: 2,
                name: 'Iphone 14',
                price: 1500.00,
                description: 'This is the second product.',
            },
        ]);
    });

});

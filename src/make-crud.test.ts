import express = require("express");
import {Application} from 'express';
import {makeCrud} from './make-crud';
import * as fs from 'fs';
import * as request from 'supertest';
import { expect } from "chai";

describe('CRUD via REST', () => {
    let app: Application;

    beforeEach(async () => {
        app = express();
        app.use('/car', makeCrud('car', './test'));
        // wait for makeCrud to have created storage
        await new Promise((resolve) => setTimeout(resolve, 1));
    });

    it('should CRUD a car via REST', async () => {
        const car = {make: 'Mercedes'};
        const expectedId = 0;

        const postResult = await request(app)
            .post('/car')
            .send(car);
        expect(postResult.status).to.equal(201);
        expect({...postResult.body}).to.deep.equal({...car, id: expectedId});

        const getAllResult = await request(app)
            .get('/car')
            .send();

        expect(getAllResult.status).to.equal(200);
        expect(getAllResult.body).to.have.lengthOf(1);
        expect(getAllResult.body[0]).to.deep.equal({...car, id: expectedId});

        const getSingleResult = await request(app)
            .get(`/car/${expectedId}`)
            .send();
        expect(getSingleResult.status).to.equal(200);
        expect(getSingleResult.body).to.deep.equal({...car, id: expectedId});

        const updatedCar = {...car, make: 'BMW'};
        const putResult = await request(app)
            .put(`/car/${expectedId}`)
            .send(updatedCar);
        expect(putResult.status).to.equal(200);
        expect(putResult.body).to.deep.equal({...updatedCar, id: expectedId});

        const deleteResult = await request(app)
            .delete(`/car/${expectedId}`)
            .send();
        expect(deleteResult.status).to.equal(200);
        expect((await request(app).get('/car').send()).body).to.have.lengthOf(0);
    });

    it('should give 404 codes for operations on non-existing entities', async () => {
        const getResult = await request(app)
            .get('/car/12345')
            .send();
        expect(getResult.status).to.equal(404);

        const putResult = await request(app)
            .put('/car/12345')
            .send({});
        expect(putResult.status).to.equal(404);

        const deleteResult = await request(app)
            .delete('/car/12345')
            .send({});
        expect(deleteResult.status).to.equal(404);


    });

    afterEach(() => {
        fs.unlinkSync('./test/car.json');
    });
});

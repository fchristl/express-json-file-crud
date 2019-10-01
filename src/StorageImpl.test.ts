import {Storage} from './Storage';
import {StorageImpl} from './StorageImpl';
import {expect} from 'chai';
import * as fs from 'fs';

describe('Storage', () => {
    let storage: Storage<any>;

    before(async () => {
        fs.mkdir('./test', () => {
        });
        storage = new StorageImpl();
        await storage.init('entity', './test');
    });


    it('should CRUD an entity', async () => {
        let entity1: any = {'a': 'b'};
        entity1 = await storage.create(entity1);
        expect(entity1.id).to.equal(0);

        expect(await storage.getAll()).to.have.lengthOf(1);
        let entity2: any = {'c': 'd'};
        entity2 = await storage.create(entity2);
        expect(entity2.id).to.equal(1);
        let allEntities = await storage.getAll();
        expect(allEntities.find(e => e.a === 'b')).not.to.be.undefined;
        expect(allEntities.find(e => e.c === 'd')).not.to.be.undefined;

        await storage.delete(entity2);
        allEntities = await storage.getAll();
        expect(allEntities).to.have.lengthOf(1);
        expect(allEntities.find(e => e.a === 'b')).not.to.be.undefined;
        expect(allEntities.find(e => e.c === 'd')).to.be.undefined;

        await storage.update({id: entity1.id, 'e': 'f'});
        expect((await storage.get(entity1.id)).e).to.equal('f');

        await storage.delete(entity1);
        expect(await storage.getAll()).to.have.lengthOf(0);
    });

    it('should throw an error when trying to update an entity without an ID', async () => {
        let error;
        try {
            await storage.update({});
        } catch (e) {
            error = e;
        }
        expect(error).not.to.be.undefined;
    });

    it('should throw an error when trying to delete an entity without an ID', async () => {
        let error;
        try {
            await storage.delete({});
        } catch (e) {
            error = e;
        }
        expect(error).not.to.be.undefined;
    });

    it('should throw an error when trying to delete an entity that does not exist', async () => {
        let error;
        try {
            await storage.delete({id: 12345});
        } catch (e) {
            error = e;
        }
        expect(error).not.to.be.undefined;
    });

    after(() => {
        fs.unlinkSync('./test/entity.json');
    });
});

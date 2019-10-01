import {Storage} from './Storage';
import * as fs from 'fs';

/**
 * A {@link Storage} implementation that stores data in-memory and in a JSON file.
 */
export class StorageImpl<T extends { id: number }> implements Storage<T> {

    private entityName: string | undefined;
    private fullStoragePath = '';
    private wasInitialized = false;
    private entities: T[] = [];

    async init(entityName: string, storagePath: string): Promise<void> {
        this.entityName = entityName;
        this.wasInitialized = true;
        this.fullStoragePath = this.generateStoragePathForEntity(entityName, storagePath);

        await this.ensureStorageIsSetUp();
        await this.loadAllFromStorage();
    }

    private generateStoragePathForEntity(entityName: string, storagePath: string): string {
        return `${storagePath}/${entityName}.json`;
    }

    private ensureStorageIsSetUp(): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.readdir(this.fullStoragePath, (err, files) => {
                if (err != null && err.errno === -2) {
                    console.log('Storage not set up for this entity. Generating storage directory and file.');
                    fs.writeFile(this.fullStoragePath, JSON.stringify([]), (err) => {
                        if (err) {
                            console.error('Error creating storage file:');
                            console.error(err);
                            reject(err);
                            return;
                        }
                        resolve();
                    });
                } else {
                    resolve();
                }
            });
        });
    }

    private async loadAllFromStorage(): Promise<void> {
        if (!this.wasInitialized) {
            throw new Error('Trying to call getAll() without calling init() before');
        }

        try {
            const fileContents = await new Promise<Buffer>((resolve, reject) => {
                fs.readFile(this.fullStoragePath, (err, content) => {
                    if (err) {
                        return reject();
                    }
                    resolve(content);
                });
            });
            this.entities = JSON.parse(fileContents.toString());
        } catch (err) {
            console.error('Error reading or parsing entities from ' + this.fullStoragePath + ' : ' + (err ? err.message : ''));
        }
    }

    private storeAllToStorage(): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.writeFile(this.fullStoragePath, JSON.stringify(this.entities, null, 2), (err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }

    async create(entity: T): Promise<T> {
        entity.id = this.createNextEntityId();
        this.entities.push(entity);
        await this.storeAllToStorage();
        return entity;
    }

    async update(entity: T): Promise<T> {
        if (entity.id == null) {
            throw new Error('Trying to update an entity without an ID');
        }
        const currentIndex = this.entities.findIndex(e => e.id === entity.id);
        this.entities[currentIndex] = entity;
        await this.storeAllToStorage();
        return entity;
    }

    private createNextEntityId(): number {
        if (this.entities.length === 0) {
            return 0;
        }
        const sortedEntities = this.entities.sort((e1, e2) => `${e1.id}`.localeCompare(`${e2.id}`));
        const entityWithHighestId = sortedEntities[sortedEntities.length - 1];
        return entityWithHighestId.id + 1;
    }

    async get(id: number): Promise<T | undefined> {
        return this.entities.find(e => e.id === id);
    }

    async getAll(): Promise<T[]> {
        return this.entities;
    }

    async delete(entity: T): Promise<void> {
        if (entity.id == null) {
            throw new Error('Trying to delete an entity without an ID');
        }
        const currentIndex = this.entities.findIndex(e => e.id === entity.id);
        if (currentIndex === -1) {
            throw new Error('Trying to delete entity that didn\'t exist');
        }
        this.entities.splice(currentIndex, 1);
        await this.storeAllToStorage();
    }


}

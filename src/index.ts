import * as express from 'express';
import {NextFunction, Response, Request, Router} from 'express';
import * as fs from 'fs';

function generateStoragePathForEntity(entityName: string, storagePath: string) {
    return `${storagePath}/${entityName}.json`;
}

function setupStorage(entityName: string, storagePath: string, callback: (success: boolean) => void) {
    const fullPath = generateStoragePathForEntity(entityName, storagePath);
    fs.readdir(fullPath, (err, files) => {
        if (err.errno === -2) {
            console.log('Storage not set up for this entity. Generating storage directory and file.');
            fs.writeFile(fullPath, JSON.stringify([]), (err) => {
                if (err) {
                    console.error('Error creating storage file:');
                    console.error(err);
                    callback(false);
                    return;
                }
                callback(true);
            });
        } else {
            callback(true);
        }
    });
}

function loadEntitiesFromStorage(entityName: string, storagePath: string, callback: (entities: any[]) => void): void {
    fs.readFile(generateStoragePathForEntity(entityName, storagePath), (err, content) => {
        if (err) {
            console.error(`Error loading entities '${entityName} from storage '${storagePath}:`);
            console.error(err);
            callback([]);
            return;
        }

        try {
            const entities = JSON.parse(content.toString());
            if (!Array.isArray(entities)) {
                console.error(`Error parsing entities '${entityName} from '${storagePath}: File does not contain an array`);
                callback([]);
                return;
            }
            callback(entities);
        } catch (err) {
            console.error(`Error parsing entities '${entityName} from storage '${storagePath}:`);
            console.error(err);
            callback([]);
        }
    })
}

function storeEntitiesToStorage(entities: any[], entityName: string, storagePath: string, callback: () => void) {
    const fullPath = generateStoragePathForEntity(entityName, storagePath);
    fs.writeFile(fullPath, JSON.stringify(entities), err => {
        if (err) {
            console.error(`Error storing entities '${entityName}' to ${fullPath}:`);
            console.error(err);
            return;
        }
    });
}

function generateObjectId(id: number | null, entities: any[]) {
    if (id == null) {
        id = 0;
    }
    while (entities.find(e => e.id === id)) {
        id ++;
    }
    return id;
}

export function makeCrud(entityName: string, storagePath: string): Router {
    const router = express.Router();
    let entities: any[] = [];

    setupStorage(entityName, storagePath, success => {
        loadEntitiesFromStorage(entityName, storagePath, e => {
            console.log(`Loaded ${e.length} entities from storage for entity '${entityName}'`);
            entities = e
        });
    });

    router.use(express.json());

    router.use((req: Request, res: Response, next: NextFunction) => {
        res.append('Content-Type', 'application/json');
        next();
    });

    router.get('/', (req: Request, res: Response) => {
        res.send(entities);
    });

    router.get('/:id', (req: Request, res: Response) => {
        res.send(entities.find(e => e.id == req.params.id));
    });

    router.post('/', (req: Request, res: Response) => {
        const obj = req.body;
        obj.id = generateObjectId(obj.id, entities);
        entities.push(obj);
        res.status(201).send(obj);
        storeEntitiesToStorage(entities, entityName, storagePath, () => {});
    });

    router.put('/:id', (req: Request, res: Response) => {
        const obj = req.body;
        if (obj.id !== +req.params.id) {
            obj.id = +req.params.id;
        }
        const index = entities.findIndex(e => e.id === obj.id);
        if (index === -1) {
            res.status(404).send({
                'error': `No object found with the given ID ${obj.id}`
            });
            return;
        }
        entities.splice(index, 1, obj);
        res.status(200).send();
        storeEntitiesToStorage(entities, entityName, storagePath, () => {});
    });

    router.delete('/:id', (req: Request, res: Response) => {
        const index = entities.findIndex(e => e.id === +req.params.id);
        if (index === -1) {
            res.status(404).send({
                'error': `No object found with the given ID ${req.params.id}`
            });
            return;
        }
        entities.splice(index, 1);
        res.status(200).send();
        storeEntitiesToStorage(entities, entityName, storagePath, () => {});
    });

    return router;
}

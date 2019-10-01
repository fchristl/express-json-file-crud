import {Storage} from './Storage';
import {StorageImpl} from './StorageImpl';

/**
 * A factory that creates a singleton {@link Storage} object.
 */
export class StorageFactory {
    private static storage: Storage<any>;

    static getStorage<T>(): Storage<T> {
        if (this.storage == null) {
            this.storage = new StorageImpl();
        }
        return this.storage;
    }
}

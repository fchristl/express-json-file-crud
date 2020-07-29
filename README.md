This package helps to quickly setup a CRUD REST service using Express:
You can create, read, update and delete objects using REST.

It stores data in plain JSON files. No database is required, which makes
setup rapid compared to similar solutions, and therefore perfectly suitable
for quickly prototyping solutions.

This package should probably not be used for productive applications, as
the underlying JSON-file-based storage engine is very basic and not a
replacement for a proper database.

## Setup

In your express project, run `npm install --save express-json-file-crud`.

Then mount a CRUD route under any endpoint, e.g.:

    const makeCrud = require('express-json-file-crud').makeCrud;
    const carCrud = makeCrud('cars', './storage');
    app.use('/cars', carCrud);

`makeCrud(entityName: string, storagePath: string)` takes two arguments:
* `entityName`: The type of entity that will be stored using this end
  point.
* `storagePath`: The (relative or absolute) path to a directory where
  one file per entity will be stored.

All entities will be stored in `[storagePath]/[entityName].json`. The individual
`[entityName].json` files and storagePath will be created if they don't exist.

## IDs
Objects are identified by a numeric ID. When an object is created that
has no ID set or that has an ID that conflicts with an existing ID,
the `id` property will automatically be filled (by incrementing the
highest stored ID so far for the given entity).

The IDs are used to read, update and delete specific objects.

## REST usage

| Action | Path | HTTP Action | Description |
|--------|-----|-------------|-------------|
| Create | /   | POST        | |
| Read (list all objects) | / | GET | Returns an array of all stored entities |
| Read (single object) | /:id | GET | Returns the object with the given ID |
| Update (update existing object) | /:id | PUT | Updates the object with the given ID |
| Delete | /:id | DELETE | deletes the object with the given ID |

When you start your express app, the `cars` route is now ready to
be used.

POST and PUT need to contain a request header `Content-Type: application/json`
to work properly.

For example, to create a new car, you can call

    POST /cars

with a car object as the request body.

To list all cars, you can call

    GET /cars

and get an array with cars back as the response body.

To get the car with the ID 1, you can call

    GET /cars/1

To update it, call

    PUT /cars/1

with the updated car object in the request body.

To delete the car with the ID 1:

    DELETE /cars/1

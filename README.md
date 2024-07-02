## Indexed

Minimalistic API for IndexedDB that acts like WebStorage.

```js
const db = await Indexed.open("testdb");

await db.set("name", "John Doe");
await db.set("email", "johndoe@example.com");

const name = await db.get("name");
const email = await db.get("email");
console.log(name, email);

db.close();
```

## Installation

```html
<script src="https://cdn.jsdelivr.net/gh/creuserr/indexed@main/dist/indexed.min.js"></script>
```

## Documentation

### `class Indexed`

#### `static open(name, version=1)`
Returns a promise. This method attempts to open a database.
If successful, an `Indexed.Database` instance will be returned.

```js
const db = await Indexed.open("testdb");
```

#### `static delete(name)`
Returns a promise. This method attempts to delete a database.

```js
await Indexed.delete("testdb");
```

#### `static all()`
Returns a promise. This method returns all the existing database.
If successful, a list of objects will be returned.
The objects would contain the following properties: name, version.

```js
await Indexed.all();
// [{ name: "testdb", version: 1 }]
```

#### `static check(name, version=1)`
Returns a promise. This method attempts to check if the database follows ***Indexed scheme**.
If successful, a boolean will be returned.

> [!NOTE]
> This method attempts to open the database in order to check its scheme.

```js
await Indexed.check("testdb");
// true
```

### `class Indexed.Database`

#### `set(key, value)`
Returns a promise. This method attempts to update or create a data inside the database.

```js
await db.set("name", "John Doe");
```

#### `get(key, default_value)`
Returns a promise. This method attempts to retrieve a data inside the database.
`default_value` will be returned if the key doesn't exist.

```js
await db.get("name");
// "John Doe"

await db.get("bio", "No bio found");
// "No bio found"
```

#### `all()`
Returns a promise. This method attempts to retrieve all the data inside the database.
If successful, an object will be returned.

```js
await db.all();
// { name: "John Doe", email: "johndoe@example.com" }
```

#### `delete(key)`
Returns a promise. This method attempts to delete a data from the database.

```js
await db.delete("name");
```

#### `close()`
This method closes the database.

> [!IMPORTANT]
> If you are deleting a database, make sure to close its connection first.

```js
await db.close();
```

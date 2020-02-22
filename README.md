# Firestore Sweet

[Cloud Firestore](https://firebase.google.com/docs/firestore) made super easy with sweet syntactic sugar

`firestore-sweet` works with both client-side `firebase` and server-side `firebase-admin`.

## Installation

```
yarn add firestore-sweet
```

## Examples

### client-side initialization : `firebase`

```javascript
import sweet from "firestore-sweet"
import firebase from "firebase"

firebase.initializeApp({
  apiKey: '### FIREBASE API KEY ###',
  authDomain: '### FIREBASE AUTH DOMAIN ###',
  projectId: '### CLOUD FIRESTORE PROJECT ID ###'
});

const db = sweet(firebase.firestore)
```

### server-side initialization : `firebase-admin`

```javascript
import sweet from "firestore-sweet"
import admin from "firebase-admin"

const serviceAccount = require('path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = sweet(admin.firestore)
```

### `get`
`firestore-sweet` automatically knows whether the `ref` is a `collection` or a `doc` based on the position.
It returns actual data instead of snapshot.
```javascript
/* for comparisons with the original APIs
   const fs = firebase.firestore() */

// fs.collection("users").get()
await db.get("users")

// fs.collection("users").doc("Bob").get()
await db.get("users", "Bob")

// fs.collection("users").doc("Bob").collection("comments").get()
await db.get("users", "Bob", "comments")

// fs.collection("users").doc("Bob").collection("comments").doc("no3").get()
await db.get("users", "Bob", "comments", "no3")
```

### `where` `orderBy` `limit`
`firestore-sweet` knows whether the argument is for `where`, `orderBy`, or `limit` based on the array length.

```javascript
// fs.collection("users").where("age", "==", 20).get()
await db.get("users", ["age", "==", 20])

// fs.collection("users").where("age", "==", 20).orderBy("age", "desc").get()
await db.get("users", ["age", "==", 20], ["age", "desc"])

// fs.collection("users").where("age", "==", 20).orderBy("age", "desc").limit(5).get()
await db.get("users", ["age", "==", 20], ["age", "desc"], 5)
```  

### `startAt` `startAfter` `endAt` `endBefore`

```javascript
// fs.collection("users").orderBy("age").startAt(20).get()
await db.get("users", ["age"], ["startAt", 20])
```

### `add` `set` `upsert` `update` `delete`


```javascript
// fs.collection("users").doc("Bob").set({name:"Bob", age: 30})
await db.set({name:"Bob", age: 30}, "users", "Bob")

// fs.collection("users").doc("Bob").set({name:"Bob", age: 30}, {merge: true})
await db.upsert({name:"Bob", age: 30}, "users", "Bob")

// fs.collection("users").doc("Bob").update({name:"Bob", age: 30})
await db.update({age: 40}, "users", "Bob")

// fs.collection("users").doc("Bob").delete()
await db.delete("users", "Bob")

```

### delete field : `del`
```javascript
// fs.collection("users").doc("Bob").update({age: firebase.firestore.FieldValue.delete()})
await db.update({age: db.del}, "users", "Bob")

```

### increment field : `inc(n)`
```javascript
// fs.collection("users").doc("Bob").update({age: firebase.firestore.FieldValue.increment(3)})
await db.update({age: db.inc(3)}, "users", "Bob")

```


### onSnapShot : `on`

```javascript
const unsubscribe = db.on("users", (docs) => {
  for(const user of docs){
    console.log(`${user.name} : ${user.age}`)
  }
})

```

### runTransaction : `tx`

```javascript
await db.tx("users", "Bob", ({ref, t, data}) => {
  t.update(ref, {age: data.age + 10})
})

```

### batch : `batch`

```javascript
await db.batch([
  ["set, {name: "Bob", age: 30}, "users", "Bob"],
  ["update", {age: db.inc(3)}, "users", "Bob"],
  ["delete", "users", "Bob"]
])
```

### Getting document ids and snapshots as return values

You can also get document `id` and `snapshot` with the actual data by adding `K`, `S` or `R` to the method names.

`get` => `getK` `getS` `getR` / `tx`  => `txK` `txS` `txR` / `on`  => `onK` `onS` `onR`

```javascript
// getK returns document id and data
const users = await db.getK("users")
for(const id in users){
  console.log(`${users[id].name} : ${users[id].age}`)
}

// getS returns Object with snapshot, document id and data
for(const {id, ss , data} of await db.getS("users")){
    const user = ss.data() // same as data
	console.log(`${user.name} : ${user.age}`)
}
  
// getR returns a raw snapshot which is the same behavior as the original firestore API but as an array
(await db.getR("users")).forEach((ss) => {
    const user = ss.data()
	console.log(`${user.name} : ${user.age}`)
}

/* "txK", "txS", "txR" and "onK", "onS", "onR"
   return the same data as "getK", "getS", "getR" respectively */
```

## Test
You need service-account credentials for a Firebase project at `/test/.service-account.json` to run the tests.

Use a disposable project if you are to run the tests since the tests manipulate and delete actual data from your Firestore.

```
yarn run test
```

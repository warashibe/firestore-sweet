# Firestore Sweet

[Cloud Firestore](https://firebase.google.com/docs/firestore) made super easy with sweet syntactic sugar

`firestore-sweet` works with both client-side `firebase` and server-side `firebase-admin`.

## Installation

```
yarn add firestore-sweet
```

## Examples

### client-side initialization

```javascript
import sweet from "firebase-sweet"
import firebase from "firebase"

firebase.initializeApp({
  apiKey: '### FIREBASE API KEY ###',
  authDomain: '### FIREBASE AUTH DOMAIN ###',
  projectId: '### CLOUD FIRESTORE PROJECT ID ###'
});

const db = sweet(firebase.firestore)
```

### server-side initialization

```javascript
import sweet from "firebase-sweet"
import admin from "firebase-admin"

const serviceAccount = require('path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = sweet(firebase.firestore)
```

### `get`

```javascript
// firestore-sweet automatically knows whether the ref is a collection or a doc based on the position
// it returns actual data instead of snapshot

// for comparisons with the original APIs
// const fs = firebase.firestore()

// fs.collection("user").get()
const users = await db.get("users")

// fs.collection("user").doc("Bob").get()
const Bob = await db.get("users", "Bob")

// fs.collection("user").doc("Bob").collection("comments").get()
const Bob_comments = await db.get("users", "Bob", "comments")

// fs.collection("user").doc("Bob").collection("comments").doc("no3").get()
const Bob_comments_no3 = await db.get("users", "Bob", "comments", "no3")

// getK returns document id and data
const users_with_id = await db.getK("users")

// getS returns Object with snapshot, document id and data
const users_with_snapshot = await db.getS("users")

// getR returns a raw snapshot which is the same behavior as the original firestore API but as an array
const users_with_original_return_value = await db.getR("users")

// firestore-sweet knows whether the argument is for where, orderBy, or limit based on the array length
// fb.collection("users").where("age", "==", 20).get()
const age20
  = await db.get("users", ["age", "==", 20])

// fs.collection("users").where("age", "==", 20).orderBy("age", "desc").get()
const age_20_orderBy_age_descending
  = await db.get("users", ["age", "==", 20], ["age", "desc"])

// fs.collection("users").where("age", "==", 20).orderBy("age", "desc").limit(5).get()
const age_20_orderBy_age_descending_limit_5
  = await db.get("users", ["age", "==", 20], ["age", "desc"], 5)
  
// startAt, startAfter, endAt, endBefore
// fs.collection("users").orderBy("age").startAt(20).get()
const orderBy_age_startAt_20
  = await db.get("users", ["age"], ["startAt", 20])
```


### `set` `upsert` `update` `delete`

```javascript
// fs.collection("users").doc("Bob").set({name:"Bob", age: 30})
await db.set({name:"Bob", age: 30}, "users", "Bob")

// upsert means with {merge: true}
// fs.collection("users").doc("Bob").set({name:"Bob", age: 30}, {merge: true})
await db.upsert({name:"Bob", age: 30}, "users", "Bob")

// fs.collection("users").doc("Bob").update({name:"Bob", age: 30})
await db.update({age: 40}, "users", "Bob")

// fs.collection("users").doc("Bob").delete()
await db.delete("users", "Bob")

```

### delete field
```javascript
// fs.collection("users").doc("Bob").update({age: firebase.firestore.FieldValue.delete()})
await db.update({age: db.del}, "users", "Bob")

```

### increment field
```javascript
// fs.collection("users").doc("Bob").update({age: firebase.firestore.FieldValue.increment(3)})
await db.update({age: db.inc(3)}, "users", "Bob")
```


### `onSnapShot`

```javascript
const unsubscribe = db.on("users", (docs) => {
  for(const user of docs){
    console.log(`${user.name} : ${user.age}`)
  }
})

const unsubscribe = db.onK("users", (docs) => {
  for(const id in docs){
    console.log(`${docs[id].name} : ${docs[id].age}`)
  }
})

const unsubscribe = db.onS("users", "Bob", (docs) => {
  for(const obj of docs){
    const user = obj.ss.data()
	console.log(`${user.name} : ${user.age}`)
  }
})

const unsubscribe = db.onR("users", "Bob", (docs) => {
  docs.forEach((ss) => {
    const user = ss.data()
	console.log(`${user.name} : ${user.age}`)
  }

})

```

### `runTransaction`

```javascript
await db.tx("users", "Bob", ({ref, t, data}) => {
  t.update(ref, {age: data.age + 10})
})

// txK, txS, txR return the same data as getK, getS, getR / onK, onS, onR
```

### `batch`

```javascript
await db.batch([
  ["set, {name: "Bob", age: 30}, "users", "Bob"],
  ["update", {age: db.inc(3)}, "users", "Bob"],
  ["delete", "users", "Bob"]
])
```

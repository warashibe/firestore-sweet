import sweet from "../src/index"
import admin from "firebase-admin"
import serviceAccount from "./.service-account.json"
import assert from "assert"
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
} catch (e) {}

const db = sweet(admin.firestore)

describe("Firestore Sweet", () => {
  before(async () => {
    const docs = await db.getK("test")
    for (const id in docs) {
      await db.delete("test", id)
    }
  })

  describe("#initialization", () => {
    it("test collection should be empty", async () => {
      const docs = await db.get("test")
      assert.equal(docs.length, 0)
    })
  })

  describe("#add()", () => {
    it("should add Bob to the collection", async () => {
      const docs = await db.get("test")
      assert.equal(docs.length, 0)
      await db.add({ name: "Bob", age: 30 }, "test")
      const docs2 = await db.get("test")
      const Bob = docs2[0]
      assert.equal(docs2.length, 1)
      assert.equal(Bob.name, "Bob")
      assert.equal(Bob.age, 30)
    })
  })

  describe("#set()", () => {
    it("should add Alice to the collection", async () => {
      await db.set({ name: "Alice", age: 25 }, "test", "alice")
      const Alice = await db.get("test", "alice")
      assert.equal(Alice.name, "Alice")
      assert.equal(Alice.age, 25)
    })

    it("should reset Alice to the collection", async () => {
      await db.set({ age: 50 }, "test", "alice")
      const Alice = await db.get("test", "alice")
      assert.equal(Alice.name, undefined)
      assert.equal(Alice.age, 50)
    })
  })

  describe("#upsert()", () => {
    it("should upsert Alice to the collection", async () => {
      await db.upsert({ name: "Alice Upsert" }, "test", "alice")
      const Alice = await db.get("test", "alice")
      assert.equal(Alice.name, "Alice Upsert")
      assert.equal(Alice.age, 50)
    })
  })

  describe("#update()", () => {
    it("should update the age of Alice", async () => {
      await db.update({ age: 35 }, "test", "alice")
      const Alice = await db.get("test", "alice")
      assert.equal(Alice.age, 35)
    })
  })

  describe("#db.inc()", () => {
    it("should increment a field", async () => {
      await db.update({ age: db.inc(3) }, "test", "alice")
      const Alice = await db.get("test", "alice")
      assert.equal(Alice.age, 38)
    })
  })

  describe("#db.del", () => {
    it("should delete a field", async () => {
      await db.update({ age: db.del }, "test", "alice")
      const Alice = await db.get("test", "alice")
      assert.equal(Alice.age, undefined)
    })
  })

  describe("#get()", () => {
    it("should get all docs", async () => {
      const docs = await db.get("test")
      assert.equal(docs.length, 2)
    })
    it("should return one documet", async () => {
      const Alice = await db.get("test", "alice")
      assert.equal(typeof Alice, "object")
      assert.equal(Alice.name, "Alice Upsert")
    })
  })

  describe("#getK()", () => {
    it("should return document ids", async () => {
      const docs = await db.getK("test")
      assert.equal(typeof docs, "object")
      assert.equal(docs["alice"].name, "Alice Upsert")
    })
  })

  describe("#getS()", () => {
    it("should return document snapshot, id and data", async () => {
      const { ss, data, id } = await db.getS("test", "alice")
      const Alice = ss.data()
      assert.equal(id, "alice")
      assert.equal(data.name, "Alice Upsert")
      assert.equal(typeof Alice, "object")
      assert.equal(Alice.name, "Alice Upsert")
    })
  })

  describe("#getR()", () => {
    it("should return document snapshot", async () => {
      const ss = await db.getR("test", "alice")
      const Alice = ss.data()
      assert.equal(typeof Alice, "object")
      assert.equal(Alice.name, "Alice Upsert")
    })
  })

  describe("#on()", () => {
    it("should listen for doc changes", async () => {
      let n = 0
      const unsubscribe = await db.on("test", "alice", Alice => {
        if (n === 1) {
          assert.equal(Alice.name, "Alice")
          assert.equal(Alice.age, 60)
          unsubscribe()
        }
      })
      await db.update({ name: "Alice", age: 60 }, "test", "alice")
    })
  })

  describe("#tx()", () => {
    it("should atomically read and update a doc", async () => {
      await db.tx("test", "alice", ({ t, ref, data }) => {
        assert.equal(data.age, 60)
        t.update(ref, { age: data.age + 3 })
      })
      const Alice = await db.get("test", "alice")
      assert.equal(Alice.age, 63)
    })
  })

  describe("#batch()", () => {
    it("should atomically add and update docs", async () => {
      await db.batch([
        ["set", { name: "John", age: 15 }, "test", "john"],
        ["update", { name: "Alice New" }, "test", "alice"]
      ])
      const Alice = await db.get("test", "alice")
      const John = await db.get("test", "john")
      assert.equal(Alice.name, "Alice New")
      assert.equal(John.age, 15)
    })
  })
  describe("#delete()", () => {
    it("should delete a doc", async () => {
      await db.delete("test", "john")
      const John = await db.get("test", "john")
      assert.equal(John, null)
    })
  })
})

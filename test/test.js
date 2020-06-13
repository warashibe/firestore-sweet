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
xdescribe("Regular Methods", () => {
  before(async () => {
    const docs = await db.drop("test")
    return
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
  describe("#where()", () => {
    it("should get the right doc with where", async () => {
      const docs = await db.get("test", ["name", "==", "Alice New"])
      assert.equal(docs[0].age, 63)
    })
  })

  describe("#limit()", () => {
    it("should limit the number of returning docs", async () => {
      const docs = await db.get("test", 1)
      assert.equal(docs.length, 1)
    })
  })

  describe("#orderBy()", () => {
    it("should sort by age", async () => {
      const docs = await db.get("test", ["age", "desc"])
      assert.equal(docs[0].age, 63)
      assert.equal(docs[1].age, 30)
    })
  })

  describe("#startAt()", () => {
    it("should start at the specified age", async () => {
      const docs = await db.get("test", ["age", "desc"], ["startAt", 50])
      assert.equal(docs[0].age, 30)
      assert.equal(docs.length, 1)
    })
  })
  describe("#endAt()", () => {
    it("should end at the specified age", async () => {
      const docs = await db.get("test", ["age", "desc"], ["endAt", 50])
      assert.equal(docs[0].age, 63)
      assert.equal(docs.length, 1)
    })
  })
})

describe("Extra Methods", function() {
  this.timeout(0)
  before(async () => {
    const docs = await db.drop("test")
    await db.batch([
      ["set", { name: "Bob", age: 10 }, "test", "bob"],
      ["set", { name: "Alice", age: 20 }, "test", "alice"],
      ["set", { name: "John", age: 30 }, "test", "john"]
    ])
    return
  })

  describe("#initialization", () => {
    it("should update multiple docs with query", async () => {
      await db.update({ age: 5 }, "test", ["age", ">", 5])

      const John = await db.get("test", "john")
      assert.equal(John.age, 5)

      const Bob = await db.get("test", "bob")
      assert.equal(Bob.age, 5)

      const Alice = await db.get("test", "alice")
      assert.equal(Alice.age, 5)

      await db.set({ age: 7 }, "test", ["name", "==", "Bob"])
      const Bob2 = await db.get("test", "bob")
      assert.equal(Bob2.name, undefined)

      await db.update({ age: 88 }, "test", ["name", "==", "Alice"])
      const Alice2 = await db.get("test", "alice")
      assert.equal(Alice2.age, 88)

      await db.upsert({ age: 50 }, "test", ["name", "==", "Alice"])
      const Alice3 = await db.get("test", "alice")
      assert.equal(Alice3.age, 50)
      assert.equal(Alice3.name, "Alice")

      await db.delete("test", ["name", "==", "Alice"])
      const Alice4 = await db.get("test", "alice")
      assert.equal(Alice4, null)

      const users = await db.get("test")
      assert.equal(users.length, 2)
    })
    // be careful running this test as it might exhaust your daily quota
    xit("should handle more than 500 bulk writes", async () => {
      let writes = []
      let writes2 = []
      for (let i = 0; i < 500; i++) {
        writes.push(["set", { i: i, age: 3 }, "test", `user-${i}`])
        writes2.push(["set", { i: i, age: 3 }, "test", `user-${i + 500}`])
      }
      await db.batch(writes)
      await db.batch(writes2)
      let users = await db.get("test", ["age", "==", 3])
      assert.equal(users.length, 1000)
      await db.delete("test", ["age", "==", 3])
      let users2 = await db.get("test", ["age", "==", 3])
      assert.equal(users2.length, 0)
    })
  })
})

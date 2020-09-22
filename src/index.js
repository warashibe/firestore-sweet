import {
  isNil,
  length,
  takeWhile,
  T,
  head,
  both,
  compose,
  includes,
  __,
  is,
  addIndex,
  reduce,
  cond,
  propEq,
  map,
  unapply,
  mergeAll,
  curry,
  isEmpty,
  splitEvery,
  fromPairs,
  xprod,
  toUpper,
  complement
} from "ramda"

const isOdd = v => v % 2 === 1
const isEven = complement(isOdd)

export default _db => {
  const db = _db()
  const _ref = addIndex(reduce)(
    (acc, arg, i) =>
      cond([
        [is(String), () => (isEven(i) ? acc.collection(arg) : acc.doc(arg))],
        [is(Number), () => acc.limit(arg)],
        [
          is(Array),
          cond([
            [propEq("length", 3), arg => acc.where(...arg)],
            [
              both(
                propEq("length", 2),
                compose(
                  includes(__, ["startAt", "startAfter", "endAt", "endBefore"]),
                  head
                )
              ),
              arg => acc[arg[0]](arg[1])
            ],
            [T, arg => acc.orderBy(...arg)]
          ])
        ]
      ])(arg),
    db
  )

  const _strings = compose(length, takeWhile(is(String)))

  const _get = async args => {
    const n = _strings(args)
    const ref = _ref(args)
    const ss = await ref.get()
    return { n, ref, ss }
  }

  const _write_without_data = args => {
    const n = _strings(args)
    const ref = _ref(args)
    return { ref, n, query: n !== args.length }
  }

  const _write = args => {
    let data = args.shift()
    const { ref, n, query } = _write_without_data(args)
    return { data, ref, n, query }
  }

  const _one = ss => (ss.exists ? ss.data() : null)

  const _data = {
    d: ({ ss, n }) => {
      if (isOdd(n)) {
        let docs = []
        ss.forEach(doc => {
          docs.push(doc.data())
        })
        return docs
      } else {
        return _one(ss)
      }
    },
    r: ({ ss, n }) => {
      if (isOdd(n)) {
        let docs = []
        ss.forEach(doc => {
          docs.push(doc)
        })
        return docs
      } else {
        return ss
      }
    },
    s: ({ ss, n }) => {
      if (isOdd(n)) {
        let docs = []
        ss.forEach(doc => {
          docs.push({ id: doc.id, data: doc.data(), ss: doc })
        })
        return docs
      } else {
        return ss.exists ? { id: ss.id, data: ss.data(), ss: ss } : null
      }
    },
    k: ({ ss, n }) => {
      if (isOdd(n)) {
        let docs = {}
        ss.forEach(doc => {
          docs[doc.id] = doc.data()
        })
        return docs
      } else {
        return _one(ss)
      }
    }
  }

  const _on = args => {
    const func = args.pop()
    const n = _strings(args)
    const ref = _ref(args)
    return { func, n, ref }
  }

  const _ops = map(curry, {
    write: async (op, opt, args) => {
      const { data, ref, n, query } = includes(op)(["drop", "delete"])
        ? _write_without_data(args)
        : _write(args)
      if (query || op === "drop") {
        const docs = _data.s({ n: n, ss: await ref.get() })
        if (isEmpty(docs)) {
          return
        }
        const prs = compose(
          map(_docs => {
            const batch = db.batch()
            for (let {
              ss: { _ref: ref }
            } of _docs) {
              if (includes(op)(["add", "set", "update"])) {
                complement(isNil)(opt)
                  ? batch[op](ref, data, opt)
                  : batch[op](ref, data)
              } else if (includes(op)(["drop", "delete"])) {
                batch.delete(ref)
              }
            }
            return batch.commit()
          }),
          splitEvery(Math.min(docs.length, 500))
        )(docs)
        return Promise.all(prs)
      } else {
        return op === "delete"
          ? ref[op]()
          : isNil(opt)
          ? ref[op](data)
          : ref[op](data, opt)
      }
    },
    get: async (getter, args) => _data[getter](await _get(args)),
    on: async (getter, args) => {
      const { func, n, ref } = _on(args)
      return ref.onSnapshot(ss => func(_data[getter]({ n, ss })))
    },
    tx: async (getter, args) => {
      const { func, n, ref } = _on(args)
      return await db.runTransaction(async t => {
        return func({
          t,
          data: _data[getter]({ n, ss: await t.get(ref) }),
          ref
        })
      })
    }
  })

  const APIs = {
    inc: _db.FieldValue.increment,
    del: _db.FieldValue.delete(),
    ts: _db.FieldValue.serverTimestamp(),
    union: db.FieldValue.arrayUnion,
    remove: _db.FieldValue.arrayRemove,

    increment: _db.FieldValue.increment,
    delete: _db.FieldValue.delete,
    serverTimestamp: _db.FieldValue.serverTimestamp,
    arrayUnion: _db.FieldValue.arrayUnion,
    arrayRemove: _db.FieldValue.arrayRemove,

    batch: ops => {
      const batch = db.batch()
      for (let args of ops) {
        const op = args.shift()
        if (includes(op)(["add", "set", "update"])) {
          const { data, ref } = _write(args)
          batch[op](ref, data)
        } else if (op === "upsert") {
          const { data, ref } = _write(args)
          batch.set(ref, data, { merge: true })
        } else if (op === "delete") {
          const ref = _ref(args)
          batch.delete(ref)
        }
      }
      return batch.commit()
    }
  }

  const getAPIs = compose(
    fromPairs,
    map(([op, flag]) => [
      `${op}${toUpper(flag)}`,
      unapply(_ops[op](flag === "" ? "d" : flag))
    ]),
    xprod
  )(["get", "on", "tx"], ["", "k", "s", "r"])

  const writeAPIs = compose(
    fromPairs,
    map(op => [
      op,
      unapply(
        _ops.write(
          op === "upsert" ? "set" : op,
          op === "upsert" ? { merge: true } : null
        )
      )
    ])
  )(["add", "set", "update", "upsert", "delete", "drop"])

  const ref = unapply(_ref)

  return mergeAll([getAPIs, APIs, writeAPIs, { ref, firestore: db }])
}

import R from "ramdam"

export default _db => {
  const db = _db()

  const _ref = R.addIndex(R.reduce)(
    (acc, arg, i) =>
      R.cond([
        [R.isString, () => (R.isEven(i) ? acc.collection(arg) : acc.doc(arg))],
        [R.isNumber, () => acc.limit(arg)],
        [
          R.isArray,
          R.cond([
            [R.equalsLength(3), arg => acc.where(...arg)],
            [
              R.both(
                R.equalsLength(2),
                R.compose(
                  R.includes(R.__, [
                    "startAt",
                    "startAfter",
                    "endAt",
                    "endBefore"
                  ]),
                  R.head
                )
              ),
              arg => acc[arg[0]](arg[1])
            ],
            [R.T, arg => acc.orderBy(...arg)]
          ])
        ]
      ])(arg),
    db
  )

  const _strings = R.compose(
    R.length,
    R.takeWhile(R.isString)
  )

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
      if (R.isOdd(n)) {
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
      if (R.isOdd(n)) {
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
      if (R.isOdd(n)) {
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
      if (R.isOdd(n)) {
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

  const _ops = R.map(R.curry, {
    write: async (op, opt, args) => {
      const { data, ref, n, query } = R.includes(op)(["drop", "delete"])
        ? _write_without_data(args)
        : _write(args)
      if (query || op === "drop") {
        const docs = _data.s({ n: n, ss: await ref.get() })
        if (R.isEmpty(docs)) {
          return
        }
        const prs = R.compose(
          R.map(_docs => {
            const batch = db.batch()
            for (let {
              ss: { _ref: ref }
            } of _docs) {
              if (R.includes(op)(["add", "set", "update"])) {
                R.isNotNil(opt)
                  ? batch[op](ref, data, opt)
                  : batch[op](ref, data)
              } else if (R.includes(op)(["drop", "delete"])) {
                batch.delete(ref)
              }
            }
            return batch.commit()
          }),
          R.aperture(Math.min(docs.length, 500))
        )(docs)
        return Promise.all(prs)
      } else {
        return op === "delete"
          ? ref[op]()
          : R.isNil(opt)
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

    ts: _db.Timestamp,

    batch: ops => {
      const batch = db.batch()
      for (let args of ops) {
        const op = args.shift()
        if (R.includes(op)(["add", "set", "update"])) {
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

  const getAPIs = R.compose(
    R.fromPairs,
    R.map(([op, flag]) => [
      `${op}${R.toUpper(flag)}`,
      R.unapply(_ops[op](flag === "" ? "d" : flag))
    ]),
    R.xprod
  )(["get", "on", "tx"], ["", "k", "s", "r"])

  const writeAPIs = R.compose(
    R.fromPairs,
    R.map(op => [
      op,
      R.unapply(
        _ops.write(
          op === "upsert" ? "set" : op,
          op === "upsert" ? { merge: true } : null
        )
      )
    ])
  )(["add", "set", "update", "upsert", "delete", "drop"])

  const ref = R.unapply(_ref)

  return R.mergeAll([getAPIs, APIs, writeAPIs, { ref, firestore: db }])
}

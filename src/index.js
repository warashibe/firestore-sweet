import R from "ramdam"

export default _db => {
  const db = _db()

  const _ref = args => {
    let n = 0
    const ref = R.addIndex(R.reduce)((acc, arg, i) => {
      if (R.isString(arg)) {
        n++
        return R.isEven(i) ? acc.collection(arg) : acc.doc(arg)
      } else if (R.isNumber(arg)) {
        return acc.limit(arg)
      } else if (R.isArray(arg)) {
        if (R.length(arg) == 3) {
          return acc.where(...arg)
        } else if (
          R.length(arg) == 2 &&
          R.includes(arg[0])(["startAt", "startAfter", "endAt", "endBefore"])
        ) {
          return acc[arg[0]](arg[1])
        } else {
          return acc.orderBy(...arg.slice(1))
        }
      }
    }, db)(args)
    return { n, ref }
  }

  const _get = async args => {
    const { n, ref } = _ref(args)
    const ss = await ref.get()
    return { n, ref, ss }
  }

  const _write = args => {
    let data = args.shift()
    const { ref } = _ref(args)
    return { data, ref }
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
    const { n, ref } = _ref(args)
    return { func, n, ref }
  }

  const _ops = R.map(R.curry, {
    write: (op, opt, args) => {
      const { data, ref } = _write(args)
      return R.isNil(opt) ? ref[op](data) : ref[op](data, opt)
    },
    get: async (getter, args) => _data[getter](await _get(args)),
    on: async (getter, args) => {
      const { func, n, ref } = _on(args)
      return ref.onSnapshot(ss => func(_data[getter]({ n, ss })))
    },
    tx: async (getter, args) => {
      const { func, n, ref } = _on(args)
      return await db.runTransaction(async t =>
        func({ t, data: _data[getter]({ n, ss: await t.get(ref) }), ref })
      )
    }
  })

  const APIs = {
    inc: _db.FieldValue.increment,

    del: _db.FieldValue.delete(),

    ts: _db.Timestamp,

    batch: (ops, func) => {
      const batch = db.batch()
      for (let args of ops) {
        const op = args.shift()
        if (R.includes(op)(["set", "update"])) {
          const { data, ref } = _write(args)
          batch[op](ref, data)
        } else if (op === "upsert") {
          const { data, ref } = _write(args)
          batch.set(ref, data, { merge: true })
        } else if (op === "delete") {
          const { ref } = _ref(args)
          batch.delete(ref)
        }
      }
      return batch.commit()
    },

    delete: (...args) => _ref(args).ref.delete()
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
  )(["add", "set", "update", "upsert"])

  return R.mergeAll([getAPIs, APIs, writeAPIs])
}

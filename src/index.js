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

  const _getData = ({ ss, n }) => {
    if (R.isOdd(n)) {
      let docs = []
      ss.forEach(doc => {
        docs.push(doc.data())
      })
      return docs
    } else {
      return _one(ss)
    }
  }

  const _getDataR = ({ ss, n }) => {
    if (R.isOdd(n)) {
      let docs = []
      ss.forEach(doc => {
        docs.push(doc)
      })
      return docs
    } else {
      return ss
    }
  }

  const _getDataK = ({ ss, n }) => {
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

  const _getDataS = ({ ss, n }) => {
    if (R.isOdd(n)) {
      let docs = []
      ss.forEach(doc => {
        docs.push({ id: doc.id, data: doc.data(), ss: doc })
      })
      return docs
    } else {
      return ss.exists ? { id: ss.id, data: ss.data(), ss: ss } : null
    }
  }

  const _data = {
    d: _getData,
    r: _getDataR,
    s: _getDataS,
    k: _getDataK
  }

  const _on = args => {
    const func = args.pop()
    const { n, ref } = _ref(args)
    return { func, n, ref }
  }

  const _op = (op, args, opt) => {
    const { data, ref } = _write(args)
    return R.isNil(opt) ? ref[op](data) : ref[op](data, opt)
  }

  const _getter = async (getter, args) => _data[getter](await _get(args))

  const _onSS = (getter, args) => {
    const { func, n, ref } = _on(args)
    return ref.onSnapshot(ss => func(_data[getter]({ n, ss })))
  }

  const _tx = async (getter, args) => {
    const { func, n, ref } = _on(args)
    return await db.runTransaction(async t =>
      func({ t, data: _data[getter]({ n, ss: await t.get(ref) }), ref })
    )
  }

  return {
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

    tx: (...args) => _tx("d", args),

    txR: (...args) => _tx("r", args),

    txK: (...args) => _tx("k", args),

    txS: (...args) => _tx("s", args),

    on: (...args) => _onSS("d", args),

    onR: (...args) => _onSS("r", args),

    onK: (...args) => _onSS("k", args),

    onS: (...args) => _onSS("s", args),

    get: (...args) => _getter("d", args),

    getR: (...args) => _getter("r", args),

    getK: (...args) => _getter("k", args),

    getS: (...args) => _getter("s", args),

    add: (...args) => _op("add", args),

    set: (...args) => _op("set", args),

    upsert: (...args) => _op("set", args, { merge: true }),

    update: (...args) => _op("update", args),

    delete: (...args) => _ref(args).ref.delete()
  }
}

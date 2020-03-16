"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray2 = require("babel-runtime/helpers/slicedToArray");

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _getIterator2 = require("babel-runtime/core-js/get-iterator");

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _toConsumableArray2 = require("babel-runtime/helpers/toConsumableArray");

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _ramdam = require("ramdam");

var _ramdam2 = _interopRequireDefault(_ramdam);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (_db) {
  var db = _db();

  var _ref = _ramdam2.default.addIndex(_ramdam2.default.reduce)(function (acc, arg, i) {
    return _ramdam2.default.cond([[_ramdam2.default.isString, function () {
      return _ramdam2.default.isEven(i) ? acc.collection(arg) : acc.doc(arg);
    }], [_ramdam2.default.isNumber, function () {
      return acc.limit(arg);
    }], [_ramdam2.default.isArray, _ramdam2.default.cond([[_ramdam2.default.equalsLength(3), function (arg) {
      return acc.where.apply(acc, (0, _toConsumableArray3.default)(arg));
    }], [_ramdam2.default.both(_ramdam2.default.equalsLength(2), _ramdam2.default.compose(_ramdam2.default.includes(_ramdam2.default.__, ["startAt", "startAfter", "endAt", "endBefore"]), _ramdam2.default.head)), function (arg) {
      return acc[arg[0]](arg[1]);
    }], [_ramdam2.default.T, function (arg) {
      return acc.orderBy.apply(acc, (0, _toConsumableArray3.default)(arg));
    }]])]])(arg);
  }, db);

  var _strings = _ramdam2.default.compose(_ramdam2.default.length, _ramdam2.default.takeWhile(_ramdam2.default.isString));

  var _get = function () {
    var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(args) {
      var n, ref, ss;
      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              n = _strings(args);
              ref = _ref(args);
              _context.next = 4;
              return ref.get();

            case 4:
              ss = _context.sent;
              return _context.abrupt("return", { n: n, ref: ref, ss: ss });

            case 6:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, undefined);
    }));

    return function _get(_x) {
      return _ref2.apply(this, arguments);
    };
  }();

  var _write_without_data = function _write_without_data(args) {
    var n = _strings(args);
    var ref = _ref(args);
    return { ref: ref, n: n, query: n !== args.length };
  };

  var _write = function _write(args) {
    var data = args.shift();

    var _write_without_data2 = _write_without_data(args),
        ref = _write_without_data2.ref,
        n = _write_without_data2.n,
        query = _write_without_data2.query;

    return { data: data, ref: ref, n: n, query: query };
  };

  var _one = function _one(ss) {
    return ss.exists ? ss.data() : null;
  };

  var _data = {
    d: function d(_ref3) {
      var ss = _ref3.ss,
          n = _ref3.n;

      if (_ramdam2.default.isOdd(n)) {
        var docs = [];
        ss.forEach(function (doc) {
          docs.push(doc.data());
        });
        return docs;
      } else {
        return _one(ss);
      }
    },
    r: function r(_ref4) {
      var ss = _ref4.ss,
          n = _ref4.n;

      if (_ramdam2.default.isOdd(n)) {
        var docs = [];
        ss.forEach(function (doc) {
          docs.push(doc);
        });
        return docs;
      } else {
        return ss;
      }
    },
    s: function s(_ref5) {
      var ss = _ref5.ss,
          n = _ref5.n;

      if (_ramdam2.default.isOdd(n)) {
        var docs = [];
        ss.forEach(function (doc) {
          docs.push({ id: doc.id, data: doc.data(), ss: doc });
        });
        return docs;
      } else {
        return ss.exists ? { id: ss.id, data: ss.data(), ss: ss } : null;
      }
    },
    k: function k(_ref6) {
      var ss = _ref6.ss,
          n = _ref6.n;

      if (_ramdam2.default.isOdd(n)) {
        var docs = {};
        ss.forEach(function (doc) {
          docs[doc.id] = doc.data();
        });
        return docs;
      } else {
        return _one(ss);
      }
    }
  };

  var _on = function _on(args) {
    var func = args.pop();
    var n = _strings(args);
    var ref = _ref(args);
    return { func: func, n: n, ref: ref };
  };

  var _ops = _ramdam2.default.map(_ramdam2.default.curry, {
    write: function () {
      var _ref7 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(op, opt, args) {
        var _ref8, data, ref, n, query, docs, prs;

        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _ref8 = _ramdam2.default.includes(op)(["drop", "delete"]) ? _write_without_data(args) : _write(args), data = _ref8.data, ref = _ref8.ref, n = _ref8.n, query = _ref8.query;

                if (!(query || op === "drop")) {
                  _context2.next = 15;
                  break;
                }

                _context2.t0 = _data;
                _context2.t1 = n;
                _context2.next = 6;
                return ref.get();

              case 6:
                _context2.t2 = _context2.sent;
                _context2.t3 = {
                  n: _context2.t1,
                  ss: _context2.t2
                };
                docs = _context2.t0.s.call(_context2.t0, _context2.t3);

                if (!_ramdam2.default.isEmpty(docs)) {
                  _context2.next = 11;
                  break;
                }

                return _context2.abrupt("return");

              case 11:
                prs = _ramdam2.default.compose(_ramdam2.default.map(function (_docs) {
                  var batch = db.batch();
                  var _iteratorNormalCompletion = true;
                  var _didIteratorError = false;
                  var _iteratorError = undefined;

                  try {
                    for (var _iterator = (0, _getIterator3.default)(_docs), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                      var _ref10 = _step.value;
                      var _ref9 = _ref10.ss._ref;

                      if (_ramdam2.default.includes(op)(["add", "set", "update"])) {
                        _ramdam2.default.isNotNil(opt) ? batch[op](_ref9, data, opt) : batch[op](_ref9, data);
                      } else if (_ramdam2.default.includes(op)(["drop", "delete"])) {
                        batch.delete(_ref9);
                      }
                    }
                  } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                  } finally {
                    try {
                      if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                      }
                    } finally {
                      if (_didIteratorError) {
                        throw _iteratorError;
                      }
                    }
                  }

                  return batch.commit();
                }), _ramdam2.default.splitEvery(Math.min(docs.length, 500)))(docs);
                return _context2.abrupt("return", _promise2.default.all(prs));

              case 15:
                return _context2.abrupt("return", op === "delete" ? ref[op]() : _ramdam2.default.isNil(opt) ? ref[op](data) : ref[op](data, opt));

              case 16:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, undefined);
      }));

      function write(_x2, _x3, _x4) {
        return _ref7.apply(this, arguments);
      }

      return write;
    }(),
    get: function () {
      var _ref11 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(getter, args) {
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.t0 = _data;
                _context3.t1 = getter;
                _context3.next = 4;
                return _get(args);

              case 4:
                _context3.t2 = _context3.sent;
                return _context3.abrupt("return", _context3.t0[_context3.t1].call(_context3.t0, _context3.t2));

              case 6:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, undefined);
      }));

      function get(_x5, _x6) {
        return _ref11.apply(this, arguments);
      }

      return get;
    }(),
    on: function () {
      var _ref12 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(getter, args) {
        var _on2, func, n, ref;

        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _on2 = _on(args), func = _on2.func, n = _on2.n, ref = _on2.ref;
                return _context4.abrupt("return", ref.onSnapshot(function (ss) {
                  return func(_data[getter]({ n: n, ss: ss }));
                }));

              case 2:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, undefined);
      }));

      function on(_x7, _x8) {
        return _ref12.apply(this, arguments);
      }

      return on;
    }(),
    tx: function () {
      var _ref13 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6(getter, args) {
        var _on3, func, n, ref;

        return _regenerator2.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                _on3 = _on(args), func = _on3.func, n = _on3.n, ref = _on3.ref;
                _context6.next = 3;
                return db.runTransaction(function () {
                  var _ref14 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5(t) {
                    return _regenerator2.default.wrap(function _callee5$(_context5) {
                      while (1) {
                        switch (_context5.prev = _context5.next) {
                          case 0:
                            _context5.t0 = func;
                            _context5.t1 = t;
                            _context5.t2 = _data;
                            _context5.t3 = getter;
                            _context5.t4 = n;
                            _context5.next = 7;
                            return t.get(ref);

                          case 7:
                            _context5.t5 = _context5.sent;
                            _context5.t6 = {
                              n: _context5.t4,
                              ss: _context5.t5
                            };
                            _context5.t7 = _context5.t2[_context5.t3].call(_context5.t2, _context5.t6);
                            _context5.t8 = ref;
                            _context5.t9 = {
                              t: _context5.t1,
                              data: _context5.t7,
                              ref: _context5.t8
                            };
                            return _context5.abrupt("return", (0, _context5.t0)(_context5.t9));

                          case 13:
                          case "end":
                            return _context5.stop();
                        }
                      }
                    }, _callee5, undefined);
                  }));

                  return function (_x11) {
                    return _ref14.apply(this, arguments);
                  };
                }());

              case 3:
                return _context6.abrupt("return", _context6.sent);

              case 4:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, undefined);
      }));

      function tx(_x9, _x10) {
        return _ref13.apply(this, arguments);
      }

      return tx;
    }()
  });

  var APIs = {
    inc: _db.FieldValue.increment,

    del: _db.FieldValue.delete(),

    ts: _db.Timestamp,

    batch: function batch(ops) {
      var batch = db.batch();
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = (0, _getIterator3.default)(ops), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var args = _step2.value;

          var op = args.shift();
          if (_ramdam2.default.includes(op)(["add", "set", "update"])) {
            var _write2 = _write(args),
                data = _write2.data,
                _ref15 = _write2.ref;

            batch[op](_ref15, data);
          } else if (op === "upsert") {
            var _write3 = _write(args),
                _data2 = _write3.data,
                _ref16 = _write3.ref;

            batch.set(_ref16, _data2, { merge: true });
          } else if (op === "delete") {
            var _ref17 = _ref(args);
            batch.delete(_ref17);
          }
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      return batch.commit();
    }
  };

  var getAPIs = _ramdam2.default.compose(_ramdam2.default.fromPairs, _ramdam2.default.map(function (_ref18) {
    var _ref19 = (0, _slicedToArray3.default)(_ref18, 2),
        op = _ref19[0],
        flag = _ref19[1];

    return ["" + op + _ramdam2.default.toUpper(flag), _ramdam2.default.unapply(_ops[op](flag === "" ? "d" : flag))];
  }), _ramdam2.default.xprod)(["get", "on", "tx"], ["", "k", "s", "r"]);

  var writeAPIs = _ramdam2.default.compose(_ramdam2.default.fromPairs, _ramdam2.default.map(function (op) {
    return [op, _ramdam2.default.unapply(_ops.write(op === "upsert" ? "set" : op, op === "upsert" ? { merge: true } : null))];
  }))(["add", "set", "update", "upsert", "delete", "drop"]);

  var ref = _ramdam2.default.unapply(_ref);

  return _ramdam2.default.mergeAll([getAPIs, APIs, writeAPIs, { ref: ref, firestore: db }]);
};

module.exports = exports.default;
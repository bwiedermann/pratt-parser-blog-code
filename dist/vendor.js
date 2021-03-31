__fuse.bundle({

// node_modules/fuse-box/modules/fuse-box-css/index.js @11
11: function(__fusereq, exports, module){
var cssHandler = function (__filename, contents) {
  var styleId = __filename.replace(/[\.\/]+/g, '-');
  if (styleId.charAt(0) === '-') styleId = styleId.substring(1);
  var exists = document.getElementById(styleId);
  if (!exists) {
    var s = document.createElement(contents ? 'style' : 'link');
    s.id = styleId;
    s.type = 'text/css';
    if (contents) {
      s.innerHTML = contents;
    } else {
      s.rel = 'stylesheet';
      s.href = __filename;
    }
    document.getElementsByTagName('head')[0].appendChild(s);
  } else {
    if (contents) exists.innerHTML = contents;
  }
};
module.exports = cssHandler;

},

// node_modules/fuse-box/modules/fuse-box-websocket/index.js @3
3: function(__fusereq, exports, module){
const events = __fusereq(13);
function log(text) {
  console.info(`%c${text}`, 'color: #237abe');
}
class SocketClient {
  constructor(opts) {
    opts = opts || ({});
    const port = opts.port || window.location.port;
    const protocol = location.protocol === 'https:' ? 'wss://' : 'ws://';
    const domain = location.hostname || 'localhost';
    if (opts.connectionURL) {
      this.url = opts.connectionURL;
    } else {
      if (opts.useCurrentURL) {
        this.url = protocol + location.hostname + (location.port ? ':' + location.port : '');
      }
      if (opts.port) {
        this.url = `${protocol}${domain}:${opts.port}`;
      }
    }
    this.authSent = false;
    this.emitter = new events.EventEmitter();
  }
  reconnect(fn) {
    setTimeout(() => {
      this.emitter.emit('reconnect', {
        message: 'Trying to reconnect'
      });
      this.connect(fn);
    }, 5000);
  }
  on(event, fn) {
    this.emitter.on(event, fn);
  }
  connect(fn) {
    setTimeout(() => {
      log(`Connecting to FuseBox HMR at ${this.url}`);
      this.client = new WebSocket(this.url);
      this.bindEvents(fn);
    }, 0);
  }
  close() {
    this.client.close();
  }
  send(eventName, data) {
    if (this.client.readyState === 1) {
      this.client.send(JSON.stringify({
        name: eventName,
        payload: data || ({})
      }));
    }
  }
  error(data) {
    this.emitter.emit('error', data);
  }
  bindEvents(fn) {
    this.client.onopen = event => {
      log('Connection successful');
      if (fn) {
        fn(this);
      }
    };
    this.client.onerror = event => {
      this.error({
        reason: event.reason,
        message: 'Socket error'
      });
    };
    this.client.onclose = event => {
      this.emitter.emit('close', {
        message: 'Socket closed'
      });
      if (event.code !== 1011) {
        this.reconnect(fn);
      }
    };
    this.client.onmessage = event => {
      let data = event.data;
      if (data) {
        let item = JSON.parse(data);
        this.emitter.emit(item.name, item.payload);
      }
    };
  }
}
exports.SocketClient = SocketClient;

},

// node_modules/fuse-box/modules/events/index.js @13
13: function(__fusereq, exports, module){
function EventEmitter() {
  this._events = this._events || ({});
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;
EventEmitter.EventEmitter = EventEmitter;
EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;
EventEmitter.defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function (n) {
  if (!isNumber(n) || n < 0 || isNaN(n)) throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};
EventEmitter.prototype.emit = function (type) {
  var er, handler, len, args, i, listeners;
  if (!this._events) this._events = {};
  if (type === 'error') {
    if (!this._events.error || isObject(this._events.error) && !this._events.error.length) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er;
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }
  handler = this._events[type];
  if (isUndefined(handler)) return false;
  if (isFunction(handler)) {
    switch (arguments.length) {
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++) listeners[i].apply(this, args);
  }
  return true;
};
EventEmitter.prototype.addListener = function (type, listener) {
  var m;
  if (!isFunction(listener)) throw TypeError('listener must be a function');
  if (!this._events) this._events = {};
  if (this._events.newListener) this.emit('newListener', type, isFunction(listener.listener) ? listener.listener : listener);
  if (!this._events[type]) this._events[type] = listener; else if (isObject(this._events[type])) this._events[type].push(listener); else this._events[type] = [this._events[type], listener];
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }
    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' + 'leak detected. %d listeners added. ' + 'Use emitter.setMaxListeners() to increase limit.', this._events[type].length);
      if (typeof console.trace === 'function') {
        console.trace();
      }
    }
  }
  return this;
};
EventEmitter.prototype.on = EventEmitter.prototype.addListener;
EventEmitter.prototype.once = function (type, listener) {
  if (!isFunction(listener)) throw TypeError('listener must be a function');
  var fired = false;
  function g() {
    this.removeListener(type, g);
    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }
  g.listener = listener;
  this.on(type, g);
  return this;
};
EventEmitter.prototype.removeListener = function (type, listener) {
  var list, position, length, i;
  if (!isFunction(listener)) throw TypeError('listener must be a function');
  if (!this._events || !this._events[type]) return this;
  list = this._events[type];
  length = list.length;
  position = -1;
  if (list === listener || isFunction(list.listener) && list.listener === listener) {
    delete this._events[type];
    if (this._events.removeListener) this.emit('removeListener', type, listener);
  } else if (isObject(list)) {
    for (i = length; i-- > 0; ) {
      if (list[i] === listener || list[i].listener && list[i].listener === listener) {
        position = i;
        break;
      }
    }
    if (position < 0) return this;
    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }
    if (this._events.removeListener) this.emit('removeListener', type, listener);
  }
  return this;
};
EventEmitter.prototype.removeAllListeners = function (type) {
  var key, listeners;
  if (!this._events) return this;
  if (!this._events.removeListener) {
    if (arguments.length === 0) this._events = {}; else if (this._events[type]) delete this._events[type];
    return this;
  }
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }
  listeners = this._events[type];
  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    while (listeners.length) this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];
  return this;
};
EventEmitter.prototype.listeners = function (type) {
  var ret;
  if (!this._events || !this._events[type]) ret = []; else if (isFunction(this._events[type])) ret = [this._events[type]]; else ret = this._events[type].slice();
  return ret;
};
EventEmitter.prototype.listenerCount = function (type) {
  if (this._events) {
    var evlistener = this._events[type];
    if (isFunction(evlistener)) return 1; else if (evlistener) return evlistener.length;
  }
  return 0;
};
EventEmitter.listenerCount = function (emitter, type) {
  return emitter.listenerCount(type);
};
function isFunction(arg) {
  return typeof arg === 'function';
}
function isNumber(arg) {
  return typeof arg === 'number';
}
function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
function isUndefined(arg) {
  return arg === void 0;
}

},

// node_modules/fuse-box/modules/fuse-box-hot-reload/clientHotReload.ts @2
2: function(__fusereq, exports, module){
exports.__esModule = true;
const {SocketClient} = __fusereq(3);
function log(text) {
  console.info(`%c${text}`, 'color: #237abe');
}
const STYLESHEET_EXTENSIONS = ['.css', '.scss', '.sass', '.less', '.styl'];
function gatherSummary() {
  const modules = [];
  for (const id in __fuse.modules) {
    modules.push(parseInt(id));
  }
  return {
    modules
  };
}
function createHMRHelper(payload) {
  const {updates} = payload;
  let isStylesheeetUpdate = true;
  for (const item of updates) {
    const file = item.path;
    const s = file.match(/(\.\w+)$/i);
    const extension = s[1];
    if (!STYLESHEET_EXTENSIONS.includes(extension)) {
      isStylesheeetUpdate = false;
    }
  }
  return {
    isStylesheeetUpdate,
    callEntries: () => {
      const appEntries = [1];
      for (const entryId of appEntries) {
        __fuse.r(entryId);
      }
    },
    callModules: modules => {
      for (const item of modules) __fuse.r(item.id);
    },
    flushAll: () => {
      __fuse.c = {};
    },
    flushModules: modules => {
      for (const item of modules) {
        __fuse.c[item.id] = undefined;
      }
    },
    updateModules: () => {
      for (const update of updates) {
        new Function(update.content)();
      }
    }
  };
}
exports.connect = opts => {
  let client = new SocketClient(opts);
  client.connect();
  client.on('get-summary', data => {
    const {id} = data;
    const summary = gatherSummary();
    client.send('summary', {
      id,
      summary
    });
  });
  client.on('reload', () => {
    window.location.reload();
  });
  client.on('hmr', payload => {
    const {updates} = payload;
    const hmr = createHMRHelper(payload);
    const hmrModuleId = undefined;
    if (hmrModuleId) {
      const hmrModule = __fuse.r(hmrModuleId);
      if (!hmrModule.default) throw new Error('An HMR plugin must export a default function');
      hmrModule.default(payload, hmr);
      return;
    }
    hmr.updateModules();
    if (hmr.isStylesheeetUpdate) {
      log(`Flushing ${updates.map(item => item.path)}`);
      hmr.flushModules(updates);
      log(`Calling modules ${updates.map(item => item.path)}`);
      hmr.callModules(updates);
    } else {
      log(`Flushing all`);
      hmr.flushAll();
      log(`Calling entries all`);
      hmr.callEntries();
    }
  });
};

},

// node_modules/lezer-tree/dist/tree.es.js @19
19: function(__fusereq, exports, module){
exports.__esModule = true;
const DefaultBufferLength = 1024;
let nextPropID = 0;
const CachedNode = new WeakMap();
class NodeProp {
  constructor({deserialize} = {}) {
    this.id = nextPropID++;
    this.deserialize = deserialize || (() => {
      throw new Error("This node type doesn't define a deserialize function");
    });
  }
  static string() {
    return new NodeProp({
      deserialize: str => str
    });
  }
  static number() {
    return new NodeProp({
      deserialize: Number
    });
  }
  static flag() {
    return new NodeProp({
      deserialize: () => true
    });
  }
  set(propObj, value) {
    propObj[this.id] = value;
    return propObj;
  }
  add(match) {
    if (typeof match != "function") match = NodeType.match(match);
    return type => {
      let result = match(type);
      return result === undefined ? null : [this, result];
    };
  }
}
NodeProp.closedBy = new NodeProp({
  deserialize: str => str.split(" ")
});
NodeProp.openedBy = new NodeProp({
  deserialize: str => str.split(" ")
});
NodeProp.group = new NodeProp({
  deserialize: str => str.split(" ")
});
const noProps = Object.create(null);
class NodeType {
  constructor(name, props, id, flags = 0) {
    this.name = name;
    this.props = props;
    this.id = id;
    this.flags = flags;
  }
  static define(spec) {
    let props = spec.props && spec.props.length ? Object.create(null) : noProps;
    let flags = (spec.top ? 1 : 0) | (spec.skipped ? 2 : 0) | (spec.error ? 4 : 0) | (spec.name == null ? 8 : 0);
    let type = new NodeType(spec.name || "", props, spec.id, flags);
    if (spec.props) for (let src of spec.props) {
      if (!Array.isArray(src)) src = src(type);
      if (src) src[0].set(props, src[1]);
    }
    return type;
  }
  prop(prop) {
    return this.props[prop.id];
  }
  get isTop() {
    return (this.flags & 1) > 0;
  }
  get isSkipped() {
    return (this.flags & 2) > 0;
  }
  get isError() {
    return (this.flags & 4) > 0;
  }
  get isAnonymous() {
    return (this.flags & 8) > 0;
  }
  is(name) {
    if (typeof name == 'string') {
      if (this.name == name) return true;
      let group = this.prop(NodeProp.group);
      return group ? group.indexOf(name) > -1 : false;
    }
    return this.id == name;
  }
  static match(map) {
    let direct = Object.create(null);
    for (let prop in map) for (let name of prop.split(" ")) direct[name] = map[prop];
    return node => {
      for (let groups = node.prop(NodeProp.group), i = -1; i < (groups ? groups.length : 0); i++) {
        let found = direct[i < 0 ? node.name : groups[i]];
        if (found) return found;
      }
    };
  }
}
NodeType.none = new NodeType("", Object.create(null), 0, 8);
class NodeSet {
  constructor(types) {
    this.types = types;
    for (let i = 0; i < types.length; i++) if (types[i].id != i) throw new RangeError("Node type ids should correspond to array positions when creating a node set");
  }
  extend(...props) {
    let newTypes = [];
    for (let type of this.types) {
      let newProps = null;
      for (let source of props) {
        let add = source(type);
        if (add) {
          if (!newProps) newProps = Object.assign({}, type.props);
          add[0].set(newProps, add[1]);
        }
      }
      newTypes.push(newProps ? new NodeType(type.name, newProps, type.id, type.flags) : type);
    }
    return new NodeSet(newTypes);
  }
}
class Tree {
  constructor(type, children, positions, length) {
    this.type = type;
    this.children = children;
    this.positions = positions;
    this.length = length;
  }
  toString() {
    let children = this.children.map(c => c.toString()).join();
    return !this.type.name ? children : ((/\W/).test(this.type.name) && !this.type.isError ? JSON.stringify(this.type.name) : this.type.name) + (children.length ? "(" + children + ")" : "");
  }
  cursor(pos, side = 0) {
    let scope = pos != null && CachedNode.get(this) || this.topNode;
    let cursor = new TreeCursor(scope);
    if (pos != null) {
      cursor.moveTo(pos, side);
      CachedNode.set(this, cursor._tree);
    }
    return cursor;
  }
  fullCursor() {
    return new TreeCursor(this.topNode, true);
  }
  get topNode() {
    return new TreeNode(this, 0, 0, null);
  }
  resolve(pos, side = 0) {
    return this.cursor(pos, side).node;
  }
  iterate(spec) {
    let {enter, leave, from = 0, to = this.length} = spec;
    for (let c = this.cursor(); ; ) {
      let mustLeave = false;
      if (c.from <= to && c.to >= from && (c.type.isAnonymous || enter(c.type, c.from, c.to) !== false)) {
        if (c.firstChild()) continue;
        if (!c.type.isAnonymous) mustLeave = true;
      }
      for (; ; ) {
        if (mustLeave && leave) leave(c.type, c.from, c.to);
        mustLeave = c.type.isAnonymous;
        if (c.nextSibling()) break;
        if (!c.parent()) return;
        mustLeave = true;
      }
    }
  }
  balance(maxBufferLength = DefaultBufferLength) {
    return this.children.length <= BalanceBranchFactor ? this : balanceRange(this.type, NodeType.none, this.children, this.positions, 0, this.children.length, 0, maxBufferLength, this.length, 0);
  }
  static build(data) {
    return buildTree(data);
  }
}
Tree.empty = new Tree(NodeType.none, [], [], 0);
function withHash(tree, hash) {
  if (hash) tree.contextHash = hash;
  return tree;
}
class TreeBuffer {
  constructor(buffer, length, set, type = NodeType.none) {
    this.buffer = buffer;
    this.length = length;
    this.set = set;
    this.type = type;
  }
  toString() {
    let result = [];
    for (let index = 0; index < this.buffer.length; ) {
      result.push(this.childString(index));
      index = this.buffer[index + 3];
    }
    return result.join(",");
  }
  childString(index) {
    let id = this.buffer[index], endIndex = this.buffer[index + 3];
    let type = this.set.types[id], result = type.name;
    if ((/\W/).test(result) && !type.isError) result = JSON.stringify(result);
    index += 4;
    if (endIndex == index) return result;
    let children = [];
    while (index < endIndex) {
      children.push(this.childString(index));
      index = this.buffer[index + 3];
    }
    return result + "(" + children.join(",") + ")";
  }
  findChild(startIndex, endIndex, dir, after) {
    let {buffer} = this, pick = -1;
    for (let i = startIndex; i != endIndex; i = buffer[i + 3]) {
      if (after != -100000000) {
        let start = buffer[i + 1], end = buffer[i + 2];
        if (dir > 0) {
          if (end > after) pick = i;
          if (end > after) break;
        } else {
          if (start < after) pick = i;
          if (end >= after) break;
        }
      } else {
        pick = i;
        if (dir > 0) break;
      }
    }
    return pick;
  }
}
class TreeNode {
  constructor(node, from, index, _parent) {
    this.node = node;
    this.from = from;
    this.index = index;
    this._parent = _parent;
  }
  get type() {
    return this.node.type;
  }
  get name() {
    return this.node.type.name;
  }
  get to() {
    return this.from + this.node.length;
  }
  nextChild(i, dir, after, full = false) {
    for (let parent = this; ; ) {
      for (let {children, positions} = parent.node, e = dir > 0 ? children.length : -1; i != e; i += dir) {
        let next = children[i], start = positions[i] + parent.from;
        if (after != -100000000 && (dir < 0 ? start >= after : start + next.length <= after)) continue;
        if (next instanceof TreeBuffer) {
          let index = next.findChild(0, next.buffer.length, dir, after == -100000000 ? -100000000 : after - start);
          if (index > -1) return new BufferNode(new BufferContext(parent, next, i, start), null, index);
        } else if (full || (!next.type.isAnonymous || hasChild(next))) {
          let inner = new TreeNode(next, start, i, parent);
          return full || !inner.type.isAnonymous ? inner : inner.nextChild(dir < 0 ? next.children.length - 1 : 0, dir, after);
        }
      }
      if (full || !parent.type.isAnonymous) return null;
      i = parent.index + dir;
      parent = parent._parent;
      if (!parent) return null;
    }
  }
  get firstChild() {
    return this.nextChild(0, 1, -100000000);
  }
  get lastChild() {
    return this.nextChild(this.node.children.length - 1, -1, -100000000);
  }
  childAfter(pos) {
    return this.nextChild(0, 1, pos);
  }
  childBefore(pos) {
    return this.nextChild(this.node.children.length - 1, -1, pos);
  }
  nextSignificantParent() {
    let val = this;
    while (val.type.isAnonymous && val._parent) val = val._parent;
    return val;
  }
  get parent() {
    return this._parent ? this._parent.nextSignificantParent() : null;
  }
  get nextSibling() {
    return this._parent ? this._parent.nextChild(this.index + 1, 1, -1) : null;
  }
  get prevSibling() {
    return this._parent ? this._parent.nextChild(this.index - 1, -1, -1) : null;
  }
  get cursor() {
    return new TreeCursor(this);
  }
  resolve(pos, side = 0) {
    return this.cursor.moveTo(pos, side).node;
  }
  getChild(type, before = null, after = null) {
    let r = getChildren(this, type, before, after);
    return r.length ? r[0] : null;
  }
  getChildren(type, before = null, after = null) {
    return getChildren(this, type, before, after);
  }
  toString() {
    return this.node.toString();
  }
}
function getChildren(node, type, before, after) {
  let cur = node.cursor, result = [];
  if (!cur.firstChild()) return result;
  if (before != null) while (!cur.type.is(before)) if (!cur.nextSibling()) return result;
  for (; ; ) {
    if (after != null && cur.type.is(after)) return result;
    if (cur.type.is(type)) result.push(cur.node);
    if (!cur.nextSibling()) return after == null ? result : [];
  }
}
class BufferContext {
  constructor(parent, buffer, index, start) {
    this.parent = parent;
    this.buffer = buffer;
    this.index = index;
    this.start = start;
  }
}
class BufferNode {
  constructor(context, _parent, index) {
    this.context = context;
    this._parent = _parent;
    this.index = index;
    this.type = context.buffer.set.types[context.buffer.buffer[index]];
  }
  get name() {
    return this.type.name;
  }
  get from() {
    return this.context.start + this.context.buffer.buffer[this.index + 1];
  }
  get to() {
    return this.context.start + this.context.buffer.buffer[this.index + 2];
  }
  child(dir, after) {
    let {buffer} = this.context;
    let index = buffer.findChild(this.index + 4, buffer.buffer[this.index + 3], dir, after == -100000000 ? -100000000 : after - this.context.start);
    return index < 0 ? null : new BufferNode(this.context, this, index);
  }
  get firstChild() {
    return this.child(1, -100000000);
  }
  get lastChild() {
    return this.child(-1, -100000000);
  }
  childAfter(pos) {
    return this.child(1, pos);
  }
  childBefore(pos) {
    return this.child(-1, pos);
  }
  get parent() {
    return this._parent || this.context.parent.nextSignificantParent();
  }
  externalSibling(dir) {
    return this._parent ? null : this.context.parent.nextChild(this.context.index + dir, dir, -1);
  }
  get nextSibling() {
    let {buffer} = this.context;
    let after = buffer.buffer[this.index + 3];
    if (after < (this._parent ? buffer.buffer[this._parent.index + 3] : buffer.buffer.length)) return new BufferNode(this.context, this._parent, after);
    return this.externalSibling(1);
  }
  get prevSibling() {
    let {buffer} = this.context;
    let parentStart = this._parent ? this._parent.index + 4 : 0;
    if (this.index == parentStart) return this.externalSibling(-1);
    return new BufferNode(this.context, this._parent, buffer.findChild(parentStart, this.index, -1, -100000000));
  }
  get cursor() {
    return new TreeCursor(this);
  }
  resolve(pos, side = 0) {
    return this.cursor.moveTo(pos, side).node;
  }
  toString() {
    return this.context.buffer.childString(this.index);
  }
  getChild(type, before = null, after = null) {
    let r = getChildren(this, type, before, after);
    return r.length ? r[0] : null;
  }
  getChildren(type, before = null, after = null) {
    return getChildren(this, type, before, after);
  }
}
class TreeCursor {
  constructor(node, full = false) {
    this.full = full;
    this.buffer = null;
    this.stack = [];
    this.index = 0;
    this.bufferNode = null;
    if (node instanceof TreeNode) {
      this.yieldNode(node);
    } else {
      this._tree = node.context.parent;
      this.buffer = node.context;
      for (let n = node._parent; n; n = n._parent) this.stack.unshift(n.index);
      this.bufferNode = node;
      this.yieldBuf(node.index);
    }
  }
  get name() {
    return this.type.name;
  }
  yieldNode(node) {
    if (!node) return false;
    this._tree = node;
    this.type = node.type;
    this.from = node.from;
    this.to = node.to;
    return true;
  }
  yieldBuf(index, type) {
    this.index = index;
    let {start, buffer} = this.buffer;
    this.type = type || buffer.set.types[buffer.buffer[index]];
    this.from = start + buffer.buffer[index + 1];
    this.to = start + buffer.buffer[index + 2];
    return true;
  }
  yield(node) {
    if (!node) return false;
    if (node instanceof TreeNode) {
      this.buffer = null;
      return this.yieldNode(node);
    }
    this.buffer = node.context;
    return this.yieldBuf(node.index, node.type);
  }
  toString() {
    return this.buffer ? this.buffer.buffer.childString(this.index) : this._tree.toString();
  }
  enter(dir, after) {
    if (!this.buffer) return this.yield(this._tree.nextChild(dir < 0 ? this._tree.node.children.length - 1 : 0, dir, after, this.full));
    let {buffer} = this.buffer;
    let index = buffer.findChild(this.index + 4, buffer.buffer[this.index + 3], dir, after == -100000000 ? -100000000 : after - this.buffer.start);
    if (index < 0) return false;
    this.stack.push(this.index);
    return this.yieldBuf(index);
  }
  firstChild() {
    return this.enter(1, -100000000);
  }
  lastChild() {
    return this.enter(-1, -100000000);
  }
  childAfter(pos) {
    return this.enter(1, pos);
  }
  childBefore(pos) {
    return this.enter(-1, pos);
  }
  parent() {
    if (!this.buffer) return this.yieldNode(this.full ? this._tree._parent : this._tree.parent);
    if (this.stack.length) return this.yieldBuf(this.stack.pop());
    let parent = this.full ? this.buffer.parent : this.buffer.parent.nextSignificantParent();
    this.buffer = null;
    return this.yieldNode(parent);
  }
  sibling(dir) {
    if (!this.buffer) return !this._tree._parent ? false : this.yield(this._tree._parent.nextChild(this._tree.index + dir, dir, -100000000, this.full));
    let {buffer} = this.buffer, d = this.stack.length - 1;
    if (dir < 0) {
      let parentStart = d < 0 ? 0 : this.stack[d] + 4;
      if (this.index != parentStart) return this.yieldBuf(buffer.findChild(parentStart, this.index, -1, -100000000));
    } else {
      let after = buffer.buffer[this.index + 3];
      if (after < (d < 0 ? buffer.buffer.length : buffer.buffer[this.stack[d] + 3])) return this.yieldBuf(after);
    }
    return d < 0 ? this.yield(this.buffer.parent.nextChild(this.buffer.index + dir, dir, -100000000, this.full)) : false;
  }
  nextSibling() {
    return this.sibling(1);
  }
  prevSibling() {
    return this.sibling(-1);
  }
  atLastNode(dir) {
    let index, parent, {buffer} = this;
    if (buffer) {
      if (dir > 0) {
        if (this.index < buffer.buffer.buffer.length) return false;
      } else {
        for (let i = 0; i < this.index; i++) if (buffer.buffer.buffer[i + 3] < this.index) return false;
      }
      ({index, parent} = buffer);
    } else {
      ({index, _parent: parent} = this._tree);
    }
    for (; parent; {index, _parent: parent} = parent) {
      for (let i = index + dir, e = dir < 0 ? -1 : parent.node.children.length; i != e; i += dir) {
        let child = parent.node.children[i];
        if (this.full || !child.type.isAnonymous || child instanceof TreeBuffer || hasChild(child)) return false;
      }
    }
    return true;
  }
  move(dir) {
    if (this.enter(dir, -100000000)) return true;
    for (; ; ) {
      if (this.sibling(dir)) return true;
      if (this.atLastNode(dir) || !this.parent()) return false;
    }
  }
  next() {
    return this.move(1);
  }
  prev() {
    return this.move(-1);
  }
  moveTo(pos, side = 0) {
    while (this.from == this.to || (side < 1 ? this.from >= pos : this.from > pos) || (side > -1 ? this.to <= pos : this.to < pos)) if (!this.parent()) break;
    for (; ; ) {
      if (side < 0 ? !this.childBefore(pos) : !this.childAfter(pos)) break;
      if (this.from == this.to || (side < 1 ? this.from >= pos : this.from > pos) || (side > -1 ? this.to <= pos : this.to < pos)) {
        this.parent();
        break;
      }
    }
    return this;
  }
  get node() {
    if (!this.buffer) return this._tree;
    let cache = this.bufferNode, result = null, depth = 0;
    if (cache && cache.context == this.buffer) {
      scan: for (let index = this.index, d = this.stack.length; d >= 0; ) {
        for (let c = cache; c; c = c._parent) if (c.index == index) {
          if (index == this.index) return c;
          result = c;
          depth = d + 1;
          break scan;
        }
        index = this.stack[--d];
      }
    }
    for (let i = depth; i < this.stack.length; i++) result = new BufferNode(this.buffer, result, this.stack[i]);
    return this.bufferNode = new BufferNode(this.buffer, result, this.index);
  }
  get tree() {
    return this.buffer ? null : this._tree.node;
  }
}
function hasChild(tree) {
  return tree.children.some(ch => !ch.type.isAnonymous || ch instanceof TreeBuffer || hasChild(ch));
}
class FlatBufferCursor {
  constructor(buffer, index) {
    this.buffer = buffer;
    this.index = index;
  }
  get id() {
    return this.buffer[this.index - 4];
  }
  get start() {
    return this.buffer[this.index - 3];
  }
  get end() {
    return this.buffer[this.index - 2];
  }
  get size() {
    return this.buffer[this.index - 1];
  }
  get pos() {
    return this.index;
  }
  next() {
    this.index -= 4;
  }
  fork() {
    return new FlatBufferCursor(this.buffer, this.index);
  }
}
const BalanceBranchFactor = 8;
function buildTree(data) {
  var _a;
  let {buffer, nodeSet, topID = 0, maxBufferLength = DefaultBufferLength, reused = [], minRepeatType = nodeSet.types.length} = data;
  let cursor = Array.isArray(buffer) ? new FlatBufferCursor(buffer, buffer.length) : buffer;
  let types = nodeSet.types;
  let contextHash = 0;
  function takeNode(parentStart, minPos, children, positions, inRepeat) {
    let {id, start, end, size} = cursor;
    let startPos = start - parentStart;
    if (size < 0) {
      if (size == -1) {
        children.push(reused[id]);
        positions.push(startPos);
      } else {
        contextHash = id;
      }
      cursor.next();
      return;
    }
    let type = types[id], node, buffer;
    if (end - start <= maxBufferLength && (buffer = findBufferSize(cursor.pos - minPos, inRepeat))) {
      let data = new Uint16Array(buffer.size - buffer.skip);
      let endPos = cursor.pos - buffer.size, index = data.length;
      while (cursor.pos > endPos) index = copyToBuffer(buffer.start, data, index, inRepeat);
      node = new TreeBuffer(data, end - buffer.start, nodeSet, inRepeat < 0 ? NodeType.none : types[inRepeat]);
      startPos = buffer.start - parentStart;
    } else {
      let endPos = cursor.pos - size;
      cursor.next();
      let localChildren = [], localPositions = [];
      let localInRepeat = id >= minRepeatType ? id : -1;
      while (cursor.pos > endPos) {
        if (cursor.id == localInRepeat) cursor.next(); else takeNode(start, endPos, localChildren, localPositions, localInRepeat);
      }
      localChildren.reverse();
      localPositions.reverse();
      if (localInRepeat > -1 && localChildren.length > BalanceBranchFactor) node = balanceRange(type, type, localChildren, localPositions, 0, localChildren.length, 0, maxBufferLength, end - start, contextHash); else node = withHash(new Tree(type, localChildren, localPositions, end - start), contextHash);
    }
    children.push(node);
    positions.push(startPos);
  }
  function findBufferSize(maxSize, inRepeat) {
    let fork = cursor.fork();
    let size = 0, start = 0, skip = 0, minStart = fork.end - maxBufferLength;
    let result = {
      size: 0,
      start: 0,
      skip: 0
    };
    scan: for (let minPos = fork.pos - maxSize; fork.pos > minPos; ) {
      if (fork.id == inRepeat) {
        result.size = size;
        result.start = start;
        result.skip = skip;
        skip += 4;
        size += 4;
        fork.next();
        continue;
      }
      let nodeSize = fork.size, startPos = fork.pos - nodeSize;
      if (nodeSize < 0 || startPos < minPos || fork.start < minStart) break;
      let localSkipped = fork.id >= minRepeatType ? 4 : 0;
      let nodeStart = fork.start;
      fork.next();
      while (fork.pos > startPos) {
        if (fork.size < 0) break scan;
        if (fork.id >= minRepeatType) localSkipped += 4;
        fork.next();
      }
      start = nodeStart;
      size += nodeSize;
      skip += localSkipped;
    }
    if (inRepeat < 0 || size == maxSize) {
      result.size = size;
      result.start = start;
      result.skip = skip;
    }
    return result.size > 4 ? result : undefined;
  }
  function copyToBuffer(bufferStart, buffer, index, inRepeat) {
    let {id, start, end, size} = cursor;
    cursor.next();
    if (id == inRepeat) return index;
    let startIndex = index;
    if (size > 4) {
      let endPos = cursor.pos - (size - 4);
      while (cursor.pos > endPos) index = copyToBuffer(bufferStart, buffer, index, inRepeat);
    }
    if (id < minRepeatType) {
      buffer[--index] = startIndex;
      buffer[--index] = end - bufferStart;
      buffer[--index] = start - bufferStart;
      buffer[--index] = id;
    }
    return index;
  }
  let children = [], positions = [];
  while (cursor.pos > 0) takeNode(data.start || 0, 0, children, positions, -1);
  let length = (_a = data.length) !== null && _a !== void 0 ? _a : children.length ? positions[0] + children[0].length : 0;
  return new Tree(types[topID], children.reverse(), positions.reverse(), length);
}
function balanceRange(outerType, innerType, children, positions, from, to, start, maxBufferLength, length, contextHash) {
  let localChildren = [], localPositions = [];
  if (length <= maxBufferLength) {
    for (let i = from; i < to; i++) {
      localChildren.push(children[i]);
      localPositions.push(positions[i] - start);
    }
  } else {
    let maxChild = Math.max(maxBufferLength, Math.ceil(length * 1.5 / BalanceBranchFactor));
    for (let i = from; i < to; ) {
      let groupFrom = i, groupStart = positions[i];
      i++;
      for (; i < to; i++) {
        let nextEnd = positions[i] + children[i].length;
        if (nextEnd - groupStart > maxChild) break;
      }
      if (i == groupFrom + 1) {
        let only = children[groupFrom];
        if (only instanceof Tree && only.type == innerType && only.length > maxChild << 1) {
          for (let j = 0; j < only.children.length; j++) {
            localChildren.push(only.children[j]);
            localPositions.push(only.positions[j] + groupStart - start);
          }
          continue;
        }
        localChildren.push(only);
      } else if (i == groupFrom + 1) {
        localChildren.push(children[groupFrom]);
      } else {
        let inner = balanceRange(innerType, innerType, children, positions, groupFrom, i, groupStart, maxBufferLength, positions[i - 1] + children[i - 1].length - groupStart, contextHash);
        if (innerType != NodeType.none && !containsType(inner.children, innerType)) inner = withHash(new Tree(NodeType.none, inner.children, inner.positions, inner.length), contextHash);
        localChildren.push(inner);
      }
      localPositions.push(groupStart - start);
    }
  }
  return withHash(new Tree(outerType, localChildren, localPositions, length), contextHash);
}
function containsType(nodes, type) {
  for (let elt of nodes) if (elt.type == type) return true;
  return false;
}
class TreeFragment {
  constructor(from, to, tree, offset, open) {
    this.from = from;
    this.to = to;
    this.tree = tree;
    this.offset = offset;
    this.open = open;
  }
  get openStart() {
    return (this.open & 1) > 0;
  }
  get openEnd() {
    return (this.open & 2) > 0;
  }
  static applyChanges(fragments, changes, minGap = 128) {
    if (!changes.length) return fragments;
    let result = [];
    let fI = 1, nextF = fragments.length ? fragments[0] : null;
    let cI = 0, pos = 0, off = 0;
    for (; ; ) {
      let nextC = cI < changes.length ? changes[cI++] : null;
      let nextPos = nextC ? nextC.fromA : 1e9;
      if (nextPos - pos >= minGap) while (nextF && nextF.from < nextPos) {
        let cut = nextF;
        if (pos >= cut.from || nextPos <= cut.to || off) {
          let fFrom = Math.max(cut.from, pos) - off, fTo = Math.min(cut.to, nextPos) - off;
          cut = fFrom >= fTo ? null : new TreeFragment(fFrom, fTo, cut.tree, cut.offset + off, (cI > 0 ? 1 : 0) | (nextC ? 2 : 0));
        }
        if (cut) result.push(cut);
        if (nextF.to > nextPos) break;
        nextF = fI < fragments.length ? fragments[fI++] : null;
      }
      if (!nextC) break;
      pos = nextC.toA;
      off = nextC.toA - nextC.toB;
    }
    return result;
  }
  static addTree(tree, fragments = [], partial = false) {
    let result = [new TreeFragment(0, tree.length, tree, 0, partial ? 2 : 0)];
    for (let f of fragments) if (f.to > tree.length) result.push(f);
    return result;
  }
}
function stringInput(input) {
  return new StringInput(input);
}
class StringInput {
  constructor(string, length = string.length) {
    this.string = string;
    this.length = length;
  }
  get(pos) {
    return pos < 0 || pos >= this.length ? -1 : this.string.charCodeAt(pos);
  }
  lineAfter(pos) {
    if (pos < 0) return "";
    let end = this.string.indexOf("\n", pos);
    return this.string.slice(pos, end < 0 ? this.length : Math.min(end, this.length));
  }
  read(from, to) {
    return this.string.slice(from, Math.min(this.length, to));
  }
  clip(at) {
    return new StringInput(this.string, at);
  }
}
exports.DefaultBufferLength = DefaultBufferLength;
exports.NodeProp = NodeProp;
exports.NodeSet = NodeSet;
exports.NodeType = NodeType;
exports.Tree = Tree;
exports.TreeBuffer = TreeBuffer;
exports.TreeCursor = TreeCursor;
exports.TreeFragment = TreeFragment;
exports.stringInput = stringInput;

},

// node_modules/@codemirror/highlight/dist/index.js @20
20: function(__fusereq, exports, module){
exports.__esModule = true;
var lezer_tree_1 = __fusereq(19);
var style_mod_1 = __fusereq(40);
var view_1 = __fusereq(14);
var state_1 = __fusereq(15);
var language_1 = __fusereq(21);
var rangeset_1 = __fusereq(39);
let nextTagID = 0;
class Tag {
  constructor(set, base, modified) {
    this.set = set;
    this.base = base;
    this.modified = modified;
    this.id = nextTagID++;
  }
  static define(parent) {
    if (parent === null || parent === void 0 ? void 0 : parent.base) throw new Error("Can not derive from a modified tag");
    let tag = new Tag([], null, []);
    tag.set.push(tag);
    if (parent) for (let t of parent.set) tag.set.push(t);
    return tag;
  }
  static defineModifier() {
    let mod = new Modifier();
    return tag => {
      if (tag.modified.indexOf(mod) > -1) return tag;
      return Modifier.get(tag.base || tag, tag.modified.concat(mod).sort((a, b) => a.id - b.id));
    };
  }
}
let nextModifierID = 0;
class Modifier {
  constructor() {
    this.instances = [];
    this.id = nextModifierID++;
  }
  static get(base, mods) {
    if (!mods.length) return base;
    let exists = mods[0].instances.find(t => t.base == base && sameArray(mods, t.modified));
    if (exists) return exists;
    let set = [], tag = new Tag(set, base, mods);
    for (let m of mods) m.instances.push(tag);
    let configs = permute(mods);
    for (let parent of base.set) for (let config of configs) set.push(Modifier.get(parent, config));
    return tag;
  }
}
function sameArray(a, b) {
  return a.length == b.length && a.every((x, i) => x == b[i]);
}
function permute(array) {
  let result = [array];
  for (let i = 0; i < array.length; i++) {
    for (let a of permute(array.slice(0, i).concat(array.slice(i + 1)))) result.push(a);
  }
  return result;
}
function styleTags(spec) {
  let byName = Object.create(null);
  for (let prop in spec) {
    let tags = spec[prop];
    if (!Array.isArray(tags)) tags = [tags];
    for (let part of prop.split(" ")) if (part) {
      let pieces = [], mode = 2, rest = part;
      for (let pos = 0; ; ) {
        if (rest == "..." && pos > 0 && pos + 3 == part.length) {
          mode = 1;
          break;
        }
        let m = (/^"(?:[^"\\]|\\.)*?"|[^\/!]+/).exec(rest);
        if (!m) throw new RangeError("Invalid path: " + part);
        pieces.push(m[0] == "*" ? null : m[0][0] == '"' ? JSON.parse(m[0]) : m[0]);
        pos += m[0].length;
        if (pos == part.length) break;
        let next = part[pos++];
        if (pos == part.length && next == "!") {
          mode = 0;
          break;
        }
        if (next != "/") throw new RangeError("Invalid path: " + part);
        rest = part.slice(pos);
      }
      let last = pieces.length - 1, inner = pieces[last];
      if (!inner) throw new RangeError("Invalid path: " + part);
      let rule = new Rule(tags, mode, last > 0 ? pieces.slice(0, last) : null);
      byName[inner] = rule.sort(byName[inner]);
    }
  }
  return ruleNodeProp.add(byName);
}
const ruleNodeProp = new lezer_tree_1.NodeProp();
const highlightStyle = state_1.Facet.define({
  combine(stylings) {
    return stylings.length ? HighlightStyle.combinedMatch(stylings) : null;
  }
});
const fallbackHighlightStyle = state_1.Facet.define({
  combine(values) {
    return values.length ? values[0].match : null;
  }
});
function noHighlight() {
  return null;
}
function getHighlightStyle(state) {
  return state.facet(highlightStyle) || state.facet(fallbackHighlightStyle) || noHighlight;
}
class Rule {
  constructor(tags, mode, context, next) {
    this.tags = tags;
    this.mode = mode;
    this.context = context;
    this.next = next;
  }
  sort(other) {
    if (!other || other.depth < this.depth) {
      this.next = other;
      return this;
    }
    other.next = this.sort(other.next);
    return other;
  }
  get depth() {
    return this.context ? this.context.length : 0;
  }
}
class HighlightStyle {
  constructor(spec, options) {
    this.map = Object.create(null);
    let modSpec;
    function def(spec) {
      let cls = style_mod_1.StyleModule.newName();
      (modSpec || (modSpec = Object.create(null)))["." + cls] = spec;
      return cls;
    }
    this.all = typeof options.all == "string" ? options.all : options.all ? def(options.all) : null;
    for (let style of spec) {
      let cls = (style.class || def(Object.assign({}, style, {
        tag: null
      }))) + (this.all ? " " + this.all : "");
      let tags = style.tag;
      if (!Array.isArray(tags)) this.map[tags.id] = cls; else for (let tag of tags) this.map[tag.id] = cls;
    }
    this.module = modSpec ? new style_mod_1.StyleModule(modSpec) : null;
    this.scope = options.scope || null;
    this.match = this.match.bind(this);
    let ext = [treeHighlighter];
    if (this.module) ext.push(view_1.EditorView.styleModule.of(this.module));
    this.extension = ext.concat(highlightStyle.of(this));
    this.fallback = ext.concat(fallbackHighlightStyle.of(this));
  }
  match(tag, scope) {
    if (this.scope && scope != this.scope) return null;
    for (let t of tag.set) {
      let match = this.map[t.id];
      if (match !== undefined) {
        if (t != tag) this.map[tag.id] = match;
        return match;
      }
    }
    return this.map[tag.id] = this.all;
  }
  static combinedMatch(styles) {
    if (styles.length == 1) return styles[0].match;
    let cache = styles.some(s => s.scope) ? undefined : Object.create(null);
    return (tag, scope) => {
      let cached = cache && cache[tag.id];
      if (cached !== undefined) return cached;
      let result = null;
      for (let style of styles) {
        let value = style.match(tag, scope);
        if (value) result = result ? result + " " + value : value;
      }
      if (cache) cache[tag.id] = result;
      return result;
    };
  }
  static define(specs, options) {
    return new HighlightStyle(specs, options || ({}));
  }
  static get(state, tag, scope) {
    return getHighlightStyle(state)(tag, scope || lezer_tree_1.NodeType.none);
  }
}
function highlightTree(tree, getStyle, putStyle) {
  highlightTreeRange(tree, 0, tree.length, getStyle, putStyle);
}
class TreeHighlighter {
  constructor(view) {
    this.markCache = Object.create(null);
    this.tree = language_1.syntaxTree(view.state);
    this.decorations = this.buildDeco(view, getHighlightStyle(view.state));
  }
  update(update) {
    let tree = language_1.syntaxTree(update.state), style = getHighlightStyle(update.state);
    let styleChange = style != update.startState.facet(highlightStyle);
    if (tree.length < update.view.viewport.to && !styleChange) {
      this.decorations = this.decorations.map(update.changes);
    } else if (tree != this.tree || update.viewportChanged || styleChange) {
      this.tree = tree;
      this.decorations = this.buildDeco(update.view, style);
    }
  }
  buildDeco(view, match) {
    if (match == noHighlight || !this.tree.length) return view_1.Decoration.none;
    let builder = new rangeset_1.RangeSetBuilder();
    for (let {from, to} of view.visibleRanges) {
      highlightTreeRange(this.tree, from, to, match, (from, to, style) => {
        builder.add(from, to, this.markCache[style] || (this.markCache[style] = view_1.Decoration.mark({
          class: style
        })));
      });
    }
    return builder.finish();
  }
}
const treeHighlighter = state_1.Prec.fallback(view_1.ViewPlugin.fromClass(TreeHighlighter, {
  decorations: v => v.decorations
}));
const nodeStack = [""];
function highlightTreeRange(tree, from, to, style, span) {
  let spanStart = from, spanClass = "";
  let cursor = tree.topNode.cursor;
  function node(inheritedClass, depth, scope) {
    let {type, from: start, to: end} = cursor;
    if (start >= to || end <= from) return;
    nodeStack[depth] = type.name;
    if (type.isTop) scope = type;
    let cls = inheritedClass;
    let rule = type.prop(ruleNodeProp), opaque = false;
    while (rule) {
      if (!rule.context || matchContext(rule.context, nodeStack, depth)) {
        for (let tag of rule.tags) {
          let st = style(tag, scope);
          if (st) {
            if (cls) cls += " ";
            cls += st;
            if (rule.mode == 1) inheritedClass += (inheritedClass ? " " : "") + st; else if (rule.mode == 0) opaque = true;
          }
        }
        break;
      }
      rule = rule.next;
    }
    if (cls != spanClass) {
      if (start > spanStart && spanClass) span(spanStart, cursor.from, spanClass);
      spanStart = start;
      spanClass = cls;
    }
    if (!opaque && cursor.firstChild()) {
      do {
        let end = cursor.to;
        node(inheritedClass, depth + 1, scope);
        if (spanClass != cls) {
          let pos = Math.min(to, end);
          if (pos > spanStart && spanClass) span(spanStart, pos, spanClass);
          spanStart = pos;
          spanClass = cls;
        }
      } while (cursor.nextSibling());
      cursor.parent();
    }
  }
  node("", 0, tree.type);
}
function matchContext(context, stack, depth) {
  if (context.length > depth - 1) return false;
  for (let d = depth - 1, i = context.length - 1; i >= 0; (i--, d--)) {
    let check = context[i];
    if (check && check != stack[d]) return false;
  }
  return true;
}
const t = Tag.define;
const comment = t(), name = t(), typeName = t(name), literal = t(), string = t(literal), number = t(literal), content = t(), heading = t(content), keyword = t(), operator = t(), punctuation = t(), bracket = t(punctuation), meta = t();
const tags = {
  comment,
  lineComment: t(comment),
  blockComment: t(comment),
  docComment: t(comment),
  name,
  variableName: t(name),
  typeName: typeName,
  tagName: t(typeName),
  propertyName: t(name),
  className: t(name),
  labelName: t(name),
  namespace: t(name),
  macroName: t(name),
  literal,
  string,
  docString: t(string),
  character: t(string),
  number,
  integer: t(number),
  float: t(number),
  bool: t(literal),
  regexp: t(literal),
  escape: t(literal),
  color: t(literal),
  url: t(literal),
  keyword,
  self: t(keyword),
  null: t(keyword),
  atom: t(keyword),
  unit: t(keyword),
  modifier: t(keyword),
  operatorKeyword: t(keyword),
  controlKeyword: t(keyword),
  definitionKeyword: t(keyword),
  operator,
  derefOperator: t(operator),
  arithmeticOperator: t(operator),
  logicOperator: t(operator),
  bitwiseOperator: t(operator),
  compareOperator: t(operator),
  updateOperator: t(operator),
  definitionOperator: t(operator),
  typeOperator: t(operator),
  controlOperator: t(operator),
  punctuation,
  separator: t(punctuation),
  bracket,
  angleBracket: t(bracket),
  squareBracket: t(bracket),
  paren: t(bracket),
  brace: t(bracket),
  content,
  heading,
  heading1: t(heading),
  heading2: t(heading),
  heading3: t(heading),
  heading4: t(heading),
  heading5: t(heading),
  heading6: t(heading),
  contentSeparator: t(content),
  list: t(content),
  quote: t(content),
  emphasis: t(content),
  strong: t(content),
  link: t(content),
  monospace: t(content),
  inserted: t(),
  deleted: t(),
  changed: t(),
  invalid: t(),
  meta,
  documentMeta: t(meta),
  annotation: t(meta),
  processingInstruction: t(meta),
  definition: Tag.defineModifier(),
  constant: Tag.defineModifier(),
  function: Tag.defineModifier(),
  standard: Tag.defineModifier(),
  local: Tag.defineModifier(),
  special: Tag.defineModifier()
};
const defaultHighlightStyle = HighlightStyle.define([{
  tag: tags.link,
  textDecoration: "underline"
}, {
  tag: tags.heading,
  textDecoration: "underline",
  fontWeight: "bold"
}, {
  tag: tags.emphasis,
  fontStyle: "italic"
}, {
  tag: tags.strong,
  fontWeight: "bold"
}, {
  tag: tags.keyword,
  color: "#708"
}, {
  tag: [tags.atom, tags.bool, tags.url, tags.contentSeparator, tags.labelName],
  color: "#219"
}, {
  tag: [tags.literal, tags.inserted],
  color: "#164"
}, {
  tag: [tags.string, tags.deleted],
  color: "#a11"
}, {
  tag: [tags.regexp, tags.escape, tags.special(tags.string)],
  color: "#e40"
}, {
  tag: tags.definition(tags.variableName),
  color: "#00f"
}, {
  tag: tags.local(tags.variableName),
  color: "#30a"
}, {
  tag: [tags.typeName, tags.namespace],
  color: "#085"
}, {
  tag: tags.className,
  color: "#167"
}, {
  tag: [tags.special(tags.variableName), tags.macroName],
  color: "#256"
}, {
  tag: tags.definition(tags.propertyName),
  color: "#00c"
}, {
  tag: tags.comment,
  color: "#940"
}, {
  tag: tags.meta,
  color: "#7a757a"
}, {
  tag: tags.invalid,
  color: "#f00"
}]);
const classHighlightStyle = HighlightStyle.define([{
  tag: tags.link,
  class: "cmt-link"
}, {
  tag: tags.heading,
  class: "cmt-heading"
}, {
  tag: tags.emphasis,
  class: "cmt-emphasis"
}, {
  tag: tags.strong,
  class: "cmt-strong"
}, {
  tag: tags.keyword,
  class: "cmt-keyword"
}, {
  tag: tags.atom,
  class: "cmt-atom"
}, {
  tag: tags.bool,
  class: "cmt-bool"
}, {
  tag: tags.url,
  class: "cmt-url"
}, {
  tag: tags.labelName,
  class: "cmt-labelName"
}, {
  tag: tags.inserted,
  class: "cmt-inserted"
}, {
  tag: tags.deleted,
  class: "cmt-deleted"
}, {
  tag: tags.literal,
  class: "cmt-literal"
}, {
  tag: tags.string,
  class: "cmt-string"
}, {
  tag: tags.number,
  class: "cmt-number"
}, {
  tag: [tags.regexp, tags.escape, tags.special(tags.string)],
  class: "cmt-string2"
}, {
  tag: tags.variableName,
  class: "cmt-variableName"
}, {
  tag: tags.local(tags.variableName),
  class: "cmt-variableName cmt-local"
}, {
  tag: tags.definition(tags.variableName),
  class: "cmt-variableName cmt-definition"
}, {
  tag: tags.special(tags.variableName),
  class: "cmt-variableName2"
}, {
  tag: tags.typeName,
  class: "cmt-typeName"
}, {
  tag: tags.namespace,
  class: "cmt-namespace"
}, {
  tag: tags.macroName,
  class: "cmt-macroName"
}, {
  tag: tags.propertyName,
  class: "cmt-propertyName"
}, {
  tag: tags.operator,
  class: "cmt-operator"
}, {
  tag: tags.comment,
  class: "cmt-comment"
}, {
  tag: tags.meta,
  class: "cmt-meta"
}, {
  tag: tags.invalid,
  class: "cmt-invalid"
}, {
  tag: tags.punctuation,
  class: "cmt-punctuation"
}]);
exports.HighlightStyle = HighlightStyle;
exports.Tag = Tag;
exports.classHighlightStyle = classHighlightStyle;
exports.defaultHighlightStyle = defaultHighlightStyle;
exports.highlightTree = highlightTree;
exports.styleTags = styleTags;
exports.tags = tags;

},

// node_modules/style-mod/src/style-mod.js @40
40: function(__fusereq, exports, module){
const C = "\u037c";
const COUNT = typeof Symbol == "undefined" ? "__" + C : Symbol.for(C);
const SET = typeof Symbol == "undefined" ? "__styleSet" + Math.floor(Math.random() * 1e8) : Symbol("styleSet");
const top = typeof globalThis != "undefined" ? globalThis : typeof window != "undefined" ? window : {};
class StyleModule {
  constructor(spec, options) {
    this.rules = [];
    let {finish} = options || ({});
    function splitSelector(selector) {
      return (/^@/).test(selector) ? [selector] : selector.split(/,\s*/);
    }
    function render(selectors, spec, target, isKeyframes) {
      let local = [], isAt = (/^@(\w+)\b/).exec(selectors[0]), keyframes = isAt && isAt[1] == "keyframes";
      if (isAt && spec == null) return target.push(selectors[0] + ";");
      for (let prop in spec) {
        let value = spec[prop];
        if ((/&/).test(prop)) {
          render(prop.split(/,\s*/).map(part => selectors.map(sel => part.replace(/&/, sel))).reduce((a, b) => a.concat(b)), value, target);
        } else if (value && typeof value == "object") {
          if (!isAt) throw new RangeError("The value of a property (" + prop + ") should be a primitive value.");
          render(splitSelector(prop), value, local, keyframes);
        } else if (value != null) {
          local.push(prop.replace(/_.*/, "").replace(/[A-Z]/g, l => "-" + l.toLowerCase()) + ": " + value + ";");
        }
      }
      if (local.length || keyframes) {
        target.push((finish && !isAt && !isKeyframes ? selectors.map(finish) : selectors).join(", ") + " {" + local.join(" ") + "}");
      }
    }
    for (let prop in spec) render(splitSelector(prop), spec[prop], this.rules);
  }
  getRules() {
    return this.rules.join("\n");
  }
  static newName() {
    let id = top[COUNT] || 1;
    top[COUNT] = id + 1;
    return C + id.toString(36);
  }
  static mount(root, modules) {
    (root[SET] || new StyleSet(root)).mount(Array.isArray(modules) ? modules : [modules]);
  }
}
exports.StyleModule = StyleModule;
let adoptedSet = null;
class StyleSet {
  constructor(root) {
    if (!root.head && root.adoptedStyleSheets && typeof CSSStyleSheet != "undefined") {
      if (adoptedSet) {
        root.adoptedStyleSheets = [adoptedSet.sheet].concat(root.adoptedStyleSheets);
        return root[SET] = adoptedSet;
      }
      this.sheet = new CSSStyleSheet();
      root.adoptedStyleSheets = [this.sheet].concat(root.adoptedStyleSheets);
      adoptedSet = this;
    } else {
      this.styleTag = (root.ownerDocument || root).createElement("style");
      let target = root.head || root;
      target.insertBefore(this.styleTag, target.firstChild);
    }
    this.modules = [];
    root[SET] = this;
  }
  mount(modules) {
    let sheet = this.sheet;
    let pos = 0, j = 0;
    for (let i = 0; i < modules.length; i++) {
      let mod = modules[i], index = this.modules.indexOf(mod);
      if (index < j && index > -1) {
        this.modules.splice(index, 1);
        j--;
        index = -1;
      }
      if (index == -1) {
        this.modules.splice(j++, 0, mod);
        if (sheet) for (let k = 0; k < mod.rules.length; k++) sheet.insertRule(mod.rules[k], pos++);
      } else {
        while (j < index) pos += this.modules[j++].rules.length;
        pos += mod.rules.length;
        j++;
      }
    }
    if (!sheet) {
      let text = "";
      for (let i = 0; i < this.modules.length; i++) text += this.modules[i].getRules() + "\n";
      this.styleTag.textContent = text;
    }
  }
}

},

// node_modules/@codemirror/view/dist/index.js @14
14: function(__fusereq, exports, module){
exports.__esModule = true;
var state_1 = __fusereq(15);
var style_mod_1 = __fusereq(40);
var rangeset_1 = __fusereq(39);
var rangeset_2 = __fusereq(39);
exports.Range = rangeset_2.Range;
var text_1 = __fusereq(22);
var w3c_keyname_1 = __fusereq(41);
let [nav, doc] = typeof navigator != "undefined" ? [navigator, document] : [{
  userAgent: "",
  vendor: "",
  platform: ""
}, {
  documentElement: {
    style: {}
  }
}];
const ie_edge = (/Edge\/(\d+)/).exec(nav.userAgent);
const ie_upto10 = (/MSIE \d/).test(nav.userAgent);
const ie_11up = (/Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/).exec(nav.userAgent);
const ie = !!(ie_upto10 || ie_11up || ie_edge);
const gecko = !ie && (/gecko\/(\d+)/i).test(nav.userAgent);
const chrome = !ie && (/Chrome\/(\d+)/).exec(nav.userAgent);
const webkit = ("webkitFontSmoothing" in doc.documentElement.style);
const safari = !ie && (/Apple Computer/).test(nav.vendor);
var browser = {
  mac: (/Mac/).test(nav.platform),
  ie,
  ie_version: ie_upto10 ? doc.documentMode || 6 : ie_11up ? +ie_11up[1] : ie_edge ? +ie_edge[1] : 0,
  gecko,
  gecko_version: gecko ? +((/Firefox\/(\d+)/).exec(nav.userAgent) || [0, 0])[1] : 0,
  chrome: !!chrome,
  chrome_version: chrome ? +chrome[1] : 0,
  ios: safari && ((/Mobile\/\w+/).test(nav.userAgent) || nav.maxTouchPoints > 2),
  android: (/Android\b/).test(nav.userAgent),
  webkit,
  safari,
  webkit_version: webkit ? +((/\bAppleWebKit\/(\d+)/).exec(navigator.userAgent) || [0, 0])[1] : 0,
  tabSize: doc.documentElement.style.tabSize != null ? "tab-size" : "-moz-tab-size"
};
function getSelection(root) {
  return root.getSelection ? root.getSelection() : document.getSelection();
}
function selectionCollapsed(domSel) {
  let collapsed = domSel.isCollapsed;
  if (collapsed && browser.chrome && domSel.rangeCount && !domSel.getRangeAt(0).collapsed) collapsed = false;
  return collapsed;
}
function hasSelection(dom, selection) {
  if (!selection.anchorNode) return false;
  try {
    return dom.contains(selection.anchorNode.nodeType == 3 ? selection.anchorNode.parentNode : selection.anchorNode);
  } catch (_) {
    return false;
  }
}
function clientRectsFor(dom) {
  if (dom.nodeType == 3) {
    let range = tempRange();
    range.setEnd(dom, dom.nodeValue.length);
    range.setStart(dom, 0);
    return range.getClientRects();
  } else if (dom.nodeType == 1) {
    return dom.getClientRects();
  } else {
    return [];
  }
}
function isEquivalentPosition(node, off, targetNode, targetOff) {
  return targetNode ? scanFor(node, off, targetNode, targetOff, -1) || scanFor(node, off, targetNode, targetOff, 1) : false;
}
function domIndex(node) {
  for (var index = 0; ; index++) {
    node = node.previousSibling;
    if (!node) return index;
  }
}
function scanFor(node, off, targetNode, targetOff, dir) {
  for (; ; ) {
    if (node == targetNode && off == targetOff) return true;
    if (off == (dir < 0 ? 0 : maxOffset(node))) {
      if (node.nodeName == "DIV") return false;
      let parent = node.parentNode;
      if (!parent || parent.nodeType != 1) return false;
      off = domIndex(node) + (dir < 0 ? 0 : 1);
      node = parent;
    } else if (node.nodeType == 1) {
      node = node.childNodes[off + (dir < 0 ? -1 : 0)];
      off = dir < 0 ? maxOffset(node) : 0;
    } else {
      return false;
    }
  }
}
function maxOffset(node) {
  return node.nodeType == 3 ? node.nodeValue.length : node.childNodes.length;
}
const Rect0 = {
  left: 0,
  right: 0,
  top: 0,
  bottom: 0
};
function flattenRect(rect, left) {
  let x = left ? rect.left : rect.right;
  return {
    left: x,
    right: x,
    top: rect.top,
    bottom: rect.bottom
  };
}
function windowRect(win) {
  return {
    left: 0,
    right: win.innerWidth,
    top: 0,
    bottom: win.innerHeight
  };
}
const ScrollSpace = 5;
function scrollRectIntoView(dom, rect) {
  let doc = dom.ownerDocument, win = doc.defaultView;
  for (let cur = dom.parentNode; cur; ) {
    if (cur.nodeType == 1) {
      let bounding, top = cur == document.body;
      if (top) {
        bounding = windowRect(win);
      } else {
        if (cur.scrollHeight <= cur.clientHeight && cur.scrollWidth <= cur.clientWidth) {
          cur = cur.parentNode;
          continue;
        }
        let rect = cur.getBoundingClientRect();
        bounding = {
          left: rect.left,
          right: rect.left + cur.clientWidth,
          top: rect.top,
          bottom: rect.top + cur.clientHeight
        };
      }
      let moveX = 0, moveY = 0;
      if (rect.top < bounding.top) moveY = -(bounding.top - rect.top + ScrollSpace); else if (rect.bottom > bounding.bottom) moveY = rect.bottom - bounding.bottom + ScrollSpace;
      if (rect.left < bounding.left) moveX = -(bounding.left - rect.left + ScrollSpace); else if (rect.right > bounding.right) moveX = rect.right - bounding.right + ScrollSpace;
      if (moveX || moveY) {
        if (top) {
          win.scrollBy(moveX, moveY);
        } else {
          if (moveY) {
            let start = cur.scrollTop;
            cur.scrollTop += moveY;
            moveY = cur.scrollTop - start;
          }
          if (moveX) {
            let start = cur.scrollLeft;
            cur.scrollLeft += moveX;
            moveX = cur.scrollLeft - start;
          }
          rect = {
            left: rect.left - moveX,
            top: rect.top - moveY,
            right: rect.right - moveX,
            bottom: rect.bottom - moveY
          };
        }
      }
      if (top) break;
      cur = cur.parentNode;
    } else if (cur.nodeType == 11) {
      cur = cur.host;
    } else {
      break;
    }
  }
}
class DOMSelection {
  constructor() {
    this.anchorNode = null;
    this.anchorOffset = 0;
    this.focusNode = null;
    this.focusOffset = 0;
  }
  eq(domSel) {
    return this.anchorNode == domSel.anchorNode && this.anchorOffset == domSel.anchorOffset && this.focusNode == domSel.focusNode && this.focusOffset == domSel.focusOffset;
  }
  set(domSel) {
    this.anchorNode = domSel.anchorNode;
    this.anchorOffset = domSel.anchorOffset;
    this.focusNode = domSel.focusNode;
    this.focusOffset = domSel.focusOffset;
  }
}
let preventScrollSupported = null;
function focusPreventScroll(dom) {
  if (dom.setActive) return dom.setActive();
  if (preventScrollSupported) return dom.focus(preventScrollSupported);
  let stack = [];
  for (let cur = dom; cur; cur = cur.parentNode) {
    stack.push(cur, cur.scrollTop, cur.scrollLeft);
    if (cur == cur.ownerDocument) break;
  }
  dom.focus(preventScrollSupported == null ? {
    get preventScroll() {
      preventScrollSupported = {
        preventScroll: true
      };
      return true;
    }
  } : undefined);
  if (!preventScrollSupported) {
    preventScrollSupported = false;
    for (let i = 0; i < stack.length; ) {
      let elt = stack[i++], top = stack[i++], left = stack[i++];
      if (elt.scrollTop != top) elt.scrollTop = top;
      if (elt.scrollLeft != left) elt.scrollLeft = left;
    }
  }
}
let scratchRange;
function tempRange() {
  return scratchRange || (scratchRange = document.createRange());
}
class DOMPos {
  constructor(node, offset, precise = true) {
    this.node = node;
    this.offset = offset;
    this.precise = precise;
  }
  static before(dom, precise) {
    return new DOMPos(dom.parentNode, domIndex(dom), precise);
  }
  static after(dom, precise) {
    return new DOMPos(dom.parentNode, domIndex(dom) + 1, precise);
  }
}
const none$3 = [];
class ContentView {
  constructor() {
    this.parent = null;
    this.dom = null;
    this.dirty = 2;
  }
  get editorView() {
    if (!this.parent) throw new Error("Accessing view in orphan content view");
    return this.parent.editorView;
  }
  get overrideDOMText() {
    return null;
  }
  get posAtStart() {
    return this.parent ? this.parent.posBefore(this) : 0;
  }
  get posAtEnd() {
    return this.posAtStart + this.length;
  }
  posBefore(view) {
    let pos = this.posAtStart;
    for (let child of this.children) {
      if (child == view) return pos;
      pos += child.length + child.breakAfter;
    }
    throw new RangeError("Invalid child in posBefore");
  }
  posAfter(view) {
    return this.posBefore(view) + view.length;
  }
  coordsAt(_pos, _side) {
    return null;
  }
  sync(track) {
    if (this.dirty & 2) {
      let parent = this.dom, pos = null;
      for (let child of this.children) {
        if (child.dirty) {
          let next = pos ? pos.nextSibling : parent.firstChild;
          if (next && !child.dom && !ContentView.get(next)) child.reuseDOM(next);
          child.sync(track);
          child.dirty = 0;
        }
        if (track && track.node == parent && pos != child.dom) track.written = true;
        syncNodeInto(parent, pos, child.dom);
        pos = child.dom;
      }
      let next = pos ? pos.nextSibling : parent.firstChild;
      if (next && track && track.node == parent) track.written = true;
      while (next) next = rm(next);
    } else if (this.dirty & 1) {
      for (let child of this.children) if (child.dirty) {
        child.sync(track);
        child.dirty = 0;
      }
    }
  }
  reuseDOM(_dom) {
    return false;
  }
  localPosFromDOM(node, offset) {
    let after;
    if (node == this.dom) {
      after = this.dom.childNodes[offset];
    } else {
      let bias = maxOffset(node) == 0 ? 0 : offset == 0 ? -1 : 1;
      for (; ; ) {
        let parent = node.parentNode;
        if (parent == this.dom) break;
        if (bias == 0 && parent.firstChild != parent.lastChild) {
          if (node == parent.firstChild) bias = -1; else bias = 1;
        }
        node = parent;
      }
      if (bias < 0) after = node; else after = node.nextSibling;
    }
    if (after == this.dom.firstChild) return 0;
    while (after && !ContentView.get(after)) after = after.nextSibling;
    if (!after) return this.length;
    for (let i = 0, pos = 0; ; i++) {
      let child = this.children[i];
      if (child.dom == after) return pos;
      pos += child.length + child.breakAfter;
    }
  }
  domBoundsAround(from, to, offset = 0) {
    let fromI = -1, fromStart = -1, toI = -1, toEnd = -1;
    for (let i = 0, pos = offset; i < this.children.length; i++) {
      let child = this.children[i], end = pos + child.length;
      if (pos < from && end > to) return child.domBoundsAround(from, to, pos);
      if (end >= from && fromI == -1) {
        fromI = i;
        fromStart = pos;
      }
      if (end >= to && end != pos && toI == -1) {
        toI = i;
        toEnd = end;
        break;
      }
      pos = end + child.breakAfter;
    }
    return {
      from: fromStart,
      to: toEnd < 0 ? offset + this.length : toEnd,
      startDOM: (fromI ? this.children[fromI - 1].dom.nextSibling : null) || this.dom.firstChild,
      endDOM: toI < this.children.length - 1 && toI >= 0 ? this.children[toI + 1].dom : null
    };
  }
  markDirty(andParent = false) {
    if (this.dirty & 2) return;
    this.dirty |= 2;
    this.markParentsDirty(andParent);
  }
  markParentsDirty(childList) {
    for (let parent = this.parent; parent; parent = parent.parent) {
      if (childList) parent.dirty |= 2;
      if (parent.dirty & 1) return;
      parent.dirty |= 1;
      childList = false;
    }
  }
  setParent(parent) {
    if (this.parent != parent) {
      this.parent = parent;
      if (this.dirty) this.markParentsDirty(true);
    }
  }
  setDOM(dom) {
    this.dom = dom;
    dom.cmView = this;
  }
  get rootView() {
    for (let v = this; ; ) {
      let parent = v.parent;
      if (!parent) return v;
      v = parent;
    }
  }
  replaceChildren(from, to, children = none$3) {
    this.markDirty();
    for (let i = from; i < to; i++) this.children[i].parent = null;
    this.children.splice(from, to - from, ...children);
    for (let i = 0; i < children.length; i++) children[i].setParent(this);
  }
  ignoreMutation(_rec) {
    return false;
  }
  ignoreEvent(_event) {
    return false;
  }
  childCursor(pos = this.length) {
    return new ChildCursor(this.children, pos, this.children.length);
  }
  childPos(pos, bias = 1) {
    return this.childCursor().findPos(pos, bias);
  }
  toString() {
    let name = this.constructor.name.replace("View", "");
    return name + (this.children.length ? "(" + this.children.join() + ")" : this.length ? "[" + (name == "Text" ? this.text : this.length) + "]" : "") + (this.breakAfter ? "#" : "");
  }
  static get(node) {
    return node.cmView;
  }
}
ContentView.prototype.breakAfter = 0;
function rm(dom) {
  let next = dom.nextSibling;
  dom.parentNode.removeChild(dom);
  return next;
}
function syncNodeInto(parent, after, dom) {
  let next = after ? after.nextSibling : parent.firstChild;
  if (dom.parentNode == parent) while (next != dom) next = rm(next); else parent.insertBefore(dom, next);
}
class ChildCursor {
  constructor(children, pos, i) {
    this.children = children;
    this.pos = pos;
    this.i = i;
    this.off = 0;
  }
  findPos(pos, bias = 1) {
    for (; ; ) {
      if (pos > this.pos || pos == this.pos && (bias > 0 || this.i == 0 || this.children[this.i - 1].breakAfter)) {
        this.off = pos - this.pos;
        return this;
      }
      let next = this.children[--this.i];
      this.pos -= next.length + next.breakAfter;
    }
  }
}
const none$2 = [];
class InlineView extends ContentView {
  become(_other) {
    return false;
  }
  getSide() {
    return 0;
  }
}
InlineView.prototype.children = none$2;
const MaxJoinLen = 256;
class TextView extends InlineView {
  constructor(text) {
    super();
    this.text = text;
  }
  get length() {
    return this.text.length;
  }
  createDOM(textDOM) {
    this.setDOM(textDOM || document.createTextNode(this.text));
  }
  sync(track) {
    if (!this.dom) this.createDOM();
    if (this.dom.nodeValue != this.text) {
      if (track && track.node == this.dom) track.written = true;
      this.dom.nodeValue = this.text;
    }
  }
  reuseDOM(dom) {
    if (dom.nodeType != 3) return false;
    this.createDOM(dom);
    return true;
  }
  merge(from, to, source) {
    if (source && (!(source instanceof TextView) || this.length - (to - from) + source.length > MaxJoinLen)) return false;
    this.text = this.text.slice(0, from) + (source ? source.text : "") + this.text.slice(to);
    this.markDirty();
    return true;
  }
  slice(from) {
    return new TextView(this.text.slice(from));
  }
  localPosFromDOM(node, offset) {
    return node == this.dom ? offset : offset ? this.text.length : 0;
  }
  domAtPos(pos) {
    return new DOMPos(this.dom, pos);
  }
  domBoundsAround(_from, _to, offset) {
    return {
      from: offset,
      to: offset + this.length,
      startDOM: this.dom,
      endDOM: this.dom.nextSibling
    };
  }
  coordsAt(pos, side) {
    return textCoords(this.dom, pos, side);
  }
}
class MarkView extends InlineView {
  constructor(mark, children = [], length = 0) {
    super();
    this.mark = mark;
    this.children = children;
    this.length = length;
    for (let ch of children) ch.setParent(this);
  }
  createDOM() {
    let dom = document.createElement(this.mark.tagName);
    if (this.mark.class) dom.className = this.mark.class;
    if (this.mark.attrs) for (let name in this.mark.attrs) dom.setAttribute(name, this.mark.attrs[name]);
    this.setDOM(dom);
  }
  sync(track) {
    if (!this.dom) this.createDOM();
    super.sync(track);
  }
  merge(from, to, source, openStart, openEnd) {
    if (source && (!(source instanceof MarkView && source.mark.eq(this.mark)) || from && openStart <= 0 || to < this.length && openEnd <= 0)) return false;
    mergeInlineChildren(this, from, to, source ? source.children : none$2, openStart - 1, openEnd - 1);
    this.markDirty();
    return true;
  }
  slice(from) {
    return new MarkView(this.mark, sliceInlineChildren(this.children, from), this.length - from);
  }
  domAtPos(pos) {
    return inlineDOMAtPos(this.dom, this.children, pos);
  }
  coordsAt(pos, side) {
    return coordsInChildren(this, pos, side);
  }
}
function textCoords(text, pos, side) {
  let length = text.nodeValue.length;
  if (pos > length) pos = length;
  let from = pos, to = pos, flatten = 0;
  if (pos == 0 && side < 0 || pos == length && side >= 0) {
    if (!(browser.chrome || browser.gecko)) {
      if (pos) {
        from--;
        flatten = 1;
      } else {
        to++;
        flatten = -1;
      }
    }
  } else {
    if (side < 0) from--; else to++;
  }
  let range = tempRange();
  range.setEnd(text, to);
  range.setStart(text, from);
  let rects = range.getClientRects();
  if (!rects.length) return Rect0;
  let rect = rects[(flatten ? flatten < 0 : side >= 0) ? 0 : rects.length - 1];
  if (browser.safari && !flatten && rect.width == 0) rect = Array.prototype.find.call(rects, r => r.width) || rect;
  return flatten ? flattenRect(rect, flatten < 0) : rect;
}
class WidgetView extends InlineView {
  constructor(widget, length, side) {
    super();
    this.widget = widget;
    this.length = length;
    this.side = side;
  }
  static create(widget, length, side) {
    return new (widget.customView || WidgetView)(widget, length, side);
  }
  slice(from) {
    return WidgetView.create(this.widget, this.length - from, this.side);
  }
  sync() {
    if (!this.dom || !this.widget.updateDOM(this.dom)) {
      this.setDOM(this.widget.toDOM(this.editorView));
      this.dom.contentEditable = "false";
    }
  }
  getSide() {
    return this.side;
  }
  merge(from, to, source, openStart, openEnd) {
    if (source && (!(source instanceof WidgetView) || !this.widget.compare(source.widget) || from > 0 && openStart <= 0 || to < this.length && openEnd <= 0)) return false;
    this.length = from + (source ? source.length : 0) + (this.length - to);
    return true;
  }
  become(other) {
    if (other.length == this.length && other instanceof WidgetView && other.side == this.side) {
      if (this.widget.constructor == other.widget.constructor) {
        if (!this.widget.eq(other.widget)) this.markDirty(true);
        this.widget = other.widget;
        return true;
      }
    }
    return false;
  }
  ignoreMutation() {
    return true;
  }
  ignoreEvent(event) {
    return this.widget.ignoreEvent(event);
  }
  get overrideDOMText() {
    if (this.length == 0) return text_1.Text.empty;
    let top = this;
    while (top.parent) top = top.parent;
    let view = top.editorView, text = view && view.state.doc, start = this.posAtStart;
    return text ? text.slice(start, start + this.length) : text_1.Text.empty;
  }
  domAtPos(pos) {
    return pos == 0 ? DOMPos.before(this.dom) : DOMPos.after(this.dom, pos == this.length);
  }
  domBoundsAround() {
    return null;
  }
  coordsAt(pos, side) {
    let rects = this.dom.getClientRects(), rect = null;
    if (!rects.length) return Rect0;
    for (let i = pos > 0 ? rects.length - 1 : 0; ; i += pos > 0 ? -1 : 1) {
      rect = rects[i];
      if (pos > 0 ? i == 0 : i == rects.length - 1 || rect.top < rect.bottom) break;
    }
    return pos == 0 && side > 0 || pos == this.length && side <= 0 ? rect : flattenRect(rect, pos == 0);
  }
}
class CompositionView extends WidgetView {
  domAtPos(pos) {
    return new DOMPos(this.widget.text, pos);
  }
  sync() {
    if (!this.dom) this.setDOM(this.widget.toDOM());
  }
  localPosFromDOM(node, offset) {
    return !offset ? 0 : node.nodeType == 3 ? Math.min(offset, this.length) : this.length;
  }
  ignoreMutation() {
    return false;
  }
  get overrideDOMText() {
    return null;
  }
  coordsAt(pos, side) {
    return textCoords(this.widget.text, pos, side);
  }
}
function mergeInlineChildren(parent, from, to, elts, openStart, openEnd) {
  let cur = parent.childCursor();
  let {i: toI, off: toOff} = cur.findPos(to, 1);
  let {i: fromI, off: fromOff} = cur.findPos(from, -1);
  let dLen = from - to;
  for (let view of elts) dLen += view.length;
  parent.length += dLen;
  let {children} = parent;
  if (fromI == toI && fromOff) {
    let start = children[fromI];
    if (elts.length == 1 && start.merge(fromOff, toOff, elts[0], openStart, openEnd)) return;
    if (elts.length == 0) {
      start.merge(fromOff, toOff, null, openStart, openEnd);
      return;
    }
    let after = start.slice(toOff);
    if (after.merge(0, 0, elts[elts.length - 1], 0, openEnd)) elts[elts.length - 1] = after; else elts.push(after);
    toI++;
    openEnd = toOff = 0;
  }
  if (toOff) {
    let end = children[toI];
    if (elts.length && end.merge(0, toOff, elts[elts.length - 1], 0, openEnd)) {
      elts.pop();
      openEnd = 0;
    } else {
      end.merge(0, toOff, null, 0, 0);
    }
  } else if (toI < children.length && elts.length && children[toI].merge(0, 0, elts[elts.length - 1], 0, openEnd)) {
    elts.pop();
    openEnd = 0;
  }
  if (fromOff) {
    let start = children[fromI];
    if (elts.length && start.merge(fromOff, start.length, elts[0], openStart, 0)) {
      elts.shift();
      openStart = 0;
    } else {
      start.merge(fromOff, start.length, null, 0, 0);
    }
    fromI++;
  } else if (fromI && elts.length) {
    let end = children[fromI - 1];
    if (end.merge(end.length, end.length, elts[0], openStart, 0)) {
      elts.shift();
      openStart = 0;
    }
  }
  while (fromI < toI && elts.length && children[toI - 1].become(elts[elts.length - 1])) {
    elts.pop();
    toI--;
    openEnd = 0;
  }
  while (fromI < toI && elts.length && children[fromI].become(elts[0])) {
    elts.shift();
    fromI++;
    openStart = 0;
  }
  if (!elts.length && fromI && toI < children.length && openStart && openEnd && children[toI].merge(0, 0, children[fromI - 1], openStart, openEnd)) fromI--;
  if (elts.length || fromI != toI) parent.replaceChildren(fromI, toI, elts);
}
function sliceInlineChildren(children, from) {
  let result = [], off = 0;
  for (let elt of children) {
    let end = off + elt.length;
    if (end > from) result.push(off < from ? elt.slice(from - off) : elt);
    off = end;
  }
  return result;
}
function inlineDOMAtPos(dom, children, pos) {
  let i = 0;
  for (let off = 0; i < children.length; i++) {
    let child = children[i], end = off + child.length;
    if (end == off && child.getSide() <= 0) continue;
    if (pos > off && pos < end && child.dom.parentNode == dom) return child.domAtPos(pos - off);
    if (pos <= off) break;
    off = end;
  }
  for (; i > 0; i--) {
    let before = children[i - 1].dom;
    if (before.parentNode == dom) return DOMPos.after(before);
  }
  return new DOMPos(dom, 0);
}
function joinInlineInto(parent, view, open) {
  let last, {children} = parent;
  if (open > 0 && view instanceof MarkView && children.length && (last = children[children.length - 1]) instanceof MarkView && last.mark.eq(view.mark)) {
    joinInlineInto(last, view.children[0], open - 1);
  } else {
    children.push(view);
    view.setParent(parent);
  }
  parent.length += view.length;
}
function coordsInChildren(view, pos, side) {
  for (let off = 0, i = 0; i < view.children.length; i++) {
    let child = view.children[i], end = off + child.length;
    if (end == off && child.getSide() <= 0) continue;
    if (side <= 0 || end == view.length ? end >= pos : end > pos) return child.coordsAt(pos - off, side);
    off = end;
  }
  return (view.dom.lastChild || view.dom).getBoundingClientRect();
}
function combineAttrs(source, target) {
  for (let name in source) {
    if (name == "class" && target.class) target.class += " " + source.class; else if (name == "style" && target.style) target.style += ";" + source.style; else target[name] = source[name];
  }
  return target;
}
function attrsEq(a, b) {
  if (a == b) return true;
  if (!a || !b) return false;
  let keysA = Object.keys(a), keysB = Object.keys(b);
  if (keysA.length != keysB.length) return false;
  for (let key of keysA) {
    if (keysB.indexOf(key) == -1 || a[key] !== b[key]) return false;
  }
  return true;
}
function updateAttrs(dom, prev, attrs) {
  if (prev) for (let name in prev) if (!(attrs && (name in attrs))) dom.removeAttribute(name);
  if (attrs) for (let name in attrs) if (!(prev && prev[name] == attrs[name])) dom.setAttribute(name, attrs[name]);
}
class WidgetType {
  eq(_widget) {
    return false;
  }
  updateDOM(_dom) {
    return false;
  }
  compare(other) {
    return this == other || this.constructor == other.constructor && this.eq(other);
  }
  get estimatedHeight() {
    return -1;
  }
  ignoreEvent(_event) {
    return true;
  }
  get customView() {
    return null;
  }
}
var BlockType;
(function (BlockType) {
  BlockType[BlockType["Text"] = 0] = "Text";
  BlockType[BlockType["WidgetBefore"] = 1] = "WidgetBefore";
  BlockType[BlockType["WidgetAfter"] = 2] = "WidgetAfter";
  BlockType[BlockType["WidgetRange"] = 3] = "WidgetRange";
})(BlockType || (BlockType = {}));
class Decoration extends rangeset_1.RangeValue {
  constructor(startSide, endSide, widget, spec) {
    super();
    this.startSide = startSide;
    this.endSide = endSide;
    this.widget = widget;
    this.spec = spec;
  }
  get heightRelevant() {
    return false;
  }
  static mark(spec) {
    return new MarkDecoration(spec);
  }
  static widget(spec) {
    let side = spec.side || 0;
    if (spec.block) side += (200000000 + 1) * (side > 0 ? 1 : -1);
    return new PointDecoration(spec, side, side, !!spec.block, spec.widget || null, false);
  }
  static replace(spec) {
    let block = !!spec.block;
    let {start, end} = getInclusive(spec);
    let startSide = block ? -200000000 * (start ? 2 : 1) : 100000000 * (start ? -1 : 1);
    let endSide = block ? 200000000 * (end ? 2 : 1) : 100000000 * (end ? 1 : -1);
    return new PointDecoration(spec, startSide, endSide, block, spec.widget || null, true);
  }
  static line(spec) {
    return new LineDecoration(spec);
  }
  static set(of, sort = false) {
    return rangeset_1.RangeSet.of(of, sort);
  }
  hasHeight() {
    return this.widget ? this.widget.estimatedHeight > -1 : false;
  }
}
Decoration.none = rangeset_1.RangeSet.empty;
class MarkDecoration extends Decoration {
  constructor(spec) {
    let {start, end} = getInclusive(spec);
    super(100000000 * (start ? -1 : 1), 100000000 * (end ? 1 : -1), null, spec);
    this.tagName = spec.tagName || "span";
    this.class = spec.class || "";
    this.attrs = spec.attributes || null;
  }
  eq(other) {
    return this == other || other instanceof MarkDecoration && this.tagName == other.tagName && this.class == other.class && attrsEq(this.attrs, other.attrs);
  }
  range(from, to = from) {
    if (from >= to) throw new RangeError("Mark decorations may not be empty");
    return super.range(from, to);
  }
}
MarkDecoration.prototype.point = false;
class LineDecoration extends Decoration {
  constructor(spec) {
    super(-100000000, -100000000, null, spec);
  }
  eq(other) {
    return other instanceof LineDecoration && attrsEq(this.spec.attributes, other.spec.attributes);
  }
  range(from, to = from) {
    if (to != from) throw new RangeError("Line decoration ranges must be zero-length");
    return super.range(from, to);
  }
}
LineDecoration.prototype.mapMode = state_1.MapMode.TrackBefore;
LineDecoration.prototype.point = true;
class PointDecoration extends Decoration {
  constructor(spec, startSide, endSide, block, widget, isReplace) {
    super(startSide, endSide, widget, spec);
    this.block = block;
    this.isReplace = isReplace;
    this.mapMode = !block ? state_1.MapMode.TrackDel : startSide < 0 ? state_1.MapMode.TrackBefore : state_1.MapMode.TrackAfter;
  }
  get type() {
    return this.startSide < this.endSide ? BlockType.WidgetRange : this.startSide < 0 ? BlockType.WidgetBefore : BlockType.WidgetAfter;
  }
  get heightRelevant() {
    return this.block || !!this.widget && this.widget.estimatedHeight >= 5;
  }
  eq(other) {
    return other instanceof PointDecoration && widgetsEq(this.widget, other.widget) && this.block == other.block && this.startSide == other.startSide && this.endSide == other.endSide;
  }
  range(from, to = from) {
    if (this.isReplace && (from > to || from == to && this.startSide > 0 && this.endSide < 0)) throw new RangeError("Invalid range for replacement decoration");
    if (!this.isReplace && to != from) throw new RangeError("Widget decorations can only have zero-length ranges");
    return super.range(from, to);
  }
}
PointDecoration.prototype.point = true;
function getInclusive(spec) {
  let {inclusiveStart: start, inclusiveEnd: end} = spec;
  if (start == null) start = spec.inclusive;
  if (end == null) end = spec.inclusive;
  return {
    start: start || false,
    end: end || false
  };
}
function widgetsEq(a, b) {
  return a == b || !!(a && b && a.compare(b));
}
function addRange(from, to, ranges, margin = 0) {
  let last = ranges.length - 1;
  if (last >= 0 && ranges[last] + margin > from) ranges[last] = Math.max(ranges[last], to); else ranges.push(from, to);
}
class LineView extends ContentView {
  constructor() {
    super(...arguments);
    this.children = [];
    this.length = 0;
    this.prevAttrs = undefined;
    this.attrs = null;
    this.breakAfter = 0;
  }
  merge(from, to, source, takeDeco, openStart, openEnd) {
    if (source) {
      if (!(source instanceof LineView)) return false;
      if (!this.dom) source.transferDOM(this);
    }
    if (takeDeco) this.setDeco(source ? source.attrs : null);
    mergeInlineChildren(this, from, to, source ? source.children : none$1, openStart, openEnd);
    return true;
  }
  split(at) {
    let end = new LineView();
    end.breakAfter = this.breakAfter;
    if (this.length == 0) return end;
    let {i, off} = this.childPos(at);
    if (off) {
      end.append(this.children[i].slice(off), 0);
      this.children[i].merge(off, this.children[i].length, null, 0, 0);
      i++;
    }
    for (let j = i; j < this.children.length; j++) end.append(this.children[j], 0);
    while (i > 0 && this.children[i - 1].length == 0) {
      this.children[i - 1].parent = null;
      i--;
    }
    this.children.length = i;
    this.markDirty();
    this.length = at;
    return end;
  }
  transferDOM(other) {
    if (!this.dom) return;
    other.setDOM(this.dom);
    other.prevAttrs = this.prevAttrs === undefined ? this.attrs : this.prevAttrs;
    this.prevAttrs = undefined;
    this.dom = null;
  }
  setDeco(attrs) {
    if (!attrsEq(this.attrs, attrs)) {
      if (this.dom) {
        this.prevAttrs = this.attrs;
        this.markDirty();
      }
      this.attrs = attrs;
    }
  }
  append(child, openStart) {
    joinInlineInto(this, child, openStart);
  }
  addLineDeco(deco) {
    let attrs = deco.spec.attributes;
    if (attrs) this.attrs = combineAttrs(attrs, this.attrs || ({}));
  }
  domAtPos(pos) {
    return inlineDOMAtPos(this.dom, this.children, pos);
  }
  sync(track) {
    if (!this.dom) {
      this.setDOM(document.createElement("div"));
      this.dom.className = "cm-line";
      this.prevAttrs = this.attrs ? null : undefined;
    }
    if (this.prevAttrs !== undefined) {
      updateAttrs(this.dom, this.prevAttrs, this.attrs);
      this.dom.classList.add("cm-line");
      this.prevAttrs = undefined;
    }
    super.sync(track);
    let last = this.dom.lastChild;
    if (!last || last.nodeName != "BR" && ContentView.get(last) instanceof WidgetView) {
      let hack = document.createElement("BR");
      hack.cmIgnore = true;
      this.dom.appendChild(hack);
    }
  }
  measureTextSize() {
    if (this.children.length == 0 || this.length > 20) return null;
    let totalWidth = 0;
    for (let child of this.children) {
      if (!(child instanceof TextView)) return null;
      let rects = clientRectsFor(child.dom);
      if (rects.length != 1) return null;
      totalWidth += rects[0].width;
    }
    return {
      lineHeight: this.dom.getBoundingClientRect().height,
      charWidth: totalWidth / this.length
    };
  }
  coordsAt(pos, side) {
    return coordsInChildren(this, pos, side);
  }
  match(_other) {
    return false;
  }
  get type() {
    return BlockType.Text;
  }
  static find(docView, pos) {
    for (let i = 0, off = 0; ; i++) {
      let block = docView.children[i], end = off + block.length;
      if (end >= pos) {
        if (block instanceof LineView) return block;
        if (block.length) return null;
      }
      off = end + block.breakAfter;
    }
  }
}
const none$1 = [];
class BlockWidgetView extends ContentView {
  constructor(widget, length, type) {
    super();
    this.widget = widget;
    this.length = length;
    this.type = type;
    this.breakAfter = 0;
  }
  merge(from, to, source, _takeDeco, openStart, openEnd) {
    if (source && (!(source instanceof BlockWidgetView) || !this.widget.compare(source.widget) || from > 0 && openStart <= 0 || to < this.length && openEnd <= 0)) return false;
    this.length = from + (source ? source.length : 0) + (this.length - to);
    return true;
  }
  domAtPos(pos) {
    return pos == 0 ? DOMPos.before(this.dom) : DOMPos.after(this.dom, pos == this.length);
  }
  split(at) {
    let len = this.length - at;
    this.length = at;
    return new BlockWidgetView(this.widget, len, this.type);
  }
  get children() {
    return none$1;
  }
  sync() {
    if (!this.dom || !this.widget.updateDOM(this.dom)) {
      this.setDOM(this.widget.toDOM(this.editorView));
      this.dom.contentEditable = "false";
    }
  }
  get overrideDOMText() {
    return this.parent ? this.parent.view.state.doc.slice(this.posAtStart, this.posAtEnd) : state_1.Text.empty;
  }
  domBoundsAround() {
    return null;
  }
  match(other) {
    if (other instanceof BlockWidgetView && other.type == this.type && other.widget.constructor == this.widget.constructor) {
      if (!other.widget.eq(this.widget)) this.markDirty(true);
      this.widget = other.widget;
      this.length = other.length;
      this.breakAfter = other.breakAfter;
      return true;
    }
    return false;
  }
  ignoreMutation() {
    return true;
  }
  ignoreEvent(event) {
    return this.widget.ignoreEvent(event);
  }
}
class ContentBuilder {
  constructor(doc, pos, end) {
    this.doc = doc;
    this.pos = pos;
    this.end = end;
    this.content = [];
    this.curLine = null;
    this.breakAtStart = 0;
    this.openStart = -1;
    this.openEnd = -1;
    this.text = "";
    this.textOff = 0;
    this.cursor = doc.iter();
    this.skip = pos;
  }
  posCovered() {
    if (this.content.length == 0) return !this.breakAtStart && this.doc.lineAt(this.pos).from != this.pos;
    let last = this.content[this.content.length - 1];
    return !last.breakAfter && !(last instanceof BlockWidgetView && last.type == BlockType.WidgetBefore);
  }
  getLine() {
    if (!this.curLine) this.content.push(this.curLine = new LineView());
    return this.curLine;
  }
  addWidget(view) {
    this.curLine = null;
    this.content.push(view);
  }
  finish() {
    if (!this.posCovered()) this.getLine();
  }
  wrapMarks(view, active) {
    for (let i = active.length - 1; i >= 0; i--) view = new MarkView(active[i], [view], view.length);
    return view;
  }
  buildText(length, active, openStart) {
    while (length > 0) {
      if (this.textOff == this.text.length) {
        let {value, lineBreak, done} = this.cursor.next(this.skip);
        this.skip = 0;
        if (done) throw new Error("Ran out of text content when drawing inline views");
        if (lineBreak) {
          if (!this.posCovered()) this.getLine();
          if (this.content.length) this.content[this.content.length - 1].breakAfter = 1; else this.breakAtStart = 1;
          this.curLine = null;
          length--;
          continue;
        } else {
          this.text = value;
          this.textOff = 0;
        }
      }
      let take = Math.min(this.text.length - this.textOff, length, 512);
      this.getLine().append(this.wrapMarks(new TextView(this.text.slice(this.textOff, this.textOff + take)), active), openStart);
      this.textOff += take;
      length -= take;
      openStart = 0;
    }
  }
  span(from, to, active, openStart) {
    this.buildText(to - from, active, openStart);
    this.pos = to;
    if (this.openStart < 0) this.openStart = openStart;
  }
  point(from, to, deco, active, openStart) {
    let len = to - from;
    if (deco instanceof PointDecoration) {
      if (deco.block) {
        let {type} = deco;
        if (type == BlockType.WidgetAfter && !this.posCovered()) this.getLine();
        this.addWidget(new BlockWidgetView(deco.widget || new NullWidget("div"), len, type));
      } else {
        let widget = this.wrapMarks(WidgetView.create(deco.widget || new NullWidget("span"), len, deco.startSide), active);
        this.getLine().append(widget, openStart);
      }
    } else if (this.doc.lineAt(this.pos).from == this.pos) {
      this.getLine().addLineDeco(deco);
    }
    if (len) {
      if (this.textOff + len <= this.text.length) {
        this.textOff += len;
      } else {
        this.skip += len - (this.text.length - this.textOff);
        this.text = "";
        this.textOff = 0;
      }
      this.pos = to;
    }
    if (this.openStart < 0) this.openStart = openStart;
  }
  static build(text, from, to, decorations) {
    let builder = new ContentBuilder(text, from, to);
    builder.openEnd = rangeset_1.RangeSet.spans(decorations, from, to, builder);
    if (builder.openStart < 0) builder.openStart = builder.openEnd;
    builder.finish();
    return builder;
  }
}
class NullWidget extends WidgetType {
  constructor(tag) {
    super();
    this.tag = tag;
  }
  eq(other) {
    return other.tag == this.tag;
  }
  toDOM() {
    return document.createElement(this.tag);
  }
  updateDOM(elt) {
    return elt.nodeName.toLowerCase() == this.tag;
  }
}
const none = [];
const clickAddsSelectionRange = state_1.Facet.define();
const dragMovesSelection$1 = state_1.Facet.define();
const mouseSelectionStyle = state_1.Facet.define();
const exceptionSink = state_1.Facet.define();
const updateListener = state_1.Facet.define();
const inputHandler = state_1.Facet.define();
function logException(state, exception, context) {
  let handler = state.facet(exceptionSink);
  if (handler.length) handler[0](exception); else if (window.onerror) window.onerror(String(exception), context, undefined, undefined, exception); else if (context) console.error(context + ":", exception); else console.error(exception);
}
const editable = state_1.Facet.define({
  combine: values => values.length ? values[0] : true
});
class PluginFieldProvider {
  constructor(field, get) {
    this.field = field;
    this.get = get;
  }
}
class PluginField {
  from(get) {
    return new PluginFieldProvider(this, get);
  }
  static define() {
    return new PluginField();
  }
}
PluginField.decorations = PluginField.define();
PluginField.scrollMargins = PluginField.define();
let nextPluginID = 0;
const viewPlugin = state_1.Facet.define();
class ViewPlugin {
  constructor(id, create, fields) {
    this.id = id;
    this.create = create;
    this.fields = fields;
    this.extension = viewPlugin.of(this);
  }
  static define(create, spec) {
    let {eventHandlers, provide, decorations} = spec || ({});
    let fields = [];
    if (provide) for (let provider of Array.isArray(provide) ? provide : [provide]) fields.push(provider);
    if (eventHandlers) fields.push(domEventHandlers.from(value => ({
      plugin: value,
      handlers: eventHandlers
    })));
    if (decorations) fields.push(PluginField.decorations.from(decorations));
    return new ViewPlugin(nextPluginID++, create, fields);
  }
  static fromClass(cls, spec) {
    return ViewPlugin.define(view => new cls(view), spec);
  }
}
const domEventHandlers = PluginField.define();
class PluginInstance {
  constructor(spec) {
    this.spec = spec;
    this.mustUpdate = null;
    this.value = null;
  }
  takeField(type, target) {
    for (let {field, get} of this.spec.fields) if (field == type) target.push(get(this.value));
  }
  update(view) {
    if (!this.value) {
      try {
        this.value = this.spec.create(view);
      } catch (e) {
        logException(view.state, e, "CodeMirror plugin crashed");
        return PluginInstance.dummy;
      }
    } else if (this.mustUpdate) {
      let update = this.mustUpdate;
      this.mustUpdate = null;
      if (!this.value.update) return this;
      try {
        this.value.update(update);
      } catch (e) {
        logException(update.state, e, "CodeMirror plugin crashed");
        if (this.value.destroy) try {
          this.value.destroy();
        } catch (_) {}
        return PluginInstance.dummy;
      }
    }
    return this;
  }
  destroy(view) {
    var _a;
    if ((_a = this.value) === null || _a === void 0 ? void 0 : _a.destroy) {
      try {
        this.value.destroy();
      } catch (e) {
        logException(view.state, e, "CodeMirror plugin crashed");
      }
    }
  }
}
PluginInstance.dummy = new PluginInstance(ViewPlugin.define(() => ({})));
const editorAttributes = state_1.Facet.define({
  combine: values => values.reduce((a, b) => combineAttrs(b, a), {})
});
const contentAttributes = state_1.Facet.define({
  combine: values => values.reduce((a, b) => combineAttrs(b, a), {})
});
const decorations = state_1.Facet.define();
const styleModule = state_1.Facet.define();
class ChangedRange {
  constructor(fromA, toA, fromB, toB) {
    this.fromA = fromA;
    this.toA = toA;
    this.fromB = fromB;
    this.toB = toB;
  }
  join(other) {
    return new ChangedRange(Math.min(this.fromA, other.fromA), Math.max(this.toA, other.toA), Math.min(this.fromB, other.fromB), Math.max(this.toB, other.toB));
  }
  addToSet(set) {
    let i = set.length, me = this;
    for (; i > 0; i--) {
      let range = set[i - 1];
      if (range.fromA > me.toA) continue;
      if (range.toA < me.fromA) break;
      me = me.join(range);
      set.splice(i - 1, 1);
    }
    set.splice(i, 0, me);
    return set;
  }
  static extendWithRanges(diff, ranges) {
    if (ranges.length == 0) return diff;
    let result = [];
    for (let dI = 0, rI = 0, posA = 0, posB = 0; ; dI++) {
      let next = dI == diff.length ? null : diff[dI], off = posA - posB;
      let end = next ? next.fromB : 1e9;
      while (rI < ranges.length && ranges[rI] < end) {
        let from = ranges[rI], to = ranges[rI + 1];
        let fromB = Math.max(posB, from), toB = Math.min(end, to);
        if (fromB <= toB) new ChangedRange(fromB + off, toB + off, fromB, toB).addToSet(result);
        if (to > end) break; else rI += 2;
      }
      if (!next) return result;
      new ChangedRange(next.fromA, next.toA, next.fromB, next.toB).addToSet(result);
      posA = next.toA;
      posB = next.toB;
    }
  }
}
class ViewUpdate {
  constructor(view, state, transactions = none) {
    this.view = view;
    this.state = state;
    this.transactions = transactions;
    this.flags = 0;
    this.startState = view.state;
    this.changes = state_1.ChangeSet.empty(this.startState.doc.length);
    for (let tr of transactions) this.changes = this.changes.compose(tr.changes);
    let changedRanges = [];
    this.changes.iterChangedRanges((fromA, toA, fromB, toB) => changedRanges.push(new ChangedRange(fromA, toA, fromB, toB)));
    this.changedRanges = changedRanges;
    let focus = view.hasFocus;
    if (focus != view.inputState.notifiedFocused) {
      view.inputState.notifiedFocused = focus;
      this.flags |= 1;
    }
    if (this.docChanged) this.flags |= 2;
  }
  get viewportChanged() {
    return (this.flags & 4) > 0;
  }
  get heightChanged() {
    return (this.flags & 2) > 0;
  }
  get geometryChanged() {
    return this.docChanged || (this.flags & (16 | 2)) > 0;
  }
  get focusChanged() {
    return (this.flags & 1) > 0;
  }
  get docChanged() {
    return this.transactions.some(tr => tr.docChanged);
  }
  get selectionSet() {
    return this.transactions.some(tr => tr.selection);
  }
  get empty() {
    return this.flags == 0 && this.transactions.length == 0;
  }
}
class DocView extends ContentView {
  constructor(view) {
    super();
    this.view = view;
    this.compositionDeco = Decoration.none;
    this.decorations = [];
    this.minWidth = 0;
    this.minWidthFrom = 0;
    this.minWidthTo = 0;
    this.impreciseAnchor = null;
    this.impreciseHead = null;
    this.setDOM(view.contentDOM);
    this.children = [new LineView()];
    this.children[0].setParent(this);
    this.updateInner([new ChangedRange(0, 0, 0, view.state.doc.length)], this.updateDeco(), 0);
  }
  get root() {
    return this.view.root;
  }
  get editorView() {
    return this.view;
  }
  get length() {
    return this.view.state.doc.length;
  }
  update(update) {
    let changedRanges = update.changedRanges;
    if (this.minWidth > 0 && changedRanges.length) {
      if (!changedRanges.every(({fromA, toA}) => toA < this.minWidthFrom || fromA > this.minWidthTo)) {
        this.minWidth = 0;
      } else {
        this.minWidthFrom = update.changes.mapPos(this.minWidthFrom, 1);
        this.minWidthTo = update.changes.mapPos(this.minWidthTo, 1);
      }
    }
    if (this.view.inputState.composing < 0) this.compositionDeco = Decoration.none; else if (update.transactions.length) this.compositionDeco = computeCompositionDeco(this.view, update.changes);
    let forceSelection = (browser.ie || browser.chrome) && !this.compositionDeco.size && update && update.state.doc.lines != update.startState.doc.lines;
    let prevDeco = this.decorations, deco = this.updateDeco();
    let decoDiff = findChangedDeco(prevDeco, deco, update.changes);
    changedRanges = ChangedRange.extendWithRanges(changedRanges, decoDiff);
    let pointerSel = update.transactions.some(tr => tr.annotation(state_1.Transaction.userEvent) == "pointerselection");
    if (this.dirty == 0 && changedRanges.length == 0 && !(update.flags & (4 | 8)) && update.state.selection.main.from >= this.view.viewport.from && update.state.selection.main.to <= this.view.viewport.to) {
      this.updateSelection(forceSelection, pointerSel);
      return false;
    } else {
      this.updateInner(changedRanges, deco, update.startState.doc.length, forceSelection, pointerSel);
      return true;
    }
  }
  updateInner(changes, deco, oldLength, forceSelection = false, pointerSel = false) {
    this.updateChildren(changes, deco, oldLength);
    this.view.observer.ignore(() => {
      this.dom.style.height = this.view.viewState.domHeight + "px";
      this.dom.style.minWidth = this.minWidth ? this.minWidth + "px" : "";
      let track = browser.chrome ? {
        node: getSelection(this.view.root).focusNode,
        written: false
      } : undefined;
      this.sync(track);
      this.dirty = 0;
      if (track === null || track === void 0 ? void 0 : track.written) forceSelection = true;
      this.updateSelection(forceSelection, pointerSel);
      this.dom.style.height = "";
    });
  }
  updateChildren(changes, deco, oldLength) {
    let cursor = this.childCursor(oldLength);
    for (let i = changes.length - 1; ; i--) {
      let next = i >= 0 ? changes[i] : null;
      if (!next) break;
      let {fromA, toA, fromB, toB} = next;
      let {content, breakAtStart, openStart, openEnd} = ContentBuilder.build(this.view.state.doc, fromB, toB, deco);
      let {i: toI, off: toOff} = cursor.findPos(toA, 1);
      let {i: fromI, off: fromOff} = cursor.findPos(fromA, -1);
      this.replaceRange(fromI, fromOff, toI, toOff, content, breakAtStart, openStart, openEnd);
    }
  }
  replaceRange(fromI, fromOff, toI, toOff, content, breakAtStart, openStart, openEnd) {
    let before = this.children[fromI], last = content.length ? content[content.length - 1] : null;
    let breakAtEnd = last ? last.breakAfter : breakAtStart;
    if (fromI == toI && !breakAtStart && !breakAtEnd && content.length < 2 && before.merge(fromOff, toOff, content.length ? last : null, fromOff == 0, openStart, openEnd)) return;
    let after = this.children[toI];
    if (toOff < after.length || after.children.length && after.children[after.children.length - 1].length == 0) {
      if (fromI == toI) {
        after = after.split(toOff);
        toOff = 0;
      }
      if (!breakAtEnd && last && after.merge(0, toOff, last, true, 0, openEnd)) {
        content[content.length - 1] = after;
      } else {
        if (toOff || after.children.length && after.children[0].length == 0) after.merge(0, toOff, null, false, 0, openEnd);
        content.push(after);
      }
    } else if (after.breakAfter) {
      if (last) last.breakAfter = 1; else breakAtStart = 1;
    }
    toI++;
    before.breakAfter = breakAtStart;
    if (fromOff > 0) {
      if (!breakAtStart && content.length && before.merge(fromOff, before.length, content[0], false, openStart, 0)) {
        before.breakAfter = content.shift().breakAfter;
      } else if (fromOff < before.length || before.children.length && before.children[before.children.length - 1].length == 0) {
        before.merge(fromOff, before.length, null, false, openStart, 0);
      }
      fromI++;
    }
    while (fromI < toI && content.length) {
      if (this.children[toI - 1].match(content[content.length - 1])) (toI--, content.pop()); else if (this.children[fromI].match(content[0])) (fromI++, content.shift()); else break;
    }
    if (fromI < toI || content.length) this.replaceChildren(fromI, toI, content);
  }
  updateSelection(force = false, fromPointer = false) {
    if (!(fromPointer || this.mayControlSelection())) return;
    let main = this.view.state.selection.main;
    let anchor = this.domAtPos(main.anchor);
    let head = main.empty ? anchor : this.domAtPos(main.head);
    if (browser.gecko && main.empty && betweenUneditable(anchor)) {
      let dummy = document.createTextNode("");
      this.view.observer.ignore(() => anchor.node.insertBefore(dummy, anchor.node.childNodes[anchor.offset] || null));
      anchor = head = new DOMPos(dummy, 0);
      force = true;
    }
    let domSel = getSelection(this.root);
    if (force || !domSel.focusNode || browser.gecko && main.empty && nextToUneditable(domSel.focusNode, domSel.focusOffset) || !isEquivalentPosition(anchor.node, anchor.offset, domSel.anchorNode, domSel.anchorOffset) || !isEquivalentPosition(head.node, head.offset, domSel.focusNode, domSel.focusOffset)) {
      this.view.observer.ignore(() => {
        if (main.empty) {
          if (browser.gecko) {
            let nextTo = nextToUneditable(anchor.node, anchor.offset);
            if (nextTo && nextTo != (1 | 2)) {
              let text = nearbyTextNode(anchor.node, anchor.offset, nextTo == 1 ? 1 : -1);
              if (text) anchor = new DOMPos(text, nextTo == 1 ? 0 : text.nodeValue.length);
            }
          }
          domSel.collapse(anchor.node, anchor.offset);
          if (main.bidiLevel != null && domSel.cursorBidiLevel != null) domSel.cursorBidiLevel = main.bidiLevel;
        } else if (domSel.extend) {
          domSel.collapse(anchor.node, anchor.offset);
          domSel.extend(head.node, head.offset);
        } else {
          let range = document.createRange();
          if (main.anchor > main.head) [anchor, head] = [head, anchor];
          range.setEnd(head.node, head.offset);
          range.setStart(anchor.node, anchor.offset);
          domSel.removeAllRanges();
          domSel.addRange(range);
        }
      });
    }
    this.impreciseAnchor = anchor.precise ? null : new DOMPos(domSel.anchorNode, domSel.anchorOffset);
    this.impreciseHead = head.precise ? null : new DOMPos(domSel.focusNode, domSel.focusOffset);
  }
  enforceCursorAssoc() {
    let cursor = this.view.state.selection.main;
    let sel = getSelection(this.root);
    if (!cursor.empty || !cursor.assoc || !sel.modify) return;
    let line = LineView.find(this, cursor.head);
    if (!line) return;
    let lineStart = line.posAtStart;
    if (cursor.head == lineStart || cursor.head == lineStart + line.length) return;
    let before = this.coordsAt(cursor.head, -1), after = this.coordsAt(cursor.head, 1);
    if (!before || !after || before.bottom > after.top) return;
    let dom = this.domAtPos(cursor.head + cursor.assoc);
    sel.collapse(dom.node, dom.offset);
    sel.modify("move", cursor.assoc < 0 ? "forward" : "backward", "lineboundary");
  }
  mayControlSelection() {
    return this.view.state.facet(editable) ? this.root.activeElement == this.dom : hasSelection(this.dom, getSelection(this.root));
  }
  nearest(dom) {
    for (let cur = dom; cur; ) {
      let domView = ContentView.get(cur);
      if (domView && domView.rootView == this) return domView;
      cur = cur.parentNode;
    }
    return null;
  }
  posFromDOM(node, offset) {
    let view = this.nearest(node);
    if (!view) throw new RangeError("Trying to find position for a DOM position outside of the document");
    return view.localPosFromDOM(node, offset) + view.posAtStart;
  }
  domAtPos(pos) {
    let {i, off} = this.childCursor().findPos(pos, -1);
    for (; i < this.children.length - 1; ) {
      let child = this.children[i];
      if (off < child.length || child instanceof LineView) break;
      i++;
      off = 0;
    }
    return this.children[i].domAtPos(off);
  }
  coordsAt(pos, side) {
    for (let off = this.length, i = this.children.length - 1; ; i--) {
      let child = this.children[i], start = off - child.breakAfter - child.length;
      if (pos > start || pos == start && (child.type == BlockType.Text || !i || this.children[i - 1].breakAfter)) return child.coordsAt(pos - start, side);
      off = start;
    }
  }
  measureVisibleLineHeights() {
    let result = [], {from, to} = this.view.viewState.viewport;
    let minWidth = Math.max(this.view.scrollDOM.clientWidth, this.minWidth) + 1;
    for (let pos = 0, i = 0; i < this.children.length; i++) {
      let child = this.children[i], end = pos + child.length;
      if (end > to) break;
      if (pos >= from) {
        result.push(child.dom.getBoundingClientRect().height);
        let width = child.dom.scrollWidth;
        if (width > minWidth) {
          this.minWidth = minWidth = width;
          this.minWidthFrom = pos;
          this.minWidthTo = end;
        }
      }
      pos = end + child.breakAfter;
    }
    return result;
  }
  measureTextSize() {
    for (let child of this.children) {
      if (child instanceof LineView) {
        let measure = child.measureTextSize();
        if (measure) return measure;
      }
    }
    let dummy = document.createElement("div"), lineHeight, charWidth;
    dummy.className = "cm-line";
    dummy.textContent = "abc def ghi jkl mno pqr stu";
    this.view.observer.ignore(() => {
      this.dom.appendChild(dummy);
      let rect = clientRectsFor(dummy.firstChild)[0];
      lineHeight = dummy.getBoundingClientRect().height;
      charWidth = rect ? rect.width / 27 : 7;
      dummy.remove();
    });
    return {
      lineHeight,
      charWidth
    };
  }
  childCursor(pos = this.length) {
    let i = this.children.length;
    if (i) pos -= this.children[--i].length;
    return new ChildCursor(this.children, pos, i);
  }
  computeBlockGapDeco() {
    let deco = [], vs = this.view.viewState;
    for (let pos = 0, i = 0; ; i++) {
      let next = i == vs.viewports.length ? null : vs.viewports[i];
      let end = next ? next.from - 1 : this.length;
      if (end > pos) {
        let height = vs.lineAt(end, 0).bottom - vs.lineAt(pos, 0).top;
        deco.push(Decoration.replace({
          widget: new BlockGapWidget(height),
          block: true,
          inclusive: true
        }).range(pos, end));
      }
      if (!next) break;
      pos = next.to + 1;
    }
    return Decoration.set(deco);
  }
  updateDeco() {
    return this.decorations = [this.computeBlockGapDeco(), this.view.viewState.lineGapDeco, this.compositionDeco, ...this.view.state.facet(decorations), ...this.view.pluginField(PluginField.decorations)];
  }
  scrollPosIntoView(pos, side) {
    let rect = this.coordsAt(pos, side);
    if (!rect) return;
    let mLeft = 0, mRight = 0, mTop = 0, mBottom = 0;
    for (let margins of this.view.pluginField(PluginField.scrollMargins)) if (margins) {
      let {left, right, top, bottom} = margins;
      if (left != null) mLeft = Math.max(mLeft, left);
      if (right != null) mRight = Math.max(mRight, right);
      if (top != null) mTop = Math.max(mTop, top);
      if (bottom != null) mBottom = Math.max(mBottom, bottom);
    }
    scrollRectIntoView(this.dom, {
      left: rect.left - mLeft,
      top: rect.top - mTop,
      right: rect.right + mRight,
      bottom: rect.bottom + mBottom
    });
  }
}
function betweenUneditable(pos) {
  return pos.node.nodeType == 1 && pos.node.firstChild && (pos.offset == 0 || pos.node.childNodes[pos.offset - 1].contentEditable == "false") && (pos.offset < pos.node.childNodes.length || pos.node.childNodes[pos.offset].contentEditable == "false");
}
class BlockGapWidget extends WidgetType {
  constructor(height) {
    super();
    this.height = height;
  }
  toDOM() {
    let elt = document.createElement("div");
    this.updateDOM(elt);
    return elt;
  }
  eq(other) {
    return other.height == this.height;
  }
  updateDOM(elt) {
    elt.style.height = this.height + "px";
    return true;
  }
  get estimatedHeight() {
    return this.height;
  }
}
function computeCompositionDeco(view, changes) {
  let sel = getSelection(view.root);
  let textNode = sel.focusNode && nearbyTextNode(sel.focusNode, sel.focusOffset, 0);
  if (!textNode) return Decoration.none;
  let cView = view.docView.nearest(textNode);
  let from, to, topNode = textNode;
  if (cView instanceof InlineView) {
    while (cView.parent instanceof InlineView) cView = cView.parent;
    from = cView.posAtStart;
    to = from + cView.length;
    topNode = cView.dom;
  } else if (cView instanceof LineView) {
    while (topNode.parentNode != cView.dom) topNode = topNode.parentNode;
    let prev = topNode.previousSibling;
    while (prev && !ContentView.get(prev)) prev = prev.previousSibling;
    from = to = prev ? ContentView.get(prev).posAtEnd : cView.posAtStart;
  } else {
    return Decoration.none;
  }
  let newFrom = changes.mapPos(from, 1), newTo = Math.max(newFrom, changes.mapPos(to, -1));
  let text = textNode.nodeValue, {state} = view;
  if (newTo - newFrom < text.length) {
    if (state.sliceDoc(newFrom, Math.min(state.doc.length, newFrom + text.length)) == text) newTo = newFrom + text.length; else if (state.sliceDoc(Math.max(0, newTo - text.length), newTo) == text) newFrom = newTo - text.length; else return Decoration.none;
  } else if (state.sliceDoc(newFrom, newTo) != text) {
    return Decoration.none;
  }
  return Decoration.set(Decoration.replace({
    widget: new CompositionWidget(topNode, textNode)
  }).range(newFrom, newTo));
}
class CompositionWidget extends WidgetType {
  constructor(top, text) {
    super();
    this.top = top;
    this.text = text;
  }
  eq(other) {
    return this.top == other.top && this.text == other.text;
  }
  toDOM() {
    return this.top;
  }
  ignoreEvent() {
    return false;
  }
  get customView() {
    return CompositionView;
  }
}
function nearbyTextNode(node, offset, side) {
  for (; ; ) {
    if (node.nodeType == 3) return node;
    if (node.nodeType == 1 && offset > 0 && side <= 0) {
      node = node.childNodes[offset - 1];
      offset = maxOffset(node);
    } else if (node.nodeType == 1 && offset < node.childNodes.length && side >= 0) {
      node = node.childNodes[offset];
      offset = 0;
    } else {
      return null;
    }
  }
}
function nextToUneditable(node, offset) {
  if (node.nodeType != 1) return 0;
  return (offset && node.childNodes[offset - 1].contentEditable == "false" ? 1 : 0) | (offset < node.childNodes.length && node.childNodes[offset].contentEditable == "false" ? 2 : 0);
}
class DecorationComparator$1 {
  constructor() {
    this.changes = [];
  }
  compareRange(from, to) {
    addRange(from, to, this.changes);
  }
  comparePoint(from, to) {
    addRange(from, to, this.changes);
  }
}
function findChangedDeco(a, b, diff) {
  let comp = new DecorationComparator$1();
  rangeset_1.RangeSet.compare(a, b, diff, comp);
  return comp.changes;
}
var Direction;
(function (Direction) {
  Direction[Direction["LTR"] = 0] = "LTR";
  Direction[Direction["RTL"] = 1] = "RTL";
})(Direction || (Direction = {}));
const LTR = Direction.LTR, RTL = Direction.RTL;
function dec(str) {
  let result = [];
  for (let i = 0; i < str.length; i++) result.push(1 << +str[i]);
  return result;
}
const LowTypes = dec("88888888888888888888888888888888888666888888787833333333337888888000000000000000000000000008888880000000000000000000000000088888888888888888888888888888888888887866668888088888663380888308888800000000000000000000000800000000000000000000000000000008");
const ArabicTypes = dec("4444448826627288999999999992222222222222222222222222222222222222222222222229999999999999999999994444444444644222822222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222999999949999999229989999223333333333");
function charType(ch) {
  return ch <= 0xf7 ? LowTypes[ch] : 0x590 <= ch && ch <= 0x5f4 ? 2 : 0x600 <= ch && ch <= 0x6f9 ? ArabicTypes[ch - 0x600] : 0x6ee <= ch && ch <= 0x8ac ? 4 : 0x2000 <= ch && ch <= 0x200b ? 256 : ch == 0x200c ? 256 : 1;
}
const BidiRE = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/;
class BidiSpan {
  constructor(from, to, level) {
    this.from = from;
    this.to = to;
    this.level = level;
  }
  get dir() {
    return this.level % 2 ? RTL : LTR;
  }
  side(end, dir) {
    return this.dir == dir == end ? this.to : this.from;
  }
  static find(order, index, level, assoc) {
    let maybe = -1;
    for (let i = 0; i < order.length; i++) {
      let span = order[i];
      if (span.from <= index && span.to >= index) {
        if (span.level == level) return i;
        if (maybe < 0 || (assoc != 0 ? assoc < 0 ? span.from < index : span.to > index : order[maybe].level > span.level)) maybe = i;
      }
    }
    if (maybe < 0) throw new RangeError("Index out of range");
    return maybe;
  }
}
const types = [];
function computeOrder(line, direction) {
  let len = line.length, outerType = direction == LTR ? 1 : 2;
  if (!line || outerType == 1 && !BidiRE.test(line)) return trivialOrder(len);
  for (let i = 0, prev = outerType, prevStrong = outerType; i < len; i++) {
    let type = charType(line.charCodeAt(i));
    if (type == 512) type = prev; else if (type == 8 && prevStrong == 4) type = 16;
    types[i] = type == 4 ? 2 : type;
    if (type & 7) prevStrong = type;
    prev = type;
  }
  for (let i = 0, prev = outerType, prevStrong = outerType; i < len; i++) {
    let type = types[i];
    if (type == 128) {
      if (i < len - 1 && prev == types[i + 1] && prev & 24) type = types[i] = prev; else types[i] = 256;
    } else if (type == 64) {
      let end = i + 1;
      while (end < len && types[end] == 64) end++;
      let replace = i && prev == 8 || end < len && types[end] == 8 ? prevStrong == 1 ? 1 : 8 : 256;
      for (let j = i; j < end; j++) types[j] = replace;
      i = end - 1;
    } else if (type == 8 && prevStrong == 1) {
      types[i] = 1;
    }
    prev = type;
    if (type & 7) prevStrong = type;
  }
  for (let i = 0; i < len; i++) {
    if (types[i] == 256) {
      let end = i + 1;
      while (end < len && types[end] == 256) end++;
      let beforeL = (i ? types[i - 1] : outerType) == 1;
      let afterL = (end < len ? types[end] : outerType) == 1;
      let replace = beforeL == afterL ? beforeL ? 1 : 2 : outerType;
      for (let j = i; j < end; j++) types[j] = replace;
      i = end - 1;
    }
  }
  let order = [];
  if (outerType == 1) {
    for (let i = 0; i < len; ) {
      let start = i, rtl = types[i++] != 1;
      while (i < len && rtl == (types[i] != 1)) i++;
      if (rtl) {
        for (let j = i; j > start; ) {
          let end = j, l = types[--j] != 2;
          while (j > start && l == (types[j - 1] != 2)) j--;
          order.push(new BidiSpan(j, end, l ? 2 : 1));
        }
      } else {
        order.push(new BidiSpan(start, i, 0));
      }
    }
  } else {
    for (let i = 0; i < len; ) {
      let start = i, rtl = types[i++] == 2;
      while (i < len && rtl == (types[i] == 2)) i++;
      order.push(new BidiSpan(start, i, rtl ? 1 : 2));
    }
  }
  return order;
}
function trivialOrder(length) {
  return [new BidiSpan(0, length, 0)];
}
let movedOver = "";
function moveVisually(line, order, dir, start, forward) {
  var _a;
  let startIndex = start.head - line.from, spanI = -1;
  if (startIndex == 0) {
    if (!forward || !line.length) return null;
    if (order[0].level != dir) {
      startIndex = order[0].side(false, dir);
      spanI = 0;
    }
  } else if (startIndex == line.length) {
    if (forward) return null;
    let last = order[order.length - 1];
    if (last.level != dir) {
      startIndex = last.side(true, dir);
      spanI = order.length - 1;
    }
  }
  if (spanI < 0) spanI = BidiSpan.find(order, startIndex, (_a = start.bidiLevel) !== null && _a !== void 0 ? _a : -1, start.assoc);
  let span = order[spanI];
  if (startIndex == span.side(forward, dir)) {
    span = order[spanI += forward ? 1 : -1];
    startIndex = span.side(!forward, dir);
  }
  let indexForward = forward == (span.dir == dir);
  let nextIndex = text_1.findClusterBreak(line.text, startIndex, indexForward);
  movedOver = line.text.slice(Math.min(startIndex, nextIndex), Math.max(startIndex, nextIndex));
  if (nextIndex != span.side(forward, dir)) return state_1.EditorSelection.cursor(nextIndex + line.from, indexForward ? -1 : 1, span.level);
  let nextSpan = spanI == (forward ? order.length - 1 : 0) ? null : order[spanI + (forward ? 1 : -1)];
  if (!nextSpan && span.level != dir) return state_1.EditorSelection.cursor(forward ? line.to : line.from, forward ? -1 : 1, dir);
  if (nextSpan && nextSpan.level < span.level) return state_1.EditorSelection.cursor(nextSpan.side(!forward, dir) + line.from, 0, nextSpan.level);
  return state_1.EditorSelection.cursor(nextIndex + line.from, 0, span.level);
}
function groupAt(state, pos, bias = 1) {
  let categorize = state.charCategorizer(pos);
  let line = state.doc.lineAt(pos), linePos = pos - line.from;
  if (line.length == 0) return state_1.EditorSelection.cursor(pos);
  if (linePos == 0) bias = 1; else if (linePos == line.length) bias = -1;
  let from = linePos, to = linePos;
  if (bias < 0) from = text_1.findClusterBreak(line.text, linePos, false); else to = text_1.findClusterBreak(line.text, linePos);
  let cat = categorize(line.text.slice(from, to));
  while (from > 0) {
    let prev = text_1.findClusterBreak(line.text, from, false);
    if (categorize(line.text.slice(prev, from)) != cat) break;
    from = prev;
  }
  while (to < line.length) {
    let next = text_1.findClusterBreak(line.text, to);
    if (categorize(line.text.slice(to, next)) != cat) break;
    to = next;
  }
  return state_1.EditorSelection.range(from + line.from, to + line.from);
}
function getdx(x, rect) {
  return rect.left > x ? rect.left - x : Math.max(0, x - rect.right);
}
function getdy(y, rect) {
  return rect.top > y ? rect.top - y : Math.max(0, y - rect.bottom);
}
function yOverlap(a, b) {
  return a.top < b.bottom - 1 && a.bottom > b.top + 1;
}
function upTop(rect, top) {
  return top < rect.top ? {
    top,
    left: rect.left,
    right: rect.right,
    bottom: rect.bottom
  } : rect;
}
function upBot(rect, bottom) {
  return bottom > rect.bottom ? {
    top: rect.top,
    left: rect.left,
    right: rect.right,
    bottom
  } : rect;
}
function domPosAtCoords(parent, x, y) {
  let closest, closestRect, closestX, closestY;
  let above, below, aboveRect, belowRect;
  for (let child = parent.firstChild; child; child = child.nextSibling) {
    let rects = clientRectsFor(child);
    for (let i = 0; i < rects.length; i++) {
      let rect = rects[i];
      if (closestRect && yOverlap(closestRect, rect)) rect = upTop(upBot(rect, closestRect.bottom), closestRect.top);
      let dx = getdx(x, rect), dy = getdy(y, rect);
      if (dx == 0 && dy == 0) return child.nodeType == 3 ? domPosInText(child, x, y) : domPosAtCoords(child, x, y);
      if (!closest || closestY > dy || closestY == dy && closestX > dx) {
        closest = child;
        closestRect = rect;
        closestX = dx;
        closestY = dy;
      }
      if (dx == 0) {
        if (y > rect.bottom && (!aboveRect || aboveRect.bottom < rect.bottom)) {
          above = child;
          aboveRect = rect;
        } else if (y < rect.top && (!belowRect || belowRect.top > rect.top)) {
          below = child;
          belowRect = rect;
        }
      } else if (aboveRect && yOverlap(aboveRect, rect)) {
        aboveRect = upBot(aboveRect, rect.bottom);
      } else if (belowRect && yOverlap(belowRect, rect)) {
        belowRect = upTop(belowRect, rect.top);
      }
    }
  }
  if (aboveRect && aboveRect.bottom >= y) {
    closest = above;
    closestRect = aboveRect;
  } else if (belowRect && belowRect.top <= y) {
    closest = below;
    closestRect = belowRect;
  }
  if (!closest) return {
    node: parent,
    offset: 0
  };
  let clipX = Math.max(closestRect.left, Math.min(closestRect.right, x));
  if (closest.nodeType == 3) return domPosInText(closest, clipX, y);
  if (!closestX && closest.contentEditable == "true") return domPosAtCoords(closest, clipX, y);
  let offset = Array.prototype.indexOf.call(parent.childNodes, closest) + (x >= (closestRect.left + closestRect.right) / 2 ? 1 : 0);
  return {
    node: parent,
    offset
  };
}
function domPosInText(node, x, y) {
  let len = node.nodeValue.length, range = tempRange();
  for (let i = 0; i < len; i++) {
    range.setEnd(node, i + 1);
    range.setStart(node, i);
    let rects = range.getClientRects();
    for (let j = 0; j < rects.length; j++) {
      let rect = rects[j];
      if (rect.top == rect.bottom) continue;
      if (rect.left - 1 <= x && rect.right + 1 >= x && rect.top - 1 <= y && rect.bottom + 1 >= y) {
        let right = x >= (rect.left + rect.right) / 2, after = right;
        if (browser.chrome || browser.gecko) {
          range.setEnd(node, i);
          let rectBefore = range.getBoundingClientRect();
          if (rectBefore.left == rect.right) after = !right;
        }
        return {
          node,
          offset: i + (after ? 1 : 0)
        };
      }
    }
  }
  return {
    node,
    offset: 0
  };
}
function posAtCoords(view, {x, y}, bias = -1) {
  let content = view.contentDOM.getBoundingClientRect(), block;
  let halfLine = view.defaultLineHeight / 2;
  for (let bounced = false; ; ) {
    block = view.blockAtHeight(y, content.top);
    if (block.top > y || block.bottom < y) {
      bias = block.top > y ? -1 : 1;
      y = Math.min(block.bottom - halfLine, Math.max(block.top + halfLine, y));
      if (bounced) return -1; else bounced = true;
    }
    if (block.type == BlockType.Text) break;
    y = bias > 0 ? block.bottom + halfLine : block.top - halfLine;
  }
  let lineStart = block.from;
  if (lineStart < view.viewport.from) return view.viewport.from == 0 ? 0 : null;
  if (lineStart > view.viewport.to) return view.viewport.to == view.state.doc.length ? view.state.doc.length : null;
  x = Math.max(content.left + 1, Math.min(content.right - 1, x));
  let root = view.root, element = root.elementFromPoint(x, y);
  let node, offset = -1;
  if (element && view.contentDOM.contains(element) && !(view.docView.nearest(element) instanceof WidgetView)) {
    if (root.caretPositionFromPoint) {
      let pos = root.caretPositionFromPoint(x, y);
      if (pos) ({offsetNode: node, offset} = pos);
    } else if (root.caretRangeFromPoint) {
      let range = root.caretRangeFromPoint(x, y);
      if (range) ({startContainer: node, startOffset: offset} = range);
    }
  }
  if (!node || !view.docView.dom.contains(node)) {
    let line = LineView.find(view.docView, lineStart);
    ({node, offset} = domPosAtCoords(line.dom, x, y));
  }
  return view.docView.posFromDOM(node, offset);
}
function moveToLineBoundary(view, start, forward, includeWrap) {
  let line = view.state.doc.lineAt(start.head);
  let coords = !includeWrap || !view.lineWrapping ? null : view.coordsAtPos(start.assoc < 0 && start.head > line.from ? start.head - 1 : start.head);
  if (coords) {
    let editorRect = view.dom.getBoundingClientRect();
    let pos = view.posAtCoords({
      x: forward == (view.textDirection == Direction.LTR) ? editorRect.right - 1 : editorRect.left + 1,
      y: (coords.top + coords.bottom) / 2
    });
    if (pos != null) return state_1.EditorSelection.cursor(pos, forward ? -1 : 1);
  }
  let lineView = LineView.find(view.docView, start.head);
  let end = lineView ? forward ? lineView.posAtEnd : lineView.posAtStart : forward ? line.to : line.from;
  return state_1.EditorSelection.cursor(end, forward ? -1 : 1);
}
function moveByChar(view, start, forward, by) {
  let line = view.state.doc.lineAt(start.head), spans = view.bidiSpans(line);
  for (let cur = start, check = null; ; ) {
    let next = moveVisually(line, spans, view.textDirection, cur, forward), char = movedOver;
    if (!next) {
      if (line.number == (forward ? view.state.doc.lines : 1)) return cur;
      char = "\n";
      line = view.state.doc.line(line.number + (forward ? 1 : -1));
      spans = view.bidiSpans(line);
      next = state_1.EditorSelection.cursor(forward ? line.from : line.to);
    }
    if (!check) {
      if (!by) return next;
      check = by(char);
    } else if (!check(char)) {
      return cur;
    }
    cur = next;
  }
}
function byGroup(view, pos, start) {
  let categorize = view.state.charCategorizer(pos);
  let cat = categorize(start);
  return next => {
    let nextCat = categorize(next);
    if (cat == state_1.CharCategory.Space) cat = nextCat;
    return cat == nextCat;
  };
}
function moveVertically(view, start, forward, distance) {
  var _a;
  let startPos = start.head, dir = forward ? 1 : -1;
  if (startPos == (forward ? view.state.doc.length : 0)) return state_1.EditorSelection.cursor(startPos);
  let startCoords = view.coordsAtPos(startPos);
  if (startCoords) {
    let rect = view.dom.getBoundingClientRect();
    let goal = (_a = start.goalColumn) !== null && _a !== void 0 ? _a : startCoords.left - rect.left;
    let resolvedGoal = rect.left + goal;
    let dist = distance !== null && distance !== void 0 ? distance : view.defaultLineHeight >> 1;
    for (let startY = dir < 0 ? startCoords.top : startCoords.bottom, extra = 0; extra < 50; extra += 10) {
      let pos = posAtCoords(view, {
        x: resolvedGoal,
        y: startY + (dist + extra) * dir
      }, dir);
      if (pos == null) break;
      if (pos != startPos) return state_1.EditorSelection.cursor(pos, undefined, undefined, goal);
    }
  }
  let {doc} = view.state, line = doc.lineAt(startPos), tabSize = view.state.tabSize;
  let goal = start.goalColumn, goalCol = 0;
  if (goal == null) {
    for (const iter = doc.iterRange(line.from, startPos); !iter.next().done; ) goalCol = text_1.countColumn(iter.value, goalCol, tabSize);
    goal = goalCol * view.defaultCharacterWidth;
  } else {
    goalCol = Math.round(goal / view.defaultCharacterWidth);
  }
  if (dir < 0 && line.from == 0) return state_1.EditorSelection.cursor(0); else if (dir > 0 && line.to == doc.length) return state_1.EditorSelection.cursor(line.to);
  let otherLine = doc.line(line.number + dir);
  let result = otherLine.from;
  let seen = 0;
  for (const iter = doc.iterRange(otherLine.from, otherLine.to); seen >= goalCol && !iter.next().done; ) {
    const {offset, leftOver} = text_1.findColumn(iter.value, seen, goalCol, tabSize);
    seen = goalCol - leftOver;
    result += offset;
  }
  return state_1.EditorSelection.cursor(result, undefined, undefined, goal);
}
class InputState {
  constructor(view) {
    this.lastKeyCode = 0;
    this.lastKeyTime = 0;
    this.lastSelectionOrigin = null;
    this.lastSelectionTime = 0;
    this.lastEscPress = 0;
    this.scrollHandlers = [];
    this.registeredEvents = [];
    this.customHandlers = [];
    this.composing = -1;
    this.compositionEndedAt = 0;
    this.mouseSelection = null;
    for (let type in handlers) {
      let handler = handlers[type];
      view.contentDOM.addEventListener(type, event => {
        if (!eventBelongsToEditor(view, event) || this.ignoreDuringComposition(event) || type == "keydown" && this.screenKeyEvent(view, event)) return;
        if (this.mustFlushObserver(event)) view.observer.forceFlush();
        if (this.runCustomHandlers(type, view, event)) event.preventDefault(); else handler(view, event);
      });
      this.registeredEvents.push(type);
    }
    view.contentDOM.addEventListener("keydown", event => {
      view.inputState.lastKeyCode = event.keyCode;
      view.inputState.lastKeyTime = Date.now();
    });
    this.notifiedFocused = view.hasFocus;
    this.ensureHandlers(view);
  }
  setSelectionOrigin(origin) {
    this.lastSelectionOrigin = origin;
    this.lastSelectionTime = Date.now();
  }
  ensureHandlers(view) {
    let handlers = this.customHandlers = view.pluginField(domEventHandlers);
    for (let set of handlers) {
      for (let type in set.handlers) if (this.registeredEvents.indexOf(type) < 0 && type != "scroll") {
        this.registeredEvents.push(type);
        view.contentDOM.addEventListener(type, event => {
          if (!eventBelongsToEditor(view, event)) return;
          if (this.runCustomHandlers(type, view, event)) event.preventDefault();
        });
      }
    }
  }
  runCustomHandlers(type, view, event) {
    for (let set of this.customHandlers) {
      let handler = set.handlers[type], handled = false;
      if (handler) {
        try {
          handled = handler.call(set.plugin, event, view);
        } catch (e) {
          logException(view.state, e);
        }
        if (handled || event.defaultPrevented) {
          if (browser.android && type == "keydown" && event.keyCode == 13) view.observer.flushSoon();
          return true;
        }
      }
    }
    return false;
  }
  runScrollHandlers(view, event) {
    for (let set of this.customHandlers) {
      let handler = set.handlers.scroll;
      if (handler) {
        try {
          handler.call(set.plugin, event, view);
        } catch (e) {
          logException(view.state, e);
        }
      }
    }
  }
  ignoreDuringComposition(event) {
    if (!(/^key/).test(event.type)) return false;
    if (this.composing > 0) return true;
    if (browser.safari && event.timeStamp - this.compositionEndedAt < 500) {
      this.compositionEndedAt = 0;
      return true;
    }
    return false;
  }
  screenKeyEvent(view, event) {
    let protectedTab = event.keyCode == 9 && Date.now() < this.lastEscPress + 2000;
    if (event.keyCode == 27) this.lastEscPress = Date.now(); else if (modifierCodes.indexOf(event.keyCode) < 0) this.lastEscPress = 0;
    return protectedTab;
  }
  mustFlushObserver(event) {
    return event.type == "keydown" && event.keyCode != 229 || event.type == "compositionend";
  }
  startMouseSelection(view, event, style) {
    if (this.mouseSelection) this.mouseSelection.destroy();
    this.mouseSelection = new MouseSelection(this, view, event, style);
  }
  update(update) {
    if (this.mouseSelection) this.mouseSelection.update(update);
    this.lastKeyCode = this.lastSelectionTime = 0;
  }
  destroy() {
    if (this.mouseSelection) this.mouseSelection.destroy();
  }
}
const modifierCodes = [16, 17, 18, 20, 91, 92, 224, 225];
class MouseSelection {
  constructor(inputState, view, startEvent, style) {
    this.inputState = inputState;
    this.view = view;
    this.startEvent = startEvent;
    this.style = style;
    let doc = view.contentDOM.ownerDocument;
    doc.addEventListener("mousemove", this.move = this.move.bind(this));
    doc.addEventListener("mouseup", this.up = this.up.bind(this));
    this.extend = startEvent.shiftKey;
    this.multiple = view.state.facet(state_1.EditorState.allowMultipleSelections) && addsSelectionRange(view, startEvent);
    this.dragMove = dragMovesSelection(view, startEvent);
    this.dragging = isInPrimarySelection(view, startEvent) ? null : false;
    if (this.dragging === false) {
      startEvent.preventDefault();
      this.select(startEvent);
    }
  }
  move(event) {
    if (event.buttons == 0) return this.destroy();
    if (this.dragging !== false) return;
    this.select(event);
  }
  up(event) {
    if (this.dragging == null) this.select(this.startEvent);
    if (!this.dragging) event.preventDefault();
    this.destroy();
  }
  destroy() {
    let doc = this.view.contentDOM.ownerDocument;
    doc.removeEventListener("mousemove", this.move);
    doc.removeEventListener("mouseup", this.up);
    this.inputState.mouseSelection = null;
  }
  select(event) {
    let selection = this.style.get(event, this.extend, this.multiple);
    if (!selection.eq(this.view.state.selection) || selection.main.assoc != this.view.state.selection.main.assoc) this.view.dispatch({
      selection,
      annotations: state_1.Transaction.userEvent.of("pointerselection"),
      scrollIntoView: true
    });
  }
  update(update) {
    if (update.docChanged && this.dragging) this.dragging = this.dragging.map(update.changes);
    this.style.update(update);
  }
}
function addsSelectionRange(view, event) {
  let facet = view.state.facet(clickAddsSelectionRange);
  return facet.length ? facet[0](event) : browser.mac ? event.metaKey : event.ctrlKey;
}
function dragMovesSelection(view, event) {
  let facet = view.state.facet(dragMovesSelection$1);
  return facet.length ? facet[0](event) : browser.mac ? !event.altKey : !event.ctrlKey;
}
function isInPrimarySelection(view, event) {
  let {main} = view.state.selection;
  if (main.empty) return false;
  let sel = getSelection(view.root);
  if (sel.rangeCount == 0) return true;
  let rects = sel.getRangeAt(0).getClientRects();
  for (let i = 0; i < rects.length; i++) {
    let rect = rects[i];
    if (rect.left <= event.clientX && rect.right >= event.clientX && rect.top <= event.clientY && rect.bottom >= event.clientY) return true;
  }
  return false;
}
function eventBelongsToEditor(view, event) {
  if (!event.bubbles) return true;
  if (event.defaultPrevented) return false;
  for (let node = event.target, cView; node != view.contentDOM; node = node.parentNode) if (!node || node.nodeType == 11 || (cView = ContentView.get(node)) && cView.ignoreEvent(event)) return false;
  return true;
}
const handlers = Object.create(null);
const brokenClipboardAPI = browser.ie && browser.ie_version < 15 || browser.ios && browser.webkit_version < 604;
function capturePaste(view) {
  let parent = view.dom.parentNode;
  if (!parent) return;
  let target = parent.appendChild(document.createElement("textarea"));
  target.style.cssText = "position: fixed; left: -10000px; top: 10px";
  target.focus();
  setTimeout(() => {
    view.focus();
    target.remove();
    doPaste(view, target.value);
  }, 50);
}
function doPaste(view, input) {
  let {state} = view, changes, i = 1, text = state.toText(input);
  let byLine = text.lines == state.selection.ranges.length;
  let linewise = lastLinewiseCopy && state.selection.ranges.every(r => r.empty) && lastLinewiseCopy == text.toString();
  if (linewise) {
    let lastLine = -1;
    changes = state.changeByRange(range => {
      let line = state.doc.lineAt(range.from);
      if (line.from == lastLine) return {
        range
      };
      lastLine = line.from;
      let insert = state.toText((byLine ? text.line(i++).text : input) + state.lineBreak);
      return {
        changes: {
          from: line.from,
          insert
        },
        range: state_1.EditorSelection.cursor(range.from + insert.length)
      };
    });
  } else if (byLine) {
    changes = state.changeByRange(range => {
      let line = text.line(i++);
      return {
        changes: {
          from: range.from,
          to: range.to,
          insert: line.text
        },
        range: state_1.EditorSelection.cursor(range.from + line.length)
      };
    });
  } else {
    changes = state.replaceSelection(text);
  }
  view.dispatch(changes, {
    annotations: state_1.Transaction.userEvent.of("paste"),
    scrollIntoView: true
  });
}
function mustCapture(event) {
  let mods = (event.ctrlKey ? 1 : 0) | (event.metaKey ? 8 : 0) | (event.altKey ? 2 : 0) | (event.shiftKey ? 4 : 0);
  let code = event.keyCode, macCtrl = browser.mac && mods == 1;
  return code == 8 || macCtrl && code == 72 || code == 46 || macCtrl && code == 68 || code == 27 || mods == (browser.mac ? 8 : 1) && (code == 66 || code == 73 || code == 89 || code == 90);
}
handlers.keydown = (view, event) => {
  if (mustCapture(event)) event.preventDefault();
  view.inputState.setSelectionOrigin("keyboardselection");
};
let lastTouch = 0;
function mouseLikeTouchEvent(e) {
  return e.touches.length == 1 && e.touches[0].radiusX <= 1 && e.touches[0].radiusY <= 1;
}
handlers.touchstart = (view, e) => {
  if (!mouseLikeTouchEvent(e)) lastTouch = Date.now();
  view.inputState.setSelectionOrigin("pointerselection");
};
handlers.touchmove = view => {
  view.inputState.setSelectionOrigin("pointerselection");
};
handlers.mousedown = (view, event) => {
  view.observer.flush();
  if (lastTouch > Date.now() - 2000) return;
  let style = null;
  for (let makeStyle of view.state.facet(mouseSelectionStyle)) {
    style = makeStyle(view, event);
    if (style) break;
  }
  if (!style && event.button == 0) style = basicMouseSelection(view, event);
  if (style) {
    if (view.root.activeElement != view.contentDOM) view.observer.ignore(() => focusPreventScroll(view.contentDOM));
    view.inputState.startMouseSelection(view, event, style);
  }
};
function rangeForClick(view, pos, bias, type) {
  if (type == 1) {
    return state_1.EditorSelection.cursor(pos, bias);
  } else if (type == 2) {
    return groupAt(view.state, pos, bias);
  } else {
    let line = LineView.find(view.docView, pos);
    if (line) return state_1.EditorSelection.range(line.posAtStart, line.posAtEnd);
    let {from, to} = view.state.doc.lineAt(pos);
    return state_1.EditorSelection.range(from, to);
  }
}
let insideY = (y, rect) => y >= rect.top && y <= rect.bottom;
let inside = (x, y, rect) => insideY(y, rect) && x >= rect.left && x <= rect.right;
function findPositionSide(view, pos, x, y) {
  let line = LineView.find(view.docView, pos);
  if (!line) return 1;
  let off = pos - line.posAtStart;
  if (off == 0) return 1;
  if (off == line.length) return -1;
  let before = line.coordsAt(off, -1);
  if (before && inside(x, y, before)) return -1;
  let after = line.coordsAt(off, 1);
  if (after && inside(x, y, after)) return 1;
  return before && insideY(y, before) ? -1 : 1;
}
function queryPos(view, event) {
  let pos = view.posAtCoords({
    x: event.clientX,
    y: event.clientY
  });
  if (pos == null) return null;
  return {
    pos,
    bias: findPositionSide(view, pos, event.clientX, event.clientY)
  };
}
const BadMouseDetail = browser.ie && browser.ie_version <= 11;
let lastMouseDown = null, lastMouseDownCount = 0;
function getClickType(event) {
  if (!BadMouseDetail) return event.detail;
  let last = lastMouseDown;
  lastMouseDown = event;
  return lastMouseDownCount = !last || last.timeStamp > Date.now() - 400 && Math.abs(last.clientX - event.clientX) < 2 && Math.abs(last.clientY - event.clientY) < 2 ? (lastMouseDownCount + 1) % 3 : 1;
}
function basicMouseSelection(view, event) {
  let start = queryPos(view, event), type = getClickType(event);
  let startSel = view.state.selection;
  let last = start, lastEvent = event;
  return {
    update(update) {
      if (update.changes) {
        if (start) start.pos = update.changes.mapPos(start.pos);
        startSel = startSel.map(update.changes);
      }
    },
    get(event, extend, multiple) {
      let cur;
      if (event.clientX == lastEvent.clientX && event.clientY == lastEvent.clientY) cur = last; else {
        cur = last = queryPos(view, event);
        lastEvent = event;
      }
      if (!cur || !start) return startSel;
      let range = rangeForClick(view, cur.pos, cur.bias, type);
      if (start.pos != cur.pos && !extend) {
        let startRange = rangeForClick(view, start.pos, start.bias, type);
        let from = Math.min(startRange.from, range.from), to = Math.max(startRange.to, range.to);
        range = from < range.from ? state_1.EditorSelection.range(from, to) : state_1.EditorSelection.range(to, from);
      }
      if (extend) return startSel.replaceRange(startSel.main.extend(range.from, range.to)); else if (multiple) return startSel.addRange(range); else return state_1.EditorSelection.create([range]);
    }
  };
}
handlers.dragstart = (view, event) => {
  let {selection: {main}} = view.state;
  let {mouseSelection} = view.inputState;
  if (mouseSelection) mouseSelection.dragging = main;
  if (event.dataTransfer) {
    event.dataTransfer.setData("Text", view.state.sliceDoc(main.from, main.to));
    event.dataTransfer.effectAllowed = "copyMove";
  }
};
handlers.drop = (view, event) => {
  if (!event.dataTransfer) return;
  let dropPos = view.posAtCoords({
    x: event.clientX,
    y: event.clientY
  });
  let text = event.dataTransfer.getData("Text");
  if (dropPos == null || !text) return;
  event.preventDefault();
  let {mouseSelection} = view.inputState;
  let del = mouseSelection && mouseSelection.dragging && mouseSelection.dragMove ? {
    from: mouseSelection.dragging.from,
    to: mouseSelection.dragging.to
  } : null;
  let ins = {
    from: dropPos,
    insert: text
  };
  let changes = view.state.changes(del ? [del, ins] : ins);
  view.focus();
  view.dispatch({
    changes,
    selection: {
      anchor: changes.mapPos(dropPos, -1),
      head: changes.mapPos(dropPos, 1)
    },
    annotations: state_1.Transaction.userEvent.of("drop")
  });
};
handlers.paste = (view, event) => {
  view.observer.flush();
  let data = brokenClipboardAPI ? null : event.clipboardData;
  let text = data && data.getData("text/plain");
  if (text) {
    doPaste(view, text);
    event.preventDefault();
  } else {
    capturePaste(view);
  }
};
function captureCopy(view, text) {
  let parent = view.dom.parentNode;
  if (!parent) return;
  let target = parent.appendChild(document.createElement("textarea"));
  target.style.cssText = "position: fixed; left: -10000px; top: 10px";
  target.value = text;
  target.focus();
  target.selectionEnd = text.length;
  target.selectionStart = 0;
  setTimeout(() => {
    target.remove();
    view.focus();
  }, 50);
}
function copiedRange(state) {
  let content = [], ranges = [], linewise = false;
  for (let range of state.selection.ranges) if (!range.empty) {
    content.push(state.sliceDoc(range.from, range.to));
    ranges.push(range);
  }
  if (!content.length) {
    let upto = -1;
    for (let {from} of state.selection.ranges) {
      let line = state.doc.lineAt(from);
      if (line.number > upto) {
        content.push(line.text);
        ranges.push({
          from: line.from,
          to: Math.min(state.doc.length, line.to + 1)
        });
      }
      upto = line.number;
    }
    linewise = true;
  }
  return {
    text: content.join(state.lineBreak),
    ranges,
    linewise
  };
}
let lastLinewiseCopy = null;
handlers.copy = handlers.cut = (view, event) => {
  let {text, ranges, linewise} = copiedRange(view.state);
  if (!text) return;
  lastLinewiseCopy = linewise ? text : null;
  let data = brokenClipboardAPI ? null : event.clipboardData;
  if (data) {
    event.preventDefault();
    data.clearData();
    data.setData("text/plain", text);
  } else {
    captureCopy(view, text);
  }
  if (event.type == "cut") view.dispatch({
    changes: ranges,
    scrollIntoView: true,
    annotations: state_1.Transaction.userEvent.of("cut")
  });
};
handlers.focus = handlers.blur = view => {
  setTimeout(() => {
    if (view.hasFocus != view.inputState.notifiedFocused) view.update([]);
  }, 10);
};
handlers.beforeprint = view => {
  view.viewState.printing = true;
  view.requestMeasure();
  setTimeout(() => {
    view.viewState.printing = false;
    view.requestMeasure();
  }, 2000);
};
function forceClearComposition(view) {
  if (view.docView.compositionDeco.size) view.update([]);
}
handlers.compositionstart = handlers.compositionupdate = view => {
  if (view.inputState.composing < 0) {
    if (view.docView.compositionDeco.size) {
      view.observer.flush();
      forceClearComposition(view);
    }
    view.inputState.composing = 0;
  }
};
handlers.compositionend = view => {
  view.inputState.composing = -1;
  view.inputState.compositionEndedAt = Date.now();
  setTimeout(() => {
    if (view.inputState.composing < 0) forceClearComposition(view);
  }, 50);
};
const wrappingWhiteSpace = ["pre-wrap", "normal", "pre-line"];
class HeightOracle {
  constructor() {
    this.doc = text_1.Text.empty;
    this.lineWrapping = false;
    this.direction = Direction.LTR;
    this.heightSamples = {};
    this.lineHeight = 14;
    this.charWidth = 7;
    this.lineLength = 30;
    this.heightChanged = false;
  }
  heightForGap(from, to) {
    let lines = this.doc.lineAt(to).number - this.doc.lineAt(from).number + 1;
    if (this.lineWrapping) lines += Math.ceil((to - from - lines * this.lineLength * 0.5) / this.lineLength);
    return this.lineHeight * lines;
  }
  heightForLine(length) {
    if (!this.lineWrapping) return this.lineHeight;
    let lines = 1 + Math.max(0, Math.ceil((length - this.lineLength) / (this.lineLength - 5)));
    return lines * this.lineHeight;
  }
  setDoc(doc) {
    this.doc = doc;
    return this;
  }
  mustRefresh(lineHeights, whiteSpace, direction) {
    let newHeight = false;
    for (let i = 0; i < lineHeights.length; i++) {
      let h = lineHeights[i];
      if (h < 0) {
        i++;
      } else if (!this.heightSamples[Math.floor(h * 10)]) {
        newHeight = true;
        this.heightSamples[Math.floor(h * 10)] = true;
      }
    }
    return newHeight || wrappingWhiteSpace.indexOf(whiteSpace) > -1 != this.lineWrapping || this.direction != direction;
  }
  refresh(whiteSpace, direction, lineHeight, charWidth, lineLength, knownHeights) {
    let lineWrapping = wrappingWhiteSpace.indexOf(whiteSpace) > -1;
    let changed = Math.round(lineHeight) != Math.round(this.lineHeight) || this.lineWrapping != lineWrapping || this.direction != direction;
    this.lineWrapping = lineWrapping;
    this.direction = direction;
    this.lineHeight = lineHeight;
    this.charWidth = charWidth;
    this.lineLength = lineLength;
    if (changed) {
      this.heightSamples = {};
      for (let i = 0; i < knownHeights.length; i++) {
        let h = knownHeights[i];
        if (h < 0) i++; else this.heightSamples[Math.floor(h * 10)] = true;
      }
    }
    return changed;
  }
}
class MeasuredHeights {
  constructor(from, heights) {
    this.from = from;
    this.heights = heights;
    this.index = 0;
  }
  get more() {
    return this.index < this.heights.length;
  }
}
class BlockInfo {
  constructor(from, length, top, height, type) {
    this.from = from;
    this.length = length;
    this.top = top;
    this.height = height;
    this.type = type;
  }
  get to() {
    return this.from + this.length;
  }
  get bottom() {
    return this.top + this.height;
  }
  join(other) {
    let detail = (Array.isArray(this.type) ? this.type : [this]).concat(Array.isArray(other.type) ? other.type : [other]);
    return new BlockInfo(this.from, this.length + other.length, this.top, this.height + other.height, detail);
  }
}
var QueryType;
(function (QueryType) {
  QueryType[QueryType["ByPos"] = 0] = "ByPos";
  QueryType[QueryType["ByHeight"] = 1] = "ByHeight";
  QueryType[QueryType["ByPosNoHeight"] = 2] = "ByPosNoHeight";
})(QueryType || (QueryType = {}));
const Epsilon = 1e-4;
class HeightMap {
  constructor(length, height, flags = 2) {
    this.length = length;
    this.height = height;
    this.flags = flags;
  }
  get outdated() {
    return (this.flags & 2) > 0;
  }
  set outdated(value) {
    this.flags = (value ? 2 : 0) | this.flags & ~2;
  }
  setHeight(oracle, height) {
    if (this.height != height) {
      if (Math.abs(this.height - height) > Epsilon) oracle.heightChanged = true;
      this.height = height;
    }
  }
  replace(_from, _to, nodes) {
    return HeightMap.of(nodes);
  }
  decomposeLeft(_to, result) {
    result.push(this);
  }
  decomposeRight(_from, result) {
    result.push(this);
  }
  applyChanges(decorations, oldDoc, oracle, changes) {
    let me = this;
    for (let i = changes.length - 1; i >= 0; i--) {
      let {fromA, toA, fromB, toB} = changes[i];
      let start = me.lineAt(fromA, QueryType.ByPosNoHeight, oldDoc, 0, 0);
      let end = start.to >= toA ? start : me.lineAt(toA, QueryType.ByPosNoHeight, oldDoc, 0, 0);
      toB += end.to - toA;
      toA = end.to;
      while (i > 0 && start.from <= changes[i - 1].toA) {
        fromA = changes[i - 1].fromA;
        fromB = changes[i - 1].fromB;
        i--;
        if (fromA < start.from) start = me.lineAt(fromA, QueryType.ByPosNoHeight, oldDoc, 0, 0);
      }
      fromB += start.from - fromA;
      fromA = start.from;
      let nodes = NodeBuilder.build(oracle, decorations, fromB, toB);
      me = me.replace(fromA, toA, nodes);
    }
    return me.updateHeight(oracle, 0);
  }
  static empty() {
    return new HeightMapText(0, 0);
  }
  static of(nodes) {
    if (nodes.length == 1) return nodes[0];
    let i = 0, j = nodes.length, before = 0, after = 0;
    for (; ; ) {
      if (i == j) {
        if (before > after * 2) {
          let split = nodes[i - 1];
          if (split.break) nodes.splice(--i, 1, split.left, null, split.right); else nodes.splice(--i, 1, split.left, split.right);
          j += 1 + split.break;
          before -= split.size;
        } else if (after > before * 2) {
          let split = nodes[j];
          if (split.break) nodes.splice(j, 1, split.left, null, split.right); else nodes.splice(j, 1, split.left, split.right);
          j += 2 + split.break;
          after -= split.size;
        } else {
          break;
        }
      } else if (before < after) {
        let next = nodes[i++];
        if (next) before += next.size;
      } else {
        let next = nodes[--j];
        if (next) after += next.size;
      }
    }
    let brk = 0;
    if (nodes[i - 1] == null) {
      brk = 1;
      i--;
    } else if (nodes[i] == null) {
      brk = 1;
      j++;
    }
    return new HeightMapBranch(HeightMap.of(nodes.slice(0, i)), brk, HeightMap.of(nodes.slice(j)));
  }
}
HeightMap.prototype.size = 1;
class HeightMapBlock extends HeightMap {
  constructor(length, height, type) {
    super(length, height);
    this.type = type;
  }
  blockAt(_height, _doc, top, offset) {
    return new BlockInfo(offset, this.length, top, this.height, this.type);
  }
  lineAt(_value, _type, doc, top, offset) {
    return this.blockAt(0, doc, top, offset);
  }
  forEachLine(_from, _to, doc, top, offset, f) {
    f(this.blockAt(0, doc, top, offset));
  }
  updateHeight(oracle, offset = 0, _force = false, measured) {
    if (measured && measured.from <= offset && measured.more) this.setHeight(oracle, measured.heights[measured.index++]);
    this.outdated = false;
    return this;
  }
  toString() {
    return `block(${this.length})`;
  }
}
class HeightMapText extends HeightMapBlock {
  constructor(length, height) {
    super(length, height, BlockType.Text);
    this.collapsed = 0;
    this.widgetHeight = 0;
  }
  replace(_from, _to, nodes) {
    let node = nodes[0];
    if (nodes.length == 1 && (node instanceof HeightMapText || node instanceof HeightMapGap && node.flags & 4) && Math.abs(this.length - node.length) < 10) {
      if (node instanceof HeightMapGap) node = new HeightMapText(node.length, this.height); else node.height = this.height;
      if (!this.outdated) node.outdated = false;
      return node;
    } else {
      return HeightMap.of(nodes);
    }
  }
  updateHeight(oracle, offset = 0, force = false, measured) {
    if (measured && measured.from <= offset && measured.more) this.setHeight(oracle, measured.heights[measured.index++]); else if (force || this.outdated) this.setHeight(oracle, Math.max(this.widgetHeight, oracle.heightForLine(this.length - this.collapsed)));
    this.outdated = false;
    return this;
  }
  toString() {
    return `line(${this.length}${this.collapsed ? -this.collapsed : ""}${this.widgetHeight ? ":" + this.widgetHeight : ""})`;
  }
}
class HeightMapGap extends HeightMap {
  constructor(length) {
    super(length, 0);
  }
  lines(doc, offset) {
    let firstLine = doc.lineAt(offset).number, lastLine = doc.lineAt(offset + this.length).number;
    return {
      firstLine,
      lastLine,
      lineHeight: this.height / (lastLine - firstLine + 1)
    };
  }
  blockAt(height, doc, top, offset) {
    let {firstLine, lastLine, lineHeight} = this.lines(doc, offset);
    let line = Math.max(0, Math.min(lastLine - firstLine, Math.floor((height - top) / lineHeight)));
    let {from, length} = doc.line(firstLine + line);
    return new BlockInfo(from, length, top + lineHeight * line, lineHeight, BlockType.Text);
  }
  lineAt(value, type, doc, top, offset) {
    if (type == QueryType.ByHeight) return this.blockAt(value, doc, top, offset);
    if (type == QueryType.ByPosNoHeight) {
      let {from, to} = doc.lineAt(value);
      return new BlockInfo(from, to - from, 0, 0, BlockType.Text);
    }
    let {firstLine, lineHeight} = this.lines(doc, offset);
    let {from, length, number} = doc.lineAt(value);
    return new BlockInfo(from, length, top + lineHeight * (number - firstLine), lineHeight, BlockType.Text);
  }
  forEachLine(from, to, doc, top, offset, f) {
    let {firstLine, lineHeight} = this.lines(doc, offset);
    for (let pos = Math.max(from, offset), end = Math.min(offset + this.length, to); pos <= end; ) {
      let line = doc.lineAt(pos);
      if (pos == from) top += lineHeight * (line.number - firstLine);
      f(new BlockInfo(line.from, line.length, top, top += lineHeight, BlockType.Text));
      pos = line.to + 1;
    }
  }
  replace(from, to, nodes) {
    let after = this.length - to;
    if (after > 0) {
      let last = nodes[nodes.length - 1];
      if (last instanceof HeightMapGap) nodes[nodes.length - 1] = new HeightMapGap(last.length + after); else nodes.push(null, new HeightMapGap(after - 1));
    }
    if (from > 0) {
      let first = nodes[0];
      if (first instanceof HeightMapGap) nodes[0] = new HeightMapGap(from + first.length); else nodes.unshift(new HeightMapGap(from - 1), null);
    }
    return HeightMap.of(nodes);
  }
  decomposeLeft(to, result) {
    result.push(new HeightMapGap(to - 1), null);
  }
  decomposeRight(from, result) {
    result.push(null, new HeightMapGap(this.length - from - 1));
  }
  updateHeight(oracle, offset = 0, force = false, measured) {
    let end = offset + this.length;
    if (measured && measured.from <= offset + this.length && measured.more) {
      let nodes = [], pos = Math.max(offset, measured.from);
      if (measured.from > offset) nodes.push(new HeightMapGap(measured.from - offset - 1).updateHeight(oracle, offset));
      while (pos <= end && measured.more) {
        let len = oracle.doc.lineAt(pos).length;
        if (nodes.length) nodes.push(null);
        let line = new HeightMapText(len, measured.heights[measured.index++]);
        line.outdated = false;
        nodes.push(line);
        pos += len + 1;
      }
      if (pos <= end) nodes.push(null, new HeightMapGap(end - pos).updateHeight(oracle, pos));
      oracle.heightChanged = true;
      return HeightMap.of(nodes);
    } else if (force || this.outdated) {
      this.setHeight(oracle, oracle.heightForGap(offset, offset + this.length));
      this.outdated = false;
    }
    return this;
  }
  toString() {
    return `gap(${this.length})`;
  }
}
class HeightMapBranch extends HeightMap {
  constructor(left, brk, right) {
    super(left.length + brk + right.length, left.height + right.height, brk | (left.outdated || right.outdated ? 2 : 0));
    this.left = left;
    this.right = right;
    this.size = left.size + right.size;
  }
  get break() {
    return this.flags & 1;
  }
  blockAt(height, doc, top, offset) {
    let mid = top + this.left.height;
    return height < mid || this.right.height == 0 ? this.left.blockAt(height, doc, top, offset) : this.right.blockAt(height, doc, mid, offset + this.left.length + this.break);
  }
  lineAt(value, type, doc, top, offset) {
    let rightTop = top + this.left.height, rightOffset = offset + this.left.length + this.break;
    let left = type == QueryType.ByHeight ? value < rightTop || this.right.height == 0 : value < rightOffset;
    let base = left ? this.left.lineAt(value, type, doc, top, offset) : this.right.lineAt(value, type, doc, rightTop, rightOffset);
    if (this.break || (left ? base.to < rightOffset : base.from > rightOffset)) return base;
    let subQuery = type == QueryType.ByPosNoHeight ? QueryType.ByPosNoHeight : QueryType.ByPos;
    if (left) return base.join(this.right.lineAt(rightOffset, subQuery, doc, rightTop, rightOffset)); else return this.left.lineAt(rightOffset, subQuery, doc, top, offset).join(base);
  }
  forEachLine(from, to, doc, top, offset, f) {
    let rightTop = top + this.left.height, rightOffset = offset + this.left.length + this.break;
    if (this.break) {
      if (from < rightOffset) this.left.forEachLine(from, to, doc, top, offset, f);
      if (to >= rightOffset) this.right.forEachLine(from, to, doc, rightTop, rightOffset, f);
    } else {
      let mid = this.lineAt(rightOffset, QueryType.ByPos, doc, top, offset);
      if (from < mid.from) this.left.forEachLine(from, mid.from - 1, doc, top, offset, f);
      if (mid.to >= from && mid.from <= to) f(mid);
      if (to > mid.to) this.right.forEachLine(mid.to + 1, to, doc, rightTop, rightOffset, f);
    }
  }
  replace(from, to, nodes) {
    let rightStart = this.left.length + this.break;
    if (to < rightStart) return this.balanced(this.left.replace(from, to, nodes), this.right);
    if (from > this.left.length) return this.balanced(this.left, this.right.replace(from - rightStart, to - rightStart, nodes));
    let result = [];
    if (from > 0) this.decomposeLeft(from, result);
    let left = result.length;
    for (let node of nodes) result.push(node);
    if (from > 0) mergeGaps(result, left - 1);
    if (to < this.length) {
      let right = result.length;
      this.decomposeRight(to, result);
      mergeGaps(result, right);
    }
    return HeightMap.of(result);
  }
  decomposeLeft(to, result) {
    let left = this.left.length;
    if (to <= left) return this.left.decomposeLeft(to, result);
    result.push(this.left);
    if (this.break) {
      left++;
      if (to >= left) result.push(null);
    }
    if (to > left) this.right.decomposeLeft(to - left, result);
  }
  decomposeRight(from, result) {
    let left = this.left.length, right = left + this.break;
    if (from >= right) return this.right.decomposeRight(from - right, result);
    if (from < left) this.left.decomposeRight(from, result);
    if (this.break && from < right) result.push(null);
    result.push(this.right);
  }
  balanced(left, right) {
    if (left.size > 2 * right.size || right.size > 2 * left.size) return HeightMap.of(this.break ? [left, null, right] : [left, right]);
    this.left = left;
    this.right = right;
    this.height = left.height + right.height;
    this.outdated = left.outdated || right.outdated;
    this.size = left.size + right.size;
    this.length = left.length + this.break + right.length;
    return this;
  }
  updateHeight(oracle, offset = 0, force = false, measured) {
    let {left, right} = this, rightStart = offset + left.length + this.break, rebalance = null;
    if (measured && measured.from <= offset + left.length && measured.more) rebalance = left = left.updateHeight(oracle, offset, force, measured); else left.updateHeight(oracle, offset, force);
    if (measured && measured.from <= rightStart + right.length && measured.more) rebalance = right = right.updateHeight(oracle, rightStart, force, measured); else right.updateHeight(oracle, rightStart, force);
    if (rebalance) return this.balanced(left, right);
    this.height = this.left.height + this.right.height;
    this.outdated = false;
    return this;
  }
  toString() {
    return this.left + (this.break ? " " : "-") + this.right;
  }
}
function mergeGaps(nodes, around) {
  let before, after;
  if (nodes[around] == null && (before = nodes[around - 1]) instanceof HeightMapGap && (after = nodes[around + 1]) instanceof HeightMapGap) nodes.splice(around - 1, 3, new HeightMapGap(before.length + 1 + after.length));
}
const relevantWidgetHeight = 5;
class NodeBuilder {
  constructor(pos, oracle) {
    this.pos = pos;
    this.oracle = oracle;
    this.nodes = [];
    this.lineStart = -1;
    this.lineEnd = -1;
    this.covering = null;
    this.writtenTo = pos;
  }
  get isCovered() {
    return this.covering && this.nodes[this.nodes.length - 1] == this.covering;
  }
  span(_from, to) {
    if (this.lineStart > -1) {
      let end = Math.min(to, this.lineEnd), last = this.nodes[this.nodes.length - 1];
      if (last instanceof HeightMapText) last.length += end - this.pos; else if (end > this.pos || !this.isCovered) this.nodes.push(new HeightMapText(end - this.pos, -1));
      this.writtenTo = end;
      if (to > end) {
        this.nodes.push(null);
        this.writtenTo++;
        this.lineStart = -1;
      }
    }
    this.pos = to;
  }
  point(from, to, deco) {
    if (from < to || deco.heightRelevant) {
      let height = deco.widget ? Math.max(0, deco.widget.estimatedHeight) : 0;
      let len = to - from;
      if (deco.block) {
        this.addBlock(new HeightMapBlock(len, height, deco.type));
      } else if (len || height >= relevantWidgetHeight) {
        this.addLineDeco(height, len);
      }
    } else if (to > from) {
      this.span(from, to);
    }
    if (this.lineEnd > -1 && this.lineEnd < this.pos) this.lineEnd = this.oracle.doc.lineAt(this.pos).to;
  }
  enterLine() {
    if (this.lineStart > -1) return;
    let {from, to} = this.oracle.doc.lineAt(this.pos);
    this.lineStart = from;
    this.lineEnd = to;
    if (this.writtenTo < from) {
      if (this.writtenTo < from - 1 || this.nodes[this.nodes.length - 1] == null) this.nodes.push(this.blankContent(this.writtenTo, from - 1));
      this.nodes.push(null);
    }
    if (this.pos > from) this.nodes.push(new HeightMapText(this.pos - from, -1));
    this.writtenTo = this.pos;
  }
  blankContent(from, to) {
    let gap = new HeightMapGap(to - from);
    if (this.oracle.doc.lineAt(from).to == to) gap.flags |= 4;
    return gap;
  }
  ensureLine() {
    this.enterLine();
    let last = this.nodes.length ? this.nodes[this.nodes.length - 1] : null;
    if (last instanceof HeightMapText) return last;
    let line = new HeightMapText(0, -1);
    this.nodes.push(line);
    return line;
  }
  addBlock(block) {
    this.enterLine();
    if (block.type == BlockType.WidgetAfter && !this.isCovered) this.ensureLine();
    this.nodes.push(block);
    this.writtenTo = this.pos = this.pos + block.length;
    if (block.type != BlockType.WidgetBefore) this.covering = block;
  }
  addLineDeco(height, length) {
    let line = this.ensureLine();
    line.length += length;
    line.collapsed += length;
    line.widgetHeight = Math.max(line.widgetHeight, height);
    this.writtenTo = this.pos = this.pos + length;
  }
  finish(from) {
    let last = this.nodes.length == 0 ? null : this.nodes[this.nodes.length - 1];
    if (this.lineStart > -1 && !(last instanceof HeightMapText) && !this.isCovered) this.nodes.push(new HeightMapText(0, -1)); else if (this.writtenTo < this.pos || last == null) this.nodes.push(this.blankContent(this.writtenTo, this.pos));
    let pos = from;
    for (let node of this.nodes) {
      if (node instanceof HeightMapText) node.updateHeight(this.oracle, pos);
      pos += node ? node.length : 1;
    }
    return this.nodes;
  }
  static build(oracle, decorations, from, to) {
    let builder = new NodeBuilder(from, oracle);
    rangeset_1.RangeSet.spans(decorations, from, to, builder, 0);
    return builder.finish(from);
  }
}
function heightRelevantDecoChanges(a, b, diff) {
  let comp = new DecorationComparator();
  rangeset_1.RangeSet.compare(a, b, diff, comp, 0);
  return comp.changes;
}
class DecorationComparator {
  constructor() {
    this.changes = [];
  }
  compareRange() {}
  comparePoint(from, to, a, b) {
    if (from < to || a && a.heightRelevant || b && b.heightRelevant) addRange(from, to, this.changes, 5);
  }
}
function visiblePixelRange(dom, paddingTop) {
  let rect = dom.getBoundingClientRect();
  let left = Math.max(0, rect.left), right = Math.min(innerWidth, rect.right);
  let top = Math.max(0, rect.top), bottom = Math.min(innerHeight, rect.bottom);
  for (let parent = dom.parentNode; parent; ) {
    if (parent.nodeType == 1) {
      if ((parent.scrollHeight > parent.clientHeight || parent.scrollWidth > parent.clientWidth) && window.getComputedStyle(parent).overflow != "visible") {
        let parentRect = parent.getBoundingClientRect();
        left = Math.max(left, parentRect.left);
        right = Math.min(right, parentRect.right);
        top = Math.max(top, parentRect.top);
        bottom = Math.min(bottom, parentRect.bottom);
      }
      parent = parent.parentNode;
    } else if (parent.nodeType == 11) {
      parent = parent.host;
    } else {
      break;
    }
  }
  return {
    left: left - rect.left,
    right: right - rect.left,
    top: top - (rect.top + paddingTop),
    bottom: bottom - (rect.top + paddingTop)
  };
}
class LineGap {
  constructor(from, to, size) {
    this.from = from;
    this.to = to;
    this.size = size;
  }
  static same(a, b) {
    if (a.length != b.length) return false;
    for (let i = 0; i < a.length; i++) {
      let gA = a[i], gB = b[i];
      if (gA.from != gB.from || gA.to != gB.to || gA.size != gB.size) return false;
    }
    return true;
  }
  draw(wrapping) {
    return Decoration.replace({
      widget: new LineGapWidget(this.size, wrapping)
    }).range(this.from, this.to);
  }
}
class LineGapWidget extends WidgetType {
  constructor(size, vertical) {
    super();
    this.size = size;
    this.vertical = vertical;
  }
  eq(other) {
    return other.size == this.size && other.vertical == this.vertical;
  }
  toDOM() {
    let elt = document.createElement("div");
    if (this.vertical) {
      elt.style.height = this.size + "px";
    } else {
      elt.style.width = this.size + "px";
      elt.style.height = "2px";
      elt.style.display = "inline-block";
    }
    return elt;
  }
  get estimatedHeight() {
    return this.vertical ? this.size : -1;
  }
}
class ViewState {
  constructor(state) {
    this.state = state;
    this.pixelViewport = {
      left: 0,
      right: window.innerWidth,
      top: 0,
      bottom: 0
    };
    this.inView = true;
    this.paddingTop = 0;
    this.paddingBottom = 0;
    this.contentWidth = 0;
    this.heightOracle = new HeightOracle();
    this.scaler = IdScaler;
    this.scrollTo = null;
    this.printing = false;
    this.visibleRanges = [];
    this.mustEnforceCursorAssoc = false;
    this.heightMap = HeightMap.empty().applyChanges(state.facet(decorations), text_1.Text.empty, this.heightOracle.setDoc(state.doc), [new ChangedRange(0, 0, 0, state.doc.length)]);
    this.viewport = this.getViewport(0, null);
    this.updateForViewport();
    this.lineGaps = this.ensureLineGaps([]);
    this.lineGapDeco = Decoration.set(this.lineGaps.map(gap => gap.draw(false)));
    this.computeVisibleRanges();
  }
  updateForViewport() {
    let viewports = [this.viewport], {main} = this.state.selection;
    for (let i = 0; i <= 1; i++) {
      let pos = i ? main.head : main.anchor;
      if (!viewports.some(({from, to}) => pos >= from && pos <= to)) {
        let {from, to} = this.lineAt(pos, 0);
        viewports.push(new Viewport(from, to));
      }
    }
    this.viewports = viewports.sort((a, b) => a.from - b.from);
    this.scaler = this.heightMap.height <= 7000000 ? IdScaler : new BigScaler(this.heightOracle.doc, this.heightMap, this.viewports);
  }
  update(update, scrollTo = null) {
    let prev = this.state;
    this.state = update.state;
    let newDeco = this.state.facet(decorations);
    let contentChanges = update.changedRanges;
    let heightChanges = ChangedRange.extendWithRanges(contentChanges, heightRelevantDecoChanges(update.startState.facet(decorations), newDeco, update ? update.changes : state_1.ChangeSet.empty(this.state.doc.length)));
    let prevHeight = this.heightMap.height;
    this.heightMap = this.heightMap.applyChanges(newDeco, prev.doc, this.heightOracle.setDoc(this.state.doc), heightChanges);
    if (this.heightMap.height != prevHeight) update.flags |= 2;
    let viewport = heightChanges.length ? this.mapViewport(this.viewport, update.changes) : this.viewport;
    if (scrollTo && (scrollTo.head < viewport.from || scrollTo.head > viewport.to) || !this.viewportIsAppropriate(viewport)) viewport = this.getViewport(0, scrollTo);
    if (!viewport.eq(this.viewport)) {
      this.viewport = viewport;
      update.flags |= 4;
    }
    this.updateForViewport();
    if (this.lineGaps.length || this.viewport.to - this.viewport.from > 15000) update.flags |= this.updateLineGaps(this.ensureLineGaps(this.mapLineGaps(this.lineGaps, update.changes)));
    this.computeVisibleRanges();
    if (scrollTo) this.scrollTo = scrollTo;
    if (!this.mustEnforceCursorAssoc && update.selectionSet && update.view.lineWrapping && update.state.selection.main.empty && update.state.selection.main.assoc) this.mustEnforceCursorAssoc = true;
  }
  measure(docView, repeated) {
    let dom = docView.dom, whiteSpace = "", direction = Direction.LTR;
    if (!repeated) {
      let style = window.getComputedStyle(dom);
      (whiteSpace = style.whiteSpace, direction = style.direction == "rtl" ? Direction.RTL : Direction.LTR);
      this.paddingTop = parseInt(style.paddingTop) || 0;
      this.paddingBottom = parseInt(style.paddingBottom) || 0;
    }
    let pixelViewport = this.printing ? {
      top: -1e8,
      bottom: 1e8,
      left: -1e8,
      right: 1e8
    } : visiblePixelRange(dom, this.paddingTop);
    let dTop = pixelViewport.top - this.pixelViewport.top, dBottom = pixelViewport.bottom - this.pixelViewport.bottom;
    this.pixelViewport = pixelViewport;
    this.inView = this.pixelViewport.bottom > this.pixelViewport.top && this.pixelViewport.right > this.pixelViewport.left;
    if (!this.inView) return 0;
    let lineHeights = docView.measureVisibleLineHeights();
    let refresh = false, bias = 0, result = 0, oracle = this.heightOracle;
    if (!repeated) {
      let contentWidth = docView.dom.clientWidth;
      if (oracle.mustRefresh(lineHeights, whiteSpace, direction) || oracle.lineWrapping && Math.abs(contentWidth - this.contentWidth) > oracle.charWidth) {
        let {lineHeight, charWidth} = docView.measureTextSize();
        refresh = oracle.refresh(whiteSpace, direction, lineHeight, charWidth, contentWidth / charWidth, lineHeights);
        if (refresh) {
          docView.minWidth = 0;
          result |= 16;
        }
      }
      if (this.contentWidth != contentWidth) {
        this.contentWidth = contentWidth;
        result |= 16;
      }
      if (dTop > 0 && dBottom > 0) bias = Math.max(dTop, dBottom); else if (dTop < 0 && dBottom < 0) bias = Math.min(dTop, dBottom);
    }
    oracle.heightChanged = false;
    this.heightMap = this.heightMap.updateHeight(oracle, 0, refresh, new MeasuredHeights(this.viewport.from, lineHeights));
    if (oracle.heightChanged) result |= 2;
    if (!this.viewportIsAppropriate(this.viewport, bias) || this.scrollTo && (this.scrollTo.head < this.viewport.from || this.scrollTo.head > this.viewport.to)) {
      let newVP = this.getViewport(bias, this.scrollTo);
      if (newVP.from != this.viewport.from || newVP.to != this.viewport.to) {
        this.viewport = newVP;
        result |= 4;
      }
    }
    this.updateForViewport();
    if (this.lineGaps.length || this.viewport.to - this.viewport.from > 15000) result |= this.updateLineGaps(this.ensureLineGaps(refresh ? [] : this.lineGaps));
    this.computeVisibleRanges();
    if (this.mustEnforceCursorAssoc) {
      this.mustEnforceCursorAssoc = false;
      docView.enforceCursorAssoc();
    }
    return result;
  }
  get visibleTop() {
    return this.scaler.fromDOM(this.pixelViewport.top, 0);
  }
  get visibleBottom() {
    return this.scaler.fromDOM(this.pixelViewport.bottom, 0);
  }
  getViewport(bias, scrollTo) {
    let marginTop = 0.5 - Math.max(-0.5, Math.min(0.5, bias / 1000 / 2));
    let map = this.heightMap, doc = this.state.doc, {visibleTop, visibleBottom} = this;
    let viewport = new Viewport(map.lineAt(visibleTop - marginTop * 1000, QueryType.ByHeight, doc, 0, 0).from, map.lineAt(visibleBottom + (1 - marginTop) * 1000, QueryType.ByHeight, doc, 0, 0).to);
    if (scrollTo) {
      if (scrollTo.head < viewport.from) {
        let {top: newTop} = map.lineAt(scrollTo.head, QueryType.ByPos, doc, 0, 0);
        viewport = new Viewport(map.lineAt(newTop - 1000 / 2, QueryType.ByHeight, doc, 0, 0).from, map.lineAt(newTop + (visibleBottom - visibleTop) + 1000 / 2, QueryType.ByHeight, doc, 0, 0).to);
      } else if (scrollTo.head > viewport.to) {
        let {bottom: newBottom} = map.lineAt(scrollTo.head, QueryType.ByPos, doc, 0, 0);
        viewport = new Viewport(map.lineAt(newBottom - (visibleBottom - visibleTop) - 1000 / 2, QueryType.ByHeight, doc, 0, 0).from, map.lineAt(newBottom + 1000 / 2, QueryType.ByHeight, doc, 0, 0).to);
      }
    }
    return viewport;
  }
  mapViewport(viewport, changes) {
    let from = changes.mapPos(viewport.from, -1), to = changes.mapPos(viewport.to, 1);
    return new Viewport(this.heightMap.lineAt(from, QueryType.ByPos, this.state.doc, 0, 0).from, this.heightMap.lineAt(to, QueryType.ByPos, this.state.doc, 0, 0).to);
  }
  viewportIsAppropriate({from, to}, bias = 0) {
    let {top} = this.heightMap.lineAt(from, QueryType.ByPos, this.state.doc, 0, 0);
    let {bottom} = this.heightMap.lineAt(to, QueryType.ByPos, this.state.doc, 0, 0);
    let {visibleTop, visibleBottom} = this;
    return (from == 0 || top <= visibleTop - Math.max(10, Math.min(-bias, 250))) && (to == this.state.doc.length || bottom >= visibleBottom + Math.max(10, Math.min(bias, 250))) && (top > visibleTop - 2 * 1000 && bottom < visibleBottom + 2 * 1000);
  }
  mapLineGaps(gaps, changes) {
    if (!gaps.length || changes.empty) return gaps;
    let mapped = [];
    for (let gap of gaps) if (!changes.touchesRange(gap.from, gap.to)) mapped.push(new LineGap(changes.mapPos(gap.from), changes.mapPos(gap.to), gap.size));
    return mapped;
  }
  ensureLineGaps(current) {
    let gaps = [];
    if (this.heightOracle.direction != Direction.LTR) return gaps;
    this.heightMap.forEachLine(this.viewport.from, this.viewport.to, this.state.doc, 0, 0, line => {
      if (line.length < 10000) return;
      let structure = lineStructure(line.from, line.to, this.state);
      if (structure.total < 10000) return;
      let viewFrom, viewTo;
      if (this.heightOracle.lineWrapping) {
        if (line.from != this.viewport.from) viewFrom = line.from; else viewFrom = findPosition(structure, (this.visibleTop - line.top) / line.height);
        if (line.to != this.viewport.to) viewTo = line.to; else viewTo = findPosition(structure, (this.visibleBottom - line.top) / line.height);
      } else {
        let totalWidth = structure.total * this.heightOracle.charWidth;
        viewFrom = findPosition(structure, this.pixelViewport.left / totalWidth);
        viewTo = findPosition(structure, this.pixelViewport.right / totalWidth);
      }
      let sel = this.state.selection.main;
      if (sel.from <= viewFrom && sel.to >= line.from) viewFrom = sel.from;
      if (sel.from <= line.to && sel.to >= viewTo) viewTo = sel.to;
      let gapTo = viewFrom - 10000, gapFrom = viewTo + 10000;
      if (gapTo > line.from + 5000) gaps.push(find(current, gap => gap.from == line.from && gap.to > gapTo - 5000 && gap.to < gapTo + 5000) || new LineGap(line.from, gapTo, this.gapSize(line, gapTo, true, structure)));
      if (gapFrom < line.to - 5000) gaps.push(find(current, gap => gap.to == line.to && gap.from > gapFrom - 5000 && gap.from < gapFrom + 5000) || new LineGap(gapFrom, line.to, this.gapSize(line, gapFrom, false, structure)));
    });
    return gaps;
  }
  gapSize(line, pos, start, structure) {
    if (this.heightOracle.lineWrapping) {
      let height = line.height * findFraction(structure, pos);
      return start ? height : line.height - height;
    } else {
      let ratio = findFraction(structure, pos);
      return structure.total * this.heightOracle.charWidth * (start ? ratio : 1 - ratio);
    }
  }
  updateLineGaps(gaps) {
    if (!LineGap.same(gaps, this.lineGaps)) {
      this.lineGaps = gaps;
      this.lineGapDeco = Decoration.set(gaps.map(gap => gap.draw(this.heightOracle.lineWrapping)));
      return 8;
    }
    return 0;
  }
  computeVisibleRanges() {
    let deco = this.state.facet(decorations);
    if (this.lineGaps.length) deco = deco.concat(this.lineGapDeco);
    let ranges = [];
    rangeset_1.RangeSet.spans(deco, this.viewport.from, this.viewport.to, {
      span(from, to) {
        ranges.push({
          from,
          to
        });
      },
      point() {}
    }, 20);
    this.visibleRanges = ranges;
  }
  lineAt(pos, editorTop) {
    editorTop += this.paddingTop;
    return scaleBlock(this.heightMap.lineAt(pos, QueryType.ByPos, this.state.doc, editorTop, 0), this.scaler, editorTop);
  }
  lineAtHeight(height, editorTop) {
    editorTop += this.paddingTop;
    return scaleBlock(this.heightMap.lineAt(this.scaler.fromDOM(height, editorTop), QueryType.ByHeight, this.state.doc, editorTop, 0), this.scaler, editorTop);
  }
  blockAtHeight(height, editorTop) {
    editorTop += this.paddingTop;
    return scaleBlock(this.heightMap.blockAt(this.scaler.fromDOM(height, editorTop), this.state.doc, editorTop, 0), this.scaler, editorTop);
  }
  forEachLine(from, to, f, editorTop) {
    editorTop += this.paddingTop;
    return this.heightMap.forEachLine(from, to, this.state.doc, editorTop, 0, this.scaler.scale == 1 ? f : b => f(scaleBlock(b, this.scaler, editorTop)));
  }
  get contentHeight() {
    return this.domHeight + this.paddingTop + this.paddingBottom;
  }
  get domHeight() {
    return this.scaler.toDOM(this.heightMap.height, this.paddingTop);
  }
}
class Viewport {
  constructor(from, to) {
    this.from = from;
    this.to = to;
  }
  eq(b) {
    return this.from == b.from && this.to == b.to;
  }
}
function lineStructure(from, to, state) {
  let ranges = [], pos = from, total = 0;
  rangeset_1.RangeSet.spans(state.facet(decorations), from, to, {
    span() {},
    point(from, to) {
      if (from > pos) {
        ranges.push({
          from: pos,
          to: from
        });
        total += from - pos;
      }
      pos = to;
    }
  }, 20);
  if (pos < to) {
    ranges.push({
      from: pos,
      to
    });
    total += to - pos;
  }
  return {
    total,
    ranges
  };
}
function findPosition({total, ranges}, ratio) {
  if (ratio <= 0) return ranges[0].from;
  if (ratio >= 1) return ranges[ranges.length - 1].to;
  let dist = Math.floor(total * ratio);
  for (let i = 0; ; i++) {
    let {from, to} = ranges[i], size = to - from;
    if (dist <= size) return from + dist;
    dist -= size;
  }
}
function findFraction(structure, pos) {
  let counted = 0;
  for (let {from, to} of structure.ranges) {
    if (pos <= to) {
      counted += pos - from;
      break;
    }
    counted += to - from;
  }
  return counted / structure.total;
}
function find(array, f) {
  for (let val of array) if (f(val)) return val;
  return undefined;
}
const IdScaler = {
  toDOM(n) {
    return n;
  },
  fromDOM(n) {
    return n;
  },
  scale: 1
};
class BigScaler {
  constructor(doc, heightMap, viewports) {
    let vpHeight = 0, base = 0, domBase = 0;
    this.viewports = viewports.map(({from, to}) => {
      let top = heightMap.lineAt(from, QueryType.ByPos, doc, 0, 0).top;
      let bottom = heightMap.lineAt(to, QueryType.ByPos, doc, 0, 0).bottom;
      vpHeight += bottom - top;
      return {
        from,
        to,
        top,
        bottom,
        domTop: 0,
        domBottom: 0
      };
    });
    this.scale = (7000000 - vpHeight) / (heightMap.height - vpHeight);
    for (let obj of this.viewports) {
      obj.domTop = domBase + (obj.top - base) * this.scale;
      domBase = obj.domBottom = obj.domTop + (obj.bottom - obj.top);
      base = obj.bottom;
    }
  }
  toDOM(n, top) {
    n -= top;
    for (let i = 0, base = 0, domBase = 0; ; i++) {
      let vp = i < this.viewports.length ? this.viewports[i] : null;
      if (!vp || n < vp.top) return domBase + (n - base) * this.scale + top;
      if (n <= vp.bottom) return vp.domTop + (n - vp.top) + top;
      base = vp.bottom;
      domBase = vp.domBottom;
    }
  }
  fromDOM(n, top) {
    n -= top;
    for (let i = 0, base = 0, domBase = 0; ; i++) {
      let vp = i < this.viewports.length ? this.viewports[i] : null;
      if (!vp || n < vp.domTop) return base + (n - domBase) / this.scale + top;
      if (n <= vp.domBottom) return vp.top + (n - vp.domTop) + top;
      base = vp.bottom;
      domBase = vp.domBottom;
    }
  }
}
function scaleBlock(block, scaler, top) {
  if (scaler.scale == 1) return block;
  let bTop = scaler.toDOM(block.top, top), bBottom = scaler.toDOM(block.bottom, top);
  return new BlockInfo(block.from, block.length, bTop, bBottom - bTop, Array.isArray(block.type) ? block.type.map(b => scaleBlock(b, scaler, top)) : block.type);
}
const theme = state_1.Facet.define({
  combine: strs => strs.join(" ")
});
const darkTheme = state_1.Facet.define({
  combine: values => values.indexOf(true) > -1
});
const baseThemeID = style_mod_1.StyleModule.newName(), baseLightID = style_mod_1.StyleModule.newName(), baseDarkID = style_mod_1.StyleModule.newName();
const lightDarkIDs = {
  "&light": "." + baseLightID,
  "&dark": "." + baseDarkID
};
function buildTheme(main, spec, scopes) {
  return new style_mod_1.StyleModule(spec, {
    finish(sel) {
      return (/&/).test(sel) ? sel.replace(/&\w*/, m => {
        if (m == "&") return main;
        if (!scopes || !scopes[m]) throw new RangeError(`Unsupported selector: ${m}`);
        return scopes[m];
      }) : main + " " + sel;
    }
  });
}
const baseTheme = buildTheme("." + baseThemeID, {
  "&": {
    position: "relative !important",
    boxSizing: "border-box",
    "&.cm-focused": {
      outline_fallback: "1px dotted #212121",
      outline: "5px auto -webkit-focus-ring-color"
    },
    display: "flex !important",
    flexDirection: "column"
  },
  ".cm-scroller": {
    display: "flex !important",
    alignItems: "flex-start !important",
    fontFamily: "monospace",
    lineHeight: 1.4,
    height: "100%",
    overflowX: "auto",
    position: "relative",
    zIndex: 0
  },
  ".cm-content": {
    margin: 0,
    flexGrow: 2,
    minHeight: "100%",
    display: "block",
    whiteSpace: "pre",
    boxSizing: "border-box",
    padding: "4px 0",
    outline: "none"
  },
  ".cm-lineWrapping": {
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere"
  },
  "&light .cm-content": {
    caretColor: "black"
  },
  "&dark .cm-content": {
    caretColor: "white"
  },
  ".cm-line": {
    display: "block",
    padding: "0 2px 0 4px"
  },
  ".cm-selectionLayer": {
    zIndex: -1,
    contain: "size style"
  },
  ".cm-selectionBackground": {
    position: "absolute"
  },
  "&light .cm-selectionBackground": {
    background: "#d9d9d9"
  },
  "&dark .cm-selectionBackground": {
    background: "#222"
  },
  "&light.cm-focused .cm-selectionBackground": {
    background: "#d7d4f0"
  },
  "&dark.cm-focused .cm-selectionBackground": {
    background: "#233"
  },
  ".cm-cursorLayer": {
    zIndex: 100,
    contain: "size style",
    pointerEvents: "none"
  },
  "&.cm-focused .cm-cursorLayer": {
    animation: "steps(1) cm-blink 1.2s infinite"
  },
  "@keyframes cm-blink": {
    "0%": {},
    "50%": {
      visibility: "hidden"
    },
    "100%": {}
  },
  "@keyframes cm-blink2": {
    "0%": {},
    "50%": {
      visibility: "hidden"
    },
    "100%": {}
  },
  ".cm-cursor": {
    position: "absolute",
    borderLeft: "1.2px solid black",
    marginLeft: "-0.6px",
    pointerEvents: "none",
    display: "none"
  },
  "&dark .cm-cursor": {
    borderLeftColor: "#444"
  },
  "&.cm-focused .cm-cursor": {
    display: "block"
  },
  "&light .cm-activeLine": {
    backgroundColor: "#f3f9ff"
  },
  "&dark .cm-activeLine": {
    backgroundColor: "#223039"
  },
  "&light .cm-specialChar": {
    color: "red"
  },
  "&dark .cm-specialChar": {
    color: "#f78"
  },
  ".cm-tab": {
    display: "inline-block",
    overflow: "hidden",
    verticalAlign: "bottom"
  },
  ".cm-placeholder": {
    color: "#888",
    display: "inline-block"
  },
  ".cm-button": {
    verticalAlign: "middle",
    color: "inherit",
    fontSize: "70%",
    padding: ".2em 1em",
    borderRadius: "3px"
  },
  "&light .cm-button": {
    backgroundImage: "linear-gradient(#eff1f5, #d9d9df)",
    border: "1px solid #888",
    "&:active": {
      backgroundImage: "linear-gradient(#b4b4b4, #d0d3d6)"
    }
  },
  "&dark .cm-button": {
    backgroundImage: "linear-gradient(#393939, #111)",
    border: "1px solid #888",
    "&:active": {
      backgroundImage: "linear-gradient(#111, #333)"
    }
  },
  ".cm-textfield": {
    verticalAlign: "middle",
    color: "inherit",
    fontSize: "70%",
    border: "1px solid silver",
    padding: ".2em .5em"
  },
  "&light .cm-textfield": {
    backgroundColor: "white"
  },
  "&dark .cm-textfield": {
    border: "1px solid #555",
    backgroundColor: "inherit"
  }
}, lightDarkIDs);
const observeOptions = {
  childList: true,
  characterData: true,
  subtree: true,
  characterDataOldValue: true
};
const useCharData = browser.ie && browser.ie_version <= 11;
class DOMObserver {
  constructor(view, onChange, onScrollChanged) {
    this.view = view;
    this.onChange = onChange;
    this.onScrollChanged = onScrollChanged;
    this.active = false;
    this.ignoreSelection = new DOMSelection();
    this.delayedFlush = -1;
    this.queue = [];
    this.scrollTargets = [];
    this.intersection = null;
    this.intersecting = false;
    this.parentCheck = -1;
    this.dom = view.contentDOM;
    this.observer = new MutationObserver(mutations => {
      for (let mut of mutations) this.queue.push(mut);
      if ((browser.ie && browser.ie_version <= 11 || browser.ios && view.composing) && mutations.some(m => m.type == "childList" && m.removedNodes.length || m.type == "characterData" && m.oldValue.length > m.target.nodeValue.length)) this.flushSoon(); else this.flush();
    });
    if (useCharData) this.onCharData = event => {
      this.queue.push({
        target: event.target,
        type: "characterData",
        oldValue: event.prevValue
      });
      this.flushSoon();
    };
    this.onSelectionChange = this.onSelectionChange.bind(this);
    this.start();
    this.onScroll = this.onScroll.bind(this);
    window.addEventListener("scroll", this.onScroll);
    if (typeof IntersectionObserver == "function") {
      this.intersection = new IntersectionObserver(entries => {
        if (this.parentCheck < 0) this.parentCheck = setTimeout(this.listenForScroll.bind(this), 1000);
        if (entries[entries.length - 1].intersectionRatio > 0 != this.intersecting) {
          this.intersecting = !this.intersecting;
          this.onScrollChanged(document.createEvent("Event"));
        }
      }, {});
      this.intersection.observe(this.dom);
    }
    this.listenForScroll();
  }
  onScroll(e) {
    if (this.intersecting) {
      this.flush();
      this.onScrollChanged(e);
    }
  }
  onSelectionChange(event) {
    let {view} = this, sel = getSelection(view.root);
    if (view.state.facet(editable) ? view.root.activeElement != this.dom : !hasSelection(view.dom, sel)) return;
    let context = sel.anchorNode && view.docView.nearest(sel.anchorNode);
    if (context && context.ignoreEvent(event)) return;
    if (browser.ie && browser.ie_version <= 11 && !view.state.selection.main.empty && sel.focusNode && isEquivalentPosition(sel.focusNode, sel.focusOffset, sel.anchorNode, sel.anchorOffset)) this.flushSoon(); else this.flush();
  }
  listenForScroll() {
    this.parentCheck = -1;
    let i = 0, changed = null;
    for (let dom = this.dom; dom; ) {
      if (dom.nodeType == 1) {
        if (!changed && i < this.scrollTargets.length && this.scrollTargets[i] == dom) i++; else if (!changed) changed = this.scrollTargets.slice(0, i);
        if (changed) changed.push(dom);
        dom = dom.parentNode;
      } else if (dom.nodeType == 11) {
        dom = dom.host;
      } else {
        break;
      }
    }
    if (i < this.scrollTargets.length && !changed) changed = this.scrollTargets.slice(0, i);
    if (changed) {
      for (let dom of this.scrollTargets) dom.removeEventListener("scroll", this.onScroll);
      for (let dom of this.scrollTargets = changed) dom.addEventListener("scroll", this.onScroll);
    }
  }
  ignore(f) {
    if (!this.active) return f();
    try {
      this.stop();
      return f();
    } finally {
      this.start();
      this.clear();
    }
  }
  start() {
    if (this.active) return;
    this.observer.observe(this.dom, observeOptions);
    this.dom.ownerDocument.addEventListener("selectionchange", this.onSelectionChange);
    if (useCharData) this.dom.addEventListener("DOMCharacterDataModified", this.onCharData);
    this.active = true;
  }
  stop() {
    if (!this.active) return;
    this.active = false;
    this.observer.disconnect();
    this.dom.ownerDocument.removeEventListener("selectionchange", this.onSelectionChange);
    if (useCharData) this.dom.removeEventListener("DOMCharacterDataModified", this.onCharData);
  }
  clearSelection() {
    this.ignoreSelection.set(getSelection(this.view.root));
  }
  clear() {
    this.observer.takeRecords();
    this.queue.length = 0;
    this.clearSelection();
  }
  flushSoon() {
    if (this.delayedFlush < 0) this.delayedFlush = window.setTimeout(() => {
      this.delayedFlush = -1;
      this.flush();
    }, 20);
  }
  forceFlush() {
    if (this.delayedFlush >= 0) {
      window.clearTimeout(this.delayedFlush);
      this.delayedFlush = -1;
      this.flush();
    }
  }
  flush() {
    if (this.delayedFlush >= 0) return;
    let records = this.queue;
    for (let mut of this.observer.takeRecords()) records.push(mut);
    if (records.length) this.queue = [];
    let selection = getSelection(this.view.root);
    let newSel = !this.ignoreSelection.eq(selection) && hasSelection(this.dom, selection);
    if (records.length == 0 && !newSel) return;
    let from = -1, to = -1, typeOver = false;
    for (let record of records) {
      let range = this.readMutation(record);
      if (!range) continue;
      if (range.typeOver) typeOver = true;
      if (from == -1) {
        ({from, to} = range);
      } else {
        from = Math.min(range.from, from);
        to = Math.max(range.to, to);
      }
    }
    let startState = this.view.state;
    if (from > -1 || newSel) this.onChange(from, to, typeOver);
    if (this.view.state == startState) {
      if (this.view.docView.dirty) {
        this.ignore(() => this.view.docView.sync());
        this.view.docView.dirty = 0;
      }
      this.view.docView.updateSelection();
    }
    this.clearSelection();
  }
  readMutation(rec) {
    let cView = this.view.docView.nearest(rec.target);
    if (!cView || cView.ignoreMutation(rec)) return null;
    cView.markDirty();
    if (rec.type == "childList") {
      let childBefore = findChild(cView, rec.previousSibling || rec.target.previousSibling, -1);
      let childAfter = findChild(cView, rec.nextSibling || rec.target.nextSibling, 1);
      return {
        from: childBefore ? cView.posAfter(childBefore) : cView.posAtStart,
        to: childAfter ? cView.posBefore(childAfter) : cView.posAtEnd,
        typeOver: false
      };
    } else {
      return {
        from: cView.posAtStart,
        to: cView.posAtEnd,
        typeOver: rec.target.nodeValue == rec.oldValue
      };
    }
  }
  destroy() {
    this.stop();
    if (this.intersection) this.intersection.disconnect();
    for (let dom of this.scrollTargets) dom.removeEventListener("scroll", this.onScroll);
    window.removeEventListener("scroll", this.onScroll);
    clearTimeout(this.parentCheck);
  }
}
function findChild(cView, dom, dir) {
  while (dom) {
    let curView = ContentView.get(dom);
    if (curView && curView.parent == cView) return curView;
    let parent = dom.parentNode;
    dom = parent != cView.dom ? parent : dir > 0 ? dom.nextSibling : dom.previousSibling;
  }
  return null;
}
function applyDOMChange(view, start, end, typeOver) {
  let change, newSel;
  let sel = view.state.selection.main, bounds;
  if (start > -1 && (bounds = view.docView.domBoundsAround(start, end, 0))) {
    let {from, to} = bounds;
    let selPoints = view.docView.impreciseHead || view.docView.impreciseAnchor ? [] : selectionPoints(view.contentDOM, view.root);
    let reader = new DOMReader(selPoints, view);
    reader.readRange(bounds.startDOM, bounds.endDOM);
    newSel = selectionFromPoints(selPoints, from);
    let preferredPos = sel.from, preferredSide = null;
    if (view.inputState.lastKeyCode === 8 && view.inputState.lastKeyTime > Date.now() - 100 || browser.android && reader.text.length < to - from) {
      preferredPos = sel.to;
      preferredSide = "end";
    }
    let diff = findDiff(view.state.sliceDoc(from, to), reader.text, preferredPos - from, preferredSide);
    if (diff) change = {
      from: from + diff.from,
      to: from + diff.toA,
      insert: view.state.toText(reader.text.slice(diff.from, diff.toB))
    };
  } else if (view.hasFocus || !view.state.facet(editable)) {
    let domSel = getSelection(view.root);
    let {impreciseHead: iHead, impreciseAnchor: iAnchor} = view.docView;
    let head = iHead && iHead.node == domSel.focusNode && iHead.offset == domSel.focusOffset ? view.state.selection.main.head : view.docView.posFromDOM(domSel.focusNode, domSel.focusOffset);
    let anchor = iAnchor && iAnchor.node == domSel.anchorNode && iAnchor.offset == domSel.anchorOffset ? view.state.selection.main.anchor : selectionCollapsed(domSel) ? head : view.docView.posFromDOM(domSel.anchorNode, domSel.anchorOffset);
    if (head != sel.head || anchor != sel.anchor) newSel = state_1.EditorSelection.single(anchor, head);
  }
  if (!change && !newSel) return;
  if (!change && typeOver && !sel.empty && newSel && newSel.main.empty) change = {
    from: sel.from,
    to: sel.to,
    insert: view.state.doc.slice(sel.from, sel.to)
  };
  if (change) {
    let startState = view.state;
    if (browser.android && (change.from == sel.from && change.to == sel.to && change.insert.length == 1 && change.insert.lines == 2 && dispatchKey(view, "Enter", 10) || change.from == sel.from - 1 && change.to == sel.to && change.insert.length == 0 && dispatchKey(view, "Backspace", 8) || change.from == sel.from && change.to == sel.to + 1 && change.insert.length == 0 && dispatchKey(view, "Delete", 46))) return;
    let text = change.insert.toString();
    if (view.state.facet(inputHandler).some(h => h(view, change.from, change.to, text))) return;
    if (view.inputState.composing >= 0) view.inputState.composing++;
    let tr;
    if (change.from >= sel.from && change.to <= sel.to && change.to - change.from >= (sel.to - sel.from) / 3 && (!newSel || newSel.main.empty && newSel.main.from == change.from + change.insert.length)) {
      let before = sel.from < change.from ? startState.sliceDoc(sel.from, change.from) : "";
      let after = sel.to > change.to ? startState.sliceDoc(change.to, sel.to) : "";
      tr = startState.replaceSelection(view.state.toText(before + change.insert.sliceString(0, undefined, view.state.lineBreak) + after));
    } else {
      let changes = startState.changes(change);
      tr = {
        changes,
        selection: newSel && !startState.selection.main.eq(newSel.main) && newSel.main.to <= changes.newLength ? startState.selection.replaceRange(newSel.main) : undefined
      };
    }
    view.dispatch(tr, {
      scrollIntoView: true,
      annotations: state_1.Transaction.userEvent.of("input")
    });
  } else if (newSel && !newSel.main.eq(sel)) {
    let scrollIntoView = false, annotations;
    if (view.inputState.lastSelectionTime > Date.now() - 50) {
      if (view.inputState.lastSelectionOrigin == "keyboardselection") scrollIntoView = true; else annotations = state_1.Transaction.userEvent.of(view.inputState.lastSelectionOrigin);
    }
    view.dispatch({
      selection: newSel,
      scrollIntoView,
      annotations
    });
  }
}
function findDiff(a, b, preferredPos, preferredSide) {
  let minLen = Math.min(a.length, b.length);
  let from = 0;
  while (from < minLen && a.charCodeAt(from) == b.charCodeAt(from)) from++;
  if (from == minLen && a.length == b.length) return null;
  let toA = a.length, toB = b.length;
  while (toA > 0 && toB > 0 && a.charCodeAt(toA - 1) == b.charCodeAt(toB - 1)) {
    toA--;
    toB--;
  }
  if (preferredSide == "end") {
    let adjust = Math.max(0, from - Math.min(toA, toB));
    preferredPos -= toA + adjust - from;
  }
  if (toA < from && a.length < b.length) {
    let move = preferredPos <= from && preferredPos >= toA ? from - preferredPos : 0;
    from -= move;
    toB = from + (toB - toA);
    toA = from;
  } else if (toB < from) {
    let move = preferredPos <= from && preferredPos >= toB ? from - preferredPos : 0;
    from -= move;
    toA = from + (toA - toB);
    toB = from;
  }
  return {
    from,
    toA,
    toB
  };
}
class DOMReader {
  constructor(points, view) {
    this.points = points;
    this.view = view;
    this.text = "";
    this.lineBreak = view.state.lineBreak;
  }
  readRange(start, end) {
    if (!start) return;
    let parent = start.parentNode;
    for (let cur = start; ; ) {
      this.findPointBefore(parent, cur);
      this.readNode(cur);
      let next = cur.nextSibling;
      if (next == end) break;
      let view = ContentView.get(cur), nextView = ContentView.get(next);
      if ((view ? view.breakAfter : isBlockElement(cur)) || (nextView ? nextView.breakAfter : isBlockElement(next)) && !(cur.nodeName == "BR" && !cur.cmIgnore)) this.text += this.lineBreak;
      cur = next;
    }
    this.findPointBefore(parent, end);
  }
  readNode(node) {
    if (node.cmIgnore) return;
    let view = ContentView.get(node);
    let fromView = view && view.overrideDOMText;
    let text;
    if (fromView != null) text = fromView.sliceString(0, undefined, this.lineBreak); else if (node.nodeType == 3) text = node.nodeValue; else if (node.nodeName == "BR") text = node.nextSibling ? this.lineBreak : ""; else if (node.nodeType == 1) this.readRange(node.firstChild, null);
    if (text != null) {
      this.findPointIn(node, text.length);
      this.text += text;
      if (browser.chrome && this.view.inputState.lastKeyCode == 13 && !node.nextSibling && (/\n\n$/).test(this.text)) this.text = this.text.slice(0, -1);
    }
  }
  findPointBefore(node, next) {
    for (let point of this.points) if (point.node == node && node.childNodes[point.offset] == next) point.pos = this.text.length;
  }
  findPointIn(node, maxLen) {
    for (let point of this.points) if (point.node == node) point.pos = this.text.length + Math.min(point.offset, maxLen);
  }
}
function isBlockElement(node) {
  return node.nodeType == 1 && (/^(DIV|P|LI|UL|OL|BLOCKQUOTE|DD|DT|H\d|SECTION|PRE)$/).test(node.nodeName);
}
class DOMPoint {
  constructor(node, offset) {
    this.node = node;
    this.offset = offset;
    this.pos = -1;
  }
}
function selectionPoints(dom, root) {
  let result = [];
  if (root.activeElement != dom) return result;
  let {anchorNode, anchorOffset, focusNode, focusOffset} = getSelection(root);
  if (anchorNode) {
    result.push(new DOMPoint(anchorNode, anchorOffset));
    if (focusNode != anchorNode || focusOffset != anchorOffset) result.push(new DOMPoint(focusNode, focusOffset));
  }
  return result;
}
function selectionFromPoints(points, base) {
  if (points.length == 0) return null;
  let anchor = points[0].pos, head = points.length == 2 ? points[1].pos : anchor;
  return anchor > -1 && head > -1 ? state_1.EditorSelection.single(anchor + base, head + base) : null;
}
function dispatchKey(view, name, code) {
  let options = {
    key: name,
    code: name,
    keyCode: code,
    which: code,
    cancelable: true
  };
  let down = new KeyboardEvent("keydown", options);
  view.contentDOM.dispatchEvent(down);
  let up = new KeyboardEvent("keyup", options);
  view.contentDOM.dispatchEvent(up);
  return down.defaultPrevented || up.defaultPrevented;
}
class EditorView {
  constructor(config = {}) {
    this.plugins = [];
    this.editorAttrs = {};
    this.contentAttrs = {};
    this.bidiCache = [];
    this.updateState = 2;
    this.measureScheduled = -1;
    this.measureRequests = [];
    this.contentDOM = document.createElement("div");
    this.scrollDOM = document.createElement("div");
    this.scrollDOM.tabIndex = -1;
    this.scrollDOM.className = "cm-scroller";
    this.scrollDOM.appendChild(this.contentDOM);
    this.announceDOM = document.createElement("div");
    this.announceDOM.style.cssText = "position: absolute; top: -10000px";
    this.announceDOM.setAttribute("aria-live", "polite");
    this.dom = document.createElement("div");
    this.dom.appendChild(this.announceDOM);
    this.dom.appendChild(this.scrollDOM);
    this._dispatch = config.dispatch || (tr => this.update([tr]));
    this.dispatch = this.dispatch.bind(this);
    this.root = config.root || document;
    this.viewState = new ViewState(config.state || state_1.EditorState.create());
    this.plugins = this.state.facet(viewPlugin).map(spec => new PluginInstance(spec).update(this));
    this.observer = new DOMObserver(this, (from, to, typeOver) => {
      applyDOMChange(this, from, to, typeOver);
    }, event => {
      this.inputState.runScrollHandlers(this, event);
      this.measure();
    });
    this.inputState = new InputState(this);
    this.docView = new DocView(this);
    this.mountStyles();
    this.updateAttrs();
    this.updateState = 0;
    ensureGlobalHandler();
    this.requestMeasure();
    if (config.parent) config.parent.appendChild(this.dom);
  }
  get state() {
    return this.viewState.state;
  }
  get viewport() {
    return this.viewState.viewport;
  }
  get visibleRanges() {
    return this.viewState.visibleRanges;
  }
  get inView() {
    return this.viewState.inView;
  }
  get composing() {
    return this.inputState.composing > 0;
  }
  dispatch(...input) {
    this._dispatch(input.length == 1 && input[0] instanceof state_1.Transaction ? input[0] : this.state.update(...input));
  }
  update(transactions) {
    if (this.updateState != 0) throw new Error("Calls to EditorView.update are not allowed while an update is in progress");
    let redrawn = false, update;
    let state = this.state;
    for (let tr of transactions) {
      if (tr.startState != state) throw new RangeError("Trying to update state with a transaction that doesn't start from the previous state.");
      state = tr.state;
    }
    if (state.facet(state_1.EditorState.phrases) != this.state.facet(state_1.EditorState.phrases)) return this.setState(state);
    update = new ViewUpdate(this, state, transactions);
    try {
      this.updateState = 2;
      let scrollTo = transactions.some(tr => tr.scrollIntoView) ? state.selection.main : null;
      this.viewState.update(update, scrollTo);
      this.bidiCache = CachedOrder.update(this.bidiCache, update.changes);
      if (!update.empty) this.updatePlugins(update);
      redrawn = this.docView.update(update);
      if (this.state.facet(styleModule) != this.styleModules) this.mountStyles();
      this.updateAttrs();
      this.showAnnouncements(transactions);
    } finally {
      this.updateState = 0;
    }
    if (redrawn || scrollTo || this.viewState.mustEnforceCursorAssoc) this.requestMeasure();
    if (!update.empty) for (let listener of this.state.facet(updateListener)) listener(update);
  }
  setState(newState) {
    if (this.updateState != 0) throw new Error("Calls to EditorView.setState are not allowed while an update is in progress");
    this.updateState = 2;
    try {
      for (let plugin of this.plugins) plugin.destroy(this);
      this.viewState = new ViewState(newState);
      this.plugins = newState.facet(viewPlugin).map(spec => new PluginInstance(spec).update(this));
      this.docView = new DocView(this);
      this.inputState.ensureHandlers(this);
      this.mountStyles();
      this.updateAttrs();
      this.bidiCache = [];
    } finally {
      this.updateState = 0;
    }
    this.requestMeasure();
  }
  updatePlugins(update) {
    let prevSpecs = update.startState.facet(viewPlugin), specs = update.state.facet(viewPlugin);
    if (prevSpecs != specs) {
      let newPlugins = [];
      for (let spec of specs) {
        let found = prevSpecs.indexOf(spec);
        if (found < 0) {
          newPlugins.push(new PluginInstance(spec));
        } else {
          let plugin = this.plugins[found];
          plugin.mustUpdate = update;
          newPlugins.push(plugin);
        }
      }
      for (let plugin of this.plugins) if (plugin.mustUpdate != update) plugin.destroy(this);
      this.plugins = newPlugins;
      this.inputState.ensureHandlers(this);
    } else {
      for (let p of this.plugins) p.mustUpdate = update;
    }
    for (let i = 0; i < this.plugins.length; i++) this.plugins[i] = this.plugins[i].update(this);
  }
  measure() {
    if (this.measureScheduled > -1) cancelAnimationFrame(this.measureScheduled);
    this.measureScheduled = -1;
    let updated = null;
    try {
      for (let i = 0; ; i++) {
        this.updateState = 1;
        let changed = this.viewState.measure(this.docView, i > 0);
        let measuring = this.measureRequests;
        if (!changed && !measuring.length && this.viewState.scrollTo == null) break;
        this.measureRequests = [];
        if (i > 5) {
          console.warn("Viewport failed to stabilize");
          break;
        }
        let measured = measuring.map(m => {
          try {
            return m.read(this);
          } catch (e) {
            logException(this.state, e);
            return BadMeasure;
          }
        });
        let update = new ViewUpdate(this, this.state);
        update.flags |= changed;
        if (!updated) updated = update; else updated.flags |= changed;
        this.updateState = 2;
        if (!update.empty) this.updatePlugins(update);
        this.updateAttrs();
        if (changed) this.docView.update(update);
        for (let i = 0; i < measuring.length; i++) if (measured[i] != BadMeasure) {
          try {
            measuring[i].write(measured[i], this);
          } catch (e) {
            logException(this.state, e);
          }
        }
        if (this.viewState.scrollTo) {
          this.docView.scrollPosIntoView(this.viewState.scrollTo.head, this.viewState.scrollTo.assoc);
          this.viewState.scrollTo = null;
        }
        if (!(changed & 4) && this.measureRequests.length == 0) break;
      }
    } finally {
      this.updateState = 0;
    }
    this.measureScheduled = -1;
    if (updated && !updated.empty) for (let listener of this.state.facet(updateListener)) listener(updated);
  }
  get themeClasses() {
    return baseThemeID + " " + (this.state.facet(darkTheme) ? baseDarkID : baseLightID) + " " + this.state.facet(theme);
  }
  updateAttrs() {
    let editorAttrs = combineAttrs(this.state.facet(editorAttributes), {
      class: "cm-wrap" + (this.hasFocus ? " cm-focused " : " ") + this.themeClasses
    });
    updateAttrs(this.dom, this.editorAttrs, editorAttrs);
    this.editorAttrs = editorAttrs;
    let contentAttrs = combineAttrs(this.state.facet(contentAttributes), {
      spellcheck: "false",
      contenteditable: String(this.state.facet(editable)),
      class: "cm-content",
      style: `${browser.tabSize}: ${this.state.tabSize}`,
      role: "textbox",
      "aria-multiline": "true"
    });
    updateAttrs(this.contentDOM, this.contentAttrs, contentAttrs);
    this.contentAttrs = contentAttrs;
  }
  showAnnouncements(trs) {
    let first = true;
    for (let tr of trs) for (let effect of tr.effects) if (effect.is(EditorView.announce)) {
      if (first) this.announceDOM.textContent = "";
      first = false;
      let div = this.announceDOM.appendChild(document.createElement("div"));
      div.textContent = effect.value;
    }
  }
  mountStyles() {
    this.styleModules = this.state.facet(styleModule);
    style_mod_1.StyleModule.mount(this.root, this.styleModules.concat(baseTheme).reverse());
  }
  readMeasured() {
    if (this.updateState == 2) throw new Error("Reading the editor layout isn't allowed during an update");
    if (this.updateState == 0 && this.measureScheduled > -1) this.measure();
  }
  requestMeasure(request) {
    if (this.measureScheduled < 0) this.measureScheduled = requestAnimationFrame(() => this.measure());
    if (request) {
      if (request.key != null) for (let i = 0; i < this.measureRequests.length; i++) {
        if (this.measureRequests[i].key === request.key) {
          this.measureRequests[i] = request;
          return;
        }
      }
      this.measureRequests.push(request);
    }
  }
  pluginField(field) {
    let result = [];
    for (let plugin of this.plugins) plugin.update(this).takeField(field, result);
    return result;
  }
  plugin(plugin) {
    for (let inst of this.plugins) if (inst.spec == plugin) return inst.update(this).value;
    return null;
  }
  blockAtHeight(height, editorTop) {
    this.readMeasured();
    return this.viewState.blockAtHeight(height, ensureTop(editorTop, this.contentDOM));
  }
  visualLineAtHeight(height, editorTop) {
    this.readMeasured();
    return this.viewState.lineAtHeight(height, ensureTop(editorTop, this.contentDOM));
  }
  viewportLines(f, editorTop) {
    let {from, to} = this.viewport;
    this.viewState.forEachLine(from, to, f, ensureTop(editorTop, this.contentDOM));
  }
  visualLineAt(pos, editorTop = 0) {
    return this.viewState.lineAt(pos, editorTop);
  }
  get contentHeight() {
    return this.viewState.contentHeight;
  }
  moveByChar(start, forward, by) {
    return moveByChar(this, start, forward, by);
  }
  moveByGroup(start, forward) {
    return moveByChar(this, start, forward, initial => byGroup(this, start.head, initial));
  }
  moveToLineBoundary(start, forward, includeWrap = true) {
    return moveToLineBoundary(this, start, forward, includeWrap);
  }
  moveVertically(start, forward, distance) {
    return moveVertically(this, start, forward, distance);
  }
  scrollPosIntoView(pos) {
    this.viewState.scrollTo = state_1.EditorSelection.cursor(pos);
    this.requestMeasure();
  }
  domAtPos(pos) {
    return this.docView.domAtPos(pos);
  }
  posAtDOM(node, offset = 0) {
    return this.docView.posFromDOM(node, offset);
  }
  posAtCoords(coords) {
    this.readMeasured();
    return posAtCoords(this, coords);
  }
  coordsAtPos(pos, side = 1) {
    this.readMeasured();
    let rect = this.docView.coordsAt(pos, side);
    if (!rect || rect.left == rect.right) return rect;
    let line = this.state.doc.lineAt(pos), order = this.bidiSpans(line);
    let span = order[BidiSpan.find(order, pos - line.from, -1, side)];
    return flattenRect(rect, span.dir == Direction.LTR == side > 0);
  }
  get defaultCharacterWidth() {
    return this.viewState.heightOracle.charWidth;
  }
  get defaultLineHeight() {
    return this.viewState.heightOracle.lineHeight;
  }
  get textDirection() {
    return this.viewState.heightOracle.direction;
  }
  get lineWrapping() {
    return this.viewState.heightOracle.lineWrapping;
  }
  bidiSpans(line) {
    if (line.length > MaxBidiLine) return trivialOrder(line.length);
    let dir = this.textDirection;
    for (let entry of this.bidiCache) if (entry.from == line.from && entry.dir == dir) return entry.order;
    let order = computeOrder(line.text, this.textDirection);
    this.bidiCache.push(new CachedOrder(line.from, line.to, dir, order));
    return order;
  }
  get hasFocus() {
    return document.hasFocus() && this.root.activeElement == this.contentDOM;
  }
  focus() {
    this.observer.ignore(() => {
      focusPreventScroll(this.contentDOM);
      this.docView.updateSelection();
    });
  }
  destroy() {
    for (let plugin of this.plugins) plugin.destroy(this);
    this.inputState.destroy();
    this.dom.remove();
    this.observer.destroy();
    if (this.measureScheduled > -1) cancelAnimationFrame(this.measureScheduled);
  }
  static domEventHandlers(handlers) {
    return ViewPlugin.define(() => ({}), {
      eventHandlers: handlers
    });
  }
  static theme(spec, options) {
    let prefix = style_mod_1.StyleModule.newName();
    let result = [theme.of(prefix), styleModule.of(buildTheme(`.${prefix}`, spec))];
    if (options && options.dark) result.push(darkTheme.of(true));
    return result;
  }
  static baseTheme(spec) {
    return state_1.Prec.fallback(styleModule.of(buildTheme("." + baseThemeID, spec, lightDarkIDs)));
  }
}
EditorView.styleModule = styleModule;
EditorView.inputHandler = inputHandler;
EditorView.exceptionSink = exceptionSink;
EditorView.updateListener = updateListener;
EditorView.editable = editable;
EditorView.mouseSelectionStyle = mouseSelectionStyle;
EditorView.dragMovesSelection = dragMovesSelection$1;
EditorView.clickAddsSelectionRange = clickAddsSelectionRange;
EditorView.decorations = decorations;
EditorView.contentAttributes = contentAttributes;
EditorView.editorAttributes = editorAttributes;
EditorView.lineWrapping = EditorView.contentAttributes.of({
  "class": "cm-lineWrapping"
});
EditorView.announce = state_1.StateEffect.define();
const MaxBidiLine = 4096;
function ensureTop(given, dom) {
  return given == null ? dom.getBoundingClientRect().top : given;
}
let resizeDebounce = -1;
function ensureGlobalHandler() {
  window.addEventListener("resize", () => {
    if (resizeDebounce == -1) resizeDebounce = setTimeout(handleResize, 50);
  });
}
function handleResize() {
  resizeDebounce = -1;
  let found = document.querySelectorAll(".cm-content");
  for (let i = 0; i < found.length; i++) {
    let docView = ContentView.get(found[i]);
    if (docView) docView.editorView.requestMeasure();
  }
}
const BadMeasure = {};
class CachedOrder {
  constructor(from, to, dir, order) {
    this.from = from;
    this.to = to;
    this.dir = dir;
    this.order = order;
  }
  static update(cache, changes) {
    if (changes.empty) return cache;
    let result = [], lastDir = cache.length ? cache[cache.length - 1].dir : Direction.LTR;
    for (let i = Math.max(0, cache.length - 10); i < cache.length; i++) {
      let entry = cache[i];
      if (entry.dir == lastDir && !changes.touchesRange(entry.from, entry.to)) result.push(new CachedOrder(changes.mapPos(entry.from, 1), changes.mapPos(entry.to, -1), entry.dir, entry.order));
    }
    return result;
  }
}
const currentPlatform = typeof navigator == "undefined" ? "key" : (/Mac/).test(navigator.platform) ? "mac" : (/Win/).test(navigator.platform) ? "win" : (/Linux|X11/).test(navigator.platform) ? "linux" : "key";
function normalizeKeyName(name, platform) {
  const parts = name.split(/-(?!$)/);
  let result = parts[parts.length - 1];
  if (result == "Space") result = " ";
  let alt, ctrl, shift, meta;
  for (let i = 0; i < parts.length - 1; ++i) {
    const mod = parts[i];
    if ((/^(cmd|meta|m)$/i).test(mod)) meta = true; else if ((/^a(lt)?$/i).test(mod)) alt = true; else if ((/^(c|ctrl|control)$/i).test(mod)) ctrl = true; else if ((/^s(hift)?$/i).test(mod)) shift = true; else if ((/^mod$/i).test(mod)) {
      if (platform == "mac") meta = true; else ctrl = true;
    } else throw new Error("Unrecognized modifier name: " + mod);
  }
  if (alt) result = "Alt-" + result;
  if (ctrl) result = "Ctrl-" + result;
  if (meta) result = "Meta-" + result;
  if (shift) result = "Shift-" + result;
  return result;
}
function modifiers(name, event, shift) {
  if (event.altKey) name = "Alt-" + name;
  if (event.ctrlKey) name = "Ctrl-" + name;
  if (event.metaKey) name = "Meta-" + name;
  if (shift !== false && event.shiftKey) name = "Shift-" + name;
  return name;
}
const handleKeyEvents = EditorView.domEventHandlers({
  keydown(event, view) {
    return runHandlers(getKeymap(view.state), event, view, "editor");
  }
});
const keymap = state_1.Facet.define({
  enables: handleKeyEvents
});
const Keymaps = new WeakMap();
function getKeymap(state) {
  let bindings = state.facet(keymap);
  let map = Keymaps.get(bindings);
  if (!map) Keymaps.set(bindings, map = buildKeymap(bindings.reduce((a, b) => a.concat(b), [])));
  return map;
}
function runScopeHandlers(view, event, scope) {
  return runHandlers(getKeymap(view.state), event, view, scope);
}
let storedPrefix = null;
const PrefixTimeout = 4000;
function buildKeymap(bindings, platform = currentPlatform) {
  let bound = Object.create(null);
  let isPrefix = Object.create(null);
  let checkPrefix = (name, is) => {
    let current = isPrefix[name];
    if (current == null) isPrefix[name] = is; else if (current != is) throw new Error("Key binding " + name + " is used both as a regular binding and as a multi-stroke prefix");
  };
  let add = (scope, key, command, preventDefault) => {
    let scopeObj = bound[scope] || (bound[scope] = Object.create(null));
    let parts = key.split(/ (?!$)/).map(k => normalizeKeyName(k, platform));
    for (let i = 1; i < parts.length; i++) {
      let prefix = parts.slice(0, i).join(" ");
      checkPrefix(prefix, true);
      if (!scopeObj[prefix]) scopeObj[prefix] = {
        preventDefault: true,
        commands: [view => {
          let ourObj = storedPrefix = {
            view,
            prefix,
            scope
          };
          setTimeout(() => {
            if (storedPrefix == ourObj) storedPrefix = null;
          }, PrefixTimeout);
          return true;
        }]
      };
    }
    let full = parts.join(" ");
    checkPrefix(full, false);
    let binding = scopeObj[full] || (scopeObj[full] = {
      preventDefault: false,
      commands: []
    });
    binding.commands.push(command);
    if (preventDefault) binding.preventDefault = true;
  };
  for (let b of bindings) {
    let name = b[platform] || b.key;
    if (!name) continue;
    for (let scope of b.scope ? b.scope.split(" ") : ["editor"]) {
      add(scope, name, b.run, b.preventDefault);
      if (b.shift) add(scope, "Shift-" + name, b.shift, b.preventDefault);
    }
  }
  return bound;
}
function runHandlers(map, event, view, scope) {
  let name = w3c_keyname_1.keyName(event), isChar = name.length == 1 && name != " ";
  let prefix = "", fallthrough = false;
  if (storedPrefix && storedPrefix.view == view && storedPrefix.scope == scope) {
    prefix = storedPrefix.prefix + " ";
    if (fallthrough = modifierCodes.indexOf(event.keyCode) < 0) storedPrefix = null;
  }
  let runFor = binding => {
    if (binding) {
      for (let cmd of binding.commands) if (cmd(view)) return true;
      if (binding.preventDefault) fallthrough = true;
    }
    return false;
  };
  let scopeObj = map[scope], baseName;
  if (scopeObj) {
    if (runFor(scopeObj[prefix + modifiers(name, event, !isChar)])) return true;
    if (isChar && (event.shiftKey || event.altKey || event.metaKey) && (baseName = w3c_keyname_1.base[event.keyCode]) && baseName != name) {
      if (runFor(scopeObj[prefix + modifiers(baseName, event, true)])) return true;
    } else if (isChar && event.shiftKey) {
      if (runFor(scopeObj[prefix + modifiers(name, event, true)])) return true;
    }
  }
  return fallthrough;
}
const CanHidePrimary = !browser.ios;
const selectionConfig = state_1.Facet.define({
  combine(configs) {
    return state_1.combineConfig(configs, {
      cursorBlinkRate: 1200,
      drawRangeCursor: true
    }, {
      cursorBlinkRate: (a, b) => Math.min(a, b),
      drawRangeCursor: (a, b) => a || b
    });
  }
});
function drawSelection(config = {}) {
  return [selectionConfig.of(config), drawSelectionPlugin, hideNativeSelection];
}
class Piece {
  constructor(left, top, width, height, className) {
    this.left = left;
    this.top = top;
    this.width = width;
    this.height = height;
    this.className = className;
  }
  draw() {
    let elt = document.createElement("div");
    elt.className = this.className;
    this.adjust(elt);
    return elt;
  }
  adjust(elt) {
    elt.style.left = this.left + "px";
    elt.style.top = this.top + "px";
    if (this.width >= 0) elt.style.width = this.width + "px";
    elt.style.height = this.height + "px";
  }
  eq(p) {
    return this.left == p.left && this.top == p.top && this.width == p.width && this.height == p.height && this.className == p.className;
  }
}
const drawSelectionPlugin = ViewPlugin.fromClass(class {
  constructor(view) {
    this.view = view;
    this.rangePieces = [];
    this.cursors = [];
    this.measureReq = {
      read: this.readPos.bind(this),
      write: this.drawSel.bind(this)
    };
    this.selectionLayer = view.scrollDOM.appendChild(document.createElement("div"));
    this.selectionLayer.className = "cm-selectionLayer";
    this.selectionLayer.setAttribute("aria-hidden", "true");
    this.cursorLayer = view.scrollDOM.appendChild(document.createElement("div"));
    this.cursorLayer.className = "cm-cursorLayer";
    this.cursorLayer.setAttribute("aria-hidden", "true");
    view.requestMeasure(this.measureReq);
    this.setBlinkRate();
  }
  setBlinkRate() {
    this.cursorLayer.style.animationDuration = this.view.state.facet(selectionConfig).cursorBlinkRate + "ms";
  }
  update(update) {
    let confChanged = update.startState.facet(selectionConfig) != update.state.facet(selectionConfig);
    if (confChanged || update.selectionSet || update.geometryChanged || update.viewportChanged) this.view.requestMeasure(this.measureReq);
    if (update.transactions.some(tr => tr.scrollIntoView)) this.cursorLayer.style.animationName = this.cursorLayer.style.animationName == "cm-blink" ? "cm-blink2" : "cm-blink";
    if (confChanged) this.setBlinkRate();
  }
  readPos() {
    let {state} = this.view, conf = state.facet(selectionConfig);
    let rangePieces = state.selection.ranges.map(r => r.empty ? [] : measureRange(this.view, r)).reduce((a, b) => a.concat(b));
    let cursors = [];
    for (let r of state.selection.ranges) {
      let prim = r == state.selection.main;
      if (r.empty ? !prim || CanHidePrimary : conf.drawRangeCursor) {
        let piece = measureCursor(this.view, r, prim);
        if (piece) cursors.push(piece);
      }
    }
    return {
      rangePieces,
      cursors
    };
  }
  drawSel({rangePieces, cursors}) {
    if (rangePieces.length != this.rangePieces.length || rangePieces.some((p, i) => !p.eq(this.rangePieces[i]))) {
      this.selectionLayer.textContent = "";
      for (let p of rangePieces) this.selectionLayer.appendChild(p.draw());
      this.rangePieces = rangePieces;
    }
    if (cursors.length != this.cursors.length || cursors.some((c, i) => !c.eq(this.cursors[i]))) {
      let oldCursors = this.cursorLayer.children;
      if (oldCursors.length !== cursors.length) {
        this.cursorLayer.textContent = "";
        for (const c of cursors) this.cursorLayer.appendChild(c.draw());
      } else {
        cursors.forEach((c, idx) => c.adjust(oldCursors[idx]));
      }
      this.cursors = cursors;
    }
  }
  destroy() {
    this.selectionLayer.remove();
    this.cursorLayer.remove();
  }
});
const themeSpec = {
  ".cm-line": {
    "& ::selection": {
      backgroundColor: "transparent !important"
    },
    "&::selection": {
      backgroundColor: "transparent !important"
    }
  }
};
if (CanHidePrimary) themeSpec[".cm-line"].caretColor = "transparent !important";
const hideNativeSelection = state_1.Prec.override(EditorView.theme(themeSpec));
function getBase(view) {
  let rect = view.scrollDOM.getBoundingClientRect();
  let left = view.textDirection == Direction.LTR ? rect.left : rect.right - view.scrollDOM.clientWidth;
  return {
    left: left - view.scrollDOM.scrollLeft,
    top: rect.top - view.scrollDOM.scrollTop
  };
}
function wrappedLine(view, pos, inside) {
  let range = state_1.EditorSelection.cursor(pos);
  return {
    from: Math.max(inside.from, view.moveToLineBoundary(range, false, true).from),
    to: Math.min(inside.to, view.moveToLineBoundary(range, true, true).from)
  };
}
function measureRange(view, range) {
  if (range.to <= view.viewport.from || range.from >= view.viewport.to) return [];
  let from = Math.max(range.from, view.viewport.from), to = Math.min(range.to, view.viewport.to);
  let ltr = view.textDirection == Direction.LTR;
  let content = view.contentDOM, contentRect = content.getBoundingClientRect(), base = getBase(view);
  let lineStyle = window.getComputedStyle(content.firstChild);
  let leftSide = contentRect.left + parseInt(lineStyle.paddingLeft);
  let rightSide = contentRect.right - parseInt(lineStyle.paddingRight);
  let visualStart = view.visualLineAt(from);
  let visualEnd = view.visualLineAt(to);
  if (view.lineWrapping) {
    visualStart = wrappedLine(view, from, visualStart);
    visualEnd = wrappedLine(view, to, visualEnd);
  }
  if (visualStart.from == visualEnd.from) {
    return pieces(drawForLine(range.from, range.to, visualStart));
  } else {
    let top = drawForLine(range.from, null, visualStart);
    let bottom = drawForLine(null, range.to, visualEnd);
    let between = [];
    if (visualStart.to < visualEnd.from - 1) between.push(piece(leftSide, top.bottom, rightSide, bottom.top)); else if (top.bottom < bottom.top && bottom.top - top.bottom < 4) top.bottom = bottom.top = (top.bottom + bottom.top) / 2;
    return pieces(top).concat(between).concat(pieces(bottom));
  }
  function piece(left, top, right, bottom) {
    return new Piece(left - base.left, top - base.top, right - left, bottom - top, "cm-selectionBackground");
  }
  function pieces({top, bottom, horizontal}) {
    let pieces = [];
    for (let i = 0; i < horizontal.length; i += 2) pieces.push(piece(horizontal[i], top, horizontal[i + 1], bottom));
    return pieces;
  }
  function drawForLine(from, to, line) {
    let top = 1e9, bottom = -1e9, horizontal = [];
    function addSpan(from, fromOpen, to, toOpen, dir) {
      let fromCoords = view.coordsAtPos(from, from == line.to ? -1 : 1);
      let toCoords = view.coordsAtPos(to, to == line.from ? 1 : -1);
      top = Math.min(fromCoords.top, toCoords.top, top);
      bottom = Math.max(fromCoords.bottom, toCoords.bottom, bottom);
      if (dir == Direction.LTR) horizontal.push(ltr && fromOpen ? leftSide : fromCoords.left, ltr && toOpen ? rightSide : toCoords.right); else horizontal.push(!ltr && toOpen ? leftSide : toCoords.left, !ltr && fromOpen ? rightSide : fromCoords.right);
    }
    let start = from !== null && from !== void 0 ? from : line.from, end = to !== null && to !== void 0 ? to : line.to;
    for (let r of view.visibleRanges) if (r.to > start && r.from < end) {
      for (let pos = Math.max(r.from, start), endPos = Math.min(r.to, end); ; ) {
        let docLine = view.state.doc.lineAt(pos);
        for (let span of view.bidiSpans(docLine)) {
          let spanFrom = span.from + docLine.from, spanTo = span.to + docLine.from;
          if (spanFrom >= endPos) break;
          if (spanTo > pos) addSpan(Math.max(spanFrom, pos), from == null && spanFrom <= start, Math.min(spanTo, endPos), to == null && spanTo >= end, span.dir);
        }
        pos = docLine.to + 1;
        if (pos >= endPos) break;
      }
    }
    if (horizontal.length == 0) {
      let coords = view.coordsAtPos(start, -1);
      top = Math.min(coords.top, top);
      bottom = Math.max(coords.bottom, bottom);
    }
    return {
      top,
      bottom,
      horizontal
    };
  }
}
function measureCursor(view, cursor, primary) {
  let pos = view.coordsAtPos(cursor.head, cursor.assoc || 1);
  if (!pos) return null;
  let base = getBase(view);
  return new Piece(pos.left - base.left, pos.top - base.top, -1, pos.bottom - pos.top, primary ? "cm-cursor cm-cursor-primary" : "cm-cursor cm-cursor-secondary");
}
function iterMatches(doc, re, from, to, f) {
  re.lastIndex = 0;
  for (let cursor = doc.iterRange(from, to), pos = from, m; !cursor.next().done; pos += cursor.value.length) {
    if (!cursor.lineBreak) while (m = re.exec(cursor.value)) f(pos + m.index, pos + m.index + m[0].length, m);
  }
}
class MatchDecorator {
  constructor(config) {
    let {regexp, decoration, boundary} = config;
    if (!regexp.global) throw new RangeError("The regular expression given to MatchDecorator should have its 'g' flag set");
    this.regexp = regexp;
    this.getDeco = typeof decoration == "function" ? decoration : () => decoration;
    this.boundary = boundary;
  }
  createDeco(view) {
    let build = new rangeset_1.RangeSetBuilder();
    for (let {from, to} of view.visibleRanges) iterMatches(view.state.doc, this.regexp, from, to, (a, b, m) => build.add(a, b, this.getDeco(m, view, a)));
    return build.finish();
  }
  updateDeco(update, deco) {
    let changeFrom = 1e9, changeTo = -1;
    if (update.docChanged) update.changes.iterChanges((_f, _t, from, to) => {
      if (to > update.view.viewport.from && from < update.view.viewport.to) {
        changeFrom = Math.min(from, changeFrom);
        changeTo = Math.max(to, changeTo);
      }
    });
    if (update.viewportChanged || changeTo - changeFrom > 1000) return this.createDeco(update.view);
    if (changeTo > -1) return this.updateRange(update.view, deco.map(update.changes), changeFrom, changeTo);
    return deco;
  }
  updateRange(view, deco, updateFrom, updateTo) {
    for (let r of view.visibleRanges) {
      let from = Math.max(r.from, updateFrom), to = Math.min(r.to, updateTo);
      if (to > from) {
        let fromLine = view.state.doc.lineAt(from), toLine = fromLine.to < to ? view.state.doc.lineAt(to) : fromLine;
        let start = Math.max(r.from, fromLine.from), end = Math.min(r.to, toLine.to);
        if (this.boundary) {
          for (; from > fromLine.from; from--) if (this.boundary.test(fromLine.text[from - 1 - fromLine.from])) {
            start = from;
            break;
          }
          for (; to < toLine.to; to++) if (this.boundary.test(toLine.text[to - toLine.from])) {
            end = to;
            break;
          }
        }
        let ranges = [], m;
        if (fromLine == toLine) {
          this.regexp.lastIndex = start - fromLine.from;
          while ((m = this.regexp.exec(fromLine.text)) && m.index < end - fromLine.from) {
            let pos = m.index + fromLine.from;
            ranges.push(this.getDeco(m, view, pos).range(pos, pos + m[0].length));
          }
        } else {
          iterMatches(view.state.doc, this.regexp, start, end, (from, to, m) => ranges.push(this.getDeco(m, view, from).range(from, to)));
        }
        deco = deco.update({
          filterFrom: start,
          filterTo: end,
          filter: () => false,
          add: ranges
        });
      }
    }
    return deco;
  }
}
const UnicodeRegexpSupport = (/x/).unicode != null ? "gu" : "g";
const Specials = new RegExp("[\u0000-\u0008\u000a-\u001f\u007f-\u009f\u00ad\u061c\u200b\u200e\u200f\u2028\u2029\ufeff\ufff9-\ufffc]", UnicodeRegexpSupport);
const Names = {
  0: "null",
  7: "bell",
  8: "backspace",
  10: "newline",
  11: "vertical tab",
  13: "carriage return",
  27: "escape",
  8203: "zero width space",
  8204: "zero width non-joiner",
  8205: "zero width joiner",
  8206: "left-to-right mark",
  8207: "right-to-left mark",
  8232: "line separator",
  8233: "paragraph separator",
  65279: "zero width no-break space",
  65532: "object replacement"
};
let _supportsTabSize = null;
function supportsTabSize() {
  if (_supportsTabSize == null && typeof document != "undefined" && document.body) {
    let styles = document.body.style;
    _supportsTabSize = (styles.tabSize || styles.MozTabSize) != null;
  }
  return _supportsTabSize || false;
}
const specialCharConfig = state_1.Facet.define({
  combine(configs) {
    let config = state_1.combineConfig(configs, {
      render: null,
      specialChars: Specials,
      addSpecialChars: null
    });
    if (config.replaceTabs = !supportsTabSize()) config.specialChars = new RegExp("\t|" + config.specialChars.source, UnicodeRegexpSupport);
    if (config.addSpecialChars) config.specialChars = new RegExp(config.specialChars.source + "|" + config.addSpecialChars.source, UnicodeRegexpSupport);
    return config;
  }
});
function highlightSpecialChars(config = {}) {
  return [specialCharConfig.of(config), specialCharPlugin()];
}
let _plugin = null;
function specialCharPlugin() {
  return _plugin || (_plugin = ViewPlugin.fromClass(class {
    constructor(view) {
      this.view = view;
      this.decorations = Decoration.none;
      this.decorationCache = Object.create(null);
      this.decorator = this.makeDecorator(view.state.facet(specialCharConfig));
      this.decorations = this.decorator.createDeco(view);
    }
    makeDecorator(conf) {
      return new MatchDecorator({
        regexp: conf.specialChars,
        decoration: (m, view, pos) => {
          let {doc} = view.state;
          let code = text_1.codePointAt(m[0], 0);
          if (code == 9) {
            let line = doc.lineAt(pos);
            let size = view.state.tabSize, col = text_1.countColumn(doc.sliceString(line.from, pos), 0, size);
            return Decoration.replace({
              widget: new TabWidget((size - col % size) * this.view.defaultCharacterWidth)
            });
          }
          return this.decorationCache[code] || (this.decorationCache[code] = Decoration.replace({
            widget: new SpecialCharWidget(conf, code)
          }));
        },
        boundary: conf.replaceTabs ? undefined : /[^]/
      });
    }
    update(update) {
      let conf = update.state.facet(specialCharConfig);
      if (update.startState.facet(specialCharConfig) != conf) {
        this.decorator = this.makeDecorator(conf);
        this.decorations = this.decorator.createDeco(update.view);
      } else {
        this.decorations = this.decorator.updateDeco(update, this.decorations);
      }
    }
  }, {
    decorations: v => v.decorations
  }));
}
const DefaultPlaceholder = "\u2022";
function placeholder$1(code) {
  if (code >= 32) return DefaultPlaceholder;
  if (code == 10) return "\u2424";
  return String.fromCharCode(9216 + code);
}
class SpecialCharWidget extends WidgetType {
  constructor(options, code) {
    super();
    this.options = options;
    this.code = code;
  }
  eq(other) {
    return other.code == this.code;
  }
  toDOM(view) {
    let ph = placeholder$1(this.code);
    let desc = view.state.phrase("Control character ") + (Names[this.code] || "0x" + this.code.toString(16));
    let custom = this.options.render && this.options.render(this.code, desc, ph);
    if (custom) return custom;
    let span = document.createElement("span");
    span.textContent = ph;
    span.title = desc;
    span.setAttribute("aria-label", desc);
    span.className = "cm-specialChar";
    return span;
  }
  ignoreEvent() {
    return false;
  }
}
class TabWidget extends WidgetType {
  constructor(width) {
    super();
    this.width = width;
  }
  eq(other) {
    return other.width == this.width;
  }
  toDOM() {
    let span = document.createElement("span");
    span.textContent = "\t";
    span.className = "cm-tab";
    span.style.width = this.width + "px";
    return span;
  }
  ignoreEvent() {
    return false;
  }
}
function highlightActiveLine() {
  return activeLineHighlighter;
}
const lineDeco = Decoration.line({
  attributes: {
    class: "cm-activeLine"
  }
});
const activeLineHighlighter = ViewPlugin.fromClass(class {
  constructor(view) {
    this.decorations = this.getDeco(view);
  }
  update(update) {
    if (update.docChanged || update.selectionSet) this.decorations = this.getDeco(update.view);
  }
  getDeco(view) {
    let lastLineStart = -1, deco = [];
    for (let r of view.state.selection.ranges) {
      if (!r.empty) continue;
      let line = view.visualLineAt(r.head);
      if (line.from > lastLineStart) {
        deco.push(lineDeco.range(line.from));
        lastLineStart = line.from;
      }
    }
    return Decoration.set(deco);
  }
}, {
  decorations: v => v.decorations
});
class Placeholder extends WidgetType {
  constructor(content) {
    super();
    this.content = content;
  }
  toDOM() {
    let wrap = document.createElement("span");
    wrap.className = "cm-placeholder";
    wrap.style.pointerEvents = "none";
    wrap.appendChild(typeof this.content == "string" ? document.createTextNode(this.content) : this.content);
    if (typeof this.content == "string") wrap.setAttribute("aria-label", "placeholder " + this.content); else wrap.setAttribute("aria-hidden", "true");
    return wrap;
  }
  ignoreEvent() {
    return false;
  }
}
function placeholder(content) {
  return ViewPlugin.fromClass(class {
    constructor(view) {
      this.view = view;
      this.placeholder = Decoration.set([Decoration.widget({
        widget: new Placeholder(content),
        side: 1
      }).range(0)]);
    }
    get decorations() {
      return this.view.state.doc.length ? Decoration.none : this.placeholder;
    }
  }, {
    decorations: v => v.decorations
  });
}
const __test = {
  HeightMap,
  HeightOracle,
  MeasuredHeights,
  QueryType,
  ChangedRange,
  computeOrder,
  moveVisually
};
exports.BidiSpan = BidiSpan;
exports.BlockInfo = BlockInfo;
exports.BlockType = BlockType;
exports.Decoration = Decoration;
exports.Direction = Direction;
exports.EditorView = EditorView;
exports.MatchDecorator = MatchDecorator;
exports.PluginField = PluginField;
exports.PluginFieldProvider = PluginFieldProvider;
exports.ViewPlugin = ViewPlugin;
exports.ViewUpdate = ViewUpdate;
exports.WidgetType = WidgetType;
exports.__test = __test;
exports.drawSelection = drawSelection;
exports.highlightActiveLine = highlightActiveLine;
exports.highlightSpecialChars = highlightSpecialChars;
exports.keymap = keymap;
exports.logException = logException;
exports.placeholder = placeholder;
exports.runScopeHandlers = runScopeHandlers;

},

// node_modules/@codemirror/state/dist/index.js @15
15: function(__fusereq, exports, module){
exports.__esModule = true;
var text_1 = __fusereq(22);
var text_2 = __fusereq(22);
exports.Text = text_2.Text;
const DefaultSplit = /\r\n?|\n/;
var MapMode;
(function (MapMode) {
  MapMode[MapMode["Simple"] = 0] = "Simple";
  MapMode[MapMode["TrackDel"] = 1] = "TrackDel";
  MapMode[MapMode["TrackBefore"] = 2] = "TrackBefore";
  MapMode[MapMode["TrackAfter"] = 3] = "TrackAfter";
})(MapMode || (MapMode = {}));
class ChangeDesc {
  constructor(sections) {
    this.sections = sections;
  }
  get length() {
    let result = 0;
    for (let i = 0; i < this.sections.length; i += 2) result += this.sections[i];
    return result;
  }
  get newLength() {
    let result = 0;
    for (let i = 0; i < this.sections.length; i += 2) {
      let ins = this.sections[i + 1];
      result += ins < 0 ? this.sections[i] : ins;
    }
    return result;
  }
  get empty() {
    return this.sections.length == 0 || this.sections.length == 2 && this.sections[1] < 0;
  }
  iterGaps(f) {
    for (let i = 0, posA = 0, posB = 0; i < this.sections.length; ) {
      let len = this.sections[i++], ins = this.sections[i++];
      if (ins < 0) {
        f(posA, posB, len);
        posB += len;
      } else {
        posB += ins;
      }
      posA += len;
    }
  }
  iterChangedRanges(f, individual = false) {
    iterChanges(this, f, individual);
  }
  get invertedDesc() {
    let sections = [];
    for (let i = 0; i < this.sections.length; ) {
      let len = this.sections[i++], ins = this.sections[i++];
      if (ins < 0) sections.push(len, ins); else sections.push(ins, len);
    }
    return new ChangeDesc(sections);
  }
  composeDesc(other) {
    return this.empty ? other : other.empty ? this : composeSets(this, other);
  }
  mapDesc(other, before = false) {
    return other.empty ? this : mapSet(this, other, before);
  }
  mapPos(pos, assoc = -1, mode = MapMode.Simple) {
    let posA = 0, posB = 0;
    for (let i = 0; i < this.sections.length; ) {
      let len = this.sections[i++], ins = this.sections[i++], endA = posA + len;
      if (ins < 0) {
        if (endA > pos) return posB + (pos - posA);
        posB += len;
      } else {
        if (mode != MapMode.Simple && endA >= pos && (mode == MapMode.TrackDel && posA < pos && endA > pos || mode == MapMode.TrackBefore && posA < pos || mode == MapMode.TrackAfter && endA > pos)) return null;
        if (endA > pos || endA == pos && assoc < 0 && !len) return pos == posA || assoc < 0 ? posB : posB + ins;
        posB += ins;
      }
      posA = endA;
    }
    if (pos > posA) throw new RangeError(`Position ${pos} is out of range for changeset of length ${posA}`);
    return posB;
  }
  touchesRange(from, to = from) {
    for (let i = 0, pos = 0; i < this.sections.length && pos <= to; ) {
      let len = this.sections[i++], ins = this.sections[i++], end = pos + len;
      if (ins >= 0 && pos <= to && end >= from) return pos < from && end > to ? "cover" : true;
      pos = end;
    }
    return false;
  }
  toString() {
    let result = "";
    for (let i = 0; i < this.sections.length; ) {
      let len = this.sections[i++], ins = this.sections[i++];
      result += (result ? " " : "") + len + (ins >= 0 ? ":" + ins : "");
    }
    return result;
  }
}
class ChangeSet extends ChangeDesc {
  constructor(sections, inserted) {
    super(sections);
    this.inserted = inserted;
  }
  apply(doc) {
    if (this.length != doc.length) throw new RangeError("Applying change set to a document with the wrong length");
    iterChanges(this, (fromA, toA, fromB, _toB, text) => doc = doc.replace(fromB, fromB + (toA - fromA), text), false);
    return doc;
  }
  mapDesc(other, before = false) {
    return mapSet(this, other, before, true);
  }
  invert(doc) {
    let sections = this.sections.slice(), inserted = [];
    for (let i = 0, pos = 0; i < sections.length; i += 2) {
      let len = sections[i], ins = sections[i + 1];
      if (ins >= 0) {
        sections[i] = ins;
        sections[i + 1] = len;
        let index = i >> 1;
        while (inserted.length < index) inserted.push(text_1.Text.empty);
        inserted.push(len ? doc.slice(pos, pos + len) : text_1.Text.empty);
      }
      pos += len;
    }
    return new ChangeSet(sections, inserted);
  }
  compose(other) {
    return this.empty ? other : other.empty ? this : composeSets(this, other, true);
  }
  map(other, before = false) {
    return other.empty ? this : mapSet(this, other, before, true);
  }
  iterChanges(f, individual = false) {
    iterChanges(this, f, individual);
  }
  get desc() {
    return new ChangeDesc(this.sections);
  }
  filter(ranges) {
    let resultSections = [], resultInserted = [], filteredSections = [];
    let iter = new SectionIter(this);
    done: for (let i = 0, pos = 0; ; ) {
      let next = i == ranges.length ? 1e9 : ranges[i++];
      while (pos < next || pos == next && iter.len == 0) {
        if (iter.done) break done;
        let len = Math.min(iter.len, next - pos);
        addSection(filteredSections, len, -1);
        let ins = iter.ins == -1 ? -1 : iter.off == 0 ? iter.ins : 0;
        addSection(resultSections, len, ins);
        if (ins > 0) addInsert(resultInserted, resultSections, iter.text);
        iter.forward(len);
        pos += len;
      }
      let end = ranges[i++];
      while (pos < end) {
        if (iter.done) break done;
        let len = Math.min(iter.len, end - pos);
        addSection(resultSections, len, -1);
        addSection(filteredSections, len, iter.ins == -1 ? -1 : iter.off == 0 ? iter.ins : 0);
        iter.forward(len);
        pos += len;
      }
    }
    return {
      changes: new ChangeSet(resultSections, resultInserted),
      filtered: new ChangeDesc(filteredSections)
    };
  }
  toJSON() {
    let parts = [];
    for (let i = 0; i < this.sections.length; i += 2) {
      let len = this.sections[i], ins = this.sections[i + 1];
      if (ins < 0) parts.push(len); else if (ins == 0) parts.push([len]); else parts.push([len].concat(this.inserted[i >> 1].toJSON()));
    }
    return parts;
  }
  static of(changes, length, lineSep) {
    let sections = [], inserted = [], pos = 0;
    let total = null;
    function flush(force = false) {
      if (!force && !sections.length) return;
      if (pos < length) addSection(sections, length - pos, -1);
      let set = new ChangeSet(sections, inserted);
      total = total ? total.compose(set.map(total)) : set;
      sections = [];
      inserted = [];
      pos = 0;
    }
    function process(spec) {
      if (Array.isArray(spec)) {
        for (let sub of spec) process(sub);
      } else if (spec instanceof ChangeSet) {
        if (spec.length != length) throw new RangeError(`Mismatched change set length (got ${spec.length}, expected ${length})`);
        flush();
        total = total ? total.compose(spec.map(total)) : spec;
      } else {
        let {from, to = from, insert} = spec;
        if (from > to || from < 0 || to > length) throw new RangeError(`Invalid change range ${from} to ${to} (in doc of length ${length})`);
        let insText = !insert ? text_1.Text.empty : typeof insert == "string" ? text_1.Text.of(insert.split(lineSep || DefaultSplit)) : insert;
        let insLen = insText.length;
        if (from == to && insLen == 0) return;
        if (from < pos) flush();
        if (from > pos) addSection(sections, from - pos, -1);
        addSection(sections, to - from, insLen);
        addInsert(inserted, sections, insText);
        pos = to;
      }
    }
    process(changes);
    flush(!total);
    return total;
  }
  static empty(length) {
    return new ChangeSet(length ? [length, -1] : [], []);
  }
  static fromJSON(json) {
    if (!Array.isArray(json)) throw new RangeError("Invalid JSON representation of ChangeSet");
    let sections = [], inserted = [];
    for (let i = 0; i < json.length; i++) {
      let part = json[i];
      if (typeof part == "number") {
        sections.push(part, -1);
      } else if (!Array.isArray(part) || typeof part[0] != "number" || part.some((e, i) => i && typeof e != "string")) {
        throw new RangeError("Invalid JSON representation of ChangeSet");
      } else if (part.length == 1) {
        sections.push(part[0], 0);
      } else {
        while (inserted.length < i) inserted.push(text_1.Text.empty);
        inserted[i] = text_1.Text.of(part.slice(1));
        sections.push(part[0], inserted[i].length);
      }
    }
    return new ChangeSet(sections, inserted);
  }
}
function addSection(sections, len, ins, forceJoin = false) {
  if (len == 0 && ins <= 0) return;
  let last = sections.length - 2;
  if (last >= 0 && ins <= 0 && ins == sections[last + 1]) sections[last] += len; else if (len == 0 && sections[last] == 0) sections[last + 1] += ins; else if (forceJoin) {
    sections[last] += len;
    sections[last + 1] += ins;
  } else sections.push(len, ins);
}
function addInsert(values, sections, value) {
  if (value.length == 0) return;
  let index = sections.length - 2 >> 1;
  if (index < values.length) {
    values[values.length - 1] = values[values.length - 1].append(value);
  } else {
    while (values.length < index) values.push(text_1.Text.empty);
    values.push(value);
  }
}
function iterChanges(desc, f, individual) {
  let inserted = desc.inserted;
  for (let posA = 0, posB = 0, i = 0; i < desc.sections.length; ) {
    let len = desc.sections[i++], ins = desc.sections[i++];
    if (ins < 0) {
      posA += len;
      posB += len;
    } else {
      let endA = posA, endB = posB, text = text_1.Text.empty;
      for (; ; ) {
        endA += len;
        endB += ins;
        if (ins && inserted) text = text.append(inserted[i - 2 >> 1]);
        if (individual || i == desc.sections.length || desc.sections[i + 1] < 0) break;
        len = desc.sections[i++];
        ins = desc.sections[i++];
      }
      f(posA, endA, posB, endB, text);
      posA = endA;
      posB = endB;
    }
  }
}
function mapSet(setA, setB, before, mkSet = false) {
  let sections = [], insert = mkSet ? [] : null;
  let a = new SectionIter(setA), b = new SectionIter(setB);
  for (let posA = 0, posB = 0; ; ) {
    if (a.ins == -1) {
      posA += a.len;
      a.next();
    } else if (b.ins == -1 && posB < posA) {
      let skip = Math.min(b.len, posA - posB);
      b.forward(skip);
      addSection(sections, skip, -1);
      posB += skip;
    } else if (b.ins >= 0 && (a.done || posB < posA || posB == posA && (b.len < a.len || b.len == a.len && !before))) {
      addSection(sections, b.ins, -1);
      while (posA > posB && !a.done && posA + a.len < posB + b.len) {
        posA += a.len;
        a.next();
      }
      posB += b.len;
      b.next();
    } else if (a.ins >= 0) {
      let len = 0, end = posA + a.len;
      for (; ; ) {
        if (b.ins >= 0 && posB > posA && posB + b.len < end) {
          len += b.ins;
          posB += b.len;
          b.next();
        } else if (b.ins == -1 && posB < end) {
          let skip = Math.min(b.len, end - posB);
          len += skip;
          b.forward(skip);
          posB += skip;
        } else {
          break;
        }
      }
      addSection(sections, len, a.ins);
      if (insert) addInsert(insert, sections, a.text);
      posA = end;
      a.next();
    } else if (a.done && b.done) {
      return insert ? new ChangeSet(sections, insert) : new ChangeDesc(sections);
    } else {
      throw new Error("Mismatched change set lengths");
    }
  }
}
function composeSets(setA, setB, mkSet = false) {
  let sections = [];
  let insert = mkSet ? [] : null;
  let a = new SectionIter(setA), b = new SectionIter(setB);
  for (let open = false; ; ) {
    if (a.done && b.done) {
      return insert ? new ChangeSet(sections, insert) : new ChangeDesc(sections);
    } else if (a.ins == 0) {
      addSection(sections, a.len, 0, open);
      a.next();
    } else if (b.len == 0 && !b.done) {
      addSection(sections, 0, b.ins, open);
      if (insert) addInsert(insert, sections, b.text);
      b.next();
    } else if (a.done || b.done) {
      throw new Error("Mismatched change set lengths");
    } else {
      let len = Math.min(a.len2, b.len), sectionLen = sections.length;
      if (a.ins == -1) {
        let insB = b.ins == -1 ? -1 : b.off ? 0 : b.ins;
        addSection(sections, len, insB, open);
        if (insert && insB) addInsert(insert, sections, b.text);
      } else if (b.ins == -1) {
        addSection(sections, a.off ? 0 : a.len, len, open);
        if (insert) addInsert(insert, sections, a.textBit(len));
      } else {
        addSection(sections, a.off ? 0 : a.len, b.off ? 0 : b.ins, open);
        if (insert && !b.off) addInsert(insert, sections, b.text);
      }
      open = (a.ins > len || b.ins >= 0 && b.len > len) && (open || sections.length > sectionLen);
      a.forward2(len);
      b.forward(len);
    }
  }
}
class SectionIter {
  constructor(set) {
    this.set = set;
    this.i = 0;
    this.next();
  }
  next() {
    let {sections} = this.set;
    if (this.i < sections.length) {
      this.len = sections[this.i++];
      this.ins = sections[this.i++];
    } else {
      this.len = 0;
      this.ins = -2;
    }
    this.off = 0;
  }
  get done() {
    return this.ins == -2;
  }
  get len2() {
    return this.ins < 0 ? this.len : this.ins;
  }
  get text() {
    let {inserted} = this.set, index = this.i - 2 >> 1;
    return index >= inserted.length ? text_1.Text.empty : inserted[index];
  }
  textBit(len) {
    let {inserted} = this.set, index = this.i - 2 >> 1;
    return index >= inserted.length && !len ? text_1.Text.empty : inserted[index].slice(this.off, len == null ? undefined : this.off + len);
  }
  forward(len) {
    if (len == this.len) this.next(); else {
      this.len -= len;
      this.off += len;
    }
  }
  forward2(len) {
    if (this.ins == -1) this.forward(len); else if (len == this.ins) this.next(); else {
      this.ins -= len;
      this.off += len;
    }
  }
}
class SelectionRange {
  constructor(from, to, flags) {
    this.from = from;
    this.to = to;
    this.flags = flags;
  }
  get anchor() {
    return this.flags & 16 ? this.to : this.from;
  }
  get head() {
    return this.flags & 16 ? this.from : this.to;
  }
  get empty() {
    return this.from == this.to;
  }
  get assoc() {
    return this.flags & 4 ? -1 : this.flags & 8 ? 1 : 0;
  }
  get bidiLevel() {
    let level = this.flags & 3;
    return level == 3 ? null : level;
  }
  get goalColumn() {
    let value = this.flags >> 5;
    return value == 33554431 ? undefined : value;
  }
  map(change, assoc = -1) {
    let from = change.mapPos(this.from, assoc), to = change.mapPos(this.to, assoc);
    return from == this.from && to == this.to ? this : new SelectionRange(from, to, this.flags);
  }
  extend(from, to = from) {
    if (from <= this.anchor && to >= this.anchor) return EditorSelection.range(from, to);
    let head = Math.abs(from - this.anchor) > Math.abs(to - this.anchor) ? from : to;
    return EditorSelection.range(this.anchor, head);
  }
  eq(other) {
    return this.anchor == other.anchor && this.head == other.head;
  }
  toJSON() {
    return {
      anchor: this.anchor,
      head: this.head
    };
  }
  static fromJSON(json) {
    if (!json || typeof json.anchor != "number" || typeof json.head != "number") throw new RangeError("Invalid JSON representation for SelectionRange");
    return EditorSelection.range(json.anchor, json.head);
  }
}
class EditorSelection {
  constructor(ranges, mainIndex = 0) {
    this.ranges = ranges;
    this.mainIndex = mainIndex;
  }
  map(change, assoc = -1) {
    if (change.empty) return this;
    return EditorSelection.create(this.ranges.map(r => r.map(change, assoc)), this.mainIndex);
  }
  eq(other) {
    if (this.ranges.length != other.ranges.length || this.mainIndex != other.mainIndex) return false;
    for (let i = 0; i < this.ranges.length; i++) if (!this.ranges[i].eq(other.ranges[i])) return false;
    return true;
  }
  get main() {
    return this.ranges[this.mainIndex];
  }
  asSingle() {
    return this.ranges.length == 1 ? this : new EditorSelection([this.main]);
  }
  addRange(range, main = true) {
    return EditorSelection.create([range].concat(this.ranges), main ? 0 : this.mainIndex + 1);
  }
  replaceRange(range, which = this.mainIndex) {
    let ranges = this.ranges.slice();
    ranges[which] = range;
    return EditorSelection.create(ranges, this.mainIndex);
  }
  toJSON() {
    return {
      ranges: this.ranges.map(r => r.toJSON()),
      main: this.mainIndex
    };
  }
  static fromJSON(json) {
    if (!json || !Array.isArray(json.ranges) || typeof json.main != "number" || json.main >= json.ranges.length) throw new RangeError("Invalid JSON representation for EditorSelection");
    return new EditorSelection(json.ranges.map(r => SelectionRange.fromJSON(r)), json.main);
  }
  static single(anchor, head = anchor) {
    return new EditorSelection([EditorSelection.range(anchor, head)], 0);
  }
  static create(ranges, mainIndex = 0) {
    if (ranges.length == 0) throw new RangeError("A selection needs at least one range");
    for (let pos = 0, i = 0; i < ranges.length; i++) {
      let range = ranges[i];
      if (range.empty ? range.from <= pos : range.from < pos) return normalized(ranges.slice(), mainIndex);
      pos = range.to;
    }
    return new EditorSelection(ranges, mainIndex);
  }
  static cursor(pos, assoc = 0, bidiLevel, goalColumn) {
    return new SelectionRange(pos, pos, (assoc == 0 ? 0 : assoc < 0 ? 4 : 8) | (bidiLevel == null ? 3 : Math.min(2, bidiLevel)) | (goalColumn !== null && goalColumn !== void 0 ? goalColumn : 33554431) << 5);
  }
  static range(anchor, head, goalColumn) {
    let goal = (goalColumn !== null && goalColumn !== void 0 ? goalColumn : 33554431) << 5;
    return head < anchor ? new SelectionRange(head, anchor, 16 | goal) : new SelectionRange(anchor, head, goal);
  }
}
function normalized(ranges, mainIndex = 0) {
  let main = ranges[mainIndex];
  ranges.sort((a, b) => a.from - b.from);
  mainIndex = ranges.indexOf(main);
  for (let i = 1; i < ranges.length; i++) {
    let range = ranges[i], prev = ranges[i - 1];
    if (range.empty ? range.from <= prev.to : range.from < prev.to) {
      let from = prev.from, to = Math.max(range.to, prev.to);
      if (i <= mainIndex) mainIndex--;
      ranges.splice(--i, 2, range.anchor > range.head ? EditorSelection.range(to, from) : EditorSelection.range(from, to));
    }
  }
  return new EditorSelection(ranges, mainIndex);
}
function checkSelection(selection, docLength) {
  for (let range of selection.ranges) if (range.to > docLength) throw new RangeError("Selection points outside of document");
}
let nextID = 0;
class Facet {
  constructor(combine, compareInput, compare, isStatic, extensions) {
    this.combine = combine;
    this.compareInput = compareInput;
    this.compare = compare;
    this.isStatic = isStatic;
    this.extensions = extensions;
    this.id = nextID++;
    this.default = combine([]);
  }
  static define(config = {}) {
    return new Facet(config.combine || (a => a), config.compareInput || ((a, b) => a === b), config.compare || (!config.combine ? sameArray : (a, b) => a === b), !!config.static, config.enables);
  }
  of(value) {
    return new FacetProvider([], this, 0, value);
  }
  compute(deps, get) {
    if (this.isStatic) throw new Error("Can't compute a static facet");
    return new FacetProvider(deps, this, 1, get);
  }
  computeN(deps, get) {
    if (this.isStatic) throw new Error("Can't compute a static facet");
    return new FacetProvider(deps, this, 2, get);
  }
  from(field, get) {
    if (!get) get = x => x;
    return this.compute([field], state => get(state.field(field)));
  }
}
function sameArray(a, b) {
  return a == b || a.length == b.length && a.every((e, i) => e === b[i]);
}
class FacetProvider {
  constructor(dependencies, facet, type, value) {
    this.dependencies = dependencies;
    this.facet = facet;
    this.type = type;
    this.value = value;
    this.id = nextID++;
  }
  dynamicSlot(addresses) {
    var _a;
    let getter = this.value;
    let compare = this.facet.compareInput;
    let idx = addresses[this.id] >> 1, multi = this.type == 2;
    let depDoc = false, depSel = false, depAddrs = [];
    for (let dep of this.dependencies) {
      if (dep == "doc") depDoc = true; else if (dep == "selection") depSel = true; else if ((((_a = addresses[dep.id]) !== null && _a !== void 0 ? _a : 1) & 1) == 0) depAddrs.push(addresses[dep.id]);
    }
    return (state, tr) => {
      if (!tr || tr.reconfigured) {
        state.values[idx] = getter(state);
        return 1;
      } else {
        let depChanged = depDoc && tr.docChanged || depSel && (tr.docChanged || tr.selection) || depAddrs.some(addr => (ensureAddr(state, addr) & 1) > 0);
        if (!depChanged) return 0;
        let newVal = getter(state), oldVal = tr.startState.values[idx];
        if (multi ? compareArray(newVal, oldVal, compare) : compare(newVal, oldVal)) return 0;
        state.values[idx] = newVal;
        return 1;
      }
    };
  }
}
function compareArray(a, b, compare) {
  if (a.length != b.length) return false;
  for (let i = 0; i < a.length; i++) if (!compare(a[i], b[i])) return false;
  return true;
}
function dynamicFacetSlot(addresses, facet, providers) {
  let providerAddrs = providers.map(p => addresses[p.id]);
  let providerTypes = providers.map(p => p.type);
  let dynamic = providerAddrs.filter(p => !(p & 1));
  let idx = addresses[facet.id] >> 1;
  return (state, tr) => {
    let oldAddr = !tr ? null : tr.reconfigured ? tr.startState.config.address[facet.id] : idx << 1;
    let changed = oldAddr == null;
    for (let dynAddr of dynamic) {
      if (ensureAddr(state, dynAddr) & 1) changed = true;
    }
    if (!changed) return 0;
    let values = [];
    for (let i = 0; i < providerAddrs.length; i++) {
      let value = getAddr(state, providerAddrs[i]);
      if (providerTypes[i] == 2) for (let val of value) values.push(val); else values.push(value);
    }
    let newVal = facet.combine(values);
    if (oldAddr != null && facet.compare(newVal, getAddr(tr.startState, oldAddr))) return 0;
    state.values[idx] = newVal;
    return 1;
  };
}
function maybeIndex(state, id) {
  let found = state.config.address[id];
  return found == null ? null : found >> 1;
}
const initField = Facet.define({
  static: true
});
class StateField {
  constructor(id, createF, updateF, compareF, spec) {
    this.id = id;
    this.createF = createF;
    this.updateF = updateF;
    this.compareF = compareF;
    this.spec = spec;
    this.provides = undefined;
  }
  static define(config) {
    let field = new StateField(nextID++, config.create, config.update, config.compare || ((a, b) => a === b), config);
    if (config.provide) field.provides = config.provide(field);
    return field;
  }
  create(state) {
    let init = state.facet(initField).find(i => i.field == this);
    return ((init === null || init === void 0 ? void 0 : init.create) || this.createF)(state);
  }
  slot(addresses) {
    let idx = addresses[this.id] >> 1;
    return (state, tr) => {
      if (!tr) {
        state.values[idx] = this.create(state);
        return 1;
      }
      let oldVal, changed = 0;
      if (tr.reconfigured) {
        let oldIdx = maybeIndex(tr.startState, this.id);
        oldVal = oldIdx == null ? this.create(tr.startState) : tr.startState.values[oldIdx];
        changed = 1;
      } else {
        oldVal = tr.startState.values[idx];
      }
      let value = this.updateF(oldVal, tr);
      if (!changed && !this.compareF(oldVal, value)) changed = 1;
      if (changed) state.values[idx] = value;
      return changed;
    };
  }
  init(create) {
    return [this, initField.of({
      field: this,
      create
    })];
  }
  get extension() {
    return this;
  }
}
const Prec_ = {
  fallback: 3,
  default: 2,
  extend: 1,
  override: 0
};
function prec(value) {
  return ext => new PrecExtension(ext, value);
}
const Prec = {
  fallback: prec(Prec_.fallback),
  default: prec(Prec_.default),
  extend: prec(Prec_.extend),
  override: prec(Prec_.override)
};
class PrecExtension {
  constructor(inner, prec) {
    this.inner = inner;
    this.prec = prec;
  }
}
class Compartment {
  of(ext) {
    return new CompartmentInstance(this, ext);
  }
  reconfigure(content) {
    return Compartment.reconfigure.of({
      compartment: this,
      extension: content
    });
  }
  get(state) {
    return state.config.compartments.get(this);
  }
}
class CompartmentInstance {
  constructor(compartment, inner) {
    this.compartment = compartment;
    this.inner = inner;
  }
}
class Configuration {
  constructor(base, compartments, dynamicSlots, address, staticValues) {
    this.base = base;
    this.compartments = compartments;
    this.dynamicSlots = dynamicSlots;
    this.address = address;
    this.staticValues = staticValues;
    this.statusTemplate = [];
    while (this.statusTemplate.length < dynamicSlots.length) this.statusTemplate.push(0);
  }
  staticFacet(facet) {
    let addr = this.address[facet.id];
    return addr == null ? facet.default : this.staticValues[addr >> 1];
  }
  static resolve(base, compartments, oldState) {
    let fields = [];
    let facets = Object.create(null);
    let newCompartments = new Map();
    for (let ext of flatten(base, compartments, newCompartments)) {
      if (ext instanceof StateField) fields.push(ext); else (facets[ext.facet.id] || (facets[ext.facet.id] = [])).push(ext);
    }
    let address = Object.create(null);
    let staticValues = [];
    let dynamicSlots = [];
    for (let field of fields) {
      address[field.id] = dynamicSlots.length << 1;
      dynamicSlots.push(a => field.slot(a));
    }
    for (let id in facets) {
      let providers = facets[id], facet = providers[0].facet;
      if (providers.every(p => p.type == 0)) {
        address[facet.id] = staticValues.length << 1 | 1;
        let value = facet.combine(providers.map(p => p.value));
        let oldAddr = oldState ? oldState.config.address[facet.id] : null;
        if (oldAddr != null) {
          let oldVal = getAddr(oldState, oldAddr);
          if (facet.compare(value, oldVal)) value = oldVal;
        }
        staticValues.push(value);
      } else {
        for (let p of providers) {
          if (p.type == 0) {
            address[p.id] = staticValues.length << 1 | 1;
            staticValues.push(p.value);
          } else {
            address[p.id] = dynamicSlots.length << 1;
            dynamicSlots.push(a => p.dynamicSlot(a));
          }
        }
        address[facet.id] = dynamicSlots.length << 1;
        dynamicSlots.push(a => dynamicFacetSlot(a, facet, providers));
      }
    }
    return new Configuration(base, newCompartments, dynamicSlots.map(f => f(address)), address, staticValues);
  }
}
function flatten(extension, compartments, newCompartments) {
  let result = [[], [], [], []];
  let seen = new Map();
  function inner(ext, prec) {
    let known = seen.get(ext);
    if (known != null) {
      if (known >= prec) return;
      let found = result[known].indexOf(ext);
      if (found > -1) result[known].splice(found, 1);
      if (ext instanceof CompartmentInstance) newCompartments.delete(ext.compartment);
    }
    seen.set(ext, prec);
    if (Array.isArray(ext)) {
      for (let e of ext) inner(e, prec);
    } else if (ext instanceof CompartmentInstance) {
      if (newCompartments.has(ext.compartment)) throw new RangeError(`Duplicate use of compartment in extensions`);
      let content = compartments.get(ext.compartment) || ext.inner;
      newCompartments.set(ext.compartment, content);
      inner(content, prec);
    } else if (ext instanceof PrecExtension) {
      inner(ext.inner, ext.prec);
    } else if (ext instanceof StateField) {
      result[prec].push(ext);
      if (ext.provides) inner(ext.provides, prec);
    } else if (ext instanceof FacetProvider) {
      result[prec].push(ext);
      if (ext.facet.extensions) inner(ext.facet.extensions, prec);
    } else {
      let content = ext.extension;
      if (!content) throw new Error(`Unrecognized extension value in extension set (${ext}). This sometimes happens because multiple instances of @codemirror/state are loaded, breaking instanceof checks.`);
      inner(content, prec);
    }
  }
  inner(extension, Prec_.default);
  return result.reduce((a, b) => a.concat(b));
}
function ensureAddr(state, addr) {
  if (addr & 1) return 2;
  let idx = addr >> 1;
  let status = state.status[idx];
  if (status == 4) throw new Error("Cyclic dependency between fields and/or facets");
  if (status & 2) return status;
  state.status[idx] = 4;
  let changed = state.config.dynamicSlots[idx](state, state.applying);
  return state.status[idx] = 2 | changed;
}
function getAddr(state, addr) {
  return addr & 1 ? state.config.staticValues[addr >> 1] : state.values[addr >> 1];
}
const languageData = Facet.define();
const allowMultipleSelections = Facet.define({
  combine: values => values.some(v => v),
  static: true
});
const lineSeparator = Facet.define({
  combine: values => values.length ? values[0] : undefined,
  static: true
});
const changeFilter = Facet.define();
const transactionFilter = Facet.define();
const transactionExtender = Facet.define();
class Annotation {
  constructor(type, value) {
    this.type = type;
    this.value = value;
  }
  static define() {
    return new AnnotationType();
  }
}
class AnnotationType {
  of(value) {
    return new Annotation(this, value);
  }
}
class StateEffectType {
  constructor(map) {
    this.map = map;
  }
  of(value) {
    return new StateEffect(this, value);
  }
}
class StateEffect {
  constructor(type, value) {
    this.type = type;
    this.value = value;
  }
  map(mapping) {
    let mapped = this.type.map(this.value, mapping);
    return mapped === undefined ? undefined : mapped == this.value ? this : new StateEffect(this.type, mapped);
  }
  is(type) {
    return this.type == type;
  }
  static define(spec = {}) {
    return new StateEffectType(spec.map || (v => v));
  }
  static mapEffects(effects, mapping) {
    if (!effects.length) return effects;
    let result = [];
    for (let effect of effects) {
      let mapped = effect.map(mapping);
      if (mapped) result.push(mapped);
    }
    return result;
  }
}
StateEffect.reconfigure = StateEffect.define();
StateEffect.appendConfig = StateEffect.define();
class Transaction {
  constructor(startState, changes, selection, effects, annotations, scrollIntoView) {
    this.startState = startState;
    this.changes = changes;
    this.selection = selection;
    this.effects = effects;
    this.annotations = annotations;
    this.scrollIntoView = scrollIntoView;
    this._doc = null;
    this._state = null;
    if (selection) checkSelection(selection, changes.newLength);
    if (!annotations.some(a => a.type == Transaction.time)) this.annotations = annotations.concat(Transaction.time.of(Date.now()));
  }
  get newDoc() {
    return this._doc || (this._doc = this.changes.apply(this.startState.doc));
  }
  get newSelection() {
    return this.selection || this.startState.selection.map(this.changes);
  }
  get state() {
    if (!this._state) this.startState.applyTransaction(this);
    return this._state;
  }
  annotation(type) {
    for (let ann of this.annotations) if (ann.type == type) return ann.value;
    return undefined;
  }
  get docChanged() {
    return !this.changes.empty;
  }
  get reconfigured() {
    return this.startState.config != this.state.config;
  }
}
Transaction.time = Annotation.define();
Transaction.userEvent = Annotation.define();
Transaction.addToHistory = Annotation.define();
function joinRanges(a, b) {
  let result = [];
  for (let iA = 0, iB = 0; ; ) {
    let from, to;
    if (iA < a.length && (iB == b.length || b[iB] >= a[iA])) {
      from = a[iA++];
      to = a[iA++];
    } else if (iB < b.length) {
      from = b[iB++];
      to = b[iB++];
    } else return result;
    if (!result.length || result[result.length - 1] < from) result.push(from, to); else if (result[result.length - 1] < to) result[result.length - 1] = to;
  }
}
function mergeTransaction(a, b, sequential) {
  var _a;
  let mapForA, mapForB, changes;
  if (sequential) {
    mapForA = b.changes;
    mapForB = ChangeSet.empty(b.changes.length);
    changes = a.changes.compose(b.changes);
  } else {
    mapForA = b.changes.map(a.changes);
    mapForB = a.changes.mapDesc(b.changes, true);
    changes = a.changes.compose(mapForA);
  }
  return {
    changes,
    selection: b.selection ? b.selection.map(mapForB) : (_a = a.selection) === null || _a === void 0 ? void 0 : _a.map(mapForA),
    effects: StateEffect.mapEffects(a.effects, mapForA).concat(StateEffect.mapEffects(b.effects, mapForB)),
    annotations: a.annotations.length ? a.annotations.concat(b.annotations) : b.annotations,
    scrollIntoView: a.scrollIntoView || b.scrollIntoView
  };
}
function resolveTransactionInner(state, spec, docSize) {
  let sel = spec.selection;
  return {
    changes: spec.changes instanceof ChangeSet ? spec.changes : ChangeSet.of(spec.changes || [], docSize, state.facet(lineSeparator)),
    selection: sel && (sel instanceof EditorSelection ? sel : EditorSelection.single(sel.anchor, sel.head)),
    effects: asArray(spec.effects),
    annotations: asArray(spec.annotations),
    scrollIntoView: !!spec.scrollIntoView
  };
}
function resolveTransaction(state, specs, filter) {
  let s = resolveTransactionInner(state, specs.length ? specs[0] : {}, state.doc.length);
  if (specs.length && specs[0].filter === false) filter = false;
  for (let i = 1; i < specs.length; i++) {
    if (specs[i].filter === false) filter = false;
    let seq = !!specs[i].sequential;
    s = mergeTransaction(s, resolveTransactionInner(state, specs[i], seq ? s.changes.newLength : state.doc.length), seq);
  }
  let tr = new Transaction(state, s.changes, s.selection, s.effects, s.annotations, s.scrollIntoView);
  return extendTransaction(filter ? filterTransaction(tr) : tr);
}
function filterTransaction(tr) {
  let state = tr.startState;
  let result = true;
  for (let filter of state.facet(changeFilter)) {
    let value = filter(tr);
    if (value === false) {
      result = false;
      break;
    }
    if (Array.isArray(value)) result = result === true ? value : joinRanges(result, value);
  }
  if (result !== true) {
    let changes, back;
    if (result === false) {
      back = tr.changes.invertedDesc;
      changes = ChangeSet.empty(state.doc.length);
    } else {
      let filtered = tr.changes.filter(result);
      changes = filtered.changes;
      back = filtered.filtered.invertedDesc;
    }
    tr = new Transaction(state, changes, tr.selection && tr.selection.map(back), StateEffect.mapEffects(tr.effects, back), tr.annotations, tr.scrollIntoView);
  }
  let filters = state.facet(transactionFilter);
  for (let i = filters.length - 1; i >= 0; i--) {
    let filtered = filters[i](tr);
    if (filtered instanceof Transaction) tr = filtered; else if (Array.isArray(filtered) && filtered.length == 1 && filtered[0] instanceof Transaction) tr = filtered[0]; else tr = resolveTransaction(state, asArray(filtered), false);
  }
  return tr;
}
function extendTransaction(tr) {
  let state = tr.startState, extenders = state.facet(transactionExtender), spec = tr;
  for (let i = extenders.length - 1; i >= 0; i--) {
    let extension = extenders[i](tr);
    if (extension && Object.keys(extension).length) spec = mergeTransaction(tr, resolveTransactionInner(state, extension, tr.changes.newLength), true);
  }
  return spec == tr ? tr : new Transaction(state, tr.changes, tr.selection, spec.effects, spec.annotations, spec.scrollIntoView);
}
const none = [];
function asArray(value) {
  return value == null ? none : Array.isArray(value) ? value : [value];
}
var CharCategory;
(function (CharCategory) {
  CharCategory[CharCategory["Word"] = 0] = "Word";
  CharCategory[CharCategory["Space"] = 1] = "Space";
  CharCategory[CharCategory["Other"] = 2] = "Other";
})(CharCategory || (CharCategory = {}));
const nonASCIISingleCaseWordChar = /[\u00df\u0587\u0590-\u05f4\u0600-\u06ff\u3040-\u309f\u30a0-\u30ff\u3400-\u4db5\u4e00-\u9fcc\uac00-\ud7af]/;
let wordChar;
try {
  wordChar = new RegExp("[\\p{Alphabetic}\\p{Number}_]", "u");
} catch (_) {}
function hasWordChar(str) {
  if (wordChar) return wordChar.test(str);
  for (let i = 0; i < str.length; i++) {
    let ch = str[i];
    if ((/\w/).test(ch) || ch > "\x80" && (ch.toUpperCase() != ch.toLowerCase() || nonASCIISingleCaseWordChar.test(ch))) return true;
  }
  return false;
}
function makeCategorizer(wordChars) {
  return char => {
    if (!(/\S/).test(char)) return CharCategory.Space;
    if (hasWordChar(char)) return CharCategory.Word;
    for (let i = 0; i < wordChars.length; i++) if (char.indexOf(wordChars[i]) > -1) return CharCategory.Word;
    return CharCategory.Other;
  };
}
class EditorState {
  constructor(config, doc, selection, tr = null) {
    this.config = config;
    this.doc = doc;
    this.selection = selection;
    this.applying = null;
    this.status = config.statusTemplate.slice();
    if (tr && tr.startState.config == config) {
      this.values = tr.startState.values.slice();
    } else {
      this.values = config.dynamicSlots.map(_ => null);
      if (tr) for (let id in config.address) {
        let cur = config.address[id], prev = tr.startState.config.address[id];
        if (prev != null && (cur & 1) == 0) this.values[cur >> 1] = getAddr(tr.startState, prev);
      }
    }
    this.applying = tr;
    if (tr) tr._state = this;
    for (let i = 0; i < this.config.dynamicSlots.length; i++) ensureAddr(this, i << 1);
    this.applying = null;
  }
  field(field, require = true) {
    let addr = this.config.address[field.id];
    if (addr == null) {
      if (require) throw new RangeError("Field is not present in this state");
      return undefined;
    }
    ensureAddr(this, addr);
    return getAddr(this, addr);
  }
  update(...specs) {
    return resolveTransaction(this, specs, true);
  }
  applyTransaction(tr) {
    let conf = this.config, {base, compartments} = conf;
    for (let effect of tr.effects) {
      if (effect.is(Compartment.reconfigure)) {
        if (conf) {
          compartments = new Map();
          conf.compartments.forEach((val, key) => compartments.set(key, val));
          conf = null;
        }
        compartments.set(effect.value.compartment, effect.value.extension);
      } else if (effect.is(StateEffect.reconfigure)) {
        conf = null;
        base = effect.value;
      } else if (effect.is(StateEffect.appendConfig)) {
        conf = null;
        base = asArray(base).concat(effect.value);
      }
    }
    new EditorState(conf || Configuration.resolve(base, compartments, this), tr.newDoc, tr.newSelection, tr);
  }
  replaceSelection(text) {
    if (typeof text == "string") text = this.toText(text);
    return this.changeByRange(range => ({
      changes: {
        from: range.from,
        to: range.to,
        insert: text
      },
      range: EditorSelection.cursor(range.from + text.length)
    }));
  }
  changeByRange(f) {
    let sel = this.selection;
    let result1 = f(sel.ranges[0]);
    let changes = this.changes(result1.changes), ranges = [result1.range];
    let effects = asArray(result1.effects);
    for (let i = 1; i < sel.ranges.length; i++) {
      let result = f(sel.ranges[i]);
      let newChanges = this.changes(result.changes), newMapped = newChanges.map(changes);
      for (let j = 0; j < i; j++) ranges[j] = ranges[j].map(newMapped);
      let mapBy = changes.mapDesc(newChanges, true);
      ranges.push(result.range.map(mapBy));
      changes = changes.compose(newMapped);
      effects = StateEffect.mapEffects(effects, newMapped).concat(StateEffect.mapEffects(asArray(result.effects), mapBy));
    }
    return {
      changes,
      selection: EditorSelection.create(ranges, sel.mainIndex),
      effects
    };
  }
  changes(spec = []) {
    if (spec instanceof ChangeSet) return spec;
    return ChangeSet.of(spec, this.doc.length, this.facet(EditorState.lineSeparator));
  }
  toText(string) {
    return text_1.Text.of(string.split(this.facet(EditorState.lineSeparator) || DefaultSplit));
  }
  sliceDoc(from = 0, to = this.doc.length) {
    return this.doc.sliceString(from, to, this.lineBreak);
  }
  facet(facet) {
    let addr = this.config.address[facet.id];
    if (addr == null) return facet.default;
    ensureAddr(this, addr);
    return getAddr(this, addr);
  }
  toJSON(fields) {
    let result = {
      doc: this.sliceDoc(),
      selection: this.selection.toJSON()
    };
    if (fields) for (let prop in fields) {
      let value = fields[prop];
      if (value instanceof StateField) result[prop] = value.spec.toJSON(this.field(fields[prop]), this);
    }
    return result;
  }
  static fromJSON(json, config = {}, fields) {
    if (!json || typeof json.doc != "string") throw new RangeError("Invalid JSON representation for EditorState");
    let fieldInit = [];
    if (fields) for (let prop in fields) {
      let field = fields[prop], value = json[prop];
      fieldInit.push(field.init(state => field.spec.fromJSON(value, state)));
    }
    return EditorState.create({
      doc: json.doc,
      selection: EditorSelection.fromJSON(json.selection),
      extensions: config.extensions ? fieldInit.concat([config.extensions]) : fieldInit
    });
  }
  static create(config = {}) {
    let configuration = Configuration.resolve(config.extensions || [], new Map());
    let doc = config.doc instanceof text_1.Text ? config.doc : text_1.Text.of((config.doc || "").split(configuration.staticFacet(EditorState.lineSeparator) || DefaultSplit));
    let selection = !config.selection ? EditorSelection.single(0) : config.selection instanceof EditorSelection ? config.selection : EditorSelection.single(config.selection.anchor, config.selection.head);
    checkSelection(selection, doc.length);
    if (!configuration.staticFacet(allowMultipleSelections)) selection = selection.asSingle();
    return new EditorState(configuration, doc, selection);
  }
  get tabSize() {
    return this.facet(EditorState.tabSize);
  }
  get lineBreak() {
    return this.facet(EditorState.lineSeparator) || "\n";
  }
  phrase(phrase) {
    for (let map of this.facet(EditorState.phrases)) if (Object.prototype.hasOwnProperty.call(map, phrase)) return map[phrase];
    return phrase;
  }
  languageDataAt(name, pos) {
    let values = [];
    for (let provider of this.facet(languageData)) {
      for (let result of provider(this, pos)) {
        if (Object.prototype.hasOwnProperty.call(result, name)) values.push(result[name]);
      }
    }
    return values;
  }
  charCategorizer(at) {
    return makeCategorizer(this.languageDataAt("wordChars", at).join(""));
  }
}
EditorState.allowMultipleSelections = allowMultipleSelections;
EditorState.tabSize = Facet.define({
  combine: values => values.length ? values[0] : 4
});
EditorState.lineSeparator = lineSeparator;
EditorState.phrases = Facet.define();
EditorState.languageData = languageData;
EditorState.changeFilter = changeFilter;
EditorState.transactionFilter = transactionFilter;
EditorState.transactionExtender = transactionExtender;
Compartment.reconfigure = StateEffect.define();
function combineConfig(configs, defaults, combine = {}) {
  let result = {};
  for (let config of configs) for (let key of Object.keys(config)) {
    let value = config[key], current = result[key];
    if (current === undefined) result[key] = value; else if (current === value || value === undefined) ; else if (Object.hasOwnProperty.call(combine, key)) result[key] = combine[key](current, value); else throw new Error("Config merge conflict for field " + key);
  }
  for (let key in defaults) if (result[key] === undefined) result[key] = defaults[key];
  return result;
}
exports.Annotation = Annotation;
exports.AnnotationType = AnnotationType;
exports.ChangeDesc = ChangeDesc;
exports.ChangeSet = ChangeSet;
exports.CharCategory = CharCategory;
exports.Compartment = Compartment;
exports.EditorSelection = EditorSelection;
exports.EditorState = EditorState;
exports.Facet = Facet;
exports.MapMode = MapMode;
exports.Prec = Prec;
exports.SelectionRange = SelectionRange;
exports.StateEffect = StateEffect;
exports.StateEffectType = StateEffectType;
exports.StateField = StateField;
exports.Transaction = Transaction;
exports.combineConfig = combineConfig;

},

// node_modules/@codemirror/text/dist/index.js @22
22: function(__fusereq, exports, module){
exports.__esModule = true;
let extend = ("lc,34,7n,7,7b,19,,,,2,,2,,,20,b,1c,l,g,,2t,7,2,6,2,2,,4,z,,u,r,2j,b,1m,9,9,,o,4,,9,,3,,5,17,3,3b,f,,w,1j,,,,4,8,4,,3,7,a,2,t,,1m,,,,2,4,8,,9,,a,2,q,,2,2,1l,,4,2,4,2,2,3,3,,u,2,3,,b,2,1l,,4,5,,2,4,,k,2,m,6,,,1m,,,2,,4,8,,7,3,a,2,u,,1n,,,,c,,9,,14,,3,,1l,3,5,3,,4,7,2,b,2,t,,1m,,2,,2,,3,,5,2,7,2,b,2,s,2,1l,2,,,2,4,8,,9,,a,2,t,,20,,4,,2,3,,,8,,29,,2,7,c,8,2q,,2,9,b,6,22,2,r,,,,,,1j,e,,5,,2,5,b,,10,9,,2u,4,,6,,2,2,2,p,2,4,3,g,4,d,,2,2,6,,f,,jj,3,qa,3,t,3,t,2,u,2,1s,2,,7,8,,2,b,9,,19,3,3b,2,y,,3a,3,4,2,9,,6,3,63,2,2,,1m,,,7,,,,,2,8,6,a,2,,1c,h,1r,4,1c,7,,,5,,14,9,c,2,w,4,2,2,,3,1k,,,2,3,,,3,1m,8,2,2,48,3,,d,,7,4,,6,,3,2,5i,1m,,5,ek,,5f,x,2da,3,3x,,2o,w,fe,6,2x,2,n9w,4,,a,w,2,28,2,7k,,3,,4,,p,2,5,,47,2,q,i,d,,12,8,p,b,1a,3,1c,,2,4,2,2,13,,1v,6,2,2,2,2,c,,8,,1b,,1f,,,3,2,2,5,2,,,16,2,8,,6m,,2,,4,,fn4,,kh,g,g,g,a6,2,gt,,6a,,45,5,1ae,3,,2,5,4,14,3,4,,4l,2,fx,4,ar,2,49,b,4w,,1i,f,1k,3,1d,4,2,2,1x,3,10,5,,8,1q,,c,2,1g,9,a,4,2,,2n,3,2,,,2,6,,4g,,3,8,l,2,1l,2,,,,,m,,e,7,3,5,5f,8,2,3,,,n,,29,,2,6,,,2,,,2,,2,6j,,2,4,6,2,,2,r,2,2d,8,2,,,2,2y,,,,2,6,,,2t,3,2,4,,5,77,9,,2,6t,,a,2,,,4,,40,4,2,2,4,,w,a,14,6,2,4,8,,9,6,2,3,1a,d,,2,ba,7,,6,,,2a,m,2,7,,2,,2,3e,6,3,,,2,,7,,,20,2,3,,,,9n,2,f0b,5,1n,7,t4,,1r,4,29,,f5k,2,43q,,,3,4,5,8,8,2,7,u,4,44,3,1iz,1j,4,1e,8,,e,,m,5,,f,11s,7,,h,2,7,,2,,5,79,7,c5,4,15s,7,31,7,240,5,gx7k,2o,3k,6o").split(",").map(s => s ? parseInt(s, 36) : 1);
for (let i = 1; i < extend.length; i++) extend[i] += extend[i - 1];
function isExtendingChar(code) {
  for (let i = 1; i < extend.length; i += 2) if (extend[i] > code) return extend[i - 1] <= code;
  return false;
}
function isRegionalIndicator(code) {
  return code >= 0x1F1E6 && code <= 0x1F1FF;
}
const ZWJ = 0x200d;
function findClusterBreak(str, pos, forward = true) {
  return (forward ? nextClusterBreak : prevClusterBreak)(str, pos);
}
function nextClusterBreak(str, pos) {
  if (pos == str.length) return pos;
  if (pos && surrogateLow(str.charCodeAt(pos)) && surrogateHigh(str.charCodeAt(pos - 1))) pos--;
  let prev = codePointAt(str, pos);
  pos += codePointSize(prev);
  while (pos < str.length) {
    let next = codePointAt(str, pos);
    if (prev == ZWJ || next == ZWJ || isExtendingChar(next)) {
      pos += codePointSize(next);
      prev = next;
    } else if (isRegionalIndicator(next)) {
      let countBefore = 0, i = pos - 2;
      while (i >= 0 && isRegionalIndicator(codePointAt(str, i))) {
        countBefore++;
        i -= 2;
      }
      if (countBefore % 2 == 0) break; else pos += 2;
    } else {
      break;
    }
  }
  return pos;
}
function prevClusterBreak(str, pos) {
  while (pos > 0) {
    let found = nextClusterBreak(str, pos - 2);
    if (found < pos) return found;
    pos--;
  }
  return 0;
}
function surrogateLow(ch) {
  return ch >= 0xDC00 && ch < 0xE000;
}
function surrogateHigh(ch) {
  return ch >= 0xD800 && ch < 0xDC00;
}
function codePointAt(str, pos) {
  let code0 = str.charCodeAt(pos);
  if (!surrogateHigh(code0) || pos + 1 == str.length) return code0;
  let code1 = str.charCodeAt(pos + 1);
  if (!surrogateLow(code1)) return code0;
  return (code0 - 0xd800 << 10) + (code1 - 0xdc00) + 0x10000;
}
function fromCodePoint(code) {
  if (code <= 0xffff) return String.fromCharCode(code);
  code -= 0x10000;
  return String.fromCharCode((code >> 10) + 0xd800, (code & 1023) + 0xdc00);
}
function codePointSize(code) {
  return code < 0x10000 ? 1 : 2;
}
function countColumn(string, n, tabSize) {
  for (let i = 0; i < string.length; ) {
    if (string.charCodeAt(i) == 9) {
      n += tabSize - n % tabSize;
      i++;
    } else {
      n++;
      i = findClusterBreak(string, i);
    }
  }
  return n;
}
function findColumn(string, n, col, tabSize) {
  for (let i = 0; i < string.length; ) {
    if (n >= col) return {
      offset: i,
      leftOver: 0
    };
    n += string.charCodeAt(i) == 9 ? tabSize - n % tabSize : 1;
    i = findClusterBreak(string, i);
  }
  return {
    offset: string.length,
    leftOver: col - n
  };
}
class Text {
  constructor() {}
  lineAt(pos) {
    if (pos < 0 || pos > this.length) throw new RangeError(`Invalid position ${pos} in document of length ${this.length}`);
    return this.lineInner(pos, false, 1, 0);
  }
  line(n) {
    if (n < 1 || n > this.lines) throw new RangeError(`Invalid line number ${n} in ${this.lines}-line document`);
    return this.lineInner(n, true, 1, 0);
  }
  replace(from, to, text) {
    let parts = [];
    this.decompose(0, from, parts, 2);
    if (text.length) text.decompose(0, text.length, parts, 1 | 2);
    this.decompose(to, this.length, parts, 1);
    return TextNode.from(parts, this.length - (to - from) + text.length);
  }
  append(other) {
    return this.replace(this.length, this.length, other);
  }
  slice(from, to = this.length) {
    let parts = [];
    this.decompose(from, to, parts, 0);
    return TextNode.from(parts, to - from);
  }
  eq(other) {
    if (other == this) return true;
    if (other.length != this.length || other.lines != this.lines) return false;
    let a = new RawTextCursor(this), b = new RawTextCursor(other);
    for (; ; ) {
      a.next();
      b.next();
      if (a.lineBreak != b.lineBreak || a.done != b.done || a.value != b.value) return false;
      if (a.done) return true;
    }
  }
  iter(dir = 1) {
    return new RawTextCursor(this, dir);
  }
  iterRange(from, to = this.length) {
    return new PartialTextCursor(this, from, to);
  }
  toString() {
    return this.sliceString(0);
  }
  toJSON() {
    let lines = [];
    this.flatten(lines);
    return lines;
  }
  static of(text) {
    if (text.length == 0) throw new RangeError("A document must have at least one line");
    if (text.length == 1 && !text[0]) return Text.empty;
    return text.length <= 32 ? new TextLeaf(text) : TextNode.from(TextLeaf.split(text, []));
  }
}
if (typeof Symbol != "undefined") Text.prototype[Symbol.iterator] = function () {
  return this.iter();
};
class TextLeaf extends Text {
  constructor(text, length = textLength(text)) {
    super();
    this.text = text;
    this.length = length;
  }
  get lines() {
    return this.text.length;
  }
  get children() {
    return null;
  }
  lineInner(target, isLine, line, offset) {
    for (let i = 0; ; i++) {
      let string = this.text[i], end = offset + string.length;
      if ((isLine ? line : end) >= target) return new Line(offset, end, line, string);
      offset = end + 1;
      line++;
    }
  }
  decompose(from, to, target, open) {
    let text = from <= 0 && to >= this.length ? this : new TextLeaf(sliceText(this.text, from, to), Math.min(to, this.length) - Math.max(0, from));
    if (open & 1) {
      let prev = target.pop();
      let joined = appendText(text.text, prev.text.slice(), 0, text.length);
      if (joined.length <= 32) {
        target.push(new TextLeaf(joined, prev.length + text.length));
      } else {
        let mid = joined.length >> 1;
        target.push(new TextLeaf(joined.slice(0, mid)), new TextLeaf(joined.slice(mid)));
      }
    } else {
      target.push(text);
    }
  }
  replace(from, to, text) {
    if (!(text instanceof TextLeaf)) return super.replace(from, to, text);
    let lines = appendText(this.text, appendText(text.text, sliceText(this.text, 0, from)), to);
    let newLen = this.length + text.length - (to - from);
    if (lines.length <= 32) return new TextLeaf(lines, newLen);
    return TextNode.from(TextLeaf.split(lines, []), newLen);
  }
  sliceString(from, to = this.length, lineSep = "\n") {
    let result = "";
    for (let pos = 0, i = 0; pos <= to && i < this.text.length; i++) {
      let line = this.text[i], end = pos + line.length;
      if (pos > from && i) result += lineSep;
      if (from < end && to > pos) result += line.slice(Math.max(0, from - pos), to - pos);
      pos = end + 1;
    }
    return result;
  }
  flatten(target) {
    for (let line of this.text) target.push(line);
  }
  static split(text, target) {
    let part = [], len = -1;
    for (let line of text) {
      part.push(line);
      len += line.length + 1;
      if (part.length == 32) {
        target.push(new TextLeaf(part, len));
        part = [];
        len = -1;
      }
    }
    if (len > -1) target.push(new TextLeaf(part, len));
    return target;
  }
}
class TextNode extends Text {
  constructor(children, length) {
    super();
    this.children = children;
    this.length = length;
    this.lines = 0;
    for (let child of children) this.lines += child.lines;
  }
  lineInner(target, isLine, line, offset) {
    for (let i = 0; ; i++) {
      let child = this.children[i], end = offset + child.length, endLine = line + child.lines - 1;
      if ((isLine ? endLine : end) >= target) return child.lineInner(target, isLine, line, offset);
      offset = end + 1;
      line = endLine + 1;
    }
  }
  decompose(from, to, target, open) {
    for (let i = 0, pos = 0; pos <= to && i < this.children.length; i++) {
      let child = this.children[i], end = pos + child.length;
      if (from <= end && to >= pos) {
        let childOpen = open & ((pos <= from ? 1 : 0) | (end >= to ? 2 : 0));
        if (pos >= from && end <= to && !childOpen) target.push(child); else child.decompose(from - pos, to - pos, target, childOpen);
      }
      pos = end + 1;
    }
  }
  replace(from, to, text) {
    if (text.lines < this.lines) for (let i = 0, pos = 0; i < this.children.length; i++) {
      let child = this.children[i], end = pos + child.length;
      if (from >= pos && to <= end) {
        let updated = child.replace(from - pos, to - pos, text);
        let totalLines = this.lines - child.lines + updated.lines;
        if (updated.lines < totalLines >> 5 - 1 && updated.lines > totalLines >> 5 + 1) {
          let copy = this.children.slice();
          copy[i] = updated;
          return new TextNode(copy, this.length - (to - from) + text.length);
        }
        return super.replace(pos, end, updated);
      }
      pos = end + 1;
    }
    return super.replace(from, to, text);
  }
  sliceString(from, to = this.length, lineSep = "\n") {
    let result = "";
    for (let i = 0, pos = 0; i < this.children.length && pos <= to; i++) {
      let child = this.children[i], end = pos + child.length;
      if (pos > from && i) result += lineSep;
      if (from < end && to > pos) result += child.sliceString(from - pos, to - pos, lineSep);
      pos = end + 1;
    }
    return result;
  }
  flatten(target) {
    for (let child of this.children) child.flatten(target);
  }
  static from(children, length = children.reduce((l, ch) => l + ch.length + 1, -1)) {
    let lines = 0;
    for (let ch of children) lines += ch.lines;
    if (lines < 32) {
      let flat = [];
      for (let ch of children) ch.flatten(flat);
      return new TextLeaf(flat, length);
    }
    let chunk = Math.max(32, lines >> 5), maxChunk = chunk << 1, minChunk = chunk >> 1;
    let chunked = [], currentLines = 0, currentLen = -1, currentChunk = [];
    function add(child) {
      let last;
      if (child.lines > maxChunk && child instanceof TextNode) {
        for (let node of child.children) add(node);
      } else if (child.lines > minChunk && (currentLines > minChunk || !currentLines)) {
        flush();
        chunked.push(child);
      } else if (child instanceof TextLeaf && currentLines && (last = currentChunk[currentChunk.length - 1]) instanceof TextLeaf && child.lines + last.lines <= 32) {
        currentLines += child.lines;
        currentLen += child.length + 1;
        currentChunk[currentChunk.length - 1] = new TextLeaf(last.text.concat(child.text), last.length + 1 + child.length);
      } else {
        if (currentLines + child.lines > chunk) flush();
        currentLines += child.lines;
        currentLen += child.length + 1;
        currentChunk.push(child);
      }
    }
    function flush() {
      if (currentLines == 0) return;
      chunked.push(currentChunk.length == 1 ? currentChunk[0] : TextNode.from(currentChunk, currentLen));
      currentLen = -1;
      currentLines = currentChunk.length = 0;
    }
    for (let child of children) add(child);
    flush();
    return chunked.length == 1 ? chunked[0] : new TextNode(chunked, length);
  }
}
Text.empty = new TextLeaf([""], 0);
function textLength(text) {
  let length = -1;
  for (let line of text) length += line.length + 1;
  return length;
}
function appendText(text, target, from = 0, to = 1e9) {
  for (let pos = 0, i = 0, first = true; i < text.length && pos <= to; i++) {
    let line = text[i], end = pos + line.length;
    if (end >= from) {
      if (end > to) line = line.slice(0, to - pos);
      if (pos < from) line = line.slice(from - pos);
      if (first) {
        target[target.length - 1] += line;
        first = false;
      } else target.push(line);
    }
    pos = end + 1;
  }
  return target;
}
function sliceText(text, from, to) {
  return appendText(text, [""], from, to);
}
class RawTextCursor {
  constructor(text, dir = 1) {
    this.dir = dir;
    this.done = false;
    this.lineBreak = false;
    this.value = "";
    this.nodes = [text];
    this.offsets = [dir > 0 ? 0 : text instanceof TextLeaf ? text.text.length : text.children.length];
  }
  next(skip = 0) {
    for (; ; ) {
      let last = this.nodes.length - 1;
      if (last < 0) {
        this.done = true;
        this.value = "";
        this.lineBreak = false;
        return this;
      }
      let top = this.nodes[last], offset = this.offsets[last];
      let size = top instanceof TextLeaf ? top.text.length : top.children.length;
      if (offset == (this.dir > 0 ? size : 0)) {
        this.nodes.pop();
        this.offsets.pop();
      } else if (!this.lineBreak && offset != (this.dir > 0 ? 0 : size)) {
        this.lineBreak = true;
        if (skip == 0) {
          this.value = "\n";
          return this;
        }
        skip--;
      } else if (top instanceof TextLeaf) {
        let next = top.text[offset - (this.dir < 0 ? 1 : 0)];
        this.offsets[last] = offset += this.dir;
        this.lineBreak = false;
        if (next.length > Math.max(0, skip)) {
          this.value = skip == 0 ? next : this.dir > 0 ? next.slice(skip) : next.slice(0, next.length - skip);
          return this;
        }
        skip -= next.length;
      } else {
        let next = top.children[this.dir > 0 ? offset : offset - 1];
        this.offsets[last] = offset + this.dir;
        this.lineBreak = false;
        if (skip > next.length) {
          skip -= next.length;
        } else {
          this.nodes.push(next);
          this.offsets.push(this.dir > 0 ? 0 : next instanceof TextLeaf ? next.text.length : next.children.length);
        }
      }
    }
  }
}
class PartialTextCursor {
  constructor(text, start, end) {
    this.value = "";
    this.cursor = new RawTextCursor(text, start > end ? -1 : 1);
    if (start > end) {
      this.skip = text.length - start;
      this.limit = start - end;
    } else {
      this.skip = start;
      this.limit = end - start;
    }
  }
  next(skip = 0) {
    if (this.limit <= 0) {
      this.limit = -1;
    } else {
      let {value, lineBreak, done} = this.cursor.next(this.skip + skip);
      this.skip = 0;
      this.value = value;
      let len = lineBreak ? 1 : value.length;
      if (len > this.limit) this.value = this.cursor.dir > 0 ? value.slice(0, this.limit) : value.slice(len - this.limit);
      if (done || this.value.length == 0) this.limit = -1; else this.limit -= this.value.length;
    }
    return this;
  }
  get lineBreak() {
    return this.cursor.lineBreak;
  }
  get done() {
    return this.limit < 0;
  }
}
class Line {
  constructor(from, to, number, text) {
    this.from = from;
    this.to = to;
    this.number = number;
    this.text = text;
  }
  get length() {
    return this.to - this.from;
  }
}
exports.Line = Line;
exports.Text = Text;
exports.codePointAt = codePointAt;
exports.codePointSize = codePointSize;
exports.countColumn = countColumn;
exports.findClusterBreak = findClusterBreak;
exports.findColumn = findColumn;
exports.fromCodePoint = fromCodePoint;

},

// node_modules/@codemirror/rangeset/dist/index.js @39
39: function(__fusereq, exports, module){
exports.__esModule = true;
var state_1 = __fusereq(15);
class RangeValue {
  eq(other) {
    return this == other;
  }
  range(from, to = from) {
    return new Range(from, to, this);
  }
}
RangeValue.prototype.startSide = RangeValue.prototype.endSide = 0;
RangeValue.prototype.point = false;
RangeValue.prototype.mapMode = state_1.MapMode.TrackDel;
class Range {
  constructor(from, to, value) {
    this.from = from;
    this.to = to;
    this.value = value;
  }
}
function cmpRange(a, b) {
  return a.from - b.from || a.value.startSide - b.value.startSide;
}
class Chunk {
  constructor(from, to, value, maxPoint) {
    this.from = from;
    this.to = to;
    this.value = value;
    this.maxPoint = maxPoint;
  }
  get length() {
    return this.to[this.to.length - 1];
  }
  findIndex(pos, end, side = end * 1000000000, startAt = 0) {
    if (pos <= 0) return startAt;
    let arr = end < 0 ? this.to : this.from;
    for (let lo = startAt, hi = arr.length; ; ) {
      if (lo == hi) return lo;
      let mid = lo + hi >> 1;
      let diff = arr[mid] - pos || (end < 0 ? this.value[mid].startSide : this.value[mid].endSide) - side;
      if (mid == lo) return diff >= 0 ? lo : hi;
      if (diff >= 0) hi = mid; else lo = mid + 1;
    }
  }
  between(offset, from, to, f) {
    for (let i = this.findIndex(from, -1), e = this.findIndex(to, 1, undefined, i); i < e; i++) if (f(this.from[i] + offset, this.to[i] + offset, this.value[i]) === false) return false;
  }
  map(offset, changes) {
    let value = [], from = [], to = [], newPos = -1, maxPoint = -1;
    for (let i = 0; i < this.value.length; i++) {
      let val = this.value[i], curFrom = this.from[i] + offset, curTo = this.to[i] + offset, newFrom, newTo;
      if (curFrom == curTo) {
        let mapped = changes.mapPos(curFrom, val.startSide, val.mapMode);
        if (mapped == null) continue;
        newFrom = newTo = mapped;
      } else {
        newFrom = changes.mapPos(curFrom, val.startSide);
        newTo = changes.mapPos(curTo, val.endSide);
        if (newFrom > newTo || newFrom == newTo && val.startSide > 0 && val.endSide <= 0) continue;
      }
      if ((newTo - newFrom || val.endSide - val.startSide) < 0) continue;
      if (newPos < 0) newPos = newFrom;
      if (val.point) maxPoint = Math.max(maxPoint, newTo - newFrom);
      value.push(val);
      from.push(newFrom - newPos);
      to.push(newTo - newPos);
    }
    return {
      mapped: value.length ? new Chunk(from, to, value, maxPoint) : null,
      pos: newPos
    };
  }
}
class RangeSet {
  constructor(chunkPos, chunk, nextLayer = RangeSet.empty, maxPoint) {
    this.chunkPos = chunkPos;
    this.chunk = chunk;
    this.nextLayer = nextLayer;
    this.maxPoint = maxPoint;
  }
  get length() {
    let last = this.chunk.length - 1;
    return last < 0 ? 0 : Math.max(this.chunkEnd(last), this.nextLayer.length);
  }
  get size() {
    if (this == RangeSet.empty) return 0;
    let size = this.nextLayer.size;
    for (let chunk of this.chunk) size += chunk.value.length;
    return size;
  }
  chunkEnd(index) {
    return this.chunkPos[index] + this.chunk[index].length;
  }
  update(updateSpec) {
    let {add = [], sort = false, filterFrom = 0, filterTo = this.length} = updateSpec;
    let filter = updateSpec.filter;
    if (add.length == 0 && !filter) return this;
    if (sort) add.slice().sort(cmpRange);
    if (this == RangeSet.empty) return add.length ? RangeSet.of(add) : this;
    let cur = new LayerCursor(this, null, -1).goto(0), i = 0, spill = [];
    let builder = new RangeSetBuilder();
    while (cur.value || i < add.length) {
      if (i < add.length && (cur.from - add[i].from || cur.startSide - add[i].value.startSide) >= 0) {
        let range = add[i++];
        if (!builder.addInner(range.from, range.to, range.value)) spill.push(range);
      } else if (cur.rangeIndex == 1 && cur.chunkIndex < this.chunk.length && (i == add.length || this.chunkEnd(cur.chunkIndex) < add[i].from) && (!filter || filterFrom > this.chunkEnd(cur.chunkIndex) || filterTo < this.chunkPos[cur.chunkIndex]) && builder.addChunk(this.chunkPos[cur.chunkIndex], this.chunk[cur.chunkIndex])) {
        cur.nextChunk();
      } else {
        if (!filter || filterFrom > cur.to || filterTo < cur.from || filter(cur.from, cur.to, cur.value)) {
          if (!builder.addInner(cur.from, cur.to, cur.value)) spill.push(new Range(cur.from, cur.to, cur.value));
        }
        cur.next();
      }
    }
    return builder.finishInner(this.nextLayer == RangeSet.empty && !spill.length ? RangeSet.empty : this.nextLayer.update({
      add: spill,
      filter,
      filterFrom,
      filterTo
    }));
  }
  map(changes) {
    if (changes.length == 0 || this == RangeSet.empty) return this;
    let chunks = [], chunkPos = [], maxPoint = -1;
    for (let i = 0; i < this.chunk.length; i++) {
      let start = this.chunkPos[i], chunk = this.chunk[i];
      let touch = changes.touchesRange(start, start + chunk.length);
      if (touch === false) {
        maxPoint = Math.max(maxPoint, chunk.maxPoint);
        chunks.push(chunk);
        chunkPos.push(changes.mapPos(start));
      } else if (touch === true) {
        let {mapped, pos} = chunk.map(start, changes);
        if (mapped) {
          maxPoint = Math.max(maxPoint, mapped.maxPoint);
          chunks.push(mapped);
          chunkPos.push(pos);
        }
      }
    }
    let next = this.nextLayer.map(changes);
    return chunks.length == 0 ? next : new RangeSet(chunkPos, chunks, next, maxPoint);
  }
  between(from, to, f) {
    if (this == RangeSet.empty) return;
    for (let i = 0; i < this.chunk.length; i++) {
      let start = this.chunkPos[i], chunk = this.chunk[i];
      if (to >= start && from <= start + chunk.length && chunk.between(start, from - start, to - start, f) === false) return;
    }
    this.nextLayer.between(from, to, f);
  }
  iter(from = 0) {
    return HeapCursor.from([this]).goto(from);
  }
  static iter(sets, from = 0) {
    return HeapCursor.from(sets).goto(from);
  }
  static compare(oldSets, newSets, textDiff, comparator, minPointSize = -1) {
    let a = oldSets.filter(set => set.maxPoint >= 500 || set != RangeSet.empty && newSets.indexOf(set) < 0 && set.maxPoint >= minPointSize);
    let b = newSets.filter(set => set.maxPoint >= 500 || set != RangeSet.empty && oldSets.indexOf(set) < 0 && set.maxPoint >= minPointSize);
    let sharedChunks = findSharedChunks(a, b);
    let sideA = new SpanCursor(a, sharedChunks, minPointSize);
    let sideB = new SpanCursor(b, sharedChunks, minPointSize);
    textDiff.iterGaps((fromA, fromB, length) => compare(sideA, fromA, sideB, fromB, length, comparator));
    if (textDiff.empty && textDiff.length == 0) compare(sideA, 0, sideB, 0, 0, comparator);
  }
  static spans(sets, from, to, iterator, minPointSize = -1) {
    let cursor = new SpanCursor(sets, null, minPointSize).goto(from), pos = from;
    let open = cursor.openStart;
    for (; ; ) {
      let curTo = Math.min(cursor.to, to);
      if (cursor.point) {
        iterator.point(pos, curTo, cursor.point, cursor.activeForPoint(cursor.to), open);
        open = cursor.openEnd(curTo) + (cursor.to > curTo ? 1 : 0);
      } else if (curTo > pos) {
        iterator.span(pos, curTo, cursor.active, open);
        open = cursor.openEnd(curTo);
      }
      if (cursor.to > to) break;
      pos = cursor.to;
      cursor.next();
    }
    return open;
  }
  static of(ranges, sort = false) {
    let build = new RangeSetBuilder();
    for (let range of ranges instanceof Range ? [ranges] : sort ? ranges.slice().sort(cmpRange) : ranges) build.add(range.from, range.to, range.value);
    return build.finish();
  }
}
RangeSet.empty = new RangeSet([], [], null, -1);
RangeSet.empty.nextLayer = RangeSet.empty;
class RangeSetBuilder {
  constructor() {
    this.chunks = [];
    this.chunkPos = [];
    this.chunkStart = -1;
    this.last = null;
    this.lastFrom = -1000000000;
    this.lastTo = -1000000000;
    this.from = [];
    this.to = [];
    this.value = [];
    this.maxPoint = -1;
    this.setMaxPoint = -1;
    this.nextLayer = null;
  }
  finishChunk(newArrays) {
    this.chunks.push(new Chunk(this.from, this.to, this.value, this.maxPoint));
    this.chunkPos.push(this.chunkStart);
    this.chunkStart = -1;
    this.setMaxPoint = Math.max(this.setMaxPoint, this.maxPoint);
    this.maxPoint = -1;
    if (newArrays) {
      this.from = [];
      this.to = [];
      this.value = [];
    }
  }
  add(from, to, value) {
    if (!this.addInner(from, to, value)) (this.nextLayer || (this.nextLayer = new RangeSetBuilder())).add(from, to, value);
  }
  addInner(from, to, value) {
    let diff = from - this.lastTo || value.startSide - this.last.endSide;
    if (diff <= 0 && (from - this.lastFrom || value.startSide - this.last.startSide) < 0) throw new Error("Ranges must be added sorted by `from` position and `startSide`");
    if (diff < 0) return false;
    if (this.from.length == 250) this.finishChunk(true);
    if (this.chunkStart < 0) this.chunkStart = from;
    this.from.push(from - this.chunkStart);
    this.to.push(to - this.chunkStart);
    this.last = value;
    this.lastFrom = from;
    this.lastTo = to;
    this.value.push(value);
    if (value.point) this.maxPoint = Math.max(this.maxPoint, to - from);
    return true;
  }
  addChunk(from, chunk) {
    if ((from - this.lastTo || chunk.value[0].startSide - this.last.endSide) < 0) return false;
    if (this.from.length) this.finishChunk(true);
    this.setMaxPoint = Math.max(this.setMaxPoint, chunk.maxPoint);
    this.chunks.push(chunk);
    this.chunkPos.push(from);
    let last = chunk.value.length - 1;
    this.last = chunk.value[last];
    this.lastFrom = chunk.from[last] + from;
    this.lastTo = chunk.to[last] + from;
    return true;
  }
  finish() {
    return this.finishInner(RangeSet.empty);
  }
  finishInner(next) {
    if (this.from.length) this.finishChunk(false);
    if (this.chunks.length == 0) return next;
    let result = new RangeSet(this.chunkPos, this.chunks, this.nextLayer ? this.nextLayer.finishInner(next) : next, this.setMaxPoint);
    this.from = null;
    return result;
  }
}
function findSharedChunks(a, b) {
  let inA = new Map();
  for (let set of a) for (let i = 0; i < set.chunk.length; i++) if (set.chunk[i].maxPoint < 500) inA.set(set.chunk[i], set.chunkPos[i]);
  let shared = new Set();
  for (let set of b) for (let i = 0; i < set.chunk.length; i++) if (inA.get(set.chunk[i]) == set.chunkPos[i]) shared.add(set.chunk[i]);
  return shared;
}
class LayerCursor {
  constructor(layer, skip, minPoint, rank = 0) {
    this.layer = layer;
    this.skip = skip;
    this.minPoint = minPoint;
    this.rank = rank;
  }
  get startSide() {
    return this.value ? this.value.startSide : 0;
  }
  get endSide() {
    return this.value ? this.value.endSide : 0;
  }
  goto(pos, side = -1000000000) {
    this.chunkIndex = this.rangeIndex = 0;
    this.gotoInner(pos, side, false);
    return this;
  }
  gotoInner(pos, side, forward) {
    while (this.chunkIndex < this.layer.chunk.length) {
      let next = this.layer.chunk[this.chunkIndex];
      if (!(this.skip && this.skip.has(next) || this.layer.chunkEnd(this.chunkIndex) < pos || next.maxPoint < this.minPoint)) break;
      this.chunkIndex++;
      forward = false;
    }
    let rangeIndex = this.chunkIndex == this.layer.chunk.length ? 0 : this.layer.chunk[this.chunkIndex].findIndex(pos - this.layer.chunkPos[this.chunkIndex], -1, side);
    if (!forward || this.rangeIndex < rangeIndex) this.rangeIndex = rangeIndex;
    this.next();
  }
  forward(pos, side) {
    if ((this.to - pos || this.endSide - side) < 0) this.gotoInner(pos, side, true);
  }
  next() {
    for (; ; ) {
      if (this.chunkIndex == this.layer.chunk.length) {
        this.from = this.to = 1000000000;
        this.value = null;
        break;
      } else {
        let chunkPos = this.layer.chunkPos[this.chunkIndex], chunk = this.layer.chunk[this.chunkIndex];
        let from = chunkPos + chunk.from[this.rangeIndex];
        this.from = from;
        this.to = chunkPos + chunk.to[this.rangeIndex];
        this.value = chunk.value[this.rangeIndex];
        if (++this.rangeIndex == chunk.value.length) {
          this.chunkIndex++;
          if (this.skip) {
            while (this.chunkIndex < this.layer.chunk.length && this.skip.has(this.layer.chunk[this.chunkIndex])) this.chunkIndex++;
          }
          this.rangeIndex = 0;
        }
        if (this.minPoint < 0 || this.value.point && this.to - this.from >= this.minPoint) break;
      }
    }
  }
  nextChunk() {
    this.chunkIndex++;
    this.rangeIndex = 0;
    this.next();
  }
  compare(other) {
    return this.from - other.from || this.startSide - other.startSide || this.to - other.to || this.endSide - other.endSide;
  }
}
class HeapCursor {
  constructor(heap) {
    this.heap = heap;
  }
  static from(sets, skip = null, minPoint = -1) {
    let heap = [];
    for (let i = 0; i < sets.length; i++) {
      for (let cur = sets[i]; cur != RangeSet.empty; cur = cur.nextLayer) {
        if (cur.maxPoint >= minPoint) heap.push(new LayerCursor(cur, skip, minPoint, i));
      }
    }
    return heap.length == 1 ? heap[0] : new HeapCursor(heap);
  }
  get startSide() {
    return this.value ? this.value.startSide : 0;
  }
  goto(pos, side = -1000000000) {
    for (let cur of this.heap) cur.goto(pos, side);
    for (let i = this.heap.length >> 1; i >= 0; i--) heapBubble(this.heap, i);
    this.next();
    return this;
  }
  forward(pos, side) {
    for (let cur of this.heap) cur.forward(pos, side);
    for (let i = this.heap.length >> 1; i >= 0; i--) heapBubble(this.heap, i);
    if ((this.to - pos || this.value.endSide - side) < 0) this.next();
  }
  next() {
    if (this.heap.length == 0) {
      this.from = this.to = 1000000000;
      this.value = null;
      this.rank = -1;
    } else {
      let top = this.heap[0];
      this.from = top.from;
      this.to = top.to;
      this.value = top.value;
      this.rank = top.rank;
      if (top.value) top.next();
      heapBubble(this.heap, 0);
    }
  }
}
function heapBubble(heap, index) {
  for (let cur = heap[index]; ; ) {
    let childIndex = (index << 1) + 1;
    if (childIndex >= heap.length) break;
    let child = heap[childIndex];
    if (childIndex + 1 < heap.length && child.compare(heap[childIndex + 1]) >= 0) {
      child = heap[childIndex + 1];
      childIndex++;
    }
    if (cur.compare(child) < 0) break;
    heap[childIndex] = cur;
    heap[index] = child;
    index = childIndex;
  }
}
class SpanCursor {
  constructor(sets, skip, minPoint) {
    this.minPoint = minPoint;
    this.active = [];
    this.activeTo = [];
    this.activeRank = [];
    this.minActive = -1;
    this.point = null;
    this.pointFrom = 0;
    this.pointRank = 0;
    this.to = -1000000000;
    this.endSide = 0;
    this.openStart = -1;
    this.cursor = HeapCursor.from(sets, skip, minPoint);
  }
  goto(pos, side = -1000000000) {
    this.cursor.goto(pos, side);
    this.active.length = this.activeTo.length = this.activeRank.length = 0;
    this.minActive = -1;
    this.to = pos;
    this.endSide = side;
    this.openStart = -1;
    this.next();
    return this;
  }
  forward(pos, side) {
    while (this.minActive > -1 && (this.activeTo[this.minActive] - pos || this.active[this.minActive].endSide - side) < 0) this.removeActive(this.minActive);
    this.cursor.forward(pos, side);
  }
  removeActive(index) {
    remove(this.active, index);
    remove(this.activeTo, index);
    remove(this.activeRank, index);
    this.minActive = findMinIndex(this.active, this.activeTo);
  }
  addActive(trackOpen) {
    let i = 0, {value, to, rank} = this.cursor;
    while (i < this.activeRank.length && this.activeRank[i] <= rank) i++;
    insert(this.active, i, value);
    insert(this.activeTo, i, to);
    insert(this.activeRank, i, rank);
    if (trackOpen) insert(trackOpen, i, this.cursor.from);
    this.minActive = findMinIndex(this.active, this.activeTo);
  }
  next() {
    let from = this.to;
    this.point = null;
    let trackOpen = this.openStart < 0 ? [] : null, trackExtra = 0;
    for (; ; ) {
      let a = this.minActive;
      if (a > -1 && (this.activeTo[a] - this.cursor.from || this.active[a].endSide - this.cursor.startSide) < 0) {
        if (this.activeTo[a] > from) {
          this.to = this.activeTo[a];
          this.endSide = this.active[a].endSide;
          break;
        }
        this.removeActive(a);
        if (trackOpen) remove(trackOpen, a);
      } else if (!this.cursor.value) {
        this.to = this.endSide = 1000000000;
        break;
      } else if (this.cursor.from > from) {
        this.to = this.cursor.from;
        this.endSide = this.cursor.startSide;
        break;
      } else {
        let nextVal = this.cursor.value;
        if (!nextVal.point) {
          this.addActive(trackOpen);
          this.cursor.next();
        } else {
          this.point = nextVal;
          this.pointFrom = this.cursor.from;
          this.pointRank = this.cursor.rank;
          this.to = this.cursor.to;
          this.endSide = nextVal.endSide;
          if (this.cursor.from < from) trackExtra = 1;
          this.cursor.next();
          if (this.to > from) this.forward(this.to, this.endSide);
          break;
        }
      }
    }
    if (trackOpen) {
      let openStart = 0;
      while (openStart < trackOpen.length && trackOpen[openStart] < from) openStart++;
      this.openStart = openStart + trackExtra;
    }
  }
  activeForPoint(to) {
    if (!this.active.length) return this.active;
    let active = [];
    for (let i = 0; i < this.active.length; i++) {
      if (this.activeRank[i] > this.pointRank) break;
      if (this.activeTo[i] > to || this.activeTo[i] == to && this.active[i].endSide > this.point.endSide) active.push(this.active[i]);
    }
    return active;
  }
  openEnd(to) {
    let open = 0;
    while (open < this.activeTo.length && this.activeTo[open] > to) open++;
    return open;
  }
}
function compare(a, startA, b, startB, length, comparator) {
  a.goto(startA);
  b.goto(startB);
  let endB = startB + length;
  let pos = startB, dPos = startB - startA;
  for (; ; ) {
    let diff = a.to + dPos - b.to || a.endSide - b.endSide;
    let end = diff < 0 ? a.to + dPos : b.to, clipEnd = Math.min(end, endB);
    if (a.point || b.point) {
      if (!(a.point && b.point && (a.point == b.point || a.point.eq(b.point)))) comparator.comparePoint(pos, clipEnd, a.point, b.point);
    } else {
      if (clipEnd > pos && !sameValues(a.active, b.active)) comparator.compareRange(pos, clipEnd, a.active, b.active);
    }
    if (end > endB) break;
    pos = end;
    if (diff <= 0) a.next();
    if (diff >= 0) b.next();
  }
}
function sameValues(a, b) {
  if (a.length != b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] != b[i] && !a[i].eq(b[i])) return false;
  return true;
}
function remove(array, index) {
  for (let i = index, e = array.length - 1; i < e; i++) array[i] = array[i + 1];
  array.pop();
}
function insert(array, index, value) {
  for (let i = array.length - 1; i >= index; i--) array[i + 1] = array[i];
  array[index] = value;
}
function findMinIndex(value, array) {
  let found = -1, foundPos = 1000000000;
  for (let i = 0; i < array.length; i++) if ((array[i] - foundPos || value[i].endSide - value[found].endSide) < 0) {
    found = i;
    foundPos = array[i];
  }
  return found;
}
exports.Range = Range;
exports.RangeSet = RangeSet;
exports.RangeSetBuilder = RangeSetBuilder;
exports.RangeValue = RangeValue;

},

// node_modules/w3c-keyname/index.es.js @41
41: function(__fusereq, exports, module){
exports.__esModule = true;
exports.base = {
  8: "Backspace",
  9: "Tab",
  10: "Enter",
  12: "NumLock",
  13: "Enter",
  16: "Shift",
  17: "Control",
  18: "Alt",
  20: "CapsLock",
  27: "Escape",
  32: " ",
  33: "PageUp",
  34: "PageDown",
  35: "End",
  36: "Home",
  37: "ArrowLeft",
  38: "ArrowUp",
  39: "ArrowRight",
  40: "ArrowDown",
  44: "PrintScreen",
  45: "Insert",
  46: "Delete",
  59: ";",
  61: "=",
  91: "Meta",
  92: "Meta",
  106: "*",
  107: "+",
  108: ",",
  109: "-",
  110: ".",
  111: "/",
  144: "NumLock",
  145: "ScrollLock",
  160: "Shift",
  161: "Shift",
  162: "Control",
  163: "Control",
  164: "Alt",
  165: "Alt",
  173: "-",
  186: ";",
  187: "=",
  188: ",",
  189: "-",
  190: ".",
  191: "/",
  192: "`",
  219: "[",
  220: "\\",
  221: "]",
  222: "'",
  229: "q"
};
exports.shift = {
  48: ")",
  49: "!",
  50: "@",
  51: "#",
  52: "$",
  53: "%",
  54: "^",
  55: "&",
  56: "*",
  57: "(",
  59: ":",
  61: "+",
  173: "_",
  186: ":",
  187: "+",
  188: "<",
  189: "_",
  190: ">",
  191: "?",
  192: "~",
  219: "{",
  220: "|",
  221: "}",
  222: "\"",
  229: "Q"
};
var chrome = typeof navigator != "undefined" && (/Chrome\/(\d+)/).exec(navigator.userAgent);
var safari = typeof navigator != "undefined" && (/Apple Computer/).test(navigator.vendor);
var gecko = typeof navigator != "undefined" && (/Gecko\/\d+/).test(navigator.userAgent);
var mac = typeof navigator != "undefined" && (/Mac/).test(navigator.platform);
var ie = typeof navigator != "undefined" && (/MSIE \d|Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/).exec(navigator.userAgent);
var brokenModifierNames = chrome && (mac || +chrome[1] < 57) || gecko && mac;
for (var i = 0; i < 10; i++) exports.base[48 + i] = exports.base[96 + i] = String(i);
for (var i = 1; i <= 24; i++) exports.base[i + 111] = "F" + i;
for (var i = 65; i <= 90; i++) {
  exports.base[i] = String.fromCharCode(i + 32);
  exports.shift[i] = String.fromCharCode(i);
}
for (var code in exports.base) if (!exports.shift.hasOwnProperty(code)) exports.shift[code] = exports.base[code];
function keyName(event) {
  var ignoreKey = brokenModifierNames && (event.ctrlKey || event.altKey || event.metaKey) || (safari || ie) && event.shiftKey && event.key && event.key.length == 1;
  var name = !ignoreKey && event.key || (event.shiftKey ? exports.shift : exports.base)[event.keyCode] || event.key || "Unidentified";
  if (name == "Esc") name = "Escape";
  if (name == "Del") name = "Delete";
  if (name == "Left") name = "ArrowLeft";
  if (name == "Up") name = "ArrowUp";
  if (name == "Right") name = "ArrowRight";
  if (name == "Down") name = "ArrowDown";
  return name;
}
exports.keyName = keyName;

},

// node_modules/@codemirror/language/dist/index.js @21
21: function(__fusereq, exports, module){
exports.__esModule = true;
var lezer_tree_1 = __fusereq(19);
var text_1 = __fusereq(22);
var state_1 = __fusereq(15);
var view_1 = __fusereq(14);
const languageDataProp = new lezer_tree_1.NodeProp();
function defineLanguageFacet(baseData) {
  return state_1.Facet.define({
    combine: baseData ? values => values.concat(baseData) : undefined
  });
}
class Language {
  constructor(data, parser, topNode, extraExtensions = []) {
    this.data = data;
    this.topNode = topNode;
    if (!state_1.EditorState.prototype.hasOwnProperty("tree")) Object.defineProperty(state_1.EditorState.prototype, "tree", {
      get() {
        return syntaxTree(this);
      }
    });
    this.parser = parser;
    this.extension = [language.of(this), state_1.EditorState.languageData.of((state, pos) => state.facet(languageDataFacetAt(state, pos)))].concat(extraExtensions);
  }
  isActiveAt(state, pos) {
    return languageDataFacetAt(state, pos) == this.data;
  }
  findRegions(state) {
    let lang = state.facet(language);
    if ((lang === null || lang === void 0 ? void 0 : lang.data) == this.data) return [{
      from: 0,
      to: state.doc.length
    }];
    if (!lang || !lang.allowsNesting) return [];
    let result = [];
    syntaxTree(state).iterate({
      enter: (type, from, to) => {
        if (type.isTop && type.prop(languageDataProp) == this.data) {
          result.push({
            from,
            to
          });
          return false;
        }
        return undefined;
      }
    });
    return result;
  }
  get allowsNesting() {
    return true;
  }
  parseString(code) {
    let doc = text_1.Text.of(code.split("\n"));
    let parse = this.parser.startParse(new DocInput(doc), 0, new EditorParseContext(this.parser, state_1.EditorState.create({
      doc
    }), [], lezer_tree_1.Tree.empty, {
      from: 0,
      to: code.length
    }, []));
    let tree;
    while (!(tree = parse.advance())) {}
    return tree;
  }
}
Language.setState = state_1.StateEffect.define();
function languageDataFacetAt(state, pos) {
  let topLang = state.facet(language);
  if (!topLang) return null;
  if (!topLang.allowsNesting) return topLang.data;
  let tree = syntaxTree(state);
  let target = tree.resolve(pos, -1);
  while (target) {
    let facet = target.type.prop(languageDataProp);
    if (facet) return facet;
    target = target.parent;
  }
  return topLang.data;
}
class LezerLanguage extends Language {
  constructor(data, parser) {
    super(data, parser, parser.topNode);
    this.parser = parser;
  }
  static define(spec) {
    let data = defineLanguageFacet(spec.languageData);
    return new LezerLanguage(data, spec.parser.configure({
      props: [languageDataProp.add(type => type.isTop ? data : undefined)]
    }));
  }
  configure(options) {
    return new LezerLanguage(this.data, this.parser.configure(options));
  }
  get allowsNesting() {
    return this.parser.hasNested;
  }
}
function syntaxTree(state) {
  let field = state.field(Language.state, false);
  return field ? field.tree : lezer_tree_1.Tree.empty;
}
function ensureSyntaxTree(state, upto, timeout = 50) {
  var _a;
  let parse = (_a = state.field(Language.state, false)) === null || _a === void 0 ? void 0 : _a.context;
  return !parse ? null : parse.tree.length >= upto || parse.work(timeout, upto) ? parse.tree : null;
}
class DocInput {
  constructor(doc, length = doc.length) {
    this.doc = doc;
    this.length = length;
    this.cursorPos = 0;
    this.string = "";
    this.prevString = "";
    this.cursor = doc.iter();
  }
  syncTo(pos) {
    if (pos < this.cursorPos) {
      this.cursor = this.doc.iter();
      this.cursorPos = 0;
    }
    this.prevString = pos == this.cursorPos ? this.string : "";
    this.string = this.cursor.next(pos - this.cursorPos).value;
    this.cursorPos = pos + this.string.length;
    return this.cursorPos - this.string.length;
  }
  get(pos) {
    if (pos >= this.length) return -1;
    let stringStart = this.cursorPos - this.string.length;
    if (pos < stringStart || pos >= this.cursorPos) {
      if (pos < stringStart && pos >= stringStart - this.prevString.length) return this.prevString.charCodeAt(pos - (stringStart - this.prevString.length));
      stringStart = this.syncTo(pos);
    }
    return this.string.charCodeAt(pos - stringStart);
  }
  lineAfter(pos) {
    if (pos >= this.length || pos < 0) return "";
    let stringStart = this.cursorPos - this.string.length;
    if (pos < stringStart || pos >= this.cursorPos) stringStart = this.syncTo(pos);
    return this.cursor.lineBreak ? "" : this.string.slice(pos - stringStart);
  }
  read(from, to) {
    let stringStart = this.cursorPos - this.string.length;
    if (from < stringStart || to >= this.cursorPos) return this.doc.sliceString(from, to); else return this.string.slice(from - stringStart, to - stringStart);
  }
  clip(at) {
    return new DocInput(this.doc, at);
  }
}
class EditorParseContext {
  constructor(parser, state, fragments = [], tree, viewport, skipped) {
    this.parser = parser;
    this.state = state;
    this.fragments = fragments;
    this.tree = tree;
    this.viewport = viewport;
    this.skipped = skipped;
    this.parse = null;
    this.tempSkipped = [];
  }
  work(time, upto) {
    if (this.tree != lezer_tree_1.Tree.empty && (upto == null ? this.tree.length == this.state.doc.length : this.tree.length >= upto)) {
      this.takeTree();
      return true;
    }
    if (!this.parse) this.parse = this.parser.startParse(new DocInput(this.state.doc), 0, this);
    let endTime = Date.now() + time;
    for (; ; ) {
      let done = this.parse.advance();
      if (done) {
        this.fragments = this.withoutTempSkipped(lezer_tree_1.TreeFragment.addTree(done));
        this.parse = null;
        this.tree = done;
        return true;
      } else if (upto != null && this.parse.pos >= upto) {
        this.takeTree();
        return true;
      }
      if (Date.now() > endTime) return false;
    }
  }
  takeTree() {
    if (this.parse && this.parse.pos > this.tree.length) {
      this.tree = this.parse.forceFinish();
      this.fragments = this.withoutTempSkipped(lezer_tree_1.TreeFragment.addTree(this.tree, this.fragments, true));
    }
  }
  withoutTempSkipped(fragments) {
    for (let r; r = this.tempSkipped.pop(); ) fragments = cutFragments(fragments, r.from, r.to);
    return fragments;
  }
  changes(changes, newState) {
    let {fragments, tree, viewport, skipped} = this;
    this.takeTree();
    if (!changes.empty) {
      let ranges = [];
      changes.iterChangedRanges((fromA, toA, fromB, toB) => ranges.push({
        fromA,
        toA,
        fromB,
        toB
      }));
      fragments = lezer_tree_1.TreeFragment.applyChanges(fragments, ranges);
      tree = lezer_tree_1.Tree.empty;
      viewport = {
        from: changes.mapPos(viewport.from, -1),
        to: changes.mapPos(viewport.to, 1)
      };
      if (this.skipped.length) {
        skipped = [];
        for (let r of this.skipped) {
          let from = changes.mapPos(r.from, 1), to = changes.mapPos(r.to, -1);
          if (from < to) skipped.push({
            from,
            to
          });
        }
      }
    }
    return new EditorParseContext(this.parser, newState, fragments, tree, viewport, skipped);
  }
  updateViewport(viewport) {
    this.viewport = viewport;
    let startLen = this.skipped.length;
    for (let i = 0; i < this.skipped.length; i++) {
      let {from, to} = this.skipped[i];
      if (from < viewport.to && to > viewport.from) {
        this.fragments = cutFragments(this.fragments, from, to);
        this.skipped.splice(i--, 1);
      }
    }
    return this.skipped.length < startLen;
  }
  reset() {
    if (this.parse) {
      this.takeTree();
      this.parse = null;
    }
  }
  skipUntilInView(from, to) {
    this.skipped.push({
      from,
      to
    });
  }
  movedPast(pos) {
    return this.tree.length < pos && this.parse && this.parse.pos >= pos;
  }
}
EditorParseContext.skippingParser = {
  startParse(input, startPos, context) {
    return {
      pos: startPos,
      advance() {
        context.tempSkipped.push({
          from: startPos,
          to: input.length
        });
        this.pos = input.length;
        return new lezer_tree_1.Tree(lezer_tree_1.NodeType.none, [], [], input.length - startPos);
      },
      forceFinish() {
        return this.advance();
      }
    };
  }
};
function cutFragments(fragments, from, to) {
  return lezer_tree_1.TreeFragment.applyChanges(fragments, [{
    fromA: from,
    toA: to,
    fromB: from,
    toB: to
  }]);
}
class LanguageState {
  constructor(context) {
    this.context = context;
    this.tree = context.tree;
  }
  apply(tr) {
    if (!tr.docChanged) return this;
    let newCx = this.context.changes(tr.changes, tr.state);
    let upto = this.context.tree.length == tr.startState.doc.length ? undefined : Math.max(tr.changes.mapPos(this.context.tree.length), newCx.viewport.to);
    if (!newCx.work(25, upto)) newCx.takeTree();
    return new LanguageState(newCx);
  }
  static init(state) {
    let parseState = new EditorParseContext(state.facet(language).parser, state, [], lezer_tree_1.Tree.empty, {
      from: 0,
      to: state.doc.length
    }, []);
    if (!parseState.work(25)) parseState.takeTree();
    return new LanguageState(parseState);
  }
}
Language.state = state_1.StateField.define({
  create: LanguageState.init,
  update(value, tr) {
    for (let e of tr.effects) if (e.is(Language.setState)) return e.value;
    if (tr.startState.facet(language) != tr.state.facet(language)) return LanguageState.init(tr.state);
    return value.apply(tr);
  }
});
let requestIdle = typeof window != "undefined" && window.requestIdleCallback || ((callback, {timeout}) => setTimeout(callback, timeout));
let cancelIdle = typeof window != "undefined" && window.cancelIdleCallback || clearTimeout;
const parseWorker = view_1.ViewPlugin.fromClass(class ParseWorker {
  constructor(view) {
    this.view = view;
    this.working = -1;
    this.chunkEnd = -1;
    this.chunkBudget = -1;
    this.work = this.work.bind(this);
    this.scheduleWork();
  }
  update(update) {
    if (update.viewportChanged) {
      let cx = this.view.state.field(Language.state).context;
      if (cx.updateViewport(update.view.viewport)) cx.reset();
      if (this.view.viewport.to > cx.tree.length) this.scheduleWork();
    }
    if (update.docChanged) {
      if (this.view.hasFocus) this.chunkBudget += 50;
      this.scheduleWork();
    }
  }
  scheduleWork() {
    if (this.working > -1) return;
    let {state} = this.view, field = state.field(Language.state);
    if (field.tree.length >= state.doc.length) return;
    this.working = requestIdle(this.work, {
      timeout: 500
    });
  }
  work(deadline) {
    this.working = -1;
    let now = Date.now();
    if (this.chunkEnd < now && (this.chunkEnd < 0 || this.view.hasFocus)) {
      this.chunkEnd = now + 30000;
      this.chunkBudget = 3000;
    }
    if (this.chunkBudget <= 0) return;
    let {state, viewport: {to: vpTo}} = this.view, field = state.field(Language.state);
    if (field.tree.length >= vpTo + 1000000) return;
    let time = Math.min(this.chunkBudget, deadline ? Math.max(25, deadline.timeRemaining()) : 100);
    let done = field.context.work(time, vpTo + 1000000);
    this.chunkBudget -= Date.now() - now;
    if (done || this.chunkBudget <= 0 || field.context.movedPast(vpTo)) {
      field.context.takeTree();
      this.view.dispatch({
        effects: Language.setState.of(new LanguageState(field.context))
      });
    }
    if (!done && this.chunkBudget > 0) this.scheduleWork();
  }
  destroy() {
    if (this.working >= 0) cancelIdle(this.working);
  }
}, {
  eventHandlers: {
    focus() {
      this.scheduleWork();
    }
  }
});
const language = state_1.Facet.define({
  combine(languages) {
    return languages.length ? languages[0] : null;
  },
  enables: [Language.state, parseWorker]
});
class LanguageSupport {
  constructor(language, support = []) {
    this.language = language;
    this.support = support;
    this.extension = [language, support];
  }
}
class LanguageDescription {
  constructor(name, alias, extensions, filename, loadFunc) {
    this.name = name;
    this.alias = alias;
    this.extensions = extensions;
    this.filename = filename;
    this.loadFunc = loadFunc;
    this.support = undefined;
    this.loading = null;
  }
  load() {
    return this.loading || (this.loading = this.loadFunc().then(support => this.support = support, err => {
      this.loading = null;
      throw err;
    }));
  }
  static of(spec) {
    return new LanguageDescription(spec.name, (spec.alias || []).concat(spec.name).map(s => s.toLowerCase()), spec.extensions || [], spec.filename, spec.load);
  }
  static matchFilename(descs, filename) {
    for (let d of descs) if (d.filename && d.filename.test(filename)) return d;
    let ext = (/\.([^.]+)$/).exec(filename);
    if (ext) for (let d of descs) if (d.extensions.indexOf(ext[1]) > -1) return d;
    return null;
  }
  static matchLanguageName(descs, name, fuzzy = true) {
    name = name.toLowerCase();
    for (let d of descs) if (d.alias.some(a => a == name)) return d;
    if (fuzzy) for (let d of descs) for (let a of d.alias) {
      let found = name.indexOf(a);
      if (found > -1 && (a.length > 2 || !(/\w/).test(name[found - 1]) && !(/\w/).test(name[found + a.length]))) return d;
    }
    return null;
  }
}
const indentService = state_1.Facet.define();
const indentUnit = state_1.Facet.define({
  combine: values => {
    if (!values.length) return "  ";
    if (!(/^(?: +|\t+)$/).test(values[0])) throw new Error("Invalid indent unit: " + JSON.stringify(values[0]));
    return values[0];
  }
});
function getIndentUnit(state) {
  let unit = state.facet(indentUnit);
  return unit.charCodeAt(0) == 9 ? state.tabSize * unit.length : unit.length;
}
function indentString(state, cols) {
  let result = "", ts = state.tabSize;
  if (state.facet(indentUnit).charCodeAt(0) == 9) while (cols >= ts) {
    result += "\t";
    cols -= ts;
  }
  for (let i = 0; i < cols; i++) result += " ";
  return result;
}
function getIndentation(context, pos) {
  if (context instanceof state_1.EditorState) context = new IndentContext(context);
  for (let service of context.state.facet(indentService)) {
    let result = service(context, pos);
    if (result != null) return result;
  }
  let tree = syntaxTree(context.state);
  return tree ? syntaxIndentation(context, tree, pos) : null;
}
class IndentContext {
  constructor(state, options = {}) {
    this.state = state;
    this.options = options;
    this.unit = getIndentUnit(state);
  }
  textAfterPos(pos) {
    var _a, _b;
    let sim = (_a = this.options) === null || _a === void 0 ? void 0 : _a.simulateBreak;
    if (pos == sim && ((_b = this.options) === null || _b === void 0 ? void 0 : _b.simulateDoubleBreak)) return "";
    return this.state.sliceDoc(pos, Math.min(pos + 100, sim != null && sim > pos ? sim : 1e9, this.state.doc.lineAt(pos).to));
  }
  column(pos) {
    var _a;
    let line = this.state.doc.lineAt(pos), text = line.text.slice(0, pos - line.from);
    let result = this.countColumn(text, pos - line.from);
    let override = ((_a = this.options) === null || _a === void 0 ? void 0 : _a.overrideIndentation) ? this.options.overrideIndentation(line.from) : -1;
    if (override > -1) result += override - this.countColumn(text, text.search(/\S/));
    return result;
  }
  countColumn(line, pos) {
    return text_1.countColumn(pos < 0 ? line : line.slice(0, pos), 0, this.state.tabSize);
  }
  lineIndent(line) {
    var _a;
    let override = (_a = this.options) === null || _a === void 0 ? void 0 : _a.overrideIndentation;
    if (override) {
      let overriden = override(line.from);
      if (overriden > -1) return overriden;
    }
    return this.countColumn(line.text, line.text.search(/\S/));
  }
}
const indentNodeProp = new lezer_tree_1.NodeProp();
function syntaxIndentation(cx, ast, pos) {
  let tree = ast.resolve(pos);
  for (let scan = tree, scanPos = pos; ; ) {
    let last = scan.childBefore(scanPos);
    if (!last) break;
    if (last.type.isError && last.from == last.to) {
      tree = scan;
      scanPos = last.from;
    } else {
      scan = last;
      scanPos = scan.to + 1;
    }
  }
  return indentFrom(tree, pos, cx);
}
function ignoreClosed(cx) {
  var _a, _b;
  return cx.pos == ((_a = cx.options) === null || _a === void 0 ? void 0 : _a.simulateBreak) && ((_b = cx.options) === null || _b === void 0 ? void 0 : _b.simulateDoubleBreak);
}
function indentStrategy(tree) {
  let strategy = tree.type.prop(indentNodeProp);
  if (strategy) return strategy;
  let first = tree.firstChild, close;
  if (first && (close = first.type.prop(lezer_tree_1.NodeProp.closedBy))) {
    let last = tree.lastChild, closed = last && close.indexOf(last.name) > -1;
    return cx => delimitedStrategy(cx, true, 1, undefined, closed && !ignoreClosed(cx) ? last.from : undefined);
  }
  return tree.parent == null ? topIndent : null;
}
function indentFrom(node, pos, base) {
  for (; node; node = node.parent) {
    let strategy = indentStrategy(node);
    if (strategy) return strategy(new TreeIndentContext(base, pos, node));
  }
  return null;
}
function topIndent() {
  return 0;
}
class TreeIndentContext extends IndentContext {
  constructor(base, pos, node) {
    super(base.state, base.options);
    this.base = base;
    this.pos = pos;
    this.node = node;
  }
  get textAfter() {
    return this.textAfterPos(this.pos);
  }
  get baseIndent() {
    let line = this.state.doc.lineAt(this.node.from);
    for (; ; ) {
      let atBreak = this.node.resolve(line.from);
      while (atBreak.parent && atBreak.parent.from == atBreak.from) atBreak = atBreak.parent;
      if (isParent(atBreak, this.node)) break;
      line = this.state.doc.lineAt(atBreak.from);
    }
    return this.lineIndent(line);
  }
  continue() {
    let parent = this.node.parent;
    return parent ? indentFrom(parent, this.pos, this.base) : 0;
  }
}
function isParent(parent, of) {
  for (let cur = of; cur; cur = cur.parent) if (parent == cur) return true;
  return false;
}
function bracketedAligned(context) {
  var _a;
  let tree = context.node;
  let openToken = tree.childAfter(tree.from), last = tree.lastChild;
  if (!openToken) return null;
  let sim = (_a = context.options) === null || _a === void 0 ? void 0 : _a.simulateBreak;
  let openLine = context.state.doc.lineAt(openToken.from);
  let lineEnd = sim == null || sim <= openLine.from ? openLine.to : Math.min(openLine.to, sim);
  for (let pos = openToken.to; ; ) {
    let next = tree.childAfter(pos);
    if (!next || next == last) return null;
    if (!next.type.isSkipped) return next.from < lineEnd ? openToken : null;
    pos = next.to;
  }
}
function delimitedIndent({closing, align = true, units = 1}) {
  return context => delimitedStrategy(context, align, units, closing);
}
function delimitedStrategy(context, align, units, closing, closedAt) {
  let after = context.textAfter, space = after.match(/^\s*/)[0].length;
  let closed = closing && after.slice(space, space + closing.length) == closing || closedAt == context.pos + space;
  let aligned = align ? bracketedAligned(context) : null;
  if (aligned) return closed ? context.column(aligned.from) : context.column(aligned.to);
  return context.baseIndent + (closed ? 0 : context.unit * units);
}
const flatIndent = context => context.baseIndent;
function continuedIndent({except, units = 1} = {}) {
  return context => {
    let matchExcept = except && except.test(context.textAfter);
    return context.baseIndent + (matchExcept ? 0 : units * context.unit);
  };
}
const DontIndentBeyond = 200;
function indentOnInput() {
  return state_1.EditorState.transactionFilter.of(tr => {
    if (!tr.docChanged || tr.annotation(state_1.Transaction.userEvent) != "input") return tr;
    let rules = tr.startState.languageDataAt("indentOnInput", tr.startState.selection.main.head);
    if (!rules.length) return tr;
    let doc = tr.newDoc, {head} = tr.newSelection.main, line = doc.lineAt(head);
    if (head > line.from + DontIndentBeyond) return tr;
    let lineStart = doc.sliceString(line.from, head);
    if (!rules.some(r => r.test(lineStart))) return tr;
    let {state} = tr, last = -1, changes = [];
    for (let {head} of state.selection.ranges) {
      let line = state.doc.lineAt(head);
      if (line.from == last) continue;
      last = line.from;
      let indent = getIndentation(state, line.from);
      if (indent == null) continue;
      let cur = (/^\s*/).exec(line.text)[0];
      let norm = indentString(state, indent);
      if (cur != norm) changes.push({
        from: line.from,
        to: line.from + cur.length,
        insert: norm
      });
    }
    return changes.length ? [tr, {
      changes
    }] : tr;
  });
}
const foldService = state_1.Facet.define();
const foldNodeProp = new lezer_tree_1.NodeProp();
function foldInside(node) {
  let first = node.firstChild, last = node.lastChild;
  return first && first.to < last.from ? {
    from: first.to,
    to: last.type.isError ? node.to : last.from
  } : null;
}
function syntaxFolding(state, start, end) {
  let tree = syntaxTree(state);
  if (tree.length == 0) return null;
  let inner = tree.resolve(end);
  let found = null;
  for (let cur = inner; cur; cur = cur.parent) {
    if (cur.to <= end || cur.from > end) continue;
    if (found && cur.from < start) break;
    let prop = cur.type.prop(foldNodeProp);
    if (prop) {
      let value = prop(cur, state);
      if (value && value.from <= end && value.from >= start && value.to > end) found = value;
    }
  }
  return found;
}
function foldable(state, lineStart, lineEnd) {
  for (let service of state.facet(foldService)) {
    let result = service(state, lineStart, lineEnd);
    if (result) return result;
  }
  return syntaxFolding(state, lineStart, lineEnd);
}
exports.EditorParseContext = EditorParseContext;
exports.IndentContext = IndentContext;
exports.Language = Language;
exports.LanguageDescription = LanguageDescription;
exports.LanguageSupport = LanguageSupport;
exports.LezerLanguage = LezerLanguage;
exports.TreeIndentContext = TreeIndentContext;
exports.continuedIndent = continuedIndent;
exports.defineLanguageFacet = defineLanguageFacet;
exports.delimitedIndent = delimitedIndent;
exports.ensureSyntaxTree = ensureSyntaxTree;
exports.flatIndent = flatIndent;
exports.foldInside = foldInside;
exports.foldNodeProp = foldNodeProp;
exports.foldService = foldService;
exports.foldable = foldable;
exports.getIndentUnit = getIndentUnit;
exports.getIndentation = getIndentation;
exports.indentNodeProp = indentNodeProp;
exports.indentOnInput = indentOnInput;
exports.indentService = indentService;
exports.indentString = indentString;
exports.indentUnit = indentUnit;
exports.language = language;
exports.languageDataProp = languageDataProp;
exports.syntaxTree = syntaxTree;

},

// node_modules/@codemirror/stream-parser/dist/index.js @7
7: function(__fusereq, exports, module){
exports.__esModule = true;
var lezer_tree_1 = __fusereq(19);
var highlight_1 = __fusereq(20);
var language_1 = __fusereq(21);
var text_1 = __fusereq(22);
function countCol(string, end, tabSize, startIndex = 0, startValue = 0) {
  if (end == null) {
    end = string.search(/[^\s\u00a0]/);
    if (end == -1) end = string.length;
  }
  return text_1.countColumn(string.slice(startIndex, end), startValue, tabSize);
}
class StringStream {
  constructor(string, tabSize, indentUnit) {
    this.string = string;
    this.tabSize = tabSize;
    this.indentUnit = indentUnit;
    this.pos = 0;
    this.start = 0;
    this.lastColumnPos = 0;
    this.lastColumnValue = 0;
  }
  eol() {
    return this.pos >= this.string.length;
  }
  sol() {
    return this.pos == 0;
  }
  peek() {
    return this.string.charAt(this.pos) || undefined;
  }
  next() {
    if (this.pos < this.string.length) return this.string.charAt(this.pos++);
  }
  eat(match) {
    let ch = this.string.charAt(this.pos);
    let ok;
    if (typeof match == "string") ok = ch == match; else ok = ch && (match instanceof RegExp ? match.test(ch) : match(ch));
    if (ok) {
      ++this.pos;
      return ch;
    }
  }
  eatWhile(match) {
    let start = this.pos;
    while (this.eat(match)) {}
    return this.pos > start;
  }
  eatSpace() {
    let start = this.pos;
    while ((/[\s\u00a0]/).test(this.string.charAt(this.pos))) ++this.pos;
    return this.pos > start;
  }
  skipToEnd() {
    this.pos = this.string.length;
  }
  skipTo(ch) {
    let found = this.string.indexOf(ch, this.pos);
    if (found > -1) {
      this.pos = found;
      return true;
    }
  }
  backUp(n) {
    this.pos -= n;
  }
  column() {
    if (this.lastColumnPos < this.start) {
      this.lastColumnValue = countCol(this.string, this.start, this.tabSize, this.lastColumnPos, this.lastColumnValue);
      this.lastColumnPos = this.start;
    }
    return this.lastColumnValue;
  }
  indentation() {
    return countCol(this.string, null, this.tabSize);
  }
  match(pattern, consume, caseInsensitive) {
    if (typeof pattern == "string") {
      let cased = str => caseInsensitive ? str.toLowerCase() : str;
      let substr = this.string.substr(this.pos, pattern.length);
      if (cased(substr) == cased(pattern)) {
        if (consume !== false) this.pos += pattern.length;
        return true;
      } else return null;
    } else {
      let match = this.string.slice(this.pos).match(pattern);
      if (match && match.index > 0) return null;
      if (match && consume !== false) this.pos += match[0].length;
      return match;
    }
  }
  current() {
    return this.string.slice(this.start, this.pos);
  }
}
function fullParser(spec) {
  return {
    token: spec.token,
    blankLine: spec.blankLine || (() => {}),
    startState: spec.startState || (() => true),
    copyState: spec.copyState || defaultCopyState,
    indent: spec.indent || (() => null),
    languageData: spec.languageData || ({})
  };
}
function defaultCopyState(state) {
  if (typeof state != "object") return state;
  let newState = {};
  for (let prop in state) {
    let val = state[prop];
    newState[prop] = val instanceof Array ? val.slice() : val;
  }
  return newState;
}
class StreamLanguage extends language_1.Language {
  constructor(parser) {
    let data = language_1.defineLanguageFacet(parser.languageData);
    let p = fullParser(parser);
    let startParse = (input, startPos, context) => new Parse(this, input, startPos, context);
    super(data, {
      startParse
    }, docID(data), [language_1.indentService.of((cx, pos) => this.getIndent(cx, pos))]);
    this.streamParser = p;
    this.stateAfter = new WeakMap();
  }
  static define(spec) {
    return new StreamLanguage(spec);
  }
  getIndent(cx, pos) {
    let tree = language_1.syntaxTree(cx.state), at = tree.resolve(pos);
    while (at && at.type != this.topNode) at = at.parent;
    if (!at) return null;
    let start = findState(this, tree, 0, at.from, pos), statePos, state;
    if (start) {
      state = start.state;
      statePos = start.pos + 1;
    } else {
      state = this.streamParser.startState(cx.unit);
      statePos = 0;
    }
    if (pos - statePos > 10000) return null;
    while (statePos < pos) {
      let line = cx.state.doc.lineAt(statePos), end = Math.min(pos, line.to);
      if (line.length) {
        let stream = new StringStream(line.text, cx.state.tabSize, cx.unit);
        while (stream.pos < end - line.from) readToken(this.streamParser.token, stream, state);
      } else {
        this.streamParser.blankLine(state, cx.unit);
      }
      if (end == pos) break;
      statePos = line.to + 1;
    }
    let {text} = cx.state.doc.lineAt(pos);
    return this.streamParser.indent(state, (/^\s*(.*)/).exec(text)[1], cx);
  }
  get allowsNesting() {
    return false;
  }
}
function findState(lang, tree, off, startPos, before) {
  let state = off >= startPos && off + tree.length <= before && lang.stateAfter.get(tree);
  if (state) return {
    state: lang.streamParser.copyState(state),
    pos: off + tree.length
  };
  for (let i = tree.children.length - 1; i >= 0; i--) {
    let child = tree.children[i], pos = off + tree.positions[i];
    let found = child instanceof lezer_tree_1.Tree && pos < before && findState(lang, child, pos, startPos, before);
    if (found) return found;
  }
  return null;
}
function cutTree(lang, tree, from, to, inside) {
  if (inside && from <= 0 && to >= tree.length) return tree;
  if (!inside && tree.type == lang.topNode) inside = true;
  for (let i = tree.children.length - 1; i >= 0; i--) {
    let pos = tree.positions[i] + from, child = tree.children[i], inner;
    if (pos < to && child instanceof lezer_tree_1.Tree) {
      if (!(inner = cutTree(lang, child, from - pos, to - pos, inside))) break;
      return !inside ? inner : new lezer_tree_1.Tree(tree.type, tree.children.slice(0, i).concat(inner), tree.positions.slice(0, i + 1), pos + inner.length);
    }
  }
  return null;
}
function findStartInFragments(lang, fragments, startPos, state) {
  for (let f of fragments) {
    let found = f.from <= startPos && f.to > startPos && findState(lang, f.tree, 0 - f.offset, startPos, f.to), tree;
    if (found && (tree = cutTree(lang, f.tree, startPos + f.offset, found.pos + f.offset, false))) return {
      state: found.state,
      tree
    };
  }
  return {
    state: lang.streamParser.startState(language_1.getIndentUnit(state)),
    tree: lezer_tree_1.Tree.empty
  };
}
class Parse {
  constructor(lang, input, startPos, context) {
    this.lang = lang;
    this.input = input;
    this.startPos = startPos;
    this.context = context;
    this.chunks = [];
    this.chunkPos = [];
    this.chunk = [];
    let {state, tree} = findStartInFragments(lang, context.fragments, startPos, context.state);
    this.state = state;
    this.pos = this.chunkStart = startPos + tree.length;
    if (tree.length) {
      this.chunks.push(tree);
      this.chunkPos.push(0);
    }
    if (this.pos < context.viewport.from - 100000) {
      this.state = this.lang.streamParser.startState(language_1.getIndentUnit(context.state));
      context.skipUntilInView(this.pos, context.viewport.from);
      this.pos = context.viewport.from;
    }
  }
  advance() {
    let end = Math.min(this.context.viewport.to, this.input.length, this.chunkStart + 2048);
    while (this.pos < end) this.parseLine();
    if (this.chunkStart < this.pos) this.finishChunk();
    if (end < this.input.length && this.pos < this.context.viewport.to) return null;
    this.context.skipUntilInView(this.pos, this.input.length);
    return this.finish();
  }
  parseLine() {
    let line = this.input.lineAfter(this.pos), {streamParser} = this.lang;
    let stream = new StringStream(line, this.context ? this.context.state.tabSize : 4, language_1.getIndentUnit(this.context.state));
    if (stream.eol()) {
      streamParser.blankLine(this.state, stream.indentUnit);
    } else {
      while (!stream.eol()) {
        let token = readToken(streamParser.token, stream, this.state);
        if (token) this.chunk.push(tokenID(token), this.pos + stream.start, this.pos + stream.pos, 4);
      }
    }
    this.pos += line.length;
    if (this.pos < this.input.length) this.pos++;
  }
  finishChunk() {
    let tree = lezer_tree_1.Tree.build({
      buffer: this.chunk,
      start: this.chunkStart,
      length: this.pos - this.chunkStart,
      nodeSet,
      topID: 0,
      maxBufferLength: 2048
    });
    this.lang.stateAfter.set(tree, this.lang.streamParser.copyState(this.state));
    this.chunks.push(tree);
    this.chunkPos.push(this.chunkStart - this.startPos);
    this.chunk = [];
    this.chunkStart = this.pos;
  }
  finish() {
    return new lezer_tree_1.Tree(this.lang.topNode, this.chunks, this.chunkPos, this.pos - this.startPos).balance();
  }
  forceFinish() {
    return this.finish();
  }
}
function readToken(token, stream, state) {
  stream.start = stream.pos;
  for (let i = 0; i < 10; i++) {
    let result = token(stream, state);
    if (stream.pos > stream.start) return result;
  }
  throw new Error("Stream parser failed to advance stream.");
}
const tokenTable = Object.create(null);
const typeArray = [lezer_tree_1.NodeType.none];
const nodeSet = new lezer_tree_1.NodeSet(typeArray);
const warned = [];
function tokenID(tag) {
  return !tag ? 0 : tokenTable[tag] || (tokenTable[tag] = createTokenType(tag));
}
for (let [legacyName, name] of [["variable", "variableName"], ["variable-2", "variableName.special"], ["string-2", "string.special"], ["def", "variableName.definition"], ["tag", "typeName"], ["attribute", "propertyName"], ["type", "typeName"], ["builtin", "variableName.standard"], ["qualifier", "modifier"], ["error", "invalid"], ["header", "heading"], ["property", "propertyName"]]) tokenTable[legacyName] = tokenID(name);
function warnForPart(part, msg) {
  if (warned.indexOf(part) > -1) return;
  warned.push(part);
  console.warn(msg);
}
function createTokenType(tagStr) {
  let tag = null;
  for (let part of tagStr.split(".")) {
    let value = highlight_1.tags[part];
    if (!value) {
      warnForPart(part, `Unknown highlighting tag ${part}`);
    } else if (typeof value == "function") {
      if (!tag) warnForPart(part, `Modifier ${part} used at start of tag`); else tag = value(tag);
    } else {
      if (tag) warnForPart(part, `Tag ${part} used as modifier`); else tag = value;
    }
  }
  if (!tag) return 0;
  let name = tagStr.replace(/ /g, "_"), type = lezer_tree_1.NodeType.define({
    id: typeArray.length,
    name,
    props: [highlight_1.styleTags({
      [name]: tag
    })]
  });
  typeArray.push(type);
  return type.id;
}
function docID(data) {
  let type = lezer_tree_1.NodeType.define({
    id: typeArray.length,
    name: "Document",
    props: [language_1.languageDataProp.add(() => data)]
  });
  typeArray.push(type);
  return type;
}
exports.StreamLanguage = StreamLanguage;
exports.StringStream = StringStream;

},

// node_modules/@codemirror/lint/dist/index.js @5
5: function(__fusereq, exports, module){
exports.__esModule = true;
var view_1 = __fusereq(14);
var state_1 = __fusereq(15);
var tooltip_1 = __fusereq(16);
var panel_1 = __fusereq(17);
var crelt_1 = __fusereq(18);
var crelt_1d = __fuse.dt(crelt_1);
class SelectedDiagnostic {
  constructor(from, to, diagnostic) {
    this.from = from;
    this.to = to;
    this.diagnostic = diagnostic;
  }
}
class LintState {
  constructor(diagnostics, panel, selected) {
    this.diagnostics = diagnostics;
    this.panel = panel;
    this.selected = selected;
  }
}
function findDiagnostic(diagnostics, diagnostic = null, after = 0) {
  let found = null;
  diagnostics.between(after, 1e9, (from, to, {spec}) => {
    if (diagnostic && spec.diagnostic != diagnostic) return;
    found = new SelectedDiagnostic(from, to, spec.diagnostic);
    return false;
  });
  return found;
}
function maybeEnableLint(state, effects) {
  return state.field(lintState, false) ? effects : effects.concat(state_1.StateEffect.appendConfig.of([lintState, view_1.EditorView.decorations.compute([lintState], state => {
    let {selected, panel} = state.field(lintState);
    return !selected || !panel || selected.from == selected.to ? view_1.Decoration.none : view_1.Decoration.set([activeMark.range(selected.from, selected.to)]);
  }), tooltip_1.hoverTooltip(lintTooltip), baseTheme]));
}
function setDiagnostics(state, diagnostics) {
  return {
    effects: maybeEnableLint(state, [setDiagnosticsEffect.of(diagnostics)])
  };
}
const setDiagnosticsEffect = state_1.StateEffect.define();
const togglePanel = state_1.StateEffect.define();
const movePanelSelection = state_1.StateEffect.define();
const lintState = state_1.StateField.define({
  create() {
    return new LintState(view_1.Decoration.none, null, null);
  },
  update(value, tr) {
    if (tr.docChanged) {
      let mapped = value.diagnostics.map(tr.changes), selected = null;
      if (value.selected) {
        let selPos = tr.changes.mapPos(value.selected.from, 1);
        selected = findDiagnostic(mapped, value.selected.diagnostic, selPos) || findDiagnostic(mapped, null, selPos);
      }
      value = new LintState(mapped, value.panel, selected);
    }
    for (let effect of tr.effects) {
      if (effect.is(setDiagnosticsEffect)) {
        let ranges = view_1.Decoration.set(effect.value.map(d => {
          return d.from < d.to ? view_1.Decoration.mark({
            attributes: {
              class: "cm-lintRange cm-lintRange-" + d.severity
            },
            diagnostic: d
          }).range(d.from, d.to) : view_1.Decoration.widget({
            widget: new DiagnosticWidget(d),
            diagnostic: d
          }).range(d.from);
        }));
        value = new LintState(ranges, value.panel, findDiagnostic(ranges));
      } else if (effect.is(togglePanel)) {
        value = new LintState(value.diagnostics, effect.value ? LintPanel.open : null, value.selected);
      } else if (effect.is(movePanelSelection)) {
        value = new LintState(value.diagnostics, value.panel, effect.value);
      }
    }
    return value;
  },
  provide: f => [panel_1.showPanel.from(f, val => val.panel), view_1.EditorView.decorations.from(f, s => s.diagnostics)]
});
const activeMark = view_1.Decoration.mark({
  class: "cm-lintRange cm-lintRange-active"
});
function lintTooltip(view, pos, side) {
  let {diagnostics} = view.state.field(lintState);
  let found = [], stackStart = 2e8, stackEnd = 0;
  diagnostics.between(pos - (side < 0 ? 1 : 0), pos + (side > 0 ? 1 : 0), (from, to, {spec}) => {
    if (pos >= from && pos <= to && (from == to || (pos > from || side > 0) && (pos < to || side < 0))) {
      found.push(spec.diagnostic);
      stackStart = Math.min(from, stackStart);
      stackEnd = Math.max(to, stackEnd);
    }
  });
  if (!found.length) return null;
  return {
    pos: stackStart,
    end: stackEnd,
    above: view.state.doc.lineAt(stackStart).to < stackEnd,
    create() {
      return {
        dom: crelt_1d.default("ul", {
          class: "cm-tooltip-lint"
        }, found.map(d => renderDiagnostic(view, d, false)))
      };
    }
  };
}
const openLintPanel = view => {
  let field = view.state.field(lintState, false);
  if (!field || !field.panel) view.dispatch({
    effects: maybeEnableLint(view.state, [togglePanel.of(true)])
  });
  let panel = panel_1.getPanel(view, LintPanel.open);
  if (panel) panel.dom.querySelector(".cm-panel-lint ul").focus();
  return true;
};
const closeLintPanel = view => {
  let field = view.state.field(lintState, false);
  if (!field || !field.panel) return false;
  view.dispatch({
    effects: togglePanel.of(false)
  });
  return true;
};
const nextDiagnostic = view => {
  let field = view.state.field(lintState, false);
  if (!field) return false;
  let sel = view.state.selection.main, next = field.diagnostics.iter(sel.to + 1);
  if (!next.value) {
    next = field.diagnostics.iter(0);
    if (!next.value || next.from == sel.from && next.to == sel.to) return false;
  }
  view.dispatch({
    selection: {
      anchor: next.from,
      head: next.to
    },
    scrollIntoView: true
  });
  return true;
};
const lintKeymap = [{
  key: "Mod-Shift-m",
  run: openLintPanel
}, {
  key: "F8",
  run: nextDiagnostic
}];
const LintDelay = 500;
function linter(source) {
  return view_1.ViewPlugin.fromClass(class {
    constructor(view) {
      this.view = view;
      this.lintTime = Date.now() + LintDelay;
      this.set = true;
      this.run = this.run.bind(this);
      setTimeout(this.run, LintDelay);
    }
    run() {
      let now = Date.now();
      if (now < this.lintTime - 10) {
        setTimeout(this.run, this.lintTime - now);
      } else {
        this.set = false;
        let {state} = this.view;
        Promise.resolve(source(this.view)).then(annotations => {
          var _a, _b;
          if (this.view.state.doc == state.doc && (annotations.length || ((_b = (_a = this.view.state.field(lintState, false)) === null || _a === void 0 ? void 0 : _a.diagnostics) === null || _b === void 0 ? void 0 : _b.size))) this.view.dispatch(setDiagnostics(this.view.state, annotations));
        }, error => {
          view_1.logException(this.view.state, error);
        });
      }
    }
    update(update) {
      if (update.docChanged) {
        this.lintTime = Date.now() + LintDelay;
        if (!this.set) {
          this.set = true;
          setTimeout(this.run, LintDelay);
        }
      }
    }
  });
}
function assignKeys(actions) {
  let assigned = [];
  if (actions) actions: for (let {name} of actions) {
    for (let i = 0; i < name.length; i++) {
      let ch = name[i];
      if ((/[a-zA-Z]/).test(ch) && !assigned.some(c => c.toLowerCase() == ch.toLowerCase())) {
        assigned.push(ch);
        continue actions;
      }
    }
    assigned.push("");
  }
  return assigned;
}
function renderDiagnostic(view, diagnostic, inPanel) {
  var _a;
  let keys = inPanel ? assignKeys(diagnostic.actions) : [];
  return crelt_1d.default("li", {
    class: "cm-diagnostic cm-diagnostic-" + diagnostic.severity
  }, crelt_1d.default("span", {
    class: "cm-diagnosticText"
  }, diagnostic.message), (_a = diagnostic.actions) === null || _a === void 0 ? void 0 : _a.map((action, i) => {
    let click = e => {
      e.preventDefault();
      let found = findDiagnostic(view.state.field(lintState).diagnostics, diagnostic);
      if (found) action.apply(view, found.from, found.to);
    };
    let {name} = action, keyIndex = keys[i] ? name.indexOf(keys[i]) : -1;
    let nameElt = keyIndex < 0 ? name : [name.slice(0, keyIndex), crelt_1d.default("u", name.slice(keyIndex, keyIndex + 1)), name.slice(keyIndex + 1)];
    return crelt_1d.default("button", {
      class: "cm-diagnosticAction",
      onclick: click,
      onmousedown: click,
      "aria-label": ` Action: ${name}${keyIndex < 0 ? "" : ` (access key "${keys[i]})"`}.`
    }, nameElt);
  }), diagnostic.source && crelt_1d.default("div", {
    class: "cm-diagnosticSource"
  }, diagnostic.source));
}
class DiagnosticWidget extends view_1.WidgetType {
  constructor(diagnostic) {
    super();
    this.diagnostic = diagnostic;
  }
  eq(other) {
    return other.diagnostic == this.diagnostic;
  }
  toDOM() {
    return crelt_1d.default("span", {
      class: "cm-lintPoint cm-lintPoint-" + this.diagnostic.severity
    });
  }
}
class PanelItem {
  constructor(view, diagnostic) {
    this.diagnostic = diagnostic;
    this.id = "item_" + Math.floor(Math.random() * 0xffffffff).toString(16);
    this.dom = renderDiagnostic(view, diagnostic, true);
    this.dom.id = this.id;
    this.dom.setAttribute("role", "option");
  }
}
class LintPanel {
  constructor(view) {
    this.view = view;
    this.items = [];
    let onkeydown = event => {
      if (event.keyCode == 27) {
        closeLintPanel(this.view);
        this.view.focus();
      } else if (event.keyCode == 38 || event.keyCode == 33) {
        this.moveSelection((this.selectedIndex - 1 + this.items.length) % this.items.length);
      } else if (event.keyCode == 40 || event.keyCode == 34) {
        this.moveSelection((this.selectedIndex + 1) % this.items.length);
      } else if (event.keyCode == 36) {
        this.moveSelection(0);
      } else if (event.keyCode == 35) {
        this.moveSelection(this.items.length - 1);
      } else if (event.keyCode == 13) {
        this.view.focus();
      } else if (event.keyCode >= 65 && event.keyCode <= 90 && this.items.length) {
        let {diagnostic} = this.items[this.selectedIndex], keys = assignKeys(diagnostic.actions);
        for (let i = 0; i < keys.length; i++) if (keys[i].toUpperCase().charCodeAt(0) == event.keyCode) {
          let found = findDiagnostic(this.view.state.field(lintState).diagnostics, diagnostic);
          if (found) diagnostic.actions[i].apply(view, found.from, found.to);
        }
      } else {
        return;
      }
      event.preventDefault();
    };
    let onclick = event => {
      for (let i = 0; i < this.items.length; i++) {
        if (this.items[i].dom.contains(event.target)) this.moveSelection(i);
      }
    };
    this.list = crelt_1d.default("ul", {
      tabIndex: 0,
      role: "listbox",
      "aria-label": this.view.state.phrase("Diagnostics"),
      onkeydown,
      onclick
    });
    this.dom = crelt_1d.default("div", {
      class: "cm-panel-lint"
    }, this.list, crelt_1d.default("button", {
      name: "close",
      "aria-label": this.view.state.phrase("close"),
      onclick: () => closeLintPanel(this.view)
    }, "×"));
    this.update();
  }
  get selectedIndex() {
    let selected = this.view.state.field(lintState).selected;
    if (!selected) return -1;
    for (let i = 0; i < this.items.length; i++) if (this.items[i].diagnostic == selected.diagnostic) return i;
    return -1;
  }
  update() {
    let {diagnostics, selected} = this.view.state.field(lintState);
    let i = 0, needsSync = false, newSelectedItem = null;
    diagnostics.between(0, this.view.state.doc.length, (_start, _end, {spec}) => {
      let found = -1, item;
      for (let j = i; j < this.items.length; j++) if (this.items[j].diagnostic == spec.diagnostic) {
        found = j;
        break;
      }
      if (found < 0) {
        item = new PanelItem(this.view, spec.diagnostic);
        this.items.splice(i, 0, item);
        needsSync = true;
      } else {
        item = this.items[found];
        if (found > i) {
          this.items.splice(i, found - i);
          needsSync = true;
        }
      }
      if (selected && item.diagnostic == selected.diagnostic) {
        if (!item.dom.hasAttribute("aria-selected")) {
          item.dom.setAttribute("aria-selected", "true");
          newSelectedItem = item;
        }
      } else if (item.dom.hasAttribute("aria-selected")) {
        item.dom.removeAttribute("aria-selected");
      }
      i++;
    });
    while (i < this.items.length && !(this.items.length == 1 && this.items[0].diagnostic.from < 0)) {
      needsSync = true;
      this.items.pop();
    }
    if (this.items.length == 0) {
      this.items.push(new PanelItem(this.view, {
        from: -1,
        to: -1,
        severity: "info",
        message: this.view.state.phrase("No diagnostics")
      }));
      needsSync = true;
    }
    if (newSelectedItem) {
      this.list.setAttribute("aria-activedescendant", newSelectedItem.id);
      this.view.requestMeasure({
        key: this,
        read: () => ({
          sel: newSelectedItem.dom.getBoundingClientRect(),
          panel: this.list.getBoundingClientRect()
        }),
        write: ({sel, panel}) => {
          if (sel.top < panel.top) this.list.scrollTop -= panel.top - sel.top; else if (sel.bottom > panel.bottom) this.list.scrollTop += sel.bottom - panel.bottom;
        }
      });
    } else if (!this.items.length) {
      this.list.removeAttribute("aria-activedescendant");
    }
    if (needsSync) this.sync();
  }
  sync() {
    let domPos = this.list.firstChild;
    function rm() {
      let prev = domPos;
      domPos = prev.nextSibling;
      prev.remove();
    }
    for (let item of this.items) {
      if (item.dom.parentNode == this.list) {
        while (domPos != item.dom) rm();
        domPos = item.dom.nextSibling;
      } else {
        this.list.insertBefore(item.dom, domPos);
      }
    }
    while (domPos) rm();
    if (!this.list.firstChild) this.list.appendChild(renderDiagnostic(this.view, {
      severity: "info",
      message: this.view.state.phrase("No diagnostics")
    }, true));
  }
  moveSelection(selectedIndex) {
    if (this.items.length == 0) return;
    let field = this.view.state.field(lintState);
    let selection = findDiagnostic(field.diagnostics, this.items[selectedIndex].diagnostic);
    if (!selection) return;
    this.view.dispatch({
      selection: {
        anchor: selection.from,
        head: selection.to
      },
      scrollIntoView: true,
      effects: movePanelSelection.of(selection)
    });
  }
  static open(view) {
    return new LintPanel(view);
  }
}
function underline(color) {
  if (typeof btoa != "function") return "none";
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="6" height="3">
    <path d="m0 3 l2 -2 l1 0 l2 2 l1 0" stroke="${color}" fill="none" stroke-width=".7"/>
  </svg>`;
  return `url('data:image/svg+xml;base64,${btoa(svg)}')`;
}
const baseTheme = view_1.EditorView.baseTheme({
  ".cm-diagnostic": {
    padding: "3px 6px 3px 8px",
    marginLeft: "-1px",
    display: "block"
  },
  ".cm-diagnostic-error": {
    borderLeft: "5px solid #d11"
  },
  ".cm-diagnostic-warning": {
    borderLeft: "5px solid orange"
  },
  ".cm-diagnostic-info": {
    borderLeft: "5px solid #999"
  },
  ".cm-diagnosticAction": {
    font: "inherit",
    border: "none",
    padding: "2px 4px",
    backgroundColor: "#444",
    color: "white",
    borderRadius: "3px",
    marginLeft: "8px"
  },
  ".cm-diagnosticSource": {
    fontSize: "70%",
    opacity: .7
  },
  ".cm-lintRange": {
    backgroundPosition: "left bottom",
    backgroundRepeat: "repeat-x"
  },
  ".cm-lintRange-error": {
    backgroundImage: underline("#d11")
  },
  ".cm-lintRange-warning": {
    backgroundImage: underline("orange")
  },
  ".cm-lintRange-info": {
    backgroundImage: underline("#999")
  },
  ".cm-lintRange-active": {
    backgroundColor: "#ffdd9980"
  },
  ".cm-lintPoint": {
    position: "relative",
    "&:after": {
      content: '""',
      position: "absolute",
      bottom: 0,
      left: "-2px",
      borderLeft: "3px solid transparent",
      borderRight: "3px solid transparent",
      borderBottom: "4px solid #d11"
    }
  },
  ".cm-lintPoint-warning": {
    "&:after": {
      borderBottomColor: "orange"
    }
  },
  ".cm-lintPoint-info": {
    "&:after": {
      borderBottomColor: "#999"
    }
  },
  ".cm-panel.cm-panel-lint": {
    position: "relative",
    "& ul": {
      maxHeight: "100px",
      overflowY: "auto",
      "& [aria-selected]": {
        backgroundColor: "#ddd",
        "& u": {
          textDecoration: "underline"
        }
      },
      "&:focus [aria-selected]": {
        background_fallback: "#bdf",
        backgroundColor: "Highlight",
        color_fallback: "white",
        color: "HighlightText"
      },
      "& u": {
        textDecoration: "none"
      },
      padding: 0,
      margin: 0
    },
    "& [name=close]": {
      position: "absolute",
      top: "0",
      right: "2px",
      background: "inherit",
      border: "none",
      font: "inherit",
      padding: 0,
      margin: 0
    }
  },
  ".cm-tooltip.cm-tooltip-lint": {
    padding: 0,
    margin: 0
  }
});
exports.closeLintPanel = closeLintPanel;
exports.lintKeymap = lintKeymap;
exports.linter = linter;
exports.nextDiagnostic = nextDiagnostic;
exports.openLintPanel = openLintPanel;
exports.setDiagnostics = setDiagnostics;

},

// node_modules/@codemirror/tooltip/dist/index.js @16
16: function(__fusereq, exports, module){
exports.__esModule = true;
var view_1 = __fusereq(14);
var state_1 = __fusereq(15);
const ios = typeof navigator != "undefined" && !(/Edge\/(\d+)/).exec(navigator.userAgent) && (/Apple Computer/).test(navigator.vendor) && ((/Mobile\/\w+/).test(navigator.userAgent) || navigator.maxTouchPoints > 2);
const Outside = "-10000px";
const tooltipPlugin = view_1.ViewPlugin.fromClass(class {
  constructor(view) {
    this.view = view;
    this.inView = true;
    this.measureReq = {
      read: this.readMeasure.bind(this),
      write: this.writeMeasure.bind(this),
      key: this
    };
    this.input = view.state.facet(showTooltip);
    this.tooltips = this.input.filter(t => t);
    this.tooltipViews = this.tooltips.map(tp => this.createTooltip(tp));
  }
  update(update) {
    let input = update.state.facet(showTooltip);
    if (input == this.input) {
      for (let t of this.tooltipViews) if (t.update) t.update(update);
    } else {
      let tooltips = input.filter(x => x);
      let views = [];
      for (let i = 0; i < tooltips.length; i++) {
        let tip = tooltips[i], known = -1;
        if (!tip) continue;
        for (let i = 0; i < this.tooltips.length; i++) {
          let other = this.tooltips[i];
          if (other && other.create == tip.create) known = i;
        }
        if (known < 0) {
          views[i] = this.createTooltip(tip);
        } else {
          let tooltipView = views[i] = this.tooltipViews[known];
          if (tooltipView.update) tooltipView.update(update);
        }
      }
      for (let t of this.tooltipViews) if (views.indexOf(t) < 0) t.dom.remove();
      this.input = input;
      this.tooltips = tooltips;
      this.tooltipViews = views;
      this.maybeMeasure();
    }
  }
  createTooltip(tooltip) {
    let tooltipView = tooltip.create(this.view);
    tooltipView.dom.classList.add("cm-tooltip");
    if (tooltip.class) tooltipView.dom.classList.add(tooltip.class);
    tooltipView.dom.style.top = Outside;
    this.view.dom.appendChild(tooltipView.dom);
    if (tooltipView.mount) tooltipView.mount(this.view);
    return tooltipView;
  }
  destroy() {
    for (let {dom} of this.tooltipViews) dom.remove();
  }
  readMeasure() {
    return {
      editor: this.view.dom.getBoundingClientRect(),
      pos: this.tooltips.map(t => this.view.coordsAtPos(t.pos)),
      size: this.tooltipViews.map(({dom}) => dom.getBoundingClientRect()),
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight
    };
  }
  writeMeasure(measured) {
    let {editor} = measured;
    for (let i = 0; i < this.tooltipViews.length; i++) {
      let tooltip = this.tooltips[i], tView = this.tooltipViews[i], {dom} = tView;
      let pos = measured.pos[i], size = measured.size[i];
      if (!pos || pos.bottom <= editor.top || pos.top >= editor.bottom || pos.right <= editor.left || pos.left >= editor.right) {
        dom.style.top = Outside;
        continue;
      }
      let width = size.right - size.left, height = size.bottom - size.top;
      let left = this.view.textDirection == view_1.Direction.LTR ? Math.min(pos.left, measured.innerWidth - width) : Math.max(0, pos.left - width);
      let above = !!tooltip.above;
      if (!tooltip.strictSide && (above ? pos.top - (size.bottom - size.top) < 0 : pos.bottom + (size.bottom - size.top) > measured.innerHeight)) above = !above;
      if (ios) {
        dom.style.top = (above ? pos.top - height : pos.bottom) - editor.top + "px";
        dom.style.left = left - editor.left + "px";
        dom.style.position = "absolute";
      } else {
        dom.style.top = (above ? pos.top - height : pos.bottom) + "px";
        dom.style.left = left + "px";
      }
      dom.classList.toggle("cm-tooltip-above", above);
      dom.classList.toggle("cm-tooltip-below", !above);
      if (tView.positioned) tView.positioned();
    }
  }
  maybeMeasure() {
    if (this.tooltips.length) {
      if (this.view.inView || this.inView) this.view.requestMeasure(this.measureReq);
      this.inView = this.view.inView;
    }
  }
}, {
  eventHandlers: {
    scroll() {
      this.maybeMeasure();
    }
  }
});
const baseTheme = view_1.EditorView.baseTheme({
  ".cm-tooltip": {
    position: "fixed",
    zIndex: 100
  },
  "&light .cm-tooltip": {
    border: "1px solid #ddd",
    backgroundColor: "#f5f5f5"
  },
  "&dark .cm-tooltip": {
    backgroundColor: "#333338",
    color: "white"
  }
});
function tooltips() {
  return [];
}
const showTooltip = state_1.Facet.define({
  enables: [tooltipPlugin, baseTheme]
});
const HoverTime = 750, HoverMaxDist = 6;
class HoverPlugin {
  constructor(view, source, field, setHover) {
    this.view = view;
    this.source = source;
    this.field = field;
    this.setHover = setHover;
    this.lastMouseMove = null;
    this.hoverTimeout = -1;
    this.restartTimeout = -1;
    this.pending = null;
    this.checkHover = this.checkHover.bind(this);
    view.dom.addEventListener("mouseleave", this.mouseleave = this.mouseleave.bind(this));
    view.dom.addEventListener("mousemove", this.mousemove = this.mousemove.bind(this));
  }
  update() {
    if (this.pending) {
      this.pending = null;
      clearTimeout(this.restartTimeout);
      this.restartTimeout = setTimeout(() => this.startHover(), 20);
    }
  }
  get active() {
    return this.view.state.field(this.field);
  }
  checkHover() {
    this.hoverTimeout = -1;
    if (this.active) return;
    let now = Date.now(), lastMove = this.lastMouseMove;
    if (now - lastMove.timeStamp < HoverTime) this.hoverTimeout = setTimeout(this.checkHover, HoverTime - (now - lastMove.timeStamp)); else this.startHover();
  }
  startHover() {
    var _a;
    clearTimeout(this.restartTimeout);
    let lastMove = this.lastMouseMove;
    let coords = {
      x: lastMove.clientX,
      y: lastMove.clientY
    };
    let pos = this.view.contentDOM.contains(lastMove.target) ? this.view.posAtCoords(coords) : null;
    if (pos == null) return;
    let posCoords = this.view.coordsAtPos(pos);
    if (posCoords == null || coords.y < posCoords.top || coords.y > posCoords.bottom || coords.x < posCoords.left - this.view.defaultCharacterWidth || coords.x > posCoords.right + this.view.defaultCharacterWidth) return;
    let bidi = this.view.bidiSpans(this.view.state.doc.lineAt(pos)).find(s => s.from <= pos && s.to >= pos);
    let rtl = bidi && bidi.dir == view_1.Direction.RTL ? -1 : 1;
    let open = this.source(this.view, pos, coords.x < posCoords.left ? -rtl : rtl);
    if ((_a = open) === null || _a === void 0 ? void 0 : _a.then) {
      let pending = this.pending = {
        pos
      };
      open.then(result => {
        if (this.pending == pending) {
          this.pending = null;
          if (result) this.view.dispatch({
            effects: this.setHover.of(result)
          });
        }
      }, e => view_1.logException(this.view.state, e, "hover tooltip"));
    } else if (open) {
      this.view.dispatch({
        effects: this.setHover.of(open)
      });
    }
  }
  mousemove(event) {
    var _a;
    this.lastMouseMove = event;
    if (this.hoverTimeout < 0) this.hoverTimeout = setTimeout(this.checkHover, HoverTime);
    let tooltip = this.active;
    if (tooltip && !isInTooltip(event.target) || this.pending) {
      let {pos} = tooltip || this.pending, end = (_a = tooltip === null || tooltip === void 0 ? void 0 : tooltip.end) !== null && _a !== void 0 ? _a : pos;
      if (pos == end ? this.view.posAtCoords({
        x: event.clientX,
        y: event.clientY
      }) != pos : !isOverRange(this.view, pos, end, event.clientX, event.clientY, HoverMaxDist)) {
        this.view.dispatch({
          effects: this.setHover.of(null)
        });
        this.pending = null;
      }
    }
  }
  mouseleave() {
    clearTimeout(this.hoverTimeout);
    this.hoverTimeout = -1;
    if (this.active) this.view.dispatch({
      effects: this.setHover.of(null)
    });
  }
  destroy() {
    clearTimeout(this.hoverTimeout);
    this.view.dom.removeEventListener("mouseleave", this.mouseleave);
    this.view.dom.removeEventListener("mousemove", this.mousemove);
  }
}
function isInTooltip(elt) {
  for (let cur = elt; cur; cur = cur.parentNode) if (cur.nodeType == 1 && cur.classList.contains("cm-tooltip")) return true;
  return false;
}
function isOverRange(view, from, to, x, y, margin) {
  let range = document.createRange();
  let fromDOM = view.domAtPos(from), toDOM = view.domAtPos(to);
  range.setEnd(toDOM.node, toDOM.offset);
  range.setStart(fromDOM.node, fromDOM.offset);
  let rects = range.getClientRects();
  range.detach();
  for (let i = 0; i < rects.length; i++) {
    let rect = rects[i];
    let dist = Math.max(rect.top - y, y - rect.bottom, rect.left - x, x - rect.right);
    if (dist <= margin) return true;
  }
  return false;
}
function hoverTooltip(source, options = {}) {
  const setHover = state_1.StateEffect.define();
  const hoverState = state_1.StateField.define({
    create() {
      return null;
    },
    update(value, tr) {
      if (value && (options.hideOnChange && (tr.docChanged || tr.selection))) return null;
      for (let effect of tr.effects) if (effect.is(setHover)) return effect.value;
      if (value && tr.docChanged) {
        let newPos = tr.changes.mapPos(value.pos, -1, state_1.MapMode.TrackDel);
        if (newPos == null) return null;
        let copy = Object.assign(Object.create(null), value);
        copy.pos = newPos;
        if (value.end != null) copy.end = tr.changes.mapPos(value.end);
        return copy;
      }
      return value;
    },
    provide: f => showTooltip.from(f)
  });
  return [hoverState, view_1.ViewPlugin.define(view => new HoverPlugin(view, source, hoverState, setHover))];
}
exports.hoverTooltip = hoverTooltip;
exports.showTooltip = showTooltip;
exports.tooltips = tooltips;

},

// node_modules/@codemirror/panel/dist/index.js @17
17: function(__fusereq, exports, module){
exports.__esModule = true;
var view_1 = __fusereq(14);
var state_1 = __fusereq(15);
const panelConfig = state_1.Facet.define({
  combine(configs) {
    let topContainer, bottomContainer;
    for (let c of configs) {
      topContainer = topContainer || c.topContainer;
      bottomContainer = bottomContainer || c.bottomContainer;
    }
    return {
      topContainer,
      bottomContainer
    };
  }
});
function panels(config) {
  return config ? [panelConfig.of(config)] : [];
}
function getPanel(view, panel) {
  let plugin = view.plugin(panelPlugin);
  let index = plugin ? plugin.specs.indexOf(panel) : -1;
  return index > -1 ? plugin.panels[index] : null;
}
const panelPlugin = view_1.ViewPlugin.fromClass(class {
  constructor(view) {
    this.input = view.state.facet(showPanel);
    this.specs = this.input.filter(s => s);
    this.panels = this.specs.map(spec => spec(view));
    let conf = view.state.facet(panelConfig);
    this.top = new PanelGroup(view, true, conf.topContainer);
    this.bottom = new PanelGroup(view, false, conf.bottomContainer);
    this.top.sync(this.panels.filter(p => p.top));
    this.bottom.sync(this.panels.filter(p => !p.top));
    for (let p of this.panels) {
      p.dom.classList.add("cm-panel");
      if (p.class) p.dom.classList.add(p.class);
      if (p.mount) p.mount();
    }
  }
  update(update) {
    let conf = update.state.facet(panelConfig);
    if (this.top.container != conf.topContainer) {
      this.top.sync([]);
      this.top = new PanelGroup(update.view, true, conf.topContainer);
    }
    if (this.bottom.container != conf.bottomContainer) {
      this.bottom.sync([]);
      this.bottom = new PanelGroup(update.view, false, conf.bottomContainer);
    }
    this.top.syncClasses();
    this.bottom.syncClasses();
    let input = update.state.facet(showPanel);
    if (input != this.input) {
      let specs = input.filter(x => x);
      let panels = [], top = [], bottom = [], mount = [];
      for (let spec of specs) {
        let known = this.specs.indexOf(spec), panel;
        if (known < 0) {
          panel = spec(update.view);
          mount.push(panel);
        } else {
          panel = this.panels[known];
          if (panel.update) panel.update(update);
        }
        panels.push(panel);
        (panel.top ? top : bottom).push(panel);
      }
      this.specs = specs;
      this.panels = panels;
      this.top.sync(top);
      this.bottom.sync(bottom);
      for (let p of mount) {
        p.dom.classList.add("cm-panel");
        if (p.class) p.dom.classList.add(p.class);
        if (p.mount) p.mount();
      }
    } else {
      for (let p of this.panels) if (p.update) p.update(update);
    }
  }
  destroy() {
    this.top.sync([]);
    this.bottom.sync([]);
  }
}, {
  provide: view_1.PluginField.scrollMargins.from(value => ({
    top: value.top.scrollMargin(),
    bottom: value.bottom.scrollMargin()
  }))
});
class PanelGroup {
  constructor(view, top, container) {
    this.view = view;
    this.top = top;
    this.container = container;
    this.dom = undefined;
    this.classes = "";
    this.panels = [];
    this.syncClasses();
  }
  sync(panels) {
    this.panels = panels;
    this.syncDOM();
  }
  syncDOM() {
    if (this.panels.length == 0) {
      if (this.dom) {
        this.dom.remove();
        this.dom = undefined;
      }
      return;
    }
    if (!this.dom) {
      this.dom = document.createElement("div");
      this.dom.className = this.top ? "cm-panels cm-panels-top" : "cm-panels cm-panels-bottom";
      this.dom.style[this.top ? "top" : "bottom"] = "0";
      let parent = this.container || this.view.dom;
      parent.insertBefore(this.dom, this.top ? parent.firstChild : null);
    }
    let curDOM = this.dom.firstChild;
    for (let panel of this.panels) {
      if (panel.dom.parentNode == this.dom) {
        while (curDOM != panel.dom) curDOM = rm(curDOM);
        curDOM = curDOM.nextSibling;
      } else {
        this.dom.insertBefore(panel.dom, curDOM);
      }
    }
    while (curDOM) curDOM = rm(curDOM);
  }
  scrollMargin() {
    return !this.dom || this.container ? 0 : Math.max(0, this.top ? this.dom.getBoundingClientRect().bottom - this.view.scrollDOM.getBoundingClientRect().top : this.view.scrollDOM.getBoundingClientRect().bottom - this.dom.getBoundingClientRect().top);
  }
  syncClasses() {
    if (!this.container || this.classes == this.view.themeClasses) return;
    for (let cls of this.classes.split(" ")) if (cls) this.container.classList.remove(cls);
    for (let cls of (this.classes = this.view.themeClasses).split(" ")) if (cls) this.container.classList.add(cls);
  }
}
function rm(node) {
  let next = node.nextSibling;
  node.remove();
  return next;
}
const baseTheme = view_1.EditorView.baseTheme({
  ".cm-panels": {
    boxSizing: "border-box",
    position: "sticky",
    left: 0,
    right: 0
  },
  "&light .cm-panels": {
    backgroundColor: "#f5f5f5",
    color: "black"
  },
  "&light .cm-panels-top": {
    borderBottom: "1px solid #ddd"
  },
  "&light .cm-panels-bottom": {
    borderTop: "1px solid #ddd"
  },
  "&dark .cm-panels": {
    backgroundColor: "#333338",
    color: "white"
  }
});
const showPanel = state_1.Facet.define({
  enables: [panelPlugin, baseTheme]
});
exports.getPanel = getPanel;
exports.panels = panels;
exports.showPanel = showPanel;

},

// node_modules/crelt/index.es.js @18
18: function(__fusereq, exports, module){
exports.__esModule = true;
function crelt() {
  var elt = arguments[0];
  if (typeof elt == "string") elt = document.createElement(elt);
  var i = 1, next = arguments[1];
  if (next && typeof next == "object" && next.nodeType == null && !Array.isArray(next)) {
    for (var name in next) if (Object.prototype.hasOwnProperty.call(next, name)) {
      var value = next[name];
      if (typeof value == "string") elt.setAttribute(name, value); else if (value != null) elt[name] = value;
    }
    i++;
  }
  for (; i < arguments.length; i++) add(elt, arguments[i]);
  return elt;
}
exports.default = crelt;
function add(elt, child) {
  if (typeof child == "string") {
    elt.appendChild(document.createTextNode(child));
  } else if (child == null) {} else if (child.nodeType != null) {
    elt.appendChild(child);
  } else if (Array.isArray(child)) {
    for (var i = 0; i < child.length; i++) add(elt, child[i]);
  } else {
    throw new RangeError("Unsupported child node: " + child);
  }
}

},

// node_modules/@codemirror/fold/dist/index.js @28
28: function(__fusereq, exports, module){
exports.__esModule = true;
var state_1 = __fusereq(15);
var view_1 = __fusereq(14);
var language_1 = __fusereq(21);
var gutter_1 = __fusereq(29);
var rangeset_1 = __fusereq(39);
function mapRange(range, mapping) {
  let from = mapping.mapPos(range.from, 1), to = mapping.mapPos(range.to, -1);
  return from >= to ? undefined : {
    from,
    to
  };
}
const foldEffect = state_1.StateEffect.define({
  map: mapRange
});
const unfoldEffect = state_1.StateEffect.define({
  map: mapRange
});
function selectedLines(view) {
  let lines = [];
  for (let {head} of view.state.selection.ranges) {
    if (lines.some(l => l.from <= head && l.to >= head)) continue;
    lines.push(view.visualLineAt(head));
  }
  return lines;
}
const foldState = state_1.StateField.define({
  create() {
    return view_1.Decoration.none;
  },
  update(folded, tr) {
    folded = folded.map(tr.changes);
    for (let e of tr.effects) {
      if (e.is(foldEffect) && !foldExists(folded, e.value.from, e.value.to)) folded = folded.update({
        add: [foldWidget.range(e.value.from, e.value.to)]
      }); else if (e.is(unfoldEffect)) {
        folded = folded.update({
          filter: (from, to) => e.value.from != from || e.value.to != to,
          filterFrom: e.value.from,
          filterTo: e.value.to
        });
      }
    }
    if (tr.selection) {
      let onSelection = false, {head} = tr.selection.main;
      folded.between(head, head, (a, b) => {
        if (a < head && b > head) onSelection = true;
      });
      if (onSelection) folded = folded.update({
        filterFrom: head,
        filterTo: head,
        filter: (a, b) => b <= head || a >= head
      });
    }
    return folded;
  },
  provide: f => view_1.EditorView.decorations.compute([f], s => s.field(f))
});
function foldInside(state, from, to) {
  var _a;
  let found = null;
  (_a = state.field(foldState, false)) === null || _a === void 0 ? void 0 : _a.between(from, to, (from, to) => {
    if (!found || found.from > from) found = {
      from,
      to
    };
  });
  return found;
}
function foldExists(folded, from, to) {
  let found = false;
  folded.between(from, from, (a, b) => {
    if (a == from && b == to) found = true;
  });
  return found;
}
function maybeEnable(state, other) {
  return state.field(foldState, false) ? other : other.concat(state_1.StateEffect.appendConfig.of(codeFolding()));
}
const foldCode = view => {
  for (let line of selectedLines(view)) {
    let range = language_1.foldable(view.state, line.from, line.to);
    if (range) {
      view.dispatch({
        effects: maybeEnable(view.state, [foldEffect.of(range), announceFold(view, range)])
      });
      return true;
    }
  }
  return false;
};
const unfoldCode = view => {
  if (!view.state.field(foldState, false)) return false;
  let effects = [];
  for (let line of selectedLines(view)) {
    let folded = foldInside(view.state, line.from, line.to);
    if (folded) effects.push(unfoldEffect.of(folded), announceFold(view, folded, false));
  }
  if (effects.length) view.dispatch({
    effects
  });
  return effects.length > 0;
};
function announceFold(view, range, fold = true) {
  let lineFrom = view.state.doc.lineAt(range.from).number, lineTo = view.state.doc.lineAt(range.to).number;
  return view_1.EditorView.announce.of(`${view.state.phrase(fold ? "Folded lines" : "Unfolded lines")} ${lineFrom} ${view.state.phrase("to")} ${lineTo}.`);
}
const foldAll = view => {
  let {state} = view, effects = [];
  for (let pos = 0; pos < state.doc.length; ) {
    let line = view.visualLineAt(pos), range = language_1.foldable(state, line.from, line.to);
    if (range) effects.push(foldEffect.of(range));
    pos = (range ? view.visualLineAt(range.to) : line).to + 1;
  }
  if (effects.length) view.dispatch({
    effects: maybeEnable(view.state, effects)
  });
  return !!effects.length;
};
const unfoldAll = view => {
  let field = view.state.field(foldState, false);
  if (!field || !field.size) return false;
  let effects = [];
  field.between(0, view.state.doc.length, (from, to) => {
    effects.push(unfoldEffect.of({
      from,
      to
    }));
  });
  view.dispatch({
    effects
  });
  return true;
};
const foldKeymap = [{
  key: "Ctrl-Shift-[",
  mac: "Cmd-Alt-[",
  run: foldCode
}, {
  key: "Ctrl-Shift-]",
  mac: "Cmd-Alt-]",
  run: unfoldCode
}, {
  key: "Ctrl-Alt-[",
  run: foldAll
}, {
  key: "Ctrl-Alt-]",
  run: unfoldAll
}];
const defaultConfig = {
  placeholderDOM: null,
  placeholderText: "…"
};
const foldConfig = state_1.Facet.define({
  combine(values) {
    return state_1.combineConfig(values, defaultConfig);
  }
});
function codeFolding(config) {
  let result = [foldState, baseTheme];
  if (config) result.push(foldConfig.of(config));
  return result;
}
const foldWidget = view_1.Decoration.replace({
  widget: new (class extends view_1.WidgetType {
    ignoreEvents() {
      return false;
    }
    toDOM(view) {
      let {state} = view, conf = state.facet(foldConfig);
      if (conf.placeholderDOM) return conf.placeholderDOM();
      let element = document.createElement("span");
      element.textContent = conf.placeholderText;
      element.setAttribute("aria-label", state.phrase("folded code"));
      element.title = state.phrase("unfold");
      element.className = "cm-foldPlaceholder";
      element.onclick = event => {
        let line = view.visualLineAt(view.posAtDOM(event.target));
        let folded = foldInside(view.state, line.from, line.to);
        if (folded) view.dispatch({
          effects: unfoldEffect.of(folded)
        });
        event.preventDefault();
      };
      return element;
    }
  })()
});
const foldGutterDefaults = {
  openText: "⌄",
  closedText: "›"
};
class FoldMarker extends gutter_1.GutterMarker {
  constructor(config, open) {
    super();
    this.config = config;
    this.open = open;
  }
  eq(other) {
    return this.config == other.config && this.open == other.open;
  }
  toDOM(view) {
    let span = document.createElement("span");
    span.textContent = this.open ? this.config.openText : this.config.closedText;
    span.title = view.state.phrase(this.open ? "Fold line" : "Unfold line");
    return span;
  }
}
function foldGutter(config = {}) {
  let fullConfig = Object.assign(Object.assign({}, foldGutterDefaults), config);
  let canFold = new FoldMarker(fullConfig, true), canUnfold = new FoldMarker(fullConfig, false);
  let markers = view_1.ViewPlugin.fromClass(class {
    constructor(view) {
      this.from = view.viewport.from;
      this.markers = rangeset_1.RangeSet.of(this.buildMarkers(view));
    }
    update(update) {
      let firstChange = -1;
      update.changes.iterChangedRanges(from => {
        if (firstChange < 0) firstChange = from;
      });
      let foldChange = update.startState.field(foldState, false) != update.state.field(foldState, false);
      if (!foldChange && update.docChanged && update.view.viewport.from == this.from && firstChange > this.from) {
        let start = update.view.visualLineAt(firstChange).from;
        this.markers = this.markers.update({
          filter: () => false,
          filterFrom: start,
          add: this.buildMarkers(update.view, start)
        });
      } else if (foldChange || update.docChanged || update.viewportChanged) {
        this.from = update.view.viewport.from;
        this.markers = rangeset_1.RangeSet.of(this.buildMarkers(update.view));
      }
    }
    buildMarkers(view, from = 0) {
      let ranges = [];
      view.viewportLines(line => {
        if (line.from >= from) {
          let mark = foldInside(view.state, line.from, line.to) ? canUnfold : language_1.foldable(view.state, line.from, line.to) ? canFold : null;
          if (mark) ranges.push(mark.range(line.from));
        }
      });
      return ranges;
    }
  });
  return [markers, gutter_1.gutter({
    class: "cm-foldGutter",
    markers(view) {
      var _a;
      return ((_a = view.plugin(markers)) === null || _a === void 0 ? void 0 : _a.markers) || rangeset_1.RangeSet.empty;
    },
    initialSpacer() {
      return new FoldMarker(fullConfig, false);
    },
    domEventHandlers: {
      click: (view, line) => {
        let folded = foldInside(view.state, line.from, line.to);
        if (folded) {
          view.dispatch({
            effects: unfoldEffect.of(folded)
          });
          return true;
        }
        let range = language_1.foldable(view.state, line.from, line.to);
        if (range) {
          view.dispatch({
            effects: foldEffect.of(range)
          });
          return true;
        }
        return false;
      }
    }
  }), codeFolding()];
}
const baseTheme = view_1.EditorView.baseTheme({
  ".cm-foldPlaceholder": {
    backgroundColor: "#eee",
    border: "1px solid #ddd",
    color: "#888",
    borderRadius: ".2em",
    margin: "0 1px",
    padding: "0 1px",
    cursor: "pointer"
  },
  ".cm-foldGutter .cm-gutterElement": {
    padding: "0 1px",
    cursor: "pointer"
  }
});
exports.codeFolding = codeFolding;
exports.foldAll = foldAll;
exports.foldCode = foldCode;
exports.foldGutter = foldGutter;
exports.foldKeymap = foldKeymap;
exports.unfoldAll = unfoldAll;
exports.unfoldCode = unfoldCode;

},

// node_modules/@codemirror/gutter/dist/index.js @29
29: function(__fusereq, exports, module){
exports.__esModule = true;
var view_1 = __fusereq(14);
var rangeset_1 = __fusereq(39);
var state_1 = __fusereq(15);
class GutterMarker extends rangeset_1.RangeValue {
  compare(other) {
    return this == other || this.constructor == other.constructor && this.eq(other);
  }
  toDOM(_view) {
    return null;
  }
  at(pos) {
    return this.range(pos);
  }
}
GutterMarker.prototype.elementClass = "";
GutterMarker.prototype.mapMode = state_1.MapMode.TrackBefore;
const defaults = {
  class: "",
  renderEmptyElements: false,
  elementStyle: "",
  markers: () => rangeset_1.RangeSet.empty,
  lineMarker: () => null,
  initialSpacer: null,
  updateSpacer: null,
  domEventHandlers: {}
};
const activeGutters = state_1.Facet.define();
function gutter(config) {
  return [gutters(), activeGutters.of(Object.assign(Object.assign({}, defaults), config))];
}
const baseTheme = view_1.EditorView.baseTheme({
  ".cm-gutters": {
    display: "flex",
    height: "100%",
    boxSizing: "border-box",
    left: 0
  },
  "&light .cm-gutters": {
    backgroundColor: "#f5f5f5",
    color: "#999",
    borderRight: "1px solid #ddd"
  },
  "&dark .cm-gutters": {
    backgroundColor: "#333338",
    color: "#ccc"
  },
  ".cm-gutter": {
    display: "flex !important",
    flexDirection: "column",
    flexShrink: 0,
    boxSizing: "border-box",
    height: "100%",
    overflow: "hidden"
  },
  ".cm-gutterElement": {
    boxSizing: "border-box"
  },
  ".cm-lineNumbers .cm-gutterElement": {
    padding: "0 3px 0 5px",
    minWidth: "20px",
    textAlign: "right",
    whiteSpace: "nowrap"
  }
});
const unfixGutters = state_1.Facet.define({
  combine: values => values.some(x => x)
});
function gutters(config) {
  let result = [gutterView, baseTheme];
  if (config && config.fixed === false) result.push(unfixGutters.of(true));
  return result;
}
const gutterView = view_1.ViewPlugin.fromClass(class {
  constructor(view) {
    this.view = view;
    this.dom = document.createElement("div");
    this.dom.className = "cm-gutters";
    this.dom.setAttribute("aria-hidden", "true");
    this.gutters = view.state.facet(activeGutters).map(conf => new SingleGutterView(view, conf));
    for (let gutter of this.gutters) this.dom.appendChild(gutter.dom);
    this.fixed = !view.state.facet(unfixGutters);
    if (this.fixed) {
      this.dom.style.position = "sticky";
    }
    view.scrollDOM.insertBefore(this.dom, view.contentDOM);
  }
  update(update) {
    if (!this.updateGutters(update)) return;
    let contexts = this.gutters.map(gutter => new UpdateContext(gutter, this.view.viewport));
    this.view.viewportLines(line => {
      let text;
      if (Array.isArray(line.type)) {
        for (let b of line.type) if (b.type == view_1.BlockType.Text) {
          text = b;
          break;
        }
      } else {
        text = line.type == view_1.BlockType.Text ? line : undefined;
      }
      if (!text) return;
      for (let cx of contexts) cx.line(this.view, text);
    }, 0);
    for (let cx of contexts) cx.finish();
    this.dom.style.minHeight = this.view.contentHeight + "px";
    if (update.state.facet(unfixGutters) != !this.fixed) {
      this.fixed = !this.fixed;
      this.dom.style.position = this.fixed ? "sticky" : "";
    }
  }
  updateGutters(update) {
    let prev = update.startState.facet(activeGutters), cur = update.state.facet(activeGutters);
    let change = update.docChanged || update.heightChanged || update.viewportChanged;
    if (prev == cur) {
      for (let gutter of this.gutters) if (gutter.update(update)) change = true;
    } else {
      change = true;
      let gutters = [];
      for (let conf of cur) {
        let known = prev.indexOf(conf);
        if (known < 0) {
          gutters.push(new SingleGutterView(this.view, conf));
        } else {
          this.gutters[known].update(update);
          gutters.push(this.gutters[known]);
        }
      }
      for (let g of this.gutters) g.dom.remove();
      for (let g of gutters) this.dom.appendChild(g.dom);
      this.gutters = gutters;
    }
    return change;
  }
  destroy() {
    this.dom.remove();
  }
}, {
  provide: view_1.PluginField.scrollMargins.from(value => {
    if (value.gutters.length == 0 || !value.fixed) return null;
    return value.view.textDirection == view_1.Direction.LTR ? {
      left: value.dom.offsetWidth
    } : {
      right: value.dom.offsetWidth
    };
  })
});
function asArray(val) {
  return Array.isArray(val) ? val : [val];
}
class UpdateContext {
  constructor(gutter, viewport) {
    this.gutter = gutter;
    this.localMarkers = [];
    this.i = 0;
    this.height = 0;
    this.cursor = rangeset_1.RangeSet.iter(gutter.markers, viewport.from);
  }
  line(view, line) {
    if (this.localMarkers.length) this.localMarkers = [];
    while (this.cursor.value && this.cursor.from <= line.from) {
      if (this.cursor.from == line.from) this.localMarkers.push(this.cursor.value);
      this.cursor.next();
    }
    let forLine = this.gutter.config.lineMarker(view, line, this.localMarkers);
    if (forLine) this.localMarkers.unshift(forLine);
    let gutter = this.gutter;
    if (this.localMarkers.length == 0 && !gutter.config.renderEmptyElements) return;
    let above = line.top - this.height;
    if (this.i == gutter.elements.length) {
      let newElt = new GutterElement(view, line.height, above, this.localMarkers);
      gutter.elements.push(newElt);
      gutter.dom.appendChild(newElt.dom);
    } else {
      let markers = this.localMarkers, elt = gutter.elements[this.i];
      if (sameMarkers(markers, elt.markers)) {
        markers = elt.markers;
        this.localMarkers.length = 0;
      }
      elt.update(view, line.height, above, markers);
    }
    this.height = line.bottom;
    this.i++;
  }
  finish() {
    let gutter = this.gutter;
    while (gutter.elements.length > this.i) gutter.dom.removeChild(gutter.elements.pop().dom);
  }
}
class SingleGutterView {
  constructor(view, config) {
    this.view = view;
    this.config = config;
    this.elements = [];
    this.spacer = null;
    this.dom = document.createElement("div");
    this.dom.className = "cm-gutter" + (this.config.class ? " " + this.config.class : "");
    for (let prop in config.domEventHandlers) {
      this.dom.addEventListener(prop, event => {
        let line = view.visualLineAtHeight(event.clientY, view.contentDOM.getBoundingClientRect().top);
        if (config.domEventHandlers[prop](view, line, event)) event.preventDefault();
      });
    }
    this.markers = asArray(config.markers(view));
    if (config.initialSpacer) {
      this.spacer = new GutterElement(view, 0, 0, [config.initialSpacer(view)]);
      this.dom.appendChild(this.spacer.dom);
      this.spacer.dom.style.cssText += "visibility: hidden; pointer-events: none";
    }
  }
  update(update) {
    let prevMarkers = this.markers;
    this.markers = asArray(this.config.markers(update.view));
    if (this.spacer && this.config.updateSpacer) {
      let updated = this.config.updateSpacer(this.spacer.markers[0], update);
      if (updated != this.spacer.markers[0]) this.spacer.update(update.view, 0, 0, [updated]);
    }
    return this.markers != prevMarkers;
  }
}
class GutterElement {
  constructor(view, height, above, markers) {
    this.height = -1;
    this.above = 0;
    this.dom = document.createElement("div");
    this.update(view, height, above, markers);
  }
  update(view, height, above, markers) {
    if (this.height != height) this.dom.style.height = (this.height = height) + "px";
    if (this.above != above) this.dom.style.marginTop = (this.above = above) ? above + "px" : "";
    if (this.markers != markers) {
      this.markers = markers;
      for (let ch; ch = this.dom.lastChild; ) ch.remove();
      let cls = "cm-gutterElement";
      for (let m of markers) {
        let dom = m.toDOM(view);
        if (dom) this.dom.appendChild(dom);
        let c = m.elementClass;
        if (c) cls += " " + c;
      }
      this.dom.className = cls;
    }
  }
}
function sameMarkers(a, b) {
  if (a.length != b.length) return false;
  for (let i = 0; i < a.length; i++) if (!a[i].compare(b[i])) return false;
  return true;
}
const lineNumberMarkers = state_1.Facet.define();
const lineNumberConfig = state_1.Facet.define({
  combine(values) {
    return state_1.combineConfig(values, {
      formatNumber: String,
      domEventHandlers: {}
    }, {
      domEventHandlers(a, b) {
        let result = Object.assign({}, a);
        for (let event in b) {
          let exists = result[event], add = b[event];
          result[event] = exists ? (view, line, event) => exists(view, line, event) || add(view, line, event) : add;
        }
        return result;
      }
    });
  }
});
class NumberMarker extends GutterMarker {
  constructor(number) {
    super();
    this.number = number;
  }
  eq(other) {
    return this.number == other.number;
  }
  toDOM() {
    return document.createTextNode(this.number);
  }
}
function formatNumber(view, number) {
  return view.state.facet(lineNumberConfig).formatNumber(number, view.state);
}
const lineNumberGutter = gutter({
  class: "cm-lineNumbers",
  markers(view) {
    return view.state.facet(lineNumberMarkers);
  },
  lineMarker(view, line, others) {
    if (others.length) return null;
    return new NumberMarker(formatNumber(view, view.state.doc.lineAt(line.from).number));
  },
  initialSpacer(view) {
    return new NumberMarker(formatNumber(view, maxLineNumber(view.state.doc.lines)));
  },
  updateSpacer(spacer, update) {
    let max = formatNumber(update.view, maxLineNumber(update.view.state.doc.lines));
    return max == spacer.number ? spacer : new NumberMarker(max);
  }
});
function lineNumbers(config = {}) {
  return [lineNumberConfig.of(config), lineNumberGutter];
}
function maxLineNumber(lines) {
  let last = 9;
  while (last < lines) last = last * 10 + 9;
  return last;
}
exports.GutterMarker = GutterMarker;
exports.gutter = gutter;
exports.gutters = gutters;
exports.lineNumberMarkers = lineNumberMarkers;
exports.lineNumbers = lineNumbers;

},

// node_modules/@codemirror/history/dist/index.js @27
27: function(__fusereq, exports, module){
exports.__esModule = true;
var state_1 = __fusereq(15);
var view_1 = __fusereq(14);
const fromHistory = state_1.Annotation.define();
const isolateHistory = state_1.Annotation.define();
const invertedEffects = state_1.Facet.define();
const historyConfig = state_1.Facet.define({
  combine(configs) {
    return state_1.combineConfig(configs, {
      minDepth: 100,
      newGroupDelay: 500
    }, {
      minDepth: Math.max,
      newGroupDelay: Math.min
    });
  }
});
const historyField = state_1.StateField.define({
  create() {
    return HistoryState.empty;
  },
  update(state, tr) {
    let config = tr.state.facet(historyConfig);
    let fromHist = tr.annotation(fromHistory);
    if (fromHist) {
      let item = HistEvent.fromTransaction(tr), from = fromHist.side;
      let other = from == 0 ? state.undone : state.done;
      if (item) other = updateBranch(other, other.length, config.minDepth, item); else other = addSelection(other, tr.startState.selection);
      return new HistoryState(from == 0 ? fromHist.rest : other, from == 0 ? other : fromHist.rest);
    }
    let isolate = tr.annotation(isolateHistory);
    if (isolate == "full" || isolate == "before") state = state.isolate();
    if (tr.annotation(state_1.Transaction.addToHistory) === false) return !tr.changes.empty ? state.addMapping(tr.changes.desc) : state;
    let event = HistEvent.fromTransaction(tr);
    let time = tr.annotation(state_1.Transaction.time), userEvent = tr.annotation(state_1.Transaction.userEvent);
    if (event) state = state.addChanges(event, time, userEvent, config.newGroupDelay, config.minDepth); else if (tr.selection) state = state.addSelection(tr.startState.selection, time, userEvent, config.newGroupDelay);
    if (isolate == "full" || isolate == "after") state = state.isolate();
    return state;
  }
});
function history(config = {}) {
  return [historyField, historyConfig.of(config), view_1.EditorView.domEventHandlers({
    beforeinput(e, view) {
      if (e.inputType == "historyUndo") return undo(view);
      if (e.inputType == "historyRedo") return redo(view);
      return false;
    }
  })];
}
function cmd(side, selection) {
  return function ({state, dispatch}) {
    let historyState = state.field(historyField, false);
    if (!historyState) return false;
    let tr = historyState.pop(side, state, selection);
    if (!tr) return false;
    dispatch(tr);
    return true;
  };
}
const undo = cmd(0, false);
const redo = cmd(1, false);
const undoSelection = cmd(0, true);
const redoSelection = cmd(1, true);
function depth(side) {
  return function (state) {
    let histState = state.field(historyField, false);
    if (!histState) return 0;
    let branch = side == 0 ? histState.done : histState.undone;
    return branch.length - (branch.length && !branch[0].changes ? 1 : 0);
  };
}
const undoDepth = depth(0);
const redoDepth = depth(1);
class HistEvent {
  constructor(changes, effects, mapped, startSelection, selectionsAfter) {
    this.changes = changes;
    this.effects = effects;
    this.mapped = mapped;
    this.startSelection = startSelection;
    this.selectionsAfter = selectionsAfter;
  }
  setSelAfter(after) {
    return new HistEvent(this.changes, this.effects, this.mapped, this.startSelection, after);
  }
  static fromTransaction(tr) {
    let effects = none;
    for (let invert of tr.startState.facet(invertedEffects)) {
      let result = invert(tr);
      if (result.length) effects = effects.concat(result);
    }
    if (!effects.length && tr.changes.empty) return null;
    return new HistEvent(tr.changes.invert(tr.startState.doc), effects, undefined, tr.startState.selection, none);
  }
  static selection(selections) {
    return new HistEvent(undefined, none, undefined, undefined, selections);
  }
}
function updateBranch(branch, to, maxLen, newEvent) {
  let start = to + 1 > maxLen + 20 ? to - maxLen - 1 : 0;
  let newBranch = branch.slice(start, to);
  newBranch.push(newEvent);
  return newBranch;
}
function isAdjacent(a, b) {
  let ranges = [], isAdjacent = false;
  a.iterChangedRanges((f, t) => ranges.push(f, t));
  b.iterChangedRanges((_f, _t, f, t) => {
    for (let i = 0; i < ranges.length; ) {
      let from = ranges[i++], to = ranges[i++];
      if (t >= from && f <= to) isAdjacent = true;
    }
  });
  return isAdjacent;
}
function eqSelectionShape(a, b) {
  return a.ranges.length == b.ranges.length && a.ranges.filter((r, i) => r.empty != b.ranges[i].empty).length === 0;
}
function conc(a, b) {
  return !a.length ? b : !b.length ? a : a.concat(b);
}
const none = [];
const MaxSelectionsPerEvent = 200;
function addSelection(branch, selection) {
  if (!branch.length) {
    return [HistEvent.selection([selection])];
  } else {
    let lastEvent = branch[branch.length - 1];
    let sels = lastEvent.selectionsAfter.slice(Math.max(0, lastEvent.selectionsAfter.length - MaxSelectionsPerEvent));
    if (sels.length && sels[sels.length - 1].eq(selection)) return branch;
    sels.push(selection);
    return updateBranch(branch, branch.length - 1, 1e9, lastEvent.setSelAfter(sels));
  }
}
function popSelection(branch) {
  let last = branch[branch.length - 1];
  let newBranch = branch.slice();
  newBranch[branch.length - 1] = last.setSelAfter(last.selectionsAfter.slice(0, last.selectionsAfter.length - 1));
  return newBranch;
}
function addMappingToBranch(branch, mapping) {
  if (!branch.length) return branch;
  let length = branch.length, selections = none;
  while (length) {
    let event = mapEvent(branch[length - 1], mapping, selections);
    if (event.changes && !event.changes.empty || event.effects.length) {
      let result = branch.slice(0, length);
      result[length - 1] = event;
      return result;
    } else {
      mapping = event.mapped;
      length--;
      selections = event.selectionsAfter;
    }
  }
  return selections.length ? [HistEvent.selection(selections)] : none;
}
function mapEvent(event, mapping, extraSelections) {
  let selections = conc(event.selectionsAfter.length ? event.selectionsAfter.map(s => s.map(mapping)) : none, extraSelections);
  if (!event.changes) return HistEvent.selection(selections);
  let mappedChanges = event.changes.map(mapping), before = mapping.mapDesc(event.changes, true);
  let fullMapping = event.mapped ? event.mapped.composeDesc(before) : before;
  return new HistEvent(mappedChanges, state_1.StateEffect.mapEffects(event.effects, mapping), fullMapping, event.startSelection.map(before), selections);
}
class HistoryState {
  constructor(done, undone, prevTime = 0, prevUserEvent = undefined) {
    this.done = done;
    this.undone = undone;
    this.prevTime = prevTime;
    this.prevUserEvent = prevUserEvent;
  }
  isolate() {
    return this.prevTime ? new HistoryState(this.done, this.undone) : this;
  }
  addChanges(event, time, userEvent, newGroupDelay, maxLen) {
    let done = this.done, lastEvent = done[done.length - 1];
    if (lastEvent && lastEvent.changes && time - this.prevTime < newGroupDelay && !lastEvent.selectionsAfter.length && !lastEvent.changes.empty && event.changes && isAdjacent(lastEvent.changes, event.changes)) {
      done = updateBranch(done, done.length - 1, maxLen, new HistEvent(event.changes.compose(lastEvent.changes), conc(event.effects, lastEvent.effects), lastEvent.mapped, lastEvent.startSelection, none));
    } else {
      done = updateBranch(done, done.length, maxLen, event);
    }
    return new HistoryState(done, none, time, userEvent);
  }
  addSelection(selection, time, userEvent, newGroupDelay) {
    let last = this.done.length ? this.done[this.done.length - 1].selectionsAfter : none;
    if (last.length > 0 && time - this.prevTime < newGroupDelay && userEvent == "keyboardselection" && this.prevUserEvent == userEvent && eqSelectionShape(last[last.length - 1], selection)) return this;
    return new HistoryState(addSelection(this.done, selection), this.undone, time, userEvent);
  }
  addMapping(mapping) {
    return new HistoryState(addMappingToBranch(this.done, mapping), addMappingToBranch(this.undone, mapping), this.prevTime, this.prevUserEvent);
  }
  pop(side, state, selection) {
    let branch = side == 0 ? this.done : this.undone;
    if (branch.length == 0) return null;
    let event = branch[branch.length - 1];
    if (selection && event.selectionsAfter.length) {
      return state.update({
        selection: event.selectionsAfter[event.selectionsAfter.length - 1],
        annotations: fromHistory.of({
          side,
          rest: popSelection(branch)
        })
      });
    } else if (!event.changes) {
      return null;
    } else {
      let rest = branch.length == 1 ? none : branch.slice(0, branch.length - 1);
      if (event.mapped) rest = addMappingToBranch(rest, event.mapped);
      return state.update({
        changes: event.changes,
        selection: event.startSelection,
        effects: event.effects,
        annotations: fromHistory.of({
          side,
          rest
        }),
        filter: false
      });
    }
  }
}
HistoryState.empty = new HistoryState(none, none);
const historyKeymap = [{
  key: "Mod-z",
  run: undo,
  preventDefault: true
}, {
  key: "Mod-y",
  mac: "Mod-Shift-z",
  run: redo,
  preventDefault: true
}, {
  key: "Mod-u",
  run: undoSelection,
  preventDefault: true
}, {
  key: "Alt-u",
  mac: "Mod-Shift-u",
  run: redoSelection,
  preventDefault: true
}];
exports.history = history;
exports.historyKeymap = historyKeymap;
exports.invertedEffects = invertedEffects;
exports.isolateHistory = isolateHistory;
exports.redo = redo;
exports.redoDepth = redoDepth;
exports.redoSelection = redoSelection;
exports.undo = undo;
exports.undoDepth = undoDepth;
exports.undoSelection = undoSelection;

},

// node_modules/@codemirror/commands/dist/index.js @30
30: function(__fusereq, exports, module){
exports.__esModule = true;
var state_1 = __fusereq(15);
var text_1 = __fusereq(22);
var view_1 = __fusereq(14);
var matchbrackets_1 = __fusereq(31);
var language_1 = __fusereq(21);
var lezer_tree_1 = __fusereq(19);
function updateSel(sel, by) {
  return state_1.EditorSelection.create(sel.ranges.map(by), sel.mainIndex);
}
function setSel(state, selection) {
  return state.update({
    selection,
    scrollIntoView: true,
    annotations: state_1.Transaction.userEvent.of("keyboardselection")
  });
}
function moveSel({state, dispatch}, how) {
  let selection = updateSel(state.selection, how);
  if (selection.eq(state.selection)) return false;
  dispatch(setSel(state, selection));
  return true;
}
function rangeEnd(range, forward) {
  return state_1.EditorSelection.cursor(forward ? range.to : range.from);
}
function cursorByChar(view, forward) {
  return moveSel(view, range => range.empty ? view.moveByChar(range, forward) : rangeEnd(range, forward));
}
const cursorCharLeft = view => cursorByChar(view, view.textDirection != view_1.Direction.LTR);
const cursorCharRight = view => cursorByChar(view, view.textDirection == view_1.Direction.LTR);
const cursorCharForward = view => cursorByChar(view, true);
const cursorCharBackward = view => cursorByChar(view, false);
function cursorByGroup(view, forward) {
  return moveSel(view, range => range.empty ? view.moveByGroup(range, forward) : rangeEnd(range, forward));
}
const cursorGroupLeft = view => cursorByGroup(view, view.textDirection != view_1.Direction.LTR);
const cursorGroupRight = view => cursorByGroup(view, view.textDirection == view_1.Direction.LTR);
const cursorGroupForward = view => cursorByGroup(view, true);
const cursorGroupBackward = view => cursorByGroup(view, false);
function interestingNode(state, node, bracketProp) {
  if (node.type.prop(bracketProp)) return true;
  let len = node.to - node.from;
  return len && (len > 2 || (/[^\s,.;:]/).test(state.sliceDoc(node.from, node.to))) || node.firstChild;
}
function moveBySyntax(state, start, forward) {
  let pos = language_1.syntaxTree(state).resolve(start.head);
  let bracketProp = forward ? lezer_tree_1.NodeProp.closedBy : lezer_tree_1.NodeProp.openedBy;
  for (let at = start.head; ; ) {
    let next = forward ? pos.childAfter(at) : pos.childBefore(at);
    if (!next) break;
    if (interestingNode(state, next, bracketProp)) pos = next; else at = forward ? next.to : next.from;
  }
  let bracket = pos.type.prop(bracketProp), match, newPos;
  if (bracket && (match = forward ? matchbrackets_1.matchBrackets(state, pos.from, 1) : matchbrackets_1.matchBrackets(state, pos.to, -1)) && match.matched) newPos = forward ? match.end.to : match.end.from; else newPos = forward ? pos.to : pos.from;
  return state_1.EditorSelection.cursor(newPos, forward ? -1 : 1);
}
const cursorSyntaxLeft = view => moveSel(view, range => moveBySyntax(view.state, range, view.textDirection != view_1.Direction.LTR));
const cursorSyntaxRight = view => moveSel(view, range => moveBySyntax(view.state, range, view.textDirection == view_1.Direction.LTR));
function cursorByLine(view, forward) {
  return moveSel(view, range => range.empty ? view.moveVertically(range, forward) : rangeEnd(range, forward));
}
const cursorLineUp = view => cursorByLine(view, false);
const cursorLineDown = view => cursorByLine(view, true);
function cursorByPage(view, forward) {
  return moveSel(view, range => range.empty ? view.moveVertically(range, forward, view.dom.clientHeight) : rangeEnd(range, forward));
}
const cursorPageUp = view => cursorByPage(view, false);
const cursorPageDown = view => cursorByPage(view, true);
function moveByLineBoundary(view, start, forward) {
  let line = view.visualLineAt(start.head), moved = view.moveToLineBoundary(start, forward);
  if (moved.head == start.head && moved.head != (forward ? line.to : line.from)) moved = view.moveToLineBoundary(start, forward, false);
  if (!forward && moved.head == line.from && line.length) {
    let space = (/^\s*/).exec(view.state.sliceDoc(line.from, Math.min(line.from + 100, line.to)))[0].length;
    if (space && start.head != line.from + space) moved = state_1.EditorSelection.cursor(line.from + space);
  }
  return moved;
}
const cursorLineBoundaryForward = view => moveSel(view, range => moveByLineBoundary(view, range, true));
const cursorLineBoundaryBackward = view => moveSel(view, range => moveByLineBoundary(view, range, false));
const cursorLineStart = view => moveSel(view, range => state_1.EditorSelection.cursor(view.visualLineAt(range.head).from, 1));
const cursorLineEnd = view => moveSel(view, range => state_1.EditorSelection.cursor(view.visualLineAt(range.head).to, -1));
function toMatchingBracket(state, dispatch, extend) {
  let found = false, selection = updateSel(state.selection, range => {
    let matching = matchbrackets_1.matchBrackets(state, range.head, -1) || matchbrackets_1.matchBrackets(state, range.head, 1) || range.head > 0 && matchbrackets_1.matchBrackets(state, range.head - 1, 1) || range.head < state.doc.length && matchbrackets_1.matchBrackets(state, range.head + 1, -1);
    if (!matching || !matching.end) return range;
    found = true;
    let head = matching.start.from == range.head ? matching.end.to : matching.end.from;
    return extend ? state_1.EditorSelection.range(range.anchor, head) : state_1.EditorSelection.cursor(head);
  });
  if (!found) return false;
  dispatch(setSel(state, selection));
  return true;
}
const cursorMatchingBracket = ({state, dispatch}) => toMatchingBracket(state, dispatch, false);
const selectMatchingBracket = ({state, dispatch}) => toMatchingBracket(state, dispatch, true);
function extendSel(view, how) {
  let selection = updateSel(view.state.selection, range => {
    let head = how(range);
    return state_1.EditorSelection.range(range.anchor, head.head, head.goalColumn);
  });
  if (selection.eq(view.state.selection)) return false;
  view.dispatch(setSel(view.state, selection));
  return true;
}
function selectByChar(view, forward) {
  return extendSel(view, range => view.moveByChar(range, forward));
}
const selectCharLeft = view => selectByChar(view, view.textDirection != view_1.Direction.LTR);
const selectCharRight = view => selectByChar(view, view.textDirection == view_1.Direction.LTR);
const selectCharForward = view => selectByChar(view, true);
const selectCharBackward = view => selectByChar(view, false);
function selectByGroup(view, forward) {
  return extendSel(view, range => view.moveByGroup(range, forward));
}
const selectGroupLeft = view => selectByGroup(view, view.textDirection != view_1.Direction.LTR);
const selectGroupRight = view => selectByGroup(view, view.textDirection == view_1.Direction.LTR);
const selectGroupForward = view => selectByGroup(view, true);
const selectGroupBackward = view => selectByGroup(view, false);
const selectSyntaxLeft = view => extendSel(view, range => moveBySyntax(view.state, range, view.textDirection != view_1.Direction.LTR));
const selectSyntaxRight = view => extendSel(view, range => moveBySyntax(view.state, range, view.textDirection == view_1.Direction.LTR));
function selectByLine(view, forward) {
  return extendSel(view, range => view.moveVertically(range, forward));
}
const selectLineUp = view => selectByLine(view, false);
const selectLineDown = view => selectByLine(view, true);
function selectByPage(view, forward) {
  return extendSel(view, range => view.moveVertically(range, forward, view.dom.clientHeight));
}
const selectPageUp = view => selectByPage(view, false);
const selectPageDown = view => selectByPage(view, true);
const selectLineBoundaryForward = view => extendSel(view, range => moveByLineBoundary(view, range, true));
const selectLineBoundaryBackward = view => extendSel(view, range => moveByLineBoundary(view, range, false));
const selectLineStart = view => extendSel(view, range => state_1.EditorSelection.cursor(view.visualLineAt(range.head).from));
const selectLineEnd = view => extendSel(view, range => state_1.EditorSelection.cursor(view.visualLineAt(range.head).to));
const cursorDocStart = ({state, dispatch}) => {
  dispatch(setSel(state, {
    anchor: 0
  }));
  return true;
};
const cursorDocEnd = ({state, dispatch}) => {
  dispatch(setSel(state, {
    anchor: state.doc.length
  }));
  return true;
};
const selectDocStart = ({state, dispatch}) => {
  dispatch(setSel(state, {
    anchor: state.selection.main.anchor,
    head: 0
  }));
  return true;
};
const selectDocEnd = ({state, dispatch}) => {
  dispatch(setSel(state, {
    anchor: state.selection.main.anchor,
    head: state.doc.length
  }));
  return true;
};
const selectAll = ({state, dispatch}) => {
  dispatch(state.update({
    selection: {
      anchor: 0,
      head: state.doc.length
    },
    annotations: state_1.Transaction.userEvent.of("keyboardselection")
  }));
  return true;
};
const selectLine = ({state, dispatch}) => {
  let ranges = selectedLineBlocks(state).map(({from, to}) => state_1.EditorSelection.range(from, Math.min(to + 1, state.doc.length)));
  dispatch(state.update({
    selection: state_1.EditorSelection.create(ranges),
    annotations: state_1.Transaction.userEvent.of("keyboardselection")
  }));
  return true;
};
const selectParentSyntax = ({state, dispatch}) => {
  let selection = updateSel(state.selection, range => {
    var _a;
    let context = language_1.syntaxTree(state).resolve(range.head, 1);
    while (!(context.from < range.from && context.to >= range.to || context.to > range.to && context.from <= range.from || !((_a = context.parent) === null || _a === void 0 ? void 0 : _a.parent))) context = context.parent;
    return state_1.EditorSelection.range(context.to, context.from);
  });
  dispatch(setSel(state, selection));
  return true;
};
const simplifySelection = ({state, dispatch}) => {
  let cur = state.selection, selection = null;
  if (cur.ranges.length > 1) selection = state_1.EditorSelection.create([cur.main]); else if (!cur.main.empty) selection = state_1.EditorSelection.create([state_1.EditorSelection.cursor(cur.main.head)]);
  if (!selection) return false;
  dispatch(setSel(state, selection));
  return true;
};
function deleteBy({state, dispatch}, by) {
  let changes = state.changeByRange(range => {
    let {from, to} = range;
    if (from == to) {
      let towards = by(from);
      from = Math.min(from, towards);
      to = Math.max(to, towards);
    }
    return from == to ? {
      range
    } : {
      changes: {
        from,
        to
      },
      range: state_1.EditorSelection.cursor(from)
    };
  });
  if (changes.changes.empty) return false;
  dispatch(state.update(changes, {
    scrollIntoView: true,
    annotations: state_1.Transaction.userEvent.of("delete")
  }));
  return true;
}
const deleteByChar = (target, forward, codePoint) => deleteBy(target, pos => {
  let {state} = target, line = state.doc.lineAt(pos), before;
  if (!forward && pos > line.from && pos < line.from + 200 && !(/[^ \t]/).test(before = line.text.slice(0, pos - line.from))) {
    if (before[before.length - 1] == "\t") return pos - 1;
    let col = text_1.countColumn(before, 0, state.tabSize), drop = col % language_1.getIndentUnit(state) || language_1.getIndentUnit(state);
    for (let i = 0; i < drop && before[before.length - 1 - i] == " "; i++) pos--;
    return pos;
  }
  let targetPos;
  if (codePoint) {
    let next = line.text.slice(pos - line.from + (forward ? 0 : -2), pos - line.from + (forward ? 2 : 0));
    let size = next ? text_1.codePointSize(text_1.codePointAt(next, 0)) : 1;
    targetPos = forward ? Math.min(state.doc.length, pos + size) : Math.max(0, pos - size);
  } else {
    targetPos = text_1.findClusterBreak(line.text, pos - line.from, forward) + line.from;
  }
  if (targetPos == pos && line.number != (forward ? state.doc.lines : 1)) targetPos += forward ? 1 : -1;
  return targetPos;
});
const deleteCodePointBackward = view => deleteByChar(view, false, true);
const deleteCodePointForward = view => deleteByChar(view, true, true);
const deleteCharBackward = view => deleteByChar(view, false, false);
const deleteCharForward = view => deleteByChar(view, true, false);
const deleteByGroup = (target, forward) => deleteBy(target, start => {
  let pos = start, {state} = target, line = state.doc.lineAt(pos);
  let categorize = state.charCategorizer(pos);
  for (let cat = null; ; ) {
    if (pos == (forward ? line.to : line.from)) {
      if (pos == start && line.number != (forward ? state.doc.lines : 1)) pos += forward ? 1 : -1;
      break;
    }
    let next = text_1.findClusterBreak(line.text, pos - line.from, forward) + line.from;
    let nextChar = line.text.slice(Math.min(pos, next) - line.from, Math.max(pos, next) - line.from);
    let nextCat = categorize(nextChar);
    if (cat != null && nextCat != cat) break;
    if (nextChar != " " || pos != start) cat = nextCat;
    pos = next;
  }
  return pos;
});
const deleteGroupBackward = target => deleteByGroup(target, false);
const deleteGroupForward = target => deleteByGroup(target, true);
const deleteToLineEnd = view => deleteBy(view, pos => {
  let lineEnd = view.visualLineAt(pos).to;
  if (pos < lineEnd) return lineEnd;
  return Math.min(view.state.doc.length, pos + 1);
});
const deleteTrailingWhitespace = ({state, dispatch}) => {
  let changes = [];
  for (let pos = 0, prev = "", iter = state.doc.iter(); ; ) {
    iter.next();
    if (iter.lineBreak || iter.done) {
      let trailing = prev.search(/\s+$/);
      if (trailing > -1) changes.push({
        from: pos - (prev.length - trailing),
        to: pos
      });
      if (iter.done) break;
      prev = "";
    } else {
      prev = iter.value;
    }
    pos += iter.value.length;
  }
  if (!changes.length) return false;
  dispatch(state.update({
    changes
  }));
  return true;
};
const splitLine = ({state, dispatch}) => {
  let changes = state.changeByRange(range => {
    return {
      changes: {
        from: range.from,
        to: range.to,
        insert: text_1.Text.of(["", ""])
      },
      range: state_1.EditorSelection.cursor(range.from)
    };
  });
  dispatch(state.update(changes, {
    scrollIntoView: true,
    annotations: state_1.Transaction.userEvent.of("input")
  }));
  return true;
};
const transposeChars = ({state, dispatch}) => {
  let changes = state.changeByRange(range => {
    if (!range.empty || range.from == 0 || range.from == state.doc.length) return {
      range
    };
    let pos = range.from, line = state.doc.lineAt(pos);
    let from = pos == line.from ? pos - 1 : text_1.findClusterBreak(line.text, pos - line.from, false) + line.from;
    let to = pos == line.to ? pos + 1 : text_1.findClusterBreak(line.text, pos - line.from, true) + line.from;
    return {
      changes: {
        from,
        to,
        insert: state.doc.slice(pos, to).append(state.doc.slice(from, pos))
      },
      range: state_1.EditorSelection.cursor(to)
    };
  });
  if (changes.changes.empty) return false;
  dispatch(state.update(changes, {
    scrollIntoView: true
  }));
  return true;
};
function selectedLineBlocks(state) {
  let blocks = [], upto = -1;
  for (let range of state.selection.ranges) {
    let startLine = state.doc.lineAt(range.from), endLine = state.doc.lineAt(range.to);
    if (upto == startLine.number) blocks[blocks.length - 1].to = endLine.to; else blocks.push({
      from: startLine.from,
      to: endLine.to
    });
    upto = endLine.number;
  }
  return blocks;
}
function moveLine(state, dispatch, forward) {
  let changes = [];
  for (let block of selectedLineBlocks(state)) {
    if (forward ? block.to == state.doc.length : block.from == 0) continue;
    let nextLine = state.doc.lineAt(forward ? block.to + 1 : block.from - 1);
    if (forward) changes.push({
      from: block.to,
      to: nextLine.to
    }, {
      from: block.from,
      insert: nextLine.text + state.lineBreak
    }); else changes.push({
      from: nextLine.from,
      to: block.from
    }, {
      from: block.to,
      insert: state.lineBreak + nextLine.text
    });
  }
  if (!changes.length) return false;
  dispatch(state.update({
    changes,
    scrollIntoView: true
  }));
  return true;
}
const moveLineUp = ({state, dispatch}) => moveLine(state, dispatch, false);
const moveLineDown = ({state, dispatch}) => moveLine(state, dispatch, true);
function copyLine(state, dispatch, forward) {
  let changes = [];
  for (let block of selectedLineBlocks(state)) {
    if (forward) changes.push({
      from: block.from,
      insert: state.doc.slice(block.from, block.to) + state.lineBreak
    }); else changes.push({
      from: block.to,
      insert: state.lineBreak + state.doc.slice(block.from, block.to)
    });
  }
  dispatch(state.update({
    changes,
    scrollIntoView: true
  }));
  return true;
}
const copyLineUp = ({state, dispatch}) => copyLine(state, dispatch, false);
const copyLineDown = ({state, dispatch}) => copyLine(state, dispatch, true);
const deleteLine = view => {
  let {state} = view, changes = state.changes(selectedLineBlocks(state).map(({from, to}) => {
    if (from > 0) from--; else if (to < state.doc.length) to++;
    return {
      from,
      to
    };
  }));
  let selection = updateSel(state.selection, range => view.moveVertically(range, true)).map(changes);
  view.dispatch({
    changes,
    selection,
    scrollIntoView: true
  });
  return true;
};
const insertNewline = ({state, dispatch}) => {
  dispatch(state.update(state.replaceSelection(state.lineBreak), {
    scrollIntoView: true
  }));
  return true;
};
function isBetweenBrackets(state, pos) {
  if ((/\(\)|\[\]|\{\}/).test(state.sliceDoc(pos - 1, pos + 1))) return {
    from: pos,
    to: pos
  };
  let context = language_1.syntaxTree(state).resolve(pos);
  let before = context.childBefore(pos), after = context.childAfter(pos), closedBy;
  if (before && after && before.to <= pos && after.from >= pos && (closedBy = before.type.prop(lezer_tree_1.NodeProp.closedBy)) && closedBy.indexOf(after.name) > -1 && state.doc.lineAt(before.to).from == state.doc.lineAt(after.from).from) return {
    from: before.to,
    to: after.from
  };
  return null;
}
const insertNewlineAndIndent = ({state, dispatch}) => {
  let changes = state.changeByRange(({from, to}) => {
    let explode = from == to && isBetweenBrackets(state, from);
    let cx = new language_1.IndentContext(state, {
      simulateBreak: from,
      simulateDoubleBreak: !!explode
    });
    let indent = language_1.getIndentation(cx, from);
    if (indent == null) indent = (/^\s*/).exec(state.doc.lineAt(from).text)[0].length;
    let line = state.doc.lineAt(from);
    while (to < line.to && (/\s/).test(line.text.slice(to - line.from, to + 1 - line.from))) to++;
    if (explode) ({from, to} = explode); else if (from > line.from && from < line.from + 100 && !(/\S/).test(line.text.slice(0, from))) from = line.from;
    let insert = ["", language_1.indentString(state, indent)];
    if (explode) insert.push(language_1.indentString(state, cx.lineIndent(line)));
    return {
      changes: {
        from,
        to,
        insert: text_1.Text.of(insert)
      },
      range: state_1.EditorSelection.cursor(from + 1 + insert[1].length)
    };
  });
  dispatch(state.update(changes, {
    scrollIntoView: true
  }));
  return true;
};
function changeBySelectedLine(state, f) {
  let atLine = -1;
  return state.changeByRange(range => {
    let changes = [];
    for (let pos = range.from; pos <= range.to; ) {
      let line = state.doc.lineAt(pos);
      if (line.number > atLine && (range.empty || range.to > line.from)) {
        f(line, changes, range);
        atLine = line.number;
      }
      pos = line.to + 1;
    }
    let changeSet = state.changes(changes);
    return {
      changes,
      range: state_1.EditorSelection.range(changeSet.mapPos(range.anchor, 1), changeSet.mapPos(range.head, 1))
    };
  });
}
const indentSelection = ({state, dispatch}) => {
  let updated = Object.create(null);
  let context = new language_1.IndentContext(state, {
    overrideIndentation: start => {
      let found = updated[start];
      return found == null ? -1 : found;
    }
  });
  let changes = changeBySelectedLine(state, (line, changes, range) => {
    let indent = language_1.getIndentation(context, line.from);
    if (indent == null) return;
    let cur = (/^\s*/).exec(line.text)[0];
    let norm = language_1.indentString(state, indent);
    if (cur != norm || range.from < line.from + cur.length) {
      updated[line.from] = indent;
      changes.push({
        from: line.from,
        to: line.from + cur.length,
        insert: norm
      });
    }
  });
  if (!changes.changes.empty) dispatch(state.update(changes));
  return true;
};
const indentMore = ({state, dispatch}) => {
  dispatch(state.update(changeBySelectedLine(state, (line, changes) => {
    changes.push({
      from: line.from,
      insert: state.facet(language_1.indentUnit)
    });
  })));
  return true;
};
const indentLess = ({state, dispatch}) => {
  dispatch(state.update(changeBySelectedLine(state, (line, changes) => {
    let space = (/^\s*/).exec(line.text)[0];
    if (!space) return;
    let col = text_1.countColumn(space, 0, state.tabSize), keep = 0;
    let insert = language_1.indentString(state, Math.max(0, col - language_1.getIndentUnit(state)));
    while (keep < space.length && keep < insert.length && space.charCodeAt(keep) == insert.charCodeAt(keep)) keep++;
    changes.push({
      from: line.from + keep,
      to: line.from + space.length,
      insert: insert.slice(keep)
    });
  })));
  return true;
};
const insertTab = ({state, dispatch}) => {
  if (state.selection.ranges.some(r => !r.empty)) return indentMore({
    state,
    dispatch
  });
  dispatch(state.update(state.replaceSelection("\t"), {
    scrollIntoView: true,
    annotations: state_1.Transaction.userEvent.of("input")
  }));
  return true;
};
const emacsStyleKeymap = [{
  key: "Ctrl-b",
  run: cursorCharLeft,
  shift: selectCharLeft
}, {
  key: "Ctrl-f",
  run: cursorCharRight,
  shift: selectCharRight
}, {
  key: "Ctrl-p",
  run: cursorLineUp,
  shift: selectLineUp
}, {
  key: "Ctrl-n",
  run: cursorLineDown,
  shift: selectLineDown
}, {
  key: "Ctrl-a",
  run: cursorLineStart,
  shift: selectLineStart
}, {
  key: "Ctrl-e",
  run: cursorLineEnd,
  shift: selectLineEnd
}, {
  key: "Ctrl-d",
  run: deleteCharForward
}, {
  key: "Ctrl-h",
  run: deleteCharBackward
}, {
  key: "Ctrl-k",
  run: deleteToLineEnd
}, {
  key: "Alt-d",
  run: deleteGroupForward
}, {
  key: "Ctrl-Alt-h",
  run: deleteGroupBackward
}, {
  key: "Ctrl-o",
  run: splitLine
}, {
  key: "Ctrl-t",
  run: transposeChars
}, {
  key: "Alt-f",
  run: cursorGroupForward,
  shift: selectGroupForward
}, {
  key: "Alt-b",
  run: cursorGroupBackward,
  shift: selectGroupBackward
}, {
  key: "Alt-<",
  run: cursorDocStart
}, {
  key: "Alt->",
  run: cursorDocEnd
}, {
  key: "Ctrl-v",
  run: cursorPageDown
}, {
  key: "Alt-v",
  run: cursorPageUp
}];
const standardKeymap = [{
  key: "ArrowLeft",
  run: cursorCharLeft,
  shift: selectCharLeft
}, {
  key: "Mod-ArrowLeft",
  mac: "Alt-ArrowLeft",
  run: cursorGroupLeft,
  shift: selectGroupLeft
}, {
  mac: "Cmd-ArrowLeft",
  run: cursorLineStart,
  shift: selectLineStart
}, {
  key: "ArrowRight",
  run: cursorCharRight,
  shift: selectCharRight
}, {
  key: "Mod-ArrowRight",
  mac: "Alt-ArrowRight",
  run: cursorGroupRight,
  shift: selectGroupRight
}, {
  mac: "Cmd-ArrowRight",
  run: cursorLineEnd,
  shift: selectLineEnd
}, {
  key: "ArrowUp",
  run: cursorLineUp,
  shift: selectLineUp
}, {
  mac: "Cmd-ArrowUp",
  run: cursorDocStart,
  shift: selectDocStart
}, {
  mac: "Ctrl-ArrowUp",
  run: cursorPageUp,
  shift: selectPageUp
}, {
  key: "ArrowDown",
  run: cursorLineDown,
  shift: selectLineDown
}, {
  mac: "Cmd-ArrowDown",
  run: cursorDocEnd,
  shift: selectDocEnd
}, {
  mac: "Ctrl-ArrowDown",
  run: cursorPageDown,
  shift: selectPageDown
}, {
  key: "PageUp",
  run: cursorPageUp,
  shift: selectPageUp
}, {
  key: "PageDown",
  run: cursorPageDown,
  shift: selectPageDown
}, {
  key: "Home",
  run: cursorLineBoundaryBackward,
  shift: selectLineBoundaryBackward
}, {
  key: "Mod-Home",
  run: cursorDocStart,
  shift: selectDocStart
}, {
  key: "End",
  run: cursorLineBoundaryForward,
  shift: selectLineBoundaryForward
}, {
  key: "Mod-End",
  run: cursorDocEnd,
  shift: selectDocEnd
}, {
  key: "Enter",
  run: insertNewlineAndIndent
}, {
  key: "Mod-a",
  run: selectAll
}, {
  key: "Backspace",
  run: deleteCodePointBackward
}, {
  key: "Delete",
  run: deleteCharForward
}, {
  key: "Mod-Backspace",
  mac: "Alt-Backspace",
  run: deleteGroupBackward
}, {
  key: "Mod-Delete",
  mac: "Alt-Delete",
  run: deleteGroupForward
}].concat(emacsStyleKeymap.map(b => ({
  mac: b.key,
  run: b.run,
  shift: b.shift
})));
const defaultKeymap = [{
  key: "Alt-ArrowLeft",
  mac: "Ctrl-ArrowLeft",
  run: cursorSyntaxLeft,
  shift: selectSyntaxLeft
}, {
  key: "Alt-ArrowRight",
  mac: "Ctrl-ArrowRight",
  run: cursorSyntaxRight,
  shift: selectSyntaxRight
}, {
  key: "Alt-ArrowUp",
  run: moveLineUp
}, {
  key: "Shift-Alt-ArrowUp",
  run: copyLineUp
}, {
  key: "Alt-ArrowDown",
  run: moveLineDown
}, {
  key: "Shift-Alt-ArrowDown",
  run: copyLineDown
}, {
  key: "Escape",
  run: simplifySelection
}, {
  key: "Alt-l",
  run: selectLine
}, {
  key: "Mod-i",
  run: selectParentSyntax
}, {
  key: "Mod-[",
  run: indentLess
}, {
  key: "Mod-]",
  run: indentMore
}, {
  key: "Mod-Alt-\\",
  run: indentSelection
}, {
  key: "Shift-Mod-k",
  run: deleteLine
}, {
  key: "Shift-Mod-\\",
  run: cursorMatchingBracket
}].concat(standardKeymap);
const defaultTabBinding = {
  key: "Tab",
  run: insertTab,
  shift: indentSelection
};
exports.copyLineDown = copyLineDown;
exports.copyLineUp = copyLineUp;
exports.cursorCharBackward = cursorCharBackward;
exports.cursorCharForward = cursorCharForward;
exports.cursorCharLeft = cursorCharLeft;
exports.cursorCharRight = cursorCharRight;
exports.cursorDocEnd = cursorDocEnd;
exports.cursorDocStart = cursorDocStart;
exports.cursorGroupBackward = cursorGroupBackward;
exports.cursorGroupForward = cursorGroupForward;
exports.cursorGroupLeft = cursorGroupLeft;
exports.cursorGroupRight = cursorGroupRight;
exports.cursorLineBoundaryBackward = cursorLineBoundaryBackward;
exports.cursorLineBoundaryForward = cursorLineBoundaryForward;
exports.cursorLineDown = cursorLineDown;
exports.cursorLineEnd = cursorLineEnd;
exports.cursorLineStart = cursorLineStart;
exports.cursorLineUp = cursorLineUp;
exports.cursorMatchingBracket = cursorMatchingBracket;
exports.cursorPageDown = cursorPageDown;
exports.cursorPageUp = cursorPageUp;
exports.cursorSyntaxLeft = cursorSyntaxLeft;
exports.cursorSyntaxRight = cursorSyntaxRight;
exports.defaultKeymap = defaultKeymap;
exports.defaultTabBinding = defaultTabBinding;
exports.deleteCharBackward = deleteCharBackward;
exports.deleteCharForward = deleteCharForward;
exports.deleteCodePointBackward = deleteCodePointBackward;
exports.deleteCodePointForward = deleteCodePointForward;
exports.deleteGroupBackward = deleteGroupBackward;
exports.deleteGroupForward = deleteGroupForward;
exports.deleteLine = deleteLine;
exports.deleteToLineEnd = deleteToLineEnd;
exports.deleteTrailingWhitespace = deleteTrailingWhitespace;
exports.emacsStyleKeymap = emacsStyleKeymap;
exports.indentLess = indentLess;
exports.indentMore = indentMore;
exports.indentSelection = indentSelection;
exports.insertNewline = insertNewline;
exports.insertNewlineAndIndent = insertNewlineAndIndent;
exports.insertTab = insertTab;
exports.moveLineDown = moveLineDown;
exports.moveLineUp = moveLineUp;
exports.selectAll = selectAll;
exports.selectCharBackward = selectCharBackward;
exports.selectCharForward = selectCharForward;
exports.selectCharLeft = selectCharLeft;
exports.selectCharRight = selectCharRight;
exports.selectDocEnd = selectDocEnd;
exports.selectDocStart = selectDocStart;
exports.selectGroupBackward = selectGroupBackward;
exports.selectGroupForward = selectGroupForward;
exports.selectGroupLeft = selectGroupLeft;
exports.selectGroupRight = selectGroupRight;
exports.selectLine = selectLine;
exports.selectLineBoundaryBackward = selectLineBoundaryBackward;
exports.selectLineBoundaryForward = selectLineBoundaryForward;
exports.selectLineDown = selectLineDown;
exports.selectLineEnd = selectLineEnd;
exports.selectLineStart = selectLineStart;
exports.selectLineUp = selectLineUp;
exports.selectMatchingBracket = selectMatchingBracket;
exports.selectPageDown = selectPageDown;
exports.selectPageUp = selectPageUp;
exports.selectParentSyntax = selectParentSyntax;
exports.selectSyntaxLeft = selectSyntaxLeft;
exports.selectSyntaxRight = selectSyntaxRight;
exports.simplifySelection = simplifySelection;
exports.splitLine = splitLine;
exports.standardKeymap = standardKeymap;
exports.transposeChars = transposeChars;

},

// node_modules/@codemirror/matchbrackets/dist/index.js @31
31: function(__fusereq, exports, module){
exports.__esModule = true;
var state_1 = __fusereq(15);
var language_1 = __fusereq(21);
var view_1 = __fusereq(14);
var lezer_tree_1 = __fusereq(19);
const baseTheme = view_1.EditorView.baseTheme({
  ".cm-matchingBracket": {
    color: "#0b0"
  },
  ".cm-nonmatchingBracket": {
    color: "#a22"
  }
});
const DefaultScanDist = 10000, DefaultBrackets = "()[]{}";
const bracketMatchingConfig = state_1.Facet.define({
  combine(configs) {
    return state_1.combineConfig(configs, {
      afterCursor: true,
      brackets: DefaultBrackets,
      maxScanDistance: DefaultScanDist
    });
  }
});
const matchingMark = view_1.Decoration.mark({
  class: "cm-matchingBracket"
}), nonmatchingMark = view_1.Decoration.mark({
  class: "cm-nonmatchingBracket"
});
const bracketMatchingState = state_1.StateField.define({
  create() {
    return view_1.Decoration.none;
  },
  update(deco, tr) {
    if (!tr.docChanged && !tr.selection) return deco;
    let decorations = [];
    let config = tr.state.facet(bracketMatchingConfig);
    for (let range of tr.state.selection.ranges) {
      if (!range.empty) continue;
      let match = matchBrackets(tr.state, range.head, -1, config) || range.head > 0 && matchBrackets(tr.state, range.head - 1, 1, config) || config.afterCursor && (matchBrackets(tr.state, range.head, 1, config) || range.head < tr.state.doc.length && matchBrackets(tr.state, range.head + 1, -1, config));
      if (!match) continue;
      let mark = match.matched ? matchingMark : nonmatchingMark;
      decorations.push(mark.range(match.start.from, match.start.to));
      if (match.end) decorations.push(mark.range(match.end.from, match.end.to));
    }
    return view_1.Decoration.set(decorations, true);
  },
  provide: f => view_1.EditorView.decorations.from(f)
});
const bracketMatchingUnique = [bracketMatchingState, baseTheme];
function bracketMatching(config = {}) {
  return [bracketMatchingConfig.of(config), bracketMatchingUnique];
}
function matchingNodes(node, dir, brackets) {
  let byProp = node.prop(dir < 0 ? lezer_tree_1.NodeProp.openedBy : lezer_tree_1.NodeProp.closedBy);
  if (byProp) return byProp;
  if (node.name.length == 1) {
    let index = brackets.indexOf(node.name);
    if (index > -1 && index % 2 == (dir < 0 ? 1 : 0)) return [brackets[index + dir]];
  }
  return null;
}
function matchBrackets(state, pos, dir, config = {}) {
  let maxScanDistance = config.maxScanDistance || DefaultScanDist, brackets = config.brackets || DefaultBrackets;
  let tree = language_1.syntaxTree(state), sub = tree.resolve(pos, dir), matches;
  if (matches = matchingNodes(sub.type, dir, brackets)) return matchMarkedBrackets(state, pos, dir, sub, matches, brackets); else return matchPlainBrackets(state, pos, dir, tree, sub.type, maxScanDistance, brackets);
}
function matchMarkedBrackets(_state, _pos, dir, token, matching, brackets) {
  let parent = token.parent, firstToken = {
    from: token.from,
    to: token.to
  };
  let depth = 0, cursor = parent === null || parent === void 0 ? void 0 : parent.cursor;
  if (cursor && (dir < 0 ? cursor.childBefore(token.from) : cursor.childAfter(token.to))) do {
    if (dir < 0 ? cursor.to <= token.from : cursor.from >= token.to) {
      if (depth == 0 && matching.indexOf(cursor.type.name) > -1) {
        return {
          start: firstToken,
          end: {
            from: cursor.from,
            to: cursor.to
          },
          matched: true
        };
      } else if (matchingNodes(cursor.type, dir, brackets)) {
        depth++;
      } else if (matchingNodes(cursor.type, -dir, brackets)) {
        depth--;
        if (depth == 0) return {
          start: firstToken,
          end: {
            from: cursor.from,
            to: cursor.to
          },
          matched: false
        };
      }
    }
  } while (dir < 0 ? cursor.prevSibling() : cursor.nextSibling());
  return {
    start: firstToken,
    matched: false
  };
}
function matchPlainBrackets(state, pos, dir, tree, tokenType, maxScanDistance, brackets) {
  let startCh = dir < 0 ? state.sliceDoc(pos - 1, pos) : state.sliceDoc(pos, pos + 1);
  let bracket = brackets.indexOf(startCh);
  if (bracket < 0 || bracket % 2 == 0 != dir > 0) return null;
  let startToken = {
    from: dir < 0 ? pos - 1 : pos,
    to: dir > 0 ? pos + 1 : pos
  };
  let iter = state.doc.iterRange(pos, dir > 0 ? state.doc.length : 0), depth = 0;
  for (let distance = 0; !iter.next().done && distance <= maxScanDistance; ) {
    let text = iter.value;
    if (dir < 0) distance += text.length;
    let basePos = pos + distance * dir;
    for (let pos = dir > 0 ? 0 : text.length - 1, end = dir > 0 ? text.length : -1; pos != end; pos += dir) {
      let found = brackets.indexOf(text[pos]);
      if (found < 0 || tree.resolve(basePos + pos, 1).type != tokenType) continue;
      if (found % 2 == 0 == dir > 0) {
        depth++;
      } else if (depth == 1) {
        return {
          start: startToken,
          end: {
            from: basePos + pos,
            to: basePos + pos + 1
          },
          matched: found >> 1 == bracket >> 1
        };
      } else {
        depth--;
      }
    }
    if (dir > 0) distance += text.length;
  }
  return iter.done ? {
    start: startToken,
    matched: false
  } : null;
}
exports.bracketMatching = bracketMatching;
exports.matchBrackets = matchBrackets;

},

// node_modules/@codemirror/closebrackets/dist/index.js @32
32: function(__fusereq, exports, module){
exports.__esModule = true;
var view_1 = __fusereq(14);
var state_1 = __fusereq(15);
var rangeset_1 = __fusereq(39);
var text_1 = __fusereq(22);
var language_1 = __fusereq(21);
const defaults = {
  brackets: ["(", "[", "{", "'", '"'],
  before: ")]}'\":;>"
};
const closeBracketEffect = state_1.StateEffect.define({
  map(value, mapping) {
    let mapped = mapping.mapPos(value, -1, state_1.MapMode.TrackAfter);
    return mapped == null ? undefined : mapped;
  }
});
const skipBracketEffect = state_1.StateEffect.define({
  map(value, mapping) {
    return mapping.mapPos(value);
  }
});
const closedBracket = new (class extends rangeset_1.RangeValue {})();
closedBracket.startSide = 1;
closedBracket.endSide = -1;
const bracketState = state_1.StateField.define({
  create() {
    return rangeset_1.RangeSet.empty;
  },
  update(value, tr) {
    if (tr.selection) {
      let lineStart = tr.state.doc.lineAt(tr.selection.main.head).from;
      let prevLineStart = tr.startState.doc.lineAt(tr.startState.selection.main.head).from;
      if (lineStart != tr.changes.mapPos(prevLineStart, -1)) value = rangeset_1.RangeSet.empty;
    }
    value = value.map(tr.changes);
    for (let effect of tr.effects) {
      if (effect.is(closeBracketEffect)) value = value.update({
        add: [closedBracket.range(effect.value, effect.value + 1)]
      }); else if (effect.is(skipBracketEffect)) value = value.update({
        filter: from => from != effect.value
      });
    }
    return value;
  }
});
function closeBrackets() {
  return [view_1.EditorView.inputHandler.of(handleInput), bracketState];
}
const definedClosing = "()[]{}<>";
function closing(ch) {
  for (let i = 0; i < definedClosing.length; i += 2) if (definedClosing.charCodeAt(i) == ch) return definedClosing.charAt(i + 1);
  return text_1.fromCodePoint(ch < 128 ? ch : ch + 1);
}
function config(state, pos) {
  return state.languageDataAt("closeBrackets", pos)[0] || defaults;
}
function handleInput(view, from, to, insert) {
  if (view.composing) return false;
  let sel = view.state.selection.main;
  if (insert.length > 2 || insert.length == 2 && text_1.codePointSize(text_1.codePointAt(insert, 0)) == 1 || from != sel.from || to != sel.to) return false;
  let tr = insertBracket(view.state, insert);
  if (!tr) return false;
  view.dispatch(tr);
  return true;
}
const deleteBracketPair = ({state, dispatch}) => {
  let conf = config(state, state.selection.main.head);
  let tokens = conf.brackets || defaults.brackets;
  let dont = null, changes = state.changeByRange(range => {
    if (range.empty) {
      let before = prevChar(state.doc, range.head);
      for (let token of tokens) {
        if (token == before && nextChar(state.doc, range.head) == closing(text_1.codePointAt(token, 0))) return {
          changes: {
            from: range.head - token.length,
            to: range.head + token.length
          },
          range: state_1.EditorSelection.cursor(range.head - token.length),
          annotations: state_1.Transaction.userEvent.of("delete")
        };
      }
    }
    return {
      range: dont = range
    };
  });
  if (!dont) dispatch(state.update(changes, {
    scrollIntoView: true
  }));
  return !dont;
};
const closeBracketsKeymap = [{
  key: "Backspace",
  run: deleteBracketPair
}];
function insertBracket(state, bracket) {
  let conf = config(state, state.selection.main.head);
  let tokens = conf.brackets || defaults.brackets;
  for (let tok of tokens) {
    let closed = closing(text_1.codePointAt(tok, 0));
    if (bracket == tok) return closed == tok ? handleSame(state, tok, tokens.indexOf(tok + tok + tok) > -1) : handleOpen(state, tok, closed, conf.before || defaults.before);
    if (bracket == closed && closedBracketAt(state, state.selection.main.from)) return handleClose(state, tok, closed);
  }
  return null;
}
function closedBracketAt(state, pos) {
  let found = false;
  state.field(bracketState).between(0, state.doc.length, from => {
    if (from == pos) found = true;
  });
  return found;
}
function nextChar(doc, pos) {
  let next = doc.sliceString(pos, pos + 2);
  return next.slice(0, text_1.codePointSize(text_1.codePointAt(next, 0)));
}
function prevChar(doc, pos) {
  let prev = doc.sliceString(pos - 2, pos);
  return text_1.codePointSize(text_1.codePointAt(prev, 0)) == prev.length ? prev : prev.slice(1);
}
function handleOpen(state, open, close, closeBefore) {
  let dont = null, changes = state.changeByRange(range => {
    if (!range.empty) return {
      changes: [{
        insert: open,
        from: range.from
      }, {
        insert: close,
        from: range.to
      }],
      effects: closeBracketEffect.of(range.to + open.length),
      range: state_1.EditorSelection.range(range.anchor + open.length, range.head + open.length)
    };
    let next = nextChar(state.doc, range.head);
    if (!next || (/\s/).test(next) || closeBefore.indexOf(next) > -1) return {
      changes: {
        insert: open + close,
        from: range.head
      },
      effects: closeBracketEffect.of(range.head + open.length),
      range: state_1.EditorSelection.cursor(range.head + open.length)
    };
    return {
      range: dont = range
    };
  });
  return dont ? null : state.update(changes, {
    scrollIntoView: true,
    annotations: state_1.Transaction.userEvent.of("input")
  });
}
function handleClose(state, _open, close) {
  let dont = null, moved = state.selection.ranges.map(range => {
    if (range.empty && nextChar(state.doc, range.head) == close) return state_1.EditorSelection.cursor(range.head + close.length);
    return dont = range;
  });
  return dont ? null : state.update({
    selection: state_1.EditorSelection.create(moved, state.selection.mainIndex),
    scrollIntoView: true,
    effects: state.selection.ranges.map(({from}) => skipBracketEffect.of(from))
  });
}
function handleSame(state, token, allowTriple) {
  let dont = null, changes = state.changeByRange(range => {
    if (!range.empty) return {
      changes: [{
        insert: token,
        from: range.from
      }, {
        insert: token,
        from: range.to
      }],
      effects: closeBracketEffect.of(range.to + token.length),
      range: state_1.EditorSelection.range(range.anchor + token.length, range.head + token.length)
    };
    let pos = range.head, next = nextChar(state.doc, pos);
    if (next == token) {
      if (nodeStart(state, pos)) {
        return {
          changes: {
            insert: token + token,
            from: pos
          },
          effects: closeBracketEffect.of(pos + token.length),
          range: state_1.EditorSelection.cursor(pos + token.length)
        };
      } else if (closedBracketAt(state, pos)) {
        let isTriple = allowTriple && state.sliceDoc(pos, pos + token.length * 3) == token + token + token;
        return {
          range: state_1.EditorSelection.cursor(pos + token.length * (isTriple ? 3 : 1)),
          effects: skipBracketEffect.of(pos)
        };
      }
    } else if (allowTriple && state.sliceDoc(pos - 2 * token.length, pos) == token + token && nodeStart(state, pos - 2 * token.length)) {
      return {
        changes: {
          insert: token + token + token + token,
          from: pos
        },
        effects: closeBracketEffect.of(pos + token.length),
        range: state_1.EditorSelection.cursor(pos + token.length)
      };
    } else if (state.charCategorizer(pos)(next) != state_1.CharCategory.Word) {
      let prev = state.sliceDoc(pos - 1, pos);
      if (prev != token && state.charCategorizer(pos)(prev) != state_1.CharCategory.Word) return {
        changes: {
          insert: token + token,
          from: pos
        },
        effects: closeBracketEffect.of(pos + token.length),
        range: state_1.EditorSelection.cursor(pos + token.length)
      };
    }
    return {
      range: dont = range
    };
  });
  return dont ? null : state.update(changes, {
    scrollIntoView: true,
    annotations: state_1.Transaction.userEvent.of("input")
  });
}
function nodeStart(state, pos) {
  let tree = language_1.syntaxTree(state).resolve(pos + 1);
  return tree.parent && tree.from == pos;
}
exports.closeBrackets = closeBrackets;
exports.closeBracketsKeymap = closeBracketsKeymap;
exports.deleteBracketPair = deleteBracketPair;
exports.insertBracket = insertBracket;

},

// node_modules/@codemirror/autocomplete/dist/index.js @34
34: function(__fusereq, exports, module){
exports.__esModule = true;
var state_1 = __fusereq(15);
var view_1 = __fusereq(14);
var tooltip_1 = __fusereq(16);
var language_1 = __fusereq(21);
var text_1 = __fusereq(22);
class CompletionContext {
  constructor(state, pos, explicit) {
    this.state = state;
    this.pos = pos;
    this.explicit = explicit;
    this.abortListeners = [];
  }
  tokenBefore(types) {
    let token = language_1.syntaxTree(this.state).resolve(this.pos, -1);
    while (token && types.indexOf(token.name) < 0) token = token.parent;
    return token ? {
      from: token.from,
      to: this.pos,
      text: this.state.sliceDoc(token.from, this.pos),
      type: token.type
    } : null;
  }
  matchBefore(expr) {
    let line = this.state.doc.lineAt(this.pos);
    let start = Math.max(line.from, this.pos - 250);
    let str = line.text.slice(start - line.from, this.pos - line.from);
    let found = str.search(ensureAnchor(expr, false));
    return found < 0 ? null : {
      from: start + found,
      to: this.pos,
      text: str.slice(found)
    };
  }
  get aborted() {
    return this.abortListeners == null;
  }
  addEventListener(type, listener) {
    if (type == "abort" && this.abortListeners) this.abortListeners.push(listener);
  }
}
function toSet(chars) {
  let flat = Object.keys(chars).join("");
  let words = (/\w/).test(flat);
  if (words) flat = flat.replace(/\w/g, "");
  return `[${words ? "\\w" : ""}${flat.replace(/[^\w\s]/g, "\\$&")}]`;
}
function prefixMatch(options) {
  let first = Object.create(null), rest = Object.create(null);
  for (let {label} of options) {
    first[label[0]] = true;
    for (let i = 1; i < label.length; i++) rest[label[i]] = true;
  }
  let source = toSet(first) + toSet(rest) + "*$";
  return [new RegExp("^" + source), new RegExp(source)];
}
function completeFromList(list) {
  let options = list.map(o => typeof o == "string" ? {
    label: o
  } : o);
  let [span, match] = options.every(o => (/^\w+$/).test(o.label)) ? [/\w*$/, /\w+$/] : prefixMatch(options);
  return context => {
    let token = context.matchBefore(match);
    return token || context.explicit ? {
      from: token ? token.from : context.pos,
      options,
      span
    } : null;
  };
}
function ifNotIn(nodes, source) {
  return context => {
    for (let pos = language_1.syntaxTree(context.state).resolve(context.pos, -1); pos; pos = pos.parent) if (nodes.indexOf(pos.name) > -1) return null;
    return source(context);
  };
}
class Option {
  constructor(completion, source, match) {
    this.completion = completion;
    this.source = source;
    this.match = match;
  }
}
function cur(state) {
  return state.selection.main.head;
}
function ensureAnchor(expr, start) {
  var _a;
  let {source} = expr;
  let addStart = start && source[0] != "^", addEnd = source[source.length - 1] != "$";
  if (!addStart && !addEnd) return expr;
  return new RegExp(`${addStart ? "^" : ""}(?:${source})${addEnd ? "$" : ""}`, (_a = expr.flags) !== null && _a !== void 0 ? _a : expr.ignoreCase ? "i" : "");
}
function applyCompletion(view, option) {
  let apply = option.completion.apply || option.completion.label;
  let result = option.source;
  if (typeof apply == "string") {
    view.dispatch({
      changes: {
        from: result.from,
        to: result.to,
        insert: apply
      },
      selection: {
        anchor: result.from + apply.length
      }
    });
  } else {
    apply(view, option.completion, result.from, result.to);
  }
}
const SourceCache = new WeakMap();
function asSource(source) {
  if (!Array.isArray(source)) return source;
  let known = SourceCache.get(source);
  if (!known) SourceCache.set(source, known = completeFromList(source));
  return known;
}
class FuzzyMatcher {
  constructor(pattern) {
    this.pattern = pattern;
    this.chars = [];
    this.folded = [];
    this.any = [];
    this.precise = [];
    this.byWord = [];
    for (let p = 0; p < pattern.length; ) {
      let char = text_1.codePointAt(pattern, p), size = text_1.codePointSize(char);
      this.chars.push(char);
      let part = pattern.slice(p, p + size), upper = part.toUpperCase();
      this.folded.push(text_1.codePointAt(upper == part ? part.toLowerCase() : upper, 0));
      p += size;
    }
    this.astral = pattern.length != this.chars.length;
  }
  match(word) {
    if (this.pattern.length == 0) return [0];
    if (word.length < this.pattern.length) return null;
    let {chars, folded, any, precise, byWord} = this;
    if (chars.length == 1) {
      let first = text_1.codePointAt(word, 0);
      return first == chars[0] ? [0, 0, text_1.codePointSize(first)] : first == folded[0] ? [-200, 0, text_1.codePointSize(first)] : null;
    }
    let direct = word.indexOf(this.pattern);
    if (direct == 0) return [0, 0, this.pattern.length];
    let len = chars.length, anyTo = 0;
    if (direct < 0) {
      for (let i = 0, e = Math.min(word.length, 200); i < e && anyTo < len; ) {
        let next = text_1.codePointAt(word, i);
        if (next == chars[anyTo] || next == folded[anyTo]) any[anyTo++] = i;
        i += text_1.codePointSize(next);
      }
      if (anyTo < len) return null;
    }
    let preciseTo = 0;
    let byWordTo = 0, byWordFolded = false;
    let adjacentTo = 0, adjacentStart = -1, adjacentEnd = -1;
    let hasLower = (/[a-z]/).test(word);
    for (let i = 0, e = Math.min(word.length, 200), prevType = 0; i < e && byWordTo < len; ) {
      let next = text_1.codePointAt(word, i);
      if (direct < 0) {
        if (preciseTo < len && next == chars[preciseTo]) precise[preciseTo++] = i;
        if (adjacentTo < len) {
          if (next == chars[adjacentTo] || next == folded[adjacentTo]) {
            if (adjacentTo == 0) adjacentStart = i;
            adjacentEnd = i;
            adjacentTo++;
          } else {
            adjacentTo = 0;
          }
        }
      }
      let ch, type = next < 0xff ? next >= 48 && next <= 57 || next >= 97 && next <= 122 ? 2 : next >= 65 && next <= 90 ? 1 : 0 : (ch = text_1.fromCodePoint(next)) != ch.toLowerCase() ? 1 : ch != ch.toUpperCase() ? 2 : 0;
      if ((type == 1 && hasLower || prevType == 0 && type != 0) && (chars[byWordTo] == next || folded[byWordTo] == next && (byWordFolded = true))) byWord[byWordTo++] = i;
      prevType = type;
      i += text_1.codePointSize(next);
    }
    if (byWordTo == len && byWord[0] == 0) return this.result(-100 + (byWordFolded ? -200 : 0), byWord, word);
    if (adjacentTo == len && adjacentStart == 0) return [-200, 0, adjacentEnd];
    if (direct > -1) return [-700, direct, direct + this.pattern.length];
    if (adjacentTo == len) return [-200 + -700, adjacentStart, adjacentEnd];
    if (byWordTo == len) return this.result(-100 + (byWordFolded ? -200 : 0) + -700, byWord, word);
    return chars.length == 2 ? null : this.result((any[0] ? -700 : 0) + -200 + -1100, any, word);
  }
  result(score, positions, word) {
    let result = [score], i = 1;
    for (let pos of positions) {
      let to = pos + (this.astral ? text_1.codePointSize(text_1.codePointAt(word, pos)) : 1);
      if (i > 1 && result[i - 1] == pos) result[i - 1] = to; else {
        result[i++] = pos;
        result[i++] = to;
      }
    }
    return result;
  }
}
const completionConfig = state_1.Facet.define({
  combine(configs) {
    return state_1.combineConfig(configs, {
      activateOnTyping: true,
      override: null,
      maxRenderedOptions: 100,
      defaultKeymap: true
    }, {
      defaultKeymap: (a, b) => a && b
    });
  }
});
const MaxInfoWidth = 300;
const baseTheme = view_1.EditorView.baseTheme({
  ".cm-tooltip.cm-tooltip-autocomplete": {
    "& > ul": {
      fontFamily: "monospace",
      whiteSpace: "nowrap",
      overflow: "auto",
      maxWidth_fallback: "700px",
      maxWidth: "min(700px, 95vw)",
      maxHeight: "10em",
      listStyle: "none",
      margin: 0,
      padding: 0,
      "& > li": {
        cursor: "pointer",
        padding: "1px 1em 1px 3px",
        lineHeight: 1.2
      },
      "& > li[aria-selected]": {
        background_fallback: "#bdf",
        backgroundColor: "Highlight",
        color_fallback: "white",
        color: "HighlightText"
      }
    }
  },
  ".cm-completionListIncompleteTop:before, .cm-completionListIncompleteBottom:after": {
    content: '"···"',
    opacity: 0.5,
    display: "block",
    textAlign: "center"
  },
  ".cm-tooltip.cm-completionInfo": {
    position: "absolute",
    padding: "3px 9px",
    width: "max-content",
    maxWidth: MaxInfoWidth + "px"
  },
  ".cm-completionInfo.cm-completionInfo-left": {
    right: "100%"
  },
  ".cm-completionInfo.cm-completionInfo-right": {
    left: "100%"
  },
  "&light .cm-snippetField": {
    backgroundColor: "#00000022"
  },
  "&dark .cm-snippetField": {
    backgroundColor: "#ffffff22"
  },
  ".cm-snippetFieldPosition": {
    verticalAlign: "text-top",
    width: 0,
    height: "1.15em",
    margin: "0 -0.7px -.7em",
    borderLeft: "1.4px dotted #888"
  },
  ".cm-completionMatchedText": {
    textDecoration: "underline"
  },
  ".cm-completionDetail": {
    marginLeft: "0.5em",
    fontStyle: "italic"
  },
  ".cm-completionIcon": {
    fontSize: "90%",
    width: ".8em",
    display: "inline-block",
    textAlign: "center",
    paddingRight: ".6em",
    opacity: "0.6"
  },
  ".cm-completionIcon-function, .cm-completionIcon-method": {
    "&:after": {
      content: "'ƒ'"
    }
  },
  ".cm-completionIcon-class": {
    "&:after": {
      content: "'○'"
    }
  },
  ".cm-completionIcon-interface": {
    "&:after": {
      content: "'◌'"
    }
  },
  ".cm-completionIcon-variable": {
    "&:after": {
      content: "'𝑥'"
    }
  },
  ".cm-completionIcon-constant": {
    "&:after": {
      content: "'𝐶'"
    }
  },
  ".cm-completionIcon-type": {
    "&:after": {
      content: "'𝑡'"
    }
  },
  ".cm-completionIcon-enum": {
    "&:after": {
      content: "'∪'"
    }
  },
  ".cm-completionIcon-property": {
    "&:after": {
      content: "'□'"
    }
  },
  ".cm-completionIcon-keyword": {
    "&:after": {
      content: "'🔑\uFE0E'"
    }
  },
  ".cm-completionIcon-namespace": {
    "&:after": {
      content: "'▢'"
    }
  },
  ".cm-completionIcon-text": {
    "&:after": {
      content: "'abc'",
      fontSize: "50%",
      verticalAlign: "middle"
    }
  }
});
function createListBox(options, id, range) {
  const ul = document.createElement("ul");
  ul.id = id;
  ul.setAttribute("role", "listbox");
  ul.setAttribute("aria-expanded", "true");
  for (let i = range.from; i < range.to; i++) {
    let {completion, match} = options[i];
    const li = ul.appendChild(document.createElement("li"));
    li.id = id + "-" + i;
    let icon = li.appendChild(document.createElement("div"));
    icon.classList.add("cm-completionIcon");
    if (completion.type) icon.classList.add("cm-completionIcon-" + completion.type);
    icon.setAttribute("aria-hidden", "true");
    let labelElt = li.appendChild(document.createElement("span"));
    labelElt.className = "cm-completionLabel";
    let {label, detail} = completion, off = 0;
    for (let j = 1; j < match.length; ) {
      let from = match[j++], to = match[j++];
      if (from > off) labelElt.appendChild(document.createTextNode(label.slice(off, from)));
      let span = labelElt.appendChild(document.createElement("span"));
      span.appendChild(document.createTextNode(label.slice(from, to)));
      span.className = "cm-completionMatchedText";
      off = to;
    }
    if (off < label.length) labelElt.appendChild(document.createTextNode(label.slice(off)));
    if (detail) {
      let detailElt = li.appendChild(document.createElement("span"));
      detailElt.className = "cm-completionDetail";
      detailElt.textContent = detail;
    }
    li.setAttribute("role", "option");
  }
  if (range.from) ul.classList.add("cm-completionListIncompleteTop");
  if (range.to < options.length) ul.classList.add("cm-completionListIncompleteBottom");
  return ul;
}
function createInfoDialog(option, view) {
  let dom = document.createElement("div");
  dom.className = "cm-tooltip cm-completionInfo";
  let {info} = option.completion;
  if (typeof info == "string") {
    dom.textContent = info;
  } else {
    let content = info(option.completion);
    if (content.then) content.then(node => dom.appendChild(node), e => view_1.logException(view.state, e, "completion info")); else dom.appendChild(content);
  }
  return dom;
}
function rangeAroundSelected(total, selected, max) {
  if (total <= max) return {
    from: 0,
    to: total
  };
  if (selected <= total >> 1) {
    let off = Math.floor(selected / max);
    return {
      from: off * max,
      to: (off + 1) * max
    };
  }
  let off = Math.floor((total - selected) / max);
  return {
    from: total - (off + 1) * max,
    to: total - off * max
  };
}
class CompletionTooltip {
  constructor(view, stateField) {
    this.view = view;
    this.stateField = stateField;
    this.info = null;
    this.placeInfo = {
      read: () => this.measureInfo(),
      write: pos => this.positionInfo(pos),
      key: this
    };
    let cState = view.state.field(stateField);
    let {options, selected} = cState.open;
    let config = view.state.facet(completionConfig);
    this.range = rangeAroundSelected(options.length, selected, config.maxRenderedOptions);
    this.dom = document.createElement("div");
    this.dom.className = "cm-tooltip-autocomplete";
    this.dom.addEventListener("mousedown", e => {
      for (let dom = e.target, match; dom && dom != this.dom; dom = dom.parentNode) {
        if (dom.nodeName == "LI" && (match = (/-(\d+)$/).exec(dom.id)) && +match[1] < options.length) {
          applyCompletion(view, options[+match[1]]);
          e.preventDefault();
          return;
        }
      }
    });
    this.list = this.dom.appendChild(createListBox(options, cState.id, this.range));
    this.list.addEventListener("scroll", () => {
      if (this.info) this.view.requestMeasure(this.placeInfo);
    });
  }
  mount() {
    this.updateSel();
  }
  update(update) {
    if (update.state.field(this.stateField) != update.startState.field(this.stateField)) this.updateSel();
  }
  positioned() {
    if (this.info) this.view.requestMeasure(this.placeInfo);
  }
  updateSel() {
    let cState = this.view.state.field(this.stateField), open = cState.open;
    if (open.selected < this.range.from || open.selected >= this.range.to) {
      this.range = rangeAroundSelected(open.options.length, open.selected, this.view.state.facet(completionConfig).maxRenderedOptions);
      this.list.remove();
      this.list = this.dom.appendChild(createListBox(open.options, cState.id, this.range));
      this.list.addEventListener("scroll", () => {
        if (this.info) this.view.requestMeasure(this.placeInfo);
      });
    }
    if (this.updateSelectedOption(open.selected)) {
      if (this.info) {
        this.info.remove();
        this.info = null;
      }
      let option = open.options[open.selected];
      if (option.completion.info) {
        this.info = this.dom.appendChild(createInfoDialog(option, this.view));
        this.view.requestMeasure(this.placeInfo);
      }
    }
  }
  updateSelectedOption(selected) {
    let set = null;
    for (let opt = this.list.firstChild, i = this.range.from; opt; (opt = opt.nextSibling, i++)) {
      if (i == selected) {
        if (!opt.hasAttribute("aria-selected")) {
          opt.setAttribute("aria-selected", "true");
          set = opt;
        }
      } else {
        if (opt.hasAttribute("aria-selected")) opt.removeAttribute("aria-selected");
      }
    }
    if (set) scrollIntoView(this.list, set);
    return set;
  }
  measureInfo() {
    let sel = this.dom.querySelector("[aria-selected]");
    if (!sel) return null;
    let rect = this.dom.getBoundingClientRect();
    let top = sel.getBoundingClientRect().top - rect.top;
    if (top < 0 || top > this.list.clientHeight - 10) return null;
    let left = this.view.textDirection == view_1.Direction.RTL;
    let spaceLeft = rect.left, spaceRight = innerWidth - rect.right;
    if (left && spaceLeft < Math.min(MaxInfoWidth, spaceRight)) left = false; else if (!left && spaceRight < Math.min(MaxInfoWidth, spaceLeft)) left = true;
    return {
      top,
      left
    };
  }
  positionInfo(pos) {
    if (this.info && pos) {
      this.info.style.top = pos.top + "px";
      this.info.classList.toggle("cm-completionInfo-left", pos.left);
      this.info.classList.toggle("cm-completionInfo-right", !pos.left);
    }
  }
}
function completionTooltip(stateField) {
  return view => new CompletionTooltip(view, stateField);
}
function scrollIntoView(container, element) {
  let parent = container.getBoundingClientRect();
  let self = element.getBoundingClientRect();
  if (self.top < parent.top) container.scrollTop -= parent.top - self.top; else if (self.bottom > parent.bottom) container.scrollTop += self.bottom - parent.bottom;
}
const MaxOptions = 300;
function score(option) {
  return (option.boost || 0) * 100 + (option.apply ? 10 : 0) + (option.info ? 5 : 0) + (option.type ? 1 : 0);
}
function sortOptions(active, state) {
  let options = [];
  for (let a of active) if (a.hasResult()) {
    let matcher = new FuzzyMatcher(state.sliceDoc(a.from, a.to)), match;
    for (let option of a.result.options) if (match = matcher.match(option.label)) {
      if (option.boost != null) match[0] += option.boost;
      options.push(new Option(option, a, match));
    }
  }
  options.sort(cmpOption);
  let result = [], prev = null;
  for (let opt of options.sort(cmpOption)) {
    if (result.length == MaxOptions) break;
    if (!prev || prev.label != opt.completion.label || prev.detail != opt.completion.detail) result.push(opt); else if (score(opt.completion) > score(prev)) result[result.length - 1] = opt;
    prev = opt.completion;
  }
  return result;
}
class CompletionDialog {
  constructor(options, attrs, tooltip, timestamp, selected) {
    this.options = options;
    this.attrs = attrs;
    this.tooltip = tooltip;
    this.timestamp = timestamp;
    this.selected = selected;
  }
  setSelected(selected, id) {
    return selected == this.selected || selected >= this.options.length ? this : new CompletionDialog(this.options, makeAttrs(id, selected), this.tooltip, this.timestamp, selected);
  }
  static build(active, state, id, prev) {
    let options = sortOptions(active, state);
    if (!options.length) return null;
    let selected = 0;
    if (prev && prev.selected) {
      let selectedValue = prev.options[prev.selected].completion;
      for (let i = 0; i < options.length && !selected; i++) {
        if (options[i].completion == selectedValue) selected = i;
      }
    }
    return new CompletionDialog(options, makeAttrs(id, selected), {
      pos: active.reduce((a, b) => b.hasResult() ? Math.min(a, b.from) : a, 1e8),
      create: completionTooltip(completionState)
    }, prev ? prev.timestamp : Date.now(), selected);
  }
  map(changes) {
    return new CompletionDialog(this.options, this.attrs, Object.assign(Object.assign({}, this.tooltip), {
      pos: changes.mapPos(this.tooltip.pos)
    }), this.timestamp, this.selected);
  }
}
class CompletionState {
  constructor(active, id, open) {
    this.active = active;
    this.id = id;
    this.open = open;
  }
  static start() {
    return new CompletionState(none, "cm-ac-" + Math.floor(Math.random() * 2e6).toString(36), null);
  }
  update(tr) {
    let {state} = tr, conf = state.facet(completionConfig);
    let sources = conf.override || state.languageDataAt("autocomplete", cur(state)).map(asSource);
    let active = sources.map(source => {
      let value = this.active.find(s => s.source == source) || new ActiveSource(source, 0, false);
      return value.update(tr, conf);
    });
    if (active.length == this.active.length && active.every((a, i) => a == this.active[i])) active = this.active;
    let open = tr.selection || active.some(a => a.hasResult() && tr.changes.touchesRange(a.from, a.to)) || !sameResults(active, this.active) ? CompletionDialog.build(active, state, this.id, this.open) : this.open && tr.docChanged ? this.open.map(tr.changes) : this.open;
    if (!open && active.every(a => a.state != 1) && active.some(a => a.hasResult())) active = active.map(a => a.hasResult() ? new ActiveSource(a.source, 0, false) : a);
    for (let effect of tr.effects) if (effect.is(setSelectedEffect)) open = open && open.setSelected(effect.value, this.id);
    return active == this.active && open == this.open ? this : new CompletionState(active, this.id, open);
  }
  get tooltip() {
    return this.open ? this.open.tooltip : null;
  }
  get attrs() {
    return this.open ? this.open.attrs : baseAttrs;
  }
}
function sameResults(a, b) {
  if (a == b) return true;
  for (let iA = 0, iB = 0; ; ) {
    while (iA < a.length && !a[iA].hasResult) iA++;
    while (iB < b.length && !b[iB].hasResult) iB++;
    let endA = iA == a.length, endB = iB == b.length;
    if (endA || endB) return endA == endB;
    if (a[iA++].result != b[iB++].result) return false;
  }
}
function makeAttrs(id, selected) {
  return {
    "aria-autocomplete": "list",
    "aria-activedescendant": id + "-" + selected,
    "aria-owns": id
  };
}
const baseAttrs = {
  "aria-autocomplete": "list"
}, none = [];
function cmpOption(a, b) {
  let dScore = b.match[0] - a.match[0];
  if (dScore) return dScore;
  let lA = a.completion.label, lB = b.completion.label;
  return lA < lB ? -1 : lA == lB ? 0 : 1;
}
class ActiveSource {
  constructor(source, state, explicit) {
    this.source = source;
    this.state = state;
    this.explicit = explicit;
  }
  hasResult() {
    return false;
  }
  update(tr, conf) {
    let event = tr.annotation(state_1.Transaction.userEvent), value = this;
    if (event == "input" || event == "delete") value = value.handleUserEvent(tr, event, conf); else if (tr.docChanged) value = value.handleChange(tr); else if (tr.selection && value.state != 0) value = new ActiveSource(value.source, 0, false);
    for (let effect of tr.effects) {
      if (effect.is(startCompletionEffect)) value = new ActiveSource(value.source, 1, effect.value); else if (effect.is(closeCompletionEffect)) value = new ActiveSource(value.source, 0, false); else if (effect.is(setActiveEffect)) for (let active of effect.value) if (active.source == value.source) value = active;
    }
    return value;
  }
  handleUserEvent(_tr, type, conf) {
    return type == "delete" || !conf.activateOnTyping ? this : new ActiveSource(this.source, 1, false);
  }
  handleChange(tr) {
    return tr.changes.touchesRange(cur(tr.startState)) ? new ActiveSource(this.source, 0, false) : this;
  }
}
class ActiveResult extends ActiveSource {
  constructor(source, explicit, result, from, to, span) {
    super(source, 2, explicit);
    this.result = result;
    this.from = from;
    this.to = to;
    this.span = span;
  }
  hasResult() {
    return true;
  }
  handleUserEvent(tr, type, conf) {
    let from = tr.changes.mapPos(this.from), to = tr.changes.mapPos(this.to, 1);
    let pos = cur(tr.state);
    if ((this.explicit ? pos < from : pos <= from) || pos > to) return new ActiveSource(this.source, type == "input" && conf.activateOnTyping ? 1 : 0, false);
    if (this.span && (from == to || this.span.test(tr.state.sliceDoc(from, to)))) return new ActiveResult(this.source, this.explicit, this.result, from, to, this.span);
    return new ActiveSource(this.source, 1, this.explicit);
  }
  handleChange(tr) {
    return tr.changes.touchesRange(this.from, this.to) ? new ActiveSource(this.source, 0, false) : new ActiveResult(this.source, this.explicit, this.result, tr.changes.mapPos(this.from), tr.changes.mapPos(this.to, 1), this.span);
  }
  map(mapping) {
    return new ActiveResult(this.source, this.explicit, this.result, mapping.mapPos(this.from), mapping.mapPos(this.to, 1), this.span);
  }
}
const startCompletionEffect = state_1.StateEffect.define();
const closeCompletionEffect = state_1.StateEffect.define();
const setActiveEffect = state_1.StateEffect.define({
  map(sources, mapping) {
    return sources.map(s => s.hasResult() && !mapping.empty ? s.map(mapping) : s);
  }
});
const setSelectedEffect = state_1.StateEffect.define();
const completionState = state_1.StateField.define({
  create() {
    return CompletionState.start();
  },
  update(value, tr) {
    return value.update(tr);
  },
  provide: f => [tooltip_1.showTooltip.from(f, val => val.tooltip), view_1.EditorView.contentAttributes.from(f, state => state.attrs)]
});
const CompletionInteractMargin = 75;
function moveCompletionSelection(forward, by = "option") {
  return view => {
    let cState = view.state.field(completionState, false);
    if (!cState || !cState.open || Date.now() - cState.open.timestamp < CompletionInteractMargin) return false;
    let step = 1, tooltip;
    if (by == "page" && (tooltip = view.dom.querySelector(".cm-tooltip-autocomplete"))) step = Math.max(2, Math.floor(tooltip.offsetHeight / tooltip.firstChild.offsetHeight));
    let selected = cState.open.selected + step * (forward ? 1 : -1), {length} = cState.open.options;
    if (selected < 0) selected = by == "page" ? 0 : length - 1; else if (selected >= length) selected = by == "page" ? length - 1 : 0;
    view.dispatch({
      effects: setSelectedEffect.of(selected)
    });
    return true;
  };
}
const acceptCompletion = view => {
  let cState = view.state.field(completionState, false);
  if (!cState || !cState.open || Date.now() - cState.open.timestamp < CompletionInteractMargin) return false;
  applyCompletion(view, cState.open.options[cState.open.selected]);
  return true;
};
const startCompletion = view => {
  let cState = view.state.field(completionState, false);
  if (!cState) return false;
  view.dispatch({
    effects: startCompletionEffect.of(true)
  });
  return true;
};
const closeCompletion = view => {
  let cState = view.state.field(completionState, false);
  if (!cState || !cState.active.some(a => a.state != 0)) return false;
  view.dispatch({
    effects: closeCompletionEffect.of(null)
  });
  return true;
};
class RunningQuery {
  constructor(source, context) {
    this.source = source;
    this.context = context;
    this.time = Date.now();
    this.updates = [];
    this.done = undefined;
  }
}
const DebounceTime = 50, MaxUpdateCount = 50, MinAbortTime = 1000;
const completionPlugin = view_1.ViewPlugin.fromClass(class {
  constructor(view) {
    this.view = view;
    this.debounceUpdate = -1;
    this.running = [];
    this.debounceAccept = -1;
    this.composing = 0;
    for (let active of view.state.field(completionState).active) if (active.state == 1) this.startQuery(active);
  }
  update(update) {
    let cState = update.state.field(completionState);
    if (!update.selectionSet && !update.docChanged && update.startState.field(completionState) == cState) return;
    let doesReset = update.transactions.some(tr => {
      let event = tr.annotation(state_1.Transaction.userEvent);
      return (tr.selection || tr.docChanged) && event != "input" && event != "delete";
    });
    for (let i = 0; i < this.running.length; i++) {
      let query = this.running[i];
      if (doesReset || query.updates.length + update.transactions.length > MaxUpdateCount && query.time - Date.now() > MinAbortTime) {
        for (let handler of query.context.abortListeners) {
          try {
            handler();
          } catch (e) {
            view_1.logException(this.view.state, e);
          }
        }
        query.context.abortListeners = null;
        this.running.splice(i--, 1);
      } else {
        query.updates.push(...update.transactions);
      }
    }
    if (this.debounceUpdate > -1) clearTimeout(this.debounceUpdate);
    this.debounceUpdate = cState.active.some(a => a.state == 1 && !this.running.some(q => q.source == a.source)) ? setTimeout(() => this.startUpdate(), DebounceTime) : -1;
    if (this.composing != 0) for (let tr of update.transactions) {
      if (tr.annotation(state_1.Transaction.userEvent) == "input") this.composing = 2; else if (this.composing == 2 && tr.selection) this.composing = 3;
    }
  }
  startUpdate() {
    this.debounceUpdate = -1;
    let {state} = this.view, cState = state.field(completionState);
    for (let active of cState.active) {
      if (active.state == 1 && !this.running.some(r => r.source == active.source)) this.startQuery(active);
    }
  }
  startQuery(active) {
    let {state} = this.view, pos = cur(state);
    let context = new CompletionContext(state, pos, active.explicit);
    let pending = new RunningQuery(active.source, context);
    this.running.push(pending);
    Promise.resolve(active.source(context)).then(result => {
      if (!pending.context.aborted) {
        pending.done = result || null;
        this.scheduleAccept();
      }
    }, err => {
      this.view.dispatch({
        effects: closeCompletionEffect.of(null)
      });
      view_1.logException(this.view.state, err);
    });
  }
  scheduleAccept() {
    if (this.running.every(q => q.done !== undefined)) this.accept(); else if (this.debounceAccept < 0) this.debounceAccept = setTimeout(() => this.accept(), DebounceTime);
  }
  accept() {
    var _a;
    if (this.debounceAccept > -1) clearTimeout(this.debounceAccept);
    this.debounceAccept = -1;
    let updated = [];
    let conf = this.view.state.facet(completionConfig);
    for (let i = 0; i < this.running.length; i++) {
      let query = this.running[i];
      if (query.done === undefined) continue;
      this.running.splice(i--, 1);
      if (query.done) {
        let active = new ActiveResult(query.source, query.context.explicit, query.done, query.done.from, (_a = query.done.to) !== null && _a !== void 0 ? _a : cur(query.updates.length ? query.updates[0].startState : this.view.state), query.done.span ? ensureAnchor(query.done.span, true) : null);
        for (let tr of query.updates) active = active.update(tr, conf);
        if (active.hasResult()) {
          updated.push(active);
          continue;
        }
      }
      let current = this.view.state.field(completionState).active.find(a => a.source == query.source);
      if (current && current.state == 1) {
        if (query.done == null) {
          let active = new ActiveSource(query.source, 0, false);
          for (let tr of query.updates) active = active.update(tr, conf);
          if (active.state != 1) updated.push(active);
        } else {
          this.startQuery(current);
        }
      }
    }
    if (updated.length) this.view.dispatch({
      effects: setActiveEffect.of(updated)
    });
  }
}, {
  eventHandlers: {
    compositionstart() {
      this.composing = 1;
    },
    compositionend() {
      if (this.composing == 3) this.view.dispatch({
        effects: startCompletionEffect.of(false)
      });
      this.composing = 0;
    }
  }
});
class FieldPos {
  constructor(field, line, from, to) {
    this.field = field;
    this.line = line;
    this.from = from;
    this.to = to;
  }
}
class FieldRange {
  constructor(field, from, to) {
    this.field = field;
    this.from = from;
    this.to = to;
  }
  map(changes) {
    return new FieldRange(this.field, changes.mapPos(this.from, -1), changes.mapPos(this.to, 1));
  }
}
class Snippet {
  constructor(lines, fieldPositions) {
    this.lines = lines;
    this.fieldPositions = fieldPositions;
  }
  instantiate(state, pos) {
    let text = [], lineStart = [pos];
    let lineObj = state.doc.lineAt(pos), baseIndent = (/^\s*/).exec(lineObj.text)[0];
    for (let line of this.lines) {
      if (text.length) {
        let indent = baseIndent, tabs = (/^\t*/).exec(line)[0].length;
        for (let i = 0; i < tabs; i++) indent += state.facet(language_1.indentUnit);
        lineStart.push(pos + indent.length - tabs);
        line = indent + line.slice(tabs);
      }
      text.push(line);
      pos += line.length + 1;
    }
    let ranges = this.fieldPositions.map(pos => new FieldRange(pos.field, lineStart[pos.line] + pos.from, lineStart[pos.line] + pos.to));
    return {
      text,
      ranges
    };
  }
  static parse(template) {
    let fields = [];
    let lines = [], positions = [], m;
    for (let line of template.split(/\r\n?|\n/)) {
      while (m = (/[#$]\{(?:(\d+)(?::([^}]*))?|([^}]*))\}/).exec(line)) {
        let seq = m[1] ? +m[1] : null, name = m[2] || m[3], found = -1;
        for (let i = 0; i < fields.length; i++) {
          if (name ? fields[i].name == name : seq != null && fields[i].seq == seq) found = i;
        }
        if (found < 0) {
          let i = 0;
          while (i < fields.length && (seq == null || fields[i].seq != null && fields[i].seq < seq)) i++;
          fields.splice(i, 0, {
            seq,
            name: name || null
          });
          found = i;
        }
        positions.push(new FieldPos(found, lines.length, m.index, m.index + name.length));
        line = line.slice(0, m.index) + name + line.slice(m.index + m[0].length);
      }
      lines.push(line);
    }
    return new Snippet(lines, positions);
  }
}
let fieldMarker = view_1.Decoration.widget({
  widget: new (class extends view_1.WidgetType {
    toDOM() {
      let span = document.createElement("span");
      span.className = "cm-snippetFieldPosition";
      return span;
    }
    ignoreEvent() {
      return false;
    }
  })()
});
let fieldRange = view_1.Decoration.mark({
  class: "cm-snippetField"
});
class ActiveSnippet {
  constructor(ranges, active) {
    this.ranges = ranges;
    this.active = active;
    this.deco = view_1.Decoration.set(ranges.map(r => (r.from == r.to ? fieldMarker : fieldRange).range(r.from, r.to)));
  }
  map(changes) {
    return new ActiveSnippet(this.ranges.map(r => r.map(changes)), this.active);
  }
  selectionInsideField(sel) {
    return sel.ranges.every(range => this.ranges.some(r => r.field == this.active && r.from <= range.from && r.to >= range.to));
  }
}
const setActive = state_1.StateEffect.define({
  map(value, changes) {
    return value && value.map(changes);
  }
});
const moveToField = state_1.StateEffect.define();
const snippetState = state_1.StateField.define({
  create() {
    return null;
  },
  update(value, tr) {
    for (let effect of tr.effects) {
      if (effect.is(setActive)) return effect.value;
      if (effect.is(moveToField) && value) return new ActiveSnippet(value.ranges, effect.value);
    }
    if (value && tr.docChanged) value = value.map(tr.changes);
    if (value && tr.selection && !value.selectionInsideField(tr.selection)) value = null;
    return value;
  },
  provide: f => view_1.EditorView.decorations.from(f, val => val ? val.deco : view_1.Decoration.none)
});
function fieldSelection(ranges, field) {
  return state_1.EditorSelection.create(ranges.filter(r => r.field == field).map(r => state_1.EditorSelection.range(r.from, r.to)));
}
function snippet(template) {
  let snippet = Snippet.parse(template);
  return (editor, _completion, from, to) => {
    let {text, ranges} = snippet.instantiate(editor.state, from);
    let spec = {
      changes: {
        from,
        to,
        insert: state_1.Text.of(text)
      }
    };
    if (ranges.length) spec.selection = fieldSelection(ranges, 0);
    if (ranges.length > 1) {
      let effects = spec.effects = [setActive.of(new ActiveSnippet(ranges, 0))];
      if (editor.state.field(snippetState, false) === undefined) effects.push(state_1.StateEffect.appendConfig.of([snippetState, addSnippetKeymap, snippetPointerHandler, baseTheme]));
    }
    editor.dispatch(editor.state.update(spec));
  };
}
function moveField(dir) {
  return ({state, dispatch}) => {
    let active = state.field(snippetState, false);
    if (!active || dir < 0 && active.active == 0) return false;
    let next = active.active + dir, last = dir > 0 && !active.ranges.some(r => r.field == next + dir);
    dispatch(state.update({
      selection: fieldSelection(active.ranges, next),
      effects: setActive.of(last ? null : new ActiveSnippet(active.ranges, next))
    }));
    return true;
  };
}
const clearSnippet = ({state, dispatch}) => {
  let active = state.field(snippetState, false);
  if (!active) return false;
  dispatch(state.update({
    effects: setActive.of(null)
  }));
  return true;
};
const nextSnippetField = moveField(1);
const prevSnippetField = moveField(-1);
const defaultSnippetKeymap = [{
  key: "Tab",
  run: nextSnippetField,
  shift: prevSnippetField
}, {
  key: "Escape",
  run: clearSnippet
}];
const snippetKeymap = state_1.Facet.define({
  combine(maps) {
    return maps.length ? maps[0] : defaultSnippetKeymap;
  }
});
const addSnippetKeymap = state_1.Prec.override(view_1.keymap.compute([snippetKeymap], state => state.facet(snippetKeymap)));
function snippetCompletion(template, completion) {
  return Object.assign(Object.assign({}, completion), {
    apply: snippet(template)
  });
}
const snippetPointerHandler = view_1.EditorView.domEventHandlers({
  mousedown(event, view) {
    let active = view.state.field(snippetState, false), pos;
    if (!active || (pos = view.posAtCoords({
      x: event.clientX,
      y: event.clientY
    })) == null) return false;
    let match = active.ranges.find(r => r.from <= pos && r.to >= pos);
    if (!match || match.field == active.active) return false;
    view.dispatch({
      selection: fieldSelection(active.ranges, match.field),
      effects: setActive.of(active.ranges.some(r => r.field > match.field) ? new ActiveSnippet(active.ranges, match.field) : null)
    });
    return true;
  }
});
const completeAnyWord = context => {
  let options = [], seen = Object.create(null);
  let cat = context.state.charCategorizer(context.pos);
  let start = Math.max(0, context.pos - 50000), end = Math.min(context.state.doc.length, start + 50000 * 2);
  let from = context.pos;
  for (let cur = context.state.doc.iterRange(start, end), pos = start; !cur.next().done; ) {
    let {value} = cur, start = -1;
    for (let i = 0; ; i++) {
      if (i < value.length && cat(value[i]) == state_1.CharCategory.Word) {
        if (start < 0) start = i;
      } else if (start > -1) {
        if (pos + start <= context.pos && pos + i >= context.pos) {
          from = pos + start;
        } else {
          let word = value.slice(start, i);
          if (!seen[word]) {
            options.push({
              type: "text",
              label: word
            });
            seen[word] = true;
          }
        }
        start = -1;
      }
      if (i == value.length) break;
    }
    pos += value.length;
  }
  return {
    from,
    options,
    span: /^\w*/
  };
};
function autocompletion(config = {}) {
  return [completionState, completionConfig.of(config), completionPlugin, completionKeymapExt, baseTheme];
}
const completionKeymap = [{
  key: "Ctrl-Space",
  run: startCompletion
}, {
  key: "Escape",
  run: closeCompletion
}, {
  key: "ArrowDown",
  run: moveCompletionSelection(true)
}, {
  key: "ArrowUp",
  run: moveCompletionSelection(false)
}, {
  key: "PageDown",
  run: moveCompletionSelection(true, "page")
}, {
  key: "PageUp",
  run: moveCompletionSelection(false, "page")
}, {
  key: "Enter",
  run: acceptCompletion
}];
const completionKeymapExt = state_1.Prec.override(view_1.keymap.computeN([completionConfig], state => state.facet(completionConfig).defaultKeymap ? [completionKeymap] : []));
function completionStatus(state) {
  let cState = state.field(completionState, false);
  return cState && cState.active.some(a => a.state == 1) ? "pending" : cState && cState.active.some(a => a.state != 0) ? "active" : null;
}
function currentCompletions(state) {
  var _a;
  let open = (_a = state.field(completionState, false)) === null || _a === void 0 ? void 0 : _a.open;
  return open ? open.options.map(o => o.completion) : [];
}
exports.CompletionContext = CompletionContext;
exports.acceptCompletion = acceptCompletion;
exports.autocompletion = autocompletion;
exports.clearSnippet = clearSnippet;
exports.closeCompletion = closeCompletion;
exports.completeAnyWord = completeAnyWord;
exports.completeFromList = completeFromList;
exports.completionKeymap = completionKeymap;
exports.completionStatus = completionStatus;
exports.currentCompletions = currentCompletions;
exports.ifNotIn = ifNotIn;
exports.moveCompletionSelection = moveCompletionSelection;
exports.nextSnippetField = nextSnippetField;
exports.prevSnippetField = prevSnippetField;
exports.snippet = snippet;
exports.snippetCompletion = snippetCompletion;
exports.snippetKeymap = snippetKeymap;
exports.startCompletion = startCompletion;

},

// node_modules/@codemirror/search/dist/index.js @33
33: function(__fusereq, exports, module){
exports.__esModule = true;
var view_1 = __fusereq(14);
var state_1 = __fusereq(15);
var panel_1 = __fusereq(17);
var rangeset_1 = __fusereq(39);
var crelt_1 = __fusereq(18);
var crelt_1d = __fuse.dt(crelt_1);
var text_1 = __fusereq(22);
const basicNormalize = typeof String.prototype.normalize == "function" ? x => x.normalize("NFKD") : x => x;
class SearchCursor {
  constructor(text, query, from = 0, to = text.length, normalize) {
    this.value = {
      from: 0,
      to: 0
    };
    this.done = false;
    this.matches = [];
    this.buffer = "";
    this.bufferPos = 0;
    this.iter = text.iterRange(from, to);
    this.bufferStart = from;
    this.normalize = normalize ? x => normalize(basicNormalize(x)) : basicNormalize;
    this.query = this.normalize(query);
  }
  peek() {
    if (this.bufferPos == this.buffer.length) {
      this.bufferStart += this.buffer.length;
      this.iter.next();
      if (this.iter.done) return -1;
      this.bufferPos = 0;
      this.buffer = this.iter.value;
    }
    return this.buffer.charCodeAt(this.bufferPos);
  }
  next() {
    for (; ; ) {
      let next = this.peek();
      if (next < 0) {
        this.done = true;
        return this;
      }
      let str = String.fromCharCode(next), start = this.bufferStart + this.bufferPos;
      this.bufferPos++;
      for (; ; ) {
        let peek = this.peek();
        if (peek < 0xDC00 || peek >= 0xE000) break;
        this.bufferPos++;
        str += String.fromCharCode(peek);
      }
      let norm = this.normalize(str);
      for (let i = 0, pos = start; ; i++) {
        let code = norm.charCodeAt(i);
        let match = this.match(code, pos);
        if (match) {
          this.value = match;
          return this;
        }
        if (i == norm.length - 1) break;
        if (pos == start && i < str.length && str.charCodeAt(i) == code) pos++;
      }
    }
  }
  match(code, pos) {
    let match = null;
    for (let i = 0; i < this.matches.length; i += 2) {
      let index = this.matches[i], keep = false;
      if (this.query.charCodeAt(index) == code) {
        if (index == this.query.length - 1) {
          match = {
            from: this.matches[i + 1],
            to: pos + 1
          };
        } else {
          this.matches[i]++;
          keep = true;
        }
      }
      if (!keep) {
        this.matches.splice(i, 2);
        i -= 2;
      }
    }
    if (this.query.charCodeAt(0) == code) {
      if (this.query.length == 1) match = {
        from: pos,
        to: pos + 1
      }; else this.matches.push(1, pos);
    }
    return match;
  }
}
function createLineDialog(view) {
  let input = crelt_1d.default("input", {
    class: "cm-textfield",
    name: "line"
  });
  let dom = crelt_1d.default("form", {
    class: "cm-gotoLine",
    onkeydown: event => {
      if (event.keyCode == 27) {
        event.preventDefault();
        view.dispatch({
          effects: dialogEffect.of(false)
        });
        view.focus();
      } else if (event.keyCode == 13) {
        event.preventDefault();
        go();
      }
    },
    onsubmit: event => {
      event.preventDefault();
      go();
    }
  }, crelt_1d.default("label", view.state.phrase("Go to line:"), " ", input), " ", crelt_1d.default("button", {
    class: "cm-button",
    type: "submit"
  }, view.state.phrase("go")));
  function go() {
    let match = (/^([+-])?(\d+)?(:\d+)?(%)?$/).exec(input.value);
    if (!match) return;
    let {state} = view, startLine = state.doc.lineAt(state.selection.main.head);
    let [, sign, ln, cl, percent] = match;
    let col = cl ? +cl.slice(1) : 0;
    let line = ln ? +ln : startLine.number;
    if (ln && percent) {
      let pc = line / 100;
      if (sign) pc = pc * (sign == "-" ? -1 : 1) + startLine.number / state.doc.lines;
      line = Math.round(state.doc.lines * pc);
    } else if (ln && sign) {
      line = line * (sign == "-" ? -1 : 1) + startLine.number;
    }
    let docLine = state.doc.line(Math.max(1, Math.min(state.doc.lines, line)));
    view.dispatch({
      effects: dialogEffect.of(false),
      selection: state_1.EditorSelection.cursor(docLine.from + Math.max(0, Math.min(col, docLine.length))),
      scrollIntoView: true
    });
    view.focus();
  }
  return {
    dom,
    pos: -10
  };
}
const dialogEffect = state_1.StateEffect.define();
const dialogField = state_1.StateField.define({
  create() {
    return true;
  },
  update(value, tr) {
    for (let e of tr.effects) if (e.is(dialogEffect)) value = e.value;
    return value;
  },
  provide: f => panel_1.showPanel.from(f, val => val ? createLineDialog : null)
});
const gotoLine = view => {
  let panel = panel_1.getPanel(view, createLineDialog);
  if (!panel) {
    let effects = [dialogEffect.of(true)];
    if (view.state.field(dialogField, false) == null) effects.push(state_1.StateEffect.appendConfig.of([dialogField, baseTheme$1]));
    view.dispatch({
      effects
    });
    panel = panel_1.getPanel(view, createLineDialog);
  }
  if (panel) panel.dom.querySelector("input").focus();
  return true;
};
const baseTheme$1 = view_1.EditorView.baseTheme({
  ".cm-panel.cm-gotoLine": {
    padding: "2px 6px 4px",
    "& label": {
      fontSize: "80%"
    }
  }
});
const defaultHighlightOptions = {
  highlightWordAroundCursor: false,
  minSelectionLength: 1,
  maxMatches: 100
};
const highlightConfig = state_1.Facet.define({
  combine(options) {
    return state_1.combineConfig(options, defaultHighlightOptions, {
      highlightWordAroundCursor: (a, b) => a || b,
      minSelectionLength: Math.min,
      maxMatches: Math.min
    });
  }
});
function highlightSelectionMatches(options) {
  let ext = [defaultTheme, matchHighlighter];
  if (options) ext.push(highlightConfig.of(options));
  return ext;
}
function wordAt(doc, pos, check) {
  let line = doc.lineAt(pos);
  let from = pos - line.from, to = pos - line.from;
  while (from > 0) {
    let prev = text_1.findClusterBreak(line.text, from, false);
    if (check(line.text.slice(prev, from)) != state_1.CharCategory.Word) break;
    from = prev;
  }
  while (to < line.length) {
    let next = text_1.findClusterBreak(line.text, to);
    if (check(line.text.slice(to, next)) != state_1.CharCategory.Word) break;
    to = next;
  }
  return from == to ? null : line.text.slice(from, to);
}
const matchDeco = view_1.Decoration.mark({
  class: "cm-selectionMatch"
});
const mainMatchDeco = view_1.Decoration.mark({
  class: "cm-selectionMatch cm-selectionMatch-main"
});
const matchHighlighter = view_1.ViewPlugin.fromClass(class {
  constructor(view) {
    this.decorations = this.getDeco(view);
  }
  update(update) {
    if (update.selectionSet || update.docChanged || update.viewportChanged) this.decorations = this.getDeco(update.view);
  }
  getDeco(view) {
    let conf = view.state.facet(highlightConfig);
    let {state} = view, sel = state.selection;
    if (sel.ranges.length > 1) return view_1.Decoration.none;
    let range = sel.main, query, check = null;
    if (range.empty) {
      if (!conf.highlightWordAroundCursor) return view_1.Decoration.none;
      check = state.charCategorizer(range.head);
      query = wordAt(state.doc, range.head, check);
      if (!query) return view_1.Decoration.none;
    } else {
      let len = range.to - range.from;
      if (len < conf.minSelectionLength || len > 200) return view_1.Decoration.none;
      query = state.sliceDoc(range.from, range.to).trim();
      if (!query) return view_1.Decoration.none;
    }
    let deco = [];
    for (let part of view.visibleRanges) {
      let cursor = new SearchCursor(state.doc, query, part.from, part.to);
      while (!cursor.next().done) {
        let {from, to} = cursor.value;
        if (!check || (from == 0 || check(state.sliceDoc(from - 1, from)) != state_1.CharCategory.Word) && (to == state.doc.length || check(state.sliceDoc(to, to + 1)) != state_1.CharCategory.Word)) {
          if (check && from <= range.from && to >= range.to) deco.push(mainMatchDeco.range(from, to)); else if (from >= range.to || to <= range.from) deco.push(matchDeco.range(from, to));
          if (deco.length > conf.maxMatches) return view_1.Decoration.none;
        }
      }
    }
    return view_1.Decoration.set(deco);
  }
}, {
  decorations: v => v.decorations
});
const defaultTheme = view_1.EditorView.baseTheme({
  ".cm-selectionMatch": {
    backgroundColor: "#99ff7780"
  },
  ".cm-searchMatch .cm-selectionMatch": {
    backgroundColor: "transparent"
  }
});
class Query {
  constructor(search, replace, caseInsensitive) {
    this.search = search;
    this.replace = replace;
    this.caseInsensitive = caseInsensitive;
  }
  eq(other) {
    return this.search == other.search && this.replace == other.replace && this.caseInsensitive == other.caseInsensitive;
  }
  cursor(doc, from = 0, to = doc.length) {
    return new SearchCursor(doc, this.search, from, to, this.caseInsensitive ? x => x.toLowerCase() : undefined);
  }
  get valid() {
    return !!this.search;
  }
}
const setQuery = state_1.StateEffect.define();
const togglePanel = state_1.StateEffect.define();
const searchState = state_1.StateField.define({
  create() {
    return new SearchState(new Query("", "", false), null);
  },
  update(value, tr) {
    for (let effect of tr.effects) {
      if (effect.is(setQuery)) value = new SearchState(effect.value, value.panel); else if (effect.is(togglePanel)) value = new SearchState(value.query, effect.value ? createSearchPanel : null);
    }
    return value;
  },
  provide: f => panel_1.showPanel.from(f, val => val.panel)
});
class SearchState {
  constructor(query, panel) {
    this.query = query;
    this.panel = panel;
  }
}
const matchMark = view_1.Decoration.mark({
  class: "cm-searchMatch"
}), selectedMatchMark = view_1.Decoration.mark({
  class: "cm-searchMatch cm-searchMatch-selected"
});
const searchHighlighter = view_1.ViewPlugin.fromClass(class {
  constructor(view) {
    this.view = view;
    this.decorations = this.highlight(view.state.field(searchState));
  }
  update(update) {
    let state = update.state.field(searchState);
    if (state != update.startState.field(searchState) || update.docChanged || update.selectionSet) this.decorations = this.highlight(state);
  }
  highlight({query, panel}) {
    if (!panel || !query.valid) return view_1.Decoration.none;
    let state = this.view.state, viewport = this.view.viewport;
    let cursor = query.cursor(state.doc, Math.max(0, viewport.from - query.search.length), Math.min(viewport.to + query.search.length, state.doc.length));
    let builder = new rangeset_1.RangeSetBuilder();
    while (!cursor.next().done) {
      let {from, to} = cursor.value;
      let selected = state.selection.ranges.some(r => r.from == from && r.to == to);
      builder.add(from, to, selected ? selectedMatchMark : matchMark);
    }
    return builder.finish();
  }
}, {
  decorations: v => v.decorations
});
function searchCommand(f) {
  return view => {
    let state = view.state.field(searchState, false);
    return state && state.query.valid ? f(view, state) : openSearchPanel(view);
  };
}
function findNextMatch(doc, from, query) {
  let cursor = query.cursor(doc, from).next();
  if (cursor.done) {
    cursor = query.cursor(doc, 0, from + query.search.length - 1).next();
    if (cursor.done) return null;
  }
  return cursor.value;
}
const findNext = searchCommand((view, state) => {
  let {from, to} = view.state.selection.main;
  let next = findNextMatch(view.state.doc, view.state.selection.main.from + 1, state.query);
  if (!next || next.from == from && next.to == to) return false;
  view.dispatch({
    selection: {
      anchor: next.from,
      head: next.to
    },
    scrollIntoView: true,
    effects: announceMatch(view, next)
  });
  return true;
});
const FindPrevChunkSize = 10000;
function findPrevInRange(query, doc, from, to) {
  for (let pos = to; ; ) {
    let start = Math.max(from, pos - FindPrevChunkSize - query.search.length);
    let cursor = query.cursor(doc, start, pos), range = null;
    while (!cursor.next().done) range = cursor.value;
    if (range) return range;
    if (start == from) return null;
    pos -= FindPrevChunkSize;
  }
}
const findPrevious = searchCommand((view, {query}) => {
  let {state} = view;
  let range = findPrevInRange(query, state.doc, 0, state.selection.main.to - 1) || findPrevInRange(query, state.doc, state.selection.main.from + 1, state.doc.length);
  if (!range) return false;
  view.dispatch({
    selection: {
      anchor: range.from,
      head: range.to
    },
    scrollIntoView: true,
    effects: announceMatch(view, range)
  });
  return true;
});
const selectMatches = searchCommand((view, {query}) => {
  let cursor = query.cursor(view.state.doc), ranges = [];
  while (!cursor.next().done) ranges.push(state_1.EditorSelection.range(cursor.value.from, cursor.value.to));
  if (!ranges.length) return false;
  view.dispatch({
    selection: state_1.EditorSelection.create(ranges)
  });
  return true;
});
const selectSelectionMatches = ({state, dispatch}) => {
  let sel = state.selection;
  if (sel.ranges.length > 1 || sel.main.empty) return false;
  let {from, to} = sel.main;
  let ranges = [], main = 0;
  for (let cur = new SearchCursor(state.doc, state.sliceDoc(from, to)); !cur.next().done; ) {
    if (ranges.length > 1000) return false;
    if (cur.value.from == from) main = ranges.length;
    ranges.push(state_1.EditorSelection.range(cur.value.from, cur.value.to));
  }
  dispatch(state.update({
    selection: state_1.EditorSelection.create(ranges, main)
  }));
  return true;
};
const replaceNext = searchCommand((view, {query}) => {
  let {state} = view, next = findNextMatch(state.doc, state.selection.main.from, query);
  if (!next) return false;
  let {from, to} = state.selection.main, changes = [], selection;
  if (next.from == from && next.to == to) {
    changes.push({
      from: next.from,
      to: next.to,
      insert: query.replace
    });
    next = findNextMatch(state.doc, next.to, query);
  }
  if (next) {
    let off = changes.length == 0 || changes[0].from >= next.to ? 0 : next.to - next.from - query.replace.length;
    selection = {
      anchor: next.from - off,
      head: next.to - off
    };
  }
  view.dispatch({
    changes,
    selection,
    scrollIntoView: !!selection,
    effects: next ? announceMatch(view, next) : undefined
  });
  return true;
});
const replaceAll = searchCommand((view, {query}) => {
  let cursor = query.cursor(view.state.doc), changes = [];
  while (!cursor.next().done) {
    let {from, to} = cursor.value;
    changes.push({
      from,
      to,
      insert: query.replace
    });
  }
  if (!changes.length) return false;
  view.dispatch({
    changes
  });
  return true;
});
function createSearchPanel(view) {
  let {query} = view.state.field(searchState);
  return {
    dom: buildPanel({
      view,
      query,
      updateQuery(q) {
        if (!query.eq(q)) {
          query = q;
          view.dispatch({
            effects: setQuery.of(query)
          });
        }
      }
    }),
    mount() {
      this.dom.querySelector("[name=search]").select();
    },
    pos: 80
  };
}
const openSearchPanel = view => {
  let state = view.state.field(searchState, false);
  if (state && state.panel) {
    let panel = panel_1.getPanel(view, createSearchPanel);
    if (!panel) return false;
    panel.dom.querySelector("[name=search]").focus();
  } else {
    view.dispatch({
      effects: [togglePanel.of(true), ...state ? [] : [state_1.StateEffect.appendConfig.of(searchExtensions)]]
    });
  }
  return true;
};
const closeSearchPanel = view => {
  let state = view.state.field(searchState, false);
  if (!state || !state.panel) return false;
  let panel = panel_1.getPanel(view, createSearchPanel);
  if (panel && panel.dom.contains(view.root.activeElement)) view.focus();
  view.dispatch({
    effects: togglePanel.of(false)
  });
  return true;
};
const searchKeymap = [{
  key: "Mod-f",
  run: openSearchPanel,
  scope: "editor search-panel"
}, {
  key: "F3",
  run: findNext,
  shift: findPrevious,
  scope: "editor search-panel"
}, {
  key: "Mod-g",
  run: findNext,
  shift: findPrevious,
  scope: "editor search-panel"
}, {
  key: "Escape",
  run: closeSearchPanel,
  scope: "editor search-panel"
}, {
  key: "Mod-Shift-l",
  run: selectSelectionMatches
}, {
  key: "Alt-g",
  run: gotoLine
}];
function buildPanel(conf) {
  function p(phrase) {
    return conf.view.state.phrase(phrase);
  }
  let searchField = crelt_1d.default("input", {
    value: conf.query.search,
    placeholder: p("Find"),
    "aria-label": p("Find"),
    class: "cm-textfield",
    name: "search",
    onchange: update,
    onkeyup: update
  });
  let replaceField = crelt_1d.default("input", {
    value: conf.query.replace,
    placeholder: p("Replace"),
    "aria-label": p("Replace"),
    class: "cm-textfield",
    name: "replace",
    onchange: update,
    onkeyup: update
  });
  let caseField = crelt_1d.default("input", {
    type: "checkbox",
    name: "case",
    checked: !conf.query.caseInsensitive,
    onchange: update
  });
  function update() {
    conf.updateQuery(new Query(searchField.value, replaceField.value, !caseField.checked));
  }
  function keydown(e) {
    if (view_1.runScopeHandlers(conf.view, e, "search-panel")) {
      e.preventDefault();
    } else if (e.keyCode == 13 && e.target == searchField) {
      e.preventDefault();
      (e.shiftKey ? findPrevious : findNext)(conf.view);
    } else if (e.keyCode == 13 && e.target == replaceField) {
      e.preventDefault();
      replaceNext(conf.view);
    }
  }
  function button(name, onclick, content) {
    return crelt_1d.default("button", {
      class: "cm-button",
      name,
      onclick
    }, content);
  }
  let panel = crelt_1d.default("div", {
    onkeydown: keydown,
    class: "cm-search"
  }, [searchField, button("next", () => findNext(conf.view), [p("next")]), button("prev", () => findPrevious(conf.view), [p("previous")]), button("select", () => selectMatches(conf.view), [p("all")]), crelt_1d.default("label", null, [caseField, "match case"]), crelt_1d.default("br"), replaceField, button("replace", () => replaceNext(conf.view), [p("replace")]), button("replaceAll", () => replaceAll(conf.view), [p("replace all")]), crelt_1d.default("button", {
    name: "close",
    onclick: () => closeSearchPanel(conf.view),
    "aria-label": p("close")
  }, ["×"])]);
  return panel;
}
const AnnounceMargin = 30;
const Break = /[\s\.,:;?!]/;
function announceMatch(view, {from, to}) {
  if (view.hasFocus) return undefined;
  let lineStart = view.state.doc.lineAt(from).from, lineEnd = view.state.doc.lineAt(to).to;
  let start = Math.max(lineStart, from - AnnounceMargin), end = Math.min(lineEnd, to + AnnounceMargin);
  let text = view.state.sliceDoc(start, end);
  if (start != lineStart) {
    for (let i = 0; i < AnnounceMargin; i++) if (!Break.test(text[i + 1]) && Break.test(text[i])) {
      text = text.slice(i);
      break;
    }
  }
  if (end != lineEnd) {
    for (let i = text.length - 1; i > text.length - AnnounceMargin; i--) if (!Break.test(text[i - 1]) && Break.test(text[i])) {
      text = text.slice(0, i);
      break;
    }
  }
  return view_1.EditorView.announce.of(`${view.state.phrase("current match")}. ${text} ${view.state.phrase("on line")} ${view.state.doc.lineAt(from).number}`);
}
const baseTheme = view_1.EditorView.baseTheme({
  ".cm-panel.cm-search": {
    padding: "2px 6px 4px",
    position: "relative",
    "& [name=close]": {
      position: "absolute",
      top: "0",
      right: "4px",
      backgroundColor: "inherit",
      border: "none",
      font: "inherit",
      padding: 0,
      margin: 0
    },
    "& input, & button": {
      margin: ".2em .5em .2em 0"
    },
    "& label": {
      fontSize: "80%"
    }
  },
  "&light .cm-searchMatch": {
    backgroundColor: "#ffff0054"
  },
  "&dark .cm-searchMatch": {
    backgroundColor: "#00ffff8a"
  },
  "&light .cm-searchMatch-selected": {
    backgroundColor: "#ff6a0054"
  },
  "&dark .cm-searchMatch-selected": {
    backgroundColor: "#ff00ff8a"
  }
});
const searchExtensions = [searchState, state_1.Prec.override(searchHighlighter), baseTheme];
exports.SearchCursor = SearchCursor;
exports.closeSearchPanel = closeSearchPanel;
exports.findNext = findNext;
exports.findPrevious = findPrevious;
exports.gotoLine = gotoLine;
exports.highlightSelectionMatches = highlightSelectionMatches;
exports.openSearchPanel = openSearchPanel;
exports.replaceAll = replaceAll;
exports.replaceNext = replaceNext;
exports.searchKeymap = searchKeymap;
exports.selectMatches = selectMatches;
exports.selectSelectionMatches = selectSelectionMatches;

},

// node_modules/@codemirror/comment/dist/index.js @35
35: function(__fusereq, exports, module){
exports.__esModule = true;
var state_1 = __fusereq(15);
const toggleComment = target => {
  let config = getConfig(target.state);
  return config.line ? toggleLineComment(target) : config.block ? toggleBlockComment(target) : false;
};
function command(f, option) {
  return ({state, dispatch}) => {
    let tr = f(option, state.selection.ranges, state);
    if (!tr) return false;
    dispatch(state.update(tr));
    return true;
  };
}
const toggleLineComment = command(changeLineComment, 0);
const lineComment = command(changeLineComment, 1);
const lineUncomment = command(changeLineComment, 2);
const toggleBlockComment = command(changeBlockComment, 0);
const blockComment = command(changeBlockComment, 1);
const blockUncomment = command(changeBlockComment, 2);
const commentKeymap = [{
  key: "Mod-/",
  run: toggleComment
}, {
  key: "Alt-A",
  run: toggleBlockComment
}];
function getConfig(state, pos = state.selection.main.head) {
  let data = state.languageDataAt("commentTokens", pos);
  return data.length ? data[0] : {};
}
const SearchMargin = 50;
function findBlockComment(state, {open, close}, from, to) {
  let textBefore = state.sliceDoc(from - SearchMargin, from);
  let textAfter = state.sliceDoc(to, to + SearchMargin);
  let spaceBefore = (/\s*$/).exec(textBefore)[0].length, spaceAfter = (/^\s*/).exec(textAfter)[0].length;
  let beforeOff = textBefore.length - spaceBefore;
  if (textBefore.slice(beforeOff - open.length, beforeOff) == open && textAfter.slice(spaceAfter, spaceAfter + close.length) == close) {
    return {
      open: {
        pos: from - spaceBefore,
        margin: spaceBefore && 1
      },
      close: {
        pos: to + spaceAfter,
        margin: spaceAfter && 1
      }
    };
  }
  let startText, endText;
  if (to - from <= 2 * SearchMargin) {
    startText = endText = state.sliceDoc(from, to);
  } else {
    startText = state.sliceDoc(from, from + SearchMargin);
    endText = state.sliceDoc(to - SearchMargin, to);
  }
  let startSpace = (/^\s*/).exec(startText)[0].length, endSpace = (/\s*$/).exec(endText)[0].length;
  let endOff = endText.length - endSpace - close.length;
  if (startText.slice(startSpace, startSpace + open.length) == open && endText.slice(endOff, endOff + close.length) == close) {
    return {
      open: {
        pos: from + startSpace + open.length,
        margin: (/\s/).test(startText.charAt(startSpace + open.length)) ? 1 : 0
      },
      close: {
        pos: to - endSpace - close.length,
        margin: (/\s/).test(endText.charAt(endOff - 1)) ? 1 : 0
      }
    };
  }
  return null;
}
function changeBlockComment(option, ranges, state) {
  let tokens = ranges.map(r => getConfig(state, r.from).block);
  if (!tokens.every(c => c)) return null;
  let comments = ranges.map((r, i) => findBlockComment(state, tokens[i], r.from, r.to));
  if (option != 2 && !comments.every(c => c)) {
    let index = 0;
    return state.changeByRange(range => {
      let {open, close} = tokens[index++];
      if (comments[index]) return {
        range
      };
      let shift = open.length + 1;
      return {
        changes: [{
          from: range.from,
          insert: open + " "
        }, {
          from: range.to,
          insert: " " + close
        }],
        range: state_1.EditorSelection.range(range.anchor + shift, range.head + shift)
      };
    });
  } else if (option != 1 && comments.some(c => c)) {
    let changes = [];
    for (let i = 0, comment; i < comments.length; i++) if (comment = comments[i]) {
      let token = tokens[i], {open, close} = comment;
      changes.push({
        from: open.pos - token.open.length,
        to: open.pos + open.margin
      }, {
        from: close.pos - close.margin,
        to: close.pos + token.close.length
      });
    }
    return {
      changes
    };
  }
  return null;
}
function changeLineComment(option, ranges, state) {
  let lines = [];
  let prevLine = -1;
  for (let {from, to} of ranges) {
    let startI = lines.length, minIndent = 1e9;
    for (let pos = from; pos <= to; ) {
      let line = state.doc.lineAt(pos);
      if (line.from > prevLine && (from == to || to > line.from)) {
        prevLine = line.from;
        let token = getConfig(state, pos).line;
        if (!token) continue;
        let indent = (/^\s*/).exec(line.text)[0].length;
        let comment = line.text.slice(indent, indent + token.length) == token ? indent : -1;
        if (indent < line.text.length && indent < minIndent) minIndent = indent;
        lines.push({
          line,
          comment,
          token,
          indent,
          single: false
        });
      }
      pos = line.to + 1;
    }
    if (minIndent < 1e9) for (let i = startI; i < lines.length; i++) if (lines[i].indent < lines[i].line.text.length) lines[i].indent = minIndent;
    if (lines.length == startI + 1) lines[startI].single = true;
  }
  if (option != 1 && lines.some(l => l.comment >= 0)) {
    let changes = [];
    for (let {line, comment, token} of lines) if (comment >= 0) {
      let from = line.from + comment, to = from + token.length;
      if (line.text[to - line.from] == " ") to++;
      changes.push({
        from,
        to
      });
    }
    return {
      changes
    };
  } else if (option != 2 && lines.some(l => l.comment < 0)) {
    let changes = [];
    for (let {line, comment, token, indent, single} of lines) if (comment != indent && (single || (/\S/).test(line.text))) changes.push({
      from: line.from + indent,
      insert: token + " "
    });
    let changeSet = state.changes(changes);
    return {
      changes: changeSet,
      selection: state.selection.map(changeSet, 1)
    };
  }
  return null;
}
exports.blockComment = blockComment;
exports.blockUncomment = blockUncomment;
exports.commentKeymap = commentKeymap;
exports.lineComment = lineComment;
exports.lineUncomment = lineUncomment;
exports.toggleBlockComment = toggleBlockComment;
exports.toggleComment = toggleComment;
exports.toggleLineComment = toggleLineComment;

},

// node_modules/@codemirror/rectangular-selection/dist/index.js @36
36: function(__fusereq, exports, module){
exports.__esModule = true;
var state_1 = __fusereq(15);
var view_1 = __fusereq(14);
var text_1 = __fusereq(22);
const MaxOff = 2000;
function rectangleFor(state, a, b) {
  let startLine = Math.min(a.line, b.line), endLine = Math.max(a.line, b.line);
  let ranges = [];
  if (a.off > MaxOff || b.off > MaxOff || a.col < 0 || b.col < 0) {
    let startOff = Math.min(a.off, b.off), endOff = Math.max(a.off, b.off);
    for (let i = startLine; i <= endLine; i++) {
      let line = state.doc.line(i);
      if (line.length <= endOff) ranges.push(state_1.EditorSelection.range(line.from + startOff, line.to + endOff));
    }
  } else {
    let startCol = Math.min(a.col, b.col), endCol = Math.max(a.col, b.col);
    for (let i = startLine; i <= endLine; i++) {
      let line = state.doc.line(i), str = line.length > MaxOff ? line.text.slice(0, 2 * endCol) : line.text;
      let start = text_1.findColumn(str, 0, startCol, state.tabSize), end = text_1.findColumn(str, 0, endCol, state.tabSize);
      if (!start.leftOver) ranges.push(state_1.EditorSelection.range(line.from + start.offset, line.from + end.offset));
    }
  }
  return ranges;
}
function absoluteColumn(view, x) {
  let ref = view.coordsAtPos(view.viewport.from);
  return ref ? Math.round(Math.abs((ref.left - x) / view.defaultCharacterWidth)) : -1;
}
function getPos(view, event) {
  let offset = view.posAtCoords({
    x: event.clientX,
    y: event.clientY
  });
  if (offset == null) return null;
  let line = view.state.doc.lineAt(offset), off = offset - line.from;
  let col = off > MaxOff ? -1 : off == line.length ? absoluteColumn(view, event.clientX) : text_1.countColumn(line.text.slice(0, offset - line.from), 0, view.state.tabSize);
  return {
    line: line.number,
    col,
    off
  };
}
function rectangleSelectionStyle(view, event) {
  let start = getPos(view, event), startSel = view.state.selection;
  if (!start) return null;
  return {
    update(update) {
      if (update.docChanged) {
        let newStart = update.changes.mapPos(update.startState.doc.line(start.line).from);
        let newLine = update.state.doc.lineAt(newStart);
        start = {
          line: newLine.number,
          col: start.col,
          off: Math.min(start.off, newLine.length)
        };
        startSel = startSel.map(update.changes);
      }
    },
    get(event, _extend, multiple) {
      let cur = getPos(view, event);
      if (!cur) return startSel;
      let ranges = rectangleFor(view.state, start, cur);
      if (!ranges.length) return startSel;
      if (multiple) return state_1.EditorSelection.create(ranges.concat(startSel.ranges)); else return state_1.EditorSelection.create(ranges);
    }
  };
}
function rectangularSelection(options) {
  let filter = (options === null || options === void 0 ? void 0 : options.eventFilter) || (e => e.altKey && e.button == 0);
  return view_1.EditorView.mouseSelectionStyle.of((view, event) => filter(event) ? rectangleSelectionStyle(view, event) : null);
}
exports.rectangularSelection = rectangularSelection;

},

// node_modules/@codemirror/basic-setup/dist/index.js @4
4: function(__fusereq, exports, module){
exports.__esModule = true;
var view_1 = __fusereq(14);
var view_2 = __fusereq(14);
exports.EditorView = view_2.EditorView;
var state_1 = __fusereq(15);
var state_2 = __fusereq(15);
exports.EditorState = state_2.EditorState;
var history_1 = __fusereq(27);
var fold_1 = __fusereq(28);
var language_1 = __fusereq(21);
var gutter_1 = __fusereq(29);
var commands_1 = __fusereq(30);
var matchbrackets_1 = __fusereq(31);
var closebrackets_1 = __fusereq(32);
var search_1 = __fusereq(33);
var autocomplete_1 = __fusereq(34);
var comment_1 = __fusereq(35);
var rectangular_selection_1 = __fusereq(36);
var highlight_1 = __fusereq(20);
var lint_1 = __fusereq(5);
const basicSetup = [gutter_1.lineNumbers(), view_1.highlightSpecialChars(), history_1.history(), fold_1.foldGutter(), view_1.drawSelection(), state_1.EditorState.allowMultipleSelections.of(true), language_1.indentOnInput(), highlight_1.defaultHighlightStyle.fallback, matchbrackets_1.bracketMatching(), closebrackets_1.closeBrackets(), autocomplete_1.autocompletion(), rectangular_selection_1.rectangularSelection(), view_1.highlightActiveLine(), search_1.highlightSelectionMatches(), view_1.keymap.of([...closebrackets_1.closeBracketsKeymap, ...commands_1.defaultKeymap, ...search_1.searchKeymap, ...history_1.historyKeymap, ...fold_1.foldKeymap, ...comment_1.commentKeymap, ...autocomplete_1.completionKeymap, ...lint_1.lintKeymap])];
exports.basicSetup = basicSetup;

},

// node_modules/lezer-json/dist/index.es.js @49
49: function(__fusereq, exports, module){
exports.__esModule = true;
var lezer_1 = __fusereq(124);
const parser = lezer_1.Parser.deserialize({
  version: 13,
  states: "$bOVQPOOOOQO'#Cb'#CbOnQPO'#CcOvQPO'#CfOOQO'#Cl'#ClQOQPOOOOQO'#Ce'#CeO}QPO'#CdO!SQPO'#CpOOQO,58},58}O![QPO,58}O!aQPO'#CuOOQO,59Q,59QO!iQPO,59QOVQPO,59OO!nQPO'#CgO!sQPO,59[OOQO1G.i1G.iOVQPO'#ChO!{QPO,59aOOQO1G.l1G.lOOQO1G.j1G.jOOQO,59R,59ROOQO-E6e-E6eOOQO,59S,59SOOQO-E6f-E6f",
  stateData: "#T~O_OS~OQSORSOSSOTSOaPOcQOhRO~OaUObXO~Og[O~PVOe^O~Of_ObdX~ObaO~OfbOgiX~OgdO~OaUO~Of_Obda~OfbOgia~O",
  goto: "!kjPPPPPPkkqwk{!RPPP!XPPP!ePPPP!hXSOR^bQWQRf_TVQ_Q`WRg`QcZRicQTOQZRQe^RhbRYQR]R",
  nodeNames: "⚠ JsonText True False Null Number String Object Property PropertyName Array",
  maxTerm: 25,
  skippedNodes: [0],
  repeatNodeCount: 2,
  tokenData: "(p~RaXY!WYZ!W]^!Wpq!Wrs!]|}$i}!O$n!Q!R$w!R![&V![!]&h!}#O&m#P#Q&r#Y#Z&w#b#c'f#h#i'}#o#p(f#q#r(k~!]O_~~!`Upq!]qr!]rs!rs#O!]#O#P!w#P~!]~!wOa~~!zXrs!]!P!Q!]#O#P!]#U#V!]#Y#Z!]#b#c!]#f#g!]#h#i!]#i#j#g~#jR!Q![#s!c!i#s#T#Z#s~#vR!Q![$P!c!i$P#T#Z$P~$SR!Q![$]!c!i$]#T#Z$]~$`R!Q![!]!c!i!]#T#Z!]~$nOf~~$qQ!Q!R$w!R![&V~$|RT~!O!P%V!g!h%k#X#Y%k~%YP!Q![%]~%bRT~!Q![%]!g!h%k#X#Y%k~%nR{|%w}!O%w!Q![%}~%zP!Q![%}~&SPT~!Q![%}~&[ST~!O!P%V!Q![&V!g!h%k#X#Y%k~&mOe~~&rOh~~&wOg~~&zP#T#U&}~'QP#`#a'T~'WP#g#h'Z~'^P#X#Y'a~'fOR~~'iP#i#j'l~'oP#`#a'r~'uP#`#a'x~'}OS~~(QP#f#g(T~(WP#i#j(Z~(^P#X#Y(a~(fOQ~~(kOc~~(pOb~",
  tokenizers: [0],
  topRules: {
    "JsonText": [0, 1]
  },
  tokenPrec: 0
});
exports.parser = parser;

},

// node_modules/lezer/dist/index.es.js @124
124: function(__fusereq, exports, module){
var process = __fusereq(186);
exports.__esModule = true;
var lezer_tree_1 = __fusereq(19);
var lezer_tree_2 = __fusereq(19);
exports.NodeProp = lezer_tree_2.NodeProp;
exports.NodeSet = lezer_tree_2.NodeSet;
exports.NodeType = lezer_tree_2.NodeType;
exports.Tree = lezer_tree_2.Tree;
exports.TreeCursor = lezer_tree_2.TreeCursor;
class Stack {
  constructor(p, stack, state, reducePos, pos, score, buffer, bufferBase, curContext, parent) {
    this.p = p;
    this.stack = stack;
    this.state = state;
    this.reducePos = reducePos;
    this.pos = pos;
    this.score = score;
    this.buffer = buffer;
    this.bufferBase = bufferBase;
    this.curContext = curContext;
    this.parent = parent;
  }
  toString() {
    return `[${this.stack.filter((_, i) => i % 3 == 0).concat(this.state)}]@${this.pos}${this.score ? "!" + this.score : ""}`;
  }
  static start(p, state, pos = 0) {
    let cx = p.parser.context;
    return new Stack(p, [], state, pos, pos, 0, [], 0, cx ? new StackContext(cx, cx.start) : null, null);
  }
  get context() {
    return this.curContext ? this.curContext.context : null;
  }
  pushState(state, start) {
    this.stack.push(this.state, start, this.bufferBase + this.buffer.length);
    this.state = state;
  }
  reduce(action) {
    let depth = action >> 19, type = action & 65535;
    let {parser} = this.p;
    let dPrec = parser.dynamicPrecedence(type);
    if (dPrec) this.score += dPrec;
    if (depth == 0) {
      if (type < parser.minRepeatTerm) this.storeNode(type, this.reducePos, this.reducePos, 4, true);
      this.pushState(parser.getGoto(this.state, type, true), this.reducePos);
      this.reduceContext(type);
      return;
    }
    let base = this.stack.length - (depth - 1) * 3 - (action & 262144 ? 6 : 0);
    let start = this.stack[base - 2];
    let bufferBase = this.stack[base - 1], count = this.bufferBase + this.buffer.length - bufferBase;
    if (type < parser.minRepeatTerm || action & 131072) {
      let pos = parser.stateFlag(this.state, 1) ? this.pos : this.reducePos;
      this.storeNode(type, start, pos, count + 4, true);
    }
    if (action & 262144) {
      this.state = this.stack[base];
    } else {
      let baseStateID = this.stack[base - 3];
      this.state = parser.getGoto(baseStateID, type, true);
    }
    while (this.stack.length > base) this.stack.pop();
    this.reduceContext(type);
  }
  storeNode(term, start, end, size = 4, isReduce = false) {
    if (term == 0) {
      let cur = this, top = this.buffer.length;
      if (top == 0 && cur.parent) {
        top = cur.bufferBase - cur.parent.bufferBase;
        cur = cur.parent;
      }
      if (top > 0 && cur.buffer[top - 4] == 0 && cur.buffer[top - 1] > -1) {
        if (start == end) return;
        if (cur.buffer[top - 2] >= start) {
          cur.buffer[top - 2] = end;
          return;
        }
      }
    }
    if (!isReduce || this.pos == end) {
      this.buffer.push(term, start, end, size);
    } else {
      let index = this.buffer.length;
      if (index > 0 && this.buffer[index - 4] != 0) while (index > 0 && this.buffer[index - 2] > end) {
        this.buffer[index] = this.buffer[index - 4];
        this.buffer[index + 1] = this.buffer[index - 3];
        this.buffer[index + 2] = this.buffer[index - 2];
        this.buffer[index + 3] = this.buffer[index - 1];
        index -= 4;
        if (size > 4) size -= 4;
      }
      this.buffer[index] = term;
      this.buffer[index + 1] = start;
      this.buffer[index + 2] = end;
      this.buffer[index + 3] = size;
    }
  }
  shift(action, next, nextEnd) {
    if (action & 131072) {
      this.pushState(action & 65535, this.pos);
    } else if ((action & 262144) == 0) {
      let start = this.pos, nextState = action, {parser} = this.p;
      if (nextEnd > this.pos || next <= parser.maxNode) {
        this.pos = nextEnd;
        if (!parser.stateFlag(nextState, 1)) this.reducePos = nextEnd;
      }
      this.pushState(nextState, start);
      if (next <= parser.maxNode) this.buffer.push(next, start, nextEnd, 4);
      this.shiftContext(next);
    } else {
      if (next <= this.p.parser.maxNode) this.buffer.push(next, this.pos, nextEnd, 4);
      this.pos = nextEnd;
    }
  }
  apply(action, next, nextEnd) {
    if (action & 65536) this.reduce(action); else this.shift(action, next, nextEnd);
  }
  useNode(value, next) {
    let index = this.p.reused.length - 1;
    if (index < 0 || this.p.reused[index] != value) {
      this.p.reused.push(value);
      index++;
    }
    let start = this.pos;
    this.reducePos = this.pos = start + value.length;
    this.pushState(next, start);
    this.buffer.push(index, start, this.reducePos, -1);
    if (this.curContext) this.updateContext(this.curContext.tracker.reuse(this.curContext.context, value, this.p.input, this));
  }
  split() {
    let parent = this;
    let off = parent.buffer.length;
    while (off > 0 && parent.buffer[off - 2] > parent.reducePos) off -= 4;
    let buffer = parent.buffer.slice(off), base = parent.bufferBase + off;
    while (parent && base == parent.bufferBase) parent = parent.parent;
    return new Stack(this.p, this.stack.slice(), this.state, this.reducePos, this.pos, this.score, buffer, base, this.curContext, parent);
  }
  recoverByDelete(next, nextEnd) {
    let isNode = next <= this.p.parser.maxNode;
    if (isNode) this.storeNode(next, this.pos, nextEnd);
    this.storeNode(0, this.pos, nextEnd, isNode ? 8 : 4);
    this.pos = this.reducePos = nextEnd;
    this.score -= 200;
  }
  canShift(term) {
    for (let sim = new SimulatedStack(this); ; ) {
      let action = this.p.parser.stateSlot(sim.top, 4) || this.p.parser.hasAction(sim.top, term);
      if ((action & 65536) == 0) return true;
      if (action == 0) return false;
      sim.reduce(action);
    }
  }
  get ruleStart() {
    for (let state = this.state, base = this.stack.length; ; ) {
      let force = this.p.parser.stateSlot(state, 5);
      if (!(force & 65536)) return 0;
      base -= 3 * (force >> 19);
      if ((force & 65535) < this.p.parser.minRepeatTerm) return this.stack[base + 1];
      state = this.stack[base];
    }
  }
  startOf(types, before) {
    let state = this.state, frame = this.stack.length, {parser} = this.p;
    for (; ; ) {
      let force = parser.stateSlot(state, 5);
      let depth = force >> 19, term = force & 65535;
      if (types.indexOf(term) > -1) {
        let base = frame - 3 * (force >> 19), pos = this.stack[base + 1];
        if (before == null || before > pos) return pos;
      }
      if (frame == 0) return null;
      if (depth == 0) {
        frame -= 3;
        state = this.stack[frame];
      } else {
        frame -= 3 * (depth - 1);
        state = parser.getGoto(this.stack[frame - 3], term, true);
      }
    }
  }
  recoverByInsert(next) {
    if (this.stack.length >= 300) return [];
    let nextStates = this.p.parser.nextStates(this.state);
    if (nextStates.length > 4 << 1 || this.stack.length >= 120) {
      let best = [];
      for (let i = 0, s; i < nextStates.length; i += 2) {
        if ((s = nextStates[i + 1]) != this.state && this.p.parser.hasAction(s, next)) best.push(nextStates[i], s);
      }
      if (this.stack.length < 120) for (let i = 0; best.length < 4 << 1 && i < nextStates.length; i += 2) {
        let s = nextStates[i + 1];
        if (!best.some((v, i) => i & 1 && v == s)) best.push(nextStates[i], s);
      }
      nextStates = best;
    }
    let result = [];
    for (let i = 0; i < nextStates.length && result.length < 4; i += 2) {
      let s = nextStates[i + 1];
      if (s == this.state) continue;
      let stack = this.split();
      stack.storeNode(0, stack.pos, stack.pos, 4, true);
      stack.pushState(s, this.pos);
      stack.shiftContext(nextStates[i]);
      stack.score -= 200;
      result.push(stack);
    }
    return result;
  }
  forceReduce() {
    let reduce = this.p.parser.stateSlot(this.state, 5);
    if ((reduce & 65536) == 0) return false;
    if (!this.p.parser.validAction(this.state, reduce)) {
      this.storeNode(0, this.reducePos, this.reducePos, 4, true);
      this.score -= 100;
    }
    this.reduce(reduce);
    return true;
  }
  forceAll() {
    while (!this.p.parser.stateFlag(this.state, 2) && this.forceReduce()) {}
    return this;
  }
  get deadEnd() {
    if (this.stack.length != 3) return false;
    let {parser} = this.p;
    return parser.data[parser.stateSlot(this.state, 1)] == 65535 && !parser.stateSlot(this.state, 4);
  }
  restart() {
    this.state = this.stack[0];
    this.stack.length = 0;
  }
  sameState(other) {
    if (this.state != other.state || this.stack.length != other.stack.length) return false;
    for (let i = 0; i < this.stack.length; i += 3) if (this.stack[i] != other.stack[i]) return false;
    return true;
  }
  get parser() {
    return this.p.parser;
  }
  dialectEnabled(dialectID) {
    return this.p.parser.dialect.flags[dialectID];
  }
  shiftContext(term) {
    if (this.curContext) this.updateContext(this.curContext.tracker.shift(this.curContext.context, term, this.p.input, this));
  }
  reduceContext(term) {
    if (this.curContext) this.updateContext(this.curContext.tracker.reduce(this.curContext.context, term, this.p.input, this));
  }
  emitContext() {
    let cx = this.curContext;
    if (!cx.tracker.strict) return;
    let last = this.buffer.length - 1;
    if (last < 0 || this.buffer[last] != -2) this.buffer.push(cx.hash, this.reducePos, this.reducePos, -2);
  }
  updateContext(context) {
    if (context != this.curContext.context) {
      let newCx = new StackContext(this.curContext.tracker, context);
      if (newCx.hash != this.curContext.hash) this.emitContext();
      this.curContext = newCx;
    }
  }
}
class StackContext {
  constructor(tracker, context) {
    this.tracker = tracker;
    this.context = context;
    this.hash = tracker.hash(context);
  }
}
var Recover;
(function (Recover) {
  Recover[Recover["Token"] = 200] = "Token";
  Recover[Recover["Reduce"] = 100] = "Reduce";
  Recover[Recover["MaxNext"] = 4] = "MaxNext";
  Recover[Recover["MaxInsertStackDepth"] = 300] = "MaxInsertStackDepth";
  Recover[Recover["DampenInsertStackDepth"] = 120] = "DampenInsertStackDepth";
})(Recover || (Recover = {}));
class SimulatedStack {
  constructor(stack) {
    this.stack = stack;
    this.top = stack.state;
    this.rest = stack.stack;
    this.offset = this.rest.length;
  }
  reduce(action) {
    let term = action & 65535, depth = action >> 19;
    if (depth == 0) {
      if (this.rest == this.stack.stack) this.rest = this.rest.slice();
      this.rest.push(this.top, 0, 0);
      this.offset += 3;
    } else {
      this.offset -= (depth - 1) * 3;
    }
    let goto = this.stack.p.parser.getGoto(this.rest[this.offset - 3], term, true);
    this.top = goto;
  }
}
class StackBufferCursor {
  constructor(stack, pos, index) {
    this.stack = stack;
    this.pos = pos;
    this.index = index;
    this.buffer = stack.buffer;
    if (this.index == 0) this.maybeNext();
  }
  static create(stack) {
    return new StackBufferCursor(stack, stack.bufferBase + stack.buffer.length, stack.buffer.length);
  }
  maybeNext() {
    let next = this.stack.parent;
    if (next != null) {
      this.index = this.stack.bufferBase - next.bufferBase;
      this.stack = next;
      this.buffer = next.buffer;
    }
  }
  get id() {
    return this.buffer[this.index - 4];
  }
  get start() {
    return this.buffer[this.index - 3];
  }
  get end() {
    return this.buffer[this.index - 2];
  }
  get size() {
    return this.buffer[this.index - 1];
  }
  next() {
    this.index -= 4;
    this.pos -= 4;
    if (this.index == 0) this.maybeNext();
  }
  fork() {
    return new StackBufferCursor(this.stack, this.pos, this.index);
  }
}
class Token {
  constructor() {
    this.start = -1;
    this.value = -1;
    this.end = -1;
  }
  accept(value, end) {
    this.value = value;
    this.end = end;
  }
}
class TokenGroup {
  constructor(data, id) {
    this.data = data;
    this.id = id;
  }
  token(input, token, stack) {
    readToken(this.data, input, token, stack, this.id);
  }
}
TokenGroup.prototype.contextual = TokenGroup.prototype.fallback = TokenGroup.prototype.extend = false;
class ExternalTokenizer {
  constructor(token, options = {}) {
    this.token = token;
    this.contextual = !!options.contextual;
    this.fallback = !!options.fallback;
    this.extend = !!options.extend;
  }
}
function readToken(data, input, token, stack, group) {
  let state = 0, groupMask = 1 << group, dialect = stack.p.parser.dialect;
  scan: for (let pos = token.start; ; ) {
    if ((groupMask & data[state]) == 0) break;
    let accEnd = data[state + 1];
    for (let i = state + 3; i < accEnd; i += 2) if ((data[i + 1] & groupMask) > 0) {
      let term = data[i];
      if (dialect.allows(term) && (token.value == -1 || token.value == term || stack.p.parser.overrides(term, token.value))) {
        token.accept(term, pos);
        break;
      }
    }
    let next = input.get(pos++);
    for (let low = 0, high = data[state + 2]; low < high; ) {
      let mid = low + high >> 1;
      let index = accEnd + mid + (mid << 1);
      let from = data[index], to = data[index + 1];
      if (next < from) high = mid; else if (next >= to) low = mid + 1; else {
        state = data[index + 2];
        continue scan;
      }
    }
    break;
  }
}
function decodeArray(input, Type = Uint16Array) {
  if (typeof input != "string") return input;
  let array = null;
  for (let pos = 0, out = 0; pos < input.length; ) {
    let value = 0;
    for (; ; ) {
      let next = input.charCodeAt(pos++), stop = false;
      if (next == 126) {
        value = 65535;
        break;
      }
      if (next >= 92) next--;
      if (next >= 34) next--;
      let digit = next - 32;
      if (digit >= 46) {
        digit -= 46;
        stop = true;
      }
      value += digit;
      if (stop) break;
      value *= 46;
    }
    if (array) array[out++] = value; else array = new Type(value);
  }
  return array;
}
const verbose = typeof process != "undefined" && (/\bparse\b/).test(undefined);
let stackIDs = null;
function cutAt(tree, pos, side) {
  let cursor = tree.cursor(pos);
  for (; ; ) {
    if (!(side < 0 ? cursor.childBefore(pos) : cursor.childAfter(pos))) for (; ; ) {
      if ((side < 0 ? cursor.to <= pos : cursor.from >= pos) && !cursor.type.isError) return side < 0 ? Math.max(0, Math.min(cursor.to - 1, pos - 5)) : Math.min(tree.length, Math.max(cursor.from + 1, pos + 5));
      if (side < 0 ? cursor.prevSibling() : cursor.nextSibling()) break;
      if (!cursor.parent()) return side < 0 ? 0 : tree.length;
    }
  }
}
class FragmentCursor {
  constructor(fragments) {
    this.fragments = fragments;
    this.i = 0;
    this.fragment = null;
    this.safeFrom = -1;
    this.safeTo = -1;
    this.trees = [];
    this.start = [];
    this.index = [];
    this.nextFragment();
  }
  nextFragment() {
    let fr = this.fragment = this.i == this.fragments.length ? null : this.fragments[this.i++];
    if (fr) {
      this.safeFrom = fr.openStart ? cutAt(fr.tree, fr.from + fr.offset, 1) - fr.offset : fr.from;
      this.safeTo = fr.openEnd ? cutAt(fr.tree, fr.to + fr.offset, -1) - fr.offset : fr.to;
      while (this.trees.length) {
        this.trees.pop();
        this.start.pop();
        this.index.pop();
      }
      this.trees.push(fr.tree);
      this.start.push(-fr.offset);
      this.index.push(0);
      this.nextStart = this.safeFrom;
    } else {
      this.nextStart = 1e9;
    }
  }
  nodeAt(pos) {
    if (pos < this.nextStart) return null;
    while (this.fragment && this.safeTo <= pos) this.nextFragment();
    if (!this.fragment) return null;
    for (; ; ) {
      let last = this.trees.length - 1;
      if (last < 0) {
        this.nextFragment();
        return null;
      }
      let top = this.trees[last], index = this.index[last];
      if (index == top.children.length) {
        this.trees.pop();
        this.start.pop();
        this.index.pop();
        continue;
      }
      let next = top.children[index];
      let start = this.start[last] + top.positions[index];
      if (start > pos) {
        this.nextStart = start;
        return null;
      } else if (start == pos && start + next.length <= this.safeTo) {
        return start == pos && start >= this.safeFrom ? next : null;
      }
      if (next instanceof lezer_tree_1.TreeBuffer) {
        this.index[last]++;
        this.nextStart = start + next.length;
      } else {
        this.index[last]++;
        if (start + next.length >= pos) {
          this.trees.push(next);
          this.start.push(start);
          this.index.push(0);
        }
      }
    }
  }
}
class CachedToken extends Token {
  constructor() {
    super(...arguments);
    this.extended = -1;
    this.mask = 0;
    this.context = 0;
  }
  clear(start) {
    this.start = start;
    this.value = this.extended = -1;
  }
}
const dummyToken = new Token();
class TokenCache {
  constructor(parser) {
    this.tokens = [];
    this.mainToken = dummyToken;
    this.actions = [];
    this.tokens = parser.tokenizers.map(_ => new CachedToken());
  }
  getActions(stack, input) {
    let actionIndex = 0;
    let main = null;
    let {parser} = stack.p, {tokenizers} = parser;
    let mask = parser.stateSlot(stack.state, 3);
    let context = stack.curContext ? stack.curContext.hash : 0;
    for (let i = 0; i < tokenizers.length; i++) {
      if ((1 << i & mask) == 0) continue;
      let tokenizer = tokenizers[i], token = this.tokens[i];
      if (main && !tokenizer.fallback) continue;
      if (tokenizer.contextual || token.start != stack.pos || token.mask != mask || token.context != context) {
        this.updateCachedToken(token, tokenizer, stack, input);
        token.mask = mask;
        token.context = context;
      }
      if (token.value != 0) {
        let startIndex = actionIndex;
        if (token.extended > -1) actionIndex = this.addActions(stack, token.extended, token.end, actionIndex);
        actionIndex = this.addActions(stack, token.value, token.end, actionIndex);
        if (!tokenizer.extend) {
          main = token;
          if (actionIndex > startIndex) break;
        }
      }
    }
    while (this.actions.length > actionIndex) this.actions.pop();
    if (!main) {
      main = dummyToken;
      main.start = stack.pos;
      if (stack.pos == input.length) main.accept(stack.p.parser.eofTerm, stack.pos); else main.accept(0, stack.pos + 1);
    }
    this.mainToken = main;
    return this.actions;
  }
  updateCachedToken(token, tokenizer, stack, input) {
    token.clear(stack.pos);
    tokenizer.token(input, token, stack);
    if (token.value > -1) {
      let {parser} = stack.p;
      for (let i = 0; i < parser.specialized.length; i++) if (parser.specialized[i] == token.value) {
        let result = parser.specializers[i](input.read(token.start, token.end), stack);
        if (result >= 0 && stack.p.parser.dialect.allows(result >> 1)) {
          if ((result & 1) == 0) token.value = result >> 1; else token.extended = result >> 1;
          break;
        }
      }
    } else if (stack.pos == input.length) {
      token.accept(stack.p.parser.eofTerm, stack.pos);
    } else {
      token.accept(0, stack.pos + 1);
    }
  }
  putAction(action, token, end, index) {
    for (let i = 0; i < index; i += 3) if (this.actions[i] == action) return index;
    this.actions[index++] = action;
    this.actions[index++] = token;
    this.actions[index++] = end;
    return index;
  }
  addActions(stack, token, end, index) {
    let {state} = stack, {parser} = stack.p, {data} = parser;
    for (let set = 0; set < 2; set++) {
      for (let i = parser.stateSlot(state, set ? 2 : 1); ; i += 3) {
        if (data[i] == 65535) {
          if (data[i + 1] == 1) {
            i = pair(data, i + 2);
          } else {
            if (index == 0 && data[i + 1] == 2) index = this.putAction(pair(data, i + 1), token, end, index);
            break;
          }
        }
        if (data[i] == token) index = this.putAction(pair(data, i + 1), token, end, index);
      }
    }
    return index;
  }
}
var Rec;
(function (Rec) {
  Rec[Rec["Distance"] = 5] = "Distance";
  Rec[Rec["MaxRemainingPerStep"] = 3] = "MaxRemainingPerStep";
  Rec[Rec["MinBufferLengthPrune"] = 200] = "MinBufferLengthPrune";
  Rec[Rec["ForceReduceLimit"] = 10] = "ForceReduceLimit";
})(Rec || (Rec = {}));
class Parse {
  constructor(parser, input, startPos, context) {
    this.parser = parser;
    this.input = input;
    this.startPos = startPos;
    this.context = context;
    this.pos = 0;
    this.recovering = 0;
    this.nextStackID = 0x2654;
    this.nested = null;
    this.nestEnd = 0;
    this.nestWrap = null;
    this.reused = [];
    this.tokens = new TokenCache(parser);
    this.topTerm = parser.top[1];
    this.stacks = [Stack.start(this, parser.top[0], this.startPos)];
    let fragments = context === null || context === void 0 ? void 0 : context.fragments;
    this.fragments = fragments && fragments.length ? new FragmentCursor(fragments) : null;
  }
  advance() {
    if (this.nested) {
      let result = this.nested.advance();
      this.pos = this.nested.pos;
      if (result) {
        this.finishNested(this.stacks[0], result);
        this.nested = null;
      }
      return null;
    }
    let stacks = this.stacks, pos = this.pos;
    let newStacks = this.stacks = [];
    let stopped, stoppedTokens;
    let maybeNest;
    for (let i = 0; i < stacks.length; i++) {
      let stack = stacks[i], nest;
      for (; ; ) {
        if (stack.pos > pos) {
          newStacks.push(stack);
        } else if (nest = this.checkNest(stack)) {
          if (!maybeNest || maybeNest.stack.score < stack.score) maybeNest = nest;
        } else if (this.advanceStack(stack, newStacks, stacks)) {
          continue;
        } else {
          if (!stopped) {
            stopped = [];
            stoppedTokens = [];
          }
          stopped.push(stack);
          let tok = this.tokens.mainToken;
          stoppedTokens.push(tok.value, tok.end);
        }
        break;
      }
    }
    if (maybeNest) {
      this.startNested(maybeNest);
      return null;
    }
    if (!newStacks.length) {
      let finished = stopped && findFinished(stopped);
      if (finished) return this.stackToTree(finished);
      if (this.parser.strict) {
        if (verbose && stopped) console.log("Stuck with token " + this.parser.getName(this.tokens.mainToken.value));
        throw new SyntaxError("No parse at " + pos);
      }
      if (!this.recovering) this.recovering = 5;
    }
    if (this.recovering && stopped) {
      let finished = this.runRecovery(stopped, stoppedTokens, newStacks);
      if (finished) return this.stackToTree(finished.forceAll());
    }
    if (this.recovering) {
      let maxRemaining = this.recovering == 1 ? 1 : this.recovering * 3;
      if (newStacks.length > maxRemaining) {
        newStacks.sort((a, b) => b.score - a.score);
        while (newStacks.length > maxRemaining) newStacks.pop();
      }
      if (newStacks.some(s => s.reducePos > pos)) this.recovering--;
    } else if (newStacks.length > 1) {
      outer: for (let i = 0; i < newStacks.length - 1; i++) {
        let stack = newStacks[i];
        for (let j = i + 1; j < newStacks.length; j++) {
          let other = newStacks[j];
          if (stack.sameState(other) || stack.buffer.length > 200 && other.buffer.length > 200) {
            if ((stack.score - other.score || stack.buffer.length - other.buffer.length) > 0) {
              newStacks.splice(j--, 1);
            } else {
              newStacks.splice(i--, 1);
              continue outer;
            }
          }
        }
      }
    }
    this.pos = newStacks[0].pos;
    for (let i = 1; i < newStacks.length; i++) if (newStacks[i].pos < this.pos) this.pos = newStacks[i].pos;
    return null;
  }
  advanceStack(stack, stacks, split) {
    let start = stack.pos, {input, parser} = this;
    let base = verbose ? this.stackID(stack) + " -> " : "";
    if (this.fragments) {
      let strictCx = stack.curContext && stack.curContext.tracker.strict, cxHash = strictCx ? stack.curContext.hash : 0;
      for (let cached = this.fragments.nodeAt(start); cached; ) {
        let match = this.parser.nodeSet.types[cached.type.id] == cached.type ? parser.getGoto(stack.state, cached.type.id) : -1;
        if (match > -1 && cached.length && (!strictCx || (cached.contextHash || 0) == cxHash)) {
          stack.useNode(cached, match);
          if (verbose) console.log(base + this.stackID(stack) + ` (via reuse of ${parser.getName(cached.type.id)})`);
          return true;
        }
        if (!(cached instanceof lezer_tree_1.Tree) || cached.children.length == 0 || cached.positions[0] > 0) break;
        let inner = cached.children[0];
        if (inner instanceof lezer_tree_1.Tree) cached = inner; else break;
      }
    }
    let defaultReduce = parser.stateSlot(stack.state, 4);
    if (defaultReduce > 0) {
      stack.reduce(defaultReduce);
      if (verbose) console.log(base + this.stackID(stack) + ` (via always-reduce ${parser.getName(defaultReduce & 65535)})`);
      return true;
    }
    let actions = this.tokens.getActions(stack, input);
    for (let i = 0; i < actions.length; ) {
      let action = actions[i++], term = actions[i++], end = actions[i++];
      let last = i == actions.length || !split;
      let localStack = last ? stack : stack.split();
      localStack.apply(action, term, end);
      if (verbose) console.log(base + this.stackID(localStack) + ` (via ${(action & 65536) == 0 ? "shift" : `reduce of ${parser.getName(action & 65535)}`} for ${parser.getName(term)} @ ${start}${localStack == stack ? "" : ", split"})`);
      if (last) return true; else if (localStack.pos > start) stacks.push(localStack); else split.push(localStack);
    }
    return false;
  }
  advanceFully(stack, newStacks) {
    let pos = stack.pos;
    for (; ; ) {
      let nest = this.checkNest(stack);
      if (nest) return nest;
      if (!this.advanceStack(stack, null, null)) return false;
      if (stack.pos > pos) {
        pushStackDedup(stack, newStacks);
        return true;
      }
    }
  }
  runRecovery(stacks, tokens, newStacks) {
    let finished = null, restarted = false;
    let maybeNest;
    for (let i = 0; i < stacks.length; i++) {
      let stack = stacks[i], token = tokens[i << 1], tokenEnd = tokens[(i << 1) + 1];
      let base = verbose ? this.stackID(stack) + " -> " : "";
      if (stack.deadEnd) {
        if (restarted) continue;
        restarted = true;
        stack.restart();
        if (verbose) console.log(base + this.stackID(stack) + " (restarted)");
        let done = this.advanceFully(stack, newStacks);
        if (done) {
          if (done !== true) maybeNest = done;
          continue;
        }
      }
      let force = stack.split(), forceBase = base;
      for (let j = 0; force.forceReduce() && j < 10; j++) {
        if (verbose) console.log(forceBase + this.stackID(force) + " (via force-reduce)");
        let done = this.advanceFully(force, newStacks);
        if (done) {
          if (done !== true) maybeNest = done;
          break;
        }
        if (verbose) forceBase = this.stackID(force) + " -> ";
      }
      for (let insert of stack.recoverByInsert(token)) {
        if (verbose) console.log(base + this.stackID(insert) + " (via recover-insert)");
        this.advanceFully(insert, newStacks);
      }
      if (this.input.length > stack.pos) {
        if (tokenEnd == stack.pos) {
          tokenEnd++;
          token = 0;
        }
        stack.recoverByDelete(token, tokenEnd);
        if (verbose) console.log(base + this.stackID(stack) + ` (via recover-delete ${this.parser.getName(token)})`);
        pushStackDedup(stack, newStacks);
      } else if (!finished || finished.score < stack.score) {
        finished = stack;
      }
    }
    if (finished) return finished;
    if (maybeNest) for (let s of this.stacks) if (s.score > maybeNest.stack.score) {
      maybeNest = undefined;
      break;
    }
    if (maybeNest) this.startNested(maybeNest);
    return null;
  }
  forceFinish() {
    let stack = this.stacks[0].split();
    if (this.nested) this.finishNested(stack, this.nested.forceFinish());
    return this.stackToTree(stack.forceAll());
  }
  stackToTree(stack, pos = stack.pos) {
    if (this.parser.context) stack.emitContext();
    return lezer_tree_1.Tree.build({
      buffer: StackBufferCursor.create(stack),
      nodeSet: this.parser.nodeSet,
      topID: this.topTerm,
      maxBufferLength: this.parser.bufferLength,
      reused: this.reused,
      start: this.startPos,
      length: pos - this.startPos,
      minRepeatType: this.parser.minRepeatTerm
    });
  }
  checkNest(stack) {
    let info = this.parser.findNested(stack.state);
    if (!info) return null;
    let spec = info.value;
    if (typeof spec == "function") spec = spec(this.input, stack);
    return spec ? {
      stack,
      info,
      spec
    } : null;
  }
  startNested(nest) {
    let {stack, info, spec} = nest;
    this.stacks = [stack];
    this.nestEnd = this.scanForNestEnd(stack, info.end, spec.filterEnd);
    this.nestWrap = typeof spec.wrapType == "number" ? this.parser.nodeSet.types[spec.wrapType] : spec.wrapType || null;
    if (spec.startParse) {
      this.nested = spec.startParse(this.input.clip(this.nestEnd), stack.pos, this.context);
    } else {
      this.finishNested(stack);
    }
  }
  scanForNestEnd(stack, endToken, filter) {
    for (let pos = stack.pos; pos < this.input.length; pos++) {
      dummyToken.start = pos;
      dummyToken.value = -1;
      endToken.token(this.input, dummyToken, stack);
      if (dummyToken.value > -1 && (!filter || filter(this.input.read(pos, dummyToken.end)))) return pos;
    }
    return this.input.length;
  }
  finishNested(stack, tree) {
    if (this.nestWrap) tree = new lezer_tree_1.Tree(this.nestWrap, tree ? [tree] : [], tree ? [0] : [], this.nestEnd - stack.pos); else if (!tree) tree = new lezer_tree_1.Tree(lezer_tree_1.NodeType.none, [], [], this.nestEnd - stack.pos);
    let info = this.parser.findNested(stack.state);
    stack.useNode(tree, this.parser.getGoto(stack.state, info.placeholder, true));
    if (verbose) console.log(this.stackID(stack) + ` (via unnest)`);
  }
  stackID(stack) {
    let id = (stackIDs || (stackIDs = new WeakMap())).get(stack);
    if (!id) stackIDs.set(stack, id = String.fromCodePoint(this.nextStackID++));
    return id + stack;
  }
}
function pushStackDedup(stack, newStacks) {
  for (let i = 0; i < newStacks.length; i++) {
    let other = newStacks[i];
    if (other.pos == stack.pos && other.sameState(stack)) {
      if (newStacks[i].score < stack.score) newStacks[i] = stack;
      return;
    }
  }
  newStacks.push(stack);
}
class Dialect {
  constructor(source, flags, disabled) {
    this.source = source;
    this.flags = flags;
    this.disabled = disabled;
  }
  allows(term) {
    return !this.disabled || this.disabled[term] == 0;
  }
}
const id = x => x;
class ContextTracker {
  constructor(spec) {
    this.start = spec.start;
    this.shift = spec.shift || id;
    this.reduce = spec.reduce || id;
    this.reuse = spec.reuse || id;
    this.hash = spec.hash;
    this.strict = spec.strict !== false;
  }
}
class Parser {
  constructor(spec) {
    this.bufferLength = lezer_tree_1.DefaultBufferLength;
    this.strict = false;
    this.cachedDialect = null;
    if (spec.version != 13) throw new RangeError(`Parser version (${spec.version}) doesn't match runtime version (${13})`);
    let tokenArray = decodeArray(spec.tokenData);
    let nodeNames = spec.nodeNames.split(" ");
    this.minRepeatTerm = nodeNames.length;
    this.context = spec.context;
    for (let i = 0; i < spec.repeatNodeCount; i++) nodeNames.push("");
    let nodeProps = [];
    for (let i = 0; i < nodeNames.length; i++) nodeProps.push([]);
    function setProp(nodeID, prop, value) {
      nodeProps[nodeID].push([prop, prop.deserialize(String(value))]);
    }
    if (spec.nodeProps) for (let propSpec of spec.nodeProps) {
      let prop = propSpec[0];
      for (let i = 1; i < propSpec.length; ) {
        let next = propSpec[i++];
        if (next >= 0) {
          setProp(next, prop, propSpec[i++]);
        } else {
          let value = propSpec[i + -next];
          for (let j = -next; j > 0; j--) setProp(propSpec[i++], prop, value);
          i++;
        }
      }
    }
    this.specialized = new Uint16Array(spec.specialized ? spec.specialized.length : 0);
    this.specializers = [];
    if (spec.specialized) for (let i = 0; i < spec.specialized.length; i++) {
      this.specialized[i] = spec.specialized[i].term;
      this.specializers[i] = spec.specialized[i].get;
    }
    this.states = decodeArray(spec.states, Uint32Array);
    this.data = decodeArray(spec.stateData);
    this.goto = decodeArray(spec.goto);
    let topTerms = Object.keys(spec.topRules).map(r => spec.topRules[r][1]);
    this.nodeSet = new lezer_tree_1.NodeSet(nodeNames.map((name, i) => lezer_tree_1.NodeType.define({
      name: i >= this.minRepeatTerm ? undefined : name,
      id: i,
      props: nodeProps[i],
      top: topTerms.indexOf(i) > -1,
      error: i == 0,
      skipped: spec.skippedNodes && spec.skippedNodes.indexOf(i) > -1
    })));
    this.maxTerm = spec.maxTerm;
    this.tokenizers = spec.tokenizers.map(value => typeof value == "number" ? new TokenGroup(tokenArray, value) : value);
    this.topRules = spec.topRules;
    this.nested = (spec.nested || []).map(([name, value, endToken, placeholder]) => {
      return {
        name,
        value,
        end: new TokenGroup(decodeArray(endToken), 0),
        placeholder
      };
    });
    this.dialects = spec.dialects || ({});
    this.dynamicPrecedences = spec.dynamicPrecedences || null;
    this.tokenPrecTable = spec.tokenPrec;
    this.termNames = spec.termNames || null;
    this.maxNode = this.nodeSet.types.length - 1;
    this.dialect = this.parseDialect();
    this.top = this.topRules[Object.keys(this.topRules)[0]];
  }
  parse(input, startPos = 0, context = {}) {
    if (typeof input == "string") input = lezer_tree_1.stringInput(input);
    let cx = new Parse(this, input, startPos, context);
    for (; ; ) {
      let done = cx.advance();
      if (done) return done;
    }
  }
  startParse(input, startPos = 0, context = {}) {
    if (typeof input == "string") input = lezer_tree_1.stringInput(input);
    return new Parse(this, input, startPos, context);
  }
  getGoto(state, term, loose = false) {
    let table = this.goto;
    if (term >= table[0]) return -1;
    for (let pos = table[term + 1]; ; ) {
      let groupTag = table[pos++], last = groupTag & 1;
      let target = table[pos++];
      if (last && loose) return target;
      for (let end = pos + (groupTag >> 1); pos < end; pos++) if (table[pos] == state) return target;
      if (last) return -1;
    }
  }
  hasAction(state, terminal) {
    let data = this.data;
    for (let set = 0; set < 2; set++) {
      for (let i = this.stateSlot(state, set ? 2 : 1), next; ; i += 3) {
        if ((next = data[i]) == 65535) {
          if (data[i + 1] == 1) next = data[i = pair(data, i + 2)]; else if (data[i + 1] == 2) return pair(data, i + 2); else break;
        }
        if (next == terminal || next == 0) return pair(data, i + 1);
      }
    }
    return 0;
  }
  stateSlot(state, slot) {
    return this.states[state * 6 + slot];
  }
  stateFlag(state, flag) {
    return (this.stateSlot(state, 0) & flag) > 0;
  }
  findNested(state) {
    let flags = this.stateSlot(state, 0);
    return flags & 4 ? this.nested[flags >> 10] : null;
  }
  validAction(state, action) {
    if (action == this.stateSlot(state, 4)) return true;
    for (let i = this.stateSlot(state, 1); ; i += 3) {
      if (this.data[i] == 65535) {
        if (this.data[i + 1] == 1) i = pair(this.data, i + 2); else return false;
      }
      if (action == pair(this.data, i + 1)) return true;
    }
  }
  nextStates(state) {
    let result = [];
    for (let i = this.stateSlot(state, 1); ; i += 3) {
      if (this.data[i] == 65535) {
        if (this.data[i + 1] == 1) i = pair(this.data, i + 2); else break;
      }
      if ((this.data[i + 2] & 65536 >> 16) == 0) {
        let value = this.data[i + 1];
        if (!result.some((v, i) => i & 1 && v == value)) result.push(this.data[i], value);
      }
    }
    return result;
  }
  overrides(token, prev) {
    let iPrev = findOffset(this.data, this.tokenPrecTable, prev);
    return iPrev < 0 || findOffset(this.data, this.tokenPrecTable, token) < iPrev;
  }
  configure(config) {
    let copy = Object.assign(Object.create(Parser.prototype), this);
    if (config.props) copy.nodeSet = this.nodeSet.extend(...config.props);
    if (config.top) {
      let info = this.topRules[config.top];
      if (!info) throw new RangeError(`Invalid top rule name ${config.top}`);
      copy.top = info;
    }
    if (config.tokenizers) copy.tokenizers = this.tokenizers.map(t => {
      let found = config.tokenizers.find(r => r.from == t);
      return found ? found.to : t;
    });
    if (config.dialect) copy.dialect = this.parseDialect(config.dialect);
    if (config.nested) copy.nested = this.nested.map(obj => {
      if (!Object.prototype.hasOwnProperty.call(config.nested, obj.name)) return obj;
      return {
        name: obj.name,
        value: config.nested[obj.name],
        end: obj.end,
        placeholder: obj.placeholder
      };
    });
    if (config.strict != null) copy.strict = config.strict;
    if (config.bufferLength != null) copy.bufferLength = config.bufferLength;
    return copy;
  }
  getName(term) {
    return this.termNames ? this.termNames[term] : String(term <= this.maxNode && this.nodeSet.types[term].name || term);
  }
  get eofTerm() {
    return this.maxNode + 1;
  }
  get hasNested() {
    return this.nested.length > 0;
  }
  get topNode() {
    return this.nodeSet.types[this.top[1]];
  }
  dynamicPrecedence(term) {
    let prec = this.dynamicPrecedences;
    return prec == null ? 0 : prec[term] || 0;
  }
  parseDialect(dialect) {
    if (this.cachedDialect && this.cachedDialect.source == dialect) return this.cachedDialect;
    let values = Object.keys(this.dialects), flags = values.map(() => false);
    if (dialect) for (let part of dialect.split(" ")) {
      let id = values.indexOf(part);
      if (id >= 0) flags[id] = true;
    }
    let disabled = null;
    for (let i = 0; i < values.length; i++) if (!flags[i]) {
      for (let j = this.dialects[values[i]], id; (id = this.data[j++]) != 65535; ) (disabled || (disabled = new Uint8Array(this.maxTerm + 1)))[id] = 1;
    }
    return this.cachedDialect = new Dialect(dialect, flags, disabled);
  }
  static deserialize(spec) {
    return new Parser(spec);
  }
}
function pair(data, off) {
  return data[off] | data[off + 1] << 16;
}
function findOffset(data, start, term) {
  for (let i = start, next; (next = data[i]) != 65535; i++) if (next == term) return i - start;
  return -1;
}
function findFinished(stacks) {
  let best = null;
  for (let stack of stacks) {
    if (stack.pos == stack.p.input.length && stack.p.parser.stateFlag(stack.state, 2) && (!best || best.score < stack.score)) best = stack;
  }
  return best;
}
exports.ContextTracker = ContextTracker;
exports.ExternalTokenizer = ExternalTokenizer;
exports.Parser = Parser;
exports.Stack = Stack;
exports.Token = Token;

},

// node_modules/fuse-box/modules/process/index.js @186
186: function(__fusereq, exports, module){
if (typeof Object.assign != 'function') {
  Object.assign = function (target, varArgs) {
    'use strict';
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object');
    }
    var to = Object(target);
    for (var index = 1; index < arguments.length; index++) {
      var nextSource = arguments[index];
      if (nextSource != null) {
        for (var nextKey in nextSource) {
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }
    return to;
  };
}
var productionEnv = false;
var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;
function cleanUpNextTick() {
  draining = false;
  if (currentQueue.length) {
    queue = currentQueue.concat(queue);
  } else {
    queueIndex = -1;
  }
  if (queue.length) {
    drainQueue();
  }
}
function drainQueue() {
  if (draining) {
    return;
  }
  var timeout = setTimeout(cleanUpNextTick);
  draining = true;
  var len = queue.length;
  while (len) {
    currentQueue = queue;
    queue = [];
    while (++queueIndex < len) {
      if (currentQueue) {
        currentQueue[queueIndex].run();
      }
    }
    queueIndex = -1;
    len = queue.length;
  }
  currentQueue = null;
  draining = false;
  clearTimeout(timeout);
}
process.nextTick = function (fun) {
  var args = new Array(arguments.length - 1);
  if (arguments.length > 1) {
    for (var i = 1; i < arguments.length; i++) {
      args[i - 1] = arguments[i];
    }
  }
  queue.push(new Item(fun, args));
  if (queue.length === 1 && !draining) {
    setTimeout(drainQueue, 0);
  }
};
function Item(fun, array) {
  this.fun = fun;
  this.array = array;
}
Item.prototype.run = function () {
  this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = '';
process.versions = {};
function noop() {}
process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.binding = function (name) {
  throw new Error('process.binding is not supported');
};
process.cwd = function () {
  return '/';
};
process.chdir = function (dir) {
  throw new Error('process.chdir is not supported');
};
process.umask = function () {
  return 0;
};

},

// node_modules/@codemirror/lang-json/dist/index.js @37
37: function(__fusereq, exports, module){
exports.__esModule = true;
var lezer_json_1 = __fusereq(49);
var language_1 = __fusereq(21);
var highlight_1 = __fusereq(20);
const jsonParseLinter = () => view => {
  try {
    JSON.parse(view.state.doc.toString());
  } catch (e) {
    if (!(e instanceof SyntaxError)) throw e;
    const pos = getErrorPosition(e, view.state.doc);
    return [{
      from: pos,
      message: e.message,
      severity: 'error',
      to: pos
    }];
  }
  return [];
};
function getErrorPosition(error, doc) {
  let m;
  if (m = error.message.match(/at position (\d+)/)) return Math.min(+m[1], doc.length);
  if (m = error.message.match(/at line (\d+) column (\d+)/)) return Math.min(doc.line(+m[1]).from + +m[2] - 1, doc.length);
  return 0;
}
const jsonLanguage = language_1.LezerLanguage.define({
  parser: lezer_json_1.parser.configure({
    props: [language_1.indentNodeProp.add({
      Object: language_1.continuedIndent({
        except: /^\s*\}/
      }),
      Array: language_1.continuedIndent({
        except: /^\s*\]/
      })
    }), language_1.foldNodeProp.add({
      "Object Array": language_1.foldInside
    }), highlight_1.styleTags({
      String: highlight_1.tags.string,
      Number: highlight_1.tags.number,
      "True False": highlight_1.tags.bool,
      PropertyName: highlight_1.tags.propertyName,
      null: highlight_1.tags.null,
      ",": highlight_1.tags.separator,
      "[ ]": highlight_1.tags.squareBracket,
      "{ }": highlight_1.tags.brace
    })]
  }),
  languageData: {
    closeBrackets: {
      brackets: ["[", "{", '"']
    },
    indentOnInput: /^\s*[\}\]]$/
  }
});
function json() {
  return new language_1.LanguageSupport(jsonLanguage);
}
exports.json = json;
exports.jsonLanguage = jsonLanguage;
exports.jsonParseLinter = jsonParseLinter;

},

// node_modules/d3-hierarchy/src/index.js @46
46: function(__fusereq, exports, module){
exports.__esModule = true;
var cluster_js_1 = __fusereq(50);
var cluster_js_1d = __fuse.dt(cluster_js_1);
exports.cluster = cluster_js_1d.default;
var index_js_1 = __fusereq(51);
var index_js_1d = __fuse.dt(index_js_1);
exports.hierarchy = index_js_1d.default;
var index_js_2 = __fusereq(52);
var index_js_2d = __fuse.dt(index_js_2);
exports.pack = index_js_2d.default;
var siblings_js_1 = __fusereq(53);
var siblings_js_1d = __fuse.dt(siblings_js_1);
exports.packSiblings = siblings_js_1d.default;
var enclose_js_1 = __fusereq(54);
var enclose_js_1d = __fuse.dt(enclose_js_1);
exports.packEnclose = enclose_js_1d.default;
var partition_js_1 = __fusereq(55);
var partition_js_1d = __fuse.dt(partition_js_1);
exports.partition = partition_js_1d.default;
var stratify_js_1 = __fusereq(56);
var stratify_js_1d = __fuse.dt(stratify_js_1);
exports.stratify = stratify_js_1d.default;
var tree_js_1 = __fusereq(57);
var tree_js_1d = __fuse.dt(tree_js_1);
exports.tree = tree_js_1d.default;
var index_js_3 = __fusereq(58);
var index_js_3d = __fuse.dt(index_js_3);
exports.treemap = index_js_3d.default;
var binary_js_1 = __fusereq(59);
var binary_js_1d = __fuse.dt(binary_js_1);
exports.treemapBinary = binary_js_1d.default;
var dice_js_1 = __fusereq(60);
var dice_js_1d = __fuse.dt(dice_js_1);
exports.treemapDice = dice_js_1d.default;
var slice_js_1 = __fusereq(61);
var slice_js_1d = __fuse.dt(slice_js_1);
exports.treemapSlice = slice_js_1d.default;
var sliceDice_js_1 = __fusereq(62);
var sliceDice_js_1d = __fuse.dt(sliceDice_js_1);
exports.treemapSliceDice = sliceDice_js_1d.default;
var squarify_js_1 = __fusereq(63);
var squarify_js_1d = __fuse.dt(squarify_js_1);
exports.treemapSquarify = squarify_js_1d.default;
var resquarify_js_1 = __fusereq(64);
var resquarify_js_1d = __fuse.dt(resquarify_js_1);
exports.treemapResquarify = resquarify_js_1d.default;

},

// node_modules/d3-hierarchy/src/cluster.js @50
50: function(__fusereq, exports, module){
exports.__esModule = true;
function defaultSeparation(a, b) {
  return a.parent === b.parent ? 1 : 2;
}
function meanX(children) {
  return children.reduce(meanXReduce, 0) / children.length;
}
function meanXReduce(x, c) {
  return x + c.x;
}
function maxY(children) {
  return 1 + children.reduce(maxYReduce, 0);
}
function maxYReduce(y, c) {
  return Math.max(y, c.y);
}
function leafLeft(node) {
  var children;
  while (children = node.children) node = children[0];
  return node;
}
function leafRight(node) {
  var children;
  while (children = node.children) node = children[children.length - 1];
  return node;
}
function __DefaultExport__() {
  var separation = defaultSeparation, dx = 1, dy = 1, nodeSize = false;
  function cluster(root) {
    var previousNode, x = 0;
    root.eachAfter(function (node) {
      var children = node.children;
      if (children) {
        node.x = meanX(children);
        node.y = maxY(children);
      } else {
        node.x = previousNode ? x += separation(node, previousNode) : 0;
        node.y = 0;
        previousNode = node;
      }
    });
    var left = leafLeft(root), right = leafRight(root), x0 = left.x - separation(left, right) / 2, x1 = right.x + separation(right, left) / 2;
    return root.eachAfter(nodeSize ? function (node) {
      node.x = (node.x - root.x) * dx;
      node.y = (root.y - node.y) * dy;
    } : function (node) {
      node.x = (node.x - x0) / (x1 - x0) * dx;
      node.y = (1 - (root.y ? node.y / root.y : 1)) * dy;
    });
  }
  cluster.separation = function (x) {
    return arguments.length ? (separation = x, cluster) : separation;
  };
  cluster.size = function (x) {
    return arguments.length ? (nodeSize = false, dx = +x[0], dy = +x[1], cluster) : nodeSize ? null : [dx, dy];
  };
  cluster.nodeSize = function (x) {
    return arguments.length ? (nodeSize = true, dx = +x[0], dy = +x[1], cluster) : nodeSize ? [dx, dy] : null;
  };
  return cluster;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-hierarchy/src/hierarchy/index.js @51
51: function(__fusereq, exports, module){
exports.__esModule = true;
var count_js_1 = __fusereq(126);
var count_js_1d = __fuse.dt(count_js_1);
var each_js_1 = __fusereq(127);
var each_js_1d = __fuse.dt(each_js_1);
var eachBefore_js_1 = __fusereq(128);
var eachBefore_js_1d = __fuse.dt(eachBefore_js_1);
var eachAfter_js_1 = __fusereq(129);
var eachAfter_js_1d = __fuse.dt(eachAfter_js_1);
var find_js_1 = __fusereq(130);
var find_js_1d = __fuse.dt(find_js_1);
var sum_js_1 = __fusereq(131);
var sum_js_1d = __fuse.dt(sum_js_1);
var sort_js_1 = __fusereq(132);
var sort_js_1d = __fuse.dt(sort_js_1);
var path_js_1 = __fusereq(133);
var path_js_1d = __fuse.dt(path_js_1);
var ancestors_js_1 = __fusereq(134);
var ancestors_js_1d = __fuse.dt(ancestors_js_1);
var descendants_js_1 = __fusereq(135);
var descendants_js_1d = __fuse.dt(descendants_js_1);
var leaves_js_1 = __fusereq(136);
var leaves_js_1d = __fuse.dt(leaves_js_1);
var links_js_1 = __fusereq(137);
var links_js_1d = __fuse.dt(links_js_1);
var iterator_js_1 = __fusereq(138);
var iterator_js_1d = __fuse.dt(iterator_js_1);
function hierarchy(data, children) {
  if (data instanceof Map) {
    data = [undefined, data];
    if (children === undefined) children = mapChildren;
  } else if (children === undefined) {
    children = objectChildren;
  }
  var root = new Node(data), node, nodes = [root], child, childs, i, n;
  while (node = nodes.pop()) {
    if ((childs = children(node.data)) && (n = (childs = Array.from(childs)).length)) {
      node.children = childs;
      for (i = n - 1; i >= 0; --i) {
        nodes.push(child = childs[i] = new Node(childs[i]));
        child.parent = node;
        child.depth = node.depth + 1;
      }
    }
  }
  return root.eachBefore(computeHeight);
}
exports.default = hierarchy;
function node_copy() {
  return hierarchy(this).eachBefore(copyData);
}
function objectChildren(d) {
  return d.children;
}
function mapChildren(d) {
  return Array.isArray(d) ? d[1] : null;
}
function copyData(node) {
  if (node.data.value !== undefined) node.value = node.data.value;
  node.data = node.data.data;
}
function computeHeight(node) {
  var height = 0;
  do node.height = height; while ((node = node.parent) && node.height < ++height);
}
exports.computeHeight = computeHeight;
function Node(data) {
  this.data = data;
  this.depth = this.height = 0;
  this.parent = null;
}
exports.Node = Node;
Node.prototype = hierarchy.prototype = {
  constructor: Node,
  count: count_js_1d.default,
  each: each_js_1d.default,
  eachAfter: eachAfter_js_1d.default,
  eachBefore: eachBefore_js_1d.default,
  find: find_js_1d.default,
  sum: sum_js_1d.default,
  sort: sort_js_1d.default,
  path: path_js_1d.default,
  ancestors: ancestors_js_1d.default,
  descendants: descendants_js_1d.default,
  leaves: leaves_js_1d.default,
  links: links_js_1d.default,
  copy: node_copy,
  [Symbol.iterator]: iterator_js_1d.default
};

},

// node_modules/d3-hierarchy/src/pack/index.js @52
52: function(__fusereq, exports, module){
exports.__esModule = true;
var siblings_js_1 = __fusereq(53);
var accessors_js_1 = __fusereq(139);
var constant_js_1 = __fusereq(140);
var constant_js_1d = __fuse.dt(constant_js_1);
function defaultRadius(d) {
  return Math.sqrt(d.value);
}
function __DefaultExport__() {
  var radius = null, dx = 1, dy = 1, padding = constant_js_1.constantZero;
  function pack(root) {
    (root.x = dx / 2, root.y = dy / 2);
    if (radius) {
      root.eachBefore(radiusLeaf(radius)).eachAfter(packChildren(padding, 0.5)).eachBefore(translateChild(1));
    } else {
      root.eachBefore(radiusLeaf(defaultRadius)).eachAfter(packChildren(constant_js_1.constantZero, 1)).eachAfter(packChildren(padding, root.r / Math.min(dx, dy))).eachBefore(translateChild(Math.min(dx, dy) / (2 * root.r)));
    }
    return root;
  }
  pack.radius = function (x) {
    return arguments.length ? (radius = accessors_js_1.optional(x), pack) : radius;
  };
  pack.size = function (x) {
    return arguments.length ? (dx = +x[0], dy = +x[1], pack) : [dx, dy];
  };
  pack.padding = function (x) {
    return arguments.length ? (padding = typeof x === "function" ? x : constant_js_1d.default(+x), pack) : padding;
  };
  return pack;
}
exports.default = __DefaultExport__;
function radiusLeaf(radius) {
  return function (node) {
    if (!node.children) {
      node.r = Math.max(0, +radius(node) || 0);
    }
  };
}
function packChildren(padding, k) {
  return function (node) {
    if (children = node.children) {
      var children, i, n = children.length, r = padding(node) * k || 0, e;
      if (r) for (i = 0; i < n; ++i) children[i].r += r;
      e = siblings_js_1.packEnclose(children);
      if (r) for (i = 0; i < n; ++i) children[i].r -= r;
      node.r = e + r;
    }
  };
}
function translateChild(k) {
  return function (node) {
    var parent = node.parent;
    node.r *= k;
    if (parent) {
      node.x = parent.x + k * node.x;
      node.y = parent.y + k * node.y;
    }
  };
}

},

// node_modules/d3-hierarchy/src/pack/siblings.js @53
53: function(__fusereq, exports, module){
exports.__esModule = true;
var array_js_1 = __fusereq(125);
var array_js_1d = __fuse.dt(array_js_1);
var enclose_js_1 = __fusereq(54);
var enclose_js_1d = __fuse.dt(enclose_js_1);
function place(b, a, c) {
  var dx = b.x - a.x, x, a2, dy = b.y - a.y, y, b2, d2 = dx * dx + dy * dy;
  if (d2) {
    (a2 = a.r + c.r, a2 *= a2);
    (b2 = b.r + c.r, b2 *= b2);
    if (a2 > b2) {
      x = (d2 + b2 - a2) / (2 * d2);
      y = Math.sqrt(Math.max(0, b2 / d2 - x * x));
      c.x = b.x - x * dx - y * dy;
      c.y = b.y - x * dy + y * dx;
    } else {
      x = (d2 + a2 - b2) / (2 * d2);
      y = Math.sqrt(Math.max(0, a2 / d2 - x * x));
      c.x = a.x + x * dx - y * dy;
      c.y = a.y + x * dy + y * dx;
    }
  } else {
    c.x = a.x + c.r;
    c.y = a.y;
  }
}
function intersects(a, b) {
  var dr = a.r + b.r - 1e-6, dx = b.x - a.x, dy = b.y - a.y;
  return dr > 0 && dr * dr > dx * dx + dy * dy;
}
function score(node) {
  var a = node._, b = node.next._, ab = a.r + b.r, dx = (a.x * b.r + b.x * a.r) / ab, dy = (a.y * b.r + b.y * a.r) / ab;
  return dx * dx + dy * dy;
}
function Node(circle) {
  this._ = circle;
  this.next = null;
  this.previous = null;
}
function packEnclose(circles) {
  if (!(n = (circles = array_js_1d.default(circles)).length)) return 0;
  var a, b, c, n, aa, ca, i, j, k, sj, sk;
  (a = circles[0], a.x = 0, a.y = 0);
  if (!(n > 1)) return a.r;
  (b = circles[1], a.x = -b.r, b.x = a.r, b.y = 0);
  if (!(n > 2)) return a.r + b.r;
  place(b, a, c = circles[2]);
  (a = new Node(a), b = new Node(b), c = new Node(c));
  a.next = c.previous = b;
  b.next = a.previous = c;
  c.next = b.previous = a;
  pack: for (i = 3; i < n; ++i) {
    (place(a._, b._, c = circles[i]), c = new Node(c));
    (j = b.next, k = a.previous, sj = b._.r, sk = a._.r);
    do {
      if (sj <= sk) {
        if (intersects(j._, c._)) {
          (b = j, a.next = b, b.previous = a, --i);
          continue pack;
        }
        (sj += j._.r, j = j.next);
      } else {
        if (intersects(k._, c._)) {
          (a = k, a.next = b, b.previous = a, --i);
          continue pack;
        }
        (sk += k._.r, k = k.previous);
      }
    } while (j !== k.next);
    (c.previous = a, c.next = b, a.next = b.previous = b = c);
    aa = score(a);
    while ((c = c.next) !== b) {
      if ((ca = score(c)) < aa) {
        (a = c, aa = ca);
      }
    }
    b = a.next;
  }
  (a = [b._], c = b);
  while ((c = c.next) !== b) a.push(c._);
  c = enclose_js_1d.default(a);
  for (i = 0; i < n; ++i) (a = circles[i], a.x -= c.x, a.y -= c.y);
  return c.r;
}
exports.packEnclose = packEnclose;
function __DefaultExport__(circles) {
  packEnclose(circles);
  return circles;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-hierarchy/src/pack/enclose.js @54
54: function(__fusereq, exports, module){
exports.__esModule = true;
var array_js_1 = __fusereq(125);
function __DefaultExport__(circles) {
  var i = 0, n = (circles = array_js_1.shuffle(Array.from(circles))).length, B = [], p, e;
  while (i < n) {
    p = circles[i];
    if (e && enclosesWeak(e, p)) ++i; else (e = encloseBasis(B = extendBasis(B, p)), i = 0);
  }
  return e;
}
exports.default = __DefaultExport__;
function extendBasis(B, p) {
  var i, j;
  if (enclosesWeakAll(p, B)) return [p];
  for (i = 0; i < B.length; ++i) {
    if (enclosesNot(p, B[i]) && enclosesWeakAll(encloseBasis2(B[i], p), B)) {
      return [B[i], p];
    }
  }
  for (i = 0; i < B.length - 1; ++i) {
    for (j = i + 1; j < B.length; ++j) {
      if (enclosesNot(encloseBasis2(B[i], B[j]), p) && enclosesNot(encloseBasis2(B[i], p), B[j]) && enclosesNot(encloseBasis2(B[j], p), B[i]) && enclosesWeakAll(encloseBasis3(B[i], B[j], p), B)) {
        return [B[i], B[j], p];
      }
    }
  }
  throw new Error();
}
function enclosesNot(a, b) {
  var dr = a.r - b.r, dx = b.x - a.x, dy = b.y - a.y;
  return dr < 0 || dr * dr < dx * dx + dy * dy;
}
function enclosesWeak(a, b) {
  var dr = a.r - b.r + Math.max(a.r, b.r, 1) * 1e-9, dx = b.x - a.x, dy = b.y - a.y;
  return dr > 0 && dr * dr > dx * dx + dy * dy;
}
function enclosesWeakAll(a, B) {
  for (var i = 0; i < B.length; ++i) {
    if (!enclosesWeak(a, B[i])) {
      return false;
    }
  }
  return true;
}
function encloseBasis(B) {
  switch (B.length) {
    case 1:
      return encloseBasis1(B[0]);
    case 2:
      return encloseBasis2(B[0], B[1]);
    case 3:
      return encloseBasis3(B[0], B[1], B[2]);
  }
}
function encloseBasis1(a) {
  return {
    x: a.x,
    y: a.y,
    r: a.r
  };
}
function encloseBasis2(a, b) {
  var x1 = a.x, y1 = a.y, r1 = a.r, x2 = b.x, y2 = b.y, r2 = b.r, x21 = x2 - x1, y21 = y2 - y1, r21 = r2 - r1, l = Math.sqrt(x21 * x21 + y21 * y21);
  return {
    x: (x1 + x2 + x21 / l * r21) / 2,
    y: (y1 + y2 + y21 / l * r21) / 2,
    r: (l + r1 + r2) / 2
  };
}
function encloseBasis3(a, b, c) {
  var x1 = a.x, y1 = a.y, r1 = a.r, x2 = b.x, y2 = b.y, r2 = b.r, x3 = c.x, y3 = c.y, r3 = c.r, a2 = x1 - x2, a3 = x1 - x3, b2 = y1 - y2, b3 = y1 - y3, c2 = r2 - r1, c3 = r3 - r1, d1 = x1 * x1 + y1 * y1 - r1 * r1, d2 = d1 - x2 * x2 - y2 * y2 + r2 * r2, d3 = d1 - x3 * x3 - y3 * y3 + r3 * r3, ab = a3 * b2 - a2 * b3, xa = (b2 * d3 - b3 * d2) / (ab * 2) - x1, xb = (b3 * c2 - b2 * c3) / ab, ya = (a3 * d2 - a2 * d3) / (ab * 2) - y1, yb = (a2 * c3 - a3 * c2) / ab, A = xb * xb + yb * yb - 1, B = 2 * (r1 + xa * xb + ya * yb), C = xa * xa + ya * ya - r1 * r1, r = -(A ? (B + Math.sqrt(B * B - 4 * A * C)) / (2 * A) : C / B);
  return {
    x: x1 + xa + xb * r,
    y: y1 + ya + yb * r,
    r: r
  };
}

},

// node_modules/d3-hierarchy/src/partition.js @55
55: function(__fusereq, exports, module){
exports.__esModule = true;
var round_js_1 = __fusereq(141);
var round_js_1d = __fuse.dt(round_js_1);
var dice_js_1 = __fusereq(60);
var dice_js_1d = __fuse.dt(dice_js_1);
function __DefaultExport__() {
  var dx = 1, dy = 1, padding = 0, round = false;
  function partition(root) {
    var n = root.height + 1;
    root.x0 = root.y0 = padding;
    root.x1 = dx;
    root.y1 = dy / n;
    root.eachBefore(positionNode(dy, n));
    if (round) root.eachBefore(round_js_1d.default);
    return root;
  }
  function positionNode(dy, n) {
    return function (node) {
      if (node.children) {
        dice_js_1d.default(node, node.x0, dy * (node.depth + 1) / n, node.x1, dy * (node.depth + 2) / n);
      }
      var x0 = node.x0, y0 = node.y0, x1 = node.x1 - padding, y1 = node.y1 - padding;
      if (x1 < x0) x0 = x1 = (x0 + x1) / 2;
      if (y1 < y0) y0 = y1 = (y0 + y1) / 2;
      node.x0 = x0;
      node.y0 = y0;
      node.x1 = x1;
      node.y1 = y1;
    };
  }
  partition.round = function (x) {
    return arguments.length ? (round = !!x, partition) : round;
  };
  partition.size = function (x) {
    return arguments.length ? (dx = +x[0], dy = +x[1], partition) : [dx, dy];
  };
  partition.padding = function (x) {
    return arguments.length ? (padding = +x, partition) : padding;
  };
  return partition;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-hierarchy/src/stratify.js @56
56: function(__fusereq, exports, module){
exports.__esModule = true;
var accessors_js_1 = __fusereq(139);
var index_js_1 = __fusereq(51);
var preroot = {
  depth: -1
}, ambiguous = {};
function defaultId(d) {
  return d.id;
}
function defaultParentId(d) {
  return d.parentId;
}
function __DefaultExport__() {
  var id = defaultId, parentId = defaultParentId;
  function stratify(data) {
    var nodes = Array.from(data), n = nodes.length, d, i, root, parent, node, nodeId, nodeKey, nodeByKey = new Map();
    for (i = 0; i < n; ++i) {
      (d = nodes[i], node = nodes[i] = new index_js_1.Node(d));
      if ((nodeId = id(d, i, data)) != null && (nodeId += "")) {
        nodeKey = node.id = nodeId;
        nodeByKey.set(nodeKey, nodeByKey.has(nodeKey) ? ambiguous : node);
      }
      if ((nodeId = parentId(d, i, data)) != null && (nodeId += "")) {
        node.parent = nodeId;
      }
    }
    for (i = 0; i < n; ++i) {
      node = nodes[i];
      if (nodeId = node.parent) {
        parent = nodeByKey.get(nodeId);
        if (!parent) throw new Error("missing: " + nodeId);
        if (parent === ambiguous) throw new Error("ambiguous: " + nodeId);
        if (parent.children) parent.children.push(node); else parent.children = [node];
        node.parent = parent;
      } else {
        if (root) throw new Error("multiple roots");
        root = node;
      }
    }
    if (!root) throw new Error("no root");
    root.parent = preroot;
    root.eachBefore(function (node) {
      node.depth = node.parent.depth + 1;
      --n;
    }).eachBefore(index_js_1.computeHeight);
    root.parent = null;
    if (n > 0) throw new Error("cycle");
    return root;
  }
  stratify.id = function (x) {
    return arguments.length ? (id = accessors_js_1.required(x), stratify) : id;
  };
  stratify.parentId = function (x) {
    return arguments.length ? (parentId = accessors_js_1.required(x), stratify) : parentId;
  };
  return stratify;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-hierarchy/src/tree.js @57
57: function(__fusereq, exports, module){
exports.__esModule = true;
var index_js_1 = __fusereq(51);
function defaultSeparation(a, b) {
  return a.parent === b.parent ? 1 : 2;
}
function nextLeft(v) {
  var children = v.children;
  return children ? children[0] : v.t;
}
function nextRight(v) {
  var children = v.children;
  return children ? children[children.length - 1] : v.t;
}
function moveSubtree(wm, wp, shift) {
  var change = shift / (wp.i - wm.i);
  wp.c -= change;
  wp.s += shift;
  wm.c += change;
  wp.z += shift;
  wp.m += shift;
}
function executeShifts(v) {
  var shift = 0, change = 0, children = v.children, i = children.length, w;
  while (--i >= 0) {
    w = children[i];
    w.z += shift;
    w.m += shift;
    shift += w.s + (change += w.c);
  }
}
function nextAncestor(vim, v, ancestor) {
  return vim.a.parent === v.parent ? vim.a : ancestor;
}
function TreeNode(node, i) {
  this._ = node;
  this.parent = null;
  this.children = null;
  this.A = null;
  this.a = this;
  this.z = 0;
  this.m = 0;
  this.c = 0;
  this.s = 0;
  this.t = null;
  this.i = i;
}
TreeNode.prototype = Object.create(index_js_1.Node.prototype);
function treeRoot(root) {
  var tree = new TreeNode(root, 0), node, nodes = [tree], child, children, i, n;
  while (node = nodes.pop()) {
    if (children = node._.children) {
      node.children = new Array(n = children.length);
      for (i = n - 1; i >= 0; --i) {
        nodes.push(child = node.children[i] = new TreeNode(children[i], i));
        child.parent = node;
      }
    }
  }
  (tree.parent = new TreeNode(null, 0)).children = [tree];
  return tree;
}
function __DefaultExport__() {
  var separation = defaultSeparation, dx = 1, dy = 1, nodeSize = null;
  function tree(root) {
    var t = treeRoot(root);
    (t.eachAfter(firstWalk), t.parent.m = -t.z);
    t.eachBefore(secondWalk);
    if (nodeSize) root.eachBefore(sizeNode); else {
      var left = root, right = root, bottom = root;
      root.eachBefore(function (node) {
        if (node.x < left.x) left = node;
        if (node.x > right.x) right = node;
        if (node.depth > bottom.depth) bottom = node;
      });
      var s = left === right ? 1 : separation(left, right) / 2, tx = s - left.x, kx = dx / (right.x + s + tx), ky = dy / (bottom.depth || 1);
      root.eachBefore(function (node) {
        node.x = (node.x + tx) * kx;
        node.y = node.depth * ky;
      });
    }
    return root;
  }
  function firstWalk(v) {
    var children = v.children, siblings = v.parent.children, w = v.i ? siblings[v.i - 1] : null;
    if (children) {
      executeShifts(v);
      var midpoint = (children[0].z + children[children.length - 1].z) / 2;
      if (w) {
        v.z = w.z + separation(v._, w._);
        v.m = v.z - midpoint;
      } else {
        v.z = midpoint;
      }
    } else if (w) {
      v.z = w.z + separation(v._, w._);
    }
    v.parent.A = apportion(v, w, v.parent.A || siblings[0]);
  }
  function secondWalk(v) {
    v._.x = v.z + v.parent.m;
    v.m += v.parent.m;
  }
  function apportion(v, w, ancestor) {
    if (w) {
      var vip = v, vop = v, vim = w, vom = vip.parent.children[0], sip = vip.m, sop = vop.m, sim = vim.m, som = vom.m, shift;
      while ((vim = nextRight(vim), vip = nextLeft(vip), vim && vip)) {
        vom = nextLeft(vom);
        vop = nextRight(vop);
        vop.a = v;
        shift = vim.z + sim - vip.z - sip + separation(vim._, vip._);
        if (shift > 0) {
          moveSubtree(nextAncestor(vim, v, ancestor), v, shift);
          sip += shift;
          sop += shift;
        }
        sim += vim.m;
        sip += vip.m;
        som += vom.m;
        sop += vop.m;
      }
      if (vim && !nextRight(vop)) {
        vop.t = vim;
        vop.m += sim - sop;
      }
      if (vip && !nextLeft(vom)) {
        vom.t = vip;
        vom.m += sip - som;
        ancestor = v;
      }
    }
    return ancestor;
  }
  function sizeNode(node) {
    node.x *= dx;
    node.y = node.depth * dy;
  }
  tree.separation = function (x) {
    return arguments.length ? (separation = x, tree) : separation;
  };
  tree.size = function (x) {
    return arguments.length ? (nodeSize = false, dx = +x[0], dy = +x[1], tree) : nodeSize ? null : [dx, dy];
  };
  tree.nodeSize = function (x) {
    return arguments.length ? (nodeSize = true, dx = +x[0], dy = +x[1], tree) : nodeSize ? [dx, dy] : null;
  };
  return tree;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-hierarchy/src/treemap/index.js @58
58: function(__fusereq, exports, module){
exports.__esModule = true;
var round_js_1 = __fusereq(141);
var round_js_1d = __fuse.dt(round_js_1);
var squarify_js_1 = __fusereq(63);
var squarify_js_1d = __fuse.dt(squarify_js_1);
var accessors_js_1 = __fusereq(139);
var constant_js_1 = __fusereq(140);
var constant_js_1d = __fuse.dt(constant_js_1);
function __DefaultExport__() {
  var tile = squarify_js_1d.default, round = false, dx = 1, dy = 1, paddingStack = [0], paddingInner = constant_js_1.constantZero, paddingTop = constant_js_1.constantZero, paddingRight = constant_js_1.constantZero, paddingBottom = constant_js_1.constantZero, paddingLeft = constant_js_1.constantZero;
  function treemap(root) {
    root.x0 = root.y0 = 0;
    root.x1 = dx;
    root.y1 = dy;
    root.eachBefore(positionNode);
    paddingStack = [0];
    if (round) root.eachBefore(round_js_1d.default);
    return root;
  }
  function positionNode(node) {
    var p = paddingStack[node.depth], x0 = node.x0 + p, y0 = node.y0 + p, x1 = node.x1 - p, y1 = node.y1 - p;
    if (x1 < x0) x0 = x1 = (x0 + x1) / 2;
    if (y1 < y0) y0 = y1 = (y0 + y1) / 2;
    node.x0 = x0;
    node.y0 = y0;
    node.x1 = x1;
    node.y1 = y1;
    if (node.children) {
      p = paddingStack[node.depth + 1] = paddingInner(node) / 2;
      x0 += paddingLeft(node) - p;
      y0 += paddingTop(node) - p;
      x1 -= paddingRight(node) - p;
      y1 -= paddingBottom(node) - p;
      if (x1 < x0) x0 = x1 = (x0 + x1) / 2;
      if (y1 < y0) y0 = y1 = (y0 + y1) / 2;
      tile(node, x0, y0, x1, y1);
    }
  }
  treemap.round = function (x) {
    return arguments.length ? (round = !!x, treemap) : round;
  };
  treemap.size = function (x) {
    return arguments.length ? (dx = +x[0], dy = +x[1], treemap) : [dx, dy];
  };
  treemap.tile = function (x) {
    return arguments.length ? (tile = accessors_js_1.required(x), treemap) : tile;
  };
  treemap.padding = function (x) {
    return arguments.length ? treemap.paddingInner(x).paddingOuter(x) : treemap.paddingInner();
  };
  treemap.paddingInner = function (x) {
    return arguments.length ? (paddingInner = typeof x === "function" ? x : constant_js_1d.default(+x), treemap) : paddingInner;
  };
  treemap.paddingOuter = function (x) {
    return arguments.length ? treemap.paddingTop(x).paddingRight(x).paddingBottom(x).paddingLeft(x) : treemap.paddingTop();
  };
  treemap.paddingTop = function (x) {
    return arguments.length ? (paddingTop = typeof x === "function" ? x : constant_js_1d.default(+x), treemap) : paddingTop;
  };
  treemap.paddingRight = function (x) {
    return arguments.length ? (paddingRight = typeof x === "function" ? x : constant_js_1d.default(+x), treemap) : paddingRight;
  };
  treemap.paddingBottom = function (x) {
    return arguments.length ? (paddingBottom = typeof x === "function" ? x : constant_js_1d.default(+x), treemap) : paddingBottom;
  };
  treemap.paddingLeft = function (x) {
    return arguments.length ? (paddingLeft = typeof x === "function" ? x : constant_js_1d.default(+x), treemap) : paddingLeft;
  };
  return treemap;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-hierarchy/src/treemap/binary.js @59
59: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__(parent, x0, y0, x1, y1) {
  var nodes = parent.children, i, n = nodes.length, sum, sums = new Array(n + 1);
  for (sums[0] = sum = i = 0; i < n; ++i) {
    sums[i + 1] = sum += nodes[i].value;
  }
  partition(0, n, parent.value, x0, y0, x1, y1);
  function partition(i, j, value, x0, y0, x1, y1) {
    if (i >= j - 1) {
      var node = nodes[i];
      (node.x0 = x0, node.y0 = y0);
      (node.x1 = x1, node.y1 = y1);
      return;
    }
    var valueOffset = sums[i], valueTarget = value / 2 + valueOffset, k = i + 1, hi = j - 1;
    while (k < hi) {
      var mid = k + hi >>> 1;
      if (sums[mid] < valueTarget) k = mid + 1; else hi = mid;
    }
    if (valueTarget - sums[k - 1] < sums[k] - valueTarget && i + 1 < k) --k;
    var valueLeft = sums[k] - valueOffset, valueRight = value - valueLeft;
    if (x1 - x0 > y1 - y0) {
      var xk = value ? (x0 * valueRight + x1 * valueLeft) / value : x1;
      partition(i, k, valueLeft, x0, y0, xk, y1);
      partition(k, j, valueRight, xk, y0, x1, y1);
    } else {
      var yk = value ? (y0 * valueRight + y1 * valueLeft) / value : y1;
      partition(i, k, valueLeft, x0, y0, x1, yk);
      partition(k, j, valueRight, x0, yk, x1, y1);
    }
  }
}
exports.default = __DefaultExport__;

},

// node_modules/d3-hierarchy/src/treemap/dice.js @60
60: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__(parent, x0, y0, x1, y1) {
  var nodes = parent.children, node, i = -1, n = nodes.length, k = parent.value && (x1 - x0) / parent.value;
  while (++i < n) {
    (node = nodes[i], node.y0 = y0, node.y1 = y1);
    (node.x0 = x0, node.x1 = x0 += node.value * k);
  }
}
exports.default = __DefaultExport__;

},

// node_modules/d3-hierarchy/src/treemap/slice.js @61
61: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__(parent, x0, y0, x1, y1) {
  var nodes = parent.children, node, i = -1, n = nodes.length, k = parent.value && (y1 - y0) / parent.value;
  while (++i < n) {
    (node = nodes[i], node.x0 = x0, node.x1 = x1);
    (node.y0 = y0, node.y1 = y0 += node.value * k);
  }
}
exports.default = __DefaultExport__;

},

// node_modules/d3-hierarchy/src/treemap/sliceDice.js @62
62: function(__fusereq, exports, module){
exports.__esModule = true;
var dice_js_1 = __fusereq(60);
var dice_js_1d = __fuse.dt(dice_js_1);
var slice_js_1 = __fusereq(61);
var slice_js_1d = __fuse.dt(slice_js_1);
function __DefaultExport__(parent, x0, y0, x1, y1) {
  (parent.depth & 1 ? slice_js_1d.default : dice_js_1d.default)(parent, x0, y0, x1, y1);
}
exports.default = __DefaultExport__;

},

// node_modules/d3-hierarchy/src/treemap/squarify.js @63
63: function(__fusereq, exports, module){
exports.__esModule = true;
var dice_js_1 = __fusereq(60);
var dice_js_1d = __fuse.dt(dice_js_1);
var slice_js_1 = __fusereq(61);
var slice_js_1d = __fuse.dt(slice_js_1);
exports.phi = (1 + Math.sqrt(5)) / 2;
function squarifyRatio(ratio, parent, x0, y0, x1, y1) {
  var rows = [], nodes = parent.children, row, nodeValue, i0 = 0, i1 = 0, n = nodes.length, dx, dy, value = parent.value, sumValue, minValue, maxValue, newRatio, minRatio, alpha, beta;
  while (i0 < n) {
    (dx = x1 - x0, dy = y1 - y0);
    do sumValue = nodes[i1++].value; while (!sumValue && i1 < n);
    minValue = maxValue = sumValue;
    alpha = Math.max(dy / dx, dx / dy) / (value * ratio);
    beta = sumValue * sumValue * alpha;
    minRatio = Math.max(maxValue / beta, beta / minValue);
    for (; i1 < n; ++i1) {
      sumValue += nodeValue = nodes[i1].value;
      if (nodeValue < minValue) minValue = nodeValue;
      if (nodeValue > maxValue) maxValue = nodeValue;
      beta = sumValue * sumValue * alpha;
      newRatio = Math.max(maxValue / beta, beta / minValue);
      if (newRatio > minRatio) {
        sumValue -= nodeValue;
        break;
      }
      minRatio = newRatio;
    }
    rows.push(row = {
      value: sumValue,
      dice: dx < dy,
      children: nodes.slice(i0, i1)
    });
    if (row.dice) dice_js_1d.default(row, x0, y0, x1, value ? y0 += dy * sumValue / value : y1); else slice_js_1d.default(row, x0, y0, value ? x0 += dx * sumValue / value : x1, y1);
    (value -= sumValue, i0 = i1);
  }
  return rows;
}
exports.squarifyRatio = squarifyRatio;
exports.default = (function custom(ratio) {
  function squarify(parent, x0, y0, x1, y1) {
    squarifyRatio(ratio, parent, x0, y0, x1, y1);
  }
  squarify.ratio = function (x) {
    return custom((x = +x) > 1 ? x : 1);
  };
  return squarify;
})(exports.phi);

},

// node_modules/d3-hierarchy/src/treemap/resquarify.js @64
64: function(__fusereq, exports, module){
exports.__esModule = true;
var dice_js_1 = __fusereq(60);
var dice_js_1d = __fuse.dt(dice_js_1);
var slice_js_1 = __fusereq(61);
var slice_js_1d = __fuse.dt(slice_js_1);
var squarify_js_1 = __fusereq(63);
exports.default = (function custom(ratio) {
  function resquarify(parent, x0, y0, x1, y1) {
    if ((rows = parent._squarify) && rows.ratio === ratio) {
      var rows, row, nodes, i, j = -1, n, m = rows.length, value = parent.value;
      while (++j < m) {
        (row = rows[j], nodes = row.children);
        for ((i = row.value = 0, n = nodes.length); i < n; ++i) row.value += nodes[i].value;
        if (row.dice) dice_js_1d.default(row, x0, y0, x1, value ? y0 += (y1 - y0) * row.value / value : y1); else slice_js_1d.default(row, x0, y0, value ? x0 += (x1 - x0) * row.value / value : x1, y1);
        value -= row.value;
      }
    } else {
      parent._squarify = rows = squarify_js_1.squarifyRatio(ratio, parent, x0, y0, x1, y1);
      rows.ratio = ratio;
    }
  }
  resquarify.ratio = function (x) {
    return custom((x = +x) > 1 ? x : 1);
  };
  return resquarify;
})(squarify_js_1.phi);

},

// node_modules/d3-hierarchy/src/array.js @125
125: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__(x) {
  return typeof x === "object" && ("length" in x) ? x : Array.from(x);
}
exports.default = __DefaultExport__;
function shuffle(array) {
  var m = array.length, t, i;
  while (m) {
    i = Math.random() * m-- | 0;
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }
  return array;
}
exports.shuffle = shuffle;

},

// node_modules/d3-hierarchy/src/hierarchy/count.js @126
126: function(__fusereq, exports, module){
exports.__esModule = true;
function count(node) {
  var sum = 0, children = node.children, i = children && children.length;
  if (!i) sum = 1; else while (--i >= 0) sum += children[i].value;
  node.value = sum;
}
function __DefaultExport__() {
  return this.eachAfter(count);
}
exports.default = __DefaultExport__;

},

// node_modules/d3-hierarchy/src/hierarchy/each.js @127
127: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__(callback, that) {
  let index = -1;
  for (const node of this) {
    callback.call(that, node, ++index, this);
  }
  return this;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-hierarchy/src/hierarchy/eachBefore.js @128
128: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__(callback, that) {
  var node = this, nodes = [node], children, i, index = -1;
  while (node = nodes.pop()) {
    callback.call(that, node, ++index, this);
    if (children = node.children) {
      for (i = children.length - 1; i >= 0; --i) {
        nodes.push(children[i]);
      }
    }
  }
  return this;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-hierarchy/src/hierarchy/eachAfter.js @129
129: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__(callback, that) {
  var node = this, nodes = [node], next = [], children, i, n, index = -1;
  while (node = nodes.pop()) {
    next.push(node);
    if (children = node.children) {
      for ((i = 0, n = children.length); i < n; ++i) {
        nodes.push(children[i]);
      }
    }
  }
  while (node = next.pop()) {
    callback.call(that, node, ++index, this);
  }
  return this;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-hierarchy/src/hierarchy/find.js @130
130: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__(callback, that) {
  let index = -1;
  for (const node of this) {
    if (callback.call(that, node, ++index, this)) {
      return node;
    }
  }
}
exports.default = __DefaultExport__;

},

// node_modules/d3-hierarchy/src/hierarchy/sum.js @131
131: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__(value) {
  return this.eachAfter(function (node) {
    var sum = +value(node.data) || 0, children = node.children, i = children && children.length;
    while (--i >= 0) sum += children[i].value;
    node.value = sum;
  });
}
exports.default = __DefaultExport__;

},

// node_modules/d3-hierarchy/src/hierarchy/sort.js @132
132: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__(compare) {
  return this.eachBefore(function (node) {
    if (node.children) {
      node.children.sort(compare);
    }
  });
}
exports.default = __DefaultExport__;

},

// node_modules/d3-hierarchy/src/hierarchy/path.js @133
133: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__(end) {
  var start = this, ancestor = leastCommonAncestor(start, end), nodes = [start];
  while (start !== ancestor) {
    start = start.parent;
    nodes.push(start);
  }
  var k = nodes.length;
  while (end !== ancestor) {
    nodes.splice(k, 0, end);
    end = end.parent;
  }
  return nodes;
}
exports.default = __DefaultExport__;
function leastCommonAncestor(a, b) {
  if (a === b) return a;
  var aNodes = a.ancestors(), bNodes = b.ancestors(), c = null;
  a = aNodes.pop();
  b = bNodes.pop();
  while (a === b) {
    c = a;
    a = aNodes.pop();
    b = bNodes.pop();
  }
  return c;
}

},

// node_modules/d3-hierarchy/src/hierarchy/ancestors.js @134
134: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__() {
  var node = this, nodes = [node];
  while (node = node.parent) {
    nodes.push(node);
  }
  return nodes;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-hierarchy/src/hierarchy/descendants.js @135
135: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__() {
  return Array.from(this);
}
exports.default = __DefaultExport__;

},

// node_modules/d3-hierarchy/src/hierarchy/leaves.js @136
136: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__() {
  var leaves = [];
  this.eachBefore(function (node) {
    if (!node.children) {
      leaves.push(node);
    }
  });
  return leaves;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-hierarchy/src/hierarchy/links.js @137
137: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__() {
  var root = this, links = [];
  root.each(function (node) {
    if (node !== root) {
      links.push({
        source: node.parent,
        target: node
      });
    }
  });
  return links;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-hierarchy/src/hierarchy/iterator.js @138
138: function(__fusereq, exports, module){
exports.__esModule = true;
function* __DefaultExport__() {
  var node = this, current, next = [node], children, i, n;
  do {
    (current = next.reverse(), next = []);
    while (node = current.pop()) {
      yield node;
      if (children = node.children) {
        for ((i = 0, n = children.length); i < n; ++i) {
          next.push(children[i]);
        }
      }
    }
  } while (next.length);
}
exports.default = __DefaultExport__;

},

// node_modules/d3-hierarchy/src/accessors.js @139
139: function(__fusereq, exports, module){
function optional(f) {
  return f == null ? null : required(f);
}
exports.optional = optional;
function required(f) {
  if (typeof f !== "function") throw new Error();
  return f;
}
exports.required = required;

},

// node_modules/d3-hierarchy/src/constant.js @140
140: function(__fusereq, exports, module){
exports.__esModule = true;
function constantZero() {
  return 0;
}
exports.constantZero = constantZero;
function __DefaultExport__(x) {
  return function () {
    return x;
  };
}
exports.default = __DefaultExport__;

},

// node_modules/d3-hierarchy/src/treemap/round.js @141
141: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__(node) {
  node.x0 = Math.round(node.x0);
  node.y0 = Math.round(node.y0);
  node.x1 = Math.round(node.x1);
  node.y1 = Math.round(node.y1);
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/index.js @47
47: function(__fusereq, exports, module){
exports.__esModule = true;
var create_js_1 = __fusereq(109);
var create_js_1d = __fuse.dt(create_js_1);
exports.create = create_js_1d.default;
var creator_js_1 = __fusereq(110);
var creator_js_1d = __fuse.dt(creator_js_1);
exports.creator = creator_js_1d.default;
var local_js_1 = __fusereq(111);
var local_js_1d = __fuse.dt(local_js_1);
exports.local = local_js_1d.default;
var matcher_js_1 = __fusereq(112);
var matcher_js_1d = __fuse.dt(matcher_js_1);
exports.matcher = matcher_js_1d.default;
var namespace_js_1 = __fusereq(113);
var namespace_js_1d = __fuse.dt(namespace_js_1);
exports.namespace = namespace_js_1d.default;
var namespaces_js_1 = __fusereq(114);
var namespaces_js_1d = __fuse.dt(namespaces_js_1);
exports.namespaces = namespaces_js_1d.default;
var pointer_js_1 = __fusereq(115);
var pointer_js_1d = __fuse.dt(pointer_js_1);
exports.pointer = pointer_js_1d.default;
var pointers_js_1 = __fusereq(116);
var pointers_js_1d = __fuse.dt(pointers_js_1);
exports.pointers = pointers_js_1d.default;
var select_js_1 = __fusereq(117);
var select_js_1d = __fuse.dt(select_js_1);
exports.select = select_js_1d.default;
var selectAll_js_1 = __fusereq(118);
var selectAll_js_1d = __fuse.dt(selectAll_js_1);
exports.selectAll = selectAll_js_1d.default;
var index_js_1 = __fusereq(119);
var index_js_1d = __fuse.dt(index_js_1);
exports.selection = index_js_1d.default;
var selector_js_1 = __fusereq(120);
var selector_js_1d = __fuse.dt(selector_js_1);
exports.selector = selector_js_1d.default;
var selectorAll_js_1 = __fusereq(121);
var selectorAll_js_1d = __fuse.dt(selectorAll_js_1);
exports.selectorAll = selectorAll_js_1d.default;
var style_js_1 = __fusereq(122);
exports.style = style_js_1.styleValue;
var window_js_1 = __fusereq(123);
var window_js_1d = __fuse.dt(window_js_1);
exports.window = window_js_1d.default;

},

// node_modules/d3-selection/src/create.js @109
109: function(__fusereq, exports, module){
exports.__esModule = true;
var creator_js_1 = __fusereq(110);
var creator_js_1d = __fuse.dt(creator_js_1);
var select_js_1 = __fusereq(117);
var select_js_1d = __fuse.dt(select_js_1);
function __DefaultExport__(name) {
  return select_js_1d.default(creator_js_1d.default(name).call(document.documentElement));
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/creator.js @110
110: function(__fusereq, exports, module){
exports.__esModule = true;
var namespace_js_1 = __fusereq(113);
var namespace_js_1d = __fuse.dt(namespace_js_1);
var namespaces_js_1 = __fusereq(114);
function creatorInherit(name) {
  return function () {
    var document = this.ownerDocument, uri = this.namespaceURI;
    return uri === namespaces_js_1.xhtml && document.documentElement.namespaceURI === namespaces_js_1.xhtml ? document.createElement(name) : document.createElementNS(uri, name);
  };
}
function creatorFixed(fullname) {
  return function () {
    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
  };
}
function __DefaultExport__(name) {
  var fullname = namespace_js_1d.default(name);
  return (fullname.local ? creatorFixed : creatorInherit)(fullname);
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/local.js @111
111: function(__fusereq, exports, module){
exports.__esModule = true;
var nextId = 0;
function local() {
  return new Local();
}
exports.default = local;
function Local() {
  this._ = "@" + (++nextId).toString(36);
}
Local.prototype = local.prototype = {
  constructor: Local,
  get: function (node) {
    var id = this._;
    while (!((id in node))) if (!(node = node.parentNode)) return;
    return node[id];
  },
  set: function (node, value) {
    return node[this._] = value;
  },
  remove: function (node) {
    return (this._ in node) && delete node[this._];
  },
  toString: function () {
    return this._;
  }
};

},

// node_modules/d3-selection/src/matcher.js @112
112: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__(selector) {
  return function () {
    return this.matches(selector);
  };
}
exports.default = __DefaultExport__;
function childMatcher(selector) {
  return function (node) {
    return node.matches(selector);
  };
}
exports.childMatcher = childMatcher;

},

// node_modules/d3-selection/src/namespace.js @113
113: function(__fusereq, exports, module){
exports.__esModule = true;
var namespaces_js_1 = __fusereq(114);
var namespaces_js_1d = __fuse.dt(namespaces_js_1);
function __DefaultExport__(name) {
  var prefix = name += "", i = prefix.indexOf(":");
  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
  return namespaces_js_1d.default.hasOwnProperty(prefix) ? {
    space: namespaces_js_1d.default[prefix],
    local: name
  } : name;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/namespaces.js @114
114: function(__fusereq, exports, module){
exports.__esModule = true;
exports.xhtml = "http://www.w3.org/1999/xhtml";
exports.default = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: exports.xhtml,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};

},

// node_modules/d3-selection/src/pointer.js @115
115: function(__fusereq, exports, module){
exports.__esModule = true;
var sourceEvent_js_1 = __fusereq(151);
var sourceEvent_js_1d = __fuse.dt(sourceEvent_js_1);
function __DefaultExport__(event, node) {
  event = sourceEvent_js_1d.default(event);
  if (node === undefined) node = event.currentTarget;
  if (node) {
    var svg = node.ownerSVGElement || node;
    if (svg.createSVGPoint) {
      var point = svg.createSVGPoint();
      (point.x = event.clientX, point.y = event.clientY);
      point = point.matrixTransform(node.getScreenCTM().inverse());
      return [point.x, point.y];
    }
    if (node.getBoundingClientRect) {
      var rect = node.getBoundingClientRect();
      return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
    }
  }
  return [event.pageX, event.pageY];
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/pointers.js @116
116: function(__fusereq, exports, module){
exports.__esModule = true;
var pointer_js_1 = __fusereq(115);
var pointer_js_1d = __fuse.dt(pointer_js_1);
var sourceEvent_js_1 = __fusereq(151);
var sourceEvent_js_1d = __fuse.dt(sourceEvent_js_1);
function __DefaultExport__(events, node) {
  if (events.target) {
    events = sourceEvent_js_1d.default(events);
    if (node === undefined) node = events.currentTarget;
    events = events.touches || [events];
  }
  return Array.from(events, event => pointer_js_1d.default(event, node));
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/select.js @117
117: function(__fusereq, exports, module){
exports.__esModule = true;
var index_js_1 = __fusereq(119);
function __DefaultExport__(selector) {
  return typeof selector === "string" ? new index_js_1.Selection([[document.querySelector(selector)]], [document.documentElement]) : new index_js_1.Selection([[selector]], index_js_1.root);
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selectAll.js @118
118: function(__fusereq, exports, module){
exports.__esModule = true;
var array_js_1 = __fusereq(152);
var array_js_1d = __fuse.dt(array_js_1);
var index_js_1 = __fusereq(119);
function __DefaultExport__(selector) {
  return typeof selector === "string" ? new index_js_1.Selection([document.querySelectorAll(selector)], [document.documentElement]) : new index_js_1.Selection([selector == null ? [] : array_js_1d.default(selector)], index_js_1.root);
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/index.js @119
119: function(__fusereq, exports, module){
exports.__esModule = true;
var select_js_1 = __fusereq(153);
var select_js_1d = __fuse.dt(select_js_1);
var selectAll_js_1 = __fusereq(154);
var selectAll_js_1d = __fuse.dt(selectAll_js_1);
var selectChild_js_1 = __fusereq(155);
var selectChild_js_1d = __fuse.dt(selectChild_js_1);
var selectChildren_js_1 = __fusereq(156);
var selectChildren_js_1d = __fuse.dt(selectChildren_js_1);
var filter_js_1 = __fusereq(157);
var filter_js_1d = __fuse.dt(filter_js_1);
var data_js_1 = __fusereq(158);
var data_js_1d = __fuse.dt(data_js_1);
var enter_js_1 = __fusereq(159);
var enter_js_1d = __fuse.dt(enter_js_1);
var exit_js_1 = __fusereq(160);
var exit_js_1d = __fuse.dt(exit_js_1);
var join_js_1 = __fusereq(161);
var join_js_1d = __fuse.dt(join_js_1);
var merge_js_1 = __fusereq(162);
var merge_js_1d = __fuse.dt(merge_js_1);
var order_js_1 = __fusereq(163);
var order_js_1d = __fuse.dt(order_js_1);
var sort_js_1 = __fusereq(164);
var sort_js_1d = __fuse.dt(sort_js_1);
var call_js_1 = __fusereq(165);
var call_js_1d = __fuse.dt(call_js_1);
var nodes_js_1 = __fusereq(166);
var nodes_js_1d = __fuse.dt(nodes_js_1);
var node_js_1 = __fusereq(167);
var node_js_1d = __fuse.dt(node_js_1);
var size_js_1 = __fusereq(168);
var size_js_1d = __fuse.dt(size_js_1);
var empty_js_1 = __fusereq(169);
var empty_js_1d = __fuse.dt(empty_js_1);
var each_js_1 = __fusereq(170);
var each_js_1d = __fuse.dt(each_js_1);
var attr_js_1 = __fusereq(171);
var attr_js_1d = __fuse.dt(attr_js_1);
var style_js_1 = __fusereq(122);
var style_js_1d = __fuse.dt(style_js_1);
var property_js_1 = __fusereq(172);
var property_js_1d = __fuse.dt(property_js_1);
var classed_js_1 = __fusereq(173);
var classed_js_1d = __fuse.dt(classed_js_1);
var text_js_1 = __fusereq(174);
var text_js_1d = __fuse.dt(text_js_1);
var html_js_1 = __fusereq(175);
var html_js_1d = __fuse.dt(html_js_1);
var raise_js_1 = __fusereq(176);
var raise_js_1d = __fuse.dt(raise_js_1);
var lower_js_1 = __fusereq(177);
var lower_js_1d = __fuse.dt(lower_js_1);
var append_js_1 = __fusereq(178);
var append_js_1d = __fuse.dt(append_js_1);
var insert_js_1 = __fusereq(179);
var insert_js_1d = __fuse.dt(insert_js_1);
var remove_js_1 = __fusereq(180);
var remove_js_1d = __fuse.dt(remove_js_1);
var clone_js_1 = __fusereq(181);
var clone_js_1d = __fuse.dt(clone_js_1);
var datum_js_1 = __fusereq(182);
var datum_js_1d = __fuse.dt(datum_js_1);
var on_js_1 = __fusereq(183);
var on_js_1d = __fuse.dt(on_js_1);
var dispatch_js_1 = __fusereq(184);
var dispatch_js_1d = __fuse.dt(dispatch_js_1);
var iterator_js_1 = __fusereq(185);
var iterator_js_1d = __fuse.dt(iterator_js_1);
exports.root = [null];
function Selection(groups, parents) {
  this._groups = groups;
  this._parents = parents;
}
exports.Selection = Selection;
function selection() {
  return new Selection([[document.documentElement]], exports.root);
}
function selection_selection() {
  return this;
}
Selection.prototype = selection.prototype = {
  constructor: Selection,
  select: select_js_1d.default,
  selectAll: selectAll_js_1d.default,
  selectChild: selectChild_js_1d.default,
  selectChildren: selectChildren_js_1d.default,
  filter: filter_js_1d.default,
  data: data_js_1d.default,
  enter: enter_js_1d.default,
  exit: exit_js_1d.default,
  join: join_js_1d.default,
  merge: merge_js_1d.default,
  selection: selection_selection,
  order: order_js_1d.default,
  sort: sort_js_1d.default,
  call: call_js_1d.default,
  nodes: nodes_js_1d.default,
  node: node_js_1d.default,
  size: size_js_1d.default,
  empty: empty_js_1d.default,
  each: each_js_1d.default,
  attr: attr_js_1d.default,
  style: style_js_1d.default,
  property: property_js_1d.default,
  classed: classed_js_1d.default,
  text: text_js_1d.default,
  html: html_js_1d.default,
  raise: raise_js_1d.default,
  lower: lower_js_1d.default,
  append: append_js_1d.default,
  insert: insert_js_1d.default,
  remove: remove_js_1d.default,
  clone: clone_js_1d.default,
  datum: datum_js_1d.default,
  on: on_js_1d.default,
  dispatch: dispatch_js_1d.default,
  [Symbol.iterator]: iterator_js_1d.default
};
exports.default = selection;

},

// node_modules/d3-selection/src/selector.js @120
120: function(__fusereq, exports, module){
exports.__esModule = true;
function none() {}
function __DefaultExport__(selector) {
  return selector == null ? none : function () {
    return this.querySelector(selector);
  };
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selectorAll.js @121
121: function(__fusereq, exports, module){
exports.__esModule = true;
function empty() {
  return [];
}
function __DefaultExport__(selector) {
  return selector == null ? empty : function () {
    return this.querySelectorAll(selector);
  };
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/style.js @122
122: function(__fusereq, exports, module){
exports.__esModule = true;
var window_js_1 = __fusereq(123);
var window_js_1d = __fuse.dt(window_js_1);
function styleRemove(name) {
  return function () {
    this.style.removeProperty(name);
  };
}
function styleConstant(name, value, priority) {
  return function () {
    this.style.setProperty(name, value, priority);
  };
}
function styleFunction(name, value, priority) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) this.style.removeProperty(name); else this.style.setProperty(name, v, priority);
  };
}
function __DefaultExport__(name, value, priority) {
  return arguments.length > 1 ? this.each((value == null ? styleRemove : typeof value === "function" ? styleFunction : styleConstant)(name, value, priority == null ? "" : priority)) : styleValue(this.node(), name);
}
exports.default = __DefaultExport__;
function styleValue(node, name) {
  return node.style.getPropertyValue(name) || window_js_1d.default(node).getComputedStyle(node, null).getPropertyValue(name);
}
exports.styleValue = styleValue;

},

// node_modules/d3-selection/src/window.js @123
123: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__(node) {
  return node.ownerDocument && node.ownerDocument.defaultView || node.document && node || node.defaultView;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/sourceEvent.js @151
151: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__(event) {
  let sourceEvent;
  while (sourceEvent = event.sourceEvent) event = sourceEvent;
  return event;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/array.js @152
152: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__(x) {
  return typeof x === "object" && ("length" in x) ? x : Array.from(x);
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/select.js @153
153: function(__fusereq, exports, module){
exports.__esModule = true;
var index_js_1 = __fusereq(119);
var selector_js_1 = __fusereq(120);
var selector_js_1d = __fuse.dt(selector_js_1);
function __DefaultExport__(select) {
  if (typeof select !== "function") select = selector_js_1d.default(select);
  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if (("__data__" in node)) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
      }
    }
  }
  return new index_js_1.Selection(subgroups, this._parents);
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/selectAll.js @154
154: function(__fusereq, exports, module){
exports.__esModule = true;
var index_js_1 = __fusereq(119);
var array_js_1 = __fusereq(152);
var array_js_1d = __fuse.dt(array_js_1);
var selectorAll_js_1 = __fusereq(121);
var selectorAll_js_1d = __fuse.dt(selectorAll_js_1);
function arrayAll(select) {
  return function () {
    var group = select.apply(this, arguments);
    return group == null ? [] : array_js_1d.default(group);
  };
}
function __DefaultExport__(select) {
  if (typeof select === "function") select = arrayAll(select); else select = selectorAll_js_1d.default(select);
  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        subgroups.push(select.call(node, node.__data__, i, group));
        parents.push(node);
      }
    }
  }
  return new index_js_1.Selection(subgroups, parents);
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/selectChild.js @155
155: function(__fusereq, exports, module){
exports.__esModule = true;
var matcher_js_1 = __fusereq(112);
var find = Array.prototype.find;
function childFind(match) {
  return function () {
    return find.call(this.children, match);
  };
}
function childFirst() {
  return this.firstElementChild;
}
function __DefaultExport__(match) {
  return this.select(match == null ? childFirst : childFind(typeof match === "function" ? match : matcher_js_1.childMatcher(match)));
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/selectChildren.js @156
156: function(__fusereq, exports, module){
exports.__esModule = true;
var matcher_js_1 = __fusereq(112);
var filter = Array.prototype.filter;
function children() {
  return this.children;
}
function childrenFilter(match) {
  return function () {
    return filter.call(this.children, match);
  };
}
function __DefaultExport__(match) {
  return this.selectAll(match == null ? children : childrenFilter(typeof match === "function" ? match : matcher_js_1.childMatcher(match)));
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/filter.js @157
157: function(__fusereq, exports, module){
exports.__esModule = true;
var index_js_1 = __fusereq(119);
var matcher_js_1 = __fusereq(112);
var matcher_js_1d = __fuse.dt(matcher_js_1);
function __DefaultExport__(match) {
  if (typeof match !== "function") match = matcher_js_1d.default(match);
  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }
  return new index_js_1.Selection(subgroups, this._parents);
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/data.js @158
158: function(__fusereq, exports, module){
exports.__esModule = true;
var index_js_1 = __fusereq(119);
var enter_js_1 = __fusereq(159);
var array_js_1 = __fusereq(152);
var array_js_1d = __fuse.dt(array_js_1);
var constant_js_1 = __fusereq(188);
var constant_js_1d = __fuse.dt(constant_js_1);
function bindIndex(parent, group, enter, update, exit, data) {
  var i = 0, node, groupLength = group.length, dataLength = data.length;
  for (; i < dataLength; ++i) {
    if (node = group[i]) {
      node.__data__ = data[i];
      update[i] = node;
    } else {
      enter[i] = new enter_js_1.EnterNode(parent, data[i]);
    }
  }
  for (; i < groupLength; ++i) {
    if (node = group[i]) {
      exit[i] = node;
    }
  }
}
function bindKey(parent, group, enter, update, exit, data, key) {
  var i, node, nodeByKeyValue = new Map(), groupLength = group.length, dataLength = data.length, keyValues = new Array(groupLength), keyValue;
  for (i = 0; i < groupLength; ++i) {
    if (node = group[i]) {
      keyValues[i] = keyValue = key.call(node, node.__data__, i, group) + "";
      if (nodeByKeyValue.has(keyValue)) {
        exit[i] = node;
      } else {
        nodeByKeyValue.set(keyValue, node);
      }
    }
  }
  for (i = 0; i < dataLength; ++i) {
    keyValue = key.call(parent, data[i], i, data) + "";
    if (node = nodeByKeyValue.get(keyValue)) {
      update[i] = node;
      node.__data__ = data[i];
      nodeByKeyValue.delete(keyValue);
    } else {
      enter[i] = new enter_js_1.EnterNode(parent, data[i]);
    }
  }
  for (i = 0; i < groupLength; ++i) {
    if ((node = group[i]) && nodeByKeyValue.get(keyValues[i]) === node) {
      exit[i] = node;
    }
  }
}
function datum(node) {
  return node.__data__;
}
function __DefaultExport__(value, key) {
  if (!arguments.length) return Array.from(this, datum);
  var bind = key ? bindKey : bindIndex, parents = this._parents, groups = this._groups;
  if (typeof value !== "function") value = constant_js_1d.default(value);
  for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
    var parent = parents[j], group = groups[j], groupLength = group.length, data = array_js_1d.default(value.call(parent, parent && parent.__data__, j, parents)), dataLength = data.length, enterGroup = enter[j] = new Array(dataLength), updateGroup = update[j] = new Array(dataLength), exitGroup = exit[j] = new Array(groupLength);
    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);
    for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
      if (previous = enterGroup[i0]) {
        if (i0 >= i1) i1 = i0 + 1;
        while (!(next = updateGroup[i1]) && ++i1 < dataLength) ;
        previous._next = next || null;
      }
    }
  }
  update = new index_js_1.Selection(update, parents);
  update._enter = enter;
  update._exit = exit;
  return update;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/enter.js @159
159: function(__fusereq, exports, module){
exports.__esModule = true;
var sparse_js_1 = __fusereq(189);
var sparse_js_1d = __fuse.dt(sparse_js_1);
var index_js_1 = __fusereq(119);
function __DefaultExport__() {
  return new index_js_1.Selection(this._enter || this._groups.map(sparse_js_1d.default), this._parents);
}
exports.default = __DefaultExport__;
function EnterNode(parent, datum) {
  this.ownerDocument = parent.ownerDocument;
  this.namespaceURI = parent.namespaceURI;
  this._next = null;
  this._parent = parent;
  this.__data__ = datum;
}
exports.EnterNode = EnterNode;
EnterNode.prototype = {
  constructor: EnterNode,
  appendChild: function (child) {
    return this._parent.insertBefore(child, this._next);
  },
  insertBefore: function (child, next) {
    return this._parent.insertBefore(child, next);
  },
  querySelector: function (selector) {
    return this._parent.querySelector(selector);
  },
  querySelectorAll: function (selector) {
    return this._parent.querySelectorAll(selector);
  }
};

},

// node_modules/d3-selection/src/selection/exit.js @160
160: function(__fusereq, exports, module){
exports.__esModule = true;
var sparse_js_1 = __fusereq(189);
var sparse_js_1d = __fuse.dt(sparse_js_1);
var index_js_1 = __fusereq(119);
function __DefaultExport__() {
  return new index_js_1.Selection(this._exit || this._groups.map(sparse_js_1d.default), this._parents);
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/join.js @161
161: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__(onenter, onupdate, onexit) {
  var enter = this.enter(), update = this, exit = this.exit();
  enter = typeof onenter === "function" ? onenter(enter) : enter.append(onenter + "");
  if (onupdate != null) update = onupdate(update);
  if (onexit == null) exit.remove(); else onexit(exit);
  return enter && update ? enter.merge(update).order() : update;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/merge.js @162
162: function(__fusereq, exports, module){
exports.__esModule = true;
var index_js_1 = __fusereq(119);
function __DefaultExport__(selection) {
  if (!(selection instanceof index_js_1.Selection)) throw new Error("invalid merge");
  for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }
  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }
  return new index_js_1.Selection(merges, this._parents);
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/order.js @163
163: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__() {
  for (var groups = this._groups, j = -1, m = groups.length; ++j < m; ) {
    for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0; ) {
      if (node = group[i]) {
        if (next && node.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }
  return this;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/sort.js @164
164: function(__fusereq, exports, module){
exports.__esModule = true;
var index_js_1 = __fusereq(119);
function __DefaultExport__(compare) {
  if (!compare) compare = ascending;
  function compareNode(a, b) {
    return a && b ? compare(a.__data__, b.__data__) : !a - !b;
  }
  for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        sortgroup[i] = node;
      }
    }
    sortgroup.sort(compareNode);
  }
  return new index_js_1.Selection(sortgroups, this._parents).order();
}
exports.default = __DefaultExport__;
function ascending(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

},

// node_modules/d3-selection/src/selection/call.js @165
165: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__() {
  var callback = arguments[0];
  arguments[0] = this;
  callback.apply(null, arguments);
  return this;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/nodes.js @166
166: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__() {
  return Array.from(this);
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/node.js @167
167: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__() {
  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
      var node = group[i];
      if (node) return node;
    }
  }
  return null;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/size.js @168
168: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__() {
  let size = 0;
  for (const node of this) ++size;
  return size;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/empty.js @169
169: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__() {
  return !this.node();
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/each.js @170
170: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__(callback) {
  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if (node = group[i]) callback.call(node, node.__data__, i, group);
    }
  }
  return this;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/attr.js @171
171: function(__fusereq, exports, module){
exports.__esModule = true;
var namespace_js_1 = __fusereq(113);
var namespace_js_1d = __fuse.dt(namespace_js_1);
function attrRemove(name) {
  return function () {
    this.removeAttribute(name);
  };
}
function attrRemoveNS(fullname) {
  return function () {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}
function attrConstant(name, value) {
  return function () {
    this.setAttribute(name, value);
  };
}
function attrConstantNS(fullname, value) {
  return function () {
    this.setAttributeNS(fullname.space, fullname.local, value);
  };
}
function attrFunction(name, value) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttribute(name); else this.setAttribute(name, v);
  };
}
function attrFunctionNS(fullname, value) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttributeNS(fullname.space, fullname.local); else this.setAttributeNS(fullname.space, fullname.local, v);
  };
}
function __DefaultExport__(name, value) {
  var fullname = namespace_js_1d.default(name);
  if (arguments.length < 2) {
    var node = this.node();
    return fullname.local ? node.getAttributeNS(fullname.space, fullname.local) : node.getAttribute(fullname);
  }
  return this.each((value == null ? fullname.local ? attrRemoveNS : attrRemove : typeof value === "function" ? fullname.local ? attrFunctionNS : attrFunction : fullname.local ? attrConstantNS : attrConstant)(fullname, value));
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/property.js @172
172: function(__fusereq, exports, module){
exports.__esModule = true;
function propertyRemove(name) {
  return function () {
    delete this[name];
  };
}
function propertyConstant(name, value) {
  return function () {
    this[name] = value;
  };
}
function propertyFunction(name, value) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) delete this[name]; else this[name] = v;
  };
}
function __DefaultExport__(name, value) {
  return arguments.length > 1 ? this.each((value == null ? propertyRemove : typeof value === "function" ? propertyFunction : propertyConstant)(name, value)) : this.node()[name];
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/classed.js @173
173: function(__fusereq, exports, module){
exports.__esModule = true;
function classArray(string) {
  return string.trim().split(/^|\s+/);
}
function classList(node) {
  return node.classList || new ClassList(node);
}
function ClassList(node) {
  this._node = node;
  this._names = classArray(node.getAttribute("class") || "");
}
ClassList.prototype = {
  add: function (name) {
    var i = this._names.indexOf(name);
    if (i < 0) {
      this._names.push(name);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  remove: function (name) {
    var i = this._names.indexOf(name);
    if (i >= 0) {
      this._names.splice(i, 1);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  contains: function (name) {
    return this._names.indexOf(name) >= 0;
  }
};
function classedAdd(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n) list.add(names[i]);
}
function classedRemove(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n) list.remove(names[i]);
}
function classedTrue(names) {
  return function () {
    classedAdd(this, names);
  };
}
function classedFalse(names) {
  return function () {
    classedRemove(this, names);
  };
}
function classedFunction(names, value) {
  return function () {
    (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
  };
}
function __DefaultExport__(name, value) {
  var names = classArray(name + "");
  if (arguments.length < 2) {
    var list = classList(this.node()), i = -1, n = names.length;
    while (++i < n) if (!list.contains(names[i])) return false;
    return true;
  }
  return this.each((typeof value === "function" ? classedFunction : value ? classedTrue : classedFalse)(names, value));
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/text.js @174
174: function(__fusereq, exports, module){
exports.__esModule = true;
function textRemove() {
  this.textContent = "";
}
function textConstant(value) {
  return function () {
    this.textContent = value;
  };
}
function textFunction(value) {
  return function () {
    var v = value.apply(this, arguments);
    this.textContent = v == null ? "" : v;
  };
}
function __DefaultExport__(value) {
  return arguments.length ? this.each(value == null ? textRemove : (typeof value === "function" ? textFunction : textConstant)(value)) : this.node().textContent;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/html.js @175
175: function(__fusereq, exports, module){
exports.__esModule = true;
function htmlRemove() {
  this.innerHTML = "";
}
function htmlConstant(value) {
  return function () {
    this.innerHTML = value;
  };
}
function htmlFunction(value) {
  return function () {
    var v = value.apply(this, arguments);
    this.innerHTML = v == null ? "" : v;
  };
}
function __DefaultExport__(value) {
  return arguments.length ? this.each(value == null ? htmlRemove : (typeof value === "function" ? htmlFunction : htmlConstant)(value)) : this.node().innerHTML;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/raise.js @176
176: function(__fusereq, exports, module){
exports.__esModule = true;
function raise() {
  if (this.nextSibling) this.parentNode.appendChild(this);
}
function __DefaultExport__() {
  return this.each(raise);
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/lower.js @177
177: function(__fusereq, exports, module){
exports.__esModule = true;
function lower() {
  if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
}
function __DefaultExport__() {
  return this.each(lower);
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/append.js @178
178: function(__fusereq, exports, module){
exports.__esModule = true;
var creator_js_1 = __fusereq(110);
var creator_js_1d = __fuse.dt(creator_js_1);
function __DefaultExport__(name) {
  var create = typeof name === "function" ? name : creator_js_1d.default(name);
  return this.select(function () {
    return this.appendChild(create.apply(this, arguments));
  });
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/insert.js @179
179: function(__fusereq, exports, module){
exports.__esModule = true;
var creator_js_1 = __fusereq(110);
var creator_js_1d = __fuse.dt(creator_js_1);
var selector_js_1 = __fusereq(120);
var selector_js_1d = __fuse.dt(selector_js_1);
function constantNull() {
  return null;
}
function __DefaultExport__(name, before) {
  var create = typeof name === "function" ? name : creator_js_1d.default(name), select = before == null ? constantNull : typeof before === "function" ? before : selector_js_1d.default(before);
  return this.select(function () {
    return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
  });
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/remove.js @180
180: function(__fusereq, exports, module){
exports.__esModule = true;
function remove() {
  var parent = this.parentNode;
  if (parent) parent.removeChild(this);
}
function __DefaultExport__() {
  return this.each(remove);
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/clone.js @181
181: function(__fusereq, exports, module){
exports.__esModule = true;
function selection_cloneShallow() {
  var clone = this.cloneNode(false), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}
function selection_cloneDeep() {
  var clone = this.cloneNode(true), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}
function __DefaultExport__(deep) {
  return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/datum.js @182
182: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__(value) {
  return arguments.length ? this.property("__data__", value) : this.node().__data__;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/on.js @183
183: function(__fusereq, exports, module){
exports.__esModule = true;
function contextListener(listener) {
  return function (event) {
    listener.call(this, event, this.__data__);
  };
}
function parseTypenames(typenames) {
  return typenames.trim().split(/^|\s+/).map(function (t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0) (name = t.slice(i + 1), t = t.slice(0, i));
    return {
      type: t,
      name: name
    };
  });
}
function onRemove(typename) {
  return function () {
    var on = this.__on;
    if (!on) return;
    for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
      if ((o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name)) {
        this.removeEventListener(o.type, o.listener, o.options);
      } else {
        on[++i] = o;
      }
    }
    if (++i) on.length = i; else delete this.__on;
  };
}
function onAdd(typename, value, options) {
  return function () {
    var on = this.__on, o, listener = contextListener(value);
    if (on) for (var j = 0, m = on.length; j < m; ++j) {
      if ((o = on[j]).type === typename.type && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.options);
        this.addEventListener(o.type, o.listener = listener, o.options = options);
        o.value = value;
        return;
      }
    }
    this.addEventListener(typename.type, listener, options);
    o = {
      type: typename.type,
      name: typename.name,
      value: value,
      listener: listener,
      options: options
    };
    if (!on) this.__on = [o]; else on.push(o);
  };
}
function __DefaultExport__(typename, value, options) {
  var typenames = parseTypenames(typename + ""), i, n = typenames.length, t;
  if (arguments.length < 2) {
    var on = this.node().__on;
    if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
      for ((i = 0, o = on[j]); i < n; ++i) {
        if ((t = typenames[i]).type === o.type && t.name === o.name) {
          return o.value;
        }
      }
    }
    return;
  }
  on = value ? onAdd : onRemove;
  for (i = 0; i < n; ++i) this.each(on(typenames[i], value, options));
  return this;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/dispatch.js @184
184: function(__fusereq, exports, module){
exports.__esModule = true;
var window_js_1 = __fusereq(123);
var window_js_1d = __fuse.dt(window_js_1);
function dispatchEvent(node, type, params) {
  var window = window_js_1d.default(node), event = window.CustomEvent;
  if (typeof event === "function") {
    event = new event(type, params);
  } else {
    event = window.document.createEvent("Event");
    if (params) (event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail); else event.initEvent(type, false, false);
  }
  node.dispatchEvent(event);
}
function dispatchConstant(type, params) {
  return function () {
    return dispatchEvent(this, type, params);
  };
}
function dispatchFunction(type, params) {
  return function () {
    return dispatchEvent(this, type, params.apply(this, arguments));
  };
}
function __DefaultExport__(type, params) {
  return this.each((typeof params === "function" ? dispatchFunction : dispatchConstant)(type, params));
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/iterator.js @185
185: function(__fusereq, exports, module){
exports.__esModule = true;
function* __DefaultExport__() {
  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if (node = group[i]) yield node;
    }
  }
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/constant.js @188
188: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__(x) {
  return function () {
    return x;
  };
}
exports.default = __DefaultExport__;

},

// node_modules/d3-selection/src/selection/sparse.js @189
189: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__(update) {
  return new Array(update.length);
}
exports.default = __DefaultExport__;

},

// node_modules/d3-path/src/index.js @142
142: function(__fusereq, exports, module){
exports.__esModule = true;
var path_js_1 = __fusereq(187);
var path_js_1d = __fuse.dt(path_js_1);
exports.path = path_js_1d.default;

},

// node_modules/d3-path/src/path.js @187
187: function(__fusereq, exports, module){
exports.__esModule = true;
const pi = Math.PI, tau = 2 * pi, epsilon = 1e-6, tauEpsilon = tau - epsilon;
function Path() {
  this._x0 = this._y0 = this._x1 = this._y1 = null;
  this._ = "";
}
function path() {
  return new Path();
}
Path.prototype = path.prototype = {
  constructor: Path,
  moveTo: function (x, y) {
    this._ += "M" + (this._x0 = this._x1 = +x) + "," + (this._y0 = this._y1 = +y);
  },
  closePath: function () {
    if (this._x1 !== null) {
      (this._x1 = this._x0, this._y1 = this._y0);
      this._ += "Z";
    }
  },
  lineTo: function (x, y) {
    this._ += "L" + (this._x1 = +x) + "," + (this._y1 = +y);
  },
  quadraticCurveTo: function (x1, y1, x, y) {
    this._ += "Q" + +x1 + "," + +y1 + "," + (this._x1 = +x) + "," + (this._y1 = +y);
  },
  bezierCurveTo: function (x1, y1, x2, y2, x, y) {
    this._ += "C" + +x1 + "," + +y1 + "," + +x2 + "," + +y2 + "," + (this._x1 = +x) + "," + (this._y1 = +y);
  },
  arcTo: function (x1, y1, x2, y2, r) {
    (x1 = +x1, y1 = +y1, x2 = +x2, y2 = +y2, r = +r);
    var x0 = this._x1, y0 = this._y1, x21 = x2 - x1, y21 = y2 - y1, x01 = x0 - x1, y01 = y0 - y1, l01_2 = x01 * x01 + y01 * y01;
    if (r < 0) throw new Error("negative radius: " + r);
    if (this._x1 === null) {
      this._ += "M" + (this._x1 = x1) + "," + (this._y1 = y1);
    } else if (!(l01_2 > epsilon)) ; else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon) || !r) {
      this._ += "L" + (this._x1 = x1) + "," + (this._y1 = y1);
    } else {
      var x20 = x2 - x0, y20 = y2 - y0, l21_2 = x21 * x21 + y21 * y21, l20_2 = x20 * x20 + y20 * y20, l21 = Math.sqrt(l21_2), l01 = Math.sqrt(l01_2), l = r * Math.tan((pi - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2), t01 = l / l01, t21 = l / l21;
      if (Math.abs(t01 - 1) > epsilon) {
        this._ += "L" + (x1 + t01 * x01) + "," + (y1 + t01 * y01);
      }
      this._ += "A" + r + "," + r + ",0,0," + +(y01 * x20 > x01 * y20) + "," + (this._x1 = x1 + t21 * x21) + "," + (this._y1 = y1 + t21 * y21);
    }
  },
  arc: function (x, y, r, a0, a1, ccw) {
    (x = +x, y = +y, r = +r, ccw = !!ccw);
    var dx = r * Math.cos(a0), dy = r * Math.sin(a0), x0 = x + dx, y0 = y + dy, cw = 1 ^ ccw, da = ccw ? a0 - a1 : a1 - a0;
    if (r < 0) throw new Error("negative radius: " + r);
    if (this._x1 === null) {
      this._ += "M" + x0 + "," + y0;
    } else if (Math.abs(this._x1 - x0) > epsilon || Math.abs(this._y1 - y0) > epsilon) {
      this._ += "L" + x0 + "," + y0;
    }
    if (!r) return;
    if (da < 0) da = da % tau + tau;
    if (da > tauEpsilon) {
      this._ += "A" + r + "," + r + ",0,1," + cw + "," + (x - dx) + "," + (y - dy) + "A" + r + "," + r + ",0,1," + cw + "," + (this._x1 = x0) + "," + (this._y1 = y0);
    } else if (da > epsilon) {
      this._ += "A" + r + "," + r + ",0," + +(da >= pi) + "," + cw + "," + (this._x1 = x + r * Math.cos(a1)) + "," + (this._y1 = y + r * Math.sin(a1));
    }
  },
  rect: function (x, y, w, h) {
    this._ += "M" + (this._x0 = this._x1 = +x) + "," + (this._y0 = this._y1 = +y) + "h" + +w + "v" + +h + "h" + -w + "Z";
  },
  toString: function () {
    return this._;
  }
};
exports.default = path;

},

// node_modules/d3-shape/src/index.js @48
48: function(__fusereq, exports, module){
exports.__esModule = true;
var arc_js_1 = __fusereq(65);
var arc_js_1d = __fuse.dt(arc_js_1);
exports.arc = arc_js_1d.default;
var area_js_1 = __fusereq(66);
var area_js_1d = __fuse.dt(area_js_1);
exports.area = area_js_1d.default;
var line_js_1 = __fusereq(67);
var line_js_1d = __fuse.dt(line_js_1);
exports.line = line_js_1d.default;
var pie_js_1 = __fusereq(68);
var pie_js_1d = __fuse.dt(pie_js_1);
exports.pie = pie_js_1d.default;
var areaRadial_js_1 = __fusereq(69);
var areaRadial_js_1d = __fuse.dt(areaRadial_js_1);
exports.areaRadial = areaRadial_js_1d.default;
var areaRadial_js_1d = __fuse.dt(areaRadial_js_1);
exports.radialArea = areaRadial_js_1d.default;
var lineRadial_js_1 = __fusereq(70);
var lineRadial_js_1d = __fuse.dt(lineRadial_js_1);
exports.lineRadial = lineRadial_js_1d.default;
var lineRadial_js_1d = __fuse.dt(lineRadial_js_1);
exports.radialLine = lineRadial_js_1d.default;
var pointRadial_js_1 = __fusereq(71);
var pointRadial_js_1d = __fuse.dt(pointRadial_js_1);
exports.pointRadial = pointRadial_js_1d.default;
var index_js_1 = __fusereq(72);
exports.linkHorizontal = index_js_1.linkHorizontal;
exports.linkVertical = index_js_1.linkVertical;
exports.linkRadial = index_js_1.linkRadial;
var symbol_js_1 = __fusereq(73);
var symbol_js_1d = __fuse.dt(symbol_js_1);
exports.symbol = symbol_js_1d.default;
exports.symbols = symbol_js_1.symbols;
var circle_js_1 = __fusereq(74);
var circle_js_1d = __fuse.dt(circle_js_1);
exports.symbolCircle = circle_js_1d.default;
var cross_js_1 = __fusereq(75);
var cross_js_1d = __fuse.dt(cross_js_1);
exports.symbolCross = cross_js_1d.default;
var diamond_js_1 = __fusereq(76);
var diamond_js_1d = __fuse.dt(diamond_js_1);
exports.symbolDiamond = diamond_js_1d.default;
var square_js_1 = __fusereq(77);
var square_js_1d = __fuse.dt(square_js_1);
exports.symbolSquare = square_js_1d.default;
var star_js_1 = __fusereq(78);
var star_js_1d = __fuse.dt(star_js_1);
exports.symbolStar = star_js_1d.default;
var triangle_js_1 = __fusereq(79);
var triangle_js_1d = __fuse.dt(triangle_js_1);
exports.symbolTriangle = triangle_js_1d.default;
var wye_js_1 = __fusereq(80);
var wye_js_1d = __fuse.dt(wye_js_1);
exports.symbolWye = wye_js_1d.default;
var basisClosed_js_1 = __fusereq(81);
var basisClosed_js_1d = __fuse.dt(basisClosed_js_1);
exports.curveBasisClosed = basisClosed_js_1d.default;
var basisOpen_js_1 = __fusereq(82);
var basisOpen_js_1d = __fuse.dt(basisOpen_js_1);
exports.curveBasisOpen = basisOpen_js_1d.default;
var basis_js_1 = __fusereq(83);
var basis_js_1d = __fuse.dt(basis_js_1);
exports.curveBasis = basis_js_1d.default;
var bump_js_1 = __fusereq(84);
exports.curveBumpX = bump_js_1.bumpX;
exports.curveBumpY = bump_js_1.bumpY;
var bundle_js_1 = __fusereq(85);
var bundle_js_1d = __fuse.dt(bundle_js_1);
exports.curveBundle = bundle_js_1d.default;
var cardinalClosed_js_1 = __fusereq(86);
var cardinalClosed_js_1d = __fuse.dt(cardinalClosed_js_1);
exports.curveCardinalClosed = cardinalClosed_js_1d.default;
var cardinalOpen_js_1 = __fusereq(87);
var cardinalOpen_js_1d = __fuse.dt(cardinalOpen_js_1);
exports.curveCardinalOpen = cardinalOpen_js_1d.default;
var cardinal_js_1 = __fusereq(88);
var cardinal_js_1d = __fuse.dt(cardinal_js_1);
exports.curveCardinal = cardinal_js_1d.default;
var catmullRomClosed_js_1 = __fusereq(89);
var catmullRomClosed_js_1d = __fuse.dt(catmullRomClosed_js_1);
exports.curveCatmullRomClosed = catmullRomClosed_js_1d.default;
var catmullRomOpen_js_1 = __fusereq(90);
var catmullRomOpen_js_1d = __fuse.dt(catmullRomOpen_js_1);
exports.curveCatmullRomOpen = catmullRomOpen_js_1d.default;
var catmullRom_js_1 = __fusereq(91);
var catmullRom_js_1d = __fuse.dt(catmullRom_js_1);
exports.curveCatmullRom = catmullRom_js_1d.default;
var linearClosed_js_1 = __fusereq(92);
var linearClosed_js_1d = __fuse.dt(linearClosed_js_1);
exports.curveLinearClosed = linearClosed_js_1d.default;
var linear_js_1 = __fusereq(93);
var linear_js_1d = __fuse.dt(linear_js_1);
exports.curveLinear = linear_js_1d.default;
var monotone_js_1 = __fusereq(94);
exports.curveMonotoneX = monotone_js_1.monotoneX;
exports.curveMonotoneY = monotone_js_1.monotoneY;
var natural_js_1 = __fusereq(95);
var natural_js_1d = __fuse.dt(natural_js_1);
exports.curveNatural = natural_js_1d.default;
var step_js_1 = __fusereq(96);
var step_js_1d = __fuse.dt(step_js_1);
exports.curveStep = step_js_1d.default;
exports.curveStepAfter = step_js_1.stepAfter;
exports.curveStepBefore = step_js_1.stepBefore;
var stack_js_1 = __fusereq(97);
var stack_js_1d = __fuse.dt(stack_js_1);
exports.stack = stack_js_1d.default;
var expand_js_1 = __fusereq(98);
var expand_js_1d = __fuse.dt(expand_js_1);
exports.stackOffsetExpand = expand_js_1d.default;
var diverging_js_1 = __fusereq(99);
var diverging_js_1d = __fuse.dt(diverging_js_1);
exports.stackOffsetDiverging = diverging_js_1d.default;
var none_js_1 = __fusereq(100);
var none_js_1d = __fuse.dt(none_js_1);
exports.stackOffsetNone = none_js_1d.default;
var silhouette_js_1 = __fusereq(101);
var silhouette_js_1d = __fuse.dt(silhouette_js_1);
exports.stackOffsetSilhouette = silhouette_js_1d.default;
var wiggle_js_1 = __fusereq(102);
var wiggle_js_1d = __fuse.dt(wiggle_js_1);
exports.stackOffsetWiggle = wiggle_js_1d.default;
var appearance_js_1 = __fusereq(103);
var appearance_js_1d = __fuse.dt(appearance_js_1);
exports.stackOrderAppearance = appearance_js_1d.default;
var ascending_js_1 = __fusereq(104);
var ascending_js_1d = __fuse.dt(ascending_js_1);
exports.stackOrderAscending = ascending_js_1d.default;
var descending_js_1 = __fusereq(105);
var descending_js_1d = __fuse.dt(descending_js_1);
exports.stackOrderDescending = descending_js_1d.default;
var insideOut_js_1 = __fusereq(106);
var insideOut_js_1d = __fuse.dt(insideOut_js_1);
exports.stackOrderInsideOut = insideOut_js_1d.default;
var none_js_2 = __fusereq(107);
var none_js_2d = __fuse.dt(none_js_2);
exports.stackOrderNone = none_js_2d.default;
var reverse_js_1 = __fusereq(108);
var reverse_js_1d = __fuse.dt(reverse_js_1);
exports.stackOrderReverse = reverse_js_1d.default;

},

// node_modules/d3-shape/src/arc.js @65
65: function(__fusereq, exports, module){
exports.__esModule = true;
var d3_path_1 = __fusereq(142);
var constant_js_1 = __fusereq(143);
var constant_js_1d = __fuse.dt(constant_js_1);
var math_js_1 = __fusereq(144);
function arcInnerRadius(d) {
  return d.innerRadius;
}
function arcOuterRadius(d) {
  return d.outerRadius;
}
function arcStartAngle(d) {
  return d.startAngle;
}
function arcEndAngle(d) {
  return d.endAngle;
}
function arcPadAngle(d) {
  return d && d.padAngle;
}
function intersect(x0, y0, x1, y1, x2, y2, x3, y3) {
  var x10 = x1 - x0, y10 = y1 - y0, x32 = x3 - x2, y32 = y3 - y2, t = y32 * x10 - x32 * y10;
  if (t * t < math_js_1.epsilon) return;
  t = (x32 * (y0 - y2) - y32 * (x0 - x2)) / t;
  return [x0 + t * x10, y0 + t * y10];
}
function cornerTangents(x0, y0, x1, y1, r1, rc, cw) {
  var x01 = x0 - x1, y01 = y0 - y1, lo = (cw ? rc : -rc) / math_js_1.sqrt(x01 * x01 + y01 * y01), ox = lo * y01, oy = -lo * x01, x11 = x0 + ox, y11 = y0 + oy, x10 = x1 + ox, y10 = y1 + oy, x00 = (x11 + x10) / 2, y00 = (y11 + y10) / 2, dx = x10 - x11, dy = y10 - y11, d2 = dx * dx + dy * dy, r = r1 - rc, D = x11 * y10 - x10 * y11, d = (dy < 0 ? -1 : 1) * math_js_1.sqrt(math_js_1.max(0, r * r * d2 - D * D)), cx0 = (D * dy - dx * d) / d2, cy0 = (-D * dx - dy * d) / d2, cx1 = (D * dy + dx * d) / d2, cy1 = (-D * dx + dy * d) / d2, dx0 = cx0 - x00, dy0 = cy0 - y00, dx1 = cx1 - x00, dy1 = cy1 - y00;
  if (dx0 * dx0 + dy0 * dy0 > dx1 * dx1 + dy1 * dy1) (cx0 = cx1, cy0 = cy1);
  return {
    cx: cx0,
    cy: cy0,
    x01: -ox,
    y01: -oy,
    x11: cx0 * (r1 / r - 1),
    y11: cy0 * (r1 / r - 1)
  };
}
function __DefaultExport__() {
  var innerRadius = arcInnerRadius, outerRadius = arcOuterRadius, cornerRadius = constant_js_1d.default(0), padRadius = null, startAngle = arcStartAngle, endAngle = arcEndAngle, padAngle = arcPadAngle, context = null;
  function arc() {
    var buffer, r, r0 = +innerRadius.apply(this, arguments), r1 = +outerRadius.apply(this, arguments), a0 = startAngle.apply(this, arguments) - math_js_1.halfPi, a1 = endAngle.apply(this, arguments) - math_js_1.halfPi, da = math_js_1.abs(a1 - a0), cw = a1 > a0;
    if (!context) context = buffer = d3_path_1.path();
    if (r1 < r0) (r = r1, r1 = r0, r0 = r);
    if (!(r1 > math_js_1.epsilon)) context.moveTo(0, 0); else if (da > math_js_1.tau - math_js_1.epsilon) {
      context.moveTo(r1 * math_js_1.cos(a0), r1 * math_js_1.sin(a0));
      context.arc(0, 0, r1, a0, a1, !cw);
      if (r0 > math_js_1.epsilon) {
        context.moveTo(r0 * math_js_1.cos(a1), r0 * math_js_1.sin(a1));
        context.arc(0, 0, r0, a1, a0, cw);
      }
    } else {
      var a01 = a0, a11 = a1, a00 = a0, a10 = a1, da0 = da, da1 = da, ap = padAngle.apply(this, arguments) / 2, rp = ap > math_js_1.epsilon && (padRadius ? +padRadius.apply(this, arguments) : math_js_1.sqrt(r0 * r0 + r1 * r1)), rc = math_js_1.min(math_js_1.abs(r1 - r0) / 2, +cornerRadius.apply(this, arguments)), rc0 = rc, rc1 = rc, t0, t1;
      if (rp > math_js_1.epsilon) {
        var p0 = math_js_1.asin(rp / r0 * math_js_1.sin(ap)), p1 = math_js_1.asin(rp / r1 * math_js_1.sin(ap));
        if ((da0 -= p0 * 2) > math_js_1.epsilon) (p0 *= cw ? 1 : -1, a00 += p0, a10 -= p0); else (da0 = 0, a00 = a10 = (a0 + a1) / 2);
        if ((da1 -= p1 * 2) > math_js_1.epsilon) (p1 *= cw ? 1 : -1, a01 += p1, a11 -= p1); else (da1 = 0, a01 = a11 = (a0 + a1) / 2);
      }
      var x01 = r1 * math_js_1.cos(a01), y01 = r1 * math_js_1.sin(a01), x10 = r0 * math_js_1.cos(a10), y10 = r0 * math_js_1.sin(a10);
      if (rc > math_js_1.epsilon) {
        var x11 = r1 * math_js_1.cos(a11), y11 = r1 * math_js_1.sin(a11), x00 = r0 * math_js_1.cos(a00), y00 = r0 * math_js_1.sin(a00), oc;
        if (da < math_js_1.pi && (oc = intersect(x01, y01, x00, y00, x11, y11, x10, y10))) {
          var ax = x01 - oc[0], ay = y01 - oc[1], bx = x11 - oc[0], by = y11 - oc[1], kc = 1 / math_js_1.sin(math_js_1.acos((ax * bx + ay * by) / (math_js_1.sqrt(ax * ax + ay * ay) * math_js_1.sqrt(bx * bx + by * by))) / 2), lc = math_js_1.sqrt(oc[0] * oc[0] + oc[1] * oc[1]);
          rc0 = math_js_1.min(rc, (r0 - lc) / (kc - 1));
          rc1 = math_js_1.min(rc, (r1 - lc) / (kc + 1));
        }
      }
      if (!(da1 > math_js_1.epsilon)) context.moveTo(x01, y01); else if (rc1 > math_js_1.epsilon) {
        t0 = cornerTangents(x00, y00, x01, y01, r1, rc1, cw);
        t1 = cornerTangents(x11, y11, x10, y10, r1, rc1, cw);
        context.moveTo(t0.cx + t0.x01, t0.cy + t0.y01);
        if (rc1 < rc) context.arc(t0.cx, t0.cy, rc1, math_js_1.atan2(t0.y01, t0.x01), math_js_1.atan2(t1.y01, t1.x01), !cw); else {
          context.arc(t0.cx, t0.cy, rc1, math_js_1.atan2(t0.y01, t0.x01), math_js_1.atan2(t0.y11, t0.x11), !cw);
          context.arc(0, 0, r1, math_js_1.atan2(t0.cy + t0.y11, t0.cx + t0.x11), math_js_1.atan2(t1.cy + t1.y11, t1.cx + t1.x11), !cw);
          context.arc(t1.cx, t1.cy, rc1, math_js_1.atan2(t1.y11, t1.x11), math_js_1.atan2(t1.y01, t1.x01), !cw);
        }
      } else (context.moveTo(x01, y01), context.arc(0, 0, r1, a01, a11, !cw));
      if (!(r0 > math_js_1.epsilon) || !(da0 > math_js_1.epsilon)) context.lineTo(x10, y10); else if (rc0 > math_js_1.epsilon) {
        t0 = cornerTangents(x10, y10, x11, y11, r0, -rc0, cw);
        t1 = cornerTangents(x01, y01, x00, y00, r0, -rc0, cw);
        context.lineTo(t0.cx + t0.x01, t0.cy + t0.y01);
        if (rc0 < rc) context.arc(t0.cx, t0.cy, rc0, math_js_1.atan2(t0.y01, t0.x01), math_js_1.atan2(t1.y01, t1.x01), !cw); else {
          context.arc(t0.cx, t0.cy, rc0, math_js_1.atan2(t0.y01, t0.x01), math_js_1.atan2(t0.y11, t0.x11), !cw);
          context.arc(0, 0, r0, math_js_1.atan2(t0.cy + t0.y11, t0.cx + t0.x11), math_js_1.atan2(t1.cy + t1.y11, t1.cx + t1.x11), cw);
          context.arc(t1.cx, t1.cy, rc0, math_js_1.atan2(t1.y11, t1.x11), math_js_1.atan2(t1.y01, t1.x01), !cw);
        }
      } else context.arc(0, 0, r0, a10, a00, cw);
    }
    context.closePath();
    if (buffer) return (context = null, buffer + "" || null);
  }
  arc.centroid = function () {
    var r = (+innerRadius.apply(this, arguments) + +outerRadius.apply(this, arguments)) / 2, a = (+startAngle.apply(this, arguments) + +endAngle.apply(this, arguments)) / 2 - math_js_1.pi / 2;
    return [math_js_1.cos(a) * r, math_js_1.sin(a) * r];
  };
  arc.innerRadius = function (_) {
    return arguments.length ? (innerRadius = typeof _ === "function" ? _ : constant_js_1d.default(+_), arc) : innerRadius;
  };
  arc.outerRadius = function (_) {
    return arguments.length ? (outerRadius = typeof _ === "function" ? _ : constant_js_1d.default(+_), arc) : outerRadius;
  };
  arc.cornerRadius = function (_) {
    return arguments.length ? (cornerRadius = typeof _ === "function" ? _ : constant_js_1d.default(+_), arc) : cornerRadius;
  };
  arc.padRadius = function (_) {
    return arguments.length ? (padRadius = _ == null ? null : typeof _ === "function" ? _ : constant_js_1d.default(+_), arc) : padRadius;
  };
  arc.startAngle = function (_) {
    return arguments.length ? (startAngle = typeof _ === "function" ? _ : constant_js_1d.default(+_), arc) : startAngle;
  };
  arc.endAngle = function (_) {
    return arguments.length ? (endAngle = typeof _ === "function" ? _ : constant_js_1d.default(+_), arc) : endAngle;
  };
  arc.padAngle = function (_) {
    return arguments.length ? (padAngle = typeof _ === "function" ? _ : constant_js_1d.default(+_), arc) : padAngle;
  };
  arc.context = function (_) {
    return arguments.length ? (context = _ == null ? null : _, arc) : context;
  };
  return arc;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-shape/src/area.js @66
66: function(__fusereq, exports, module){
exports.__esModule = true;
var d3_path_1 = __fusereq(142);
var array_js_1 = __fusereq(145);
var array_js_1d = __fuse.dt(array_js_1);
var constant_js_1 = __fusereq(143);
var constant_js_1d = __fuse.dt(constant_js_1);
var linear_js_1 = __fusereq(93);
var linear_js_1d = __fuse.dt(linear_js_1);
var line_js_1 = __fusereq(67);
var line_js_1d = __fuse.dt(line_js_1);
var point_js_1 = __fusereq(146);
function __DefaultExport__(x0, y0, y1) {
  var x1 = null, defined = constant_js_1d.default(true), context = null, curve = linear_js_1d.default, output = null;
  x0 = typeof x0 === "function" ? x0 : x0 === undefined ? point_js_1.x : constant_js_1d.default(+x0);
  y0 = typeof y0 === "function" ? y0 : y0 === undefined ? constant_js_1d.default(0) : constant_js_1d.default(+y0);
  y1 = typeof y1 === "function" ? y1 : y1 === undefined ? point_js_1.y : constant_js_1d.default(+y1);
  function area(data) {
    var i, j, k, n = (data = array_js_1d.default(data)).length, d, defined0 = false, buffer, x0z = new Array(n), y0z = new Array(n);
    if (context == null) output = curve(buffer = d3_path_1.path());
    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined(d = data[i], i, data)) === defined0) {
        if (defined0 = !defined0) {
          j = i;
          output.areaStart();
          output.lineStart();
        } else {
          output.lineEnd();
          output.lineStart();
          for (k = i - 1; k >= j; --k) {
            output.point(x0z[k], y0z[k]);
          }
          output.lineEnd();
          output.areaEnd();
        }
      }
      if (defined0) {
        (x0z[i] = +x0(d, i, data), y0z[i] = +y0(d, i, data));
        output.point(x1 ? +x1(d, i, data) : x0z[i], y1 ? +y1(d, i, data) : y0z[i]);
      }
    }
    if (buffer) return (output = null, buffer + "" || null);
  }
  function arealine() {
    return line_js_1d.default().defined(defined).curve(curve).context(context);
  }
  area.x = function (_) {
    return arguments.length ? (x0 = typeof _ === "function" ? _ : constant_js_1d.default(+_), x1 = null, area) : x0;
  };
  area.x0 = function (_) {
    return arguments.length ? (x0 = typeof _ === "function" ? _ : constant_js_1d.default(+_), area) : x0;
  };
  area.x1 = function (_) {
    return arguments.length ? (x1 = _ == null ? null : typeof _ === "function" ? _ : constant_js_1d.default(+_), area) : x1;
  };
  area.y = function (_) {
    return arguments.length ? (y0 = typeof _ === "function" ? _ : constant_js_1d.default(+_), y1 = null, area) : y0;
  };
  area.y0 = function (_) {
    return arguments.length ? (y0 = typeof _ === "function" ? _ : constant_js_1d.default(+_), area) : y0;
  };
  area.y1 = function (_) {
    return arguments.length ? (y1 = _ == null ? null : typeof _ === "function" ? _ : constant_js_1d.default(+_), area) : y1;
  };
  area.lineX0 = area.lineY0 = function () {
    return arealine().x(x0).y(y0);
  };
  area.lineY1 = function () {
    return arealine().x(x0).y(y1);
  };
  area.lineX1 = function () {
    return arealine().x(x1).y(y0);
  };
  area.defined = function (_) {
    return arguments.length ? (defined = typeof _ === "function" ? _ : constant_js_1d.default(!!_), area) : defined;
  };
  area.curve = function (_) {
    return arguments.length ? (curve = _, context != null && (output = curve(context)), area) : curve;
  };
  area.context = function (_) {
    return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), area) : context;
  };
  return area;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-shape/src/line.js @67
67: function(__fusereq, exports, module){
exports.__esModule = true;
var d3_path_1 = __fusereq(142);
var array_js_1 = __fusereq(145);
var array_js_1d = __fuse.dt(array_js_1);
var constant_js_1 = __fusereq(143);
var constant_js_1d = __fuse.dt(constant_js_1);
var linear_js_1 = __fusereq(93);
var linear_js_1d = __fuse.dt(linear_js_1);
var point_js_1 = __fusereq(146);
function __DefaultExport__(x, y) {
  var defined = constant_js_1d.default(true), context = null, curve = linear_js_1d.default, output = null;
  x = typeof x === "function" ? x : x === undefined ? point_js_1.x : constant_js_1d.default(x);
  y = typeof y === "function" ? y : y === undefined ? point_js_1.y : constant_js_1d.default(y);
  function line(data) {
    var i, n = (data = array_js_1d.default(data)).length, d, defined0 = false, buffer;
    if (context == null) output = curve(buffer = d3_path_1.path());
    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined(d = data[i], i, data)) === defined0) {
        if (defined0 = !defined0) output.lineStart(); else output.lineEnd();
      }
      if (defined0) output.point(+x(d, i, data), +y(d, i, data));
    }
    if (buffer) return (output = null, buffer + "" || null);
  }
  line.x = function (_) {
    return arguments.length ? (x = typeof _ === "function" ? _ : constant_js_1d.default(+_), line) : x;
  };
  line.y = function (_) {
    return arguments.length ? (y = typeof _ === "function" ? _ : constant_js_1d.default(+_), line) : y;
  };
  line.defined = function (_) {
    return arguments.length ? (defined = typeof _ === "function" ? _ : constant_js_1d.default(!!_), line) : defined;
  };
  line.curve = function (_) {
    return arguments.length ? (curve = _, context != null && (output = curve(context)), line) : curve;
  };
  line.context = function (_) {
    return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), line) : context;
  };
  return line;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-shape/src/pie.js @68
68: function(__fusereq, exports, module){
exports.__esModule = true;
var array_js_1 = __fusereq(145);
var array_js_1d = __fuse.dt(array_js_1);
var constant_js_1 = __fusereq(143);
var constant_js_1d = __fuse.dt(constant_js_1);
var descending_js_1 = __fusereq(147);
var descending_js_1d = __fuse.dt(descending_js_1);
var identity_js_1 = __fusereq(148);
var identity_js_1d = __fuse.dt(identity_js_1);
var math_js_1 = __fusereq(144);
function __DefaultExport__() {
  var value = identity_js_1d.default, sortValues = descending_js_1d.default, sort = null, startAngle = constant_js_1d.default(0), endAngle = constant_js_1d.default(math_js_1.tau), padAngle = constant_js_1d.default(0);
  function pie(data) {
    var i, n = (data = array_js_1d.default(data)).length, j, k, sum = 0, index = new Array(n), arcs = new Array(n), a0 = +startAngle.apply(this, arguments), da = Math.min(math_js_1.tau, Math.max(-math_js_1.tau, endAngle.apply(this, arguments) - a0)), a1, p = Math.min(Math.abs(da) / n, padAngle.apply(this, arguments)), pa = p * (da < 0 ? -1 : 1), v;
    for (i = 0; i < n; ++i) {
      if ((v = arcs[index[i] = i] = +value(data[i], i, data)) > 0) {
        sum += v;
      }
    }
    if (sortValues != null) index.sort(function (i, j) {
      return sortValues(arcs[i], arcs[j]);
    }); else if (sort != null) index.sort(function (i, j) {
      return sort(data[i], data[j]);
    });
    for ((i = 0, k = sum ? (da - n * pa) / sum : 0); i < n; (++i, a0 = a1)) {
      (j = index[i], v = arcs[j], a1 = a0 + (v > 0 ? v * k : 0) + pa, arcs[j] = {
        data: data[j],
        index: i,
        value: v,
        startAngle: a0,
        endAngle: a1,
        padAngle: p
      });
    }
    return arcs;
  }
  pie.value = function (_) {
    return arguments.length ? (value = typeof _ === "function" ? _ : constant_js_1d.default(+_), pie) : value;
  };
  pie.sortValues = function (_) {
    return arguments.length ? (sortValues = _, sort = null, pie) : sortValues;
  };
  pie.sort = function (_) {
    return arguments.length ? (sort = _, sortValues = null, pie) : sort;
  };
  pie.startAngle = function (_) {
    return arguments.length ? (startAngle = typeof _ === "function" ? _ : constant_js_1d.default(+_), pie) : startAngle;
  };
  pie.endAngle = function (_) {
    return arguments.length ? (endAngle = typeof _ === "function" ? _ : constant_js_1d.default(+_), pie) : endAngle;
  };
  pie.padAngle = function (_) {
    return arguments.length ? (padAngle = typeof _ === "function" ? _ : constant_js_1d.default(+_), pie) : padAngle;
  };
  return pie;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-shape/src/areaRadial.js @69
69: function(__fusereq, exports, module){
exports.__esModule = true;
var radial_js_1 = __fusereq(149);
var radial_js_1d = __fuse.dt(radial_js_1);
var area_js_1 = __fusereq(66);
var area_js_1d = __fuse.dt(area_js_1);
var lineRadial_js_1 = __fusereq(70);
function __DefaultExport__() {
  var a = area_js_1d.default().curve(radial_js_1.curveRadialLinear), c = a.curve, x0 = a.lineX0, x1 = a.lineX1, y0 = a.lineY0, y1 = a.lineY1;
  (a.angle = a.x, delete a.x);
  (a.startAngle = a.x0, delete a.x0);
  (a.endAngle = a.x1, delete a.x1);
  (a.radius = a.y, delete a.y);
  (a.innerRadius = a.y0, delete a.y0);
  (a.outerRadius = a.y1, delete a.y1);
  (a.lineStartAngle = function () {
    return lineRadial_js_1.lineRadial(x0());
  }, delete a.lineX0);
  (a.lineEndAngle = function () {
    return lineRadial_js_1.lineRadial(x1());
  }, delete a.lineX1);
  (a.lineInnerRadius = function () {
    return lineRadial_js_1.lineRadial(y0());
  }, delete a.lineY0);
  (a.lineOuterRadius = function () {
    return lineRadial_js_1.lineRadial(y1());
  }, delete a.lineY1);
  a.curve = function (_) {
    return arguments.length ? c(radial_js_1d.default(_)) : c()._curve;
  };
  return a;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-shape/src/lineRadial.js @70
70: function(__fusereq, exports, module){
exports.__esModule = true;
var radial_js_1 = __fusereq(149);
var radial_js_1d = __fuse.dt(radial_js_1);
var line_js_1 = __fusereq(67);
var line_js_1d = __fuse.dt(line_js_1);
function lineRadial(l) {
  var c = l.curve;
  (l.angle = l.x, delete l.x);
  (l.radius = l.y, delete l.y);
  l.curve = function (_) {
    return arguments.length ? c(radial_js_1d.default(_)) : c()._curve;
  };
  return l;
}
exports.lineRadial = lineRadial;
function __DefaultExport__() {
  return lineRadial(line_js_1d.default().curve(radial_js_1.curveRadialLinear));
}
exports.default = __DefaultExport__;

},

// node_modules/d3-shape/src/pointRadial.js @71
71: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__(x, y) {
  return [(y = +y) * Math.cos(x -= Math.PI / 2), y * Math.sin(x)];
}
exports.default = __DefaultExport__;

},

// node_modules/d3-shape/src/link/index.js @72
72: function(__fusereq, exports, module){
exports.__esModule = true;
var d3_path_1 = __fusereq(142);
var array_js_1 = __fusereq(145);
var constant_js_1 = __fusereq(143);
var constant_js_1d = __fuse.dt(constant_js_1);
var point_js_1 = __fusereq(146);
var pointRadial_js_1 = __fusereq(71);
var pointRadial_js_1d = __fuse.dt(pointRadial_js_1);
function linkSource(d) {
  return d.source;
}
function linkTarget(d) {
  return d.target;
}
function link(curve) {
  var source = linkSource, target = linkTarget, x = point_js_1.x, y = point_js_1.y, context = null;
  function link() {
    var buffer, argv = array_js_1.slice.call(arguments), s = source.apply(this, argv), t = target.apply(this, argv);
    if (!context) context = buffer = d3_path_1.path();
    curve(context, +x.apply(this, (argv[0] = s, argv)), +y.apply(this, argv), +x.apply(this, (argv[0] = t, argv)), +y.apply(this, argv));
    if (buffer) return (context = null, buffer + "" || null);
  }
  link.source = function (_) {
    return arguments.length ? (source = _, link) : source;
  };
  link.target = function (_) {
    return arguments.length ? (target = _, link) : target;
  };
  link.x = function (_) {
    return arguments.length ? (x = typeof _ === "function" ? _ : constant_js_1d.default(+_), link) : x;
  };
  link.y = function (_) {
    return arguments.length ? (y = typeof _ === "function" ? _ : constant_js_1d.default(+_), link) : y;
  };
  link.context = function (_) {
    return arguments.length ? (context = _ == null ? null : _, link) : context;
  };
  return link;
}
function curveHorizontal(context, x0, y0, x1, y1) {
  context.moveTo(x0, y0);
  context.bezierCurveTo(x0 = (x0 + x1) / 2, y0, x0, y1, x1, y1);
}
function curveVertical(context, x0, y0, x1, y1) {
  context.moveTo(x0, y0);
  context.bezierCurveTo(x0, y0 = (y0 + y1) / 2, x1, y0, x1, y1);
}
function curveRadial(context, x0, y0, x1, y1) {
  var p0 = pointRadial_js_1d.default(x0, y0), p1 = pointRadial_js_1d.default(x0, y0 = (y0 + y1) / 2), p2 = pointRadial_js_1d.default(x1, y0), p3 = pointRadial_js_1d.default(x1, y1);
  context.moveTo(p0[0], p0[1]);
  context.bezierCurveTo(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]);
}
function linkHorizontal() {
  return link(curveHorizontal);
}
exports.linkHorizontal = linkHorizontal;
function linkVertical() {
  return link(curveVertical);
}
exports.linkVertical = linkVertical;
function linkRadial() {
  var l = link(curveRadial);
  (l.angle = l.x, delete l.x);
  (l.radius = l.y, delete l.y);
  return l;
}
exports.linkRadial = linkRadial;

},

// node_modules/d3-shape/src/symbol.js @73
73: function(__fusereq, exports, module){
exports.__esModule = true;
var d3_path_1 = __fusereq(142);
var circle_js_1 = __fusereq(74);
var circle_js_1d = __fuse.dt(circle_js_1);
var cross_js_1 = __fusereq(75);
var cross_js_1d = __fuse.dt(cross_js_1);
var diamond_js_1 = __fusereq(76);
var diamond_js_1d = __fuse.dt(diamond_js_1);
var star_js_1 = __fusereq(78);
var star_js_1d = __fuse.dt(star_js_1);
var square_js_1 = __fusereq(77);
var square_js_1d = __fuse.dt(square_js_1);
var triangle_js_1 = __fusereq(79);
var triangle_js_1d = __fuse.dt(triangle_js_1);
var wye_js_1 = __fusereq(80);
var wye_js_1d = __fuse.dt(wye_js_1);
var constant_js_1 = __fusereq(143);
var constant_js_1d = __fuse.dt(constant_js_1);
exports.symbols = [circle_js_1d.default, cross_js_1d.default, diamond_js_1d.default, square_js_1d.default, star_js_1d.default, triangle_js_1d.default, wye_js_1d.default];
function __DefaultExport__(type, size) {
  var context = null;
  type = typeof type === "function" ? type : constant_js_1d.default(type || circle_js_1d.default);
  size = typeof size === "function" ? size : constant_js_1d.default(size === undefined ? 64 : +size);
  function symbol() {
    var buffer;
    if (!context) context = buffer = d3_path_1.path();
    type.apply(this, arguments).draw(context, +size.apply(this, arguments));
    if (buffer) return (context = null, buffer + "" || null);
  }
  symbol.type = function (_) {
    return arguments.length ? (type = typeof _ === "function" ? _ : constant_js_1d.default(_), symbol) : type;
  };
  symbol.size = function (_) {
    return arguments.length ? (size = typeof _ === "function" ? _ : constant_js_1d.default(+_), symbol) : size;
  };
  symbol.context = function (_) {
    return arguments.length ? (context = _ == null ? null : _, symbol) : context;
  };
  return symbol;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-shape/src/symbol/circle.js @74
74: function(__fusereq, exports, module){
exports.__esModule = true;
var math_js_1 = __fusereq(144);
exports.default = {
  draw: function (context, size) {
    var r = Math.sqrt(size / math_js_1.pi);
    context.moveTo(r, 0);
    context.arc(0, 0, r, 0, math_js_1.tau);
  }
};

},

// node_modules/d3-shape/src/symbol/cross.js @75
75: function(__fusereq, exports, module){
exports.__esModule = true;
exports.default = {
  draw: function (context, size) {
    var r = Math.sqrt(size / 5) / 2;
    context.moveTo(-3 * r, -r);
    context.lineTo(-r, -r);
    context.lineTo(-r, -3 * r);
    context.lineTo(r, -3 * r);
    context.lineTo(r, -r);
    context.lineTo(3 * r, -r);
    context.lineTo(3 * r, r);
    context.lineTo(r, r);
    context.lineTo(r, 3 * r);
    context.lineTo(-r, 3 * r);
    context.lineTo(-r, r);
    context.lineTo(-3 * r, r);
    context.closePath();
  }
};

},

// node_modules/d3-shape/src/symbol/diamond.js @76
76: function(__fusereq, exports, module){
exports.__esModule = true;
var tan30 = Math.sqrt(1 / 3), tan30_2 = tan30 * 2;
exports.default = {
  draw: function (context, size) {
    var y = Math.sqrt(size / tan30_2), x = y * tan30;
    context.moveTo(0, -y);
    context.lineTo(x, 0);
    context.lineTo(0, y);
    context.lineTo(-x, 0);
    context.closePath();
  }
};

},

// node_modules/d3-shape/src/symbol/square.js @77
77: function(__fusereq, exports, module){
exports.__esModule = true;
exports.default = {
  draw: function (context, size) {
    var w = Math.sqrt(size), x = -w / 2;
    context.rect(x, x, w, w);
  }
};

},

// node_modules/d3-shape/src/symbol/star.js @78
78: function(__fusereq, exports, module){
exports.__esModule = true;
var math_js_1 = __fusereq(144);
var ka = 0.89081309152928522810, kr = Math.sin(math_js_1.pi / 10) / Math.sin(7 * math_js_1.pi / 10), kx = Math.sin(math_js_1.tau / 10) * kr, ky = -Math.cos(math_js_1.tau / 10) * kr;
exports.default = {
  draw: function (context, size) {
    var r = Math.sqrt(size * ka), x = kx * r, y = ky * r;
    context.moveTo(0, -r);
    context.lineTo(x, y);
    for (var i = 1; i < 5; ++i) {
      var a = math_js_1.tau * i / 5, c = Math.cos(a), s = Math.sin(a);
      context.lineTo(s * r, -c * r);
      context.lineTo(c * x - s * y, s * x + c * y);
    }
    context.closePath();
  }
};

},

// node_modules/d3-shape/src/symbol/triangle.js @79
79: function(__fusereq, exports, module){
exports.__esModule = true;
var sqrt3 = Math.sqrt(3);
exports.default = {
  draw: function (context, size) {
    var y = -Math.sqrt(size / (sqrt3 * 3));
    context.moveTo(0, y * 2);
    context.lineTo(-sqrt3 * y, -y);
    context.lineTo(sqrt3 * y, -y);
    context.closePath();
  }
};

},

// node_modules/d3-shape/src/symbol/wye.js @80
80: function(__fusereq, exports, module){
exports.__esModule = true;
var c = -0.5, s = Math.sqrt(3) / 2, k = 1 / Math.sqrt(12), a = (k / 2 + 1) * 3;
exports.default = {
  draw: function (context, size) {
    var r = Math.sqrt(size / a), x0 = r / 2, y0 = r * k, x1 = x0, y1 = r * k + r, x2 = -x1, y2 = y1;
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.lineTo(x2, y2);
    context.lineTo(c * x0 - s * y0, s * x0 + c * y0);
    context.lineTo(c * x1 - s * y1, s * x1 + c * y1);
    context.lineTo(c * x2 - s * y2, s * x2 + c * y2);
    context.lineTo(c * x0 + s * y0, c * y0 - s * x0);
    context.lineTo(c * x1 + s * y1, c * y1 - s * x1);
    context.lineTo(c * x2 + s * y2, c * y2 - s * x2);
    context.closePath();
  }
};

},

// node_modules/d3-shape/src/curve/basisClosed.js @81
81: function(__fusereq, exports, module){
exports.__esModule = true;
var noop_js_1 = __fusereq(150);
var noop_js_1d = __fuse.dt(noop_js_1);
var basis_js_1 = __fusereq(83);
function BasisClosed(context) {
  this._context = context;
}
BasisClosed.prototype = {
  areaStart: noop_js_1d.default,
  areaEnd: noop_js_1d.default,
  lineStart: function () {
    this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = NaN;
    this._point = 0;
  },
  lineEnd: function () {
    switch (this._point) {
      case 1:
        {
          this._context.moveTo(this._x2, this._y2);
          this._context.closePath();
          break;
        }
      case 2:
        {
          this._context.moveTo((this._x2 + 2 * this._x3) / 3, (this._y2 + 2 * this._y3) / 3);
          this._context.lineTo((this._x3 + 2 * this._x2) / 3, (this._y3 + 2 * this._y2) / 3);
          this._context.closePath();
          break;
        }
      case 3:
        {
          this.point(this._x2, this._y2);
          this.point(this._x3, this._y3);
          this.point(this._x4, this._y4);
          break;
        }
    }
  },
  point: function (x, y) {
    (x = +x, y = +y);
    switch (this._point) {
      case 0:
        this._point = 1;
        (this._x2 = x, this._y2 = y);
        break;
      case 1:
        this._point = 2;
        (this._x3 = x, this._y3 = y);
        break;
      case 2:
        this._point = 3;
        (this._x4 = x, this._y4 = y);
        this._context.moveTo((this._x0 + 4 * this._x1 + x) / 6, (this._y0 + 4 * this._y1 + y) / 6);
        break;
      default:
        basis_js_1.point(this, x, y);
        break;
    }
    (this._x0 = this._x1, this._x1 = x);
    (this._y0 = this._y1, this._y1 = y);
  }
};
function __DefaultExport__(context) {
  return new BasisClosed(context);
}
exports.default = __DefaultExport__;

},

// node_modules/d3-shape/src/curve/basisOpen.js @82
82: function(__fusereq, exports, module){
exports.__esModule = true;
var basis_js_1 = __fusereq(83);
function BasisOpen(context) {
  this._context = context;
}
BasisOpen.prototype = {
  areaStart: function () {
    this._line = 0;
  },
  areaEnd: function () {
    this._line = NaN;
  },
  lineStart: function () {
    this._x0 = this._x1 = this._y0 = this._y1 = NaN;
    this._point = 0;
  },
  lineEnd: function () {
    if (this._line || this._line !== 0 && this._point === 3) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function (x, y) {
    (x = +x, y = +y);
    switch (this._point) {
      case 0:
        this._point = 1;
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        this._point = 3;
        var x0 = (this._x0 + 4 * this._x1 + x) / 6, y0 = (this._y0 + 4 * this._y1 + y) / 6;
        this._line ? this._context.lineTo(x0, y0) : this._context.moveTo(x0, y0);
        break;
      case 3:
        this._point = 4;
      default:
        basis_js_1.point(this, x, y);
        break;
    }
    (this._x0 = this._x1, this._x1 = x);
    (this._y0 = this._y1, this._y1 = y);
  }
};
function __DefaultExport__(context) {
  return new BasisOpen(context);
}
exports.default = __DefaultExport__;

},

// node_modules/d3-shape/src/curve/basis.js @83
83: function(__fusereq, exports, module){
exports.__esModule = true;
function point(that, x, y) {
  that._context.bezierCurveTo((2 * that._x0 + that._x1) / 3, (2 * that._y0 + that._y1) / 3, (that._x0 + 2 * that._x1) / 3, (that._y0 + 2 * that._y1) / 3, (that._x0 + 4 * that._x1 + x) / 6, (that._y0 + 4 * that._y1 + y) / 6);
}
exports.point = point;
function Basis(context) {
  this._context = context;
}
exports.Basis = Basis;
Basis.prototype = {
  areaStart: function () {
    this._line = 0;
  },
  areaEnd: function () {
    this._line = NaN;
  },
  lineStart: function () {
    this._x0 = this._x1 = this._y0 = this._y1 = NaN;
    this._point = 0;
  },
  lineEnd: function () {
    switch (this._point) {
      case 3:
        point(this, this._x1, this._y1);
      case 2:
        this._context.lineTo(this._x1, this._y1);
        break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function (x, y) {
    (x = +x, y = +y);
    switch (this._point) {
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        this._point = 3;
        this._context.lineTo((5 * this._x0 + this._x1) / 6, (5 * this._y0 + this._y1) / 6);
      default:
        point(this, x, y);
        break;
    }
    (this._x0 = this._x1, this._x1 = x);
    (this._y0 = this._y1, this._y1 = y);
  }
};
function __DefaultExport__(context) {
  return new Basis(context);
}
exports.default = __DefaultExport__;

},

// node_modules/d3-shape/src/curve/bump.js @84
84: function(__fusereq, exports, module){
class Bump {
  constructor(context, x) {
    this._context = context;
    this._x = x;
  }
  areaStart() {
    this._line = 0;
  }
  areaEnd() {
    this._line = NaN;
  }
  lineStart() {
    this._point = 0;
  }
  lineEnd() {
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  }
  point(x, y) {
    (x = +x, y = +y);
    switch (this._point) {
      case 0:
        {
          this._point = 1;
          if (this._line) this._context.lineTo(x, y); else this._context.moveTo(x, y);
          break;
        }
      case 1:
        this._point = 2;
      default:
        {
          if (this._x) this._context.bezierCurveTo(this._x0 = (this._x0 + x) / 2, this._y0, this._x0, y, x, y); else this._context.bezierCurveTo(this._x0, this._y0 = (this._y0 + y) / 2, x, this._y0, x, y);
          break;
        }
    }
    (this._x0 = x, this._y0 = y);
  }
}
function bumpX(context) {
  return new Bump(context, true);
}
exports.bumpX = bumpX;
function bumpY(context) {
  return new Bump(context, false);
}
exports.bumpY = bumpY;

},

// node_modules/d3-shape/src/curve/bundle.js @85
85: function(__fusereq, exports, module){
exports.__esModule = true;
var basis_js_1 = __fusereq(83);
function Bundle(context, beta) {
  this._basis = new basis_js_1.Basis(context);
  this._beta = beta;
}
Bundle.prototype = {
  lineStart: function () {
    this._x = [];
    this._y = [];
    this._basis.lineStart();
  },
  lineEnd: function () {
    var x = this._x, y = this._y, j = x.length - 1;
    if (j > 0) {
      var x0 = x[0], y0 = y[0], dx = x[j] - x0, dy = y[j] - y0, i = -1, t;
      while (++i <= j) {
        t = i / j;
        this._basis.point(this._beta * x[i] + (1 - this._beta) * (x0 + t * dx), this._beta * y[i] + (1 - this._beta) * (y0 + t * dy));
      }
    }
    this._x = this._y = null;
    this._basis.lineEnd();
  },
  point: function (x, y) {
    this._x.push(+x);
    this._y.push(+y);
  }
};
exports.default = (function custom(beta) {
  function bundle(context) {
    return beta === 1 ? new basis_js_1.Basis(context) : new Bundle(context, beta);
  }
  bundle.beta = function (beta) {
    return custom(+beta);
  };
  return bundle;
})(0.85);

},

// node_modules/d3-shape/src/curve/cardinalClosed.js @86
86: function(__fusereq, exports, module){
exports.__esModule = true;
var noop_js_1 = __fusereq(150);
var noop_js_1d = __fuse.dt(noop_js_1);
var cardinal_js_1 = __fusereq(88);
function CardinalClosed(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}
exports.CardinalClosed = CardinalClosed;
CardinalClosed.prototype = {
  areaStart: noop_js_1d.default,
  areaEnd: noop_js_1d.default,
  lineStart: function () {
    this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._x5 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = this._y5 = NaN;
    this._point = 0;
  },
  lineEnd: function () {
    switch (this._point) {
      case 1:
        {
          this._context.moveTo(this._x3, this._y3);
          this._context.closePath();
          break;
        }
      case 2:
        {
          this._context.lineTo(this._x3, this._y3);
          this._context.closePath();
          break;
        }
      case 3:
        {
          this.point(this._x3, this._y3);
          this.point(this._x4, this._y4);
          this.point(this._x5, this._y5);
          break;
        }
    }
  },
  point: function (x, y) {
    (x = +x, y = +y);
    switch (this._point) {
      case 0:
        this._point = 1;
        (this._x3 = x, this._y3 = y);
        break;
      case 1:
        this._point = 2;
        this._context.moveTo(this._x4 = x, this._y4 = y);
        break;
      case 2:
        this._point = 3;
        (this._x5 = x, this._y5 = y);
        break;
      default:
        cardinal_js_1.point(this, x, y);
        break;
    }
    (this._x0 = this._x1, this._x1 = this._x2, this._x2 = x);
    (this._y0 = this._y1, this._y1 = this._y2, this._y2 = y);
  }
};
exports.default = (function custom(tension) {
  function cardinal(context) {
    return new CardinalClosed(context, tension);
  }
  cardinal.tension = function (tension) {
    return custom(+tension);
  };
  return cardinal;
})(0);

},

// node_modules/d3-shape/src/curve/cardinalOpen.js @87
87: function(__fusereq, exports, module){
exports.__esModule = true;
var cardinal_js_1 = __fusereq(88);
function CardinalOpen(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}
exports.CardinalOpen = CardinalOpen;
CardinalOpen.prototype = {
  areaStart: function () {
    this._line = 0;
  },
  areaEnd: function () {
    this._line = NaN;
  },
  lineStart: function () {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
    this._point = 0;
  },
  lineEnd: function () {
    if (this._line || this._line !== 0 && this._point === 3) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function (x, y) {
    (x = +x, y = +y);
    switch (this._point) {
      case 0:
        this._point = 1;
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        this._point = 3;
        this._line ? this._context.lineTo(this._x2, this._y2) : this._context.moveTo(this._x2, this._y2);
        break;
      case 3:
        this._point = 4;
      default:
        cardinal_js_1.point(this, x, y);
        break;
    }
    (this._x0 = this._x1, this._x1 = this._x2, this._x2 = x);
    (this._y0 = this._y1, this._y1 = this._y2, this._y2 = y);
  }
};
exports.default = (function custom(tension) {
  function cardinal(context) {
    return new CardinalOpen(context, tension);
  }
  cardinal.tension = function (tension) {
    return custom(+tension);
  };
  return cardinal;
})(0);

},

// node_modules/d3-shape/src/curve/cardinal.js @88
88: function(__fusereq, exports, module){
exports.__esModule = true;
function point(that, x, y) {
  that._context.bezierCurveTo(that._x1 + that._k * (that._x2 - that._x0), that._y1 + that._k * (that._y2 - that._y0), that._x2 + that._k * (that._x1 - x), that._y2 + that._k * (that._y1 - y), that._x2, that._y2);
}
exports.point = point;
function Cardinal(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}
exports.Cardinal = Cardinal;
Cardinal.prototype = {
  areaStart: function () {
    this._line = 0;
  },
  areaEnd: function () {
    this._line = NaN;
  },
  lineStart: function () {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
    this._point = 0;
  },
  lineEnd: function () {
    switch (this._point) {
      case 2:
        this._context.lineTo(this._x2, this._y2);
        break;
      case 3:
        point(this, this._x1, this._y1);
        break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function (x, y) {
    (x = +x, y = +y);
    switch (this._point) {
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
        break;
      case 1:
        this._point = 2;
        (this._x1 = x, this._y1 = y);
        break;
      case 2:
        this._point = 3;
      default:
        point(this, x, y);
        break;
    }
    (this._x0 = this._x1, this._x1 = this._x2, this._x2 = x);
    (this._y0 = this._y1, this._y1 = this._y2, this._y2 = y);
  }
};
exports.default = (function custom(tension) {
  function cardinal(context) {
    return new Cardinal(context, tension);
  }
  cardinal.tension = function (tension) {
    return custom(+tension);
  };
  return cardinal;
})(0);

},

// node_modules/d3-shape/src/curve/catmullRomClosed.js @89
89: function(__fusereq, exports, module){
exports.__esModule = true;
var cardinalClosed_js_1 = __fusereq(86);
var noop_js_1 = __fusereq(150);
var noop_js_1d = __fuse.dt(noop_js_1);
var catmullRom_js_1 = __fusereq(91);
function CatmullRomClosed(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}
CatmullRomClosed.prototype = {
  areaStart: noop_js_1d.default,
  areaEnd: noop_js_1d.default,
  lineStart: function () {
    this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._x5 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = this._y5 = NaN;
    this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
  },
  lineEnd: function () {
    switch (this._point) {
      case 1:
        {
          this._context.moveTo(this._x3, this._y3);
          this._context.closePath();
          break;
        }
      case 2:
        {
          this._context.lineTo(this._x3, this._y3);
          this._context.closePath();
          break;
        }
      case 3:
        {
          this.point(this._x3, this._y3);
          this.point(this._x4, this._y4);
          this.point(this._x5, this._y5);
          break;
        }
    }
  },
  point: function (x, y) {
    (x = +x, y = +y);
    if (this._point) {
      var x23 = this._x2 - x, y23 = this._y2 - y;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }
    switch (this._point) {
      case 0:
        this._point = 1;
        (this._x3 = x, this._y3 = y);
        break;
      case 1:
        this._point = 2;
        this._context.moveTo(this._x4 = x, this._y4 = y);
        break;
      case 2:
        this._point = 3;
        (this._x5 = x, this._y5 = y);
        break;
      default:
        catmullRom_js_1.point(this, x, y);
        break;
    }
    (this._l01_a = this._l12_a, this._l12_a = this._l23_a);
    (this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a);
    (this._x0 = this._x1, this._x1 = this._x2, this._x2 = x);
    (this._y0 = this._y1, this._y1 = this._y2, this._y2 = y);
  }
};
exports.default = (function custom(alpha) {
  function catmullRom(context) {
    return alpha ? new CatmullRomClosed(context, alpha) : new cardinalClosed_js_1.CardinalClosed(context, 0);
  }
  catmullRom.alpha = function (alpha) {
    return custom(+alpha);
  };
  return catmullRom;
})(0.5);

},

// node_modules/d3-shape/src/curve/catmullRomOpen.js @90
90: function(__fusereq, exports, module){
exports.__esModule = true;
var cardinalOpen_js_1 = __fusereq(87);
var catmullRom_js_1 = __fusereq(91);
function CatmullRomOpen(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}
CatmullRomOpen.prototype = {
  areaStart: function () {
    this._line = 0;
  },
  areaEnd: function () {
    this._line = NaN;
  },
  lineStart: function () {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
    this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
  },
  lineEnd: function () {
    if (this._line || this._line !== 0 && this._point === 3) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function (x, y) {
    (x = +x, y = +y);
    if (this._point) {
      var x23 = this._x2 - x, y23 = this._y2 - y;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }
    switch (this._point) {
      case 0:
        this._point = 1;
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        this._point = 3;
        this._line ? this._context.lineTo(this._x2, this._y2) : this._context.moveTo(this._x2, this._y2);
        break;
      case 3:
        this._point = 4;
      default:
        catmullRom_js_1.point(this, x, y);
        break;
    }
    (this._l01_a = this._l12_a, this._l12_a = this._l23_a);
    (this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a);
    (this._x0 = this._x1, this._x1 = this._x2, this._x2 = x);
    (this._y0 = this._y1, this._y1 = this._y2, this._y2 = y);
  }
};
exports.default = (function custom(alpha) {
  function catmullRom(context) {
    return alpha ? new CatmullRomOpen(context, alpha) : new cardinalOpen_js_1.CardinalOpen(context, 0);
  }
  catmullRom.alpha = function (alpha) {
    return custom(+alpha);
  };
  return catmullRom;
})(0.5);

},

// node_modules/d3-shape/src/curve/catmullRom.js @91
91: function(__fusereq, exports, module){
exports.__esModule = true;
var math_js_1 = __fusereq(144);
var cardinal_js_1 = __fusereq(88);
function point(that, x, y) {
  var x1 = that._x1, y1 = that._y1, x2 = that._x2, y2 = that._y2;
  if (that._l01_a > math_js_1.epsilon) {
    var a = 2 * that._l01_2a + 3 * that._l01_a * that._l12_a + that._l12_2a, n = 3 * that._l01_a * (that._l01_a + that._l12_a);
    x1 = (x1 * a - that._x0 * that._l12_2a + that._x2 * that._l01_2a) / n;
    y1 = (y1 * a - that._y0 * that._l12_2a + that._y2 * that._l01_2a) / n;
  }
  if (that._l23_a > math_js_1.epsilon) {
    var b = 2 * that._l23_2a + 3 * that._l23_a * that._l12_a + that._l12_2a, m = 3 * that._l23_a * (that._l23_a + that._l12_a);
    x2 = (x2 * b + that._x1 * that._l23_2a - x * that._l12_2a) / m;
    y2 = (y2 * b + that._y1 * that._l23_2a - y * that._l12_2a) / m;
  }
  that._context.bezierCurveTo(x1, y1, x2, y2, that._x2, that._y2);
}
exports.point = point;
function CatmullRom(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}
CatmullRom.prototype = {
  areaStart: function () {
    this._line = 0;
  },
  areaEnd: function () {
    this._line = NaN;
  },
  lineStart: function () {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
    this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
  },
  lineEnd: function () {
    switch (this._point) {
      case 2:
        this._context.lineTo(this._x2, this._y2);
        break;
      case 3:
        this.point(this._x2, this._y2);
        break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function (x, y) {
    (x = +x, y = +y);
    if (this._point) {
      var x23 = this._x2 - x, y23 = this._y2 - y;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }
    switch (this._point) {
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        this._point = 3;
      default:
        point(this, x, y);
        break;
    }
    (this._l01_a = this._l12_a, this._l12_a = this._l23_a);
    (this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a);
    (this._x0 = this._x1, this._x1 = this._x2, this._x2 = x);
    (this._y0 = this._y1, this._y1 = this._y2, this._y2 = y);
  }
};
exports.default = (function custom(alpha) {
  function catmullRom(context) {
    return alpha ? new CatmullRom(context, alpha) : new cardinal_js_1.Cardinal(context, 0);
  }
  catmullRom.alpha = function (alpha) {
    return custom(+alpha);
  };
  return catmullRom;
})(0.5);

},

// node_modules/d3-shape/src/curve/linearClosed.js @92
92: function(__fusereq, exports, module){
exports.__esModule = true;
var noop_js_1 = __fusereq(150);
var noop_js_1d = __fuse.dt(noop_js_1);
function LinearClosed(context) {
  this._context = context;
}
LinearClosed.prototype = {
  areaStart: noop_js_1d.default,
  areaEnd: noop_js_1d.default,
  lineStart: function () {
    this._point = 0;
  },
  lineEnd: function () {
    if (this._point) this._context.closePath();
  },
  point: function (x, y) {
    (x = +x, y = +y);
    if (this._point) this._context.lineTo(x, y); else (this._point = 1, this._context.moveTo(x, y));
  }
};
function __DefaultExport__(context) {
  return new LinearClosed(context);
}
exports.default = __DefaultExport__;

},

// node_modules/d3-shape/src/curve/linear.js @93
93: function(__fusereq, exports, module){
exports.__esModule = true;
function Linear(context) {
  this._context = context;
}
Linear.prototype = {
  areaStart: function () {
    this._line = 0;
  },
  areaEnd: function () {
    this._line = NaN;
  },
  lineStart: function () {
    this._point = 0;
  },
  lineEnd: function () {
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function (x, y) {
    (x = +x, y = +y);
    switch (this._point) {
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
        break;
      case 1:
        this._point = 2;
      default:
        this._context.lineTo(x, y);
        break;
    }
  }
};
function __DefaultExport__(context) {
  return new Linear(context);
}
exports.default = __DefaultExport__;

},

// node_modules/d3-shape/src/curve/monotone.js @94
94: function(__fusereq, exports, module){
function sign(x) {
  return x < 0 ? -1 : 1;
}
function slope3(that, x2, y2) {
  var h0 = that._x1 - that._x0, h1 = x2 - that._x1, s0 = (that._y1 - that._y0) / (h0 || h1 < 0 && -0), s1 = (y2 - that._y1) / (h1 || h0 < 0 && -0), p = (s0 * h1 + s1 * h0) / (h0 + h1);
  return (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
}
function slope2(that, t) {
  var h = that._x1 - that._x0;
  return h ? (3 * (that._y1 - that._y0) / h - t) / 2 : t;
}
function point(that, t0, t1) {
  var x0 = that._x0, y0 = that._y0, x1 = that._x1, y1 = that._y1, dx = (x1 - x0) / 3;
  that._context.bezierCurveTo(x0 + dx, y0 + dx * t0, x1 - dx, y1 - dx * t1, x1, y1);
}
function MonotoneX(context) {
  this._context = context;
}
MonotoneX.prototype = {
  areaStart: function () {
    this._line = 0;
  },
  areaEnd: function () {
    this._line = NaN;
  },
  lineStart: function () {
    this._x0 = this._x1 = this._y0 = this._y1 = this._t0 = NaN;
    this._point = 0;
  },
  lineEnd: function () {
    switch (this._point) {
      case 2:
        this._context.lineTo(this._x1, this._y1);
        break;
      case 3:
        point(this, this._t0, slope2(this, this._t0));
        break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function (x, y) {
    var t1 = NaN;
    (x = +x, y = +y);
    if (x === this._x1 && y === this._y1) return;
    switch (this._point) {
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        this._point = 3;
        point(this, slope2(this, t1 = slope3(this, x, y)), t1);
        break;
      default:
        point(this, this._t0, t1 = slope3(this, x, y));
        break;
    }
    (this._x0 = this._x1, this._x1 = x);
    (this._y0 = this._y1, this._y1 = y);
    this._t0 = t1;
  }
};
function MonotoneY(context) {
  this._context = new ReflectContext(context);
}
(MonotoneY.prototype = Object.create(MonotoneX.prototype)).point = function (x, y) {
  MonotoneX.prototype.point.call(this, y, x);
};
function ReflectContext(context) {
  this._context = context;
}
ReflectContext.prototype = {
  moveTo: function (x, y) {
    this._context.moveTo(y, x);
  },
  closePath: function () {
    this._context.closePath();
  },
  lineTo: function (x, y) {
    this._context.lineTo(y, x);
  },
  bezierCurveTo: function (x1, y1, x2, y2, x, y) {
    this._context.bezierCurveTo(y1, x1, y2, x2, y, x);
  }
};
function monotoneX(context) {
  return new MonotoneX(context);
}
exports.monotoneX = monotoneX;
function monotoneY(context) {
  return new MonotoneY(context);
}
exports.monotoneY = monotoneY;

},

// node_modules/d3-shape/src/curve/natural.js @95
95: function(__fusereq, exports, module){
exports.__esModule = true;
function Natural(context) {
  this._context = context;
}
Natural.prototype = {
  areaStart: function () {
    this._line = 0;
  },
  areaEnd: function () {
    this._line = NaN;
  },
  lineStart: function () {
    this._x = [];
    this._y = [];
  },
  lineEnd: function () {
    var x = this._x, y = this._y, n = x.length;
    if (n) {
      this._line ? this._context.lineTo(x[0], y[0]) : this._context.moveTo(x[0], y[0]);
      if (n === 2) {
        this._context.lineTo(x[1], y[1]);
      } else {
        var px = controlPoints(x), py = controlPoints(y);
        for (var i0 = 0, i1 = 1; i1 < n; (++i0, ++i1)) {
          this._context.bezierCurveTo(px[0][i0], py[0][i0], px[1][i0], py[1][i0], x[i1], y[i1]);
        }
      }
    }
    if (this._line || this._line !== 0 && n === 1) this._context.closePath();
    this._line = 1 - this._line;
    this._x = this._y = null;
  },
  point: function (x, y) {
    this._x.push(+x);
    this._y.push(+y);
  }
};
function controlPoints(x) {
  var i, n = x.length - 1, m, a = new Array(n), b = new Array(n), r = new Array(n);
  (a[0] = 0, b[0] = 2, r[0] = x[0] + 2 * x[1]);
  for (i = 1; i < n - 1; ++i) (a[i] = 1, b[i] = 4, r[i] = 4 * x[i] + 2 * x[i + 1]);
  (a[n - 1] = 2, b[n - 1] = 7, r[n - 1] = 8 * x[n - 1] + x[n]);
  for (i = 1; i < n; ++i) (m = a[i] / b[i - 1], b[i] -= m, r[i] -= m * r[i - 1]);
  a[n - 1] = r[n - 1] / b[n - 1];
  for (i = n - 2; i >= 0; --i) a[i] = (r[i] - a[i + 1]) / b[i];
  b[n - 1] = (x[n] + a[n - 1]) / 2;
  for (i = 0; i < n - 1; ++i) b[i] = 2 * x[i + 1] - a[i + 1];
  return [a, b];
}
function __DefaultExport__(context) {
  return new Natural(context);
}
exports.default = __DefaultExport__;

},

// node_modules/d3-shape/src/curve/step.js @96
96: function(__fusereq, exports, module){
exports.__esModule = true;
function Step(context, t) {
  this._context = context;
  this._t = t;
}
Step.prototype = {
  areaStart: function () {
    this._line = 0;
  },
  areaEnd: function () {
    this._line = NaN;
  },
  lineStart: function () {
    this._x = this._y = NaN;
    this._point = 0;
  },
  lineEnd: function () {
    if (0 < this._t && this._t < 1 && this._point === 2) this._context.lineTo(this._x, this._y);
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    if (this._line >= 0) (this._t = 1 - this._t, this._line = 1 - this._line);
  },
  point: function (x, y) {
    (x = +x, y = +y);
    switch (this._point) {
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
        break;
      case 1:
        this._point = 2;
      default:
        {
          if (this._t <= 0) {
            this._context.lineTo(this._x, y);
            this._context.lineTo(x, y);
          } else {
            var x1 = this._x * (1 - this._t) + x * this._t;
            this._context.lineTo(x1, this._y);
            this._context.lineTo(x1, y);
          }
          break;
        }
    }
    (this._x = x, this._y = y);
  }
};
function __DefaultExport__(context) {
  return new Step(context, 0.5);
}
exports.default = __DefaultExport__;
function stepBefore(context) {
  return new Step(context, 0);
}
exports.stepBefore = stepBefore;
function stepAfter(context) {
  return new Step(context, 1);
}
exports.stepAfter = stepAfter;

},

// node_modules/d3-shape/src/stack.js @97
97: function(__fusereq, exports, module){
exports.__esModule = true;
var array_js_1 = __fusereq(145);
var array_js_1d = __fuse.dt(array_js_1);
var constant_js_1 = __fusereq(143);
var constant_js_1d = __fuse.dt(constant_js_1);
var none_js_1 = __fusereq(100);
var none_js_1d = __fuse.dt(none_js_1);
var none_js_2 = __fusereq(107);
var none_js_2d = __fuse.dt(none_js_2);
function stackValue(d, key) {
  return d[key];
}
function stackSeries(key) {
  const series = [];
  series.key = key;
  return series;
}
function __DefaultExport__() {
  var keys = constant_js_1d.default([]), order = none_js_2d.default, offset = none_js_1d.default, value = stackValue;
  function stack(data) {
    var sz = Array.from(keys.apply(this, arguments), stackSeries), i, n = sz.length, j = -1, oz;
    for (const d of data) {
      for ((i = 0, ++j); i < n; ++i) {
        (sz[i][j] = [0, +value(d, sz[i].key, j, data)]).data = d;
      }
    }
    for ((i = 0, oz = array_js_1d.default(order(sz))); i < n; ++i) {
      sz[oz[i]].index = i;
    }
    offset(sz, oz);
    return sz;
  }
  stack.keys = function (_) {
    return arguments.length ? (keys = typeof _ === "function" ? _ : constant_js_1d.default(Array.from(_)), stack) : keys;
  };
  stack.value = function (_) {
    return arguments.length ? (value = typeof _ === "function" ? _ : constant_js_1d.default(+_), stack) : value;
  };
  stack.order = function (_) {
    return arguments.length ? (order = _ == null ? none_js_2d.default : typeof _ === "function" ? _ : constant_js_1d.default(Array.from(_)), stack) : order;
  };
  stack.offset = function (_) {
    return arguments.length ? (offset = _ == null ? none_js_1d.default : _, stack) : offset;
  };
  return stack;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-shape/src/offset/expand.js @98
98: function(__fusereq, exports, module){
exports.__esModule = true;
var none_js_1 = __fusereq(100);
var none_js_1d = __fuse.dt(none_js_1);
function __DefaultExport__(series, order) {
  if (!((n = series.length) > 0)) return;
  for (var i, n, j = 0, m = series[0].length, y; j < m; ++j) {
    for (y = i = 0; i < n; ++i) y += series[i][j][1] || 0;
    if (y) for (i = 0; i < n; ++i) series[i][j][1] /= y;
  }
  none_js_1d.default(series, order);
}
exports.default = __DefaultExport__;

},

// node_modules/d3-shape/src/offset/diverging.js @99
99: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__(series, order) {
  if (!((n = series.length) > 0)) return;
  for (var i, j = 0, d, dy, yp, yn, n, m = series[order[0]].length; j < m; ++j) {
    for ((yp = yn = 0, i = 0); i < n; ++i) {
      if ((dy = (d = series[order[i]][j])[1] - d[0]) > 0) {
        (d[0] = yp, d[1] = yp += dy);
      } else if (dy < 0) {
        (d[1] = yn, d[0] = yn += dy);
      } else {
        (d[0] = 0, d[1] = dy);
      }
    }
  }
}
exports.default = __DefaultExport__;

},

// node_modules/d3-shape/src/offset/none.js @100
100: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__(series, order) {
  if (!((n = series.length) > 1)) return;
  for (var i = 1, j, s0, s1 = series[order[0]], n, m = s1.length; i < n; ++i) {
    (s0 = s1, s1 = series[order[i]]);
    for (j = 0; j < m; ++j) {
      s1[j][1] += s1[j][0] = isNaN(s0[j][1]) ? s0[j][0] : s0[j][1];
    }
  }
}
exports.default = __DefaultExport__;

},

// node_modules/d3-shape/src/offset/silhouette.js @101
101: function(__fusereq, exports, module){
exports.__esModule = true;
var none_js_1 = __fusereq(100);
var none_js_1d = __fuse.dt(none_js_1);
function __DefaultExport__(series, order) {
  if (!((n = series.length) > 0)) return;
  for (var j = 0, s0 = series[order[0]], n, m = s0.length; j < m; ++j) {
    for (var i = 0, y = 0; i < n; ++i) y += series[i][j][1] || 0;
    s0[j][1] += s0[j][0] = -y / 2;
  }
  none_js_1d.default(series, order);
}
exports.default = __DefaultExport__;

},

// node_modules/d3-shape/src/offset/wiggle.js @102
102: function(__fusereq, exports, module){
exports.__esModule = true;
var none_js_1 = __fusereq(100);
var none_js_1d = __fuse.dt(none_js_1);
function __DefaultExport__(series, order) {
  if (!((n = series.length) > 0) || !((m = (s0 = series[order[0]]).length) > 0)) return;
  for (var y = 0, j = 1, s0, m, n; j < m; ++j) {
    for (var i = 0, s1 = 0, s2 = 0; i < n; ++i) {
      var si = series[order[i]], sij0 = si[j][1] || 0, sij1 = si[j - 1][1] || 0, s3 = (sij0 - sij1) / 2;
      for (var k = 0; k < i; ++k) {
        var sk = series[order[k]], skj0 = sk[j][1] || 0, skj1 = sk[j - 1][1] || 0;
        s3 += skj0 - skj1;
      }
      (s1 += sij0, s2 += s3 * sij0);
    }
    s0[j - 1][1] += s0[j - 1][0] = y;
    if (s1) y -= s2 / s1;
  }
  s0[j - 1][1] += s0[j - 1][0] = y;
  none_js_1d.default(series, order);
}
exports.default = __DefaultExport__;

},

// node_modules/d3-shape/src/order/appearance.js @103
103: function(__fusereq, exports, module){
exports.__esModule = true;
var none_js_1 = __fusereq(107);
var none_js_1d = __fuse.dt(none_js_1);
function __DefaultExport__(series) {
  var peaks = series.map(peak);
  return none_js_1d.default(series).sort(function (a, b) {
    return peaks[a] - peaks[b];
  });
}
exports.default = __DefaultExport__;
function peak(series) {
  var i = -1, j = 0, n = series.length, vi, vj = -Infinity;
  while (++i < n) if ((vi = +series[i][1]) > vj) (vj = vi, j = i);
  return j;
}

},

// node_modules/d3-shape/src/order/ascending.js @104
104: function(__fusereq, exports, module){
exports.__esModule = true;
var none_js_1 = __fusereq(107);
var none_js_1d = __fuse.dt(none_js_1);
function __DefaultExport__(series) {
  var sums = series.map(sum);
  return none_js_1d.default(series).sort(function (a, b) {
    return sums[a] - sums[b];
  });
}
exports.default = __DefaultExport__;
function sum(series) {
  var s = 0, i = -1, n = series.length, v;
  while (++i < n) if (v = +series[i][1]) s += v;
  return s;
}
exports.sum = sum;

},

// node_modules/d3-shape/src/order/descending.js @105
105: function(__fusereq, exports, module){
exports.__esModule = true;
var ascending_js_1 = __fusereq(104);
var ascending_js_1d = __fuse.dt(ascending_js_1);
function __DefaultExport__(series) {
  return ascending_js_1d.default(series).reverse();
}
exports.default = __DefaultExport__;

},

// node_modules/d3-shape/src/order/insideOut.js @106
106: function(__fusereq, exports, module){
exports.__esModule = true;
var appearance_js_1 = __fusereq(103);
var appearance_js_1d = __fuse.dt(appearance_js_1);
var ascending_js_1 = __fusereq(104);
function __DefaultExport__(series) {
  var n = series.length, i, j, sums = series.map(ascending_js_1.sum), order = appearance_js_1d.default(series), top = 0, bottom = 0, tops = [], bottoms = [];
  for (i = 0; i < n; ++i) {
    j = order[i];
    if (top < bottom) {
      top += sums[j];
      tops.push(j);
    } else {
      bottom += sums[j];
      bottoms.push(j);
    }
  }
  return bottoms.reverse().concat(tops);
}
exports.default = __DefaultExport__;

},

// node_modules/d3-shape/src/order/none.js @107
107: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__(series) {
  var n = series.length, o = new Array(n);
  while (--n >= 0) o[n] = n;
  return o;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-shape/src/order/reverse.js @108
108: function(__fusereq, exports, module){
exports.__esModule = true;
var none_js_1 = __fusereq(107);
var none_js_1d = __fuse.dt(none_js_1);
function __DefaultExport__(series) {
  return none_js_1d.default(series).reverse();
}
exports.default = __DefaultExport__;

},

// node_modules/d3-shape/src/constant.js @143
143: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__(x) {
  return function constant() {
    return x;
  };
}
exports.default = __DefaultExport__;

},

// node_modules/d3-shape/src/math.js @144
144: function(__fusereq, exports, module){
exports.__esModule = true;
exports.abs = Math.abs;
exports.atan2 = Math.atan2;
exports.cos = Math.cos;
exports.max = Math.max;
exports.min = Math.min;
exports.sin = Math.sin;
exports.sqrt = Math.sqrt;
exports.epsilon = 1e-12;
exports.pi = Math.PI;
exports.halfPi = exports.pi / 2;
exports.tau = 2 * exports.pi;
function acos(x) {
  return x > 1 ? 0 : x < -1 ? exports.pi : Math.acos(x);
}
exports.acos = acos;
function asin(x) {
  return x >= 1 ? exports.halfPi : x <= -1 ? -exports.halfPi : Math.asin(x);
}
exports.asin = asin;

},

// node_modules/d3-shape/src/array.js @145
145: function(__fusereq, exports, module){
exports.__esModule = true;
exports.slice = Array.prototype.slice;
function __DefaultExport__(x) {
  return typeof x === "object" && ("length" in x) ? x : Array.from(x);
}
exports.default = __DefaultExport__;

},

// node_modules/d3-shape/src/point.js @146
146: function(__fusereq, exports, module){
function x(p) {
  return p[0];
}
exports.x = x;
function y(p) {
  return p[1];
}
exports.y = y;

},

// node_modules/d3-shape/src/descending.js @147
147: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__(a, b) {
  return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-shape/src/identity.js @148
148: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__(d) {
  return d;
}
exports.default = __DefaultExport__;

},

// node_modules/d3-shape/src/curve/radial.js @149
149: function(__fusereq, exports, module){
exports.__esModule = true;
var linear_js_1 = __fusereq(93);
var linear_js_1d = __fuse.dt(linear_js_1);
exports.curveRadialLinear = curveRadial(linear_js_1d.default);
function Radial(curve) {
  this._curve = curve;
}
Radial.prototype = {
  areaStart: function () {
    this._curve.areaStart();
  },
  areaEnd: function () {
    this._curve.areaEnd();
  },
  lineStart: function () {
    this._curve.lineStart();
  },
  lineEnd: function () {
    this._curve.lineEnd();
  },
  point: function (a, r) {
    this._curve.point(r * Math.sin(a), r * -Math.cos(a));
  }
};
function curveRadial(curve) {
  function radial(context) {
    return new Radial(curve(context));
  }
  radial._curve = curve;
  return radial;
}
exports.default = curveRadial;

},

// node_modules/d3-shape/src/noop.js @150
150: function(__fusereq, exports, module){
exports.__esModule = true;
function __DefaultExport__() {}
exports.default = __DefaultExport__;

}
}, function(){
__fuse.r(1)
const hmr = __fuse.r(2);
hmr.connect({"useCurrentURL":true})
})
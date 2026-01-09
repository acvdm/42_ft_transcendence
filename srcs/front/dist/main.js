"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // scripts/pages/LoginPage.html
  var LoginPage_default = `	<div class="w-screen h-[200px] bg-cover bg-center bg-no-repeat" style="background-image: url(/assets/basic/background.jpg); background-size: cover;"></div>
		<!-- Main div -->
	<div class="flex flex-col justify-center items-center gap-6 mt-[-50px]">
		<!-- Picture div -->
		<div class="relative w-[170px] h-[170px] mb-4">
			<!-- le cadre -->
			<img class="absolute inset-0 w-full h-full object-cover" src="/assets/basic/status_frame_offline_large.png">
			<!-- l'image -->
			<img class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[130px] h-[130px] object-cover" src="/assets/basic/default.png">
		</div>
		<h1 class="font-sans text-xl font-normal text-blue-950">
			Sign in to Transcendence
		</h1>
		<!-- Login div -->
		<div class="flex flex-col justify-center items-center gap-6">
			<div class="border border-gray-300 appearance-none [border-color:rgb(209,213,219)] rounded-sm bg-white w-80 p-4 shadow-sm">
				<!-- Email -->
				<input type="email" placeholder="Example555@hotmail.com" id="email-input"
					class="w-full border border-gray-300 appearance-none [border-color:rgb(209,213,219)] rounded-sm p-2 text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-blue-400"/>
		
				<!-- Mot de passe -->
				<input type="password" placeholder="Enter your password" id="password-input"
					class="w-full border border-gray-300 appearance-none [border-color:rgb(209,213,219)] rounded-sm p-2 text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-blue-400"/>

				<!-- Status -> disponible, busy, not displayed -->
				<div class="flex items-center justify-between mb-3 text-sm">
					<div class="flex items-center gap-1 mb-3">
						<span> Sign in as:</span>
						<div class="flex items-center gap-1">
							<select id="status-input" class="bg-transparent focus:outline-none text-sm">
								<option value="available">Available</option>
								<option value="busy">Busy</option>
								<option value="away">Away</option>
								<option value="offline">Appear offline</option>
							</select>
						</div>
					</div>
				</div>
				<div class="flex flex-col items-center justify-center">
					<p id="error-message" class="text-red-600 text-sm mb-2 hidden"></p>
				</div>
			</div>
			<!-- Bouton de connexion/Register/Guest -->
			<div class="flex flex-col gap-2 w-48">
				<button id="login-button" class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 appearance-none [border-color:rgb(209,213,219)] rounded-sm px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">Login</button>
			</div>
	</div>



	<div id="2fa-modal" class="absolute inset-0 bg-black/40 z-50 hidden items-center justify-center">
        <div class="window bg-white" style="width: 400px; box-shadow: 0px 0px 20px rgba(0,0,0,0.5);">
            <div class="title-bar">
                <div class="title-bar-text">Two-Factor Authentication</div>
                <div class="title-bar-controls">
                    <button id="close-2fa-modal" aria-label="Close"></button>
                </div>
            </div>
            <div class="window-body p-6 flex flex-col items-center gap-4">
                <div class="text-center">
                    <h2 class="text-lg font-bold mb-2">Security Check</h2>
                    <p class="text-xs text-gray-600 mb-4">Please enter the security code.</p>
                </div>

                <div class="w-full flex flex-col gap-2 mt-2">
                    <input type="text" id="2fa-input-code" placeholder="------" maxlength="6" 
                           class="w-full border border-gray-300 rounded-sm p-2 text-center text-lg tracking-widest font-mono shadow-inner focus:outline-none focus:border-blue-400">
                </div>

                <div class="flex flex-col items-center justify-center">
                    <p id="2fa-error-message" class="text-red-600 text-sm mb-2 hidden"></p>
                </div>

                <div class="flex justify-center gap-4 mt-4 w-full">
                    <button id="confirm-2fa-button" 
                            class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm 
                                px-6 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 
                                active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 font-bold">
                        VERIFY
                    </button>
                </div>
            </div>
        </div>
    </div>




</div>`;

  // scripts/pages/api.ts
  var isRefreshing = false;
  var refreshSubscribers = [];
  var refreshPromise = null;
  function subscribeTokenRefresh(cb) {
    refreshSubscribers.push(cb);
  }
  function onRefreshed(token) {
    refreshSubscribers.forEach((cb) => cb(token));
    refreshSubscribers = [];
  }
  function getAuthToken() {
    return sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");
  }
  async function fetchWithAuth(url2, options = {}) {
    let token = getAuthToken();
    const getConfigWithAuth = (tokenToUse, originalOptions) => {
      const headers = new Headers(originalOptions.headers || {});
      if (headers.has("Authorization"))
        headers.delete("Authorization");
      if (!headers.has("Content-Type") && originalOptions.body)
        headers.set("Content-Type", "application/json");
      if (tokenToUse) {
        headers.set("Authorization", `Bearer ${tokenToUse}`);
      }
      return {
        ...originalOptions,
        headers
        // remplace/ajoute headers aux parametresdeoriginalOptions (method,body,....)
      };
    };
    let response = await fetch(url2, getConfigWithAuth(token, options));
    if (response.status === 401) {
      console.warn(`401 detected fo ${url2}`);
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = (async () => {
          try {
            const refreshRes = await fetch("/api/auth/token", {
              method: "POST",
              credentials: "include"
            });
            if (refreshRes.ok) {
              const data = await refreshRes.json();
              console.log("Refresh successful, data:", data);
              const newToken = data.accessToken;
              if (!newToken)
                throw new Error("No accessToken in refresh response");
              localStorage.setItem("accessToken", newToken);
              onRefreshed(newToken);
              return newToken;
            } else {
              const errorText = await refreshRes.text();
              console.error("Refresh failed:", errorText);
              throw new Error(`Refresh failed:, ${refreshRes.status}`);
            }
          } catch (error) {
            console.error("Refresh error:", error);
            throw error;
          } finally {
            isRefreshing = false;
            refreshPromise = null;
          }
        })();
        try {
          const newToken = await refreshPromise;
          console.log("Refreshing original request with new token");
          return await fetch(url2, getConfigWithAuth(newToken, options));
        } catch (error) {
          console.error("Refresh impossible. Deconnection");
          refreshSubscribers = [];
          console.error("Refresh impossible. Deconnection.");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("userId");
          window.history.pushState({}, "", "/login");
          window.dispatchEvent(new PopStateEvent("popstate"));
          throw error;
        }
      } else {
        console.log("Token expired. Waiting the refreshing of the other token...");
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh(async (newToken) => {
            try {
              const retryResponse = await fetch(url2, getConfigWithAuth(newToken, options));
              resolve(retryResponse);
            } catch (err) {
              console.error(`Error retrying queud for ${url2}:`, err);
              reject(err);
            }
          });
          setTimeout(() => {
            reject(new Error(`Token refresh timeout`));
          }, 1e4);
        });
      }
    }
    return response;
  }

  // node_modules/engine.io-parser/build/esm/commons.js
  var PACKET_TYPES = /* @__PURE__ */ Object.create(null);
  PACKET_TYPES["open"] = "0";
  PACKET_TYPES["close"] = "1";
  PACKET_TYPES["ping"] = "2";
  PACKET_TYPES["pong"] = "3";
  PACKET_TYPES["message"] = "4";
  PACKET_TYPES["upgrade"] = "5";
  PACKET_TYPES["noop"] = "6";
  var PACKET_TYPES_REVERSE = /* @__PURE__ */ Object.create(null);
  Object.keys(PACKET_TYPES).forEach((key) => {
    PACKET_TYPES_REVERSE[PACKET_TYPES[key]] = key;
  });
  var ERROR_PACKET = { type: "error", data: "parser error" };

  // node_modules/engine.io-parser/build/esm/encodePacket.browser.js
  var withNativeBlob = typeof Blob === "function" || typeof Blob !== "undefined" && Object.prototype.toString.call(Blob) === "[object BlobConstructor]";
  var withNativeArrayBuffer = typeof ArrayBuffer === "function";
  var isView = (obj) => {
    return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj && obj.buffer instanceof ArrayBuffer;
  };
  var encodePacket = ({ type, data }, supportsBinary, callback) => {
    if (withNativeBlob && data instanceof Blob) {
      if (supportsBinary) {
        return callback(data);
      } else {
        return encodeBlobAsBase64(data, callback);
      }
    } else if (withNativeArrayBuffer && (data instanceof ArrayBuffer || isView(data))) {
      if (supportsBinary) {
        return callback(data);
      } else {
        return encodeBlobAsBase64(new Blob([data]), callback);
      }
    }
    return callback(PACKET_TYPES[type] + (data || ""));
  };
  var encodeBlobAsBase64 = (data, callback) => {
    const fileReader = new FileReader();
    fileReader.onload = function() {
      const content = fileReader.result.split(",")[1];
      callback("b" + (content || ""));
    };
    return fileReader.readAsDataURL(data);
  };
  function toArray(data) {
    if (data instanceof Uint8Array) {
      return data;
    } else if (data instanceof ArrayBuffer) {
      return new Uint8Array(data);
    } else {
      return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    }
  }
  var TEXT_ENCODER;
  function encodePacketToBinary(packet, callback) {
    if (withNativeBlob && packet.data instanceof Blob) {
      return packet.data.arrayBuffer().then(toArray).then(callback);
    } else if (withNativeArrayBuffer && (packet.data instanceof ArrayBuffer || isView(packet.data))) {
      return callback(toArray(packet.data));
    }
    encodePacket(packet, false, (encoded) => {
      if (!TEXT_ENCODER) {
        TEXT_ENCODER = new TextEncoder();
      }
      callback(TEXT_ENCODER.encode(encoded));
    });
  }

  // node_modules/engine.io-parser/build/esm/contrib/base64-arraybuffer.js
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var lookup = typeof Uint8Array === "undefined" ? [] : new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }
  var decode = (base64) => {
    let bufferLength = base64.length * 0.75, len = base64.length, i, p = 0, encoded1, encoded2, encoded3, encoded4;
    if (base64[base64.length - 1] === "=") {
      bufferLength--;
      if (base64[base64.length - 2] === "=") {
        bufferLength--;
      }
    }
    const arraybuffer = new ArrayBuffer(bufferLength), bytes = new Uint8Array(arraybuffer);
    for (i = 0; i < len; i += 4) {
      encoded1 = lookup[base64.charCodeAt(i)];
      encoded2 = lookup[base64.charCodeAt(i + 1)];
      encoded3 = lookup[base64.charCodeAt(i + 2)];
      encoded4 = lookup[base64.charCodeAt(i + 3)];
      bytes[p++] = encoded1 << 2 | encoded2 >> 4;
      bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
      bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
    }
    return arraybuffer;
  };

  // node_modules/engine.io-parser/build/esm/decodePacket.browser.js
  var withNativeArrayBuffer2 = typeof ArrayBuffer === "function";
  var decodePacket = (encodedPacket, binaryType) => {
    if (typeof encodedPacket !== "string") {
      return {
        type: "message",
        data: mapBinary(encodedPacket, binaryType)
      };
    }
    const type = encodedPacket.charAt(0);
    if (type === "b") {
      return {
        type: "message",
        data: decodeBase64Packet(encodedPacket.substring(1), binaryType)
      };
    }
    const packetType = PACKET_TYPES_REVERSE[type];
    if (!packetType) {
      return ERROR_PACKET;
    }
    return encodedPacket.length > 1 ? {
      type: PACKET_TYPES_REVERSE[type],
      data: encodedPacket.substring(1)
    } : {
      type: PACKET_TYPES_REVERSE[type]
    };
  };
  var decodeBase64Packet = (data, binaryType) => {
    if (withNativeArrayBuffer2) {
      const decoded = decode(data);
      return mapBinary(decoded, binaryType);
    } else {
      return { base64: true, data };
    }
  };
  var mapBinary = (data, binaryType) => {
    switch (binaryType) {
      case "blob":
        if (data instanceof Blob) {
          return data;
        } else {
          return new Blob([data]);
        }
      case "arraybuffer":
      default:
        if (data instanceof ArrayBuffer) {
          return data;
        } else {
          return data.buffer;
        }
    }
  };

  // node_modules/engine.io-parser/build/esm/index.js
  var SEPARATOR = String.fromCharCode(30);
  var encodePayload = (packets, callback) => {
    const length = packets.length;
    const encodedPackets = new Array(length);
    let count = 0;
    packets.forEach((packet, i) => {
      encodePacket(packet, false, (encodedPacket) => {
        encodedPackets[i] = encodedPacket;
        if (++count === length) {
          callback(encodedPackets.join(SEPARATOR));
        }
      });
    });
  };
  var decodePayload = (encodedPayload, binaryType) => {
    const encodedPackets = encodedPayload.split(SEPARATOR);
    const packets = [];
    for (let i = 0; i < encodedPackets.length; i++) {
      const decodedPacket = decodePacket(encodedPackets[i], binaryType);
      packets.push(decodedPacket);
      if (decodedPacket.type === "error") {
        break;
      }
    }
    return packets;
  };
  function createPacketEncoderStream() {
    return new TransformStream({
      transform(packet, controller) {
        encodePacketToBinary(packet, (encodedPacket) => {
          const payloadLength = encodedPacket.length;
          let header;
          if (payloadLength < 126) {
            header = new Uint8Array(1);
            new DataView(header.buffer).setUint8(0, payloadLength);
          } else if (payloadLength < 65536) {
            header = new Uint8Array(3);
            const view = new DataView(header.buffer);
            view.setUint8(0, 126);
            view.setUint16(1, payloadLength);
          } else {
            header = new Uint8Array(9);
            const view = new DataView(header.buffer);
            view.setUint8(0, 127);
            view.setBigUint64(1, BigInt(payloadLength));
          }
          if (packet.data && typeof packet.data !== "string") {
            header[0] |= 128;
          }
          controller.enqueue(header);
          controller.enqueue(encodedPacket);
        });
      }
    });
  }
  var TEXT_DECODER;
  function totalLength(chunks) {
    return chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  }
  function concatChunks(chunks, size) {
    if (chunks[0].length === size) {
      return chunks.shift();
    }
    const buffer = new Uint8Array(size);
    let j = 0;
    for (let i = 0; i < size; i++) {
      buffer[i] = chunks[0][j++];
      if (j === chunks[0].length) {
        chunks.shift();
        j = 0;
      }
    }
    if (chunks.length && j < chunks[0].length) {
      chunks[0] = chunks[0].slice(j);
    }
    return buffer;
  }
  function createPacketDecoderStream(maxPayload, binaryType) {
    if (!TEXT_DECODER) {
      TEXT_DECODER = new TextDecoder();
    }
    const chunks = [];
    let state = 0;
    let expectedLength = -1;
    let isBinary2 = false;
    return new TransformStream({
      transform(chunk, controller) {
        chunks.push(chunk);
        while (true) {
          if (state === 0) {
            if (totalLength(chunks) < 1) {
              break;
            }
            const header = concatChunks(chunks, 1);
            isBinary2 = (header[0] & 128) === 128;
            expectedLength = header[0] & 127;
            if (expectedLength < 126) {
              state = 3;
            } else if (expectedLength === 126) {
              state = 1;
            } else {
              state = 2;
            }
          } else if (state === 1) {
            if (totalLength(chunks) < 2) {
              break;
            }
            const headerArray = concatChunks(chunks, 2);
            expectedLength = new DataView(headerArray.buffer, headerArray.byteOffset, headerArray.length).getUint16(0);
            state = 3;
          } else if (state === 2) {
            if (totalLength(chunks) < 8) {
              break;
            }
            const headerArray = concatChunks(chunks, 8);
            const view = new DataView(headerArray.buffer, headerArray.byteOffset, headerArray.length);
            const n = view.getUint32(0);
            if (n > Math.pow(2, 53 - 32) - 1) {
              controller.enqueue(ERROR_PACKET);
              break;
            }
            expectedLength = n * Math.pow(2, 32) + view.getUint32(4);
            state = 3;
          } else {
            if (totalLength(chunks) < expectedLength) {
              break;
            }
            const data = concatChunks(chunks, expectedLength);
            controller.enqueue(decodePacket(isBinary2 ? data : TEXT_DECODER.decode(data), binaryType));
            state = 0;
          }
          if (expectedLength === 0 || expectedLength > maxPayload) {
            controller.enqueue(ERROR_PACKET);
            break;
          }
        }
      }
    });
  }
  var protocol = 4;

  // node_modules/@socket.io/component-emitter/lib/esm/index.js
  function Emitter(obj) {
    if (obj) return mixin(obj);
  }
  function mixin(obj) {
    for (var key in Emitter.prototype) {
      obj[key] = Emitter.prototype[key];
    }
    return obj;
  }
  Emitter.prototype.on = Emitter.prototype.addEventListener = function(event, fn) {
    this._callbacks = this._callbacks || {};
    (this._callbacks["$" + event] = this._callbacks["$" + event] || []).push(fn);
    return this;
  };
  Emitter.prototype.once = function(event, fn) {
    function on2() {
      this.off(event, on2);
      fn.apply(this, arguments);
    }
    on2.fn = fn;
    this.on(event, on2);
    return this;
  };
  Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function(event, fn) {
    this._callbacks = this._callbacks || {};
    if (0 == arguments.length) {
      this._callbacks = {};
      return this;
    }
    var callbacks = this._callbacks["$" + event];
    if (!callbacks) return this;
    if (1 == arguments.length) {
      delete this._callbacks["$" + event];
      return this;
    }
    var cb;
    for (var i = 0; i < callbacks.length; i++) {
      cb = callbacks[i];
      if (cb === fn || cb.fn === fn) {
        callbacks.splice(i, 1);
        break;
      }
    }
    if (callbacks.length === 0) {
      delete this._callbacks["$" + event];
    }
    return this;
  };
  Emitter.prototype.emit = function(event) {
    this._callbacks = this._callbacks || {};
    var args = new Array(arguments.length - 1), callbacks = this._callbacks["$" + event];
    for (var i = 1; i < arguments.length; i++) {
      args[i - 1] = arguments[i];
    }
    if (callbacks) {
      callbacks = callbacks.slice(0);
      for (var i = 0, len = callbacks.length; i < len; ++i) {
        callbacks[i].apply(this, args);
      }
    }
    return this;
  };
  Emitter.prototype.emitReserved = Emitter.prototype.emit;
  Emitter.prototype.listeners = function(event) {
    this._callbacks = this._callbacks || {};
    return this._callbacks["$" + event] || [];
  };
  Emitter.prototype.hasListeners = function(event) {
    return !!this.listeners(event).length;
  };

  // node_modules/engine.io-client/build/esm/globals.js
  var nextTick = (() => {
    const isPromiseAvailable = typeof Promise === "function" && typeof Promise.resolve === "function";
    if (isPromiseAvailable) {
      return (cb) => Promise.resolve().then(cb);
    } else {
      return (cb, setTimeoutFn) => setTimeoutFn(cb, 0);
    }
  })();
  var globalThisShim = (() => {
    if (typeof self !== "undefined") {
      return self;
    } else if (typeof window !== "undefined") {
      return window;
    } else {
      return Function("return this")();
    }
  })();
  var defaultBinaryType = "arraybuffer";
  function createCookieJar() {
  }

  // node_modules/engine.io-client/build/esm/util.js
  function pick(obj, ...attr) {
    return attr.reduce((acc, k) => {
      if (obj.hasOwnProperty(k)) {
        acc[k] = obj[k];
      }
      return acc;
    }, {});
  }
  var NATIVE_SET_TIMEOUT = globalThisShim.setTimeout;
  var NATIVE_CLEAR_TIMEOUT = globalThisShim.clearTimeout;
  function installTimerFunctions(obj, opts) {
    if (opts.useNativeTimers) {
      obj.setTimeoutFn = NATIVE_SET_TIMEOUT.bind(globalThisShim);
      obj.clearTimeoutFn = NATIVE_CLEAR_TIMEOUT.bind(globalThisShim);
    } else {
      obj.setTimeoutFn = globalThisShim.setTimeout.bind(globalThisShim);
      obj.clearTimeoutFn = globalThisShim.clearTimeout.bind(globalThisShim);
    }
  }
  var BASE64_OVERHEAD = 1.33;
  function byteLength(obj) {
    if (typeof obj === "string") {
      return utf8Length(obj);
    }
    return Math.ceil((obj.byteLength || obj.size) * BASE64_OVERHEAD);
  }
  function utf8Length(str) {
    let c = 0, length = 0;
    for (let i = 0, l = str.length; i < l; i++) {
      c = str.charCodeAt(i);
      if (c < 128) {
        length += 1;
      } else if (c < 2048) {
        length += 2;
      } else if (c < 55296 || c >= 57344) {
        length += 3;
      } else {
        i++;
        length += 4;
      }
    }
    return length;
  }
  function randomString() {
    return Date.now().toString(36).substring(3) + Math.random().toString(36).substring(2, 5);
  }

  // node_modules/engine.io-client/build/esm/contrib/parseqs.js
  function encode(obj) {
    let str = "";
    for (let i in obj) {
      if (obj.hasOwnProperty(i)) {
        if (str.length)
          str += "&";
        str += encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]);
      }
    }
    return str;
  }
  function decode2(qs) {
    let qry = {};
    let pairs = qs.split("&");
    for (let i = 0, l = pairs.length; i < l; i++) {
      let pair = pairs[i].split("=");
      qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
    return qry;
  }

  // node_modules/engine.io-client/build/esm/transport.js
  var TransportError = class extends Error {
    constructor(reason, description, context) {
      super(reason);
      this.description = description;
      this.context = context;
      this.type = "TransportError";
    }
  };
  var Transport = class extends Emitter {
    /**
     * Transport abstract constructor.
     *
     * @param {Object} opts - options
     * @protected
     */
    constructor(opts) {
      super();
      this.writable = false;
      installTimerFunctions(this, opts);
      this.opts = opts;
      this.query = opts.query;
      this.socket = opts.socket;
      this.supportsBinary = !opts.forceBase64;
    }
    /**
     * Emits an error.
     *
     * @param {String} reason
     * @param description
     * @param context - the error context
     * @return {Transport} for chaining
     * @protected
     */
    onError(reason, description, context) {
      super.emitReserved("error", new TransportError(reason, description, context));
      return this;
    }
    /**
     * Opens the transport.
     */
    open() {
      this.readyState = "opening";
      this.doOpen();
      return this;
    }
    /**
     * Closes the transport.
     */
    close() {
      if (this.readyState === "opening" || this.readyState === "open") {
        this.doClose();
        this.onClose();
      }
      return this;
    }
    /**
     * Sends multiple packets.
     *
     * @param {Array} packets
     */
    send(packets) {
      if (this.readyState === "open") {
        this.write(packets);
      } else {
      }
    }
    /**
     * Called upon open
     *
     * @protected
     */
    onOpen() {
      this.readyState = "open";
      this.writable = true;
      super.emitReserved("open");
    }
    /**
     * Called with data.
     *
     * @param {String} data
     * @protected
     */
    onData(data) {
      const packet = decodePacket(data, this.socket.binaryType);
      this.onPacket(packet);
    }
    /**
     * Called with a decoded packet.
     *
     * @protected
     */
    onPacket(packet) {
      super.emitReserved("packet", packet);
    }
    /**
     * Called upon close.
     *
     * @protected
     */
    onClose(details) {
      this.readyState = "closed";
      super.emitReserved("close", details);
    }
    /**
     * Pauses the transport, in order not to lose packets during an upgrade.
     *
     * @param onPause
     */
    pause(onPause) {
    }
    createUri(schema, query = {}) {
      return schema + "://" + this._hostname() + this._port() + this.opts.path + this._query(query);
    }
    _hostname() {
      const hostname = this.opts.hostname;
      return hostname.indexOf(":") === -1 ? hostname : "[" + hostname + "]";
    }
    _port() {
      if (this.opts.port && (this.opts.secure && Number(this.opts.port !== 443) || !this.opts.secure && Number(this.opts.port) !== 80)) {
        return ":" + this.opts.port;
      } else {
        return "";
      }
    }
    _query(query) {
      const encodedQuery = encode(query);
      return encodedQuery.length ? "?" + encodedQuery : "";
    }
  };

  // node_modules/engine.io-client/build/esm/transports/polling.js
  var Polling = class extends Transport {
    constructor() {
      super(...arguments);
      this._polling = false;
    }
    get name() {
      return "polling";
    }
    /**
     * Opens the socket (triggers polling). We write a PING message to determine
     * when the transport is open.
     *
     * @protected
     */
    doOpen() {
      this._poll();
    }
    /**
     * Pauses polling.
     *
     * @param {Function} onPause - callback upon buffers are flushed and transport is paused
     * @package
     */
    pause(onPause) {
      this.readyState = "pausing";
      const pause = () => {
        this.readyState = "paused";
        onPause();
      };
      if (this._polling || !this.writable) {
        let total = 0;
        if (this._polling) {
          total++;
          this.once("pollComplete", function() {
            --total || pause();
          });
        }
        if (!this.writable) {
          total++;
          this.once("drain", function() {
            --total || pause();
          });
        }
      } else {
        pause();
      }
    }
    /**
     * Starts polling cycle.
     *
     * @private
     */
    _poll() {
      this._polling = true;
      this.doPoll();
      this.emitReserved("poll");
    }
    /**
     * Overloads onData to detect payloads.
     *
     * @protected
     */
    onData(data) {
      const callback = (packet) => {
        if ("opening" === this.readyState && packet.type === "open") {
          this.onOpen();
        }
        if ("close" === packet.type) {
          this.onClose({ description: "transport closed by the server" });
          return false;
        }
        this.onPacket(packet);
      };
      decodePayload(data, this.socket.binaryType).forEach(callback);
      if ("closed" !== this.readyState) {
        this._polling = false;
        this.emitReserved("pollComplete");
        if ("open" === this.readyState) {
          this._poll();
        } else {
        }
      }
    }
    /**
     * For polling, send a close packet.
     *
     * @protected
     */
    doClose() {
      const close = () => {
        this.write([{ type: "close" }]);
      };
      if ("open" === this.readyState) {
        close();
      } else {
        this.once("open", close);
      }
    }
    /**
     * Writes a packets payload.
     *
     * @param {Array} packets - data packets
     * @protected
     */
    write(packets) {
      this.writable = false;
      encodePayload(packets, (data) => {
        this.doWrite(data, () => {
          this.writable = true;
          this.emitReserved("drain");
        });
      });
    }
    /**
     * Generates uri for connection.
     *
     * @private
     */
    uri() {
      const schema = this.opts.secure ? "https" : "http";
      const query = this.query || {};
      if (false !== this.opts.timestampRequests) {
        query[this.opts.timestampParam] = randomString();
      }
      if (!this.supportsBinary && !query.sid) {
        query.b64 = 1;
      }
      return this.createUri(schema, query);
    }
  };

  // node_modules/engine.io-client/build/esm/contrib/has-cors.js
  var value = false;
  try {
    value = typeof XMLHttpRequest !== "undefined" && "withCredentials" in new XMLHttpRequest();
  } catch (err) {
  }
  var hasCORS = value;

  // node_modules/engine.io-client/build/esm/transports/polling-xhr.js
  function empty() {
  }
  var BaseXHR = class extends Polling {
    /**
     * XHR Polling constructor.
     *
     * @param {Object} opts
     * @package
     */
    constructor(opts) {
      super(opts);
      if (typeof location !== "undefined") {
        const isSSL = "https:" === location.protocol;
        let port = location.port;
        if (!port) {
          port = isSSL ? "443" : "80";
        }
        this.xd = typeof location !== "undefined" && opts.hostname !== location.hostname || port !== opts.port;
      }
    }
    /**
     * Sends data.
     *
     * @param {String} data to send.
     * @param {Function} called upon flush.
     * @private
     */
    doWrite(data, fn) {
      const req = this.request({
        method: "POST",
        data
      });
      req.on("success", fn);
      req.on("error", (xhrStatus, context) => {
        this.onError("xhr post error", xhrStatus, context);
      });
    }
    /**
     * Starts a poll cycle.
     *
     * @private
     */
    doPoll() {
      const req = this.request();
      req.on("data", this.onData.bind(this));
      req.on("error", (xhrStatus, context) => {
        this.onError("xhr poll error", xhrStatus, context);
      });
      this.pollXhr = req;
    }
  };
  var Request = class _Request extends Emitter {
    /**
     * Request constructor
     *
     * @param {Object} options
     * @package
     */
    constructor(createRequest, uri, opts) {
      super();
      this.createRequest = createRequest;
      installTimerFunctions(this, opts);
      this._opts = opts;
      this._method = opts.method || "GET";
      this._uri = uri;
      this._data = void 0 !== opts.data ? opts.data : null;
      this._create();
    }
    /**
     * Creates the XHR object and sends the request.
     *
     * @private
     */
    _create() {
      var _a;
      const opts = pick(this._opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
      opts.xdomain = !!this._opts.xd;
      const xhr = this._xhr = this.createRequest(opts);
      try {
        xhr.open(this._method, this._uri, true);
        try {
          if (this._opts.extraHeaders) {
            xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);
            for (let i in this._opts.extraHeaders) {
              if (this._opts.extraHeaders.hasOwnProperty(i)) {
                xhr.setRequestHeader(i, this._opts.extraHeaders[i]);
              }
            }
          }
        } catch (e) {
        }
        if ("POST" === this._method) {
          try {
            xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
          } catch (e) {
          }
        }
        try {
          xhr.setRequestHeader("Accept", "*/*");
        } catch (e) {
        }
        (_a = this._opts.cookieJar) === null || _a === void 0 ? void 0 : _a.addCookies(xhr);
        if ("withCredentials" in xhr) {
          xhr.withCredentials = this._opts.withCredentials;
        }
        if (this._opts.requestTimeout) {
          xhr.timeout = this._opts.requestTimeout;
        }
        xhr.onreadystatechange = () => {
          var _a2;
          if (xhr.readyState === 3) {
            (_a2 = this._opts.cookieJar) === null || _a2 === void 0 ? void 0 : _a2.parseCookies(
              // @ts-ignore
              xhr.getResponseHeader("set-cookie")
            );
          }
          if (4 !== xhr.readyState)
            return;
          if (200 === xhr.status || 1223 === xhr.status) {
            this._onLoad();
          } else {
            this.setTimeoutFn(() => {
              this._onError(typeof xhr.status === "number" ? xhr.status : 0);
            }, 0);
          }
        };
        xhr.send(this._data);
      } catch (e) {
        this.setTimeoutFn(() => {
          this._onError(e);
        }, 0);
        return;
      }
      if (typeof document !== "undefined") {
        this._index = _Request.requestsCount++;
        _Request.requests[this._index] = this;
      }
    }
    /**
     * Called upon error.
     *
     * @private
     */
    _onError(err) {
      this.emitReserved("error", err, this._xhr);
      this._cleanup(true);
    }
    /**
     * Cleans up house.
     *
     * @private
     */
    _cleanup(fromError) {
      if ("undefined" === typeof this._xhr || null === this._xhr) {
        return;
      }
      this._xhr.onreadystatechange = empty;
      if (fromError) {
        try {
          this._xhr.abort();
        } catch (e) {
        }
      }
      if (typeof document !== "undefined") {
        delete _Request.requests[this._index];
      }
      this._xhr = null;
    }
    /**
     * Called upon load.
     *
     * @private
     */
    _onLoad() {
      const data = this._xhr.responseText;
      if (data !== null) {
        this.emitReserved("data", data);
        this.emitReserved("success");
        this._cleanup();
      }
    }
    /**
     * Aborts the request.
     *
     * @package
     */
    abort() {
      this._cleanup();
    }
  };
  Request.requestsCount = 0;
  Request.requests = {};
  if (typeof document !== "undefined") {
    if (typeof attachEvent === "function") {
      attachEvent("onunload", unloadHandler);
    } else if (typeof addEventListener === "function") {
      const terminationEvent = "onpagehide" in globalThisShim ? "pagehide" : "unload";
      addEventListener(terminationEvent, unloadHandler, false);
    }
  }
  function unloadHandler() {
    for (let i in Request.requests) {
      if (Request.requests.hasOwnProperty(i)) {
        Request.requests[i].abort();
      }
    }
  }
  var hasXHR2 = (function() {
    const xhr = newRequest({
      xdomain: false
    });
    return xhr && xhr.responseType !== null;
  })();
  var XHR = class extends BaseXHR {
    constructor(opts) {
      super(opts);
      const forceBase64 = opts && opts.forceBase64;
      this.supportsBinary = hasXHR2 && !forceBase64;
    }
    request(opts = {}) {
      Object.assign(opts, { xd: this.xd }, this.opts);
      return new Request(newRequest, this.uri(), opts);
    }
  };
  function newRequest(opts) {
    const xdomain = opts.xdomain;
    try {
      if ("undefined" !== typeof XMLHttpRequest && (!xdomain || hasCORS)) {
        return new XMLHttpRequest();
      }
    } catch (e) {
    }
    if (!xdomain) {
      try {
        return new globalThisShim[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
      } catch (e) {
      }
    }
  }

  // node_modules/engine.io-client/build/esm/transports/websocket.js
  var isReactNative = typeof navigator !== "undefined" && typeof navigator.product === "string" && navigator.product.toLowerCase() === "reactnative";
  var BaseWS = class extends Transport {
    get name() {
      return "websocket";
    }
    doOpen() {
      const uri = this.uri();
      const protocols = this.opts.protocols;
      const opts = isReactNative ? {} : pick(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
      if (this.opts.extraHeaders) {
        opts.headers = this.opts.extraHeaders;
      }
      try {
        this.ws = this.createSocket(uri, protocols, opts);
      } catch (err) {
        return this.emitReserved("error", err);
      }
      this.ws.binaryType = this.socket.binaryType;
      this.addEventListeners();
    }
    /**
     * Adds event listeners to the socket
     *
     * @private
     */
    addEventListeners() {
      this.ws.onopen = () => {
        if (this.opts.autoUnref) {
          this.ws._socket.unref();
        }
        this.onOpen();
      };
      this.ws.onclose = (closeEvent) => this.onClose({
        description: "websocket connection closed",
        context: closeEvent
      });
      this.ws.onmessage = (ev) => this.onData(ev.data);
      this.ws.onerror = (e) => this.onError("websocket error", e);
    }
    write(packets) {
      this.writable = false;
      for (let i = 0; i < packets.length; i++) {
        const packet = packets[i];
        const lastPacket = i === packets.length - 1;
        encodePacket(packet, this.supportsBinary, (data) => {
          try {
            this.doWrite(packet, data);
          } catch (e) {
          }
          if (lastPacket) {
            nextTick(() => {
              this.writable = true;
              this.emitReserved("drain");
            }, this.setTimeoutFn);
          }
        });
      }
    }
    doClose() {
      if (typeof this.ws !== "undefined") {
        this.ws.onerror = () => {
        };
        this.ws.close();
        this.ws = null;
      }
    }
    /**
     * Generates uri for connection.
     *
     * @private
     */
    uri() {
      const schema = this.opts.secure ? "wss" : "ws";
      const query = this.query || {};
      if (this.opts.timestampRequests) {
        query[this.opts.timestampParam] = randomString();
      }
      if (!this.supportsBinary) {
        query.b64 = 1;
      }
      return this.createUri(schema, query);
    }
  };
  var WebSocketCtor = globalThisShim.WebSocket || globalThisShim.MozWebSocket;
  var WS = class extends BaseWS {
    createSocket(uri, protocols, opts) {
      return !isReactNative ? protocols ? new WebSocketCtor(uri, protocols) : new WebSocketCtor(uri) : new WebSocketCtor(uri, protocols, opts);
    }
    doWrite(_packet, data) {
      this.ws.send(data);
    }
  };

  // node_modules/engine.io-client/build/esm/transports/webtransport.js
  var WT = class extends Transport {
    get name() {
      return "webtransport";
    }
    doOpen() {
      try {
        this._transport = new WebTransport(this.createUri("https"), this.opts.transportOptions[this.name]);
      } catch (err) {
        return this.emitReserved("error", err);
      }
      this._transport.closed.then(() => {
        this.onClose();
      }).catch((err) => {
        this.onError("webtransport error", err);
      });
      this._transport.ready.then(() => {
        this._transport.createBidirectionalStream().then((stream) => {
          const decoderStream = createPacketDecoderStream(Number.MAX_SAFE_INTEGER, this.socket.binaryType);
          const reader = stream.readable.pipeThrough(decoderStream).getReader();
          const encoderStream = createPacketEncoderStream();
          encoderStream.readable.pipeTo(stream.writable);
          this._writer = encoderStream.writable.getWriter();
          const read = () => {
            reader.read().then(({ done, value: value2 }) => {
              if (done) {
                return;
              }
              this.onPacket(value2);
              read();
            }).catch((err) => {
            });
          };
          read();
          const packet = { type: "open" };
          if (this.query.sid) {
            packet.data = `{"sid":"${this.query.sid}"}`;
          }
          this._writer.write(packet).then(() => this.onOpen());
        });
      });
    }
    write(packets) {
      this.writable = false;
      for (let i = 0; i < packets.length; i++) {
        const packet = packets[i];
        const lastPacket = i === packets.length - 1;
        this._writer.write(packet).then(() => {
          if (lastPacket) {
            nextTick(() => {
              this.writable = true;
              this.emitReserved("drain");
            }, this.setTimeoutFn);
          }
        });
      }
    }
    doClose() {
      var _a;
      (_a = this._transport) === null || _a === void 0 ? void 0 : _a.close();
    }
  };

  // node_modules/engine.io-client/build/esm/transports/index.js
  var transports = {
    websocket: WS,
    webtransport: WT,
    polling: XHR
  };

  // node_modules/engine.io-client/build/esm/contrib/parseuri.js
  var re = /^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
  var parts = [
    "source",
    "protocol",
    "authority",
    "userInfo",
    "user",
    "password",
    "host",
    "port",
    "relative",
    "path",
    "directory",
    "file",
    "query",
    "anchor"
  ];
  function parse(str) {
    if (str.length > 8e3) {
      throw "URI too long";
    }
    const src = str, b = str.indexOf("["), e = str.indexOf("]");
    if (b != -1 && e != -1) {
      str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ";") + str.substring(e, str.length);
    }
    let m = re.exec(str || ""), uri = {}, i = 14;
    while (i--) {
      uri[parts[i]] = m[i] || "";
    }
    if (b != -1 && e != -1) {
      uri.source = src;
      uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ":");
      uri.authority = uri.authority.replace("[", "").replace("]", "").replace(/;/g, ":");
      uri.ipv6uri = true;
    }
    uri.pathNames = pathNames(uri, uri["path"]);
    uri.queryKey = queryKey(uri, uri["query"]);
    return uri;
  }
  function pathNames(obj, path) {
    const regx = /\/{2,9}/g, names = path.replace(regx, "/").split("/");
    if (path.slice(0, 1) == "/" || path.length === 0) {
      names.splice(0, 1);
    }
    if (path.slice(-1) == "/") {
      names.splice(names.length - 1, 1);
    }
    return names;
  }
  function queryKey(uri, query) {
    const data = {};
    query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function($0, $1, $2) {
      if ($1) {
        data[$1] = $2;
      }
    });
    return data;
  }

  // node_modules/engine.io-client/build/esm/socket.js
  var withEventListeners = typeof addEventListener === "function" && typeof removeEventListener === "function";
  var OFFLINE_EVENT_LISTENERS = [];
  if (withEventListeners) {
    addEventListener("offline", () => {
      OFFLINE_EVENT_LISTENERS.forEach((listener) => listener());
    }, false);
  }
  var SocketWithoutUpgrade = class _SocketWithoutUpgrade extends Emitter {
    /**
     * Socket constructor.
     *
     * @param {String|Object} uri - uri or options
     * @param {Object} opts - options
     */
    constructor(uri, opts) {
      super();
      this.binaryType = defaultBinaryType;
      this.writeBuffer = [];
      this._prevBufferLen = 0;
      this._pingInterval = -1;
      this._pingTimeout = -1;
      this._maxPayload = -1;
      this._pingTimeoutTime = Infinity;
      if (uri && "object" === typeof uri) {
        opts = uri;
        uri = null;
      }
      if (uri) {
        const parsedUri = parse(uri);
        opts.hostname = parsedUri.host;
        opts.secure = parsedUri.protocol === "https" || parsedUri.protocol === "wss";
        opts.port = parsedUri.port;
        if (parsedUri.query)
          opts.query = parsedUri.query;
      } else if (opts.host) {
        opts.hostname = parse(opts.host).host;
      }
      installTimerFunctions(this, opts);
      this.secure = null != opts.secure ? opts.secure : typeof location !== "undefined" && "https:" === location.protocol;
      if (opts.hostname && !opts.port) {
        opts.port = this.secure ? "443" : "80";
      }
      this.hostname = opts.hostname || (typeof location !== "undefined" ? location.hostname : "localhost");
      this.port = opts.port || (typeof location !== "undefined" && location.port ? location.port : this.secure ? "443" : "80");
      this.transports = [];
      this._transportsByName = {};
      opts.transports.forEach((t) => {
        const transportName = t.prototype.name;
        this.transports.push(transportName);
        this._transportsByName[transportName] = t;
      });
      this.opts = Object.assign({
        path: "/engine.io",
        agent: false,
        withCredentials: false,
        upgrade: true,
        timestampParam: "t",
        rememberUpgrade: false,
        addTrailingSlash: true,
        rejectUnauthorized: true,
        perMessageDeflate: {
          threshold: 1024
        },
        transportOptions: {},
        closeOnBeforeunload: false
      }, opts);
      this.opts.path = this.opts.path.replace(/\/$/, "") + (this.opts.addTrailingSlash ? "/" : "");
      if (typeof this.opts.query === "string") {
        this.opts.query = decode2(this.opts.query);
      }
      if (withEventListeners) {
        if (this.opts.closeOnBeforeunload) {
          this._beforeunloadEventListener = () => {
            if (this.transport) {
              this.transport.removeAllListeners();
              this.transport.close();
            }
          };
          addEventListener("beforeunload", this._beforeunloadEventListener, false);
        }
        if (this.hostname !== "localhost") {
          this._offlineEventListener = () => {
            this._onClose("transport close", {
              description: "network connection lost"
            });
          };
          OFFLINE_EVENT_LISTENERS.push(this._offlineEventListener);
        }
      }
      if (this.opts.withCredentials) {
        this._cookieJar = createCookieJar();
      }
      this._open();
    }
    /**
     * Creates transport of the given type.
     *
     * @param {String} name - transport name
     * @return {Transport}
     * @private
     */
    createTransport(name) {
      const query = Object.assign({}, this.opts.query);
      query.EIO = protocol;
      query.transport = name;
      if (this.id)
        query.sid = this.id;
      const opts = Object.assign({}, this.opts, {
        query,
        socket: this,
        hostname: this.hostname,
        secure: this.secure,
        port: this.port
      }, this.opts.transportOptions[name]);
      return new this._transportsByName[name](opts);
    }
    /**
     * Initializes transport to use and starts probe.
     *
     * @private
     */
    _open() {
      if (this.transports.length === 0) {
        this.setTimeoutFn(() => {
          this.emitReserved("error", "No transports available");
        }, 0);
        return;
      }
      const transportName = this.opts.rememberUpgrade && _SocketWithoutUpgrade.priorWebsocketSuccess && this.transports.indexOf("websocket") !== -1 ? "websocket" : this.transports[0];
      this.readyState = "opening";
      const transport = this.createTransport(transportName);
      transport.open();
      this.setTransport(transport);
    }
    /**
     * Sets the current transport. Disables the existing one (if any).
     *
     * @private
     */
    setTransport(transport) {
      if (this.transport) {
        this.transport.removeAllListeners();
      }
      this.transport = transport;
      transport.on("drain", this._onDrain.bind(this)).on("packet", this._onPacket.bind(this)).on("error", this._onError.bind(this)).on("close", (reason) => this._onClose("transport close", reason));
    }
    /**
     * Called when connection is deemed open.
     *
     * @private
     */
    onOpen() {
      this.readyState = "open";
      _SocketWithoutUpgrade.priorWebsocketSuccess = "websocket" === this.transport.name;
      this.emitReserved("open");
      this.flush();
    }
    /**
     * Handles a packet.
     *
     * @private
     */
    _onPacket(packet) {
      if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) {
        this.emitReserved("packet", packet);
        this.emitReserved("heartbeat");
        switch (packet.type) {
          case "open":
            this.onHandshake(JSON.parse(packet.data));
            break;
          case "ping":
            this._sendPacket("pong");
            this.emitReserved("ping");
            this.emitReserved("pong");
            this._resetPingTimeout();
            break;
          case "error":
            const err = new Error("server error");
            err.code = packet.data;
            this._onError(err);
            break;
          case "message":
            this.emitReserved("data", packet.data);
            this.emitReserved("message", packet.data);
            break;
        }
      } else {
      }
    }
    /**
     * Called upon handshake completion.
     *
     * @param {Object} data - handshake obj
     * @private
     */
    onHandshake(data) {
      this.emitReserved("handshake", data);
      this.id = data.sid;
      this.transport.query.sid = data.sid;
      this._pingInterval = data.pingInterval;
      this._pingTimeout = data.pingTimeout;
      this._maxPayload = data.maxPayload;
      this.onOpen();
      if ("closed" === this.readyState)
        return;
      this._resetPingTimeout();
    }
    /**
     * Sets and resets ping timeout timer based on server pings.
     *
     * @private
     */
    _resetPingTimeout() {
      this.clearTimeoutFn(this._pingTimeoutTimer);
      const delay = this._pingInterval + this._pingTimeout;
      this._pingTimeoutTime = Date.now() + delay;
      this._pingTimeoutTimer = this.setTimeoutFn(() => {
        this._onClose("ping timeout");
      }, delay);
      if (this.opts.autoUnref) {
        this._pingTimeoutTimer.unref();
      }
    }
    /**
     * Called on `drain` event
     *
     * @private
     */
    _onDrain() {
      this.writeBuffer.splice(0, this._prevBufferLen);
      this._prevBufferLen = 0;
      if (0 === this.writeBuffer.length) {
        this.emitReserved("drain");
      } else {
        this.flush();
      }
    }
    /**
     * Flush write buffers.
     *
     * @private
     */
    flush() {
      if ("closed" !== this.readyState && this.transport.writable && !this.upgrading && this.writeBuffer.length) {
        const packets = this._getWritablePackets();
        this.transport.send(packets);
        this._prevBufferLen = packets.length;
        this.emitReserved("flush");
      }
    }
    /**
     * Ensure the encoded size of the writeBuffer is below the maxPayload value sent by the server (only for HTTP
     * long-polling)
     *
     * @private
     */
    _getWritablePackets() {
      const shouldCheckPayloadSize = this._maxPayload && this.transport.name === "polling" && this.writeBuffer.length > 1;
      if (!shouldCheckPayloadSize) {
        return this.writeBuffer;
      }
      let payloadSize = 1;
      for (let i = 0; i < this.writeBuffer.length; i++) {
        const data = this.writeBuffer[i].data;
        if (data) {
          payloadSize += byteLength(data);
        }
        if (i > 0 && payloadSize > this._maxPayload) {
          return this.writeBuffer.slice(0, i);
        }
        payloadSize += 2;
      }
      return this.writeBuffer;
    }
    /**
     * Checks whether the heartbeat timer has expired but the socket has not yet been notified.
     *
     * Note: this method is private for now because it does not really fit the WebSocket API, but if we put it in the
     * `write()` method then the message would not be buffered by the Socket.IO client.
     *
     * @return {boolean}
     * @private
     */
    /* private */
    _hasPingExpired() {
      if (!this._pingTimeoutTime)
        return true;
      const hasExpired = Date.now() > this._pingTimeoutTime;
      if (hasExpired) {
        this._pingTimeoutTime = 0;
        nextTick(() => {
          this._onClose("ping timeout");
        }, this.setTimeoutFn);
      }
      return hasExpired;
    }
    /**
     * Sends a message.
     *
     * @param {String} msg - message.
     * @param {Object} options.
     * @param {Function} fn - callback function.
     * @return {Socket} for chaining.
     */
    write(msg, options, fn) {
      this._sendPacket("message", msg, options, fn);
      return this;
    }
    /**
     * Sends a message. Alias of {@link Socket#write}.
     *
     * @param {String} msg - message.
     * @param {Object} options.
     * @param {Function} fn - callback function.
     * @return {Socket} for chaining.
     */
    send(msg, options, fn) {
      this._sendPacket("message", msg, options, fn);
      return this;
    }
    /**
     * Sends a packet.
     *
     * @param {String} type: packet type.
     * @param {String} data.
     * @param {Object} options.
     * @param {Function} fn - callback function.
     * @private
     */
    _sendPacket(type, data, options, fn) {
      if ("function" === typeof data) {
        fn = data;
        data = void 0;
      }
      if ("function" === typeof options) {
        fn = options;
        options = null;
      }
      if ("closing" === this.readyState || "closed" === this.readyState) {
        return;
      }
      options = options || {};
      options.compress = false !== options.compress;
      const packet = {
        type,
        data,
        options
      };
      this.emitReserved("packetCreate", packet);
      this.writeBuffer.push(packet);
      if (fn)
        this.once("flush", fn);
      this.flush();
    }
    /**
     * Closes the connection.
     */
    close() {
      const close = () => {
        this._onClose("forced close");
        this.transport.close();
      };
      const cleanupAndClose = () => {
        this.off("upgrade", cleanupAndClose);
        this.off("upgradeError", cleanupAndClose);
        close();
      };
      const waitForUpgrade = () => {
        this.once("upgrade", cleanupAndClose);
        this.once("upgradeError", cleanupAndClose);
      };
      if ("opening" === this.readyState || "open" === this.readyState) {
        this.readyState = "closing";
        if (this.writeBuffer.length) {
          this.once("drain", () => {
            if (this.upgrading) {
              waitForUpgrade();
            } else {
              close();
            }
          });
        } else if (this.upgrading) {
          waitForUpgrade();
        } else {
          close();
        }
      }
      return this;
    }
    /**
     * Called upon transport error
     *
     * @private
     */
    _onError(err) {
      _SocketWithoutUpgrade.priorWebsocketSuccess = false;
      if (this.opts.tryAllTransports && this.transports.length > 1 && this.readyState === "opening") {
        this.transports.shift();
        return this._open();
      }
      this.emitReserved("error", err);
      this._onClose("transport error", err);
    }
    /**
     * Called upon transport close.
     *
     * @private
     */
    _onClose(reason, description) {
      if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) {
        this.clearTimeoutFn(this._pingTimeoutTimer);
        this.transport.removeAllListeners("close");
        this.transport.close();
        this.transport.removeAllListeners();
        if (withEventListeners) {
          if (this._beforeunloadEventListener) {
            removeEventListener("beforeunload", this._beforeunloadEventListener, false);
          }
          if (this._offlineEventListener) {
            const i = OFFLINE_EVENT_LISTENERS.indexOf(this._offlineEventListener);
            if (i !== -1) {
              OFFLINE_EVENT_LISTENERS.splice(i, 1);
            }
          }
        }
        this.readyState = "closed";
        this.id = null;
        this.emitReserved("close", reason, description);
        this.writeBuffer = [];
        this._prevBufferLen = 0;
      }
    }
  };
  SocketWithoutUpgrade.protocol = protocol;
  var SocketWithUpgrade = class extends SocketWithoutUpgrade {
    constructor() {
      super(...arguments);
      this._upgrades = [];
    }
    onOpen() {
      super.onOpen();
      if ("open" === this.readyState && this.opts.upgrade) {
        for (let i = 0; i < this._upgrades.length; i++) {
          this._probe(this._upgrades[i]);
        }
      }
    }
    /**
     * Probes a transport.
     *
     * @param {String} name - transport name
     * @private
     */
    _probe(name) {
      let transport = this.createTransport(name);
      let failed = false;
      SocketWithoutUpgrade.priorWebsocketSuccess = false;
      const onTransportOpen = () => {
        if (failed)
          return;
        transport.send([{ type: "ping", data: "probe" }]);
        transport.once("packet", (msg) => {
          if (failed)
            return;
          if ("pong" === msg.type && "probe" === msg.data) {
            this.upgrading = true;
            this.emitReserved("upgrading", transport);
            if (!transport)
              return;
            SocketWithoutUpgrade.priorWebsocketSuccess = "websocket" === transport.name;
            this.transport.pause(() => {
              if (failed)
                return;
              if ("closed" === this.readyState)
                return;
              cleanup2();
              this.setTransport(transport);
              transport.send([{ type: "upgrade" }]);
              this.emitReserved("upgrade", transport);
              transport = null;
              this.upgrading = false;
              this.flush();
            });
          } else {
            const err = new Error("probe error");
            err.transport = transport.name;
            this.emitReserved("upgradeError", err);
          }
        });
      };
      function freezeTransport() {
        if (failed)
          return;
        failed = true;
        cleanup2();
        transport.close();
        transport = null;
      }
      const onerror = (err) => {
        const error = new Error("probe error: " + err);
        error.transport = transport.name;
        freezeTransport();
        this.emitReserved("upgradeError", error);
      };
      function onTransportClose() {
        onerror("transport closed");
      }
      function onclose() {
        onerror("socket closed");
      }
      function onupgrade(to) {
        if (transport && to.name !== transport.name) {
          freezeTransport();
        }
      }
      const cleanup2 = () => {
        transport.removeListener("open", onTransportOpen);
        transport.removeListener("error", onerror);
        transport.removeListener("close", onTransportClose);
        this.off("close", onclose);
        this.off("upgrading", onupgrade);
      };
      transport.once("open", onTransportOpen);
      transport.once("error", onerror);
      transport.once("close", onTransportClose);
      this.once("close", onclose);
      this.once("upgrading", onupgrade);
      if (this._upgrades.indexOf("webtransport") !== -1 && name !== "webtransport") {
        this.setTimeoutFn(() => {
          if (!failed) {
            transport.open();
          }
        }, 200);
      } else {
        transport.open();
      }
    }
    onHandshake(data) {
      this._upgrades = this._filterUpgrades(data.upgrades);
      super.onHandshake(data);
    }
    /**
     * Filters upgrades, returning only those matching client transports.
     *
     * @param {Array} upgrades - server upgrades
     * @private
     */
    _filterUpgrades(upgrades) {
      const filteredUpgrades = [];
      for (let i = 0; i < upgrades.length; i++) {
        if (~this.transports.indexOf(upgrades[i]))
          filteredUpgrades.push(upgrades[i]);
      }
      return filteredUpgrades;
    }
  };
  var Socket = class extends SocketWithUpgrade {
    constructor(uri, opts = {}) {
      const o = typeof uri === "object" ? uri : opts;
      if (!o.transports || o.transports && typeof o.transports[0] === "string") {
        o.transports = (o.transports || ["polling", "websocket", "webtransport"]).map((transportName) => transports[transportName]).filter((t) => !!t);
      }
      super(uri, o);
    }
  };

  // node_modules/engine.io-client/build/esm/index.js
  var protocol2 = Socket.protocol;

  // node_modules/socket.io-client/build/esm/url.js
  function url(uri, path = "", loc) {
    let obj = uri;
    loc = loc || typeof location !== "undefined" && location;
    if (null == uri)
      uri = loc.protocol + "//" + loc.host;
    if (typeof uri === "string") {
      if ("/" === uri.charAt(0)) {
        if ("/" === uri.charAt(1)) {
          uri = loc.protocol + uri;
        } else {
          uri = loc.host + uri;
        }
      }
      if (!/^(https?|wss?):\/\//.test(uri)) {
        if ("undefined" !== typeof loc) {
          uri = loc.protocol + "//" + uri;
        } else {
          uri = "https://" + uri;
        }
      }
      obj = parse(uri);
    }
    if (!obj.port) {
      if (/^(http|ws)$/.test(obj.protocol)) {
        obj.port = "80";
      } else if (/^(http|ws)s$/.test(obj.protocol)) {
        obj.port = "443";
      }
    }
    obj.path = obj.path || "/";
    const ipv6 = obj.host.indexOf(":") !== -1;
    const host = ipv6 ? "[" + obj.host + "]" : obj.host;
    obj.id = obj.protocol + "://" + host + ":" + obj.port + path;
    obj.href = obj.protocol + "://" + host + (loc && loc.port === obj.port ? "" : ":" + obj.port);
    return obj;
  }

  // node_modules/socket.io-parser/build/esm/index.js
  var esm_exports = {};
  __export(esm_exports, {
    Decoder: () => Decoder,
    Encoder: () => Encoder,
    PacketType: () => PacketType,
    protocol: () => protocol3
  });

  // node_modules/socket.io-parser/build/esm/is-binary.js
  var withNativeArrayBuffer3 = typeof ArrayBuffer === "function";
  var isView2 = (obj) => {
    return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj.buffer instanceof ArrayBuffer;
  };
  var toString = Object.prototype.toString;
  var withNativeBlob2 = typeof Blob === "function" || typeof Blob !== "undefined" && toString.call(Blob) === "[object BlobConstructor]";
  var withNativeFile = typeof File === "function" || typeof File !== "undefined" && toString.call(File) === "[object FileConstructor]";
  function isBinary(obj) {
    return withNativeArrayBuffer3 && (obj instanceof ArrayBuffer || isView2(obj)) || withNativeBlob2 && obj instanceof Blob || withNativeFile && obj instanceof File;
  }
  function hasBinary(obj, toJSON) {
    if (!obj || typeof obj !== "object") {
      return false;
    }
    if (Array.isArray(obj)) {
      for (let i = 0, l = obj.length; i < l; i++) {
        if (hasBinary(obj[i])) {
          return true;
        }
      }
      return false;
    }
    if (isBinary(obj)) {
      return true;
    }
    if (obj.toJSON && typeof obj.toJSON === "function" && arguments.length === 1) {
      return hasBinary(obj.toJSON(), true);
    }
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
        return true;
      }
    }
    return false;
  }

  // node_modules/socket.io-parser/build/esm/binary.js
  function deconstructPacket(packet) {
    const buffers = [];
    const packetData = packet.data;
    const pack = packet;
    pack.data = _deconstructPacket(packetData, buffers);
    pack.attachments = buffers.length;
    return { packet: pack, buffers };
  }
  function _deconstructPacket(data, buffers) {
    if (!data)
      return data;
    if (isBinary(data)) {
      const placeholder = { _placeholder: true, num: buffers.length };
      buffers.push(data);
      return placeholder;
    } else if (Array.isArray(data)) {
      const newData = new Array(data.length);
      for (let i = 0; i < data.length; i++) {
        newData[i] = _deconstructPacket(data[i], buffers);
      }
      return newData;
    } else if (typeof data === "object" && !(data instanceof Date)) {
      const newData = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          newData[key] = _deconstructPacket(data[key], buffers);
        }
      }
      return newData;
    }
    return data;
  }
  function reconstructPacket(packet, buffers) {
    packet.data = _reconstructPacket(packet.data, buffers);
    delete packet.attachments;
    return packet;
  }
  function _reconstructPacket(data, buffers) {
    if (!data)
      return data;
    if (data && data._placeholder === true) {
      const isIndexValid = typeof data.num === "number" && data.num >= 0 && data.num < buffers.length;
      if (isIndexValid) {
        return buffers[data.num];
      } else {
        throw new Error("illegal attachments");
      }
    } else if (Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        data[i] = _reconstructPacket(data[i], buffers);
      }
    } else if (typeof data === "object") {
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          data[key] = _reconstructPacket(data[key], buffers);
        }
      }
    }
    return data;
  }

  // node_modules/socket.io-parser/build/esm/index.js
  var RESERVED_EVENTS = [
    "connect",
    "connect_error",
    "disconnect",
    "disconnecting",
    "newListener",
    "removeListener"
    // used by the Node.js EventEmitter
  ];
  var protocol3 = 5;
  var PacketType;
  (function(PacketType2) {
    PacketType2[PacketType2["CONNECT"] = 0] = "CONNECT";
    PacketType2[PacketType2["DISCONNECT"] = 1] = "DISCONNECT";
    PacketType2[PacketType2["EVENT"] = 2] = "EVENT";
    PacketType2[PacketType2["ACK"] = 3] = "ACK";
    PacketType2[PacketType2["CONNECT_ERROR"] = 4] = "CONNECT_ERROR";
    PacketType2[PacketType2["BINARY_EVENT"] = 5] = "BINARY_EVENT";
    PacketType2[PacketType2["BINARY_ACK"] = 6] = "BINARY_ACK";
  })(PacketType || (PacketType = {}));
  var Encoder = class {
    /**
     * Encoder constructor
     *
     * @param {function} replacer - custom replacer to pass down to JSON.parse
     */
    constructor(replacer) {
      this.replacer = replacer;
    }
    /**
     * Encode a packet as a single string if non-binary, or as a
     * buffer sequence, depending on packet type.
     *
     * @param {Object} obj - packet object
     */
    encode(obj) {
      if (obj.type === PacketType.EVENT || obj.type === PacketType.ACK) {
        if (hasBinary(obj)) {
          return this.encodeAsBinary({
            type: obj.type === PacketType.EVENT ? PacketType.BINARY_EVENT : PacketType.BINARY_ACK,
            nsp: obj.nsp,
            data: obj.data,
            id: obj.id
          });
        }
      }
      return [this.encodeAsString(obj)];
    }
    /**
     * Encode packet as string.
     */
    encodeAsString(obj) {
      let str = "" + obj.type;
      if (obj.type === PacketType.BINARY_EVENT || obj.type === PacketType.BINARY_ACK) {
        str += obj.attachments + "-";
      }
      if (obj.nsp && "/" !== obj.nsp) {
        str += obj.nsp + ",";
      }
      if (null != obj.id) {
        str += obj.id;
      }
      if (null != obj.data) {
        str += JSON.stringify(obj.data, this.replacer);
      }
      return str;
    }
    /**
     * Encode packet as 'buffer sequence' by removing blobs, and
     * deconstructing packet into object with placeholders and
     * a list of buffers.
     */
    encodeAsBinary(obj) {
      const deconstruction = deconstructPacket(obj);
      const pack = this.encodeAsString(deconstruction.packet);
      const buffers = deconstruction.buffers;
      buffers.unshift(pack);
      return buffers;
    }
  };
  function isObject(value2) {
    return Object.prototype.toString.call(value2) === "[object Object]";
  }
  var Decoder = class _Decoder extends Emitter {
    /**
     * Decoder constructor
     *
     * @param {function} reviver - custom reviver to pass down to JSON.stringify
     */
    constructor(reviver) {
      super();
      this.reviver = reviver;
    }
    /**
     * Decodes an encoded packet string into packet JSON.
     *
     * @param {String} obj - encoded packet
     */
    add(obj) {
      let packet;
      if (typeof obj === "string") {
        if (this.reconstructor) {
          throw new Error("got plaintext data when reconstructing a packet");
        }
        packet = this.decodeString(obj);
        const isBinaryEvent = packet.type === PacketType.BINARY_EVENT;
        if (isBinaryEvent || packet.type === PacketType.BINARY_ACK) {
          packet.type = isBinaryEvent ? PacketType.EVENT : PacketType.ACK;
          this.reconstructor = new BinaryReconstructor(packet);
          if (packet.attachments === 0) {
            super.emitReserved("decoded", packet);
          }
        } else {
          super.emitReserved("decoded", packet);
        }
      } else if (isBinary(obj) || obj.base64) {
        if (!this.reconstructor) {
          throw new Error("got binary data when not reconstructing a packet");
        } else {
          packet = this.reconstructor.takeBinaryData(obj);
          if (packet) {
            this.reconstructor = null;
            super.emitReserved("decoded", packet);
          }
        }
      } else {
        throw new Error("Unknown type: " + obj);
      }
    }
    /**
     * Decode a packet String (JSON data)
     *
     * @param {String} str
     * @return {Object} packet
     */
    decodeString(str) {
      let i = 0;
      const p = {
        type: Number(str.charAt(0))
      };
      if (PacketType[p.type] === void 0) {
        throw new Error("unknown packet type " + p.type);
      }
      if (p.type === PacketType.BINARY_EVENT || p.type === PacketType.BINARY_ACK) {
        const start = i + 1;
        while (str.charAt(++i) !== "-" && i != str.length) {
        }
        const buf = str.substring(start, i);
        if (buf != Number(buf) || str.charAt(i) !== "-") {
          throw new Error("Illegal attachments");
        }
        p.attachments = Number(buf);
      }
      if ("/" === str.charAt(i + 1)) {
        const start = i + 1;
        while (++i) {
          const c = str.charAt(i);
          if ("," === c)
            break;
          if (i === str.length)
            break;
        }
        p.nsp = str.substring(start, i);
      } else {
        p.nsp = "/";
      }
      const next = str.charAt(i + 1);
      if ("" !== next && Number(next) == next) {
        const start = i + 1;
        while (++i) {
          const c = str.charAt(i);
          if (null == c || Number(c) != c) {
            --i;
            break;
          }
          if (i === str.length)
            break;
        }
        p.id = Number(str.substring(start, i + 1));
      }
      if (str.charAt(++i)) {
        const payload = this.tryParse(str.substr(i));
        if (_Decoder.isPayloadValid(p.type, payload)) {
          p.data = payload;
        } else {
          throw new Error("invalid payload");
        }
      }
      return p;
    }
    tryParse(str) {
      try {
        return JSON.parse(str, this.reviver);
      } catch (e) {
        return false;
      }
    }
    static isPayloadValid(type, payload) {
      switch (type) {
        case PacketType.CONNECT:
          return isObject(payload);
        case PacketType.DISCONNECT:
          return payload === void 0;
        case PacketType.CONNECT_ERROR:
          return typeof payload === "string" || isObject(payload);
        case PacketType.EVENT:
        case PacketType.BINARY_EVENT:
          return Array.isArray(payload) && (typeof payload[0] === "number" || typeof payload[0] === "string" && RESERVED_EVENTS.indexOf(payload[0]) === -1);
        case PacketType.ACK:
        case PacketType.BINARY_ACK:
          return Array.isArray(payload);
      }
    }
    /**
     * Deallocates a parser's resources
     */
    destroy() {
      if (this.reconstructor) {
        this.reconstructor.finishedReconstruction();
        this.reconstructor = null;
      }
    }
  };
  var BinaryReconstructor = class {
    constructor(packet) {
      this.packet = packet;
      this.buffers = [];
      this.reconPack = packet;
    }
    /**
     * Method to be called when binary data received from connection
     * after a BINARY_EVENT packet.
     *
     * @param {Buffer | ArrayBuffer} binData - the raw binary data received
     * @return {null | Object} returns null if more binary data is expected or
     *   a reconstructed packet object if all buffers have been received.
     */
    takeBinaryData(binData) {
      this.buffers.push(binData);
      if (this.buffers.length === this.reconPack.attachments) {
        const packet = reconstructPacket(this.reconPack, this.buffers);
        this.finishedReconstruction();
        return packet;
      }
      return null;
    }
    /**
     * Cleans up binary packet reconstruction variables.
     */
    finishedReconstruction() {
      this.reconPack = null;
      this.buffers = [];
    }
  };

  // node_modules/socket.io-client/build/esm/on.js
  function on(obj, ev, fn) {
    obj.on(ev, fn);
    return function subDestroy() {
      obj.off(ev, fn);
    };
  }

  // node_modules/socket.io-client/build/esm/socket.js
  var RESERVED_EVENTS2 = Object.freeze({
    connect: 1,
    connect_error: 1,
    disconnect: 1,
    disconnecting: 1,
    // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
    newListener: 1,
    removeListener: 1
  });
  var Socket2 = class extends Emitter {
    /**
     * `Socket` constructor.
     */
    constructor(io, nsp, opts) {
      super();
      this.connected = false;
      this.recovered = false;
      this.receiveBuffer = [];
      this.sendBuffer = [];
      this._queue = [];
      this._queueSeq = 0;
      this.ids = 0;
      this.acks = {};
      this.flags = {};
      this.io = io;
      this.nsp = nsp;
      if (opts && opts.auth) {
        this.auth = opts.auth;
      }
      this._opts = Object.assign({}, opts);
      if (this.io._autoConnect)
        this.open();
    }
    /**
     * Whether the socket is currently disconnected
     *
     * @example
     * const socket = io();
     *
     * socket.on("connect", () => {
     *   console.log(socket.disconnected); // false
     * });
     *
     * socket.on("disconnect", () => {
     *   console.log(socket.disconnected); // true
     * });
     */
    get disconnected() {
      return !this.connected;
    }
    /**
     * Subscribe to open, close and packet events
     *
     * @private
     */
    subEvents() {
      if (this.subs)
        return;
      const io = this.io;
      this.subs = [
        on(io, "open", this.onopen.bind(this)),
        on(io, "packet", this.onpacket.bind(this)),
        on(io, "error", this.onerror.bind(this)),
        on(io, "close", this.onclose.bind(this))
      ];
    }
    /**
     * Whether the Socket will try to reconnect when its Manager connects or reconnects.
     *
     * @example
     * const socket = io();
     *
     * console.log(socket.active); // true
     *
     * socket.on("disconnect", (reason) => {
     *   if (reason === "io server disconnect") {
     *     // the disconnection was initiated by the server, you need to manually reconnect
     *     console.log(socket.active); // false
     *   }
     *   // else the socket will automatically try to reconnect
     *   console.log(socket.active); // true
     * });
     */
    get active() {
      return !!this.subs;
    }
    /**
     * "Opens" the socket.
     *
     * @example
     * const socket = io({
     *   autoConnect: false
     * });
     *
     * socket.connect();
     */
    connect() {
      if (this.connected)
        return this;
      this.subEvents();
      if (!this.io["_reconnecting"])
        this.io.open();
      if ("open" === this.io._readyState)
        this.onopen();
      return this;
    }
    /**
     * Alias for {@link connect()}.
     */
    open() {
      return this.connect();
    }
    /**
     * Sends a `message` event.
     *
     * This method mimics the WebSocket.send() method.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send
     *
     * @example
     * socket.send("hello");
     *
     * // this is equivalent to
     * socket.emit("message", "hello");
     *
     * @return self
     */
    send(...args) {
      args.unshift("message");
      this.emit.apply(this, args);
      return this;
    }
    /**
     * Override `emit`.
     * If the event is in `events`, it's emitted normally.
     *
     * @example
     * socket.emit("hello", "world");
     *
     * // all serializable datastructures are supported (no need to call JSON.stringify)
     * socket.emit("hello", 1, "2", { 3: ["4"], 5: Uint8Array.from([6]) });
     *
     * // with an acknowledgement from the server
     * socket.emit("hello", "world", (val) => {
     *   // ...
     * });
     *
     * @return self
     */
    emit(ev, ...args) {
      var _a, _b, _c;
      if (RESERVED_EVENTS2.hasOwnProperty(ev)) {
        throw new Error('"' + ev.toString() + '" is a reserved event name');
      }
      args.unshift(ev);
      if (this._opts.retries && !this.flags.fromQueue && !this.flags.volatile) {
        this._addToQueue(args);
        return this;
      }
      const packet = {
        type: PacketType.EVENT,
        data: args
      };
      packet.options = {};
      packet.options.compress = this.flags.compress !== false;
      if ("function" === typeof args[args.length - 1]) {
        const id = this.ids++;
        const ack = args.pop();
        this._registerAckCallback(id, ack);
        packet.id = id;
      }
      const isTransportWritable = (_b = (_a = this.io.engine) === null || _a === void 0 ? void 0 : _a.transport) === null || _b === void 0 ? void 0 : _b.writable;
      const isConnected = this.connected && !((_c = this.io.engine) === null || _c === void 0 ? void 0 : _c._hasPingExpired());
      const discardPacket = this.flags.volatile && !isTransportWritable;
      if (discardPacket) {
      } else if (isConnected) {
        this.notifyOutgoingListeners(packet);
        this.packet(packet);
      } else {
        this.sendBuffer.push(packet);
      }
      this.flags = {};
      return this;
    }
    /**
     * @private
     */
    _registerAckCallback(id, ack) {
      var _a;
      const timeout = (_a = this.flags.timeout) !== null && _a !== void 0 ? _a : this._opts.ackTimeout;
      if (timeout === void 0) {
        this.acks[id] = ack;
        return;
      }
      const timer = this.io.setTimeoutFn(() => {
        delete this.acks[id];
        for (let i = 0; i < this.sendBuffer.length; i++) {
          if (this.sendBuffer[i].id === id) {
            this.sendBuffer.splice(i, 1);
          }
        }
        ack.call(this, new Error("operation has timed out"));
      }, timeout);
      const fn = (...args) => {
        this.io.clearTimeoutFn(timer);
        ack.apply(this, args);
      };
      fn.withError = true;
      this.acks[id] = fn;
    }
    /**
     * Emits an event and waits for an acknowledgement
     *
     * @example
     * // without timeout
     * const response = await socket.emitWithAck("hello", "world");
     *
     * // with a specific timeout
     * try {
     *   const response = await socket.timeout(1000).emitWithAck("hello", "world");
     * } catch (err) {
     *   // the server did not acknowledge the event in the given delay
     * }
     *
     * @return a Promise that will be fulfilled when the server acknowledges the event
     */
    emitWithAck(ev, ...args) {
      return new Promise((resolve, reject) => {
        const fn = (arg1, arg2) => {
          return arg1 ? reject(arg1) : resolve(arg2);
        };
        fn.withError = true;
        args.push(fn);
        this.emit(ev, ...args);
      });
    }
    /**
     * Add the packet to the queue.
     * @param args
     * @private
     */
    _addToQueue(args) {
      let ack;
      if (typeof args[args.length - 1] === "function") {
        ack = args.pop();
      }
      const packet = {
        id: this._queueSeq++,
        tryCount: 0,
        pending: false,
        args,
        flags: Object.assign({ fromQueue: true }, this.flags)
      };
      args.push((err, ...responseArgs) => {
        if (packet !== this._queue[0]) {
          return;
        }
        const hasError = err !== null;
        if (hasError) {
          if (packet.tryCount > this._opts.retries) {
            this._queue.shift();
            if (ack) {
              ack(err);
            }
          }
        } else {
          this._queue.shift();
          if (ack) {
            ack(null, ...responseArgs);
          }
        }
        packet.pending = false;
        return this._drainQueue();
      });
      this._queue.push(packet);
      this._drainQueue();
    }
    /**
     * Send the first packet of the queue, and wait for an acknowledgement from the server.
     * @param force - whether to resend a packet that has not been acknowledged yet
     *
     * @private
     */
    _drainQueue(force = false) {
      if (!this.connected || this._queue.length === 0) {
        return;
      }
      const packet = this._queue[0];
      if (packet.pending && !force) {
        return;
      }
      packet.pending = true;
      packet.tryCount++;
      this.flags = packet.flags;
      this.emit.apply(this, packet.args);
    }
    /**
     * Sends a packet.
     *
     * @param packet
     * @private
     */
    packet(packet) {
      packet.nsp = this.nsp;
      this.io._packet(packet);
    }
    /**
     * Called upon engine `open`.
     *
     * @private
     */
    onopen() {
      if (typeof this.auth == "function") {
        this.auth((data) => {
          this._sendConnectPacket(data);
        });
      } else {
        this._sendConnectPacket(this.auth);
      }
    }
    /**
     * Sends a CONNECT packet to initiate the Socket.IO session.
     *
     * @param data
     * @private
     */
    _sendConnectPacket(data) {
      this.packet({
        type: PacketType.CONNECT,
        data: this._pid ? Object.assign({ pid: this._pid, offset: this._lastOffset }, data) : data
      });
    }
    /**
     * Called upon engine or manager `error`.
     *
     * @param err
     * @private
     */
    onerror(err) {
      if (!this.connected) {
        this.emitReserved("connect_error", err);
      }
    }
    /**
     * Called upon engine `close`.
     *
     * @param reason
     * @param description
     * @private
     */
    onclose(reason, description) {
      this.connected = false;
      delete this.id;
      this.emitReserved("disconnect", reason, description);
      this._clearAcks();
    }
    /**
     * Clears the acknowledgement handlers upon disconnection, since the client will never receive an acknowledgement from
     * the server.
     *
     * @private
     */
    _clearAcks() {
      Object.keys(this.acks).forEach((id) => {
        const isBuffered = this.sendBuffer.some((packet) => String(packet.id) === id);
        if (!isBuffered) {
          const ack = this.acks[id];
          delete this.acks[id];
          if (ack.withError) {
            ack.call(this, new Error("socket has been disconnected"));
          }
        }
      });
    }
    /**
     * Called with socket packet.
     *
     * @param packet
     * @private
     */
    onpacket(packet) {
      const sameNamespace = packet.nsp === this.nsp;
      if (!sameNamespace)
        return;
      switch (packet.type) {
        case PacketType.CONNECT:
          if (packet.data && packet.data.sid) {
            this.onconnect(packet.data.sid, packet.data.pid);
          } else {
            this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
          }
          break;
        case PacketType.EVENT:
        case PacketType.BINARY_EVENT:
          this.onevent(packet);
          break;
        case PacketType.ACK:
        case PacketType.BINARY_ACK:
          this.onack(packet);
          break;
        case PacketType.DISCONNECT:
          this.ondisconnect();
          break;
        case PacketType.CONNECT_ERROR:
          this.destroy();
          const err = new Error(packet.data.message);
          err.data = packet.data.data;
          this.emitReserved("connect_error", err);
          break;
      }
    }
    /**
     * Called upon a server event.
     *
     * @param packet
     * @private
     */
    onevent(packet) {
      const args = packet.data || [];
      if (null != packet.id) {
        args.push(this.ack(packet.id));
      }
      if (this.connected) {
        this.emitEvent(args);
      } else {
        this.receiveBuffer.push(Object.freeze(args));
      }
    }
    emitEvent(args) {
      if (this._anyListeners && this._anyListeners.length) {
        const listeners = this._anyListeners.slice();
        for (const listener of listeners) {
          listener.apply(this, args);
        }
      }
      super.emit.apply(this, args);
      if (this._pid && args.length && typeof args[args.length - 1] === "string") {
        this._lastOffset = args[args.length - 1];
      }
    }
    /**
     * Produces an ack callback to emit with an event.
     *
     * @private
     */
    ack(id) {
      const self2 = this;
      let sent = false;
      return function(...args) {
        if (sent)
          return;
        sent = true;
        self2.packet({
          type: PacketType.ACK,
          id,
          data: args
        });
      };
    }
    /**
     * Called upon a server acknowledgement.
     *
     * @param packet
     * @private
     */
    onack(packet) {
      const ack = this.acks[packet.id];
      if (typeof ack !== "function") {
        return;
      }
      delete this.acks[packet.id];
      if (ack.withError) {
        packet.data.unshift(null);
      }
      ack.apply(this, packet.data);
    }
    /**
     * Called upon server connect.
     *
     * @private
     */
    onconnect(id, pid) {
      this.id = id;
      this.recovered = pid && this._pid === pid;
      this._pid = pid;
      this.connected = true;
      this.emitBuffered();
      this.emitReserved("connect");
      this._drainQueue(true);
    }
    /**
     * Emit buffered events (received and emitted).
     *
     * @private
     */
    emitBuffered() {
      this.receiveBuffer.forEach((args) => this.emitEvent(args));
      this.receiveBuffer = [];
      this.sendBuffer.forEach((packet) => {
        this.notifyOutgoingListeners(packet);
        this.packet(packet);
      });
      this.sendBuffer = [];
    }
    /**
     * Called upon server disconnect.
     *
     * @private
     */
    ondisconnect() {
      this.destroy();
      this.onclose("io server disconnect");
    }
    /**
     * Called upon forced client/server side disconnections,
     * this method ensures the manager stops tracking us and
     * that reconnections don't get triggered for this.
     *
     * @private
     */
    destroy() {
      if (this.subs) {
        this.subs.forEach((subDestroy) => subDestroy());
        this.subs = void 0;
      }
      this.io["_destroy"](this);
    }
    /**
     * Disconnects the socket manually. In that case, the socket will not try to reconnect.
     *
     * If this is the last active Socket instance of the {@link Manager}, the low-level connection will be closed.
     *
     * @example
     * const socket = io();
     *
     * socket.on("disconnect", (reason) => {
     *   // console.log(reason); prints "io client disconnect"
     * });
     *
     * socket.disconnect();
     *
     * @return self
     */
    disconnect() {
      if (this.connected) {
        this.packet({ type: PacketType.DISCONNECT });
      }
      this.destroy();
      if (this.connected) {
        this.onclose("io client disconnect");
      }
      return this;
    }
    /**
     * Alias for {@link disconnect()}.
     *
     * @return self
     */
    close() {
      return this.disconnect();
    }
    /**
     * Sets the compress flag.
     *
     * @example
     * socket.compress(false).emit("hello");
     *
     * @param compress - if `true`, compresses the sending data
     * @return self
     */
    compress(compress) {
      this.flags.compress = compress;
      return this;
    }
    /**
     * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
     * ready to send messages.
     *
     * @example
     * socket.volatile.emit("hello"); // the server may or may not receive it
     *
     * @returns self
     */
    get volatile() {
      this.flags.volatile = true;
      return this;
    }
    /**
     * Sets a modifier for a subsequent event emission that the callback will be called with an error when the
     * given number of milliseconds have elapsed without an acknowledgement from the server:
     *
     * @example
     * socket.timeout(5000).emit("my-event", (err) => {
     *   if (err) {
     *     // the server did not acknowledge the event in the given delay
     *   }
     * });
     *
     * @returns self
     */
    timeout(timeout) {
      this.flags.timeout = timeout;
      return this;
    }
    /**
     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
     * callback.
     *
     * @example
     * socket.onAny((event, ...args) => {
     *   console.log(`got ${event}`);
     * });
     *
     * @param listener
     */
    onAny(listener) {
      this._anyListeners = this._anyListeners || [];
      this._anyListeners.push(listener);
      return this;
    }
    /**
     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
     * callback. The listener is added to the beginning of the listeners array.
     *
     * @example
     * socket.prependAny((event, ...args) => {
     *   console.log(`got event ${event}`);
     * });
     *
     * @param listener
     */
    prependAny(listener) {
      this._anyListeners = this._anyListeners || [];
      this._anyListeners.unshift(listener);
      return this;
    }
    /**
     * Removes the listener that will be fired when any event is emitted.
     *
     * @example
     * const catchAllListener = (event, ...args) => {
     *   console.log(`got event ${event}`);
     * }
     *
     * socket.onAny(catchAllListener);
     *
     * // remove a specific listener
     * socket.offAny(catchAllListener);
     *
     * // or remove all listeners
     * socket.offAny();
     *
     * @param listener
     */
    offAny(listener) {
      if (!this._anyListeners) {
        return this;
      }
      if (listener) {
        const listeners = this._anyListeners;
        for (let i = 0; i < listeners.length; i++) {
          if (listener === listeners[i]) {
            listeners.splice(i, 1);
            return this;
          }
        }
      } else {
        this._anyListeners = [];
      }
      return this;
    }
    /**
     * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
     * e.g. to remove listeners.
     */
    listenersAny() {
      return this._anyListeners || [];
    }
    /**
     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
     * callback.
     *
     * Note: acknowledgements sent to the server are not included.
     *
     * @example
     * socket.onAnyOutgoing((event, ...args) => {
     *   console.log(`sent event ${event}`);
     * });
     *
     * @param listener
     */
    onAnyOutgoing(listener) {
      this._anyOutgoingListeners = this._anyOutgoingListeners || [];
      this._anyOutgoingListeners.push(listener);
      return this;
    }
    /**
     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
     * callback. The listener is added to the beginning of the listeners array.
     *
     * Note: acknowledgements sent to the server are not included.
     *
     * @example
     * socket.prependAnyOutgoing((event, ...args) => {
     *   console.log(`sent event ${event}`);
     * });
     *
     * @param listener
     */
    prependAnyOutgoing(listener) {
      this._anyOutgoingListeners = this._anyOutgoingListeners || [];
      this._anyOutgoingListeners.unshift(listener);
      return this;
    }
    /**
     * Removes the listener that will be fired when any event is emitted.
     *
     * @example
     * const catchAllListener = (event, ...args) => {
     *   console.log(`sent event ${event}`);
     * }
     *
     * socket.onAnyOutgoing(catchAllListener);
     *
     * // remove a specific listener
     * socket.offAnyOutgoing(catchAllListener);
     *
     * // or remove all listeners
     * socket.offAnyOutgoing();
     *
     * @param [listener] - the catch-all listener (optional)
     */
    offAnyOutgoing(listener) {
      if (!this._anyOutgoingListeners) {
        return this;
      }
      if (listener) {
        const listeners = this._anyOutgoingListeners;
        for (let i = 0; i < listeners.length; i++) {
          if (listener === listeners[i]) {
            listeners.splice(i, 1);
            return this;
          }
        }
      } else {
        this._anyOutgoingListeners = [];
      }
      return this;
    }
    /**
     * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
     * e.g. to remove listeners.
     */
    listenersAnyOutgoing() {
      return this._anyOutgoingListeners || [];
    }
    /**
     * Notify the listeners for each packet sent
     *
     * @param packet
     *
     * @private
     */
    notifyOutgoingListeners(packet) {
      if (this._anyOutgoingListeners && this._anyOutgoingListeners.length) {
        const listeners = this._anyOutgoingListeners.slice();
        for (const listener of listeners) {
          listener.apply(this, packet.data);
        }
      }
    }
  };

  // node_modules/socket.io-client/build/esm/contrib/backo2.js
  function Backoff(opts) {
    opts = opts || {};
    this.ms = opts.min || 100;
    this.max = opts.max || 1e4;
    this.factor = opts.factor || 2;
    this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
    this.attempts = 0;
  }
  Backoff.prototype.duration = function() {
    var ms = this.ms * Math.pow(this.factor, this.attempts++);
    if (this.jitter) {
      var rand = Math.random();
      var deviation = Math.floor(rand * this.jitter * ms);
      ms = (Math.floor(rand * 10) & 1) == 0 ? ms - deviation : ms + deviation;
    }
    return Math.min(ms, this.max) | 0;
  };
  Backoff.prototype.reset = function() {
    this.attempts = 0;
  };
  Backoff.prototype.setMin = function(min) {
    this.ms = min;
  };
  Backoff.prototype.setMax = function(max) {
    this.max = max;
  };
  Backoff.prototype.setJitter = function(jitter) {
    this.jitter = jitter;
  };

  // node_modules/socket.io-client/build/esm/manager.js
  var Manager = class extends Emitter {
    constructor(uri, opts) {
      var _a;
      super();
      this.nsps = {};
      this.subs = [];
      if (uri && "object" === typeof uri) {
        opts = uri;
        uri = void 0;
      }
      opts = opts || {};
      opts.path = opts.path || "/socket.io";
      this.opts = opts;
      installTimerFunctions(this, opts);
      this.reconnection(opts.reconnection !== false);
      this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
      this.reconnectionDelay(opts.reconnectionDelay || 1e3);
      this.reconnectionDelayMax(opts.reconnectionDelayMax || 5e3);
      this.randomizationFactor((_a = opts.randomizationFactor) !== null && _a !== void 0 ? _a : 0.5);
      this.backoff = new Backoff({
        min: this.reconnectionDelay(),
        max: this.reconnectionDelayMax(),
        jitter: this.randomizationFactor()
      });
      this.timeout(null == opts.timeout ? 2e4 : opts.timeout);
      this._readyState = "closed";
      this.uri = uri;
      const _parser = opts.parser || esm_exports;
      this.encoder = new _parser.Encoder();
      this.decoder = new _parser.Decoder();
      this._autoConnect = opts.autoConnect !== false;
      if (this._autoConnect)
        this.open();
    }
    reconnection(v) {
      if (!arguments.length)
        return this._reconnection;
      this._reconnection = !!v;
      if (!v) {
        this.skipReconnect = true;
      }
      return this;
    }
    reconnectionAttempts(v) {
      if (v === void 0)
        return this._reconnectionAttempts;
      this._reconnectionAttempts = v;
      return this;
    }
    reconnectionDelay(v) {
      var _a;
      if (v === void 0)
        return this._reconnectionDelay;
      this._reconnectionDelay = v;
      (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMin(v);
      return this;
    }
    randomizationFactor(v) {
      var _a;
      if (v === void 0)
        return this._randomizationFactor;
      this._randomizationFactor = v;
      (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setJitter(v);
      return this;
    }
    reconnectionDelayMax(v) {
      var _a;
      if (v === void 0)
        return this._reconnectionDelayMax;
      this._reconnectionDelayMax = v;
      (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMax(v);
      return this;
    }
    timeout(v) {
      if (!arguments.length)
        return this._timeout;
      this._timeout = v;
      return this;
    }
    /**
     * Starts trying to reconnect if reconnection is enabled and we have not
     * started reconnecting yet
     *
     * @private
     */
    maybeReconnectOnOpen() {
      if (!this._reconnecting && this._reconnection && this.backoff.attempts === 0) {
        this.reconnect();
      }
    }
    /**
     * Sets the current transport `socket`.
     *
     * @param {Function} fn - optional, callback
     * @return self
     * @public
     */
    open(fn) {
      if (~this._readyState.indexOf("open"))
        return this;
      this.engine = new Socket(this.uri, this.opts);
      const socket = this.engine;
      const self2 = this;
      this._readyState = "opening";
      this.skipReconnect = false;
      const openSubDestroy = on(socket, "open", function() {
        self2.onopen();
        fn && fn();
      });
      const onError = (err) => {
        this.cleanup();
        this._readyState = "closed";
        this.emitReserved("error", err);
        if (fn) {
          fn(err);
        } else {
          this.maybeReconnectOnOpen();
        }
      };
      const errorSub = on(socket, "error", onError);
      if (false !== this._timeout) {
        const timeout = this._timeout;
        const timer = this.setTimeoutFn(() => {
          openSubDestroy();
          onError(new Error("timeout"));
          socket.close();
        }, timeout);
        if (this.opts.autoUnref) {
          timer.unref();
        }
        this.subs.push(() => {
          this.clearTimeoutFn(timer);
        });
      }
      this.subs.push(openSubDestroy);
      this.subs.push(errorSub);
      return this;
    }
    /**
     * Alias for open()
     *
     * @return self
     * @public
     */
    connect(fn) {
      return this.open(fn);
    }
    /**
     * Called upon transport open.
     *
     * @private
     */
    onopen() {
      this.cleanup();
      this._readyState = "open";
      this.emitReserved("open");
      const socket = this.engine;
      this.subs.push(
        on(socket, "ping", this.onping.bind(this)),
        on(socket, "data", this.ondata.bind(this)),
        on(socket, "error", this.onerror.bind(this)),
        on(socket, "close", this.onclose.bind(this)),
        // @ts-ignore
        on(this.decoder, "decoded", this.ondecoded.bind(this))
      );
    }
    /**
     * Called upon a ping.
     *
     * @private
     */
    onping() {
      this.emitReserved("ping");
    }
    /**
     * Called with data.
     *
     * @private
     */
    ondata(data) {
      try {
        this.decoder.add(data);
      } catch (e) {
        this.onclose("parse error", e);
      }
    }
    /**
     * Called when parser fully decodes a packet.
     *
     * @private
     */
    ondecoded(packet) {
      nextTick(() => {
        this.emitReserved("packet", packet);
      }, this.setTimeoutFn);
    }
    /**
     * Called upon socket error.
     *
     * @private
     */
    onerror(err) {
      this.emitReserved("error", err);
    }
    /**
     * Creates a new socket for the given `nsp`.
     *
     * @return {Socket}
     * @public
     */
    socket(nsp, opts) {
      let socket = this.nsps[nsp];
      if (!socket) {
        socket = new Socket2(this, nsp, opts);
        this.nsps[nsp] = socket;
      } else if (this._autoConnect && !socket.active) {
        socket.connect();
      }
      return socket;
    }
    /**
     * Called upon a socket close.
     *
     * @param socket
     * @private
     */
    _destroy(socket) {
      const nsps = Object.keys(this.nsps);
      for (const nsp of nsps) {
        const socket2 = this.nsps[nsp];
        if (socket2.active) {
          return;
        }
      }
      this._close();
    }
    /**
     * Writes a packet.
     *
     * @param packet
     * @private
     */
    _packet(packet) {
      const encodedPackets = this.encoder.encode(packet);
      for (let i = 0; i < encodedPackets.length; i++) {
        this.engine.write(encodedPackets[i], packet.options);
      }
    }
    /**
     * Clean up transport subscriptions and packet buffer.
     *
     * @private
     */
    cleanup() {
      this.subs.forEach((subDestroy) => subDestroy());
      this.subs.length = 0;
      this.decoder.destroy();
    }
    /**
     * Close the current socket.
     *
     * @private
     */
    _close() {
      this.skipReconnect = true;
      this._reconnecting = false;
      this.onclose("forced close");
    }
    /**
     * Alias for close()
     *
     * @private
     */
    disconnect() {
      return this._close();
    }
    /**
     * Called when:
     *
     * - the low-level engine is closed
     * - the parser encountered a badly formatted packet
     * - all sockets are disconnected
     *
     * @private
     */
    onclose(reason, description) {
      var _a;
      this.cleanup();
      (_a = this.engine) === null || _a === void 0 ? void 0 : _a.close();
      this.backoff.reset();
      this._readyState = "closed";
      this.emitReserved("close", reason, description);
      if (this._reconnection && !this.skipReconnect) {
        this.reconnect();
      }
    }
    /**
     * Attempt a reconnection.
     *
     * @private
     */
    reconnect() {
      if (this._reconnecting || this.skipReconnect)
        return this;
      const self2 = this;
      if (this.backoff.attempts >= this._reconnectionAttempts) {
        this.backoff.reset();
        this.emitReserved("reconnect_failed");
        this._reconnecting = false;
      } else {
        const delay = this.backoff.duration();
        this._reconnecting = true;
        const timer = this.setTimeoutFn(() => {
          if (self2.skipReconnect)
            return;
          this.emitReserved("reconnect_attempt", self2.backoff.attempts);
          if (self2.skipReconnect)
            return;
          self2.open((err) => {
            if (err) {
              self2._reconnecting = false;
              self2.reconnect();
              this.emitReserved("reconnect_error", err);
            } else {
              self2.onreconnect();
            }
          });
        }, delay);
        if (this.opts.autoUnref) {
          timer.unref();
        }
        this.subs.push(() => {
          this.clearTimeoutFn(timer);
        });
      }
    }
    /**
     * Called upon successful reconnect.
     *
     * @private
     */
    onreconnect() {
      const attempt = this.backoff.attempts;
      this._reconnecting = false;
      this.backoff.reset();
      this.emitReserved("reconnect", attempt);
    }
  };

  // node_modules/socket.io-client/build/esm/index.js
  var cache = {};
  function lookup2(uri, opts) {
    if (typeof uri === "object") {
      opts = uri;
      uri = void 0;
    }
    opts = opts || {};
    const parsed = url(uri, opts.path || "/socket.io");
    const source = parsed.source;
    const id = parsed.id;
    const path = parsed.path;
    const sameNamespace = cache[id] && path in cache[id]["nsps"];
    const newConnection = opts.forceNew || opts["force new connection"] || false === opts.multiplex || sameNamespace;
    let io;
    if (newConnection) {
      io = new Manager(source, opts);
    } else {
      if (!cache[id]) {
        cache[id] = new Manager(source, opts);
      }
      io = cache[id];
    }
    if (parsed.query && !opts.query) {
      opts.query = parsed.queryKey;
    }
    return io.socket(parsed.path, opts);
  }
  Object.assign(lookup2, {
    Manager,
    Socket: Socket2,
    io: lookup2,
    connect: lookup2
  });

  // scripts/services/SocketService.ts
  var SocketService = class _SocketService {
    constructor() {
      this.chatSocket = null;
      this.gameSocket = null;
    }
    static getInstance() {
      if (!_SocketService.instance) {
        _SocketService.instance = new _SocketService();
      }
      return _SocketService.instance;
    }
    // -- LOGIQUE GÉNÉRIQUE DE CONNEXION
    // Méthode privée pour ne pas dupliquer le code de config
    createSocketConnection(path) {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error(`SocketService: No token found, cannot connect to ${path}`);
        return null;
      }
      const socket = lookup2("/", {
        path,
        auth: {
          token: `Bearer ${token}`
          // On envoie le JWT
        },
        reconnection: true,
        reconnectionAttemps: 5,
        transports: ["websocket", "polling"]
      });
      socket.on("connect", () => {
        console.log(`SocketService: Connect to ${path} with ID: ${socket.id}`);
      });
      socket.on("connect_error", (err) => {
        console.error(`SocketService: Connection error on ${path}`, err.message);
      });
      return socket;
    }
    // ---------------------
    // -- GESTION DU CHAT --
    connectChat() {
      if (this.chatSocket) return;
      console.log("SocketService: Connecting to Chat...");
      this.chatSocket = this.createSocketConnection("/socket-chat/");
    }
    disconnectChat() {
      if (this.chatSocket) {
        this.chatSocket.disconnect();
        this.chatSocket = null;
        console.log("SocketService: Chat disconnected");
      }
    }
    getChatSocket() {
      return this.chatSocket;
    }
    // ---------------------
    // -- GESTION DU GAME --
    connectGame() {
      if (this.gameSocket) return;
      console.log("SocketService: Connecting to Game...");
      this.gameSocket = this.createSocketConnection("/socket-game/");
    }
    disconnectGame() {
      if (this.gameSocket) {
        this.gameSocket.disconnect();
        this.gameSocket = null;
        console.log("SocketService: Game disconnected");
      }
    }
    getGameSocket() {
      return this.gameSocket;
    }
    // ---------------------
    // -- UTILITAIRE GLOBAL --
    disconnectAll() {
      this.disconnectChat();
      this.disconnectGame();
    }
  };
  var SocketService_default = SocketService;

  // scripts/components/Data.ts
  var globalPath = "/assets/emoticons/";
  var animationPath = "/assets/animated/";
  var gamePath = "/assets/game/";
  var appThemes = {
    "basic": {
      name: "Classic Blue",
      headerUrl: "/assets/basic/background.jpg",
      navColor: "linear-gradient(to bottom, #5DBFED 0%, #3CB1E8 50%, #3db6ec 50%, #3db6ec 100%)",
      bgColor: "linear-gradient(to bottom, #ffffff 0%, #ffffff 50%, #7ED5F4 100%)"
    },
    "bamboo": {
      name: "Zen Bamboo",
      headerUrl: "/assets/headers/bamboo_header.jpg",
      navColor: "linear-gradient(to bottom, #7CB342 0%, #558B2F 50%, #33691E 100%)",
      bgColor: "linear-gradient(to bottom, #93CD17 0%, #ffffff 50%, #93CD17 100%)"
    },
    "cherry": {
      name: "Cherry Blossom",
      headerUrl: "/assets/headers/blossoms_header.jpg",
      navColor: "linear-gradient(to bottom, #F48FB1 0%, #EC407A 50%, #C2185B 100%)",
      bgColor: "linear-gradient(to bottom, #FFBBB4 0%, #ffffff 50%, #FFBBB4 100%)"
    },
    "mountain": {
      name: "Misty Mountains",
      headerUrl: "/assets/headers/dawn_header.png",
      navColor: "linear-gradient(to bottom, #5C6BC0 0%, #3949AB 50%, #283593 100%)",
      bgColor: "linear-gradient(to bottom, #6F94BF 0%, #ffffff 50%, #6F94BF 100%)"
    },
    "punk": {
      name: "Cyber Punk",
      headerUrl: "/assets/headers/punk_header.jpg",
      navColor: "linear-gradient(to bottom, #340547 0%, #631C6E 50%, #340547 100%)",
      bgColor: "linear-gradient(to bottom, #7B51B3 0%, #d8b4fe 50%, #7B51B3 100%)"
    },
    "dotted": {
      name: "Spring Dots",
      headerUrl: "/assets/headers/dott_header.png",
      navColor: "linear-gradient(to bottom, #9CCC65 0%, #7CB342 50%, #558B2F 100%)",
      bgColor: "linear-gradient(to bottom, #8BC72C 0%, #ffffff 50%, #8BC72C 100%)"
    },
    "sunset": {
      name: "Golden Sunset",
      headerUrl: "/assets/headers/field_header.png",
      navColor: "linear-gradient(to bottom, #FF9800 0%, #F57C00 50%, #E65100 100%)",
      bgColor: "linear-gradient(to bottom, #F7A624 0%, #ffffff 50%, #F7A624 100%)"
    },
    "football": {
      name: "Stadium",
      headerUrl: "/assets/headers/football_header.png",
      navColor: "linear-gradient(to bottom, #66BB6A 0%, #43A047 50%, #2E7D32 100%)",
      bgColor: "linear-gradient(to bottom, #73AD4E 0%, #ffffff 50%, #73AD4E 100%)"
    },
    "spring": {
      name: "Spring Garden",
      headerUrl: "/assets/headers/hill_header.png",
      navColor: "linear-gradient(to bottom, #B7E51E 0%, #91D42F 50%, #80C432 100%)",
      bgColor: "linear-gradient(to bottom, #73D4E5 0%, #ffffff 50%, #73D4E5 100%)"
    },
    "love": {
      name: "Lovely Heart",
      headerUrl: "/assets/headers/love_header.jpg",
      navColor: "linear-gradient(to bottom, #973D3D 0%, #7E2223 50%, #5A0908 100%)",
      bgColor: "linear-gradient(to bottom, #832525 0%, #ffffff 50%, #832525 100%)"
    },
    "diary": {
      name: "Dear Diary",
      headerUrl: "/assets/headers/diary_header.jpg",
      navColor: "linear-gradient(to bottom, #D658A4 0%, #BA3083 50%, #D90082 100%)",
      bgColor: "linear-gradient(to bottom, #E297B6 0%, #ffffff 50%, #E297B6 100%)"
    },
    "branches": {
      name: "Winter Branches",
      headerUrl: "/assets/headers/silhouette_header.jpg",
      navColor: "linear-gradient(to bottom, #FF9800 0%, #F57C00 50%, #E65100 100%)",
      bgColor: "linear-gradient(to bottom, #F79B34 0%, #ffffff 50%, #F79B34 100%)"
    },
    "purple": {
      name: "Purple Dreams",
      headerUrl: "/assets/headers/spring_header.png",
      navColor: "linear-gradient(to bottom, #9C27B0 0%, #7B1FA2 50%, #6A1B9A 100%)",
      bgColor: "linear-gradient(to bottom, #663A92 0%, #ffffff 50%, #663A92 100%)"
    },
    "abstract": {
      name: "Abstract Flow",
      headerUrl: "/assets/headers/weird_header.jpg",
      navColor: "linear-gradient(to bottom, #FF6B9D 0%, #FF1744 50%, #D50000 100%)",
      bgColor: "linear-gradient(to bottom, #F38AB3 0%, #ffcdd2 50%, #F38AB3 100%)"
    }
  };
  var ballEmoticons = {
    "smile": gamePath + "smile.png",
    "surprised": gamePath + "surprised.png",
    "confused": gamePath + "confused.png",
    "hot": gamePath + "hot.png",
    "teeth_smile": gamePath + "teeth_smile.png",
    "tongue": gamePath + "tongue_smile.png",
    "sad": gamePath + "sad.png",
    "disappointed": gamePath + "disappointed.png",
    "embarrassed": gamePath + "embarrassed.png",
    "angry": gamePath + "angry.png",
    "nerd": gamePath + "nerd.png",
    "teeth": gamePath + "teeth.png",
    "sarcastic": gamePath + "sarcastic.png",
    "sick": gamePath + "sick.png",
    "devil": gamePath + "devil_smile.png"
  };
  var gameBackgrounds = {
    "classic": "#B8E8F9",
    // Bleu pastel clair
    "mint": "#D4F1E8",
    // Vert menthe
    "lavender": "#E6E6FA",
    // Lavande
    "rose": "#FFE1E9",
    // Rose
    "lemon": "#FFFACD",
    // Citron
    "sky": "#B0E0E6",
    // Bleu ciel
    "coral": "#FFCCCB",
    // Corail
    "lilac": "#DCD0FF",
    // Lilas
    "sage": "#C8E6C9",
    // Vert sauge
    "powder": "#B0C4DE",
    // Bleu poudré
    "blush": "#FFC0CB",
    // Rose poudré
    "apricot": "#FFDAB9"
    // Abricot
  };
  var statusImages = {
    "available": "/assets/basic/status_online_small.png",
    "online": "/assets/basic/status_online_small.png",
    "busy": "/assets/basic/status_busy_small.png",
    "away": "/assets/basic/status_away_small.png",
    "invisible": "/assets/basic/status_offline_small.png",
    "offline": "/assets/basic/status_offline_small.png"
  };
  var statusLabels = {
    "available": "(Available)",
    "busy": "(Busy)",
    "away": "(Away)",
    "invisible": "(Appear offline)"
  };
  var getStatusDot = (status) => {
    switch (status) {
      case "available":
        return "/assets/friends/online-dot.png";
      case "busy":
        return "/assets/friends/busy-dot.png";
      case "away":
        return "/assets/friends/away-dot.png";
      default:
        return "/assets/friends/offline-dot.png";
    }
  };
  var animations = {
    "(boucy_ball)": animationPath + "bouncy_ball.gif",
    "(bow)": animationPath + "bow.gif",
    "(crying)": animationPath + "crying.gif",
    "(dancer)": animationPath + "dancer.gif",
    "(dancing_pig)": animationPath + "dancing_pig.gif",
    "(frog)": animationPath + "frog.gif",
    "(guitar_smash)": animationPath + "guitar_smash.gif",
    "(heart)": animationPath + "heart.gif",
    "(kiss)": animationPath + "kiss.gif",
    "(knock)": animationPath + "knock.gif",
    "(silly_face)": animationPath + "silly_face.gif",
    "(ufo)": animationPath + "ufo.gif",
    "(water_balloon)": animationPath + "water_balloon.gif"
  };
  var icons = {
    "(boucy_ball)": animationPath + "bouncy_ball.png",
    "(bow)": animationPath + "bow.jpg",
    "(crying)": animationPath + "crying.png",
    "(dancer)": animationPath + "dancer.png",
    "(dancing_pig)": animationPath + "dancing_pig.png",
    "(frog)": animationPath + "frog.png",
    "(guitar_smash)": animationPath + "guitar_smash.png",
    "(heart)": animationPath + "heart.png",
    "(kiss)": animationPath + "kiss.png",
    "(knock)": animationPath + "knock.png",
    "(silly_face)": animationPath + "silly_face.png",
    "(ufo)": animationPath + "ufo.png",
    "(water_balloon)": animationPath + "water_balloon.png"
  };
  var emoticons = {};
  function alias(keys, file) {
    keys.forEach((k) => emoticons[k] = globalPath + file);
  }
  Object.assign(emoticons, {
    ":-)": globalPath + "smile.gif",
    ":-O": globalPath + "surprised.gif",
    ";-)": globalPath + "wink_smile.gif",
    ":-S": globalPath + "confused.gif",
    ":'(": globalPath + "crying.gif",
    ":-#": globalPath + "silence.gif",
    "8-|": globalPath + "nerd.gif",
    ":-*": globalPath + "secret.gif",
    ":^)": globalPath + "unknow.gif",
    "|-)": globalPath + "sleepy.gif",
    "({)": globalPath + "guy_hug.gif",
    ":-[": globalPath + "bat.gif",
    "(@)": globalPath + "cat.gif",
    "(8)": globalPath + "note.gif",
    "(*)": globalPath + "star.gif",
    "(sn)": globalPath + "snail.gif",
    "(pl)": globalPath + "plate.gif",
    "(pi)": globalPath + "pizza.gif",
    "(au)": globalPath + "car.gif",
    "(um)": globalPath + "umbrella.gif",
    "(co)": globalPath + "computer.gif",
    "(st)": globalPath + "storm.gif",
    "(mo)": globalPath + "money.gif",
    "8o|": globalPath + "teeth.gif",
    "^o)": globalPath + "sarcastic.gif",
    "+o(": globalPath + "sick.gif",
    "*-)": globalPath + "thinking.gif",
    "8-)": globalPath + "eye_roll.gif",
    "(6)": globalPath + "devil_smile.gif",
    "(bah)": globalPath + "sheep.gif",
    "(||)": globalPath + "bowl.gif",
    "(so)": globalPath + "soccer.gif",
    "(ap)": globalPath + "airplane.gif",
    "(ip)": globalPath + "island.gif",
    "(mp)": globalPath + "portable.gif",
    "(li)": globalPath + "lightning.gif"
  });
  alias([":)", ":-)"], "smile.gif");
  alias([":o", ":-O"], "surprised.gif");
  alias([";)", ";-)"], "wink_smile.gif");
  alias([":s", ":-S"], "confused.gif");
  alias(["(H)", "(h)"], "hot.gif");
  alias(["(A)", "(a)"], "angel.gif");
  alias([":[", ":-["], "bat.gif");
  alias(["(L)", "(l)"], "heart.gif");
  alias(["(K)", "(k)"], "kiss.gif");
  alias(["(F)", "(f)"], "rose.gif");
  alias(["(P)", "(p)"], "camera.gif");
  alias(["(T)", "(t)"], "phone.gif");
  alias(["(O)", "(o)"], "clock.gif");
  alias([":D", ":-D"], "teeth_smile.gif");
  alias([":p", ":-P"], "tongue_smile.gif");
  alias([":(", ":-("], "sad.gif");
  alias([":|", ":-|"], "disappointed.gif");
  alias([":$", ":-$"], "embarrassed.gif");
  alias([":@", ":-@"], "angry.gif");
  alias(["(C)", "(c)"], "coffee.gif");
  alias(["(N)", "(n)"], "thumbs_down.gif");
  alias(["(D)", "(d)"], "martini.gif");
  alias(["(Z)", "(z)"], "guy.gif");
  alias(["(})", "({)"], "guy_hug.gif");
  alias(["(U)", "(u)"], "broken_heart.gif");
  alias(["(G)", "(g)"], "present.gif");
  alias(["(W)", "(w)"], "wilted_rose.gif");
  alias(["(E)", "(e)"], "email.gif");
  alias(["(I)", "(i)"], "lightbulb.gif");
  alias(["(M)", "(m)"], "messenger.gif");
  alias(["(Y)", "(y)"], "thumbs_up.gif");
  alias(["(B)", "(b)"], "beer_mug.gif");
  alias(["(X)", "(x)"], "girl.gif");
  async function updateUserStatus(newStatus) {
    const userId = localStorage.getItem("userId");
    const username = localStorage.getItem("username");
    if (!userId) return;
    try {
      await fetchWithAuth(`/api/user/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      const socket = SocketService_default.getInstance().socket;
      if (socket && username) {
        socket.emit("notifyStatusChange", {
          userId: Number(userId),
          status: newStatus,
          username
        });
        console.log(`[Status] Updated to ${newStatus} for ${username}`);
      }
      localStorage.setItem("userStatus", newStatus);
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  }

  // scripts/pages/LoginPage.ts
  function render() {
    return LoginPage_default;
  }
  async function init2faLogin(accessToken, userId, selectedStatus) {
    if (accessToken) localStorage.setItem("accessToken", accessToken);
    if (userId) localStorage.setItem("userId", userId.toString());
    if (userId && accessToken) {
      try {
        const userRes = await fetch(`/api/user/${userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
          }
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.alias)
            localStorage.setItem("username", userData.alias);
          if (userData.theme)
            localStorage.setItem("userTheme", userData.theme);
        }
      } catch (err) {
        console.error("Can't get user's profile", err);
      }
      try {
        await fetch(`/api/user/${userId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
          },
          body: JSON.stringify({ status: selectedStatus })
        });
      } catch (err) {
        console.error("Failed to update status on login", err);
      }
    }
    localStorage.setItem("userStatus", selectedStatus);
    window.history.pushState({}, "", "/home");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
  function handleLogin() {
    console.log("handleLogin");
    const button = document.getElementById("login-button");
    const errorElement = document.getElementById("error-message");
    const modal2fa = document.getElementById("2fa-modal");
    const input2fa = document.getElementById("2fa-input-code");
    const confirm2fa = document.getElementById("confirm-2fa-button");
    const close2fa = document.getElementById("close-2fa-modal");
    const error2fa = document.getElementById("2fa-error-message");
    let tempToken = null;
    let cachedStatus = "available";
    button?.addEventListener("click", async () => {
      const email = document.getElementById("email-input").value;
      const password = document.getElementById("password-input").value;
      const selectedStatus = document.getElementById("status-input").value;
      if (errorElement) {
        errorElement.classList.add("hidden");
        errorElement.textContent = "";
      }
      if (!email || !password) {
        if (errorElement) {
          errorElement.textContent = "Please fill all inputs";
          errorElement.classList.remove("hidden");
        }
        return;
      }
      try {
        const response = await fetch("/api/auth/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const result = await response.json();
        if (result.require2fa) {
          console.log("2FA require");
          localStorage.setItem("is2faEnabled", "true");
          tempToken = result.tempToken;
          if (modal2fa) {
            modal2fa.classList.remove("hidden");
            modal2fa.classList.add("flex");
            input2fa.value = "";
            input2fa.focus();
          }
          return;
        }
        if (result.success) {
          localStorage.setItem("is2faEnabled", "false");
          const { accessToken, userId } = result.data;
          await init2faLogin(accessToken, userId, cachedStatus);
          if (accessToken) localStorage.setItem("accessToken", accessToken);
          if (userId) localStorage.setItem("userId", userId.toString());
          if (userId && accessToken) {
            try {
              const userRes = await fetchWithAuth(`/api/user/${userId}`, {
                method: "GET"
              });
              if (userRes.ok) {
                const userData = await userRes.json();
                if (userData.alias)
                  localStorage.setItem("username", userData.alias);
                if (userData.theme)
                  localStorage.setItem("userTheme", userData.theme);
              }
            } catch (err) {
              console.error("Can't get user's profile", err);
            }
            try {
              await fetchWithAuth(`/api/user/${userId}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status: selectedStatus })
              });
              console.log("Status updated to DB:", selectedStatus);
            } catch (err) {
              console.error("Failed to update status on login", err);
            }
          }
          localStorage.setItem("userStatus", selectedStatus);
          window.history.pushState({}, "", "/home");
          window.dispatchEvent(new PopStateEvent("popstate"));
        } else {
          console.error("Login error:", result.error);
          if (errorElement) {
            errorElement.textContent = result.error?.message || result.error.error || "Authentication failed";
            errorElement.classList.remove("hidden");
          }
        }
      } catch (error) {
        console.error("Network error:", error);
        if (errorElement) {
          errorElement.textContent = "Network error, please try again";
          errorElement.classList.remove("hidden");
        }
      }
    });
    confirm2fa?.addEventListener("click", async () => {
      const code = input2fa.value.trim();
      if (error2fa) error2fa.classList.add("hidden");
      if (!code || !tempToken) return;
      try {
        const response = await fetch("/api/auth/2fa/challenge", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${tempToken}`
          },
          body: JSON.stringify({ code })
        });
        const result = await response.json();
        if (response.ok && result.success) {
          localStorage.setItem("is2faEnabled", "true");
          const { accessToken, userId } = result;
          if (modal2fa) modal2fa.classList.add("hidden");
          await updateUserStatus("online");
          await init2faLogin(accessToken, userId, cachedStatus);
        } else {
          if (error2fa) {
            error2fa.textContent = "Invalid code.";
            error2fa.classList.remove("hidden");
            console.error("2FA Error:", result.error.message);
          }
        }
      } catch (error) {
        if (error2fa) {
          error2fa.textContent = "Error during verification.";
          error2fa.classList.remove("hidden");
        }
      }
    });
    const closeFunc = () => {
      if (modal2fa) {
        modal2fa.classList.add("hidden");
        modal2fa.classList.remove("flex");
        tempToken = null;
      }
    };
    close2fa?.addEventListener("click", closeFunc);
    modal2fa?.addEventListener("click", (e) => {
      if (e.target === modal2fa) closeFunc();
    });
  }
  function loginEvents() {
    handleLogin();
  }

  // scripts/pages/HomePage.html
  var HomePage_default = `<div id="wizz-container" class="relative w-full h-[calc(100vh-50px)] overflow-hidden">

	<div id="home-header" class="absolute top-0 left-0 w-full h-[200px] bg-cover bg-center bg-no-repeat"
		 style="background-image: url(/assets/basic/background.jpg); background-size: cover;">
	</div>

	<div class="absolute top-[20px] bottom-0 left-0 right-0 flex flex-col px-10 py-2 gap-2" style="padding-left: 100px; padding-right: 100px; bottom: 100px;">
		
		<!-- Container avec left et right qui prennent toute la hauteur restante -->
		<div class="flex gap-6 flex-1 min-h-0" style="gap:80px;">

			<!-- ========= LEFT COLUMN ========= -->
			<div class="flex flex-col gap-6 w-[700px] min-w-[700px]">
				
				<!-- ========= PROFILE WINDOW ========= -->
				<div class="window flex flex-col">
					<div class="title-bar">
						<div class="title-bar-text">Profile</div>
						<div class="title-bar-controls">
							<button aria-label="Minimize"></button>
							<button aria-label="Maximize"></button>
							<button aria-label="Close"></button>
						</div>
					</div>

					<div id="left" class="window-body flex flex-col h-full w-[700px] min-w-[700px] shrink-0 bg-white border border-gray-300 shadow-inner rounded-sm" style="width: 500px; min-width: 500px; background-color: white;">
						<div class="flex flex-row w-full rounded-sm p-2"> 
							<!-- Cadre du profil -->
							<div class="flex flex-row w-full bg-transparent rounded-sm p-2" style="flex-shrink: 0;">
								<div class="relative w-[110px] h-[110px] flex-shrink-0">
									<!-- l'image (profil principal) -->
									<img id="user-profile" class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[75px] h-[75px] object-cover"
										style="height: 70px; width:70px;" src="/assets/profile/Rubber_Ducky.png" alt="User avatar">
									<!-- le cadre -->
									<img id="user-status" class="absolute inset-0 w-full h-full object-cover pointer-events-none" src="/assets/basic/status_away_small.png" alt="Status frame">
								</div>
		
								<!-- username, bio et status -->
								<div class="flex flex-col justify-center pl-4 flex-1">
									<div class="flex items-center gap-2 mb-1">
										<p class="text-xl font-semibold" id="user-name">Username</p>
		
										<!-- selection du status = dynamique -->
										<div class="relative">
											<button id="status-selector" class="flex items-center gap-1 px-2 py-1 text-sm rounded-sm hover:bg-gray-200">
												<span id="current-status-text">(Available)</span>
												<img src="/assets/chat/arrow.png" alt="Arrow" class="w-3 h-3">
											</button>
		
											<!-- Menu dropdown pour le status -->
											<div id="status-dropdown" class="absolute hidden top-full left-0 mt-1 w-70 bg-white border border-gray-300 rounded-md shadow-xl z-50">
												<button class="status-option w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2" data-status="available">
													<span class="w-2 h-2 rounded-full"></span>
													<span>Available</span>
												</button>
												<button class="status-option w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2" data-status="busy">
													<span class="w-2 h-2 rounded-full"></span>
													<span>Busy</span>
												</button>
												<button class="status-option w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2" data-status="away">
													<span class="w-2 h-2 rounded-full"></span>
													<span>Away</span>
												</button>
												<button class="status-option w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2" data-status="invisible">
													<span class="w-2 h-2 rounded-full"></span>
													<span>Offline</span>
												</button>
											</div>
										</div>
									</div>
									<div id="bio-wrapper">
										<p id="user-bio" class="text-sm text-gray-600 italic cursor-text">Share a quick message</p>
										<span class="char-count hidden text-xs text-gray-500 self-center">0/70</span>
									</div>
								</div>
		
								<!-- Notifications -->
								<div class="ml-auto flex items-start relative">
									<button id="notification-button" class="relative w-10 h-10 cursor-pointer">
										<img id="notification-icon" 
											src="/assets/basic/no_notification.png" 
											alt="Notifications" 
											class="w-full h-full object-contain">
											<div id="notification-badge" class="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full hidden border border-white"></div>
									</button>
									<div id="notification-dropdown" class="absolute hidden top-full right-0 mt-2 w-150 bg-white border border-gray-300 rounded-md shadow-xl z-50 overflow-hidden" style="width: 550px; margin-top: 4px;">
										<div class="bg-gray-50 px-8 py-6 border-b border-gray-200 text-center">
											<h3 class="font-bold text-lg text-gray-800 tracking-wide">
												Notifications
											</h3>
										</div>
										<div id="notification-list" class="flex flex-col max-h-64 overflow-y-auto divide-y divide-gray-200">
											<div class="p-4 text-center text-xs text-gray-500">No notification</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- ========= GAMES WINDOW ========= -->
				<div class="window flex flex-col flex-1">
					<div class="title-bar">
						<div class="title-bar-text">Games</div>
						<div class="title-bar-controls">
							<button aria-label="Minimize"></button>
							<button aria-label="Maximize"></button>
							<button aria-label="Close"></button>
						</div>
					</div>

					<div id="left" class="window-body bg-white border border-gray-300 shadow-inner rounded-sm flex flex-col flex-1" style="background-color: white;">
						<div class="bg-white p-6 flex flex-col flex-1">
							<h1 class="text-xl font-semibold mb-6 text-center text-gray-800 tracking-wide">CHOOSE YOUR GAME MODE</h1>

							<div class="flex flex-col gap-4 flex-1 justify-center px-8 items-center">
								<button id="local-game" 
									class="w-50 bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm 
										px-6 py-4 text-base font-semibold shadow-sm hover:from-gray-200 hover:to-gray-400 
										active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400
										transition-all duration-200 hover:shadow-md" style="width: 150px; padding: 4px;" >
									LOCAL GAME
								</button>

								<button id="remote-game" 
									class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm 
										px-6 py-4 text-base font-semibold shadow-sm hover:from-gray-200 hover:to-gray-400 
										active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400
										transition-all duration-200 hover:shadow-md" style="width: 150px; padding: 4px;">
									REMOTE GAME
								</button>

								<button id="tournament-game" 
									class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm 
										px-6 py-4 text-base font-semibold shadow-sm hover:from-gray-200 hover:to-gray-400 
										active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400
										transition-all duration-200 hover:shadow-md" style="width: 150px; padding: 4px;">
									TOURNAMENT
								</button>
							</div>
						</div>
					</div>
				</div>

			</div>


			<!-- ========= RIGHT WINDOW ========= -->
			<div class="window flex flex-col flex-1 min-w-0">
				<div class="title-bar">
					<div class="title-bar-text">Messenger</div>
					<div class="title-bar-controls">
						<button aria-label="Minimize"></button>
						<button aria-label="Maximize"></button>
						<button aria-label="Close"></button>
					</div>
				</div>

				<div id="right" class="window-body flex flex-row gap-4 flex-1 min-w-0">

					<div id="chat-frame" class="relative flex-1 p-10 bg-gradient-to-b from-blue-50 to-gray-400 rounded-sm flex flex-row items-end bg-cover bg-center transition-all duration-300 min-h-0">

						<div id="friend-list" class="flex flex-col bg-white border border-gray-300 rounded-sm shadow-sm p-4 w-[350px] min-w-[350px] relative z-10 min-h-0 h-full"  style="width:350px; min-width: 350px;">
							<div class="flex flex-row items-center justify-between">
								<p class="text-xl text-black font-semibold text-center tracking-wide mb-3 select-none">MY FRIENDS</p>
								
								<div class="ml-auto flex items-center mb-3 relative">
									<button id="add-friend-button" class="relative w-9 h-9 cursor-pointer">
										<img id="add-friend-icon" 
											src="/assets/basic/1441.png" 
											alt="Friends button" 
											class="w-full h-full object-contain">
									</button>
									<div id="add-friend-dropdown" class="absolute hidden top-full right-0 mt-2 w-72 bg-white border border-gray-300 rounded-md shadow-xl z-50 p-4">
										<p class="text-sm font-semibold mb-2 text-center">Add a friend</p>
										<input type="text" 
											id="friend-search-input" 
											placeholder="Type in username or email" 
											class="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400 mb-3">
										<div class="flex gap-2">
											<button id="send-friend-request" 
												class="flex-1 bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm px-3 py-1.5 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400">
												Send request
											</button>
											<button id="cancel-friend-request" 
												class="flex-1 bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400  rounded-sm px-3 py-1.5 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400">
												Cancel
											</button>
										</div>
										<div id="friend-request-message" class="mt-2 text-xs hidden"></div>
									</div>
								</div>
							</div>

							<div class="flex flex-col gap-3 overflow-y-auto pr-1 select-none border-t border-gray-500" style="padding-top: 13px;">

								<details open class="group">
									<summary class="flex items-center gap-2 cursor-pointer font-semibold text-sm py-1 hover:text-blue-600">
										\u2B50 Contacts
									</summary>

									<div id="contacts-list" class="mt-2 ml-4 flex flex-col gap-2">
										</div>
								</details>
							</div>
						</div>

						<div id="chat-placeholder" class="flex flex-col items-center justify-center flex-1 h-full relative z-10 bg-white border border-gray-300 rounded-sm shadow-sm">
							<img src="/assets/basic/messenger_logo.png" alt="" class="w-24 h-24 opacity-20 grayscale mb-4">
							<p class="text-gray-400 text-lg font-semibold">Select a friend to start chatting</p>
						</div>

						<div id="channel-chat" class="hidden flex flex-col bg-white border border-gray-300 rounded-sm shadow-sm p-4 flex-1 relative z-10 min-h-0 h-full">
							
							<div class="flex items-center justify-between border-b border-gray-200 pb-2 mb-2 relative">
								<div class="flex gap-4 items-center">
									<div class="relative w-[80px] h-[80px] flex-shrink-0">
										<img id="chat-header-avatar" 
											class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[50px] h-[50px] object-cover"
											src="" 
											alt="User avatar">
										<img id="chat-header-status" 
											class="absolute inset-0 w-full h-full object-contain" 
											src="/assets/basic/status_online_small.png" 
											alt="Status frame">
									</div>
									<div class="flex flex-col justify-start leading-tight">
										<p id="chat-header-username" class="font-bold text-lg leading-none text-gray-800"></p>
										<p id="chat-header-bio" class="text-xs text-gray-500 italic"></p>
									</div>
								</div>
								
								<div class="relative self-start mt-2">
									<button id="chat-options-button" class="p-1 hover:bg-gray-100 rounded-full transition duration-200 cursor-pointer">
										<img src="/assets/chat/meatball.png"
											 alt="options"
											 class="w-6 h-6 object-contain"
											 style="width: 15px; height: 15px; vertical-align: -25px;">
									</button>

									<div id="chat-options-dropdown" class="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded-md shadow-xl z-50 hidden overflow-hidden p-2" style="width: 200px">
    
										<div class="flex flex-row items-center gap-4 px-3 py-3 hover:bg-blue-50 transition cursor-pointer rounded">
											<div class="w-6 h-6 flex items-center justify-center flex-shrink-0">
												<img src="/assets/basic/view_profile.png" 
													class="w-6 h-6 object-cover rounded"
													alt="avatar">
											</div>
											<button id="button-view-profile" class="text-left text-sm text-gray-700 flex-1">
												View profile
											</button>
										</div>

										<div class="flex flex-row items-center gap-4 px-3 py-3 hover:bg-blue-50 transition cursor-pointer rounded">
											<div class="w-6 h-6 flex items-center justify-center flex-shrink-0">
												<img src="/assets/basic/game_notification.png" 
													class="w-6 h-6 object-cover rounded"
													alt="avatar">
											</div>
											<button id="button-invite-game" class="text-left text-sm text-gray-700 flex-1">
												Invite to play
											</button>
										</div>

										<div class="flex flex-row items-center gap-4 px-3 py-3 hover:bg-blue-50 transition cursor-pointer rounded">
											<div class="w-6 h-6 flex items-center justify-center flex-shrink-0">
												<img src="/assets/basic/report.png" 
													class="w-5 h-5 object-cover rounded"
													alt="avatar">
											</div>
										</div>

										<div class="flex flex-row items-center gap-4 px-3 py-3 hover:bg-blue-50 transition cursor-pointer rounded">
											<div class="w-6 h-6 flex items-center justify-center flex-shrink-0">
												<img src="/assets/basic/block.png" 
													class="w-6 h-6 object-cover rounded"
													alt="avatar">
											</div>
											<button id="button-block-user" class="text-left text-sm text-gray-700 flex-1">
												Block user
											</button>
										</div>

									</div>

								</div>


							</div>



							<div id="chat-messages" class="flex-1 h-0 overflow-y-auto min-h-0 pt-2 space-y-2 text-sm"></div>

							<div class="flex flex-col">
								<input type="text" id="chat-input" placeholder="\xC9crire un message..." class="mt-3 bg-gray-100 rounded-sm p-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm">

								<div class="flex border-x border-b rounded-b-[4px] border-[#bdd5df] items-center pl-1" style="background-image: url(&quot;/assets/chat/chat_icons_background.png&quot;);">
									<button id="select-emoticon" class="h-6">
										<div class="relative flex items-center aerobutton p-0.7 h-5 border border-transparent rounded-sm hover:border-gray-300">
											<div class="w-5"><img src="/assets/chat/select_emoticon.png" alt="Select Emoticon"></div>
											<div><img src="/assets/chat/arrow.png" alt="Select arrow"></div>

											<div id="emoticon-dropdown" class="absolute z-10 hidden bottom-full left-0 mb-1 w-72 p-2 bg-white border border-gray-300 rounded-md shadow-xl">
												<div class="grid grid-cols-8 gap-1" id="emoticon-grid"></div>
											</div>
										</div>
									</button>

									<button id="select-animation" class="h-6">
										<div class="relative flex items-center aerobutton p-0.7 h-5 border border-transparent rounded-sm hover:border-gray-300">
											<div class="w-5"><img src="/assets/chat/select_wink.png" alt="Select Animation"></div>
											<div><img src="/assets/chat/arrow.png" alt="Select arrow"></div>

											<div id="animation-dropdown" class="absolute z-10 hidden bottom-full left-0 mb-1 w-72 p-2 bg-white border border-gray-300 rounded-md shadow-xl">
												<div class="grid grid-cols-8 gap-1" id="animation-grid"></div>
											</div>
										</div>
									</button>

									<div class="absolute top-0 left-0 flex w-full h-full justify-center items-center pointer-events-none"><div></div></div>
									<button id="send-wizz" class="flex items-center aerobutton p-1 h-6 border border-transparent rounded-sm hover:border-gray-300"><div><img src="/assets/chat/wizz.png" alt="Sending wizz"></div></button>
									<div class="px-2"><img src="/assets/chat/chat_icons_separator.png" alt="Icons separator"></div>

									<button id="change-font" class="h-6">
										<div class="relative flex items-center aerobutton p-0.7 h-5 border border-transparent rounded-sm hover:border-gray-300">
										<div class="w-5"><img src="/assets/chat/change_font.png" alt="Change font"></div>
										<div><img src="/assets/chat/arrow.png" alt="Select arrow"></div>

										<div id="font-dropdown" class="absolute z-10 hidden bottom-full left-0 mb-1 w-auto p-1 bg-white border border-gray-300 rounded-md shadow-xl">
											<div class="grid grid-cols-4 gap-[2px] w-[102px]" id="font-grid"></div>
										</div>

										</div>
									</button>

									<div class="relative">
									<button id="select-background" class="flex items-center aerobutton p-1 h-6 border border-transparent rounded-sm hover:border-gray-300">
										<div class="w-5"><img src="/assets/chat/select_background.png" alt="Background"></div>
										<div><img src="/assets/chat/arrow.png" alt="Arrow"></div>
									</button>

									<div id="background-dropdown" class="absolute hidden bottom-full right-0 mb-1 w-64 p-2 bg-white border border-gray-300 rounded-md shadow-xl z-50">
										<p class="text-xs text-gray-500 mb-2 pl-1">Choose a background:</p>
													
										<div class="grid grid-cols-3 gap-2">
														
											<button class="bg-option w-full h-12 border border-gray-200 hover:border-blue-400 rounded bg-cover bg-center" 
													data-bg="url('/assets/backgrounds/fish_background.jpg')"
													style="background-image: url('/assets/backgrounds/fish_background.jpg');">
											</button>

											<button class="bg-option w-full h-12 border border-gray-200 hover:border-blue-400 rounded bg-cover bg-center" 
													data-bg="url('/assets/backgrounds/heart_background.jpg')"
													style="background-image: url('/assets/backgrounds/heart_background.jpg');">
											</button>

											<button class="bg-option w-full h-12 border border-gray-200 hover:border-blue-400 rounded bg-cover bg-center" 
													data-bg="url('/assets/backgrounds/lavender_background.jpg')"
													style="background-image: url('/assets/backgrounds/lavender_background.jpg');">
											</button>

											<button class="bg-option col-span-3 text-xs text-red-500 hover:underline mt-1" data-bg="none">
												Default background
											</button>
										</div>
									</div>
								</div>
						</div>
					</div> 
				</div>
			</div> 
		</div>

	</div>

<div id="friend-profile-modal" class="absolute inset-0 bg-black/40 z-50 hidden items-center justify-center">
    <div class="window bg-white" style="width: 500px; box-shadow: 0px 0px 20px rgba(0,0,0,0.5);">
        <div class="title-bar">
            <div class="title-bar-text">User Profile</div>
            <div class="title-bar-controls">
                <button id="close-friend-modal" aria-label="Close"></button>
            </div>
        </div>
        <div class="window-body p-6">
            
            <div class="flex flex-row gap-6 mb-6 items-center">
                
                <div class="relative w-[130px] h-[130px] flex-shrink-0">
                    <img id="friend-modal-status" 
                            class="absolute inset-0 w-full h-full object-cover z-20 pointer-events-none"
                            src="/assets/basic/status_frame_online_large.png">
                    
                    <img id="friend-modal-avatar" 
                            class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90px] h-[90px] object-cover z-10 bg-gray-200" style="width: 80px; height: 80px;"
                            src="/assets/basic/default.png">
                </div>

                <div class="flex flex-col justify-center gap-1 flex-1 min-w-0">
                    <h2 id="friend-modal-username" class="text-2xl font-bold text-gray-800 truncate">Username</h2>
                    
                    <p id="friend-modal-bio" class="text-sm text-gray-600 italic break-words">No bio available.</p>
                </div>	
            </div>

            <fieldset class="border border-gray-300 p-4 rounded-sm">
                <legend class="text-sm px-2 text-gray-600">Statistics</legend>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div class="flex justify-between border-b border-gray-100 pb-1">
                        <span>Games Played:</span>
                        <span id="friend-stat-games" class="font-bold">0</span>
                    </div>
                    <div class="flex justify-between border-b border-gray-100 pb-1">
                        <span>Wins:</span>
                        <span id="friend-stat-wins" class="font-bold text-green-600">0</span>
                    </div>
                    <div class="flex justify-between border-b border-gray-100 pb-1">
                        <span>Losses:</span>
                        <span id="friend-stat-losses" class="font-bold text-red-600">0</span>
                    </div>
                    <div class="flex justify-between border-b border-gray-100 pb-1">
                        <span>Winning streak:</span>
                        <span id="friend-stat-streak" class="font-bold text-blue-600">#0</span>
                    </div>
                </div>
            </fieldset>

            <div class="flex justify-end mt-4">
                    <button id="close-friend-modal-button" 
                    class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm 
                        px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 
                        active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">
                    Close
                </button>
            </div>
        </div>
    </div>
</div>

 <!-- MODALE POUR L'AVATAR -->


    <div id="picture-modal" class="absolute inset-0 bg-black/40 z-50 hidden items-center justify-center">
        <div class="window bg-white" style="width: 650px; box-shadow: 0px 0px 20px rgba(0,0,0,0.5);">
            <div class="title-bar">
                <div class="title-bar-text">Change Picture</div>
                <div class="title-bar-controls">
                    <button aria-label="Minimize"></button>
                    <button aria-label="Maximize"></button>
                    <button id="close-modal" aria-label="Close"></button>
                </div>
            </div>
            <div class="window-body p-6">
                <div class="mb-6">
                    <h2 class="text-xl mb-1">Select a picture</h2>
                    <p class="text-gray-500 text-sm">Choose how you want to appear on transcendence.</p>
                </div>
                
                <div class="flex flex-row gap-6">
                    <div class="flex-1">
                        <div class="bg-white border border-[#828790] shadow-inner p-2 h-[250px] overflow-y-auto">
                            <div id="modal-grid" class="grid grid-cols-4 gap-2">
                                <img src="/assets/profile/Beach_Chairs.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Chess_Pieces.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Dirt_Bike.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Friendly_Dog.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Guest_(Windows_Vista).png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Orange_Daisy.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Palm_Trees.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Rocket_Launch.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Rubber_Ducky.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Running_Horses.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Skateboarder.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Soccer_Ball.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/User_(Windows_Vista).png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Usertile11_(Windows_Vista).png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Usertile3_(Windows_Vista).png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Usertile8_(Windows_Vista).png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-col items-center gap-4 w-[200px]">
                        <div class="relative w-[170px] h-[170px]">
                            <img class="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
                            src="/assets/basic/status_frame_offline_large.png">
                            
                            <img id="modal-preview-avatar" class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[130px] h-[130px] object-cover"
                            src="/assets/basic/default.png">
                        </div>

                        <div class="flex flex-col gap-2 w-full mt-2 h-64">
                            <input type="file" id="file-input" accept="image/*" hidden>

                            <button id="browse-button" 
                            class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm 
                                px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 
                                active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">
                            BROWSE
                            </button>
                            
                            <button id="delete-button" 
                            class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm 
                                px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 
                                active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">
                            DELETE
                            </button>

                            <div class="mt-auto flex justify-center gap-2 pb-3" style="padding-top:101px">
                                <button id="validation-button" 
                                        class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm 
                                            px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 
                                            active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">
                                        OK
                                </button>
                                <button id="cancel-button" 
                                        class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm 
                                            px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 
                                            active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">
                                        CANCEL
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;

  // scripts/components/FriendList.ts
  var FriendList = class {
    // cass: 
    // init() interval est appele a chaque fois auon va sur la HomePage
    // ajouts car besoin de clean pour quil n'y ai pas plusieurs process 
    // qui s'accumulent quand on change de page et quon revient sur la homePage
    constructor() {
      this.notificationInterval = null;
      this.container = document.getElementById("contacts-list");
      this.userId = localStorage.getItem("userId");
    }
    init() {
      SocketService_default.getInstance().connectChat();
      SocketService_default.getInstance().connectGame();
      this.loadFriends();
      this.setupFriendRequests();
      this.setupNotifications();
      this.checkNotifications();
      this.listenToUpdates();
      this.setupBlockListener();
      this.registerSocketUser();
      if (this.notificationInterval) clearInterval(this.notificationInterval);
      this.notificationInterval = setInterval(() => this.checkNotifications(), 3e4);
    }
    // AJOUT
    destroy() {
      if (this.notificationInterval) {
        clearInterval(this.notificationInterval);
        this.notificationInterval = null;
      }
    }
    registerSocketUser() {
      const gameSocket = SocketService_default.getInstance().getGameSocket();
      const userId = this.userId;
      if (gameSocket && gameSocket.connected) {
        gameSocket.emit("registerGameSocket", userId);
      }
    }
    async loadFriends() {
      const contactsList = this.container;
      if (!this.userId || !contactsList) return;
      try {
        const response = await fetchWithAuth(`/api/user/${this.userId}/friends?t=${(/* @__PURE__ */ new Date()).getTime()}`);
        if (!response.ok) throw new Error("Failed to fetch friends");
        const responseData = await response.json();
        const friendList = responseData.data;
        contactsList.innerHTML = "";
        if (!friendList || friendList.length === 0) {
          contactsList.innerHTML = '<div class="text-xs text-gray-500 ml-2">No friend yet</div>';
          return;
        }
        friendList.forEach((friendship) => {
          const user = friendship.user;
          const friend = friendship.friend;
          if (!user || !friend) return;
          const currentUserId = Number(this.userId);
          const selectedFriend = user.id === currentUserId ? friend : user;
          let rawStatus = selectedFriend.status || "offline";
          const status = rawStatus.toLowerCase();
          const friendItem = document.createElement("div");
          friendItem.className = "friend-item flex items-center gap-3 p-2 rounded-sm hover:bg-gray-100 cursor-pointer transition";
          friendItem.dataset.id = selectedFriend.id;
          friendItem.dataset.friendshipId = friendship.id;
          friendItem.dataset.login = selectedFriend.username;
          friendItem.dataset.alias = selectedFriend.alias;
          friendItem.dataset.status = status;
          friendItem.dataset.bio = selectedFriend.bio || "Share a quick message";
          friendItem.dataset.avatar = selectedFriend.avatar_url || selectedFriend.avatar || "/assets/basic/default.png";
          friendItem.innerHTML = `
                    <div class="relative w-[50px] h-[50px] flex-shrink-0">
                        <img class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[15px] h-[15px] object-cover"
                             src="${getStatusDot(status)}" alt="status">
                    </div>
                    <div class="flex flex-col leading-tight">
                        <span class="font-semibold text-sm text-gray-800">${selectedFriend.alias}</span>
                    </div>
                `;
          contactsList.appendChild(friendItem);
          friendItem.addEventListener("click", (e) => {
            if (e.target.closest(".invite-btn")) return;
            const event = new CustomEvent("friendSelected", {
              detail: { friend: selectedFriend, friendshipId: friendship.id }
            });
            window.dispatchEvent(event);
          });
          const inviteBtn = friendItem.querySelector(".invite-btn");
          inviteBtn?.addEventListener("click", (e) => {
            e.stopPropagation();
            this.sendInviteDirectly(selectedFriend.id, selectedFriend.alias);
          });
        });
      } catch (error) {
        console.error("Error loading friends:", error);
        contactsList.innerHTML = '<div class="text-xs text-red-400 ml-2">Error loading contacts</div>';
      }
    }
    // AJOUT: Fonction pour envoyer une invitation depuis la liste
    sendInviteDirectly(friendId, friendName) {
      const gameSocket = SocketService_default.getInstance().getGameSocket();
      const myName = localStorage.getItem("username");
      if (!gameSocket || !gameSocket.connected) {
        alert("Game is disconnected, please refresh");
        SocketService_default.getInstance().connectGame();
        return;
      }
      console.debug(`Sending game invite to ${friendName} via GameSocket`);
      gameSocket.emit("sendGameInvite", {
        targetId: friendId,
        senderName: myName
      });
      alert(`Invitation sent to ${friendName}`);
    }
    listenToUpdates() {
      console.debug("listen to updates");
      const socketService = SocketService_default.getInstance();
      const chatSocket = socketService.getChatSocket();
      const gameSocket = socketService.getGameSocket();
      if (!chatSocket) return;
      chatSocket.on("friendStatusUpdate", (data) => {
        console.log(`[FriendList] Status update for ${data.username}: ${data.status}`);
        this.updateFriendUI(data.username, data.status);
      });
      chatSocket.on("userConnected", (data) => {
        const currentUsername = localStorage.getItem("username");
        if (data.username !== currentUsername) {
          this.updateFriendUI(data.username, data.status);
        }
      });
      chatSocket.on("receiveFriendRequestNotif", () => {
        console.log("New friend request received!");
        this.checkNotifications();
      });
      chatSocket.on("friendRequestAccepted", () => {
        console.log("Friend request accepted by other user!");
        this.loadFriends();
      });
      if (!gameSocket) {
        console.error("GameSocket cannot be found");
        return;
      }
      const attachGameListeners = () => {
        console.log(`[CLIENT] Ma GameSocket ID est ${gameSocket.id}`);
        gameSocket.emit("registerGameSocket");
        gameSocket.off("receiveGameInvite");
        gameSocket.on("receiveGameInvite", (data) => {
          console.log(`Game invite received from ${data.senderName} on ${gameSocket.id}`);
          this.showGameInviteNotification(data.senderId, data.senderName);
        });
      };
      if (gameSocket.connected) {
        attachGameListeners();
      } else {
        console.log("\u23F3 [CLIENT] GameSocket en cours de connexion...");
        gameSocket.once("connect", () => {
          attachGameListeners();
        });
      }
    }
    ///// pour la notification de l'invitation
    showGameInviteNotification(senderId, senderName) {
      console.log("showGameInvite");
      const notifIcon = document.getElementById("notification-icon");
      if (notifIcon) notifIcon.src = "/assets/basic/notification.png";
      const toast = document.createElement("div");
      toast.className = "fixed top-4 right-4 bg-white shadow-lg rounded-lg p-4 z-50 flex flex-col gap-2 border border-blue-200 animate-bounce-in";
      toast.innerHTML = `
            <div class="font-bold text-gray-800">\u{1F3AE} Game Invite</div> 
            <div class="text-sm text-gray-600">${senderName} wants to play Pong!</div>
            <div class="flex gap-2 mt-2">
                <button id="accept-invite" class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition">Accept</button>
                <button id="decline-invite" class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition">Decline</button>
            </div>
        `;
      document.body.appendChild(toast);
      toast.querySelector("#accept-invite")?.addEventListener("click", () => {
        const gameSocket = SocketService_default.getInstance().getGameSocket();
        if (!gameSocket || !gameSocket.connected) {
          alert("Error: connexion to server lost");
          toast.remove();
          return;
        }
        console.log("Accepting game invite from", senderName);
        gameSocket.once("matchFound", (data) => {
          console.log("\u2705 Match found from invitation:", data);
          sessionStorage.setItem("pendingMatch", JSON.stringify(data));
          window.history.pushState({ gameMode: "remote" }, "", "/game");
          const event = new PopStateEvent("popstate");
          window.dispatchEvent(event);
        });
        gameSocket.emit("acceptGameInvite", { senderId });
        toast.remove();
      });
      toast.querySelector("#decline-invite")?.addEventListener("click", () => {
        const gameSocket = SocketService_default.getInstance().getGameSocket()?.emit("declineGameInvite", { senderId });
        if (gameSocket && gameSocket.connected) {
          gameSocket.emit("declineGameInivite", { senderId });
        }
        toast.remove();
      });
      setTimeout(() => {
        if (document.body.contains(toast)) toast.remove();
      }, 1e4);
    }
    updateFriendUI(loginOrUsername, newStatus) {
      const friendItems = document.querySelectorAll(".friend-item");
      friendItems.forEach((item) => {
        const el = item;
        if (el.dataset.login === loginOrUsername || el.dataset.alias === loginOrUsername) {
          let status = (newStatus || "offline").toLowerCase();
          el.dataset.status = status;
          const statusImg = el.querySelector('img[alt="status"]');
          if (statusImg) {
            statusImg.src = getStatusDot(status);
          }
          console.log(`[FriendList] Updated UI for ${loginOrUsername} to ${status}`);
        }
      });
    }
    setupBlockListener() {
      window.addEventListener("friendBlocked", (e) => {
        const blockedUsername = e.detail?.username;
        if (!blockedUsername || !this.container) return;
        const friendToRemove = this.container.querySelector(`.friend-item[data-login="${blockedUsername}"]`);
        if (friendToRemove) {
          friendToRemove.style.opacity = "0";
          setTimeout(() => {
            friendToRemove.remove();
            if (this.container && this.container.children.length === 0) {
              this.container.innerHTML = '<div class="text-xs text-gray-500 ml-2">No friend yet</div>';
            }
          }, 300);
        }
      });
    }
    setupFriendRequests() {
      const addFriendButton = document.getElementById("add-friend-button");
      const addFriendDropdown = document.getElementById("add-friend-dropdown");
      const friendSearchInput = document.getElementById("friend-search-input");
      const sendFriendRequestButton = document.getElementById("send-friend-request");
      const cancelFriendRequestButton = document.getElementById("cancel-friend-request");
      const friendRequestMessage = document.getElementById("friend-request-message");
      if (addFriendButton && addFriendDropdown && friendSearchInput && sendFriendRequestButton && cancelFriendRequestButton) {
        addFriendButton.addEventListener("click", (e) => {
          e.stopPropagation();
          addFriendDropdown.classList.toggle("hidden");
          document.getElementById("status-dropdown")?.classList.add("hidden");
          if (!addFriendDropdown.classList.contains("hidden")) {
            friendSearchInput.focus();
          }
        });
        const sendFriendRequest = async () => {
          const searchValue = friendSearchInput.value.trim();
          if (!searchValue) {
            this.showFriendMessage("Please enter a username or email", "error", friendRequestMessage);
            return;
          }
          const userId = localStorage.getItem("userId");
          try {
            const response = await fetchWithAuth(`/api/user/${userId}/friendships`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ alias: searchValue })
            });
            const data = await response.json();
            if (response.ok) {
              this.showFriendMessage("Friend request sent!", "success", friendRequestMessage);
              const targetId = data.data.friend_id || data.data.friend?.id;
              if (targetId) {
                SocketService_default.getInstance().getChatSocket()?.emit("sendFriendRequestNotif", {
                  targetId
                });
              }
              friendSearchInput.value = "";
              setTimeout(() => {
                addFriendDropdown.classList.add("hidden");
                friendRequestMessage?.classList.add("hidden");
              }, 1500);
            } else {
              this.showFriendMessage(data.error.message || "Error sending request", "error", friendRequestMessage);
            }
          } catch (error) {
            console.error("Error:", error);
            this.showFriendMessage("Network error", "error", friendRequestMessage);
          }
        };
        sendFriendRequestButton.addEventListener("click", sendFriendRequest);
        friendSearchInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") sendFriendRequest();
        });
        cancelFriendRequestButton.addEventListener("click", () => {
          addFriendDropdown.classList.add("hidden");
          friendSearchInput.value = "";
          friendRequestMessage?.classList.add("hidden");
        });
        document.addEventListener("click", (e) => {
          const target = e.target;
          if (!addFriendDropdown.contains(target) && !addFriendButton.contains(target)) {
            addFriendDropdown.classList.add("hidden");
            friendRequestMessage?.classList.add("hidden");
          }
        });
      }
    }
    showFriendMessage(message, type, element) {
      if (element) {
        element.textContent = message;
        element.classList.remove("hidden", "text-green-600", "text-red-600");
        element.classList.add(type === "success" ? "text-green-600" : "text-red-600");
      }
    }
    setupNotifications() {
      const notifButton = document.getElementById("notification-button");
      const notifDropdown = document.getElementById("notification-dropdown");
      if (notifButton && notifDropdown) {
        notifButton.addEventListener("click", (e) => {
          e.stopPropagation();
          notifDropdown.classList.toggle("hidden");
          document.getElementById("add-friend-dropdown")?.classList.add("hidden");
          if (!notifDropdown.classList.contains("hidden")) {
            this.checkNotifications();
          }
        });
        document.addEventListener("click", (e) => {
          if (!notifDropdown.contains(e.target) && !notifButton.contains(e.target))
            notifDropdown.classList.add("hidden");
        });
      }
    }
    async checkNotifications() {
      const userId = localStorage.getItem("userId");
      const notifList = document.getElementById("notification-list");
      if (!userId || !notifList) return;
      try {
        const response = await fetchWithAuth(`/api/user/${userId}/friendships/pendings`);
        if (!response.ok) throw new Error("Failed to fetch pendings");
        const requests = await response.json();
        const pendingList = requests.data;
        const notifIcon = document.getElementById("notification-icon");
        if (pendingList.length > 0) {
          if (notifIcon) notifIcon.src = "/assets/basic/notification.png";
        } else {
          if (notifIcon) notifIcon.src = "/assets/basic/no_notification.png";
        }
        notifList.innerHTML = "";
        if (pendingList.length === 0) {
          notifList.innerHTML = '<div class="p-4 text-center text-xs text-gray-500">No new notifications</div>';
          return;
        }
        pendingList.forEach((req) => {
          const item = document.createElement("div");
          item.dataset.friendshipId = req.id.toString();
          item.className = "flex items-start p-4 border-b border-gray-200 gap-4 hover:bg-gray-50 transition";
          item.innerHTML = `
                    <div class="relative w-8 h-8 flex-shrink-0 mr-4">
                        <img src="/assets/basic/logo.png" 
                            class="w-full h-full object-cover rounded"
                            alt="avatar">
                    </div>
                    <div class="flex-1 min-w-0 pr-4">
                        <p class="text-sm text-gray-800">
                            <span class="font-semibold">${req.user?.alias}</span> wants to be your friend
                        </p>
                    </div>
                    <div class="flex gap-2 flex-shrink-0">
                        <button class="btn-accept w-7 h-7 flex items-center justify-center bg-white border border-gray-400 rounded hover:bg-green-100 hover:border-green-500 transition-colors" title="Accept">
                            <span class="text-green-600 font-bold text-sm">\u2713</span>
                        </button>
                        <button class="btn-reject w-7 h-7 flex items-center justify-center bg-white border border-gray-400 rounded hover:bg-red-100 hover:border-red-500 transition-colors" title="Decline">
                            <span class="text-red-600 font-bold text-sm">\u2715</span>
                        </button>
                        <button class="btn-block w-7 h-7 flex items-center justify-center bg-white border border-gray-400 rounded hover:bg-gray-200 hover:border-gray-600 transition-colors" title="Block">
                            <span class="text-gray-600 text-xs">\u{1F6AB}</span>
                        </button>
                    </div>
                `;
          const buttonAccept = item.querySelector(".btn-accept");
          const buttonReject = item.querySelector(".btn-reject");
          const buttonBlock = item.querySelector(".btn-block");
          if (req.user && req.user.id) {
            buttonAccept?.addEventListener("click", (e) => {
              e.stopPropagation();
              this.handleRequest(req.user.id, "validated", item);
            });
            buttonReject?.addEventListener("click", (e) => {
              e.stopPropagation();
              this.handleRequest(req.user.id, "rejected", item);
            });
            buttonBlock?.addEventListener("click", (e) => {
              e.stopPropagation();
              this.handleRequest(req.user.id, "blocked", item);
            });
          }
          notifList.appendChild(item);
        });
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    }
    async handleRequest(requesterId, action, itemDiv) {
      const userId = localStorage.getItem("userId");
      if (!itemDiv.dataset.friendshipId) return;
      try {
        const response = await fetchWithAuth(`/api/user/${userId}/friendships/${itemDiv.dataset.friendshipId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: action })
        });
        if (response.ok) {
          itemDiv.style.opacity = "0";
          setTimeout(() => {
            itemDiv.remove();
            if (action === "validated") {
              this.loadFriends();
              const socket = SocketService_default.getInstance().getChatSocket();
              if (socket) {
                socket.emit("acceptFriendRequest", {
                  targetId: requesterId
                });
              }
            }
            this.checkNotifications();
          }, 300);
        } else {
          console.error("Failed to update request");
        }
      } catch (error) {
        console.error("Network error", error);
      }
    }
  };

  // scripts/components/ChatUtils.ts
  var escapeHTML = (text) => {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  };
  var escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };
  var parseMessage = (message) => {
    let formattedMessage = escapeHTML(message);
    const sortedKeys = Object.keys(emoticons).sort((a, b) => b.length - a.length);
    sortedKeys.forEach((key) => {
      const imgUrl = emoticons[key];
      const escapedKey = escapeRegex(escapeHTML(key));
      const regex = new RegExp(escapedKey, "g");
      formattedMessage = formattedMessage.replace(
        regex,
        `<img src="${imgUrl}" alt="${key}" class="inline-block w-[20px] h-[20px] align-middle mx-0.5" />`
      );
    });
    formattedMessage = formattedMessage.replace(/\[b\](.*?)\[\/b\]/g, "<strong>$1</strong>").replace(/\[i\](.*?)\[\/i\]/g, "<em>$1</em>").replace(/\[u\](.*?)\[\/u\]/g, "<u>$1</u>").replace(/\[s\](.*?)\[\/s\]/g, "<s>$1</s>").replace(/\[color=(.*?)\](.*?)\[\/color\]/g, '<span style="color:$1">$2</span>');
    return formattedMessage;
  };

  // scripts/components/UserProfile.ts
  var UserProfile = class {
    constructor() {
      this.selectedImageSrc = "";
      this.bioText = document.getElementById("user-bio");
      this.bioWrapper = document.getElementById("bio-wrapper");
      this.statusFrame = document.getElementById("user-status");
      this.statusText = document.getElementById("current-status-text");
      this.userConnected = document.getElementById("user-name");
      this.userProfileImg = document.getElementById("user-profile");
      this.statusSelector = document.getElementById("status-selector");
      this.statusDropdown = document.getElementById("status-dropdown");
      this.charCountElement = document.querySelector("#bio-wrapper .char-count");
      this.pictureModal = document.getElementById("picture-modal");
      this.modalPreviewAvatar = document.getElementById("modal-preview-avatar");
    }
    init() {
      this.loadUserData();
      this.setupBioEdit();
      this.setupStatusSelector();
      this.loadSavedStatus();
      this.setupAvatarEdit();
    }
    // CHARGEMENT DE LA BIO
    async loadUserData() {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        console.warn("No user ID found");
        return;
      }
      try {
        const response = await fetchWithAuth(`/api/user/${userId}`);
        if (!response.ok) throw new Error("Failed to fetch user profile");
        const userData = await response.json();
        if (this.userConnected && userData.alias) {
          this.userConnected.textContent = userData.alias;
          localStorage.setItem("username", userData.alias);
        }
        if (this.bioText && userData.bio) {
          this.bioText.dataset.raw = userData.bio;
          this.bioText.innerHTML = parseMessage(userData.bio);
        }
        if (this.userProfileImg) {
          this.userProfileImg.src = userData.avatar_url || userData.avatar;
        }
        if (userData.status) {
          const normalizedStatus = userData.status.toLowerCase();
          this.updateStatusDisplay(normalizedStatus);
          localStorage.setItem("userStatus", normalizedStatus);
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      }
    }
    // LOGIQUE DE LA BIO et de la PHOTO
    setupBioEdit() {
      if (!this.bioText || !this.bioWrapper) return;
      const updateCharCount = (currentLength) => {
        if (this.charCountElement) {
          this.charCountElement.innerText = `${currentLength}/70`;
          if (currentLength > 70) {
            this.charCountElement.classList.remove("text-gray-500");
            this.charCountElement.classList.add("text-red-500");
          } else {
            this.charCountElement.classList.remove("text-red-500");
            this.charCountElement.classList.add("text-gray-500");
          }
        }
      };
      this.bioText.addEventListener("click", () => {
        const input = document.createElement("input");
        const currentText = this.bioText.dataset.raw || "";
        input.type = "text";
        input.value = currentText;
        input.className = "text-sm text-gray-700 italic border border-gray-300 rounded px-2 py-1 w-full bg-white focus:outline-none focus:ring focus:ring-blue-300";
        this.bioWrapper.replaceChild(input, this.bioText);
        if (this.charCountElement) {
          this.charCountElement.classList.remove("hidden");
          updateCharCount(currentText.length);
        }
        input.focus();
        input.addEventListener("input", () => {
          const currentLength = input.value.length;
          updateCharCount(currentLength);
        });
        const finalize = async (text) => {
          if (!this.bioWrapper || !this.bioText) return;
          if (this.charCountElement) {
            this.charCountElement.classList.add("hidden");
          }
          const newBio = text.trim() || "Share a quick message";
          const userId = localStorage.getItem("userId");
          const trimmedBio = newBio.trim();
          if (trimmedBio.length > 70) {
            console.error("Error: Cannot exceed 70 characters.");
            alert(`Your message cannot exceed 70 characters. Stop talking!`);
            this.bioWrapper.replaceChild(this.bioText, input);
            this.bioText.innerHTML = parseMessage(this.bioText.dataset.raw || "Share a quick message");
            return false;
          }
          try {
            const response = await fetchWithAuth(`api/user/${userId}/bio`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ bio: trimmedBio })
            });
            if (response.ok) {
              this.bioText.dataset.raw = trimmedBio;
              this.bioText.innerHTML = parseMessage(trimmedBio) || "Share a quick message";
              this.bioWrapper.replaceChild(this.bioText, input);
              console.log("Message updated");
              const socket = SocketService_default.getInstance().socket;
              socket.emit("notifyProfileUpdate", {
                userId: Number(userId),
                bio: trimmedBio,
                username: localStorage.getItem("username")
              });
              return true;
            } else {
              console.error("Error while updating your message");
              this.bioWrapper.replaceChild(this.bioText, input);
              return false;
            }
          } catch (error) {
            console.error("Network error:", error);
            this.bioWrapper.replaceChild(this.bioText, input);
            return false;
          }
        };
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") finalize(input.value);
        });
        input.addEventListener("blur", () => {
          if (input.value.trim().length <= 70) {
            finalize(input.value);
          } else {
            alert(`Your message cannot exceed 70 characters. Stop talking!`);
            if (this.charCountElement) {
              this.charCountElement.classList.add("hidden");
            }
            this.bioWrapper.replaceChild(this.bioText, input);
          }
        });
      });
    }
    // LOGIQUE DES STATUS DYNAMIQUES
    setupStatusSelector() {
      if (this.statusSelector && this.statusDropdown) {
        this.statusSelector.addEventListener("click", (e) => {
          e.stopPropagation();
          this.statusDropdown.classList.toggle("hidden");
          document.getElementById("emoticon-dropdown")?.classList.add("hidden");
          document.getElementById("add-friend-dropdown")?.classList.add("hidden");
        });
        const statusOptions = document.querySelectorAll(".status-option");
        statusOptions.forEach((option) => {
          option.addEventListener("click", async (e) => {
            e.stopPropagation();
            const selectedStatus = option.dataset.status;
            if (selectedStatus) {
              this.updateStatusDisplay(selectedStatus);
              localStorage.setItem("userStatus", selectedStatus);
              const userId = localStorage.getItem("userId");
              try {
                await fetchWithAuth(`/api/user/${userId}/status`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: selectedStatus })
                });
                const socket = SocketService_default.getInstance().socket;
                const username = localStorage.getItem("username");
                if (socket && username) {
                  socket.emit("notifyStatusChange", {
                    userId: Number(userId),
                    status: selectedStatus,
                    username
                  });
                }
                this.updateStatusDisplay(selectedStatus);
              } catch (error) {
                console.error("Error updating status:", error);
              }
            }
            this.statusDropdown.classList.add("hidden");
          });
        });
        document.addEventListener("click", (e) => {
          const target = e.target;
          if (this.statusDropdown && !this.statusDropdown.contains(target) && !this.statusSelector.contains(target)) {
            this.statusDropdown.classList.add("hidden");
          }
        });
      }
    }
    loadSavedStatus() {
      const rawStatus = localStorage.getItem("userStatus") || "available";
      const savedStatus = rawStatus.toLowerCase();
      this.updateStatusDisplay(savedStatus);
      window.addEventListener("storage", (e) => {
        if (e.key === "userStatus" && e.newValue) {
          this.updateStatusDisplay(e.newValue.toLowerCase());
        }
      });
    }
    updateStatusDisplay(status) {
      if (this.statusFrame && statusImages[status]) {
        console.log("Status:", this.statusFrame);
        this.statusFrame.src = statusImages[status];
      }
      if (this.statusText && statusLabels[status]) {
        this.statusText.textContent = statusLabels[status];
      }
      const statusOptions = document.querySelectorAll(".status-option");
      statusOptions.forEach((option) => {
        const opt = option;
        const optionStatus = opt.dataset.status;
        if (optionStatus === status) opt.classList.add("bg-blue-50");
        else opt.classList.remove("bg-blue-50");
      });
    }
    setupAvatarEdit() {
      if (!this.userProfileImg || !this.pictureModal) return;
      this.userProfileImg.classList.add("cursor-pointer", "hover:opacity-80", "transition");
      this.userProfileImg.addEventListener("click", () => {
        this.pictureModal?.classList.remove("hidden");
        this.pictureModal?.classList.add("flex");
        this.selectedImageSrc = this.userProfileImg?.src || "";
        if (this.modalPreviewAvatar) this.modalPreviewAvatar.src = this.selectedImageSrc;
      });
      const closeModal = () => {
        this.pictureModal?.classList.add("hidden");
        this.pictureModal?.classList.remove("flex");
      };
      document.getElementById("close-modal")?.addEventListener("click", closeModal);
      document.getElementById("cancel-button")?.addEventListener("click", closeModal);
      const gridContainer = document.getElementById("modal-grid");
      if (gridContainer) {
        const gridImages = gridContainer.querySelectorAll("img");
        gridImages.forEach((img) => {
          img.addEventListener("click", () => {
            this.selectedImageSrc = img.src;
            if (this.modalPreviewAvatar) this.modalPreviewAvatar.src = this.selectedImageSrc;
            gridImages.forEach((i) => i.classList.remove("border-[#0078D7]"));
            img.classList.add("border-[#0078D7]");
          });
        });
      }
      const fileInput = document.getElementById("file-input");
      document.getElementById("browse-button")?.addEventListener("click", () => fileInput?.click());
      fileInput?.addEventListener("change", (event) => {
        const file = event.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              this.selectedImageSrc = e.target.result;
              if (this.modalPreviewAvatar) this.modalPreviewAvatar.src = this.selectedImageSrc;
            }
          };
          reader.readAsDataURL(file);
        }
      });
      document.getElementById("delete-button")?.addEventListener("click", () => {
        const defaultAvatar = "/assets/basic/default.png";
        this.selectedImageSrc = defaultAvatar;
        if (this.modalPreviewAvatar) this.modalPreviewAvatar.src = defaultAvatar;
      });
      document.getElementById("validation-button")?.addEventListener("click", async () => {
        const userId = localStorage.getItem("userId");
        if (!userId) return;
        try {
          const response = await fetchWithAuth(`api/user/${userId}/avatar`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ avatar: this.selectedImageSrc })
          });
          const result = await response.json();
          if (response.ok) {
            const cleanAvatarUrl = result.data.avatar;
            if (this.userProfileImg) this.userProfileImg.src = cleanAvatarUrl;
            const socket = SocketService_default.getInstance().getChatSocket();
            const username = localStorage.getItem("username");
            if (socket) {
              socket.emit("notifyProfileUpdate", {
                userId: Number(userId),
                avatar: cleanAvatarUrl,
                username
              });
            }
            closeModal();
          } else {
            alert("Error while saving avatar");
          }
        } catch (error) {
          console.error("Network error:", error);
        }
      });
    }
  };

  // scripts/components/Chat.ts
  var Chat = class {
    constructor() {
      this.chatSocket = null;
      this.gameSocket = null;
      this.currentChannel = "general";
      this.currentFriendshipId = null;
      this.currentFriendId = null;
      this.messagesContainer = document.getElementById("chat-messages");
      this.messageInput = document.getElementById("chat-input");
      this.wizzContainer = document.getElementById("wizz-container");
    }
    init() {
      const socketService = SocketService_default.getInstance();
      socketService.connectChat();
      socketService.connectGame();
      this.chatSocket = socketService.getChatSocket();
      this.gameSocket = socketService.getGameSocket();
      if (!this.gameSocket)
        console.log("gamesocket n'existe pas");
      if (!this.chatSocket) {
        console.error("Chat: Impossible to retrieve chat socket (not connected).");
        return;
      }
      this.setupSocketEvents();
      this.setupInputListeners();
      this.setupWizz();
      this.setupTools();
    }
    joinChannel(channelKey, friendshipId, friendId) {
      this.currentChannel = channelKey;
      this.currentFriendshipId = friendshipId || null;
      this.currentFriendId = friendId || null;
      console.log(`currentChannelKey = ${this.currentChannel}, currentFriendshipId = ${this.currentFriendshipId}, currentFriendId = ${this.currentFriendId}`);
      if (this.chatSocket)
        this.chatSocket.emit("joinChannel", channelKey);
      if (this.messagesContainer) {
        this.messagesContainer.innerHTML = "";
      }
    }
    // ---------------------------------------------------
    // ----      MISE EN ÉCOUTE DES SOCKETS           ----
    // ---------------------------------------------------
    setupSocketEvents() {
      this.chatSocket.on("connect", () => {
        this.addMessage("You can now chat with your friend!", "System");
      });
      this.chatSocket.on("chatMessage", (data) => {
        this.addMessage(data.msg_content, data.sender_alias);
      });
      this.chatSocket.on("msg_history", (data) => {
        if (this.messagesContainer) {
          this.messagesContainer.innerHTML = "";
          if (data.msg_history && data.msg_history.length > 0) {
            data.msg_history.forEach((msg) => {
              this.addMessage(msg.msg_content, msg.sender_alias);
            });
          } else {
            console.log("No former message in this channel");
          }
        }
      });
      this.chatSocket.on("systemMessage", (data) => {
        this.addSystemMessage(data.content);
      });
      this.chatSocket.on("receivedWizz", (data) => {
        if (data.channel_key && data.channel_key !== this.currentChannel) return;
        const currentUser = localStorage.getItem("username");
        this.addMessage(`[b]${data.author} sent a nudge[/b]`, "System");
        if (data.author !== currentUser) {
          this.shakeElement(this.wizzContainer, 3e3);
        }
      });
      this.chatSocket.on("receivedAnimation", (data) => {
        const { animationKey, author } = data;
        const imgUrl = animations[animationKey];
        if (imgUrl) {
          const animationHTML = `
                    <div>
                        <strong>${author} said:</strong><br>
                        <img src="${imgUrl}" alt="${animationKey}">
                    </div>
                `;
          this.addCustomContent(animationHTML);
        } else {
          this.addMessage(`Animation inconnue (${animationKey}) re\xE7ue de ${author}.`, "Syst\xE8me");
        }
      });
      this.chatSocket.on("disconnected", () => {
        this.addMessage("Disconnected from chat server!", "System");
      });
    }
    // ---------------------------------------------------
    // ----           GESTION DE L'INPUT              ----
    // ---------------------------------------------------
    setupInputListeners() {
      if (!this.messageInput) return;
      this.messageInput.addEventListener("keyup", (event) => {
        if (event.key == "Enter" && this.messageInput?.value.trim() != "") {
          const msg_content = this.messageInput.value;
          const sender_alias = localStorage.getItem("username");
          const sender_id = Number.parseInt(localStorage.getItem("userId") || "0");
          this.chatSocket.emit("chatMessage", {
            sender_id,
            sender_alias,
            channel_key: this.currentChannel,
            msg_content
          });
          this.messageInput.value = "";
        }
      });
    }
    // ---------------------------------------------------
    // ----            LOGIQUE DU WIZZ                ----
    // ---------------------------------------------------
    setupWizz() {
      const wizzButton = document.getElementById("send-wizz");
      if (wizzButton) {
        wizzButton.addEventListener("click", () => {
          const currentUsername = localStorage.getItem("username");
          this.chatSocket.emit("sendWizz", { author: currentUsername, channel_key: this.currentChannel });
          this.shakeElement(this.wizzContainer, 500);
        });
      }
    }
    // envoi du wizz pour le remote -> il ne s'envoit qu'a l'opposant
    emitWizzOnly() {
      if (!this.chatSocket) return;
      const currentUsername = localStorage.getItem("username");
      this.chatSocket.emit("sendWizz", { author: currentUsername, channel_key: this.currentChannel });
    }
    // délcencher la secousse 
    shakeElement(element, duration = 500) {
      if (!element) return;
      if (this.shakeTimeout) clearTimeout(this.shakeTimeout);
      element.classList.remove("wizz-shake");
      void element.offsetWidth;
      element.classList.add("wizz-shake");
      this.shakeTimeout = window.setTimeout(() => {
        element.classList.remove("wizz-shake");
        this.shakeTimeout = void 0;
      }, duration);
      try {
        const wizzSound = new Audio("/assets/chat/wizz_sound.mp3");
        wizzSound.play().catch((e) => console.log("Could not play wizz sound:", e.message));
      } catch (e) {
        console.log("Audio API error:", e.message);
      }
    }
    getWizzContainer() {
      return this.wizzContainer;
    }
    // ---------------------------------------------------
    // ----         AFFICHAGE DES MESSAGES            ----
    // ---------------------------------------------------
    sendSystemNotification(message) {
      if (this.chatSocket) {
        this.chatSocket.emit("sendSystemMessage", {
          channel_key: this.currentChannel,
          content: message
        });
      } else {
        this.addSystemMessage(message);
      }
    }
    addSystemMessage(message) {
      this.addMessage(`[b]${message}[/b]`, "System");
    }
    //faustine
    addMessage(message, author) {
      if (!this.messagesContainer) return;
      const msgElement = document.createElement("div");
      msgElement.className = "mb-2 p-2 rounded bg-opacity-20 hover:bg-opacity-30 transition";
      const inviteRegex = /\[GAME_INVITE\|(\d+)\]/;
      const match = message.match(inviteRegex);
      if (match) {
        const friendshipId = match[1];
        const isMe = author === localStorage.getItem("username");
        msgElement.classList.add(isMe ? "bg-blue-100" : "bg-green-100");
        msgElement.innerHTML = `
                <div class="flex flex-col gap-2">
                    <strong>${author}</strong> veut jouer \xE0 Pong ! \u{1F3D3}<br>
                    <button 
                        class="bg-blue-500 hover:bg-blue-600 text-black font-bold py-1 px-3 rounded shadow-md text-xs transition-transform transform active:scale-95"
                        onclick="
                            sessionStorage.setItem('privateGameId', '${friendshipId}'); 
                            window.history.pushState({ gameMode: 'remote' }, '', '/game');
                            window.dispatchEvent(new PopStateEvent('popstate'));
                        "
                    >
                        ${isMe ? "Join my waitroom" : "Accept the match"}
                    </button>
                </div>
            `;
      } else {
        msgElement.classList.add("bg-white");
        const contentEmoticons = parseMessage(message);
        msgElement.innerHTML = `<strong>${author} said:</strong><br> ${contentEmoticons}`;
      }
      this.messagesContainer.appendChild(msgElement);
      this.scrollToBottom();
    }
    // private addMessage(message: string, author: string) {
    //     if (!this.messagesContainer) return;
    //     const msgElement = document.createElement('p');
    //     msgElement.className = "mb-1";
    //     // on securise le texte et on parse les emoticones
    //     const contentEmoticons = parseMessage(message);
    //     msgElement.innerHTML = `<strong>${author} said:</strong><br> ${contentEmoticons}`;
    //     this.messagesContainer.appendChild(msgElement);
    //     // rajouter un scroll automatique vers le bas
    //     this.scrollToBottom();
    // }
    addCustomContent(htmlContent) {
      if (!this.messagesContainer) return;
      const msgElement = document.createElement("div");
      msgElement.className = "mb-1";
      msgElement.innerHTML = htmlContent;
      this.messagesContainer.appendChild(msgElement);
      this.scrollToBottom();
    }
    scrollToBottom() {
      if (this.messagesContainer) {
        setTimeout(() => {
          if (this.messagesContainer)
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 50);
      }
    }
    // ---------------------------------------------------
    // ----      OUTILS (EMOTICONES, FONTS...)        ----
    // ---------------------------------------------------
    setupTools() {
      const emoticonButton = document.getElementById("select-emoticon");
      const emoticonDropdown = document.getElementById("emoticon-dropdown");
      const emoticonGrid = document.getElementById("emoticon-grid");
      if (emoticonButton && emoticonDropdown && emoticonGrid) {
        emoticonGrid.innerHTML = "";
        const emoticonsByUrl = /* @__PURE__ */ new Map();
        const sortedKeys = Object.keys(emoticons).sort((a, b) => b.length - a.length);
        sortedKeys.forEach((key) => {
          const imgUrl = emoticons[key];
          if (!emoticonsByUrl.has(imgUrl)) emoticonsByUrl.set(imgUrl, []);
          emoticonsByUrl.get(imgUrl).push(key);
        });
        emoticonsByUrl.forEach((keys, imgUrl) => {
          const primaryKey = keys[0];
          const tooltipTitle = keys.join(" | ");
          const emoticonItem = document.createElement("div");
          emoticonItem.className = "cursor-pointer w-7 h-7 flex justify-center items-center hover:bg-blue-100 rounded-sm transition-colors duration-100";
          emoticonItem.innerHTML = `<img src="${imgUrl}" alt="${primaryKey}" title="${tooltipTitle}" class="w-[20px] h-[20px]">`;
          emoticonItem.addEventListener("click", (event) => {
            event.stopPropagation();
            this.insertText(primaryKey + " ");
            emoticonDropdown.classList.add("hidden");
          });
          emoticonGrid.appendChild(emoticonItem);
        });
        emoticonButton.addEventListener("click", (e) => {
          e.stopPropagation();
          emoticonDropdown.classList.toggle("hidden");
          this.closeOtherMenus("emoticon");
        });
        document.addEventListener("click", (e) => {
          if (!emoticonDropdown.contains(e.target) && !emoticonButton.contains(e.target)) {
            emoticonDropdown.classList.add("hidden");
          }
        });
      }
      const animationButton = document.getElementById("select-animation");
      const animationDropdown = document.getElementById("animation-dropdown");
      const animationGrid = document.getElementById("animation-grid");
      if (animationButton && animationDropdown && animationGrid) {
        animationGrid.innerHTML = "";
        Object.keys(icons).forEach((key) => {
          const imgUrl = icons[key];
          const animationItem = document.createElement("div");
          animationItem.className = "cursor-pointer-w10 h-10 flex justify-center items-center hover:bg-blue-100 rounded-sm transition-colors duration-100";
          animationItem.innerHTML = `<img src="${imgUrl}" alt="${key}" title="${key}" class="w-[32px] h-[32px] object-contain">`;
          animationItem.addEventListener("click", (event) => {
            event.stopPropagation();
            const currentUsername = localStorage.getItem("username");
            this.chatSocket.emit("sendAnimation", {
              animationKey: key,
              author: currentUsername,
              channel_key: this.currentChannel
            });
            animationDropdown.classList.add("hidden");
          });
          animationGrid.appendChild(animationItem);
        });
        animationButton.addEventListener("click", (e) => {
          e.stopPropagation();
          animationDropdown.classList.toggle("hidden");
          this.closeOtherMenus("animation");
        });
        document.addEventListener("click", (e) => {
          if (!animationDropdown.contains(e.target) && !animationButton.contains(e.target)) {
            animationDropdown.classList.add("hidden");
          }
        });
      }
      const fontButton = document.getElementById("change-font");
      const fontDropdown = document.getElementById("font-dropdown");
      const fontGrid = document.getElementById("font-grid");
      if (fontButton && fontDropdown && fontGrid) {
        fontGrid.innerHTML = "";
        const colors = ["#000000", "#F42F25", "#F934FB", "#F76D2A", "#217F1C", "#3019F7", "#F9CA37", "#42FB37"];
        colors.forEach((color) => {
          const colorButton = document.createElement("div");
          colorButton.className = "w-6 h-6 cursor-pointer border border-gray-300 hover:border-blue-500 hover:shadow-sm rounded-[2px]";
          colorButton.style.backgroundColor = color;
          colorButton.addEventListener("click", (e) => {
            e.stopPropagation();
            this.wrapSelection(color, true);
            fontDropdown.classList.add("hidden");
          });
          fontGrid.appendChild(colorButton);
        });
        const styles = [
          { tag: "b", icon: "font_bold.png", title: "Bold" },
          { tag: "i", icon: "font_italic.png", title: "Italic" },
          { tag: "u", icon: "font_underline.png", title: "Underline" },
          { tag: "s", icon: "font_strikethrough.png", title: "Strikethrough" }
        ];
        styles.forEach((style) => {
          const styleButton = document.createElement("div");
          styleButton.className = "w-6 h-6 flex justify-center items-center cursor-pointer border border-transparent hover:bg-blue-50 hover:border-blue-200 rounded-[2px] transition-all";
          styleButton.innerHTML = `<img src="/assets/chat/${style.icon}" alt="${style.title}" class="w-[14px] h-[14px]">`;
          styleButton.addEventListener("click", (e) => {
            e.stopPropagation();
            this.wrapSelection(style.tag, false);
            fontDropdown.classList.add("hidden");
          });
          fontGrid.appendChild(styleButton);
        });
        fontButton.addEventListener("click", (e) => {
          e.stopPropagation();
          fontDropdown.classList.toggle("hidden");
          this.closeOtherMenus("font");
        });
        document.addEventListener("click", (e) => {
          if (!fontDropdown.contains(e.target) && !fontButton.contains(e.target)) {
            fontDropdown.classList.add("hidden");
          }
        });
      }
      const bgButton = document.getElementById("select-background");
      const bgDropdown = document.getElementById("background-dropdown");
      const chatFrame = document.getElementById("chat-frame");
      const bgOptions = document.querySelectorAll(".bg-option");
      if (bgButton && bgDropdown && chatFrame) {
        bgButton.addEventListener("click", (e) => {
          e.stopPropagation();
          bgDropdown.classList.toggle("hidden");
          this.closeOtherMenus("background");
        });
        bgOptions.forEach((option) => {
          option.addEventListener("click", () => {
            const bgImage = option.getAttribute("data-bg");
            if (bgImage === "none") {
              chatFrame.style.backgroundImage = "";
              chatFrame.classList.add("bg-[#3DB6EC]");
            } else if (bgImage) {
              chatFrame.classList.remove("bg-[#BC787B]");
              chatFrame.style.backgroundImage = bgImage;
              chatFrame.style.backgroundSize = "cover";
              chatFrame.style.backgroundPosition = "center";
            }
            bgDropdown.classList.add("hidden");
          });
        });
        document.addEventListener("click", (e) => {
          if (!bgDropdown.contains(e.target) && !bgButton.contains(e.target)) {
            bgDropdown.classList.add("hidden");
          }
        });
      }
      const chatOptionsButton = document.getElementById("chat-options-button");
      const chatOptionsDropdown = document.getElementById("chat-options-dropdown");
      if (chatOptionsButton && chatOptionsDropdown) {
        chatOptionsButton.addEventListener("click", (e) => {
          e.stopPropagation();
          chatOptionsDropdown.classList.toggle("hidden");
          this.closeOtherMenus("options");
        });
        document.addEventListener("click", (e) => {
          if (!chatOptionsDropdown.contains(e.target) && !chatOptionsButton.contains(e.target)) {
            chatOptionsDropdown.classList.add("hidden");
          }
        });
        document.getElementById("button-invite-game")?.addEventListener("click", (e) => {
          e.stopPropagation();
          if (this.currentFriendId && this.currentFriendshipId) {
            const myName = localStorage.getItem("username");
            const sender_id = Number.parseInt(localStorage.getItem("userId") || "0");
            if (this.chatSocket && this.chatSocket.connected) {
              console.log("chatSocket connected");
              const inviteCode = `[GAME_INVITE|${this.currentFriendshipId}]`;
              this.chatSocket.emit("chatMessage", {
                sender_id,
                sender_alias: myName,
                channel_key: this.currentChannel,
                msg_content: inviteCode
                // ici au lieu du message on "envois" le code d'invitation
              });
            } else {
              console.log("chatSocket disconnected");
            }
          } else {
            console.error("Game socket not connected", this.gameSocket);
            this.addSystemMessage("Error: Game server not reachable.");
          }
          chatOptionsDropdown.classList.add("hidden");
        });
        document.getElementById("button-block-user")?.addEventListener("click", async (e) => {
          e.stopPropagation();
          console.log("friendhsop id:", this.currentFriendshipId);
          if (!this.currentFriendshipId) {
            console.error("Cannot block: no friendship id associated to this conv");
            chatOptionsDropdown.classList.add("hidden");
            return;
          }
          const currentChatUser = document.getElementById("chat-header-username")?.textContent;
          if (currentChatUser && confirm(`Are you sure you want to block ${currentChatUser} ?`)) {
            try {
              const userId = localStorage.getItem("userId");
              const response = await fetchWithAuth(`api/user/${userId}/friendships/${this.currentFriendshipId}`, {
                method: "PATCH",
                body: JSON.stringify({ status: "blocked" })
              });
              if (response.ok) {
                console.log(`User ${currentChatUser} blocked successfully`);
                const event = new CustomEvent("friendBlocked", {
                  detail: { username: currentChatUser }
                });
                window.dispatchEvent(event);
                if (this.messagesContainer) {
                  this.messagesContainer.innerHTML = "";
                  const infoMsg = document.createElement("div");
                  infoMsg.className = "text-center text-gray-400 text-sm mt-10";
                  infoMsg.innerText = "Conversation deleted (User blocked).";
                  this.messagesContainer.appendChild(infoMsg);
                }
                if (this.messageInput) {
                  this.messageInput.value = "";
                  this.messageInput.disabled = true;
                  this.messageInput.placeholder = "You blocked this user.";
                }
                this.currentChannel = "";
                this.currentFriendshipId = null;
              } else {
                console.error("Network error while blocking");
                alert("Error while blocking");
              }
            } catch (error) {
              console.error("Networik error:", error);
            }
          }
          chatOptionsDropdown.classList.add("hidden");
        });
      }
    }
    closeOtherMenus(current) {
      if (current !== "emoticon") document.getElementById("emoticon-dropdown")?.classList.add("hidden");
      if (current !== "animation") document.getElementById("animation-dropdown")?.classList.add("hidden");
      if (current !== "font") document.getElementById("font-dropdown")?.classList.add("hidden");
      if (current !== "background") document.getElementById("background-dropdown")?.classList.add("hidden");
      if (current !== "options") document.getElementById("chat-options-dropdown")?.classList.add("hidden");
      document.getElementById("add-friend-dropdown")?.classList.add("hidden");
      document.getElementById("status-dropdown")?.classList.add("hidden");
    }
    // insertion de la clé de l'emoticon a la position actuelle du cursor dans l'unpout
    insertText(text) {
      if (!this.messageInput) return;
      const start = this.messageInput.selectionStart ?? this.messageInput.value.length;
      const end = this.messageInput.selectionEnd ?? this.messageInput.value.length;
      const newValue = this.messageInput.value.substring(0, start) + text + this.messageInput.value.substring(end);
      this.messageInput.value = newValue;
      const newPos = start + text.length;
      this.messageInput.setSelectionRange(newPos, newPos);
      this.messageInput.focus();
    }
    // insertion des balises autour du texte selectionne
    wrapSelection(tagOrColor, isColor) {
      if (!this.messageInput) return;
      const start = this.messageInput.selectionStart ?? this.messageInput.value.length;
      const end = this.messageInput.selectionEnd ?? this.messageInput.value.length;
      const selectedText = this.messageInput.value.substring(start, end);
      let replacement;
      let cursorOffset;
      if (isColor) {
        const openTag = `[color=${tagOrColor}]`;
        replacement = `${openTag}${selectedText}[/color]`;
        cursorOffset = openTag.length;
      } else {
        const openTag = `[${tagOrColor}]`;
        replacement = `${openTag}${selectedText}[/${tagOrColor}]`;
        cursorOffset = openTag.length;
      }
      this.messageInput.value = this.messageInput.value.substring(0, start) + replacement + this.messageInput.value.substring(end);
      const newCursorPos = selectedText.length > 0 ? start + replacement.length : start + cursorOffset;
      this.messageInput.setSelectionRange(newCursorPos, newCursorPos);
      this.messageInput.focus();
    }
    destroy() {
      if (this.socket) {
        this.socket.off("connect");
        this.socket.off("chatMessage");
        this.socket.off("msg_history");
        this.socket.off("receivedWizz");
        this.socket.off("receivedAnimation");
        this.socket.off("systemMessage");
        this.socket.off("disconnected");
      }
    }
  };

  // scripts/components/FriendProfileModal.ts
  var FriendProfileModal = class {
    constructor() {
      this.modal = document.getElementById("friend-profile-modal");
      this.closeButton = document.getElementById("close-friend-modal");
      this.closeButtonBottom = document.getElementById("close-friend-modal-button");
      this.avatar = document.getElementById("friend-modal-avatar");
      this.status = document.getElementById("friend-modal-status");
      this.username = document.getElementById("friend-modal-username");
      this.bio = document.getElementById("friend-modal-bio");
      this.stats = {
        games: document.getElementById("friend-stat-games"),
        wins: document.getElementById("friend-stat-wins"),
        losses: document.getElementById("friend-stat-losses"),
        streak: document.getElementById("friend-stat-streak"),
        avgScore: document.getElementById("friend-stat-average-score"),
        winRate: document.getElementById("friend-stat-win-rate"),
        opponent: document.getElementById("friend-stat-opponent"),
        favGame: document.getElementById("friend-stat-fav-game")
      };
      this.initListeners();
    }
    initListeners() {
      const close = () => this.modal?.classList.add("hidden");
      this.closeButton?.addEventListener("click", close);
      this.closeButtonBottom?.addEventListener("click", close);
      this.modal?.addEventListener("click", (e) => {
        if (e.target === this.modal) close();
      });
    }
    // on appelle cette methode dans homepage
    async open(friendId) {
      if (!this.modal || !friendId) return;
      try {
        if (this.username) this.username.innerText = "Loading...";
        const [userRes, statsRes] = await Promise.all([
          fetchWithAuth(`api/user/${friendId}`),
          fetchWithAuth(`api/game/users/${friendId}/stats`)
        ]);
        if (userRes.ok) {
          const user = await userRes.json();
          let stats = null;
          if (statsRes.ok) {
            const statsJson = await statsRes.json();
            stats = statsJson.data || statsJson;
          }
          this.updateUI(user, stats);
          this.modal.classList.remove("hidden");
          this.modal.classList.add("flex");
        }
      } catch (error) {
        console.error("Error modal:", error);
      }
    }
    updateUI(user, stats) {
      if (this.avatar) this.avatar.src = user.avatar_url || user.avatar || "/assets/basic/default.png";
      if (this.status && user.status) this.status.src = statusImages[user.status.toLowerCase()] || statusImages["invisible"];
      if (this.username) this.username.innerText = user.alias;
      if (this.bio) this.bio.innerHTML = user.bio ? parseMessage(user.bio) : "No bio.";
      if (stats) {
        const gamesPlayed = stats.total_games ?? stats.totalGames ?? 0;
        const wins = stats.wins || 0;
        if (this.stats.games) this.stats.games.innerText = gamesPlayed.toString();
        if (this.stats.wins) this.stats.wins.innerText = wins.toString();
        if (this.stats.losses) this.stats.losses.innerText = (stats.losses || 0).toString();
        if (this.stats.streak) this.stats.streak.innerText = (stats.streak ?? 0).toString();
        if (this.stats.avgScore) this.stats.avgScore.innerText = (stats.average_score ?? 0).toString();
        if (this.stats.winRate) {
          let rate = 0;
          if (gamesPlayed > 0) {
            rate = Math.round(wins / gamesPlayed * 100);
          }
          this.stats.winRate.innerText = `${rate}%`;
        }
        if (this.stats.opponent) this.stats.opponent.innerText = stats.biggest_opponent || "-";
        if (this.stats.favGame) this.stats.favGame.innerText = stats.favorite_game || "Local";
      } else {
        Object.values(this.stats).forEach((el) => {
          if (el) el.innerText = el === this.stats.opponent || el === this.stats.favGame ? "-" : "0";
        });
        if (this.stats.winRate) this.stats.winRate.innerText = "0%";
      }
    }
  };

  // scripts/pages/HomePage.ts
  var friendListInstance = null;
  var chatInstance = null;
  var friendSelectedHandler = null;
  function render2() {
    return HomePage_default;
  }
  function afterRender() {
    const socketService = SocketService_default.getInstance();
    socketService.connectChat();
    friendListInstance = new FriendList();
    friendListInstance.init();
    const userProfile = new UserProfile();
    userProfile.init();
    chatInstance = new Chat();
    chatInstance.init();
    const friendProfileModal = new FriendProfileModal();
    let currentChatFriendId = null;
    const chatSocket = socketService.getChatSocket();
    if (chatSocket) {
      chatSocket.on("friendProfileUpdated", (data) => {
        console.log("Mise \xE0 jour re\xE7ue pour :", data.username);
        if (currentChatFriendId === data.userId) {
          const headerBio = document.getElementById("chat-header-bio");
          if (headerBio && data.bio) {
            headerBio.innerHTML = parseMessage(data.bio);
          }
          const headerAvatar = document.getElementById("chat-header-avatar");
          if (headerAvatar && data.avatar) {
            headerAvatar.src = data.avatar;
          }
          const headerName = document.getElementById("chat-header-username");
          if (headerName && data.username) {
            headerName.textContent = data.username;
          }
        }
      });
      chatSocket.on("friendStatusUpdate", (data) => {
        const headerName = document.getElementById("chat-header-username");
        if (headerName && headerName.textContent === data.username) {
          const headerStatus = document.getElementById("chat-header-status");
          if (headerStatus && statusImages[data.status]) {
            headerStatus.src = statusImages[data.status];
          }
        }
      });
    }
    friendSelectedHandler = (e) => {
      const { friend, friendshipId } = e.detail;
      currentChatFriendId = friend.id;
      console.log("Ami s\xE9lectionn\xE9:", friend.alias, "Friendship ID:", friendshipId);
      const myId = parseInt(localStorage.getItem("userId") || "0");
      const ids = [myId, friend.id].sort((a, b) => a - b);
      const channelKey = `channel_${ids[0]}_${ids[1]}`;
      console.log("channelKey: ", channelKey);
      const chatPlaceholder = document.getElementById("chat-placeholder");
      const channelChat = document.getElementById("channel-chat");
      if (chatPlaceholder) chatPlaceholder.classList.add("hidden");
      if (channelChat) channelChat.classList.remove("hidden");
      const headerName = document.getElementById("chat-header-username");
      const headerAvatar = document.getElementById("chat-header-avatar");
      const headerStatus = document.getElementById("chat-header-status");
      const headerBio = document.getElementById("chat-header-bio");
      if (headerName) headerName.textContent = friend.alias;
      if (headerBio) headerBio.innerHTML = parseMessage(friend.bio || "");
      if (headerAvatar) {
        const avatarSrc = friend.avatar || friend.avatar_url || "/assets/profile/default.png";
        headerAvatar.src = avatarSrc;
      }
      if (headerStatus) {
        headerStatus.src = statusImages[friend.status] || statusImages["invisible"];
      }
      console.log("friendship homepage:", friendshipId);
      if (chatInstance) {
        chatInstance.joinChannel(channelKey, friendshipId, friend.id);
      }
    };
    window.addEventListener("friendSelected", friendSelectedHandler);
    const viewProfileButton = document.getElementById("button-view-profile");
    viewProfileButton?.addEventListener("click", () => {
      document.getElementById("chat-options-dropdown")?.classList.add("hidden");
      console.log("current chat friend id:", currentChatFriendId);
      if (currentChatFriendId) {
        friendProfileModal.open(currentChatFriendId);
      }
    });
    const localGameButton = document.getElementById("local-game");
    if (localGameButton) {
      localGameButton.addEventListener("click", () => {
        console.log("Lancement d'une partie locale...");
        window.history.pushState({ gameMode: "local" }, "", "/game");
        const navEvent = new PopStateEvent("popstate");
        window.dispatchEvent(navEvent);
      });
    }
    const remoteGameButton = document.getElementById("remote-game");
    if (remoteGameButton) {
      remoteGameButton.addEventListener("click", () => {
        console.log("Lancement d'une partie remote...");
        window.history.pushState({ gameMode: "remote" }, "", "/game");
        const navEvent = new PopStateEvent("popstate");
        window.dispatchEvent(navEvent);
      });
    }
    const tournamentGameButton = document.getElementById("tournament-game");
    if (tournamentGameButton) {
      tournamentGameButton.addEventListener("click", () => {
        console.log("Lancement d'une partie en tournoi...");
        window.history.pushState({ gameMode: "tournament" }, "", "/game");
        const navEvent = new PopStateEvent("popstate");
        window.dispatchEvent(navEvent);
      });
    }
  }

  // scripts/pages/ProfilePage.html
  var ProfilePage_default = `<div id="main-container" class="relative w-full h-[calc(100vh-50px)] overflow-hidden">

    <div id="profile-header" class="absolute top-0 left-0 w-full h-[200px] bg-cover bg-center bg-no-repeat"
         style="background-image: url(/assets/basic/background.jpg); background-size: cover;">
    </div>

    <div class="min-h-screen flex items-center justify-center">
        <div class="window" style="width:900px; margin-top:-100px;">
            <div class="title-bar">
                <div class="title-bar-text">Profile</div>
                <div class="title-bar-controls">
                    <button aria-label="Minimize"></button>
                    <button aria-label="Maximize"></button>
                    <button aria-label="Close"></button>
                </div>
            </div>
    
            <div class="window-body bg-white">
                <div class="flex flex-col items-center py-12">
                    
                    <div class="flex flex-col gap-6 border border-gray-300 rounded-sm bg-white shadow-sm p-6 w-[880px]">
            
                        <div class="flex flex-row gap-6 w-full">
                            
                            <div class="flex flex-col items-center border border-gray-300 rounded-sm p-4 w-[280px] shadow-sm bg-[#F0F0F0]">
                                <h1 class="text-lg font-normal mb-4 text-gray-700">My profile</h1>

                                <div class="relative w-[170px] h-[170px] mb-3">
                                    <img id="current-statut" class="absolute inset-0 w-full h-full object-cover z-20 pointer-events-none"
                                    src="/assets/basic/status_frame_offline_large.png">
                                    
                                    <img id="current-avatar" class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[130px] h-[130px] object-cover z-10 bg-black"
                                    src="/assets/basic/default.png">
                                </div>

                                <div class="flex flex-row gap-6 w-full justify-center mb-10 px-2">
                                    
                                    <button id="edit-picture-button" 
                                            title="Change Avatar"
                                            class="flex flex-col items-center justify-center w-20 h-16 gap-1
                                                bg-gradient-to-b from-white to-gray-200
                                                rounded-[3px] shadow-sm
                                                hover:from-gray-50 hover:to-gray-300 hover:border-blue-400
                                                active:translate-y-[1px] active:shadow-inner transition-all group">
                                        <img src="/assets/basic/camera.png" 
                                            class="w-6 h-6 opacity-80 group-hover:opacity-100" 
                                            alt="Avatar">
                                    </button>

                                    <button id="theme-button" 
                                            title="Customize Theme"
                                            class="flex flex-col items-center justify-center w-20 h-16 gap-1
                                                bg-gradient-to-b from-white to-gray-200 
                                                rounded-[3px] shadow-sm
                                                hover:from-gray-50 hover:to-gray-300 hover:border-blue-400
                                                active:translate-y-[1px] active:shadow-inner transition-all group">
                                        <img src="/assets/basic/headers.png" 
                                            class="w-6 h-6 opacity-80 group-hover:opacity-100" 
                                            alt="Theme">
                                    </button>

                                </div>

                                <div class="w-full px-4 mb-4 mt-4">
                                    <div class="flex items-center justify-between bg-white border border-gray-300 p-1 rounded-sm shadow-inner">
                                        <label class="text-xs text-gray-500 pl-1">Status:</label>
                                        <select class="bg-transparent text-sm font-semibold text-gray-700 outline-none cursor-pointer w-[120px] text-right">
                                            <option>Available</option>
                                            <option selected>Busy</option>
                                            <option>Away</option>
                                            <option>Appear offline</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="text-sm text-center w-full leading-6 mt-2">
                                    <p id="username-profile" class="text-xl font-semibold text-gray-800"><strong>Wait...</strong></p>
                                    <p id="bio-profile" class="text-sm text-gray-600 italic px-2" style="word-break: break-all;">Loading bio...</p>
                                </div>
                            </div>
                
                            <div class="flex flex-col justify-between flex-1">
                                <div class="flex flex-col gap-4">

                                    <label class="text-sm">Username:</label>
                                    <div class="flex flex-row gap-2" data-field="alias">
                                        <p class="field-display w-full border border-gray-300 rounded-sm p-2 text-sm bg-gray-50 flex items-center" style="width:350px; background-color: #EDEDED;">Wait...</p>
                                        <input type="text" value="" placeholder="Username" class="placeholder-gray-500 field-input w-full border border-gray-300 rounded-sm p-2 text-sm hidden" style="width:350px;"/>
                                        
                                        <button class="change-button bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm px-3 py-1 text-sm">Change</button>
                                        <button class="confirm-button hidden bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm px-3 py-1 text-sm">Confirm</button>
                                    </div>

                                    <label class="text-sm">Share a quick message:</label>
                                    <div class="flex flex-row gap-2 bg-gray-400" data-field="bio">
                                        <p class="field-display w-full border border-gray-300 rounded-sm p-2 text-sm bg-gray-500 flex items-center" style="width:350px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; background-color: #EDEDED">Share a quick message</p>
                                        <input
                                            type="text"
                                            value=""
                                            placeholder="Share a quick message"
                                            class="field-input w-full bg-gray-400 border border-gray-300 rounded-sm p-2 text-sm text-gray-600 hidden"
                                            style="width:350px; overflow: hidden;" disabled/>
                                        <span class="char-count hidden text-xs text-gray-500 self-center">0/70</span>
                                        <button class="change-button bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm px-3 py-1 text-sm">Change</button>
                                        <button class="confirm-button hidden bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm px-3 py-1 text-sm">Confirm</button>
                                    </div>
                                </div>
                
                                <div class="mt-8 border-t border-gray-300 pt-4">
                                    <div class="flex flex-col gap-4">
                                        <label class="text-sm">Email:</label>
                                        <div class="flex flex-row gap-2" data-field="email">
                                            <p class="field-display w-full border border-gray-300 rounded-sm p-2 text-sm bg-gray-50 flex items-center" style="width:350px; background-color: #EDEDED">Wait...</p>
                                            <input type="email" value="" placeholder="email@gmail.com" class="field-input w-full border border-gray-300 rounded-sm p-2 text-sm hidden" style="width:350px" disabled/>
                                            
                                            <button class="change-button bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm px-3 py-1 text-sm">Change</button>
                                            <button class="confirm-button hidden bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm px-3 py-1 text-sm">Confirm</button>
                                        </div>

                                        <label class="text-sm">Password:</label>
                                        <div class="flex flex-row gap-2" data-field="password">
                                            <p class="field-display w-full border border-gray-300 rounded-sm p-2 text-sm bg-gray-50 flex items-center" style="width:350px; background-color: #EDEDED">Wait...</p>
                                            <input type="password" value="" placeholder="New password" class="field-input w-full border border-gray-300 rounded-sm p-2 text-sm hidden" style="width:350px" disabled/>
                                            
                                            <button class="change-button bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm px-3 py-1 text-sm">Change</button>
                                            <button class="confirm-button hidden bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm px-3 py-1 text-sm">Confirm</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div> 
                        <div class="flex flex-row justify-center items-center gap-4 w-full border-t border-gray-200 pt-4" style="padding-top: 25px;">
                            <button id="2fa-modal-button" class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm 
                                    px-4 py-1 text-sm shadow-sm p-2 hover:from-gray-200 hover:to-gray-400 
                                    active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-700">Enable 2FA authentication</button>
                            <button id="download-data-button" class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm 
                                    px-4 py-1 text-sm shadow-sm p-2 hover:from-gray-200 hover:to-gray-400 
                                    active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-700">Download personal data</button>
                            <button id="delete-account-button" class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm 
                                    px-4 py-1 text-sm shadow-sm p-2 hover:from-gray-200 hover:to-gray-400 
                                    active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 font-semibold" style="color: #DC2626;">Delete my account</button>
                        </div>

                    </div> <div class="flex flex-col border border-gray-300 rounded-sm bg-white shadow-sm p-6 w-[880px] mt-6">
                        <h1 class="text-lg font-normal mb-4 text-gray-700 border-b border-gray-200 pb-2">My game statistics</h1>

                        <div class="grid grid-cols-4 gap-4 mb-8">
                            <div class="flex flex-col items-center justify-center p-4 bg-gray-50 border border-gray-200 rounded-sm shadow-sm hover:bg-gray-100 transition-colors">
                                <span class="text-gray-500 text-xs uppercase tracking-wider font-semibold">Games played</span>
                                <span id="stats-total-games" class="text-3xl font-bold text-gray-800 mt-1">0</span>
                            </div>
                            
                            <div class="flex flex-col items-center justify-center p-4 bg-green-50/50 border border-green-200 rounded-sm shadow-sm">
                                <span class="text-green-600 text-xs uppercase tracking-wider font-semibold">Wins</span>
                                <span id="stats-wins" class="text-3xl font-bold text-green-700 mt-1">0</span>
                            </div>

                            <div class="flex flex-col items-center justify-center p-4 bg-red-50/50 border border-red-200 rounded-sm shadow-sm">
                                <span class="text-red-600 text-xs uppercase tracking-wider font-semibold">Losses</span>
                                <span id="stats-losses" class="text-3xl font-bold text-red-700 mt-1">0</span>
                            </div>

                            <div class="flex flex-col items-center justify-center p-4 bg-red-50/50 border border-red-200 rounded-sm shadow-sm">
                                <span class="text-green-600 text-xs uppercase tracking-wider font-semibold">Average score</span>
                                <span id="stats-average-score" class="text-3xl font-bold text-red-700 mt-1">0</span>
                            </div>

                            <div class="flex flex-col items-center justify-center p-4 bg-red-50/50 border border-red-200 rounded-sm shadow-sm">
                                <span class="text-green-600 text-xs uppercase tracking-wider font-semibold">Current winning streak</span>
                                <span id="stats-streak" class="text-3xl font-bold text-red-700 mt-1">0</span>
                            </div>

                            <div class="flex flex-col items-center justify-center p-4 bg-blue-50/50 border border-blue-200 rounded-sm shadow-sm">
                                <span class="text-blue-600 text-xs uppercase tracking-wider font-semibold">Win rate</span>
                                <span id="stats-win-rate" class="text-3xl font-bold text-blue-700 mt-1">0%</span>
                            </div>

                            <div class="flex flex-col items-center justify-center p-4 bg-blue-50/50 border border-blue-200 rounded-sm shadow-sm">
                                <span class="text-blue-600 text-xs uppercase tracking-wider font-semibold">Biggest opponent</span>
                                <span id="stats-opponent" class="text-3xl font-bold text-blue-700 mt-1">xxxx</span>
                            </div>

                            <div class="flex flex-col items-center justify-center p-4 bg-blue-50/50 border border-blue-200 rounded-sm shadow-sm">
                                <span class="text-blue-600 text-xs uppercase tracking-wider font-semibold">Favorite type of game</span>
                                <span id="stats-fav-game" class="text-3xl font-bold text-blue-700 mt-1">Local</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

        <div id="2fa-modal" class="absolute inset-0 bg-black/40 z-50 hidden items-center justify-center">
    <div class="window bg-white" style="width: 400px; box-shadow: 0px 0px 20px rgba(0,0,0,0.5);">
        <div class="title-bar">
            <div class="title-bar-text">Two-Factor Authentication</div>
            <div class="title-bar-controls">
                <button id="close-2fa-modal" aria-label="Close"></button>
            </div>
        </div>
        
        <div class="window-body p-6">
            
            <div id="method-selection" class="flex flex-col gap-4 items-center">
                <div class="text-center mb-2 border-b border-gray-500 p-4">
                    <h2 class="text-lg font-bold mb-2">Choose authentication method</h2>
                    <p class="text-xs text-gray-600">Select how you want to set up 2FA</p>
                </div>
                
                <div class="option-card p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 border border-transparent hover:border-blue-300 transition-all" data-method="qr">
                    <div class="flex items-center gap-3">
                        <div class="flex-1">
                            <h3 class="font-bold text-sm text-center">Authenticator App</h3>
                            <p class="text-xs text-gray-600">Use Google Authenticator or similar</p>
                        </div>
                    </div>
                </div>
                
                <div class="option-card p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 border border-transparent hover:border-blue-300 transition-all" data-method="email">
                    <div class="flex items-center gap-3">
                        <div class="flex-1">
                            <h3 class="font-bold text-sm text-center">Email Verification</h3>
                            <p class="text-xs text-gray-600">Receive codes via email</p>
                        </div>
                    </div>
                </div>
            </div>

            <div id="qr-content" class="hidden flex-col items-center gap-4">
                
                <div class="text-center"> <h2 class="text-lg font-bold mb-2">Scan QR Code</h2>
                    <p class="text-xs text-gray-600 mb-4">Open Google Authenticator and scan this code.</p>
                </div>

                <div class="border border-gray-300 p-2 bg-white shadow-inner">
                    <img id="2fa-qr-code" src="" alt="QR Code loading..." class="w-[150px] h-[150px] object-contain">
                </div>

                <div class="w-full flex flex-col gap-2 mt-2">
                    <label class="text-sm">Enter the 6-digit code:</label>
                    <input type="text" id="2fa-input-code" placeholder="123 456" maxlength="6" 
                           class="w-full border border-gray-300 rounded-sm p-2 text-center text-lg tracking-widest font-mono shadow-inner focus:outline-none focus:border-blue-400">
                </div>

                <div class="flex justify-center gap-4 mt-4 w-full">
                    <button id="confirm-2fa-button" 
                            class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm 
                                px-6 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 font-bold">
                        VALIDATE
                    </button>
                    <button id="cancel-2fa-button" 
                            class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm 
                                px-6 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400">
                        CANCEL
                    </button>
                </div>
            </div>

            <div id="email-content" class="hidden flex-col items-center gap-4">
                
                <div class="text-center">
                    <h2 class="text-lg font-bold mb-2">Email Verification</h2>
                    <p class="text-xs text-gray-600 mb-4">We'll send a verification code to your email.</p>
                </div>
                
                <div class="w-full flex flex-col gap-2">
                    <label class="text-sm">Code will be sent to:</label>
                    <input type="email" id="2fa-email-input" 
                        class="w-full border border-gray-300 rounded-sm p-2 shadow-inner bg-gray-200 text-gray-600 cursor-not-allowed select-none"
                        disabled 
                        readonly>
                </div>
                
                <button id="send-code-button" 
                        class="w-full bg-gradient-to-b from-blue-100 to-blue-300 border border-blue-400 rounded-sm px-6 py-2 text-sm shadow-sm hover:from-blue-200 hover:to-blue-400 font-bold mt-2">
                    SEND CODE
                </button>
                
                <div id="code-verification" class="w-full flex-col gap-2 mt-2 hidden">
                    <label class="text-sm">Enter code received:</label>
                    <input type="text" id="2fa-input-code-email" placeholder="123456" maxlength="6" 
                           class="w-full border border-gray-300 rounded-sm p-2 text-center text-lg tracking-widest font-mono shadow-inner focus:outline-none focus:border-blue-400">
                    
                    <button id="confirm-2fa-email" 
                            class="w-full bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm px-6 py-2 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 mt-2 font-bold">
                        VALIDATE
                    </button>
                </div>
            </div>
            
        </div>
    </div>
</div>

        <div id="picture-modal" class="absolute inset-0 bg-black/40 z-50 hidden items-center justify-center">
        <div class="window bg-white" style="width: 650px; box-shadow: 0px 0px 20px rgba(0,0,0,0.5);">
            <div class="title-bar">
                <div class="title-bar-text">Change Picture</div>
                <div class="title-bar-controls">
                    <button aria-label="Minimize"></button>
                    <button aria-label="Maximize"></button>
                    <button id="close-modal" aria-label="Close"></button>
                </div>
            </div>
            <div class="window-body p-6">
                <div class="mb-6">
                    <h2 class="text-xl mb-1">Select a picture</h2>
                    <p class="text-gray-500 text-sm">Choose how you want to appear on transcendence.</p>
                </div>
                
                <div class="flex flex-row gap-6">
                    <div class="flex-1">
                        <div class="bg-white border border-[#828790] shadow-inner p-2 h-[250px] overflow-y-auto">
                            <div id="modal-grid" class="grid grid-cols-4 gap-2">
                                <img src="/assets/profile/Beach_Chairs.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Chess_Pieces.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Dirt_Bike.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Friendly_Dog.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Guest_(Windows_Vista).png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Orange_Daisy.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Palm_Trees.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Rocket_Launch.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Rubber_Ducky.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Running_Horses.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Skateboarder.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Soccer_Ball.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/User_(Windows_Vista).png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Usertile11_(Windows_Vista).png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Usertile3_(Windows_Vista).png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Usertile8_(Windows_Vista).png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-col items-center gap-4 w-[200px]">
                        <div class="relative w-[170px] h-[170px]">
                            <img class="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
                            src="/assets/basic/status_frame_offline_large.png">
                            
                            <img id="modal-preview-avatar" class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[130px] h-[130px] object-cover"
                            src="/assets/basic/default.png">
                        </div>

                        <div class="flex flex-col gap-2 w-full mt-2 h-64">
                            <input type="file" id="file-input" accept="image/*" hidden>

                            <button id="browse-button" 
                            class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm 
                                px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 
                                active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">
                            BROWSE
                            </button>
                            
                            <button id="delete-button" 
                            class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm 
                                px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 
                                active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">
                            DELETE
                            </button>

                            <div class="mt-auto flex justify-center gap-2 pb-3" style="padding-top:101px">
                                <button id="validation-button" 
                                        class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm 
                                            px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 
                                            active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">
                                        OK
                                </button>
                                <button id="cancel-button" 
                                        class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm 
                                            px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 
                                            active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">
                                        CANCEL
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>


    <div id="theme-modal" class="absolute inset-0 bg-black/40 z-50 hidden items-center justify-center">
        <div class="window bg-white flex flex-col" style="width: 600px; height: 800px;">
            
            <div class="title-bar flex-none">
                <div class="title-bar-text">Select a Theme</div>
                <div class="title-bar-controls">
                    <button id="close-theme-modal" aria-label="Close"></button>
                </div>
            </div>

            <div class="window-body p-4 flex-1 overflow-y-auto">
                
                <div id="theme-grid" class="grid grid-cols-2 gap-4">
                    </div>
            </div>
        </div>
    </div>



    <div id="password-modal" class="absolute inset-0 bg-black/40 z-50 hidden items-center justify-center">
        <div class="window bg-white" style="width: 450px; box-shadow: 0px 0px 20px rgba(0,0,0,0.5);">
            <div class="title-bar">
                <div class="title-bar-text">Change password</div>
                <div class="title-bar-controls">
                    <button id="close-password-modal" aria-label="Close"></button>
                </div>
            </div>
            <div class="window-body p-6 flex flex-col gap-4 items-center">
                <h2 class="text-lg font-bold mb-2">Change Password</h2>

                <div class="flex flex-col gap-1">
                    <label class="text-sm text-gray-600">Current Password:</label>
                    <input type="password" id="pwd-current" class="border border-gray-300 rounded-sm p-2 w-full text-sm">
                </div>

                <div class="flex flex-col gap-1">
                    <label class="text-sm text-gray-600">New Password:</label>
                    <input type="password" id="pwd-new" class="border border-gray-300 rounded-sm p-2 w-full text-sm">
                </div>

                <div class="flex flex-col gap-1">
                    <label class="text-sm text-gray-600">Confirm New Password:</label>
                    <input type="password" id="pwd-confirm" class="border border-gray-300 rounded-sm p-2 w-full text-sm">
                </div>

                <p id="pwd-error" class="text-red-500 text-xs hidden"></p>

                <div class="flex justify-end gap-2 mt-4">
                    <button id="save-password-button" class="change-button bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm px-3 py-1 text-sm">Save</button>
                    <button id="cancel-password-button" class="change-button bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm px-3 py-1 text-sm">Cancel</button>
                </div>
            </div>
        </div>
    </div>


    <!------------------------ DELETE CONFIRMATION MODALE -->

    <div id="delete-modal" class="absolute inset-0 bg-black/40 z-50 hidden items-center justify-center">
        <div class="window bg-white" style="width: 450px; box-shadow: 0px 0px 20px rgba(0,0,0,0.5);">
            <div class="title-bar">
                <div class="title-bar-text">Delete my account</div>
                <div class="title-bar-controls">
                    <button id="close-delete-modal" aria-label="Close"></button>
                </div>
            </div>
            <div class="window-body p-6 flex flex-col gap-4 items-center justify-center">
                <h2 class="text-lg font-bold mb-2 text-red-600 text-center">Are you sure you want to delete your account?</h2>
                <p>This action will be irreversible.</p>

                <div class="flex justify-end gap-2 mt-4">
                    <button id="confirm-delete-account-button" class="change-button bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm px-3 py-1 text-sm">Yes, delete my account</button>
                    <button id="cancel-delete-account-button" class="change-button bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm px-3 py-1 text-sm">Cancel</button>
                </div>
            </div>
        </div>
    </div>




    
</div>`;

  // scripts/pages/ProfilePage.ts
  function render3() {
    return ProfilePage_default;
  }
  function applyTheme(themeKey) {
    const theme = appThemes[themeKey] || appThemes["basic"];
    localStorage.setItem("userTheme", themeKey);
    const navbar = document.getElementById("main-navbar");
    if (navbar) {
      navbar.style.background = theme.navColor;
    }
    const headerIds = ["profile-header", "home-header"];
    headerIds.forEach((id) => {
      const header = document.getElementById(id);
      if (header) {
        header.style.backgroundImage = `url(${theme.headerUrl})`;
      }
    });
    const body = document.getElementById("app-body");
    if (body) {
      body.className = "m-0 p-0 overflow-x-auto min-w-[1000px] min-h-screen";
      body.style.background = theme.bgColor;
      body.style.backgroundRepeat = "no-repeat";
      body.style.backgroundAttachment = "fixed";
    }
  }
  function afterRender2() {
    const mainAvatar = document.getElementById("current-avatar");
    const statusFrame = document.getElementById("current-statut");
    const usernameDisplay = document.getElementById("username-profile");
    const bioDisplay = document.getElementById("bio-profile");
    const modal = document.getElementById("picture-modal");
    const statusSelect = document.querySelector("select");
    const fieldContainers = document.querySelectorAll(".flex.flex-row.gap-2[data-field]");
    const editButton = document.getElementById("edit-picture-button");
    const closeButton = document.getElementById("close-modal");
    const cancelButton = document.getElementById("cancel-button");
    const okButton = document.getElementById("validation-button");
    const browseButton = document.getElementById("browse-button");
    const deleteButton = document.getElementById("delete-button");
    const gridContainer = document.getElementById("modal-grid");
    const previewAvatar = document.getElementById("modal-preview-avatar");
    const fileInput = document.getElementById("file-input");
    const methodSelection = document.getElementById("method-selection");
    const qrContent = document.getElementById("qr-content");
    const emailContent = document.getElementById("email-content");
    const buttonSelectQr = document.querySelector('[data-method="qr"]');
    const buttonSelectEmail = document.querySelector('[data-method="email"]');
    const buttonBackQr = document.getElementById("back-from-qr");
    const buttonBackEmail = document.getElementById("back-from-email");
    const inputEmail2fa = document.getElementById("2fa-email-input");
    const buttonSendCode = document.getElementById("send-code-button");
    const codeVerif = document.getElementById("code-verification");
    const inputCodeEmail = document.getElementById("2fa-input-code-email");
    const buttonConfirmEmail = document.getElementById("confirm-2fa-email");
    const button2faToggle = document.getElementById("2fa-modal-button");
    const modal2fa = document.getElementById("2fa-modal");
    const close2faButton = document.getElementById("close-2fa-modal");
    const cancel2faButton = document.getElementById("cancel-2fa-button");
    const confirm2faQrButton = document.getElementById("confirm-2fa-button");
    const input2faQr = document.getElementById("2fa-input-code");
    const qrCodeImg = document.getElementById("2fa-qr-code");
    const userId = localStorage.getItem("userId");
    let selectedImageSrc = mainAvatar?.src || "";
    let is2faEnabled = localStorage.getItem("is2faEnabled") === "true";
    let currentUserEmail = "";
    const statusImages3 = {
      "available": "/assets/basic/status_frame_online_large.png",
      "online": "/assets/basic/status_frame_online_large.png",
      "busy": "/assets/basic/status_frame_busy_large.png",
      "away": "/assets/basic/status_frame_away_large.png",
      "invisible": "/assets/basic/status_frame_offline_large.png"
    };
    const statusMapping = {
      "Available": "available",
      "Busy": "busy",
      "Away": "away",
      "Appear offline": "invisible"
    };
    const reverseStatusMapping = {
      "available": "Available",
      "online": "Available",
      "busy": "Busy",
      "away": "Away",
      "invisible": "Appear offline"
    };
    const themeButton = document.getElementById("theme-button");
    const themeModal = document.getElementById("theme-modal");
    const closeThemeModal = document.getElementById("close-theme-modal");
    const themeGrid = document.getElementById("theme-grid");
    const currentTheme = localStorage.getItem("userTheme") || "basic";
    applyTheme(currentTheme);
    let selectedThemeElement = null;
    themeButton?.addEventListener("click", () => {
      themeModal?.classList.remove("hidden");
      themeModal?.classList.add("flex");
    });
    const closeThemeFunc = () => {
      themeModal?.classList.add("hidden");
      themeModal?.classList.remove("flex");
    };
    closeThemeModal?.addEventListener("click", closeThemeFunc);
    if (themeGrid && themeGrid.children.length === 0) {
      Object.entries(appThemes).forEach(([key, theme]) => {
        const div = document.createElement("div");
        div.className = `theme-item cursor-pointer border-2 rounded overflow-hidden transition-all hover:shadow-lg`;
        div.dataset.themeKey = key;
        if (key === currentTheme) {
          div.classList.add("border-blue-500", "shadow-blue-500/50");
          selectedThemeElement = div;
        } else {
          div.classList.add("border-gray-300", "hover:border-blue-500");
        }
        div.innerHTML = `
				<div class="relative">
					<div class="w-full h-12 bg-cover bg-center" style="background-image: url('${theme.headerUrl}')"></div>
					
					<div class="w-full h-16" style="background: ${theme.bgColor}; background-repeat: no-repeat; background-attachment: fixed;"></div>
				</div>
				
				<div class="p-2 bg-white text-center border-t border-gray-200">
					<span class="text-sm font-bold text-gray-800">${theme.name}</span>
				</div>
			`;
        div.addEventListener("click", function() {
          const themeKey = this.dataset.themeKey;
          if (selectedThemeElement) {
            selectedThemeElement.classList.remove("border-blue-500", "shadow-lg");
            selectedThemeElement.classList.add("border-gray-300", "hover:border-blue-500");
          }
          this.classList.remove("border-gray-300", "hover:border-blue-500");
          this.classList.add("border-blue-500", "shadow-lg");
          selectedThemeElement = this;
          applyTheme(themeKey);
          updateTheme(themeKey);
          closeThemeFunc();
        });
        themeGrid.appendChild(div);
      });
    }
    themeModal?.addEventListener("click", (e) => {
      if (e.target === themeModal) closeThemeFunc();
    });
    let current2FAMethod = "APP";
    const update2faButton = (enabled) => {
      is2faEnabled = enabled;
      if (enabled) {
        button2faToggle.innerText = "Disable 2FA authentication";
        button2faToggle.classList.remove("bg-green-600");
        button2faToggle.classList.add("bg-red-600");
      } else {
        button2faToggle.innerText = "Enable 2FA authentication";
        button2faToggle.classList.remove("bg-red-600");
        button2faToggle.classList.add("bg-green-600");
      }
    };
    update2faButton(is2faEnabled);
    const close2fa = () => {
      if (modal2fa) {
        modal2fa.classList.add("hidden");
        modal2fa.classList.remove("flex");
        if (input2faQr) input2faQr.value = "";
        if (inputCodeEmail) inputCodeEmail.value = "";
        if (qrCodeImg) qrCodeImg.src = "";
      }
    };
    const switch2faView = (view) => {
      methodSelection?.classList.add("hidden");
      qrContent?.classList.add("hidden");
      emailContent?.classList.add("hidden");
      methodSelection?.classList.remove("flex");
      qrContent?.classList.remove("flex");
      emailContent?.classList.remove("flex");
      if (view === "selection") {
        methodSelection?.classList.remove("hidden");
        methodSelection?.classList.add("flex");
      } else if (view === "qr") {
        qrContent?.classList.remove("hidden");
        qrContent?.classList.add("flex");
      } else if (view === "email") {
        emailContent?.classList.remove("hidden");
        emailContent?.classList.add("flex");
        const displayedEmail = document.querySelector('div[data-field="email"] .field-display')?.textContent;
        if (displayedEmail && displayedEmail.trim() !== "")
          currentUserEmail = displayedEmail.trim();
        if (inputEmail2fa) {
          inputEmail2fa.value = currentUserEmail;
          inputEmail2fa.disabled = true;
        }
        if (codeVerif) {
          codeVerif.classList.remove("hidden");
          codeVerif.classList.add("flex");
        }
        if (buttonSendCode) buttonSendCode.classList.add("hidden");
      }
    };
    const initiate2faSetup = async (method) => {
      if (!userId) return;
      const backendType = method === "qr" ? "APP" : "EMAIL";
      try {
        const response = await fetchWithAuth(`api/auth/2fa/secret`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: backendType })
        });
        if (response.ok) {
          const result = await response.json();
          if (method === "qr") {
            if (result.data && result.data.qrCodeUrl) {
              if (qrCodeImg) qrCodeImg.src = result.data.qrCodeUrl;
              switch2faView("qr");
            }
          } else {
            console.log("Email code sent");
            switch2faView("email");
          }
        } else {
          console.error("Failed to initiate 2FA");
          alert("Error initializing 2FA setup");
        }
      } catch (error) {
        console.error("Network error 2FA generate:", error);
        alert("Network error");
      }
    };
    const enable2fa = async (code, type) => {
      if (!code || code.length < 6) {
        alert("Please enter a valid 6-digit code.");
        return;
      }
      const backendType = type === "qr" ? "APP" : "EMAIL";
      try {
        const response = await fetchWithAuth(`api/auth/2fa`, {
          method: "POST",
          // ou patch?? a tester
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, type: backendType })
        });
        if (response.ok) {
          update2faButton(true);
          localStorage.setItem("is2faEnabled", "true");
          close2fa();
          alert("2FA is now enabled!");
        } else {
          const result = await response.json();
          alert(result.message || "Invalid code. Please try again.");
        }
      } catch (error) {
        console.error("Error enabling 2FA:", error);
        alert("An error occurred.");
      }
    };
    const disable2fa = async () => {
      if (!confirm("Are you sure you want to disable Two-Factor Authentication?")) return;
      try {
        const response = await fetchWithAuth(`api/auth/2fa`, {
          method: "DELETE"
          // ou patch?? a tester --> MODIFICATION EN DELETE par Cassandre
        });
        if (response.ok) {
          update2faButton(false);
          localStorage.setItem("is2faEnabled", "false");
          alert("2FA disabled.");
        } else {
          alert("Error disabling 2FA.");
        }
      } catch (error) {
        console.error(error);
      }
    };
    buttonSelectQr?.addEventListener("click", () => initiate2faSetup("qr"));
    buttonSelectEmail?.addEventListener("click", () => initiate2faSetup("email"));
    buttonBackQr?.addEventListener("click", () => switch2faView("selection"));
    buttonBackEmail?.addEventListener("click", () => switch2faView("selection"));
    confirm2faQrButton?.addEventListener("click", () => enable2fa(input2faQr.value.trim(), "qr"));
    buttonConfirmEmail?.addEventListener("click", () => enable2fa(inputCodeEmail.value.trim(), "email"));
    button2faToggle?.addEventListener("click", () => {
      if (is2faEnabled) {
        disable2fa();
      } else {
        if (modal2fa) {
          modal2fa.classList.remove("hidden");
          modal2fa.classList.add("flex");
          if (input2faQr) input2faQr.value = "";
          if (inputCodeEmail) inputCodeEmail.value = "";
          switch2faView("selection");
        }
      }
    });
    close2faButton?.addEventListener("click", close2fa);
    cancel2faButton?.addEventListener("click", close2fa);
    const cancelEmailButton = document.getElementById("cancel-2fa-email");
    cancelEmailButton?.addEventListener("click", close2fa);
    modal2fa?.addEventListener("click", (e) => {
      if (e.target === modal2fa) close2fa();
    });
    const downloadButton = document.getElementById("download-data-button");
    downloadButton?.addEventListener("click", async () => {
      if (!userId) return;
      try {
        const response = await fetchWithAuth(`api/user/${userId}/export`);
        if (response.ok) {
          const blob = await response.blob();
          const url2 = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url2;
          a.download = `user_data_${userId}.json`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url2);
          a.remove();
          console.log("Export data downloaded successfully!");
        } else {
          console.error("Failed to download data");
        }
      } catch (error) {
        console.error("Network error during export:", error);
      }
    });
    const deleteAccountButton = document.getElementById("delete-account-button");
    const deleteModal = document.getElementById("delete-modal");
    const closeDeleteModalButton = document.getElementById("close-delete-modal");
    const confirmDeleteButton = document.getElementById("confirm-delete-account-button");
    const cancelDeleteButton = document.getElementById("cancel-delete-account-button");
    const openDeleteModal = () => {
      deleteModal?.classList.remove("hidden");
      deleteModal?.classList.add("flex");
    };
    const closeDeleteModal = () => {
      deleteModal?.classList.add("hidden");
      deleteModal?.classList.remove("flex");
    };
    deleteAccountButton?.addEventListener("click", openDeleteModal);
    closeDeleteModalButton?.addEventListener("click", closeDeleteModal);
    cancelDeleteButton?.addEventListener("click", closeDeleteModal);
    deleteModal?.addEventListener("click", (e) => {
      if (e.target === deleteModal) closeDeleteModal();
    });
    confirmDeleteButton?.addEventListener("click", async () => {
      if (!userId) return;
      const confirmation = confirm("This action is irreversible. Are you really sure?");
      if (!confirmation) return;
      try {
        const response = await fetchWithAuth(`api/user/${userId}`, {
          method: "DELETE"
        });
        if (response.ok) {
          alert("Your account has been deleted. You will be redirected.");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("userId");
          localStorage.removeItem("userTheme");
          localStorage.removeItem("username");
          window.history.pushState({}, "", "/");
          window.dispatchEvent(new PopStateEvent("popstate"));
        } else {
          const result = await response.json();
          alert(result.error?.message || "Error deleting account");
          closeDeleteModal();
        }
      } catch (error) {
        console.error("Network error during destruction:", error);
        alert("Network error. Please try again.");
      }
    });
    const closeModalFunc = () => {
      if (!modal) return;
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    };
    const openModalFunc = () => {
      if (!modal || !previewAvatar || !mainAvatar) return;
      selectedImageSrc = mainAvatar.src;
      previewAvatar.src = selectedImageSrc;
      modal.classList.remove("hidden");
      modal.classList.add("flex");
    };
    const loadUserData = async () => {
      if (!userId)
        return;
      try {
        const response = await fetchWithAuth(`api/user/${userId}`);
        if (response.ok) {
          const user = await response.json();
          currentUserEmail = user.email || "";
          const statResponse = await fetchWithAuth(`/api/game/users/${userId}/stats`);
          if (statResponse.ok) {
            const jsonResponse = await statResponse.json();
            console.log("Stats re\xE7ues du Backend:", jsonResponse);
            const stats = jsonResponse.data || jsonResponse;
            const totalGame = document.getElementById("stats-total-games");
            const wins = document.getElementById("stats-wins");
            const losses = document.getElementById("stats-losses");
            const winRateCalcul = document.getElementById("stats-win-rate");
            const avgScore = document.getElementById("stats-average-score");
            const streak = document.getElementById("stats-streak");
            const opponent = document.getElementById("stats-opponent");
            const favGame = document.getElementById("stats-fav-game");
            if (stats) {
              if (totalGame) totalGame.innerText = stats.total_games.toString();
              if (wins) wins.innerText = stats.wins.toString();
              if (losses) losses.innerText = stats.losses.toString();
              if (winRateCalcul) {
                let rateValue = 0;
                if (stats.total_games > 0) {
                  rateValue = Math.round(stats.wins / stats.total_games * 100);
                }
                winRateCalcul.innerText = `${rateValue}%`;
              }
              if (avgScore) avgScore.innerText = stats.averageScore?.toString() || "0";
              if (streak) streak.innerText = stats.current_win_streak?.toString() || "0";
              if (opponent) opponent.innerText = stats.biggest_opponent || "-";
              if (favGame) favGame.innerText = stats.favorite_game || "Local";
            }
          } else {
            console.warn("Could not fetch user stats");
          }
          if (user.theme) {
            localStorage.setItem("userTheme", user.theme);
            applyTheme(user.theme);
          }
          if (user.avatar_url && mainAvatar) {
            mainAvatar.src = user.avatar_url;
            selectedImageSrc = user.avatar_url;
          }
          if (user.is2faEnabled !== void 0) {
            update2faButton(user.is2faEnabled);
          }
          fieldContainers.forEach((container) => {
            const fieldName = container.dataset.field;
            const display = container.querySelector(".field-display");
            const input = container.querySelector(".field-input");
            if (fieldName && display && input) {
              let value2;
              if (fieldName === "alias") {
                value2 = user.alias || "";
                if (usernameDisplay)
                  usernameDisplay.innerText = value2;
              } else if (fieldName === "bio") {
                value2 = user.bio || "";
                if (bioDisplay)
                  bioDisplay.innerHTML = parseMessage(value2) || "Share a quick message";
              } else if (fieldName === "email") {
                value2 = user.email || "";
              } else if (fieldName === "password") {
                value2 = "********";
              }
              if (value2 !== void 0) {
                display.innerText = value2 || (fieldName === "email" ? "No email" : "Empty");
                if (fieldName !== "password") {
                  input.placeholder = value2 || "Empty";
                }
              }
            }
          });
          if (user.status) {
            const normalizedStatus = user.status.toLowerCase();
            const statusValue = reverseStatusMapping[normalizedStatus] || "Appear offline";
            if (statusSelect) statusSelect.value = statusValue;
            updateStatusFrame(normalizedStatus);
          }
          fieldContainers.forEach((container) => {
            if (container.dataset.field === "password") return;
            const display = container.querySelector(".field-display");
            const input = container.querySelector(".field-input");
            const changeButton = container.querySelector(".change-button");
            const confirmButton = container.querySelector(".confirm-button");
            if (display && input && changeButton && confirmButton) {
              const fieldElements = { container, display, input, changeButton, confirmButton };
              setupField(fieldElements, container.dataset.field);
            }
          });
        }
      } catch (error) {
        console.error("Erreur while charging profile:", error);
      }
    };
    const updateStatusFrame = (status) => {
      if (statusFrame && statusImages3[status]) {
        statusFrame.src = statusImages3[status];
      }
    };
    loadUserData();
    const updateUsername = async (newUsername) => {
      if (!userId || !newUsername.trim()) return false;
      try {
        const response = await fetchWithAuth(`api/user/${userId}/alias`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alias: newUsername })
        });
        const result = await response.json();
        if (response.ok) {
          alert("Username updated successfully!");
          if (usernameDisplay) usernameDisplay.innerText = newUsername;
          localStorage.setItem("username", newUsername);
          SocketService_default.getInstance().socket?.emit("notifyProfileUpdate", {
            userId: Number(userId),
            username: newUsername
          });
          console.log("Username updated");
          return true;
        } else {
          console.error("Error while updating username");
          if (result.error && result.error.message)
            alert(result.error.message);
          else
            alert("Error while saving username");
          return false;
        }
      } catch (error) {
        console.error("Erreur r\xE9seau:", error);
        alert("Error while saving username");
        return false;
      }
    };
    const updateBio = async (newBio) => {
      if (!userId) return false;
      const MAX_BIO_LENGTH = 70;
      const trimmedBio = newBio.trim();
      if (trimmedBio.length > MAX_BIO_LENGTH) {
        console.error("Erreur: Bio d\xE9passe la limite de 70 caract\xE8res.");
        alert(`La biographie ne doit pas d\xE9passer ${MAX_BIO_LENGTH} caract\xE8res.`);
        return false;
      }
      try {
        const response = await fetchWithAuth(`api/user/${userId}/bio`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bio: trimmedBio })
        });
        if (response.ok) {
          if (bioDisplay) bioDisplay.innerHTML = parseMessage(trimmedBio) || "Share a quick message";
          SocketService_default.getInstance().socket?.emit("notifyProfileUpdate", {
            userId: Number(userId),
            bio: trimmedBio,
            username: localStorage.getItem("username")
          });
          console.log("Bio mise \xE0 jour");
          return true;
        } else {
          console.error("Erreur lors de la mise \xE0 jour de la bio");
          alert("Erreur lors de la sauvegarde de la bio");
          return false;
        }
      } catch (error) {
        console.error("Erreur r\xE9seau:", error);
        alert("Erreur lors de la sauvegarde de la bio");
        return false;
      }
    };
    const updateEmail = async (newEmail) => {
      if (!userId || !newEmail.trim()) return false;
      try {
        const response = await fetchWithAuth(`api/user/${userId}/email`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: newEmail })
        });
        const user = await response.json();
        if (response.ok) {
          alert("Email updated successfully!");
          currentUserEmail = newEmail;
          console.log("Email updated");
          return true;
        } else {
          console.error(user.error.message);
          alert(user.error.message);
          return false;
        }
      } catch (error) {
        console.error("Network error:", error);
        alert("Error saving email");
        return false;
      }
    };
    const updateTheme = async (newTheme) => {
      if (!userId) return;
      try {
        const response = await fetchWithAuth(`api/user/${userId}/theme`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: newTheme })
        });
        if (response.ok) {
          console.log("Theme saved to database:", newTheme);
          localStorage.setItem("userTheme", newTheme);
        } else {
          console.error("Failed to save theme to database");
        }
      } catch (error) {
        console.error("Network error saving theme:", error);
      }
    };
    const setupField = (elements, fieldName) => {
      const { display, input, changeButton, confirmButton } = elements;
      let initialValue = display.innerText;
      const MAX_BIO_LENGTH = 70;
      const charCountElement = fieldName === "bio" ? elements.container.querySelector(".char-count") : null;
      const updateCharCount = (currentLength) => {
        if (charCountElement) {
          charCountElement.innerText = `${currentLength}/${MAX_BIO_LENGTH}`;
          if (currentLength > MAX_BIO_LENGTH) {
            charCountElement.classList.add("text-red-500");
            charCountElement.classList.remove("text-gray-500");
          } else {
            charCountElement.classList.remove("text-red-500");
            charCountElement.classList.add("text-gray-500");
          }
        }
      };
      const enableEditMode = () => {
        initialValue = fieldName === "password" ? "" : display.innerText;
        display.classList.add("hidden");
        input.classList.remove("hidden");
        input.disabled = false;
        if (fieldName !== "password") {
          input.value = "";
          input.placeholder = initialValue;
        } else {
          input.value = "";
        }
        if (fieldName === "bio" && charCountElement) {
          charCountElement.classList.remove("hidden");
          const initialLength = initialValue.length;
          updateCharCount(initialLength);
        }
        changeButton.classList.add("hidden");
        confirmButton.classList.add("hidden");
        input.focus();
      };
      const disableEditMode = (newValue) => {
        if (fieldName !== "password") {
          initialValue = newValue;
        }
        display.classList.remove("hidden");
        input.classList.add("hidden");
        input.disabled = true;
        if (fieldName === "password") {
          display.innerText = "********";
        } else {
          display.innerText = newValue;
          input.value = "";
          input.placeholder = newValue;
        }
        if (fieldName === "bio" && charCountElement) {
          charCountElement.classList.add("hidden");
        }
        changeButton.classList.remove("hidden");
        confirmButton.classList.add("hidden");
      };
      changeButton.addEventListener("click", enableEditMode);
      input.addEventListener("input", () => {
        const currentValue = input.value;
        let isChanged = false;
        let isValid = true;
        const trimmedValue = currentValue.trim();
        if (fieldName === "bio") {
          updateCharCount(currentValue.length);
          if (currentValue.length > MAX_BIO_LENGTH) {
            isValid = false;
          }
          const initialTrimmedValue = initialValue.trim();
          isChanged = trimmedValue.length > 0 && trimmedValue !== initialTrimmedValue;
        } else if (fieldName === "password") {
          isChanged = currentValue.length > 0;
        } else {
          isChanged = trimmedValue !== initialValue.trim() && trimmedValue.length > 0;
        }
        if (isChanged && isValid) {
          confirmButton.classList.remove("hidden");
        } else {
          confirmButton.classList.add("hidden");
        }
      });
      confirmButton.addEventListener("click", async () => {
        const newValue = input.value.trim();
        let updateSuccessful = false;
        switch (fieldName) {
          case "alias":
            updateSuccessful = await updateUsername(newValue);
            break;
          case "bio":
            updateSuccessful = await updateBio(newValue);
            break;
          case "email":
            updateSuccessful = await updateEmail(newValue);
            break;
          default:
            updateSuccessful = true;
        }
        if (updateSuccessful) {
          disableEditMode(newValue);
        }
      });
      input.addEventListener("blur", (e) => {
        if (e.relatedTarget !== confirmButton) {
          const isConfirmedVisible = !confirmButton.classList.contains("hidden");
          if (isConfirmedVisible) {
            disableEditMode(fieldName === "password" ? display.innerText : initialValue);
          } else {
            disableEditMode(fieldName === "password" ? display.innerText : initialValue);
          }
        }
      });
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          const isConfirmedVisible = !confirmButton.classList.contains("hidden");
          if (isConfirmedVisible) {
            confirmButton.click();
          } else {
            input.blur();
          }
        }
      });
    };
    const updateStatus = async (newStatus) => {
      if (!userId) return;
      try {
        const response = await fetchWithAuth(`api/user/${userId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus })
        });
        if (response.ok) {
          updateStatusFrame(newStatus);
          localStorage.setItem("userStatus", newStatus);
          console.log("Status mis \xE0 jour:", newStatus);
          const username = localStorage.getItem("username");
          SocketService_default.getInstance().socket?.emit("notifyStatusChange", {
            userId: Number(userId),
            status: newStatus,
            username
          });
        } else {
          console.error("Erreur lors de la mise \xE0 jour du status");
          alert("Erreur lors de la sauvegarde du status");
        }
      } catch (error) {
        console.error("Erreur r\xE9seau:", error);
        alert("Erreur lors de la sauvegarde du status");
      }
    };
    statusSelect?.addEventListener("change", () => {
      const selectedValue = statusSelect.value;
      const statusKey = statusMapping[selectedValue];
      if (statusKey) {
        updateStatus(statusKey);
      }
    });
    const pwdModal = document.getElementById("password-modal");
    const closePwdButton = document.getElementById("close-password-modal");
    const cancelPwdButton = document.getElementById("cancel-password-button");
    const savePwdButton = document.getElementById("save-password-button");
    const currentPwdInput = document.getElementById("pwd-current");
    const newPwdInput = document.getElementById("pwd-new");
    const confirmPwdInput = document.getElementById("pwd-confirm");
    const pwdError = document.getElementById("pwd-error");
    const passwordContainer = document.querySelector('div[data-field="password"]');
    const openPwdModalButton = passwordContainer?.querySelector(".change-button");
    const resetPwdForm = () => {
      if (currentPwdInput) currentPwdInput.value = "";
      if (newPwdInput) newPwdInput.value = "";
      if (confirmPwdInput) confirmPwdInput.value = "";
      if (pwdError) {
        pwdError.innerText = "";
        pwdError.classList.add("hidden");
      }
    };
    const closePwdModal = () => {
      pwdModal?.classList.add("hidden");
      pwdModal?.classList.remove("flex");
      resetPwdForm();
    };
    openPwdModalButton?.addEventListener("click", () => {
      pwdModal?.classList.remove("hidden");
      pwdModal?.classList.add("flex");
    });
    closePwdButton?.addEventListener("click", closePwdModal);
    cancelPwdButton?.addEventListener("click", closePwdModal);
    savePwdButton?.addEventListener("click", async () => {
      const oldPass = currentPwdInput.value;
      const newPass = newPwdInput.value;
      const confirmPass = confirmPwdInput.value;
      if (!oldPass || !newPass || !confirmPass) {
        if (pwdError) {
          pwdError.innerText = "All inputs are required.";
          pwdError.classList.remove("hidden");
        }
        return;
      }
      if (newPass !== confirmPass) {
        console.log("newpass: , confirmpass:", newPass, confirmPass);
        if (pwdError) {
          pwdError.innerText = "These are not the same. Try again";
          pwdError.classList.remove("hidden");
        }
        return;
      }
      if (newPass.length < 8) {
        if (pwdError) {
          pwdError.innerText = "Password must be at least 8 characters.";
          pwdError.classList.remove("hidden");
        }
        return;
      }
      try {
        const response = await fetchWithAuth(`api/user/${userId}/password`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ oldPass, newPass, confirmPass })
        });
        const result = await response.json();
        if (response.ok) {
          alert("Password updated successfully!");
          closePwdModal();
        } else {
          if (pwdError) {
            console.log("pwdError");
            pwdError.innerText = result.error?.message || "Error updating password";
            pwdError.classList.remove("hidden");
          }
        }
      } catch (error) {
        console.error("Catched error:", error);
        if (pwdError) {
          pwdError.innerText = "Network error.";
          pwdError.classList.remove("hidden");
        }
      }
    });
    pwdModal?.addEventListener("click", (e) => {
      if (e.target === pwdModal) closePwdModal();
    });
    editButton?.addEventListener("click", openModalFunc);
    closeButton?.addEventListener("click", closeModalFunc);
    cancelButton?.addEventListener("click", () => {
      closeModalFunc();
    });
    modal?.addEventListener("click", (e) => {
      if (e.target === modal) closeModalFunc();
    });
    if (gridContainer) {
      const gridImages = gridContainer.querySelectorAll("img");
      gridImages.forEach((img) => {
        img.addEventListener("click", () => {
          selectedImageSrc = img.src;
          if (previewAvatar) previewAvatar.src = selectedImageSrc;
          gridImages.forEach((i) => i.classList.remove("border-[#0078D7]"));
          img.classList.add("border-[#0078D7]");
        });
      });
    }
    browseButton?.addEventListener("click", () => fileInput?.click());
    fileInput?.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            const result = e.target.result;
            selectedImageSrc = result;
            if (previewAvatar) previewAvatar.src = result;
          }
        };
        reader.readAsDataURL(file);
      }
    });
    deleteButton?.addEventListener("click", () => {
      const defaultAvatar = "/assets/basic/default.png";
      selectedImageSrc = defaultAvatar;
      if (previewAvatar) previewAvatar.src = defaultAvatar;
    });
    okButton?.addEventListener("click", async () => {
      if (!userId) {
        alert("Error: no user found");
        return;
      }
      try {
        console.log("avatar charge");
        const response = await fetchWithAuth(`api/user/${userId}/avatar`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar: selectedImageSrc })
        });
        const result = await response.json();
        if (response.ok) {
          const cleanAvatarUrl = result.data.avatar;
          if (mainAvatar) mainAvatar.src = cleanAvatarUrl;
          SocketService_default.getInstance().socket?.emit("notifyProfileUpdate", {
            userId: Number(userId),
            avatar: cleanAvatarUrl,
            username: localStorage.getItem("username")
            // On renvoie le nom pour identifier
          });
          closeModalFunc();
          console.log("avatar maj:", cleanAvatarUrl);
        } else {
          console.error("Error while updating");
          alert("Error while saving");
        }
      } catch (error) {
        console.error("Network error:", error);
      }
    });
  }

  // scripts/pages/NotFound.ts
  function NotFoundPage() {
    return `
		<div class="p-8 text-center">
			<h1 class="text-6xl font-bold text-red-500 mb-4">
				Not found, try again
			</h1>
			<p class="text-2xl text-gray-300">
				404 not found that's it
			</p>
			<a href="/" class="mt-4 inline-block text-blue-400 hover:underline">
				Go back to the main page
			</a>
			</div>
	`;
  }

  // scripts/pages/LandingPage.html
  var LandingPage_default = `<div class="w-screen h-[200px] bg-cover bg-center bg-no-repeat" style="background-image: url(/assets/basic/background.jpg); background-size: cover;"></div>
	<div class="flex flex-col justify-center items-center gap-6 mt-[-50px]">
		<!-- Picture div -->
		<div class="relative w-[170px] h-[170px] mb-4">
			<!-- le cadre -->
			<img class="absolute inset-0 w-full h-full object-cover" src="/assets/basic/status_frame_offline_large.png">
			<!-- l'image -->
			<img class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[130px] h-[130px] object-cover" src="/assets/basic/default.png">
		</div>
		<h1 class="font-sans text-xl font-normal text-blue-950">
			Welcome to Transcendence
		</h1>
		<!-- Login div -->
		<div class="flex flex-col justify-center items-center gap-6">
			<!-- Bouton de connexion/Register/Guest -->
			<button id="login-button" class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 appearance-none [border-color:rgb(209,213,219)] rounded-sm px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">Login</button>
	 		<button id="register-button" class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 appearance-none [border-color:rgb(209,213,219)] rounded-sm px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">Register</button>
 			<button id="guest-button" class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 appearance-none [border-color:rgb(209,213,219)] rounded-sm px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">Play as guest</button>
	</div>
</div>`;

  // scripts/pages/LandingPage.ts
  function render4() {
    return LandingPage_default;
  }
  function initLandingPage() {
    const loginButton = document.getElementById("login-button");
    const registerButton = document.getElementById("register-button");
    const guestButton = document.getElementById("guest-button");
    const guestError = document.getElementById("guest-error");
    const handleNavigation = (path) => {
      window.history.pushState({}, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    };
    loginButton?.addEventListener("click", () => {
      handleNavigation("/login");
    });
    registerButton?.addEventListener("click", () => {
      handleNavigation("/register");
    });
    guestButton?.addEventListener("click", async () => {
      try {
        const response = await fetch("/api/user/guest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({})
        });
        if (response.ok) {
          const data = await response.json();
          if (data.accessToken) sessionStorage.setItem("accessToken", data.accessToken);
          if (data.userId) sessionStorage.setItem("userId", data.userId.toString());
          sessionStorage.setItem("isGuest", "true");
          sessionStorage.setItem("userRole", "guest");
          try {
            const userResponse = await fetch(`/api/users/${data.userId}`, {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${data.accessToken}`,
                "Content-Type": "application/json"
              }
            });
            if (userResponse.ok) {
              const userData = await userResponse.json();
              if (userData.alias) {
                sessionStorage.setItem("username", userData.alias);
              }
            }
          } catch (fetchErr) {
            console.error("Cannot retrieve guest username", fetchErr);
          }
          handleNavigation("/guest");
        } else {
          console.error("Error: guest creation");
        }
      } catch (err) {
        console.error("Network error while guest login: ", err);
        if (guestError) {
          guestError.textContent = "Network error. Please try again";
          guestError.classList.remove("hidden");
        }
      }
    });
  }

  // scripts/pages/RegisterPage.ts
  function RegisterPage() {
    return `
	<div class="w-screen h-[200px] bg-cover bg-center bg-no-repeat" style="background-image: url(/assets/basic/background.jpg); background-size: cover;"></div>
		<!-- Main div -->
	<div class="flex flex-col justify-center items-center gap-6 mt-[-50px]">
		<!-- Picture div -->
		<div class="relative w-[170px] h-[170px] mb-4">
			<!-- le cadre -->
			<img class="absolute inset-0 w-full h-full object-cover" src="/assets/basic/status_frame_offline_large.png">
			<!-- l'image -->
			<img class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[130px] h-[130px] object-cover" src="/assets/basic/default.png">
		</div>
		<h1 class="font-sans text-xl font-normal text-blue-950">
			Sign up to Transcendence
		</h1>
		<!-- Login div -->
		<div class="flex flex-col justify-center items-center gap-6">
			<div class="border border-gray-300 appearance-none [border-color:rgb(209,213,219)] rounded-sm bg-white w-80 p-4 shadow-sm">
				<!-- Username -->
				<input type="alias" placeholder="faufaudu49" id="alias-input"
					class="w-full border border-gray-300 appearance-none [border-color:rgb(209,213,219)] rounded-sm p-2 text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-blue-400"/>

				<!-- Email -->
				<input type="email" placeholder="Example555@hotmail.com" id="email-input"
					class="w-full border border-gray-300 appearance-none [border-color:rgb(209,213,219)] rounded-sm p-2 text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-blue-400"/>
		
				<!-- Mot de passe -->
				<input type="password" placeholder="Enter your password" id="password-input"
					class="w-full border border-gray-300 appearance-none [border-color:rgb(209,213,219)] rounded-sm p-2 text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-blue-400"/>
				<div class="flex flex-col items-center justify-center">
					<p id="error-message" class="text-red-600 text-sm mb-2 hidden"></p>
				</div>
			</div>
			<!-- Bouton de register -->
			<div class="flex flex-col gap-2 w-48">
				<button id="register-button" class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 appearance-none [border-color:rgb(209,213,219)] rounded-sm px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">Register</button>
			</div>
	</div>
	</div>
	`;
  }
  function handleRegister() {
    const button = document.getElementById("register-button");
    const errorElement = document.getElementById("error-message");
    if (!button) {
      console.error("Can't find register button in DOM");
      return;
    }
    button.addEventListener("click", async () => {
      const email = document.getElementById("email-input").value;
      const password = document.getElementById("password-input").value;
      const alias2 = document.getElementById("alias-input").value;
      if (errorElement) {
        errorElement.classList.add("hidden");
        errorElement.textContent = "";
      }
      if (!alias2 || !password || !email) {
        if (errorElement) {
          errorElement.textContent = "Please fill all inputs";
          errorElement.classList.remove("hidden");
        }
        return;
      }
      try {
        const response = await fetch("/api/user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ alias: alias2, email, password })
        });
        const result = await response.json();
        if (response.ok) {
          sessionStorage.removeItem("isGuest");
          sessionStorage.removeItem("userRole");
          const { accessToken, userId } = result;
          console.log("User ID:", userId);
          console.log("Access Token:", accessToken);
          if (accessToken)
            localStorage.setItem("accessToken", accessToken);
          if (userId)
            localStorage.setItem("userId", userId.toString());
          if (userId) {
            try {
              const userRes = await fetch(`/api/user/${userId}`, {
                headers: { "Authorization": `Bearer ${access_token}` }
              });
              if (userRes.ok) {
                const userData = await userRes.json();
                if (userData.alias) {
                  localStorage.setItem("username", userData.alias);
                }
                if (userData.status) {
                  const statusSaved = userData.status === "online" ? "available" : userData.status;
                  localStorage.setItem("userStatus", statusSaved);
                }
              }
            } catch (err) {
              console.error("Can't get user's profile", err);
            }
          }
          window.history.pushState({}, "", "/home");
          window.dispatchEvent(new PopStateEvent("popstate"));
        } else {
          console.error("Login error:", result.error.message);
          if (errorElement) {
            errorElement.textContent = result.error.message || "Authentication failed";
            errorElement.classList.remove("hidden");
          }
        }
      } catch (error) {
        console.error("Network error:", error);
        if (errorElement) {
          errorElement.textContent = "Network error, please try again REGISTER PAGE";
          errorElement.classList.remove("hidden");
        }
      }
    });
  }
  function registerEvents() {
    handleRegister();
  }

  // scripts/pages/GuestPage.html
  var GuestPage_default = `<div id="wizz-container" class="relative w-full h-[calc(100vh-50px)] overflow-hidden">

    <div id="home-header" class="absolute top-0 left-0 w-full h-[200px] bg-cover bg-center bg-no-repeat"
         style="background-image: url(/assets/basic/background.jpg); background-size: cover;">
    </div>

    <div class="absolute z-10 top-[20px] bottom-0 left-0 right-0 flex flex-col px-10 py-2 gap-2" style="padding-left: 100px; padding-right: 100px; bottom: 100px;">
        
        <div class="flex justify-center items-center flex-1 min-h-0">

            <div class="window w-[500px] min-w-[500px] flex flex-col">
                <div class="title-bar">
                    <div class="title-bar-text">Guest Mode</div>
                    <div class="title-bar-controls">
                        <button aria-label="Minimize"></button>
                        <button aria-label="Maximize"></button>
                        <button aria-label="Close"></button>
                    </div>
                </div>

                <div id="left" class="window-body flex flex-col h-full shrink-0 bg-transparent border border-gray-300 shadow-inner rounded-sm">
                    
                    <div class="bg-white p-8 flex flex-col items-center justify-center gap-6">
                        <div class="flex flex-col items-center">
                            <h1 class="text-2xl font-bold text-blue-900 p-4">Welcome on transcendence</h1>
                            <p class="text-lg text-gray-700 italic text-center border-b border-gray-500 p-4">You are actually playing as a guest. If you want to access any game's feature, you need to register!</p>
                            <p class="text-sm text-gray-500 mt-4">Select a mode to start playing</p>
                        </div>

                        <div class="flex flex-col gap-6 px-10">
                            <button id="local-game" 
                                class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm 
                                    px-4 py-2 text-sm shadow-sm p-2 hover:from-gray-200 hover:to-gray-400 
                                    active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 font-semibold text-gray-700">
                                LOCAL GAME
                            </button>

                            <button id="remote-game" 
                                class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm 
                                    px-4 py-2 text-sm shadow-sm p-2 hover:from-gray-200 hover:to-gray-400 
                                    active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 font-semibold text-gray-700">
                                REMOTE GAME
                            </button>

                            <button id="tournament-game" 
                                class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm 
                                    px-4 py-2 text-sm shadow-sm p-2 hover:from-gray-200 hover:to-gray-400 
                                    active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 font-semibold text-gray-700">
                                TOURNAMENT
                            </button>
                        </div>
                    </div>  
                </div>
            </div>



            <div class="window flex flex-col flex-1 min-w-0"> <div class="title-bar">
                    <div class="title-bar-text">Guest Chat</div>
                </div>
                <div class="window-body flex flex-col flex-1 bg-white p-2">
                    <div id="chat-messages" class="flex-1 overflow-y-auto mb-2 border border-gray-300 p-2"></div>
                    <input type="text" id="chat-input" placeholder="Say hello..." class="w-full border p-1">
                    </div>
            </div>
        </div>
    </div>
</div>`;

  // scripts/pages/GuestPage.ts
  function render5() {
    return GuestPage_default;
  }
  function afterRender3() {
    const localButton = document.getElementById("local-game");
    const remoteButton = document.getElementById("remote-game");
    const tournamentButton = document.getElementById("tournament-game");
    const handleNavigation = (path, state = {}) => {
      window.history.pushState(state, "", path);
      const navEvent = new PopStateEvent("popstate", { state });
      window.dispatchEvent(navEvent);
    };
    if (localButton) {
      localButton.addEventListener("click", () => {
        console.log("Local game starting");
        handleNavigation("/game", { gameMode: "local" });
      });
    } else {
      console.log("Error: Button local-game cannot be found in the DOM");
    }
    if (remoteButton) {
      remoteButton.addEventListener("click", () => {
        console.log("Remote game starting");
        handleNavigation("/game", { gameMode: "remote" });
      });
    } else {
      console.log("Error: Button remote-game cannot be found in the DOM");
    }
    if (tournamentButton) {
      tournamentButton.addEventListener("click", () => {
        console.log("Tournament game starting");
        handleNavigation("/game", { gameMode: "tournament" });
      });
    } else {
      console.log("Error: Button tournament-game cannot be found in the DOM");
    }
    try {
      const guestChat = new Chat();
      guestChat.init();
      guestChat.joinChannel("general_guest");
      guestChat.addSystemMessage("Welcome to Guest Mode. Select a game mode to start chatting with your opponents.");
    } catch (e) {
      console.error("Error charging chat:", e);
    }
  }

  // scripts/pages/LocalGame.html
  var LocalGame_default = '<div id="wizz-container" class="relative w-full h-[calc(100vh-50px)] overflow-hidden">\n\n    <div id="home-header" class="absolute top-0 left-0 w-full h-[200px] bg-cover bg-center bg-no-repeat"\n         style="background-image: url(/assets/basic/background.jpg); background-size: cover;">\n    </div>\n\n    <div class="absolute top-[20px] bottom-0 left-0 right-0 flex flex-col px-10 py-2 gap-2 items-center" style="padding-left: 50px; padding-right: 50px; bottom: 100px; top: 110px;">\n        \n        <div class="flex gap-6 flex-1 min-h-0" style="gap: 60px;">\n\n            <div class="flex flex-col gap-4">\n                \n                <div class="window flex flex-col min-w-0" style="width: 1000px; height: 600px;">\n                    <div class="title-bar">\n                        <div class="title-bar-text">Games</div>\n                        <div class="title-bar-controls">\n                            <button aria-label="Minimize"></button>\n                            <button aria-label="Maximize"></button>\n                            <button aria-label="Close"></button>\n                        </div>\n                    </div>\n\n                    <div id="left" class="relative window-body flex flex-col h-full shrink-0 bg-transparent border border-gray-300 shadow-inner rounded-sm items-center" style="background-color: #E8F4F8;">\n        \n                        <div class="flex flex-row w-full h-[100px] rounded-sm flex-shrink-0 items-center justify-between px-24 bg-gray-50" style="height: 60px; background-color: white;"> \n                            <span id="player-1-name" class="text-3xl font-bold text-gray-800" style="margin-left: 30px;">Player 1</span>\n                            <span id="score-board" class="text-4xl font-bold text-gray-900 absolute left-1/2 transform -translate-x-1/2">0 - 0</span>\n                            <span id="player-2-name" class="text-3xl font-bold text-gray-800" style="margin-right: 30px;">Player 2</span>\n                        </div>\n\n                        <div id="game-canvas-container" class="w-full flex-1 flex items-center justify-center bg-transparent relative" style="border-left: 25px solid white; border-right: 25px solid white; border-bottom: 25px solid white;"></div>\n                        \n                        \n\n                        <div id="game-setup-modal" class="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">\n\n                            <div class="window w-[600px] shadow-xl">\n                                <div class="title-bar">\n                                    <div class="title-bar-text">Start the game</div>\n                                    <div class="title-bar-controls">\n                                        <button aria-label="Close"></button>\n                                    </div>\n                                </div>\n\n                                <div class="window-body flex flex-col gap-4 p-4" style="background-color: white">\n                                    \n                                    <div class="flex flex-col gap-1">\n                                        <label for="opponent-name" class="font-bold">Who are you playing with? :</label>\n                                        <input type="text" id="opponent-name" class="border-2 border-gray-400 px-2 py-1 focus:outline-none focus:border-blue-800" placeholder="Type in a name..." required>\n                                        <span id="error-message" class="text-red-500 text-xs hidden">Please fill in!</span>\n                                    </div>\n\n                                    <fieldset class="border-2 border-gray-300 p-2 mt-2">\n                                        <div class="flex flex-row items-center gap-2 mb-3 relative">\n                                            <label class="text-sm font-semibold">Choose your ball :</label>\n                                            \n                                            <div class="relative">\n                                                <button id="ball-selector-button" class="px-2 py-1 bg-white hover:bg-gray-100 flex items-center justify-center w-[50px] h-[35px]active:border-blue-500 transition-colors">\n                                                    <img id="selected-ball-img" src="/assets/emoticons/smile.gif" class="w-6 h-6 object-contain">\n                                                </button>\n\n                                                <div id="ball-selector-dropdown" class="hidden absolute top-full left-0 mt-1 bg-white border border-gray-300 shadow-xl z-50 max-h-64 overflow-y-auto" style="width: 220px; padding: 8px;">\n                                                    <p class="text-xs text-gray-500 mb-2 border-b pb-1">Select a ball:</p>\n                                                    <div id="ball-grid" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;">\n                                                        </div>\n                                                </div>\n                                            </div>\n\n                                            <input type="hidden" id="ball-value" value="/assets/game/smile.png">\n                                        </div>\n\n                                        <div class="flex flex-row gap-2">\n                                            <label class="text-sm font-semibold">Choose your background :</label>\n                                            \n                                            <div class="relative">\n                                                <button id="bg-selector-button" class="px-2 py-1 bg-white hover:bg-gray-100 flex items-center justify-center w-[50px] h-[35px]active:border-blue-500 transition-colors">\n                                                    <div id="selected-bg-preview" class="w-6 h-6 rounded-full border border-gray-300" style="background-color: #E8F4F8;"></div>\n                                                </button>\n\n                                                <div id="bg-selector-dropdown" class="hidden absolute top-full left-0 mt-1 bg-white border border-gray-300 shadow-xl z-50 max-h-64 overflow-y-auto" style="width: 240px; padding: 8px;">\n                                                    <p class="text-xs text-gray-500 mb-2 border-b pb-1">Select a background:</p>\n                                                    <div id="bg-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">\n                                                    </div>\n                                                    <button id="bg-reset-button" class="w-full text-center text-xs hover:underline mt-2 pt-1 border-t border-gray-100">\n                                                        Reset color\n                                                    </button>\n                                                </div>\n                                            </div>\n\n                                            <input type="hidden" id="bg-value" value="#E8F4F8">\n                                        </div>\n                                    </fieldset>\n\n                                    <div class="flex justify-center mt-4">\n                                        <button id="start-game-btn"\n                                                class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">\n                                            PLAY\n                                        </button>\n                                    </div>\n\n                                </div>\n                            </div>\n                        </div>\n                        \n\n\n                        <div id="countdown-modal" class="hidden absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md">\n                            <div class="window w-[600px] bg-white shadow-2xl border-4 border-yellow-500">\n                                <div class="title-bar bg-yellow-500">\n                                    <div class="title-bar-text text-black">Ready, steady, go!</div>\n                                </div>\n                                <div class="window-body bg-yellow-50 p-8 flex flex-col items-center gap-6 text-center">\n                                    <div class="text-6xl font-bold text-black py-6 px-12 border-4 border-yellow-400 bg-white rounded-xl" style="color:black; font-size: 106px;" id="countdown-text">3</div>                                \n                                </div>\n                            </div>\n                        </div>\n\n\n\n                        <div id="local-summary-modal" class="hidden absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md">\n                            <div class="window w-[600px] bg-white shadow-2xl border-4 border-yellow-500">\n                                <div class="title-bar bg-yellow-500">\n                                    <div class="title-bar-text text-black">End of the game</div>\n                                </div>\n                                <div class="window-body bg-yellow-50 p-8 flex flex-col items-center gap-6 text-center">\n                                    <h1 class="text-4xl font-black text-yellow-600 uppercase tracking-widest">CONGRATULATIONS</h1>\n                                    <div class="text-6xl font-bold text-gray-800 py-6 px-12 border-4 border-yellow-400 bg-white rounded-xl" id="winner-name">NAME</div>                                \n                                    <button id="quit-local-btn" class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm \n                                                            px-6 py-4 text-base font-semibold shadow-sm hover:from-gray-200 hover:to-gray-400 \n                                                            active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400\n                                                            transition-all duration-200 hover:shadow-md" style="width: 200px; padding: 4px;">\n                                        Return to Menu\n                                    </button>\n                                </div>\n                            </div>\n                        </div>\n                        \n                    </div>\n                </div>\n            </div>\n\n            <div class="window flex flex-col w-[300px] min-w-[300px]" style="width: 400px; height: 600px;">\n				<div class="title-bar">\n					<div class="title-bar-text">Notifications</div>\n					<div class="title-bar-controls">\n						<button aria-label="Minimize"></button>\n						<button aria-label="Maximize"></button>\n						<button aria-label="Close"></button>\n					</div>\n				</div>\n\n				<div id="right" class="window-body flex flex-row gap-4 flex-1 min-w-0">\n					<div id="channel-chat" class="flex flex-col bg-white border border-gray-300 rounded-sm shadow-sm p-4 flex-1 relative z-10 min-h-0 h-full">\n							\n						<div class="flex items-center justify-between border-b border-gray-200 pb-2 mb-2 relative">\n							<p>System notification</p>\n						</div>\n\n						<div id="chat-messages" class="flex-1 h-0 overflow-y-auto min-h-0 pt-2 space-y-2 text-sm"></div>\n\n						<div class="flex flex-col">\n							<input id="chat-input" placeholder="You cannot speak to the system" class="mt-3 bg-gray-100 rounded-sm p-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm" readonly>\n					</div>\n				</div>\n			</div> \n        </div>\n    </div>\n</div>';

  // scripts/pages/RemoteGame.html
  var RemoteGame_default = `<div id="wizz-container" class="relative w-full h-[calc(100vh-50px)] overflow-hidden">

    <div id="home-header" class="absolute top-0 left-0 w-full h-[200px] bg-cover bg-center bg-no-repeat"
         style="background-image: url(/assets/basic/background.jpg); background-size: cover;">
    </div>

    <div class="absolute top-[20px] bottom-0 left-0 right-0 flex flex-col px-10 py-2 gap-2 items-center" style="padding-left: 50px; padding-right: 50px; bottom: 100px; top: 110px;">
        
        <div class="flex gap-6 flex-1 min-h-0" style="gap: 60px;">

            <div class="window flex flex-col min-w-0" style="width: 1000px; height: 600px;">
                <div class="title-bar">
                    <div class="title-bar-text">Games</div>
                    <div class="title-bar-controls">
                        <button aria-label="Minimize"></button>
                        <button aria-label="Maximize"></button>
                        <button aria-label="Close"></button>
                    </div>
                </div>

                <div id="left" class="relative window-body flex flex-col h-full shrink-0 bg-transparent border border-gray-300 shadow-inner rounded-sm" style="background-color: #E8F4F8;">
    
                    <div class="flex flex-row w-full h-[100px] rounded-sm flex-shrink-0 items-center justify-between px-24 bg-gray-50" style="height: 60px; background-color: white;"> 
                        <span id="player-1-name" class="text-3xl font-bold text-gray-800" style="margin-left: 30px;">Player 1</span>
                        <span id="score-board" class="text-4xl font-bold text-gray-900 absolute left-1/2 transform -translate-x-1/2">0 - 0</span>
                        <span id="player-2-name" class="text-3xl font-bold text-gray-800" style="margin-right: 30px;">Player 2</span>
                    </div>

                    <div id="game-canvas-container" class="w-full flex-1 flex items-center justify-center bg-transparent relative" style="border-left: 25px solid white; border-right: 25px solid white; border-bottom: 25px solid white;"></div>
                    
                    
                    
                    
                    <div id="game-setup-modal" class="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div class="window w-[600px] shadow-xl">
                            <div class="title-bar">
                                <div class="title-bar-text">Start the game</div>
                                <div class="title-bar-controls">
                                    <button aria-label="Close"></button>
                                </div>
                            </div>

                            <div class="window-body flex flex-col gap-4 p-4" style="background-color: white">
  
                                <fieldset class="border-2 border-gray-300 p-2 mt-2">
                                    <div class="flex flex-row items-center gap-2 mb-3 relative">
                                        <label class="text-sm font-semibold">Choose your ball :</label>
                                        
                                        <div class="relative">
                                            <button id="ball-selector-button" class="px-2 py-1 bg-white hover:bg-gray-100 flex items-center justify-center w-[50px] h-[35px]active:border-blue-500 transition-colors">
                                                <img id="selected-ball-img" src="/assets/emoticons/smile.gif" class="w-6 h-6 object-contain">
                                            </button>

                                            <div id="ball-selector-dropdown" class="hidden absolute top-full left-0 mt-1 bg-white border border-gray-300 shadow-xl z-50 max-h-64 overflow-y-auto" style="width: 220px; padding: 8px;">
                                                <p class="text-xs text-gray-500 mb-2 border-b pb-1">Select a ball:</p>
                                                <div id="ball-grid" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;">
                                                    </div>
                                            </div>
                                        </div>

                                        <input type="hidden" id="ball-value" value="/assets/game/smile.png">
                                    </div>

                                    <div class="flex flex-row gap-2">
                                        <label class="text-sm font-semibold">Choose your background :</label>
                                        
                                        <div class="relative">
                                            <button id="bg-selector-button" class="px-2 py-1 bg-white hover:bg-gray-100 flex items-center justify-center w-[50px] h-[35px]active:border-blue-500 transition-colors">
                                                <div id="selected-bg-preview" class="w-6 h-6 rounded-full border border-gray-300" style="background-color: #E8F4F8;"></div>
                                            </button>

                                            <div id="bg-selector-dropdown" class="hidden absolute top-full left-0 mt-1 bg-white border border-gray-300 shadow-xl z-50 max-h-64 overflow-y-auto" style="width: 240px; padding: 8px;">
                                                <p class="text-xs text-gray-500 mb-2 border-b pb-1">Select a background:</p>
                                                <div id="bg-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
                                                </div>
                                                <button id="bg-reset-button" class="w-full text-center text-xs hover:underline mt-2 pt-1 border-t border-gray-100">
                                                    Reset color
                                                </button>
                                            </div>
                                        </div>

                                        <input type="hidden" id="bg-value" value="#E8F4F8">
                                    </div>
                                </fieldset>

                                <div class="flex justify-center mt-4">
                                    <button id="start-game-btn"
                                            class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">
                                        PLAY (QUEUE)
                                    </button>
                                </div>
                                <div class="text-center text-xs text-gray-500" id="queue-status"></div>

                            </div>
                        </div>
                    </div>




					<div id="countdown-modal" class="hidden absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md">
                        <div class="window w-[600px] bg-white shadow-2xl border-4 border-yellow-500">
                            <div class="title-bar bg-yellow-500">
                                <div class="title-bar-text text-black">Ready, steady, go!</div>
                            </div>
                            <div class="window-body bg-yellow-50 p-8 flex flex-col items-center gap-6 text-center">
                                <div class="text-6xl font-bold text-black py-6 px-12 border-4 border-yellow-400 bg-white rounded-xl" style="color:black; font-size: 106px;" id="countdown-text">3</div>                                
                            </div>
                        </div>
                    </div>


					<div id="local-summary-modal" class="hidden absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md">
                        <div class="window w-[600px] bg-white shadow-2xl border-4 border-yellow-500">
                            <div class="title-bar bg-yellow-500">
                                <div class="title-bar-text text-black">End of the game</div>
                            </div>
                            <div class="window-body bg-yellow-50 p-8 flex flex-col items-center gap-6 text-center">
                                <h1 class="text-4xl font-black text-yellow-600 uppercase tracking-widest">CONGRATULATIONS</h1>
                                <div class="text-6xl font-bold text-gray-800 py-6 px-12 border-4 border-yellow-400 bg-white rounded-xl" id="winner-name">???</div>                                
                                <button id="quit-remote-btn" class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm 
                                                        px-6 py-4 text-base font-semibold shadow-sm hover:from-gray-200 hover:to-gray-400 
                                                        active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400
                                                        transition-all duration-200 hover:shadow-md" style="width: 200px; padding: 4px;">
                                    Return to Menu
                                </button>
                            </div>
                        </div>
                    </div>





                </div>
            </div>

            <div class="window flex flex-col w-[300px] min-w-[300px]" style="width: 400px; height: 600px;">
				<div class="title-bar">
					<div class="title-bar-text">Game chat</div>
					<div class="title-bar-controls">
						<button aria-label="Minimize"></button>
						<button aria-label="Maximize"></button>
						<button aria-label="Close"></button>
					</div>
				</div>

				<div id="right" class="window-body flex flex-row gap-4 flex-1 min-w-0">
					<div id="chat-frame" class="relative flex-1 p-10 bg-gradient-to-b from-blue-50 to-gray-400 rounded-sm flex flex-row items-end bg-cover bg-center transition-all duration-300 min-h-0">
						<div id="channel-chat" class="flex flex-col bg-white border border-gray-300 rounded-sm shadow-sm p-4 flex-1 relative z-10 min-h-0 h-full">
								
							<div class="flex items-center justify-between border-b border-gray-200 pb-2 mb-2 relative">
								<p>Chat room</p>
								<div class="relative self-start mt-2">
									<button id="chat-options-button" class="p-1 hover:bg-gray-100 rounded-full transition duration-200 cursor-pointer">
										<img src="/assets/chat/meatball.png"
											 alt="options"
											 class="w-6 h-6 object-contain"
											 style="width: 15px; height: 15px; vertical-align: -25px;">
									</button>
	
									<div id="chat-options-dropdown" class="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded-md shadow-xl z-50 hidden overflow-hidden p-2" style="width: 200px">
		
										<div class="flex flex-row items-center gap-4 px-3 py-3 hover:bg-blue-50 transition cursor-pointer rounded">
											<div class="w-6 h-6 flex items-center justify-center flex-shrink-0">
													<img src="/assets/basic/view_profile.png" 
													class="w-6 h-6 object-cover rounded"
													alt="avatar">
											</div>
											<button id="button-view-profile" class="text-left text-sm text-gray-700 flex-1">
												View profile
											</button>
										</div>
	
										<div class="flex flex-row items-center gap-4 px-3 py-3 hover:bg-blue-50 transition cursor-pointer rounded">
											<div class="w-6 h-6 flex items-center justify-center flex-shrink-0">
												<img src="/assets/basic/game_notification.png" 
													class="w-6 h-6 object-cover rounded"
													alt="avatar">
											</div>
											<button id="button-invite-game" class="text-left text-sm text-gray-700 flex-1">
												Invite to play
											</button>
										</div>
	
										<div class="flex flex-row items-center gap-4 px-3 py-3 hover:bg-blue-50 transition cursor-pointer rounded">
											<div class="w-6 h-6 flex items-center justify-center flex-shrink-0">
												<img src="/assets/basic/block.png" 
													class="w-6 h-6 object-cover rounded"
													alt="avatar">
											</div>
											<button id="button-block-user" class="text-left text-sm text-gray-700 flex-1">
												Block user
											</button>
										</div>
	
									</div>
	
								</div>
							</div>
	
							<div id="chat-messages" class="flex-1 h-0 overflow-y-auto min-h-0 pt-2 space-y-2 text-sm"></div>
	
							<div class="flex flex-col">
								<input type="text" id="chat-input" placeholder="Type in your message" class="mt-3 bg-gray-100 rounded-sm p-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm">
								<div class="flex border-x border-b rounded-b-[4px] border-[#bdd5df] items-center pl-1" style="background-image: url(&quot;/assets/chat/chat_icons_background.png&quot;);">
									<button id="select-emoticon" class="h-6">
										<div class="relative flex items-center aerobutton p-0.7 h-5 border border-transparent rounded-sm hover:border-gray-300">
											<div class="w-5"><img src="/assets/chat/select_emoticon.png" alt="Select Emoticon"></div>
											<div><img src="/assets/chat/arrow.png" alt="Select arrow"></div>
	
											<div id="emoticon-dropdown" class="absolute z-10 hidden bottom-full left-0 mb-1 w-72 p-2 bg-white border border-gray-300 rounded-md shadow-xl">
												<div class="grid grid-cols-8 gap-1" id="emoticon-grid"></div>
											</div>
										</div>
									</button>
	
									<button id="select-animation" class="h-6">
										<div class="relative flex items-center aerobutton p-0.7 h-5 border border-transparent rounded-sm hover:border-gray-300">
											<div class="w-5"><img src="/assets/chat/select_wink.png" alt="Select Animation"></div>
											<div><img src="/assets/chat/arrow.png" alt="Select arrow"></div>
	
											<div id="animation-dropdown" class="absolute z-10 hidden bottom-full left-0 mb-1 w-72 p-2 bg-white border border-gray-300 rounded-md shadow-xl">
												<div class="grid grid-cols-8 gap-1" id="animation-grid"></div>
											</div>
										</div>
									</button>
	
									<div class="absolute top-0 left-0 flex w-full h-full justify-center items-center pointer-events-none"><div></div></div>
									<button id="send-wizz" class="flex items-center aerobutton p-1 h-6 border border-transparent rounded-sm hover:border-gray-300"><div><img src="/assets/chat/wizz.png" alt="Sending wizz"></div></button>
									<div class="px-2"><img src="/assets/chat/chat_icons_separator.png" alt="Icons separator"></div>
	
									<button id="change-font" class="h-6">
										<div class="relative flex items-center aerobutton p-0.7 h-5 border border-transparent rounded-sm hover:border-gray-300">
										<div class="w-5"><img src="/assets/chat/change_font.png" alt="Change font"></div>
										<div><img src="/assets/chat/arrow.png" alt="Select arrow"></div>
	
										<div id="font-dropdown" class="absolute z-10 hidden bottom-full left-0 mb-1 w-auto p-1 bg-white border border-gray-300 rounded-md shadow-xl">
											<div class="grid grid-cols-4 gap-[2px] w-[102px]" id="font-grid"></div>
										</div>
	
										</div>
									</button>
	
									<div class="relative">
									<button id="select-background" class="flex items-center aerobutton p-1 h-6 border border-transparent rounded-sm hover:border-gray-300">
										<div class="w-5"><img src="/assets/chat/select_background.png" alt="Background"></div>
										<div><img src="/assets/chat/arrow.png" alt="Arrow"></div>
									</button>
	
									<div id="background-dropdown" class="absolute hidden bottom-full right-0 mb-1 w-64 p-2 bg-white border border-gray-300 rounded-md shadow-xl z-50">
										<p class="text-xs text-gray-500 mb-2 pl-1">Choose a background:</p>
													
										<div class="grid grid-cols-3 gap-2">
															
											<button class="bg-option w-full h-12 border border-gray-200 hover:border-blue-400 rounded bg-cover bg-center" 
													data-bg="url('/assets/backgrounds/fish_background.jpg')"
													style="background-image: url('/assets/backgrounds/fish_background.jpg');">
											</button>
	
											<button class="bg-option w-full h-12 border border-gray-200 hover:border-blue-400 rounded bg-cover bg-center" 
													data-bg="url('/assets/backgrounds/heart_background.jpg')"
													style="background-image: url('/assets/backgrounds/heart_background.jpg');">
											</button>
	
											<button class="bg-option w-full h-12 border border-gray-200 hover:border-blue-400 rounded bg-cover bg-center" 
													data-bg="url('/assets/backgrounds/lavender_background.jpg')"
													style="background-image: url('/assets/backgrounds/lavender_background.jpg');">
											</button>
	
											<button class="bg-option col-span-3 text-xs text-red-500 hover:underline mt-1" data-bg="none">
												Default background
											</button>
										</div>
									</div>
								</div>
						</div>
					</div>
				</div>
			</div> 
        </div>
    </div>
</div>`;

  // scripts/pages/TournamentPage.html
  var TournamentPage_default = '<div id="wizz-container" class="relative w-full h-[calc(100vh-50px)] overflow-hidden">\n\n    <div id="home-header" class="absolute top-0 left-0 w-full h-[200px] bg-cover bg-center bg-no-repeat"\n         style="background-image: url(/assets/basic/background.jpg); background-size: cover;">\n    </div>\n\n    <div class="absolute top-[20px] bottom-0 left-0 right-0 flex flex-col px-10 py-2 gap-2 items-center" style="padding-left: 50px; padding-right: 50px; bottom: 100px; top: 110px;">\n        \n        <div class="flex gap-6 flex-1 min-h-0" style="gap: 60px;">\n\n            <div class="window flex flex-col min-w-0" style="width: 1000px; height: 600px;">\n                <div class="title-bar">\n                    <div class="title-bar-text">Tournament Arena</div>\n                    <div class="title-bar-controls">\n                        <button aria-label="Minimize"></button>\n                        <button aria-label="Maximize"></button>\n                        <button aria-label="Close"></button>\n                    </div>\n                </div>\n\n                <div id="left" class="relative window-body flex flex-col h-full shrink-0 bg-transparent border border-gray-300 shadow-inner rounded-sm" style="background-color: #E8F4F8;">\n    \n                    <div class="flex flex-row w-full h-[100px] rounded-sm flex-shrink-0 items-center justify-between px-24 bg-gray-50" style="height: 60px; background-color: white;"> \n                        <span id="player-1-name" class="text-3xl font-bold text-gray-800" style="margin-left: 30px;">Player 1</span>\n                        <span id="score-board" class="text-4xl font-bold text-gray-900 absolute left-1/2 transform -translate-x-1/2">0 - 0</span>\n                        <span id="player-2-name" class="text-3xl font-bold text-gray-800" style="margin-right: 30px;">Player 2</span>\n                    </div>\n\n                    <div id="game-canvas-container" class="w-full flex-1 flex items-center justify-center bg-transparent relative" style="border-left: 25px solid white; border-right: 25px solid white; border-bottom: 25px solid white;"></div>\n                    \n\n                    <div id="tournament-setup-modal" class="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">\n                        <div class="window w-[600px] bg-white shadow-xl">\n                            <div class="title-bar">\n                                <div class="title-bar-text">Tournament setup</div>\n                            </div>\n                            <div class="window-body flex flex-col gap-4 p-6 bg-white">\n                                <h2 class="text-xl font-bold text-center mb-4 text-gray-800">Create a new tournament</h2>\n                                \n                                <div class="flex flex-col gap-1">\n                                    <label class="font-bold text-sm">Tournament name:</label>\n                                    <input type="text" id="tournament-name-input" class="border border-gray-200 px-2 py-1 focus:outline-none focus:border-blue-600" placeholder="T00urN\xD4\xEE\xEF d33s b0ggggg0\xF4\xF4ssss">\n                                </div>\n\n                                <fieldset class="border-2 border-gray-300 p-5 rounded bg-gray-50">\n                                    <legend class="text-sm font-semibold px-1 text-blue-800" style="padding-bottom: 5px;">Participants</legend>\n                                    <div class="grid grid-cols-2 gap-4">\n                                        <div>\n                                            <label class="text-xs font-bold">Player 1 (You):</label>\n                                            <input id="player1-input" class="w-full border p-1 bg-gray-200 cursor-not-allowed" readonly>\n                                        </div>\n                                        <div>\n                                            <label class="text-xs font-bold">Player 2:</label>\n                                            <input type="text" id="player2-input" class="w-full border p-1 focus:border-blue-500 outline-none" placeholder="Player 2">\n                                        </div>\n                                        <div>\n                                            <label class="text-xs font-bold">Player 3:</label>\n                                            <input type="text" id="player3-input" class="w-full border p-1 focus:border-blue-500 outline-none" placeholder="Player 3">\n                                        </div>\n                                        <div>\n                                            <label class="text-xs font-bold">Player 4:</label>\n                                            <input type="text" id="player4-input" class="w-full border p-1 focus:border-blue-500 outline-none" placeholder="Player 4">\n                                        </div>\n                                    </div>\n                                </fieldset>\n\n                                <fieldset class="border-2 border-gray-300 p-2 bg-gray-50">\n                                    <legend class="text-sm font-semibold px-1 text-blue-800">Game Settings</legend>\n                                    <div class="flex flex-row items-center gap-8 justify-center">\n                                        <div class="flex flex-row items-center gap-2 relative">\n                                            <label class="text-sm font-semibold">Ball :</label>\n                                            <div class="relative">\n                                                <button id="tour-ball-selector-button" class="px-2 py-1 bg-white hover:bg-gray-100 flex items-center justify-center w-[50px] h-[35px]">\n                                                    <img id="tour-selected-ball-img" src="/assets/emoticons/smile.gif" class="w-6 h-6 object-contain">\n                                                </button>\n                                                <div id="tour-ball-selector-dropdown" class="hidden absolute top-full left-0 mt-1 bg-white border border-gray-300 shadow-xl z-50 max-h-64 overflow-y-auto w-[250px] p-2" style="width: 200px;">\n                                                    <div id="tour-ball-grid" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;"></div>\n                                                </div>\n                                            </div>\n                                            <input type="hidden" id="tour-ball-value" value="/assets/game/smile.png">\n                                        </div>\n                                        <div class="flex flex-row items-center gap-2 relative">\n                                            <label class="text-sm font-semibold">Background :</label>\n                                            <div class="relative">\n                                                <button id="tour-bg-selector-button" class="px-2 py-1 bg-white hover:bg-gray-100 flex items-center justify-center w-[50px] h-[35px]">\n                                                    <div id="tour-selected-bg-preview" class="w-6 h-6 rounded-full border border-gray-300" style="background-color: #E8F4F8;"></div>\n                                                </button>\n                                                <div id="tour-bg-selector-dropdown" class="hidden absolute top-full left-0 mt-1 bg-white border border-gray-300 shadow-xl z-50 max-h-64 overflow-y-auto" style="width: 240px; padding: 8px;">\n                                                <p class="text-xs text-gray-500 mb-2 border-b pb-1">Select a background:</p>\n                                                <div id="tour-bg-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">\n                                                </div>\n                                                <button id="bg-reset-button" class="w-full text-center text-xs hover:underline mt-2 pt-1 border-t border-gray-100">\n                                                    Reset color\n                                                </button>\n                                            </div>\n                                            </div>\n                                            <input type="hidden" id="tour-bg-value" value="#E8F4F8">\n                                        </div>\n                                    </div>\n                                </fieldset>\n\n                                <div id="setup-error" class="text-red-500 text-sm font-bold text-center hidden"></div>\n\n                                <button id="start-tournament-btn" class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm \n                                                        px-6 py-4 text-base font-semibold shadow-sm hover:from-gray-200 hover:to-gray-400 \n                                                        active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400\n                                                        transition-all duration-200 hover:shadow-md" style="width: 200px; padding: 4px;">\n                                    START TOURNAMENT\n                                </button>\n                            </div>\n                        </div>\n                    </div>\n\n                    <div id="tournament-bracket-modal" class="hidden absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">\n                        <div class="window w-[1000px] bg-white shadow-2xl" style="width: 500px;">\n                            <div class="title-bar">\n                                <div class="title-bar-text">Tournament</div>\n                            </div>\n\n                            <div class="window-body bg-gray-50 p-8 flex flex-col items-center gap-6">\n                                <h2 class="text-2xl font-semibold font-black text-blue-900 tracking-wide">\n                                    TOURNAMENT IS ABOUT TO START\n                                </h2>\n\n                                <div class="flex flex-col gap-6 w-full items-center">\n\n                                    <!-- SEMI FINALS -->\n                                    <div class="flex flex-row justify-between w-full px-8">\n                                        <div class="flex flex-col items-center bg-white p-4 border border-gray-300 rounded-lg w-[220px] shadow-sm" style="width: 200px;">\n                                            <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">\n                                                Semi-Final 1\n                                            </span>\n                                            <span id="bracket-sf1" class="match-display"></span>\n                                        </div>\n\n                                        <div class="flex flex-col items-center bg-white p-4 border border-gray-300 rounded-lg w-[220px] shadow-sm" style="width: 200px;">\n                                            <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">\n                                                Semi-Final 2\n                                            </span>\n                                            <span id="bracket-sf2" class="match-display"></span>\n                                        </div>\n                                    </div>\n\n                                    <!-- FINAL -->\n                                    <div class="flex flex-col items-center bg-yellow-50 p-6 border-2 border-yellow-400 rounded-xl w-[320px] shadow-lg">\n                                        <span class="text-xs font-bold text-yellow-600 uppercase tracking-widest">\n                                            Final\n                                        </span>\n                                        <span id="bracket-final" class="match-display final-match"></span>\n                                    </div>\n\n                                </div>\n\n                                <div class="w-full border-t border-gray-300 my-2"></div>\n\n                                <p id="bracket-status-msg" class="text-gray-600 italic">\n                                    Ready for the next match...\n                                </p>\n\n                                <button\n                                    id="bracket-continue-btn"\n                                    class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm \n                                                        px-6 py-4 text-base font-semibold shadow-sm hover:from-gray-200 hover:to-gray-400 \n                                                        active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400\n                                                        transition-all duration-200 hover:shadow-md" style="width: 200px; padding: 4px;">\n                                    CONTINUE TO MATCH\n                                </button>\n                            </div>\n                        </div>\n                    </div>\n\n\n\n\n\n                    <div id="tournament-next-match-modal" class="hidden absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-lg">\n                        <div class="window w-[700px] bg-white shadow-2xl animate-bounce-in">\n                            <div class="title-bar bg-blue-800">\n                                <div class="title-bar-text text-white">Next match</div>\n                            </div>\n                            <div class="window-body bg-gray-100 p-10 flex flex-col items-center gap-12">\n                                <h2 class="text-3xl font-black text-blue-900 text-center" id="match-title" style="padding-bottom: 20px;">SEMI-FINAL 1</h2>\n                                \n                                <div class="flex flex-col items-center justify-center gap-6 bg-white p-6 rounded-lg shadow-inner border border-gray-300 w-full">\n                                    <div class="text-4xl font-bold text-gray-800 text-center truncate w-full leading-relaxed" id="next-p1">Player A</div>\n                                    <div class="text-3xl font-black text-red-600 italic leading-relaxed">VS</div>\n                                    <div class="text-4xl font-bold text-gray-800 text-center truncate w-full leading-relaxed" id="next-p2">Player B</div>\n                                </div>\n\n                                <p class="text-gray-500 text-sm text-center" style="padding-top: 20px; padding-bottom: 20px;">The game will start as soon as you click Play.</p>\n\n                                <button id="launch-match-btn" class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm \n                                                        px-6 py-4 text-base font-semibold shadow-sm hover:from-gray-200 hover:to-gray-400 \n                                                        active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400\n                                                        transition-all duration-200 hover:shadow-md" style="width: 200px; padding: 4px;">\n                                    PLAY !\n                                </button>\n                            </div>\n                        </div>\n                    </div>\n\n                    <div id="tournament-summary-modal" class="hidden absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md">\n                        <div class="window w-[600px] bg-white shadow-2xl border-4 border-yellow-500">\n                            <div class="title-bar bg-yellow-500">\n                                <div class="title-bar-text text-black">End of the tournament</div>\n                            </div>\n                            <div class="window-body bg-yellow-50 p-8 flex flex-col items-center gap-6 text-center">\n                                <h1 class="text-4xl font-black text-yellow-600 uppercase tracking-widest">CONGRATULATIONS</h1>\n                                <div class="text-6xl font-bold text-gray-800 py-6 px-12 border-4 border-yellow-400 bg-white rounded-xl" id="winner-name">NAME</div>                                \n                                <button id="quit-tournament-btn" class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm \n                                                        px-6 py-4 text-base font-semibold shadow-sm hover:from-gray-200 hover:to-gray-400 \n                                                        active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400\n                                                        transition-all duration-200 hover:shadow-md" style="width: 200px; padding: 4px;">\n                                    Return to Menu\n                                </button>\n                            </div>\n                        </div>\n                    </div>\n\n\n\n\n                </div>\n            </div>\n\n            <div class="window flex flex-col w-[300px] min-w-[300px]" style="width: 400px; height: 600px;">\n				<div class="title-bar">\n					<div class="title-bar-text">Notifications</div>\n					<div class="title-bar-controls">\n						<button aria-label="Minimize"></button>\n						<button aria-label="Maximize"></button>\n						<button aria-label="Close"></button>\n					</div>\n				</div>\n\n				<div id="right" class="window-body flex flex-row gap-4 flex-1 min-w-0">\n					<div id="channel-chat" class="flex flex-col bg-white border border-gray-300 rounded-sm shadow-sm p-4 flex-1 relative z-10 min-h-0 h-full">\n						<div class="flex items-center justify-between border-b border-gray-200 pb-2 mb-2 relative">\n							<p>System notification</p>\n						</div>\n						<div id="chat-messages" class="flex-1 h-0 overflow-y-auto min-h-0 pt-2 space-y-2 text-sm"></div>\n						<div class="flex flex-col">\n							<input id="chat-input" placeholder="You cannot speak to the system" class="mt-3 bg-gray-100 rounded-sm p-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm" readonly>\n					    </div>\n				    </div>\n			    </div> \n            </div>\n        </div>\n    </div>\n</div>';

  // scripts/game/Paddle.ts
  var Paddle = class {
    constructor(x, y, imageSrc = "/assets/basic/block.png") {
      this.image = null;
      this.x = x;
      this.y = y;
      this.width = 10;
      this.height = 100;
      this.speed = 5;
      this.color = "white";
      if (imageSrc) {
        this.image = new Image();
        this.image.src = imageSrc;
      }
    }
    move(up) {
      if (up) {
        this.y -= this.speed;
      } else {
        this.y += this.speed;
      }
    }
    draw(ctx) {
      if (this.image && this.image.complete && this.image.naturalWidth !== 0) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
      } else {
        ctx.fillStyle = "white";
        ctx.fillRect(this.x, this.y, this.width, this.height);
      }
    }
    reset(canvasHeight) {
      this.y = canvasHeight / 2 - this.height / 2;
    }
  };
  var Paddle_default = Paddle;

  // scripts/game/Ball.ts
  var Ball = class {
    constructor(x, y, imageSrc) {
      this.image = null;
      this.x = x;
      this.y = y;
      this.radius = 10;
      this.speed = 5;
      this.velocityX = 5;
      this.velocityY = 5;
      if (imageSrc && imageSrc !== "classic") {
        this.image = new Image();
        this.image.src = imageSrc;
      }
    }
    update(canvas) {
      this.x += this.velocityX;
      this.y += this.velocityY;
      if (this.y + this.radius > canvas.height || this.y - this.radius < 0) {
        this.velocityY = -this.velocityY;
      }
    }
    draw(ctx) {
      if (this.image && this.image.complete && this.image.naturalWidth !== 0) {
        ctx.drawImage(
          this.image,
          this.x - this.radius * 1.5,
          this.y - this.radius * 1.5,
          this.radius * 3,
          this.radius * 3
        );
      } else {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.closePath();
      }
    }
    reset(canvas, direction = 1) {
      this.x = canvas.width / 2;
      this.y = canvas.height / 2;
      this.velocityX = 5 * direction;
      this.velocityY = 5;
    }
  };
  var Ball_default = Ball;

  // scripts/game/Game.ts
  var Game = class {
    // --------------------
    constructor(canvas, ctx, input, ballImageSrc) {
      // --- REMOTE PROPS ---
      this.isRemote = false;
      this.roomId = null;
      this.playerRole = null;
      this.socket = null;
      this.canvas = canvas;
      this.ctx = ctx;
      this.input = input;
      this.score = { player1: 0, player2: 0 };
      const paddleImg = "/assets/basic/paddle.png";
      this.paddle1 = new Paddle_default(30, canvas.height / 2 - 50, paddleImg);
      this.paddle2 = new Paddle_default(canvas.width - 40, canvas.height / 2 - 50, paddleImg);
      this.ball = new Ball_default(canvas.width / 2, canvas.height / 2, ballImageSrc);
      this.isRunning = false;
    }
    stop() {
      this.isRunning = false;
      if (this.socket) {
        this.socket.off("gameState");
        this.socket.off("gameEnded");
      }
    }
    pause() {
      this.isRunning = false;
    }
    resume() {
      if (!this.isRunning) {
        this.isRunning = true;
        console.log("gameloop");
        this.gameLoop();
      }
    }
    // Fonction pour démarrer le jeu en remote
    startRemote(roomId, role) {
      console.log("startRemote");
      this.isRemote = true;
      this.roomId = roomId;
      this.playerRole = role;
      const socketService = SocketService_default.getInstance();
      socketService.connectGame();
      this.socket = socketService.getGameSocket();
      if (!this.socket) {
        console.error("Cannot start remote game: No socket connection");
        return;
      }
      this.socket.off("gameState");
      this.socket.off("gameEnded");
      console.log(`Starting Remote Game in room ${roomId} as ${role}`);
      this.socket.on("gameState", (data) => {
        this.updateFromRemote(data);
      });
      this.socket.on("gameEnded", (data) => {
        this.isRunning = false;
        if (this.onGameEnd) {
          this.onGameEnd(data);
        } else {
          alert(`Game Over! Final Score: ${data.finalScore.player1} - ${data.finalScore.player2}`);
        }
        this.socket.off("gameState");
        this.socket.off("gameEnded");
      });
      this.isRunning = true;
      this.gameLoop();
    }
    start() {
      this.isRunning = true;
      this.gameLoop();
    }
    gameLoop() {
      if (this.isRunning) {
        this.update(this.canvas);
        this.render();
        requestAnimationFrame(() => this.gameLoop());
      }
    }
    update(canvas) {
      const inputState = this.input.getInput();
      if (this.isRemote && this.socket && this.roomId) {
        const up = (this.playerRole === "player1" ? inputState.player1.up : inputState.player2.up) || inputState.player1.up;
        const down = (this.playerRole === "player1" ? inputState.player1.down : inputState.player2.down) || inputState.player1.down;
        this.socket.emit("gameInput", {
          roomId: this.roomId,
          up,
          down
        });
        return;
      }
      if (inputState.player1.up) {
        this.paddle1.move(true);
      }
      if (inputState.player1.down) {
        this.paddle1.move(false);
      }
      if (inputState.player2.up) {
        this.paddle2.move(true);
      }
      if (inputState.player2.down) {
        this.paddle2.move(false);
      }
      if (this.paddle1.y < 0) this.paddle1.y = 0;
      if (this.paddle1.y + this.paddle1.height > canvas.height) this.paddle1.y = canvas.height - this.paddle1.height;
      if (this.paddle2.y < 0) this.paddle2.y = 0;
      if (this.paddle2.y + this.paddle2.height > canvas.height) this.paddle2.y = canvas.height - this.paddle2.height;
      this.ball.update(canvas);
      this.checkCollisions();
    }
    // Nouvelle fonction pour mettre à jour l'état visuel depuis le serveur
    updateFromRemote(data) {
      const SERVER_WIDTH = 800;
      const SERVER_HEIGHT = 600;
      const scaleX = this.canvas.width / SERVER_WIDTH;
      const scaleY = this.canvas.height / SERVER_HEIGHT;
      this.ball.x = data.ball.x * scaleX;
      this.ball.y = data.ball.y * scaleY;
      this.paddle1.y = data.paddle1.y * scaleY;
      this.paddle1.x = data.paddle1.x * scaleX;
      this.paddle2.y = data.paddle2.y * scaleY;
      this.paddle2.x = data.paddle2.x * scaleX;
      if (this.score.player1 !== data.score.player1 || this.score.player2 !== data.score.player2) {
        this.score = data.score;
        this.notifyScoreUpdate();
      }
    }
    render() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.strokeStyle = "white";
      this.ctx.lineWidth = 4;
      this.ctx.setLineDash([10, 10]);
      this.ctx.beginPath();
      this.ctx.moveTo(this.canvas.width / 2, 0);
      this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
      this.paddle1.draw(this.ctx);
      this.paddle2.draw(this.ctx);
      this.ball.draw(this.ctx);
    }
    // ...
    checkCollisions() {
      if (this.ball.velocityX < 0) {
        if (this.ball.x - this.ball.radius <= this.paddle1.x + this.paddle1.width && this.ball.x - this.ball.radius >= this.paddle1.x) {
          if (this.ball.y + this.ball.radius >= this.paddle1.y && this.ball.y - this.ball.radius <= this.paddle1.y + this.paddle1.height) {
            let hitPos = (this.ball.y - (this.paddle1.y + this.paddle1.height / 2)) / (this.paddle1.height / 2);
            let angle = hitPos * (Math.PI / 4);
            let speed = Math.sqrt(this.ball.velocityX * this.ball.velocityX + this.ball.velocityY * this.ball.velocityY);
            speed *= 1.05;
            this.ball.velocityX = speed * Math.cos(angle);
            this.ball.velocityY = speed * Math.sin(angle);
            this.ball.x = this.paddle1.x + this.paddle1.width + this.ball.radius;
          }
        }
      }
      if (this.ball.velocityX > 0) {
        if (this.ball.x + this.ball.radius >= this.paddle2.x && this.ball.x + this.ball.radius <= this.paddle2.x + this.paddle2.width) {
          if (this.ball.y + this.ball.radius >= this.paddle2.y && this.ball.y - this.ball.radius <= this.paddle2.y + this.paddle2.height) {
            let hitPos = (this.ball.y - (this.paddle2.y + this.paddle2.height / 2)) / (this.paddle2.height / 2);
            let angle = hitPos * (Math.PI / 4);
            let speed = Math.sqrt(this.ball.velocityX * this.ball.velocityX + this.ball.velocityY * this.ball.velocityY);
            speed *= 1.05;
            this.ball.velocityX = -speed * Math.cos(angle);
            this.ball.velocityY = speed * Math.sin(angle);
            this.ball.x = this.paddle2.x - this.ball.radius;
          }
        }
      }
      if (this.ball.x < 0) {
        this.score.player2++;
        this.notifyScoreUpdate();
        this.reset(1);
      } else if (this.ball.x > this.canvas.width) {
        this.score.player1++;
        this.notifyScoreUpdate();
        this.reset(-1);
      }
    }
    reset(direction = 1) {
      this.ball.reset(this.canvas, direction);
      this.paddle1.reset(this.canvas.height);
      this.paddle2.reset(this.canvas.height);
    }
    notifyScoreUpdate() {
      if (this.onScoreChange) {
        this.onScoreChange(this.score);
      }
    }
    // reset() {
    //     this.ball.reset(this.canvas);
    //     this.paddle1.reset(this.canvas.height);
    //     this.paddle2.reset(this.canvas.height);
    // }
  };
  var Game_default = Game;

  // scripts/game/Input.ts
  var Input = class {
    constructor() {
      this.keys = {};
      this.addEventListeners();
    }
    addEventListeners() {
      window.addEventListener("keydown", (event) => {
        this.keys[event.key] = true;
      });
      window.addEventListener("keyup", (event) => {
        this.keys[event.key] = false;
      });
    }
    getInput() {
      return {
        player1: {
          up: this.keys["w"],
          down: this.keys["s"]
        },
        player2: {
          up: this.keys["ArrowUp"],
          down: this.keys["ArrowDown"]
        }
      };
    }
  };
  var Input_default = Input;

  // scripts/pages/GamePage.ts
  function getSqlDate() {
    const now = /* @__PURE__ */ new Date();
    return now.toISOString().slice(0, 19).replace("T", " ");
  }
  function showVictoryModal(winnerName) {
    const modal = document.getElementById("local-summary-modal");
    const winnerText = document.getElementById("winner-name");
    const quitLocalBtn = document.getElementById("quit-local-btn");
    const quitRemoteBtn = document.getElementById("quit-remote-btn");
    if (modal && winnerText) {
      winnerText.innerText = winnerName;
      modal.classList.remove("hidden");
      if (gameChat) gameChat.addSystemMessage(`${winnerName} wins the match!`);
      launchConfetti(4e3);
    }
    const backAction = () => {
      window.history.back();
    };
    quitLocalBtn?.addEventListener("click", backAction);
    quitRemoteBtn?.addEventListener("click", backAction);
  }
  var gameChat = null;
  var tournamentState = null;
  var activeGame = null;
  var spaceKeyListener = null;
  var isNavigationBlocked = false;
  function isGameRunning() {
    return activeGame !== null && activeGame.isRunning;
  }
  async function getPlayerAlias() {
    const cachedAlias = sessionStorage.getItem("cachedAlias");
    if (cachedAlias) return cachedAlias;
    const userId = localStorage.getItem("userId") || sessionStorage.getItem("userId");
    const isGuest = sessionStorage.getItem("userRole") === "guest";
    if (!userId) return "Player";
    try {
      const response = await fetchWithAuth(`api/user/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        const alias2 = userData.alias || (isGuest ? "Guest" : "Player");
        sessionStorage.setItem("cachedAlias", alias2);
        return userData.alias || (isGuest ? "Guest" : "Player");
      }
    } catch (err) {
      console.error("Cannot fetch player alias:", err);
    }
    const result = sessionStorage.getItem("username") || (isGuest ? "Guest" : "Player");
    return result;
  }
  function handleBeforeUnload(e) {
    if (isGameRunning()) {
      e.preventDefault();
      e.returnValue = "A game is in progress. Are you sure you want to leave?";
      return e.returnValue;
    }
  }
  function handlePopState(e) {
    if (isGameRunning() && !isNavigationBlocked) {
      e.preventDefault();
      e.stopImmediatePropagation();
      window.history.pushState({ gameMode: window.history.state?.gameMode || "local" }, "", "/game");
      showExitConfirmationModal();
    }
  }
  function showExitConfirmationModal() {
    if (document.getElementById("exit-confirm-modal")) return;
    if (activeGame) {
      activeGame.pause();
    }
    const modalHtml = `
        <div id="exit-confirm-modal" class="hidden absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md" style="position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center;">
            
            <div class="window w-[600px] bg-white shadow-2xl animate-bounce-in">
                
                <div class="title-bar">
                    <div class="title-bar-text text-white" style="text-shadow: none;">Exit Game</div>
                    <div class="title-bar-controls">
                        <button aria-label="Close" id="modal-close-x"></button>
                    </div>
                </div>

                <div class="window-body bg-gray-100 p-8 flex flex-col items-center gap-8" style="min-height: auto;">
                    
                    <h2 class="text-3xl font-black text-black text-center tracking-wide" style="text-shadow: 1px 1px 0px white;">
                        WAIT A MINUTE !
                    </h2>
                    
                    <div class="flex flex-col items-center justify-center gap-4 bg-white p-6 rounded-lg w-full">
                        <p class="text-2xl font-bold text-gray-800 text-center">Are you sure you want to leave?</p>
                        <p class="text-sm text-red-500 font-semibold italic text-center">All current progress will be lost.</p>
                    </div>

                    <div class="flex gap-6 w-full justify-center">
                        
                        <button id="cancel-exit-btn" class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm 
                                                        px-6 py-4 text-base font-semibold shadow-sm hover:from-gray-200 hover:to-gray-400 
                                                        active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400
                                                        transition-all duration-200 hover:shadow-md" style="width: 200px; padding: 4px;">
                            GO BACK TO GAME
                        </button>
                        
                        <button id="confirm-exit-btn" class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm px-6 py-4 text-base font-semibold shadow-sm hover:from-gray-200 hover:to-gray-400 active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all duration-200 hover:shadow-md" style="width: 200px; padding: 4px;">
                            LEAVE
                        </button>
                    </div>

                </div>
            </div>
        </div>
    `;
    const div = document.createElement("div");
    div.innerHTML = modalHtml;
    document.body.appendChild(div);
    document.getElementById("confirm-exit-btn")?.addEventListener("click", () => {
      confirmExit();
    });
    const closeFunc = () => {
      document.getElementById("exit-confirm-modal")?.remove();
      if (activeGame) {
        activeGame.resume();
      }
    };
    document.getElementById("cancel-exit-btn")?.addEventListener("click", closeFunc);
    document.getElementById("modal-close-x")?.addEventListener("click", closeFunc);
  }
  function confirmExit() {
    isNavigationBlocked = true;
    if (activeGame) {
      const wasRemote = activeGame.isRemote;
      const roomId = activeGame.roomId;
      const playerRole = activeGame.playerRole;
      const currentScore = { ...activeGame.score };
      activeGame.isRunning = false;
      activeGame.stop();
      if (wasRemote && roomId && SocketService_default.getInstance().getGameSocket()) {
        SocketService_default.getInstance().getGameSocket()?.emit("leaveGame", { roomId });
        const userIdStr = localStorage.getItem("userId");
        if (userIdStr && playerRole) {
          const myScore = playerRole === "player1" ? currentScore.player1 : currentScore.player2;
          saveGameStats(Number(userIdStr), myScore, false);
        }
      }
      activeGame = null;
    }
    cleanup();
    document.getElementById("exit-confirm-modal")?.remove();
    setTimeout(() => {
      isNavigationBlocked = false;
      window.history.back();
    }, 100);
  }
  function cleanup() {
    if (gameChat) {
      gameChat.destroy();
      gameChat = null;
    }
    tournamentState = null;
    if (activeGame) {
      activeGame.isRunning = false;
      activeGame.stop();
      activeGame = null;
    }
    if (spaceKeyListener) {
      document.removeEventListener("keydown", spaceKeyListener);
      spaceKeyListener = null;
    }
    document.getElementById("countdown-modal")?.remove();
    window.removeEventListener("beforeunload", handleBeforeUnload);
    window.removeEventListener("popstate", handlePopState);
    isNavigationBlocked = false;
  }
  function render6() {
    const state = window.history.state;
    if (state && state.gameMode === "remote") {
      return RemoteGame_default;
    } else if (state && state.gameMode === "tournament") {
      return TournamentPage_default;
    }
    return LocalGame_default;
  }
  function showRemoteEndModal(winnerName, message) {
    if (document.getElementById("remote-end-modal")) return;
    const modalHtml = `
        <div id="remote-end-modal" class="hidden absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md" style="position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center;">
            <div class="window w-[600px] bg-white shadow-2xl animate-bounce-in">

                <div class="title-bar">
                    <div class="title-bar-text text-white" style="text-shadow: none;">Game Over</div>
                    <div class="title-bar-controls"></div>
                </div>

                <div class="window-body bg-gray-100 p-8 flex flex-col items-center gap-8">

                    <h1 class="text-4xl font-black text-yellow-600 uppercase tracking-widest">CONGRATULATIONS</h1>

                    <div class="flex flex-col items-center justify-center gap-4 bg-white p-6 rounded-lg w-full">
                        <p class="text-2xl font-bold text-gray-800 text-center">
                            ${winnerName}
                        </p>
                        <p class="text-sm text-gray-600 font-semibold italic text-center">
                            ${message}
                        </p>
                    </div>

                    <div class="flex gap-6 w-full justify-center">
                        <button id="remote-quit-btn"
                                class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm
                                    px-6 py-4 text-base font-semibold shadow-sm
                                    hover:from-gray-200 hover:to-gray-400
                                    active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400
                                    transition-all duration-200 hover:shadow-md"
                                style="width: 200px; padding: 4px;">
                            RETURN TO MENU
                        </button>
                    </div>

                </div>
            </div>
        </div>
    `;
    const div = document.createElement("div");
    div.innerHTML = modalHtml;
    document.body.appendChild(div);
    document.getElementById("remote-quit-btn")?.addEventListener("click", () => {
      document.getElementById("remote-end-modal")?.remove();
      window.history.back();
    });
  }
  function launchConfetti(duration = 3e3) {
    const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#ffa500", "#ff69b4"];
    const confettiCount = 150;
    const container = document.body;
    const confettiContainer = document.createElement("div");
    confettiContainer.id = "confetti-container";
    confettiContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
        overflow: hidden;
    `;
    container.appendChild(confettiContainer);
    for (let i = 0; i < confettiCount; i++) {
      createConfetti(confettiContainer, colors);
    }
    setTimeout(() => {
      confettiContainer.remove();
    }, duration);
  }
  function createConfetti(container, colors) {
    const confetti = document.createElement("div");
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 10 + 5;
    const startX = Math.random() * window.innerWidth;
    const endX = startX + (Math.random() - 0.5) * 200;
    const rotation = Math.random() * 360;
    const duration = Math.random() * 2 + 2;
    const delay = Math.random() * 0.5;
    confetti.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        top: -20px;
        left: ${startX}px;
        opacity: 1;
        transform: rotate(${rotation}deg);
        border-radius: ${Math.random() > 0.5 ? "50%" : "0"}; /* Rond ou carr\xE9 */
        animation: fall ${duration}s ease-in ${delay}s forwards;
    `;
    container.appendChild(confetti);
    const style = document.createElement("style");
    if (!document.getElementById("confetti-animation-style")) {
      style.id = "confetti-animation-style";
      style.textContent = `
            @keyframes fall {
                0% {
                    transform: translateY(0) rotate(0deg);
                    opacity: 1;
                }
                100% {
                    transform: translateY(${window.innerHeight + 50}px) translateX(${endX - startX}px) rotate(${rotation + 720}deg);
                    opacity: 0;
                }
            }
        `;
      document.head.appendChild(style);
    }
  }
  function launchCountdown(onComplete) {
    const modal = document.getElementById("countdown-modal");
    const text = document.getElementById("countdown-text");
    if (!modal || !text) {
      onComplete();
      return;
    }
    modal.classList.remove("hidden");
    let count = 3;
    text.innerText = count.toString();
    text.className = "text-[150px] font-black text-white animate-bounce";
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        text.innerText = count.toString();
      } else if (count === 0) {
        text.innerText = "GO!";
        text.classList.remove("animate-bounce");
        text.classList.add("animate-ping");
      } else {
        clearInterval(interval);
        modal.classList.add("hidden");
        onComplete();
      }
    }, 1e3);
  }
  function initGamePage(mode) {
    const currentTheme = localStorage.getItem("userTheme") || "basic";
    applyTheme(currentTheme);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    const player1Display = document.getElementById("player-1-name");
    if (player1Display) {
      getPlayerAlias().then((alias2) => {
        player1Display.innerText = alias2;
      });
    }
    if (gameChat) gameChat.destroy();
    gameChat = new Chat();
    gameChat.init();
    if (mode == "remote") {
      const privateRoomId = sessionStorage.getItem("privateGameId");
      if (privateRoomId) {
        console.log(`Lancement d'un chat priv\xE9 dans la waitroom num\xE9ro${privateRoomId}`);
        gameChat.joinChannel(`private_wait_${privateRoomId}`);
      } else {
        gameChat.joinChannel("remote_game_room");
      }
      initRemoteMode();
    } else if (mode == "tournament") {
      gameChat.joinChannel("tournament_room");
      inittournamentMode();
    } else {
      gameChat.joinChannel("local_game_room");
      initLocalMode();
    }
    if (spaceKeyListener) {
      document.removeEventListener("keydown", spaceKeyListener);
    }
    spaceKeyListener = (e) => {
      if (e.code === "Space" || e.key === " ") {
        const target = e.target;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        if (!activeGame || !activeGame.isRunning) return;
        e.preventDefault();
        if (gameChat) {
          if (activeGame.isRemote) {
            gameChat.emitWizzOnly();
            console.log("Wizz envoy\xE9 \xE0 l'adversaire (Remote)");
          } else {
            const wizzContainer = document.getElementById("wizz-container");
            gameChat.shakeElement(wizzContainer);
            console.log("Wizz local d\xE9clench\xE9");
          }
        }
      }
    };
    document.addEventListener("keydown", spaceKeyListener);
    function initRemoteMode() {
      const socketService = SocketService_default.getInstance();
      socketService.connectGame();
      const gameSocket = socketService.getGameSocket();
      if (!gameSocket) {
        console.error("Cannot connect to server");
        return;
      }
      const btn = document.getElementById("start-game-btn");
      const status = document.getElementById("queue-status");
      const modal = document.getElementById("game-setup-modal");
      const container = document.getElementById("game-canvas-container");
      const ballBtn = document.getElementById("ball-selector-button");
      const ballDrop = document.getElementById("ball-selector-dropdown");
      const ballGrid = document.getElementById("ball-grid");
      const ballImg = document.getElementById("selected-ball-img");
      const ballInput = document.getElementById("ball-value");
      const bgBtn = document.getElementById("bg-selector-button");
      const bgDrop = document.getElementById("bg-selector-dropdown");
      const bgGrid = document.getElementById("bg-grid");
      const bgPrev = document.getElementById("selected-bg-preview");
      const bgInput = document.getElementById("bg-value");
      const bgResetBtn = document.getElementById("bg-reset-button");
      const gameContainer = document.getElementById("left");
      if (ballBtn && ballDrop && ballGrid) {
        const uniqueUrls = /* @__PURE__ */ new Set();
        ballGrid.innerHTML = "";
        Object.keys(ballEmoticons).forEach((key) => {
          const imgUrl = ballEmoticons[key];
          if (!uniqueUrls.has(imgUrl)) {
            uniqueUrls.add(imgUrl);
            const div = document.createElement("div");
            div.className = "cursor-pointer p-1 hover:bg-blue-100 rounded flex justify-center items-center";
            div.innerHTML = `<img src="${imgUrl}" class="w-6 h-6 object-contain pointer-events-none">`;
            div.addEventListener("click", (e) => {
              e.stopPropagation();
              if (ballImg) ballImg.src = imgUrl;
              if (ballInput) ballInput.value = imgUrl;
              ballDrop.classList.add("hidden");
            });
            ballGrid.appendChild(div);
          }
        });
        ballBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          ballDrop.classList.toggle("hidden");
        });
        document.addEventListener("click", (e) => {
          if (!ballDrop.contains(e.target) && !ballBtn.contains(e.target)) ballDrop.classList.add("hidden");
        });
      }
      if (bgBtn && bgDrop && bgGrid) {
        bgGrid.innerHTML = "";
        Object.keys(gameBackgrounds).forEach((key) => {
          const color = gameBackgrounds[key];
          const div = document.createElement("div");
          div.className = "cursor-pointer hover:ring-2 hover:ring-blue-400 rounded-full flex justify-center items-center";
          div.style.width = "35px";
          div.style.height = "35px";
          div.style.padding = "2px";
          const circle = document.createElement("div");
          circle.className = "w-full h-full rounded-full border border-gray-300";
          circle.style.backgroundColor = color;
          div.appendChild(circle);
          div.addEventListener("click", (e) => {
            e.stopPropagation();
            if (bgPrev) bgPrev.style.backgroundColor = color;
            if (bgInput) bgInput.value = color;
            if (gameContainer) gameContainer.style.backgroundColor = color;
            bgDrop.classList.add("hidden");
          });
          bgGrid.appendChild(div);
        });
        if (bgResetBtn) {
          bgResetBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const resetColor = "#E8F4F8";
            if (bgPrev) bgPrev.style.backgroundColor = resetColor;
            if (bgInput) bgInput.value = resetColor;
            if (gameContainer) gameContainer.style.backgroundColor = resetColor;
            bgDrop.classList.add("hidden");
          });
        }
        bgBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          bgDrop.classList.toggle("hidden");
        });
        document.addEventListener("click", (e) => {
          if (!bgDrop.contains(e.target) && !bgBtn.contains(e.target)) bgDrop.classList.add("hidden");
        });
      }
      let currentP1Alias = "Player 1";
      let currentP2Alias = "Player 2";
      const startGameFromData = async (data, p1Alias, p2Alias) => {
        const myAlias = await getPlayerAlias();
        const myId = Number(localStorage.getItem("userId"));
        let opponentId = data.opponent ? Number(data.opponent) : null;
        const remoteP1Alias = data.p1?.alias || data.player1?.alias || p1Alias;
        const remoteP2Alias = data.p2?.alias || data.player2?.alias || p2Alias;
        let p1Id = data.role === "player1" ? myId : opponentId;
        let p2Id = data.role === "player2" ? myId : opponentId;
        let opponentAlias = "Opponent";
        if (data.role === "player1") {
          currentP1Alias = myAlias;
          if (remoteP2Alias)
            opponentAlias = remoteP2Alias;
          currentP2Alias = opponentAlias;
        } else {
          currentP1Alias = opponentAlias;
          if (remoteP1Alias)
            opponentAlias = remoteP1Alias;
          currentP2Alias = myAlias;
        }
        const p1Display = document.getElementById("player-1-name");
        const p2Display = document.getElementById("player-2-name");
        if (p1Display && p2Display) {
          p1Display.innerText = data.role === "player1" ? `${currentP1Alias} (Me)` : currentP1Alias;
          p2Display.innerText = data.role === "player2" ? `${currentP2Alias} (Me)` : currentP2Alias;
        }
        let gameStartDate = getSqlDate();
        if (data.opponent) {
          fetchWithAuth(`api/user/${data.opponent}`).then((res) => res.ok ? res.json() : null).then((userData) => {
            if (userData && userData.alias) {
              const realOpponentName = userData.alias;
              const opponentId2 = userData.userId;
              console.log(`opponentId = ${opponentId2}`);
              if (data.role === "player1") {
                currentP2Alias = realOpponentName;
                if (p2Display) p2Display.innerText = realOpponentName;
              } else {
                currentP1Alias = realOpponentName;
                if (p1Display) p1Display.innerText = realOpponentName;
              }
            }
          }).catch((e) => console.error("Error retrieving opponent alias:", e));
        }
        if (gameChat) {
          gameChat.joinChannel(data.roomId);
          gameChat.addSystemMessage(`Match started!`);
        }
        if (status) status.innerText = "We found an opponent ! Starting the game...";
        if (modal) modal.style.display = "none";
        if (container) {
          container.innerHTML = "";
          const canvas = document.createElement("canvas");
          canvas.width = container.clientWidth;
          canvas.height = container.clientHeight;
          canvas.style.width = "100%";
          canvas.style.height = "100%";
          container.appendChild(canvas);
          if (canvas.width === 0) canvas.width = 800;
          if (canvas.height === 0) canvas.height = 600;
          const ctx = canvas.getContext("2d");
          const input = new Input_default();
          const selectedBallSkin = ballInput ? ballInput.value : "classic";
          if (ctx) {
            if (activeGame) {
              activeGame.stop();
              activeGame = null;
            }
            activeGame = new Game_default(canvas, ctx, input, selectedBallSkin);
            gameSocket.off("opponentLeft");
            gameSocket.on("opponentLeft", async (eventData) => {
              if (activeGame) {
                console.log("Opponent left the game! Victory by forfeit! Saving stats...");
                activeGame.isRunning = false;
                activeGame.stop();
                gameSocket.off("gameState");
                gameSocket.off("gameEnded");
                const s1 = activeGame.score.player1;
                const s2 = activeGame.score.player2;
                let winnerAlias = "";
                if (data.role === "player1") {
                  winnerAlias = currentP1Alias;
                } else {
                  winnerAlias = currentP2Alias;
                }
                await saveRemoteGameToApi(
                  currentP1Alias,
                  s1,
                  p1Id,
                  currentP2Alias,
                  s2,
                  p2Id,
                  winnerAlias,
                  gameStartDate
                );
                showRemoteEndModal(myAlias, "(Opponent forfeit)");
                activeGame = null;
              }
            });
            activeGame.onGameEnd = async (endData) => {
              let winnerAlias = "Winner";
              if (endData.winner === "player1") winnerAlias = currentP1Alias;
              else if (endData.winner === "player2") winnerAlias = currentP2Alias;
              if (activeGame) {
                const s1 = activeGame.score.player1;
                const s2 = activeGame.score.player2;
                if (data.role === "player1") {
                  await saveRemoteGameToApi(
                    currentP1Alias,
                    s1,
                    p1Id,
                    currentP2Alias,
                    s2,
                    p2Id,
                    winnerAlias,
                    gameStartDate
                  );
                }
              }
              showVictoryModal(winnerAlias);
              activeGame = null;
            };
            activeGame.onScoreChange = (score) => {
              const sb = document.getElementById("score-board");
              if (sb) sb.innerText = `${score.player1} - ${score.player2}`;
            };
            launchCountdown(() => {
              if (activeGame) {
                gameStartDate = getSqlDate();
                activeGame.startRemote(data.roomId, data.role);
              }
            });
          }
        }
      };
      const pendingMatch = sessionStorage.getItem("pendingMatch");
      if (pendingMatch) {
        const data = JSON.parse(pendingMatch);
        sessionStorage.removeItem("pendingMatch");
        startGameFromData(data);
      }
      const privateRoomId = sessionStorage.getItem("privateGameId");
      console.log("privategame:", sessionStorage.getItem("privateGameId"));
      if (btn) {
        const newBtn = btn.cloneNode(true);
        btn.parentNode?.replaceChild(newBtn, btn);
        newBtn.addEventListener("click", async () => {
          if (!gameSocket) {
            alert("Error: lost connexion to game server");
            return;
          }
          newBtn.disabled = true;
          if (privateRoomId) {
            if (status) status.innerText = "Waiting for your friend in private room...";
            newBtn.innerText = "WAITING FOR FRIEND...";
            gameSocket.off("matchFound");
            gameSocket.on("matchFound", (data) => {
              console.log("Private Match Started!", data);
              sessionStorage.removeItem("privateGameId");
              startGameFromData(data);
            });
            const selectedBall = ballInput ? ballInput.value : "classic";
            gameSocket.emit("joinPrivateGame", {
              roomId: privateRoomId,
              skin: selectedBall
            });
          } else {
            if (status) status.innerText = "Recherche d'un adversaire...";
            newBtn.innerText = "WAITING...";
            gameSocket.off("matchFound");
            gameSocket.on("matchFound", (data) => {
              startGameFromData(data);
            });
            gameSocket.emit("joinQueue");
          }
        });
      }
      async function saveRemoteGameToApi(p1Alias, p1Score, p1Id, p2Alias, p2Score, p2Id, winnerAlias, startDate) {
        try {
          const endDate = getSqlDate();
          const response = await fetchWithAuth("api/game", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              type: "remote",
              winner: winnerAlias,
              status: "finished",
              round: "1v1",
              startDate,
              endDate,
              p1: { alias: p1Alias, score: p1Score, userId: p1Id },
              p2: { alias: p2Alias, score: p2Score, userId: p2Id }
            })
          });
          if (!response.ok) {
            console.error("Error while saving remote game");
          } else {
            console.log("remote game successfully saved");
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    function inittournamentMode() {
      const setupModal = document.getElementById("tournament-setup-modal");
      if (setupModal) setupModal.classList.remove("hidden");
      const nameInput = document.getElementById("tournament-name-input");
      const player1Input = document.getElementById("player1-input");
      const player2Input = document.getElementById("player2-input");
      const player3Input = document.getElementById("player3-input");
      const player4Input = document.getElementById("player4-input");
      const startButton = document.getElementById("start-tournament-btn");
      const errorDiv = document.getElementById("setup-error");
      initTournamentSelectors();
      const userId = localStorage.getItem("userId");
      const username = localStorage.getItem("username");
      const isGuest = sessionStorage.getItem("userRole") === "guest";
      getPlayerAlias().then((alias2) => {
        player1Input.value = alias2;
        if (!isGuest) {
          player1Input.readOnly = true;
          player1Input.classList.add("bg-gray-200", "cursor-not-allowed");
        } else {
          player1Input.readOnly = false;
          player1Input.classList.remove("bg-gray-200", "cursor-not-allowed");
        }
      });
      console.log("Username du user: ", username);
      startButton?.addEventListener("click", () => {
        const tName = nameInput.value.trim();
        const players = [
          player1Input.value.trim(),
          player2Input.value.trim(),
          player3Input.value.trim(),
          player4Input.value.trim()
        ];
        if (!tName || players.some((p) => !p)) {
          if (errorDiv) {
            errorDiv.innerText = "Please fill all fields.";
            errorDiv.classList.remove("hidden");
          }
          return;
        }
        const uniqueCheck = new Set(players);
        if (uniqueCheck.size !== 4) {
          if (errorDiv) {
            errorDiv.innerText = "All player aliases must be unique.";
            errorDiv.classList.remove("hidden");
          }
          return;
        }
        const ballVal = document.getElementById("tour-ball-value")?.value || "classic";
        const bgVal = document.getElementById("tour-bg-value")?.value || "#E8F4F8";
        startTournamentLogic(tName, players, ballVal, bgVal);
      });
      function initTournamentSelectors() {
        const ballBtn = document.getElementById("tour-ball-selector-button");
        const ballDrop = document.getElementById("tour-ball-selector-dropdown");
        const ballGrid = document.getElementById("tour-ball-grid");
        const ballImg = document.getElementById("tour-selected-ball-img");
        const ballInput = document.getElementById("tour-ball-value");
        const bgBtn = document.getElementById("tour-bg-selector-button");
        const bgDrop = document.getElementById("tour-bg-selector-dropdown");
        const bgGrid = document.getElementById("tour-bg-grid");
        const bgPrev = document.getElementById("tour-selected-bg-preview");
        const bgInput = document.getElementById("tour-bg-value");
        const bgResetBtn = document.getElementById("bg-reset-button");
        const gameContainer = document.getElementById("left");
        if (ballBtn && ballDrop && ballGrid) {
          const uniqueUrls = /* @__PURE__ */ new Set();
          ballGrid.innerHTML = "";
          Object.keys(ballEmoticons).forEach((key) => {
            const imgUrl = ballEmoticons[key];
            if (!uniqueUrls.has(imgUrl)) {
              uniqueUrls.add(imgUrl);
              const div = document.createElement("div");
              div.className = "cursor-pointer p-1 hover:bg-blue-100 rounded flex justify-center items-center";
              div.innerHTML = `<img src="${imgUrl}" class="w-6 h-6 object-contain pointer-events-none">`;
              div.addEventListener("click", (e) => {
                e.stopPropagation();
                if (ballImg) ballImg.src = imgUrl;
                if (ballInput) ballInput.value = imgUrl;
                ballDrop.classList.add("hidden");
              });
              ballGrid.appendChild(div);
            }
          });
          ballBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            ballDrop.classList.toggle("hidden");
          });
          document.addEventListener("click", (e) => {
            if (!ballDrop.contains(e.target) && !ballBtn.contains(e.target)) ballDrop.classList.add("hidden");
          });
        }
        if (bgBtn && bgDrop && bgGrid) {
          bgGrid.innerHTML = "";
          Object.keys(gameBackgrounds).forEach((key) => {
            const color = gameBackgrounds[key];
            const div = document.createElement("div");
            div.className = "cursor-pointer hover:ring-2 hover:ring-blue-400 rounded-full flex justify-center items-center";
            div.style.width = "35px";
            div.style.height = "35px";
            div.style.padding = "2px";
            const circle = document.createElement("div");
            circle.className = "w-full h-full rounded-full border border-gray-300";
            circle.style.backgroundColor = color;
            div.appendChild(circle);
            div.addEventListener("click", (e) => {
              e.stopPropagation();
              if (bgPrev) bgPrev.style.backgroundColor = color;
              if (bgInput) bgInput.value = color;
              if (gameContainer) gameContainer.style.backgroundColor = color;
              bgDrop.classList.add("hidden");
            });
            bgGrid.appendChild(div);
          });
          if (bgResetBtn) {
            bgResetBtn.addEventListener("click", (e) => {
              e.stopPropagation();
              const resetColor = "#E8F4F8";
              if (bgPrev) bgPrev.style.backgroundColor = resetColor;
              if (bgInput) bgInput.value = resetColor;
              if (gameContainer) gameContainer.style.backgroundColor = resetColor;
              bgDrop.classList.add("hidden");
            });
          }
          bgBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            bgDrop.classList.toggle("hidden");
          });
          document.addEventListener("click", (e) => {
            if (!bgDrop.contains(e.target) && !bgBtn.contains(e.target)) bgDrop.classList.add("hidden");
          });
        }
      }
      function startTournamentLogic(name, playersAliases, ballSkin, bgSkin) {
        document.getElementById("tournament-setup-modal")?.classList.add("hidden");
        const userIdStr = localStorage.getItem("userId");
        const userIdNb = userIdStr ? Number(userIdStr) : null;
        const playersObjects = playersAliases.map((alias2, index) => ({
          alias: alias2,
          userId: index === 0 ? userIdNb : null,
          score: 0
        }));
        const startDate = getSqlDate();
        tournamentState = {
          name,
          startedAt: startDate,
          allPlayers: playersObjects,
          matches: [
            { round: "semi_final_1", winner: null, p1: playersObjects[0], p2: playersObjects[1], startDate, endDate: startDate },
            // 1er duo
            { round: "semi_final_2", winner: null, p1: playersObjects[2], p2: playersObjects[3], startDate, endDate: startDate },
            // 2eme duo
            { round: "final", winner: null, p1: null, p2: null, startDate, endDate: startDate }
            // finale
          ],
          currentMatchIdx: 0,
          // on defini l'id du match pour le stocker dans la db
          currentStep: "semi_final_1",
          settings: { ballSkin, bgSkin }
        };
        if (gameChat) {
          gameChat.addSystemMessage(`Tournament "${name}" started! Participants: ${playersAliases.join(", ")}`);
        }
        showBracketModal();
      }
      function showBracketModal() {
        const bracketModal = document.getElementById("tournament-bracket-modal");
        if (!bracketModal || !tournamentState) return;
        const sf1 = document.getElementById("bracket-sf1");
        const sf2 = document.getElementById("bracket-sf2");
        const fin = document.getElementById("bracket-final");
        const msg = document.getElementById("bracket-status-msg");
        const m1 = tournamentState.matches[0];
        const w1 = m1.winner ? `\u2705 ${m1.winner}` : null;
        if (sf1) sf1.innerText = w1 || `${m1.p1?.alias} vs ${m1.p2?.alias}`;
        const m2 = tournamentState.matches[1];
        const w2 = m2.winner ? `\u2705 ${m2.winner}` : null;
        if (sf2) sf2.innerText = w2 || `${m2.p1?.alias} vs ${m2.p2?.alias}`;
        const mf = tournamentState.matches[2];
        const p1Final = mf.p1 ? mf.p1.alias : "?";
        const p2Final = mf.p2 ? mf.p2.alias : "?";
        if (fin) fin.innerText = mf.winner ? `\u{1F451} ${mf.winner}` : `${p1Final} vs ${p2Final}`;
        const idx = tournamentState.currentMatchIdx;
        if (msg) {
          if (idx === 0) msg.innerText = "Next: Semi-Final 1";
          else if (idx === 1) msg.innerText = "Next: Semi-Final 2";
          else if (idx === 2) msg.innerText = "Next: The Grand Finale!";
        }
        bracketModal.classList.remove("hidden");
        const btn = document.getElementById("bracket-continue-btn");
        const newBtn = btn?.cloneNode(true);
        btn?.parentNode?.replaceChild(newBtn, btn);
        newBtn.addEventListener("click", () => {
          bracketModal.classList.add("hidden");
          showNextMatchModal();
        });
      }
      function showNextMatchModal() {
        const nextMatchModal = document.getElementById("tournament-next-match-modal");
        const title = document.getElementById("match-title");
        const player1Text = document.getElementById("next-p1");
        const player2Text = document.getElementById("next-p2");
        const playButton = document.getElementById("launch-match-btn");
        if (!nextMatchModal || !tournamentState) return;
        const matchIdx = tournamentState.currentMatchIdx;
        const match = tournamentState.matches[matchIdx];
        const p1Alias = match.p1 ? match.p1.alias : "???";
        const p2Alias = match.p2 ? match.p2.alias : "???";
        if (matchIdx === 0) {
          if (title) title.innerText = "SEMI-FINAL 1";
          if (gameChat) gameChat.addSystemMessage(`Next up: ${p1Alias} vs ${p2Alias} !`);
        } else if (matchIdx === 1) {
          if (title) title.innerText = "SEMI-FINAL 2";
          if (gameChat) gameChat.addSystemMessage(`Next up: ${p1Alias} vs ${p2Alias} !`);
        } else {
          if (title) title.innerText = "FINALE";
          if (gameChat) gameChat.addSystemMessage(`FINAL: ${p1Alias} vs ${p2Alias} !`);
        }
        if (player1Text) player1Text.innerText = p1Alias;
        if (player2Text) player2Text.innerText = p2Alias;
        nextMatchModal.classList.remove("hidden");
        const newButton = playButton.cloneNode(true);
        playButton.parentNode.replaceChild(newButton, playButton);
        newButton.addEventListener("click", () => {
          nextMatchModal.classList.add("hidden");
          if (match.p1 && match.p2) {
            launchMatch(match.p1, match.p2);
          }
        });
      }
      function launchMatch(p1, p2) {
        const p1Name = document.getElementById("player-1-name");
        const p2Name = document.getElementById("player-2-name");
        const gameStartDate = getSqlDate();
        if (p1Name) p1Name.innerText = p1.alias;
        if (p2Name) p2Name.innerText = p2.alias;
        const scoreBoard = document.getElementById("score-board");
        if (scoreBoard) {
          scoreBoard.innerText = "0 - 0";
        }
        const container = document.getElementById("left");
        if (container && tournamentState) container.style.backgroundColor = tournamentState.settings.bgSkin;
        console.log(`Lancement du jeu: ${p1.alias} vs ${p2.alias}`);
        let canvasContainer = document.getElementById("game-canvas-container");
        if (canvasContainer) {
          canvasContainer.innerHTML = "";
          const canvas = document.createElement("canvas");
          canvas.id = "pong-canvas-tournament";
          canvas.width = canvasContainer.clientWidth;
          canvas.height = canvasContainer.clientHeight;
          console.log("heigh:", canvasContainer.clientHeight);
          console.log("width:", canvasContainer.clientWidth);
          canvas.style.width = "100%";
          canvas.style.height = "100%";
          canvasContainer.appendChild(canvas);
          const ctx = canvas.getContext("2d");
          if (ctx && tournamentState) {
            const input = new Input_default();
            if (activeGame) activeGame.isRunning = false;
            activeGame = new Game_default(canvas, ctx, input, tournamentState.settings.ballSkin);
            activeGame.onScoreChange = (score) => {
              const scoreBoard2 = document.getElementById("score-board");
              if (scoreBoard2) {
                scoreBoard2.innerText = `${score.player1} - ${score.player2}`;
              }
            };
            activeGame.start();
            const checkInterval = setInterval(() => {
              if (!activeGame || !activeGame.isRunning) {
                clearInterval(checkInterval);
                return;
              }
              if (activeGame.score.player1 >= 5 || activeGame.score.player2 >= 5) {
                activeGame.isRunning = false;
                clearInterval(checkInterval);
                const winnerAlias = activeGame.score.player1 > activeGame.score.player2 ? p1.alias : p2.alias;
                endMatch(winnerAlias, activeGame.score.player1, activeGame.score.player2, gameStartDate);
              }
            }, 500);
          }
        }
      }
      function endMatch(winner, scoreP1, scoreP2, gameStartDate) {
        if (!tournamentState) return;
        const idx = tournamentState.currentMatchIdx;
        const match = tournamentState.matches[idx];
        match.startDate = gameStartDate;
        match.endDate = getSqlDate();
        match.winner = winner;
        if (match.p1) match.p1.score = scoreP1;
        if (match.p2) match.p2.score = scoreP2;
        if (match.p1 && match.p1.userId) {
          const isWinner = match.p1.alias === winner;
        }
        if (match.p2 && match.p2.userId) {
          const isWinner = match.p2.alias === winner;
        }
        if (gameChat) gameChat.addSystemMessage(`${winner} wins the match!`);
        if (idx === 0) {
          const winnerObj = match.p1?.alias === winner ? match.p1 : match.p2;
          tournamentState.matches[2].p1 = winnerObj ? { ...winnerObj } : null;
          tournamentState.currentMatchIdx++;
          tournamentState.currentStep = "semi_final_2";
          showBracketModal();
        } else if (idx === 1) {
          const winnerObj = match.p1?.alias === winner ? match.p1 : match.p2;
          tournamentState.matches[2].p2 = winnerObj ? { ...winnerObj } : null;
          tournamentState.currentMatchIdx++;
          tournamentState.currentStep = "final";
          showBracketModal();
        } else {
          tournamentState.currentStep = "finished";
          showSummary(winner);
        }
      }
      function showSummary(champion) {
        launchConfetti(4e3);
        const container = document.getElementById("left");
        if (container) container.style.backgroundColor = "white";
        const summaryModal = document.getElementById("tournament-summary-modal");
        if (summaryModal) {
          summaryModal.classList.remove("hidden");
          const winnerDisplay = document.getElementById("winner-name");
          const tourNameDisplay = document.getElementById("tour-name-display");
          if (winnerDisplay) winnerDisplay.innerText = champion;
          if (tourNameDisplay && tournamentState) tourNameDisplay.innerText = tournamentState.name;
          if (gameChat) gameChat.addSystemMessage(`${champion} wins the match!`);
          const userId2 = localStorage.getItem("userId");
          if (userId2) {
            saveTournamentToApi(champion);
          }
          document.getElementById("quit-tournament-btn")?.addEventListener("click", () => {
            window.history.back();
          });
          document.getElementById("quit-remote-btn")?.addEventListener("click", () => {
            window.history.back();
          });
        }
      }
      async function saveTournamentToApi(winner) {
        if (!tournamentState) return;
        else {
          console.log("DEBUG FRONTEND - Matches \xE0 envoyer :", tournamentState.matches);
          console.log("DEBUG FRONTEND - Nombre de matches :", tournamentState.matches.length);
        }
        try {
          await fetchWithAuth("api/game/tournaments", {
            method: "POST",
            body: JSON.stringify({
              name: tournamentState.name,
              winner,
              participants: tournamentState.allPlayers,
              // Ajout des details complets pour le format JSON attendu
              tournamentName: tournamentState.name,
              // modif de tournament_name en tournamentName pour le back
              matchList: tournamentState.matches,
              // modif de match_list en matchList pour le back
              startedAt: tournamentState.startedAt
            })
          });
        } catch (e) {
          console.error(e);
        }
      }
    }
    function initLocalMode() {
      const modal = document.getElementById("game-setup-modal");
      const startButton = document.getElementById("start-game-btn");
      const nameInput = document.getElementById("opponent-name");
      const errorMsg = document.getElementById("error-message");
      const ballButton = document.getElementById("ball-selector-button");
      const ballDropdown = document.getElementById("ball-selector-dropdown");
      const ballGrid = document.getElementById("ball-grid");
      const selectedBallImg = document.getElementById("selected-ball-img");
      const ballValueInput = document.getElementById("ball-value");
      const bgButton = document.getElementById("bg-selector-button");
      const bgDropdown = document.getElementById("bg-selector-dropdown");
      const bgGrid = document.getElementById("bg-grid");
      const selectedBgPreview = document.getElementById("selected-bg-preview");
      const bgValueInput = document.getElementById("bg-value");
      const gameField = document.getElementById("left");
      const bgResetButton = document.getElementById("bg-reset-button");
      const player2Display = document.getElementById("player-2-name");
      if (modal) modal.classList.remove("hidden");
      if (ballButton && ballDropdown && ballGrid) {
        const uniqueUrls = /* @__PURE__ */ new Set();
        ballGrid.innerHTML = "";
        Object.keys(ballEmoticons).forEach((key) => {
          const imgUrl = ballEmoticons[key];
          if (!uniqueUrls.has(imgUrl)) {
            uniqueUrls.add(imgUrl);
            const div = document.createElement("div");
            div.className = "cursor-pointer p-1 hover:bg-blue-100 rounded border border-transparent hover:border-blue-300 flex justify-center items-center";
            div.innerHTML = `<img src="${imgUrl}" alt="${key}" class="w-6 h-6 object-contain pointer-events-none">`;
            div.addEventListener("click", (e) => {
              e.stopPropagation();
              selectedBallImg.src = imgUrl;
              ballValueInput.value = imgUrl;
              ballDropdown.classList.add("hidden");
            });
            ballGrid.appendChild(div);
          }
        });
        ballButton.addEventListener("click", (e) => {
          e.stopPropagation();
          ballDropdown.classList.toggle("hidden");
        });
        document.addEventListener("click", (e) => {
          const target = e.target;
          if (!ballDropdown.contains(target) && !ballButton.contains(target)) {
            ballDropdown.classList.add("hidden");
          }
        });
      }
      if (bgButton && bgDropdown && bgGrid) {
        bgGrid.innerHTML = "";
        Object.keys(gameBackgrounds).forEach((key) => {
          const color = gameBackgrounds[key];
          const div = document.createElement("div");
          div.className = "cursor-pointer hover:ring-2 hover:ring-blue-400 rounded-full";
          div.style.padding = "4px";
          div.style.display = "flex";
          div.style.justifyContent = "center";
          div.style.alignItems = "center";
          div.style.width = "36px";
          div.style.height = "36px";
          const colorCircle = document.createElement("div");
          colorCircle.className = "w-full h-full rounded-full border-2 border-gray-300";
          colorCircle.style.backgroundColor = color;
          div.appendChild(colorCircle);
          div.addEventListener("click", (e) => {
            e.stopPropagation();
            selectedBgPreview.style.backgroundColor = color;
            bgValueInput.value = color;
            if (gameField) {
              gameField.style.backgroundColor = color;
            }
            bgDropdown.classList.toggle("hidden");
          });
          bgGrid.appendChild(div);
        });
        if (bgResetButton) {
          bgResetButton.addEventListener("click", (e) => {
            e.stopPropagation();
            const resetColor = "#E8F4F8";
            if (selectedBgPreview) selectedBgPreview.style.backgroundColor = resetColor;
            if (bgValueInput) bgValueInput.value = resetColor;
            if (gameField) gameField.style.backgroundColor = resetColor;
            bgDropdown.classList.toggle("hidden");
          });
        }
        bgButton.addEventListener("click", (e) => {
          e.stopPropagation();
          bgDropdown.classList.toggle("hidden");
        });
        document.addEventListener("click", (e) => {
          const target = e.target;
          if (!bgDropdown.contains(target) && !bgButton.contains(target)) {
            bgDropdown.classList.add("hidden");
          }
        });
      }
      if (startButton) {
        let p1Alias = localStorage.getItem("username");
        console.log("clic sur play");
        const newStartBtn = startButton.cloneNode(true);
        startButton.parentNode?.replaceChild(newStartBtn, startButton);
        newStartBtn.addEventListener("click", () => {
          const opponentName = nameInput.value.trim();
          if (opponentName === "") {
            if (errorMsg) errorMsg.classList.remove("hidden");
            nameInput.classList.add("border-red-500");
            return;
          }
          if (gameChat) {
            gameChat.addSystemMessage(`Game is about to start! Match: ${p1Alias} vs ${opponentName}`);
          }
          const selectedBall = ballValueInput ? ballValueInput.value : "classic";
          const selectedBg = bgValueInput ? bgValueInput.value : "#E8F4F8";
          if (player2Display) {
            player2Display.innerText = opponentName;
          }
          if (gameField) {
            gameField.style.backgroundColor = selectedBg;
          }
          if (modal) {
            modal.classList.add("hidden");
            modal.classList.remove("flex");
          }
          launchCountdown(() => {
            const canvasContainer = document.getElementById("game-canvas-container");
            if (!canvasContainer) {
              console.error("Conteneur canvas introuvable, creation auto...");
              const container = document.createElement("div");
              container.id = "game-canvas-container";
              container.className = "w-full flex-1";
              gameField.appendChild(container);
            } else {
              canvasContainer.innerHTML = "";
            }
            const scoreBoard = document.getElementById("score-board");
            const canvas = document.createElement("canvas");
            canvas.id = "pong-canvas";
            canvas.width = canvasContainer ? canvasContainer.clientWidth : 800;
            canvas.height = canvasContainer ? canvasContainer.clientHeight : 600;
            console.log("heigh:", canvasContainer.clientHeight);
            console.log("width:", canvasContainer.clientWidth);
            canvas.style.width = "100%";
            canvas.style.height = "100%";
            canvas.style.backgroundColor = selectedBg;
            const targetContainer = document.getElementById("game-canvas-container") || gameField;
            targetContainer.appendChild(canvas);
            const ctx = canvas.getContext("2d");
            if (ctx) {
              const input = new Input_default();
              if (activeGame) activeGame.isRunning = false;
              activeGame = new Game_default(canvas, ctx, input, selectedBall);
              activeGame.onScoreChange = (score) => {
                if (scoreBoard) {
                  scoreBoard.innerText = `${score.player1} - ${score.player2}`;
                }
              };
              console.log("D\xE9marrage du jeu Local...");
              activeGame.start();
              const startDate = getSqlDate();
              const localLoop = setInterval(async () => {
                if (!activeGame || !activeGame.isRunning) {
                  clearInterval(localLoop);
                  return;
                }
                if (activeGame.score.player1 >= 11 || activeGame.score.player2 >= 11) {
                  activeGame.isRunning = false;
                  clearInterval(localLoop);
                  const p1Score = activeGame.score.player1;
                  const p2Score = activeGame.score.player2;
                  const p1Alias2 = localStorage.getItem("username") || "Player 1";
                  const p2Alias = opponentName;
                  const p1Wins = p1Score > p2Score;
                  const winnerAlias = p1Wins ? p1Alias2 : p2Alias;
                  const userIdStr = localStorage.getItem("userId");
                  if (userIdStr) {
                    const userId = Number(userIdStr);
                    console.log(`gamepage, ${userId}`);
                    await saveLocalGameToApi(p1Alias2, p2Alias, p1Score, p2Score, winnerAlias, startDate, userId);
                  }
                  showVictoryModal(winnerAlias);
                }
              }, 500);
            }
          });
        });
      }
      if (nameInput) {
        nameInput.addEventListener("input", () => {
          if (errorMsg) errorMsg.classList.add("hidden");
          nameInput.classList.remove("border-red-500");
        });
      }
      async function saveLocalGameToApi(p1Alias, p2Alias, p1Score, p2Score, winnerAlias, startDate, userId) {
        try {
          const endDate = getSqlDate();
          const response = await fetchWithAuth("api/game", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              type: "local",
              winner: winnerAlias,
              status: "finished",
              round: "1v1",
              startDate,
              endDate,
              p1: {
                alias: p1Alias,
                score: p1Score,
                userId
              },
              p2: {
                alias: p2Alias,
                score: p2Score,
                userId: null
              }
            })
          });
          if (!response.ok) {
            console.error("Error while saving local game");
          } else {
            console.log("Local game successfully saved");
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }

  // scripts/pages/DashboardPage.html
  var DashboardPage_default = '<div id="dashboard-container" class="relative w-full h-[calc(100vh-50px)] overflow-hidden">\n\n    <div id="dashboard-header" class="absolute top-0 left-0 w-full h-[200px] bg-cover bg-center bg-no-repeat"\n         style="background-image: url(/assets/basic/background.jpg); background-size: cover;">\n    </div>\n\n    <div class="absolute top-[20px] bottom-0 left-0 right-0 flex flex-row gap-6 px-10 py-2 justify-center" style="bottom: 50px; padding-left: 100px; padding-right: 100px;">\n\n        <div id="dashboard-overview" class="flex flex-col w-[700px] min-w-[700px] bg-white" style="width: 800px;">\n            <div class="window h-full flex flex-col">\n                <div class="title-bar">\n                    <div class="title-bar-text">Dashboard overview</div>\n                    <div class="title-bar-controls">\n                        <button aria-label="Minimize"></button>\n                        <button aria-label="Maximize"></button>\n                        <button aria-label="Close"></button>\n                    </div>\n                </div>\n\n                <div class="window-body bg-white flex flex-col p-4 gap-4 h-full overflow-y-auto">\n                    \n                    <div class="grid grid-cols-3 gap-2">\n                        <div class="flex flex-col items-center justify-center p-2 bg-gray-50 border border-gray-300 rounded-sm shadow-sm">\n                            <span class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Game played</span>\n                            <span id="dashboard-total-games" class="text-2xl font-bold text-gray-800">0</span>\n                        </div>\n                        <div class="flex flex-col items-center justify-center p-2 bg-gray-50 border border-gray-300 rounded-sm shadow-sm">\n                            <span class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Average score</span>\n                            <span id="dashboard-avg-score" class="text-2xl font-bold text-blue-600">0</span>\n                        </div>\n                        <div class="flex flex-col items-center justify-center p-2 bg-gray-50 border border-gray-300 rounded-sm shadow-sm">\n                            <span class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Time playing</span>\n                            <span id="dashboard-play-time" class="text-2xl font-bold text-gray-800">0h</span>\n                        </div>\n                        <div class="flex flex-col items-center justify-center p-2 bg-gray-50 border border-gray-300 rounded-sm shadow-sm">\n                            <span class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Wins</span>\n                            <span id="dashboard-wins" class="text-2xl font-bold text-gray-800">0</span>\n                        </div>\n                        <div class="flex flex-col items-center justify-center p-2 bg-gray-50 border border-gray-300 rounded-sm shadow-sm">\n                            <span class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Losses</span>\n                            <span id="dashboard-losses" class="text-2xl font-bold text-blue-600">0</span>\n                        </div>\n                        <div class="flex flex-col items-center justify-center p-2 bg-gray-50 border border-gray-300 rounded-sm shadow-sm">\n                            <span class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Win rate</span>\n                            <span id="dashboard-win-rate" class="text-2xl font-bold text-gray-800">0%</span>\n                        </div>\n                    </div>\n\n                    <div class="flex flex-col rounded-sm p-3 shadow-sm bg-white">\n                        <h3 class="text-lg font-bold text-gray-600 mb-2 pb-1">Win and loss evolution</h3>\n                        <div class="relative w-full h-[150px] bg-gray-50 flex items-center justify-center border border-gray-200 border-dashed">\n                            <canvas id="dashboard-evolution-graph" class="w-full h-full"></canvas>\n                            <span class="absolute text-xs text-gray-400 pointer-events-none">Win losse evolution. On a 30 days timeline</span>\n                        </div>\n                    </div>\n\n\n                    <div class="flex flex-col rounded-sm p-3 shadow-sm bg-white">\n                        <h3 class="text-lg font-bold text-gray-600 mb-2 pb-1">Type of games</h3>\n                        <div class="relative w-full h-[150px] bg-gray-50 flex items-center justify-center border border-gray-200 border-dashed">\n                            <canvas id="dashboard-game-chart" class="w-full h-full"></canvas>\n                            <span class="absolute text-xs text-gray-400 pointer-events-none">Pie chart with percentage of games played</span>\n                        </div>\n                    </div>\n\n\n                    <div class="flex flex-col rounded-sm p-3 shadow-sm bg-white">\n                        <h3 class="text-lg font-bold text-gray-600 mb-2 pb-1">My biggest rivals</h3>\n                        <div class="relative w-full h-[150px] bg-gray-50 flex items-center justify-center border border-gray-200 border-dashed">\n                            <canvas id="dashboard-rival-podium" class="w-full h-full"></canvas>\n                            <span class="absolute text-xs text-gray-400 pointer-events-none">Podium with the 3 biggest rivals</span>\n                        </div>\n                    </div>\n                    \n                </div>\n            </div>\n        </div>\n\n        <div id="match-analysis" class="flex flex-col flex-1 min-w-0 bg-white">\n            <div class="window h-full flex flex-col">\n                <div class="title-bar">\n                    <div class="title-bar-text">Match history and analysis</div>\n                    <div class="title-bar-controls">\n                        <button aria-label="Minimize"></button>\n                        <button aria-label="Maximize"></button>\n                        <button aria-label="Close"></button>\n                    </div>\n                </div>\n\n                <div class="window-body bg-white flex flex-col flex-1 p-4 min-h-0">\n                    \n                    <div class="flex flex-row gap-3 mb-4 p-2 bg-gray-100 border border-gray-300 rounded-sm shadow-inner items-center" >\n                        <label class="text-xs font-semibold text-gray-600 pr-4" style="padding-right: 10px;">Filter by:</label>\n                        \n                        <input type="text" id="filter-opponent" placeholder="Type in rival name" \n                               class="text-xs p-1.5 border border-gray-300 rounded-sm focus:outline-none focus:border-blue-400 w-[150px]" style="padding-right: 10px;">\n                        \n                        <select id="filter-mode" class="text-xs border border-gray-300 rounded-sm focus:outline-none focus:border-blue-400 bg-white" style="padding-right: 10px;">\n                            <option value="all">All Modes</option>\n                            <option value="local">Local</option>\n                            <option value="remote">Remote</option>\n                            <option value="tournament">Tournament</option>\n                        </select>\n\n                        <div class="h-4 w-px bg-gray-300 mx-1"></div>\n\n                        <button id="apply-filters" class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm px-3 py-1 text-xs font-semibold hover:from-gray-200 hover:to-gray-400 active:border-blue-400">\n                            Apply\n                        </button>\n                    </div>\n\n                    <div class="flex-1 border border-gray-300 rounded-sm bg-white flex flex-col min-h-0">\n                        <div class="grid grid-cols-12 bg-gray-100 border-b border-gray-300 p-2 text-xs font-bold text-gray-600 select-none">\n                            <div class="col-span-2">Date</div>\n                            <div class="col-span-3">Rival</div>\n                            <div class="col-span-2 text-center">Score</div>\n                            <div class="col-span-2 text-center">Type</div>\n                            <div class="col-span-1 text-center">Round</div>\n                            <div class="col-span-2 text-center">Result</div>\n                        </div>\n\n                        <div id="match-history-list" class="overflow-y-auto flex-1 p-1 space-y-1">\n                            <div class="grid grid-cols-5 items-center p-2 text-sm border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors group">\n                                <div id="dashboard-match-date" class="col-span-2 text-gray-500 text-xs">07-01-2026</div>\n                                <div id="dashboard-rival-name" class="col-span-3 font-semibold text-gray-700 flex items-center gap-2">\n                                    <span>Faustochedu49</span>\n                                </div>\n                                <div id="dashboard-match-score" class="col-span-2 text-center font-mono">0 - 0</div>\n                                <div id="dashboard-game-type" class="col-span-2 text-center font-mono">Local</div>\n                                <div id="dashboard-match-round" class="col-span-2 text-center font-mono">1v1</div>\n                                <div id="dashboard-match-result" class="col-span-2 text-center font-mono">VICTORY</div>\n                            </div>\n                        </div>\n                    </div>\n                </div>\n            </div>\n        </div>\n\n    </div>\n</div>';

  // scripts/pages/DashboardPage.ts
  function render7() {
    return DashboardPage_default;
  }
  function afterRender4() {
    const totalGame = document.getElementById("dashboard-total-games");
    const avgScore = document.getElementById("dashboard-avg-score");
    const playTime = document.getElementById("dashboard-play-time");
    const wins = document.getElementById("dashboard-wins");
    const losses = document.getElementById("dashboard-losses");
    const winRateCalcul = document.getElementById("dashboard-win-rate");
    const evolutionCanvas = document.getElementById("dashboard-evolution-graph");
    const gameTypeCanvas = document.getElementById("dashboard-game-chart");
    const currentTheme = localStorage.getItem("userTheme") || "basic";
    applyTheme(currentTheme);
    const loadUserData = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId)
        return;
      try {
        await fetchWithAuth(`api/user/${userId}`);
        const statResponse = await fetchWithAuth(`/api/game/users/${userId}/stats`);
        if (statResponse.ok) {
          const jsonResponse = await statResponse.json();
          console.log("Stats re\xE7ues du Backend:", jsonResponse);
          const stats = jsonResponse.data || jsonResponse;
          if (stats) {
            if (totalGame) totalGame.innerText = stats.total_games.toString();
            if (wins) wins.innerText = stats.wins.toString();
            if (losses) losses.innerText = stats.losses.toString();
            if (avgScore) avgScore.innerText = stats.averageScore?.toString() || "0";
            if (winRateCalcul) {
              let rateValue = 0;
              if (stats.total_games > 0) {
                rateValue = Math.round(stats.wins / stats.total_games * 100);
              }
              winRateCalcul.innerText = `${rateValue}%`;
            }
            const mockHistoryData = generateMockHistory(stats.wins, stats.losses);
            renderEvolutionChart(evolutionCanvas, mockHistoryData);
            const distribution = stats.gameType || {
              local: Math.round(stats.total_games * 0.4),
              remote: Math.round(stats.total_games * 0.4),
              tournament: Math.round(stats.total_games * 0.2)
            };
            renderGameTypeChart(gameTypeCanvas, distribution);
          } else {
            console.warn("Could not fetch user stats");
          }
        }
      } catch (error) {
        console.error("Erreur while charging profile:", error);
      }
    };
    loadUserData();
  }

  // scripts/main.ts
  var appElement = document.getElementById("app");
  var publicRoutes = ["/", "/login", "/register", "/404", "/guest"];
  var routes = {
    "/": {
      render: render4,
      afterRender: initLandingPage
    },
    "/home": {
      render: render2,
      afterRender
    },
    "/profile": {
      render: render3,
      afterRender: afterRender2
    },
    "/dashboard": {
      render: render7,
      afterRender: afterRender4
    },
    "/register": {
      render: RegisterPage,
      afterRender: registerEvents
    },
    "/login": {
      render,
      afterRender: loginEvents
    },
    "/guest": {
      render: render5,
      afterRender: afterRender3
    },
    "/game": {
      render: render6,
      // La fonction HTML
      afterRender: () => {
        const state = window.history.state;
        const mode = state && state.gameMode ? state.gameMode : "local";
        initGamePage(mode);
      }
    },
    "/404": {
      render: NotFoundPage
    }
  };
  var handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        // force l'envoi du cookie HttpOnly au serveur
        credentials: "include",
        body: JSON.stringify({})
        // force le format JSON
      });
      console.log("Deconnection from the backend server succeed");
    } catch (error) {
      console.error("Error during the deconnection from the server: ", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("username");
      localStorage.removeItem("userStatus");
      sessionStorage.clear();
      window.history.pushState({}, "", "/");
      const popStateEvent = new PopStateEvent("popstate");
      window.dispatchEvent(popStateEvent);
    }
  };
  var clearGuestSession = () => {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("isGuest");
  };
  var handleLocationChange = () => {
    if (!appElement) return;
    let path = window.location.pathname;
    if ((path === "/" || path === "/login" || path === "/register") && sessionStorage.getItem("isGuest") === "true") {
      clearGuestSession();
    }
    const accessToken = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    const isGuest = sessionStorage.getItem("isGuest") === "true";
    if (isGameRunning() && path !== "/game") cleanup();
    if (path === "/logout") {
      handleLogout();
      return;
    }
    const navbar = document.getElementById("main-navbar");
    const userMenuHtml = `
        <a href="/home" class="text-white hover:underline">Home</a>
        <a href="/profile" class="text-white hover:underline">Profile</a>
        <a href="/dashboard" class="text-white hover:underline">Dashboard</a>
        <a href="/logout" class="text-white hover:underline">Log out</a>
    `;
    const guestMenuHtml = `
        <a href="/guest" class="text-white hover:underline">Guest Area</a>
        <a href="/logout" class="text-white hover:underline">Log out</a>
    `;
    if (navbar) {
      if (isGuest) {
        navbar.style.display = "flex";
        if (!navbar.innerHTML.includes("Guest Area")) {
          navbar.innerHTML = guestMenuHtml;
        }
      } else if (accessToken) {
        navbar.style.display = "flex";
        navbar.classList.add("justify-between");
        if (!navbar.innerHTML.includes("Dashboard")) {
          navbar.innerHTML = userMenuHtml;
        }
      } else {
        navbar.style.display = "none";
      }
    }
    const page = routes[path] || routes["/404"];
    appElement.innerHTML = page.render();
    if (page.afterRender) {
      page.afterRender();
    }
    if (publicRoutes.includes(path) || isGuest)
      applyTheme("basic");
    else {
      const savedTheme = localStorage.getItem("userTheme") || "basic";
      applyTheme(savedTheme);
    }
    if (path === "/guest" && !isGuest) {
      window.history.replaceState({}, "", "/");
      handleLocationChange();
    }
  };
  window.addEventListener("click", (event) => {
    const target = event.target;
    const anchor = target.closest("a");
    if (anchor && anchor.href.startsWith(window.location.origin)) {
      event.preventDefault();
      if (isGameRunning()) {
        event.stopImmediatePropagation();
        showExitConfirmationModal();
        return;
      }
      const href = anchor.href;
      if (href === window.location.href) return;
      window.history.pushState({}, "", href);
      handleLocationChange();
    }
  });
  window.addEventListener("popstate", () => {
    if (isGameRunning()) {
      window.history.pushState(null, "", "/game");
      showExitConfirmationModal();
      return;
    }
    handleLocationChange();
  });
  document.addEventListener("DOMContentLoaded", () => {
    handleLocationChange();
  });
})();

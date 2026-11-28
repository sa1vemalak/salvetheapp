(()=>{var wh=function(n){let e=[],t=0;for(let r=0;r<n.length;r++){let i=n.charCodeAt(r);i<128?e[t++]=i:i<2048?(e[t++]=i>>6|192,e[t++]=i&63|128):(i&64512)===55296&&r+1<n.length&&(n.charCodeAt(r+1)&64512)===56320?(i=65536+((i&1023)<<10)+(n.charCodeAt(++r)&1023),e[t++]=i>>18|240,e[t++]=i>>12&63|128,e[t++]=i>>6&63|128,e[t++]=i&63|128):(e[t++]=i>>12|224,e[t++]=i>>6&63|128,e[t++]=i&63|128)}return e},Km=function(n){let e=[],t=0,r=0;for(;t<n.length;){let i=n[t++];if(i<128)e[r++]=String.fromCharCode(i);else if(i>191&&i<224){let s=n[t++];e[r++]=String.fromCharCode((i&31)<<6|s&63)}else if(i>239&&i<365){let s=n[t++],a=n[t++],c=n[t++],l=((i&7)<<18|(s&63)<<12|(a&63)<<6|c&63)-65536;e[r++]=String.fromCharCode(55296+(l>>10)),e[r++]=String.fromCharCode(56320+(l&1023))}else{let s=n[t++],a=n[t++];e[r++]=String.fromCharCode((i&15)<<12|(s&63)<<6|a&63)}}return e.join("")},Eh={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(n,e){if(!Array.isArray(n))throw Error("encodeByteArray takes an array as a parameter");this.init_();let t=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,r=[];for(let i=0;i<n.length;i+=3){let s=n[i],a=i+1<n.length,c=a?n[i+1]:0,l=i+2<n.length,d=l?n[i+2]:0,p=s>>2,g=(s&3)<<4|c>>4,v=(c&15)<<2|d>>6,w=d&63;l||(w=64,a||(v=64)),r.push(t[p],t[g],t[v],t[w])}return r.join("")},encodeString(n,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(n):this.encodeByteArray(wh(n),e)},decodeString(n,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(n):Km(this.decodeStringToByteArray(n,e))},decodeStringToByteArray(n,e){this.init_();let t=e?this.charToByteMapWebSafe_:this.charToByteMap_,r=[];for(let i=0;i<n.length;){let s=t[n.charAt(i++)],c=i<n.length?t[n.charAt(i)]:0;++i;let d=i<n.length?t[n.charAt(i)]:64;++i;let g=i<n.length?t[n.charAt(i)]:64;if(++i,s==null||c==null||d==null||g==null)throw new Qo;let v=s<<2|c>>4;if(r.push(v),d!==64){let w=c<<4&240|d>>2;if(r.push(w),g!==64){let R=d<<6&192|g;r.push(R)}}}return r},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let n=0;n<this.ENCODED_VALS.length;n++)this.byteToCharMap_[n]=this.ENCODED_VALS.charAt(n),this.charToByteMap_[this.byteToCharMap_[n]]=n,this.byteToCharMapWebSafe_[n]=this.ENCODED_VALS_WEBSAFE.charAt(n),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[n]]=n,n>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(n)]=n,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(n)]=n)}}},Qo=class extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}},Hm=function(n){let e=wh(n);return Eh.encodeByteArray(e,!0)},vr=function(n){return Hm(n).replace(/\./g,"")},Yo=function(n){try{return Eh.decodeString(n,!0)}catch(e){console.error("base64Decode failed: ",e)}return null};function Wm(){if(typeof self!="undefined")return self;if(typeof window!="undefined")return window;if(typeof global!="undefined")return global;throw new Error("Unable to locate global object.")}var Qm=()=>Wm().__FIREBASE_DEFAULTS__,Jm=()=>{if(typeof process=="undefined"||typeof process.env=="undefined")return;let n=process.env.__FIREBASE_DEFAULTS__;if(n)return JSON.parse(n)},Ym=()=>{if(typeof document=="undefined")return;let n;try{n=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}let e=n&&Yo(n[1]);return e&&JSON.parse(e)},Fi=()=>{try{return Qm()||Jm()||Ym()}catch(n){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${n}`);return}},Xo=n=>{var e,t;return(t=(e=Fi())===null||e===void 0?void 0:e.emulatorHosts)===null||t===void 0?void 0:t[n]},Ui=n=>{let e=Xo(n);if(!e)return;let t=e.lastIndexOf(":");if(t<=0||t+1===e.length)throw new Error(`Invalid host ${e} with no separate hostname and port!`);let r=parseInt(e.substring(t+1),10);return e[0]==="["?[e.substring(1,t-1),r]:[e.substring(0,t),r]},Zo=()=>{var n;return(n=Fi())===null||n===void 0?void 0:n.config},ea=n=>{var e;return(e=Fi())===null||e===void 0?void 0:e[`_${n}`]};var Mi=class{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}wrapCallback(e){return(t,r)=>{t?this.reject(t):this.resolve(r),typeof e=="function"&&(this.promise.catch(()=>{}),e.length===1?e(t):e(t,r))}}};function qi(n,e){if(n.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');let t={alg:"none",type:"JWT"},r=e||"demo-project",i=n.iat||0,s=n.sub||n.user_id;if(!s)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");let a=Object.assign({iss:`https://securetoken.google.com/${r}`,aud:r,iat:i,exp:i+3600,auth_time:i,sub:s,user_id:s,firebase:{sign_in_provider:"custom",identities:{}}},n);return[vr(JSON.stringify(t)),vr(JSON.stringify(a)),""].join(".")}function me(){return typeof navigator!="undefined"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function Th(){return typeof window!="undefined"&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(me())}function Xm(){var n;let e=(n=Fi())===null||n===void 0?void 0:n.forceEnvironment;if(e==="node")return!0;if(e==="browser")return!1;try{return Object.prototype.toString.call(global.process)==="[object process]"}catch{return!1}}function bh(){return typeof navigator!="undefined"&&navigator.userAgent==="Cloudflare-Workers"}function Ah(){let n=typeof chrome=="object"?chrome.runtime:typeof browser=="object"?browser.runtime:void 0;return typeof n=="object"&&n.id!==void 0}function Sh(){return typeof navigator=="object"&&navigator.product==="ReactNative"}function Rh(){let n=me();return n.indexOf("MSIE ")>=0||n.indexOf("Trident/")>=0}function Ph(){return!Xm()&&!!navigator.userAgent&&navigator.userAgent.includes("Safari")&&!navigator.userAgent.includes("Chrome")}function ta(){try{return typeof indexedDB=="object"}catch{return!1}}function Ch(){return new Promise((n,e)=>{try{let t=!0,r="validate-browser-context-for-indexeddb-analytics-module",i=self.indexedDB.open(r);i.onsuccess=()=>{i.result.close(),t||self.indexedDB.deleteDatabase(r),n(!0)},i.onupgradeneeded=()=>{t=!1},i.onerror=()=>{var s;e(((s=i.error)===null||s===void 0?void 0:s.message)||"")}}catch(t){e(t)}})}var Zm="FirebaseError",De=class n extends Error{constructor(e,t,r){super(t),this.code=e,this.customData=r,this.name=Zm,Object.setPrototypeOf(this,n.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,ht.prototype.create)}},ht=class{constructor(e,t,r){this.service=e,this.serviceName=t,this.errors=r}create(e,...t){let r=t[0]||{},i=`${this.service}/${e}`,s=this.errors[e],a=s?eg(s,r):"Error",c=`${this.serviceName}: ${a} (${i}).`;return new De(i,c,r)}};function eg(n,e){return n.replace(tg,(t,r)=>{let i=e[r];return i!=null?String(i):`<${r}?>`})}var tg=/\{\$([^}]+)}/g;function kh(n){for(let e in n)if(Object.prototype.hasOwnProperty.call(n,e))return!1;return!0}function jt(n,e){if(n===e)return!0;let t=Object.keys(n),r=Object.keys(e);for(let i of t){if(!r.includes(i))return!1;let s=n[i],a=e[i];if(Ih(s)&&Ih(a)){if(!jt(s,a))return!1}else if(s!==a)return!1}for(let i of r)if(!t.includes(i))return!1;return!0}function Ih(n){return n!==null&&typeof n=="object"}function _n(n){let e=[];for(let[t,r]of Object.entries(n))Array.isArray(r)?r.forEach(i=>{e.push(encodeURIComponent(t)+"="+encodeURIComponent(i))}):e.push(encodeURIComponent(t)+"="+encodeURIComponent(r));return e.length?"&"+e.join("&"):""}function yn(n){let e={};return n.replace(/^\?/,"").split("&").forEach(r=>{if(r){let[i,s]=r.split("=");e[decodeURIComponent(i)]=decodeURIComponent(s)}}),e}function vn(n){let e=n.indexOf("?");if(!e)return"";let t=n.indexOf("#",e);return n.substring(e,t>0?t:void 0)}function Nh(n,e){let t=new Jo(n,e);return t.subscribe.bind(t)}var Jo=class{constructor(e,t){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=t,this.task.then(()=>{e(this)}).catch(r=>{this.error(r)})}next(e){this.forEachObserver(t=>{t.next(e)})}error(e){this.forEachObserver(t=>{t.error(e)}),this.close(e)}complete(){this.forEachObserver(e=>{e.complete()}),this.close()}subscribe(e,t,r){let i;if(e===void 0&&t===void 0&&r===void 0)throw new Error("Missing Observer.");ng(e,["next","error","complete"])?i=e:i={next:e,error:t,complete:r},i.next===void 0&&(i.next=Wo),i.error===void 0&&(i.error=Wo),i.complete===void 0&&(i.complete=Wo);let s=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?i.error(this.finalError):i.complete()}catch{}}),this.observers.push(i),s}unsubscribeOne(e){this.observers===void 0||this.observers[e]===void 0||(delete this.observers[e],this.observerCount-=1,this.observerCount===0&&this.onNoObservers!==void 0&&this.onNoObservers(this))}forEachObserver(e){if(!this.finalized)for(let t=0;t<this.observers.length;t++)this.sendOne(t,e)}sendOne(e,t){this.task.then(()=>{if(this.observers!==void 0&&this.observers[e]!==void 0)try{t(this.observers[e])}catch(r){typeof console!="undefined"&&console.error&&console.error(r)}})}close(e){this.finalized||(this.finalized=!0,e!==void 0&&(this.finalError=e),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}};function ng(n,e){if(typeof n!="object"||n===null)return!1;for(let t of e)if(t in n&&typeof n[t]=="function")return!0;return!1}function Wo(){}var lE=4*60*60*1e3;function ee(n){return n&&n._delegate?n._delegate:n}var xe=class{constructor(e,t,r){this.name=e,this.instanceFactory=t,this.type=r,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}};var zt="[DEFAULT]";var na=class{constructor(e,t){this.name=e,this.container=t,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){let t=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(t)){let r=new Mi;if(this.instancesDeferred.set(t,r),this.isInitialized(t)||this.shouldAutoInitialize())try{let i=this.getOrInitializeService({instanceIdentifier:t});i&&r.resolve(i)}catch{}}return this.instancesDeferred.get(t).promise}getImmediate(e){var t;let r=this.normalizeInstanceIdentifier(e==null?void 0:e.identifier),i=(t=e==null?void 0:e.optional)!==null&&t!==void 0?t:!1;if(this.isInitialized(r)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:r})}catch(s){if(i)return null;throw s}else{if(i)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,!!this.shouldAutoInitialize()){if(ig(e))try{this.getOrInitializeService({instanceIdentifier:zt})}catch{}for(let[t,r]of this.instancesDeferred.entries()){let i=this.normalizeInstanceIdentifier(t);try{let s=this.getOrInitializeService({instanceIdentifier:i});r.resolve(s)}catch{}}}}clearInstance(e=zt){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){let e=Array.from(this.instances.values());await Promise.all([...e.filter(t=>"INTERNAL"in t).map(t=>t.INTERNAL.delete()),...e.filter(t=>"_delete"in t).map(t=>t._delete())])}isComponentSet(){return this.component!=null}isInitialized(e=zt){return this.instances.has(e)}getOptions(e=zt){return this.instancesOptions.get(e)||{}}initialize(e={}){let{options:t={}}=e,r=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(r))throw Error(`${this.name}(${r}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);let i=this.getOrInitializeService({instanceIdentifier:r,options:t});for(let[s,a]of this.instancesDeferred.entries()){let c=this.normalizeInstanceIdentifier(s);r===c&&a.resolve(i)}return i}onInit(e,t){var r;let i=this.normalizeInstanceIdentifier(t),s=(r=this.onInitCallbacks.get(i))!==null&&r!==void 0?r:new Set;s.add(e),this.onInitCallbacks.set(i,s);let a=this.instances.get(i);return a&&e(a,i),()=>{s.delete(e)}}invokeOnInitCallbacks(e,t){let r=this.onInitCallbacks.get(t);if(r)for(let i of r)try{i(e,t)}catch{}}getOrInitializeService({instanceIdentifier:e,options:t={}}){let r=this.instances.get(e);if(!r&&this.component&&(r=this.component.instanceFactory(this.container,{instanceIdentifier:rg(e),options:t}),this.instances.set(e,r),this.instancesOptions.set(e,t),this.invokeOnInitCallbacks(r,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,r)}catch{}return r||null}normalizeInstanceIdentifier(e=zt){return this.component?this.component.multipleInstances?e:zt:e}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}};function rg(n){return n===zt?void 0:n}function ig(n){return n.instantiationMode==="EAGER"}var Bi=class{constructor(e){this.name=e,this.providers=new Map}addComponent(e){let t=this.getProvider(e.name);if(t.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);t.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);let t=new na(e,this);return this.providers.set(e,t),t}getProviders(){return Array.from(this.providers.values())}};var sg=[],$;(function(n){n[n.DEBUG=0]="DEBUG",n[n.VERBOSE=1]="VERBOSE",n[n.INFO=2]="INFO",n[n.WARN=3]="WARN",n[n.ERROR=4]="ERROR",n[n.SILENT=5]="SILENT"})($||($={}));var og={debug:$.DEBUG,verbose:$.VERBOSE,info:$.INFO,warn:$.WARN,error:$.ERROR,silent:$.SILENT},ag=$.INFO,cg={[$.DEBUG]:"log",[$.VERBOSE]:"log",[$.INFO]:"info",[$.WARN]:"warn",[$.ERROR]:"error"},ug=(n,e,...t)=>{if(e<n.logLevel)return;let r=new Date().toISOString(),i=cg[e];if(i)console[i](`[${r}]  ${n.name}:`,...t);else throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)},St=class{constructor(e){this.name=e,this._logLevel=ag,this._logHandler=ug,this._userLogHandler=null,sg.push(this)}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in $))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel=typeof e=="string"?og[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if(typeof e!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,$.DEBUG,...e),this._logHandler(this,$.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,$.VERBOSE,...e),this._logHandler(this,$.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,$.INFO,...e),this._logHandler(this,$.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,$.WARN,...e),this._logHandler(this,$.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,$.ERROR,...e),this._logHandler(this,$.ERROR,...e)}};var lg=(n,e)=>e.some(t=>n instanceof t),Dh,xh;function hg(){return Dh||(Dh=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function dg(){return xh||(xh=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}var Oh=new WeakMap,ia=new WeakMap,Vh=new WeakMap,ra=new WeakMap,oa=new WeakMap;function fg(n){let e=new Promise((t,r)=>{let i=()=>{n.removeEventListener("success",s),n.removeEventListener("error",a)},s=()=>{t(He(n.result)),i()},a=()=>{r(n.error),i()};n.addEventListener("success",s),n.addEventListener("error",a)});return e.then(t=>{t instanceof IDBCursor&&Oh.set(t,n)}).catch(()=>{}),oa.set(e,n),e}function pg(n){if(ia.has(n))return;let e=new Promise((t,r)=>{let i=()=>{n.removeEventListener("complete",s),n.removeEventListener("error",a),n.removeEventListener("abort",a)},s=()=>{t(),i()},a=()=>{r(n.error||new DOMException("AbortError","AbortError")),i()};n.addEventListener("complete",s),n.addEventListener("error",a),n.addEventListener("abort",a)});ia.set(n,e)}var sa={get(n,e,t){if(n instanceof IDBTransaction){if(e==="done")return ia.get(n);if(e==="objectStoreNames")return n.objectStoreNames||Vh.get(n);if(e==="store")return t.objectStoreNames[1]?void 0:t.objectStore(t.objectStoreNames[0])}return He(n[e])},set(n,e,t){return n[e]=t,!0},has(n,e){return n instanceof IDBTransaction&&(e==="done"||e==="store")?!0:e in n}};function Lh(n){sa=n(sa)}function mg(n){return n===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(e,...t){let r=n.call(ji(this),e,...t);return Vh.set(r,e.sort?e.sort():[e]),He(r)}:dg().includes(n)?function(...e){return n.apply(ji(this),e),He(Oh.get(this))}:function(...e){return He(n.apply(ji(this),e))}}function gg(n){return typeof n=="function"?mg(n):(n instanceof IDBTransaction&&pg(n),lg(n,hg())?new Proxy(n,sa):n)}function He(n){if(n instanceof IDBRequest)return fg(n);if(ra.has(n))return ra.get(n);let e=gg(n);return e!==n&&(ra.set(n,e),oa.set(e,n)),e}var ji=n=>oa.get(n);function Fh(n,e,{blocked:t,upgrade:r,blocking:i,terminated:s}={}){let a=indexedDB.open(n,e),c=He(a);return r&&a.addEventListener("upgradeneeded",l=>{r(He(a.result),l.oldVersion,l.newVersion,He(a.transaction),l)}),t&&a.addEventListener("blocked",l=>t(l.oldVersion,l.newVersion,l)),c.then(l=>{s&&l.addEventListener("close",()=>s()),i&&l.addEventListener("versionchange",d=>i(d.oldVersion,d.newVersion,d))}).catch(()=>{}),c}var _g=["get","getKey","getAll","getAllKeys","count"],yg=["put","add","delete","clear"],aa=new Map;function Mh(n,e){if(!(n instanceof IDBDatabase&&!(e in n)&&typeof e=="string"))return;if(aa.get(e))return aa.get(e);let t=e.replace(/FromIndex$/,""),r=e!==t,i=yg.includes(t);if(!(t in(r?IDBIndex:IDBObjectStore).prototype)||!(i||_g.includes(t)))return;let s=async function(a,...c){let l=this.transaction(a,i?"readwrite":"readonly"),d=l.store;return r&&(d=d.index(c.shift())),(await Promise.all([d[t](...c),i&&l.done]))[0]};return aa.set(e,s),s}Lh(n=>({...n,get:(e,t,r)=>Mh(e,t)||n.get(e,t,r),has:(e,t)=>!!Mh(e,t)||n.has(e,t)}));var ua=class{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(t=>{if(vg(t)){let r=t.getImmediate();return`${r.library}/${r.version}`}else return null}).filter(t=>t).join(" ")}};function vg(n){let e=n.getComponent();return(e==null?void 0:e.type)==="VERSION"}var la="@firebase/app",Uh="0.10.13";var dt=new St("@firebase/app"),Ig="@firebase/app-compat",wg="@firebase/analytics-compat",Eg="@firebase/analytics",Tg="@firebase/app-check-compat",bg="@firebase/app-check",Ag="@firebase/auth",Sg="@firebase/auth-compat",Rg="@firebase/database",Pg="@firebase/data-connect",Cg="@firebase/database-compat",kg="@firebase/functions",Ng="@firebase/functions-compat",Dg="@firebase/installations",xg="@firebase/installations-compat",Og="@firebase/messaging",Vg="@firebase/messaging-compat",Lg="@firebase/performance",Mg="@firebase/performance-compat",Fg="@firebase/remote-config",Ug="@firebase/remote-config-compat",qg="@firebase/storage",Bg="@firebase/storage-compat",jg="@firebase/firestore",zg="@firebase/vertexai-preview",Gg="@firebase/firestore-compat",$g="firebase",Kg="10.14.1";var ha="[DEFAULT]",Hg={[la]:"fire-core",[Ig]:"fire-core-compat",[Eg]:"fire-analytics",[wg]:"fire-analytics-compat",[bg]:"fire-app-check",[Tg]:"fire-app-check-compat",[Ag]:"fire-auth",[Sg]:"fire-auth-compat",[Rg]:"fire-rtdb",[Pg]:"fire-data-connect",[Cg]:"fire-rtdb-compat",[kg]:"fire-fn",[Ng]:"fire-fn-compat",[Dg]:"fire-iid",[xg]:"fire-iid-compat",[Og]:"fire-fcm",[Vg]:"fire-fcm-compat",[Lg]:"fire-perf",[Mg]:"fire-perf-compat",[Fg]:"fire-rc",[Ug]:"fire-rc-compat",[qg]:"fire-gcs",[Bg]:"fire-gcs-compat",[jg]:"fire-fst",[Gg]:"fire-fst-compat",[zg]:"fire-vertex","fire-js":"fire-js",[$g]:"fire-js-all"};var zi=new Map,Wg=new Map,da=new Map;function qh(n,e){try{n.container.addComponent(e)}catch(t){dt.debug(`Component ${e.name} failed to register with FirebaseApp ${n.name}`,t)}}function We(n){let e=n.name;if(da.has(e))return dt.debug(`There were multiple attempts to register component ${e}.`),!1;da.set(e,n);for(let t of zi.values())qh(t,n);for(let t of Wg.values())qh(t,n);return!0}function Gt(n,e){let t=n.container.getProvider("heartbeat").getImmediate({optional:!0});return t&&t.triggerHeartbeat(),n.container.getProvider(e)}function Qe(n){return n.settings!==void 0}var Qg={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},Rt=new ht("app","Firebase",Qg);var fa=class{constructor(e,t,r){this._isDeleted=!1,this._options=Object.assign({},e),this._config=Object.assign({},t),this._name=t.name,this._automaticDataCollectionEnabled=t.automaticDataCollectionEnabled,this._container=r,this.container.addComponent(new xe("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw Rt.create("app-deleted",{appName:this._name})}};var Je=Kg;function ga(n,e={}){let t=n;typeof e!="object"&&(e={name:e});let r=Object.assign({name:ha,automaticDataCollectionEnabled:!1},e),i=r.name;if(typeof i!="string"||!i)throw Rt.create("bad-app-name",{appName:String(i)});if(t||(t=Zo()),!t)throw Rt.create("no-options");let s=zi.get(i);if(s){if(jt(t,s.options)&&jt(r,s.config))return s;throw Rt.create("duplicate-app",{appName:i})}let a=new Bi(i);for(let l of da.values())a.addComponent(l);let c=new fa(t,r,a);return zi.set(i,c),c}function In(n=ha){let e=zi.get(n);if(!e&&n===ha&&Zo())return ga();if(!e)throw Rt.create("no-app",{appName:n});return e}function Oe(n,e,t){var r;let i=(r=Hg[n])!==null&&r!==void 0?r:n;t&&(i+=`-${t}`);let s=i.match(/\s|\//),a=e.match(/\s|\//);if(s||a){let c=[`Unable to register library "${i}" with version "${e}":`];s&&c.push(`library name "${i}" contains illegal characters (whitespace or "/")`),s&&a&&c.push("and"),a&&c.push(`version name "${e}" contains illegal characters (whitespace or "/")`),dt.warn(c.join(" "));return}We(new xe(`${i}-version`,()=>({library:i,version:e}),"VERSION"))}var Jg="firebase-heartbeat-database",Yg=1,Ir="firebase-heartbeat-store",ca=null;function Gh(){return ca||(ca=Fh(Jg,Yg,{upgrade:(n,e)=>{switch(e){case 0:try{n.createObjectStore(Ir)}catch(t){console.warn(t)}}}}).catch(n=>{throw Rt.create("idb-open",{originalErrorMessage:n.message})})),ca}async function Xg(n){try{let t=(await Gh()).transaction(Ir),r=await t.objectStore(Ir).get($h(n));return await t.done,r}catch(e){if(e instanceof De)dt.warn(e.message);else{let t=Rt.create("idb-get",{originalErrorMessage:e==null?void 0:e.message});dt.warn(t.message)}}}async function Bh(n,e){try{let r=(await Gh()).transaction(Ir,"readwrite");await r.objectStore(Ir).put(e,$h(n)),await r.done}catch(t){if(t instanceof De)dt.warn(t.message);else{let r=Rt.create("idb-set",{originalErrorMessage:t==null?void 0:t.message});dt.warn(r.message)}}}function $h(n){return`${n.name}!${n.options.appId}`}var Zg=1024,e_=30*24*60*60*1e3,pa=class{constructor(e){this.container=e,this._heartbeatsCache=null;let t=this.container.getProvider("app").getImmediate();this._storage=new ma(t),this._heartbeatsCachePromise=this._storage.read().then(r=>(this._heartbeatsCache=r,r))}async triggerHeartbeat(){var e,t;try{let i=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),s=jh();return((e=this._heartbeatsCache)===null||e===void 0?void 0:e.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((t=this._heartbeatsCache)===null||t===void 0?void 0:t.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===s||this._heartbeatsCache.heartbeats.some(a=>a.date===s)?void 0:(this._heartbeatsCache.heartbeats.push({date:s,agent:i}),this._heartbeatsCache.heartbeats=this._heartbeatsCache.heartbeats.filter(a=>{let c=new Date(a.date).valueOf();return Date.now()-c<=e_}),this._storage.overwrite(this._heartbeatsCache))}catch(r){dt.warn(r)}}async getHeartbeatsHeader(){var e;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((e=this._heartbeatsCache)===null||e===void 0?void 0:e.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";let t=jh(),{heartbeatsToSend:r,unsentEntries:i}=t_(this._heartbeatsCache.heartbeats),s=vr(JSON.stringify({version:2,heartbeats:r}));return this._heartbeatsCache.lastSentHeartbeatDate=t,i.length>0?(this._heartbeatsCache.heartbeats=i,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),s}catch(t){return dt.warn(t),""}}};function jh(){return new Date().toISOString().substring(0,10)}function t_(n,e=Zg){let t=[],r=n.slice();for(let i of n){let s=t.find(a=>a.agent===i.agent);if(s){if(s.dates.push(i.date),zh(t)>e){s.dates.pop();break}}else if(t.push({agent:i.agent,dates:[i.date]}),zh(t)>e){t.pop();break}r=r.slice(1)}return{heartbeatsToSend:t,unsentEntries:r}}var ma=class{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return ta()?Ch().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){let t=await Xg(this.app);return t!=null&&t.heartbeats?t:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(e){var t;if(await this._canUseIndexedDBPromise){let i=await this.read();return Bh(this.app,{lastSentHeartbeatDate:(t=e.lastSentHeartbeatDate)!==null&&t!==void 0?t:i.lastSentHeartbeatDate,heartbeats:e.heartbeats})}else return}async add(e){var t;if(await this._canUseIndexedDBPromise){let i=await this.read();return Bh(this.app,{lastSentHeartbeatDate:(t=e.lastSentHeartbeatDate)!==null&&t!==void 0?t:i.lastSentHeartbeatDate,heartbeats:[...i.heartbeats,...e.heartbeats]})}else return}};function zh(n){return vr(JSON.stringify({version:2,heartbeats:n})).length}function n_(n){We(new xe("platform-logger",e=>new ua(e),"PRIVATE")),We(new xe("heartbeat",e=>new pa(e),"PRIVATE")),Oe(la,Uh,n),Oe(la,Uh,"esm2017"),Oe("fire-js","")}n_("");var r_="firebase",i_="10.14.1";Oe(r_,i_,"app");var Kh=typeof globalThis!="undefined"?globalThis:typeof window!="undefined"?window:typeof global!="undefined"?global:typeof self!="undefined"?self:{},Hh={};var Pt,_a;(function(){var n;function e(E,m){function _(){}_.prototype=m.prototype,E.D=m.prototype,E.prototype=new _,E.prototype.constructor=E,E.C=function(I,T,A){for(var y=Array(arguments.length-2),ct=2;ct<arguments.length;ct++)y[ct-2]=arguments[ct];return m.prototype[T].apply(I,y)}}function t(){this.blockSize=-1}function r(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.B=Array(this.blockSize),this.o=this.h=0,this.s()}e(r,t),r.prototype.s=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0};function i(E,m,_){_||(_=0);var I=Array(16);if(typeof m=="string")for(var T=0;16>T;++T)I[T]=m.charCodeAt(_++)|m.charCodeAt(_++)<<8|m.charCodeAt(_++)<<16|m.charCodeAt(_++)<<24;else for(T=0;16>T;++T)I[T]=m[_++]|m[_++]<<8|m[_++]<<16|m[_++]<<24;m=E.g[0],_=E.g[1],T=E.g[2];var A=E.g[3],y=m+(A^_&(T^A))+I[0]+3614090360&4294967295;m=_+(y<<7&4294967295|y>>>25),y=A+(T^m&(_^T))+I[1]+3905402710&4294967295,A=m+(y<<12&4294967295|y>>>20),y=T+(_^A&(m^_))+I[2]+606105819&4294967295,T=A+(y<<17&4294967295|y>>>15),y=_+(m^T&(A^m))+I[3]+3250441966&4294967295,_=T+(y<<22&4294967295|y>>>10),y=m+(A^_&(T^A))+I[4]+4118548399&4294967295,m=_+(y<<7&4294967295|y>>>25),y=A+(T^m&(_^T))+I[5]+1200080426&4294967295,A=m+(y<<12&4294967295|y>>>20),y=T+(_^A&(m^_))+I[6]+2821735955&4294967295,T=A+(y<<17&4294967295|y>>>15),y=_+(m^T&(A^m))+I[7]+4249261313&4294967295,_=T+(y<<22&4294967295|y>>>10),y=m+(A^_&(T^A))+I[8]+1770035416&4294967295,m=_+(y<<7&4294967295|y>>>25),y=A+(T^m&(_^T))+I[9]+2336552879&4294967295,A=m+(y<<12&4294967295|y>>>20),y=T+(_^A&(m^_))+I[10]+4294925233&4294967295,T=A+(y<<17&4294967295|y>>>15),y=_+(m^T&(A^m))+I[11]+2304563134&4294967295,_=T+(y<<22&4294967295|y>>>10),y=m+(A^_&(T^A))+I[12]+1804603682&4294967295,m=_+(y<<7&4294967295|y>>>25),y=A+(T^m&(_^T))+I[13]+4254626195&4294967295,A=m+(y<<12&4294967295|y>>>20),y=T+(_^A&(m^_))+I[14]+2792965006&4294967295,T=A+(y<<17&4294967295|y>>>15),y=_+(m^T&(A^m))+I[15]+1236535329&4294967295,_=T+(y<<22&4294967295|y>>>10),y=m+(T^A&(_^T))+I[1]+4129170786&4294967295,m=_+(y<<5&4294967295|y>>>27),y=A+(_^T&(m^_))+I[6]+3225465664&4294967295,A=m+(y<<9&4294967295|y>>>23),y=T+(m^_&(A^m))+I[11]+643717713&4294967295,T=A+(y<<14&4294967295|y>>>18),y=_+(A^m&(T^A))+I[0]+3921069994&4294967295,_=T+(y<<20&4294967295|y>>>12),y=m+(T^A&(_^T))+I[5]+3593408605&4294967295,m=_+(y<<5&4294967295|y>>>27),y=A+(_^T&(m^_))+I[10]+38016083&4294967295,A=m+(y<<9&4294967295|y>>>23),y=T+(m^_&(A^m))+I[15]+3634488961&4294967295,T=A+(y<<14&4294967295|y>>>18),y=_+(A^m&(T^A))+I[4]+3889429448&4294967295,_=T+(y<<20&4294967295|y>>>12),y=m+(T^A&(_^T))+I[9]+568446438&4294967295,m=_+(y<<5&4294967295|y>>>27),y=A+(_^T&(m^_))+I[14]+3275163606&4294967295,A=m+(y<<9&4294967295|y>>>23),y=T+(m^_&(A^m))+I[3]+4107603335&4294967295,T=A+(y<<14&4294967295|y>>>18),y=_+(A^m&(T^A))+I[8]+1163531501&4294967295,_=T+(y<<20&4294967295|y>>>12),y=m+(T^A&(_^T))+I[13]+2850285829&4294967295,m=_+(y<<5&4294967295|y>>>27),y=A+(_^T&(m^_))+I[2]+4243563512&4294967295,A=m+(y<<9&4294967295|y>>>23),y=T+(m^_&(A^m))+I[7]+1735328473&4294967295,T=A+(y<<14&4294967295|y>>>18),y=_+(A^m&(T^A))+I[12]+2368359562&4294967295,_=T+(y<<20&4294967295|y>>>12),y=m+(_^T^A)+I[5]+4294588738&4294967295,m=_+(y<<4&4294967295|y>>>28),y=A+(m^_^T)+I[8]+2272392833&4294967295,A=m+(y<<11&4294967295|y>>>21),y=T+(A^m^_)+I[11]+1839030562&4294967295,T=A+(y<<16&4294967295|y>>>16),y=_+(T^A^m)+I[14]+4259657740&4294967295,_=T+(y<<23&4294967295|y>>>9),y=m+(_^T^A)+I[1]+2763975236&4294967295,m=_+(y<<4&4294967295|y>>>28),y=A+(m^_^T)+I[4]+1272893353&4294967295,A=m+(y<<11&4294967295|y>>>21),y=T+(A^m^_)+I[7]+4139469664&4294967295,T=A+(y<<16&4294967295|y>>>16),y=_+(T^A^m)+I[10]+3200236656&4294967295,_=T+(y<<23&4294967295|y>>>9),y=m+(_^T^A)+I[13]+681279174&4294967295,m=_+(y<<4&4294967295|y>>>28),y=A+(m^_^T)+I[0]+3936430074&4294967295,A=m+(y<<11&4294967295|y>>>21),y=T+(A^m^_)+I[3]+3572445317&4294967295,T=A+(y<<16&4294967295|y>>>16),y=_+(T^A^m)+I[6]+76029189&4294967295,_=T+(y<<23&4294967295|y>>>9),y=m+(_^T^A)+I[9]+3654602809&4294967295,m=_+(y<<4&4294967295|y>>>28),y=A+(m^_^T)+I[12]+3873151461&4294967295,A=m+(y<<11&4294967295|y>>>21),y=T+(A^m^_)+I[15]+530742520&4294967295,T=A+(y<<16&4294967295|y>>>16),y=_+(T^A^m)+I[2]+3299628645&4294967295,_=T+(y<<23&4294967295|y>>>9),y=m+(T^(_|~A))+I[0]+4096336452&4294967295,m=_+(y<<6&4294967295|y>>>26),y=A+(_^(m|~T))+I[7]+1126891415&4294967295,A=m+(y<<10&4294967295|y>>>22),y=T+(m^(A|~_))+I[14]+2878612391&4294967295,T=A+(y<<15&4294967295|y>>>17),y=_+(A^(T|~m))+I[5]+4237533241&4294967295,_=T+(y<<21&4294967295|y>>>11),y=m+(T^(_|~A))+I[12]+1700485571&4294967295,m=_+(y<<6&4294967295|y>>>26),y=A+(_^(m|~T))+I[3]+2399980690&4294967295,A=m+(y<<10&4294967295|y>>>22),y=T+(m^(A|~_))+I[10]+4293915773&4294967295,T=A+(y<<15&4294967295|y>>>17),y=_+(A^(T|~m))+I[1]+2240044497&4294967295,_=T+(y<<21&4294967295|y>>>11),y=m+(T^(_|~A))+I[8]+1873313359&4294967295,m=_+(y<<6&4294967295|y>>>26),y=A+(_^(m|~T))+I[15]+4264355552&4294967295,A=m+(y<<10&4294967295|y>>>22),y=T+(m^(A|~_))+I[6]+2734768916&4294967295,T=A+(y<<15&4294967295|y>>>17),y=_+(A^(T|~m))+I[13]+1309151649&4294967295,_=T+(y<<21&4294967295|y>>>11),y=m+(T^(_|~A))+I[4]+4149444226&4294967295,m=_+(y<<6&4294967295|y>>>26),y=A+(_^(m|~T))+I[11]+3174756917&4294967295,A=m+(y<<10&4294967295|y>>>22),y=T+(m^(A|~_))+I[2]+718787259&4294967295,T=A+(y<<15&4294967295|y>>>17),y=_+(A^(T|~m))+I[9]+3951481745&4294967295,E.g[0]=E.g[0]+m&4294967295,E.g[1]=E.g[1]+(T+(y<<21&4294967295|y>>>11))&4294967295,E.g[2]=E.g[2]+T&4294967295,E.g[3]=E.g[3]+A&4294967295}r.prototype.u=function(E,m){m===void 0&&(m=E.length);for(var _=m-this.blockSize,I=this.B,T=this.h,A=0;A<m;){if(T==0)for(;A<=_;)i(this,E,A),A+=this.blockSize;if(typeof E=="string"){for(;A<m;)if(I[T++]=E.charCodeAt(A++),T==this.blockSize){i(this,I),T=0;break}}else for(;A<m;)if(I[T++]=E[A++],T==this.blockSize){i(this,I),T=0;break}}this.h=T,this.o+=m},r.prototype.v=function(){var E=Array((56>this.h?this.blockSize:2*this.blockSize)-this.h);E[0]=128;for(var m=1;m<E.length-8;++m)E[m]=0;var _=8*this.o;for(m=E.length-8;m<E.length;++m)E[m]=_&255,_/=256;for(this.u(E),E=Array(16),m=_=0;4>m;++m)for(var I=0;32>I;I+=8)E[_++]=this.g[m]>>>I&255;return E};function s(E,m){var _=c;return Object.prototype.hasOwnProperty.call(_,E)?_[E]:_[E]=m(E)}function a(E,m){this.h=m;for(var _=[],I=!0,T=E.length-1;0<=T;T--){var A=E[T]|0;I&&A==m||(_[T]=A,I=!1)}this.g=_}var c={};function l(E){return-128<=E&&128>E?s(E,function(m){return new a([m|0],0>m?-1:0)}):new a([E|0],0>E?-1:0)}function d(E){if(isNaN(E)||!isFinite(E))return g;if(0>E)return C(d(-E));for(var m=[],_=1,I=0;E>=_;I++)m[I]=E/_|0,_*=4294967296;return new a(m,0)}function p(E,m){if(E.length==0)throw Error("number format error: empty string");if(m=m||10,2>m||36<m)throw Error("radix out of range: "+m);if(E.charAt(0)=="-")return C(p(E.substring(1),m));if(0<=E.indexOf("-"))throw Error('number format error: interior "-" character');for(var _=d(Math.pow(m,8)),I=g,T=0;T<E.length;T+=8){var A=Math.min(8,E.length-T),y=parseInt(E.substring(T,T+A),m);8>A?(A=d(Math.pow(m,A)),I=I.j(A).add(d(y))):(I=I.j(_),I=I.add(d(y)))}return I}var g=l(0),v=l(1),w=l(16777216);n=a.prototype,n.m=function(){if(D(this))return-C(this).m();for(var E=0,m=1,_=0;_<this.g.length;_++){var I=this.i(_);E+=(0<=I?I:4294967296+I)*m,m*=4294967296}return E},n.toString=function(E){if(E=E||10,2>E||36<E)throw Error("radix out of range: "+E);if(R(this))return"0";if(D(this))return"-"+C(this).toString(E);for(var m=d(Math.pow(E,6)),_=this,I="";;){var T=z(_,m).g;_=U(_,T.j(m));var A=((0<_.g.length?_.g[0]:_.h)>>>0).toString(E);if(_=T,R(_))return A+I;for(;6>A.length;)A="0"+A;I=A+I}},n.i=function(E){return 0>E?0:E<this.g.length?this.g[E]:this.h};function R(E){if(E.h!=0)return!1;for(var m=0;m<E.g.length;m++)if(E.g[m]!=0)return!1;return!0}function D(E){return E.h==-1}n.l=function(E){return E=U(this,E),D(E)?-1:R(E)?0:1};function C(E){for(var m=E.g.length,_=[],I=0;I<m;I++)_[I]=~E.g[I];return new a(_,~E.h).add(v)}n.abs=function(){return D(this)?C(this):this},n.add=function(E){for(var m=Math.max(this.g.length,E.g.length),_=[],I=0,T=0;T<=m;T++){var A=I+(this.i(T)&65535)+(E.i(T)&65535),y=(A>>>16)+(this.i(T)>>>16)+(E.i(T)>>>16);I=y>>>16,A&=65535,y&=65535,_[T]=y<<16|A}return new a(_,_[_.length-1]&-2147483648?-1:0)};function U(E,m){return E.add(C(m))}n.j=function(E){if(R(this)||R(E))return g;if(D(this))return D(E)?C(this).j(C(E)):C(C(this).j(E));if(D(E))return C(this.j(C(E)));if(0>this.l(w)&&0>E.l(w))return d(this.m()*E.m());for(var m=this.g.length+E.g.length,_=[],I=0;I<2*m;I++)_[I]=0;for(I=0;I<this.g.length;I++)for(var T=0;T<E.g.length;T++){var A=this.i(I)>>>16,y=this.i(I)&65535,ct=E.i(T)>>>16,er=E.i(T)&65535;_[2*I+2*T]+=y*er,B(_,2*I+2*T),_[2*I+2*T+1]+=A*er,B(_,2*I+2*T+1),_[2*I+2*T+1]+=y*ct,B(_,2*I+2*T+1),_[2*I+2*T+2]+=A*ct,B(_,2*I+2*T+2)}for(I=0;I<m;I++)_[I]=_[2*I+1]<<16|_[2*I];for(I=m;I<2*m;I++)_[I]=0;return new a(_,0)};function B(E,m){for(;(E[m]&65535)!=E[m];)E[m+1]+=E[m]>>>16,E[m]&=65535,m++}function F(E,m){this.g=E,this.h=m}function z(E,m){if(R(m))throw Error("division by zero");if(R(E))return new F(g,g);if(D(E))return m=z(C(E),m),new F(C(m.g),C(m.h));if(D(m))return m=z(E,C(m)),new F(C(m.g),m.h);if(30<E.g.length){if(D(E)||D(m))throw Error("slowDivide_ only works with positive integers.");for(var _=v,I=m;0>=I.l(E);)_=se(_),I=se(I);var T=K(_,1),A=K(I,1);for(I=K(I,2),_=K(_,2);!R(I);){var y=A.add(I);0>=y.l(E)&&(T=T.add(_),A=y),I=K(I,1),_=K(_,1)}return m=U(E,T.j(m)),new F(T,m)}for(T=g;0<=E.l(m);){for(_=Math.max(1,Math.floor(E.m()/m.m())),I=Math.ceil(Math.log(_)/Math.LN2),I=48>=I?1:Math.pow(2,I-48),A=d(_),y=A.j(m);D(y)||0<y.l(E);)_-=I,A=d(_),y=A.j(m);R(A)&&(A=v),T=T.add(A),E=U(E,y)}return new F(T,E)}n.A=function(E){return z(this,E).h},n.and=function(E){for(var m=Math.max(this.g.length,E.g.length),_=[],I=0;I<m;I++)_[I]=this.i(I)&E.i(I);return new a(_,this.h&E.h)},n.or=function(E){for(var m=Math.max(this.g.length,E.g.length),_=[],I=0;I<m;I++)_[I]=this.i(I)|E.i(I);return new a(_,this.h|E.h)},n.xor=function(E){for(var m=Math.max(this.g.length,E.g.length),_=[],I=0;I<m;I++)_[I]=this.i(I)^E.i(I);return new a(_,this.h^E.h)};function se(E){for(var m=E.g.length+1,_=[],I=0;I<m;I++)_[I]=E.i(I)<<1|E.i(I-1)>>>31;return new a(_,E.h)}function K(E,m){var _=m>>5;m%=32;for(var I=E.g.length-_,T=[],A=0;A<I;A++)T[A]=0<m?E.i(A+_)>>>m|E.i(A+_+1)<<32-m:E.i(A+_);return new a(T,E.h)}r.prototype.digest=r.prototype.v,r.prototype.reset=r.prototype.s,r.prototype.update=r.prototype.u,_a=Hh.Md5=r,a.prototype.add=a.prototype.add,a.prototype.multiply=a.prototype.j,a.prototype.modulo=a.prototype.A,a.prototype.compare=a.prototype.l,a.prototype.toNumber=a.prototype.m,a.prototype.toString=a.prototype.toString,a.prototype.getBits=a.prototype.i,a.fromNumber=d,a.fromString=p,Pt=Hh.Integer=a}).apply(typeof Kh!="undefined"?Kh:typeof self!="undefined"?self:typeof window!="undefined"?window:{});var Gi=typeof globalThis!="undefined"?globalThis:typeof window!="undefined"?window:typeof global!="undefined"?global:typeof self!="undefined"?self:{},ft={};var ya,s_,wn,va,wr,$i,Ia,wa,Ea;(function(){var n,e=typeof Object.defineProperties=="function"?Object.defineProperty:function(o,u,h){return o==Array.prototype||o==Object.prototype||(o[u]=h.value),o};function t(o){o=[typeof globalThis=="object"&&globalThis,o,typeof window=="object"&&window,typeof self=="object"&&self,typeof Gi=="object"&&Gi];for(var u=0;u<o.length;++u){var h=o[u];if(h&&h.Math==Math)return h}throw Error("Cannot find global object")}var r=t(this);function i(o,u){if(u)e:{var h=r;o=o.split(".");for(var f=0;f<o.length-1;f++){var b=o[f];if(!(b in h))break e;h=h[b]}o=o[o.length-1],f=h[o],u=u(f),u!=f&&u!=null&&e(h,o,{configurable:!0,writable:!0,value:u})}}function s(o,u){o instanceof String&&(o+="");var h=0,f=!1,b={next:function(){if(!f&&h<o.length){var S=h++;return{value:u(S,o[S]),done:!1}}return f=!0,{done:!0,value:void 0}}};return b[Symbol.iterator]=function(){return b},b}i("Array.prototype.values",function(o){return o||function(){return s(this,function(u,h){return h})}});var a=a||{},c=this||self;function l(o){var u=typeof o;return u=u!="object"?u:o?Array.isArray(o)?"array":u:"null",u=="array"||u=="object"&&typeof o.length=="number"}function d(o){var u=typeof o;return u=="object"&&o!=null||u=="function"}function p(o,u,h){return o.call.apply(o.bind,arguments)}function g(o,u,h){if(!o)throw Error();if(2<arguments.length){var f=Array.prototype.slice.call(arguments,2);return function(){var b=Array.prototype.slice.call(arguments);return Array.prototype.unshift.apply(b,f),o.apply(u,b)}}return function(){return o.apply(u,arguments)}}function v(o,u,h){return v=Function.prototype.bind&&Function.prototype.bind.toString().indexOf("native code")!=-1?p:g,v.apply(null,arguments)}function w(o,u){var h=Array.prototype.slice.call(arguments,1);return function(){var f=h.slice();return f.push.apply(f,arguments),o.apply(this,f)}}function R(o,u){function h(){}h.prototype=u.prototype,o.aa=u.prototype,o.prototype=new h,o.prototype.constructor=o,o.Qb=function(f,b,S){for(var x=Array(arguments.length-2),X=2;X<arguments.length;X++)x[X-2]=arguments[X];return u.prototype[b].apply(f,x)}}function D(o){let u=o.length;if(0<u){let h=Array(u);for(let f=0;f<u;f++)h[f]=o[f];return h}return[]}function C(o,u){for(let h=1;h<arguments.length;h++){let f=arguments[h];if(l(f)){let b=o.length||0,S=f.length||0;o.length=b+S;for(let x=0;x<S;x++)o[b+x]=f[x]}else o.push(f)}}class U{constructor(u,h){this.i=u,this.j=h,this.h=0,this.g=null}get(){let u;return 0<this.h?(this.h--,u=this.g,this.g=u.next,u.next=null):u=this.i(),u}}function B(o){return/^[\s\xa0]*$/.test(o)}function F(){var o=c.navigator;return o&&(o=o.userAgent)?o:""}function z(o){return z[" "](o),o}z[" "]=function(){};var se=F().indexOf("Gecko")!=-1&&!(F().toLowerCase().indexOf("webkit")!=-1&&F().indexOf("Edge")==-1)&&!(F().indexOf("Trident")!=-1||F().indexOf("MSIE")!=-1)&&F().indexOf("Edge")==-1;function K(o,u,h){for(let f in o)u.call(h,o[f],f,o)}function E(o,u){for(let h in o)u.call(void 0,o[h],h,o)}function m(o){let u={};for(let h in o)u[h]=o[h];return u}let _="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function I(o,u){let h,f;for(let b=1;b<arguments.length;b++){f=arguments[b];for(h in f)o[h]=f[h];for(let S=0;S<_.length;S++)h=_[S],Object.prototype.hasOwnProperty.call(f,h)&&(o[h]=f[h])}}function T(o){var u=1;o=o.split(":");let h=[];for(;0<u&&o.length;)h.push(o.shift()),u--;return o.length&&h.push(o.join(":")),h}function A(o){c.setTimeout(()=>{throw o},0)}function y(){var o=To;let u=null;return o.g&&(u=o.g,o.g=o.g.next,o.g||(o.h=null),u.next=null),u}class ct{constructor(){this.h=this.g=null}add(u,h){let f=er.get();f.set(u,h),this.h?this.h.next=f:this.g=f,this.h=f}}var er=new U(()=>new dm,o=>o.reset());class dm{constructor(){this.next=this.g=this.h=null}set(u,h){this.h=u,this.g=h,this.next=null}reset(){this.next=this.g=this.h=null}}let tr,nr=!1,To=new ct,vl=()=>{let o=c.Promise.resolve(void 0);tr=()=>{o.then(fm)}};var fm=()=>{for(var o;o=y();){try{o.h.call(o.g)}catch(h){A(h)}var u=er;u.j(o),100>u.h&&(u.h++,o.next=u.g,u.g=o)}nr=!1};function Et(){this.s=this.s,this.C=this.C}Et.prototype.s=!1,Et.prototype.ma=function(){this.s||(this.s=!0,this.N())},Et.prototype.N=function(){if(this.C)for(;this.C.length;)this.C.shift()()};function we(o,u){this.type=o,this.g=this.target=u,this.defaultPrevented=!1}we.prototype.h=function(){this.defaultPrevented=!0};var pm=function(){if(!c.addEventListener||!Object.defineProperty)return!1;var o=!1,u=Object.defineProperty({},"passive",{get:function(){o=!0}});try{let h=()=>{};c.addEventListener("test",h,u),c.removeEventListener("test",h,u)}catch{}return o}();function rr(o,u){if(we.call(this,o?o.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,o){var h=this.type=o.type,f=o.changedTouches&&o.changedTouches.length?o.changedTouches[0]:null;if(this.target=o.target||o.srcElement,this.g=u,u=o.relatedTarget){if(se){e:{try{z(u.nodeName);var b=!0;break e}catch{}b=!1}b||(u=null)}}else h=="mouseover"?u=o.fromElement:h=="mouseout"&&(u=o.toElement);this.relatedTarget=u,f?(this.clientX=f.clientX!==void 0?f.clientX:f.pageX,this.clientY=f.clientY!==void 0?f.clientY:f.pageY,this.screenX=f.screenX||0,this.screenY=f.screenY||0):(this.clientX=o.clientX!==void 0?o.clientX:o.pageX,this.clientY=o.clientY!==void 0?o.clientY:o.pageY,this.screenX=o.screenX||0,this.screenY=o.screenY||0),this.button=o.button,this.key=o.key||"",this.ctrlKey=o.ctrlKey,this.altKey=o.altKey,this.shiftKey=o.shiftKey,this.metaKey=o.metaKey,this.pointerId=o.pointerId||0,this.pointerType=typeof o.pointerType=="string"?o.pointerType:mm[o.pointerType]||"",this.state=o.state,this.i=o,o.defaultPrevented&&rr.aa.h.call(this)}}R(rr,we);var mm={2:"touch",3:"pen",4:"mouse"};rr.prototype.h=function(){rr.aa.h.call(this);var o=this.i;o.preventDefault?o.preventDefault():o.returnValue=!1};var ir="closure_listenable_"+(1e6*Math.random()|0),gm=0;function _m(o,u,h,f,b){this.listener=o,this.proxy=null,this.src=u,this.type=h,this.capture=!!f,this.ha=b,this.key=++gm,this.da=this.fa=!1}function Ii(o){o.da=!0,o.listener=null,o.proxy=null,o.src=null,o.ha=null}function wi(o){this.src=o,this.g={},this.h=0}wi.prototype.add=function(o,u,h,f,b){var S=o.toString();o=this.g[S],o||(o=this.g[S]=[],this.h++);var x=Ao(o,u,f,b);return-1<x?(u=o[x],h||(u.fa=!1)):(u=new _m(u,this.src,S,!!f,b),u.fa=h,o.push(u)),u};function bo(o,u){var h=u.type;if(h in o.g){var f=o.g[h],b=Array.prototype.indexOf.call(f,u,void 0),S;(S=0<=b)&&Array.prototype.splice.call(f,b,1),S&&(Ii(u),o.g[h].length==0&&(delete o.g[h],o.h--))}}function Ao(o,u,h,f){for(var b=0;b<o.length;++b){var S=o[b];if(!S.da&&S.listener==u&&S.capture==!!h&&S.ha==f)return b}return-1}var So="closure_lm_"+(1e6*Math.random()|0),Ro={};function Il(o,u,h,f,b){if(f&&f.once)return El(o,u,h,f,b);if(Array.isArray(u)){for(var S=0;S<u.length;S++)Il(o,u[S],h,f,b);return null}return h=No(h),o&&o[ir]?o.K(u,h,d(f)?!!f.capture:!!f,b):wl(o,u,h,!1,f,b)}function wl(o,u,h,f,b,S){if(!u)throw Error("Invalid event type");var x=d(b)?!!b.capture:!!b,X=Co(o);if(X||(o[So]=X=new wi(o)),h=X.add(u,h,f,x,S),h.proxy)return h;if(f=ym(),h.proxy=f,f.src=o,f.listener=h,o.addEventListener)pm||(b=x),b===void 0&&(b=!1),o.addEventListener(u.toString(),f,b);else if(o.attachEvent)o.attachEvent(bl(u.toString()),f);else if(o.addListener&&o.removeListener)o.addListener(f);else throw Error("addEventListener and attachEvent are unavailable.");return h}function ym(){function o(h){return u.call(o.src,o.listener,h)}let u=vm;return o}function El(o,u,h,f,b){if(Array.isArray(u)){for(var S=0;S<u.length;S++)El(o,u[S],h,f,b);return null}return h=No(h),o&&o[ir]?o.L(u,h,d(f)?!!f.capture:!!f,b):wl(o,u,h,!0,f,b)}function Tl(o,u,h,f,b){if(Array.isArray(u))for(var S=0;S<u.length;S++)Tl(o,u[S],h,f,b);else f=d(f)?!!f.capture:!!f,h=No(h),o&&o[ir]?(o=o.i,u=String(u).toString(),u in o.g&&(S=o.g[u],h=Ao(S,h,f,b),-1<h&&(Ii(S[h]),Array.prototype.splice.call(S,h,1),S.length==0&&(delete o.g[u],o.h--)))):o&&(o=Co(o))&&(u=o.g[u.toString()],o=-1,u&&(o=Ao(u,h,f,b)),(h=-1<o?u[o]:null)&&Po(h))}function Po(o){if(typeof o!="number"&&o&&!o.da){var u=o.src;if(u&&u[ir])bo(u.i,o);else{var h=o.type,f=o.proxy;u.removeEventListener?u.removeEventListener(h,f,o.capture):u.detachEvent?u.detachEvent(bl(h),f):u.addListener&&u.removeListener&&u.removeListener(f),(h=Co(u))?(bo(h,o),h.h==0&&(h.src=null,u[So]=null)):Ii(o)}}}function bl(o){return o in Ro?Ro[o]:Ro[o]="on"+o}function vm(o,u){if(o.da)o=!0;else{u=new rr(u,this);var h=o.listener,f=o.ha||o.src;o.fa&&Po(o),o=h.call(f,u)}return o}function Co(o){return o=o[So],o instanceof wi?o:null}var ko="__closure_events_fn_"+(1e9*Math.random()>>>0);function No(o){return typeof o=="function"?o:(o[ko]||(o[ko]=function(u){return o.handleEvent(u)}),o[ko])}function Ee(){Et.call(this),this.i=new wi(this),this.M=this,this.F=null}R(Ee,Et),Ee.prototype[ir]=!0,Ee.prototype.removeEventListener=function(o,u,h,f){Tl(this,o,u,h,f)};function ke(o,u){var h,f=o.F;if(f)for(h=[];f;f=f.F)h.push(f);if(o=o.M,f=u.type||u,typeof u=="string")u=new we(u,o);else if(u instanceof we)u.target=u.target||o;else{var b=u;u=new we(f,o),I(u,b)}if(b=!0,h)for(var S=h.length-1;0<=S;S--){var x=u.g=h[S];b=Ei(x,f,!0,u)&&b}if(x=u.g=o,b=Ei(x,f,!0,u)&&b,b=Ei(x,f,!1,u)&&b,h)for(S=0;S<h.length;S++)x=u.g=h[S],b=Ei(x,f,!1,u)&&b}Ee.prototype.N=function(){if(Ee.aa.N.call(this),this.i){var o=this.i,u;for(u in o.g){for(var h=o.g[u],f=0;f<h.length;f++)Ii(h[f]);delete o.g[u],o.h--}}this.F=null},Ee.prototype.K=function(o,u,h,f){return this.i.add(String(o),u,!1,h,f)},Ee.prototype.L=function(o,u,h,f){return this.i.add(String(o),u,!0,h,f)};function Ei(o,u,h,f){if(u=o.i.g[String(u)],!u)return!0;u=u.concat();for(var b=!0,S=0;S<u.length;++S){var x=u[S];if(x&&!x.da&&x.capture==h){var X=x.listener,_e=x.ha||x.src;x.fa&&bo(o.i,x),b=X.call(_e,f)!==!1&&b}}return b&&!f.defaultPrevented}function Al(o,u,h){if(typeof o=="function")h&&(o=v(o,h));else if(o&&typeof o.handleEvent=="function")o=v(o.handleEvent,o);else throw Error("Invalid listener argument");return 2147483647<Number(u)?-1:c.setTimeout(o,u||0)}function Sl(o){o.g=Al(()=>{o.g=null,o.i&&(o.i=!1,Sl(o))},o.l);let u=o.h;o.h=null,o.m.apply(null,u)}class Im extends Et{constructor(u,h){super(),this.m=u,this.l=h,this.h=null,this.i=!1,this.g=null}j(u){this.h=arguments,this.g?this.i=!0:Sl(this)}N(){super.N(),this.g&&(c.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null)}}function sr(o){Et.call(this),this.h=o,this.g={}}R(sr,Et);var Rl=[];function Pl(o){K(o.g,function(u,h){this.g.hasOwnProperty(h)&&Po(u)},o),o.g={}}sr.prototype.N=function(){sr.aa.N.call(this),Pl(this)},sr.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")};var Do=c.JSON.stringify,wm=c.JSON.parse,Em=class{stringify(o){return c.JSON.stringify(o,void 0)}parse(o){return c.JSON.parse(o,void 0)}};function xo(){}xo.prototype.h=null;function Cl(o){return o.h||(o.h=o.i())}function kl(){}var or={OPEN:"a",kb:"b",Ja:"c",wb:"d"};function Oo(){we.call(this,"d")}R(Oo,we);function Vo(){we.call(this,"c")}R(Vo,we);var Ft={},Nl=null;function Ti(){return Nl=Nl||new Ee}Ft.La="serverreachability";function Dl(o){we.call(this,Ft.La,o)}R(Dl,we);function ar(o){let u=Ti();ke(u,new Dl(u))}Ft.STAT_EVENT="statevent";function xl(o,u){we.call(this,Ft.STAT_EVENT,o),this.stat=u}R(xl,we);function Ne(o){let u=Ti();ke(u,new xl(u,o))}Ft.Ma="timingevent";function Ol(o,u){we.call(this,Ft.Ma,o),this.size=u}R(Ol,we);function cr(o,u){if(typeof o!="function")throw Error("Fn must not be null and must be a function");return c.setTimeout(function(){o()},u)}function ur(){this.g=!0}ur.prototype.xa=function(){this.g=!1};function Tm(o,u,h,f,b,S){o.info(function(){if(o.g)if(S)for(var x="",X=S.split("&"),_e=0;_e<X.length;_e++){var Q=X[_e].split("=");if(1<Q.length){var Te=Q[0];Q=Q[1];var be=Te.split("_");x=2<=be.length&&be[1]=="type"?x+(Te+"="+Q+"&"):x+(Te+"=redacted&")}}else x=null;else x=S;return"XMLHTTP REQ ("+f+") [attempt "+b+"]: "+u+`
`+h+`
`+x})}function bm(o,u,h,f,b,S,x){o.info(function(){return"XMLHTTP RESP ("+f+") [ attempt "+b+"]: "+u+`
`+h+`
`+S+" "+x})}function fn(o,u,h,f){o.info(function(){return"XMLHTTP TEXT ("+u+"): "+Sm(o,h)+(f?" "+f:"")})}function Am(o,u){o.info(function(){return"TIMEOUT: "+u})}ur.prototype.info=function(){};function Sm(o,u){if(!o.g)return u;if(!u)return null;try{var h=JSON.parse(u);if(h){for(o=0;o<h.length;o++)if(Array.isArray(h[o])){var f=h[o];if(!(2>f.length)){var b=f[1];if(Array.isArray(b)&&!(1>b.length)){var S=b[0];if(S!="noop"&&S!="stop"&&S!="close")for(var x=1;x<b.length;x++)b[x]=""}}}}return Do(h)}catch{return u}}var bi={NO_ERROR:0,gb:1,tb:2,sb:3,nb:4,rb:5,ub:6,Ia:7,TIMEOUT:8,xb:9},Vl={lb:"complete",Hb:"success",Ja:"error",Ia:"abort",zb:"ready",Ab:"readystatechange",TIMEOUT:"timeout",vb:"incrementaldata",yb:"progress",ob:"downloadprogress",Pb:"uploadprogress"},Lo;function Ai(){}R(Ai,xo),Ai.prototype.g=function(){return new XMLHttpRequest},Ai.prototype.i=function(){return{}},Lo=new Ai;function Tt(o,u,h,f){this.j=o,this.i=u,this.l=h,this.R=f||1,this.U=new sr(this),this.I=45e3,this.H=null,this.o=!1,this.m=this.A=this.v=this.L=this.F=this.S=this.B=null,this.D=[],this.g=null,this.C=0,this.s=this.u=null,this.X=-1,this.J=!1,this.O=0,this.M=null,this.W=this.K=this.T=this.P=!1,this.h=new Ll}function Ll(){this.i=null,this.g="",this.h=!1}var Ml={},Mo={};function Fo(o,u,h){o.L=1,o.v=Ci(ut(u)),o.m=h,o.P=!0,Fl(o,null)}function Fl(o,u){o.F=Date.now(),Si(o),o.A=ut(o.v);var h=o.A,f=o.R;Array.isArray(f)||(f=[String(f)]),Xl(h.i,"t",f),o.C=0,h=o.j.J,o.h=new Ll,o.g=gh(o.j,h?u:null,!o.m),0<o.O&&(o.M=new Im(v(o.Y,o,o.g),o.O)),u=o.U,h=o.g,f=o.ca;var b="readystatechange";Array.isArray(b)||(b&&(Rl[0]=b.toString()),b=Rl);for(var S=0;S<b.length;S++){var x=Il(h,b[S],f||u.handleEvent,!1,u.h||u);if(!x)break;u.g[x.key]=x}u=o.H?m(o.H):{},o.m?(o.u||(o.u="POST"),u["Content-Type"]="application/x-www-form-urlencoded",o.g.ea(o.A,o.u,o.m,u)):(o.u="GET",o.g.ea(o.A,o.u,null,u)),ar(),Tm(o.i,o.u,o.A,o.l,o.R,o.m)}Tt.prototype.ca=function(o){o=o.target;let u=this.M;u&&lt(o)==3?u.j():this.Y(o)},Tt.prototype.Y=function(o){try{if(o==this.g)e:{let be=lt(this.g);var u=this.g.Ba();let gn=this.g.Z();if(!(3>be)&&(be!=3||this.g&&(this.h.h||this.g.oa()||sh(this.g)))){this.J||be!=4||u==7||(u==8||0>=gn?ar(3):ar(2)),Uo(this);var h=this.g.Z();this.X=h;t:if(Ul(this)){var f=sh(this.g);o="";var b=f.length,S=lt(this.g)==4;if(!this.h.i){if(typeof TextDecoder=="undefined"){Ut(this),lr(this);var x="";break t}this.h.i=new c.TextDecoder}for(u=0;u<b;u++)this.h.h=!0,o+=this.h.i.decode(f[u],{stream:!(S&&u==b-1)});f.length=0,this.h.g+=o,this.C=0,x=this.h.g}else x=this.g.oa();if(this.o=h==200,bm(this.i,this.u,this.A,this.l,this.R,be,h),this.o){if(this.T&&!this.K){t:{if(this.g){var X,_e=this.g;if((X=_e.g?_e.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!B(X)){var Q=X;break t}}Q=null}if(h=Q)fn(this.i,this.l,h,"Initial handshake response via X-HTTP-Initial-Response"),this.K=!0,qo(this,h);else{this.o=!1,this.s=3,Ne(12),Ut(this),lr(this);break e}}if(this.P){h=!0;let Be;for(;!this.J&&this.C<x.length;)if(Be=Rm(this,x),Be==Mo){be==4&&(this.s=4,Ne(14),h=!1),fn(this.i,this.l,null,"[Incomplete Response]");break}else if(Be==Ml){this.s=4,Ne(15),fn(this.i,this.l,x,"[Invalid Chunk]"),h=!1;break}else fn(this.i,this.l,Be,null),qo(this,Be);if(Ul(this)&&this.C!=0&&(this.h.g=this.h.g.slice(this.C),this.C=0),be!=4||x.length!=0||this.h.h||(this.s=1,Ne(16),h=!1),this.o=this.o&&h,!h)fn(this.i,this.l,x,"[Invalid Chunked Response]"),Ut(this),lr(this);else if(0<x.length&&!this.W){this.W=!0;var Te=this.j;Te.g==this&&Te.ba&&!Te.M&&(Te.j.info("Great, no buffering proxy detected. Bytes received: "+x.length),Ko(Te),Te.M=!0,Ne(11))}}else fn(this.i,this.l,x,null),qo(this,x);be==4&&Ut(this),this.o&&!this.J&&(be==4?dh(this.j,this):(this.o=!1,Si(this)))}else Gm(this.g),h==400&&0<x.indexOf("Unknown SID")?(this.s=3,Ne(12)):(this.s=0,Ne(13)),Ut(this),lr(this)}}}catch{}finally{}};function Ul(o){return o.g?o.u=="GET"&&o.L!=2&&o.j.Ca:!1}function Rm(o,u){var h=o.C,f=u.indexOf(`
`,h);return f==-1?Mo:(h=Number(u.substring(h,f)),isNaN(h)?Ml:(f+=1,f+h>u.length?Mo:(u=u.slice(f,f+h),o.C=f+h,u)))}Tt.prototype.cancel=function(){this.J=!0,Ut(this)};function Si(o){o.S=Date.now()+o.I,ql(o,o.I)}function ql(o,u){if(o.B!=null)throw Error("WatchDog timer not null");o.B=cr(v(o.ba,o),u)}function Uo(o){o.B&&(c.clearTimeout(o.B),o.B=null)}Tt.prototype.ba=function(){this.B=null;let o=Date.now();0<=o-this.S?(Am(this.i,this.A),this.L!=2&&(ar(),Ne(17)),Ut(this),this.s=2,lr(this)):ql(this,this.S-o)};function lr(o){o.j.G==0||o.J||dh(o.j,o)}function Ut(o){Uo(o);var u=o.M;u&&typeof u.ma=="function"&&u.ma(),o.M=null,Pl(o.U),o.g&&(u=o.g,o.g=null,u.abort(),u.ma())}function qo(o,u){try{var h=o.j;if(h.G!=0&&(h.g==o||Bo(h.h,o))){if(!o.K&&Bo(h.h,o)&&h.G==3){try{var f=h.Da.g.parse(u)}catch{f=null}if(Array.isArray(f)&&f.length==3){var b=f;if(b[0]==0){e:if(!h.u){if(h.g)if(h.g.F+3e3<o.F)Oi(h),Di(h);else break e;$o(h),Ne(18)}}else h.za=b[1],0<h.za-h.T&&37500>b[2]&&h.F&&h.v==0&&!h.C&&(h.C=cr(v(h.Za,h),6e3));if(1>=zl(h.h)&&h.ca){try{h.ca()}catch{}h.ca=void 0}}else Bt(h,11)}else if((o.K||h.g==o)&&Oi(h),!B(u))for(b=h.Da.g.parse(u),u=0;u<b.length;u++){let Q=b[u];if(h.T=Q[0],Q=Q[1],h.G==2)if(Q[0]=="c"){h.K=Q[1],h.ia=Q[2];let Te=Q[3];Te!=null&&(h.la=Te,h.j.info("VER="+h.la));let be=Q[4];be!=null&&(h.Aa=be,h.j.info("SVER="+h.Aa));let gn=Q[5];gn!=null&&typeof gn=="number"&&0<gn&&(f=1.5*gn,h.L=f,h.j.info("backChannelRequestTimeoutMs_="+f)),f=h;let Be=o.g;if(Be){let Li=Be.g?Be.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(Li){var S=f.h;S.g||Li.indexOf("spdy")==-1&&Li.indexOf("quic")==-1&&Li.indexOf("h2")==-1||(S.j=S.l,S.g=new Set,S.h&&(jo(S,S.h),S.h=null))}if(f.D){let Ho=Be.g?Be.g.getResponseHeader("X-HTTP-Session-Id"):null;Ho&&(f.ya=Ho,Z(f.I,f.D,Ho))}}h.G=3,h.l&&h.l.ua(),h.ba&&(h.R=Date.now()-o.F,h.j.info("Handshake RTT: "+h.R+"ms")),f=h;var x=o;if(f.qa=mh(f,f.J?f.ia:null,f.W),x.K){Gl(f.h,x);var X=x,_e=f.L;_e&&(X.I=_e),X.B&&(Uo(X),Si(X)),f.g=x}else lh(f);0<h.i.length&&xi(h)}else Q[0]!="stop"&&Q[0]!="close"||Bt(h,7);else h.G==3&&(Q[0]=="stop"||Q[0]=="close"?Q[0]=="stop"?Bt(h,7):Go(h):Q[0]!="noop"&&h.l&&h.l.ta(Q),h.v=0)}}ar(4)}catch{}}var Pm=class{constructor(o,u){this.g=o,this.map=u}};function Bl(o){this.l=o||10,c.PerformanceNavigationTiming?(o=c.performance.getEntriesByType("navigation"),o=0<o.length&&(o[0].nextHopProtocol=="hq"||o[0].nextHopProtocol=="h2")):o=!!(c.chrome&&c.chrome.loadTimes&&c.chrome.loadTimes()&&c.chrome.loadTimes().wasFetchedViaSpdy),this.j=o?this.l:1,this.g=null,1<this.j&&(this.g=new Set),this.h=null,this.i=[]}function jl(o){return o.h?!0:o.g?o.g.size>=o.j:!1}function zl(o){return o.h?1:o.g?o.g.size:0}function Bo(o,u){return o.h?o.h==u:o.g?o.g.has(u):!1}function jo(o,u){o.g?o.g.add(u):o.h=u}function Gl(o,u){o.h&&o.h==u?o.h=null:o.g&&o.g.has(u)&&o.g.delete(u)}Bl.prototype.cancel=function(){if(this.i=$l(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&this.g.size!==0){for(let o of this.g.values())o.cancel();this.g.clear()}};function $l(o){if(o.h!=null)return o.i.concat(o.h.D);if(o.g!=null&&o.g.size!==0){let u=o.i;for(let h of o.g.values())u=u.concat(h.D);return u}return D(o.i)}function Cm(o){if(o.V&&typeof o.V=="function")return o.V();if(typeof Map!="undefined"&&o instanceof Map||typeof Set!="undefined"&&o instanceof Set)return Array.from(o.values());if(typeof o=="string")return o.split("");if(l(o)){for(var u=[],h=o.length,f=0;f<h;f++)u.push(o[f]);return u}u=[],h=0;for(f in o)u[h++]=o[f];return u}function km(o){if(o.na&&typeof o.na=="function")return o.na();if(!o.V||typeof o.V!="function"){if(typeof Map!="undefined"&&o instanceof Map)return Array.from(o.keys());if(!(typeof Set!="undefined"&&o instanceof Set)){if(l(o)||typeof o=="string"){var u=[];o=o.length;for(var h=0;h<o;h++)u.push(h);return u}u=[],h=0;for(let f in o)u[h++]=f;return u}}}function Kl(o,u){if(o.forEach&&typeof o.forEach=="function")o.forEach(u,void 0);else if(l(o)||typeof o=="string")Array.prototype.forEach.call(o,u,void 0);else for(var h=km(o),f=Cm(o),b=f.length,S=0;S<b;S++)u.call(void 0,f[S],h&&h[S],o)}var Hl=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function Nm(o,u){if(o){o=o.split("&");for(var h=0;h<o.length;h++){var f=o[h].indexOf("="),b=null;if(0<=f){var S=o[h].substring(0,f);b=o[h].substring(f+1)}else S=o[h];u(S,b?decodeURIComponent(b.replace(/\+/g," ")):"")}}}function qt(o){if(this.g=this.o=this.j="",this.s=null,this.m=this.l="",this.h=!1,o instanceof qt){this.h=o.h,Ri(this,o.j),this.o=o.o,this.g=o.g,Pi(this,o.s),this.l=o.l;var u=o.i,h=new fr;h.i=u.i,u.g&&(h.g=new Map(u.g),h.h=u.h),Wl(this,h),this.m=o.m}else o&&(u=String(o).match(Hl))?(this.h=!1,Ri(this,u[1]||"",!0),this.o=hr(u[2]||""),this.g=hr(u[3]||"",!0),Pi(this,u[4]),this.l=hr(u[5]||"",!0),Wl(this,u[6]||"",!0),this.m=hr(u[7]||"")):(this.h=!1,this.i=new fr(null,this.h))}qt.prototype.toString=function(){var o=[],u=this.j;u&&o.push(dr(u,Ql,!0),":");var h=this.g;return(h||u=="file")&&(o.push("//"),(u=this.o)&&o.push(dr(u,Ql,!0),"@"),o.push(encodeURIComponent(String(h)).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),h=this.s,h!=null&&o.push(":",String(h))),(h=this.l)&&(this.g&&h.charAt(0)!="/"&&o.push("/"),o.push(dr(h,h.charAt(0)=="/"?Om:xm,!0))),(h=this.i.toString())&&o.push("?",h),(h=this.m)&&o.push("#",dr(h,Lm)),o.join("")};function ut(o){return new qt(o)}function Ri(o,u,h){o.j=h?hr(u,!0):u,o.j&&(o.j=o.j.replace(/:$/,""))}function Pi(o,u){if(u){if(u=Number(u),isNaN(u)||0>u)throw Error("Bad port number "+u);o.s=u}else o.s=null}function Wl(o,u,h){u instanceof fr?(o.i=u,Mm(o.i,o.h)):(h||(u=dr(u,Vm)),o.i=new fr(u,o.h))}function Z(o,u,h){o.i.set(u,h)}function Ci(o){return Z(o,"zx",Math.floor(2147483648*Math.random()).toString(36)+Math.abs(Math.floor(2147483648*Math.random())^Date.now()).toString(36)),o}function hr(o,u){return o?u?decodeURI(o.replace(/%25/g,"%2525")):decodeURIComponent(o):""}function dr(o,u,h){return typeof o=="string"?(o=encodeURI(o).replace(u,Dm),h&&(o=o.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),o):null}function Dm(o){return o=o.charCodeAt(0),"%"+(o>>4&15).toString(16)+(o&15).toString(16)}var Ql=/[#\/\?@]/g,xm=/[#\?:]/g,Om=/[#\?]/g,Vm=/[#\?@]/g,Lm=/#/g;function fr(o,u){this.h=this.g=null,this.i=o||null,this.j=!!u}function bt(o){o.g||(o.g=new Map,o.h=0,o.i&&Nm(o.i,function(u,h){o.add(decodeURIComponent(u.replace(/\+/g," ")),h)}))}n=fr.prototype,n.add=function(o,u){bt(this),this.i=null,o=pn(this,o);var h=this.g.get(o);return h||this.g.set(o,h=[]),h.push(u),this.h+=1,this};function Jl(o,u){bt(o),u=pn(o,u),o.g.has(u)&&(o.i=null,o.h-=o.g.get(u).length,o.g.delete(u))}function Yl(o,u){return bt(o),u=pn(o,u),o.g.has(u)}n.forEach=function(o,u){bt(this),this.g.forEach(function(h,f){h.forEach(function(b){o.call(u,b,f,this)},this)},this)},n.na=function(){bt(this);let o=Array.from(this.g.values()),u=Array.from(this.g.keys()),h=[];for(let f=0;f<u.length;f++){let b=o[f];for(let S=0;S<b.length;S++)h.push(u[f])}return h},n.V=function(o){bt(this);let u=[];if(typeof o=="string")Yl(this,o)&&(u=u.concat(this.g.get(pn(this,o))));else{o=Array.from(this.g.values());for(let h=0;h<o.length;h++)u=u.concat(o[h])}return u},n.set=function(o,u){return bt(this),this.i=null,o=pn(this,o),Yl(this,o)&&(this.h-=this.g.get(o).length),this.g.set(o,[u]),this.h+=1,this},n.get=function(o,u){return o?(o=this.V(o),0<o.length?String(o[0]):u):u};function Xl(o,u,h){Jl(o,u),0<h.length&&(o.i=null,o.g.set(pn(o,u),D(h)),o.h+=h.length)}n.toString=function(){if(this.i)return this.i;if(!this.g)return"";let o=[],u=Array.from(this.g.keys());for(var h=0;h<u.length;h++){var f=u[h];let S=encodeURIComponent(String(f)),x=this.V(f);for(f=0;f<x.length;f++){var b=S;x[f]!==""&&(b+="="+encodeURIComponent(String(x[f]))),o.push(b)}}return this.i=o.join("&")};function pn(o,u){return u=String(u),o.j&&(u=u.toLowerCase()),u}function Mm(o,u){u&&!o.j&&(bt(o),o.i=null,o.g.forEach(function(h,f){var b=f.toLowerCase();f!=b&&(Jl(this,f),Xl(this,b,h))},o)),o.j=u}function Fm(o,u){let h=new ur;if(c.Image){let f=new Image;f.onload=w(At,h,"TestLoadImage: loaded",!0,u,f),f.onerror=w(At,h,"TestLoadImage: error",!1,u,f),f.onabort=w(At,h,"TestLoadImage: abort",!1,u,f),f.ontimeout=w(At,h,"TestLoadImage: timeout",!1,u,f),c.setTimeout(function(){f.ontimeout&&f.ontimeout()},1e4),f.src=o}else u(!1)}function Um(o,u){let h=new ur,f=new AbortController,b=setTimeout(()=>{f.abort(),At(h,"TestPingServer: timeout",!1,u)},1e4);fetch(o,{signal:f.signal}).then(S=>{clearTimeout(b),S.ok?At(h,"TestPingServer: ok",!0,u):At(h,"TestPingServer: server error",!1,u)}).catch(()=>{clearTimeout(b),At(h,"TestPingServer: error",!1,u)})}function At(o,u,h,f,b){try{b&&(b.onload=null,b.onerror=null,b.onabort=null,b.ontimeout=null),f(h)}catch{}}function qm(){this.g=new Em}function Bm(o,u,h){let f=h||"";try{Kl(o,function(b,S){let x=b;d(b)&&(x=Do(b)),u.push(f+S+"="+encodeURIComponent(x))})}catch(b){throw u.push(f+"type="+encodeURIComponent("_badmap")),b}}function pr(o){this.l=o.Ub||null,this.j=o.eb||!1}R(pr,xo),pr.prototype.g=function(){return new ki(this.l,this.j)},pr.prototype.i=function(o){return function(){return o}}({});function ki(o,u){Ee.call(this),this.D=o,this.o=u,this.m=void 0,this.status=this.readyState=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.u=new Headers,this.h=null,this.B="GET",this.A="",this.g=!1,this.v=this.j=this.l=null}R(ki,Ee),n=ki.prototype,n.open=function(o,u){if(this.readyState!=0)throw this.abort(),Error("Error reopening a connection");this.B=o,this.A=u,this.readyState=1,gr(this)},n.send=function(o){if(this.readyState!=1)throw this.abort(),Error("need to call open() first. ");this.g=!0;let u={headers:this.u,method:this.B,credentials:this.m,cache:void 0};o&&(u.body=o),(this.D||c).fetch(new Request(this.A,u)).then(this.Sa.bind(this),this.ga.bind(this))},n.abort=function(){this.response=this.responseText="",this.u=new Headers,this.status=0,this.j&&this.j.cancel("Request was aborted.").catch(()=>{}),1<=this.readyState&&this.g&&this.readyState!=4&&(this.g=!1,mr(this)),this.readyState=0},n.Sa=function(o){if(this.g&&(this.l=o,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=o.headers,this.readyState=2,gr(this)),this.g&&(this.readyState=3,gr(this),this.g)))if(this.responseType==="arraybuffer")o.arrayBuffer().then(this.Qa.bind(this),this.ga.bind(this));else if(typeof c.ReadableStream!="undefined"&&"body"in o){if(this.j=o.body.getReader(),this.o){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[]}else this.response=this.responseText="",this.v=new TextDecoder;Zl(this)}else o.text().then(this.Ra.bind(this),this.ga.bind(this))};function Zl(o){o.j.read().then(o.Pa.bind(o)).catch(o.ga.bind(o))}n.Pa=function(o){if(this.g){if(this.o&&o.value)this.response.push(o.value);else if(!this.o){var u=o.value?o.value:new Uint8Array(0);(u=this.v.decode(u,{stream:!o.done}))&&(this.response=this.responseText+=u)}o.done?mr(this):gr(this),this.readyState==3&&Zl(this)}},n.Ra=function(o){this.g&&(this.response=this.responseText=o,mr(this))},n.Qa=function(o){this.g&&(this.response=o,mr(this))},n.ga=function(){this.g&&mr(this)};function mr(o){o.readyState=4,o.l=null,o.j=null,o.v=null,gr(o)}n.setRequestHeader=function(o,u){this.u.append(o,u)},n.getResponseHeader=function(o){return this.h&&this.h.get(o.toLowerCase())||""},n.getAllResponseHeaders=function(){if(!this.h)return"";let o=[],u=this.h.entries();for(var h=u.next();!h.done;)h=h.value,o.push(h[0]+": "+h[1]),h=u.next();return o.join(`\r
`)};function gr(o){o.onreadystatechange&&o.onreadystatechange.call(o)}Object.defineProperty(ki.prototype,"withCredentials",{get:function(){return this.m==="include"},set:function(o){this.m=o?"include":"same-origin"}});function eh(o){let u="";return K(o,function(h,f){u+=f,u+=":",u+=h,u+=`\r
`}),u}function zo(o,u,h){e:{for(f in h){var f=!1;break e}f=!0}f||(h=eh(h),typeof o=="string"?h!=null&&encodeURIComponent(String(h)):Z(o,u,h))}function oe(o){Ee.call(this),this.headers=new Map,this.o=o||null,this.h=!1,this.v=this.g=null,this.D="",this.m=0,this.l="",this.j=this.B=this.u=this.A=!1,this.I=null,this.H="",this.J=!1}R(oe,Ee);var jm=/^https?$/i,zm=["POST","PUT"];n=oe.prototype,n.Ha=function(o){this.J=o},n.ea=function(o,u,h,f){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.D+"; newUri="+o);u=u?u.toUpperCase():"GET",this.D=o,this.l="",this.m=0,this.A=!1,this.h=!0,this.g=this.o?this.o.g():Lo.g(),this.v=this.o?Cl(this.o):Cl(Lo),this.g.onreadystatechange=v(this.Ea,this);try{this.B=!0,this.g.open(u,String(o),!0),this.B=!1}catch(S){th(this,S);return}if(o=h||"",h=new Map(this.headers),f)if(Object.getPrototypeOf(f)===Object.prototype)for(var b in f)h.set(b,f[b]);else if(typeof f.keys=="function"&&typeof f.get=="function")for(let S of f.keys())h.set(S,f.get(S));else throw Error("Unknown input type for opt_headers: "+String(f));f=Array.from(h.keys()).find(S=>S.toLowerCase()=="content-type"),b=c.FormData&&o instanceof c.FormData,!(0<=Array.prototype.indexOf.call(zm,u,void 0))||f||b||h.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(let[S,x]of h)this.g.setRequestHeader(S,x);this.H&&(this.g.responseType=this.H),"withCredentials"in this.g&&this.g.withCredentials!==this.J&&(this.g.withCredentials=this.J);try{ih(this),this.u=!0,this.g.send(o),this.u=!1}catch(S){th(this,S)}};function th(o,u){o.h=!1,o.g&&(o.j=!0,o.g.abort(),o.j=!1),o.l=u,o.m=5,nh(o),Ni(o)}function nh(o){o.A||(o.A=!0,ke(o,"complete"),ke(o,"error"))}n.abort=function(o){this.g&&this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1,this.m=o||7,ke(this,"complete"),ke(this,"abort"),Ni(this))},n.N=function(){this.g&&(this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1),Ni(this,!0)),oe.aa.N.call(this)},n.Ea=function(){this.s||(this.B||this.u||this.j?rh(this):this.bb())},n.bb=function(){rh(this)};function rh(o){if(o.h&&typeof a!="undefined"&&(!o.v[1]||lt(o)!=4||o.Z()!=2)){if(o.u&&lt(o)==4)Al(o.Ea,0,o);else if(ke(o,"readystatechange"),lt(o)==4){o.h=!1;try{let x=o.Z();e:switch(x){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var u=!0;break e;default:u=!1}var h;if(!(h=u)){var f;if(f=x===0){var b=String(o.D).match(Hl)[1]||null;!b&&c.self&&c.self.location&&(b=c.self.location.protocol.slice(0,-1)),f=!jm.test(b?b.toLowerCase():"")}h=f}if(h)ke(o,"complete"),ke(o,"success");else{o.m=6;try{var S=2<lt(o)?o.g.statusText:""}catch{S=""}o.l=S+" ["+o.Z()+"]",nh(o)}}finally{Ni(o)}}}}function Ni(o,u){if(o.g){ih(o);let h=o.g,f=o.v[0]?()=>{}:null;o.g=null,o.v=null,u||ke(o,"ready");try{h.onreadystatechange=f}catch{}}}function ih(o){o.I&&(c.clearTimeout(o.I),o.I=null)}n.isActive=function(){return!!this.g};function lt(o){return o.g?o.g.readyState:0}n.Z=function(){try{return 2<lt(this)?this.g.status:-1}catch{return-1}},n.oa=function(){try{return this.g?this.g.responseText:""}catch{return""}},n.Oa=function(o){if(this.g){var u=this.g.responseText;return o&&u.indexOf(o)==0&&(u=u.substring(o.length)),wm(u)}};function sh(o){try{if(!o.g)return null;if("response"in o.g)return o.g.response;switch(o.H){case"":case"text":return o.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in o.g)return o.g.mozResponseArrayBuffer}return null}catch{return null}}function Gm(o){let u={};o=(o.g&&2<=lt(o)&&o.g.getAllResponseHeaders()||"").split(`\r
`);for(let f=0;f<o.length;f++){if(B(o[f]))continue;var h=T(o[f]);let b=h[0];if(h=h[1],typeof h!="string")continue;h=h.trim();let S=u[b]||[];u[b]=S,S.push(h)}E(u,function(f){return f.join(", ")})}n.Ba=function(){return this.m},n.Ka=function(){return typeof this.l=="string"?this.l:String(this.l)};function _r(o,u,h){return h&&h.internalChannelParams&&h.internalChannelParams[o]||u}function oh(o){this.Aa=0,this.i=[],this.j=new ur,this.ia=this.qa=this.I=this.W=this.g=this.ya=this.D=this.H=this.m=this.S=this.o=null,this.Ya=this.U=0,this.Va=_r("failFast",!1,o),this.F=this.C=this.u=this.s=this.l=null,this.X=!0,this.za=this.T=-1,this.Y=this.v=this.B=0,this.Ta=_r("baseRetryDelayMs",5e3,o),this.cb=_r("retryDelaySeedMs",1e4,o),this.Wa=_r("forwardChannelMaxRetries",2,o),this.wa=_r("forwardChannelRequestTimeoutMs",2e4,o),this.pa=o&&o.xmlHttpFactory||void 0,this.Xa=o&&o.Tb||void 0,this.Ca=o&&o.useFetchStreams||!1,this.L=void 0,this.J=o&&o.supportsCrossDomainXhr||!1,this.K="",this.h=new Bl(o&&o.concurrentRequestLimit),this.Da=new qm,this.P=o&&o.fastHandshake||!1,this.O=o&&o.encodeInitMessageHeaders||!1,this.P&&this.O&&(this.O=!1),this.Ua=o&&o.Rb||!1,o&&o.xa&&this.j.xa(),o&&o.forceLongPolling&&(this.X=!1),this.ba=!this.P&&this.X&&o&&o.detectBufferingProxy||!1,this.ja=void 0,o&&o.longPollingTimeout&&0<o.longPollingTimeout&&(this.ja=o.longPollingTimeout),this.ca=void 0,this.R=0,this.M=!1,this.ka=this.A=null}n=oh.prototype,n.la=8,n.G=1,n.connect=function(o,u,h,f){Ne(0),this.W=o,this.H=u||{},h&&f!==void 0&&(this.H.OSID=h,this.H.OAID=f),this.F=this.X,this.I=mh(this,null,this.W),xi(this)};function Go(o){if(ah(o),o.G==3){var u=o.U++,h=ut(o.I);if(Z(h,"SID",o.K),Z(h,"RID",u),Z(h,"TYPE","terminate"),yr(o,h),u=new Tt(o,o.j,u),u.L=2,u.v=Ci(ut(h)),h=!1,c.navigator&&c.navigator.sendBeacon)try{h=c.navigator.sendBeacon(u.v.toString(),"")}catch{}!h&&c.Image&&(new Image().src=u.v,h=!0),h||(u.g=gh(u.j,null),u.g.ea(u.v)),u.F=Date.now(),Si(u)}ph(o)}function Di(o){o.g&&(Ko(o),o.g.cancel(),o.g=null)}function ah(o){Di(o),o.u&&(c.clearTimeout(o.u),o.u=null),Oi(o),o.h.cancel(),o.s&&(typeof o.s=="number"&&c.clearTimeout(o.s),o.s=null)}function xi(o){if(!jl(o.h)&&!o.s){o.s=!0;var u=o.Ga;tr||vl(),nr||(tr(),nr=!0),To.add(u,o),o.B=0}}function $m(o,u){return zl(o.h)>=o.h.j-(o.s?1:0)?!1:o.s?(o.i=u.D.concat(o.i),!0):o.G==1||o.G==2||o.B>=(o.Va?0:o.Wa)?!1:(o.s=cr(v(o.Ga,o,u),fh(o,o.B)),o.B++,!0)}n.Ga=function(o){if(this.s)if(this.s=null,this.G==1){if(!o){this.U=Math.floor(1e5*Math.random()),o=this.U++;let b=new Tt(this,this.j,o),S=this.o;if(this.S&&(S?(S=m(S),I(S,this.S)):S=this.S),this.m!==null||this.O||(b.H=S,S=null),this.P)e:{for(var u=0,h=0;h<this.i.length;h++){t:{var f=this.i[h];if("__data__"in f.map&&(f=f.map.__data__,typeof f=="string")){f=f.length;break t}f=void 0}if(f===void 0)break;if(u+=f,4096<u){u=h;break e}if(u===4096||h===this.i.length-1){u=h+1;break e}}u=1e3}else u=1e3;u=uh(this,b,u),h=ut(this.I),Z(h,"RID",o),Z(h,"CVER",22),this.D&&Z(h,"X-HTTP-Session-Id",this.D),yr(this,h),S&&(this.O?u="headers="+encodeURIComponent(String(eh(S)))+"&"+u:this.m&&zo(h,this.m,S)),jo(this.h,b),this.Ua&&Z(h,"TYPE","init"),this.P?(Z(h,"$req",u),Z(h,"SID","null"),b.T=!0,Fo(b,h,null)):Fo(b,h,u),this.G=2}}else this.G==3&&(o?ch(this,o):this.i.length==0||jl(this.h)||ch(this))};function ch(o,u){var h;u?h=u.l:h=o.U++;let f=ut(o.I);Z(f,"SID",o.K),Z(f,"RID",h),Z(f,"AID",o.T),yr(o,f),o.m&&o.o&&zo(f,o.m,o.o),h=new Tt(o,o.j,h,o.B+1),o.m===null&&(h.H=o.o),u&&(o.i=u.D.concat(o.i)),u=uh(o,h,1e3),h.I=Math.round(.5*o.wa)+Math.round(.5*o.wa*Math.random()),jo(o.h,h),Fo(h,f,u)}function yr(o,u){o.H&&K(o.H,function(h,f){Z(u,f,h)}),o.l&&Kl({},function(h,f){Z(u,f,h)})}function uh(o,u,h){h=Math.min(o.i.length,h);var f=o.l?v(o.l.Na,o.l,o):null;e:{var b=o.i;let S=-1;for(;;){let x=["count="+h];S==-1?0<h?(S=b[0].g,x.push("ofs="+S)):S=0:x.push("ofs="+S);let X=!0;for(let _e=0;_e<h;_e++){let Q=b[_e].g,Te=b[_e].map;if(Q-=S,0>Q)S=Math.max(0,b[_e].g-100),X=!1;else try{Bm(Te,x,"req"+Q+"_")}catch{f&&f(Te)}}if(X){f=x.join("&");break e}}}return o=o.i.splice(0,h),u.D=o,f}function lh(o){if(!o.g&&!o.u){o.Y=1;var u=o.Fa;tr||vl(),nr||(tr(),nr=!0),To.add(u,o),o.v=0}}function $o(o){return o.g||o.u||3<=o.v?!1:(o.Y++,o.u=cr(v(o.Fa,o),fh(o,o.v)),o.v++,!0)}n.Fa=function(){if(this.u=null,hh(this),this.ba&&!(this.M||this.g==null||0>=this.R)){var o=2*this.R;this.j.info("BP detection timer enabled: "+o),this.A=cr(v(this.ab,this),o)}},n.ab=function(){this.A&&(this.A=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.F=!1,this.M=!0,Ne(10),Di(this),hh(this))};function Ko(o){o.A!=null&&(c.clearTimeout(o.A),o.A=null)}function hh(o){o.g=new Tt(o,o.j,"rpc",o.Y),o.m===null&&(o.g.H=o.o),o.g.O=0;var u=ut(o.qa);Z(u,"RID","rpc"),Z(u,"SID",o.K),Z(u,"AID",o.T),Z(u,"CI",o.F?"0":"1"),!o.F&&o.ja&&Z(u,"TO",o.ja),Z(u,"TYPE","xmlhttp"),yr(o,u),o.m&&o.o&&zo(u,o.m,o.o),o.L&&(o.g.I=o.L);var h=o.g;o=o.ia,h.L=1,h.v=Ci(ut(u)),h.m=null,h.P=!0,Fl(h,o)}n.Za=function(){this.C!=null&&(this.C=null,Di(this),$o(this),Ne(19))};function Oi(o){o.C!=null&&(c.clearTimeout(o.C),o.C=null)}function dh(o,u){var h=null;if(o.g==u){Oi(o),Ko(o),o.g=null;var f=2}else if(Bo(o.h,u))h=u.D,Gl(o.h,u),f=1;else return;if(o.G!=0){if(u.o)if(f==1){h=u.m?u.m.length:0,u=Date.now()-u.F;var b=o.B;f=Ti(),ke(f,new Ol(f,h)),xi(o)}else lh(o);else if(b=u.s,b==3||b==0&&0<u.X||!(f==1&&$m(o,u)||f==2&&$o(o)))switch(h&&0<h.length&&(u=o.h,u.i=u.i.concat(h)),b){case 1:Bt(o,5);break;case 4:Bt(o,10);break;case 3:Bt(o,6);break;default:Bt(o,2)}}}function fh(o,u){let h=o.Ta+Math.floor(Math.random()*o.cb);return o.isActive()||(h*=2),h*u}function Bt(o,u){if(o.j.info("Error code "+u),u==2){var h=v(o.fb,o),f=o.Xa;let b=!f;f=new qt(f||"//www.google.com/images/cleardot.gif"),c.location&&c.location.protocol=="http"||Ri(f,"https"),Ci(f),b?Fm(f.toString(),h):Um(f.toString(),h)}else Ne(2);o.G=0,o.l&&o.l.sa(u),ph(o),ah(o)}n.fb=function(o){o?(this.j.info("Successfully pinged google.com"),Ne(2)):(this.j.info("Failed to ping google.com"),Ne(1))};function ph(o){if(o.G=0,o.ka=[],o.l){let u=$l(o.h);(u.length!=0||o.i.length!=0)&&(C(o.ka,u),C(o.ka,o.i),o.h.i.length=0,D(o.i),o.i.length=0),o.l.ra()}}function mh(o,u,h){var f=h instanceof qt?ut(h):new qt(h);if(f.g!="")u&&(f.g=u+"."+f.g),Pi(f,f.s);else{var b=c.location;f=b.protocol,u=u?u+"."+b.hostname:b.hostname,b=+b.port;var S=new qt(null);f&&Ri(S,f),u&&(S.g=u),b&&Pi(S,b),h&&(S.l=h),f=S}return h=o.D,u=o.ya,h&&u&&Z(f,h,u),Z(f,"VER",o.la),yr(o,f),f}function gh(o,u,h){if(u&&!o.J)throw Error("Can't create secondary domain capable XhrIo object.");return u=o.Ca&&!o.pa?new oe(new pr({eb:h})):new oe(o.pa),u.Ha(o.J),u}n.isActive=function(){return!!this.l&&this.l.isActive(this)};function _h(){}n=_h.prototype,n.ua=function(){},n.ta=function(){},n.sa=function(){},n.ra=function(){},n.isActive=function(){return!0},n.Na=function(){};function Vi(){}Vi.prototype.g=function(o,u){return new Le(o,u)};function Le(o,u){Ee.call(this),this.g=new oh(u),this.l=o,this.h=u&&u.messageUrlParams||null,o=u&&u.messageHeaders||null,u&&u.clientProtocolHeaderRequired&&(o?o["X-Client-Protocol"]="webchannel":o={"X-Client-Protocol":"webchannel"}),this.g.o=o,o=u&&u.initMessageHeaders||null,u&&u.messageContentType&&(o?o["X-WebChannel-Content-Type"]=u.messageContentType:o={"X-WebChannel-Content-Type":u.messageContentType}),u&&u.va&&(o?o["X-WebChannel-Client-Profile"]=u.va:o={"X-WebChannel-Client-Profile":u.va}),this.g.S=o,(o=u&&u.Sb)&&!B(o)&&(this.g.m=o),this.v=u&&u.supportsCrossDomainXhr||!1,this.u=u&&u.sendRawJson||!1,(u=u&&u.httpSessionIdParam)&&!B(u)&&(this.g.D=u,o=this.h,o!==null&&u in o&&(o=this.h,u in o&&delete o[u])),this.j=new mn(this)}R(Le,Ee),Le.prototype.m=function(){this.g.l=this.j,this.v&&(this.g.J=!0),this.g.connect(this.l,this.h||void 0)},Le.prototype.close=function(){Go(this.g)},Le.prototype.o=function(o){var u=this.g;if(typeof o=="string"){var h={};h.__data__=o,o=h}else this.u&&(h={},h.__data__=Do(o),o=h);u.i.push(new Pm(u.Ya++,o)),u.G==3&&xi(u)},Le.prototype.N=function(){this.g.l=null,delete this.j,Go(this.g),delete this.g,Le.aa.N.call(this)};function yh(o){Oo.call(this),o.__headers__&&(this.headers=o.__headers__,this.statusCode=o.__status__,delete o.__headers__,delete o.__status__);var u=o.__sm__;if(u){e:{for(let h in u){o=h;break e}o=void 0}(this.i=o)&&(o=this.i,u=u!==null&&o in u?u[o]:void 0),this.data=u}else this.data=o}R(yh,Oo);function vh(){Vo.call(this),this.status=1}R(vh,Vo);function mn(o){this.g=o}R(mn,_h),mn.prototype.ua=function(){ke(this.g,"a")},mn.prototype.ta=function(o){ke(this.g,new yh(o))},mn.prototype.sa=function(o){ke(this.g,new vh)},mn.prototype.ra=function(){ke(this.g,"b")},Vi.prototype.createWebChannel=Vi.prototype.g,Le.prototype.send=Le.prototype.o,Le.prototype.open=Le.prototype.m,Le.prototype.close=Le.prototype.close,Ea=ft.createWebChannelTransport=function(){return new Vi},wa=ft.getStatEventTarget=function(){return Ti()},Ia=ft.Event=Ft,$i=ft.Stat={mb:0,pb:1,qb:2,Jb:3,Ob:4,Lb:5,Mb:6,Kb:7,Ib:8,Nb:9,PROXY:10,NOPROXY:11,Gb:12,Cb:13,Db:14,Bb:15,Eb:16,Fb:17,ib:18,hb:19,jb:20},bi.NO_ERROR=0,bi.TIMEOUT=8,bi.HTTP_ERROR=6,wr=ft.ErrorCode=bi,Vl.COMPLETE="complete",va=ft.EventType=Vl,kl.EventType=or,or.OPEN="a",or.CLOSE="b",or.ERROR="c",or.MESSAGE="d",Ee.prototype.listen=Ee.prototype.K,wn=ft.WebChannel=kl,s_=ft.FetchXmlHttpFactory=pr,oe.prototype.listenOnce=oe.prototype.L,oe.prototype.getLastError=oe.prototype.Ka,oe.prototype.getLastErrorCode=oe.prototype.Ba,oe.prototype.getStatus=oe.prototype.Z,oe.prototype.getResponseJson=oe.prototype.Oa,oe.prototype.getResponseText=oe.prototype.oa,oe.prototype.send=oe.prototype.ea,oe.prototype.setWithCredentials=oe.prototype.Ha,ya=ft.XhrIo=oe}).apply(typeof Gi!="undefined"?Gi:typeof self!="undefined"?self:typeof window!="undefined"?window:{});var Wh="@firebase/firestore";var ge=class{constructor(e){this.uid=e}isAuthenticated(){return this.uid!=null}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(e){return e.uid===this.uid}};ge.UNAUTHENTICATED=new ge(null),ge.GOOGLE_CREDENTIALS=new ge("google-credentials-uid"),ge.FIRST_PARTY=new ge("first-party-uid"),ge.MOCK_USER=new ge("mock-user");var jn="10.14.0";var Wt=new St("@firebase/firestore");function Er(){return Wt.logLevel}function V(n,...e){if(Wt.logLevel<=$.DEBUG){let t=e.map(iu);Wt.debug(`Firestore (${jn}): ${n}`,...t)}}function mt(n,...e){if(Wt.logLevel<=$.ERROR){let t=e.map(iu);Wt.error(`Firestore (${jn}): ${n}`,...t)}}function Pn(n,...e){if(Wt.logLevel<=$.WARN){let t=e.map(iu);Wt.warn(`Firestore (${jn}): ${n}`,...t)}}function iu(n){if(typeof n=="string")return n;try{return function(t){return JSON.stringify(t)}(n)}catch{return n}}function q(n="Unexpected state"){let e=`FIRESTORE (${jn}) INTERNAL ASSERTION FAILED: `+n;throw mt(e),new Error(e)}function Y(n,e){n||q()}function j(n,e){return n}var P={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"},O=class extends De{constructor(e,t){super(e,t),this.code=e,this.message=t,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}};var je=class{constructor(){this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}};var Ji=class{constructor(e,t){this.user=t,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${e}`)}},Ra=class{getToken(){return Promise.resolve(null)}invalidateToken(){}start(e,t){e.enqueueRetryable(()=>t(ge.UNAUTHENTICATED))}shutdown(){}},Pa=class{constructor(e){this.token=e,this.changeListener=null}getToken(){return Promise.resolve(this.token)}invalidateToken(){}start(e,t){this.changeListener=t,e.enqueueRetryable(()=>t(this.token.user))}shutdown(){this.changeListener=null}},Ca=class{constructor(e){this.t=e,this.currentUser=ge.UNAUTHENTICATED,this.i=0,this.forceRefresh=!1,this.auth=null}start(e,t){Y(this.o===void 0);let r=this.i,i=l=>this.i!==r?(r=this.i,t(l)):Promise.resolve(),s=new je;this.o=()=>{this.i++,this.currentUser=this.u(),s.resolve(),s=new je,e.enqueueRetryable(()=>i(this.currentUser))};let a=()=>{let l=s;e.enqueueRetryable(async()=>{await l.promise,await i(this.currentUser)})},c=l=>{V("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=l,this.o&&(this.auth.addAuthTokenListener(this.o),a())};this.t.onInit(l=>c(l)),setTimeout(()=>{if(!this.auth){let l=this.t.getImmediate({optional:!0});l?c(l):(V("FirebaseAuthCredentialsProvider","Auth not yet detected"),s.resolve(),s=new je)}},0),a()}getToken(){let e=this.i,t=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(t).then(r=>this.i!==e?(V("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):r?(Y(typeof r.accessToken=="string"),new Ji(r.accessToken,this.currentUser)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.o&&this.auth.removeAuthTokenListener(this.o),this.o=void 0}u(){let e=this.auth&&this.auth.getUid();return Y(e===null||typeof e=="string"),new ge(e)}},ka=class{constructor(e,t,r){this.l=e,this.h=t,this.P=r,this.type="FirstParty",this.user=ge.FIRST_PARTY,this.I=new Map}T(){return this.P?this.P():null}get headers(){this.I.set("X-Goog-AuthUser",this.l);let e=this.T();return e&&this.I.set("Authorization",e),this.h&&this.I.set("X-Goog-Iam-Authorization-Token",this.h),this.I}},Na=class{constructor(e,t,r){this.l=e,this.h=t,this.P=r}getToken(){return Promise.resolve(new ka(this.l,this.h,this.P))}start(e,t){e.enqueueRetryable(()=>t(ge.FIRST_PARTY))}shutdown(){}invalidateToken(){}},Da=class{constructor(e){this.value=e,this.type="AppCheck",this.headers=new Map,e&&e.length>0&&this.headers.set("x-firebase-appcheck",this.value)}},xa=class{constructor(e){this.A=e,this.forceRefresh=!1,this.appCheck=null,this.R=null}start(e,t){Y(this.o===void 0);let r=s=>{s.error!=null&&V("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${s.error.message}`);let a=s.token!==this.R;return this.R=s.token,V("FirebaseAppCheckTokenProvider",`Received ${a?"new":"existing"} token.`),a?t(s.token):Promise.resolve()};this.o=s=>{e.enqueueRetryable(()=>r(s))};let i=s=>{V("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=s,this.o&&this.appCheck.addTokenListener(this.o)};this.A.onInit(s=>i(s)),setTimeout(()=>{if(!this.appCheck){let s=this.A.getImmediate({optional:!0});s?i(s):V("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}},0)}getToken(){let e=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(e).then(t=>t?(Y(typeof t.token=="string"),this.R=t.token,new Da(t.token)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.o&&this.appCheck.removeTokenListener(this.o),this.o=void 0}};function o_(n){let e=typeof self!="undefined"&&(self.crypto||self.msCrypto),t=new Uint8Array(n);if(e&&typeof e.getRandomValues=="function")e.getRandomValues(t);else for(let r=0;r<n;r++)t[r]=Math.floor(256*Math.random());return t}var Yi=class{static newId(){let e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",t=Math.floor(256/e.length)*e.length,r="";for(;r.length<20;){let i=o_(40);for(let s=0;s<i.length;++s)r.length<20&&i[s]<t&&(r+=e.charAt(i[s]%e.length))}return r}};function J(n,e){return n<e?-1:n>e?1:0}function Cn(n,e,t){return n.length===e.length&&n.every((r,i)=>t(r,e[i]))}var ye=class n{constructor(e,t){if(this.seconds=e,this.nanoseconds=t,t<0)throw new O(P.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(t>=1e9)throw new O(P.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(e<-62135596800)throw new O(P.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e);if(e>=253402300800)throw new O(P.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e)}static now(){return n.fromMillis(Date.now())}static fromDate(e){return n.fromMillis(e.getTime())}static fromMillis(e){let t=Math.floor(e/1e3),r=Math.floor(1e6*(e-1e3*t));return new n(t,r)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/1e6}_compareTo(e){return this.seconds===e.seconds?J(this.nanoseconds,e.nanoseconds):J(this.seconds,e.seconds)}isEqual(e){return e.seconds===this.seconds&&e.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{seconds:this.seconds,nanoseconds:this.nanoseconds}}valueOf(){let e=this.seconds- -62135596800;return String(e).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}};var G=class n{constructor(e){this.timestamp=e}static fromTimestamp(e){return new n(e)}static min(){return new n(new ye(0,0))}static max(){return new n(new ye(253402300799,999999999))}compareTo(e){return this.timestamp._compareTo(e.timestamp)}isEqual(e){return this.timestamp.isEqual(e.timestamp)}toMicroseconds(){return 1e6*this.timestamp.seconds+this.timestamp.nanoseconds/1e3}toString(){return"SnapshotVersion("+this.timestamp.toString()+")"}toTimestamp(){return this.timestamp}};var Xi=class n{constructor(e,t,r){t===void 0?t=0:t>e.length&&q(),r===void 0?r=e.length-t:r>e.length-t&&q(),this.segments=e,this.offset=t,this.len=r}get length(){return this.len}isEqual(e){return n.comparator(this,e)===0}child(e){let t=this.segments.slice(this.offset,this.limit());return e instanceof n?e.forEach(r=>{t.push(r)}):t.push(e),this.construct(t)}limit(){return this.offset+this.length}popFirst(e){return e=e===void 0?1:e,this.construct(this.segments,this.offset+e,this.length-e)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(e){return this.segments[this.offset+e]}isEmpty(){return this.length===0}isPrefixOf(e){if(e.length<this.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}isImmediateParentOf(e){if(this.length+1!==e.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}forEach(e){for(let t=this.offset,r=this.limit();t<r;t++)e(this.segments[t])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(e,t){let r=Math.min(e.length,t.length);for(let i=0;i<r;i++){let s=e.get(i),a=t.get(i);if(s<a)return-1;if(s>a)return 1}return e.length<t.length?-1:e.length>t.length?1:0}},re=class n extends Xi{construct(e,t,r){return new n(e,t,r)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}toUriEncodedString(){return this.toArray().map(encodeURIComponent).join("/")}static fromString(...e){let t=[];for(let r of e){if(r.indexOf("//")>=0)throw new O(P.INVALID_ARGUMENT,`Invalid segment (${r}). Paths must not contain // in them.`);t.push(...r.split("/").filter(i=>i.length>0))}return new n(t)}static emptyPath(){return new n([])}},a_=/^[_a-zA-Z][_a-zA-Z0-9]*$/,Fe=class n extends Xi{construct(e,t,r){return new n(e,t,r)}static isValidIdentifier(e){return a_.test(e)}canonicalString(){return this.toArray().map(e=>(e=e.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),n.isValidIdentifier(e)||(e="`"+e+"`"),e)).join(".")}toString(){return this.canonicalString()}isKeyField(){return this.length===1&&this.get(0)==="__name__"}static keyField(){return new n(["__name__"])}static fromServerFormat(e){let t=[],r="",i=0,s=()=>{if(r.length===0)throw new O(P.INVALID_ARGUMENT,`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);t.push(r),r=""},a=!1;for(;i<e.length;){let c=e[i];if(c==="\\"){if(i+1===e.length)throw new O(P.INVALID_ARGUMENT,"Path has trailing escape character: "+e);let l=e[i+1];if(l!=="\\"&&l!=="."&&l!=="`")throw new O(P.INVALID_ARGUMENT,"Path has invalid escape sequence: "+e);r+=l,i+=2}else c==="`"?(a=!a,i++):c!=="."||a?(r+=c,i++):(s(),i++)}if(s(),a)throw new O(P.INVALID_ARGUMENT,"Unterminated ` in path: "+e);return new n(t)}static emptyPath(){return new n([])}};var M=class n{constructor(e){this.path=e}static fromPath(e){return new n(re.fromString(e))}static fromName(e){return new n(re.fromString(e).popFirst(5))}static empty(){return new n(re.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(e){return this.path.length>=2&&this.path.get(this.path.length-2)===e}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(e){return e!==null&&re.comparator(this.path,e.path)===0}toString(){return this.path.toString()}static comparator(e,t){return re.comparator(e.path,t.path)}static isDocumentKey(e){return e.length%2==0}static fromSegments(e){return new n(new re(e.slice()))}};var Oa=class{constructor(e,t,r,i){this.indexId=e,this.collectionGroup=t,this.fields=r,this.indexState=i}};Oa.UNKNOWN_ID=-1;function c_(n,e){let t=n.toTimestamp().seconds,r=n.toTimestamp().nanoseconds+1,i=G.fromTimestamp(r===1e9?new ye(t+1,0):new ye(t,r));return new Qt(i,M.empty(),e)}function u_(n){return new Qt(n.readTime,n.key,-1)}var Qt=class n{constructor(e,t,r){this.readTime=e,this.documentKey=t,this.largestBatchId=r}static min(){return new n(G.min(),M.empty(),-1)}static max(){return new n(G.max(),M.empty(),-1)}};function l_(n,e){let t=n.readTime.compareTo(e.readTime);return t!==0?t:(t=M.comparator(n.documentKey,e.documentKey),t!==0?t:J(n.largestBatchId,e.largestBatchId))}var h_="The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab.",Va=class{constructor(){this.onCommittedListeners=[]}addOnCommittedListener(e){this.onCommittedListeners.push(e)}raiseOnCommittedEvent(){this.onCommittedListeners.forEach(e=>e())}};async function Kr(n){if(n.code!==P.FAILED_PRECONDITION||n.message!==h_)throw n;V("LocalStore","Unexpectedly lost primary lease")}var N=class n{constructor(e){this.nextCallback=null,this.catchCallback=null,this.result=void 0,this.error=void 0,this.isDone=!1,this.callbackAttached=!1,e(t=>{this.isDone=!0,this.result=t,this.nextCallback&&this.nextCallback(t)},t=>{this.isDone=!0,this.error=t,this.catchCallback&&this.catchCallback(t)})}catch(e){return this.next(void 0,e)}next(e,t){return this.callbackAttached&&q(),this.callbackAttached=!0,this.isDone?this.error?this.wrapFailure(t,this.error):this.wrapSuccess(e,this.result):new n((r,i)=>{this.nextCallback=s=>{this.wrapSuccess(e,s).next(r,i)},this.catchCallback=s=>{this.wrapFailure(t,s).next(r,i)}})}toPromise(){return new Promise((e,t)=>{this.next(e,t)})}wrapUserFunction(e){try{let t=e();return t instanceof n?t:n.resolve(t)}catch(t){return n.reject(t)}}wrapSuccess(e,t){return e?this.wrapUserFunction(()=>e(t)):n.resolve(t)}wrapFailure(e,t){return e?this.wrapUserFunction(()=>e(t)):n.reject(t)}static resolve(e){return new n((t,r)=>{t(e)})}static reject(e){return new n((t,r)=>{r(e)})}static waitFor(e){return new n((t,r)=>{let i=0,s=0,a=!1;e.forEach(c=>{++i,c.next(()=>{++s,a&&s===i&&t()},l=>r(l))}),a=!0,s===i&&t()})}static or(e){let t=n.resolve(!1);for(let r of e)t=t.next(i=>i?n.resolve(i):r());return t}static forEach(e,t){let r=[];return e.forEach((i,s)=>{r.push(t.call(this,i,s))}),this.waitFor(r)}static mapArray(e,t){return new n((r,i)=>{let s=e.length,a=new Array(s),c=0;for(let l=0;l<s;l++){let d=l;t(e[d]).next(p=>{a[d]=p,++c,c===s&&r(a)},p=>i(p))}})}static doWhile(e,t){return new n((r,i)=>{let s=()=>{e()===!0?t().next(()=>{s()},i):r()};s()})}};function d_(n){let e=n.match(/Android ([\d.]+)/i),t=e?e[1].split(".").slice(0,2).join("."):"-1";return Number(t)}function Hr(n){return n.name==="IndexedDbTransactionError"}var Pr=class{constructor(e,t){this.previousValue=e,t&&(t.sequenceNumberHandler=r=>this.ie(r),this.se=r=>t.writeSequenceNumber(r))}ie(e){return this.previousValue=Math.max(e,this.previousValue),this.previousValue}next(){let e=++this.previousValue;return this.se&&this.se(e),e}};Pr.oe=-1;function Ps(n){return n==null}function Cr(n){return n===0&&1/n==-1/0}function f_(n){return typeof n=="number"&&Number.isInteger(n)&&!Cr(n)&&n<=Number.MAX_SAFE_INTEGER&&n>=Number.MIN_SAFE_INTEGER}var p_=["mutationQueues","mutations","documentMutations","remoteDocuments","targets","owner","targetGlobal","targetDocuments","clientMetadata","remoteDocumentGlobal","collectionParents","bundles","namedQueries"],zE=[...p_,"documentOverlays"],m_=["mutationQueues","mutations","documentMutations","remoteDocumentsV14","targets","owner","targetGlobal","targetDocuments","clientMetadata","remoteDocumentGlobal","collectionParents","bundles","namedQueries","documentOverlays"],g_=m_,__=[...g_,"indexConfiguration","indexState","indexEntries"];var GE=[...__,"globals"];function Qh(n){let e=0;for(let t in n)Object.prototype.hasOwnProperty.call(n,t)&&e++;return e}function nn(n,e){for(let t in n)Object.prototype.hasOwnProperty.call(n,t)&&e(t,n[t])}function Pd(n){for(let e in n)if(Object.prototype.hasOwnProperty.call(n,e))return!1;return!0}var ae=class n{constructor(e,t){this.comparator=e,this.root=t||Xe.EMPTY}insert(e,t){return new n(this.comparator,this.root.insert(e,t,this.comparator).copy(null,null,Xe.BLACK,null,null))}remove(e){return new n(this.comparator,this.root.remove(e,this.comparator).copy(null,null,Xe.BLACK,null,null))}get(e){let t=this.root;for(;!t.isEmpty();){let r=this.comparator(e,t.key);if(r===0)return t.value;r<0?t=t.left:r>0&&(t=t.right)}return null}indexOf(e){let t=0,r=this.root;for(;!r.isEmpty();){let i=this.comparator(e,r.key);if(i===0)return t+r.left.size;i<0?r=r.left:(t+=r.left.size+1,r=r.right)}return-1}isEmpty(){return this.root.isEmpty()}get size(){return this.root.size}minKey(){return this.root.minKey()}maxKey(){return this.root.maxKey()}inorderTraversal(e){return this.root.inorderTraversal(e)}forEach(e){this.inorderTraversal((t,r)=>(e(t,r),!1))}toString(){let e=[];return this.inorderTraversal((t,r)=>(e.push(`${t}:${r}`),!1)),`{${e.join(", ")}}`}reverseTraversal(e){return this.root.reverseTraversal(e)}getIterator(){return new An(this.root,null,this.comparator,!1)}getIteratorFrom(e){return new An(this.root,e,this.comparator,!1)}getReverseIterator(){return new An(this.root,null,this.comparator,!0)}getReverseIteratorFrom(e){return new An(this.root,e,this.comparator,!0)}},An=class{constructor(e,t,r,i){this.isReverse=i,this.nodeStack=[];let s=1;for(;!e.isEmpty();)if(s=t?r(e.key,t):1,t&&i&&(s*=-1),s<0)e=this.isReverse?e.left:e.right;else{if(s===0){this.nodeStack.push(e);break}this.nodeStack.push(e),e=this.isReverse?e.right:e.left}}getNext(){let e=this.nodeStack.pop(),t={key:e.key,value:e.value};if(this.isReverse)for(e=e.left;!e.isEmpty();)this.nodeStack.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack.push(e),e=e.left;return t}hasNext(){return this.nodeStack.length>0}peek(){if(this.nodeStack.length===0)return null;let e=this.nodeStack[this.nodeStack.length-1];return{key:e.key,value:e.value}}},Xe=class n{constructor(e,t,r,i,s){this.key=e,this.value=t,this.color=r!=null?r:n.RED,this.left=i!=null?i:n.EMPTY,this.right=s!=null?s:n.EMPTY,this.size=this.left.size+1+this.right.size}copy(e,t,r,i,s){return new n(e!=null?e:this.key,t!=null?t:this.value,r!=null?r:this.color,i!=null?i:this.left,s!=null?s:this.right)}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min(){return this.left.isEmpty()?this:this.left.min()}minKey(){return this.min().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,r){let i=this,s=r(e,i.key);return i=s<0?i.copy(null,null,null,i.left.insert(e,t,r),null):s===0?i.copy(null,t,null,null,null):i.copy(null,null,null,null,i.right.insert(e,t,r)),i.fixUp()}removeMin(){if(this.left.isEmpty())return n.EMPTY;let e=this;return e.left.isRed()||e.left.left.isRed()||(e=e.moveRedLeft()),e=e.copy(null,null,null,e.left.removeMin(),null),e.fixUp()}remove(e,t){let r,i=this;if(t(e,i.key)<0)i.left.isEmpty()||i.left.isRed()||i.left.left.isRed()||(i=i.moveRedLeft()),i=i.copy(null,null,null,i.left.remove(e,t),null);else{if(i.left.isRed()&&(i=i.rotateRight()),i.right.isEmpty()||i.right.isRed()||i.right.left.isRed()||(i=i.moveRedRight()),t(e,i.key)===0){if(i.right.isEmpty())return n.EMPTY;r=i.right.min(),i=i.copy(r.key,r.value,null,null,i.right.removeMin())}i=i.copy(null,null,null,null,i.right.remove(e,t))}return i.fixUp()}isRed(){return this.color}fixUp(){let e=this;return e.right.isRed()&&!e.left.isRed()&&(e=e.rotateLeft()),e.left.isRed()&&e.left.left.isRed()&&(e=e.rotateRight()),e.left.isRed()&&e.right.isRed()&&(e=e.colorFlip()),e}moveRedLeft(){let e=this.colorFlip();return e.right.left.isRed()&&(e=e.copy(null,null,null,null,e.right.rotateRight()),e=e.rotateLeft(),e=e.colorFlip()),e}moveRedRight(){let e=this.colorFlip();return e.left.left.isRed()&&(e=e.rotateRight(),e=e.colorFlip()),e}rotateLeft(){let e=this.copy(null,null,n.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight(){let e=this.copy(null,null,n.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip(){let e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth(){let e=this.check();return Math.pow(2,e)<=this.size+1}check(){if(this.isRed()&&this.left.isRed()||this.right.isRed())throw q();let e=this.left.check();if(e!==this.right.check())throw q();return e+(this.isRed()?0:1)}};Xe.EMPTY=null,Xe.RED=!0,Xe.BLACK=!1;Xe.EMPTY=new class{constructor(){this.size=0}get key(){throw q()}get value(){throw q()}get color(){throw q()}get left(){throw q()}get right(){throw q()}copy(e,t,r,i,s){return this}insert(e,t,r){return new Xe(e,t)}remove(e,t){return this}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}isRed(){return!1}checkMaxDepth(){return!0}check(){return 0}};var Se=class n{constructor(e){this.comparator=e,this.data=new ae(this.comparator)}has(e){return this.data.get(e)!==null}first(){return this.data.minKey()}last(){return this.data.maxKey()}get size(){return this.data.size}indexOf(e){return this.data.indexOf(e)}forEach(e){this.data.inorderTraversal((t,r)=>(e(t),!1))}forEachInRange(e,t){let r=this.data.getIteratorFrom(e[0]);for(;r.hasNext();){let i=r.getNext();if(this.comparator(i.key,e[1])>=0)return;t(i.key)}}forEachWhile(e,t){let r;for(r=t!==void 0?this.data.getIteratorFrom(t):this.data.getIterator();r.hasNext();)if(!e(r.getNext().key))return}firstAfterOrEqual(e){let t=this.data.getIteratorFrom(e);return t.hasNext()?t.getNext().key:null}getIterator(){return new Zi(this.data.getIterator())}getIteratorFrom(e){return new Zi(this.data.getIteratorFrom(e))}add(e){return this.copy(this.data.remove(e).insert(e,!0))}delete(e){return this.has(e)?this.copy(this.data.remove(e)):this}isEmpty(){return this.data.isEmpty()}unionWith(e){let t=this;return t.size<e.size&&(t=e,e=this),e.forEach(r=>{t=t.add(r)}),t}isEqual(e){if(!(e instanceof n)||this.size!==e.size)return!1;let t=this.data.getIterator(),r=e.data.getIterator();for(;t.hasNext();){let i=t.getNext().key,s=r.getNext().key;if(this.comparator(i,s)!==0)return!1}return!0}toArray(){let e=[];return this.forEach(t=>{e.push(t)}),e}toString(){let e=[];return this.forEach(t=>e.push(t)),"SortedSet("+e.toString()+")"}copy(e){let t=new n(this.comparator);return t.data=e,t}},Zi=class{constructor(e){this.iter=e}getNext(){return this.iter.getNext().key}hasNext(){return this.iter.hasNext()}};var qe=class n{constructor(e){this.fields=e,e.sort(Fe.comparator)}static empty(){return new n([])}unionWith(e){let t=new Se(Fe.comparator);for(let r of this.fields)t=t.add(r);for(let r of e)t=t.add(r);return new n(t.toArray())}covers(e){for(let t of this.fields)if(t.isPrefixOf(e))return!0;return!1}isEqual(e){return Cn(this.fields,e.fields,(t,r)=>t.isEqual(r))}};var es=class extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}};var Pe=class n{constructor(e){this.binaryString=e}static fromBase64String(e){let t=function(i){try{return atob(i)}catch(s){throw typeof DOMException!="undefined"&&s instanceof DOMException?new es("Invalid base64 string: "+s):s}}(e);return new n(t)}static fromUint8Array(e){let t=function(i){let s="";for(let a=0;a<i.length;++a)s+=String.fromCharCode(i[a]);return s}(e);return new n(t)}[Symbol.iterator](){let e=0;return{next:()=>e<this.binaryString.length?{value:this.binaryString.charCodeAt(e++),done:!1}:{value:void 0,done:!0}}}toBase64(){return function(t){return btoa(t)}(this.binaryString)}toUint8Array(){return function(t){let r=new Uint8Array(t.length);for(let i=0;i<t.length;i++)r[i]=t.charCodeAt(i);return r}(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(e){return J(this.binaryString,e.binaryString)}isEqual(e){return this.binaryString===e.binaryString}};Pe.EMPTY_BYTE_STRING=new Pe("");var y_=new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);function gt(n){if(Y(!!n),typeof n=="string"){let e=0,t=y_.exec(n);if(Y(!!t),t[1]){let i=t[1];i=(i+"000000000").substr(0,9),e=Number(i)}let r=new Date(n);return{seconds:Math.floor(r.getTime()/1e3),nanos:e}}return{seconds:ne(n.seconds),nanos:ne(n.nanos)}}function ne(n){return typeof n=="number"?n:typeof n=="string"?Number(n):0}function kt(n){return typeof n=="string"?Pe.fromBase64String(n):Pe.fromUint8Array(n)}function su(n){var e,t;return((t=(((e=n==null?void 0:n.mapValue)===null||e===void 0?void 0:e.fields)||{}).__type__)===null||t===void 0?void 0:t.stringValue)==="server_timestamp"}function ou(n){let e=n.mapValue.fields.__previous_value__;return su(e)?ou(e):e}function kr(n){let e=gt(n.mapValue.fields.__local_write_time__.timestampValue);return new ye(e.seconds,e.nanos)}var La=class{constructor(e,t,r,i,s,a,c,l,d){this.databaseId=e,this.appId=t,this.persistenceKey=r,this.host=i,this.ssl=s,this.forceLongPolling=a,this.autoDetectLongPolling=c,this.longPollingOptions=l,this.useFetchStreams=d}},ts=class n{constructor(e,t){this.projectId=e,this.database=t||"(default)"}static empty(){return new n("","")}get isDefaultDatabase(){return this.database==="(default)"}isEqual(e){return e instanceof n&&e.projectId===this.projectId&&e.database===this.database}};var Ki={mapValue:{fields:{__type__:{stringValue:"__max__"}}}};function Jt(n){return"nullValue"in n?0:"booleanValue"in n?1:"integerValue"in n||"doubleValue"in n?2:"timestampValue"in n?3:"stringValue"in n?5:"bytesValue"in n?6:"referenceValue"in n?7:"geoPointValue"in n?8:"arrayValue"in n?9:"mapValue"in n?su(n)?4:kd(n)?9007199254740991:Cd(n)?10:11:q()}function tt(n,e){if(n===e)return!0;let t=Jt(n);if(t!==Jt(e))return!1;switch(t){case 0:case 9007199254740991:return!0;case 1:return n.booleanValue===e.booleanValue;case 4:return kr(n).isEqual(kr(e));case 3:return function(i,s){if(typeof i.timestampValue=="string"&&typeof s.timestampValue=="string"&&i.timestampValue.length===s.timestampValue.length)return i.timestampValue===s.timestampValue;let a=gt(i.timestampValue),c=gt(s.timestampValue);return a.seconds===c.seconds&&a.nanos===c.nanos}(n,e);case 5:return n.stringValue===e.stringValue;case 6:return function(i,s){return kt(i.bytesValue).isEqual(kt(s.bytesValue))}(n,e);case 7:return n.referenceValue===e.referenceValue;case 8:return function(i,s){return ne(i.geoPointValue.latitude)===ne(s.geoPointValue.latitude)&&ne(i.geoPointValue.longitude)===ne(s.geoPointValue.longitude)}(n,e);case 2:return function(i,s){if("integerValue"in i&&"integerValue"in s)return ne(i.integerValue)===ne(s.integerValue);if("doubleValue"in i&&"doubleValue"in s){let a=ne(i.doubleValue),c=ne(s.doubleValue);return a===c?Cr(a)===Cr(c):isNaN(a)&&isNaN(c)}return!1}(n,e);case 9:return Cn(n.arrayValue.values||[],e.arrayValue.values||[],tt);case 10:case 11:return function(i,s){let a=i.mapValue.fields||{},c=s.mapValue.fields||{};if(Qh(a)!==Qh(c))return!1;for(let l in a)if(a.hasOwnProperty(l)&&(c[l]===void 0||!tt(a[l],c[l])))return!1;return!0}(n,e);default:return q()}}function Nr(n,e){return(n.values||[]).find(t=>tt(t,e))!==void 0}function kn(n,e){if(n===e)return 0;let t=Jt(n),r=Jt(e);if(t!==r)return J(t,r);switch(t){case 0:case 9007199254740991:return 0;case 1:return J(n.booleanValue,e.booleanValue);case 2:return function(s,a){let c=ne(s.integerValue||s.doubleValue),l=ne(a.integerValue||a.doubleValue);return c<l?-1:c>l?1:c===l?0:isNaN(c)?isNaN(l)?0:-1:1}(n,e);case 3:return Jh(n.timestampValue,e.timestampValue);case 4:return Jh(kr(n),kr(e));case 5:return J(n.stringValue,e.stringValue);case 6:return function(s,a){let c=kt(s),l=kt(a);return c.compareTo(l)}(n.bytesValue,e.bytesValue);case 7:return function(s,a){let c=s.split("/"),l=a.split("/");for(let d=0;d<c.length&&d<l.length;d++){let p=J(c[d],l[d]);if(p!==0)return p}return J(c.length,l.length)}(n.referenceValue,e.referenceValue);case 8:return function(s,a){let c=J(ne(s.latitude),ne(a.latitude));return c!==0?c:J(ne(s.longitude),ne(a.longitude))}(n.geoPointValue,e.geoPointValue);case 9:return Yh(n.arrayValue,e.arrayValue);case 10:return function(s,a){var c,l,d,p;let g=s.fields||{},v=a.fields||{},w=(c=g.value)===null||c===void 0?void 0:c.arrayValue,R=(l=v.value)===null||l===void 0?void 0:l.arrayValue,D=J(((d=w==null?void 0:w.values)===null||d===void 0?void 0:d.length)||0,((p=R==null?void 0:R.values)===null||p===void 0?void 0:p.length)||0);return D!==0?D:Yh(w,R)}(n.mapValue,e.mapValue);case 11:return function(s,a){if(s===Ki.mapValue&&a===Ki.mapValue)return 0;if(s===Ki.mapValue)return 1;if(a===Ki.mapValue)return-1;let c=s.fields||{},l=Object.keys(c),d=a.fields||{},p=Object.keys(d);l.sort(),p.sort();for(let g=0;g<l.length&&g<p.length;++g){let v=J(l[g],p[g]);if(v!==0)return v;let w=kn(c[l[g]],d[p[g]]);if(w!==0)return w}return J(l.length,p.length)}(n.mapValue,e.mapValue);default:throw q()}}function Jh(n,e){if(typeof n=="string"&&typeof e=="string"&&n.length===e.length)return J(n,e);let t=gt(n),r=gt(e),i=J(t.seconds,r.seconds);return i!==0?i:J(t.nanos,r.nanos)}function Yh(n,e){let t=n.values||[],r=e.values||[];for(let i=0;i<t.length&&i<r.length;++i){let s=kn(t[i],r[i]);if(s)return s}return J(t.length,r.length)}function Nn(n){return Ma(n)}function Ma(n){return"nullValue"in n?"null":"booleanValue"in n?""+n.booleanValue:"integerValue"in n?""+n.integerValue:"doubleValue"in n?""+n.doubleValue:"timestampValue"in n?function(t){let r=gt(t);return`time(${r.seconds},${r.nanos})`}(n.timestampValue):"stringValue"in n?n.stringValue:"bytesValue"in n?function(t){return kt(t).toBase64()}(n.bytesValue):"referenceValue"in n?function(t){return M.fromName(t).toString()}(n.referenceValue):"geoPointValue"in n?function(t){return`geo(${t.latitude},${t.longitude})`}(n.geoPointValue):"arrayValue"in n?function(t){let r="[",i=!0;for(let s of t.values||[])i?i=!1:r+=",",r+=Ma(s);return r+"]"}(n.arrayValue):"mapValue"in n?function(t){let r=Object.keys(t.fields||{}).sort(),i="{",s=!0;for(let a of r)s?s=!1:i+=",",i+=`${a}:${Ma(t.fields[a])}`;return i+"}"}(n.mapValue):q()}function Xh(n,e){return{referenceValue:`projects/${n.projectId}/databases/${n.database}/documents/${e.path.canonicalString()}`}}function Fa(n){return!!n&&"integerValue"in n}function au(n){return!!n&&"arrayValue"in n}function Zh(n){return!!n&&"nullValue"in n}function ed(n){return!!n&&"doubleValue"in n&&isNaN(Number(n.doubleValue))}function Wi(n){return!!n&&"mapValue"in n}function Cd(n){var e,t;return((t=(((e=n==null?void 0:n.mapValue)===null||e===void 0?void 0:e.fields)||{}).__type__)===null||t===void 0?void 0:t.stringValue)==="__vector__"}function br(n){if(n.geoPointValue)return{geoPointValue:Object.assign({},n.geoPointValue)};if(n.timestampValue&&typeof n.timestampValue=="object")return{timestampValue:Object.assign({},n.timestampValue)};if(n.mapValue){let e={mapValue:{fields:{}}};return nn(n.mapValue.fields,(t,r)=>e.mapValue.fields[t]=br(r)),e}if(n.arrayValue){let e={arrayValue:{values:[]}};for(let t=0;t<(n.arrayValue.values||[]).length;++t)e.arrayValue.values[t]=br(n.arrayValue.values[t]);return e}return Object.assign({},n)}function kd(n){return(((n.mapValue||{}).fields||{}).__type__||{}).stringValue==="__max__"}var Me=class n{constructor(e){this.value=e}static empty(){return new n({mapValue:{}})}field(e){if(e.isEmpty())return this.value;{let t=this.value;for(let r=0;r<e.length-1;++r)if(t=(t.mapValue.fields||{})[e.get(r)],!Wi(t))return null;return t=(t.mapValue.fields||{})[e.lastSegment()],t||null}}set(e,t){this.getFieldsMap(e.popLast())[e.lastSegment()]=br(t)}setAll(e){let t=Fe.emptyPath(),r={},i=[];e.forEach((a,c)=>{if(!t.isImmediateParentOf(c)){let l=this.getFieldsMap(t);this.applyChanges(l,r,i),r={},i=[],t=c.popLast()}a?r[c.lastSegment()]=br(a):i.push(c.lastSegment())});let s=this.getFieldsMap(t);this.applyChanges(s,r,i)}delete(e){let t=this.field(e.popLast());Wi(t)&&t.mapValue.fields&&delete t.mapValue.fields[e.lastSegment()]}isEqual(e){return tt(this.value,e.value)}getFieldsMap(e){let t=this.value;t.mapValue.fields||(t.mapValue={fields:{}});for(let r=0;r<e.length;++r){let i=t.mapValue.fields[e.get(r)];Wi(i)&&i.mapValue.fields||(i={mapValue:{fields:{}}},t.mapValue.fields[e.get(r)]=i),t=i}return t.mapValue.fields}applyChanges(e,t,r){nn(t,(i,s)=>e[i]=s);for(let i of r)delete e[i]}clone(){return new n(br(this.value))}};function Nd(n){let e=[];return nn(n.fields,(t,r)=>{let i=new Fe([t]);if(Wi(r)){let s=Nd(r.mapValue).fields;if(s.length===0)e.push(i);else for(let a of s)e.push(i.child(a))}else e.push(i)}),new qe(e)}var ze=class n{constructor(e,t,r,i,s,a,c){this.key=e,this.documentType=t,this.version=r,this.readTime=i,this.createTime=s,this.data=a,this.documentState=c}static newInvalidDocument(e){return new n(e,0,G.min(),G.min(),G.min(),Me.empty(),0)}static newFoundDocument(e,t,r,i){return new n(e,1,t,G.min(),r,i,0)}static newNoDocument(e,t){return new n(e,2,t,G.min(),G.min(),Me.empty(),0)}static newUnknownDocument(e,t){return new n(e,3,t,G.min(),G.min(),Me.empty(),2)}convertToFoundDocument(e,t){return!this.createTime.isEqual(G.min())||this.documentType!==2&&this.documentType!==0||(this.createTime=e),this.version=e,this.documentType=1,this.data=t,this.documentState=0,this}convertToNoDocument(e){return this.version=e,this.documentType=2,this.data=Me.empty(),this.documentState=0,this}convertToUnknownDocument(e){return this.version=e,this.documentType=3,this.data=Me.empty(),this.documentState=2,this}setHasCommittedMutations(){return this.documentState=2,this}setHasLocalMutations(){return this.documentState=1,this.version=G.min(),this}setReadTime(e){return this.readTime=e,this}get hasLocalMutations(){return this.documentState===1}get hasCommittedMutations(){return this.documentState===2}get hasPendingWrites(){return this.hasLocalMutations||this.hasCommittedMutations}isValidDocument(){return this.documentType!==0}isFoundDocument(){return this.documentType===1}isNoDocument(){return this.documentType===2}isUnknownDocument(){return this.documentType===3}isEqual(e){return e instanceof n&&this.key.isEqual(e.key)&&this.version.isEqual(e.version)&&this.documentType===e.documentType&&this.documentState===e.documentState&&this.data.isEqual(e.data)}mutableCopy(){return new n(this.key,this.documentType,this.version,this.readTime,this.createTime,this.data.clone(),this.documentState)}toString(){return`Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`}};var Dn=class{constructor(e,t){this.position=e,this.inclusive=t}};function td(n,e,t){let r=0;for(let i=0;i<n.position.length;i++){let s=e[i],a=n.position[i];if(s.field.isKeyField()?r=M.comparator(M.fromName(a.referenceValue),t.key):r=kn(a,t.data.field(s.field)),s.dir==="desc"&&(r*=-1),r!==0)break}return r}function nd(n,e){if(n===null)return e===null;if(e===null||n.inclusive!==e.inclusive||n.position.length!==e.position.length)return!1;for(let t=0;t<n.position.length;t++)if(!tt(n.position[t],e.position[t]))return!1;return!0}var xn=class{constructor(e,t="asc"){this.field=e,this.dir=t}};function v_(n,e){return n.dir===e.dir&&n.field.isEqual(e.field)}var ns=class{},de=class n extends ns{constructor(e,t,r){super(),this.field=e,this.op=t,this.value=r}static create(e,t,r){return e.isKeyField()?t==="in"||t==="not-in"?this.createKeyFieldInFilter(e,t,r):new qa(e,t,r):t==="array-contains"?new za(e,r):t==="in"?new Ga(e,r):t==="not-in"?new $a(e,r):t==="array-contains-any"?new Ka(e,r):new n(e,t,r)}static createKeyFieldInFilter(e,t,r){return t==="in"?new Ba(e,r):new ja(e,r)}matches(e){let t=e.data.field(this.field);return this.op==="!="?t!==null&&this.matchesComparison(kn(t,this.value)):t!==null&&Jt(this.value)===Jt(t)&&this.matchesComparison(kn(t,this.value))}matchesComparison(e){switch(this.op){case"<":return e<0;case"<=":return e<=0;case"==":return e===0;case"!=":return e!==0;case">":return e>0;case">=":return e>=0;default:return q()}}isInequality(){return["<","<=",">",">=","!=","not-in"].indexOf(this.op)>=0}getFlattenedFilters(){return[this]}getFilters(){return[this]}},Ge=class n extends ns{constructor(e,t){super(),this.filters=e,this.op=t,this.ae=null}static create(e,t){return new n(e,t)}matches(e){return Dd(this)?this.filters.find(t=>!t.matches(e))===void 0:this.filters.find(t=>t.matches(e))!==void 0}getFlattenedFilters(){return this.ae!==null||(this.ae=this.filters.reduce((e,t)=>e.concat(t.getFlattenedFilters()),[])),this.ae}getFilters(){return Object.assign([],this.filters)}};function Dd(n){return n.op==="and"}function xd(n){return I_(n)&&Dd(n)}function I_(n){for(let e of n.filters)if(e instanceof Ge)return!1;return!0}function Ua(n){if(n instanceof de)return n.field.canonicalString()+n.op.toString()+Nn(n.value);if(xd(n))return n.filters.map(e=>Ua(e)).join(",");{let e=n.filters.map(t=>Ua(t)).join(",");return`${n.op}(${e})`}}function Od(n,e){return n instanceof de?function(r,i){return i instanceof de&&r.op===i.op&&r.field.isEqual(i.field)&&tt(r.value,i.value)}(n,e):n instanceof Ge?function(r,i){return i instanceof Ge&&r.op===i.op&&r.filters.length===i.filters.length?r.filters.reduce((s,a,c)=>s&&Od(a,i.filters[c]),!0):!1}(n,e):void q()}function Vd(n){return n instanceof de?function(t){return`${t.field.canonicalString()} ${t.op} ${Nn(t.value)}`}(n):n instanceof Ge?function(t){return t.op.toString()+" {"+t.getFilters().map(Vd).join(" ,")+"}"}(n):"Filter"}var qa=class extends de{constructor(e,t,r){super(e,t,r),this.key=M.fromName(r.referenceValue)}matches(e){let t=M.comparator(e.key,this.key);return this.matchesComparison(t)}},Ba=class extends de{constructor(e,t){super(e,"in",t),this.keys=Ld("in",t)}matches(e){return this.keys.some(t=>t.isEqual(e.key))}},ja=class extends de{constructor(e,t){super(e,"not-in",t),this.keys=Ld("not-in",t)}matches(e){return!this.keys.some(t=>t.isEqual(e.key))}};function Ld(n,e){var t;return(((t=e.arrayValue)===null||t===void 0?void 0:t.values)||[]).map(r=>M.fromName(r.referenceValue))}var za=class extends de{constructor(e,t){super(e,"array-contains",t)}matches(e){let t=e.data.field(this.field);return au(t)&&Nr(t.arrayValue,this.value)}},Ga=class extends de{constructor(e,t){super(e,"in",t)}matches(e){let t=e.data.field(this.field);return t!==null&&Nr(this.value.arrayValue,t)}},$a=class extends de{constructor(e,t){super(e,"not-in",t)}matches(e){if(Nr(this.value.arrayValue,{nullValue:"NULL_VALUE"}))return!1;let t=e.data.field(this.field);return t!==null&&!Nr(this.value.arrayValue,t)}},Ka=class extends de{constructor(e,t){super(e,"array-contains-any",t)}matches(e){let t=e.data.field(this.field);return!(!au(t)||!t.arrayValue.values)&&t.arrayValue.values.some(r=>Nr(this.value.arrayValue,r))}};var Ha=class{constructor(e,t=null,r=[],i=[],s=null,a=null,c=null){this.path=e,this.collectionGroup=t,this.orderBy=r,this.filters=i,this.limit=s,this.startAt=a,this.endAt=c,this.ue=null}};function rd(n,e=null,t=[],r=[],i=null,s=null,a=null){return new Ha(n,e,t,r,i,s,a)}function cu(n){let e=j(n);if(e.ue===null){let t=e.path.canonicalString();e.collectionGroup!==null&&(t+="|cg:"+e.collectionGroup),t+="|f:",t+=e.filters.map(r=>Ua(r)).join(","),t+="|ob:",t+=e.orderBy.map(r=>function(s){return s.field.canonicalString()+s.dir}(r)).join(","),Ps(e.limit)||(t+="|l:",t+=e.limit),e.startAt&&(t+="|lb:",t+=e.startAt.inclusive?"b:":"a:",t+=e.startAt.position.map(r=>Nn(r)).join(",")),e.endAt&&(t+="|ub:",t+=e.endAt.inclusive?"a:":"b:",t+=e.endAt.position.map(r=>Nn(r)).join(",")),e.ue=t}return e.ue}function uu(n,e){if(n.limit!==e.limit||n.orderBy.length!==e.orderBy.length)return!1;for(let t=0;t<n.orderBy.length;t++)if(!v_(n.orderBy[t],e.orderBy[t]))return!1;if(n.filters.length!==e.filters.length)return!1;for(let t=0;t<n.filters.length;t++)if(!Od(n.filters[t],e.filters[t]))return!1;return n.collectionGroup===e.collectionGroup&&!!n.path.isEqual(e.path)&&!!nd(n.startAt,e.startAt)&&nd(n.endAt,e.endAt)}function Wa(n){return M.isDocumentKey(n.path)&&n.collectionGroup===null&&n.filters.length===0}var Yt=class{constructor(e,t=null,r=[],i=[],s=null,a="F",c=null,l=null){this.path=e,this.collectionGroup=t,this.explicitOrderBy=r,this.filters=i,this.limit=s,this.limitType=a,this.startAt=c,this.endAt=l,this.ce=null,this.le=null,this.he=null,this.startAt,this.endAt}};function w_(n,e,t,r,i,s,a,c){return new Yt(n,e,t,r,i,s,a,c)}function Cs(n){return new Yt(n)}function id(n){return n.filters.length===0&&n.limit===null&&n.startAt==null&&n.endAt==null&&(n.explicitOrderBy.length===0||n.explicitOrderBy.length===1&&n.explicitOrderBy[0].field.isKeyField())}function Md(n){return n.collectionGroup!==null}function Ar(n){let e=j(n);if(e.ce===null){e.ce=[];let t=new Set;for(let s of e.explicitOrderBy)e.ce.push(s),t.add(s.field.canonicalString());let r=e.explicitOrderBy.length>0?e.explicitOrderBy[e.explicitOrderBy.length-1].dir:"asc";(function(a){let c=new Se(Fe.comparator);return a.filters.forEach(l=>{l.getFlattenedFilters().forEach(d=>{d.isInequality()&&(c=c.add(d.field))})}),c})(e).forEach(s=>{t.has(s.canonicalString())||s.isKeyField()||e.ce.push(new xn(s,r))}),t.has(Fe.keyField().canonicalString())||e.ce.push(new xn(Fe.keyField(),r))}return e.ce}function Ze(n){let e=j(n);return e.le||(e.le=E_(e,Ar(n))),e.le}function E_(n,e){if(n.limitType==="F")return rd(n.path,n.collectionGroup,e,n.filters,n.limit,n.startAt,n.endAt);{e=e.map(i=>{let s=i.dir==="desc"?"asc":"desc";return new xn(i.field,s)});let t=n.endAt?new Dn(n.endAt.position,n.endAt.inclusive):null,r=n.startAt?new Dn(n.startAt.position,n.startAt.inclusive):null;return rd(n.path,n.collectionGroup,e,n.filters,n.limit,t,r)}}function Qa(n,e){let t=n.filters.concat([e]);return new Yt(n.path,n.collectionGroup,n.explicitOrderBy.slice(),t,n.limit,n.limitType,n.startAt,n.endAt)}function Ja(n,e,t){return new Yt(n.path,n.collectionGroup,n.explicitOrderBy.slice(),n.filters.slice(),e,t,n.startAt,n.endAt)}function ks(n,e){return uu(Ze(n),Ze(e))&&n.limitType===e.limitType}function Fd(n){return`${cu(Ze(n))}|lt:${n.limitType}`}function En(n){return`Query(target=${function(t){let r=t.path.canonicalString();return t.collectionGroup!==null&&(r+=" collectionGroup="+t.collectionGroup),t.filters.length>0&&(r+=`, filters: [${t.filters.map(i=>Vd(i)).join(", ")}]`),Ps(t.limit)||(r+=", limit: "+t.limit),t.orderBy.length>0&&(r+=`, orderBy: [${t.orderBy.map(i=>function(a){return`${a.field.canonicalString()} (${a.dir})`}(i)).join(", ")}]`),t.startAt&&(r+=", startAt: ",r+=t.startAt.inclusive?"b:":"a:",r+=t.startAt.position.map(i=>Nn(i)).join(",")),t.endAt&&(r+=", endAt: ",r+=t.endAt.inclusive?"a:":"b:",r+=t.endAt.position.map(i=>Nn(i)).join(",")),`Target(${r})`}(Ze(n))}; limitType=${n.limitType})`}function Ns(n,e){return e.isFoundDocument()&&function(r,i){let s=i.key.path;return r.collectionGroup!==null?i.key.hasCollectionId(r.collectionGroup)&&r.path.isPrefixOf(s):M.isDocumentKey(r.path)?r.path.isEqual(s):r.path.isImmediateParentOf(s)}(n,e)&&function(r,i){for(let s of Ar(r))if(!s.field.isKeyField()&&i.data.field(s.field)===null)return!1;return!0}(n,e)&&function(r,i){for(let s of r.filters)if(!s.matches(i))return!1;return!0}(n,e)&&function(r,i){return!(r.startAt&&!function(a,c,l){let d=td(a,c,l);return a.inclusive?d<=0:d<0}(r.startAt,Ar(r),i)||r.endAt&&!function(a,c,l){let d=td(a,c,l);return a.inclusive?d>=0:d>0}(r.endAt,Ar(r),i))}(n,e)}function T_(n){return n.collectionGroup||(n.path.length%2==1?n.path.lastSegment():n.path.get(n.path.length-2))}function Ud(n){return(e,t)=>{let r=!1;for(let i of Ar(n)){let s=b_(i,e,t);if(s!==0)return s;r=r||i.field.isKeyField()}return 0}}function b_(n,e,t){let r=n.field.isKeyField()?M.comparator(e.key,t.key):function(s,a,c){let l=a.data.field(s),d=c.data.field(s);return l!==null&&d!==null?kn(l,d):q()}(n.field,e,t);switch(n.dir){case"asc":return r;case"desc":return-1*r;default:return q()}}var Nt=class{constructor(e,t){this.mapKeyFn=e,this.equalsFn=t,this.inner={},this.innerSize=0}get(e){let t=this.mapKeyFn(e),r=this.inner[t];if(r!==void 0){for(let[i,s]of r)if(this.equalsFn(i,e))return s}}has(e){return this.get(e)!==void 0}set(e,t){let r=this.mapKeyFn(e),i=this.inner[r];if(i===void 0)return this.inner[r]=[[e,t]],void this.innerSize++;for(let s=0;s<i.length;s++)if(this.equalsFn(i[s][0],e))return void(i[s]=[e,t]);i.push([e,t]),this.innerSize++}delete(e){let t=this.mapKeyFn(e),r=this.inner[t];if(r===void 0)return!1;for(let i=0;i<r.length;i++)if(this.equalsFn(r[i][0],e))return r.length===1?delete this.inner[t]:r.splice(i,1),this.innerSize--,!0;return!1}forEach(e){nn(this.inner,(t,r)=>{for(let[i,s]of r)e(i,s)})}isEmpty(){return Pd(this.inner)}size(){return this.innerSize}};var A_=new ae(M.comparator);function _t(){return A_}var qd=new ae(M.comparator);function Tr(...n){let e=qd;for(let t of n)e=e.insert(t.key,t);return e}function Bd(n){let e=qd;return n.forEach((t,r)=>e=e.insert(t,r.overlayedDocument)),e}function $t(){return Sr()}function jd(){return Sr()}function Sr(){return new Nt(n=>n.toString(),(n,e)=>n.isEqual(e))}var S_=new ae(M.comparator),R_=new Se(M.comparator);function H(...n){let e=R_;for(let t of n)e=e.add(t);return e}var P_=new Se(J);function C_(){return P_}function lu(n,e){if(n.useProto3Json){if(isNaN(e))return{doubleValue:"NaN"};if(e===1/0)return{doubleValue:"Infinity"};if(e===-1/0)return{doubleValue:"-Infinity"}}return{doubleValue:Cr(e)?"-0":e}}function zd(n){return{integerValue:""+n}}function k_(n,e){return f_(e)?zd(e):lu(n,e)}var On=class{constructor(){this._=void 0}};function N_(n,e,t){return n instanceof Vn?function(i,s){let a={fields:{__type__:{stringValue:"server_timestamp"},__local_write_time__:{timestampValue:{seconds:i.seconds,nanos:i.nanoseconds}}}};return s&&su(s)&&(s=ou(s)),s&&(a.fields.__previous_value__=s),{mapValue:a}}(t,e):n instanceof Xt?$d(n,e):n instanceof Zt?Kd(n,e):function(i,s){let a=Gd(i,s),c=sd(a)+sd(i.Pe);return Fa(a)&&Fa(i.Pe)?zd(c):lu(i.serializer,c)}(n,e)}function D_(n,e,t){return n instanceof Xt?$d(n,e):n instanceof Zt?Kd(n,e):t}function Gd(n,e){return n instanceof Ln?function(r){return Fa(r)||function(s){return!!s&&"doubleValue"in s}(r)}(e)?e:{integerValue:0}:null}var Vn=class extends On{},Xt=class extends On{constructor(e){super(),this.elements=e}};function $d(n,e){let t=Hd(e);for(let r of n.elements)t.some(i=>tt(i,r))||t.push(r);return{arrayValue:{values:t}}}var Zt=class extends On{constructor(e){super(),this.elements=e}};function Kd(n,e){let t=Hd(e);for(let r of n.elements)t=t.filter(i=>!tt(i,r));return{arrayValue:{values:t}}}var Ln=class extends On{constructor(e,t){super(),this.serializer=e,this.Pe=t}};function sd(n){return ne(n.integerValue||n.doubleValue)}function Hd(n){return au(n)&&n.arrayValue.values?n.arrayValue.values.slice():[]}function x_(n,e){return n.field.isEqual(e.field)&&function(r,i){return r instanceof Xt&&i instanceof Xt||r instanceof Zt&&i instanceof Zt?Cn(r.elements,i.elements,tt):r instanceof Ln&&i instanceof Ln?tt(r.Pe,i.Pe):r instanceof Vn&&i instanceof Vn}(n.transform,e.transform)}var Ya=class{constructor(e,t){this.version=e,this.transformResults=t}},pt=class n{constructor(e,t){this.updateTime=e,this.exists=t}static none(){return new n}static exists(e){return new n(void 0,e)}static updateTime(e){return new n(e)}get isNone(){return this.updateTime===void 0&&this.exists===void 0}isEqual(e){return this.exists===e.exists&&(this.updateTime?!!e.updateTime&&this.updateTime.isEqual(e.updateTime):!e.updateTime)}};function Qi(n,e){return n.updateTime!==void 0?e.isFoundDocument()&&e.version.isEqual(n.updateTime):n.exists===void 0||n.exists===e.isFoundDocument()}var Mn=class{};function Wd(n,e){if(!n.hasLocalMutations||e&&e.fields.length===0)return null;if(e===null)return n.isNoDocument()?new Dr(n.key,pt.none()):new en(n.key,n.data,pt.none());{let t=n.data,r=Me.empty(),i=new Se(Fe.comparator);for(let s of e.fields)if(!i.has(s)){let a=t.field(s);a===null&&s.length>1&&(s=s.popLast(),a=t.field(s)),a===null?r.delete(s):r.set(s,a),i=i.add(s)}return new nt(n.key,r,new qe(i.toArray()),pt.none())}}function O_(n,e,t){n instanceof en?function(i,s,a){let c=i.value.clone(),l=ad(i.fieldTransforms,s,a.transformResults);c.setAll(l),s.convertToFoundDocument(a.version,c).setHasCommittedMutations()}(n,e,t):n instanceof nt?function(i,s,a){if(!Qi(i.precondition,s))return void s.convertToUnknownDocument(a.version);let c=ad(i.fieldTransforms,s,a.transformResults),l=s.data;l.setAll(Qd(i)),l.setAll(c),s.convertToFoundDocument(a.version,l).setHasCommittedMutations()}(n,e,t):function(i,s,a){s.convertToNoDocument(a.version).setHasCommittedMutations()}(0,e,t)}function Rr(n,e,t,r){return n instanceof en?function(s,a,c,l){if(!Qi(s.precondition,a))return c;let d=s.value.clone(),p=cd(s.fieldTransforms,l,a);return d.setAll(p),a.convertToFoundDocument(a.version,d).setHasLocalMutations(),null}(n,e,t,r):n instanceof nt?function(s,a,c,l){if(!Qi(s.precondition,a))return c;let d=cd(s.fieldTransforms,l,a),p=a.data;return p.setAll(Qd(s)),p.setAll(d),a.convertToFoundDocument(a.version,p).setHasLocalMutations(),c===null?null:c.unionWith(s.fieldMask.fields).unionWith(s.fieldTransforms.map(g=>g.field))}(n,e,t,r):function(s,a,c){return Qi(s.precondition,a)?(a.convertToNoDocument(a.version).setHasLocalMutations(),null):c}(n,e,t)}function V_(n,e){let t=null;for(let r of n.fieldTransforms){let i=e.data.field(r.field),s=Gd(r.transform,i||null);s!=null&&(t===null&&(t=Me.empty()),t.set(r.field,s))}return t||null}function od(n,e){return n.type===e.type&&!!n.key.isEqual(e.key)&&!!n.precondition.isEqual(e.precondition)&&!!function(r,i){return r===void 0&&i===void 0||!(!r||!i)&&Cn(r,i,(s,a)=>x_(s,a))}(n.fieldTransforms,e.fieldTransforms)&&(n.type===0?n.value.isEqual(e.value):n.type!==1||n.data.isEqual(e.data)&&n.fieldMask.isEqual(e.fieldMask))}var en=class extends Mn{constructor(e,t,r,i=[]){super(),this.key=e,this.value=t,this.precondition=r,this.fieldTransforms=i,this.type=0}getFieldMask(){return null}},nt=class extends Mn{constructor(e,t,r,i,s=[]){super(),this.key=e,this.data=t,this.fieldMask=r,this.precondition=i,this.fieldTransforms=s,this.type=1}getFieldMask(){return this.fieldMask}};function Qd(n){let e=new Map;return n.fieldMask.fields.forEach(t=>{if(!t.isEmpty()){let r=n.data.field(t);e.set(t,r)}}),e}function ad(n,e,t){let r=new Map;Y(n.length===t.length);for(let i=0;i<t.length;i++){let s=n[i],a=s.transform,c=e.data.field(s.field);r.set(s.field,D_(a,c,t[i]))}return r}function cd(n,e,t){let r=new Map;for(let i of n){let s=i.transform,a=t.data.field(i.field);r.set(i.field,N_(s,a,e))}return r}var Dr=class extends Mn{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=2,this.fieldTransforms=[]}getFieldMask(){return null}},Xa=class extends Mn{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=3,this.fieldTransforms=[]}getFieldMask(){return null}};var Za=class{constructor(e,t,r,i){this.batchId=e,this.localWriteTime=t,this.baseMutations=r,this.mutations=i}applyToRemoteDocument(e,t){let r=t.mutationResults;for(let i=0;i<this.mutations.length;i++){let s=this.mutations[i];s.key.isEqual(e.key)&&O_(s,e,r[i])}}applyToLocalView(e,t){for(let r of this.baseMutations)r.key.isEqual(e.key)&&(t=Rr(r,e,t,this.localWriteTime));for(let r of this.mutations)r.key.isEqual(e.key)&&(t=Rr(r,e,t,this.localWriteTime));return t}applyToLocalDocumentSet(e,t){let r=jd();return this.mutations.forEach(i=>{let s=e.get(i.key),a=s.overlayedDocument,c=this.applyToLocalView(a,s.mutatedFields);c=t.has(i.key)?null:c;let l=Wd(a,c);l!==null&&r.set(i.key,l),a.isValidDocument()||a.convertToNoDocument(G.min())}),r}keys(){return this.mutations.reduce((e,t)=>e.add(t.key),H())}isEqual(e){return this.batchId===e.batchId&&Cn(this.mutations,e.mutations,(t,r)=>od(t,r))&&Cn(this.baseMutations,e.baseMutations,(t,r)=>od(t,r))}},ec=class n{constructor(e,t,r,i){this.batch=e,this.commitVersion=t,this.mutationResults=r,this.docVersions=i}static from(e,t,r){Y(e.mutations.length===r.length);let i=function(){return S_}(),s=e.mutations;for(let a=0;a<s.length;a++)i=i.insert(s[a].key,r[a].version);return new n(e,t,r,i)}};var tc=class{constructor(e,t){this.largestBatchId=e,this.mutation=t}getKey(){return this.mutation.key}isEqual(e){return e!==null&&this.mutation===e.mutation}toString(){return`Overlay{
      largestBatchId: ${this.largestBatchId},
      mutation: ${this.mutation.toString()}
    }`}};var nc=class{constructor(e,t){this.count=e,this.unchangedNames=t}};var le,W;function L_(n){switch(n){default:return q();case P.CANCELLED:case P.UNKNOWN:case P.DEADLINE_EXCEEDED:case P.RESOURCE_EXHAUSTED:case P.INTERNAL:case P.UNAVAILABLE:case P.UNAUTHENTICATED:return!1;case P.INVALID_ARGUMENT:case P.NOT_FOUND:case P.ALREADY_EXISTS:case P.PERMISSION_DENIED:case P.FAILED_PRECONDITION:case P.ABORTED:case P.OUT_OF_RANGE:case P.UNIMPLEMENTED:case P.DATA_LOSS:return!0}}function Jd(n){if(n===void 0)return mt("GRPC error has no .code"),P.UNKNOWN;switch(n){case le.OK:return P.OK;case le.CANCELLED:return P.CANCELLED;case le.UNKNOWN:return P.UNKNOWN;case le.DEADLINE_EXCEEDED:return P.DEADLINE_EXCEEDED;case le.RESOURCE_EXHAUSTED:return P.RESOURCE_EXHAUSTED;case le.INTERNAL:return P.INTERNAL;case le.UNAVAILABLE:return P.UNAVAILABLE;case le.UNAUTHENTICATED:return P.UNAUTHENTICATED;case le.INVALID_ARGUMENT:return P.INVALID_ARGUMENT;case le.NOT_FOUND:return P.NOT_FOUND;case le.ALREADY_EXISTS:return P.ALREADY_EXISTS;case le.PERMISSION_DENIED:return P.PERMISSION_DENIED;case le.FAILED_PRECONDITION:return P.FAILED_PRECONDITION;case le.ABORTED:return P.ABORTED;case le.OUT_OF_RANGE:return P.OUT_OF_RANGE;case le.UNIMPLEMENTED:return P.UNIMPLEMENTED;case le.DATA_LOSS:return P.DATA_LOSS;default:return q()}}(W=le||(le={}))[W.OK=0]="OK",W[W.CANCELLED=1]="CANCELLED",W[W.UNKNOWN=2]="UNKNOWN",W[W.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",W[W.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",W[W.NOT_FOUND=5]="NOT_FOUND",W[W.ALREADY_EXISTS=6]="ALREADY_EXISTS",W[W.PERMISSION_DENIED=7]="PERMISSION_DENIED",W[W.UNAUTHENTICATED=16]="UNAUTHENTICATED",W[W.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",W[W.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",W[W.ABORTED=10]="ABORTED",W[W.OUT_OF_RANGE=11]="OUT_OF_RANGE",W[W.UNIMPLEMENTED=12]="UNIMPLEMENTED",W[W.INTERNAL=13]="INTERNAL",W[W.UNAVAILABLE=14]="UNAVAILABLE",W[W.DATA_LOSS=15]="DATA_LOSS";var ud=null;function M_(){return new TextEncoder}var F_=new Pt([4294967295,4294967295],0);function ld(n){let e=M_().encode(n),t=new _a;return t.update(e),new Uint8Array(t.digest())}function hd(n){let e=new DataView(n.buffer),t=e.getUint32(0,!0),r=e.getUint32(4,!0),i=e.getUint32(8,!0),s=e.getUint32(12,!0);return[new Pt([t,r],0),new Pt([i,s],0)]}var rc=class n{constructor(e,t,r){if(this.bitmap=e,this.padding=t,this.hashCount=r,t<0||t>=8)throw new Kt(`Invalid padding: ${t}`);if(r<0)throw new Kt(`Invalid hash count: ${r}`);if(e.length>0&&this.hashCount===0)throw new Kt(`Invalid hash count: ${r}`);if(e.length===0&&t!==0)throw new Kt(`Invalid padding when bitmap length is 0: ${t}`);this.Ie=8*e.length-t,this.Te=Pt.fromNumber(this.Ie)}Ee(e,t,r){let i=e.add(t.multiply(Pt.fromNumber(r)));return i.compare(F_)===1&&(i=new Pt([i.getBits(0),i.getBits(1)],0)),i.modulo(this.Te).toNumber()}de(e){return(this.bitmap[Math.floor(e/8)]&1<<e%8)!=0}mightContain(e){if(this.Ie===0)return!1;let t=ld(e),[r,i]=hd(t);for(let s=0;s<this.hashCount;s++){let a=this.Ee(r,i,s);if(!this.de(a))return!1}return!0}static create(e,t,r){let i=e%8==0?0:8-e%8,s=new Uint8Array(Math.ceil(e/8)),a=new n(s,i,t);return r.forEach(c=>a.insert(c)),a}insert(e){if(this.Ie===0)return;let t=ld(e),[r,i]=hd(t);for(let s=0;s<this.hashCount;s++){let a=this.Ee(r,i,s);this.Ae(a)}}Ae(e){let t=Math.floor(e/8),r=e%8;this.bitmap[t]|=1<<r}},Kt=class extends Error{constructor(){super(...arguments),this.name="BloomFilterError"}};var rs=class n{constructor(e,t,r,i,s){this.snapshotVersion=e,this.targetChanges=t,this.targetMismatches=r,this.documentUpdates=i,this.resolvedLimboDocuments=s}static createSynthesizedRemoteEventForCurrentChange(e,t,r){let i=new Map;return i.set(e,xr.createSynthesizedTargetChangeForCurrentChange(e,t,r)),new n(G.min(),i,new ae(J),_t(),H())}},xr=class n{constructor(e,t,r,i,s){this.resumeToken=e,this.current=t,this.addedDocuments=r,this.modifiedDocuments=i,this.removedDocuments=s}static createSynthesizedTargetChangeForCurrentChange(e,t,r){return new n(r,t,H(),H(),H())}};var Sn=class{constructor(e,t,r,i){this.Re=e,this.removedTargetIds=t,this.key=r,this.Ve=i}},is=class{constructor(e,t){this.targetId=e,this.me=t}},ss=class{constructor(e,t,r=Pe.EMPTY_BYTE_STRING,i=null){this.state=e,this.targetIds=t,this.resumeToken=r,this.cause=i}},os=class{constructor(){this.fe=0,this.ge=fd(),this.pe=Pe.EMPTY_BYTE_STRING,this.ye=!1,this.we=!0}get current(){return this.ye}get resumeToken(){return this.pe}get Se(){return this.fe!==0}get be(){return this.we}De(e){e.approximateByteSize()>0&&(this.we=!0,this.pe=e)}ve(){let e=H(),t=H(),r=H();return this.ge.forEach((i,s)=>{switch(s){case 0:e=e.add(i);break;case 2:t=t.add(i);break;case 1:r=r.add(i);break;default:q()}}),new xr(this.pe,this.ye,e,t,r)}Ce(){this.we=!1,this.ge=fd()}Fe(e,t){this.we=!0,this.ge=this.ge.insert(e,t)}Me(e){this.we=!0,this.ge=this.ge.remove(e)}xe(){this.fe+=1}Oe(){this.fe-=1,Y(this.fe>=0)}Ne(){this.we=!0,this.ye=!0}},ic=class{constructor(e){this.Le=e,this.Be=new Map,this.ke=_t(),this.qe=dd(),this.Qe=new ae(J)}Ke(e){for(let t of e.Re)e.Ve&&e.Ve.isFoundDocument()?this.$e(t,e.Ve):this.Ue(t,e.key,e.Ve);for(let t of e.removedTargetIds)this.Ue(t,e.key,e.Ve)}We(e){this.forEachTarget(e,t=>{let r=this.Ge(t);switch(e.state){case 0:this.ze(t)&&r.De(e.resumeToken);break;case 1:r.Oe(),r.Se||r.Ce(),r.De(e.resumeToken);break;case 2:r.Oe(),r.Se||this.removeTarget(t);break;case 3:this.ze(t)&&(r.Ne(),r.De(e.resumeToken));break;case 4:this.ze(t)&&(this.je(t),r.De(e.resumeToken));break;default:q()}})}forEachTarget(e,t){e.targetIds.length>0?e.targetIds.forEach(t):this.Be.forEach((r,i)=>{this.ze(i)&&t(i)})}He(e){let t=e.targetId,r=e.me.count,i=this.Je(t);if(i){let s=i.target;if(Wa(s))if(r===0){let a=new M(s.path);this.Ue(t,a,ze.newNoDocument(a,G.min()))}else Y(r===1);else{let a=this.Ye(t);if(a!==r){let c=this.Ze(e),l=c?this.Xe(c,e,a):1;if(l!==0){this.je(t);let d=l===2?"TargetPurposeExistenceFilterMismatchBloom":"TargetPurposeExistenceFilterMismatch";this.Qe=this.Qe.insert(t,d)}ud==null||ud.et(function(p,g,v,w,R){var D,C,U,B,F,z;let se={localCacheCount:p,existenceFilterCount:g.count,databaseId:v.database,projectId:v.projectId},K=g.unchangedNames;return K&&(se.bloomFilter={applied:R===0,hashCount:(D=K==null?void 0:K.hashCount)!==null&&D!==void 0?D:0,bitmapLength:(B=(U=(C=K==null?void 0:K.bits)===null||C===void 0?void 0:C.bitmap)===null||U===void 0?void 0:U.length)!==null&&B!==void 0?B:0,padding:(z=(F=K==null?void 0:K.bits)===null||F===void 0?void 0:F.padding)!==null&&z!==void 0?z:0,mightContain:E=>{var m;return(m=w==null?void 0:w.mightContain(E))!==null&&m!==void 0&&m}}),se}(a,e.me,this.Le.tt(),c,l))}}}}Ze(e){let t=e.me.unchangedNames;if(!t||!t.bits)return null;let{bits:{bitmap:r="",padding:i=0},hashCount:s=0}=t,a,c;try{a=kt(r).toUint8Array()}catch(l){if(l instanceof es)return Pn("Decoding the base64 bloom filter in existence filter failed ("+l.message+"); ignoring the bloom filter and falling back to full re-query."),null;throw l}try{c=new rc(a,i,s)}catch(l){return Pn(l instanceof Kt?"BloomFilter error: ":"Applying bloom filter failed: ",l),null}return c.Ie===0?null:c}Xe(e,t,r){return t.me.count===r-this.nt(e,t.targetId)?0:2}nt(e,t){let r=this.Le.getRemoteKeysForTarget(t),i=0;return r.forEach(s=>{let a=this.Le.tt(),c=`projects/${a.projectId}/databases/${a.database}/documents/${s.path.canonicalString()}`;e.mightContain(c)||(this.Ue(t,s,null),i++)}),i}rt(e){let t=new Map;this.Be.forEach((s,a)=>{let c=this.Je(a);if(c){if(s.current&&Wa(c.target)){let l=new M(c.target.path);this.ke.get(l)!==null||this.it(a,l)||this.Ue(a,l,ze.newNoDocument(l,e))}s.be&&(t.set(a,s.ve()),s.Ce())}});let r=H();this.qe.forEach((s,a)=>{let c=!0;a.forEachWhile(l=>{let d=this.Je(l);return!d||d.purpose==="TargetPurposeLimboResolution"||(c=!1,!1)}),c&&(r=r.add(s))}),this.ke.forEach((s,a)=>a.setReadTime(e));let i=new rs(e,t,this.Qe,this.ke,r);return this.ke=_t(),this.qe=dd(),this.Qe=new ae(J),i}$e(e,t){if(!this.ze(e))return;let r=this.it(e,t.key)?2:0;this.Ge(e).Fe(t.key,r),this.ke=this.ke.insert(t.key,t),this.qe=this.qe.insert(t.key,this.st(t.key).add(e))}Ue(e,t,r){if(!this.ze(e))return;let i=this.Ge(e);this.it(e,t)?i.Fe(t,1):i.Me(t),this.qe=this.qe.insert(t,this.st(t).delete(e)),r&&(this.ke=this.ke.insert(t,r))}removeTarget(e){this.Be.delete(e)}Ye(e){let t=this.Ge(e).ve();return this.Le.getRemoteKeysForTarget(e).size+t.addedDocuments.size-t.removedDocuments.size}xe(e){this.Ge(e).xe()}Ge(e){let t=this.Be.get(e);return t||(t=new os,this.Be.set(e,t)),t}st(e){let t=this.qe.get(e);return t||(t=new Se(J),this.qe=this.qe.insert(e,t)),t}ze(e){let t=this.Je(e)!==null;return t||V("WatchChangeAggregator","Detected inactive target",e),t}Je(e){let t=this.Be.get(e);return t&&t.Se?null:this.Le.ot(e)}je(e){this.Be.set(e,new os),this.Le.getRemoteKeysForTarget(e).forEach(t=>{this.Ue(e,t,null)})}it(e,t){return this.Le.getRemoteKeysForTarget(e).has(t)}};function dd(){return new ae(M.comparator)}function fd(){return new ae(M.comparator)}var U_={asc:"ASCENDING",desc:"DESCENDING"},q_={"<":"LESS_THAN","<=":"LESS_THAN_OR_EQUAL",">":"GREATER_THAN",">=":"GREATER_THAN_OR_EQUAL","==":"EQUAL","!=":"NOT_EQUAL","array-contains":"ARRAY_CONTAINS",in:"IN","not-in":"NOT_IN","array-contains-any":"ARRAY_CONTAINS_ANY"},B_={and:"AND",or:"OR"},sc=class{constructor(e,t){this.databaseId=e,this.useProto3Json=t}};function oc(n,e){return n.useProto3Json||Ps(e)?e:{value:e}}function as(n,e){return n.useProto3Json?`${new Date(1e3*e.seconds).toISOString().replace(/\.\d*/,"").replace("Z","")}.${("000000000"+e.nanoseconds).slice(-9)}Z`:{seconds:""+e.seconds,nanos:e.nanoseconds}}function Yd(n,e){return n.useProto3Json?e.toBase64():e.toUint8Array()}function j_(n,e){return as(n,e.toTimestamp())}function et(n){return Y(!!n),G.fromTimestamp(function(t){let r=gt(t);return new ye(r.seconds,r.nanos)}(n))}function hu(n,e){return ac(n,e).canonicalString()}function ac(n,e){let t=function(i){return new re(["projects",i.projectId,"databases",i.database])}(n).child("documents");return e===void 0?t:t.child(e)}function Xd(n){let e=re.fromString(n);return Y(rf(e)),e}function cc(n,e){return hu(n.databaseId,e.path)}function Ta(n,e){let t=Xd(e);if(t.get(1)!==n.databaseId.projectId)throw new O(P.INVALID_ARGUMENT,"Tried to deserialize key from different project: "+t.get(1)+" vs "+n.databaseId.projectId);if(t.get(3)!==n.databaseId.database)throw new O(P.INVALID_ARGUMENT,"Tried to deserialize key from different database: "+t.get(3)+" vs "+n.databaseId.database);return new M(ef(t))}function Zd(n,e){return hu(n.databaseId,e)}function z_(n){let e=Xd(n);return e.length===4?re.emptyPath():ef(e)}function uc(n){return new re(["projects",n.databaseId.projectId,"databases",n.databaseId.database]).canonicalString()}function ef(n){return Y(n.length>4&&n.get(4)==="documents"),n.popFirst(5)}function pd(n,e,t){return{name:cc(n,e),fields:t.value.mapValue.fields}}function G_(n,e){let t;if("targetChange"in e){e.targetChange;let r=function(d){return d==="NO_CHANGE"?0:d==="ADD"?1:d==="REMOVE"?2:d==="CURRENT"?3:d==="RESET"?4:q()}(e.targetChange.targetChangeType||"NO_CHANGE"),i=e.targetChange.targetIds||[],s=function(d,p){return d.useProto3Json?(Y(p===void 0||typeof p=="string"),Pe.fromBase64String(p||"")):(Y(p===void 0||p instanceof Buffer||p instanceof Uint8Array),Pe.fromUint8Array(p||new Uint8Array))}(n,e.targetChange.resumeToken),a=e.targetChange.cause,c=a&&function(d){let p=d.code===void 0?P.UNKNOWN:Jd(d.code);return new O(p,d.message||"")}(a);t=new ss(r,i,s,c||null)}else if("documentChange"in e){e.documentChange;let r=e.documentChange;r.document,r.document.name,r.document.updateTime;let i=Ta(n,r.document.name),s=et(r.document.updateTime),a=r.document.createTime?et(r.document.createTime):G.min(),c=new Me({mapValue:{fields:r.document.fields}}),l=ze.newFoundDocument(i,s,a,c),d=r.targetIds||[],p=r.removedTargetIds||[];t=new Sn(d,p,l.key,l)}else if("documentDelete"in e){e.documentDelete;let r=e.documentDelete;r.document;let i=Ta(n,r.document),s=r.readTime?et(r.readTime):G.min(),a=ze.newNoDocument(i,s),c=r.removedTargetIds||[];t=new Sn([],c,a.key,a)}else if("documentRemove"in e){e.documentRemove;let r=e.documentRemove;r.document;let i=Ta(n,r.document),s=r.removedTargetIds||[];t=new Sn([],s,i,null)}else{if(!("filter"in e))return q();{e.filter;let r=e.filter;r.targetId;let{count:i=0,unchangedNames:s}=r,a=new nc(i,s),c=r.targetId;t=new is(c,a)}}return t}function $_(n,e){let t;if(e instanceof en)t={update:pd(n,e.key,e.value)};else if(e instanceof Dr)t={delete:cc(n,e.key)};else if(e instanceof nt)t={update:pd(n,e.key,e.data),updateMask:ey(e.fieldMask)};else{if(!(e instanceof Xa))return q();t={verify:cc(n,e.key)}}return e.fieldTransforms.length>0&&(t.updateTransforms=e.fieldTransforms.map(r=>function(s,a){let c=a.transform;if(c instanceof Vn)return{fieldPath:a.field.canonicalString(),setToServerValue:"REQUEST_TIME"};if(c instanceof Xt)return{fieldPath:a.field.canonicalString(),appendMissingElements:{values:c.elements}};if(c instanceof Zt)return{fieldPath:a.field.canonicalString(),removeAllFromArray:{values:c.elements}};if(c instanceof Ln)return{fieldPath:a.field.canonicalString(),increment:c.Pe};throw q()}(0,r))),e.precondition.isNone||(t.currentDocument=function(i,s){return s.updateTime!==void 0?{updateTime:j_(i,s.updateTime)}:s.exists!==void 0?{exists:s.exists}:q()}(n,e.precondition)),t}function K_(n,e){return n&&n.length>0?(Y(e!==void 0),n.map(t=>function(i,s){let a=i.updateTime?et(i.updateTime):et(s);return a.isEqual(G.min())&&(a=et(s)),new Ya(a,i.transformResults||[])}(t,e))):[]}function H_(n,e){return{documents:[Zd(n,e.path)]}}function W_(n,e){let t={structuredQuery:{}},r=e.path,i;e.collectionGroup!==null?(i=r,t.structuredQuery.from=[{collectionId:e.collectionGroup,allDescendants:!0}]):(i=r.popLast(),t.structuredQuery.from=[{collectionId:r.lastSegment()}]),t.parent=Zd(n,i);let s=function(d){if(d.length!==0)return nf(Ge.create(d,"and"))}(e.filters);s&&(t.structuredQuery.where=s);let a=function(d){if(d.length!==0)return d.map(p=>function(v){return{field:Tn(v.field),direction:Y_(v.dir)}}(p))}(e.orderBy);a&&(t.structuredQuery.orderBy=a);let c=oc(n,e.limit);return c!==null&&(t.structuredQuery.limit=c),e.startAt&&(t.structuredQuery.startAt=function(d){return{before:d.inclusive,values:d.position}}(e.startAt)),e.endAt&&(t.structuredQuery.endAt=function(d){return{before:!d.inclusive,values:d.position}}(e.endAt)),{_t:t,parent:i}}function Q_(n){let e=z_(n.parent),t=n.structuredQuery,r=t.from?t.from.length:0,i=null;if(r>0){Y(r===1);let p=t.from[0];p.allDescendants?i=p.collectionId:e=e.child(p.collectionId)}let s=[];t.where&&(s=function(g){let v=tf(g);return v instanceof Ge&&xd(v)?v.getFilters():[v]}(t.where));let a=[];t.orderBy&&(a=function(g){return g.map(v=>function(R){return new xn(bn(R.field),function(C){switch(C){case"ASCENDING":return"asc";case"DESCENDING":return"desc";default:return}}(R.direction))}(v))}(t.orderBy));let c=null;t.limit&&(c=function(g){let v;return v=typeof g=="object"?g.value:g,Ps(v)?null:v}(t.limit));let l=null;t.startAt&&(l=function(g){let v=!!g.before,w=g.values||[];return new Dn(w,v)}(t.startAt));let d=null;return t.endAt&&(d=function(g){let v=!g.before,w=g.values||[];return new Dn(w,v)}(t.endAt)),w_(e,i,a,s,c,"F",l,d)}function J_(n,e){let t=function(i){switch(i){case"TargetPurposeListen":return null;case"TargetPurposeExistenceFilterMismatch":return"existence-filter-mismatch";case"TargetPurposeExistenceFilterMismatchBloom":return"existence-filter-mismatch-bloom";case"TargetPurposeLimboResolution":return"limbo-document";default:return q()}}(e.purpose);return t==null?null:{"goog-listen-tags":t}}function tf(n){return n.unaryFilter!==void 0?function(t){switch(t.unaryFilter.op){case"IS_NAN":let r=bn(t.unaryFilter.field);return de.create(r,"==",{doubleValue:NaN});case"IS_NULL":let i=bn(t.unaryFilter.field);return de.create(i,"==",{nullValue:"NULL_VALUE"});case"IS_NOT_NAN":let s=bn(t.unaryFilter.field);return de.create(s,"!=",{doubleValue:NaN});case"IS_NOT_NULL":let a=bn(t.unaryFilter.field);return de.create(a,"!=",{nullValue:"NULL_VALUE"});default:return q()}}(n):n.fieldFilter!==void 0?function(t){return de.create(bn(t.fieldFilter.field),function(i){switch(i){case"EQUAL":return"==";case"NOT_EQUAL":return"!=";case"GREATER_THAN":return">";case"GREATER_THAN_OR_EQUAL":return">=";case"LESS_THAN":return"<";case"LESS_THAN_OR_EQUAL":return"<=";case"ARRAY_CONTAINS":return"array-contains";case"IN":return"in";case"NOT_IN":return"not-in";case"ARRAY_CONTAINS_ANY":return"array-contains-any";default:return q()}}(t.fieldFilter.op),t.fieldFilter.value)}(n):n.compositeFilter!==void 0?function(t){return Ge.create(t.compositeFilter.filters.map(r=>tf(r)),function(i){switch(i){case"AND":return"and";case"OR":return"or";default:return q()}}(t.compositeFilter.op))}(n):q()}function Y_(n){return U_[n]}function X_(n){return q_[n]}function Z_(n){return B_[n]}function Tn(n){return{fieldPath:n.canonicalString()}}function bn(n){return Fe.fromServerFormat(n.fieldPath)}function nf(n){return n instanceof de?function(t){if(t.op==="=="){if(ed(t.value))return{unaryFilter:{field:Tn(t.field),op:"IS_NAN"}};if(Zh(t.value))return{unaryFilter:{field:Tn(t.field),op:"IS_NULL"}}}else if(t.op==="!="){if(ed(t.value))return{unaryFilter:{field:Tn(t.field),op:"IS_NOT_NAN"}};if(Zh(t.value))return{unaryFilter:{field:Tn(t.field),op:"IS_NOT_NULL"}}}return{fieldFilter:{field:Tn(t.field),op:X_(t.op),value:t.value}}}(n):n instanceof Ge?function(t){let r=t.getFilters().map(i=>nf(i));return r.length===1?r[0]:{compositeFilter:{op:Z_(t.op),filters:r}}}(n):q()}function ey(n){let e=[];return n.fields.forEach(t=>e.push(t.canonicalString())),{fieldPaths:e}}function rf(n){return n.length>=4&&n.get(0)==="projects"&&n.get(2)==="databases"}var Or=class n{constructor(e,t,r,i,s=G.min(),a=G.min(),c=Pe.EMPTY_BYTE_STRING,l=null){this.target=e,this.targetId=t,this.purpose=r,this.sequenceNumber=i,this.snapshotVersion=s,this.lastLimboFreeSnapshotVersion=a,this.resumeToken=c,this.expectedCount=l}withSequenceNumber(e){return new n(this.target,this.targetId,this.purpose,e,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,this.expectedCount)}withResumeToken(e,t){return new n(this.target,this.targetId,this.purpose,this.sequenceNumber,t,this.lastLimboFreeSnapshotVersion,e,null)}withExpectedCount(e){return new n(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,e)}withLastLimboFreeSnapshotVersion(e){return new n(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,e,this.resumeToken,this.expectedCount)}};var lc=class{constructor(e){this.ct=e}};function ty(n){let e=Q_({parent:n.parent,structuredQuery:n.structuredQuery});return n.limitType==="LAST"?Ja(e,e.limit,"L"):e}var cs=class{constructor(){}It(e,t){this.Tt(e,t),t.Et()}Tt(e,t){if("nullValue"in e)this.dt(t,5);else if("booleanValue"in e)this.dt(t,10),t.At(e.booleanValue?1:0);else if("integerValue"in e)this.dt(t,15),t.At(ne(e.integerValue));else if("doubleValue"in e){let r=ne(e.doubleValue);isNaN(r)?this.dt(t,13):(this.dt(t,15),Cr(r)?t.At(0):t.At(r))}else if("timestampValue"in e){let r=e.timestampValue;this.dt(t,20),typeof r=="string"&&(r=gt(r)),t.Rt(`${r.seconds||""}`),t.At(r.nanos||0)}else if("stringValue"in e)this.Vt(e.stringValue,t),this.ft(t);else if("bytesValue"in e)this.dt(t,30),t.gt(kt(e.bytesValue)),this.ft(t);else if("referenceValue"in e)this.yt(e.referenceValue,t);else if("geoPointValue"in e){let r=e.geoPointValue;this.dt(t,45),t.At(r.latitude||0),t.At(r.longitude||0)}else"mapValue"in e?kd(e)?this.dt(t,Number.MAX_SAFE_INTEGER):Cd(e)?this.wt(e.mapValue,t):(this.St(e.mapValue,t),this.ft(t)):"arrayValue"in e?(this.bt(e.arrayValue,t),this.ft(t)):q()}Vt(e,t){this.dt(t,25),this.Dt(e,t)}Dt(e,t){t.Rt(e)}St(e,t){let r=e.fields||{};this.dt(t,55);for(let i of Object.keys(r))this.Vt(i,t),this.Tt(r[i],t)}wt(e,t){var r,i;let s=e.fields||{};this.dt(t,53);let a="value",c=((i=(r=s[a].arrayValue)===null||r===void 0?void 0:r.values)===null||i===void 0?void 0:i.length)||0;this.dt(t,15),t.At(ne(c)),this.Vt(a,t),this.Tt(s[a],t)}bt(e,t){let r=e.values||[];this.dt(t,50);for(let i of r)this.Tt(i,t)}yt(e,t){this.dt(t,37),M.fromName(e).path.forEach(r=>{this.dt(t,60),this.Dt(r,t)})}dt(e,t){e.At(t)}ft(e){e.At(2)}};cs.vt=new cs;var hc=class{constructor(){this.un=new dc}addToCollectionParentIndex(e,t){return this.un.add(t),N.resolve()}getCollectionParents(e,t){return N.resolve(this.un.getEntries(t))}addFieldIndex(e,t){return N.resolve()}deleteFieldIndex(e,t){return N.resolve()}deleteAllFieldIndexes(e){return N.resolve()}createTargetIndexes(e,t){return N.resolve()}getDocumentsMatchingTarget(e,t){return N.resolve(null)}getIndexType(e,t){return N.resolve(0)}getFieldIndexes(e,t){return N.resolve([])}getNextCollectionGroupToUpdate(e){return N.resolve(null)}getMinOffset(e,t){return N.resolve(Qt.min())}getMinOffsetFromCollectionGroup(e,t){return N.resolve(Qt.min())}updateCollectionGroup(e,t,r){return N.resolve()}updateIndexEntries(e,t){return N.resolve()}},dc=class{constructor(){this.index={}}add(e){let t=e.lastSegment(),r=e.popLast(),i=this.index[t]||new Se(re.comparator),s=!i.has(r);return this.index[t]=i.add(r),s}has(e){let t=e.lastSegment(),r=e.popLast(),i=this.index[t];return i&&i.has(r)}getEntries(e){return(this.index[e]||new Se(re.comparator)).toArray()}};var KE=new Uint8Array(0);var Ye=class n{constructor(e,t,r){this.cacheSizeCollectionThreshold=e,this.percentileToCollect=t,this.maximumSequenceNumbersToCollect=r}static withCacheSize(e){return new n(e,n.DEFAULT_COLLECTION_PERCENTILE,n.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT)}};Ye.DEFAULT_COLLECTION_PERCENTILE=10,Ye.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT=1e3,Ye.DEFAULT=new Ye(41943040,Ye.DEFAULT_COLLECTION_PERCENTILE,Ye.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT),Ye.DISABLED=new Ye(-1,0,0);var Vr=class n{constructor(e){this.Ln=e}next(){return this.Ln+=2,this.Ln}static Bn(){return new n(0)}static kn(){return new n(-1)}};var fc=class{constructor(){this.changes=new Nt(e=>e.toString(),(e,t)=>e.isEqual(t)),this.changesApplied=!1}addEntry(e){this.assertNotApplied(),this.changes.set(e.key,e)}removeEntry(e,t){this.assertNotApplied(),this.changes.set(e,ze.newInvalidDocument(e).setReadTime(t))}getEntry(e,t){this.assertNotApplied();let r=this.changes.get(t);return r!==void 0?N.resolve(r):this.getFromCache(e,t)}getEntries(e,t){return this.getAllFromCache(e,t)}apply(e){return this.assertNotApplied(),this.changesApplied=!0,this.applyChanges(e)}assertNotApplied(){}};var pc=class{constructor(e,t){this.overlayedDocument=e,this.mutatedFields=t}};var mc=class{constructor(e,t,r,i){this.remoteDocumentCache=e,this.mutationQueue=t,this.documentOverlayCache=r,this.indexManager=i}getDocument(e,t){let r=null;return this.documentOverlayCache.getOverlay(e,t).next(i=>(r=i,this.remoteDocumentCache.getEntry(e,t))).next(i=>(r!==null&&Rr(r.mutation,i,qe.empty(),ye.now()),i))}getDocuments(e,t){return this.remoteDocumentCache.getEntries(e,t).next(r=>this.getLocalViewOfDocuments(e,r,H()).next(()=>r))}getLocalViewOfDocuments(e,t,r=H()){let i=$t();return this.populateOverlays(e,i,t).next(()=>this.computeViews(e,t,i,r).next(s=>{let a=Tr();return s.forEach((c,l)=>{a=a.insert(c,l.overlayedDocument)}),a}))}getOverlayedDocuments(e,t){let r=$t();return this.populateOverlays(e,r,t).next(()=>this.computeViews(e,t,r,H()))}populateOverlays(e,t,r){let i=[];return r.forEach(s=>{t.has(s)||i.push(s)}),this.documentOverlayCache.getOverlays(e,i).next(s=>{s.forEach((a,c)=>{t.set(a,c)})})}computeViews(e,t,r,i){let s=_t(),a=Sr(),c=function(){return Sr()}();return t.forEach((l,d)=>{let p=r.get(d.key);i.has(d.key)&&(p===void 0||p.mutation instanceof nt)?s=s.insert(d.key,d):p!==void 0?(a.set(d.key,p.mutation.getFieldMask()),Rr(p.mutation,d,p.mutation.getFieldMask(),ye.now())):a.set(d.key,qe.empty())}),this.recalculateAndSaveOverlays(e,s).next(l=>(l.forEach((d,p)=>a.set(d,p)),t.forEach((d,p)=>{var g;return c.set(d,new pc(p,(g=a.get(d))!==null&&g!==void 0?g:null))}),c))}recalculateAndSaveOverlays(e,t){let r=Sr(),i=new ae((a,c)=>a-c),s=H();return this.mutationQueue.getAllMutationBatchesAffectingDocumentKeys(e,t).next(a=>{for(let c of a)c.keys().forEach(l=>{let d=t.get(l);if(d===null)return;let p=r.get(l)||qe.empty();p=c.applyToLocalView(d,p),r.set(l,p);let g=(i.get(c.batchId)||H()).add(l);i=i.insert(c.batchId,g)})}).next(()=>{let a=[],c=i.getReverseIterator();for(;c.hasNext();){let l=c.getNext(),d=l.key,p=l.value,g=jd();p.forEach(v=>{if(!s.has(v)){let w=Wd(t.get(v),r.get(v));w!==null&&g.set(v,w),s=s.add(v)}}),a.push(this.documentOverlayCache.saveOverlays(e,d,g))}return N.waitFor(a)}).next(()=>r)}recalculateAndSaveOverlaysForDocumentKeys(e,t){return this.remoteDocumentCache.getEntries(e,t).next(r=>this.recalculateAndSaveOverlays(e,r))}getDocumentsMatchingQuery(e,t,r,i){return function(a){return M.isDocumentKey(a.path)&&a.collectionGroup===null&&a.filters.length===0}(t)?this.getDocumentsMatchingDocumentQuery(e,t.path):Md(t)?this.getDocumentsMatchingCollectionGroupQuery(e,t,r,i):this.getDocumentsMatchingCollectionQuery(e,t,r,i)}getNextDocuments(e,t,r,i){return this.remoteDocumentCache.getAllFromCollectionGroup(e,t,r,i).next(s=>{let a=i-s.size>0?this.documentOverlayCache.getOverlaysForCollectionGroup(e,t,r.largestBatchId,i-s.size):N.resolve($t()),c=-1,l=s;return a.next(d=>N.forEach(d,(p,g)=>(c<g.largestBatchId&&(c=g.largestBatchId),s.get(p)?N.resolve():this.remoteDocumentCache.getEntry(e,p).next(v=>{l=l.insert(p,v)}))).next(()=>this.populateOverlays(e,d,s)).next(()=>this.computeViews(e,l,d,H())).next(p=>({batchId:c,changes:Bd(p)})))})}getDocumentsMatchingDocumentQuery(e,t){return this.getDocument(e,new M(t)).next(r=>{let i=Tr();return r.isFoundDocument()&&(i=i.insert(r.key,r)),i})}getDocumentsMatchingCollectionGroupQuery(e,t,r,i){let s=t.collectionGroup,a=Tr();return this.indexManager.getCollectionParents(e,s).next(c=>N.forEach(c,l=>{let d=function(g,v){return new Yt(v,null,g.explicitOrderBy.slice(),g.filters.slice(),g.limit,g.limitType,g.startAt,g.endAt)}(t,l.child(s));return this.getDocumentsMatchingCollectionQuery(e,d,r,i).next(p=>{p.forEach((g,v)=>{a=a.insert(g,v)})})}).next(()=>a))}getDocumentsMatchingCollectionQuery(e,t,r,i){let s;return this.documentOverlayCache.getOverlaysForCollection(e,t.path,r.largestBatchId).next(a=>(s=a,this.remoteDocumentCache.getDocumentsMatchingQuery(e,t,r,s,i))).next(a=>{s.forEach((l,d)=>{let p=d.getKey();a.get(p)===null&&(a=a.insert(p,ze.newInvalidDocument(p)))});let c=Tr();return a.forEach((l,d)=>{let p=s.get(l);p!==void 0&&Rr(p.mutation,d,qe.empty(),ye.now()),Ns(t,d)&&(c=c.insert(l,d))}),c})}};var gc=class{constructor(e){this.serializer=e,this.hr=new Map,this.Pr=new Map}getBundleMetadata(e,t){return N.resolve(this.hr.get(t))}saveBundleMetadata(e,t){return this.hr.set(t.id,function(i){return{id:i.id,version:i.version,createTime:et(i.createTime)}}(t)),N.resolve()}getNamedQuery(e,t){return N.resolve(this.Pr.get(t))}saveNamedQuery(e,t){return this.Pr.set(t.name,function(i){return{name:i.name,query:ty(i.bundledQuery),readTime:et(i.readTime)}}(t)),N.resolve()}};var _c=class{constructor(){this.overlays=new ae(M.comparator),this.Ir=new Map}getOverlay(e,t){return N.resolve(this.overlays.get(t))}getOverlays(e,t){let r=$t();return N.forEach(t,i=>this.getOverlay(e,i).next(s=>{s!==null&&r.set(i,s)})).next(()=>r)}saveOverlays(e,t,r){return r.forEach((i,s)=>{this.ht(e,t,s)}),N.resolve()}removeOverlaysForBatchId(e,t,r){let i=this.Ir.get(r);return i!==void 0&&(i.forEach(s=>this.overlays=this.overlays.remove(s)),this.Ir.delete(r)),N.resolve()}getOverlaysForCollection(e,t,r){let i=$t(),s=t.length+1,a=new M(t.child("")),c=this.overlays.getIteratorFrom(a);for(;c.hasNext();){let l=c.getNext().value,d=l.getKey();if(!t.isPrefixOf(d.path))break;d.path.length===s&&l.largestBatchId>r&&i.set(l.getKey(),l)}return N.resolve(i)}getOverlaysForCollectionGroup(e,t,r,i){let s=new ae((d,p)=>d-p),a=this.overlays.getIterator();for(;a.hasNext();){let d=a.getNext().value;if(d.getKey().getCollectionGroup()===t&&d.largestBatchId>r){let p=s.get(d.largestBatchId);p===null&&(p=$t(),s=s.insert(d.largestBatchId,p)),p.set(d.getKey(),d)}}let c=$t(),l=s.getIterator();for(;l.hasNext()&&(l.getNext().value.forEach((d,p)=>c.set(d,p)),!(c.size()>=i)););return N.resolve(c)}ht(e,t,r){let i=this.overlays.get(r.key);if(i!==null){let a=this.Ir.get(i.largestBatchId).delete(r.key);this.Ir.set(i.largestBatchId,a)}this.overlays=this.overlays.insert(r.key,new tc(t,r));let s=this.Ir.get(t);s===void 0&&(s=H(),this.Ir.set(t,s)),this.Ir.set(t,s.add(r.key))}};var yc=class{constructor(){this.sessionToken=Pe.EMPTY_BYTE_STRING}getSessionToken(e){return N.resolve(this.sessionToken)}setSessionToken(e,t){return this.sessionToken=t,N.resolve()}};var Lr=class{constructor(){this.Tr=new Se(he.Er),this.dr=new Se(he.Ar)}isEmpty(){return this.Tr.isEmpty()}addReference(e,t){let r=new he(e,t);this.Tr=this.Tr.add(r),this.dr=this.dr.add(r)}Rr(e,t){e.forEach(r=>this.addReference(r,t))}removeReference(e,t){this.Vr(new he(e,t))}mr(e,t){e.forEach(r=>this.removeReference(r,t))}gr(e){let t=new M(new re([])),r=new he(t,e),i=new he(t,e+1),s=[];return this.dr.forEachInRange([r,i],a=>{this.Vr(a),s.push(a.key)}),s}pr(){this.Tr.forEach(e=>this.Vr(e))}Vr(e){this.Tr=this.Tr.delete(e),this.dr=this.dr.delete(e)}yr(e){let t=new M(new re([])),r=new he(t,e),i=new he(t,e+1),s=H();return this.dr.forEachInRange([r,i],a=>{s=s.add(a.key)}),s}containsKey(e){let t=new he(e,0),r=this.Tr.firstAfterOrEqual(t);return r!==null&&e.isEqual(r.key)}},he=class{constructor(e,t){this.key=e,this.wr=t}static Er(e,t){return M.comparator(e.key,t.key)||J(e.wr,t.wr)}static Ar(e,t){return J(e.wr,t.wr)||M.comparator(e.key,t.key)}};var vc=class{constructor(e,t){this.indexManager=e,this.referenceDelegate=t,this.mutationQueue=[],this.Sr=1,this.br=new Se(he.Er)}checkEmpty(e){return N.resolve(this.mutationQueue.length===0)}addMutationBatch(e,t,r,i){let s=this.Sr;this.Sr++,this.mutationQueue.length>0&&this.mutationQueue[this.mutationQueue.length-1];let a=new Za(s,t,r,i);this.mutationQueue.push(a);for(let c of i)this.br=this.br.add(new he(c.key,s)),this.indexManager.addToCollectionParentIndex(e,c.key.path.popLast());return N.resolve(a)}lookupMutationBatch(e,t){return N.resolve(this.Dr(t))}getNextMutationBatchAfterBatchId(e,t){let r=t+1,i=this.vr(r),s=i<0?0:i;return N.resolve(this.mutationQueue.length>s?this.mutationQueue[s]:null)}getHighestUnacknowledgedBatchId(){return N.resolve(this.mutationQueue.length===0?-1:this.Sr-1)}getAllMutationBatches(e){return N.resolve(this.mutationQueue.slice())}getAllMutationBatchesAffectingDocumentKey(e,t){let r=new he(t,0),i=new he(t,Number.POSITIVE_INFINITY),s=[];return this.br.forEachInRange([r,i],a=>{let c=this.Dr(a.wr);s.push(c)}),N.resolve(s)}getAllMutationBatchesAffectingDocumentKeys(e,t){let r=new Se(J);return t.forEach(i=>{let s=new he(i,0),a=new he(i,Number.POSITIVE_INFINITY);this.br.forEachInRange([s,a],c=>{r=r.add(c.wr)})}),N.resolve(this.Cr(r))}getAllMutationBatchesAffectingQuery(e,t){let r=t.path,i=r.length+1,s=r;M.isDocumentKey(s)||(s=s.child(""));let a=new he(new M(s),0),c=new Se(J);return this.br.forEachWhile(l=>{let d=l.key.path;return!!r.isPrefixOf(d)&&(d.length===i&&(c=c.add(l.wr)),!0)},a),N.resolve(this.Cr(c))}Cr(e){let t=[];return e.forEach(r=>{let i=this.Dr(r);i!==null&&t.push(i)}),t}removeMutationBatch(e,t){Y(this.Fr(t.batchId,"removed")===0),this.mutationQueue.shift();let r=this.br;return N.forEach(t.mutations,i=>{let s=new he(i.key,t.batchId);return r=r.delete(s),this.referenceDelegate.markPotentiallyOrphaned(e,i.key)}).next(()=>{this.br=r})}On(e){}containsKey(e,t){let r=new he(t,0),i=this.br.firstAfterOrEqual(r);return N.resolve(t.isEqual(i&&i.key))}performConsistencyCheck(e){return this.mutationQueue.length,N.resolve()}Fr(e,t){return this.vr(e)}vr(e){return this.mutationQueue.length===0?0:e-this.mutationQueue[0].batchId}Dr(e){let t=this.vr(e);return t<0||t>=this.mutationQueue.length?null:this.mutationQueue[t]}};var Ic=class{constructor(e){this.Mr=e,this.docs=function(){return new ae(M.comparator)}(),this.size=0}setIndexManager(e){this.indexManager=e}addEntry(e,t){let r=t.key,i=this.docs.get(r),s=i?i.size:0,a=this.Mr(t);return this.docs=this.docs.insert(r,{document:t.mutableCopy(),size:a}),this.size+=a-s,this.indexManager.addToCollectionParentIndex(e,r.path.popLast())}removeEntry(e){let t=this.docs.get(e);t&&(this.docs=this.docs.remove(e),this.size-=t.size)}getEntry(e,t){let r=this.docs.get(t);return N.resolve(r?r.document.mutableCopy():ze.newInvalidDocument(t))}getEntries(e,t){let r=_t();return t.forEach(i=>{let s=this.docs.get(i);r=r.insert(i,s?s.document.mutableCopy():ze.newInvalidDocument(i))}),N.resolve(r)}getDocumentsMatchingQuery(e,t,r,i){let s=_t(),a=t.path,c=new M(a.child("")),l=this.docs.getIteratorFrom(c);for(;l.hasNext();){let{key:d,value:{document:p}}=l.getNext();if(!a.isPrefixOf(d.path))break;d.path.length>a.length+1||l_(u_(p),r)<=0||(i.has(p.key)||Ns(t,p))&&(s=s.insert(p.key,p.mutableCopy()))}return N.resolve(s)}getAllFromCollectionGroup(e,t,r,i){q()}Or(e,t){return N.forEach(this.docs,r=>t(r))}newChangeBuffer(e){return new wc(this)}getSize(e){return N.resolve(this.size)}},wc=class extends fc{constructor(e){super(),this.cr=e}applyChanges(e){let t=[];return this.changes.forEach((r,i)=>{i.isValidDocument()?t.push(this.cr.addEntry(e,i)):this.cr.removeEntry(r)}),N.waitFor(t)}getFromCache(e,t){return this.cr.getEntry(e,t)}getAllFromCache(e,t){return this.cr.getEntries(e,t)}};var Ec=class{constructor(e){this.persistence=e,this.Nr=new Nt(t=>cu(t),uu),this.lastRemoteSnapshotVersion=G.min(),this.highestTargetId=0,this.Lr=0,this.Br=new Lr,this.targetCount=0,this.kr=Vr.Bn()}forEachTarget(e,t){return this.Nr.forEach((r,i)=>t(i)),N.resolve()}getLastRemoteSnapshotVersion(e){return N.resolve(this.lastRemoteSnapshotVersion)}getHighestSequenceNumber(e){return N.resolve(this.Lr)}allocateTargetId(e){return this.highestTargetId=this.kr.next(),N.resolve(this.highestTargetId)}setTargetsMetadata(e,t,r){return r&&(this.lastRemoteSnapshotVersion=r),t>this.Lr&&(this.Lr=t),N.resolve()}Kn(e){this.Nr.set(e.target,e);let t=e.targetId;t>this.highestTargetId&&(this.kr=new Vr(t),this.highestTargetId=t),e.sequenceNumber>this.Lr&&(this.Lr=e.sequenceNumber)}addTargetData(e,t){return this.Kn(t),this.targetCount+=1,N.resolve()}updateTargetData(e,t){return this.Kn(t),N.resolve()}removeTargetData(e,t){return this.Nr.delete(t.target),this.Br.gr(t.targetId),this.targetCount-=1,N.resolve()}removeTargets(e,t,r){let i=0,s=[];return this.Nr.forEach((a,c)=>{c.sequenceNumber<=t&&r.get(c.targetId)===null&&(this.Nr.delete(a),s.push(this.removeMatchingKeysForTargetId(e,c.targetId)),i++)}),N.waitFor(s).next(()=>i)}getTargetCount(e){return N.resolve(this.targetCount)}getTargetData(e,t){let r=this.Nr.get(t)||null;return N.resolve(r)}addMatchingKeys(e,t,r){return this.Br.Rr(t,r),N.resolve()}removeMatchingKeys(e,t,r){this.Br.mr(t,r);let i=this.persistence.referenceDelegate,s=[];return i&&t.forEach(a=>{s.push(i.markPotentiallyOrphaned(e,a))}),N.waitFor(s)}removeMatchingKeysForTargetId(e,t){return this.Br.gr(t),N.resolve()}getMatchingKeysForTargetId(e,t){let r=this.Br.yr(t);return N.resolve(r)}containsKey(e,t){return N.resolve(this.Br.containsKey(t))}};var Tc=class{constructor(e,t){this.qr={},this.overlays={},this.Qr=new Pr(0),this.Kr=!1,this.Kr=!0,this.$r=new yc,this.referenceDelegate=e(this),this.Ur=new Ec(this),this.indexManager=new hc,this.remoteDocumentCache=function(i){return new Ic(i)}(r=>this.referenceDelegate.Wr(r)),this.serializer=new lc(t),this.Gr=new gc(this.serializer)}start(){return Promise.resolve()}shutdown(){return this.Kr=!1,Promise.resolve()}get started(){return this.Kr}setDatabaseDeletedListener(){}setNetworkEnabled(){}getIndexManager(e){return this.indexManager}getDocumentOverlayCache(e){let t=this.overlays[e.toKey()];return t||(t=new _c,this.overlays[e.toKey()]=t),t}getMutationQueue(e,t){let r=this.qr[e.toKey()];return r||(r=new vc(t,this.referenceDelegate),this.qr[e.toKey()]=r),r}getGlobalsCache(){return this.$r}getTargetCache(){return this.Ur}getRemoteDocumentCache(){return this.remoteDocumentCache}getBundleCache(){return this.Gr}runTransaction(e,t,r){V("MemoryPersistence","Starting transaction:",e);let i=new bc(this.Qr.next());return this.referenceDelegate.zr(),r(i).next(s=>this.referenceDelegate.jr(i).next(()=>s)).toPromise().then(s=>(i.raiseOnCommittedEvent(),s))}Hr(e,t){return N.or(Object.values(this.qr).map(r=>()=>r.containsKey(e,t)))}},bc=class extends Va{constructor(e){super(),this.currentSequenceNumber=e}},Ac=class n{constructor(e){this.persistence=e,this.Jr=new Lr,this.Yr=null}static Zr(e){return new n(e)}get Xr(){if(this.Yr)return this.Yr;throw q()}addReference(e,t,r){return this.Jr.addReference(r,t),this.Xr.delete(r.toString()),N.resolve()}removeReference(e,t,r){return this.Jr.removeReference(r,t),this.Xr.add(r.toString()),N.resolve()}markPotentiallyOrphaned(e,t){return this.Xr.add(t.toString()),N.resolve()}removeTarget(e,t){this.Jr.gr(t.targetId).forEach(i=>this.Xr.add(i.toString()));let r=this.persistence.getTargetCache();return r.getMatchingKeysForTargetId(e,t.targetId).next(i=>{i.forEach(s=>this.Xr.add(s.toString()))}).next(()=>r.removeTargetData(e,t))}zr(){this.Yr=new Set}jr(e){let t=this.persistence.getRemoteDocumentCache().newChangeBuffer();return N.forEach(this.Xr,r=>{let i=M.fromPath(r);return this.ei(e,i).next(s=>{s||t.removeEntry(i,G.min())})}).next(()=>(this.Yr=null,t.apply(e)))}updateLimboDocument(e,t){return this.ei(e,t).next(r=>{r?this.Xr.delete(t.toString()):this.Xr.add(t.toString())})}Wr(e){return 0}ei(e,t){return N.or([()=>N.resolve(this.Jr.containsKey(t)),()=>this.persistence.getTargetCache().containsKey(e,t),()=>this.persistence.Hr(e,t)])}};var Sc=class n{constructor(e,t,r,i){this.targetId=e,this.fromCache=t,this.$i=r,this.Ui=i}static Wi(e,t){let r=H(),i=H();for(let s of t.docChanges)switch(s.type){case 0:r=r.add(s.doc.key);break;case 1:i=i.add(s.doc.key)}return new n(e,t.fromCache,r,i)}};var Rc=class{constructor(){this._documentReadCount=0}get documentReadCount(){return this._documentReadCount}incrementDocumentReadCount(e){this._documentReadCount+=e}};var Pc=class{constructor(){this.Gi=!1,this.zi=!1,this.ji=100,this.Hi=function(){return Ph()?8:d_(me())>0?6:4}()}initialize(e,t){this.Ji=e,this.indexManager=t,this.Gi=!0}getDocumentsMatchingQuery(e,t,r,i){let s={result:null};return this.Yi(e,t).next(a=>{s.result=a}).next(()=>{if(!s.result)return this.Zi(e,t,i,r).next(a=>{s.result=a})}).next(()=>{if(s.result)return;let a=new Rc;return this.Xi(e,t,a).next(c=>{if(s.result=c,this.zi)return this.es(e,t,a,c.size)})}).next(()=>s.result)}es(e,t,r,i){return r.documentReadCount<this.ji?(Er()<=$.DEBUG&&V("QueryEngine","SDK will not create cache indexes for query:",En(t),"since it only creates cache indexes for collection contains","more than or equal to",this.ji,"documents"),N.resolve()):(Er()<=$.DEBUG&&V("QueryEngine","Query:",En(t),"scans",r.documentReadCount,"local documents and returns",i,"documents as results."),r.documentReadCount>this.Hi*i?(Er()<=$.DEBUG&&V("QueryEngine","The SDK decides to create cache indexes for query:",En(t),"as using cache indexes may help improve performance."),this.indexManager.createTargetIndexes(e,Ze(t))):N.resolve())}Yi(e,t){if(id(t))return N.resolve(null);let r=Ze(t);return this.indexManager.getIndexType(e,r).next(i=>i===0?null:(t.limit!==null&&i===1&&(t=Ja(t,null,"F"),r=Ze(t)),this.indexManager.getDocumentsMatchingTarget(e,r).next(s=>{let a=H(...s);return this.Ji.getDocuments(e,a).next(c=>this.indexManager.getMinOffset(e,r).next(l=>{let d=this.ts(t,c);return this.ns(t,d,a,l.readTime)?this.Yi(e,Ja(t,null,"F")):this.rs(e,d,t,l)}))})))}Zi(e,t,r,i){return id(t)||i.isEqual(G.min())?N.resolve(null):this.Ji.getDocuments(e,r).next(s=>{let a=this.ts(t,s);return this.ns(t,a,r,i)?N.resolve(null):(Er()<=$.DEBUG&&V("QueryEngine","Re-using previous result from %s to execute query: %s",i.toString(),En(t)),this.rs(e,a,t,c_(i,-1)).next(c=>c))})}ts(e,t){let r=new Se(Ud(e));return t.forEach((i,s)=>{Ns(e,s)&&(r=r.add(s))}),r}ns(e,t,r,i){if(e.limit===null)return!1;if(r.size!==t.size)return!0;let s=e.limitType==="F"?t.last():t.first();return!!s&&(s.hasPendingWrites||s.version.compareTo(i)>0)}Xi(e,t,r){return Er()<=$.DEBUG&&V("QueryEngine","Using full collection scan to execute query:",En(t)),this.Ji.getDocumentsMatchingQuery(e,t,Qt.min(),r)}rs(e,t,r,i){return this.Ji.getDocumentsMatchingQuery(e,r,i).next(s=>(t.forEach(a=>{s=s.insert(a.key,a)}),s))}};var Cc=class{constructor(e,t,r,i){this.persistence=e,this.ss=t,this.serializer=i,this.os=new ae(J),this._s=new Nt(s=>cu(s),uu),this.us=new Map,this.cs=e.getRemoteDocumentCache(),this.Ur=e.getTargetCache(),this.Gr=e.getBundleCache(),this.ls(r)}ls(e){this.documentOverlayCache=this.persistence.getDocumentOverlayCache(e),this.indexManager=this.persistence.getIndexManager(e),this.mutationQueue=this.persistence.getMutationQueue(e,this.indexManager),this.localDocuments=new mc(this.cs,this.mutationQueue,this.documentOverlayCache,this.indexManager),this.cs.setIndexManager(this.indexManager),this.ss.initialize(this.localDocuments,this.indexManager)}collectGarbage(e){return this.persistence.runTransaction("Collect garbage","readwrite-primary",t=>e.collect(t,this.os))}};function ny(n,e,t,r){return new Cc(n,e,t,r)}async function sf(n,e){let t=j(n);return await t.persistence.runTransaction("Handle user change","readonly",r=>{let i;return t.mutationQueue.getAllMutationBatches(r).next(s=>(i=s,t.ls(e),t.mutationQueue.getAllMutationBatches(r))).next(s=>{let a=[],c=[],l=H();for(let d of i){a.push(d.batchId);for(let p of d.mutations)l=l.add(p.key)}for(let d of s){c.push(d.batchId);for(let p of d.mutations)l=l.add(p.key)}return t.localDocuments.getDocuments(r,l).next(d=>({hs:d,removedBatchIds:a,addedBatchIds:c}))})})}function ry(n,e){let t=j(n);return t.persistence.runTransaction("Acknowledge batch","readwrite-primary",r=>{let i=e.batch.keys(),s=t.cs.newChangeBuffer({trackRemovals:!0});return function(c,l,d,p){let g=d.batch,v=g.keys(),w=N.resolve();return v.forEach(R=>{w=w.next(()=>p.getEntry(l,R)).next(D=>{let C=d.docVersions.get(R);Y(C!==null),D.version.compareTo(C)<0&&(g.applyToRemoteDocument(D,d),D.isValidDocument()&&(D.setReadTime(d.commitVersion),p.addEntry(D)))})}),w.next(()=>c.mutationQueue.removeMutationBatch(l,g))}(t,r,e,s).next(()=>s.apply(r)).next(()=>t.mutationQueue.performConsistencyCheck(r)).next(()=>t.documentOverlayCache.removeOverlaysForBatchId(r,i,e.batch.batchId)).next(()=>t.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(r,function(c){let l=H();for(let d=0;d<c.mutationResults.length;++d)c.mutationResults[d].transformResults.length>0&&(l=l.add(c.batch.mutations[d].key));return l}(e))).next(()=>t.localDocuments.getDocuments(r,i))})}function of(n){let e=j(n);return e.persistence.runTransaction("Get last remote snapshot version","readonly",t=>e.Ur.getLastRemoteSnapshotVersion(t))}function iy(n,e){let t=j(n),r=e.snapshotVersion,i=t.os;return t.persistence.runTransaction("Apply remote event","readwrite-primary",s=>{let a=t.cs.newChangeBuffer({trackRemovals:!0});i=t.os;let c=[];e.targetChanges.forEach((p,g)=>{let v=i.get(g);if(!v)return;c.push(t.Ur.removeMatchingKeys(s,p.removedDocuments,g).next(()=>t.Ur.addMatchingKeys(s,p.addedDocuments,g)));let w=v.withSequenceNumber(s.currentSequenceNumber);e.targetMismatches.get(g)!==null?w=w.withResumeToken(Pe.EMPTY_BYTE_STRING,G.min()).withLastLimboFreeSnapshotVersion(G.min()):p.resumeToken.approximateByteSize()>0&&(w=w.withResumeToken(p.resumeToken,r)),i=i.insert(g,w),function(D,C,U){return D.resumeToken.approximateByteSize()===0||C.snapshotVersion.toMicroseconds()-D.snapshotVersion.toMicroseconds()>=3e8?!0:U.addedDocuments.size+U.modifiedDocuments.size+U.removedDocuments.size>0}(v,w,p)&&c.push(t.Ur.updateTargetData(s,w))});let l=_t(),d=H();if(e.documentUpdates.forEach(p=>{e.resolvedLimboDocuments.has(p)&&c.push(t.persistence.referenceDelegate.updateLimboDocument(s,p))}),c.push(sy(s,a,e.documentUpdates).next(p=>{l=p.Ps,d=p.Is})),!r.isEqual(G.min())){let p=t.Ur.getLastRemoteSnapshotVersion(s).next(g=>t.Ur.setTargetsMetadata(s,s.currentSequenceNumber,r));c.push(p)}return N.waitFor(c).next(()=>a.apply(s)).next(()=>t.localDocuments.getLocalViewOfDocuments(s,l,d)).next(()=>l)}).then(s=>(t.os=i,s))}function sy(n,e,t){let r=H(),i=H();return t.forEach(s=>r=r.add(s)),e.getEntries(n,r).next(s=>{let a=_t();return t.forEach((c,l)=>{let d=s.get(c);l.isFoundDocument()!==d.isFoundDocument()&&(i=i.add(c)),l.isNoDocument()&&l.version.isEqual(G.min())?(e.removeEntry(c,l.readTime),a=a.insert(c,l)):!d.isValidDocument()||l.version.compareTo(d.version)>0||l.version.compareTo(d.version)===0&&d.hasPendingWrites?(e.addEntry(l),a=a.insert(c,l)):V("LocalStore","Ignoring outdated watch update for ",c,". Current version:",d.version," Watch version:",l.version)}),{Ps:a,Is:i}})}function oy(n,e){let t=j(n);return t.persistence.runTransaction("Get next mutation batch","readonly",r=>(e===void 0&&(e=-1),t.mutationQueue.getNextMutationBatchAfterBatchId(r,e)))}function ay(n,e){let t=j(n);return t.persistence.runTransaction("Allocate target","readwrite",r=>{let i;return t.Ur.getTargetData(r,e).next(s=>s?(i=s,N.resolve(i)):t.Ur.allocateTargetId(r).next(a=>(i=new Or(e,a,"TargetPurposeListen",r.currentSequenceNumber),t.Ur.addTargetData(r,i).next(()=>i))))}).then(r=>{let i=t.os.get(r.targetId);return(i===null||r.snapshotVersion.compareTo(i.snapshotVersion)>0)&&(t.os=t.os.insert(r.targetId,r),t._s.set(e,r.targetId)),r})}async function kc(n,e,t){let r=j(n),i=r.os.get(e),s=t?"readwrite":"readwrite-primary";try{t||await r.persistence.runTransaction("Release target",s,a=>r.persistence.referenceDelegate.removeTarget(a,i))}catch(a){if(!Hr(a))throw a;V("LocalStore",`Failed to update sequence numbers for target ${e}: ${a}`)}r.os=r.os.remove(e),r._s.delete(i.target)}function md(n,e,t){let r=j(n),i=G.min(),s=H();return r.persistence.runTransaction("Execute query","readwrite",a=>function(l,d,p){let g=j(l),v=g._s.get(p);return v!==void 0?N.resolve(g.os.get(v)):g.Ur.getTargetData(d,p)}(r,a,Ze(e)).next(c=>{if(c)return i=c.lastLimboFreeSnapshotVersion,r.Ur.getMatchingKeysForTargetId(a,c.targetId).next(l=>{s=l})}).next(()=>r.ss.getDocumentsMatchingQuery(a,e,t?i:G.min(),t?s:H())).next(c=>(cy(r,T_(e),c),{documents:c,Ts:s})))}function cy(n,e,t){let r=n.us.get(e)||G.min();t.forEach((i,s)=>{s.readTime.compareTo(r)>0&&(r=s.readTime)}),n.us.set(e,r)}var us=class{constructor(){this.activeTargetIds=C_()}fs(e){this.activeTargetIds=this.activeTargetIds.add(e)}gs(e){this.activeTargetIds=this.activeTargetIds.delete(e)}Vs(){let e={activeTargetIds:this.activeTargetIds.toArray(),updateTimeMs:Date.now()};return JSON.stringify(e)}};var Nc=class{constructor(){this.so=new us,this.oo={},this.onlineStateHandler=null,this.sequenceNumberHandler=null}addPendingMutation(e){}updateMutationState(e,t,r){}addLocalQueryTarget(e,t=!0){return t&&this.so.fs(e),this.oo[e]||"not-current"}updateQueryState(e,t,r){this.oo[e]=t}removeLocalQueryTarget(e){this.so.gs(e)}isLocalQueryTarget(e){return this.so.activeTargetIds.has(e)}clearQueryState(e){delete this.oo[e]}getAllActiveQueryTargets(){return this.so.activeTargetIds}isActiveQueryTarget(e){return this.so.activeTargetIds.has(e)}start(){return this.so=new us,Promise.resolve()}handleUserChange(e,t,r){}setOnlineState(e){}shutdown(){}writeSequenceNumber(e){}notifyBundleLoaded(e){}};var Dc=class{_o(e){}shutdown(){}};var ls=class{constructor(){this.ao=()=>this.uo(),this.co=()=>this.lo(),this.ho=[],this.Po()}_o(e){this.ho.push(e)}shutdown(){window.removeEventListener("online",this.ao),window.removeEventListener("offline",this.co)}Po(){window.addEventListener("online",this.ao),window.addEventListener("offline",this.co)}uo(){V("ConnectivityMonitor","Network connectivity changed: AVAILABLE");for(let e of this.ho)e(0)}lo(){V("ConnectivityMonitor","Network connectivity changed: UNAVAILABLE");for(let e of this.ho)e(1)}static D(){return typeof window!="undefined"&&window.addEventListener!==void 0&&window.removeEventListener!==void 0}};var Hi=null;function ba(){return Hi===null?Hi=function(){return 268435456+Math.round(2147483648*Math.random())}():Hi++,"0x"+Hi.toString(16)}var uy={BatchGetDocuments:"batchGet",Commit:"commit",RunQuery:"runQuery",RunAggregationQuery:"runAggregationQuery"};var xc=class{constructor(e){this.Io=e.Io,this.To=e.To}Eo(e){this.Ao=e}Ro(e){this.Vo=e}mo(e){this.fo=e}onMessage(e){this.po=e}close(){this.To()}send(e){this.Io(e)}yo(){this.Ao()}wo(){this.Vo()}So(e){this.fo(e)}bo(e){this.po(e)}};var Ae="WebChannelConnection",Oc=class extends class{constructor(t){this.databaseInfo=t,this.databaseId=t.databaseId;let r=t.ssl?"https":"http",i=encodeURIComponent(this.databaseId.projectId),s=encodeURIComponent(this.databaseId.database);this.Do=r+"://"+t.host,this.vo=`projects/${i}/databases/${s}`,this.Co=this.databaseId.database==="(default)"?`project_id=${i}`:`project_id=${i}&database_id=${s}`}get Fo(){return!1}Mo(t,r,i,s,a){let c=ba(),l=this.xo(t,r.toUriEncodedString());V("RestConnection",`Sending RPC '${t}' ${c}:`,l,i);let d={"google-cloud-resource-prefix":this.vo,"x-goog-request-params":this.Co};return this.Oo(d,s,a),this.No(t,l,d,i).then(p=>(V("RestConnection",`Received RPC '${t}' ${c}: `,p),p),p=>{throw Pn("RestConnection",`RPC '${t}' ${c} failed with error: `,p,"url: ",l,"request:",i),p})}Lo(t,r,i,s,a,c){return this.Mo(t,r,i,s,a)}Oo(t,r,i){t["X-Goog-Api-Client"]=function(){return"gl-js/ fire/"+jn}(),t["Content-Type"]="text/plain",this.databaseInfo.appId&&(t["X-Firebase-GMPID"]=this.databaseInfo.appId),r&&r.headers.forEach((s,a)=>t[a]=s),i&&i.headers.forEach((s,a)=>t[a]=s)}xo(t,r){let i=uy[t];return`${this.Do}/v1/${r}:${i}`}terminate(){}}{constructor(e){super(e),this.forceLongPolling=e.forceLongPolling,this.autoDetectLongPolling=e.autoDetectLongPolling,this.useFetchStreams=e.useFetchStreams,this.longPollingOptions=e.longPollingOptions}No(e,t,r,i){let s=ba();return new Promise((a,c)=>{let l=new ya;l.setWithCredentials(!0),l.listenOnce(va.COMPLETE,()=>{try{switch(l.getLastErrorCode()){case wr.NO_ERROR:let p=l.getResponseJson();V(Ae,`XHR for RPC '${e}' ${s} received:`,JSON.stringify(p)),a(p);break;case wr.TIMEOUT:V(Ae,`RPC '${e}' ${s} timed out`),c(new O(P.DEADLINE_EXCEEDED,"Request time out"));break;case wr.HTTP_ERROR:let g=l.getStatus();if(V(Ae,`RPC '${e}' ${s} failed with status:`,g,"response text:",l.getResponseText()),g>0){let v=l.getResponseJson();Array.isArray(v)&&(v=v[0]);let w=v==null?void 0:v.error;if(w&&w.status&&w.message){let R=function(C){let U=C.toLowerCase().replace(/_/g,"-");return Object.values(P).indexOf(U)>=0?U:P.UNKNOWN}(w.status);c(new O(R,w.message))}else c(new O(P.UNKNOWN,"Server responded with status "+l.getStatus()))}else c(new O(P.UNAVAILABLE,"Connection failed."));break;default:q()}}finally{V(Ae,`RPC '${e}' ${s} completed.`)}});let d=JSON.stringify(i);V(Ae,`RPC '${e}' ${s} sending request:`,i),l.send(t,"POST",d,r,15)})}Bo(e,t,r){let i=ba(),s=[this.Do,"/","google.firestore.v1.Firestore","/",e,"/channel"],a=Ea(),c=wa(),l={httpSessionIdParam:"gsessionid",initMessageHeaders:{},messageUrlParams:{database:`projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`},sendRawJson:!0,supportsCrossDomainXhr:!0,internalChannelParams:{forwardChannelRequestTimeoutMs:6e5},forceLongPolling:this.forceLongPolling,detectBufferingProxy:this.autoDetectLongPolling},d=this.longPollingOptions.timeoutSeconds;d!==void 0&&(l.longPollingTimeout=Math.round(1e3*d)),this.useFetchStreams&&(l.useFetchStreams=!0),this.Oo(l.initMessageHeaders,t,r),l.encodeInitMessageHeaders=!0;let p=s.join("");V(Ae,`Creating RPC '${e}' stream ${i}: ${p}`,l);let g=a.createWebChannel(p,l),v=!1,w=!1,R=new xc({Io:C=>{w?V(Ae,`Not sending because RPC '${e}' stream ${i} is closed:`,C):(v||(V(Ae,`Opening RPC '${e}' stream ${i} transport.`),g.open(),v=!0),V(Ae,`RPC '${e}' stream ${i} sending:`,C),g.send(C))},To:()=>g.close()}),D=(C,U,B)=>{C.listen(U,F=>{try{B(F)}catch(z){setTimeout(()=>{throw z},0)}})};return D(g,wn.EventType.OPEN,()=>{w||(V(Ae,`RPC '${e}' stream ${i} transport opened.`),R.yo())}),D(g,wn.EventType.CLOSE,()=>{w||(w=!0,V(Ae,`RPC '${e}' stream ${i} transport closed`),R.So())}),D(g,wn.EventType.ERROR,C=>{w||(w=!0,Pn(Ae,`RPC '${e}' stream ${i} transport errored:`,C),R.So(new O(P.UNAVAILABLE,"The operation could not be completed")))}),D(g,wn.EventType.MESSAGE,C=>{var U;if(!w){let B=C.data[0];Y(!!B);let F=B,z=F.error||((U=F[0])===null||U===void 0?void 0:U.error);if(z){V(Ae,`RPC '${e}' stream ${i} received error:`,z);let se=z.status,K=function(_){let I=le[_];if(I!==void 0)return Jd(I)}(se),E=z.message;K===void 0&&(K=P.INTERNAL,E="Unknown error status: "+se+" with message "+z.message),w=!0,R.So(new O(K,E)),g.close()}else V(Ae,`RPC '${e}' stream ${i} received:`,B),R.bo(B)}}),D(c,Ia.STAT_EVENT,C=>{C.stat===$i.PROXY?V(Ae,`RPC '${e}' stream ${i} detected buffering proxy`):C.stat===$i.NOPROXY&&V(Ae,`RPC '${e}' stream ${i} detected no buffering proxy`)}),setTimeout(()=>{R.wo()},0),R}};function Aa(){return typeof document!="undefined"?document:null}function Ds(n){return new sc(n,!0)}var hs=class{constructor(e,t,r=1e3,i=1.5,s=6e4){this.ui=e,this.timerId=t,this.ko=r,this.qo=i,this.Qo=s,this.Ko=0,this.$o=null,this.Uo=Date.now(),this.reset()}reset(){this.Ko=0}Wo(){this.Ko=this.Qo}Go(e){this.cancel();let t=Math.floor(this.Ko+this.zo()),r=Math.max(0,Date.now()-this.Uo),i=Math.max(0,t-r);i>0&&V("ExponentialBackoff",`Backing off for ${i} ms (base delay: ${this.Ko} ms, delay with jitter: ${t} ms, last attempt: ${r} ms ago)`),this.$o=this.ui.enqueueAfterDelay(this.timerId,i,()=>(this.Uo=Date.now(),e())),this.Ko*=this.qo,this.Ko<this.ko&&(this.Ko=this.ko),this.Ko>this.Qo&&(this.Ko=this.Qo)}jo(){this.$o!==null&&(this.$o.skipDelay(),this.$o=null)}cancel(){this.$o!==null&&(this.$o.cancel(),this.$o=null)}zo(){return(Math.random()-.5)*this.Ko}};var ds=class{constructor(e,t,r,i,s,a,c,l){this.ui=e,this.Ho=r,this.Jo=i,this.connection=s,this.authCredentialsProvider=a,this.appCheckCredentialsProvider=c,this.listener=l,this.state=0,this.Yo=0,this.Zo=null,this.Xo=null,this.stream=null,this.e_=0,this.t_=new hs(e,t)}n_(){return this.state===1||this.state===5||this.r_()}r_(){return this.state===2||this.state===3}start(){this.e_=0,this.state!==4?this.auth():this.i_()}async stop(){this.n_()&&await this.close(0)}s_(){this.state=0,this.t_.reset()}o_(){this.r_()&&this.Zo===null&&(this.Zo=this.ui.enqueueAfterDelay(this.Ho,6e4,()=>this.__()))}a_(e){this.u_(),this.stream.send(e)}async __(){if(this.r_())return this.close(0)}u_(){this.Zo&&(this.Zo.cancel(),this.Zo=null)}c_(){this.Xo&&(this.Xo.cancel(),this.Xo=null)}async close(e,t){this.u_(),this.c_(),this.t_.cancel(),this.Yo++,e!==4?this.t_.reset():t&&t.code===P.RESOURCE_EXHAUSTED?(mt(t.toString()),mt("Using maximum backoff delay to prevent overloading the backend."),this.t_.Wo()):t&&t.code===P.UNAUTHENTICATED&&this.state!==3&&(this.authCredentialsProvider.invalidateToken(),this.appCheckCredentialsProvider.invalidateToken()),this.stream!==null&&(this.l_(),this.stream.close(),this.stream=null),this.state=e,await this.listener.mo(t)}l_(){}auth(){this.state=1;let e=this.h_(this.Yo),t=this.Yo;Promise.all([this.authCredentialsProvider.getToken(),this.appCheckCredentialsProvider.getToken()]).then(([r,i])=>{this.Yo===t&&this.P_(r,i)},r=>{e(()=>{let i=new O(P.UNKNOWN,"Fetching auth token failed: "+r.message);return this.I_(i)})})}P_(e,t){let r=this.h_(this.Yo);this.stream=this.T_(e,t),this.stream.Eo(()=>{r(()=>this.listener.Eo())}),this.stream.Ro(()=>{r(()=>(this.state=2,this.Xo=this.ui.enqueueAfterDelay(this.Jo,1e4,()=>(this.r_()&&(this.state=3),Promise.resolve())),this.listener.Ro()))}),this.stream.mo(i=>{r(()=>this.I_(i))}),this.stream.onMessage(i=>{r(()=>++this.e_==1?this.E_(i):this.onNext(i))})}i_(){this.state=5,this.t_.Go(async()=>{this.state=0,this.start()})}I_(e){return V("PersistentStream",`close with error: ${e}`),this.stream=null,this.close(4,e)}h_(e){return t=>{this.ui.enqueueAndForget(()=>this.Yo===e?t():(V("PersistentStream","stream callback skipped by getCloseGuardedDispatcher."),Promise.resolve()))}}},Vc=class extends ds{constructor(e,t,r,i,s,a){super(e,"listen_stream_connection_backoff","listen_stream_idle","health_check_timeout",t,r,i,a),this.serializer=s}T_(e,t){return this.connection.Bo("Listen",e,t)}E_(e){return this.onNext(e)}onNext(e){this.t_.reset();let t=G_(this.serializer,e),r=function(s){if(!("targetChange"in s))return G.min();let a=s.targetChange;return a.targetIds&&a.targetIds.length?G.min():a.readTime?et(a.readTime):G.min()}(e);return this.listener.d_(t,r)}A_(e){let t={};t.database=uc(this.serializer),t.addTarget=function(s,a){let c,l=a.target;if(c=Wa(l)?{documents:H_(s,l)}:{query:W_(s,l)._t},c.targetId=a.targetId,a.resumeToken.approximateByteSize()>0){c.resumeToken=Yd(s,a.resumeToken);let d=oc(s,a.expectedCount);d!==null&&(c.expectedCount=d)}else if(a.snapshotVersion.compareTo(G.min())>0){c.readTime=as(s,a.snapshotVersion.toTimestamp());let d=oc(s,a.expectedCount);d!==null&&(c.expectedCount=d)}return c}(this.serializer,e);let r=J_(this.serializer,e);r&&(t.labels=r),this.a_(t)}R_(e){let t={};t.database=uc(this.serializer),t.removeTarget=e,this.a_(t)}},Lc=class extends ds{constructor(e,t,r,i,s,a){super(e,"write_stream_connection_backoff","write_stream_idle","health_check_timeout",t,r,i,a),this.serializer=s}get V_(){return this.e_>0}start(){this.lastStreamToken=void 0,super.start()}l_(){this.V_&&this.m_([])}T_(e,t){return this.connection.Bo("Write",e,t)}E_(e){return Y(!!e.streamToken),this.lastStreamToken=e.streamToken,Y(!e.writeResults||e.writeResults.length===0),this.listener.f_()}onNext(e){Y(!!e.streamToken),this.lastStreamToken=e.streamToken,this.t_.reset();let t=K_(e.writeResults,e.commitTime),r=et(e.commitTime);return this.listener.g_(r,t)}p_(){let e={};e.database=uc(this.serializer),this.a_(e)}m_(e){let t={streamToken:this.lastStreamToken,writes:e.map(r=>$_(this.serializer,r))};this.a_(t)}};var Mc=class extends class{}{constructor(e,t,r,i){super(),this.authCredentials=e,this.appCheckCredentials=t,this.connection=r,this.serializer=i,this.y_=!1}w_(){if(this.y_)throw new O(P.FAILED_PRECONDITION,"The client has already been terminated.")}Mo(e,t,r,i){return this.w_(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([s,a])=>this.connection.Mo(e,ac(t,r),i,s,a)).catch(s=>{throw s.name==="FirebaseError"?(s.code===P.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),s):new O(P.UNKNOWN,s.toString())})}Lo(e,t,r,i,s){return this.w_(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([a,c])=>this.connection.Lo(e,ac(t,r),i,a,c,s)).catch(a=>{throw a.name==="FirebaseError"?(a.code===P.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),a):new O(P.UNKNOWN,a.toString())})}terminate(){this.y_=!0,this.connection.terminate()}},Fc=class{constructor(e,t){this.asyncQueue=e,this.onlineStateHandler=t,this.state="Unknown",this.S_=0,this.b_=null,this.D_=!0}v_(){this.S_===0&&(this.C_("Unknown"),this.b_=this.asyncQueue.enqueueAfterDelay("online_state_timeout",1e4,()=>(this.b_=null,this.F_("Backend didn't respond within 10 seconds."),this.C_("Offline"),Promise.resolve())))}M_(e){this.state==="Online"?this.C_("Unknown"):(this.S_++,this.S_>=1&&(this.x_(),this.F_(`Connection failed 1 times. Most recent error: ${e.toString()}`),this.C_("Offline")))}set(e){this.x_(),this.S_=0,e==="Online"&&(this.D_=!1),this.C_(e)}C_(e){e!==this.state&&(this.state=e,this.onlineStateHandler(e))}F_(e){let t=`Could not reach Cloud Firestore backend. ${e}
This typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend.`;this.D_?(mt(t),this.D_=!1):V("OnlineStateTracker",t)}x_(){this.b_!==null&&(this.b_.cancel(),this.b_=null)}};var Uc=class{constructor(e,t,r,i,s){this.localStore=e,this.datastore=t,this.asyncQueue=r,this.remoteSyncer={},this.O_=[],this.N_=new Map,this.L_=new Set,this.B_=[],this.k_=s,this.k_._o(a=>{r.enqueueAndForget(async()=>{rn(this)&&(V("RemoteStore","Restarting streams for network reachability change."),await async function(l){let d=j(l);d.L_.add(4),await Wr(d),d.q_.set("Unknown"),d.L_.delete(4),await xs(d)}(this))})}),this.q_=new Fc(r,i)}};async function xs(n){if(rn(n))for(let e of n.B_)await e(!0)}async function Wr(n){for(let e of n.B_)await e(!1)}function af(n,e){let t=j(n);t.N_.has(e.targetId)||(t.N_.set(e.targetId,e),mu(t)?pu(t):zn(t).r_()&&fu(t,e))}function du(n,e){let t=j(n),r=zn(t);t.N_.delete(e),r.r_()&&cf(t,e),t.N_.size===0&&(r.r_()?r.o_():rn(t)&&t.q_.set("Unknown"))}function fu(n,e){if(n.Q_.xe(e.targetId),e.resumeToken.approximateByteSize()>0||e.snapshotVersion.compareTo(G.min())>0){let t=n.remoteSyncer.getRemoteKeysForTarget(e.targetId).size;e=e.withExpectedCount(t)}zn(n).A_(e)}function cf(n,e){n.Q_.xe(e),zn(n).R_(e)}function pu(n){n.Q_=new ic({getRemoteKeysForTarget:e=>n.remoteSyncer.getRemoteKeysForTarget(e),ot:e=>n.N_.get(e)||null,tt:()=>n.datastore.serializer.databaseId}),zn(n).start(),n.q_.v_()}function mu(n){return rn(n)&&!zn(n).n_()&&n.N_.size>0}function rn(n){return j(n).L_.size===0}function uf(n){n.Q_=void 0}async function ly(n){n.q_.set("Online")}async function hy(n){n.N_.forEach((e,t)=>{fu(n,e)})}async function dy(n,e){uf(n),mu(n)?(n.q_.M_(e),pu(n)):n.q_.set("Unknown")}async function fy(n,e,t){if(n.q_.set("Online"),e instanceof ss&&e.state===2&&e.cause)try{await async function(i,s){let a=s.cause;for(let c of s.targetIds)i.N_.has(c)&&(await i.remoteSyncer.rejectListen(c,a),i.N_.delete(c),i.Q_.removeTarget(c))}(n,e)}catch(r){V("RemoteStore","Failed to remove targets %s: %s ",e.targetIds.join(","),r),await fs(n,r)}else if(e instanceof Sn?n.Q_.Ke(e):e instanceof is?n.Q_.He(e):n.Q_.We(e),!t.isEqual(G.min()))try{let r=await of(n.localStore);t.compareTo(r)>=0&&await function(s,a){let c=s.Q_.rt(a);return c.targetChanges.forEach((l,d)=>{if(l.resumeToken.approximateByteSize()>0){let p=s.N_.get(d);p&&s.N_.set(d,p.withResumeToken(l.resumeToken,a))}}),c.targetMismatches.forEach((l,d)=>{let p=s.N_.get(l);if(!p)return;s.N_.set(l,p.withResumeToken(Pe.EMPTY_BYTE_STRING,p.snapshotVersion)),cf(s,l);let g=new Or(p.target,l,d,p.sequenceNumber);fu(s,g)}),s.remoteSyncer.applyRemoteEvent(c)}(n,t)}catch(r){V("RemoteStore","Failed to raise snapshot:",r),await fs(n,r)}}async function fs(n,e,t){if(!Hr(e))throw e;n.L_.add(1),await Wr(n),n.q_.set("Offline"),t||(t=()=>of(n.localStore)),n.asyncQueue.enqueueRetryable(async()=>{V("RemoteStore","Retrying IndexedDB access"),await t(),n.L_.delete(1),await xs(n)})}function lf(n,e){return e().catch(t=>fs(n,t,e))}async function Os(n){let e=j(n),t=Dt(e),r=e.O_.length>0?e.O_[e.O_.length-1].batchId:-1;for(;py(e);)try{let i=await oy(e.localStore,r);if(i===null){e.O_.length===0&&t.o_();break}r=i.batchId,my(e,i)}catch(i){await fs(e,i)}hf(e)&&df(e)}function py(n){return rn(n)&&n.O_.length<10}function my(n,e){n.O_.push(e);let t=Dt(n);t.r_()&&t.V_&&t.m_(e.mutations)}function hf(n){return rn(n)&&!Dt(n).n_()&&n.O_.length>0}function df(n){Dt(n).start()}async function gy(n){Dt(n).p_()}async function _y(n){let e=Dt(n);for(let t of n.O_)e.m_(t.mutations)}async function yy(n,e,t){let r=n.O_.shift(),i=ec.from(r,e,t);await lf(n,()=>n.remoteSyncer.applySuccessfulWrite(i)),await Os(n)}async function vy(n,e){e&&Dt(n).V_&&await async function(r,i){if(function(a){return L_(a)&&a!==P.ABORTED}(i.code)){let s=r.O_.shift();Dt(r).s_(),await lf(r,()=>r.remoteSyncer.rejectFailedWrite(s.batchId,i)),await Os(r)}}(n,e),hf(n)&&df(n)}async function gd(n,e){let t=j(n);t.asyncQueue.verifyOperationInProgress(),V("RemoteStore","RemoteStore received new credentials");let r=rn(t);t.L_.add(3),await Wr(t),r&&t.q_.set("Unknown"),await t.remoteSyncer.handleCredentialChange(e),t.L_.delete(3),await xs(t)}async function Iy(n,e){let t=j(n);e?(t.L_.delete(2),await xs(t)):e||(t.L_.add(2),await Wr(t),t.q_.set("Unknown"))}function zn(n){return n.K_||(n.K_=function(t,r,i){let s=j(t);return s.w_(),new Vc(r,s.connection,s.authCredentials,s.appCheckCredentials,s.serializer,i)}(n.datastore,n.asyncQueue,{Eo:ly.bind(null,n),Ro:hy.bind(null,n),mo:dy.bind(null,n),d_:fy.bind(null,n)}),n.B_.push(async e=>{e?(n.K_.s_(),mu(n)?pu(n):n.q_.set("Unknown")):(await n.K_.stop(),uf(n))})),n.K_}function Dt(n){return n.U_||(n.U_=function(t,r,i){let s=j(t);return s.w_(),new Lc(r,s.connection,s.authCredentials,s.appCheckCredentials,s.serializer,i)}(n.datastore,n.asyncQueue,{Eo:()=>Promise.resolve(),Ro:gy.bind(null,n),mo:vy.bind(null,n),f_:_y.bind(null,n),g_:yy.bind(null,n)}),n.B_.push(async e=>{e?(n.U_.s_(),await Os(n)):(await n.U_.stop(),n.O_.length>0&&(V("RemoteStore",`Stopping write stream with ${n.O_.length} pending writes`),n.O_=[]))})),n.U_}var qc=class n{constructor(e,t,r,i,s){this.asyncQueue=e,this.timerId=t,this.targetTimeMs=r,this.op=i,this.removalCallback=s,this.deferred=new je,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch(a=>{})}get promise(){return this.deferred.promise}static createAndSchedule(e,t,r,i,s){let a=Date.now()+r,c=new n(e,t,a,i,s);return c.start(r),c}start(e){this.timerHandle=setTimeout(()=>this.handleDelayElapsed(),e)}skipDelay(){return this.handleDelayElapsed()}cancel(e){this.timerHandle!==null&&(this.clearTimeout(),this.deferred.reject(new O(P.CANCELLED,"Operation cancelled"+(e?": "+e:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget(()=>this.timerHandle!==null?(this.clearTimeout(),this.op().then(e=>this.deferred.resolve(e))):Promise.resolve())}clearTimeout(){this.timerHandle!==null&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}};function gu(n,e){if(mt("AsyncQueue",`${e}: ${n}`),Hr(n))return new O(P.UNAVAILABLE,`${e}: ${n}`);throw n}var ps=class n{constructor(e){this.comparator=e?(t,r)=>e(t,r)||M.comparator(t.key,r.key):(t,r)=>M.comparator(t.key,r.key),this.keyedMap=Tr(),this.sortedSet=new ae(this.comparator)}static emptySet(e){return new n(e.comparator)}has(e){return this.keyedMap.get(e)!=null}get(e){return this.keyedMap.get(e)}first(){return this.sortedSet.minKey()}last(){return this.sortedSet.maxKey()}isEmpty(){return this.sortedSet.isEmpty()}indexOf(e){let t=this.keyedMap.get(e);return t?this.sortedSet.indexOf(t):-1}get size(){return this.sortedSet.size}forEach(e){this.sortedSet.inorderTraversal((t,r)=>(e(t),!1))}add(e){let t=this.delete(e.key);return t.copy(t.keyedMap.insert(e.key,e),t.sortedSet.insert(e,null))}delete(e){let t=this.get(e);return t?this.copy(this.keyedMap.remove(e),this.sortedSet.remove(t)):this}isEqual(e){if(!(e instanceof n)||this.size!==e.size)return!1;let t=this.sortedSet.getIterator(),r=e.sortedSet.getIterator();for(;t.hasNext();){let i=t.getNext().key,s=r.getNext().key;if(!i.isEqual(s))return!1}return!0}toString(){let e=[];return this.forEach(t=>{e.push(t.toString())}),e.length===0?"DocumentSet ()":`DocumentSet (
  `+e.join(`  
`)+`
)`}copy(e,t){let r=new n;return r.comparator=this.comparator,r.keyedMap=e,r.sortedSet=t,r}};var ms=class{constructor(){this.W_=new ae(M.comparator)}track(e){let t=e.doc.key,r=this.W_.get(t);r?e.type!==0&&r.type===3?this.W_=this.W_.insert(t,e):e.type===3&&r.type!==1?this.W_=this.W_.insert(t,{type:r.type,doc:e.doc}):e.type===2&&r.type===2?this.W_=this.W_.insert(t,{type:2,doc:e.doc}):e.type===2&&r.type===0?this.W_=this.W_.insert(t,{type:0,doc:e.doc}):e.type===1&&r.type===0?this.W_=this.W_.remove(t):e.type===1&&r.type===2?this.W_=this.W_.insert(t,{type:1,doc:r.doc}):e.type===0&&r.type===1?this.W_=this.W_.insert(t,{type:2,doc:e.doc}):q():this.W_=this.W_.insert(t,e)}G_(){let e=[];return this.W_.inorderTraversal((t,r)=>{e.push(r)}),e}},Fn=class n{constructor(e,t,r,i,s,a,c,l,d){this.query=e,this.docs=t,this.oldDocs=r,this.docChanges=i,this.mutatedKeys=s,this.fromCache=a,this.syncStateChanged=c,this.excludesMetadataChanges=l,this.hasCachedResults=d}static fromInitialDocuments(e,t,r,i,s){let a=[];return t.forEach(c=>{a.push({type:0,doc:c})}),new n(e,t,ps.emptySet(t),a,r,i,!0,!1,s)}get hasPendingWrites(){return!this.mutatedKeys.isEmpty()}isEqual(e){if(!(this.fromCache===e.fromCache&&this.hasCachedResults===e.hasCachedResults&&this.syncStateChanged===e.syncStateChanged&&this.mutatedKeys.isEqual(e.mutatedKeys)&&ks(this.query,e.query)&&this.docs.isEqual(e.docs)&&this.oldDocs.isEqual(e.oldDocs)))return!1;let t=this.docChanges,r=e.docChanges;if(t.length!==r.length)return!1;for(let i=0;i<t.length;i++)if(t[i].type!==r[i].type||!t[i].doc.isEqual(r[i].doc))return!1;return!0}};var Bc=class{constructor(){this.z_=void 0,this.j_=[]}H_(){return this.j_.some(e=>e.J_())}},jc=class{constructor(){this.queries=_d(),this.onlineState="Unknown",this.Y_=new Set}terminate(){(function(t,r){let i=j(t),s=i.queries;i.queries=_d(),s.forEach((a,c)=>{for(let l of c.j_)l.onError(r)})})(this,new O(P.ABORTED,"Firestore shutting down"))}};function _d(){return new Nt(n=>Fd(n),ks)}async function _u(n,e){let t=j(n),r=3,i=e.query,s=t.queries.get(i);s?!s.H_()&&e.J_()&&(r=2):(s=new Bc,r=e.J_()?0:1);try{switch(r){case 0:s.z_=await t.onListen(i,!0);break;case 1:s.z_=await t.onListen(i,!1);break;case 2:await t.onFirstRemoteStoreListen(i)}}catch(a){let c=gu(a,`Initialization of query '${En(e.query)}' failed`);return void e.onError(c)}t.queries.set(i,s),s.j_.push(e),e.Z_(t.onlineState),s.z_&&e.X_(s.z_)&&vu(t)}async function yu(n,e){let t=j(n),r=e.query,i=3,s=t.queries.get(r);if(s){let a=s.j_.indexOf(e);a>=0&&(s.j_.splice(a,1),s.j_.length===0?i=e.J_()?0:1:!s.H_()&&e.J_()&&(i=2))}switch(i){case 0:return t.queries.delete(r),t.onUnlisten(r,!0);case 1:return t.queries.delete(r),t.onUnlisten(r,!1);case 2:return t.onLastRemoteStoreUnlisten(r);default:return}}function wy(n,e){let t=j(n),r=!1;for(let i of e){let s=i.query,a=t.queries.get(s);if(a){for(let c of a.j_)c.X_(i)&&(r=!0);a.z_=i}}r&&vu(t)}function Ey(n,e,t){let r=j(n),i=r.queries.get(e);if(i)for(let s of i.j_)s.onError(t);r.queries.delete(e)}function vu(n){n.Y_.forEach(e=>{e.next()})}var zc,yd;(yd=zc||(zc={})).ea="default",yd.Cache="cache";var Mr=class{constructor(e,t,r){this.query=e,this.ta=t,this.na=!1,this.ra=null,this.onlineState="Unknown",this.options=r||{}}X_(e){if(!this.options.includeMetadataChanges){let r=[];for(let i of e.docChanges)i.type!==3&&r.push(i);e=new Fn(e.query,e.docs,e.oldDocs,r,e.mutatedKeys,e.fromCache,e.syncStateChanged,!0,e.hasCachedResults)}let t=!1;return this.na?this.ia(e)&&(this.ta.next(e),t=!0):this.sa(e,this.onlineState)&&(this.oa(e),t=!0),this.ra=e,t}onError(e){this.ta.error(e)}Z_(e){this.onlineState=e;let t=!1;return this.ra&&!this.na&&this.sa(this.ra,e)&&(this.oa(this.ra),t=!0),t}sa(e,t){if(!e.fromCache||!this.J_())return!0;let r=t!=="Offline";return(!this.options._a||!r)&&(!e.docs.isEmpty()||e.hasCachedResults||t==="Offline")}ia(e){if(e.docChanges.length>0)return!0;let t=this.ra&&this.ra.hasPendingWrites!==e.hasPendingWrites;return!(!e.syncStateChanged&&!t)&&this.options.includeMetadataChanges===!0}oa(e){e=Fn.fromInitialDocuments(e.query,e.docs,e.mutatedKeys,e.fromCache,e.hasCachedResults),this.na=!0,this.ta.next(e)}J_(){return this.options.source!==zc.Cache}};var gs=class{constructor(e){this.key=e}},_s=class{constructor(e){this.key=e}},Gc=class{constructor(e,t){this.query=e,this.Ta=t,this.Ea=null,this.hasCachedResults=!1,this.current=!1,this.da=H(),this.mutatedKeys=H(),this.Aa=Ud(e),this.Ra=new ps(this.Aa)}get Va(){return this.Ta}ma(e,t){let r=t?t.fa:new ms,i=t?t.Ra:this.Ra,s=t?t.mutatedKeys:this.mutatedKeys,a=i,c=!1,l=this.query.limitType==="F"&&i.size===this.query.limit?i.last():null,d=this.query.limitType==="L"&&i.size===this.query.limit?i.first():null;if(e.inorderTraversal((p,g)=>{let v=i.get(p),w=Ns(this.query,g)?g:null,R=!!v&&this.mutatedKeys.has(v.key),D=!!w&&(w.hasLocalMutations||this.mutatedKeys.has(w.key)&&w.hasCommittedMutations),C=!1;v&&w?v.data.isEqual(w.data)?R!==D&&(r.track({type:3,doc:w}),C=!0):this.ga(v,w)||(r.track({type:2,doc:w}),C=!0,(l&&this.Aa(w,l)>0||d&&this.Aa(w,d)<0)&&(c=!0)):!v&&w?(r.track({type:0,doc:w}),C=!0):v&&!w&&(r.track({type:1,doc:v}),C=!0,(l||d)&&(c=!0)),C&&(w?(a=a.add(w),s=D?s.add(p):s.delete(p)):(a=a.delete(p),s=s.delete(p)))}),this.query.limit!==null)for(;a.size>this.query.limit;){let p=this.query.limitType==="F"?a.last():a.first();a=a.delete(p.key),s=s.delete(p.key),r.track({type:1,doc:p})}return{Ra:a,fa:r,ns:c,mutatedKeys:s}}ga(e,t){return e.hasLocalMutations&&t.hasCommittedMutations&&!t.hasLocalMutations}applyChanges(e,t,r,i){let s=this.Ra;this.Ra=e.Ra,this.mutatedKeys=e.mutatedKeys;let a=e.fa.G_();a.sort((p,g)=>function(w,R){let D=C=>{switch(C){case 0:return 1;case 2:case 3:return 2;case 1:return 0;default:return q()}};return D(w)-D(R)}(p.type,g.type)||this.Aa(p.doc,g.doc)),this.pa(r),i=i!=null&&i;let c=t&&!i?this.ya():[],l=this.da.size===0&&this.current&&!i?1:0,d=l!==this.Ea;return this.Ea=l,a.length!==0||d?{snapshot:new Fn(this.query,e.Ra,s,a,e.mutatedKeys,l===0,d,!1,!!r&&r.resumeToken.approximateByteSize()>0),wa:c}:{wa:c}}Z_(e){return this.current&&e==="Offline"?(this.current=!1,this.applyChanges({Ra:this.Ra,fa:new ms,mutatedKeys:this.mutatedKeys,ns:!1},!1)):{wa:[]}}Sa(e){return!this.Ta.has(e)&&!!this.Ra.has(e)&&!this.Ra.get(e).hasLocalMutations}pa(e){e&&(e.addedDocuments.forEach(t=>this.Ta=this.Ta.add(t)),e.modifiedDocuments.forEach(t=>{}),e.removedDocuments.forEach(t=>this.Ta=this.Ta.delete(t)),this.current=e.current)}ya(){if(!this.current)return[];let e=this.da;this.da=H(),this.Ra.forEach(r=>{this.Sa(r.key)&&(this.da=this.da.add(r.key))});let t=[];return e.forEach(r=>{this.da.has(r)||t.push(new _s(r))}),this.da.forEach(r=>{e.has(r)||t.push(new gs(r))}),t}ba(e){this.Ta=e.Ts,this.da=H();let t=this.ma(e.documents);return this.applyChanges(t,!0)}Da(){return Fn.fromInitialDocuments(this.query,this.Ra,this.mutatedKeys,this.Ea===0,this.hasCachedResults)}},$c=class{constructor(e,t,r){this.query=e,this.targetId=t,this.view=r}},Kc=class{constructor(e){this.key=e,this.va=!1}},Hc=class{constructor(e,t,r,i,s,a){this.localStore=e,this.remoteStore=t,this.eventManager=r,this.sharedClientState=i,this.currentUser=s,this.maxConcurrentLimboResolutions=a,this.Ca={},this.Fa=new Nt(c=>Fd(c),ks),this.Ma=new Map,this.xa=new Set,this.Oa=new ae(M.comparator),this.Na=new Map,this.La=new Lr,this.Ba={},this.ka=new Map,this.qa=Vr.kn(),this.onlineState="Unknown",this.Qa=void 0}get isPrimaryClient(){return this.Qa===!0}};async function Ty(n,e,t=!0){let r=yf(n),i,s=r.Fa.get(e);return s?(r.sharedClientState.addLocalQueryTarget(s.targetId),i=s.view.Da()):i=await ff(r,e,t,!0),i}async function by(n,e){let t=yf(n);await ff(t,e,!0,!1)}async function ff(n,e,t,r){let i=await ay(n.localStore,Ze(e)),s=i.targetId,a=n.sharedClientState.addLocalQueryTarget(s,t),c;return r&&(c=await Ay(n,e,s,a==="current",i.resumeToken)),n.isPrimaryClient&&t&&af(n.remoteStore,i),c}async function Ay(n,e,t,r,i){n.Ka=(g,v,w)=>async function(D,C,U,B){let F=C.view.ma(U);F.ns&&(F=await md(D.localStore,C.query,!1).then(({documents:E})=>C.view.ma(E,F)));let z=B&&B.targetChanges.get(C.targetId),se=B&&B.targetMismatches.get(C.targetId)!=null,K=C.view.applyChanges(F,D.isPrimaryClient,z,se);return Id(D,C.targetId,K.wa),K.snapshot}(n,g,v,w);let s=await md(n.localStore,e,!0),a=new Gc(e,s.Ts),c=a.ma(s.documents),l=xr.createSynthesizedTargetChangeForCurrentChange(t,r&&n.onlineState!=="Offline",i),d=a.applyChanges(c,n.isPrimaryClient,l);Id(n,t,d.wa);let p=new $c(e,t,a);return n.Fa.set(e,p),n.Ma.has(t)?n.Ma.get(t).push(e):n.Ma.set(t,[e]),d.snapshot}async function Sy(n,e,t){let r=j(n),i=r.Fa.get(e),s=r.Ma.get(i.targetId);if(s.length>1)return r.Ma.set(i.targetId,s.filter(a=>!ks(a,e))),void r.Fa.delete(e);r.isPrimaryClient?(r.sharedClientState.removeLocalQueryTarget(i.targetId),r.sharedClientState.isActiveQueryTarget(i.targetId)||await kc(r.localStore,i.targetId,!1).then(()=>{r.sharedClientState.clearQueryState(i.targetId),t&&du(r.remoteStore,i.targetId),Wc(r,i.targetId)}).catch(Kr)):(Wc(r,i.targetId),await kc(r.localStore,i.targetId,!0))}async function Ry(n,e){let t=j(n),r=t.Fa.get(e),i=t.Ma.get(r.targetId);t.isPrimaryClient&&i.length===1&&(t.sharedClientState.removeLocalQueryTarget(r.targetId),du(t.remoteStore,r.targetId))}async function Py(n,e,t){let r=Vy(n);try{let i=await function(a,c){let l=j(a),d=ye.now(),p=c.reduce((w,R)=>w.add(R.key),H()),g,v;return l.persistence.runTransaction("Locally write mutations","readwrite",w=>{let R=_t(),D=H();return l.cs.getEntries(w,p).next(C=>{R=C,R.forEach((U,B)=>{B.isValidDocument()||(D=D.add(U))})}).next(()=>l.localDocuments.getOverlayedDocuments(w,R)).next(C=>{g=C;let U=[];for(let B of c){let F=V_(B,g.get(B.key).overlayedDocument);F!=null&&U.push(new nt(B.key,F,Nd(F.value.mapValue),pt.exists(!0)))}return l.mutationQueue.addMutationBatch(w,d,U,c)}).next(C=>{v=C;let U=C.applyToLocalDocumentSet(g,D);return l.documentOverlayCache.saveOverlays(w,C.batchId,U)})}).then(()=>({batchId:v.batchId,changes:Bd(g)}))}(r.localStore,e);r.sharedClientState.addPendingMutation(i.batchId),function(a,c,l){let d=a.Ba[a.currentUser.toKey()];d||(d=new ae(J)),d=d.insert(c,l),a.Ba[a.currentUser.toKey()]=d}(r,i.batchId,t),await Qr(r,i.changes),await Os(r.remoteStore)}catch(i){let s=gu(i,"Failed to persist write");t.reject(s)}}async function pf(n,e){let t=j(n);try{let r=await iy(t.localStore,e);e.targetChanges.forEach((i,s)=>{let a=t.Na.get(s);a&&(Y(i.addedDocuments.size+i.modifiedDocuments.size+i.removedDocuments.size<=1),i.addedDocuments.size>0?a.va=!0:i.modifiedDocuments.size>0?Y(a.va):i.removedDocuments.size>0&&(Y(a.va),a.va=!1))}),await Qr(t,r,e)}catch(r){await Kr(r)}}function vd(n,e,t){let r=j(n);if(r.isPrimaryClient&&t===0||!r.isPrimaryClient&&t===1){let i=[];r.Fa.forEach((s,a)=>{let c=a.view.Z_(e);c.snapshot&&i.push(c.snapshot)}),function(a,c){let l=j(a);l.onlineState=c;let d=!1;l.queries.forEach((p,g)=>{for(let v of g.j_)v.Z_(c)&&(d=!0)}),d&&vu(l)}(r.eventManager,e),i.length&&r.Ca.d_(i),r.onlineState=e,r.isPrimaryClient&&r.sharedClientState.setOnlineState(e)}}async function Cy(n,e,t){let r=j(n);r.sharedClientState.updateQueryState(e,"rejected",t);let i=r.Na.get(e),s=i&&i.key;if(s){let a=new ae(M.comparator);a=a.insert(s,ze.newNoDocument(s,G.min()));let c=H().add(s),l=new rs(G.min(),new Map,new ae(J),a,c);await pf(r,l),r.Oa=r.Oa.remove(s),r.Na.delete(e),Iu(r)}else await kc(r.localStore,e,!1).then(()=>Wc(r,e,t)).catch(Kr)}async function ky(n,e){let t=j(n),r=e.batch.batchId;try{let i=await ry(t.localStore,e);gf(t,r,null),mf(t,r),t.sharedClientState.updateMutationState(r,"acknowledged"),await Qr(t,i)}catch(i){await Kr(i)}}async function Ny(n,e,t){let r=j(n);try{let i=await function(a,c){let l=j(a);return l.persistence.runTransaction("Reject batch","readwrite-primary",d=>{let p;return l.mutationQueue.lookupMutationBatch(d,c).next(g=>(Y(g!==null),p=g.keys(),l.mutationQueue.removeMutationBatch(d,g))).next(()=>l.mutationQueue.performConsistencyCheck(d)).next(()=>l.documentOverlayCache.removeOverlaysForBatchId(d,p,c)).next(()=>l.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(d,p)).next(()=>l.localDocuments.getDocuments(d,p))})}(r.localStore,e);gf(r,e,t),mf(r,e),r.sharedClientState.updateMutationState(e,"rejected",t),await Qr(r,i)}catch(i){await Kr(i)}}function mf(n,e){(n.ka.get(e)||[]).forEach(t=>{t.resolve()}),n.ka.delete(e)}function gf(n,e,t){let r=j(n),i=r.Ba[r.currentUser.toKey()];if(i){let s=i.get(e);s&&(t?s.reject(t):s.resolve(),i=i.remove(e)),r.Ba[r.currentUser.toKey()]=i}}function Wc(n,e,t=null){n.sharedClientState.removeLocalQueryTarget(e);for(let r of n.Ma.get(e))n.Fa.delete(r),t&&n.Ca.$a(r,t);n.Ma.delete(e),n.isPrimaryClient&&n.La.gr(e).forEach(r=>{n.La.containsKey(r)||_f(n,r)})}function _f(n,e){n.xa.delete(e.path.canonicalString());let t=n.Oa.get(e);t!==null&&(du(n.remoteStore,t),n.Oa=n.Oa.remove(e),n.Na.delete(t),Iu(n))}function Id(n,e,t){for(let r of t)r instanceof gs?(n.La.addReference(r.key,e),Dy(n,r)):r instanceof _s?(V("SyncEngine","Document no longer in limbo: "+r.key),n.La.removeReference(r.key,e),n.La.containsKey(r.key)||_f(n,r.key)):q()}function Dy(n,e){let t=e.key,r=t.path.canonicalString();n.Oa.get(t)||n.xa.has(r)||(V("SyncEngine","New document in limbo: "+t),n.xa.add(r),Iu(n))}function Iu(n){for(;n.xa.size>0&&n.Oa.size<n.maxConcurrentLimboResolutions;){let e=n.xa.values().next().value;n.xa.delete(e);let t=new M(re.fromString(e)),r=n.qa.next();n.Na.set(r,new Kc(t)),n.Oa=n.Oa.insert(t,r),af(n.remoteStore,new Or(Ze(Cs(t.path)),r,"TargetPurposeLimboResolution",Pr.oe))}}async function Qr(n,e,t){let r=j(n),i=[],s=[],a=[];r.Fa.isEmpty()||(r.Fa.forEach((c,l)=>{a.push(r.Ka(l,e,t).then(d=>{var p;if((d||t)&&r.isPrimaryClient){let g=d?!d.fromCache:(p=t==null?void 0:t.targetChanges.get(l.targetId))===null||p===void 0?void 0:p.current;r.sharedClientState.updateQueryState(l.targetId,g?"current":"not-current")}if(d){i.push(d);let g=Sc.Wi(l.targetId,d);s.push(g)}}))}),await Promise.all(a),r.Ca.d_(i),await async function(l,d){let p=j(l);try{await p.persistence.runTransaction("notifyLocalViewChanges","readwrite",g=>N.forEach(d,v=>N.forEach(v.$i,w=>p.persistence.referenceDelegate.addReference(g,v.targetId,w)).next(()=>N.forEach(v.Ui,w=>p.persistence.referenceDelegate.removeReference(g,v.targetId,w)))))}catch(g){if(!Hr(g))throw g;V("LocalStore","Failed to update sequence numbers: "+g)}for(let g of d){let v=g.targetId;if(!g.fromCache){let w=p.os.get(v),R=w.snapshotVersion,D=w.withLastLimboFreeSnapshotVersion(R);p.os=p.os.insert(v,D)}}}(r.localStore,s))}async function xy(n,e){let t=j(n);if(!t.currentUser.isEqual(e)){V("SyncEngine","User change. New user:",e.toKey());let r=await sf(t.localStore,e);t.currentUser=e,function(s,a){s.ka.forEach(c=>{c.forEach(l=>{l.reject(new O(P.CANCELLED,a))})}),s.ka.clear()}(t,"'waitForPendingWrites' promise is rejected due to a user change."),t.sharedClientState.handleUserChange(e,r.removedBatchIds,r.addedBatchIds),await Qr(t,r.hs)}}function Oy(n,e){let t=j(n),r=t.Na.get(e);if(r&&r.va)return H().add(r.key);{let i=H(),s=t.Ma.get(e);if(!s)return i;for(let a of s){let c=t.Fa.get(a);i=i.unionWith(c.view.Va)}return i}}function yf(n){let e=j(n);return e.remoteStore.remoteSyncer.applyRemoteEvent=pf.bind(null,e),e.remoteStore.remoteSyncer.getRemoteKeysForTarget=Oy.bind(null,e),e.remoteStore.remoteSyncer.rejectListen=Cy.bind(null,e),e.Ca.d_=wy.bind(null,e.eventManager),e.Ca.$a=Ey.bind(null,e.eventManager),e}function Vy(n){let e=j(n);return e.remoteStore.remoteSyncer.applySuccessfulWrite=ky.bind(null,e),e.remoteStore.remoteSyncer.rejectFailedWrite=Ny.bind(null,e),e}var Un=class{constructor(){this.kind="memory",this.synchronizeTabs=!1}async initialize(e){this.serializer=Ds(e.databaseInfo.databaseId),this.sharedClientState=this.Wa(e),this.persistence=this.Ga(e),await this.persistence.start(),this.localStore=this.za(e),this.gcScheduler=this.ja(e,this.localStore),this.indexBackfillerScheduler=this.Ha(e,this.localStore)}ja(e,t){return null}Ha(e,t){return null}za(e){return ny(this.persistence,new Pc,e.initialUser,this.serializer)}Ga(e){return new Tc(Ac.Zr,this.serializer)}Wa(e){return new Nc}async terminate(){var e,t;(e=this.gcScheduler)===null||e===void 0||e.stop(),(t=this.indexBackfillerScheduler)===null||t===void 0||t.stop(),this.sharedClientState.shutdown(),await this.persistence.shutdown()}};Un.provider={build:()=>new Un};var Fr=class{async initialize(e,t){this.localStore||(this.localStore=e.localStore,this.sharedClientState=e.sharedClientState,this.datastore=this.createDatastore(t),this.remoteStore=this.createRemoteStore(t),this.eventManager=this.createEventManager(t),this.syncEngine=this.createSyncEngine(t,!e.synchronizeTabs),this.sharedClientState.onlineStateHandler=r=>vd(this.syncEngine,r,1),this.remoteStore.remoteSyncer.handleCredentialChange=xy.bind(null,this.syncEngine),await Iy(this.remoteStore,this.syncEngine.isPrimaryClient))}createEventManager(e){return function(){return new jc}()}createDatastore(e){let t=Ds(e.databaseInfo.databaseId),r=function(s){return new Oc(s)}(e.databaseInfo);return function(s,a,c,l){return new Mc(s,a,c,l)}(e.authCredentials,e.appCheckCredentials,r,t)}createRemoteStore(e){return function(r,i,s,a,c){return new Uc(r,i,s,a,c)}(this.localStore,this.datastore,e.asyncQueue,t=>vd(this.syncEngine,t,0),function(){return ls.D()?new ls:new Dc}())}createSyncEngine(e,t){return function(i,s,a,c,l,d,p){let g=new Hc(i,s,a,c,l,d);return p&&(g.Qa=!0),g}(this.localStore,this.remoteStore,this.eventManager,this.sharedClientState,e.initialUser,e.maxConcurrentLimboResolutions,t)}async terminate(){var e,t;await async function(i){let s=j(i);V("RemoteStore","RemoteStore shutting down."),s.L_.add(5),await Wr(s),s.k_.shutdown(),s.q_.set("Unknown")}(this.remoteStore),(e=this.datastore)===null||e===void 0||e.terminate(),(t=this.eventManager)===null||t===void 0||t.terminate()}};Fr.provider={build:()=>new Fr};var Ur=class{constructor(e){this.observer=e,this.muted=!1}next(e){this.muted||this.observer.next&&this.Ya(this.observer.next,e)}error(e){this.muted||(this.observer.error?this.Ya(this.observer.error,e):mt("Uncaught Error in snapshot listener:",e.toString()))}Za(){this.muted=!0}Ya(e,t){setTimeout(()=>{this.muted||e(t)},0)}};var Qc=class{constructor(e,t,r,i,s){this.authCredentials=e,this.appCheckCredentials=t,this.asyncQueue=r,this.databaseInfo=i,this.user=ge.UNAUTHENTICATED,this.clientId=Yi.newId(),this.authCredentialListener=()=>Promise.resolve(),this.appCheckCredentialListener=()=>Promise.resolve(),this._uninitializedComponentsProvider=s,this.authCredentials.start(r,async a=>{V("FirestoreClient","Received user=",a.uid),await this.authCredentialListener(a),this.user=a}),this.appCheckCredentials.start(r,a=>(V("FirestoreClient","Received new app check token=",a),this.appCheckCredentialListener(a,this.user)))}get configuration(){return{asyncQueue:this.asyncQueue,databaseInfo:this.databaseInfo,clientId:this.clientId,authCredentials:this.authCredentials,appCheckCredentials:this.appCheckCredentials,initialUser:this.user,maxConcurrentLimboResolutions:100}}setCredentialChangeListener(e){this.authCredentialListener=e}setAppCheckTokenChangeListener(e){this.appCheckCredentialListener=e}terminate(){this.asyncQueue.enterRestrictedMode();let e=new je;return this.asyncQueue.enqueueAndForgetEvenWhileRestricted(async()=>{try{this._onlineComponents&&await this._onlineComponents.terminate(),this._offlineComponents&&await this._offlineComponents.terminate(),this.authCredentials.shutdown(),this.appCheckCredentials.shutdown(),e.resolve()}catch(t){let r=gu(t,"Failed to shutdown persistence");e.reject(r)}}),e.promise}};async function Sa(n,e){n.asyncQueue.verifyOperationInProgress(),V("FirestoreClient","Initializing OfflineComponentProvider");let t=n.configuration;await e.initialize(t);let r=t.initialUser;n.setCredentialChangeListener(async i=>{r.isEqual(i)||(await sf(e.localStore,i),r=i)}),e.persistence.setDatabaseDeletedListener(()=>n.terminate()),n._offlineComponents=e}async function wd(n,e){n.asyncQueue.verifyOperationInProgress();let t=await Ly(n);V("FirestoreClient","Initializing OnlineComponentProvider"),await e.initialize(t,n.configuration),n.setCredentialChangeListener(r=>gd(e.remoteStore,r)),n.setAppCheckTokenChangeListener((r,i)=>gd(e.remoteStore,i)),n._onlineComponents=e}async function Ly(n){if(!n._offlineComponents)if(n._uninitializedComponentsProvider){V("FirestoreClient","Using user provided OfflineComponentProvider");try{await Sa(n,n._uninitializedComponentsProvider._offline)}catch(e){let t=e;if(!function(i){return i.name==="FirebaseError"?i.code===P.FAILED_PRECONDITION||i.code===P.UNIMPLEMENTED:!(typeof DOMException!="undefined"&&i instanceof DOMException)||i.code===22||i.code===20||i.code===11}(t))throw t;Pn("Error using user provided cache. Falling back to memory cache: "+t),await Sa(n,new Un)}}else V("FirestoreClient","Using default OfflineComponentProvider"),await Sa(n,new Un);return n._offlineComponents}async function vf(n){return n._onlineComponents||(n._uninitializedComponentsProvider?(V("FirestoreClient","Using user provided OnlineComponentProvider"),await wd(n,n._uninitializedComponentsProvider._online)):(V("FirestoreClient","Using default OnlineComponentProvider"),await wd(n,new Fr))),n._onlineComponents}function My(n){return vf(n).then(e=>e.syncEngine)}async function ys(n){let e=await vf(n),t=e.eventManager;return t.onListen=Ty.bind(null,e.syncEngine),t.onUnlisten=Sy.bind(null,e.syncEngine),t.onFirstRemoteStoreListen=by.bind(null,e.syncEngine),t.onLastRemoteStoreUnlisten=Ry.bind(null,e.syncEngine),t}function Fy(n,e,t={}){let r=new je;return n.asyncQueue.enqueueAndForget(async()=>function(s,a,c,l,d){let p=new Ur({next:v=>{p.Za(),a.enqueueAndForget(()=>yu(s,g));let w=v.docs.has(c);!w&&v.fromCache?d.reject(new O(P.UNAVAILABLE,"Failed to get document because the client is offline.")):w&&v.fromCache&&l&&l.source==="server"?d.reject(new O(P.UNAVAILABLE,'Failed to get document from server. (However, this document does exist in the local cache. Run again without setting source to "server" to retrieve the cached document.)')):d.resolve(v)},error:v=>d.reject(v)}),g=new Mr(Cs(c.path),p,{includeMetadataChanges:!0,_a:!0});return _u(s,g)}(await ys(n),n.asyncQueue,e,t,r)),r.promise}function Uy(n,e,t={}){let r=new je;return n.asyncQueue.enqueueAndForget(async()=>function(s,a,c,l,d){let p=new Ur({next:v=>{p.Za(),a.enqueueAndForget(()=>yu(s,g)),v.fromCache&&l.source==="server"?d.reject(new O(P.UNAVAILABLE,'Failed to get documents from server. (However, these documents may exist in the local cache. Run again without setting source to "server" to retrieve the cached documents.)')):d.resolve(v)},error:v=>d.reject(v)}),g=new Mr(c,p,{includeMetadataChanges:!0,_a:!0});return _u(s,g)}(await ys(n),n.asyncQueue,e,t,r)),r.promise}function If(n){let e={};return n.timeoutSeconds!==void 0&&(e.timeoutSeconds=n.timeoutSeconds),e}var Ed=new Map;function wf(n,e,t){if(!t)throw new O(P.INVALID_ARGUMENT,`Function ${n}() cannot be called with an empty ${e}.`)}function qy(n,e,t,r){if(e===!0&&r===!0)throw new O(P.INVALID_ARGUMENT,`${n} and ${t} cannot be used together.`)}function Td(n){if(!M.isDocumentKey(n))throw new O(P.INVALID_ARGUMENT,`Invalid document reference. Document references must have an even number of segments, but ${n} has ${n.length}.`)}function bd(n){if(M.isDocumentKey(n))throw new O(P.INVALID_ARGUMENT,`Invalid collection reference. Collection references must have an odd number of segments, but ${n} has ${n.length}.`)}function Vs(n){if(n===void 0)return"undefined";if(n===null)return"null";if(typeof n=="string")return n.length>20&&(n=`${n.substring(0,20)}...`),JSON.stringify(n);if(typeof n=="number"||typeof n=="boolean")return""+n;if(typeof n=="object"){if(n instanceof Array)return"an array";{let e=function(r){return r.constructor?r.constructor.name:null}(n);return e?`a custom ${e} object`:"an object"}}return typeof n=="function"?"a function":q()}function Ue(n,e){if("_delegate"in n&&(n=n._delegate),!(n instanceof e)){if(e.name===n.constructor.name)throw new O(P.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{let t=Vs(n);throw new O(P.INVALID_ARGUMENT,`Expected type '${e.name}', but it was: ${t}`)}}return n}var vs=class{constructor(e){var t,r;if(e.host===void 0){if(e.ssl!==void 0)throw new O(P.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host="firestore.googleapis.com",this.ssl=!0}else this.host=e.host,this.ssl=(t=e.ssl)===null||t===void 0||t;if(this.credentials=e.credentials,this.ignoreUndefinedProperties=!!e.ignoreUndefinedProperties,this.localCache=e.localCache,e.cacheSizeBytes===void 0)this.cacheSizeBytes=41943040;else{if(e.cacheSizeBytes!==-1&&e.cacheSizeBytes<1048576)throw new O(P.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=e.cacheSizeBytes}qy("experimentalForceLongPolling",e.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",e.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!e.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:e.experimentalAutoDetectLongPolling===void 0?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!e.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=If((r=e.experimentalLongPollingOptions)!==null&&r!==void 0?r:{}),function(s){if(s.timeoutSeconds!==void 0){if(isNaN(s.timeoutSeconds))throw new O(P.INVALID_ARGUMENT,`invalid long polling timeout: ${s.timeoutSeconds} (must not be NaN)`);if(s.timeoutSeconds<5)throw new O(P.INVALID_ARGUMENT,`invalid long polling timeout: ${s.timeoutSeconds} (minimum allowed value is 5)`);if(s.timeoutSeconds>30)throw new O(P.INVALID_ARGUMENT,`invalid long polling timeout: ${s.timeoutSeconds} (maximum allowed value is 30)`)}}(this.experimentalLongPollingOptions),this.useFetchStreams=!!e.useFetchStreams}isEqual(e){return this.host===e.host&&this.ssl===e.ssl&&this.credentials===e.credentials&&this.cacheSizeBytes===e.cacheSizeBytes&&this.experimentalForceLongPolling===e.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===e.experimentalAutoDetectLongPolling&&function(r,i){return r.timeoutSeconds===i.timeoutSeconds}(this.experimentalLongPollingOptions,e.experimentalLongPollingOptions)&&this.ignoreUndefinedProperties===e.ignoreUndefinedProperties&&this.useFetchStreams===e.useFetchStreams}},qn=class{constructor(e,t,r,i){this._authCredentials=e,this._appCheckCredentials=t,this._databaseId=r,this._app=i,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new vs({}),this._settingsFrozen=!1,this._terminateTask="notTerminated"}get app(){if(!this._app)throw new O(P.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return this._terminateTask!=="notTerminated"}_setSettings(e){if(this._settingsFrozen)throw new O(P.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new vs(e),e.credentials!==void 0&&(this._authCredentials=function(r){if(!r)return new Ra;switch(r.type){case"firstParty":return new Na(r.sessionIndex||"0",r.iamToken||null,r.authTokenFactory||null);case"provider":return r.client;default:throw new O(P.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}}(e.credentials))}_getSettings(){return this._settings}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask==="notTerminated"&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){this._terminateTask==="notTerminated"?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return function(t){let r=Ed.get(t);r&&(V("ComponentProvider","Removing Datastore"),Ed.delete(t),r.terminate())}(this),Promise.resolve()}};function By(n,e,t,r={}){var i;let s=(n=Ue(n,qn))._getSettings(),a=`${e}:${t}`;if(s.host!=="firestore.googleapis.com"&&s.host!==a&&Pn("Host has been set in both settings() and connectFirestoreEmulator(), emulator host will be used."),n._setSettings(Object.assign(Object.assign({},s),{host:a,ssl:!1})),r.mockUserToken){let c,l;if(typeof r.mockUserToken=="string")c=r.mockUserToken,l=ge.MOCK_USER;else{c=qi(r.mockUserToken,(i=n._app)===null||i===void 0?void 0:i.options.projectId);let d=r.mockUserToken.sub||r.mockUserToken.user_id;if(!d)throw new O(P.INVALID_ARGUMENT,"mockUserToken must contain 'sub' or 'user_id' field!");l=new ge(d)}n._authCredentials=new Pa(new Ji(c,l))}}var tn=class n{constructor(e,t,r){this.converter=t,this._query=r,this.type="query",this.firestore=e}withConverter(e){return new n(this.firestore,e,this._query)}},Re=class n{constructor(e,t,r){this.converter=t,this._key=r,this.type="document",this.firestore=e}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new Ct(this.firestore,this.converter,this._key.path.popLast())}withConverter(e){return new n(this.firestore,e,this._key)}},Ct=class n extends tn{constructor(e,t,r){super(e,t,Cs(r)),this._path=r,this.type="collection"}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){let e=this._path.popLast();return e.isEmpty()?null:new Re(this.firestore,null,new M(e))}withConverter(e){return new n(this.firestore,e,this._path)}};function yt(n,e,...t){if(n=ee(n),wf("collection","path",e),n instanceof qn){let r=re.fromString(e,...t);return bd(r),new Ct(n,null,r)}{if(!(n instanceof Re||n instanceof Ct))throw new O(P.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");let r=n._path.child(re.fromString(e,...t));return bd(r),new Ct(n.firestore,null,r)}}function ve(n,e,...t){if(n=ee(n),arguments.length===1&&(e=Yi.newId()),wf("doc","path",e),n instanceof qn){let r=re.fromString(e,...t);return Td(r),new Re(n,null,new M(r))}{if(!(n instanceof Re||n instanceof Ct))throw new O(P.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");let r=n._path.child(re.fromString(e,...t));return Td(r),new Re(n.firestore,n instanceof Ct?n.converter:null,new M(r))}}var Is=class{constructor(e=Promise.resolve()){this.Pu=[],this.Iu=!1,this.Tu=[],this.Eu=null,this.du=!1,this.Au=!1,this.Ru=[],this.t_=new hs(this,"async_queue_retry"),this.Vu=()=>{let r=Aa();r&&V("AsyncQueue","Visibility state changed to "+r.visibilityState),this.t_.jo()},this.mu=e;let t=Aa();t&&typeof t.addEventListener=="function"&&t.addEventListener("visibilitychange",this.Vu)}get isShuttingDown(){return this.Iu}enqueueAndForget(e){this.enqueue(e)}enqueueAndForgetEvenWhileRestricted(e){this.fu(),this.gu(e)}enterRestrictedMode(e){if(!this.Iu){this.Iu=!0,this.Au=e||!1;let t=Aa();t&&typeof t.removeEventListener=="function"&&t.removeEventListener("visibilitychange",this.Vu)}}enqueue(e){if(this.fu(),this.Iu)return new Promise(()=>{});let t=new je;return this.gu(()=>this.Iu&&this.Au?Promise.resolve():(e().then(t.resolve,t.reject),t.promise)).then(()=>t.promise)}enqueueRetryable(e){this.enqueueAndForget(()=>(this.Pu.push(e),this.pu()))}async pu(){if(this.Pu.length!==0){try{await this.Pu[0](),this.Pu.shift(),this.t_.reset()}catch(e){if(!Hr(e))throw e;V("AsyncQueue","Operation failed with retryable error: "+e)}this.Pu.length>0&&this.t_.Go(()=>this.pu())}}gu(e){let t=this.mu.then(()=>(this.du=!0,e().catch(r=>{this.Eu=r,this.du=!1;let i=function(a){let c=a.message||"";return a.stack&&(c=a.stack.includes(a.message)?a.stack:a.message+`
`+a.stack),c}(r);throw mt("INTERNAL UNHANDLED ERROR: ",i),r}).then(r=>(this.du=!1,r))));return this.mu=t,t}enqueueAfterDelay(e,t,r){this.fu(),this.Ru.indexOf(e)>-1&&(t=0);let i=qc.createAndSchedule(this,e,t,r,s=>this.yu(s));return this.Tu.push(i),i}fu(){this.Eu&&q()}verifyOperationInProgress(){}async wu(){let e;do e=this.mu,await e;while(e!==this.mu)}Su(e){for(let t of this.Tu)if(t.timerId===e)return!0;return!1}bu(e){return this.wu().then(()=>{this.Tu.sort((t,r)=>t.targetTimeMs-r.targetTimeMs);for(let t of this.Tu)if(t.skipDelay(),e!=="all"&&t.timerId===e)break;return this.wu()})}Du(e){this.Ru.push(e)}yu(e){let t=this.Tu.indexOf(e);this.Tu.splice(t,1)}};function Ad(n){return function(t,r){if(typeof t!="object"||t===null)return!1;let i=t;for(let s of r)if(s in i&&typeof i[s]=="function")return!0;return!1}(n,["next","error","complete"])}var rt=class extends qn{constructor(e,t,r,i){super(e,t,r,i),this.type="firestore",this._queue=new Is,this._persistenceKey=(i==null?void 0:i.name)||"[DEFAULT]"}async _terminate(){if(this._firestoreClient){let e=this._firestoreClient.terminate();this._queue=new Is(e),this._firestoreClient=void 0,await e}}};function Ef(n,e){let t=typeof n=="object"?n:In(),r=typeof n=="string"?n:e||"(default)",i=Gt(t,"firestore").getImmediate({identifier:r});if(!i._initialized){let s=Ui("firestore");s&&By(i,...s)}return i}function Ls(n){if(n._terminated)throw new O(P.FAILED_PRECONDITION,"The client has already been terminated.");return n._firestoreClient||jy(n),n._firestoreClient}function jy(n){var e,t,r;let i=n._freezeSettings(),s=function(c,l,d,p){return new La(c,l,d,p.host,p.ssl,p.experimentalForceLongPolling,p.experimentalAutoDetectLongPolling,If(p.experimentalLongPollingOptions),p.useFetchStreams)}(n._databaseId,((e=n._app)===null||e===void 0?void 0:e.options.appId)||"",n._persistenceKey,i);n._componentsProvider||!((t=i.localCache)===null||t===void 0)&&t._offlineComponentProvider&&(!((r=i.localCache)===null||r===void 0)&&r._onlineComponentProvider)&&(n._componentsProvider={_offline:i.localCache._offlineComponentProvider,_online:i.localCache._onlineComponentProvider}),n._firestoreClient=new Qc(n._authCredentials,n._appCheckCredentials,n._queue,s,n._componentsProvider&&function(c){let l=c==null?void 0:c._online.build();return{_offline:c==null?void 0:c._offline.build(l),_online:l}}(n._componentsProvider))}var qr=class n{constructor(e){this._byteString=e}static fromBase64String(e){try{return new n(Pe.fromBase64String(e))}catch(t){throw new O(P.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+t)}}static fromUint8Array(e){return new n(Pe.fromUint8Array(e))}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}toString(){return"Bytes(base64: "+this.toBase64()+")"}isEqual(e){return this._byteString.isEqual(e._byteString)}};var Bn=class{constructor(...e){for(let t=0;t<e.length;++t)if(e[t].length===0)throw new O(P.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new Fe(e)}isEqual(e){return this._internalPath.isEqual(e._internalPath)}};var Br=class{constructor(e){this._methodName=e}};var jr=class{constructor(e,t){if(!isFinite(e)||e<-90||e>90)throw new O(P.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+e);if(!isFinite(t)||t<-180||t>180)throw new O(P.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+t);this._lat=e,this._long=t}get latitude(){return this._lat}get longitude(){return this._long}isEqual(e){return this._lat===e._lat&&this._long===e._long}toJSON(){return{latitude:this._lat,longitude:this._long}}_compareTo(e){return J(this._lat,e._lat)||J(this._long,e._long)}};var zr=class{constructor(e){this._values=(e||[]).map(t=>t)}toArray(){return this._values.map(e=>e)}isEqual(e){return function(r,i){if(r.length!==i.length)return!1;for(let s=0;s<r.length;++s)if(r[s]!==i[s])return!1;return!0}(this._values,e._values)}};var zy=/^__.*__$/,Jc=class{constructor(e,t,r){this.data=e,this.fieldMask=t,this.fieldTransforms=r}toMutation(e,t){return this.fieldMask!==null?new nt(e,this.data,this.fieldMask,t,this.fieldTransforms):new en(e,this.data,t,this.fieldTransforms)}},ws=class{constructor(e,t,r){this.data=e,this.fieldMask=t,this.fieldTransforms=r}toMutation(e,t){return new nt(e,this.data,this.fieldMask,t,this.fieldTransforms)}};function Tf(n){switch(n){case 0:case 2:case 1:return!0;case 3:case 4:return!1;default:throw q()}}var Yc=class n{constructor(e,t,r,i,s,a){this.settings=e,this.databaseId=t,this.serializer=r,this.ignoreUndefinedProperties=i,s===void 0&&this.vu(),this.fieldTransforms=s||[],this.fieldMask=a||[]}get path(){return this.settings.path}get Cu(){return this.settings.Cu}Fu(e){return new n(Object.assign(Object.assign({},this.settings),e),this.databaseId,this.serializer,this.ignoreUndefinedProperties,this.fieldTransforms,this.fieldMask)}Mu(e){var t;let r=(t=this.path)===null||t===void 0?void 0:t.child(e),i=this.Fu({path:r,xu:!1});return i.Ou(e),i}Nu(e){var t;let r=(t=this.path)===null||t===void 0?void 0:t.child(e),i=this.Fu({path:r,xu:!1});return i.vu(),i}Lu(e){return this.Fu({path:void 0,xu:!0})}Bu(e){return Ts(e,this.settings.methodName,this.settings.ku||!1,this.path,this.settings.qu)}contains(e){return this.fieldMask.find(t=>e.isPrefixOf(t))!==void 0||this.fieldTransforms.find(t=>e.isPrefixOf(t.field))!==void 0}vu(){if(this.path)for(let e=0;e<this.path.length;e++)this.Ou(this.path.get(e))}Ou(e){if(e.length===0)throw this.Bu("Document fields must not be empty");if(Tf(this.Cu)&&zy.test(e))throw this.Bu('Document fields cannot begin and end with "__"')}},Xc=class{constructor(e,t,r){this.databaseId=e,this.ignoreUndefinedProperties=t,this.serializer=r||Ds(e)}Qu(e,t,r,i=!1){return new Yc({Cu:e,methodName:t,qu:r,path:Fe.emptyPath(),xu:!1,ku:i},this.databaseId,this.serializer,this.ignoreUndefinedProperties)}};function wu(n){let e=n._freezeSettings(),t=Ds(n._databaseId);return new Xc(n._databaseId,!!e.ignoreUndefinedProperties,t)}function Gy(n,e,t,r,i,s={}){let a=n.Qu(s.merge||s.mergeFields?2:0,e,t,i);Eu("Data must be an object, but it was:",a,r);let c=bf(r,a),l,d;if(s.merge)l=new qe(a.fieldMask),d=a.fieldTransforms;else if(s.mergeFields){let p=[];for(let g of s.mergeFields){let v=Zc(e,g,t);if(!a.contains(v))throw new O(P.INVALID_ARGUMENT,`Field '${v}' is specified in your field mask but missing from your input data.`);Sf(p,v)||p.push(v)}l=new qe(p),d=a.fieldTransforms.filter(g=>l.covers(g.field))}else l=null,d=a.fieldTransforms;return new Jc(new Me(c),l,d)}var Es=class n extends Br{_toFieldTransform(e){if(e.Cu!==2)throw e.Cu===1?e.Bu(`${this._methodName}() can only appear at the top level of your update data`):e.Bu(`${this._methodName}() cannot be used with set() unless you pass {merge:true}`);return e.fieldMask.push(e.path),null}isEqual(e){return e instanceof n}};function $y(n,e,t,r){let i=n.Qu(1,e,t);Eu("Data must be an object, but it was:",i,r);let s=[],a=Me.empty();nn(r,(l,d)=>{let p=Tu(e,l,t);d=ee(d);let g=i.Nu(p);if(d instanceof Es)s.push(p);else{let v=Jr(d,g);v!=null&&(s.push(p),a.set(p,v))}});let c=new qe(s);return new ws(a,c,i.fieldTransforms)}function Ky(n,e,t,r,i,s){let a=n.Qu(1,e,t),c=[Zc(e,r,t)],l=[i];if(s.length%2!=0)throw new O(P.INVALID_ARGUMENT,`Function ${e}() needs to be called with an even number of arguments that alternate between field names and values.`);for(let v=0;v<s.length;v+=2)c.push(Zc(e,s[v])),l.push(s[v+1]);let d=[],p=Me.empty();for(let v=c.length-1;v>=0;--v)if(!Sf(d,c[v])){let w=c[v],R=l[v];R=ee(R);let D=a.Nu(w);if(R instanceof Es)d.push(w);else{let C=Jr(R,D);C!=null&&(d.push(w),p.set(w,C))}}let g=new qe(d);return new ws(p,g,a.fieldTransforms)}function Hy(n,e,t,r=!1){return Jr(t,n.Qu(r?4:3,e))}function Jr(n,e){if(Af(n=ee(n)))return Eu("Unsupported field value:",e,n),bf(n,e);if(n instanceof Br)return function(r,i){if(!Tf(i.Cu))throw i.Bu(`${r._methodName}() can only be used with update() and set()`);if(!i.path)throw i.Bu(`${r._methodName}() is not currently supported inside arrays`);let s=r._toFieldTransform(i);s&&i.fieldTransforms.push(s)}(n,e),null;if(n===void 0&&e.ignoreUndefinedProperties)return null;if(e.path&&e.fieldMask.push(e.path),n instanceof Array){if(e.settings.xu&&e.Cu!==4)throw e.Bu("Nested arrays are not supported");return function(r,i){let s=[],a=0;for(let c of r){let l=Jr(c,i.Lu(a));l==null&&(l={nullValue:"NULL_VALUE"}),s.push(l),a++}return{arrayValue:{values:s}}}(n,e)}return function(r,i){if((r=ee(r))===null)return{nullValue:"NULL_VALUE"};if(typeof r=="number")return k_(i.serializer,r);if(typeof r=="boolean")return{booleanValue:r};if(typeof r=="string")return{stringValue:r};if(r instanceof Date){let s=ye.fromDate(r);return{timestampValue:as(i.serializer,s)}}if(r instanceof ye){let s=new ye(r.seconds,1e3*Math.floor(r.nanoseconds/1e3));return{timestampValue:as(i.serializer,s)}}if(r instanceof jr)return{geoPointValue:{latitude:r.latitude,longitude:r.longitude}};if(r instanceof qr)return{bytesValue:Yd(i.serializer,r._byteString)};if(r instanceof Re){let s=i.databaseId,a=r.firestore._databaseId;if(!a.isEqual(s))throw i.Bu(`Document reference is for database ${a.projectId}/${a.database} but should be for database ${s.projectId}/${s.database}`);return{referenceValue:hu(r.firestore._databaseId||i.databaseId,r._key.path)}}if(r instanceof zr)return function(a,c){return{mapValue:{fields:{__type__:{stringValue:"__vector__"},value:{arrayValue:{values:a.toArray().map(l=>{if(typeof l!="number")throw c.Bu("VectorValues must only contain numeric values.");return lu(c.serializer,l)})}}}}}}(r,i);throw i.Bu(`Unsupported field value: ${Vs(r)}`)}(n,e)}function bf(n,e){let t={};return Pd(n)?e.path&&e.path.length>0&&e.fieldMask.push(e.path):nn(n,(r,i)=>{let s=Jr(i,e.Mu(r));s!=null&&(t[r]=s)}),{mapValue:{fields:t}}}function Af(n){return!(typeof n!="object"||n===null||n instanceof Array||n instanceof Date||n instanceof ye||n instanceof jr||n instanceof qr||n instanceof Re||n instanceof Br||n instanceof zr)}function Eu(n,e,t){if(!Af(t)||!function(i){return typeof i=="object"&&i!==null&&(Object.getPrototypeOf(i)===Object.prototype||Object.getPrototypeOf(i)===null)}(t)){let r=Vs(t);throw r==="an object"?e.Bu(n+" a custom object"):e.Bu(n+" "+r)}}function Zc(n,e,t){if((e=ee(e))instanceof Bn)return e._internalPath;if(typeof e=="string")return Tu(n,e);throw Ts("Field path arguments must be of type string or ",n,!1,void 0,t)}var Wy=new RegExp("[~\\*/\\[\\]]");function Tu(n,e,t){if(e.search(Wy)>=0)throw Ts(`Invalid field path (${e}). Paths must not contain '~', '*', '/', '[', or ']'`,n,!1,void 0,t);try{return new Bn(...e.split("."))._internalPath}catch{throw Ts(`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,n,!1,void 0,t)}}function Ts(n,e,t,r,i){let s=r&&!r.isEmpty(),a=i!==void 0,c=`Function ${e}() called with invalid data`;t&&(c+=" (via `toFirestore()`)"),c+=". ";let l="";return(s||a)&&(l+=" (found",s&&(l+=` in field ${r}`),a&&(l+=` in document ${i}`),l+=")"),new O(P.INVALID_ARGUMENT,c+n+l)}function Sf(n,e){return n.some(t=>t.isEqual(e))}var bs=class{constructor(e,t,r,i,s){this._firestore=e,this._userDataWriter=t,this._key=r,this._document=i,this._converter=s}get id(){return this._key.path.lastSegment()}get ref(){return new Re(this._firestore,this._converter,this._key)}exists(){return this._document!==null}data(){if(this._document){if(this._converter){let e=new eu(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(e)}return this._userDataWriter.convertValue(this._document.data.value)}}get(e){if(this._document){let t=this._document.data.field(bu("DocumentSnapshot.get",e));if(t!==null)return this._userDataWriter.convertValue(t)}}},eu=class extends bs{data(){return super.data()}};function bu(n,e){return typeof e=="string"?Tu(n,e):e instanceof Bn?e._internalPath:e._delegate._internalPath}function Rf(n){if(n.limitType==="L"&&n.explicitOrderBy.length===0)throw new O(P.UNIMPLEMENTED,"limitToLast() queries require specifying at least one orderBy() clause")}var Gr=class{},tu=class extends Gr{};function Pf(n,e,...t){let r=[];e instanceof Gr&&r.push(e),r=r.concat(t),function(s){let a=s.filter(l=>l instanceof nu).length,c=s.filter(l=>l instanceof As).length;if(a>1||a>0&&c>0)throw new O(P.INVALID_ARGUMENT,"InvalidQuery. When using composite filters, you cannot use more than one filter at the top level. Consider nesting the multiple filters within an `and(...)` statement. For example: change `query(query, where(...), or(...))` to `query(query, and(where(...), or(...)))`.")}(r);for(let i of r)n=i._apply(n);return n}var As=class n extends tu{constructor(e,t,r){super(),this._field=e,this._op=t,this._value=r,this.type="where"}static _create(e,t,r){return new n(e,t,r)}_apply(e){let t=this._parse(e);return kf(e._query,t),new tn(e.firestore,e.converter,Qa(e._query,t))}_parse(e){let t=wu(e.firestore);return function(s,a,c,l,d,p,g){let v;if(d.isKeyField()){if(p==="array-contains"||p==="array-contains-any")throw new O(P.INVALID_ARGUMENT,`Invalid Query. You can't perform '${p}' queries on documentId().`);if(p==="in"||p==="not-in"){Rd(g,p);let w=[];for(let R of g)w.push(Sd(l,s,R));v={arrayValue:{values:w}}}else v=Sd(l,s,g)}else p!=="in"&&p!=="not-in"&&p!=="array-contains-any"||Rd(g,p),v=Hy(c,a,g,p==="in"||p==="not-in");return de.create(d,p,v)}(e._query,"where",t,e.firestore._databaseId,this._field,this._op,this._value)}};function Cf(n,e,t){let r=e,i=bu("where",n);return As._create(i,r,t)}var nu=class n extends Gr{constructor(e,t){super(),this.type=e,this._queryConstraints=t}static _create(e,t){return new n(e,t)}_parse(e){let t=this._queryConstraints.map(r=>r._parse(e)).filter(r=>r.getFilters().length>0);return t.length===1?t[0]:Ge.create(t,this._getOperator())}_apply(e){let t=this._parse(e);return t.getFilters().length===0?e:(function(i,s){let a=i,c=s.getFlattenedFilters();for(let l of c)kf(a,l),a=Qa(a,l)}(e._query,t),new tn(e.firestore,e.converter,Qa(e._query,t)))}_getQueryConstraints(){return this._queryConstraints}_getOperator(){return this.type==="and"?"and":"or"}};function Sd(n,e,t){if(typeof(t=ee(t))=="string"){if(t==="")throw new O(P.INVALID_ARGUMENT,"Invalid query. When querying with documentId(), you must provide a valid document ID, but it was an empty string.");if(!Md(e)&&t.indexOf("/")!==-1)throw new O(P.INVALID_ARGUMENT,`Invalid query. When querying a collection by documentId(), you must provide a plain document ID, but '${t}' contains a '/' character.`);let r=e.path.child(re.fromString(t));if(!M.isDocumentKey(r))throw new O(P.INVALID_ARGUMENT,`Invalid query. When querying a collection group by documentId(), the value provided must result in a valid document path, but '${r}' is not because it has an odd number of segments (${r.length}).`);return Xh(n,new M(r))}if(t instanceof Re)return Xh(n,t._key);throw new O(P.INVALID_ARGUMENT,`Invalid query. When querying with documentId(), you must provide a valid string or a DocumentReference, but it was: ${Vs(t)}.`)}function Rd(n,e){if(!Array.isArray(n)||n.length===0)throw new O(P.INVALID_ARGUMENT,`Invalid Query. A non-empty array is required for '${e.toString()}' filters.`)}function kf(n,e){let t=function(i,s){for(let a of i)for(let c of a.getFlattenedFilters())if(s.indexOf(c.op)>=0)return c.op;return null}(n.filters,function(i){switch(i){case"!=":return["!=","not-in"];case"array-contains-any":case"in":return["not-in"];case"not-in":return["array-contains-any","in","not-in","!="];default:return[]}}(e.op));if(t!==null)throw t===e.op?new O(P.INVALID_ARGUMENT,`Invalid query. You cannot use more than one '${e.op.toString()}' filter.`):new O(P.INVALID_ARGUMENT,`Invalid query. You cannot use '${e.op.toString()}' filters with '${t.toString()}' filters.`)}var ru=class{convertValue(e,t="none"){switch(Jt(e)){case 0:return null;case 1:return e.booleanValue;case 2:return ne(e.integerValue||e.doubleValue);case 3:return this.convertTimestamp(e.timestampValue);case 4:return this.convertServerTimestamp(e,t);case 5:return e.stringValue;case 6:return this.convertBytes(kt(e.bytesValue));case 7:return this.convertReference(e.referenceValue);case 8:return this.convertGeoPoint(e.geoPointValue);case 9:return this.convertArray(e.arrayValue,t);case 11:return this.convertObject(e.mapValue,t);case 10:return this.convertVectorValue(e.mapValue);default:throw q()}}convertObject(e,t){return this.convertObjectMap(e.fields,t)}convertObjectMap(e,t="none"){let r={};return nn(e,(i,s)=>{r[i]=this.convertValue(s,t)}),r}convertVectorValue(e){var t,r,i;let s=(i=(r=(t=e.fields)===null||t===void 0?void 0:t.value.arrayValue)===null||r===void 0?void 0:r.values)===null||i===void 0?void 0:i.map(a=>ne(a.doubleValue));return new zr(s)}convertGeoPoint(e){return new jr(ne(e.latitude),ne(e.longitude))}convertArray(e,t){return(e.values||[]).map(r=>this.convertValue(r,t))}convertServerTimestamp(e,t){switch(t){case"previous":let r=ou(e);return r==null?null:this.convertValue(r,t);case"estimate":return this.convertTimestamp(kr(e));default:return null}}convertTimestamp(e){let t=gt(e);return new ye(t.seconds,t.nanos)}convertDocumentKey(e,t){let r=re.fromString(e);Y(rf(r));let i=new ts(r.get(1),r.get(3)),s=new M(r.popFirst(5));return i.isEqual(t)||mt(`Document ${s} contains a document reference within a different database (${i.projectId}/${i.database}) which is not supported. It will be treated as a reference in the current database (${t.projectId}/${t.database}) instead.`),s}};function Qy(n,e,t){let r;return r=n?t&&(t.merge||t.mergeFields)?n.toFirestore(e,t):n.toFirestore(e):e,r}var Ht=class{constructor(e,t){this.hasPendingWrites=e,this.fromCache=t}isEqual(e){return this.hasPendingWrites===e.hasPendingWrites&&this.fromCache===e.fromCache}},Ss=class extends bs{constructor(e,t,r,i,s,a){super(e,t,r,i,a),this._firestore=e,this._firestoreImpl=e,this.metadata=s}exists(){return super.exists()}data(e={}){if(this._document){if(this._converter){let t=new Rn(this._firestore,this._userDataWriter,this._key,this._document,this.metadata,null);return this._converter.fromFirestore(t,e)}return this._userDataWriter.convertValue(this._document.data.value,e.serverTimestamps)}}get(e,t={}){if(this._document){let r=this._document.data.field(bu("DocumentSnapshot.get",e));if(r!==null)return this._userDataWriter.convertValue(r,t.serverTimestamps)}}},Rn=class extends Ss{data(e={}){return super.data(e)}},Rs=class{constructor(e,t,r,i){this._firestore=e,this._userDataWriter=t,this._snapshot=i,this.metadata=new Ht(i.hasPendingWrites,i.fromCache),this.query=r}get docs(){let e=[];return this.forEach(t=>e.push(t)),e}get size(){return this._snapshot.docs.size}get empty(){return this.size===0}forEach(e,t){this._snapshot.docs.forEach(r=>{e.call(t,new Rn(this._firestore,this._userDataWriter,r.key,r,new Ht(this._snapshot.mutatedKeys.has(r.key),this._snapshot.fromCache),this.query.converter))})}docChanges(e={}){let t=!!e.includeMetadataChanges;if(t&&this._snapshot.excludesMetadataChanges)throw new O(P.INVALID_ARGUMENT,"To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");return this._cachedChanges&&this._cachedChangesIncludeMetadataChanges===t||(this._cachedChanges=function(i,s){if(i._snapshot.oldDocs.isEmpty()){let a=0;return i._snapshot.docChanges.map(c=>{let l=new Rn(i._firestore,i._userDataWriter,c.doc.key,c.doc,new Ht(i._snapshot.mutatedKeys.has(c.doc.key),i._snapshot.fromCache),i.query.converter);return c.doc,{type:"added",doc:l,oldIndex:-1,newIndex:a++}})}{let a=i._snapshot.oldDocs;return i._snapshot.docChanges.filter(c=>s||c.type!==3).map(c=>{let l=new Rn(i._firestore,i._userDataWriter,c.doc.key,c.doc,new Ht(i._snapshot.mutatedKeys.has(c.doc.key),i._snapshot.fromCache),i.query.converter),d=-1,p=-1;return c.type!==0&&(d=a.indexOf(c.doc.key),a=a.delete(c.doc.key)),c.type!==1&&(a=a.add(c.doc),p=a.indexOf(c.doc.key)),{type:Jy(c.type),doc:l,oldIndex:d,newIndex:p}})}}(this,t),this._cachedChangesIncludeMetadataChanges=t),this._cachedChanges}};function Jy(n){switch(n){case 0:return"added";case 2:case 3:return"modified";case 1:return"removed";default:return q()}}function Yr(n){n=Ue(n,Re);let e=Ue(n.firestore,rt);return Fy(Ls(e),n._key).then(t=>Df(e,n,t))}var $r=class extends ru{constructor(e){super(),this.firestore=e}convertBytes(e){return new qr(e)}convertReference(e){let t=this.convertDocumentKey(e,this.firestore._databaseId);return new Re(this.firestore,null,t)}};function Nf(n){n=Ue(n,tn);let e=Ue(n.firestore,rt),t=Ls(e),r=new $r(e);return Rf(n._query),Uy(t,n._query).then(i=>new Rs(e,r,n,i))}function sn(n,e,t){n=Ue(n,Re);let r=Ue(n.firestore,rt),i=Qy(n.converter,e,t);return Au(r,[Gy(wu(r),"setDoc",n._key,i,n.converter!==null,t).toMutation(n._key,pt.none())])}function Ms(n,e,t,...r){n=Ue(n,Re);let i=Ue(n.firestore,rt),s=wu(i),a;return a=typeof(e=ee(e))=="string"||e instanceof Bn?Ky(s,"updateDoc",n._key,e,t,r):$y(s,"updateDoc",n._key,e),Au(i,[a.toMutation(n._key,pt.exists(!0))])}function Fs(n){return Au(Ue(n.firestore,rt),[new Dr(n._key,pt.none())])}function Us(n,...e){var t,r,i;n=ee(n);let s={includeMetadataChanges:!1,source:"default"},a=0;typeof e[a]!="object"||Ad(e[a])||(s=e[a],a++);let c={includeMetadataChanges:s.includeMetadataChanges,source:s.source};if(Ad(e[a])){let g=e[a];e[a]=(t=g.next)===null||t===void 0?void 0:t.bind(g),e[a+1]=(r=g.error)===null||r===void 0?void 0:r.bind(g),e[a+2]=(i=g.complete)===null||i===void 0?void 0:i.bind(g)}let l,d,p;if(n instanceof Re)d=Ue(n.firestore,rt),p=Cs(n._key.path),l={next:g=>{e[a]&&e[a](Df(d,n,g))},error:e[a+1],complete:e[a+2]};else{let g=Ue(n,tn);d=Ue(g.firestore,rt),p=g._query;let v=new $r(d);l={next:w=>{e[a]&&e[a](new Rs(d,v,g,w))},error:e[a+1],complete:e[a+2]},Rf(n._query)}return function(v,w,R,D){let C=new Ur(D),U=new Mr(w,C,R);return v.asyncQueue.enqueueAndForget(async()=>_u(await ys(v),U)),()=>{C.Za(),v.asyncQueue.enqueueAndForget(async()=>yu(await ys(v),U))}}(Ls(d),p,c,l)}function Au(n,e){return function(r,i){let s=new je;return r.asyncQueue.enqueueAndForget(async()=>Py(await My(r),i,s)),s.promise}(Ls(n),e)}function Df(n,e,t){let r=t.docs.get(e._key),i=new $r(n);return new Ss(n,i,e._key,r,new Ht(t.hasPendingWrites,t.fromCache),e.converter)}(function(e,t=!0){(function(i){jn=i})(Je),We(new xe("firestore",(r,{instanceIdentifier:i,options:s})=>{let a=r.getProvider("app").getImmediate(),c=new rt(new Ca(r.getProvider("auth-internal")),new xa(r.getProvider("app-check-internal")),function(d,p){if(!Object.prototype.hasOwnProperty.apply(d.options,["projectId"]))throw new O(P.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new ts(d.options.projectId,p)}(a,i),a);return s=Object.assign({useFetchStreams:t},s),c._setSettings(s),c},"PUBLIC").setMultipleInstances(!0)),Oe(Wh,"4.7.3",e),Oe(Wh,"4.7.3","esm2017")})();function qs(n,e){var t={};for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&e.indexOf(r)<0&&(t[r]=n[r]);if(n!=null&&typeof Object.getOwnPropertySymbols=="function")for(var i=0,r=Object.getOwnPropertySymbols(n);i<r.length;i++)e.indexOf(r[i])<0&&Object.prototype.propertyIsEnumerable.call(n,r[i])&&(t[r[i]]=n[r[i]]);return t}function Jf(){return{"dependent-sdk-initialized-before-auth":"Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK."}}var Yf=Jf,Xf=new ht("auth","Firebase",Jf());var Ks=new St("@firebase/auth");function Yy(n,...e){Ks.logLevel<=$.WARN&&Ks.warn(`Auth (${Je}): ${n}`,...e)}function js(n,...e){Ks.logLevel<=$.ERROR&&Ks.error(`Auth (${Je}): ${n}`,...e)}function $e(n,...e){throw Ku(n,...e)}function st(n,...e){return Ku(n,...e)}function Zf(n,e,t){let r=Object.assign(Object.assign({},Yf()),{[e]:t});return new ht("auth","Firebase",r).create(e,{appName:n.name})}function Ot(n){return Zf(n,"operation-not-supported-in-this-environment","Operations that alter the current user are not supported in conjunction with FirebaseServerApp")}function Ku(n,...e){if(typeof n!="string"){let t=e[0],r=[...e.slice(1)];return r[0]&&(r[0].appName=n.name),n._errorFactory.create(t,...r)}return Xf.create(n,...e)}function L(n,e,...t){if(!n)throw Ku(e,...t)}function it(n){let e="INTERNAL ASSERTION FAILED: "+n;throw js(e),new Error(e)}function It(n,e){n||it(e)}function Pu(){var n;return typeof self!="undefined"&&((n=self.location)===null||n===void 0?void 0:n.href)||""}function Xy(){return xf()==="http:"||xf()==="https:"}function xf(){var n;return typeof self!="undefined"&&((n=self.location)===null||n===void 0?void 0:n.protocol)||null}function Zy(){return typeof navigator!="undefined"&&navigator&&"onLine"in navigator&&typeof navigator.onLine=="boolean"&&(Xy()||Ah()||"connection"in navigator)?navigator.onLine:!0}function ev(){if(typeof navigator=="undefined")return null;let n=navigator;return n.languages&&n.languages[0]||n.language||null}var on=class{constructor(e,t){this.shortDelay=e,this.longDelay=t,It(t>e,"Short delay should be less than long delay!"),this.isMobile=Th()||Sh()}get(){return Zy()?this.isMobile?this.longDelay:this.shortDelay:Math.min(5e3,this.shortDelay)}};function Hu(n,e){It(n.emulator,"Emulator should always be set here");let{url:t}=n.emulator;return e?`${t}${e.startsWith("/")?e.slice(1):e}`:t}var Hs=class{static initialize(e,t,r){this.fetchImpl=e,t&&(this.headersImpl=t),r&&(this.responseImpl=r)}static fetch(){if(this.fetchImpl)return this.fetchImpl;if(typeof self!="undefined"&&"fetch"in self)return self.fetch;if(typeof globalThis!="undefined"&&globalThis.fetch)return globalThis.fetch;if(typeof fetch!="undefined")return fetch;it("Could not find fetch implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static headers(){if(this.headersImpl)return this.headersImpl;if(typeof self!="undefined"&&"Headers"in self)return self.Headers;if(typeof globalThis!="undefined"&&globalThis.Headers)return globalThis.Headers;if(typeof Headers!="undefined")return Headers;it("Could not find Headers implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static response(){if(this.responseImpl)return this.responseImpl;if(typeof self!="undefined"&&"Response"in self)return self.Response;if(typeof globalThis!="undefined"&&globalThis.Response)return globalThis.Response;if(typeof Response!="undefined")return Response;it("Could not find Response implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}};var tv={CREDENTIAL_MISMATCH:"custom-token-mismatch",MISSING_CUSTOM_TOKEN:"internal-error",INVALID_IDENTIFIER:"invalid-email",MISSING_CONTINUE_URI:"internal-error",INVALID_PASSWORD:"wrong-password",MISSING_PASSWORD:"missing-password",INVALID_LOGIN_CREDENTIALS:"invalid-credential",EMAIL_EXISTS:"email-already-in-use",PASSWORD_LOGIN_DISABLED:"operation-not-allowed",INVALID_IDP_RESPONSE:"invalid-credential",INVALID_PENDING_TOKEN:"invalid-credential",FEDERATED_USER_ID_ALREADY_LINKED:"credential-already-in-use",MISSING_REQ_TYPE:"internal-error",EMAIL_NOT_FOUND:"user-not-found",RESET_PASSWORD_EXCEED_LIMIT:"too-many-requests",EXPIRED_OOB_CODE:"expired-action-code",INVALID_OOB_CODE:"invalid-action-code",MISSING_OOB_CODE:"internal-error",CREDENTIAL_TOO_OLD_LOGIN_AGAIN:"requires-recent-login",INVALID_ID_TOKEN:"invalid-user-token",TOKEN_EXPIRED:"user-token-expired",USER_NOT_FOUND:"user-token-expired",TOO_MANY_ATTEMPTS_TRY_LATER:"too-many-requests",PASSWORD_DOES_NOT_MEET_REQUIREMENTS:"password-does-not-meet-requirements",INVALID_CODE:"invalid-verification-code",INVALID_SESSION_INFO:"invalid-verification-id",INVALID_TEMPORARY_PROOF:"invalid-credential",MISSING_SESSION_INFO:"missing-verification-id",SESSION_EXPIRED:"code-expired",MISSING_ANDROID_PACKAGE_NAME:"missing-android-pkg-name",UNAUTHORIZED_DOMAIN:"unauthorized-continue-uri",INVALID_OAUTH_CLIENT_ID:"invalid-oauth-client-id",ADMIN_ONLY_OPERATION:"admin-restricted-operation",INVALID_MFA_PENDING_CREDENTIAL:"invalid-multi-factor-session",MFA_ENROLLMENT_NOT_FOUND:"multi-factor-info-not-found",MISSING_MFA_ENROLLMENT_ID:"missing-multi-factor-info",MISSING_MFA_PENDING_CREDENTIAL:"missing-multi-factor-session",SECOND_FACTOR_EXISTS:"second-factor-already-in-use",SECOND_FACTOR_LIMIT_EXCEEDED:"maximum-second-factor-count-exceeded",BLOCKING_FUNCTION_ERROR_RESPONSE:"internal-error",RECAPTCHA_NOT_ENABLED:"recaptcha-not-enabled",MISSING_RECAPTCHA_TOKEN:"missing-recaptcha-token",INVALID_RECAPTCHA_TOKEN:"invalid-recaptcha-token",INVALID_RECAPTCHA_ACTION:"invalid-recaptcha-action",MISSING_CLIENT_TYPE:"missing-client-type",MISSING_RECAPTCHA_VERSION:"missing-recaptcha-version",INVALID_RECAPTCHA_VERSION:"invalid-recaptcha-version",INVALID_REQ_TYPE:"invalid-req-type"};var nv=new on(3e4,6e4);function fe(n,e){return n.tenantId&&!e.tenantId?Object.assign(Object.assign({},e),{tenantId:n.tenantId}):e}async function Ce(n,e,t,r,i={}){return ep(n,i,async()=>{let s={},a={};r&&(e==="GET"?a=r:s={body:JSON.stringify(r)});let c=_n(Object.assign({key:n.config.apiKey},a)).slice(1),l=await n._getAdditionalHeaders();l["Content-Type"]="application/json",n.languageCode&&(l["X-Firebase-Locale"]=n.languageCode);let d=Object.assign({method:e,headers:l},s);return bh()||(d.referrerPolicy="no-referrer"),Hs.fetch()(tp(n,n.config.apiHost,t,c),d)})}async function ep(n,e,t){n._canInitEmulator=!1;let r=Object.assign(Object.assign({},tv),e);try{let i=new Cu(n),s=await Promise.race([t(),i.promise]);i.clearNetworkTimeout();let a=await s.json();if("needConfirmation"in a)throw Xr(n,"account-exists-with-different-credential",a);if(s.ok&&!("errorMessage"in a))return a;{let c=s.ok?a.errorMessage:a.error.message,[l,d]=c.split(" : ");if(l==="FEDERATED_USER_ID_ALREADY_LINKED")throw Xr(n,"credential-already-in-use",a);if(l==="EMAIL_EXISTS")throw Xr(n,"email-already-in-use",a);if(l==="USER_DISABLED")throw Xr(n,"user-disabled",a);let p=r[l]||l.toLowerCase().replace(/[_\s]+/g,"-");if(d)throw Zf(n,p,d);$e(n,p)}}catch(i){if(i instanceof De)throw i;$e(n,"network-request-failed",{message:String(i)})}}async function Vt(n,e,t,r,i={}){let s=await Ce(n,e,t,r,i);return"mfaPendingCredential"in s&&$e(n,"multi-factor-auth-required",{_serverResponse:s}),s}function tp(n,e,t,r){let i=`${e}${t}?${r}`;return n.config.emulator?Hu(n.config,i):`${n.config.apiScheme}://${i}`}function rv(n){switch(n){case"ENFORCE":return"ENFORCE";case"AUDIT":return"AUDIT";case"OFF":return"OFF";default:return"ENFORCEMENT_STATE_UNSPECIFIED"}}var Cu=class{constructor(e){this.auth=e,this.timer=null,this.promise=new Promise((t,r)=>{this.timer=setTimeout(()=>r(st(this.auth,"network-request-failed")),nv.get())})}clearNetworkTimeout(){clearTimeout(this.timer)}};function Xr(n,e,t){let r={appName:n.name};t.email&&(r.email=t.email),t.phoneNumber&&(r.phoneNumber=t.phoneNumber);let i=st(n,e,r);return i.customData._tokenResponse=t,i}function Of(n){return n!==void 0&&n.enterprise!==void 0}var ku=class{constructor(e){if(this.siteKey="",this.recaptchaEnforcementState=[],e.recaptchaKey===void 0)throw new Error("recaptchaKey undefined");this.siteKey=e.recaptchaKey.split("/")[3],this.recaptchaEnforcementState=e.recaptchaEnforcementState}getProviderEnforcementState(e){if(!this.recaptchaEnforcementState||this.recaptchaEnforcementState.length===0)return null;for(let t of this.recaptchaEnforcementState)if(t.provider&&t.provider===e)return rv(t.enforcementState);return null}isProviderEnabled(e){return this.getProviderEnforcementState(e)==="ENFORCE"||this.getProviderEnforcementState(e)==="AUDIT"}};async function iv(n,e){return Ce(n,"GET","/v2/recaptchaConfig",fe(n,e))}async function sv(n,e){return Ce(n,"POST","/v1/accounts:delete",e)}async function np(n,e){return Ce(n,"POST","/v1/accounts:lookup",e)}function Zr(n){if(n)try{let e=new Date(Number(n));if(!isNaN(e.getTime()))return e.toUTCString()}catch{}}async function rp(n,e=!1){let t=ee(n),r=await t.getIdToken(e),i=Wu(r);L(i&&i.exp&&i.auth_time&&i.iat,t.auth,"internal-error");let s=typeof i.firebase=="object"?i.firebase:void 0,a=s==null?void 0:s.sign_in_provider;return{claims:i,token:r,authTime:Zr(Su(i.auth_time)),issuedAtTime:Zr(Su(i.iat)),expirationTime:Zr(Su(i.exp)),signInProvider:a||null,signInSecondFactor:(s==null?void 0:s.sign_in_second_factor)||null}}function Su(n){return Number(n)*1e3}function Wu(n){let[e,t,r]=n.split(".");if(e===void 0||t===void 0||r===void 0)return js("JWT malformed, contained fewer than 3 sections"),null;try{let i=Yo(t);return i?JSON.parse(i):(js("Failed to decode base64 JWT payload"),null)}catch(i){return js("Caught error parsing JWT payload as JSON",i==null?void 0:i.toString()),null}}function Vf(n){let e=Wu(n);return L(e,"internal-error"),L(typeof e.exp!="undefined","internal-error"),L(typeof e.iat!="undefined","internal-error"),Number(e.exp)-Number(e.iat)}async function ti(n,e,t=!1){if(t)return e;try{return await e}catch(r){throw r instanceof De&&ov(r)&&n.auth.currentUser===n&&await n.auth.signOut(),r}}function ov({code:n}){return n==="auth/user-disabled"||n==="auth/user-token-expired"}var Nu=class{constructor(e){this.user=e,this.isRunning=!1,this.timerId=null,this.errorBackoff=3e4}_start(){this.isRunning||(this.isRunning=!0,this.schedule())}_stop(){this.isRunning&&(this.isRunning=!1,this.timerId!==null&&clearTimeout(this.timerId))}getInterval(e){var t;if(e){let r=this.errorBackoff;return this.errorBackoff=Math.min(this.errorBackoff*2,96e4),r}else{this.errorBackoff=3e4;let i=((t=this.user.stsTokenManager.expirationTime)!==null&&t!==void 0?t:0)-Date.now()-3e5;return Math.max(0,i)}}schedule(e=!1){if(!this.isRunning)return;let t=this.getInterval(e);this.timerId=setTimeout(async()=>{await this.iteration()},t)}async iteration(){try{await this.user.getIdToken(!0)}catch(e){(e==null?void 0:e.code)==="auth/network-request-failed"&&this.schedule(!0);return}this.schedule()}};var ni=class{constructor(e,t){this.createdAt=e,this.lastLoginAt=t,this._initializeTime()}_initializeTime(){this.lastSignInTime=Zr(this.lastLoginAt),this.creationTime=Zr(this.createdAt)}_copy(e){this.createdAt=e.createdAt,this.lastLoginAt=e.lastLoginAt,this._initializeTime()}toJSON(){return{createdAt:this.createdAt,lastLoginAt:this.lastLoginAt}}};async function Ws(n){var e;let t=n.auth,r=await n.getIdToken(),i=await ti(n,np(t,{idToken:r}));L(i==null?void 0:i.users.length,t,"internal-error");let s=i.users[0];n._notifyReloadListener(s);let a=!((e=s.providerUserInfo)===null||e===void 0)&&e.length?sp(s.providerUserInfo):[],c=av(n.providerData,a),l=n.isAnonymous,d=!(n.email&&s.passwordHash)&&!(c!=null&&c.length),p=l?d:!1,g={uid:s.localId,displayName:s.displayName||null,photoURL:s.photoUrl||null,email:s.email||null,emailVerified:s.emailVerified||!1,phoneNumber:s.phoneNumber||null,tenantId:s.tenantId||null,providerData:c,metadata:new ni(s.createdAt,s.lastLoginAt),isAnonymous:p};Object.assign(n,g)}async function ip(n){let e=ee(n);await Ws(e),await e.auth._persistUserIfCurrent(e),e.auth._notifyListenersIfCurrent(e)}function av(n,e){return[...n.filter(r=>!e.some(i=>i.providerId===r.providerId)),...e]}function sp(n){return n.map(e=>{var{providerId:t}=e,r=qs(e,["providerId"]);return{providerId:t,uid:r.rawId||"",displayName:r.displayName||null,email:r.email||null,phoneNumber:r.phoneNumber||null,photoURL:r.photoUrl||null}})}async function cv(n,e){let t=await ep(n,{},async()=>{let r=_n({grant_type:"refresh_token",refresh_token:e}).slice(1),{tokenApiHost:i,apiKey:s}=n.config,a=tp(n,i,"/v1/token",`key=${s}`),c=await n._getAdditionalHeaders();return c["Content-Type"]="application/x-www-form-urlencoded",Hs.fetch()(a,{method:"POST",headers:c,body:r})});return{accessToken:t.access_token,expiresIn:t.expires_in,refreshToken:t.refresh_token}}async function uv(n,e){return Ce(n,"POST","/v2/accounts:revokeToken",fe(n,e))}var ei=class n{constructor(){this.refreshToken=null,this.accessToken=null,this.expirationTime=null}get isExpired(){return!this.expirationTime||Date.now()>this.expirationTime-3e4}updateFromServerResponse(e){L(e.idToken,"internal-error"),L(typeof e.idToken!="undefined","internal-error"),L(typeof e.refreshToken!="undefined","internal-error");let t="expiresIn"in e&&typeof e.expiresIn!="undefined"?Number(e.expiresIn):Vf(e.idToken);this.updateTokensAndExpiration(e.idToken,e.refreshToken,t)}updateFromIdToken(e){L(e.length!==0,"internal-error");let t=Vf(e);this.updateTokensAndExpiration(e,null,t)}async getToken(e,t=!1){return!t&&this.accessToken&&!this.isExpired?this.accessToken:(L(this.refreshToken,e,"user-token-expired"),this.refreshToken?(await this.refresh(e,this.refreshToken),this.accessToken):null)}clearRefreshToken(){this.refreshToken=null}async refresh(e,t){let{accessToken:r,refreshToken:i,expiresIn:s}=await cv(e,t);this.updateTokensAndExpiration(r,i,Number(s))}updateTokensAndExpiration(e,t,r){this.refreshToken=t||null,this.accessToken=e||null,this.expirationTime=Date.now()+r*1e3}static fromJSON(e,t){let{refreshToken:r,accessToken:i,expirationTime:s}=t,a=new n;return r&&(L(typeof r=="string","internal-error",{appName:e}),a.refreshToken=r),i&&(L(typeof i=="string","internal-error",{appName:e}),a.accessToken=i),s&&(L(typeof s=="number","internal-error",{appName:e}),a.expirationTime=s),a}toJSON(){return{refreshToken:this.refreshToken,accessToken:this.accessToken,expirationTime:this.expirationTime}}_assign(e){this.accessToken=e.accessToken,this.refreshToken=e.refreshToken,this.expirationTime=e.expirationTime}_clone(){return Object.assign(new n,this.toJSON())}_performRefresh(){return it("not implemented")}};function xt(n,e){L(typeof n=="string"||typeof n=="undefined","internal-error",{appName:e})}var $n=class n{constructor(e){var{uid:t,auth:r,stsTokenManager:i}=e,s=qs(e,["uid","auth","stsTokenManager"]);this.providerId="firebase",this.proactiveRefresh=new Nu(this),this.reloadUserInfo=null,this.reloadListener=null,this.uid=t,this.auth=r,this.stsTokenManager=i,this.accessToken=i.accessToken,this.displayName=s.displayName||null,this.email=s.email||null,this.emailVerified=s.emailVerified||!1,this.phoneNumber=s.phoneNumber||null,this.photoURL=s.photoURL||null,this.isAnonymous=s.isAnonymous||!1,this.tenantId=s.tenantId||null,this.providerData=s.providerData?[...s.providerData]:[],this.metadata=new ni(s.createdAt||void 0,s.lastLoginAt||void 0)}async getIdToken(e){let t=await ti(this,this.stsTokenManager.getToken(this.auth,e));return L(t,this.auth,"internal-error"),this.accessToken!==t&&(this.accessToken=t,await this.auth._persistUserIfCurrent(this),this.auth._notifyListenersIfCurrent(this)),t}getIdTokenResult(e){return rp(this,e)}reload(){return ip(this)}_assign(e){this!==e&&(L(this.uid===e.uid,this.auth,"internal-error"),this.displayName=e.displayName,this.photoURL=e.photoURL,this.email=e.email,this.emailVerified=e.emailVerified,this.phoneNumber=e.phoneNumber,this.isAnonymous=e.isAnonymous,this.tenantId=e.tenantId,this.providerData=e.providerData.map(t=>Object.assign({},t)),this.metadata._copy(e.metadata),this.stsTokenManager._assign(e.stsTokenManager))}_clone(e){let t=new n(Object.assign(Object.assign({},this),{auth:e,stsTokenManager:this.stsTokenManager._clone()}));return t.metadata._copy(this.metadata),t}_onReload(e){L(!this.reloadListener,this.auth,"internal-error"),this.reloadListener=e,this.reloadUserInfo&&(this._notifyReloadListener(this.reloadUserInfo),this.reloadUserInfo=null)}_notifyReloadListener(e){this.reloadListener?this.reloadListener(e):this.reloadUserInfo=e}_startProactiveRefresh(){this.proactiveRefresh._start()}_stopProactiveRefresh(){this.proactiveRefresh._stop()}async _updateTokensIfNecessary(e,t=!1){let r=!1;e.idToken&&e.idToken!==this.stsTokenManager.accessToken&&(this.stsTokenManager.updateFromServerResponse(e),r=!0),t&&await Ws(this),await this.auth._persistUserIfCurrent(this),r&&this.auth._notifyListenersIfCurrent(this)}async delete(){if(Qe(this.auth.app))return Promise.reject(Ot(this.auth));let e=await this.getIdToken();return await ti(this,sv(this.auth,{idToken:e})),this.stsTokenManager.clearRefreshToken(),this.auth.signOut()}toJSON(){return Object.assign(Object.assign({uid:this.uid,email:this.email||void 0,emailVerified:this.emailVerified,displayName:this.displayName||void 0,isAnonymous:this.isAnonymous,photoURL:this.photoURL||void 0,phoneNumber:this.phoneNumber||void 0,tenantId:this.tenantId||void 0,providerData:this.providerData.map(e=>Object.assign({},e)),stsTokenManager:this.stsTokenManager.toJSON(),_redirectEventId:this._redirectEventId},this.metadata.toJSON()),{apiKey:this.auth.config.apiKey,appName:this.auth.name})}get refreshToken(){return this.stsTokenManager.refreshToken||""}static _fromJSON(e,t){var r,i,s,a,c,l,d,p;let g=(r=t.displayName)!==null&&r!==void 0?r:void 0,v=(i=t.email)!==null&&i!==void 0?i:void 0,w=(s=t.phoneNumber)!==null&&s!==void 0?s:void 0,R=(a=t.photoURL)!==null&&a!==void 0?a:void 0,D=(c=t.tenantId)!==null&&c!==void 0?c:void 0,C=(l=t._redirectEventId)!==null&&l!==void 0?l:void 0,U=(d=t.createdAt)!==null&&d!==void 0?d:void 0,B=(p=t.lastLoginAt)!==null&&p!==void 0?p:void 0,{uid:F,emailVerified:z,isAnonymous:se,providerData:K,stsTokenManager:E}=t;L(F&&E,e,"internal-error");let m=ei.fromJSON(this.name,E);L(typeof F=="string",e,"internal-error"),xt(g,e.name),xt(v,e.name),L(typeof z=="boolean",e,"internal-error"),L(typeof se=="boolean",e,"internal-error"),xt(w,e.name),xt(R,e.name),xt(D,e.name),xt(C,e.name),xt(U,e.name),xt(B,e.name);let _=new n({uid:F,auth:e,email:v,emailVerified:z,displayName:g,isAnonymous:se,photoURL:R,phoneNumber:w,tenantId:D,stsTokenManager:m,createdAt:U,lastLoginAt:B});return K&&Array.isArray(K)&&(_.providerData=K.map(I=>Object.assign({},I))),C&&(_._redirectEventId=C),_}static async _fromIdTokenResponse(e,t,r=!1){let i=new ei;i.updateFromServerResponse(t);let s=new n({uid:t.localId,auth:e,stsTokenManager:i,isAnonymous:r});return await Ws(s),s}static async _fromGetAccountInfoResponse(e,t,r){let i=t.users[0];L(i.localId!==void 0,"internal-error");let s=i.providerUserInfo!==void 0?sp(i.providerUserInfo):[],a=!(i.email&&i.passwordHash)&&!(s!=null&&s.length),c=new ei;c.updateFromIdToken(r);let l=new n({uid:i.localId,auth:e,stsTokenManager:c,isAnonymous:a}),d={uid:i.localId,displayName:i.displayName||null,photoURL:i.photoUrl||null,email:i.email||null,emailVerified:i.emailVerified||!1,phoneNumber:i.phoneNumber||null,tenantId:i.tenantId||null,providerData:s,metadata:new ni(i.createdAt,i.lastLoginAt),isAnonymous:!(i.email&&i.passwordHash)&&!(s!=null&&s.length)};return Object.assign(l,d),l}};var Lf=new Map;function vt(n){It(n instanceof Function,"Expected a class definition");let e=Lf.get(n);return e?(It(e instanceof n,"Instance stored in cache mismatched with class"),e):(e=new n,Lf.set(n,e),e)}var Qs=class{constructor(){this.type="NONE",this.storage={}}async _isAvailable(){return!0}async _set(e,t){this.storage[e]=t}async _get(e){let t=this.storage[e];return t===void 0?null:t}async _remove(e){delete this.storage[e]}_addListener(e,t){}_removeListener(e,t){}};Qs.type="NONE";var Du=Qs;function zs(n,e,t){return`firebase:${n}:${e}:${t}`}var Js=class n{constructor(e,t,r){this.persistence=e,this.auth=t,this.userKey=r;let{config:i,name:s}=this.auth;this.fullUserKey=zs(this.userKey,i.apiKey,s),this.fullPersistenceKey=zs("persistence",i.apiKey,s),this.boundEventHandler=t._onStorageEvent.bind(t),this.persistence._addListener(this.fullUserKey,this.boundEventHandler)}setCurrentUser(e){return this.persistence._set(this.fullUserKey,e.toJSON())}async getCurrentUser(){let e=await this.persistence._get(this.fullUserKey);return e?$n._fromJSON(this.auth,e):null}removeCurrentUser(){return this.persistence._remove(this.fullUserKey)}savePersistenceForRedirect(){return this.persistence._set(this.fullPersistenceKey,this.persistence.type)}async setPersistence(e){if(this.persistence===e)return;let t=await this.getCurrentUser();if(await this.removeCurrentUser(),this.persistence=e,t)return this.setCurrentUser(t)}delete(){this.persistence._removeListener(this.fullUserKey,this.boundEventHandler)}static async create(e,t,r="authUser"){if(!t.length)return new n(vt(Du),e,r);let i=(await Promise.all(t.map(async d=>{if(await d._isAvailable())return d}))).filter(d=>d),s=i[0]||vt(Du),a=zs(r,e.config.apiKey,e.name),c=null;for(let d of t)try{let p=await d._get(a);if(p){let g=$n._fromJSON(e,p);d!==s&&(c=g),s=d;break}}catch{}let l=i.filter(d=>d._shouldAllowMigration);return!s._shouldAllowMigration||!l.length?new n(s,e,r):(s=l[0],c&&await s._set(a,c.toJSON()),await Promise.all(t.map(async d=>{if(d!==s)try{await d._remove(a)}catch{}})),new n(s,e,r))}};function Mf(n){let e=n.toLowerCase();if(e.includes("opera/")||e.includes("opr/")||e.includes("opios/"))return"Opera";if(up(e))return"IEMobile";if(e.includes("msie")||e.includes("trident/"))return"IE";if(e.includes("edge/"))return"Edge";if(op(e))return"Firefox";if(e.includes("silk/"))return"Silk";if(hp(e))return"Blackberry";if(dp(e))return"Webos";if(ap(e))return"Safari";if((e.includes("chrome/")||cp(e))&&!e.includes("edge/"))return"Chrome";if(lp(e))return"Android";{let t=/([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/,r=n.match(t);if((r==null?void 0:r.length)===2)return r[1]}return"Other"}function op(n=me()){return/firefox\//i.test(n)}function ap(n=me()){let e=n.toLowerCase();return e.includes("safari/")&&!e.includes("chrome/")&&!e.includes("crios/")&&!e.includes("android")}function cp(n=me()){return/crios\//i.test(n)}function up(n=me()){return/iemobile/i.test(n)}function lp(n=me()){return/android/i.test(n)}function hp(n=me()){return/blackberry/i.test(n)}function dp(n=me()){return/webos/i.test(n)}function Qu(n=me()){return/iphone|ipad|ipod/i.test(n)||/macintosh/i.test(n)&&/mobile/i.test(n)}function lv(n=me()){var e;return Qu(n)&&!!(!((e=window.navigator)===null||e===void 0)&&e.standalone)}function hv(){return Rh()&&document.documentMode===10}function fp(n=me()){return Qu(n)||lp(n)||dp(n)||hp(n)||/windows phone/i.test(n)||up(n)}function pp(n,e=[]){let t;switch(n){case"Browser":t=Mf(me());break;case"Worker":t=`${Mf(me())}-${n}`;break;default:t=n}let r=e.length?e.join(","):"FirebaseCore-web";return`${t}/JsCore/${Je}/${r}`}var xu=class{constructor(e){this.auth=e,this.queue=[]}pushCallback(e,t){let r=s=>new Promise((a,c)=>{try{let l=e(s);a(l)}catch(l){c(l)}});r.onAbort=t,this.queue.push(r);let i=this.queue.length-1;return()=>{this.queue[i]=()=>Promise.resolve()}}async runMiddleware(e){if(this.auth.currentUser===e)return;let t=[];try{for(let r of this.queue)await r(e),r.onAbort&&t.push(r.onAbort)}catch(r){t.reverse();for(let i of t)try{i()}catch{}throw this.auth._errorFactory.create("login-blocked",{originalMessage:r==null?void 0:r.message})}}};async function dv(n,e={}){return Ce(n,"GET","/v2/passwordPolicy",fe(n,e))}var fv=6,Ou=class{constructor(e){var t,r,i,s;let a=e.customStrengthOptions;this.customStrengthOptions={},this.customStrengthOptions.minPasswordLength=(t=a.minPasswordLength)!==null&&t!==void 0?t:fv,a.maxPasswordLength&&(this.customStrengthOptions.maxPasswordLength=a.maxPasswordLength),a.containsLowercaseCharacter!==void 0&&(this.customStrengthOptions.containsLowercaseLetter=a.containsLowercaseCharacter),a.containsUppercaseCharacter!==void 0&&(this.customStrengthOptions.containsUppercaseLetter=a.containsUppercaseCharacter),a.containsNumericCharacter!==void 0&&(this.customStrengthOptions.containsNumericCharacter=a.containsNumericCharacter),a.containsNonAlphanumericCharacter!==void 0&&(this.customStrengthOptions.containsNonAlphanumericCharacter=a.containsNonAlphanumericCharacter),this.enforcementState=e.enforcementState,this.enforcementState==="ENFORCEMENT_STATE_UNSPECIFIED"&&(this.enforcementState="OFF"),this.allowedNonAlphanumericCharacters=(i=(r=e.allowedNonAlphanumericCharacters)===null||r===void 0?void 0:r.join(""))!==null&&i!==void 0?i:"",this.forceUpgradeOnSignin=(s=e.forceUpgradeOnSignin)!==null&&s!==void 0?s:!1,this.schemaVersion=e.schemaVersion}validatePassword(e){var t,r,i,s,a,c;let l={isValid:!0,passwordPolicy:this};return this.validatePasswordLengthOptions(e,l),this.validatePasswordCharacterOptions(e,l),l.isValid&&(l.isValid=(t=l.meetsMinPasswordLength)!==null&&t!==void 0?t:!0),l.isValid&&(l.isValid=(r=l.meetsMaxPasswordLength)!==null&&r!==void 0?r:!0),l.isValid&&(l.isValid=(i=l.containsLowercaseLetter)!==null&&i!==void 0?i:!0),l.isValid&&(l.isValid=(s=l.containsUppercaseLetter)!==null&&s!==void 0?s:!0),l.isValid&&(l.isValid=(a=l.containsNumericCharacter)!==null&&a!==void 0?a:!0),l.isValid&&(l.isValid=(c=l.containsNonAlphanumericCharacter)!==null&&c!==void 0?c:!0),l}validatePasswordLengthOptions(e,t){let r=this.customStrengthOptions.minPasswordLength,i=this.customStrengthOptions.maxPasswordLength;r&&(t.meetsMinPasswordLength=e.length>=r),i&&(t.meetsMaxPasswordLength=e.length<=i)}validatePasswordCharacterOptions(e,t){this.updatePasswordCharacterOptionsStatuses(t,!1,!1,!1,!1);let r;for(let i=0;i<e.length;i++)r=e.charAt(i),this.updatePasswordCharacterOptionsStatuses(t,r>="a"&&r<="z",r>="A"&&r<="Z",r>="0"&&r<="9",this.allowedNonAlphanumericCharacters.includes(r))}updatePasswordCharacterOptionsStatuses(e,t,r,i,s){this.customStrengthOptions.containsLowercaseLetter&&(e.containsLowercaseLetter||(e.containsLowercaseLetter=t)),this.customStrengthOptions.containsUppercaseLetter&&(e.containsUppercaseLetter||(e.containsUppercaseLetter=r)),this.customStrengthOptions.containsNumericCharacter&&(e.containsNumericCharacter||(e.containsNumericCharacter=i)),this.customStrengthOptions.containsNonAlphanumericCharacter&&(e.containsNonAlphanumericCharacter||(e.containsNonAlphanumericCharacter=s))}};var Vu=class{constructor(e,t,r,i){this.app=e,this.heartbeatServiceProvider=t,this.appCheckServiceProvider=r,this.config=i,this.currentUser=null,this.emulatorConfig=null,this.operations=Promise.resolve(),this.authStateSubscription=new Ys(this),this.idTokenSubscription=new Ys(this),this.beforeStateQueue=new xu(this),this.redirectUser=null,this.isProactiveRefreshEnabled=!1,this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION=1,this._canInitEmulator=!0,this._isInitialized=!1,this._deleted=!1,this._initializationPromise=null,this._popupRedirectResolver=null,this._errorFactory=Xf,this._agentRecaptchaConfig=null,this._tenantRecaptchaConfigs={},this._projectPasswordPolicy=null,this._tenantPasswordPolicies={},this.lastNotifiedUid=void 0,this.languageCode=null,this.tenantId=null,this.settings={appVerificationDisabledForTesting:!1},this.frameworks=[],this.name=e.name,this.clientVersion=i.sdkClientVersion}_initializeWithPersistence(e,t){return t&&(this._popupRedirectResolver=vt(t)),this._initializationPromise=this.queue(async()=>{var r,i;if(!this._deleted&&(this.persistenceManager=await Js.create(this,e),!this._deleted)){if(!((r=this._popupRedirectResolver)===null||r===void 0)&&r._shouldInitProactively)try{await this._popupRedirectResolver._initialize(this)}catch{}await this.initializeCurrentUser(t),this.lastNotifiedUid=((i=this.currentUser)===null||i===void 0?void 0:i.uid)||null,!this._deleted&&(this._isInitialized=!0)}}),this._initializationPromise}async _onStorageEvent(){if(this._deleted)return;let e=await this.assertedPersistence.getCurrentUser();if(!(!this.currentUser&&!e)){if(this.currentUser&&e&&this.currentUser.uid===e.uid){this._currentUser._assign(e),await this.currentUser.getIdToken();return}await this._updateCurrentUser(e,!0)}}async initializeCurrentUserFromIdToken(e){try{let t=await np(this,{idToken:e}),r=await $n._fromGetAccountInfoResponse(this,t,e);await this.directlySetCurrentUser(r)}catch(t){console.warn("FirebaseServerApp could not login user with provided authIdToken: ",t),await this.directlySetCurrentUser(null)}}async initializeCurrentUser(e){var t;if(Qe(this.app)){let a=this.app.settings.authIdToken;return a?new Promise(c=>{setTimeout(()=>this.initializeCurrentUserFromIdToken(a).then(c,c))}):this.directlySetCurrentUser(null)}let r=await this.assertedPersistence.getCurrentUser(),i=r,s=!1;if(e&&this.config.authDomain){await this.getOrInitRedirectPersistenceManager();let a=(t=this.redirectUser)===null||t===void 0?void 0:t._redirectEventId,c=i==null?void 0:i._redirectEventId,l=await this.tryRedirectSignIn(e);(!a||a===c)&&(l!=null&&l.user)&&(i=l.user,s=!0)}if(!i)return this.directlySetCurrentUser(null);if(!i._redirectEventId){if(s)try{await this.beforeStateQueue.runMiddleware(i)}catch(a){i=r,this._popupRedirectResolver._overrideRedirectResult(this,()=>Promise.reject(a))}return i?this.reloadAndSetCurrentUserOrClear(i):this.directlySetCurrentUser(null)}return L(this._popupRedirectResolver,this,"argument-error"),await this.getOrInitRedirectPersistenceManager(),this.redirectUser&&this.redirectUser._redirectEventId===i._redirectEventId?this.directlySetCurrentUser(i):this.reloadAndSetCurrentUserOrClear(i)}async tryRedirectSignIn(e){let t=null;try{t=await this._popupRedirectResolver._completeRedirectFn(this,e,!0)}catch{await this._setRedirectUser(null)}return t}async reloadAndSetCurrentUserOrClear(e){try{await Ws(e)}catch(t){if((t==null?void 0:t.code)!=="auth/network-request-failed")return this.directlySetCurrentUser(null)}return this.directlySetCurrentUser(e)}useDeviceLanguage(){this.languageCode=ev()}async _delete(){this._deleted=!0}async updateCurrentUser(e){if(Qe(this.app))return Promise.reject(Ot(this));let t=e?ee(e):null;return t&&L(t.auth.config.apiKey===this.config.apiKey,this,"invalid-user-token"),this._updateCurrentUser(t&&t._clone(this))}async _updateCurrentUser(e,t=!1){if(!this._deleted)return e&&L(this.tenantId===e.tenantId,this,"tenant-id-mismatch"),t||await this.beforeStateQueue.runMiddleware(e),this.queue(async()=>{await this.directlySetCurrentUser(e),this.notifyAuthListeners()})}async signOut(){return Qe(this.app)?Promise.reject(Ot(this)):(await this.beforeStateQueue.runMiddleware(null),(this.redirectPersistenceManager||this._popupRedirectResolver)&&await this._setRedirectUser(null),this._updateCurrentUser(null,!0))}setPersistence(e){return Qe(this.app)?Promise.reject(Ot(this)):this.queue(async()=>{await this.assertedPersistence.setPersistence(vt(e))})}_getRecaptchaConfig(){return this.tenantId==null?this._agentRecaptchaConfig:this._tenantRecaptchaConfigs[this.tenantId]}async validatePassword(e){this._getPasswordPolicyInternal()||await this._updatePasswordPolicy();let t=this._getPasswordPolicyInternal();return t.schemaVersion!==this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION?Promise.reject(this._errorFactory.create("unsupported-password-policy-schema-version",{})):t.validatePassword(e)}_getPasswordPolicyInternal(){return this.tenantId===null?this._projectPasswordPolicy:this._tenantPasswordPolicies[this.tenantId]}async _updatePasswordPolicy(){let e=await dv(this),t=new Ou(e);this.tenantId===null?this._projectPasswordPolicy=t:this._tenantPasswordPolicies[this.tenantId]=t}_getPersistence(){return this.assertedPersistence.persistence.type}_updateErrorMap(e){this._errorFactory=new ht("auth","Firebase",e())}onAuthStateChanged(e,t,r){return this.registerStateListener(this.authStateSubscription,e,t,r)}beforeAuthStateChanged(e,t){return this.beforeStateQueue.pushCallback(e,t)}onIdTokenChanged(e,t,r){return this.registerStateListener(this.idTokenSubscription,e,t,r)}authStateReady(){return new Promise((e,t)=>{if(this.currentUser)e();else{let r=this.onAuthStateChanged(()=>{r(),e()},t)}})}async revokeAccessToken(e){if(this.currentUser){let t=await this.currentUser.getIdToken(),r={providerId:"apple.com",tokenType:"ACCESS_TOKEN",token:e,idToken:t};this.tenantId!=null&&(r.tenantId=this.tenantId),await uv(this,r)}}toJSON(){var e;return{apiKey:this.config.apiKey,authDomain:this.config.authDomain,appName:this.name,currentUser:(e=this._currentUser)===null||e===void 0?void 0:e.toJSON()}}async _setRedirectUser(e,t){let r=await this.getOrInitRedirectPersistenceManager(t);return e===null?r.removeCurrentUser():r.setCurrentUser(e)}async getOrInitRedirectPersistenceManager(e){if(!this.redirectPersistenceManager){let t=e&&vt(e)||this._popupRedirectResolver;L(t,this,"argument-error"),this.redirectPersistenceManager=await Js.create(this,[vt(t._redirectPersistence)],"redirectUser"),this.redirectUser=await this.redirectPersistenceManager.getCurrentUser()}return this.redirectPersistenceManager}async _redirectUserForId(e){var t,r;return this._isInitialized&&await this.queue(async()=>{}),((t=this._currentUser)===null||t===void 0?void 0:t._redirectEventId)===e?this._currentUser:((r=this.redirectUser)===null||r===void 0?void 0:r._redirectEventId)===e?this.redirectUser:null}async _persistUserIfCurrent(e){if(e===this.currentUser)return this.queue(async()=>this.directlySetCurrentUser(e))}_notifyListenersIfCurrent(e){e===this.currentUser&&this.notifyAuthListeners()}_key(){return`${this.config.authDomain}:${this.config.apiKey}:${this.name}`}_startProactiveRefresh(){this.isProactiveRefreshEnabled=!0,this.currentUser&&this._currentUser._startProactiveRefresh()}_stopProactiveRefresh(){this.isProactiveRefreshEnabled=!1,this.currentUser&&this._currentUser._stopProactiveRefresh()}get _currentUser(){return this.currentUser}notifyAuthListeners(){var e,t;if(!this._isInitialized)return;this.idTokenSubscription.next(this.currentUser);let r=(t=(e=this.currentUser)===null||e===void 0?void 0:e.uid)!==null&&t!==void 0?t:null;this.lastNotifiedUid!==r&&(this.lastNotifiedUid=r,this.authStateSubscription.next(this.currentUser))}registerStateListener(e,t,r,i){if(this._deleted)return()=>{};let s=typeof t=="function"?t:t.next.bind(t),a=!1,c=this._isInitialized?Promise.resolve():this._initializationPromise;if(L(c,this,"internal-error"),c.then(()=>{a||s(this.currentUser)}),typeof t=="function"){let l=e.addObserver(t,r,i);return()=>{a=!0,l()}}else{let l=e.addObserver(t);return()=>{a=!0,l()}}}async directlySetCurrentUser(e){this.currentUser&&this.currentUser!==e&&this._currentUser._stopProactiveRefresh(),e&&this.isProactiveRefreshEnabled&&e._startProactiveRefresh(),this.currentUser=e,e?await this.assertedPersistence.setCurrentUser(e):await this.assertedPersistence.removeCurrentUser()}queue(e){return this.operations=this.operations.then(e,e),this.operations}get assertedPersistence(){return L(this.persistenceManager,this,"internal-error"),this.persistenceManager}_logFramework(e){!e||this.frameworks.includes(e)||(this.frameworks.push(e),this.frameworks.sort(),this.clientVersion=pp(this.config.clientPlatform,this._getFrameworks()))}_getFrameworks(){return this.frameworks}async _getAdditionalHeaders(){var e;let t={"X-Client-Version":this.clientVersion};this.app.options.appId&&(t["X-Firebase-gmpid"]=this.app.options.appId);let r=await((e=this.heartbeatServiceProvider.getImmediate({optional:!0}))===null||e===void 0?void 0:e.getHeartbeatsHeader());r&&(t["X-Firebase-Client"]=r);let i=await this._getAppCheckToken();return i&&(t["X-Firebase-AppCheck"]=i),t}async _getAppCheckToken(){var e;let t=await((e=this.appCheckServiceProvider.getImmediate({optional:!0}))===null||e===void 0?void 0:e.getToken());return t!=null&&t.error&&Yy(`Error while retrieving App Check token: ${t.error}`),t==null?void 0:t.token}};function Wn(n){return ee(n)}var Ys=class{constructor(e){this.auth=e,this.observer=null,this.addObserver=Nh(t=>this.observer=t)}get next(){return L(this.observer,this.auth,"internal-error"),this.observer.next.bind(this.observer)}};var mo={async loadJS(){throw new Error("Unable to load external scripts")},recaptchaV2Script:"",recaptchaEnterpriseScript:"",gapiScript:""};function pv(n){mo=n}function mp(n){return mo.loadJS(n)}function mv(){return mo.recaptchaEnterpriseScript}function gv(){return mo.gapiScript}function gp(n){return`__${n}${Math.floor(Math.random()*1e6)}`}var _v="recaptcha-enterprise",yv="NO_RECAPTCHA",Lu=class{constructor(e){this.type=_v,this.auth=Wn(e)}async verify(e="verify",t=!1){async function r(s){if(!t){if(s.tenantId==null&&s._agentRecaptchaConfig!=null)return s._agentRecaptchaConfig.siteKey;if(s.tenantId!=null&&s._tenantRecaptchaConfigs[s.tenantId]!==void 0)return s._tenantRecaptchaConfigs[s.tenantId].siteKey}return new Promise(async(a,c)=>{iv(s,{clientType:"CLIENT_TYPE_WEB",version:"RECAPTCHA_ENTERPRISE"}).then(l=>{if(l.recaptchaKey===void 0)c(new Error("recaptcha Enterprise site key undefined"));else{let d=new ku(l);return s.tenantId==null?s._agentRecaptchaConfig=d:s._tenantRecaptchaConfigs[s.tenantId]=d,a(d.siteKey)}}).catch(l=>{c(l)})})}function i(s,a,c){let l=window.grecaptcha;Of(l)?l.enterprise.ready(()=>{l.enterprise.execute(s,{action:e}).then(d=>{a(d)}).catch(()=>{a(yv)})}):c(Error("No reCAPTCHA enterprise script loaded."))}return new Promise((s,a)=>{r(this.auth).then(c=>{if(!t&&Of(window.grecaptcha))i(c,s,a);else{if(typeof window=="undefined"){a(new Error("RecaptchaVerifier is only supported in browser"));return}let l=mv();l.length!==0&&(l+=c),mp(l).then(()=>{i(c,s,a)}).catch(d=>{a(d)})}}).catch(c=>{a(c)})})}};async function Ff(n,e,t,r=!1){let i=new Lu(n),s;try{s=await i.verify(t)}catch{s=await i.verify(t,!0)}let a=Object.assign({},e);return r?Object.assign(a,{captchaResp:s}):Object.assign(a,{captchaResponse:s}),Object.assign(a,{clientType:"CLIENT_TYPE_WEB"}),Object.assign(a,{recaptchaVersion:"RECAPTCHA_ENTERPRISE"}),a}async function Uf(n,e,t,r){var i;if(!((i=n._getRecaptchaConfig())===null||i===void 0)&&i.isProviderEnabled("EMAIL_PASSWORD_PROVIDER")){let s=await Ff(n,e,t,t==="getOobCode");return r(n,s)}else return r(n,e).catch(async s=>{if(s.code==="auth/missing-recaptcha-token"){console.log(`${t} is protected by reCAPTCHA Enterprise for this project. Automatically triggering the reCAPTCHA flow and restarting the flow.`);let a=await Ff(n,e,t,t==="getOobCode");return r(n,a)}else return Promise.reject(s)})}function _p(n,e){let t=Gt(n,"auth");if(t.isInitialized()){let i=t.getImmediate(),s=t.getOptions();if(jt(s,e!=null?e:{}))return i;$e(i,"already-initialized")}return t.initialize({options:e})}function vv(n,e){let t=(e==null?void 0:e.persistence)||[],r=(Array.isArray(t)?t:[t]).map(vt);e!=null&&e.errorMap&&n._updateErrorMap(e.errorMap),n._initializeWithPersistence(r,e==null?void 0:e.popupRedirectResolver)}function yp(n,e,t){let r=Wn(n);L(r._canInitEmulator,r,"emulator-config-failed"),L(/^https?:\/\//.test(e),r,"invalid-emulator-scheme");let i=!!(t!=null&&t.disableWarnings),s=vp(e),{host:a,port:c}=Iv(e),l=c===null?"":`:${c}`;r.config.emulator={url:`${s}//${a}${l}/`},r.settings.appVerificationDisabledForTesting=!0,r.emulatorConfig=Object.freeze({host:a,port:c,protocol:s.replace(":",""),options:Object.freeze({disableWarnings:i})}),i||wv()}function vp(n){let e=n.indexOf(":");return e<0?"":n.substr(0,e+1)}function Iv(n){let e=vp(n),t=/(\/\/)?([^?#/]+)/.exec(n.substr(e.length));if(!t)return{host:"",port:null};let r=t[2].split("@").pop()||"",i=/^(\[[^\]]+\])(:|$)/.exec(r);if(i){let s=i[1];return{host:s,port:qf(r.substr(s.length+1))}}else{let[s,a]=r.split(":");return{host:s,port:qf(a)}}}function qf(n){if(!n)return null;let e=Number(n);return isNaN(e)?null:e}function wv(){function n(){let e=document.createElement("p"),t=e.style;e.innerText="Running in emulator mode. Do not use with production credentials.",t.position="fixed",t.width="100%",t.backgroundColor="#ffffff",t.border=".1em solid #000000",t.color="#b50000",t.bottom="0px",t.left="0px",t.margin="0px",t.zIndex="10000",t.textAlign="center",e.classList.add("firebase-emulator-warning"),document.body.appendChild(e)}typeof console!="undefined"&&typeof console.info=="function"&&console.info("WARNING: You are using the Auth Emulator, which is intended for local testing only.  Do not use with production credentials."),typeof window!="undefined"&&typeof document!="undefined"&&(document.readyState==="loading"?window.addEventListener("DOMContentLoaded",n):n())}var an=class{constructor(e,t){this.providerId=e,this.signInMethod=t}toJSON(){return it("not implemented")}_getIdTokenResponse(e){return it("not implemented")}_linkToIdToken(e,t){return it("not implemented")}_getReauthenticationResolver(e){return it("not implemented")}};async function Ev(n,e){return Ce(n,"POST","/v1/accounts:signUp",e)}async function Tv(n,e){return Vt(n,"POST","/v1/accounts:signInWithPassword",fe(n,e))}async function bv(n,e){return Vt(n,"POST","/v1/accounts:signInWithEmailLink",fe(n,e))}async function Av(n,e){return Vt(n,"POST","/v1/accounts:signInWithEmailLink",fe(n,e))}var ri=class n extends an{constructor(e,t,r,i=null){super("password",r),this._email=e,this._password=t,this._tenantId=i}static _fromEmailAndPassword(e,t){return new n(e,t,"password")}static _fromEmailAndCode(e,t,r=null){return new n(e,t,"emailLink",r)}toJSON(){return{email:this._email,password:this._password,signInMethod:this.signInMethod,tenantId:this._tenantId}}static fromJSON(e){let t=typeof e=="string"?JSON.parse(e):e;if(t!=null&&t.email&&(t!=null&&t.password)){if(t.signInMethod==="password")return this._fromEmailAndPassword(t.email,t.password);if(t.signInMethod==="emailLink")return this._fromEmailAndCode(t.email,t.password,t.tenantId)}return null}async _getIdTokenResponse(e){switch(this.signInMethod){case"password":let t={returnSecureToken:!0,email:this._email,password:this._password,clientType:"CLIENT_TYPE_WEB"};return Uf(e,t,"signInWithPassword",Tv);case"emailLink":return bv(e,{email:this._email,oobCode:this._password});default:$e(e,"internal-error")}}async _linkToIdToken(e,t){switch(this.signInMethod){case"password":let r={idToken:t,returnSecureToken:!0,email:this._email,password:this._password,clientType:"CLIENT_TYPE_WEB"};return Uf(e,r,"signUpPassword",Ev);case"emailLink":return Av(e,{idToken:t,email:this._email,oobCode:this._password});default:$e(e,"internal-error")}}_getReauthenticationResolver(e){return this._getIdTokenResponse(e)}};async function Gn(n,e){return Vt(n,"POST","/v1/accounts:signInWithIdp",fe(n,e))}var Sv="http://localhost",cn=class n extends an{constructor(){super(...arguments),this.pendingToken=null}static _fromParams(e){let t=new n(e.providerId,e.signInMethod);return e.idToken||e.accessToken?(e.idToken&&(t.idToken=e.idToken),e.accessToken&&(t.accessToken=e.accessToken),e.nonce&&!e.pendingToken&&(t.nonce=e.nonce),e.pendingToken&&(t.pendingToken=e.pendingToken)):e.oauthToken&&e.oauthTokenSecret?(t.accessToken=e.oauthToken,t.secret=e.oauthTokenSecret):$e("argument-error"),t}toJSON(){return{idToken:this.idToken,accessToken:this.accessToken,secret:this.secret,nonce:this.nonce,pendingToken:this.pendingToken,providerId:this.providerId,signInMethod:this.signInMethod}}static fromJSON(e){let t=typeof e=="string"?JSON.parse(e):e,{providerId:r,signInMethod:i}=t,s=qs(t,["providerId","signInMethod"]);if(!r||!i)return null;let a=new n(r,i);return a.idToken=s.idToken||void 0,a.accessToken=s.accessToken||void 0,a.secret=s.secret,a.nonce=s.nonce,a.pendingToken=s.pendingToken||null,a}_getIdTokenResponse(e){let t=this.buildRequest();return Gn(e,t)}_linkToIdToken(e,t){let r=this.buildRequest();return r.idToken=t,Gn(e,r)}_getReauthenticationResolver(e){let t=this.buildRequest();return t.autoCreate=!1,Gn(e,t)}buildRequest(){let e={requestUri:Sv,returnSecureToken:!0};if(this.pendingToken)e.pendingToken=this.pendingToken;else{let t={};this.idToken&&(t.id_token=this.idToken),this.accessToken&&(t.access_token=this.accessToken),this.secret&&(t.oauth_token_secret=this.secret),t.providerId=this.providerId,this.nonce&&!this.pendingToken&&(t.nonce=this.nonce),e.postBody=_n(t)}return e}};async function Rv(n,e){return Ce(n,"POST","/v1/accounts:sendVerificationCode",fe(n,e))}async function Pv(n,e){return Vt(n,"POST","/v1/accounts:signInWithPhoneNumber",fe(n,e))}async function Cv(n,e){let t=await Vt(n,"POST","/v1/accounts:signInWithPhoneNumber",fe(n,e));if(t.temporaryProof)throw Xr(n,"account-exists-with-different-credential",t);return t}var kv={USER_NOT_FOUND:"user-not-found"};async function Nv(n,e){let t=Object.assign(Object.assign({},e),{operation:"REAUTH"});return Vt(n,"POST","/v1/accounts:signInWithPhoneNumber",fe(n,t),kv)}var ii=class n extends an{constructor(e){super("phone","phone"),this.params=e}static _fromVerification(e,t){return new n({verificationId:e,verificationCode:t})}static _fromTokenResponse(e,t){return new n({phoneNumber:e,temporaryProof:t})}_getIdTokenResponse(e){return Pv(e,this._makeVerificationRequest())}_linkToIdToken(e,t){return Cv(e,Object.assign({idToken:t},this._makeVerificationRequest()))}_getReauthenticationResolver(e){return Nv(e,this._makeVerificationRequest())}_makeVerificationRequest(){let{temporaryProof:e,phoneNumber:t,verificationId:r,verificationCode:i}=this.params;return e&&t?{temporaryProof:e,phoneNumber:t}:{sessionInfo:r,code:i}}toJSON(){let e={providerId:this.providerId};return this.params.phoneNumber&&(e.phoneNumber=this.params.phoneNumber),this.params.temporaryProof&&(e.temporaryProof=this.params.temporaryProof),this.params.verificationCode&&(e.verificationCode=this.params.verificationCode),this.params.verificationId&&(e.verificationId=this.params.verificationId),e}static fromJSON(e){typeof e=="string"&&(e=JSON.parse(e));let{verificationId:t,verificationCode:r,phoneNumber:i,temporaryProof:s}=e;return!r&&!t&&!i&&!s?null:new n({verificationId:t,verificationCode:r,phoneNumber:i,temporaryProof:s})}};function Dv(n){switch(n){case"recoverEmail":return"RECOVER_EMAIL";case"resetPassword":return"PASSWORD_RESET";case"signIn":return"EMAIL_SIGNIN";case"verifyEmail":return"VERIFY_EMAIL";case"verifyAndChangeEmail":return"VERIFY_AND_CHANGE_EMAIL";case"revertSecondFactorAddition":return"REVERT_SECOND_FACTOR_ADDITION";default:return null}}function xv(n){let e=yn(vn(n)).link,t=e?yn(vn(e)).deep_link_id:null,r=yn(vn(n)).deep_link_id;return(r?yn(vn(r)).link:null)||r||t||e||n}var Xs=class n{constructor(e){var t,r,i,s,a,c;let l=yn(vn(e)),d=(t=l.apiKey)!==null&&t!==void 0?t:null,p=(r=l.oobCode)!==null&&r!==void 0?r:null,g=Dv((i=l.mode)!==null&&i!==void 0?i:null);L(d&&p&&g,"argument-error"),this.apiKey=d,this.operation=g,this.code=p,this.continueUrl=(s=l.continueUrl)!==null&&s!==void 0?s:null,this.languageCode=(a=l.languageCode)!==null&&a!==void 0?a:null,this.tenantId=(c=l.tenantId)!==null&&c!==void 0?c:null}static parseLink(e){let t=xv(e);try{return new n(t)}catch{return null}}};var Kn=class n{constructor(){this.providerId=n.PROVIDER_ID}static credential(e,t){return ri._fromEmailAndPassword(e,t)}static credentialWithLink(e,t){let r=Xs.parseLink(t);return L(r,"argument-error"),ri._fromEmailAndCode(e,r.code,r.tenantId)}};Kn.PROVIDER_ID="password";Kn.EMAIL_PASSWORD_SIGN_IN_METHOD="password";Kn.EMAIL_LINK_SIGN_IN_METHOD="emailLink";var Zs=class{constructor(e){this.providerId=e,this.defaultLanguageCode=null,this.customParameters={}}setDefaultLanguage(e){this.defaultLanguageCode=e}setCustomParameters(e){return this.customParameters=e,this}getCustomParameters(){return this.customParameters}};var un=class extends Zs{constructor(){super(...arguments),this.scopes=[]}addScope(e){return this.scopes.includes(e)||this.scopes.push(e),this}getScopes(){return[...this.scopes]}};var si=class n extends un{constructor(){super("facebook.com")}static credential(e){return cn._fromParams({providerId:n.PROVIDER_ID,signInMethod:n.FACEBOOK_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return n.credentialFromTaggedObject(e)}static credentialFromError(e){return n.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return n.credential(e.oauthAccessToken)}catch{return null}}};si.FACEBOOK_SIGN_IN_METHOD="facebook.com";si.PROVIDER_ID="facebook.com";var oi=class n extends un{constructor(){super("google.com"),this.addScope("profile")}static credential(e,t){return cn._fromParams({providerId:n.PROVIDER_ID,signInMethod:n.GOOGLE_SIGN_IN_METHOD,idToken:e,accessToken:t})}static credentialFromResult(e){return n.credentialFromTaggedObject(e)}static credentialFromError(e){return n.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;let{oauthIdToken:t,oauthAccessToken:r}=e;if(!t&&!r)return null;try{return n.credential(t,r)}catch{return null}}};oi.GOOGLE_SIGN_IN_METHOD="google.com";oi.PROVIDER_ID="google.com";var ai=class n extends un{constructor(){super("github.com")}static credential(e){return cn._fromParams({providerId:n.PROVIDER_ID,signInMethod:n.GITHUB_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return n.credentialFromTaggedObject(e)}static credentialFromError(e){return n.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return n.credential(e.oauthAccessToken)}catch{return null}}};ai.GITHUB_SIGN_IN_METHOD="github.com";ai.PROVIDER_ID="github.com";var ci=class n extends un{constructor(){super("twitter.com")}static credential(e,t){return cn._fromParams({providerId:n.PROVIDER_ID,signInMethod:n.TWITTER_SIGN_IN_METHOD,oauthToken:e,oauthTokenSecret:t})}static credentialFromResult(e){return n.credentialFromTaggedObject(e)}static credentialFromError(e){return n.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;let{oauthAccessToken:t,oauthTokenSecret:r}=e;if(!t||!r)return null;try{return n.credential(t,r)}catch{return null}}};ci.TWITTER_SIGN_IN_METHOD="twitter.com";ci.PROVIDER_ID="twitter.com";var Hn=class n{constructor(e){this.user=e.user,this.providerId=e.providerId,this._tokenResponse=e._tokenResponse,this.operationType=e.operationType}static async _fromIdTokenResponse(e,t,r,i=!1){let s=await $n._fromIdTokenResponse(e,r,i),a=Bf(r);return new n({user:s,providerId:a,_tokenResponse:r,operationType:t})}static async _forOperation(e,t,r){await e._updateTokensIfNecessary(r,!0);let i=Bf(r);return new n({user:e,providerId:i,_tokenResponse:r,operationType:t})}};function Bf(n){return n.providerId?n.providerId:"phoneNumber"in n?"phone":null}var Mu=class n extends De{constructor(e,t,r,i){var s;super(t.code,t.message),this.operationType=r,this.user=i,Object.setPrototypeOf(this,n.prototype),this.customData={appName:e.name,tenantId:(s=e.tenantId)!==null&&s!==void 0?s:void 0,_serverResponse:t.customData._serverResponse,operationType:r}}static _fromErrorAndOperation(e,t,r,i){return new n(e,t,r,i)}};function Ip(n,e,t,r){return(e==="reauthenticate"?t._getReauthenticationResolver(n):t._getIdTokenResponse(n)).catch(s=>{throw s.code==="auth/multi-factor-auth-required"?Mu._fromErrorAndOperation(n,s,e,r):s})}async function Ov(n,e,t=!1){let r=await ti(n,e._linkToIdToken(n.auth,await n.getIdToken()),t);return Hn._forOperation(n,"link",r)}async function Vv(n,e,t=!1){let{auth:r}=n;if(Qe(r.app))return Promise.reject(Ot(r));let i="reauthenticate";try{let s=await ti(n,Ip(r,i,e,n),t);L(s.idToken,r,"internal-error");let a=Wu(s.idToken);L(a,r,"internal-error");let{sub:c}=a;return L(n.uid===c,r,"user-mismatch"),Hn._forOperation(n,i,s)}catch(s){throw(s==null?void 0:s.code)==="auth/user-not-found"&&$e(r,"user-mismatch"),s}}async function Lv(n,e,t=!1){if(Qe(n.app))return Promise.reject(Ot(n));let r="signIn",i=await Ip(n,r,e),s=await Hn._fromIdTokenResponse(n,r,i);return t||await n._updateCurrentUser(s.user),s}async function Mv(n,e){return Vt(n,"POST","/v1/accounts:signInWithCustomToken",fe(n,e))}async function Ju(n,e){if(Qe(n.app))return Promise.reject(Ot(n));let t=Wn(n),r=await Mv(t,{token:e,returnSecureToken:!0}),i=await Hn._fromIdTokenResponse(t,"signIn",r);return await t._updateCurrentUser(i.user),i}function wp(n,e,t,r){return ee(n).onIdTokenChanged(e,t,r)}function Ep(n,e,t){return ee(n).beforeAuthStateChanged(e,t)}function Yu(n,e,t,r){return ee(n).onAuthStateChanged(e,t,r)}function Fv(n,e){return Ce(n,"POST","/v2/accounts/mfaEnrollment:start",fe(n,e))}function Uv(n,e){return Ce(n,"POST","/v2/accounts/mfaEnrollment:finalize",fe(n,e))}function qv(n,e){return Ce(n,"POST","/v2/accounts/mfaEnrollment:start",fe(n,e))}function Bv(n,e){return Ce(n,"POST","/v2/accounts/mfaEnrollment:finalize",fe(n,e))}var eo="__sak";var to=class{constructor(e,t){this.storageRetriever=e,this.type=t}_isAvailable(){try{return this.storage?(this.storage.setItem(eo,"1"),this.storage.removeItem(eo),Promise.resolve(!0)):Promise.resolve(!1)}catch{return Promise.resolve(!1)}}_set(e,t){return this.storage.setItem(e,JSON.stringify(t)),Promise.resolve()}_get(e){let t=this.storage.getItem(e);return Promise.resolve(t?JSON.parse(t):null)}_remove(e){return this.storage.removeItem(e),Promise.resolve()}get storage(){return this.storageRetriever()}};var jv=1e3,zv=10,no=class extends to{constructor(){super(()=>window.localStorage,"LOCAL"),this.boundEventHandler=(e,t)=>this.onStorageEvent(e,t),this.listeners={},this.localCache={},this.pollTimer=null,this.fallbackToPolling=fp(),this._shouldAllowMigration=!0}forAllChangedKeys(e){for(let t of Object.keys(this.listeners)){let r=this.storage.getItem(t),i=this.localCache[t];r!==i&&e(t,i,r)}}onStorageEvent(e,t=!1){if(!e.key){this.forAllChangedKeys((a,c,l)=>{this.notifyListeners(a,l)});return}let r=e.key;t?this.detachListener():this.stopPolling();let i=()=>{let a=this.storage.getItem(r);!t&&this.localCache[r]===a||this.notifyListeners(r,a)},s=this.storage.getItem(r);hv()&&s!==e.newValue&&e.newValue!==e.oldValue?setTimeout(i,zv):i()}notifyListeners(e,t){this.localCache[e]=t;let r=this.listeners[e];if(r)for(let i of Array.from(r))i(t&&JSON.parse(t))}startPolling(){this.stopPolling(),this.pollTimer=setInterval(()=>{this.forAllChangedKeys((e,t,r)=>{this.onStorageEvent(new StorageEvent("storage",{key:e,oldValue:t,newValue:r}),!0)})},jv)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}attachListener(){window.addEventListener("storage",this.boundEventHandler)}detachListener(){window.removeEventListener("storage",this.boundEventHandler)}_addListener(e,t){Object.keys(this.listeners).length===0&&(this.fallbackToPolling?this.startPolling():this.attachListener()),this.listeners[e]||(this.listeners[e]=new Set,this.localCache[e]=this.storage.getItem(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&(this.detachListener(),this.stopPolling())}async _set(e,t){await super._set(e,t),this.localCache[e]=JSON.stringify(t)}async _get(e){let t=await super._get(e);return this.localCache[e]=JSON.stringify(t),t}async _remove(e){await super._remove(e),delete this.localCache[e]}};no.type="LOCAL";var Tp=no;var ro=class extends to{constructor(){super(()=>window.sessionStorage,"SESSION")}_addListener(e,t){}_removeListener(e,t){}};ro.type="SESSION";var Xu=ro;function Gv(n){return Promise.all(n.map(async e=>{try{return{fulfilled:!0,value:await e}}catch(t){return{fulfilled:!1,reason:t}}}))}var io=class n{constructor(e){this.eventTarget=e,this.handlersMap={},this.boundEventHandler=this.handleEvent.bind(this)}static _getInstance(e){let t=this.receivers.find(i=>i.isListeningto(e));if(t)return t;let r=new n(e);return this.receivers.push(r),r}isListeningto(e){return this.eventTarget===e}async handleEvent(e){let t=e,{eventId:r,eventType:i,data:s}=t.data,a=this.handlersMap[i];if(!(a!=null&&a.size))return;t.ports[0].postMessage({status:"ack",eventId:r,eventType:i});let c=Array.from(a).map(async d=>d(t.origin,s)),l=await Gv(c);t.ports[0].postMessage({status:"done",eventId:r,eventType:i,response:l})}_subscribe(e,t){Object.keys(this.handlersMap).length===0&&this.eventTarget.addEventListener("message",this.boundEventHandler),this.handlersMap[e]||(this.handlersMap[e]=new Set),this.handlersMap[e].add(t)}_unsubscribe(e,t){this.handlersMap[e]&&t&&this.handlersMap[e].delete(t),(!t||this.handlersMap[e].size===0)&&delete this.handlersMap[e],Object.keys(this.handlersMap).length===0&&this.eventTarget.removeEventListener("message",this.boundEventHandler)}};io.receivers=[];function Zu(n="",e=10){let t="";for(let r=0;r<e;r++)t+=Math.floor(Math.random()*10);return n+t}var Fu=class{constructor(e){this.target=e,this.handlers=new Set}removeMessageHandler(e){e.messageChannel&&(e.messageChannel.port1.removeEventListener("message",e.onMessage),e.messageChannel.port1.close()),this.handlers.delete(e)}async _send(e,t,r=50){let i=typeof MessageChannel!="undefined"?new MessageChannel:null;if(!i)throw new Error("connection_unavailable");let s,a;return new Promise((c,l)=>{let d=Zu("",20);i.port1.start();let p=setTimeout(()=>{l(new Error("unsupported_event"))},r);a={messageChannel:i,onMessage(g){let v=g;if(v.data.eventId===d)switch(v.data.status){case"ack":clearTimeout(p),s=setTimeout(()=>{l(new Error("timeout"))},3e3);break;case"done":clearTimeout(s),c(v.data.response);break;default:clearTimeout(p),clearTimeout(s),l(new Error("invalid_response"));break}}},this.handlers.add(a),i.port1.addEventListener("message",a.onMessage),this.target.postMessage({eventType:e,eventId:d,data:t},[i.port2])}).finally(()=>{a&&this.removeMessageHandler(a)})}};function ot(){return window}function $v(n){ot().location.href=n}function bp(){return typeof ot().WorkerGlobalScope!="undefined"&&typeof ot().importScripts=="function"}async function Kv(){if(!(navigator!=null&&navigator.serviceWorker))return null;try{return(await navigator.serviceWorker.ready).active}catch{return null}}function Hv(){var n;return((n=navigator==null?void 0:navigator.serviceWorker)===null||n===void 0?void 0:n.controller)||null}function Wv(){return bp()?self:null}var Ap="firebaseLocalStorageDb",Qv=1,so="firebaseLocalStorage",Sp="fbase_key",ln=class{constructor(e){this.request=e}toPromise(){return new Promise((e,t)=>{this.request.addEventListener("success",()=>{e(this.request.result)}),this.request.addEventListener("error",()=>{t(this.request.error)})})}};function go(n,e){return n.transaction([so],e?"readwrite":"readonly").objectStore(so)}function Jv(){let n=indexedDB.deleteDatabase(Ap);return new ln(n).toPromise()}function Uu(){let n=indexedDB.open(Ap,Qv);return new Promise((e,t)=>{n.addEventListener("error",()=>{t(n.error)}),n.addEventListener("upgradeneeded",()=>{let r=n.result;try{r.createObjectStore(so,{keyPath:Sp})}catch(i){t(i)}}),n.addEventListener("success",async()=>{let r=n.result;r.objectStoreNames.contains(so)?e(r):(r.close(),await Jv(),e(await Uu()))})})}async function jf(n,e,t){let r=go(n,!0).put({[Sp]:e,value:t});return new ln(r).toPromise()}async function Yv(n,e){let t=go(n,!1).get(e),r=await new ln(t).toPromise();return r===void 0?null:r.value}function zf(n,e){let t=go(n,!0).delete(e);return new ln(t).toPromise()}var Xv=800,Zv=3,oo=class{constructor(){this.type="LOCAL",this._shouldAllowMigration=!0,this.listeners={},this.localCache={},this.pollTimer=null,this.pendingWrites=0,this.receiver=null,this.sender=null,this.serviceWorkerReceiverAvailable=!1,this.activeServiceWorker=null,this._workerInitializationPromise=this.initializeServiceWorkerMessaging().then(()=>{},()=>{})}async _openDb(){return this.db?this.db:(this.db=await Uu(),this.db)}async _withRetries(e){let t=0;for(;;)try{let r=await this._openDb();return await e(r)}catch(r){if(t++>Zv)throw r;this.db&&(this.db.close(),this.db=void 0)}}async initializeServiceWorkerMessaging(){return bp()?this.initializeReceiver():this.initializeSender()}async initializeReceiver(){this.receiver=io._getInstance(Wv()),this.receiver._subscribe("keyChanged",async(e,t)=>({keyProcessed:(await this._poll()).includes(t.key)})),this.receiver._subscribe("ping",async(e,t)=>["keyChanged"])}async initializeSender(){var e,t;if(this.activeServiceWorker=await Kv(),!this.activeServiceWorker)return;this.sender=new Fu(this.activeServiceWorker);let r=await this.sender._send("ping",{},800);r&&!((e=r[0])===null||e===void 0)&&e.fulfilled&&!((t=r[0])===null||t===void 0)&&t.value.includes("keyChanged")&&(this.serviceWorkerReceiverAvailable=!0)}async notifyServiceWorker(e){if(!(!this.sender||!this.activeServiceWorker||Hv()!==this.activeServiceWorker))try{await this.sender._send("keyChanged",{key:e},this.serviceWorkerReceiverAvailable?800:50)}catch{}}async _isAvailable(){try{if(!indexedDB)return!1;let e=await Uu();return await jf(e,eo,"1"),await zf(e,eo),!0}catch{}return!1}async _withPendingWrite(e){this.pendingWrites++;try{await e()}finally{this.pendingWrites--}}async _set(e,t){return this._withPendingWrite(async()=>(await this._withRetries(r=>jf(r,e,t)),this.localCache[e]=t,this.notifyServiceWorker(e)))}async _get(e){let t=await this._withRetries(r=>Yv(r,e));return this.localCache[e]=t,t}async _remove(e){return this._withPendingWrite(async()=>(await this._withRetries(t=>zf(t,e)),delete this.localCache[e],this.notifyServiceWorker(e)))}async _poll(){let e=await this._withRetries(i=>{let s=go(i,!1).getAll();return new ln(s).toPromise()});if(!e)return[];if(this.pendingWrites!==0)return[];let t=[],r=new Set;if(e.length!==0)for(let{fbase_key:i,value:s}of e)r.add(i),JSON.stringify(this.localCache[i])!==JSON.stringify(s)&&(this.notifyListeners(i,s),t.push(i));for(let i of Object.keys(this.localCache))this.localCache[i]&&!r.has(i)&&(this.notifyListeners(i,null),t.push(i));return t}notifyListeners(e,t){this.localCache[e]=t;let r=this.listeners[e];if(r)for(let i of Array.from(r))i(t)}startPolling(){this.stopPolling(),this.pollTimer=setInterval(async()=>this._poll(),Xv)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}_addListener(e,t){Object.keys(this.listeners).length===0&&this.startPolling(),this.listeners[e]||(this.listeners[e]=new Set,this._get(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&this.stopPolling()}};oo.type="LOCAL";var Rp=oo;function eI(n,e){return Ce(n,"POST","/v2/accounts/mfaSignIn:start",fe(n,e))}function tI(n,e){return Ce(n,"POST","/v2/accounts/mfaSignIn:finalize",fe(n,e))}function nI(n,e){return Ce(n,"POST","/v2/accounts/mfaSignIn:finalize",fe(n,e))}var iT=gp("rcb"),sT=new on(3e4,6e4);var rI="recaptcha";async function iI(n,e,t){var r;let i=await t.verify();try{L(typeof i=="string",n,"argument-error"),L(t.type===rI,n,"argument-error");let s;if(typeof e=="string"?s={phoneNumber:e}:s=e,"session"in s){let a=s.session;if("phoneNumber"in s)return L(a.type==="enroll",n,"internal-error"),(await Fv(n,{idToken:a.credential,phoneEnrollmentInfo:{phoneNumber:s.phoneNumber,recaptchaToken:i}})).phoneSessionInfo.sessionInfo;{L(a.type==="signin",n,"internal-error");let c=((r=s.multiFactorHint)===null||r===void 0?void 0:r.uid)||s.multiFactorUid;return L(c,n,"missing-multi-factor-info"),(await eI(n,{mfaPendingCredential:a.credential,mfaEnrollmentId:c,phoneSignInInfo:{recaptchaToken:i}})).phoneResponseInfo.sessionInfo}}else{let{sessionInfo:a}=await Rv(n,{phoneNumber:s.phoneNumber,recaptchaToken:i});return a}}finally{t._reset()}}var ui=class n{constructor(e){this.providerId=n.PROVIDER_ID,this.auth=Wn(e)}verifyPhoneNumber(e,t){return iI(this.auth,e,ee(t))}static credential(e,t){return ii._fromVerification(e,t)}static credentialFromResult(e){let t=e;return n.credentialFromTaggedObject(t)}static credentialFromError(e){return n.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;let{phoneNumber:t,temporaryProof:r}=e;return t&&r?ii._fromTokenResponse(t,r):null}};ui.PROVIDER_ID="phone";ui.PHONE_SIGN_IN_METHOD="phone";function sI(n,e){return e?vt(e):(L(n._popupRedirectResolver,n,"argument-error"),n._popupRedirectResolver)}var li=class extends an{constructor(e){super("custom","custom"),this.params=e}_getIdTokenResponse(e){return Gn(e,this._buildIdpRequest())}_linkToIdToken(e,t){return Gn(e,this._buildIdpRequest(t))}_getReauthenticationResolver(e){return Gn(e,this._buildIdpRequest())}_buildIdpRequest(e){let t={requestUri:this.params.requestUri,sessionId:this.params.sessionId,postBody:this.params.postBody,tenantId:this.params.tenantId,pendingToken:this.params.pendingToken,returnSecureToken:!0,returnIdpCredential:!0};return e&&(t.idToken=e),t}};function oI(n){return Lv(n.auth,new li(n),n.bypassAuthState)}function aI(n){let{auth:e,user:t}=n;return L(t,e,"internal-error"),Vv(t,new li(n),n.bypassAuthState)}async function cI(n){let{auth:e,user:t}=n;return L(t,e,"internal-error"),Ov(t,new li(n),n.bypassAuthState)}var ao=class{constructor(e,t,r,i,s=!1){this.auth=e,this.resolver=r,this.user=i,this.bypassAuthState=s,this.pendingPromise=null,this.eventManager=null,this.filter=Array.isArray(t)?t:[t]}execute(){return new Promise(async(e,t)=>{this.pendingPromise={resolve:e,reject:t};try{this.eventManager=await this.resolver._initialize(this.auth),await this.onExecution(),this.eventManager.registerConsumer(this)}catch(r){this.reject(r)}})}async onAuthEvent(e){let{urlResponse:t,sessionId:r,postBody:i,tenantId:s,error:a,type:c}=e;if(a){this.reject(a);return}let l={auth:this.auth,requestUri:t,sessionId:r,tenantId:s||void 0,postBody:i||void 0,user:this.user,bypassAuthState:this.bypassAuthState};try{this.resolve(await this.getIdpTask(c)(l))}catch(d){this.reject(d)}}onError(e){this.reject(e)}getIdpTask(e){switch(e){case"signInViaPopup":case"signInViaRedirect":return oI;case"linkViaPopup":case"linkViaRedirect":return cI;case"reauthViaPopup":case"reauthViaRedirect":return aI;default:$e(this.auth,"internal-error")}}resolve(e){It(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.resolve(e),this.unregisterAndCleanUp()}reject(e){It(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.reject(e),this.unregisterAndCleanUp()}unregisterAndCleanUp(){this.eventManager&&this.eventManager.unregisterConsumer(this),this.pendingPromise=null,this.cleanUp()}};var uI=new on(2e3,1e4);var qu=class n extends ao{constructor(e,t,r,i,s){super(e,t,i,s),this.provider=r,this.authWindow=null,this.pollId=null,n.currentPopupAction&&n.currentPopupAction.cancel(),n.currentPopupAction=this}async executeNotNull(){let e=await this.execute();return L(e,this.auth,"internal-error"),e}async onExecution(){It(this.filter.length===1,"Popup operations only handle one event");let e=Zu();this.authWindow=await this.resolver._openPopup(this.auth,this.provider,this.filter[0],e),this.authWindow.associatedEvent=e,this.resolver._originValidation(this.auth).catch(t=>{this.reject(t)}),this.resolver._isIframeWebStorageSupported(this.auth,t=>{t||this.reject(st(this.auth,"web-storage-unsupported"))}),this.pollUserCancellation()}get eventId(){var e;return((e=this.authWindow)===null||e===void 0?void 0:e.associatedEvent)||null}cancel(){this.reject(st(this.auth,"cancelled-popup-request"))}cleanUp(){this.authWindow&&this.authWindow.close(),this.pollId&&window.clearTimeout(this.pollId),this.authWindow=null,this.pollId=null,n.currentPopupAction=null}pollUserCancellation(){let e=()=>{var t,r;if(!((r=(t=this.authWindow)===null||t===void 0?void 0:t.window)===null||r===void 0)&&r.closed){this.pollId=window.setTimeout(()=>{this.pollId=null,this.reject(st(this.auth,"popup-closed-by-user"))},8e3);return}this.pollId=window.setTimeout(e,uI.get())};e()}};qu.currentPopupAction=null;var lI="pendingRedirect",Gs=new Map,Bu=class extends ao{constructor(e,t,r=!1){super(e,["signInViaRedirect","linkViaRedirect","reauthViaRedirect","unknown"],t,void 0,r),this.eventId=null}async execute(){let e=Gs.get(this.auth._key());if(!e){try{let r=await hI(this.resolver,this.auth)?await super.execute():null;e=()=>Promise.resolve(r)}catch(t){e=()=>Promise.reject(t)}Gs.set(this.auth._key(),e)}return this.bypassAuthState||Gs.set(this.auth._key(),()=>Promise.resolve(null)),e()}async onAuthEvent(e){if(e.type==="signInViaRedirect")return super.onAuthEvent(e);if(e.type==="unknown"){this.resolve(null);return}if(e.eventId){let t=await this.auth._redirectUserForId(e.eventId);if(t)return this.user=t,super.onAuthEvent(e);this.resolve(null)}}async onExecution(){}cleanUp(){}};async function hI(n,e){let t=pI(e),r=fI(n);if(!await r._isAvailable())return!1;let i=await r._get(t)==="true";return await r._remove(t),i}function dI(n,e){Gs.set(n._key(),e)}function fI(n){return vt(n._redirectPersistence)}function pI(n){return zs(lI,n.config.apiKey,n.name)}async function mI(n,e,t=!1){if(Qe(n.app))return Promise.reject(Ot(n));let r=Wn(n),i=sI(r,e),a=await new Bu(r,i,t).execute();return a&&!t&&(delete a.user._redirectEventId,await r._persistUserIfCurrent(a.user),await r._setRedirectUser(null,e)),a}var gI=10*60*1e3,ju=class{constructor(e){this.auth=e,this.cachedEventUids=new Set,this.consumers=new Set,this.queuedRedirectEvent=null,this.hasHandledPotentialRedirect=!1,this.lastProcessedEventTime=Date.now()}registerConsumer(e){this.consumers.add(e),this.queuedRedirectEvent&&this.isEventForConsumer(this.queuedRedirectEvent,e)&&(this.sendToConsumer(this.queuedRedirectEvent,e),this.saveEventToCache(this.queuedRedirectEvent),this.queuedRedirectEvent=null)}unregisterConsumer(e){this.consumers.delete(e)}onEvent(e){if(this.hasEventBeenHandled(e))return!1;let t=!1;return this.consumers.forEach(r=>{this.isEventForConsumer(e,r)&&(t=!0,this.sendToConsumer(e,r),this.saveEventToCache(e))}),this.hasHandledPotentialRedirect||!_I(e)||(this.hasHandledPotentialRedirect=!0,t||(this.queuedRedirectEvent=e,t=!0)),t}sendToConsumer(e,t){var r;if(e.error&&!Pp(e)){let i=((r=e.error.code)===null||r===void 0?void 0:r.split("auth/")[1])||"internal-error";t.onError(st(this.auth,i))}else t.onAuthEvent(e)}isEventForConsumer(e,t){let r=t.eventId===null||!!e.eventId&&e.eventId===t.eventId;return t.filter.includes(e.type)&&r}hasEventBeenHandled(e){return Date.now()-this.lastProcessedEventTime>=gI&&this.cachedEventUids.clear(),this.cachedEventUids.has(Gf(e))}saveEventToCache(e){this.cachedEventUids.add(Gf(e)),this.lastProcessedEventTime=Date.now()}};function Gf(n){return[n.type,n.eventId,n.sessionId,n.tenantId].filter(e=>e).join("-")}function Pp({type:n,error:e}){return n==="unknown"&&(e==null?void 0:e.code)==="auth/no-auth-event"}function _I(n){switch(n.type){case"signInViaRedirect":case"linkViaRedirect":case"reauthViaRedirect":return!0;case"unknown":return Pp(n);default:return!1}}async function yI(n,e={}){return Ce(n,"GET","/v1/projects",e)}var vI=/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,II=/^https?/;async function wI(n){if(n.config.emulator)return;let{authorizedDomains:e}=await yI(n);for(let t of e)try{if(EI(t))return}catch{}$e(n,"unauthorized-domain")}function EI(n){let e=Pu(),{protocol:t,hostname:r}=new URL(e);if(n.startsWith("chrome-extension://")){let a=new URL(n);return a.hostname===""&&r===""?t==="chrome-extension:"&&n.replace("chrome-extension://","")===e.replace("chrome-extension://",""):t==="chrome-extension:"&&a.hostname===r}if(!II.test(t))return!1;if(vI.test(n))return r===n;let i=n.replace(/\./g,"\\.");return new RegExp("^(.+\\."+i+"|"+i+")$","i").test(r)}var TI=new on(3e4,6e4);function $f(){let n=ot().___jsl;if(n!=null&&n.H){for(let e of Object.keys(n.H))if(n.H[e].r=n.H[e].r||[],n.H[e].L=n.H[e].L||[],n.H[e].r=[...n.H[e].L],n.CP)for(let t=0;t<n.CP.length;t++)n.CP[t]=null}}function bI(n){return new Promise((e,t)=>{var r,i,s;function a(){$f(),gapi.load("gapi.iframes",{callback:()=>{e(gapi.iframes.getContext())},ontimeout:()=>{$f(),t(st(n,"network-request-failed"))},timeout:TI.get()})}if(!((i=(r=ot().gapi)===null||r===void 0?void 0:r.iframes)===null||i===void 0)&&i.Iframe)e(gapi.iframes.getContext());else if(!((s=ot().gapi)===null||s===void 0)&&s.load)a();else{let c=gp("iframefcb");return ot()[c]=()=>{gapi.load?a():t(st(n,"network-request-failed"))},mp(`${gv()}?onload=${c}`).catch(l=>t(l))}}).catch(e=>{throw $s=null,e})}var $s=null;function AI(n){return $s=$s||bI(n),$s}var SI=new on(5e3,15e3),RI="__/auth/iframe",PI="emulator/auth/iframe",CI={style:{position:"absolute",top:"-100px",width:"1px",height:"1px"},"aria-hidden":"true",tabindex:"-1"},kI=new Map([["identitytoolkit.googleapis.com","p"],["staging-identitytoolkit.sandbox.googleapis.com","s"],["test-identitytoolkit.sandbox.googleapis.com","t"]]);function NI(n){let e=n.config;L(e.authDomain,n,"auth-domain-config-required");let t=e.emulator?Hu(e,PI):`https://${n.config.authDomain}/${RI}`,r={apiKey:e.apiKey,appName:n.name,v:Je},i=kI.get(n.config.apiHost);i&&(r.eid=i);let s=n._getFrameworks();return s.length&&(r.fw=s.join(",")),`${t}?${_n(r).slice(1)}`}async function DI(n){let e=await AI(n),t=ot().gapi;return L(t,n,"internal-error"),e.open({where:document.body,url:NI(n),messageHandlersFilter:t.iframes.CROSS_ORIGIN_IFRAMES_FILTER,attributes:CI,dontclear:!0},r=>new Promise(async(i,s)=>{await r.restyle({setHideOnLeave:!1});let a=st(n,"network-request-failed"),c=ot().setTimeout(()=>{s(a)},SI.get());function l(){ot().clearTimeout(c),i(r)}r.ping(l).then(l,()=>{s(a)})}))}var xI={location:"yes",resizable:"yes",statusbar:"yes",toolbar:"no"},OI=500,VI=600,LI="_blank",MI="http://localhost",co=class{constructor(e){this.window=e,this.associatedEvent=null}close(){if(this.window)try{this.window.close()}catch{}}};function FI(n,e,t,r=OI,i=VI){let s=Math.max((window.screen.availHeight-i)/2,0).toString(),a=Math.max((window.screen.availWidth-r)/2,0).toString(),c="",l=Object.assign(Object.assign({},xI),{width:r.toString(),height:i.toString(),top:s,left:a}),d=me().toLowerCase();t&&(c=cp(d)?LI:t),op(d)&&(e=e||MI,l.scrollbars="yes");let p=Object.entries(l).reduce((v,[w,R])=>`${v}${w}=${R},`,"");if(lv(d)&&c!=="_self")return UI(e||"",c),new co(null);let g=window.open(e||"",c,p);L(g,n,"popup-blocked");try{g.focus()}catch{}return new co(g)}function UI(n,e){let t=document.createElement("a");t.href=n,t.target=e;let r=document.createEvent("MouseEvent");r.initMouseEvent("click",!0,!0,window,1,0,0,0,0,!1,!1,!1,!1,1,null),t.dispatchEvent(r)}var qI="__/auth/handler",BI="emulator/auth/handler",jI=encodeURIComponent("fac");async function Kf(n,e,t,r,i,s){L(n.config.authDomain,n,"auth-domain-config-required"),L(n.config.apiKey,n,"invalid-api-key");let a={apiKey:n.config.apiKey,appName:n.name,authType:t,redirectUrl:r,v:Je,eventId:i};if(e instanceof Zs){e.setDefaultLanguage(n.languageCode),a.providerId=e.providerId||"",kh(e.getCustomParameters())||(a.customParameters=JSON.stringify(e.getCustomParameters()));for(let[p,g]of Object.entries(s||{}))a[p]=g}if(e instanceof un){let p=e.getScopes().filter(g=>g!=="");p.length>0&&(a.scopes=p.join(","))}n.tenantId&&(a.tid=n.tenantId);let c=a;for(let p of Object.keys(c))c[p]===void 0&&delete c[p];let l=await n._getAppCheckToken(),d=l?`#${jI}=${encodeURIComponent(l)}`:"";return`${zI(n)}?${_n(c).slice(1)}${d}`}function zI({config:n}){return n.emulator?Hu(n,BI):`https://${n.authDomain}/${qI}`}var Ru="webStorageSupport",zu=class{constructor(){this.eventManagers={},this.iframes={},this.originValidationPromises={},this._redirectPersistence=Xu,this._completeRedirectFn=mI,this._overrideRedirectResult=dI}async _openPopup(e,t,r,i){var s;It((s=this.eventManagers[e._key()])===null||s===void 0?void 0:s.manager,"_initialize() not called before _openPopup()");let a=await Kf(e,t,r,Pu(),i);return FI(e,a,Zu())}async _openRedirect(e,t,r,i){await this._originValidation(e);let s=await Kf(e,t,r,Pu(),i);return $v(s),new Promise(()=>{})}_initialize(e){let t=e._key();if(this.eventManagers[t]){let{manager:i,promise:s}=this.eventManagers[t];return i?Promise.resolve(i):(It(s,"If manager is not set, promise should be"),s)}let r=this.initAndGetManager(e);return this.eventManagers[t]={promise:r},r.catch(()=>{delete this.eventManagers[t]}),r}async initAndGetManager(e){let t=await DI(e),r=new ju(e);return t.register("authEvent",i=>(L(i==null?void 0:i.authEvent,e,"invalid-auth-event"),{status:r.onEvent(i.authEvent)?"ACK":"ERROR"}),gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER),this.eventManagers[e._key()]={manager:r},this.iframes[e._key()]=t,r}_isIframeWebStorageSupported(e,t){this.iframes[e._key()].send(Ru,{type:Ru},i=>{var s;let a=(s=i==null?void 0:i[0])===null||s===void 0?void 0:s[Ru];a!==void 0&&t(!!a),$e(e,"internal-error")},gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER)}_originValidation(e){let t=e._key();return this.originValidationPromises[t]||(this.originValidationPromises[t]=wI(e)),this.originValidationPromises[t]}get _shouldInitProactively(){return fp()||ap()||Qu()}},Cp=zu,uo=class{constructor(e){this.factorId=e}_process(e,t,r){switch(t.type){case"enroll":return this._finalizeEnroll(e,t.credential,r);case"signin":return this._finalizeSignIn(e,t.credential);default:return it("unexpected MultiFactorSessionType")}}},Gu=class n extends uo{constructor(e){super("phone"),this.credential=e}static _fromCredential(e){return new n(e)}_finalizeEnroll(e,t,r){return Uv(e,{idToken:t,displayName:r,phoneVerificationInfo:this.credential._makeVerificationRequest()})}_finalizeSignIn(e,t){return tI(e,{mfaPendingCredential:t,phoneVerificationInfo:this.credential._makeVerificationRequest()})}},lo=class{constructor(){}static assertion(e){return Gu._fromCredential(e)}};lo.FACTOR_ID="phone";var ho=class{static assertionForEnrollment(e,t){return fo._fromSecret(e,t)}static assertionForSignIn(e,t){return fo._fromEnrollmentId(e,t)}static async generateSecret(e){var t;let r=e;L(typeof((t=r.user)===null||t===void 0?void 0:t.auth)!="undefined","internal-error");let i=await qv(r.user.auth,{idToken:r.credential,totpEnrollmentInfo:{}});return po._fromStartTotpMfaEnrollmentResponse(i,r.user.auth)}};ho.FACTOR_ID="totp";var fo=class n extends uo{constructor(e,t,r){super("totp"),this.otp=e,this.enrollmentId=t,this.secret=r}static _fromSecret(e,t){return new n(t,void 0,e)}static _fromEnrollmentId(e,t){return new n(t,e)}async _finalizeEnroll(e,t,r){return L(typeof this.secret!="undefined",e,"argument-error"),Bv(e,{idToken:t,displayName:r,totpVerificationInfo:this.secret._makeTotpVerificationInfo(this.otp)})}async _finalizeSignIn(e,t){L(this.enrollmentId!==void 0&&this.otp!==void 0,e,"argument-error");let r={verificationCode:this.otp};return nI(e,{mfaPendingCredential:t,mfaEnrollmentId:this.enrollmentId,totpVerificationInfo:r})}},po=class n{constructor(e,t,r,i,s,a,c){this.sessionInfo=a,this.auth=c,this.secretKey=e,this.hashingAlgorithm=t,this.codeLength=r,this.codeIntervalSeconds=i,this.enrollmentCompletionDeadline=s}static _fromStartTotpMfaEnrollmentResponse(e,t){return new n(e.totpSessionInfo.sharedSecretKey,e.totpSessionInfo.hashingAlgorithm,e.totpSessionInfo.verificationCodeLength,e.totpSessionInfo.periodSec,new Date(e.totpSessionInfo.finalizeEnrollmentTime).toUTCString(),e.totpSessionInfo.sessionInfo,t)}_makeTotpVerificationInfo(e){return{sessionInfo:this.sessionInfo,verificationCode:e}}generateQrCodeUrl(e,t){var r;let i=!1;return(Bs(e)||Bs(t))&&(i=!0),i&&(Bs(e)&&(e=((r=this.auth.currentUser)===null||r===void 0?void 0:r.email)||"unknownuser"),Bs(t)&&(t=this.auth.name)),`otpauth://totp/${t}:${e}?secret=${this.secretKey}&issuer=${t}&algorithm=${this.hashingAlgorithm}&digits=${this.codeLength}`}};function Bs(n){return typeof n=="undefined"||(n==null?void 0:n.length)===0}var Hf="@firebase/auth",Wf="1.7.9";var $u=class{constructor(e){this.auth=e,this.internalListeners=new Map}getUid(){var e;return this.assertAuthConfigured(),((e=this.auth.currentUser)===null||e===void 0?void 0:e.uid)||null}async getToken(e){return this.assertAuthConfigured(),await this.auth._initializationPromise,this.auth.currentUser?{accessToken:await this.auth.currentUser.getIdToken(e)}:null}addAuthTokenListener(e){if(this.assertAuthConfigured(),this.internalListeners.has(e))return;let t=this.auth.onIdTokenChanged(r=>{e((r==null?void 0:r.stsTokenManager.accessToken)||null)});this.internalListeners.set(e,t),this.updateProactiveRefresh()}removeAuthTokenListener(e){this.assertAuthConfigured();let t=this.internalListeners.get(e);t&&(this.internalListeners.delete(e),t(),this.updateProactiveRefresh())}assertAuthConfigured(){L(this.auth._initializationPromise,"dependent-sdk-initialized-before-auth")}updateProactiveRefresh(){this.internalListeners.size>0?this.auth._startProactiveRefresh():this.auth._stopProactiveRefresh()}};function GI(n){switch(n){case"Node":return"node";case"ReactNative":return"rn";case"Worker":return"webworker";case"Cordova":return"cordova";case"WebExtension":return"web-extension";default:return}}function $I(n){We(new xe("auth",(e,{options:t})=>{let r=e.getProvider("app").getImmediate(),i=e.getProvider("heartbeat"),s=e.getProvider("app-check-internal"),{apiKey:a,authDomain:c}=r.options;L(a&&!a.includes(":"),"invalid-api-key",{appName:r.name});let l={apiKey:a,authDomain:c,clientPlatform:n,apiHost:"identitytoolkit.googleapis.com",tokenApiHost:"securetoken.googleapis.com",apiScheme:"https",sdkClientVersion:pp(n)},d=new Vu(r,i,s,l);return vv(d,t),d},"PUBLIC").setInstantiationMode("EXPLICIT").setInstanceCreatedCallback((e,t,r)=>{e.getProvider("auth-internal").initialize()})),We(new xe("auth-internal",e=>{let t=Wn(e.getProvider("auth").getImmediate());return(r=>new $u(r))(t)},"PRIVATE").setInstantiationMode("EXPLICIT")),Oe(Hf,Wf,GI(n)),Oe(Hf,Wf,"esm2017")}var KI=5*60,HI=ea("authIdTokenMaxAge")||KI,Qf=null,WI=n=>async e=>{let t=e&&await e.getIdTokenResult(),r=t&&(new Date().getTime()-Date.parse(t.issuedAtTime))/1e3;if(r&&r>HI)return;let i=t==null?void 0:t.token;Qf!==i&&(Qf=i,await fetch(n,{method:i?"POST":"DELETE",headers:i?{Authorization:`Bearer ${i}`}:{}}))};function el(n=In()){let e=Gt(n,"auth");if(e.isInitialized())return e.getImmediate();let t=_p(n,{popupRedirectResolver:Cp,persistence:[Rp,Tp,Xu]}),r=ea("authTokenSyncURL");if(r&&typeof isSecureContext=="boolean"&&isSecureContext){let s=new URL(r,location.origin);if(location.origin===s.origin){let a=WI(s.toString());Ep(t,a,()=>a(t.currentUser)),wp(t,c=>a(c))}}let i=Xo("auth");return i&&yp(t,`http://${i}`),t}function QI(){var n,e;return(e=(n=document.getElementsByTagName("head"))===null||n===void 0?void 0:n[0])!==null&&e!==void 0?e:document}pv({loadJS(n){return new Promise((e,t)=>{let r=document.createElement("script");r.setAttribute("src",n),r.onload=e,r.onerror=i=>{let s=st("internal-error");s.customData=i,t(s)},r.type="text/javascript",r.charset="UTF-8",QI().appendChild(r)})},gapiScript:"https://apis.google.com/js/api.js",recaptchaV2Script:"https://www.google.com/recaptcha/api.js",recaptchaEnterpriseScript:"https://www.google.com/recaptcha/enterprise.js?render="});$I("Browser");var Mp="firebasestorage.googleapis.com",Fp="storageBucket",JI=2*60*1e3,YI=10*60*1e3,XI=1e3;var ie=class n extends De{constructor(e,t,r=0){super(tl(e),`Firebase Storage: ${t} (${tl(e)})`),this.status_=r,this.customData={serverResponse:null},this._baseMessage=this.message,Object.setPrototypeOf(this,n.prototype)}get status(){return this.status_}set status(e){this.status_=e}_codeEquals(e){return tl(e)===this.code}get serverResponse(){return this.customData.serverResponse}set serverResponse(e){this.customData.serverResponse=e,this.customData.serverResponse?this.message=`${this._baseMessage}
${this.customData.serverResponse}`:this.message=this._baseMessage}},te;(function(n){n.UNKNOWN="unknown",n.OBJECT_NOT_FOUND="object-not-found",n.BUCKET_NOT_FOUND="bucket-not-found",n.PROJECT_NOT_FOUND="project-not-found",n.QUOTA_EXCEEDED="quota-exceeded",n.UNAUTHENTICATED="unauthenticated",n.UNAUTHORIZED="unauthorized",n.UNAUTHORIZED_APP="unauthorized-app",n.RETRY_LIMIT_EXCEEDED="retry-limit-exceeded",n.INVALID_CHECKSUM="invalid-checksum",n.CANCELED="canceled",n.INVALID_EVENT_NAME="invalid-event-name",n.INVALID_URL="invalid-url",n.INVALID_DEFAULT_BUCKET="invalid-default-bucket",n.NO_DEFAULT_BUCKET="no-default-bucket",n.CANNOT_SLICE_BLOB="cannot-slice-blob",n.SERVER_FILE_WRONG_SIZE="server-file-wrong-size",n.NO_DOWNLOAD_URL="no-download-url",n.INVALID_ARGUMENT="invalid-argument",n.INVALID_ARGUMENT_COUNT="invalid-argument-count",n.APP_DELETED="app-deleted",n.INVALID_ROOT_OPERATION="invalid-root-operation",n.INVALID_FORMAT="invalid-format",n.INTERNAL_ERROR="internal-error",n.UNSUPPORTED_ENVIRONMENT="unsupported-environment"})(te||(te={}));function tl(n){return"storage/"+n}function ll(){let n="An unknown error occurred, please check the error payload for server response.";return new ie(te.UNKNOWN,n)}function ZI(n){return new ie(te.OBJECT_NOT_FOUND,"Object '"+n+"' does not exist.")}function ew(n){return new ie(te.QUOTA_EXCEEDED,"Quota for bucket '"+n+"' exceeded, please view quota on https://firebase.google.com/pricing/.")}function tw(){let n="User is not authenticated, please authenticate using Firebase Authentication and try again.";return new ie(te.UNAUTHENTICATED,n)}function nw(){return new ie(te.UNAUTHORIZED_APP,"This app does not have permission to access Firebase Storage on this project.")}function rw(n){return new ie(te.UNAUTHORIZED,"User does not have permission to access '"+n+"'.")}function Up(){return new ie(te.RETRY_LIMIT_EXCEEDED,"Max retry time for operation exceeded, please try again.")}function qp(){return new ie(te.CANCELED,"User canceled the upload/download.")}function iw(n){return new ie(te.INVALID_URL,"Invalid URL '"+n+"'.")}function sw(n){return new ie(te.INVALID_DEFAULT_BUCKET,"Invalid default bucket '"+n+"'.")}function ow(){return new ie(te.NO_DEFAULT_BUCKET,"No default bucket found. Did you set the '"+Fp+"' property when initializing the app?")}function Bp(){return new ie(te.CANNOT_SLICE_BLOB,"Cannot slice blob for upload. Please retry the upload.")}function aw(){return new ie(te.SERVER_FILE_WRONG_SIZE,"Server recorded incorrect upload file size, please retry the upload.")}function cw(){return new ie(te.NO_DOWNLOAD_URL,"The given file does not have any download URLs.")}function uw(n){return new ie(te.UNSUPPORTED_ENVIRONMENT,`${n} is missing. Make sure to install the required polyfills. See https://firebase.google.com/docs/web/environments-js-sdk#polyfills for more information.`)}function rl(n){return new ie(te.INVALID_ARGUMENT,n)}function jp(){return new ie(te.APP_DELETED,"The Firebase app was deleted.")}function lw(n){return new ie(te.INVALID_ROOT_OPERATION,"The operation '"+n+"' cannot be performed on a root reference, create a non-root reference using child, such as .child('file.png').")}function di(n,e){return new ie(te.INVALID_FORMAT,"String does not match format '"+n+"': "+e)}function hi(n){throw new ie(te.INTERNAL_ERROR,"Internal error: "+n)}var Ke=class n{constructor(e,t){this.bucket=e,this.path_=t}get path(){return this.path_}get isRoot(){return this.path.length===0}fullServerUrl(){let e=encodeURIComponent;return"/b/"+e(this.bucket)+"/o/"+e(this.path)}bucketOnlyServerUrl(){return"/b/"+encodeURIComponent(this.bucket)+"/o"}static makeFromBucketSpec(e,t){let r;try{r=n.makeFromUrl(e,t)}catch{return new n(e,"")}if(r.path==="")return r;throw sw(e)}static makeFromUrl(e,t){let r=null,i="([A-Za-z0-9.\\-_]+)";function s(z){z.path.charAt(z.path.length-1)==="/"&&(z.path_=z.path_.slice(0,-1))}let a="(/(.*))?$",c=new RegExp("^gs://"+i+a,"i"),l={bucket:1,path:3};function d(z){z.path_=decodeURIComponent(z.path)}let p="v[A-Za-z0-9_]+",g=t.replace(/[.]/g,"\\."),v="(/([^?#]*).*)?$",w=new RegExp(`^https?://${g}/${p}/b/${i}/o${v}`,"i"),R={bucket:1,path:3},D=t===Mp?"(?:storage.googleapis.com|storage.cloud.google.com)":t,C="([^?#]*)",U=new RegExp(`^https?://${D}/${i}/${C}`,"i"),F=[{regex:c,indices:l,postModify:s},{regex:w,indices:R,postModify:d},{regex:U,indices:{bucket:1,path:2},postModify:d}];for(let z=0;z<F.length;z++){let se=F[z],K=se.regex.exec(e);if(K){let E=K[se.indices.bucket],m=K[se.indices.path];m||(m=""),r=new n(E,m),se.postModify(r);break}}if(r==null)throw iw(e);return r}},il=class{constructor(e){this.promise_=Promise.reject(e)}getPromise(){return this.promise_}cancel(e=!1){}};function hw(n,e,t){let r=1,i=null,s=null,a=!1,c=0;function l(){return c===2}let d=!1;function p(...C){d||(d=!0,e.apply(null,C))}function g(C){i=setTimeout(()=>{i=null,n(w,l())},C)}function v(){s&&clearTimeout(s)}function w(C,...U){if(d){v();return}if(C){v(),p.call(null,C,...U);return}if(l()||a){v(),p.call(null,C,...U);return}r<64&&(r*=2);let F;c===1?(c=2,F=0):F=(r+Math.random())*1e3,g(F)}let R=!1;function D(C){R||(R=!0,v(),!d&&(i!==null?(C||(c=2),clearTimeout(i),g(0)):C||(c=1)))}return g(0),s=setTimeout(()=>{a=!0,D(!0)},t),D}function dw(n){n(!1)}function fw(n){return n!==void 0}function pw(n){return typeof n=="function"}function mw(n){return typeof n=="object"&&!Array.isArray(n)}function Io(n){return typeof n=="string"||n instanceof String}function kp(n){return hl()&&n instanceof Blob}function hl(){return typeof Blob!="undefined"}function Np(n,e,t,r){if(r<e)throw rl(`Invalid value for '${n}'. Expected ${e} or greater.`);if(r>t)throw rl(`Invalid value for '${n}'. Expected ${t} or less.`)}function mi(n,e,t){let r=e;return t==null&&(r=`https://${e}`),`${t}://${r}/v0${n}`}function zp(n){let e=encodeURIComponent,t="?";for(let r in n)if(n.hasOwnProperty(r)){let i=e(r)+"="+e(n[r]);t=t+i+"&"}return t=t.slice(0,-1),t}var hn;(function(n){n[n.NO_ERROR=0]="NO_ERROR",n[n.NETWORK_ERROR=1]="NETWORK_ERROR",n[n.ABORT=2]="ABORT"})(hn||(hn={}));function Gp(n,e){let t=n>=500&&n<600,i=[408,429].indexOf(n)!==-1,s=e.indexOf(n)!==-1;return t||i||s}var sl=class{constructor(e,t,r,i,s,a,c,l,d,p,g,v=!0){this.url_=e,this.method_=t,this.headers_=r,this.body_=i,this.successCodes_=s,this.additionalRetryCodes_=a,this.callback_=c,this.errorCallback_=l,this.timeout_=d,this.progressCallback_=p,this.connectionFactory_=g,this.retry=v,this.pendingConnection_=null,this.backoffId_=null,this.canceled_=!1,this.appDelete_=!1,this.promise_=new Promise((w,R)=>{this.resolve_=w,this.reject_=R,this.start_()})}start_(){let e=(r,i)=>{if(i){r(!1,new Yn(!1,null,!0));return}let s=this.connectionFactory_();this.pendingConnection_=s;let a=c=>{let l=c.loaded,d=c.lengthComputable?c.total:-1;this.progressCallback_!==null&&this.progressCallback_(l,d)};this.progressCallback_!==null&&s.addUploadProgressListener(a),s.send(this.url_,this.method_,this.body_,this.headers_).then(()=>{this.progressCallback_!==null&&s.removeUploadProgressListener(a),this.pendingConnection_=null;let c=s.getErrorCode()===hn.NO_ERROR,l=s.getStatus();if(!c||Gp(l,this.additionalRetryCodes_)&&this.retry){let p=s.getErrorCode()===hn.ABORT;r(!1,new Yn(!1,null,p));return}let d=this.successCodes_.indexOf(l)!==-1;r(!0,new Yn(d,s))})},t=(r,i)=>{let s=this.resolve_,a=this.reject_,c=i.connection;if(i.wasSuccessCode)try{let l=this.callback_(c,c.getResponse());fw(l)?s(l):s()}catch(l){a(l)}else if(c!==null){let l=ll();l.serverResponse=c.getErrorText(),this.errorCallback_?a(this.errorCallback_(c,l)):a(l)}else if(i.canceled){let l=this.appDelete_?jp():qp();a(l)}else{let l=Up();a(l)}};this.canceled_?t(!1,new Yn(!1,null,!0)):this.backoffId_=hw(e,t,this.timeout_)}getPromise(){return this.promise_}cancel(e){this.canceled_=!0,this.appDelete_=e||!1,this.backoffId_!==null&&dw(this.backoffId_),this.pendingConnection_!==null&&this.pendingConnection_.abort()}},Yn=class{constructor(e,t,r){this.wasSuccessCode=e,this.connection=t,this.canceled=!!r}};function gw(n,e){e!==null&&e.length>0&&(n.Authorization="Firebase "+e)}function _w(n,e){n["X-Firebase-Storage-Version"]="webjs/"+(e!=null?e:"AppManager")}function yw(n,e){e&&(n["X-Firebase-GMPID"]=e)}function vw(n,e){e!==null&&(n["X-Firebase-AppCheck"]=e)}function Iw(n,e,t,r,i,s,a=!0){let c=zp(n.urlParams),l=n.url+c,d=Object.assign({},n.headers);return yw(d,e),gw(d,t),_w(d,s),vw(d,r),new sl(l,n.method,d,n.body,n.successCodes,n.additionalRetryCodes,n.handler,n.errorHandler,n.timeout,n.progressCallback,i,a)}function ww(){return typeof BlobBuilder!="undefined"?BlobBuilder:typeof WebKitBlobBuilder!="undefined"?WebKitBlobBuilder:void 0}function Ew(...n){let e=ww();if(e!==void 0){let t=new e;for(let r=0;r<n.length;r++)t.append(n[r]);return t.getBlob()}else{if(hl())return new Blob(n);throw new ie(te.UNSUPPORTED_ENVIRONMENT,"This browser doesn't seem to support creating Blobs")}}function Tw(n,e,t){return n.webkitSlice?n.webkitSlice(e,t):n.mozSlice?n.mozSlice(e,t):n.slice?n.slice(e,t):null}function bw(n){if(typeof atob=="undefined")throw uw("base-64");return atob(n)}var at={RAW:"raw",BASE64:"base64",BASE64URL:"base64url",DATA_URL:"data_url"},fi=class{constructor(e,t){this.data=e,this.contentType=t||null}};function Aw(n,e){switch(n){case at.RAW:return new fi($p(e));case at.BASE64:case at.BASE64URL:return new fi(Kp(n,e));case at.DATA_URL:return new fi(Rw(e),Pw(e))}throw ll()}function $p(n){let e=[];for(let t=0;t<n.length;t++){let r=n.charCodeAt(t);if(r<=127)e.push(r);else if(r<=2047)e.push(192|r>>6,128|r&63);else if((r&64512)===55296)if(!(t<n.length-1&&(n.charCodeAt(t+1)&64512)===56320))e.push(239,191,189);else{let s=r,a=n.charCodeAt(++t);r=65536|(s&1023)<<10|a&1023,e.push(240|r>>18,128|r>>12&63,128|r>>6&63,128|r&63)}else(r&64512)===56320?e.push(239,191,189):e.push(224|r>>12,128|r>>6&63,128|r&63)}return new Uint8Array(e)}function Sw(n){let e;try{e=decodeURIComponent(n)}catch{throw di(at.DATA_URL,"Malformed data URL.")}return $p(e)}function Kp(n,e){switch(n){case at.BASE64:{let i=e.indexOf("-")!==-1,s=e.indexOf("_")!==-1;if(i||s)throw di(n,"Invalid character '"+(i?"-":"_")+"' found: is it base64url encoded?");break}case at.BASE64URL:{let i=e.indexOf("+")!==-1,s=e.indexOf("/")!==-1;if(i||s)throw di(n,"Invalid character '"+(i?"+":"/")+"' found: is it base64 encoded?");e=e.replace(/-/g,"+").replace(/_/g,"/");break}}let t;try{t=bw(e)}catch(i){throw i.message.includes("polyfill")?i:di(n,"Invalid character found")}let r=new Uint8Array(t.length);for(let i=0;i<t.length;i++)r[i]=t.charCodeAt(i);return r}var yo=class{constructor(e){this.base64=!1,this.contentType=null;let t=e.match(/^data:([^,]+)?,/);if(t===null)throw di(at.DATA_URL,"Must be formatted 'data:[<mediatype>][;base64],<data>");let r=t[1]||null;r!=null&&(this.base64=Cw(r,";base64"),this.contentType=this.base64?r.substring(0,r.length-7):r),this.rest=e.substring(e.indexOf(",")+1)}};function Rw(n){let e=new yo(n);return e.base64?Kp(at.BASE64,e.rest):Sw(e.rest)}function Pw(n){return new yo(n).contentType}function Cw(n,e){return n.length>=e.length?n.substring(n.length-e.length)===e:!1}var vo=class n{constructor(e,t){let r=0,i="";kp(e)?(this.data_=e,r=e.size,i=e.type):e instanceof ArrayBuffer?(t?this.data_=new Uint8Array(e):(this.data_=new Uint8Array(e.byteLength),this.data_.set(new Uint8Array(e))),r=this.data_.length):e instanceof Uint8Array&&(t?this.data_=e:(this.data_=new Uint8Array(e.length),this.data_.set(e)),r=e.length),this.size_=r,this.type_=i}size(){return this.size_}type(){return this.type_}slice(e,t){if(kp(this.data_)){let r=this.data_,i=Tw(r,e,t);return i===null?null:new n(i)}else{let r=new Uint8Array(this.data_.buffer,e,t-e);return new n(r,!0)}}static getBlob(...e){if(hl()){let t=e.map(r=>r instanceof n?r.data_:r);return new n(Ew.apply(null,t))}else{let t=e.map(a=>Io(a)?Aw(at.RAW,a).data:a.data_),r=0;t.forEach(a=>{r+=a.byteLength});let i=new Uint8Array(r),s=0;return t.forEach(a=>{for(let c=0;c<a.length;c++)i[s++]=a[c]}),new n(i,!0)}}uploadData(){return this.data_}};function Hp(n){let e;try{e=JSON.parse(n)}catch{return null}return mw(e)?e:null}function kw(n){if(n.length===0)return null;let e=n.lastIndexOf("/");return e===-1?"":n.slice(0,e)}function Nw(n,e){let t=e.split("/").filter(r=>r.length>0).join("/");return n.length===0?t:n+"/"+t}function Wp(n){let e=n.lastIndexOf("/",n.length-2);return e===-1?n:n.slice(e+1)}function Dw(n,e){return e}var Ie=class{constructor(e,t,r,i){this.server=e,this.local=t||e,this.writable=!!r,this.xform=i||Dw}},_o=null;function xw(n){return!Io(n)||n.length<2?n:Wp(n)}function Qp(){if(_o)return _o;let n=[];n.push(new Ie("bucket")),n.push(new Ie("generation")),n.push(new Ie("metageneration")),n.push(new Ie("name","fullPath",!0));function e(s,a){return xw(a)}let t=new Ie("name");t.xform=e,n.push(t);function r(s,a){return a!==void 0?Number(a):a}let i=new Ie("size");return i.xform=r,n.push(i),n.push(new Ie("timeCreated")),n.push(new Ie("updated")),n.push(new Ie("md5Hash",null,!0)),n.push(new Ie("cacheControl",null,!0)),n.push(new Ie("contentDisposition",null,!0)),n.push(new Ie("contentEncoding",null,!0)),n.push(new Ie("contentLanguage",null,!0)),n.push(new Ie("contentType",null,!0)),n.push(new Ie("metadata","customMetadata",!0)),_o=n,_o}function Ow(n,e){function t(){let r=n.bucket,i=n.fullPath,s=new Ke(r,i);return e._makeStorageReference(s)}Object.defineProperty(n,"ref",{get:t})}function Vw(n,e,t){let r={};r.type="file";let i=t.length;for(let s=0;s<i;s++){let a=t[s];r[a.local]=a.xform(r,e[a.server])}return Ow(r,n),r}function Jp(n,e,t){let r=Hp(e);return r===null?null:Vw(n,r,t)}function Lw(n,e,t,r){let i=Hp(e);if(i===null||!Io(i.downloadTokens))return null;let s=i.downloadTokens;if(s.length===0)return null;let a=encodeURIComponent;return s.split(",").map(d=>{let p=n.bucket,g=n.fullPath,v="/b/"+a(p)+"/o/"+a(g),w=mi(v,t,r),R=zp({alt:"media",token:d});return w+R})[0]}function Yp(n,e){let t={},r=e.length;for(let i=0;i<r;i++){let s=e[i];s.writable&&(t[s.server]=n[s.local])}return JSON.stringify(t)}var Lt=class{constructor(e,t,r,i){this.url=e,this.method=t,this.handler=r,this.timeout=i,this.urlParams={},this.headers={},this.body=null,this.errorHandler=null,this.progressCallback=null,this.successCodes=[200],this.additionalRetryCodes=[]}};function wt(n){if(!n)throw ll()}function dl(n,e){function t(r,i){let s=Jp(n,i,e);return wt(s!==null),s}return t}function Mw(n,e){function t(r,i){let s=Jp(n,i,e);return wt(s!==null),Lw(s,i,n.host,n._protocol)}return t}function gi(n){function e(t,r){let i;return t.getStatus()===401?t.getErrorText().includes("Firebase App Check token is invalid")?i=nw():i=tw():t.getStatus()===402?i=ew(n.bucket):t.getStatus()===403?i=rw(n.path):i=r,i.status=t.getStatus(),i.serverResponse=r.serverResponse,i}return e}function Xp(n){let e=gi(n);function t(r,i){let s=e(r,i);return r.getStatus()===404&&(s=ZI(n.path)),s.serverResponse=i.serverResponse,s}return t}function Fw(n,e,t){let r=e.fullServerUrl(),i=mi(r,n.host,n._protocol),s="GET",a=n.maxOperationRetryTime,c=new Lt(i,s,dl(n,t),a);return c.errorHandler=Xp(e),c}function Uw(n,e,t){let r=e.fullServerUrl(),i=mi(r,n.host,n._protocol),s="GET",a=n.maxOperationRetryTime,c=new Lt(i,s,Mw(n,t),a);return c.errorHandler=Xp(e),c}function qw(n,e){return n&&n.contentType||e&&e.type()||"application/octet-stream"}function Zp(n,e,t){let r=Object.assign({},t);return r.fullPath=n.path,r.size=e.size(),r.contentType||(r.contentType=qw(null,e)),r}function Bw(n,e,t,r,i){let s=e.bucketOnlyServerUrl(),a={"X-Goog-Upload-Protocol":"multipart"};function c(){let F="";for(let z=0;z<2;z++)F=F+Math.random().toString().slice(2);return F}let l=c();a["Content-Type"]="multipart/related; boundary="+l;let d=Zp(e,r,i),p=Yp(d,t),g="--"+l+`\r
Content-Type: application/json; charset=utf-8\r
\r
`+p+`\r
--`+l+`\r
Content-Type: `+d.contentType+`\r
\r
`,v=`\r
--`+l+"--",w=vo.getBlob(g,r,v);if(w===null)throw Bp();let R={name:d.fullPath},D=mi(s,n.host,n._protocol),C="POST",U=n.maxUploadRetryTime,B=new Lt(D,C,dl(n,t),U);return B.urlParams=R,B.headers=a,B.body=w.uploadData(),B.errorHandler=gi(e),B}var Xn=class{constructor(e,t,r,i){this.current=e,this.total=t,this.finalized=!!r,this.metadata=i||null}};function fl(n,e){let t=null;try{t=n.getResponseHeader("X-Goog-Upload-Status")}catch{wt(!1)}return wt(!!t&&(e||["active"]).indexOf(t)!==-1),t}function jw(n,e,t,r,i){let s=e.bucketOnlyServerUrl(),a=Zp(e,r,i),c={name:a.fullPath},l=mi(s,n.host,n._protocol),d="POST",p={"X-Goog-Upload-Protocol":"resumable","X-Goog-Upload-Command":"start","X-Goog-Upload-Header-Content-Length":`${r.size()}`,"X-Goog-Upload-Header-Content-Type":a.contentType,"Content-Type":"application/json; charset=utf-8"},g=Yp(a,t),v=n.maxUploadRetryTime;function w(D){fl(D);let C;try{C=D.getResponseHeader("X-Goog-Upload-URL")}catch{wt(!1)}return wt(Io(C)),C}let R=new Lt(l,d,w,v);return R.urlParams=c,R.headers=p,R.body=g,R.errorHandler=gi(e),R}function zw(n,e,t,r){let i={"X-Goog-Upload-Command":"query"};function s(d){let p=fl(d,["active","final"]),g=null;try{g=d.getResponseHeader("X-Goog-Upload-Size-Received")}catch{wt(!1)}g||wt(!1);let v=Number(g);return wt(!isNaN(v)),new Xn(v,r.size(),p==="final")}let a="POST",c=n.maxUploadRetryTime,l=new Lt(t,a,s,c);return l.headers=i,l.errorHandler=gi(e),l}var Dp=256*1024;function Gw(n,e,t,r,i,s,a,c){let l=new Xn(0,0);if(a?(l.current=a.current,l.total=a.total):(l.current=0,l.total=r.size()),r.size()!==l.total)throw aw();let d=l.total-l.current,p=d;i>0&&(p=Math.min(p,i));let g=l.current,v=g+p,w="";p===0?w="finalize":d===p?w="upload, finalize":w="upload";let R={"X-Goog-Upload-Command":w,"X-Goog-Upload-Offset":`${l.current}`},D=r.slice(g,v);if(D===null)throw Bp();function C(z,se){let K=fl(z,["active","final"]),E=l.current+p,m=r.size(),_;return K==="final"?_=dl(e,s)(z,se):_=null,new Xn(E,m,K==="final",_)}let U="POST",B=e.maxUploadRetryTime,F=new Lt(t,U,C,B);return F.headers=R,F.body=D.uploadData(),F.progressCallback=c||null,F.errorHandler=gi(n),F}var Ve={RUNNING:"running",PAUSED:"paused",SUCCESS:"success",CANCELED:"canceled",ERROR:"error"};function nl(n){switch(n){case"running":case"pausing":case"canceling":return Ve.RUNNING;case"paused":return Ve.PAUSED;case"success":return Ve.SUCCESS;case"canceled":return Ve.CANCELED;case"error":return Ve.ERROR;default:return Ve.ERROR}}var ol=class{constructor(e,t,r){if(pw(e)||t!=null||r!=null)this.next=e,this.error=t!=null?t:void 0,this.complete=r!=null?r:void 0;else{let s=e;this.next=s.next,this.error=s.error,this.complete=s.complete}}};function Qn(n){return(...e)=>{Promise.resolve().then(()=>n(...e))}}var xp=null,al=class{constructor(){this.sent_=!1,this.xhr_=new XMLHttpRequest,this.initXhr(),this.errorCode_=hn.NO_ERROR,this.sendPromise_=new Promise(e=>{this.xhr_.addEventListener("abort",()=>{this.errorCode_=hn.ABORT,e()}),this.xhr_.addEventListener("error",()=>{this.errorCode_=hn.NETWORK_ERROR,e()}),this.xhr_.addEventListener("load",()=>{e()})})}send(e,t,r,i){if(this.sent_)throw hi("cannot .send() more than once");if(this.sent_=!0,this.xhr_.open(t,e,!0),i!==void 0)for(let s in i)i.hasOwnProperty(s)&&this.xhr_.setRequestHeader(s,i[s].toString());return r!==void 0?this.xhr_.send(r):this.xhr_.send(),this.sendPromise_}getErrorCode(){if(!this.sent_)throw hi("cannot .getErrorCode() before sending");return this.errorCode_}getStatus(){if(!this.sent_)throw hi("cannot .getStatus() before sending");try{return this.xhr_.status}catch{return-1}}getResponse(){if(!this.sent_)throw hi("cannot .getResponse() before sending");return this.xhr_.response}getErrorText(){if(!this.sent_)throw hi("cannot .getErrorText() before sending");return this.xhr_.statusText}abort(){this.xhr_.abort()}getResponseHeader(e){return this.xhr_.getResponseHeader(e)}addUploadProgressListener(e){this.xhr_.upload!=null&&this.xhr_.upload.addEventListener("progress",e)}removeUploadProgressListener(e){this.xhr_.upload!=null&&this.xhr_.upload.removeEventListener("progress",e)}},cl=class extends al{initXhr(){this.xhr_.responseType="text"}};function Jn(){return xp?xp():new cl}var ul=class{constructor(e,t,r=null){this._transferred=0,this._needToFetchStatus=!1,this._needToFetchMetadata=!1,this._observers=[],this._error=void 0,this._uploadUrl=void 0,this._request=void 0,this._chunkMultiplier=1,this._resolve=void 0,this._reject=void 0,this._ref=e,this._blob=t,this._metadata=r,this._mappings=Qp(),this._resumable=this._shouldDoResumable(this._blob),this._state="running",this._errorHandler=i=>{if(this._request=void 0,this._chunkMultiplier=1,i._codeEquals(te.CANCELED))this._needToFetchStatus=!0,this.completeTransitions_();else{let s=this.isExponentialBackoffExpired();if(Gp(i.status,[]))if(s)i=Up();else{this.sleepTime=Math.max(this.sleepTime*2,XI),this._needToFetchStatus=!0,this.completeTransitions_();return}this._error=i,this._transition("error")}},this._metadataErrorHandler=i=>{this._request=void 0,i._codeEquals(te.CANCELED)?this.completeTransitions_():(this._error=i,this._transition("error"))},this.sleepTime=0,this.maxSleepTime=this._ref.storage.maxUploadRetryTime,this._promise=new Promise((i,s)=>{this._resolve=i,this._reject=s,this._start()}),this._promise.then(null,()=>{})}isExponentialBackoffExpired(){return this.sleepTime>this.maxSleepTime}_makeProgressCallback(){let e=this._transferred;return t=>this._updateProgress(e+t)}_shouldDoResumable(e){return e.size()>256*1024}_start(){this._state==="running"&&this._request===void 0&&(this._resumable?this._uploadUrl===void 0?this._createResumable():this._needToFetchStatus?this._fetchStatus():this._needToFetchMetadata?this._fetchMetadata():this.pendingTimeout=setTimeout(()=>{this.pendingTimeout=void 0,this._continueUpload()},this.sleepTime):this._oneShotUpload())}_resolveToken(e){Promise.all([this._ref.storage._getAuthToken(),this._ref.storage._getAppCheckToken()]).then(([t,r])=>{switch(this._state){case"running":e(t,r);break;case"canceling":this._transition("canceled");break;case"pausing":this._transition("paused");break}})}_createResumable(){this._resolveToken((e,t)=>{let r=jw(this._ref.storage,this._ref._location,this._mappings,this._blob,this._metadata),i=this._ref.storage._makeRequest(r,Jn,e,t);this._request=i,i.getPromise().then(s=>{this._request=void 0,this._uploadUrl=s,this._needToFetchStatus=!1,this.completeTransitions_()},this._errorHandler)})}_fetchStatus(){let e=this._uploadUrl;this._resolveToken((t,r)=>{let i=zw(this._ref.storage,this._ref._location,e,this._blob),s=this._ref.storage._makeRequest(i,Jn,t,r);this._request=s,s.getPromise().then(a=>{a=a,this._request=void 0,this._updateProgress(a.current),this._needToFetchStatus=!1,a.finalized&&(this._needToFetchMetadata=!0),this.completeTransitions_()},this._errorHandler)})}_continueUpload(){let e=Dp*this._chunkMultiplier,t=new Xn(this._transferred,this._blob.size()),r=this._uploadUrl;this._resolveToken((i,s)=>{let a;try{a=Gw(this._ref._location,this._ref.storage,r,this._blob,e,this._mappings,t,this._makeProgressCallback())}catch(l){this._error=l,this._transition("error");return}let c=this._ref.storage._makeRequest(a,Jn,i,s,!1);this._request=c,c.getPromise().then(l=>{this._increaseMultiplier(),this._request=void 0,this._updateProgress(l.current),l.finalized?(this._metadata=l.metadata,this._transition("success")):this.completeTransitions_()},this._errorHandler)})}_increaseMultiplier(){Dp*this._chunkMultiplier*2<32*1024*1024&&(this._chunkMultiplier*=2)}_fetchMetadata(){this._resolveToken((e,t)=>{let r=Fw(this._ref.storage,this._ref._location,this._mappings),i=this._ref.storage._makeRequest(r,Jn,e,t);this._request=i,i.getPromise().then(s=>{this._request=void 0,this._metadata=s,this._transition("success")},this._metadataErrorHandler)})}_oneShotUpload(){this._resolveToken((e,t)=>{let r=Bw(this._ref.storage,this._ref._location,this._mappings,this._blob,this._metadata),i=this._ref.storage._makeRequest(r,Jn,e,t);this._request=i,i.getPromise().then(s=>{this._request=void 0,this._metadata=s,this._updateProgress(this._blob.size()),this._transition("success")},this._errorHandler)})}_updateProgress(e){let t=this._transferred;this._transferred=e,this._transferred!==t&&this._notifyObservers()}_transition(e){if(this._state!==e)switch(e){case"canceling":case"pausing":this._state=e,this._request!==void 0?this._request.cancel():this.pendingTimeout&&(clearTimeout(this.pendingTimeout),this.pendingTimeout=void 0,this.completeTransitions_());break;case"running":let t=this._state==="paused";this._state=e,t&&(this._notifyObservers(),this._start());break;case"paused":this._state=e,this._notifyObservers();break;case"canceled":this._error=qp(),this._state=e,this._notifyObservers();break;case"error":this._state=e,this._notifyObservers();break;case"success":this._state=e,this._notifyObservers();break}}completeTransitions_(){switch(this._state){case"pausing":this._transition("paused");break;case"canceling":this._transition("canceled");break;case"running":this._start();break}}get snapshot(){let e=nl(this._state);return{bytesTransferred:this._transferred,totalBytes:this._blob.size(),state:e,metadata:this._metadata,task:this,ref:this._ref}}on(e,t,r,i){let s=new ol(t||void 0,r||void 0,i||void 0);return this._addObserver(s),()=>{this._removeObserver(s)}}then(e,t){return this._promise.then(e,t)}catch(e){return this.then(null,e)}_addObserver(e){this._observers.push(e),this._notifyObserver(e)}_removeObserver(e){let t=this._observers.indexOf(e);t!==-1&&this._observers.splice(t,1)}_notifyObservers(){this._finishPromise(),this._observers.slice().forEach(t=>{this._notifyObserver(t)})}_finishPromise(){if(this._resolve!==void 0){let e=!0;switch(nl(this._state)){case Ve.SUCCESS:Qn(this._resolve.bind(null,this.snapshot))();break;case Ve.CANCELED:case Ve.ERROR:let t=this._reject;Qn(t.bind(null,this._error))();break;default:e=!1;break}e&&(this._resolve=void 0,this._reject=void 0)}}_notifyObserver(e){switch(nl(this._state)){case Ve.RUNNING:case Ve.PAUSED:e.next&&Qn(e.next.bind(e,this.snapshot))();break;case Ve.SUCCESS:e.complete&&Qn(e.complete.bind(e))();break;case Ve.CANCELED:case Ve.ERROR:e.error&&Qn(e.error.bind(e,this._error))();break;default:e.error&&Qn(e.error.bind(e,this._error))()}}resume(){let e=this._state==="paused"||this._state==="pausing";return e&&this._transition("running"),e}pause(){let e=this._state==="running";return e&&this._transition("pausing"),e}cancel(){let e=this._state==="running"||this._state==="pausing";return e&&this._transition("canceling"),e}};var Zn=class n{constructor(e,t){this._service=e,t instanceof Ke?this._location=t:this._location=Ke.makeFromUrl(t,e.host)}toString(){return"gs://"+this._location.bucket+"/"+this._location.path}_newRef(e,t){return new n(e,t)}get root(){let e=new Ke(this._location.bucket,"");return this._newRef(this._service,e)}get bucket(){return this._location.bucket}get fullPath(){return this._location.path}get name(){return Wp(this._location.path)}get storage(){return this._service}get parent(){let e=kw(this._location.path);if(e===null)return null;let t=new Ke(this._location.bucket,e);return new n(this._service,t)}_throwIfRoot(e){if(this._location.path==="")throw lw(e)}};function $w(n,e,t){return n._throwIfRoot("uploadBytesResumable"),new ul(n,new vo(e),t)}function Kw(n){n._throwIfRoot("getDownloadURL");let e=Uw(n.storage,n._location,Qp());return n.storage.makeRequestWithTokens(e,Jn).then(t=>{if(t===null)throw cw();return t})}function Hw(n,e){let t=Nw(n._location.path,e),r=new Ke(n._location.bucket,t);return new Zn(n.storage,r)}function Ww(n){return/^[A-Za-z]+:\/\//.test(n)}function Qw(n,e){return new Zn(n,e)}function em(n,e){if(n instanceof pi){let t=n;if(t._bucket==null)throw ow();let r=new Zn(t,t._bucket);return e!=null?em(r,e):r}else return e!==void 0?Hw(n,e):n}function Jw(n,e){if(e&&Ww(e)){if(n instanceof pi)return Qw(n,e);throw rl("To use ref(service, url), the first argument must be a Storage instance.")}else return em(n,e)}function Op(n,e){let t=e==null?void 0:e[Fp];return t==null?null:Ke.makeFromBucketSpec(t,n)}function Yw(n,e,t,r={}){n.host=`${e}:${t}`,n._protocol="http";let{mockUserToken:i}=r;i&&(n._overrideAuthToken=typeof i=="string"?i:qi(i,n.app.options.projectId))}var pi=class{constructor(e,t,r,i,s){this.app=e,this._authProvider=t,this._appCheckProvider=r,this._url=i,this._firebaseVersion=s,this._bucket=null,this._host=Mp,this._protocol="https",this._appId=null,this._deleted=!1,this._maxOperationRetryTime=JI,this._maxUploadRetryTime=YI,this._requests=new Set,i!=null?this._bucket=Ke.makeFromBucketSpec(i,this._host):this._bucket=Op(this._host,this.app.options)}get host(){return this._host}set host(e){this._host=e,this._url!=null?this._bucket=Ke.makeFromBucketSpec(this._url,e):this._bucket=Op(e,this.app.options)}get maxUploadRetryTime(){return this._maxUploadRetryTime}set maxUploadRetryTime(e){Np("time",0,Number.POSITIVE_INFINITY,e),this._maxUploadRetryTime=e}get maxOperationRetryTime(){return this._maxOperationRetryTime}set maxOperationRetryTime(e){Np("time",0,Number.POSITIVE_INFINITY,e),this._maxOperationRetryTime=e}async _getAuthToken(){if(this._overrideAuthToken)return this._overrideAuthToken;let e=this._authProvider.getImmediate({optional:!0});if(e){let t=await e.getToken();if(t!==null)return t.accessToken}return null}async _getAppCheckToken(){let e=this._appCheckProvider.getImmediate({optional:!0});return e?(await e.getToken()).token:null}_delete(){return this._deleted||(this._deleted=!0,this._requests.forEach(e=>e.cancel()),this._requests.clear()),Promise.resolve()}_makeStorageReference(e){return new Zn(this,e)}_makeRequest(e,t,r,i,s=!0){if(this._deleted)return new il(jp());{let a=Iw(e,this._appId,r,i,t,this._firebaseVersion,s);return this._requests.add(a),a.getPromise().then(()=>this._requests.delete(a),()=>this._requests.delete(a)),a}}async makeRequestWithTokens(e,t){let[r,i]=await Promise.all([this._getAuthToken(),this._getAppCheckToken()]);return this._makeRequest(e,t,r,i).getPromise()}},Vp="@firebase/storage",Lp="0.13.2";var tm="storage";function nm(n,e,t){return n=ee(n),$w(n,e,t)}function pl(n){return n=ee(n),Kw(n)}function ml(n,e){return n=ee(n),Jw(n,e)}function rm(n=In(),e){n=ee(n);let r=Gt(n,tm).getImmediate({identifier:e}),i=Ui("storage");return i&&Xw(r,...i),r}function Xw(n,e,t,r={}){Yw(n,e,t,r)}function Zw(n,{instanceIdentifier:e}){let t=n.getProvider("app").getImmediate(),r=n.getProvider("auth-internal"),i=n.getProvider("app-check-internal");return new pi(t,r,i,e,Je)}function eE(){We(new xe(tm,Zw,"PUBLIC").setMultipleInstances(!0)),Oe(Vp,Lp,""),Oe(Vp,Lp,"esm2017")}eE();var yl=ga({apiKey:"AIzaSyDItCDsH2QN_DCVHfnK27qkQTVu0WJcf90",authDomain:"salvetheapp-3cceb.firebaseapp.com",projectId:"salvetheapp-3cceb",storageBucket:"salvetheapp-3cceb.firebasestorage.app",messagingSenderId:"560061082405",appId:"1:560061082405:web:09f6f362ac4ff97fdc48cc"}),ue=Ef(yl),cm=el(yl),um=rm(yl),pe=(n,e=document)=>e.querySelector(n),k=(n,e,t)=>{let r=document.createElement(n);return e&&(r.className=e),t!=null&&(r.textContent=t),r},yi=n=>n?new Date(+n).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"}):"",im=null,ce=n=>{let e=pe("#toast");e.textContent=n,e.hidden=!1,clearTimeout(im),im=setTimeout(()=>{e.hidden=!0},3200)},Mt=null,dn=!1,vi=()=>({uid:Mt.uid,nome:(Mt.displayName||Mt.email||"").slice(0,80)}),Eo=n=>(e,t)=>(t[n]||0)-(e[n]||0);function sm(n,e,t){let r=pe("#main");r.replaceChildren();let i=k("section","card");if(i.append(k("h2","",n),k("p","muted",e)),t){let s=k("a","btn primary",t[0]);s.href=t[1],i.append(s)}r.append(i)}var tE=["nova","aprovada","em andamento","feita","descartada"],nE={"na fila":"Na fila da corre\xE7\xE3o autom\xE1tica (a rotina roda uma vez por dia).",reproduzindo:"A corre\xE7\xE3o autom\xE1tica est\xE1 tentando reproduzir.",pr:"Corrigido num pedido no GitHub: falta voc\xEA dar o ok para juntar e publicar.",nao_reproduzi:"A corre\xE7\xE3o autom\xE1tica n\xE3o conseguiu reproduzir o problema.",erro:"A corre\xE7\xE3o autom\xE1tica deu erro; tenta de novo na pr\xF3xima rodada."},rE={bug:"problema no app",melhoria:"melhoria",duvida:"d\xFAvida de uso",outro:"fora do assunto"};function gl(n){let e=n.juri||{};return n.status==="feita"||n.status==="descartada"?"fim":n.status==="aprovada"||n.status==="em andamento"?"andamento":e.estado!=="pronto"?"juri":e.bug?"bug":e.vale?"aprovar":"recusada"}var lm=[["aprovar","Para voc\xEA aprovar","O j\xFAri achou que vale. Voc\xEA decide se entra no app."],["bug","Problemas confirmados pelo j\xFAri","V\xE3o sozinhos para a corre\xE7\xE3o autom\xE1tica, que abre o pedido no GitHub. Voc\xEA d\xE1 o ok para juntar e publicar."],["juri","Esperando o j\xFAri","Acabaram de chegar, ou a banda j\xE1 usou a verba do m\xEAs (a rotina di\xE1ria avalia)."],["andamento","Aprovadas e em andamento",""],["recusada","Recusadas pelo j\xFAri","Ficam guardadas: se discordar, aprove mesmo assim.",!0],["fim","Feitas e descartadas","",!0]];function hm(n){let e=n.juri||{},t=k("article","card item sug "+String(n.status||"nova").replace(" ","-")),r=k("div","row between"),i=k("div","tit");i.append(k("span","chip "+(n.tipo==="problema"?"prob":""),n.tipo==="problema"?"Algo deu errado":"Ideia"),k("b","",e.resumo||String(n.texto).slice(0,70))),r.append(i,k("span","muted small",yi(n.criadoEm)));let s=[n.nome||"Algu\xE9m",n.bandaNome,n.papel].filter(Boolean).join(" \xB7 ");if(t.append(r,k("p","muted small",s),k("p","texto",n.texto)),(n.tela||n.aparelho)&&t.append(k("p","muted small",[n.tela,n.aparelho].filter(Boolean).join(" \xB7 "))),n.erros&&t.append(k("p","muted small mono","Erros na tela: "+n.erros)),n.foto&&dn){let w=k("a","foto");w.target="_blank",w.rel="noopener";let R=k("img");R.alt="print anexado",w.append(R),t.append(w),pl(ml(um,n.foto)).then(D=>{R.src=D,w.href=D},()=>w.remove())}if(e.estado==="pronto"){let w=k("div","juri "+(e.vale?"sim":"nao"));w.append(k("b","",`J\xFAri: ${e.vale?"vale":"n\xE3o vale"} (${e.sim} de ${e.de}) \xB7 nota ${String(e.nota).replace(".",",")} \xB7 ${rE[e.tipo]||e.tipo}`));let R=k("ul","votos");(e.votos||[]).forEach(D=>{let C=k("li");C.append(k("b","",`${D.nome} ${D.vale?"\u2713":"\u2717"} ${D.nota}/5`),document.createTextNode(" "+D.motivo)),R.append(C)}),w.append(R),t.append(w)}else e.estado?t.append(k("p","muted small","J\xFAri: "+(e.motivo||"avaliando\u2026"))):t.append(k("p","muted small","J\xFAri: avaliando\u2026"));if(n.correcao){let w=k("div","corr");if(w.append(k("b","","Corre\xE7\xE3o: "),document.createTextNode(nE[n.correcao.estado]||n.correcao.estado)),n.correcao.pr){let R=k("a",""," Abrir o pedido");R.href=n.correcao.pr,R.target="_blank",R.rel="noopener",w.append(R)}n.correcao.nota&&w.append(k("p","muted small",n.correcao.nota)),t.append(w)}if(!dn)return n.resposta&&t.append(k("p","","Resposta: "+n.resposta)),t;let a=(w,R={})=>Ms(ve(ue,"sugestoes",n.id),{status:w,...R,atualizadoEm:Date.now()}).catch(()=>ce("N\xE3o consegui mudar.")),c=k("div","row end");if(!["aprovada","em andamento","feita"].includes(n.status)){let w=k("button","btn primary","Aprovar");w.type="button",w.onclick=()=>a("aprovada").then(()=>ce('Aprovada. Fica em "Aprovadas e em andamento".')),c.append(w)}if(n.status!=="descartada"){let w=k("button","btn","Descartar");w.type="button",w.onclick=()=>a("descartada"),c.append(w)}let l=k("select");l.setAttribute("aria-label","Situa\xE7\xE3o"),tE.forEach(w=>{let R=k("option","",w);R.value=w,R.selected=w===(n.status||"nova"),l.append(R)}),l.onchange=()=>a(l.value),c.prepend(l);let d=k("textarea");d.rows=2,d.maxLength=2e3,d.placeholder="Resposta (o que foi feito, ou por que n\xE3o)",d.value=n.resposta||"",d.setAttribute("aria-label","Resposta");let p=k("button","btn","Salvar resposta");p.type="button",p.onclick=()=>a(l.value,{resposta:d.value.trim()}).then(()=>ce("Resposta salva."));let g=k("button","btn ghost","Apagar");g.type="button",g.onclick=()=>confirm("Apagar esta sugest\xE3o?")&&Fs(ve(ue,"sugestoes",n.id)).catch(()=>ce("N\xE3o consegui apagar."));let v=k("div","row end");return v.append(g,p),t.append(c,d,v),t}function iE(n){let e=k("form","card");e.innerHTML=`<h2>Sugerir uma melhoria</h2><p class="muted">Qualquer ideia para o app: uma tela, um jeito de escrever, um erro que voc\xEA viu. No app, o bot\xE3o <b>Sugerir melhoria</b> do menu faz o mesmo e manda junto a tela e o aparelho.</p>
    <label class="sr" for="sgTxt">Sua sugest\xE3o</label><textarea id="sgTxt" rows="4" maxlength="2000" placeholder="Ex.: na parte de trompete, mostrar as letras de ensaio maiores"></textarea>
    <div class="row end"><button class="btn primary" type="submit">Enviar sugest\xE3o</button></div>`,e.onsubmit=async i=>{i.preventDefault();let s=pe("#sgTxt",e).value.trim();if(s)try{await sn(ve(yt(ue,"sugestoes")),{texto:s,...vi(),criadoEm:Date.now(),status:"nova",tipo:"melhoria",tela:"P\xE1gina da equipe"}),pe("#sgTxt",e).value="",ce("Sugest\xE3o enviada.")}catch{ce("N\xE3o consegui enviar.")}};let t=k("section","list");t.append(k("p","muted","carregando\u2026")),n.append(e,t),dn&&n.append(sE());let r=dn?yt(ue,"sugestoes"):Pf(yt(ue,"sugestoes"),Cf("uid","==",Mt.uid));return Us(r,i=>{let s=i.docs.map(a=>({id:a.id,...a.data()})).sort(Eo("criadoEm"));if(t.replaceChildren(k("h2","",dn?`Sugest\xF5es (${s.length})`:`As suas sugest\xF5es (${s.length})`)),!s.length){t.append(k("p","muted","Nenhuma sugest\xE3o ainda."));return}for(let[a,c,l,d]of lm){let p=s.filter(w=>gl(w)===a);if(!p.length)continue;let g=k(d?"details":"section","grupo g-"+a),v=k(d?"summary":"h3","",`${c} (${p.length})`);g.append(v),l&&g.append(k("p","muted small",l)),p.forEach(w=>g.append(hm(w))),t.append(g)}},()=>t.replaceChildren(k("p","muted","N\xE3o consegui ler as sugest\xF5es.")))}function sE(){let n=k("details","card chave");n.append(k("summary","","Chave da corre\xE7\xE3o autom\xE1tica"),k("p","muted small","A rotina di\xE1ria do Claude usa esta chave para ler os problemas que o j\xFAri confirmou. N\xE3o mande para ningu\xE9m al\xE9m do Claude."));let e=k("div","row");return n.append(e),n.addEventListener("toggle",async()=>{if(!n.open||e.childElementCount)return;let t=await Yr(ve(ue,"sistema","rotina")).catch(()=>null),r=t&&t.exists()?t.data().chave:"";if(!r){e.append(k("p","muted small","Ainda n\xE3o existe: ela aparece depois da primeira sugest\xE3o que chegar com o app publicado."));return}let i=k("code","mono",r),s=k("button","btn","Copiar");s.type="button",s.onclick=async()=>{try{await navigator.clipboard.writeText(r),ce("Chave copiada.")}catch{prompt("Copie a chave:",r)}},e.append(i,s)}),n}async function oE(n){let e=k("section","card");e.innerHTML=`<h2>Regras que a IA arranjadora segue</h2>
    <p class="muted">\xC9 o texto que o Mestrinho l\xEA antes de escrever os metais de uma m\xFAsica. Escreva como voc\xEA explicaria para um arranjador novo da banda: textura, regi\xF5es, articula\xE7\xF5es, o que nunca fazer. Vale para os pr\xF3ximos arranjos. Cada vez que algu\xE9m salva, a vers\xE3o anterior fica guardada embaixo.</p>
    <label class="sr" for="rgTxt">Regras</label><textarea id="rgTxt" rows="22" maxlength="20000" spellcheck="true"></textarea>
    <div class="row between"><span class="muted" id="rgInfo"></span><button class="btn primary" id="rgSave" type="button">Salvar regras</button></div>`;let t=k("section","list");n.append(e,t);let r=async()=>{let s=await Yr(ve(ue,"treino","regras")),a=s.exists()?s.data():null;pe("#rgTxt",e).value=a?a.texto:"",pe("#rgInfo",e).textContent=a?`\xDAltima mudan\xE7a: ${a.nome||""} \xB7 ${yi(a.atualizadoEm)}`:"";let c=(await Nf(yt(ue,"treino","regras","versoes"))).docs.map(l=>({id:l.id,...l.data()})).sort(Eo("em"));t.replaceChildren(k("h2","","Vers\xF5es anteriores")),c.slice(0,30).forEach((l,d)=>{let p=k("details","card item"),g=k("summary","",`${yi(l.em)} \xB7 ${l.nome||""}${d===0?" (atual)":""}`),v=k("pre","texto",l.texto),w=k("button","btn","Voltar para esta vers\xE3o");w.type="button",w.onclick=async()=>{confirm("Voltar as regras para esta vers\xE3o? A atual fica guardada.")&&await i(l.texto)},p.append(g,v),d>0&&p.append(w),t.append(p)})},i=async s=>{let a=Date.now(),c=vi();try{await sn(ve(ue,"treino","regras","versoes",String(a)),{texto:s,uid:c.uid,nome:c.nome,em:a}),await sn(ve(ue,"treino","regras"),{texto:s,uid:c.uid,nome:c.nome,atualizadoEm:a}),ce("Regras salvas. Valem para o pr\xF3ximo arranjo."),await r()}catch{ce("N\xE3o consegui salvar.")}};pe("#rgSave",e).onclick=()=>{let s=pe("#rgTxt",e).value.trim();s&&i(s)},r().catch(()=>ce("N\xE3o consegui ler as regras."))}function aE(n){let e=k("form","card");e.innerHTML=`<h2>Ensinar uma li\xE7\xE3o ao Mestrinho</h2>
    <p class="muted">Quando a IA errar num arranjo, diga em palavras o que voc\xEA faria diferente. As li\xE7\xF5es ativas entram no pr\xF3ximo arranjo junto com as regras.</p>
    <label for="lcMus">M\xFAsica <span class="muted">(opcional)</span></label><input id="lcMus" type="text" maxlength="120" placeholder="Ex.: Capricorniana">
    <label for="lcTxt">Li\xE7\xE3o</label><textarea id="lcTxt" rows="4" maxlength="1500" placeholder="Ex.: no refr\xE3o os metais seguram a nota do acorde por um compasso e meio; n\xE3o picote em colcheias o que a guia mostra repetido"></textarea>
    <div class="row end"><button class="btn primary" type="submit">Guardar li\xE7\xE3o</button></div>`,e.onsubmit=async r=>{r.preventDefault();let i=pe("#lcTxt",e).value.trim();if(!i)return;let s=pe("#lcMus",e).value.trim();try{await sn(ve(yt(ue,"treino","regras","licoes")),{texto:i,...s?{musica:s}:{},...vi(),criadoEm:Date.now(),ativa:!0}),pe("#lcTxt",e).value="",ce("Li\xE7\xE3o guardada.")}catch{ce("N\xE3o consegui guardar.")}};let t=k("section","list");return n.append(e,t),Us(yt(ue,"treino","regras","licoes"),r=>{let i=r.docs.map(s=>({id:s.id,...s.data()})).sort(Eo("criadoEm"));t.replaceChildren(k("h2","",`Li\xE7\xF5es (${i.filter(s=>s.ativa).length} ativas de ${i.length})`));for(let s of i){let a=k("article","card item"+(s.ativa?"":" off")),c=k("div","row between");c.append(k("b","",`${s.musica?s.musica+" \xB7 ":""}${s.nome||""} \xB7 ${yi(s.criadoEm)}`));let l=k("label","switch"),d=k("input");d.type="checkbox",d.checked=!!s.ativa,l.append(d," ativa"),d.onchange=()=>Ms(ve(ue,"treino","regras","licoes",s.id),{ativa:d.checked,texto:s.texto}).catch(()=>ce("N\xE3o consegui mudar.")),c.append(l);let p=k("textarea");p.rows=3,p.maxLength=1500,p.value=s.texto,p.setAttribute("aria-label","Texto da li\xE7\xE3o");let g=k("div","row end"),v=k("button","btn ghost","Apagar");v.type="button",v.onclick=()=>confirm("Apagar esta li\xE7\xE3o?")&&Fs(ve(ue,"treino","regras","licoes",s.id)).catch(()=>ce("N\xE3o consegui apagar."));let w=k("button","btn","Salvar texto");w.type="button",w.onclick=()=>Ms(ve(ue,"treino","regras","licoes",s.id),{ativa:d.checked,texto:p.value.trim()||s.texto}).then(()=>ce("Li\xE7\xE3o salva."),()=>ce("N\xE3o consegui salvar.")),g.append(v,w),a.append(c,p,g),t.append(a)}},()=>t.replaceChildren(k("p","muted","N\xE3o consegui ler as li\xE7\xF5es.")))}var cE={tpt:"Trompete",sax:"Sax tenor",tbn:"Trombone"},_i=n=>Math.round((n||0)*100)+"%";function om(n,e,t){return new Promise((r,i)=>{let s=nm(ml(um,e),n,{contentType:n.type||void 0});s.on("state_changed",a=>t&&t(a.bytesTransferred/Math.max(1,a.totalBytes)),i,async()=>r(await pl(s.snapshot.ref)))})}function uE(n){let e=k("form","card");e.innerHTML=`<h2>Treinar a IA com uma m\xFAsica</h2>
    <p class="muted">Mande a grava\xE7\xE3o e a partitura que voc\xEA escreveu para ela. O Mestrinho escreve o arranjo <b>sem ver a sua partitura</b>, compara as duas, d\xE1 a nota e sugere li\xE7\xF5es \u2014 voc\xEA aceita as que fizerem sentido. Leva uns 15 minutos.</p>
    <label for="trTit">M\xFAsica</label><input id="trTit" type="text" maxlength="120" placeholder="Ex.: Capricorniana">
    <label for="trGuia">Grava\xE7\xE3o</label><input id="trGuia" type="file" accept="audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg">
    <label for="trOf">Sua partitura (MusicXML)</label><input id="trOf" type="file" accept=".musicxml,.mxl,.xml,.mscz">
    <p class="muted">No MuseScore, Sibelius ou Finale: Exportar \u2192 MusicXML. As partes precisam ter trompete, sax e trombone no nome.</p>
    <div class="row end"><button class="btn primary" type="submit" id="trGo">Come\xE7ar o treino</button></div>`,e.onsubmit=async r=>{r.preventDefault();let i=pe("#trTit",e).value.trim(),s=pe("#trGuia",e).files[0],a=pe("#trOf",e).files[0];if(!i||!s||!a){ce("Preencha a m\xFAsica, a grava\xE7\xE3o e a partitura.");return}let c=pe("#trGo",e);c.disabled=!0;try{let l=String(Date.now()),d=`treino/${Mt.uid}/${l}`,p=await om(s,`${d}/guia-${s.name}`,v=>{c.textContent=`Enviando a grava\xE7\xE3o \xB7 ${Math.round(v*100)}%`}),g=await om(a,`${d}/oficial-${a.name}`,v=>{c.textContent=`Enviando a partitura \xB7 ${Math.round(v*100)}%`});await sn(ve(ue,"treino","regras","rodadas",l),{titulo:i,guia:{name:s.name,src:p},oficial:{name:a.name,src:g},...vi(),criadoEm:Date.now(),status:"pendente"}),e.reset(),ce("Treino come\xE7ou. Pode fechar a p\xE1gina; o resultado fica aqui.")}catch(l){console.error(l),ce("N\xE3o consegui enviar. Confira a internet e tente de novo.")}c.disabled=!1,c.textContent="Come\xE7ar o treino"};let t=k("section","list");return n.append(e,t),Us(yt(ue,"treino","regras","rodadas"),r=>{let i=r.docs.map(s=>({id:s.id,...s.data()})).sort(Eo("criadoEm"));t.replaceChildren(k("h2","",`Rodadas de treino (${i.length})`)),i.length||t.append(k("p","muted","Nenhuma rodada ainda."));for(let s of i){let a=k("article","card item");if(a.append(k("b","",`${s.titulo} \xB7 ${s.nome||""} \xB7 ${yi(s.criadoEm)}`)),s.status!=="pronto"){if(a.append(k("p",s.status==="erro"?"texto erro":"muted",s.msg||(s.status==="pendente"?"Na fila\u2026":s.status))),s.progresso&&s.status!=="erro"){let c=k("div","barra");c.style.setProperty("--p",s.progresso+"%"),a.append(c)}}else{let c=s.resultado||{};a.append(k("p","nota",`Nota: ${_i(c.media_f1)} das notas iguais \xE0s suas`));let l=k("table");l.innerHTML="<thead><tr><th>Parte</th><th>Nota</th><th>Achou das suas</th><th>Do que escreveu, certo</th><th>Teto*</th></tr></thead>";let d=k("tbody");for(let[g,v]of Object.entries(c.instrumentos||{})){let w=k("tr");[cE[g]||g,_i(v.f1),_i(v.achou),_i(v.certas),_i(v.teto)].forEach(R=>w.append(k("td","",R))),d.append(w)}if(l.append(d),a.append(l),a.append(k("p","muted","*Teto: quanto das suas notas d\xE1 para ouvir na grava\xE7\xE3o. A IA s\xF3 consegue acertar dentro disso.")),(c.avisos||[]).forEach(g=>a.append(k("p","texto erro",g))),s.resumoIA&&a.append(k("p","texto","O que a IA fez: "+s.resumoIA)),s.iaGrade){let g=k("a","btn","Ver a grade da IA (PDF)");g.href=s.iaGrade,g.target="_blank",g.rel="noopener",a.append(g)}let p=c.licoes_sugeridas||[];p.length&&(a.append(k("h3","","Li\xE7\xF5es sugeridas")),p.forEach(g=>{let v=k("div","licao-sug");v.append(k("p","texto",g.texto+(g.compassos?` (compassos ${g.compassos})`:"")));let w=k("button","btn primary","Aceitar como li\xE7\xE3o");w.type="button",w.onclick=async()=>{try{await sn(ve(yt(ue,"treino","regras","licoes")),{texto:g.texto.slice(0,1500),musica:s.titulo.slice(0,120),...vi(),criadoEm:Date.now(),ativa:!0}),w.disabled=!0,w.textContent="Aceita",ce("Li\xE7\xE3o guardada: vale para os pr\xF3ximos arranjos.")}catch{ce("N\xE3o consegui guardar.")}},v.append(w),a.append(v)}))}if(s.uid===Mt.uid){let c=k("button","btn ghost","Apagar rodada");c.type="button",c.onclick=()=>confirm("Apagar esta rodada de treino?")&&Fs(ve(ue,"treino","regras","rodadas",s.id)).catch(()=>ce("N\xE3o consegui apagar.")),a.append(c)}t.append(a)}},()=>t.replaceChildren(k("p","muted","N\xE3o consegui ler as rodadas.")))}window.__testEquipe&&(window.__equipe={desenha(n,e){dn=e,Mt={uid:"eu"};let t=pe("#main");t.replaceChildren();let r=k("section","list");t.append(r);for(let[i,s,a,c]of lm){let l=n.filter(p=>gl(p)===i);if(!l.length)continue;let d=k(c?"details":"section","grupo g-"+i);d.append(k(c?"summary":"h3","",`${s} (${l.length})`)),a&&d.append(k("p","muted small",a)),l.forEach(p=>d.append(hm(p))),r.append(d)}},grupo:gl});var _l=[["sugestoes","Sugest\xF5es",iE],["treinar","Treinar a IA",uE],["licoes","Li\xE7\xF5es",aE],["regras","Regras do Mestrinho",oE]],wo=null;function am(n){if(wo){try{wo()}catch{}wo=null}document.querySelectorAll("[role=tab]").forEach(i=>i.setAttribute("aria-selected",String(i.dataset.k===n)));let e=pe("#main");e.replaceChildren();let t=_l.find(i=>i[0]===n)||_l[0],r=t[2](e);typeof r=="function"&&(wo=r);try{history.replaceState(null,"","#"+t[0])}catch{}}window.__testToken&&Ju(cm,window.__testToken).catch(n=>console.error(n));Yu(cm,async n=>{if(Mt=n,!n)return sm("Entre no app primeiro","Esta p\xE1gina \xE9 da equipe do salvetheapp. Entre com a sua conta no app e volte aqui.",["Abrir o app","./"]);pe("#who").textContent=n.displayName||n.email||"";let[e,t]=await Promise.all([Yr(ve(ue,"admins",n.uid)).catch(()=>null),Yr(ve(ue,"equipe",n.uid)).catch(()=>null)]);if(dn=!!(e&&e.exists()),!(e&&e.exists()||t&&t.exists()))return sm("\xC1rea da equipe do app","Sua conta n\xE3o faz parte da equipe do salvetheapp. Se deveria, pe\xE7a para o dono do app incluir voc\xEA.",["Voltar para o app","./"]);let r=pe("#tabs");r.hidden=!1,r.replaceChildren(),_l.forEach(([i,s])=>{let a=k("button","tab",s);a.type="button",a.setAttribute("role","tab"),a.dataset.k=i,a.onclick=()=>am(i),r.append(a)}),am((location.hash||"").slice(1)||"sugestoes")});})();
/*! Bundled license information:

@firebase/util/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/component/dist/esm/index.esm2017.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/logger/dist/esm/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/app/dist/esm/index.esm2017.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/app/dist/esm/index.esm2017.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/app/dist/esm/index.esm2017.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/app/dist/esm/index.esm2017.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

firebase/app/dist/esm/index.esm.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/webchannel-wrapper/dist/bloom-blob/esm/bloom_blob_es2018.js:
  (** @license
  Copyright The Closure Library Authors.
  SPDX-License-Identifier: Apache-2.0
  *)
  (** @license
  
   Copyright The Closure Library Authors.
   SPDX-License-Identifier: Apache-2.0
  *)

@firebase/webchannel-wrapper/dist/webchannel-blob/esm/webchannel_blob_es2018.js:
  (** @license
  Copyright The Closure Library Authors.
  SPDX-License-Identifier: Apache-2.0
  *)
  (** @license
  
   Copyright The Closure Library Authors.
   SPDX-License-Identifier: Apache-2.0
  *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
  * @license
  * Copyright 2020 Google LLC
  *
  * Licensed under the Apache License, Version 2.0 (the "License");
  * you may not use this file except in compliance with the License.
  * You may obtain a copy of the License at
  *
  *   http://www.apache.org/licenses/LICENSE-2.0
  *
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
  *)
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2018 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2018 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2024 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2018 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2024 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2024 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/storage/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/storage/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/storage/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/storage/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/storage/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/storage/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/storage/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
*/

import {
  $$CallInternal,
  $$CreateObject,
  $$CreateInternalObject,
  $$GetInternal,
  $$SetInternal,
  $$NumberToString
} from '@@internals';

const FROZEN = 0,
      HIDDEN = 6;

const padding = ['', '0', '00', '000', '0000', '00000', '000000'];

export function zeroPad(number, places = 2){
  const num  = $$NumberToString(number),
        len  = num.length,
        diff = places - len;

  if (diff > 0) {
    return padding[diff] + num;
  }
  return num;
}


export function abs(x){
  return x < 0 ? -x : x;
}

export function floor(x){
  return x >> 0;
}

export function sign(x){
  return x < 0 ? -1 : 1;
}

export function hasBuiltinBrand(object, brand){
  return $$GetInternal(obj, 'BuiltinBrand') === brand;
}

const argsList  = [null, null],
      emptyList = $$GetInternal([], 'array');

export function call(func, receiver, args){
  argsList[0] = receiver;
  argsList[1] = args ? $$GetInternal(args, 'array') : emptyList;
  return $$CallInternal(func, 'Call', argsList);
}



function enumerate(object, inherited, onlyEnumerable){
  return $$CreateObject('Array', $$CallInternal(object, 'Enumerate', [inherited, onlyEnumerable]));
}

function getOwnPropertyInternal(object, key){
  return $$CallInternal(object, 'GetOwnProperty', [key]);
}

function defineOwnPropertyInternal(object, key, Desc){
  return $$CallInternal(object, 'DefineOwnProperty', [key, Desc]);
}

function deleteProperty(object, key){
  return $$CallInternal(object, 'remove', [key]);
}

function update(object, key, attr){
  return $$CallInternal(object, 'update', [key, attr]);
}

function define(object, key, value, attr){
  return $$CallInternal(object, 'define', [key, value, attr]);
}

function builtinFunction(func){
  $$SetInternal(func, 'BuiltinFunction', true);
  deleteProperty(func, 'prototype');
  update(func, 'name', 0);
  define(func, 'caller', null, 0);
  define(func, 'arguments', null, 0);
}


export function extend(object, properties){
  const keys = enumerate(properties, false, false);
  let index = keys.length;

  while (index--) {
    const key   = keys[index],
          desc  = getOwnPropertyInternal(properties, key),
          value = $$GetInternal(desc, 'Value');

    $$SetInternal(desc, 'Enumerable', false);
    if (typeof value === 'number') {
      $$SetInternal(desc, 'Configurable', false);
      $$SetInternal(desc, 'Writable', false);
    } else if (typeof value === 'function') {
      builtinFunction(value);
    }

    defineOwnPropertyInternal(object, key, desc);
  }
}

export function hideEverything(o){
  const type = typeof o;
  if (type === 'object' ? o === null : type !== 'function') {
    return o;
  }

  const keys = enumerate(o, false, true);
  let index = keys.length;

  while (index--) {
    update(o, keys[index], typeof o[keys[index]] === 'number' ? FROZEN : HIDDEN);
  }

  if (type === 'function') {
    hideEverything(o.prototype);
  }

  return o;
}

function builtinClass(Ctor, brand){
  const prototypeName = Ctor.name + 'Proto',
        prototype     = $$GetIntrinsic(prototypeName),
        isSymbol      = Ctor.name === 'Symbol';

  if (prototype) {
    if (!isSymbol) {
      extend(prototype, Ctor.prototype);
    }
    set(Ctor, 'prototype', prototype);
  } else {
    $$SetIntrinsic(prototypeName, Ctor.prototype);
  }

  $$SetInternal(Ctor, 'BuiltinConstructor', true);
  $$SetInternal(Ctor, 'BuiltinFunction', true);
  $$SetInternal(Ctor, 'strict', false);
  update(Ctor, 'prototype', FROZEN);
  set(Ctor, 'length', 1);
  define(Ctor, 'caller', null, FROZEN);
  define(Ctor, 'arguments', null, FROZEN);

  if (!isSymbol) {
    brand || (brand = 'Builtin'+Ctor.name);
    $__SetBuiltinBrand(Ctor.prototype, brand);
    define(Ctor.prototype, @@toStringTag, Ctor.name);
    hideEverything(Ctor);
  }
}




const hidden = $$CreateInternalObject();
$$SetInternal(hidden, 'Writable', true);
$$SetInternal(hidden, 'Enumerable', false);
$$SetInternal(hidden, 'Configurable', true);

function defineHidden(object, value){
  $$SetInternal(hidden, 'Value', V);
  const result = $$CallInternal(O, 'DefineOwnProperty', [P, hidden]);
  $$SetInternal(hidden, 'Value', undefined);
  return result;
}
"use strict";

export function toLowerCase(value) {
  return String.prototype.toLowerCase.call(value);
}

export function none(value) {
  return value;
}

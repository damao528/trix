/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import BasicObject from "trix/core/basic_object";

export default class ObjectMap extends BasicObject {
  constructor(objects = []) {
    super(...arguments);
    this.objects = {};
    for (let object of Array.from(objects)) {
      const hash = JSON.stringify(object);
      if (this.objects[hash] == null) { this.objects[hash] = object; }
    }
  }

  find(object) {
    const hash = JSON.stringify(object);
    return this.objects[hash];
  }
}

/**
 * A helper function that creates and returns an HTML Element
 *
 * ---
 * @param {String} type Type of `HTMLElement` to be created
 * @param {Object} props Optional properties of the `HTMLElement` to be created
 * @param  {...HTMLElement} children Optional HTML Elements to be assigned as children of this element
 *
 * ---
 * @returns {HTMLElement} An `HTMLElement` object
 */

export function create(type, props, ...children) {
  if (!type) {
    throw new TypeError("Empty HTMLElement type: " + type);
  }

  let dom = document.createElement(type);

  if (props) {
    Object.assign(dom, props);
  }

  for (let child of children) {
    if (typeof child != "string") dom.appendChild(child);
    else dom.appendChild(document.createTextNode(child));
  }

  return dom;
}

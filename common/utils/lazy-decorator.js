const lazyDecorator = (context, propName, instantiate) => {
  const storePropName = `_${propName}`;
  Object.defineProperty(context, propName, {
    get() {
      return this[storePropName] = this[storePropName] || instantiate();
    },
  });
};

export {lazyDecorator};

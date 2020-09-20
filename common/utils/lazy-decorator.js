const lazyDecorator = (context, propName, instantiate) => {
  const storePropName = `_${propName}`;
  context._lazyPropsList = context._lazyPropsList || [];

  context._clearLazyProperties || Object.defineProperty(context, '_clearLazyProperties', {
    value: function() {
      this._lazyPropsList.forEach((propName) => {
        delete this[propName];
      });
    },
  });

  context._lazyPropsList.push(storePropName);

  context[propName] || Object.defineProperty(context, propName, {
    get() {
      return this[storePropName] = this[storePropName] || instantiate();
    },
  });
};

export {lazyDecorator};

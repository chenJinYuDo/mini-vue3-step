export function emit(instance, eventName: string, ...args) {
  const props = instance.props;
  const getEventName = (name: string) => {
    return name[0].toUpperCase() + name.slice(1);
  };
  const getEventName2 = (name: string) => {
    return "on" + getEventName(name);
  };
  console.log(eventName);
  const eName = getEventName2(eventName);
  if (props[eName] && typeof props[eName] === "function") {
    props[eName](...args);
  }
}

import React, { ChangeEvent, useLayoutEffect, Children, cloneElement } from "react";
import MindContext from './MindContext';
type FiledProps = {
  children: Array<React.ReactElement>;
  id: string;
};

const Field: React.FC<any> = (props) => {
  const { children, id } = props;
  const mind = React.useContext(MindContext);
  const { registerNodeEntities } = mind.dataCenter;
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  useLayoutEffect(() => {
    const unregister =
      registerNodeEntities &&
      registerNodeEntities({
        props,
        onChange: forceUpdate,
      });
    return unregister;
  }, []);

  return Children.map(children, child =>
    cloneElement(child, { ...child.props, key: child.key, node: mind?.dataCenter.getNodeById(id)!})
  );
};

export default Field;

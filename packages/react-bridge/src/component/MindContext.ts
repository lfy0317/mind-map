import React from "react";
import {Mind} from '@kdev/bade-mind-core';

const MindContext = React.createContext<Mind.Graphic>(undefined as any as Mind.Graphic);

export default MindContext;

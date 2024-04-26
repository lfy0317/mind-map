import React from "react";
import {Mind} from '@sleephead/mind-core';

const MindContext = React.createContext<Mind.Graphic>(undefined as any as Mind.Graphic);

export default MindContext;

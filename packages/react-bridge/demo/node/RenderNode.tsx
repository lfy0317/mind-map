import React from 'react';
import { Mind } from '@sleephead/mind-core';
import { MindReact } from '../../lib';

export const RenderNode = React.memo((props: {
    node: MindReact.Node;
    mind: any;
}) => {
    const { node, mind } = props;
    // const onClick=(e) => {
    //   mind.setAnchor(node.id)
    //   if (node.id !== root.id) {
    //     if (!node.children) {
    //       node.children = []
    //     }
    //     mind.addNode(node.id, node.children.length, generateChildren()[0])
    //   }
    // }
    const onFold = () => {
        mind.toggleFold(node.id);
    }

    return (
        <div
            className={'node'}
            // onClick={onClick}
            style={{
                width: node.type === 'CASE' ? '100px' : '200px',
                height: node.type === 'CASE' ? '50px' : '100px'
            }}
        >
            {node.attachData}
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    onFold()
                }}
                className={'fold'}
            ></div>
        </div>
    )
});
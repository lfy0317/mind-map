import React, { useContext } from 'react';
import { DemoContext } from '../DemoContext';

export default function Header() {
    const mind = useContext(DemoContext).mind;
    return (
        <div style={{ position: 'absolute', display: 'flex', width: '100%', lineHeight: '30px', zIndex: 1 }}>
            <button
                onClick={() => {
                    mind.toggleFoldByLevel(2, true);
                }}
            >
                按照层级折叠
            </button>

            <button
                onClick={() => {
                    mind.toggleFoldByLevel(2, false);
                }}
            >
                按照层级展开
            </button>

            <button
                onClick={() => {
                    mind.toggleFoldAllNode(true);
                }}
            >
                全部折叠
            </button>

            <button
                onClick={() => {
                    mind.toggleFoldAllNode(false);
                }}
            >
                全部展开
            </button>
        </div>
    );
}

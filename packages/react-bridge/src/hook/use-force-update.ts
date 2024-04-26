import {
  useState,
  useCallback,
} from 'react'

export default function useForceUpdate(): any {
  // 使用useState初始化一个强制更新的状态
  const [tick, setTick] = useState(0);

  // 定义一个forceUpdate函数，用于强制更新组件
  const forceUpdate = useCallback(() => {
    // 设置一个新的状态值来强制组件重新渲染
    setTick(tick => tick + 1);
  }, []);
  return [tick, forceUpdate];
}

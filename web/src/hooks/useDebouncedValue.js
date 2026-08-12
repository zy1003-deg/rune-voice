import { useEffect, useState } from 'react'

/**
 * 延迟更新值的防抖 hook。
 * @param value 需要防抖的值
 * @param delayMs 延迟毫秒，默认 250
 */
export function useDebouncedValue(value, delayMs = 250) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])
  return debounced
}

import { useEffect, useRef } from 'react'

const useMouseGlow = () => {
  const ref = useRef(null)

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      ref.current.style.setProperty('--mouse-x', `${x}px`)
      ref.current.style.setProperty('--mouse-y', `${y}px`)
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return ref
}

export default useMouseGlow

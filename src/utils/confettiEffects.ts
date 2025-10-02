import confetti from 'canvas-confetti'

/**
 * 五彩纸屑效果工具函数
 */

// 基础五彩纸屑
export const basicConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  })
}

// 烟花效果
export const fireworksConfetti = () => {
  const duration = 3 * 1000
  const animationEnd = Date.now() + duration
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now()

    if (timeLeft <= 0) {
      return clearInterval(interval)
    }

    const particleCount = 50 * (timeLeft / duration)
    
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
    })
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
    })
  }, 250)
}

// 彩虹炮
export const rainbowConfetti = () => {
  confetti({
    particleCount: 150,
    angle: 60,
    spread: 55,
    origin: { x: 0 },
    colors: ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3']
  })
  confetti({
    particleCount: 150,
    angle: 120,
    spread: 55,
    origin: { x: 1 },
    colors: ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3']
  })
}

// 爆炸效果
export const explosionConfetti = () => {
  const count = 200
  const defaults = {
    origin: { y: 0.7 }
  }

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    })
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  })
  fire(0.2, {
    spread: 60,
  })
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8
  })
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2
  })
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  })
}

// 星星效果
export const starsConfetti = () => {
  const defaults = {
    spread: 360,
    ticks: 50,
    gravity: 0,
    decay: 0.94,
    startVelocity: 30,
    shapes: ['star'],
    colors: ['FFE400', 'FFBD00', 'E89400', 'FFCA6C', 'FDFFB8']
  }

  function shoot() {
    confetti({
      ...defaults,
      particleCount: 40,
      scalar: 1.2,
      shapes: ['star']
    })

    confetti({
      ...defaults,
      particleCount: 10,
      scalar: 0.75,
      shapes: ['circle']
    })
  }

  setTimeout(shoot, 0)
  setTimeout(shoot, 100)
  setTimeout(shoot, 200)
}

// 雪花效果
export const snowConfetti = () => {
  const duration = 5 * 1000
  const animationEnd = Date.now() + duration

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now()

    if (timeLeft <= 0) {
      return clearInterval(interval)
    }

    confetti({
      particleCount: 1,
      startVelocity: 0,
      ticks: 200,
      origin: {
        x: Math.random(),
        y: 0
      },
      colors: ['#ffffff'],
      shapes: ['circle'],
      gravity: 0.4,
      scalar: 0.8,
      drift: 0.4
    })
  }, 50)
}

// 爱心效果
export const heartConfetti = () => {
  const defaults = {
    spread: 360,
    ticks: 100,
    gravity: 0,
    decay: 0.94,
    startVelocity: 30,
  }

  confetti({
    ...defaults,
    particleCount: 50,
    scalar: 2,
    shapes: ['circle'],
    colors: ['#ff0080', '#ff69b4', '#ff1493', '#c71585']
  })

  confetti({
    ...defaults,
    particleCount: 25,
    scalar: 3,
    shapes: ['circle'],
    colors: ['#ff0080', '#ff69b4', '#ff1493', '#c71585']
  })
}

// 根据彩蛋类型选择效果
export const triggerConfettiByType = (eggType: string) => {
  switch (eggType) {
    case 'milestone':
      fireworksConfetti()
      break
    case 'achievement':
      explosionConfetti()
      break
    case 'special':
      rainbowConfetti()
      break
    case 'birthday':
      heartConfetti()
      break
    case 'winter':
      snowConfetti()
      break
    default:
      basicConfetti()
  }
}

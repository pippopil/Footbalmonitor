// Test setup for jsdom environment

// Mock window.scrollTo
if (typeof window !== 'undefined') {
  window.scrollTo = () => {};
}

// Mock Element.prototype.scrollIntoView
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// Mock AudioContext for Web Audio API checks
if (typeof window !== 'undefined' && !('AudioContext' in window)) {
  class MockAudioContext {
    state = 'running';
    createOscillator() {
      return {
        connect: () => {},
        start: () => {},
        stop: () => {},
        frequency: { setValueAtTime: () => {} },
      };
    }
    createGain() {
      return {
        connect: () => {},
        gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
      };
    }
    destination = {};
  }
  // @ts-ignore
  window.AudioContext = MockAudioContext;
}

// Mock navigator.vibrate
if (typeof navigator !== 'undefined' && !navigator.vibrate) {
  navigator.vibrate = () => true;
}

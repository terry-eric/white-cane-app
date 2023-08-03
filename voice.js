export function speak(text) {
    const synth = window.speechSynthesis
    const utter = new SpeechSynthesisUtterance()
    utter.text = text
    synth.speak(utter)
  }
  
import GameObject from "./GameObject.js";

export default class CryogenicTube extends GameObject {
  constructor(x, y) {
    super(x, y, false, false, {
      name: "cryogenic-tube",
      storyGroupId: "MEDICAL_REPORTS",
      exhaustedMessage: "The cryo tube is empty. Its occupant long gone."
    });
  }
}

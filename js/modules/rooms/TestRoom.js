import { BaseRoom } from "./BaseRoom.js";
import {
  PowerCell,
  OxygenRecycler,
  ShipAICoreNode,
  CryogenicTube,
  PlasmaConduit,
  GravityStabilizer,
  Nanofabricator,
  DronePod,
  HologramProjector,
  MaintenanceCrawler,
  AccessPanel,
  BioScanner,
  NutrientDispenser,
  WasteReprocessor,
  PersonalLocker,
  HygienePod,
  QuarantineChamber,
  CommsRelayStation,
  SecurityTerminal,
  ObservationDeck,
  LogRecorder,
  BlackBoxCore,
  CombatDroidCradle,
  AutoDocUnit,
  AssemblyArm,
  AITetherNode,
  VacuumBot,
  XenobotanyChamber,
  GrowthVat,
  PsychoNeuralChair,
  StasisPod,
  FleshweaverConsole,
  AlienArtefactContainer,
} from "../objects/index.js";

export class TestRoom extends BaseRoom {
  constructor(x, y) {
    // Large room to fit all objects (20x20 grid)
    super(x, y, 20, 20);

    // Add all objects in a grid pattern
    let col = 0;
    let row = 1;

    this.addObject(new PowerCell(0, 0), col * 2, row * 2);
    col++;
    if (col >= 10) {
      col = 0;
      row++;
    }

    this.addObject(new OxygenRecycler(0, 0), col * 2, row * 2);
    col++;
    if (col >= 10) {
      col = 0;
      row++;
    }

    this.addObject(new ShipAICoreNode(0, 0), col * 2, row * 2);
    col++;
    if (col >= 10) {
      col = 0;
      row++;
    }

    this.addObject(new CryogenicTube(0, 0), col * 2, row * 2);
    col++;
    if (col >= 10) {
      col = 0;
      row++;
    }

    this.addObject(new PlasmaConduit(0, 0), col * 2, row * 2);
    col++;
    if (col >= 10) {
      col = 0;
      row++;
    }

    this.addObject(new GravityStabilizer(0, 0), col * 2, row * 2);
    col++;
    if (col >= 10) {
      col = 0;
      row++;
    }

    this.addObject(new Nanofabricator(0, 0), col * 2, row * 2);
    col++;
    if (col >= 10) {
      col = 0;
      row++;
    }

    this.addObject(new DronePod(0, 0), col * 2, row * 2);
    col++;
    if (col >= 10) {
      col = 0;
      row++;
    }

    this.addObject(new HologramProjector(0, 0), col * 2, row * 2);
    col++;
    if (col >= 10) {
      col = 0;
      row++;
    }

    this.addObject(new MaintenanceCrawler(0, 0), col * 2, row * 2);
    col++;
    if (col >= 10) {
      col = 0;
      row++;
    }

    this.addObject(new AccessPanel(0, 0), col * 2, row * 2);
    col++;
    if (col >= 10) {
      col = 0;
      row++;
    }

    this.addObject(new BioScanner(0, 0), col * 2, row * 2);
    col++;
    if (col >= 10) {
      col = 0;
      row++;
    }

    this.addObject(new NutrientDispenser(0, 0), col * 2, row * 2);
    col++;
    if (col >= 10) {
      col = 0;
      row++;
    }

    this.addObject(new WasteReprocessor(0, 0), col * 2, row * 2);
    col++;
    if (col >= 10) {
      col = 0;
      row++;
    }

    this.addObject(new PersonalLocker(0, 0), col * 2, row * 2);
    col++;
    if (col >= 10) {
      col = 0;
      row++;
    }

    this.addObject(new HygienePod(0, 0), col * 2, row * 2);
    col++;
    if (col >= 10) {
      col = 0;
      row++;
    }

    this.addObject(new QuarantineChamber(0, 0), col * 2, row * 2);
    col++;
    if (col >= 10) {
      col = 0;
      row++;
    }

    this.addObject(new CommsRelayStation(0, 0), col * 2, row * 2);
    col++;
    if (col >= 10) {
      col = 0;
      row++;
    }

    this.addObject(new SecurityTerminal(0, 0), col * 2, row * 2);
    col++;
    if (col >= 10) {
      col = 0;
      row++;
    }

    this.addObject(new ObservationDeck(0, 0), col * 2, row * 2);
    col++;
    if (col >= 10) {
      col = 0;
      row++;
    }

    this.addObject(new LogRecorder(0, 0), col * 2, row * 2);
    col++;
    if (col >= 10) {
      col = 0;
      row++;
    }

    this.addObject(new BlackBoxCore(0, 0), col * 2, row * 2);
    col++;
    if (col >= 10) {
      col = 0;
      row++;
    }

    this.addObject(new CombatDroidCradle(0, 0), col * 2, row * 2);
    col++;
    if (col >= 10) {
      col = 0;
      row++;
    }

    this.addObject(new AutoDocUnit(0, 0), col * 2, row * 2);
    col++;
    if (col >= 10) {
      col = 0;
      row++;
    }

    this.addObject(new AssemblyArm(0, 0), col * 2, row * 2);
    col++;
    if (col >= 10) {
      col = 0;
      row++;
    }

    this.addObject(new AITetherNode(0, 0), col * 2, row * 2);
    col++;
    if (col >= 10) {
      col = 0;
      row++;
    }

    this.addObject(new VacuumBot(0, 0), col * 2, row * 2);
    col++;
    if (col >= 10) {
      col = 0;
      row++;
    }

    this.addObject(new XenobotanyChamber(0, 0), col * 2, row * 2);
    col++;
    if (col >= 10) {
      col = 0;
      row++;
    }

    this.addObject(new GrowthVat(0, 0), col * 2, row * 2);
    col++;
    if (col >= 10) {
      col = 0;
      row++;
    }

    this.addObject(new PsychoNeuralChair(0, 0), col * 2, row * 2);
    col++;
    if (col >= 10) {
      col = 0;
      row++;
    }

    this.addObject(new StasisPod(0, 0), col * 2, row * 2);
    col++;
    if (col >= 10) {
      col = 0;
      row++;
    }

    this.addObject(new FleshweaverConsole(0, 0), col * 2, row * 2);
    col++;
    if (col >= 10) {
      col = 0;
      row++;
    }

    this.addObject(new AlienArtefactContainer(0, 0), col * 2, row * 2);
  }
}

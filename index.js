// infectious disease sim
// by casey penk, 2021
// stay safe, wear a mask, get vaccinated

let canvasHeight = 800;
let canvasWidth = 1200;
let topBarHeight = 200;
let nParticles = 500;

let inputVaccinationRate, inputLethality, inputSeverity, inputVirality, inputDensity, inputVaccineDelay, inputInfectiousPeriod, inputVaccineEfficacy, inputMovementRate, inputQuarantineRate;

let worldTimer = 0;
let nInfected = 1;
let nRecovered = 0;
let nVaccinated = 0;
let nDead = 0;
let nHospitalized = 0;
let avgOthersInfected;

let totalInfected = 1;
let totalRecovered = 0;
let totalVaccinated = 0;
let totalHospitalized = 0;
let totalDead = 0;
let totalQuarantined = 0;

let nInfections = 0;
let nInfectors = 0;

let pQuarantining = 0.8;
let pSocialDistancing = 0.5;
let pMasking = 0.5;
let movementRate = 10;

let virality; // range of 0 to 1.0
let severity; // range of 0 to 1.0
let lethality; // range of 0 to 1.0
let infectiousPeriod = 600;

let vaccineDelay;
let vaccinationRate;

let particles = [];

let isPaused = true;
let inSetup = true;

class Particle {
  constructor(positionX, positionY, color, infected) {
    this.positionX = positionX
    this.positionY = positionY
    this.color = color
    this.infected = infected;
    this.hospitalized = false;
    this.width = 20;
    this.height = 20;
    this.vaccinated = false;
    this.recovered = false;
    this.dead = false;
    this.infectedDate = null
    this.nOthersInfected = 0;
    this.immunity = 0;
    this.quarantined = false;
  }
}

function setup() {
  inSetup = true;
  createCanvas(canvasWidth, canvasHeight);
  background("white")
  for (let i = 0; i < nParticles; i++) { // generate new simulated people to place in the sim
    particles[i] = new Particle(random(canvasWidth), topBarHeight + random(canvasHeight - topBarHeight), "white", false)
  }
  
  particles[0].infected = true; // patient zero
  if(pQuarantining > random()) particles[0].quarantined = true;
  
  setUpInputs();
  
  fill("black")
  rect(50, 450, 480, 70)
  textSize(20)
  fill("white")
  text("set the variables above, then click here to begin", 80, 490)
}

function draw() {
  if (!isPaused) {
    background("white"); 
    collectInputs();
    noStroke();

    for (let i = 0; i < nParticles; i++) {
      if (typeof(particles[i]) != 'undefined') { // check for undefined objects, which would throw errors
        // main actions that occur to each person
        infectPerson(i);
        recoverPerson(i);
        vaccinatePerson(i)
        chooseStatus(i);
        movePerson(i);
        drawPerson(i);
      }
    }

    worldTimer++;
    
  } else {
    if(inSetup && mouseIsPressed && mouseX >= 50 && mouseX <= 500 && mouseY >= 450 && mouseY <= 500) {
      isPaused = false;
      inSetup = false
      removeInputs();
    }
  }
  
  eradicateDisease();
  
  displayButtons();
  displayStatistics();
}

// create input fields on the screen so various fields can be customized
function setUpInputs() {
  fill("black")
  textSize(30)
  text("infectious disease sim", 50, 100)
  
  textSize(20)
  text("disease characteristics:", 50, 150)
  textSize(15)
  text("virality", 50, 180)
  text("severity", 150, 180)
  text("lethality", 250, 180)
  text("infectious period", 350, 180)
  
  textSize(20)
  text("vaccine characteristics:", 50, 250)
  textSize(15)
  text("time to develop vaccine", 50, 280)
  text("vaccine efficacy", 250, 280)
  
  textSize(20)
  text("population characteristics:", 50, 350)
  textSize(15)
  text("population size", 50, 380)
  text("vaccination speed", 200, 380)
  text("movement speed", 350, 380)
  text("quarantine rate", 500, 380)
  
  inputVirality = createInput()
  inputVirality.position(50, 190)
  inputVirality.value(5)
  inputVirality.size(50)
  text("%", 115, 205)
  
  inputSeverity = createInput()
  inputSeverity.position(150, 190)
  inputSeverity.value(10)
  inputSeverity.size(50)
  text("%", 215, 205)
  
  inputLethality = createInput()
  inputLethality.position(250, 190)
  inputLethality.value(10)
  inputLethality.size(50)
  text("%", 315, 205)
  
  inputInfectiousPeriod = createInput()
  inputInfectiousPeriod.position(350, 190)
  inputInfectiousPeriod.value(14)
  inputInfectiousPeriod.size(50)
  text("days", 415, 205)
  
  inputVaccineDelay = createInput()
  inputVaccineDelay.position(50, 290)
  inputVaccineDelay.value(30)
  inputVaccineDelay.size(50);
  text("days", 115, 305)
  
  inputVaccineEfficacy = createInput()
  inputVaccineEfficacy.position(250, 290)
  inputVaccineEfficacy.value(80)
  inputVaccineEfficacy.size(50);
  text("%", 315, 305)
  
  inputDensity = createInput()
  inputDensity.position(50, 390)
  inputDensity.value(500)
  inputDensity.size(50);
  
  inputVaccinationRate = createInput()
  inputVaccinationRate.position(200, 390)
  inputVaccinationRate.value(0.0002)
  inputVaccinationRate.size(50);
  
  inputMovementRate = createInput()
  inputMovementRate.position(350, 390)
  inputMovementRate.value(10)
  inputMovementRate.size(50);
  text("pixels", 415, 410)
  
  inputQuarantineRate = createInput()
  inputQuarantineRate.position(500, 390)
  inputQuarantineRate.value(50)
  inputQuarantineRate.size(50);
  text("%", 565, 405)
}

function collectInputs() {
  virality = inputVirality.value() / 100;
  severity = inputSeverity.value() / 100;
  lethality = inputLethality.value() / 100;
  vaccinationRate = inputVaccinationRate.value();
  nParticles = inputDensity.value();
  vaccineDelay = inputVaccineDelay.value() * 30;
  infectiousPeriod = inputInfectiousPeriod.value() * 30;
  vaccineEfficacy = inputVaccineEfficacy.value() / 100;
  movementRate = inputMovementRate.value();
  pQuarantining = inputQuarantineRate.value() / 100;
}

function removeInputs() {
  inputVirality.remove();
  inputSeverity.remove();
  inputLethality.remove();
  inputVaccinationRate.remove();
  inputDensity.remove();
  inputVaccineDelay.remove();
  inputInfectiousPeriod.remove();
  inputVaccineEfficacy.remove();
  inputMovementRate.remove();
  inputQuarantineRate.remove();
}

function drawPerson(i) {
  fill(particles[i].color);
  rect(particles[i].positionX, particles[i].positionY, 20);
}

function chooseStatus(i) {
  if(particles[i].dead) {
      particles[i].color = "red"
    } else if(particles[i].hospitalized) {
      particles[i].color = "orange"
    } else if(particles[i].infected) {
      particles[i].color = "yellow"
    } else if(particles[i].recovered) {
      particles[i].color = "blue"
      particles[i].immunity -= 0.00001 // waning immunity over time after infection
    } else if(particles[i].vaccinated) {
      particles[i].color = "green"
      particles[i].immunity -= 0.00001 // waning immunity over time after vaccination
    }  else {
      particles[i].color = 220
    }
}

// random movement of people through space
function movePerson(i) {
  let randomDirection = floor(random(4));
    if ((!particles[i].dead && !particles[i].quarantined && !particles[i].hospitalized) || (particles[i].infected && worldTimer < particles[i].infectedDate + 30)) { // movement
      if (randomDirection==0) {
        particles[i].positionX += floor(movementRate); // right
      } else if (randomDirection==1) {
        particles[i].positionX -= floor(movementRate); // left
      } else if (randomDirection==2) {
        particles[i].positionY += floor(movementRate); // down
      } else {
        particles[i].positionY -= floor(movementRate); // up
      }
    }
}

// chance of getting infected when in contact with another person
function infectPerson(i) {
  for (let j=0; j < nParticles; j++) { // movement of particles
      if (j != i
          && typeof(particles[j]) != 'undefined'
          && !particles[i].infected // no double infections
          && !particles[i].dead // dead particles do not get sick
          && virality > random() // chance of infection per frame
          && particles[i].positionX > particles[j].positionX - particles[j].width // touching left side
          && particles[i].positionX < particles[j].positionX + particles[j].width // touching right side
          && particles[i].positionY > particles[j].positionY - particles[j].height // touching top side
          && particles[i].positionY < particles[j].positionY + particles[j].height // touching bottom side
          && particles[j].infected
          && particles[i].immunity < random()) { // spread disease through contact
        particles[i].infected = true;
        particles[i].infectedDate = worldTimer;
        nInfected++;
        totalInfected++;
        
        particles[j].nOthersInfected++;
        nInfections++;
        if(particles[j].nOthersInfected == 1) nInfectors++;
        
        if(particles[i].recovered) {
          particles[i].recovered = false;
          nRecovered--;
        }
        hospitalizePerson(i)
        quarantinePerson(i)
      }
  }
}

// chance of person going to hospital with severe illness
function hospitalizePerson(i) {
  if(!particles[i].hospitalized && random() < severity) { // hospitalization
    particles[i].hospitalized = true;
    nHospitalized++;
    totalHospitalized++;
    lethal(i)
  }
}

function quarantinePerson(i) {
  if(!particles[i].hospitalized && pQuarantining > random()) {
    particles[i].quarantined = true;
    totalQuarantined++;
  }
}

function lethal(i) {
  if(random() < lethality) { // death
    if(particles[i].hospitalized) nHospitalized--;
    particles[i].infected = false;
    particles[i].hospitalized = false;
    particles[i].dead = true;
    nDead++;
    nInfected--;
    totalDead++;
  }
}

// chance of recovering from infection after a period of time
function recoverPerson(i) {
  if(particles[i].infected && !particles[i].recovered && worldTimer - particles[i].infectedDate > infectiousPeriod/2 + random(infectiousPeriod/2)) { // recover from disease after a certain number of frames
      if(particles[i].infected) {
        particles[i].infected = false;
        nInfected--;
      }
    
      particles[i].recovered = true;
      nRecovered++;
      totalRecovered++;
    
      particles[i].immunity = 1;
    
    particles[i].quarantined = false;
    
      if(particles[i].hospitalized) {
        particles[i].hospitalized = false;
        nHospitalized--;
      }
    }
}

// chance of getting vaccinated once vaccine has been developed
function vaccinatePerson(i) {
  if(!particles[i].infected && !particles[i].vaccinated && random() < vaccinationRate && worldTimer > vaccineDelay) { // some random number of particles get vaccinated per frame
      particles[i].vaccinated = true;
      nVaccinated++;
      if (random() < vaccineEfficacy) {
        particles[i].immunity = 1;
      } else {
        particles[i].immunity = 0;
      }
    }
}

function eradicateDisease() {
  if(nInfected == 0) {
    strokeWeight(20)
    fill("black")
    rect(200, 200, 360, 60)
    textSize(20)
    fill("white")
    text("the disease has been eradicated!", 230, 235)
  }
}

function displayStatistics() {
  if (!isPaused) {
    fill("rgba(0, 0, 0, 1)");
    rect(0,0,canvasWidth, 120);

    textSize(15)
    fill("white")
    text("day " + ceil(worldTimer / 30), 20, 30)
    
    fill("yellow")
    text("infected = " + nInfected, 20, 60)
    text("total = " + totalInfected, 20, 90)

    fill("orange")
    text("hospitalized = " + nHospitalized, 130, 60)
    text("total = " + totalHospitalized, 130, 90)

    fill("red")
    text("dead = " + nDead, 270, 60)
    text("total = " + totalDead, 270, 90)

    fill("blue")
    text("recovered = " + nRecovered, 350, 60)
    text("total = " + totalRecovered, 350, 90)

    fill("green")
    text("vaccinated = " + nVaccinated, 460, 60)
    text("total = " + totalVaccinated, 460, 90)

    let infectionRate = 0;
    if (nInfectors > 0) infectionRate = nInfections / nInfectors;
    fill("white")
    text("average R0 = " + floor(infectionRate * 100)/100, 350, 30)
    if(worldTimer < vaccineDelay) {
      text("vaccine is " + floor( worldTimer / vaccineDelay * 100) + "% complete", 130, 30) 
    } else {
        text("vaccination rate = " + floor(nVaccinated / (nParticles-nDead) * 100) + "%", 130, 30)
    }
    fill("black");
  }
}

function displayButtons() {
  if (!inSetup) {
    fill("black")
    rect(300, 500, 90, 50)
    textSize(20)
    fill("white")
    text("pause", 318, 530)
    
    fill("black")
    rect(420, 500, 90, 50)
    textSize(20)
    fill("white")
    text("reset", 443, 530)
  }
}

function resetButton() {
    worldTimer = 0;
    nInfected = 1;
    nRecovered = 0;
    nVaccinated = 0;
    nDead = 0;
    nHospitalized = 0;
    avgOthersInfected = 0;
    particles = [];
    isPaused = true;
    inSetup = true;
    setup();
}

function pauseButton() {
  if(!isPaused) isPaused = true;
 else isPaused = false;
}

function keyPressed() {
  if (keyCode === LEFT_ARROW) {
    pauseButton();
  }
  
  if (keyCode === RIGHT_ARROW) {
    resetButton();
  }
}

function mousePressed() {
    if(mouseX >= 300 && mouseX <= 390 && mouseY >=500 && mouseY <= 550 && !inSetup) {
    pauseButton();
  }
  
    if(mouseX >= 420 && mouseX <= 510 && mouseY >=500 && mouseY <= 550 && !inSetup) {
    resetButton();
  }
}

const canvas = document.getElementById("petCanvas");
  const ctx = canvas.getContext("2d");

  const backgroundImages = {
    default: 'assets/eatbg.png',
    eat: 'assets/eatbg.png',
    walk: 'assets/walkbg.png',
    sleep: 'assets/sleepbg.png'
  };

  const animations = {
    idle: [], slide: [], walk: [], dead: []
  };

  let currentAnimation = 'idle';
  let currentFrame = 0;
  let frameDelay = 150;
  let lastFrameTime = 0;
  let positionX = 250;
  let scale = 0.52;
  let isSleeping = false;
  let isBusy = false;
  let isWalking = false;
  let showFish = false;
  let fishAngle = 0;

  let hunger = 80;
  let happiness = 90;
  let energy = 70;

  const hungerBar = document.getElementById("hungerBar");
  const happinessBar = document.getElementById("happinessBar");
  const energyBar = document.getElementById("energyBar");

  const eatingSound = document.getElementById('eatingSound');
  const walkSound = document.getElementById('walkSound');
  const noSound = document.getElementById('noSound');

  const fishImage = new Image();
  fishImage.src = 'assets/fish.png';

  function preloadFrames(prefix, count, arr) {
    for (let i = 1; i <= count; i++) {
      const img = new Image();
      img.src = `assets/${prefix} (${i}).png`;
      arr.push(img);
    }
  }

  preloadFrames('Idle', 10, animations.idle);
  preloadFrames('Slide', 10, animations.slide);
  preloadFrames('Walk', 10, animations.walk);
  preloadFrames('Dead', 10, animations.dead);

  function updateBars() {
    updateBar(hungerBar, hunger);
    updateBar(happinessBar, happiness);
    updateBar(energyBar, energy);
  }

  function updateBar(bar, value) {
    bar.style.width = `${value}%`;
    if (value < 30) bar.style.backgroundColor = '#e74c3c';
    else if (value < 70) bar.style.backgroundColor = '#3498db';
    else bar.style.backgroundColor = '#2ecc71';
  }

  function showMessage(text) {
    const bubble = document.getElementById('speechBubble');
    bubble.textContent = text;
    bubble.style.display = 'block';
    setTimeout(() => {
      bubble.style.display = 'none';
    }, 3000);
  }

  function setCanvasBackground(action) {
    canvas.style.backgroundImage = `url('${backgroundImages[action] || backgroundImages.default}')`;
  }

  function setAnimation(name, duration = 3000) {
    currentAnimation = name;
    currentFrame = 0;
    if (name !== 'idle' && name !== 'dead') {
      setTimeout(() => {
        if (!isSleeping) {
          currentAnimation = 'idle';
          showFish = false;
          isWalking = false;
        }
      }, duration);
    }
  }

  function wakeUpIfSleeping() {
    if (isSleeping) {
      isSleeping = false;
      currentAnimation = 'idle';
      setCanvasBackground('default');
    }
  }

  function feedPet() {
    if (isBusy) return;
    wakeUpIfSleeping();
    if (hunger >= 100) {
      noSound.play();
      showMessage("I'm Full");
      return;
    }
    isBusy = true;
    setCanvasBackground('eat');
    showFish = true;
    currentAnimation = 'idle';
    eatingSound.currentTime = 0;
    eatingSound.play();
    showMessage("Yum!");

    hunger = Math.min(hunger + 15, 100);
    happiness = Math.min(happiness + 5, 100);
    updateBars();

    setTimeout(() => {
      showFish = false;
      eatingSound.pause();
      setAnimation('slide');
      setTimeout(() => {
        isBusy = false;
      }, 2000);
    }, 3000);
  }

  function exercisePet() {
    if (isBusy) return;
    wakeUpIfSleeping();
    if (energy >= 100 && happiness >= 100) {
      noSound.play();
      showMessage("I'm done exercising!");
      return;
    }
    isBusy = true;
    isWalking = true;
    positionX = 0;
    setCanvasBackground('walk');
    walkSound.currentTime = 0;
    walkSound.play();
    showMessage("Let's go!");
    setAnimation('walk');

    energy = Math.max(energy - 10, 0);
    happiness = Math.min(happiness + 10, 100);
    updateBars();

    setTimeout(() => {
      walkSound.pause();
      isBusy = false;
    }, 3000);
  }

  function sleepPet() {
    if (isBusy) return;
    if (energy >= 100) {
      noSound.play();
      showMessage("I'm Rested!");
      return;
    }
    isSleeping = true;
    currentAnimation = 'none';
    setCanvasBackground('sleep');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    showMessage("Zzz...");
    energy = Math.min(energy + 20, 100);
    updateBars();
  }

  function isDead() {
    return hunger <= 10 || happiness <= 10 || energy <= 10;
  }

  function drawFrame(timestamp) {
    if (timestamp - lastFrameTime < frameDelay) {
      requestAnimationFrame(drawFrame);
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isSleeping || currentAnimation === 'none') {
      requestAnimationFrame(drawFrame);
      return;
    }

    if (isDead()) {
      currentAnimation = 'dead';
    }

    const frames = animations[currentAnimation];
    if (!frames || !frames.length) return;

    const img = frames[currentFrame];
    const w = img.width * scale;
    const h = img.height * scale;

    if (isWalking) {
      positionX += 6;
      if (positionX > canvas.width - w) positionX = 0;
    } else {
      positionX = (canvas.width - w) / 2;
    }

    const x = positionX;
    const y = (canvas.height - h) / 2 + 20; // Move cat 20px lower
    ctx.drawImage(img, x, y, w, h);

    if (showFish) {
      const fishSize = 60;
      ctx.save();
      ctx.translate(x + 150, y + 150);
      ctx.rotate(Math.sin(fishAngle) * 0.2);
      ctx.drawImage(fishImage, -fishSize / 2, -fishSize / 2, fishSize, fishSize);
      ctx.restore();
      fishAngle += 0.2;
    }

    currentFrame = (currentFrame + 1) % frames.length;
    lastFrameTime = timestamp;
    requestAnimationFrame(drawFrame);
  }

  setCanvasBackground('default');
  updateBars();
  requestAnimationFrame(drawFrame);